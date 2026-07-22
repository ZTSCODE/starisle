// 第一人称手部：挂在相机上的低模手臂 + 手持物（工具用盒体拼模型，其余物品用图标面板），
// 含待机呼吸 / 步伐摆动 / 挥动下劈动画；仅第一人称且无面板打开时可见（Minecraft 风格）
import * as THREE from 'three';
import { makeTexture, shade, woodTex, stoneTex, metalTex, PAL } from './textures.js';
import { itemIcon } from '../ui/icons.js';
import { getItem } from '../data/items.js';
import { heldItem } from '../core/state.js';

// 肤色纹理（带暗部描边噪点，与角色精灵同调色板）
function skinTex() {
  return makeTexture(16, 16, (g) => {
    g.fillStyle = PAL.skin; g.fillRect(0, 0, 16, 16);
    g.fillStyle = shade(PAL.skin, -24);
    for (let i = 0; i < 8; i++) g.fillRect(Math.floor(Math.random() * 15), Math.floor(Math.random() * 15), 1, 1);
    g.fillRect(0, 15, 16, 1);
  });
}
// 袖管纹理（工装蓝，与默认衬衫一致）
function sleeveTex() {
  return makeTexture(16, 16, (g) => {
    g.fillStyle = PAL.shirt[0]; g.fillRect(0, 0, 16, 16);
    g.fillStyle = shade(PAL.shirt[0], -30);
    for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
  });
}

const _mats = {};
function sharedMats() {
  if (_mats.skin) return _mats;
  _mats.skin = new THREE.MeshLambertMaterial({ map: skinTex() });
  _mats.sleeve = new THREE.MeshLambertMaterial({ map: sleeveTex() });
  _mats.wood = new THREE.MeshLambertMaterial({ map: woodTex() });
  _mats.stone = new THREE.MeshLambertMaterial({ map: stoneTex() });
  _mats.metal = new THREE.MeshLambertMaterial({ map: metalTex() });
  _mats.canBlue = new THREE.MeshLambertMaterial({ map: makeTexture(16, 16, (g) => {
    g.fillStyle = '#5A8AC8'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#4A74AC'; for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
    g.fillStyle = '#9FD4F0'; g.fillRect(3, 3, 3, 2);
  }) });
  return _mats;
}
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

// ---- 手持物 3D 模型（工具/武器：盒体拼搭；其余：图标面板）----
function buildToolModel(id) {
  const M = sharedMats();
  const g = new THREE.Group();
  const handle = (len = 0.26) => box(0.032, len, 0.032, M.wood, 0, len / 2 - 0.04, 0);
  switch (id) {
    case 'pickaxe': {
      g.add(handle(0.3));
      g.add(box(0.2, 0.035, 0.035, M.stone, 0, 0.26, 0));
      g.add(box(0.05, 0.05, 0.03, M.stone, -0.11, 0.245, 0));
      g.add(box(0.05, 0.05, 0.03, M.stone, 0.11, 0.245, 0));
      break;
    }
    case 'axe': {
      g.add(handle(0.28));
      g.add(box(0.11, 0.08, 0.03, M.stone, 0.06, 0.22, 0));
      g.add(box(0.03, 0.09, 0.032, M.metal, 0.115, 0.22, 0));
      break;
    }
    case 'hoe': {
      g.add(handle(0.28));
      g.add(box(0.09, 0.03, 0.03, M.metal, 0.045, 0.25, 0));
      g.add(box(0.03, 0.07, 0.025, M.metal, 0.085, 0.21, 0));
      break;
    }
    case 'scythe': {
      g.add(handle(0.34));
      const b1 = box(0.14, 0.028, 0.02, M.metal, 0.07, 0.3, 0); b1.rotation.z = -0.25;
      const b2 = box(0.1, 0.024, 0.02, M.metal, 0.15, 0.335, 0); b2.rotation.z = -0.7;
      g.add(b1, b2);
      break;
    }
    case 'wateringcan': {
      g.add(box(0.1, 0.09, 0.08, M.canBlue, 0, 0.02, 0));
      const spout = box(0.025, 0.14, 0.025, M.canBlue, -0.07, 0.06, 0); spout.rotation.z = 0.7;
      g.add(spout);
      g.add(box(0.02, 0.08, 0.02, M.metal, 0.06, 0.08, 0));
      break;
    }
    case 'fishingrod': {
      const rod = box(0.02, 0.52, 0.02, M.wood, 0, 0.2, 0); rod.rotation.x = 0.5;
      g.add(rod);
      g.add(box(0.05, 0.05, 0.05, M.wood, 0, -0.05, 0.02));
      break;
    }
    case 'sword':
    default: { // 武器统一按剑造型
      g.add(box(0.035, 0.09, 0.035, M.wood, 0, -0.01, 0));
      g.add(box(0.11, 0.025, 0.04, M.metal, 0, 0.05, 0));
      g.add(box(0.045, 0.26, 0.018, M.metal, 0, 0.19, 0));
      g.add(box(0.02, 0.05, 0.02, M.metal, 0, 0.34, 0));
      break;
    }
  }
  // 持握角度：斜指前上方
  g.rotation.set(-0.5, 0.25, 0.15);
  return g;
}
// 非工具物品：图标贴在小幅面板上（MC 举方块式）
function buildIconPanel(id, q) {
  const url = itemIcon(id, q);
  const tex = new THREE.TextureLoader().load(url);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const M = sharedMats();
  const face = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
  const geo = new THREE.BoxGeometry(0.15, 0.15, 0.03);
  const mesh = new THREE.Mesh(geo, [M.wood, M.wood, M.wood, M.wood, face, M.wood]);
  const g = new THREE.Group();
  g.add(mesh);
  g.rotation.set(-0.15, 0.35, 0.1);
  return g;
}

export class FpHand {
  constructor(game) {
    this.game = game;
    const cam = game.engine.camera;
    // 相机不在场景里时子节点不渲染，需补挂
    if (!cam.parent) game.engine.scene.add(cam);
    this.root = new THREE.Group();          // 呼吸/步伐摆动的载体
    this.basePos = new THREE.Vector3(0.32, -0.33, -0.52); // 右下伸入，避开准星中心
    this.root.position.copy(this.basePos);
    this.pivot = new THREE.Group();         // 挥动旋转轴
    this.root.add(this.pivot);
    cam.add(this.root);

    const M = sharedMats();
    // 袖管（从右下入画）+ 小臂 + 手
    const sleeve = box(0.09, 0.09, 0.22, M.sleeve, 0.06, -0.14, 0.16);
    sleeve.rotation.x = -0.55;
    const forearm = box(0.08, 0.08, 0.18, M.skin, 0.02, -0.05, 0.02);
    forearm.rotation.x = -0.35;
    this.hand = box(0.085, 0.085, 0.085, M.skin, 0, 0, -0.08);
    this.pivot.add(sleeve, forearm, this.hand);
    this.itemHolder = new THREE.Group();
    this.itemHolder.position.set(0, 0.05, -0.1);
    this.pivot.add(this.itemHolder);

    this.itemKey = null;   // 当前已构建的手持物标识（选中变化才重建）
    this.swingT = -1;      // 挥动进度（0.35s 一轮）
    this.bobPhase = 0;     // 步伐相位
    this.idleT = Math.random() * 6;
    this.root.visible = false;
  }

  swing() { if (this.swingT < 0) this.swingT = 0; }

  // 选中项/物品变化时重建手持物（不在每帧重建）
  _refreshItem() {
    const st = this.game.state;
    const held = heldItem(st);
    const key = st.player.toolbarSel + ':' + (held ? held.id + ':' + (held.quality ?? 0) : 'none');
    if (key === this.itemKey) return;
    this.itemKey = key;
    // 清理旧模型资源
    for (const c of [...this.itemHolder.children]) {
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && !Object.values(sharedMats()).includes(o.material)) {
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            if (Object.values(sharedMats()).includes(m)) continue;
            m.map?.dispose?.(); m.dispose?.();
          }
        }
      });
      this.itemHolder.remove(c);
    }
    if (!held) return;
    const it = getItem(held.id);
    const isTool = it.type === 'tool' || it.type === 'weapon';
    this.itemHolder.add(isTool ? buildToolModel(held.id) : buildIconPanel(held.id, held.quality ?? 0));
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    // 仅第一人称且无任何面板/过场时显示
    const show = !!p?.fpv && !(g.ui?.anyPanelOpen?.()) && !g.photoActive;
    this.root.visible = show;
    if (!show) { this.swingT = -1; return; }

    this._refreshItem();

    // 待机呼吸 + 步伐摆动
    this.idleT += dt;
    let bx = 0, by = Math.sin(this.idleT * 1.7) * 0.006;
    if (p.moving) {
      this.bobPhase += dt * (p.running ? 11 : 7.5);
      by += Math.abs(Math.sin(this.bobPhase)) * 0.022;
      bx = Math.sin(this.bobPhase) * 0.012;
    } else {
      this.bobPhase *= Math.max(0, 1 - dt * 8); // 停下后相位衰减，避免下次起步跳变
    }
    this.root.position.set(this.basePos.x + bx, this.basePos.y + by, this.basePos.z);

    // 挥动：快速下劈（easeOut）+ 回弹归位（easeInOut），全程约 0.35s
    if (this.swingT >= 0) {
      this.swingT += dt / 0.35;
      const t = Math.min(1, this.swingT);
      let k; // 0→1 下劈，1→0 回弹
      if (t < 0.4) { const u = t / 0.4; k = 1 - (1 - u) * (1 - u); }
      else { const u = (t - 0.4) / 0.6; k = 1 - (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2); }
      this.pivot.rotation.x = -1.35 * k;
      this.pivot.position.z = -0.12 * k;
      this.pivot.position.y = -0.05 * k;
      if (this.swingT >= 1) {
        this.swingT = -1;
        this.pivot.rotation.set(0, 0, 0);
        this.pivot.position.set(0, 0, 0);
      }
    }
  }
}
