// 反馈效果：粒子池 / 浮动文字 / 屏幕震动 / 闪光脉冲
import * as THREE from 'three';
import { makeTexture } from './textures.js';

const MAXP = 600;
export class Effects {
  constructor(engine) {
    this.engine = engine;
    // 粒子池（Points）
    this.pos = new Float32Array(MAXP * 3);
    this.col = new Float32Array(MAXP * 3);
    this.vel = new Float32Array(MAXP * 3);
    this.life = new Float32Array(MAXP);
    this.grav = new Float32Array(MAXP);
    this.head = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const tex = makeTexture(8, 8, (gg) => { gg.fillStyle = '#fff'; gg.fillRect(2, 2, 4, 4); });
    this.points = new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.09, map: tex, vertexColors: true, transparent: true, alphaTest: 0.2, depthWrite: false,
    }));
    this.points.frustumCulled = false;
    engine.scene.add(this.points);
    for (let i = 0; i < MAXP; i++) this.life[i] = -1;

    // 浮动文字层
    this.floatLayer = document.createElement('div');
    this.floatLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden';
    document.getElementById('ui').appendChild(this.floatLayer);
    this.floats = [];
    this.shake = 0;
    this.camBase = null;
    // 脚印池（冬季雪地，左右交替，渐隐）
    this.footPool = [];
    this.footIdx = 0;
    const fpGeo = new THREE.PlaneGeometry(0.13, 0.19);
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(fpGeo, new THREE.MeshBasicMaterial({ color: 0x46586a, transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      engine.scene.add(m);
      this.footPool.push({ m, life: 0 });
    }
  }
  // 在 (x,z) 留一个脚印（ang 为行进朝向，side 左右脚 ±1）
  footprint(x, z, ang, side = 1) {
    const f = this.footPool[this.footIdx];
    this.footIdx = (this.footIdx + 1) % this.footPool.length;
    const px = x + Math.cos(ang) * 0.09 * side, pz = z - Math.sin(ang) * 0.09 * side;
    f.m.position.set(px, 0.022, pz);
    f.m.rotation.z = -ang;
    f.life = 5;
    f.m.visible = true;
  }
  // 粒子爆发
  burst(p, colors, n = 8, speed = 2, gravity = 4, lifeMax = 0.7) {
    for (let k = 0; k < n; k++) {
      const i = this.head; this.head = (this.head + 1) % MAXP;
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y + 0.1; this.pos[i * 3 + 2] = p.z;
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.6);
      this.vel[i * 3] = Math.cos(a) * v; this.vel[i * 3 + 1] = speed * (0.5 + Math.random() * 0.7); this.vel[i * 3 + 2] = Math.sin(a) * v;
      const c = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
      this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b;
      this.life[i] = lifeMax * (0.6 + Math.random() * 0.4);
      this.grav[i] = gravity;
    }
  }
  // 浮动文字（世界坐标 → 屏幕）
  floatText(p, text, color = '#fff', size = 14) {
    const v = p.clone().project(this.engine.camera);
    if (v.z > 1) return;
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `position:absolute;left:${(v.x * 0.5 + 0.5) * 100}%;top:${(-v.y * 0.5 + 0.5) * 100}%;transform:translate(-50%,-100%);color:${color};font-size:${size}px;font-weight:bold;text-shadow:1px 1px 0 #0009, -1px 1px 0 #0009;transition:top 1.1s ease-out, opacity 1.1s;white-space:nowrap`;
    this.floatLayer.appendChild(el);
    requestAnimationFrame(() => { el.style.top = `calc(${(-v.y * 0.5 + 0.5) * 100}% - 46px)`; el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 1200);
    if (this.floatLayer.children.length > 10) this.floatLayer.firstChild.remove();
  }
  shakeScreen(amp = 0.06) { this.shake = Math.max(this.shake, amp); }
  update(dt) {
    for (let i = 0; i < MAXP; i++) {
      if (this.life[i] < 0) continue;
      this.life[i] -= dt;
      if (this.life[i] < 0) { this.pos[i * 3 + 1] = -999; continue; }
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    // 脚印渐隐
    for (const f of this.footPool) {
      if (f.life <= 0) continue;
      f.life -= dt;
      f.m.material.opacity = Math.max(0, Math.min(0.4, f.life / 3));
      if (f.life <= 0) f.m.visible = false;
    }
    if (this.shake > 0.0005) {
      const s = this.shake;
      this.engine.camera.position.x += (Math.random() - 0.5) * s * 2;
      this.engine.camera.position.y += (Math.random() - 0.5) * s * 2;
      this.shake *= Math.pow(0.001, dt); // 快速衰减
    } else this.shake = 0;
  }
}
