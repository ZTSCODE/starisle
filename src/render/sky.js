// 程序化天空：渐变穹顶 + 太阳/月亮盘 + 全天星野 + 银河带(旋臂+银心) + 星云 + 层次云层 + 流星
import * as THREE from 'three';
import { rng } from '../core/rng.js';

const SkyShader = {
  uniforms: {
    uTop: { value: new THREE.Color('#3A6EA8') },
    uHorizon: { value: new THREE.Color('#CFE4F0') },
  },
  vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform vec3 uTop, uHorizon; varying vec3 vPos;
    void main(){
      float h = normalize(vPos).y;
      float t = smoothstep(-0.05, 0.45, h);
      gl_FragColor = vec4(mix(uHorizon, uTop, t), 1.0);
    }`,
};

// 软光斑纹理（星云/银河核心用）
function blobTexture(size, inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner); grad.addColorStop(0.45, outer); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.LinearFilter;
  return t;
}
// 像素云纹理：方块团簇 + 底部阴影（贴合像素风）
function cloudTexture(seed) {
  const r = rng(seed);
  const c = document.createElement('canvas'); c.width = 64; c.height = 32;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 64, 32);
  const blobs = 7 + Math.floor(r() * 5);
  for (let i = 0; i < blobs; i++) {
    const w = 8 + Math.floor(r() * 14), h = 5 + Math.floor(r() * 7);
    const x = 4 + Math.floor(r() * (56 - w)), y = 16 - Math.floor(h * 0.7) + Math.floor(r() * 6);
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(210,220,235,0.75)'; // 底部阴面
    g.fillRect(x, y + h - 2, w, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  return t;
}

// 浓积云塔纹理：菜花状团簇（上明下暗，底部平齐）
function puffTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 2, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,0.98)');
  grad.addColorStop(0.55, 'rgba(245,248,252,0.85)');
  grad.addColorStop(1, 'rgba(240,244,250,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  return t;
}
// 融球云塔点精灵：逐点大小/明暗，整塔一次绘制
// mode 'tower'：孤高塔状（连续填满）；mode 'bank'：横向长条云带（低缓连绵）
function makeTowerPoints(seed, puffTex, mode = 'tower') {
  const r = rng(seed);
  const pos = [], psize = [], shadeArr = [];
  const puff = (x, y, z, s, sh) => { pos.push(x, y, z); psize.push(s); shadeArr.push(Math.max(0.3, Math.min(1.2, sh))); };
  if (mode === 'bank') {
    // 横向长条：宽扁椭圆主体 + 沿长度三处浅丘，低高度
    for (let i = 0; i < 220; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = Math.cos(a) * d * 165, z = Math.sin(a) * d * 46;
      const y = -22 + r() * 42 * (1 - d * 0.35);
      puff(x, y, z, 14 + r() * 15, 0.45 + (y + 22) * 0.007 + (r() - 0.5) * 0.08);
    }
    for (const [hx, hr] of [[-80, 42], [10, 48], [95, 38]]) {
      for (let i = 0; i < 40; i++) {
        const th = r() * Math.PI * 2, ph = Math.acos(r() * 2 - 1), d = Math.cbrt(r());
        const x = hx + Math.sin(ph) * Math.cos(th) * d * hr;
        const y = 22 + Math.cos(ph) * d * hr * 0.55;
        const z = (r() - 0.5) * hr * 0.8;
        puff(x, y, z, 12 + r() * 13, 0.6 + y / 90 + (r() - 0.5) * 0.1);
      }
    }
  } else {
    // 高塔（较上版再降 1/3）：基底 + 连续填充柱 + 菜花鼓包
    for (let i = 0; i < 190; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = Math.cos(a) * d * 60, z = Math.sin(a) * d * 40;
      const y = -22 + r() * 42 * (1 - d * 0.45);
      puff(x, y, z, 11 + r() * 12, 0.42 + (y + 22) * 0.007 + (r() - 0.5) * 0.08);
    }
    for (let i = 0; i < 240; i++) {
      const y = r() * r() * 110;
      const radius = 21 * (1 - y / 135) + 6;
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = Math.cos(a) * d * radius + (r() - 0.5) * 5;
      const z = Math.sin(a) * d * radius * 0.8 + (r() - 0.5) * 5;
      puff(x, y, z, 10 + r() * 11, 0.5 + y / 110 + (r() - 0.5) * 0.1);
    }
    const lobes = [
      [10, 32, -4, 30, 46], [-13, 52, 6, 26, 40], [9, 72, -3, 21, 34], [-6, 90, 4, 16, 28], [2, 106, 0, 11, 20],
    ];
    for (const [lx, ly, lz, lr, n] of lobes) {
      for (let i = 0; i < n; i++) {
        const th = r() * Math.PI * 2, ph = Math.acos(r() * 2 - 1), d = Math.cbrt(r());
        const x = lx + Math.sin(ph) * Math.cos(th) * d * lr;
        const y = ly + Math.cos(ph) * d * lr * 0.75;
        const z = lz + Math.sin(ph) * Math.sin(th) * d * lr * 0.85;
        puff(x, y, z, 9 + r() * 10, 0.55 + y / 115 + (r() - 0.5) * 0.1);
      }
    }
  }
  // 实例化面片（而非 THREE.Points）：部分手机 GPU 点精灵会在球心渲染出杂色像素
  const n = psize.length;
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(base.getIndex());
  geo.setAttribute('position', base.getAttribute('position'));
  geo.setAttribute('uv', base.getAttribute('uv'));
  geo.instanceCount = n;
  geo.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('psize', new THREE.InstancedBufferAttribute(new Float32Array(psize), 1));
  geo.setAttribute('shade', new THREE.InstancedBufferAttribute(new Float32Array(shadeArr), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTint: { value: new THREE.Color('#FFFFFF') }, uOpacity: { value: 0.9 }, map: { value: puffTex },
      uScale: { value: 784 }, // 渲染缓冲高 / (2*tan(fov/2))，resize 时同步；换算与旧点精灵一致的像素尺寸
    },
    vertexShader: `
      attribute vec3 offset; attribute float psize; attribute float shade;
      uniform float uScale;
      varying float vShade; varying vec2 vUv;
      void main(){
        vShade = shade; vUv = uv;
        vec4 mv = modelViewMatrix * vec4(offset, 1.0);
        float world = psize * (330.0 / uScale); // 与旧 gl_PointSize 公式等效的世界尺寸
        mv.xy += position.xy * world;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec3 uTint; uniform float uOpacity;
      varying float vShade; varying vec2 vUv;
      void main(){
        vec4 tex = texture2D(map, vUv);
        if (tex.a < 0.3) discard;
        // 底部阴影偏浅蓝（而非灰）：shade 越低越偏向蓝影色
        vec3 shadowBlue = vec3(0.53, 0.63, 0.78);
        vec3 lit = mix(shadowBlue, vec3(1.0), smoothstep(0.35, 1.0, vShade));
        vec3 c = uTint * lit * tex.rgb;
        // 高光软膝：黄昏曝光峰值时顶部不过曝
        c = c / (1.0 + max(max(c.r, max(c.g, c.b)) - 0.82, 0.0) * 0.55);
        gl_FragColor = vec4(c, tex.a * uOpacity);
      }`,
    transparent: true, depthWrite: false, fog: false,
  });
  const pts = new THREE.Mesh(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

export class Sky {
  constructor(engine) {
    this.engine = engine;
    const geo = new THREE.SphereGeometry(320, 24, 16);
    this.dome = new THREE.Mesh(geo, new THREE.ShaderMaterial({ ...SkyShader, uniforms: THREE.UniformsUtils.clone(SkyShader.uniforms), side: THREE.BackSide, depthWrite: false, fog: false }));
    this.dome.renderOrder = -10;
    engine.scene.add(this.dome);

    // 太阳/月亮盘（HDR 自发光触发 bloom）
    this.sunDisc = this.makeDisc('#FFF3C8', 18, 2.6);
    this.moonDisc = this.makeDisc('#DCE8FF', 12, 1.3);
    engine.scene.add(this.sunDisc, this.moonDisc);

    // ============ 全天星野（整个天球均匀分布，含地平线附近） ============
    const r = rng(20260717);
    const R = 300;
    const mkStars = (count, size) => {
      const pos = [], col = [];
      for (let i = 0; i < count; i++) {
        // 全球面均匀：cos(θ) ∈ [-1,1]；剔除地平线以下的
        let x, y, z;
        do {
          const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
          x = s * Math.cos(a) * R; y = u * R; z = s * Math.sin(a) * R;
        } while (y < -R * 0.04);
        pos.push(x, y, z);
        const w = 0.6 + r() * 0.4, blue = r() * 0.35, warm = r() < 0.12 ? 0.15 : 0;
        col.push(w - blue * 0.2 + warm, w - blue * 0.1, w - warm * 0.3);
      }
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g2.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const pts = new THREE.Points(g2, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false, depthWrite: false }));
      pts.renderOrder = -9;
      return pts;
    };
    this.starsA = mkStars(2600, 1.2);
    this.starsB = mkStars(1900, 0.8);

    // ============ 银河带：倾斜大圆 + 旋臂双道 + 银心核球 + 暗尘缝 ============
    // 带平面：法线朝东南高空倾斜，横跨整个天球
    const n = new THREE.Vector3(0.42, 0.78, 0.46).normalize();
    const u0 = new THREE.Vector3(1, 0, -0.9).normalize();
    const v0 = new THREE.Vector3().crossVectors(n, u0).normalize();
    const u1 = new THREE.Vector3().crossVectors(n, v0).normalize(); // 面内正交基 v0,u1
    const galPos = [], galCol = [];
    const gauss = () => (r() + r() + r() - 1.5) * 0.66; // 近似正态
    const RG = 295;
    for (let i = 0; i < 8500; i++) {
      const t = r() * Math.PI * 2;
      // 银心位于 t≈0.6 附近：核球加宽加亮
      const dt = Math.atan2(Math.sin(t - 0.6), Math.cos(t - 0.6));
      const coreBoost = Math.exp(-dt * dt * 2.2);
      // 旋臂双道：沿带方向按 sin(2t) 分成两条亮道，中间暗缝
      const armPhase = Math.sin(t * 2 + 1.2);
      const lane = Math.sign(armPhase) * (0.028 + 0.02 * r());
      if (Math.abs(armPhase) < 0.25 && r() < 0.72) continue; // 暗尘缝（稀疏）
      const spread = gauss() * (0.075 + coreBoost * 0.075) + lane;
      const dir = v0.clone().multiplyScalar(Math.cos(t) * Math.cos(spread))
        .addScaledVector(u1, Math.sin(t) * Math.cos(spread))
        .addScaledVector(n, Math.sin(spread));
      const rad = RG + gauss() * 6;
      const p = dir.multiplyScalar(rad);
      if (p.y < -RG * 0.05) continue;
      galPos.push(p.x, p.y, p.z);
      // 颜色：蓝白基调；银心偏暖金；少量紫红星云结
      let w = (0.28 + r() * 0.5) * (0.6 + coreBoost * 0.8);
      let cr = w * 0.85, cg = w * 0.9, cb = w * 1.18;
      if (coreBoost > 0.45) { cr = w * 1.12; cg = w * 0.98; cb = w * 0.82; } // 银心暖色
      if (r() < 0.04) { cr = w * 1.25; cg = w * 0.7; cb = w * 1.2; }          // 紫红结
      galCol.push(cr, cg, cb);
    }
    const galGeo = new THREE.BufferGeometry();
    galGeo.setAttribute('position', new THREE.Float32BufferAttribute(galPos, 3));
    galGeo.setAttribute('color', new THREE.Float32BufferAttribute(galCol, 3));
    this.galaxy = new THREE.Points(galGeo, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.galaxy.renderOrder = -9;
    // 银心核心云团（多团块 + 纵深偏移，有视差立体感，不是单平面贴片）
    const coreDir = v0.clone().multiplyScalar(Math.cos(0.6)).addScaledVector(u1, Math.sin(0.6));
    this.coreCluster = [];
    const coreDefs = [
      { off: [0, 0, -14], scale: [110, 72], col: ['rgba(255,230,190,0.5)', 'rgba(180,140,190,0.22)'], base: 0.55 }, // 中央底盘
      { off: [0.03, 0.02, 6], scale: [56, 40], col: ['rgba(255,240,205,0.6)', 'rgba(220,170,150,0.25)'], base: 0.7 }, // 内核亮球
      { off: [-0.05, 0.04, 16], scale: [42, 30], col: ['rgba(230,180,220,0.5)', 'rgba(150,100,180,0.2)'], base: 0.6 },
      { off: [0.06, -0.03, 22], scale: [38, 26], col: ['rgba(255,210,170,0.5)', 'rgba(190,120,110,0.2)'], base: 0.55 },
      { off: [-0.1, -0.06, -22], scale: [46, 30], col: ['rgba(190,160,240,0.45)', 'rgba(110,90,170,0.2)'], base: 0.5 },
      { off: [0.12, 0.05, -28], scale: [34, 24], col: ['rgba(255,200,200,0.4)', 'rgba(170,100,140,0.18)'], base: 0.45 },
      { off: [-0.16, 0.02, 34], scale: [30, 22], col: ['rgba(170,200,255,0.4)', 'rgba(90,110,180,0.18)'], base: 0.42 },
      { off: [0.2, -0.02, 40], scale: [26, 18], col: ['rgba(255,220,235,0.38)', 'rgba(180,110,160,0.16)'], base: 0.4 },
      { off: [-0.24, -0.04, -40], scale: [24, 16], col: ['rgba(200,170,255,0.36)', 'rgba(120,90,170,0.16)'], base: 0.38 },
    ];
    for (const d of coreDefs) {
      // off = [沿带角偏移, 垂带偏移, 径向深度偏移]：云团沿银河带纵向排开且有前后纵深
      const t = 0.6 + d.off[0];
      const sp2 = d.off[1];
      const dir = v0.clone().multiplyScalar(Math.cos(t) * Math.cos(sp2))
        .addScaledVector(u1, Math.sin(t) * Math.cos(sp2))
        .addScaledVector(n, Math.sin(sp2));
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTexture(64, d.col[0], d.col[1]), transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.position.copy(dir.multiplyScalar(288 + d.off[2]));
      sp.scale.set(d.scale[0], d.scale[1], 1);
      sp.renderOrder = -9;
      sp.userData.base = d.base;
      this.coreCluster.push(sp);
    }
    this.galCore = this.coreCluster[0]; // 兼容旧引用

    // ============ 星云（淡紫/粉/青软斑，夜间可见；平视方向也有） ============
    this.nebulae = [];
    const nebDefs = [
      { dir: coreDir.clone(), scale: [150, 90], col: ['rgba(190,150,235,0.32)', 'rgba(120,90,180,0.12)'] }, // 银心紫晕
      { dir: new THREE.Vector3(-0.7, 0.45, 0.3), scale: [90, 60], col: ['rgba(235,160,200,0.28)', 'rgba(150,80,140,0.1)'] },
      { dir: new THREE.Vector3(0.3, 0.3, -0.85), scale: [110, 70], col: ['rgba(140,200,235,0.26)', 'rgba(70,110,170,0.1)'] },
      { dir: new THREE.Vector3(-0.3, 0.85, -0.4), scale: [70, 46], col: ['rgba(200,170,255,0.3)', 'rgba(110,80,170,0.12)'] },
      { dir: new THREE.Vector3(0.85, 0.18, 0.5), scale: [60, 40], col: ['rgba(255,190,220,0.24)', 'rgba(160,90,130,0.1)'] },
      { dir: new THREE.Vector3(-0.9, 0.12, -0.35), scale: [80, 44], col: ['rgba(170,160,240,0.26)', 'rgba(90,80,160,0.1)'] },
    ];
    this.stars = new THREE.Group();
    this.stars.add(this.starsA, this.starsB, this.galaxy, ...this.coreCluster);
    for (const d of nebDefs) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTexture(64, d.col[0], d.col[1]), transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      const dir = d.dir.clone().normalize();
      sp.position.copy(dir.multiplyScalar(288));
      sp.scale.set(d.scale[0], d.scale[1], 1);
      sp.renderOrder = -9;
      sp.userData.baseOp = 0.5 + r() * 0.3;
      this.nebulae.push(sp);
      this.stars.add(sp);
    }
    engine.scene.add(this.stars);

    // ============ 层次云层（高空大云缓移 + 低云碎云，随光照变色） ============
    this.clouds = [];
    this.cloudGroup = new THREE.Group();
    const clDefs = [];
    for (let i = 0; i < 9; i++) clDefs.push({ h: 55 + r() * 22, s: 42 + r() * 30, ring: 130 + r() * 90, sp: 0.004 + r() * 0.004, a: r() * Math.PI * 2 }); // 高层
    for (let i = 0; i < 7; i++) clDefs.push({ h: 26 + r() * 14, s: 20 + r() * 16, ring: 100 + r() * 70, sp: 0.008 + r() * 0.006, a: r() * Math.PI * 2 }); // 低层
    clDefs.forEach((d, i) => {
      const mat = new THREE.SpriteMaterial({ map: cloudTexture(1000 + i * 7), transparent: true, opacity: 0.8, fog: false, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(d.s, d.s * 0.45, 1);
      sp.userData = d;
      this.clouds.push(sp);
      this.cloudGroup.add(sp);
    });
    this.cloudGroup.renderOrder = -8;
    engine.scene.add(this.cloudGroup);

    // ============ 海上云（1 座高塔 + 5 条横向长云带，底部压海平线） ============
    this.towers = [];
    const puffTex = puffTexture();
    const towerAz = [-0.45 * Math.PI, -0.2 * Math.PI, 0.18 * Math.PI, 0.42 * Math.PI, 0.66 * Math.PI, 0.88 * Math.PI];
    towerAz.forEach((az, ti) => {
      const mode = ti === 3 ? 'tower' : 'bank'; // 仅南向一座高塔，其余横向长条
      const pts = makeTowerPoints(3000 + ti * 13, puffTex, mode);
      const group = new THREE.Group();
      group.add(pts);
      group.userData = { a: az, ring: 195 + (ti % 3) * 35, sp: 0.0012 + (ti % 3) * 0.0006, mat: pts.material };
      this.towers.push(group);
      this.cloudGroup.add(group);
    });

    // 流星
    this.meteors = [];
    this.meteorTimer = 60;
    const mg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
    for (let i = 0; i < 3; i++) {
      const line = new THREE.Line(mg, new THREE.LineBasicMaterial({ color: 0xcfe4ff, transparent: true, opacity: 0, fog: false }));
      line.visible = false; engine.scene.add(line);
      this.meteors.push({ line, t: -1, from: new THREE.Vector3(), dir: new THREE.Vector3() });
    }
  }
  makeDisc(color, size, hdr) {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(16, 16, 2, 16, 16, 16);
    grad.addColorStop(0, color); grad.addColorStop(0.55, color); grad.addColorStop(1, color + '00');
    g.fillStyle = grad; g.beginPath(); g.arc(16, 16, 16, 0, 7); g.fill();
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false, depthWrite: false });
    mat.color.setScalar(hdr);
    const sp = new THREE.Sprite(mat);
    sp.scale.setScalar(size * 4);
    return sp;
  }
  // 与光照同步：天空色 = 雾色（地平线），顶部按昼夜；穹顶/星野/云随玩家位置（全图任意处皆在天空盒子内）
  update(minute, dt, fogColor, isNight, sunPos, playerPos) {
    const px = playerPos ? playerPos.x : 0, pz = playerPos ? playerPos.z : 0;
    this.dome.position.set(px, 0, pz);
    this.stars.position.set(px, 0, pz);
    this.cloudGroup.position.set(px, 0, pz);
    const m = this.dome.material.uniforms;
    m.uHorizon.value.copy(fogColor);
    const dayTop = new THREE.Color('#3E7AC2'), duskTop = new THREE.Color('#5A4A8C'), nightTop = new THREE.Color('#0A0E22');
    const t = THREE.MathUtils.clamp((minute - 1020) / 180, 0, 1);      // 17:00→20:00 转夜
    const t2 = THREE.MathUtils.clamp((minute - 330) / 90, 0, 1);       // 5:30→7:00 转昼(凌晨 minute<360 时 t2≈0)
    let top;
    if (minute >= 1020 || minute < 330) top = duskTop.clone().lerp(nightTop, minute >= 1110 ? t : 0);
    else if (minute < 480) top = nightTop.clone().lerp(dayTop, t2);
    else top = dayTop.clone();
    if (minute >= 1020 && minute < 1110) top = dayTop.clone().lerp(duskTop, t); // 黄昏过渡
    m.uTop.value.copy(top);

    // 星野：夜间淡入，缓慢绕转；双层反相闪烁 + 银河呼吸
    const starTarget = isNight ? 0.95 : 0;
    this._starOp = (this._starOp ?? 0) + (starTarget - (this._starOp ?? 0)) * Math.min(1, dt * 0.8);
    const op = this._starOp;
    const now = performance.now();
    this.starsA.material.opacity = op * (0.65 + 0.35 * Math.sin(now / 480));
    this.starsB.material.opacity = op * (0.65 + 0.35 * Math.sin(now / 480 + Math.PI));
    this.galaxy.material.opacity = op * (0.6 + 0.12 * Math.sin(now / 1400));
    for (let i = 0; i < this.coreCluster.length; i++) {
      const sp = this.coreCluster[i];
      sp.material.opacity = op * sp.userData.base * (0.85 + 0.15 * Math.sin(now / 1700 + i * 1.3));
    }
    for (const nb of this.nebulae) nb.material.opacity = op * nb.userData.baseOp * 0.55;
    this.stars.rotation.y += dt * 0.004;

    // 云层：白天亮白、黄昏染橙、夜晚深蓝暗化；绕玩家缓移
    const dayF = THREE.MathUtils.clamp((minute - 330) / 120, 0, 1) * (minute < 1110 ? 1 : THREE.MathUtils.clamp(1 - (minute - 1080) / 90, 0, 1));
    const cloudTint = new THREE.Color('#FFFFFF').lerp(fogColor, 1 - dayF * 0.55);
    const cloudOp = 0.28 + dayF * 0.6;
    for (const cl of this.clouds) {
      const d = cl.userData;
      d.a += d.sp * dt;
      cl.position.set(Math.cos(d.a) * d.ring, d.h, Math.sin(d.a) * d.ring);
      cl.material.color.copy(cloudTint);
      cl.material.opacity = cloudOp * (0.7 + 0.3 * Math.sin(d.a * 3));
    }
    // 浓积云塔：随光照变色（逐 puff 明暗已在顶点属性），绕场极缓漂移
    // uScale 与引擎低分辨率缓冲同步，保证面片尺寸等效旧点精灵像素尺寸
    const lh = Math.max(90, Math.floor(innerHeight / this.engine.pixelScale));
    const puffScale = lh / (2 * Math.tan(THREE.MathUtils.degToRad(this.engine.camera.fov / 2)));
    for (const tw of this.towers) {
      const d = tw.userData;
      d.a += d.sp * dt;
      tw.position.set(Math.cos(d.a) * d.ring, 0, Math.sin(d.a) * d.ring);
      d.mat.uniforms.uTint.value.copy(cloudTint);
      d.mat.uniforms.uOpacity.value = 0.55 + dayF * 0.38;
      d.mat.uniforms.uScale.value = puffScale;
    }

    // 太阳/月亮盘位置跟随光照方向（以玩家为中心）
    if (sunPos) {
      const dir = sunPos.clone().normalize();
      this.sunDisc.position.set(px + dir.x * 290, dir.y * 290, pz + dir.z * 290);
      this.moonDisc.position.set(px - dir.x * 290, -dir.y * 290, pz - dir.z * 290);
      this.sunDisc.material.opacity = isNight ? 0 : 1;
      this.moonDisc.material.opacity = isNight ? 0.95 : 0;
    }

    // 流星：晴夜偶发（加密）
    if (isNight && op > 0.6) {
      this.meteorTimer -= dt;
      if (this.meteorTimer <= 0) {
        this.meteorTimer = 14 + Math.random() * 32;
        const mt = this.meteors.find((x) => x.t < 0);
        if (mt) {
          mt.t = 0;
          mt.from.set((Math.random() - 0.5) * 300, 140 + Math.random() * 80, (Math.random() - 0.5) * 300);
          mt.dir.set((Math.random() - 0.5), -0.4 - Math.random() * 0.3, (Math.random() - 0.5)).normalize();
          mt.line.visible = true;
        }
      }
    }
    for (const mt of this.meteors) {
      if (mt.t < 0) continue;
      mt.t += dt;
      const life = 1.4, p = mt.t / life;
      if (p >= 1) { mt.t = -1; mt.line.visible = false; continue; }
      const head = mt.from.clone().addScaledVector(mt.dir, p * 90);
      const tail = head.clone().addScaledVector(mt.dir, -14 * (1 - p));
      mt.line.geometry.setFromPoints([tail, head]);
      mt.line.material.opacity = Math.sin(p * Math.PI) * 0.9;
    }
  }
}
