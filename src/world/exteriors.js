// 汐溪谷·室外建筑主题特化装饰：按 building.id 在通用房体周围拼主题道具（纯视觉，无碰撞）
// 风格同 scenekit/proto：低模盒体/圆柱 + 程序化像素纹理 + castShadow
import * as THREE from 'three';
import { PAL, shade, makeTexture, woodTex, barkTex, stoneTex, metalTex, hayTex } from '../render/textures.js';
import { rng, hashStr } from '../core/rng.js';
import { makeCrate, makeBarrel, makeHayBale, makeFence, makeRock, makeGrassTuft, makePlanter } from './proto.js';
import { makeBench, makeNoticeBoard } from './scenekit.js';

// ---------- 基础小件 ----------
const lam = (opt) => new THREE.MeshLambertMaterial({ flatShading: true, ...opt });
const box = (w, h, d, mat, x = 0, y = 0, z = 0, ry = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true;
  return m;
};
const cyl = (r0, r1, h, mat, x = 0, y = 0, z = 0, seg = 7) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true;
  return m;
};

// 条纹布纹理（雨棚/晾布用）
function stripeTex(cols, vertical = true) {
  return makeTexture(32, 16, (g) => {
    const n = cols.length;
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[i];
      if (vertical) g.fillRect(Math.floor((i * 32) / n), 0, Math.ceil(32 / n), 16);
      else g.fillRect(0, Math.floor((i * 16) / n), 32, Math.ceil(16 / n));
    }
    const r = rng(hashStr('stripe' + cols.join()));
    g.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 24; i++) g.fillRect(Math.floor(r() * 32), Math.floor(r() * 16), 2, 1);
  });
}

// 雨棚：斜拉条纹布 + 两根前柱（搭在门上方，不挡门口地面）
function makeAwning(width, cols) {
  const g = new THREE.Group();
  const tex = stripeTex(cols);
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(Math.max(1, Math.round(width / 1.2)), 1);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.15), lam({ map: tex, side: THREE.DoubleSide }));
  cloth.rotation.x = -Math.PI / 2 + 0.42;
  cloth.position.set(0, 2.32, 0.5);
  cloth.castShadow = true;
  const rod = cyl(0.035, 0.035, width, lam({ map: metalTex() }), 0, 2.14, 0.92);
  rod.rotation.z = Math.PI / 2;
  const pm = lam({ color: PAL.woodD });
  for (const sx of [-width / 2 + 0.12, width / 2 - 0.12]) g.add(cyl(0.045, 0.05, 2.1, pm, sx, 1.05, 0.9));
  g.add(cloth, rod);
  return g;
}

// 挂牌（小木牌挂在门旁，会轻摇）
function makeHangingSign(text, bg = '#B89B6A') {
  const g = new THREE.Group();
  const arm = cyl(0.03, 0.03, 0.7, lam({ map: metalTex() }), 0, 2.3, 0.3);
  arm.rotation.x = Math.PI / 2;
  const tex = makeTexture(48, 24, (gg) => {
    gg.fillStyle = bg; gg.fillRect(0, 0, 48, 24);
    gg.strokeStyle = '#6A4A28'; gg.strokeRect(0.5, 0.5, 47, 23);
    gg.fillStyle = '#3A2A1A';
    gg.font = 'bold 13px "Microsoft YaHei", sans-serif';
    gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.fillText(text, 24, 13);
  });
  const pivot = new THREE.Group(); pivot.position.set(0, 2.3, 0.55);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.42), lam({ map: tex, side: THREE.DoubleSide }));
  board.position.y = -0.34; board.castShadow = true;
  pivot.add(board);
  g.add(arm, pivot);
  g.userData.signPivot = pivot;
  return g;
}

// 原木堆（横向码放）
function makeLogPile() {
  const g = new THREE.Group();
  const bm = lam({ map: barkTex() });
  const spots = [[0, 0.14, 0], [0.02, 0.14, 0.3], [-0.02, 0.14, -0.3], [0, 0.4, 0.15], [0.02, 0.4, -0.15], [0, 0.66, 0]];
  for (const [x, y, z] of spots) {
    const log = cyl(0.13, 0.13, 1.6, bm, x, y, z, 6);
    log.rotation.z = Math.PI / 2; log.rotation.y = (hashStr('log' + x + z) % 10) * 0.01;
    g.add(log);
  }
  return g;
}

// 木板堆
function makePlankStack() {
  const g = new THREE.Group();
  const wm = lam({ map: woodTex() });
  for (let i = 0; i < 6; i++) {
    const p = box(1.7, 0.07, 0.4, wm, (i % 2) * 0.06 - 0.03, 0.05 + i * 0.08, (i % 3) * 0.05 - 0.05);
    p.rotation.y = (i % 2 ? 0.05 : -0.04);
    g.add(p);
  }
  return g;
}

// 锯木架（X 腿 + 架上的原木）
function makeSawbuck() {
  const g = new THREE.Group();
  const wm = lam({ color: PAL.woodD });
  for (const sx of [-0.5, 0.5]) {
    for (const sz of [-1, 1]) {
      const leg = box(0.08, 0.9, 0.08, wm, sx, 0.38, sz * 0.18);
      leg.rotation.x = sz * 0.5;
      g.add(leg);
    }
  }
  const log = cyl(0.12, 0.12, 1.7, lam({ map: barkTex() }), 0, 0.78, 0, 6);
  log.rotation.z = Math.PI / 2;
  g.add(log);
  return g;
}

// 石灯笼（茶馆/门口；灯罩内嵌暖光面）
function makeStoneLantern() {
  const g = new THREE.Group();
  const sm = lam({ map: stoneTex() });
  g.add(cyl(0.16, 0.2, 0.18, sm, 0, 0.09, 0, 6));
  g.add(cyl(0.09, 0.11, 0.5, sm, 0, 0.43, 0, 6));
  g.add(box(0.34, 0.3, 0.34, sm, 0, 0.82, 0));
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.36),
    new THREE.MeshLambertMaterial({ color: '#FFD98A', emissive: 0xffc86a, emissiveIntensity: 1.4 }));
  glow.position.y = 0.82;
  g.add(glow);
  const roof = cyl(0.02, 0.3, 0.24, sm, 0, 1.08, 0, 4);
  g.add(roof);
  g.userData.glowMat = glow.material;
  return g;
}

// 竹丛（3-5 根青竹 + 叶团）
function makeBamboo(n = 4) {
  const g = new THREE.Group();
  const r = rng(hashStr('bamboo' + n));
  const bm = lam({ color: '#5FA84A' });
  const lm = lam({ color: '#3E8B3D' });
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * 0.5, z = (r() - 0.5) * 0.5, h = 1.8 + r() * 1.2;
    g.add(cyl(0.035, 0.045, h, bm, x, h / 2, z, 5));
    const leaf = box(0.4, 0.5, 0.4, lm, x, h + 0.1, z, r() * 3);
    leaf.scale.y = 0.7;
    g.add(leaf);
  }
  return g;
}

// 串灯（折线绳 + 彩色小灯泡；灯泡材质收集到 userData.glowMats 供闪烁）
function makeStringLights(width) {
  const g = new THREE.Group();
  const rm = lam({ color: '#4A3A28' });
  const cols = [0xffd98a, 0xff8a9a, 0x8ad8ff, 0xa8ff9a];
  const n = Math.max(5, Math.round(width / 0.45));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = -width / 2 + (i * width) / n;
    const y = 2.5 - Math.sin((i / n) * Math.PI) * 0.35;
    pts.push(new THREE.Vector3(x, y, 0));
  }
  const rope = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.012, 4), rm);
  g.add(rope);
  const glowMats = [];
  for (let i = 1; i < n; i++) {
    const p = pts[i];
    const mat = new THREE.MeshLambertMaterial({ color: cols[i % 4], emissive: cols[i % 4], emissiveIntensity: 1.2 });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.07), mat);
    bulb.position.set(p.x, p.y - 0.07, 0);
    g.add(bulb);
    glowMats.push(mat);
  }
  g.userData.glowMats = glowMats;
  return g;
}

// 渔网（网格纹理面片）
function netTex() {
  return makeTexture(24, 24, (g) => {
    g.clearRect(0, 0, 24, 24);
    g.strokeStyle = 'rgba(120,100,70,0.9)'; g.lineWidth = 1;
    for (let i = 0; i <= 24; i += 4) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i - 6, 24); g.stroke();
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 6, 24); g.stroke();
    }
  });
}
function makeFishNet(w = 1.6, h = 1.2) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    lam({ map: netTex(), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide }));
  m.castShadow = true;
  return m;
}

// 小木船（平底舢板）
function makeRowboat() {
  const g = new THREE.Group();
  const wm = lam({ map: woodTex() });
  const hull = box(2.0, 0.4, 0.7, wm, 0, 0.28, 0);
  const bow = cyl(0.35, 0.35, 0.4, wm, 1.0, 0.28, 0, 3);
  bow.rotation.y = Math.PI / 2;
  const stern = box(0.12, 0.44, 0.7, wm, -1.0, 0.3, 0);
  const seat = box(0.3, 0.06, 0.6, lam({ color: PAL.woodD }), -0.2, 0.46, 0);
  const inner = box(1.8, 0.06, 0.5, lam({ color: shade(PAL.wood, -26) }), 0, 0.42, 0);
  const oar = cyl(0.025, 0.025, 1.5, lam({ color: PAL.woodD }), 0.1, 0.55, 0.1);
  oar.rotation.z = Math.PI / 2 - 0.2; oar.rotation.y = 0.4;
  g.add(hull, bow, stern, seat, inner, oar);
  return g;
}

// 断裂石柱（一立一倒）
function makeBrokenColumn(h = 1.6) {
  const g = new THREE.Group();
  const sm = lam({ map: stoneTex() });
  g.add(cyl(0.26, 0.32, 0.2, sm, 0, 0.1, 0, 8));
  const col = cyl(0.2, 0.22, h, sm, 0, 0.2 + h / 2, 0, 8);
  g.add(col);
  const cap = box(0.5, 0.14, 0.5, sm, 0.05, 0.2 + h + 0.06, 0.03, 0.2);
  cap.rotation.z = 0.12;
  g.add(cap);
  return g;
}

// 藤蔓贴墙（交叉绿面片）
function makeVine(h = 1.8) {
  const g = new THREE.Group();
  const tex = makeTexture(16, 24, (gg) => {
    gg.clearRect(0, 0, 16, 24);
    const r = rng(hashStr('vine' + Math.random()));
    for (let i = 0; i < 14; i++) {
      gg.fillStyle = r() < 0.6 ? '#4AA83B' : '#6CB43F';
      gg.fillRect(2 + Math.floor(r() * 12), Math.floor(r() * 22), 2 + Math.floor(r() * 2), 2 + Math.floor(r() * 3));
    }
  });
  const m = lam({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, h), m);
  p1.position.y = h / 2;
  const p2 = p1.clone(); p2.rotation.y = Math.PI / 2; p2.scale.set(0.7, 0.85, 1);
  g.add(p1, p2);
  return g;
}

// 晾衣绳（两杆 + 绳 + 彩布）
function makeClothesline(cols = ['#E87A9A', '#8AD8FF', '#FFF0C8'], len = 2.4) {
  const g = new THREE.Group();
  const pm = lam({ color: PAL.woodD });
  for (const sx of [-len / 2, len / 2]) g.add(cyl(0.04, 0.05, 1.7, pm, sx, 0.85, 0, 5));
  const rope = box(len, 0.02, 0.02, lam({ color: '#D8C8A8' }), 0, 1.6, 0);
  g.add(rope);
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    const c = box(0.55, 0.6, 0.03, lam({ color: cols[i] }), -len / 2 + ((i + 1) * len) / (n + 1), 1.28, 0);
    c.castShadow = true;
    g.add(c);
  }
  return g;
}

// 人台模特（裁缝铺）
function makeMannequin(clothCol = '#B84A6A') {
  const g = new THREE.Group();
  const wm = lam({ color: PAL.woodD });
  g.add(cyl(0.14, 0.18, 0.06, wm, 0, 0.03, 0, 8));
  g.add(cyl(0.03, 0.03, 1.0, wm, 0, 0.55, 0, 5));
  const torso = cyl(0.16, 0.12, 0.55, lam({ color: '#E8D8C0' }), 0, 1.28, 0, 8);
  g.add(torso);
  const cloth = cyl(0.2, 0.26, 0.5, lam({ color: clothCol }), 0, 1.05, 0, 8);
  g.add(cloth);
  g.add(cyl(0.05, 0.05, 0.08, wm, 0, 1.6, 0, 6));
  return g;
}

// 柴堆 + 树桩
function makeWoodPile() {
  const g = new THREE.Group();
  const bm = lam({ map: barkTex() });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const log = cyl(0.09, 0.09, 0.5, bm, Math.cos(a) * 0.16, 0.12 + (i % 2) * 0.16, Math.sin(a) * 0.16, 5);
    log.rotation.x = Math.PI / 2; log.rotation.z = a;
    g.add(log);
  }
  return g;
}
function makeStump() {
  const g = new THREE.Group();
  const st = cyl(0.2, 0.24, 0.4, lam({ map: barkTex() }), 0, 0.2, 0, 8);
  const top = cyl(0.2, 0.2, 0.03, lam({ map: woodTex() }), 0, 0.41, 0, 8);
  const axe = box(0.05, 0.5, 0.05, lam({ color: PAL.woodD }), 0.08, 0.6, 0.02);
  axe.rotation.z = -0.4;
  const head = box(0.16, 0.1, 0.03, lam({ map: metalTex() }), 0.17, 0.78, 0.02);
  head.rotation.z = -0.4;
  g.add(st, top, axe, head);
  return g;
}

// 小花坛/花盆组
function makeFlowerPots(season, n = 2) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const pot = makePlanter(season);
    pot.position.x = i * 0.9;
    g.add(pot);
  }
  return g;
}

// 小栅栏菜园（垄沟土块 + 三面小栅栏 + 菜苗）
function makeVeggieGarden() {
  const g = new THREE.Group();
  const soil = box(2.2, 0.16, 1.4, lam({ color: PAL.till }), 0, 0.08, 0);
  g.add(soil);
  for (let i = 0; i < 3; i++) g.add(box(2.0, 0.06, 0.16, lam({ color: PAL.tillWet }), 0, 0.17, -0.45 + i * 0.45));
  const sprout = lam({ color: '#6CC85A' });
  for (let i = 0; i < 9; i++) {
    g.add(box(0.08, 0.16, 0.08, sprout, -0.8 + (i % 3) * 0.8, 0.26, -0.45 + Math.floor(i / 3) * 0.45));
  }
  const f1 = makeFence(3); f1.position.set(-0.9, 0, -0.85);
  const f2 = makeFence(3); f2.position.set(-0.9, 0, 0.85);
  const f3 = makeFence(2); f3.rotation.y = Math.PI / 2; f3.position.set(-1.25, 0, -0.45);
  g.add(f1, f2, f3);
  return g;
}

// 饲料槽
function makeFeedTrough() {
  const g = new THREE.Group();
  const wm = lam({ map: woodTex() });
  g.add(box(1.6, 0.3, 0.5, wm, 0, 0.3, 0));
  g.add(box(1.4, 0.08, 0.34, lam({ map: hayTex() }), 0, 0.42, 0));
  for (const sx of [-0.65, 0.65]) g.add(box(0.1, 0.3, 0.5, wm, sx, 0.15, 0));
  return g;
}

// 小风车塔（牧场；扇叶旋转）
function makeWindmill() {
  const g = new THREE.Group();
  const wm = lam({ color: PAL.woodD });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = cyl(0.05, 0.07, 3.2, wm, sx * 0.45, 1.6, sz * 0.45, 5);
    leg.rotation.z = -sx * 0.16; leg.rotation.x = sz * 0.16;
    g.add(leg);
  }
  g.add(box(0.7, 0.5, 0.7, lam({ map: woodTex() }), 0, 3.1, 0));
  const hub = new THREE.Group(); hub.position.set(0, 3.2, 0.45);
  const bladeM = lam({ color: '#E8DCC8', side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const bl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.1), bladeM);
    bl.position.y = 0.62; bl.castShadow = true;
    const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI) / 2;
    arm.add(bl); hub.add(arm);
  }
  const axle = cyl(0.06, 0.06, 0.2, lam({ map: metalTex() }), 0, 0, 0, 6);
  axle.rotation.x = Math.PI / 2;
  hub.add(axle);
  g.add(hub);
  g.userData.hub = hub;
  return g;
}

// 门口石径（不规则踏脚石，从门向外）
function makeStonePath(face, len = 2.4) {
  const g = new THREE.Group();
  const sm = lam({ map: stoneTex() });
  const r = rng(hashStr('path' + face));
  for (let i = 0; i < 4; i++) {
    const s = cyl(0.28 + r() * 0.1, 0.3 + r() * 0.1, 0.06, sm, (r() - 0.5) * 0.5, 0.03, face * (0.5 + i * (len / 4)), 7);
    g.add(s);
  }
  return g;
}

// ============ 主题装饰装配 ============
// b: LAYOUT_BUILDINGS 项；返回定位在建筑中心的装饰 Group（纯视觉）
export function decorateExterior(b, season = 0) {
  const g = new THREE.Group();
  g.name = 'ext_' + b.id;
  const F = b.face;                 // 门面方向（z 符号）
  const fz = F * (b.d / 2);         // 前墙面 z
  const anims = [];                 // 需要 update 的小动画
  const glowMats = [];              // 夜间发光材质（可选收集）

  // 便捷放置：fx = 离门轴偏移, fd = 离前墙距离（沿门面方向）
  const put = (obj, fx, fd, ry = 0) => {
    obj.position.set(fx, 0, fz + F * fd);
    if (ry) obj.rotation.y = ry;
    g.add(obj);
    return obj;
  };
  // 侧面放置（不挡门）
  const side = (obj, sx, dz, ry = 0) => {
    obj.position.set(sx * (b.w / 2 + 0.7), 0, dz);
    if (ry) obj.rotation.y = ry;
    g.add(obj);
    return obj;
  };

  switch (b.id) {
    case 'pierre': { // 杂货店：条纹雨棚 + 货箱 + 木桶 + 挂牌
      const aw = makeAwning(b.w * 0.8, ['#C85A4A', '#F0E8D8']);
      aw.position.set(0, 0, fz + F * 0.05); if (F === -1) aw.rotation.y = Math.PI;
      g.add(aw);
      const hs = makeHangingSign('特价'); hs.position.set(-b.w / 2 + 0.1, 0, fz + F * 0.1);
      g.add(hs); anims.push((dt, t) => { hs.userData.signPivot.rotation.x = Math.sin(t * 1.8) * 0.12; });
      const c1 = makeCrate(1); put(c1, b.w / 2 - 1.0, 0.9);
      const c2 = makeCrate(0.8); c2.position.set(b.w / 2 - 1.0, 0.42, fz + F * 0.95); g.add(c2);
      const c3 = makeCrate(0.9); put(c3, b.w / 2 - 1.7, 1.1, 0.4);
      put(makeBarrel(), -b.w / 2 + 0.9, 1.0);
      break;
    }
    case 'blacksmith': { // 铁匠铺：屋外锻炉 + 铁砧 + 矿石堆 + 武器架 + 加粗烟囱
      const forge = new THREE.Group();
      const sm = lam({ map: stoneTex() });
      forge.add(box(1.3, 0.7, 1.0, sm, 0, 0.35, 0));
      forge.add(box(1.5, 0.12, 1.2, sm, 0, 0.76, 0));
      forge.add(box(0.5, 1.4, 0.5, sm, -0.4, 1.4, -0.25)); // 锻炉烟囱（加粗感）
      const fireMat = new THREE.MeshLambertMaterial({ color: '#FF8A3C', emissive: 0xff7a2c, emissiveIntensity: 2 });
      const fire = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.4), fireMat);
      fire.position.set(0.2, 0.85, 0.1); forge.add(fire);
      put(forge, -b.w / 2 + 1.2, 1.3);
      anims.push((dt, t) => { fireMat.emissiveIntensity = 1.7 + Math.sin(t * 9) * 0.4 + Math.sin(t * 23) * 0.2; });
      const anvil = new THREE.Group(); // 铁砧
      const mm = lam({ map: metalTex() });
      anvil.add(box(0.4, 0.3, 0.4, lam({ map: barkTex() }), 0, 0.15, 0));
      anvil.add(box(0.7, 0.16, 0.24, mm, 0, 0.42, 0));
      anvil.add(box(0.3, 0.12, 0.2, mm, 0, 0.3, 0));
      put(anvil, -b.w / 2 + 2.3, 1.5, 0.5);
      const ore = makeRock(0.9); put(ore, b.w / 2 - 0.9, 1.2); // 矿石堆
      const ore2 = makeRock(0.6); ore2.position.set(b.w / 2 - 1.5, 0, fz + F * 1.5); g.add(ore2);
      const rack = new THREE.Group(); // 挂武器架
      const wm = lam({ color: PAL.woodD });
      rack.add(cyl(0.05, 0.06, 1.5, wm, -0.5, 0.75, 0, 5));
      rack.add(cyl(0.05, 0.06, 1.5, wm, 0.5, 0.75, 0, 5));
      rack.add(box(1.2, 0.07, 0.07, wm, 0, 1.35, 0));
      for (let i = 0; i < 3; i++) {
        const sw = box(0.06, 0.8, 0.02, mm, -0.35 + i * 0.35, 0.9, 0.05);
        sw.rotation.z = 0.06 * (i - 1);
        rack.add(sw);
      }
      put(rack, b.w / 2 - 0.2, 0.35);
      break;
    }
    case 'carpenter': { // 木工坊：原木堆 + 木板堆 + 锯木架 + 刨花堆
      side(makeLogPile(), 1, -0.5, 0.1);
      side(makeLogPile(), 1, 1.0, -0.15);
      put(makePlankStack(), -b.w / 2 + 1.1, 1.1, 0.2);
      put(makeSawbuck(), b.w / 2 - 1.4, 1.4, 0.9);
      const shav = cyl(0.02, 0.45, 0.3, lam({ map: hayTex() }), b.w / 2 - 2.3, 0.15, fz + F * 1.2, 8); // 刨花堆
      g.add(shav);
      break;
    }
    case 'ranch': { // 牧场：干草捆 + 饲料槽 + 小围栏畜栏 + 风车塔
      put(makeHayBale(), -b.w / 2 + 0.8, 1.2);
      const hb = makeHayBale(); hb.position.set(-b.w / 2 + 1.5, 0, fz + F * 1.5); hb.rotation.y = 0.8; g.add(hb);
      put(makeFeedTrough(), b.w / 2 - 1.3, 1.3, 0.3);
      // 小围栏畜栏（侧面方形栏）
      const pen = new THREE.Group();
      const f1 = makeFence(4); f1.position.set(-1.5, 0, -1.5);
      const f2 = makeFence(4); f2.position.set(-1.5, 0, 1.5);
      const f3 = makeFence(3); f3.rotation.y = Math.PI / 2; f3.position.set(-1.9, 0, -1.0);
      const f4 = makeFence(3); f4.rotation.y = Math.PI / 2; f4.position.set(1.9, 0, -1.0);
      pen.add(f1, f2, f3, f4);
      side(pen, 1, 0);
      const mill = makeWindmill();
      side(mill, -1, -b.d / 2 + 0.8);
      anims.push((dt, t) => { mill.userData.hub.rotation.z = t * 1.4; });
      break;
    }
    case 'saloon': { // 酒吧：门头灯箱 + 酒桶圆桌凳 + 串灯 + 后侧赌场霓虹牌
      const lb = new THREE.Group(); // 大灯箱
      lb.add(box(2.2, 0.55, 0.18, lam({ color: '#3A2A3E' }), 0, 0, 0));
      const lbTex = makeTexture(64, 16, (gg) => {
        gg.fillStyle = '#2A1A2E'; gg.fillRect(0, 0, 64, 16);
        gg.fillStyle = '#FFD98A'; gg.font = 'bold 12px "Microsoft YaHei", sans-serif';
        gg.textAlign = 'center'; gg.textBaseline = 'middle';
        gg.fillText('汐 浪 酒 吧', 32, 9);
      });
      const lbMat = new THREE.MeshLambertMaterial({ map: lbTex, emissive: 0xffc86a, emissiveIntensity: 1.0 });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.45), lbMat);
      face.position.z = 0.1;
      lb.add(face);
      lb.position.set(0, 2.45, fz + F * 0.2); if (F === -1) lb.rotation.y = Math.PI;
      g.add(lb); glowMats.push(lbMat);
      // 门口酒桶 + 圆桌 + 凳
      put(makeBarrel(), -b.w / 2 + 0.8, 1.0);
      const b2 = makeBarrel(); b2.position.set(-b.w / 2 + 1.3, 0, fz + F * 1.5); g.add(b2);
      const table = new THREE.Group();
      table.add(cyl(0.45, 0.45, 0.06, lam({ map: woodTex() }), 0, 0.75, 0, 10));
      table.add(cyl(0.06, 0.08, 0.72, lam({ color: PAL.woodD }), 0, 0.37, 0, 6));
      put(table, b.w / 2 - 1.4, 1.6);
      for (const [sx, sz] of [[0.75, 0], [-0.7, 0.4]]) {
        const stool = cyl(0.18, 0.2, 0.45, lam({ map: woodTex() }), b.w / 2 - 1.4 + sx, 0.22, fz + F * (1.6 + sz), 7);
        g.add(stool);
      }
      // 串灯（横挂门头）
      const sl = makeStringLights(b.w * 0.9);
      sl.position.set(0, 0.15, fz + F * 0.5); if (F === -1) sl.rotation.y = Math.PI;
      g.add(sl);
      glowMats.push(...sl.userData.glowMats);
      anims.push((dt, t) => {
        sl.userData.glowMats.forEach((m, i) => { m.emissiveIntensity = 1.0 + Math.sin(t * 3 + i * 1.7) * 0.35; });
      });
      // 后侧赌场小霓虹牌（靠近 casino_door POI：建筑东侧偏后）
      const neo = new THREE.Group();
      neo.add(box(0.1, 1.6, 0.1, lam({ map: metalTex() }), 0, 0.8, 0));
      const neoTex = makeTexture(48, 32, (gg) => {
        gg.fillStyle = '#1A1222'; gg.fillRect(0, 0, 48, 32);
        gg.strokeStyle = '#FF5AD8'; gg.lineWidth = 2; gg.strokeRect(2, 2, 44, 28);
        gg.fillStyle = '#FF8AE8'; gg.font = 'bold 11px "Microsoft YaHei", sans-serif';
        gg.textAlign = 'center'; gg.textBaseline = 'middle';
        gg.fillText('赌场', 24, 12);
        gg.fillStyle = '#8AD8FF'; gg.fillText('★', 24, 24);
      });
      const neoMat = new THREE.MeshLambertMaterial({ map: neoTex, emissive: 0xff5ad8, emissiveIntensity: 1.2, side: THREE.DoubleSide });
      const neoBd = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.75), neoMat);
      neoBd.position.y = 1.9; neoBd.rotation.y = Math.PI / 2;
      neo.add(neoBd);
      neo.position.set(b.w / 2 + 1.1, 0, -F * (b.d / 2 - 1.2));
      g.add(neo); glowMats.push(neoMat);
      anims.push((dt, t) => { neoMat.emissiveIntensity = 1.1 + Math.sin(t * 5) * 0.35 + (Math.sin(t * 17) > 0.93 ? -0.7 : 0); });
      break;
    }
    case 'fishshop': { // 渔具店：渔网挂墙 + 鱼竿架 + 浮球串 + 门口小木船
      const net = makeFishNet(1.8, 1.3);
      net.position.set(-b.w / 2 - 0.06, 1.5, 0.3); net.rotation.y = -Math.PI / 2;
      g.add(net);
      const rack = new THREE.Group(); // 鱼竿架（斜靠几根竿）
      rack.add(box(0.7, 0.3, 0.25, lam({ map: woodTex() }), 0, 0.15, 0));
      for (let i = 0; i < 4; i++) {
        const rod = cyl(0.015, 0.02, 1.9, lam({ color: i % 2 ? '#8A5A2A' : '#5A7A4A' }), -0.25 + i * 0.17, 0.9, 0, 4);
        rod.rotation.z = 0.22;
        rack.add(rod);
      }
      put(rack, b.w / 2 - 0.8, 0.9, -0.3);
      // 浮球串（红白相间）
      const buoys = new THREE.Group();
      const ropeB = box(1.6, 0.02, 0.02, lam({ color: '#8A7A5A' }), 0, 1.9, 0);
      buoys.add(ropeB);
      for (let i = 0; i < 5; i++) {
        const bu = cyl(0.09, 0.09, 0.16, lam({ color: i % 2 ? '#E84A3C' : '#F0E8D8' }), -0.64 + i * 0.32, 1.78, 0, 6);
        buoys.add(bu);
      }
      buoys.position.set(0, 0, fz + F * 0.15); if (F === -1) buoys.rotation.y = Math.PI;
      g.add(buoys);
      put(makeRowboat(), -b.w / 2 + 1.6, 1.8, 0.35);
      break;
    }
    case 'cc': { // 旧会馆：强化废墟——断柱 + 倒塌横梁 + 藤蔓杂草 + 裂石阶
      const col1 = makeBrokenColumn(1.7); put(col1, -b.w / 2 + 1.2, 1.0);
      const col2 = makeBrokenColumn(0.9); put(col2, b.w / 2 - 1.4, 0.9);
      // 倒地柱段
      const sm = lam({ map: stoneTex() });
      const fallen = cyl(0.2, 0.2, 1.6, sm, b.w / 2 - 0.6, 0.2, fz + F * 1.6, 8);
      fallen.rotation.z = Math.PI / 2; fallen.rotation.y = 0.4;
      g.add(fallen);
      // 倒塌横梁（斜搭在墙面）
      const beam = box(3.4, 0.22, 0.22, lam({ map: barkTex() }), -1.2, 1.1, fz + F * 0.6);
      beam.rotation.z = 0.5; beam.rotation.y = 0.2;
      g.add(beam);
      const beam2 = box(2.6, 0.2, 0.2, lam({ color: shade(PAL.woodD, -16) }), 1.8, 0.5, fz + F * 1.2, 0.7);
      beam2.rotation.z = -0.22;
      g.add(beam2);
      // 藤蔓爬上墙面
      for (const [vx, vh] of [[-b.w / 2 + 0.4, 2.2], [b.w / 2 - 0.5, 1.6], [0.8, 1.2]]) {
        const v = makeVine(vh);
        v.position.set(vx, 0, fz + F * 0.12);
        g.add(v);
      }
      const v2 = makeVine(1.5);
      v2.position.set(-b.w / 2 - 0.08, 0, -0.5); v2.rotation.y = -Math.PI / 2;
      g.add(v2);
      // 丛生杂草
      for (let i = 0; i < 6; i++) {
        const r = rng(hashStr('ccweed' + i));
        const tuft = makeGrassTuft(season);
        tuft.position.set(-b.w / 2 + r() * b.w, 0, fz + F * (0.6 + r() * 1.2));
        g.add(tuft);
      }
      // 裂纹石阶（错位碎石板）
      for (let i = 0; i < 3; i++) {
        const slab = box(0.9 - i * 0.1, 0.1, 0.5, sm, (i % 2 ? 0.14 : -0.1), 0.05 + i * 0.02, fz + F * (0.5 + i * 0.45), (i - 1) * 0.12);
        g.add(slab);
      }
      break;
    }
    case 'teahouse': { // 茶馆：石灯笼一对 + 竹丛 + 青瓦檐口 + 小石径
      const l1 = makeStoneLantern(); put(l1, -1.6, 1.0);
      const l2 = makeStoneLantern(); put(l2, 1.6, 1.0);
      glowMats.push(l1.userData.glowMat, l2.userData.glowMat);
      const bm1 = makeBamboo(5); side(bm1, -1, -0.4);
      const bm2 = makeBamboo(4); side(bm2, -1, 0.8);
      side(makeBamboo(3), 1, 0.2);
      // 青瓦檐口（门楣上方一条青瓦装饰带）
      const eaveTex = stripeTex(['#3E8E96', '#2E6E76', '#3E8E96', '#4A9EA6']);
      eaveTex.wrapS = THREE.RepeatWrapping; eaveTex.repeat.set(6, 1);
      const eave = box(b.w * 0.7, 0.18, 0.3, lam({ map: eaveTex }), 0, 2.15, fz + F * 0.18);
      g.add(eave);
      put(makeStonePath(F), 0, 0);
      break;
    }
    case 'library': { // 图书馆：还书箱 + 阅读长椅 + 门旁灯笼 + 公告栏
      const ret = new THREE.Group(); // 还书箱
      ret.add(box(0.6, 0.8, 0.5, lam({ color: '#4A5A8A' }), 0, 0.4, 0));
      ret.add(box(0.5, 0.06, 0.4, lam({ color: '#3A4A6E' }), 0, 0.66, 0.03));
      const retTex = makeTexture(32, 16, (gg) => {
        gg.fillStyle = '#3A4A6E'; gg.fillRect(0, 0, 32, 16);
        gg.fillStyle = '#F0E8D8'; gg.font = 'bold 9px "Microsoft YaHei", sans-serif';
        gg.textAlign = 'center'; gg.textBaseline = 'middle';
        gg.fillText('还书箱', 16, 9);
      });
      const retFace = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), lam({ map: retTex }));
      retFace.position.set(0, 0.45, 0.26);
      ret.add(retFace);
      put(ret, -b.w / 2 + 1.0, 0.9);
      put(makeBench(), b.w / 2 - 1.6, 1.2, F === 1 ? Math.PI : 0);
      const lan = makeStoneLantern(); put(lan, -b.w / 2 + 1.9, 0.9);
      glowMats.push(lan.userData.glowMat);
      put(makeNoticeBoard(), b.w / 2 + 0.9, 0.4, -Math.PI / 2);
      break;
    }
    case 'tailor': { // 裁缝铺：彩布雨棚 + 人台模特 + 晾晒布绳
      const aw = makeAwning(b.w * 0.75, ['#B84A6A', '#E8A83C', '#4A7AB8', '#7A4A9E']);
      aw.position.set(0, 0, fz + F * 0.05); if (F === -1) aw.rotation.y = Math.PI;
      g.add(aw);
      put(makeMannequin('#B84A6A'), -b.w / 2 + 0.9, 1.0, 0.3);
      put(makeMannequin('#4A7AB8'), b.w / 2 - 0.9, 1.1, -0.4);
      const line = makeClothesline(['#E87A9A', '#8AD8FF', '#A8DF8A'], 2.6);
      side(line, 1, 0.3, Math.PI / 2);
      break;
    }
    case 'house1': { // 民居·槐：花盆 + 小栅栏 + 小长椅（爱花住户）
      put(makeFlowerPots(season, 2), -b.w / 2 + 1.1, 0.9);
      put(makeFlowerPots(season, 1), b.w / 2 - 0.9, 1.0);
      const f = makeFence(2); f.position.set(-b.w / 2 - 0.6, 0, 0.5); f.rotation.y = Math.PI / 2; g.add(f);
      put(makeBench(), b.w / 2 - 1.3, 1.5, F === 1 ? Math.PI : 0);
      break;
    }
    case 'house2': { // 民居·杨：柴堆 + 树桩斧头 + 木桶（勤快住户）
      side(makeWoodPile(), 1, -0.3, 0.2);
      const wp = makeWoodPile(); wp.position.set(b.w / 2 + 0.9, 0, 0.6); g.add(wp);
      side(makeStump(), 1, 1.0);
      put(makeBarrel(), -b.w / 2 + 0.8, 0.9);
      break;
    }
    case 'house3': { // 民居·柳：晾衣绳 + 花盆 + 小水井桶
      const line = makeClothesline(['#F0E8D8', '#8AD8FF'], 2.2);
      side(line, -1, 0.2, Math.PI / 2);
      put(makeFlowerPots(season, 1), b.w / 2 - 0.9, 0.9);
      put(makeBarrel(), -b.w / 2 + 0.9, 1.1);
      break;
    }
    case 'house4': { // 民居·梅：小栅栏菜园 + 花盆（种菜住户）
      const garden = makeVeggieGarden();
      side(garden, 1, 0.2);
      put(makeFlowerPots(season, 1), -b.w / 2 + 0.9, 0.9);
      break;
    }
    case 'house5': { // 民居·杏：柴堆 + 花盆 + 鸟屋杆（爱鸟住户）
      side(makeWoodPile(), -1, 0.4, -0.3);
      put(makeFlowerPots(season, 2), b.w / 2 - 1.2, 0.9);
      const bird = new THREE.Group(); // 鸟屋杆
      bird.add(cyl(0.035, 0.045, 1.5, lam({ color: PAL.woodD }), 0, 0.75, 0, 5));
      bird.add(box(0.3, 0.26, 0.26, lam({ map: woodTex() }), 0, 1.55, 0));
      const broof = cyl(0.02, 0.26, 0.18, lam({ color: '#B8543E' }), 0, 1.76, 0, 4);
      bird.add(broof);
      put(bird, -b.w / 2 + 0.9, 1.2);
      break;
    }
    // farmhouse：绝不装饰（builder 中也不会调用）
    default:
      break;
  }

  g.position.set(b.x, 0, b.z);
  g.traverse((o) => { if (o.isMesh && o.castShadow === false && !o.material.transparent) o.castShadow = true; });
  g.userData.anims = anims;
  g.userData.glowMats = glowMats;
  return g;
}
