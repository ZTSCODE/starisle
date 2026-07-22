// 渲染引擎：HD-2D 像素化管线
// 低分辨率渲染（480×270 级）→ AO → Bloom → 移轴景深 → 最近邻放大呈现 + vignette/grain
// 像素颗粒来自渲染分辨率而非几何体，光照/bloom 一并像素化（八方旅人式统一质感）
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { N8AOPass } from 'n8ao';

// 移轴景深（tilt-shift）：焦带上下渐糊，微缩模型感；对话/过场可加强
const TiltShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    uFocus: { value: 0.55 },   // 焦带中心（屏幕 y）
    uMaxBlur: { value: 2.2 },  // 低分辨率下的最大模糊半径(px)
    uAmount: { value: 1.0 },   // 总强度（0=关）
    uRes: { value: new THREE.Vector2(480, 270) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uFocus,uMaxBlur,uAmount; uniform vec2 uRes;
    varying vec2 vUv;
    void main(){
      float d = abs(vUv.y - uFocus);
      float b = smoothstep(0.10, 0.45, d) * uMaxBlur * uAmount;
      vec3 acc = vec3(0.0); float ws = 0.0;
      for (int i=-4;i<=4;i++){
        float fi = float(i);
        float w = 1.0 - abs(fi)/5.0;
        acc += texture2D(tDiffuse, vUv + vec2(fi*b/uRes.x, 0.0)).rgb * w; ws += w;
        acc += texture2D(tDiffuse, vUv + vec2(0.0, fi*b/uRes.y)).rgb * w; ws += w;
      }
      vec3 sharp = texture2D(tDiffuse, vUv).rgb;
      vec3 blur = acc / ws;
      float m = clamp(b / max(uMaxBlur, 0.001), 0.0, 1.0);
      gl_FragColor = vec4(mix(sharp, blur, m * 0.9), 1.0);
    }`,
};

// 呈现 pass：最近邻放大 + vignette + grain + 饱和微调
const PresentShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.34 },
    uGrain: { value: 0.03 },
    uTime: { value: 0 },
    uSat: { value: 1.1 },
    uLowRes: { value: new THREE.Vector2(480, 270) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uVignette,uGrain,uTime,uSat; uniform vec2 uLowRes;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float g = dot(c.rgb, vec3(0.299,0.587,0.114));
      c.rgb = mix(vec3(g), c.rgb, uSat);
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - uVignette * smoothstep(0.42, 0.85, d);
      c.rgb += (hash(floor(vUv*uLowRes) + fract(uTime)) - 0.5) * uGrain;  // grain 对齐像素格
      gl_FragColor = c;
    }`,
};

// 色调分级 pass（电影感 lift/gamma/gain，按时段由 lighting.js 驱动）
// 黄昏金橙、夜晚静谧蓝（阴影提蓝抬亮而非死黑）都靠它落地
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uLift: { value: new THREE.Vector3(0, 0, 0) },      // 阴影染色/抬升
    uGain: { value: new THREE.Vector3(1, 1, 1) },      // 高光染色
    uGamma: { value: 1.0 },                            // <1 提亮中间调
    uSat: { value: 1.0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec3 uLift,uGain; uniform float uGamma,uSat;
    varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c = clamp(c * uGain + uLift * (1.0 - c), 0.0, 1.6); // lift 主要作用于暗部
      c = pow(c, vec3(1.0 / uGamma));
      float g = dot(c, vec3(0.299,0.587,0.114));
      gl_FragColor = vec4(mix(vec3(g), c, uSat), 1.0);
    }`,
};

export class Engine {
  constructor(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.info.autoReset = false;
    container.appendChild(this.renderer.domElement);
    // 画布 CSS 拉伸充满，像素化由内部低分辨率渲染产生
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 500);

    const gl = this.renderer.getContext();
    this.isSoftwareGL = /swiftshader|software/i.test(gl.getParameter(gl.RENDERER) || '');
    this.quality = this.isSoftwareGL ? 'low' : 'high';
    this.pixelScale = this.isSoftwareGL ? 3 : 4; // 低分辨率渲染因子（越大像素越粗）

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    if (!this.isSoftwareGL) {
      this.ao = new N8AOPass(this.scene, this.camera, innerWidth, innerHeight);
      this.ao.configuration.aoRadius = 0.7;
      this.ao.configuration.intensity = 3.0;
      this.ao.configuration.falloff = 1.0;
      this.composer.addPass(this.ao);
    }
    // 调试开关（URL 参数）：?noao=1 / ?nobloom=1 / ?nodof=1 逐个关后期定位渲染问题
    const dbg = new URLSearchParams(location.search);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(480, 270), 0.45, 0.65, 0.85);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.dof = new ShaderPass(TiltShiftShader);
    this.composer.addPass(this.dof);
    this.present = new ShaderPass(PresentShader);
    this.composer.addPass(this.present);
    if (dbg.has('noao') && this.ao) this.ao.enabled = false;
    if (dbg.has('nobloom')) this.bloom.enabled = false;
    if (dbg.has('nodof')) this.dof.enabled = false;
    if (dbg.has('nograde')) this.grade.enabled = false;
    if (dbg.has('nopresent')) this.present.enabled = false;

    // 中间缓冲全部最近邻采样：像素颗粒在 pass 链中保持一致
    for (const rt of [this.composer.renderTarget1, this.composer.renderTarget2]) {
      rt.texture.magFilter = THREE.NearestFilter;
      rt.texture.minFilter = THREE.NearestFilter;
    }

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;inset:0;background:#000c;color:#ffd98a;display:flex;align-items:center;justify-content:center;z-index:99999;font-size:20px;cursor:pointer';
      d.textContent = '渲染中断，点击恢复'; d.onclick = () => location.reload();
      document.body.appendChild(d);
    });
  }
  lowSize() {
    const s = this.pixelScale;
    return [Math.max(160, Math.floor(innerWidth / s)), Math.max(90, Math.floor(innerHeight / s))];
  }
  setQuality(q) {
    this.quality = q;
    if (this.ao) this.ao.enabled = q !== 'low';
    this.dof.enabled = q !== 'low';
    this.pixelScale = q === 'low' ? 3 : 4;
    this.shadowSize = q === 'high' ? 2048 : 1024;
    this.resize();
  }
  setDofAmount(v) { this.dof.uniforms.uAmount.value = v; }
  resize() {
    const [lw, lh] = this.lowSize();
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(lw, lh);
    this.dof.uniforms.uRes.value.set(lw, lh);
    this.present.uniforms.uLowRes.value.set(lw, lh);
  }
  render(dt) {
    this.renderer.info.reset();
    this.present.uniforms.uTime.value = (this.present.uniforms.uTime.value + dt) % 10;
    this.composer.render(dt);
  }
}
