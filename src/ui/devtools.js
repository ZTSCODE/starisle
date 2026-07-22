// 开发模式：F8 碰撞可视化（半透明格网）+ 鼠标 hover 显示碰撞来源
import * as THREE from 'three';
import { collisionInfo, WB } from '../world/builder.js';

export class DevTools {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.grid = null;
    this.gridKey = '';
    // hover 信息条
    this.label = document.createElement('div');
    this.label.style.cssText = 'position:fixed;left:12px;bottom:120px;z-index:90;padding:6px 12px;background:rgba(20,22,32,0.85);border:1px solid #4A5578;border-radius:4px;color:#FFD98A;font-size:13px;display:none;pointer-events:none;font-family:monospace';
    document.body.appendChild(this.label);
    this.ray = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F8') { e.preventDefault(); this.toggle(); }
    });
  }
  toggle() {
    this.enabled = !this.enabled;
    const g = this.game;
    if (this.enabled) {
      this.rebuild();
      g.ui?.tutorial?.('开发模式：碰撞可视化 开（F8 关闭）', 2200);
    } else {
      this.clear();
      g.ui?.tutorial?.('开发模式：碰撞可视化 关', 1600);
    }
  }
  clear() {
    if (this.grid) { this.game.engine.scene.remove(this.grid); this.grid = null; }
    this.gridKey = '';
    this.label.style.display = 'none';
  }
  // 以玩家为中心 44×44 格网（blocked 红 / water 蓝 / 动态紫）
  rebuild() {
    const g = this.game;
    if (this.grid) g.engine.scene.remove(this.grid);
    const px = Math.floor(g.player.pos.x), pz = Math.floor(g.player.pos.z);
    this.gridKey = `${px >> 2},${pz >> 2}`;
    const mats = {
      blocked: new THREE.MeshBasicMaterial({ color: 0xe84a4a, transparent: true, opacity: 0.32, depthWrite: false }),
      water: new THREE.MeshBasicMaterial({ color: 0x4a8ae8, transparent: true, opacity: 0.32, depthWrite: false }),
    };
    this.grid = new THREE.Group();
    const geo = new THREE.PlaneGeometry(0.94, 0.94);
    for (let dx = -22; dx <= 22; dx++) for (let dz = -22; dz <= 22; dz++) {
      const x = px + dx, z = pz + dz;
      const t = collisionInfo(x + 0.5, z + 0.5).type;
      if (t === 'walk') continue;
      const m = new THREE.Mesh(geo, mats[t === 'water' ? 'water' : 'blocked']);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x + 0.5, 0.06, z + 0.5);
      this.grid.add(m);
    }
    g.engine.scene.add(this.grid);
  }
  update() {
    if (!this.enabled) return;
    const g = this.game;
    // 玩家跨区重建
    const key = `${Math.floor(g.player.pos.x) >> 2},${Math.floor(g.player.pos.z) >> 2}`;
    if (key !== this.gridKey) this.rebuild();
    // hover 碰撞信息
    const nx = g.input.mouse.nx, ny = g.input.mouse.ny;
    if (nx == null) { this.label.style.display = 'none'; return; }
    this.ray.setFromCamera({ x: nx, y: ny }, g.engine.camera);
    const hit = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(this.plane, hit)) {
      const info = collisionInfo(hit.x, hit.z);
      const cx = Math.floor(hit.x), cz = Math.floor(hit.z);
      const src = info.source ? ` · ${info.source}` : '';
      this.label.textContent = `(${cx}, ${cz}) ${info.type}${src}`;
      this.label.style.display = 'block';
      this.label.style.color = info.type === 'walk' ? '#8AE84A' : info.type === 'water' ? '#7AB8E8' : '#E84A4A';
    } else {
      this.label.style.display = 'none';
    }
  }
}
