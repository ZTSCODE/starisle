// 汐溪谷·一体化世界构建器：按 layout.js 绘制多地形底图、摆放建筑/设施/植被，并提供统一碰撞
import * as THREE from 'three';
import { PAL, shade, mkCanvas, makeTexture, leafSprite, barkTex, stoneTex, woodTex, hayTex } from '../render/textures.js';
import { rng, hashStr } from '../core/rng.js';
import { makeBuilding } from './scenekit.js';
import { makeFountain, makeCafeSet, makeASign, makeWoodpile, makeToolRack, makeBeehouses, makeWheelbarrow, makeTrough, makeRowboat, makeNetRack, makeBuoyLine, makeBeachSet, makeCampsite, makeStoneCircle, makeFishingDock, makeOreCart, makeWarningSign, makeTownWell, makeGazebo, makeBlossomTree } from './vignettes.js';
import { makeTree, makeRock, makeGrassTuft, makeLamp, makeFence, makeBush, makeFlowerPatch, makeHayBale, makeCrate, makeBarrel, makeFallenLog, makeWell, makePlanter, makeDriftwood, makeFern } from './proto.js';
import { makeAnimatedWater, makeStoneBridge, makePier, makeNoticeBoard, makeSignBoard, makeBench } from './scenekit.js';
import { BIOMES, ROADS, WATERS, BUILDINGS, POI, SCATTER, DECOR, CLIFF_RECTS, FARM_PLOT } from './layout.js';
import { REGIONS } from './seamless.js';
import { decorateExterior } from './exteriors.js';

const RES = 8;
export const WB = { x0: -48, z0: -48, w: 192, h: 160 };

// ================= 碰撞（单一权威） =================
export let quarryUnlocked = false;
export function unlockQuarry() { quarryUnlocked = true; }
function distToSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
export function collisionAt(x, z) {
  return collisionInfo(x, z).type;
}
// 碰撞诊断：返回类型与来源（开发模式 hover 显示用）
export function collisionInfo(x, z) {
  if (x < WB.x0 || z < WB.z0 || x >= WB.x0 + WB.w || z >= WB.z0 + WB.h) return { type: 'blocked', source: 'world-bound' };
  {
    const P = DECOR.pier;
    if (P && Math.abs(x - P.from[0]) <= P.w / 2 && z >= Math.min(P.from[1], P.to[1]) - 0.3 && z <= Math.max(P.from[1], P.to[1]) + 0.3) return { type: 'walk', source: 'pier-deck' };
  }
  for (let i = 0; i < CLIFF_RECTS.length; i++) {
    if (i === 1 && quarryUnlocked) continue;
    const [cx, cz, w, h] = CLIFF_RECTS[i];
    if (x >= cx && x < cx + w && z >= cz && z < cz + h) return { type: 'blocked', source: `cliff#${i}` };
  }
  for (const w of WATERS) {
    if (w.kind === 'sea') { const [rx, rz, rw, rh] = w.rect; if (x >= rx && x < rx + rw && z >= rz && z < rz + rh) return { type: 'water', source: w.id }; }
    else if (w.kind === 'lake') { const [cx, cz, rx, rz] = w.ellipse; const dx = (x - cx) / rx, dz = (z - cz) / rz; if (dx * dx + dz * dz < 1) return { type: 'water', source: w.id }; }
    else if (w.kind === 'river') {
      const pts = w.pts;
      for (let i = 0; i < pts.length - 1; i++) if (distToSeg(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) < w.w / 2) return { type: 'water', source: w.id };
    }
  }
  for (const b of BUILDINGS) {
    if (Math.abs(x - b.x) < b.w / 2 + 0.3 && Math.abs(z - b.z) < b.d / 2 + 0.3) return { type: 'blocked', source: `building:${b.id}` };
  }
  for (const f of DECOR.fences) {
    for (let i = 0; i < f.pts.length - 1; i++) if (distToSeg(x, z, f.pts[i][0], f.pts[i][1], f.pts[i + 1][0], f.pts[i + 1][1]) < 0.35) return { type: 'blocked', source: 'fence' };
  }
  if (dynamicBlocked.has(`${Math.floor(x)},${Math.floor(z)}`)) return { type: 'blocked', source: 'placed-fence' };
  return { type: 'walk', source: null };
}
// 玩家摆放物动态碰撞（栅栏等，key 为整数格）
export const dynamicBlocked = new Set();
export function onRoad(x, z) {
  for (const rd of ROADS) {
    for (let i = 0; i < rd.pts.length - 1; i++) if (distToSeg(x, z, rd.pts[i][0], rd.pts[i][1], rd.pts[i + 1][0], rd.pts[i + 1][1]) < rd.w / 2 + 0.6) return true;
  }
  return false;
}
export function biomeAt(x, z) {
  for (const b of BIOMES) {
    const [bx, bz, bw, bh] = b.rect;
    if (x >= bx && x < bx + bw && z >= bz && z < bz + bh) return b.type;
  }
  return null;
}

// ================= 底图绘制 =================
export function paintUnifiedGround(season) {
  const W = WB.w * RES, H = WB.h * RES;
  const c = mkCanvas(W, H), g = c.getContext('2d');
  const r = rng(hashStr('valley' + season));
  const grass = PAL.grass[season], grassD = PAL.grassD[season];
  const X = (wx) => (wx - WB.x0) * RES, Z = (wz) => (wz - WB.z0) * RES;
  const inRect = (px, pz, rc) => px >= rc[0] && px < rc[0] + rc[2] && pz >= rc[1] && pz < rc[1] + rc[3];

  // ---- 1. 草甸基底 ----
  g.fillStyle = grass; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = r() < 0.5 ? grassD : shade(grass, 16);
    g.globalAlpha = 0.05 + r() * 0.08;
    g.beginPath(); g.arc(r() * W, r() * H, 4 + r() * 18, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = r() < 0.6 ? grassD : shade(grass, 14);
    g.fillRect(Math.floor(r() * W), Math.floor(r() * H), 1 + Math.floor(r() * 2), 1);
  }

  // ---- 2. 生物群系专属地表（每群系独立质感，晕染过渡） ----
  const biomeOf = (wx, wz) => {
    for (const b of BIOMES) if (inRect(wx, wz, b.rect)) return b.type;
    return 'farm';
  };
  // 逐 2px 区块做群系质感（带边界抖动打散）
  for (let py = 0; py < H; py += 2) {
    for (let px = 0; px < W; px += 2) {
      const wx = WB.x0 + px / RES, wz = WB.z0 + py / RES;
      const t = biomeOf(wx + (r() - 0.5) * 1.6, wz + (r() - 0.5) * 1.6);
      if (t === 'forest') {
        g.fillStyle = r() < 0.55 ? shade(grass, -18) : shade(grassD, -8);
        g.globalAlpha = 0.55; g.fillRect(px, py, 2, 2);
        if (r() < 0.06) { g.fillStyle = shade(PAL.leaf[season], -20); g.globalAlpha = 0.7; g.fillRect(px, py, 2, 1); }
      } else if (t === 'mountain') {
        g.fillStyle = r() < 0.55 ? '#8A9A6A' : '#7A8A5C';
        g.globalAlpha = 0.6; g.fillRect(px, py, 2, 2);
        if (r() < 0.09) { g.fillStyle = r() < 0.5 ? PAL.stone : PAL.stoneD; g.globalAlpha = 0.85; g.fillRect(px, py, 2, 1); }
      } else if (t === 'beach') {
        g.fillStyle = r() < 0.55 ? shade(PAL.sand, -8) : shade(PAL.sand, -18);
        g.globalAlpha = 0.85; g.fillRect(px, py, 2, 2);
      } else if (t === 'town') {
        if (r() < 0.3) { g.fillStyle = shade(grass, 6); g.globalAlpha = 0.35; g.fillRect(px, py, 2, 2); }
      }
    }
  }
  g.globalAlpha = 1;

  // ---- 3. 海洋（岸线梯度 + 泡沫 + 波纹） ----
  for (const w of WATERS.filter((x) => x.kind === 'sea')) {
    const [rx, rz, rw, rh] = w.rect;
    const gx = X(rx), gz = Z(rz), gw = rw * RES, gh = rh * RES;
    // 浅水带 → 深海
    g.fillStyle = shade(PAL.water[season], 6); g.fillRect(gx, gz, gw, gh);
    g.fillStyle = shade(PAL.water[season], -10);
    if (rx >= 90) g.fillRect(gx + 18, gz, gw - 18, gh); else g.fillRect(gx, gz + 14, gw, gh - 14);
    for (let i = 0; i < 900; i++) {
      const px = gx + r() * gw, pz = gz + r() * gh;
      g.fillStyle = r() < 0.5 ? shade(PAL.water[season], -24) : shade(PAL.water[season], 10);
      g.fillRect(px, pz, 3 + r() * 7, 1);
    }
    // 泡沫已由动态水面与岸线纹理表达，不再绘制虚线点列
  }

  // ---- 4. 湖与河（岸线 + 水波） ----
  const waterBody = (cx, cz, rx, rz) => {
    g.fillStyle = shade(PAL.sand, -24);
    g.beginPath(); g.ellipse(X(cx), Z(cz), (rx + 4.5) * RES, (rz + 4.5) * RES, 0, 0, 7); g.fill();
    g.fillStyle = PAL.water[season];
    g.beginPath(); g.ellipse(X(cx), Z(cz), rx * RES, rz * RES, 0, 0, 7); g.fill();
    for (let i = 0; i < 24; i++) {
      g.fillStyle = 'rgba(255,255,255,0.4)';
      g.fillRect(X(cx) - rx * RES + r() * rx * 2 * RES, Z(cz) - rz * RES + r() * rz * 2 * RES, 3 + r() * 5, 1);
    }
  };
  for (const w of WATERS.filter((x) => x.kind === 'lake')) waterBody(...w.ellipse);

  // ---- 5. 广场（石板） ----
  g.fillStyle = '#B8B0A0';
  g.beginPath(); g.ellipse(X(28), Z(66), 9 * RES, 7 * RES, 0, 0, 7); g.fill();
  g.strokeStyle = '#A09888'; g.lineWidth = 1;
  for (let x = -9; x <= 9; x += 2) { g.beginPath(); g.moveTo(X(28 + x), Z(59)); g.lineTo(X(28 + x), Z(73)); g.stroke(); }
  for (let z = -7; z <= 7; z += 2) { g.beginPath(); g.moveTo(X(19), Z(66 + z)); g.lineTo(X(37), Z(66 + z)); g.stroke(); }
  // ---- 5b. 西巷公园（花草园圃） ----
  g.fillStyle = shade(grass, 10);
  g.beginPath(); g.ellipse(X(-22), Z(72), 8 * RES, 7 * RES, 0, 0, 7); g.fill();
  for (let i = 0; i < 160; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const px = X(-22 + Math.cos(a) * d * 7.4), py = Z(72 + Math.sin(a) * d * 6.4);
    g.fillStyle = ['#FFC9DD', '#FFF0F4', '#FFD98A', '#E87A9A', '#B87AE8'][Math.floor(r() * 5)];
    g.globalAlpha = 0.8; g.fillRect(px, py, 2, 2);
  }
  g.globalAlpha = 1;

  // ---- 6. 路网（土路车辙 / 石板 / 沙径） ----
  for (const rd of ROADS) {
    const col = rd.type === 'cobble' ? '#B0A890' : rd.type === 'sand' ? shade(PAL.sand, -14) : PAL.path;
    const dark = rd.type === 'cobble' ? '#948A72' : shade(col, -16);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = dark; g.lineWidth = rd.w * RES + 3;
    g.beginPath(); rd.pts.forEach(([x, z], i) => i === 0 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z))); g.stroke();
    g.strokeStyle = col; g.lineWidth = rd.w * RES;
    g.beginPath(); rd.pts.forEach(([x, z], i) => i === 0 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z))); g.stroke();
    if (rd.type === 'cobble') {
      g.fillStyle = dark;
      for (let i = 0; i < rd.pts.length - 1; i++) {
        const [ax, az] = rd.pts[i], [bx, bz] = rd.pts[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        for (let d = 0; d < len; d += 1.1) {
          const t = d / len, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
          if (r() < 0.75) g.fillRect(X(x + (r() - 0.5) * rd.w * 0.6), Z(z + (r() - 0.5) * rd.w * 0.6), 2, 1);
        }
      }
    } else {
      // 车辙两条
      g.strokeStyle = dark; g.lineWidth = 1; g.globalAlpha = 0.5;
      for (const off of [-rd.w * 0.22, rd.w * 0.22]) {
        g.beginPath(); rd.pts.forEach(([x, z], i) => i === 0 ? g.moveTo(X(x), Z(z) + off * RES) : g.lineTo(X(x), Z(z) + off * RES)); g.stroke();
      }
      g.globalAlpha = 1;
    }
  }

  // ---- 7. 农田（垄沟 + 农舍前院土场） ----
  {
    const [fx, fz, fw, fh] = FARM_PLOT;
    g.fillStyle = PAL.till; g.fillRect(X(fx), Z(fz), fw * RES, fh * RES);
    for (let y = 0; y < fh * RES; y += 4) {
      g.fillStyle = shade(PAL.till, -16); g.fillRect(X(fx), Z(fz) + y, fw * RES, 2);
      g.fillStyle = shade(PAL.till, 12); g.fillRect(X(fx), Z(fz) + y + 2, fw * RES, 1);
    }
    g.fillStyle = shade(PAL.dirt, -6);
    g.beginPath(); g.ellipse(X(22), Z(14), 7 * RES, 5 * RES, 0, 0, 7); g.fill();
    for (let i = 0; i < 60; i++) { g.fillStyle = shade(PAL.dirt, r() < 0.5 ? -14 : 8); g.fillRect(X(22) - 7 * RES + r() * 14 * RES, Z(14) - 5 * RES + r() * 10 * RES, 2, 1); }
  }

  // ---- 8. 细节点缀 ----
  // 水面睡莲（各湖泊）
  for (const w of WATERS.filter((x) => x.kind === 'lake')) {
    const [cx, cz, rx, rz] = w.ellipse;
    for (let i = 0; i < 6; i++) {
      const a = r() * Math.PI * 2, d = 0.3 + r() * 0.55;
      const lx = X(cx + Math.cos(a) * rx * d), lz = Z(cz + Math.sin(a) * rz * d);
      g.fillStyle = '#3E8B3A';
      g.beginPath(); g.arc(lx, lz, 2, 0.4, Math.PI * 1.8); g.fill();
      if (r() < 0.4) { g.fillStyle = '#FFC9DD'; g.fillRect(lx, lz - 1, 2, 2); }
    }
  }
  // 花（春夏）/ 落叶（秋）/ 蘑菇（森林）/ 香蒲（水边）/ 贝壳（海滩）
  for (let i = 0; i < 160; i++) {
    if (season > 1) break;
    g.fillStyle = r() < 0.5 ? PAL.flower : '#FFF8DC';
    g.fillRect(r() * W, r() * H, 2, 2);
  }
  if (season === 2) for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? '#E8873A' : '#C94F3D'; g.fillRect(r() * W, r() * H, 2, 1); }
  for (let i = 0; i < 40; i++) { // 森林蘑菇圈
    const x = 52 + r() * 40, z = 12 + r() * 32;
    g.fillStyle = '#C8B8A8'; g.fillRect(X(x), Z(z), 1, 2); g.fillStyle = '#B84A4A'; g.fillRect(X(x) - 1, Z(z) - 1, 3, 1);
  }
  for (const w of WATERS.filter((x) => x.kind === 'lake')) {
    const [cx, cz, rx, rz] = w.ellipse;
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2;
      g.fillStyle = '#4A7A3A';
      g.fillRect(X(cx + Math.cos(a) * (rx + 2)), Z(cz + Math.sin(a) * (rz + 2)), 1, 3);
    }
  }
  for (let i = 0; i < 30; i++) { // 海滩贝壳
    const x = 58 + r() * 36, z = 52 + r() * 26;
    g.fillStyle = r() < 0.5 ? '#F0E8E0' : '#E8C8D8';
    g.fillRect(X(x), Z(z), 2, 1);
  }
  // 山崖层理（北缘）
  g.fillStyle = '#5E584C';
  for (let x = 0; x < W; x += 4) {
    g.fillRect(x, Z(-47) + Math.floor(r() * 3), 3, 2);
    if (r() < 0.5) g.fillRect(x, Z(-44) + Math.floor(r() * 4), 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ================= 世界构建 =================
export class WorldBuilder {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group();
    this.propGroups = new Map();
    this.waters = [];
  }
  build(season) {
    const g = this.game;
    // 底图
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WB.w, WB.h),
      new THREE.MeshLambertMaterial({ map: paintUnifiedGround(season) })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(WB.x0 + WB.w / 2, -0.01, WB.z0 + WB.h / 2);
    ground.receiveShadow = true;
    ground.name = 'unifiedGround';
    this.group.add(ground);
    // 动态水面
    for (const w of WATERS) {
      if (!w.animated) continue;
      if (w.kind === 'sea') {
        const [rx, rz, rw, rh] = w.rect;
        const water = makeAnimatedWater(rw, rh, season, { opacity: 0.97, glintOpacity: 0.3 });
        water.position.set(rx + rw / 2, 0.02, rz + rh / 2);
        this.group.add(water);
        this.waters.push(water);
      } else if (w.kind === 'lake') {
        const [cx, cz, rx, rz] = w.ellipse;
        const water = makeAnimatedWater(rx * 1.9, rz * 1.9, season, { opacity: 0.9, glintOpacity: 0.4 });
        water.position.set(cx, 0.02, cz);
        this.group.add(water);
        this.waters.push(water);
      }
    }
    this.buildBuildings(season);
    this.buildDecor(season);
    this.enrichDecor(season);
    this.buildVignettes(season);
    this.buildNature(season);
    return this;
  }
  // 主题 vignette：中大型组合摆件，按区域主题摆放（全部零碰撞）
  buildVignettes(season) {
    const put = (m, x, z, ry = 0) => { m.position.set(x, 0, z); m.rotation.y = ry; this.group.add(m); return m; };
    this.jetTexs = []; this.bobGroups = [];
    // ── 镇（人文气息）：喷泉(广场中央) + 露天咖啡座 + 广告牌 + 老井 ──
    const fountain = put(makeFountain(), 30, 69);
    if (fountain.userData.jetTex) this.jetTexs.push(fountain.userData.jetTex);
    put(makeCafeSet('#B8543E'), 40.5, 75.5, 0.4);
    put(makeCafeSet('#4A7AB8'), 47.5, 75.5, -0.6);
    put(makeASign('特价'), 23.2, 65.8, 0.3);
    put(makeASign('开锅'), 35.6, 65.8, -0.4);
    put(makeASign('新品'), 45.8, 78.2, 0.9);
    put(makeTownWell(), 13, 57);
    // ── 农场（劳作感）：柴堆 + 工具架 + 蜂箱 + 手推车 + 水槽 ──
    put(makeWoodpile(), 16, 10, 0.3);
    put(makeToolRack(), 9, 38.5, 0);
    put(makeBeehouses(), 29, 44, 0.15);
    put(makeWheelbarrow(), 8.5, 41.5, 0.8);
    put(makeTrough(), 11, 30, 0.1);
    // ── 海滩（渔港感）：渔船×2 + 渔网架 + 浮标线 + 沙滩伞 ──
    put(makeRowboat(0.1, '#8A5A2A'), 80, 76, 2.6);
    put(makeRowboat(0, '#5A7A8A'), 68, 77, -0.5);
    put(makeNetRack(), 72, 68, 0.9);
    const buoys = put(makeBuoyLine(5, 2.2), 82, 85, 0.2);
    this.bobGroups.push(buoys);
    put(makeBeachSet('#E8873A'), 62, 72, 0.5);
    // ── 森林（野趣）：营地 + 立石阵 + 湖畔垂钓台 ──
    put(makeCampsite(), 65.5, 33.5, -0.7);
    put(makeStoneCircle(5, 2.2), 78, 42, 0.3);
    put(makeFishingDock(), 70, 22.8, 0);
    // ── 山地（矿业感）：矿车 + 警示牌 ──
    put(makeOreCart(), 26.2, -24.5, 0.25);
    put(makeWarningSign(), 21.4, -24.3, 0.5);
    // ── 西巷公园：凉亭 + 樱花树 + 长椅（与镇东商业区不同的居住休闲氛围） ──
    put(makeGazebo(), -21, 71);
    for (const [x, z, s] of [[-27, 66, 1.1], [-18, 67, 0.9], [-28, 77, 1.0], [-17, 79, 1.15], [-25, 81, 0.85]]) {
      put(makeBlossomTree(s), x, z, (x * 7 + z) % 3);
    }
  }
  enrichDecor(season) {
    const g = this.game;
    const put = (m, x, z) => { m.position.set(x, 0, z); this.group.add(m); };
    // 农场：水井（田边）/干草捆（畜牧区）/木箱（出货箱旁）/花圃（沿路）
    put(makeWell(), 16, 41);
    put(makeHayBale(), 10, 26); put(makeHayBale(), 11.2, 26.4);
    put(makeCrate(1), 29.4, 12.8); put(makeCrate(0.7), 29.9, 12.2);
    put(makeBarrel(), 30.5, 12.6);
    for (const [x, z] of [[12, 22], [26, 18], [20, 26], [34, 22], [14, 36], [40, 14]]) put(makeFlowerPatch(season), x, z);
    for (const [x, z] of [[4, 18], [4, 22], [46, 10], [46, 36]]) put(makeBush(season), x, z);
    // 镇：花箱（各店门口）/木桶（酒吧后）/旗帜已含/花圃点缀
    for (const [x, z] of [[19, 64.6], [23, 64.6], [32, 64.6], [36, 64.6], [42, 77.2], [46, 77.2], [52, 59.6]]) put(makePlanter(season), x, z);
    put(makeBarrel(), 47.5, 83); put(makeBarrel(), 47.9, 83.4);
    put(makeCrate(0.9), 24, 67.8); put(makeCrate(0.6), 24.5, 67.4);
    for (const [x, z] of [[16, 58], [38, 56], [30, 70], [44, 62], [12, 80], [52, 78]]) put(makeFlowerPatch(season), x, z);
    // 森林：倒木/蕨类/灌木
    for (const [x, z] of [[58, 14], [66, 30], [78, 22], [84, 14], [62, 40]]) put(makeFallenLog(), x, z);
    for (const [x, z] of [[54, 18], [60, 26], [68, 12], [74, 32], [80, 18], [86, 26], [58, 38], [90, 20]]) put(makeFern(season), x, z);
    for (const [x, z] of [[52, 34], [70, 42], [88, 36], [64, 8]]) put(makeBush(season), x, z);
    // 海滩：漂流木/灌木
    for (const [x, z] of [[64, 58], [72, 76], [84, 54], [90, 74]]) put(makeDriftwood(), x, z);
    for (const [x, z] of [[58, 52], [60, 78]]) put(makeBush(season), x, z);
    // 山路：碎石堆/灌木
    for (const [x, z] of [[10, -14], [34, -10], [16, -26], [38, -22]]) put(makeBush(season), x, z);
    // 车灯款大篷车已被布局引用，这里加一辆常驻木车（镇广场旁）
    const cart = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 1), new THREE.MeshLambertMaterial({ color: '#9A6B3F', flatShading: true }));
    bed.position.y = 0.5;
    for (const dx of [-0.7, 0.7]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 8), new THREE.MeshLambertMaterial({ color: '#3A2A20' }));
      wheel.rotation.z = Math.PI / 2; wheel.position.set(dx, 0.28, 0.55);
      cart.add(wheel);
    }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5), new THREE.MeshLambertMaterial({ color: '#7A5230' }));
    shaft.rotation.x = Math.PI / 2 - 0.3; shaft.position.set(0, 0.5, 1.2);
    cart.add(bed, shaft);
    put(cart, 32, 68);
    // 风车（农场东地标，叶片旋转）
    {
      const g2 = new THREE.Group();
      const towerMat = new THREE.MeshLambertMaterial({ map: stoneTex() });
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 4.5, 7), towerMat);
      tower.position.y = 2.25; tower.castShadow = true;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.2, 7), new THREE.MeshLambertMaterial({ color: '#B8543E', flatShading: true }));
      roof.position.y = 5.1;
      const hub = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.6), new THREE.MeshLambertMaterial({ color: '#E8DCC8', side: THREE.DoubleSide }));
        blade.position.set(0, 1.3, 0);
        const arm = new THREE.Group();
        arm.add(blade);
        arm.rotation.z = (i / 4) * Math.PI * 2;
        hub.add(arm);
      }
      hub.position.set(0, 4.6, 1.1);
      g2.add(tower, roof, hub);
      g2.position.set(38, 0, 16);
      this.group.add(g2);
      this.windmillHub = hub;
    }
    // 市集摊 ×3（广场，彩条棚）
    for (const [x, z, col] of [[21, 66, '#B8543E'], [35, 66, '#4A7AB8'], [28, 72.5, '#4AA84A']]) {
      const stall = new THREE.Group();
      const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.9), new THREE.MeshLambertMaterial({ map: woodTex() }));
      table.position.y = 0.35; table.castShadow = true;
      for (const dx of [-0.8, 0.8]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), new THREE.MeshLambertMaterial({ map: barkTex() }));
        pole.position.set(dx, 0.9, -0.4);
        stall.add(pole);
      }
      const awning = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 1.2), new THREE.MeshLambertMaterial({ color: col, flatShading: true }));
      awning.position.set(0, 1.8, 0);
      awning.rotation.x = -0.15;
      stall.add(table, awning);
      // 货物
      for (let i = 0; i < 4; i++) {
        const good = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshLambertMaterial({ color: ['#E84A4A', '#E8A84A', '#8AE84A', '#7AB8E8'][i], flatShading: true }));
        good.position.set(-0.6 + i * 0.4, 0.82, 0);
        stall.add(good);
      }
      put(stall, x, z);
    }
    // 晾衣绳（农舍旁）
    {
      const line = new THREE.Group();
      for (const dx of [-1.6, 1.6]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 5), new THREE.MeshLambertMaterial({ map: barkTex() }));
        pole.position.set(dx, 0.8, 0);
        line.add(pole);
      }
      const pts = [new THREE.Vector3(-1.6, 1.5, 0), new THREE.Vector3(0, 1.35, 0), new THREE.Vector3(1.6, 1.5, 0)];
      line.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#E8E0C8' })));
      for (let i = 0; i < 3; i++) {
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), new THREE.MeshLambertMaterial({ color: ['#FFFFFF', '#7AB8E8', '#FFC9DD'][i], side: THREE.DoubleSide }));
        cloth.position.set(-0.8 + i * 0.8, 1.25, 0);
        cloth.userData.flag = true;
        line.add(cloth);
        (this.flags ||= []).push(cloth);
      }
      put(line, 16, 9);
    }
    // 装饰稻草人（农田中央）
    {
      const sc = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ map: hayTex() });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.7, 5), new THREE.MeshLambertMaterial({ map: barkTex() }));
      post.position.y = 0.85;
      const arms = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), new THREE.MeshLambertMaterial({ map: barkTex() }));
      arms.position.y = 1.3;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.7, 6), mat);
      body.position.y = 1.0;
      const headM = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 6), mat);
      headM.position.y = 1.55;
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 6), new THREE.MeshLambertMaterial({ color: '#8A5A2A', flatShading: true }));
      hat.position.y = 1.75;
      sc.add(post, arms, body, headM, hat);
      put(sc, 16, 44);
    }
    // 码头桩（海滩沿岸）
    for (const [x, z] of [[60, 58], [66, 62], [72, 66], [84, 70], [90, 76]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.1, 6), new THREE.MeshLambertMaterial({ map: barkTex() }));
      post.position.set(x, 0.4, z);
      post.castShadow = true;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.12, 6), new THREE.MeshLambertMaterial({ map: woodTex() }));
      cap.position.set(x, 0.98, z);
      this.group.add(post, cap);
    }
  }
  buildBuildings(season) {
    const g = this.game;
    this.extAnims = []; // 防止季节重建重跑时动画回调累积
    for (const b of BUILDINGS) {
      const house = makeBuilding({ w: b.w, d: b.d, face: b.face, roof: b.roof, ruined: !!b.ruined, windows: b.windows || 2, chimney: !b.ruined });
      house.position.set(b.x, 0, b.z);
      this.group.add(house);
      if (b.sign) {
        const sign = makeSignBoard(b.sign, { faceRotY: b.face === 1 ? 0 : Math.PI });
        sign.position.set(b.x + b.w / 2 + 1.4, 0, b.z + b.face * (b.d / 2 + 0.7));
        this.group.add(sign);
      }
      // 室外主题特化装饰（纯视觉，无碰撞）；玩家农舍绝对跳过
      if (b.id !== 'farmhouse') {
        const ext = decorateExterior(b, season);
        this.group.add(ext);
        if (ext.userData.anims?.length) (this.extAnims ||= []).push(...ext.userData.anims);
      }
    }
  }
  buildDecor(season) {
    const g = this.game;
    // 路灯
    for (const [x, z] of DECOR.lamps) {
      const l = makeLamp();
      l.position.set(x, 0, z);
      this.group.add(l);
      (this.lamps ||= []).push(l);
    }
    // 长椅
    for (const [x, z] of DECOR.benches) {
      const b = makeBench();
      b.position.set(x, 0, z);
      this.group.add(b);
    }
    // 旗杆
    for (const [x, z] of DECOR.flags) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.4, 5), new THREE.MeshLambertMaterial({ color: '#8A6A3A' }));
      pole.position.set(x, 1.7, z);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshLambertMaterial({ color: '#E8873A', side: THREE.DoubleSide }));
      flag.position.set(x + 0.48, 2.9, z);
      flag.userData.flag = true;
      this.group.add(pole, flag);
      (this.flags ||= []).push(flag);
    }
    // 栅栏（锚点取小坐标端，视觉与碰撞一致）
    for (const f of DECOR.fences) {
      for (let i = 0; i < f.pts.length - 1; i++) {
        const [ax, az] = f.pts[i], [bx, bz] = f.pts[i + 1];
        const len = Math.round(Math.hypot(bx - ax, bz - az));
        const horizontal = az === bz;
        const fence = makeFence(len, horizontal);
        if (horizontal) fence.position.set(Math.min(ax, bx), 0, az);
        else fence.position.set(ax, 0, Math.min(az, bz));
        this.group.add(fence);
      }
    }
    // 桥
    for (const [x, z, len] of DECOR.bridges) {
      const br = makeStoneBridge(len, 2.6);
      br.position.set(x, 0, z);
      this.group.add(br);
    }
    // 码头（沿 from→to 方向摆正，中心对齐）
    {
      const p = DECOR.pier;
      const dx = p.to[0] - p.from[0], dz = p.to[1] - p.from[1];
      const len = Math.round(Math.hypot(dx, dz));
      const pier = makePier(len, p.w);
      pier.position.set((p.from[0] + p.to[0]) / 2, 0, (p.from[1] + p.to[1]) / 2);
      pier.rotation.y = Math.atan2(-dz, dx);
      this.group.add(pier);
    }
    // 路牌
    for (const [x, z, text] of DECOR.signs) {
      const s = makeSignBoard(text);
      s.position.set(x, 0, z);
      this.group.add(s);
    }
    // 出货箱/信箱/公告板
    this.buildPOI();
    // 北缘山脊（矿洞背后的石墙 + 采石场岩壁 + 地图北缘遮挡）
    this.buildRidge(season);
  }
  // 北缘山脊：三排层叠岩壁 + 采石场西壁，InstancedMesh 两批次（岩+雪顶）
  buildRidge(season) {
    const r = rng(hashStr('ridge'));
    const slabs = []; // [x, y, z, sx, sy, sz, ry]
    // A 排（前崖面 z≈-34，x -16..44，矿口留缺口 x 20..28）
    for (let x = -16; x < 44; x += 2.3 + r() * 0.8) {
      if (x > 19 && x < 28.5) continue;
      const h = 4 + r() * 1.6;
      slabs.push([x + r() * 0.7, h / 2 - 0.15, -34 + (r() - 0.5) * 1.2, 2.6 + r() * 1.2, h, 4 + r() * 1.5, (r() - 0.5) * 0.16]);
    }
    // B 排（中层 z≈-40，更高，仅在矿山区 x -16..44）
    for (let x = -16; x < 44; x += 2.7 + r() * 0.9) {
      const h = 6.5 + r() * 2;
      slabs.push([x + r() * 0.8, h / 2 - 0.2, -40 + (r() - 0.5) * 1.6, 3.2 + r() * 1.4, h, 4.5 + r() * 1.5, (r() - 0.5) * 0.14]);
    }
    // C 排（地图北缘 z≈-47，最高，x -16..110 全幅，兼作采石场北壁）
    for (let x = -16; x < 110; x += 2.8 + r() * 1) {
      const h = 8 + r() * 2.2;
      slabs.push([x + r() * 0.9, h / 2 - 0.25, -47 + (r() - 0.5) * 1.2, 3.4 + r() * 1.6, h, 4.5 + r() * 2, (r() - 0.5) * 0.12]);
    }
    // D 采石场西壁（x≈44.5，z -46..-33）
    for (let z = -46; z < -32.5; z += 2.4 + r() * 0.7) {
      const h = 5 + r() * 1.8;
      slabs.push([44.5 + (r() - 0.5) * 0.8, h / 2 - 0.15, z, 4 + r() * 1.4, h, 2.8 + r() * 1.2, (r() - 0.5) * 0.16]);
    }
    const stone = stoneTex(); stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
    const rockIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ map: stone }), slabs.length);
    const snowIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#F0F5FA' }), slabs.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
    const cTint = new THREE.Color();
    slabs.forEach(([x, y, z, sx, sy, sz, ry], i) => {
      e.set(0, ry, 0); q.setFromEuler(e); v.set(x, y, z); s.set(sx, sy, sz);
      m4.compose(v, q, s);
      rockIM.setMatrixAt(i, m4);
      rockIM.setColorAt(i, cTint.setHSL(0, 0, 0.82 + ((i * 37) % 10) * 0.022));
      v.set(x, y + sy / 2 + 0.08, z); s.set(sx * 0.92, 0.22, sz * 0.92);
      m4.compose(v, q, s);
      snowIM.setMatrixAt(i, m4);
    });
    rockIM.castShadow = true; rockIM.receiveShadow = true;
    if (rockIM.instanceColor) rockIM.instanceColor.needsUpdate = true;
    rockIM.computeBoundingSphere(); snowIM.computeBoundingSphere();
    this.ridgeSnow = snowIM;
    this.ridgeSnow.visible = season === 3;
    this.group.add(rockIM, snowIM);
  }
  buildPOI() {
    const g = this.game;
    // 矿洞入口（岩壁洞口 + 火把 + 矿车轨）
    const me = DECOR.mineEntrance;
    if (me) {
      const grp = new THREE.Group();
      const rockMat = new THREE.MeshLambertMaterial({ color: '#5A564E', flatShading: true });
      const rockMat2 = new THREE.MeshLambertMaterial({ color: '#6E6858', flatShading: true });
      // 岩壁背景
      const wall = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 1.2), rockMat2);
      wall.position.set(0, 2.2, -0.8);
      // 洞口（黑洞）
      const mouth = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), new THREE.MeshBasicMaterial({ color: '#0A0810' }));
      mouth.position.set(0, 1.3, -0.15);
      // 拱石
      for (const [dx, dy, s] of [[-1.5, 0, 1.2], [1.5, 0, 1.1], [-1.1, 2.4, 0.9], [1.1, 2.4, 0.95], [0, 2.9, 1.1]]) {
        const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.55, 0), rockMat);
        rock.position.set(dx, dy + 0.4, 0.2);
        rock.castShadow = true;
        grp.add(rock);
      }
      // 火把×2
      for (const dx of [-1.6, 1.6]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 5), new THREE.MeshLambertMaterial({ color: '#6E4A2A' }));
        post.position.set(dx, 0.55, 0.6);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), new THREE.MeshLambertMaterial({ color: '#FF8A3C', emissive: 0xff8a3c, emissiveIntensity: 2 }));
        flame.position.set(dx, 1.2, 0.6);
        grp.add(post, flame);
      }
      // 矿车轨（通入洞口）
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 4), new THREE.MeshLambertMaterial({ color: '#4A4A52' }));
      rail.position.set(-0.25, 0.05, 2);
      const rail2 = rail.clone(); rail2.position.x = 0.25;
      grp.add(wall, mouth, rail, rail2);
      grp.position.set(me.x, 0, me.z);
      this.group.add(grp);
    }
    // 蘑菇圈
    const mr = DECOR.mushroomRing;
    if (mr) {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = mr.x + Math.cos(a) * mr.r, z = mr.z + Math.sin(a) * mr.r;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 5), new THREE.MeshLambertMaterial({ color: '#E8DCC8' }));
        stem.position.set(x, 0.11, z);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#B84A4A', flatShading: true }));
        cap.position.set(x, 0.22, z);
        this.group.add(stem, cap);
      }
    }
    // 神秘林地（微光植物）
    const sg = DECOR.secretGrove;
    if (sg) {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const x = sg.x + Math.cos(a) * sg.r * (0.5 + Math.random() * 0.5), z = sg.z + Math.sin(a) * sg.r * (0.5 + Math.random() * 0.5);
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 5), new THREE.MeshLambertMaterial({ color: '#7AE8C8', emissive: 0x7ae8c8, emissiveIntensity: 0.8, flatShading: true }));
        plant.position.set(x, 0.25, z);
        this.group.add(plant);
      }
      // 旅商大篷车（周五/日）
      const cart = new THREE.Group();
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.4), new THREE.MeshLambertMaterial({ color: '#8A5A2A', flatShading: true }));
      bed.position.y = 0.5;
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1.6), new THREE.MeshLambertMaterial({ color: '#B84A6E', flatShading: true }));
      canopy.position.y = 1.7;
      for (const dx of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 8), new THREE.MeshLambertMaterial({ color: '#3A2A20' }));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(dx, 0.3, 0.75);
        cart.add(wheel);
      }
      for (const dx of [-1.2, 1.2]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5), new THREE.MeshLambertMaterial({ color: '#6E4A2A' }));
        pole.position.set(dx, 1.1, -0.6);
        cart.add(pole);
      }
      cart.add(bed, canopy);
      cart.position.set(POI.find((p) => p.id === 'cart_spot')?.x || 88, 0, 30);
      this.cart = cart;
      this.group.add(cart);
    }
    // 出货箱
    const bin = new THREE.Group();
    const binBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.7), new THREE.MeshLambertMaterial({ color: '#8A5A2A', flatShading: true }));
    binBody.position.y = 0.35;
    const binLid = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.12, 0.74), new THREE.MeshLambertMaterial({ color: '#A87A3E', flatShading: true }));
    binLid.position.y = 0.76;
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.1), new THREE.MeshLambertMaterial({ color: '#2A2018' }));
    slot.position.set(0, 0.6, 0.36);
    bin.add(binBody, binLid, slot);
    bin.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    bin.position.set(28, 0, 12.2);
    this.group.add(bin);
    // 信箱
    const mb = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1, 5), new THREE.MeshLambertMaterial({ color: '#8A6A3A' }));
    post.position.y = 0.5;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: '#B8543E', flatShading: true }));
    box.position.y = 1.1;
    const flag2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.05), new THREE.MeshLambertMaterial({ color: '#FFD98A' }));
    flag2.position.set(0.22, 1.25, 0);
    mb.add(post, box, flag2);
    mb.position.set(26, 0, 12.2);
    this.group.add(mb);
    // 公告板
    const nb = makeNoticeBoard();
    nb.position.set(24.5, 0, 69.5);
    this.group.add(nb);
  }
  buildNature(season) {
    const g = this.game;
    // ---- 实例化自然批次（同视觉，draw call 从数千降到个位数）----
    if (this.natureGroup) this.group.remove(this.natureGroup);
    this.natureGroup = new THREE.Group();
    const r = rng(hashStr('nature' + season));
    const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
    const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3();
    const setInst = (im, idx, x, y, z, ry, sx, sy, sz, rx = 0, rz = 0) => {
      tmpQ.setFromEuler(new THREE.Euler(rx, ry, rz));
      tmpV.set(x, y, z); tmpS.set(sx, sy, sz);
      tmpM.compose(tmpV, tmpQ, tmpS);
      im.setMatrixAt(idx, tmpM);
    };
    // 采集全部实例变换
    const leafT = [[], [], []], trunkT = [], branchT = [], rockT = [], weedT = [];
    const flowerT = [], bladeT = [], pebbleT = [], palmLeafT = [], palmTrunkT = [], shellT = [];
    this.natureIndex = [];
    const sceneOf = (wx, wz) => {
      for (const id of Object.keys(REGIONS)) {
        const rr = REGIONS[id], sc = g.scenes.get(id);
        if (sc && wx >= rr.ox && wx < rr.ox + sc.W && wz >= rr.oz && wz < rr.oz + sc.H) return id;
      }
      return 'world';
    };
    const addTree = (x, z, s) => {
      const entry = { kind: 'tree', x, z, key: `${sceneOf(x, z)}:${Math.round(x * 2) / 2},${Math.round(z * 2) / 2}`, items: [], scale: s };
      const trunkIdx = trunkT.length;
      trunkT.push([x, 0.75 * s, z, (r() - 0.5) * 0.16, s]);
      entry.items.push({ b: 'trunk', idx: trunkIdx });
      const nBr = 2 + Math.floor(r() * 2);
      for (let i = 0; i < nBr; i++) {
        const a = r() * Math.PI * 2;
        const bi = branchT.length;
        branchT.push([x + Math.cos(a) * 0.3 * s, (1.3 + r() * 0.5) * s, z + Math.sin(a) * 0.3 * s, a, 0.6 + r() * 0.4, s]);
        entry.items.push({ b: 'branch', idx: bi });
      }
      const nCl = 7 + Math.floor(r() * 4);
      for (let i = 0; i < nCl; i++) {
        const a = (i / nCl) * Math.PI * 2 + r();
        const rr = (0.3 + r() * 0.55) * s;
        const cx = x + Math.cos(a) * rr, cz = z + Math.sin(a) * rr;
        const cy = (1.7 + r() * 1.1) * s;
        const size = (0.7 + r() * 0.5) * s;
        const v = Math.floor(r() * 3);
        const base = leafT[v].length;
        leafT[v].push([cx, cy, cz, r() * Math.PI, size]);
        leafT[v].push([cx, cy, cz, r() * Math.PI + Math.PI / 2, size]);
        entry.items.push({ b: 'leaf' + v, idx: base }, { b: 'leaf' + v, idx: base + 1 });
      }
      this.natureIndex.push(entry);
    };
    const addRock = (x, z, s) => {
      const n = 1 + Math.floor(r() * 2);
      const entry = { kind: 'rock', x, z, key: `${sceneOf(x, z)}:r${Math.round(x * 2) / 2},${Math.round(z * 2) / 2}`, items: [], scale: s };
      for (let i = 0; i < n; i++) {
        const idx = rockT.length;
        rockT.push([x + (r() - 0.5) * 0.5 * s, 0.15 * s, z + (r() - 0.5) * 0.5 * s, r() * 3, s * (0.7 + r() * 0.5)]);
        entry.items.push({ b: 'rock', idx });
      }
      this.natureIndex.push(entry);
    };
    const addWeed = (x, z) => {
      const entry = { kind: 'weed', x, z, key: `${sceneOf(x, z)}:w${Math.round(x * 2) / 2},${Math.round(z * 2) / 2}`, items: [] };
      for (let i = 0; i < 2; i++) {
        const idx = weedT.length;
        weedT.push([x, 0.26, z, i * Math.PI / 2, 1]);
        entry.items.push({ b: 'weed', idx });
      }
      this.natureIndex.push(entry);
    };
    const addFlower = (x, z) => { flowerT.push([x, 0.16, z, r() * Math.PI, 0.7 + r() * 0.5, r()]); };
    const addBlade = (x, z) => { bladeT.push([x, 0.3, z, r() * Math.PI, 0.8 + r() * 0.8, r()]); };
    const addPebble = (x, z) => { pebbleT.push([x, 0.04, z, r() * 3, 0.25 + r() * 0.3]); };
    const addPalm = (x, z, s) => {
      const h = 1.9 * s;
      palmTrunkT.push([x, h / 2, z, (r() - 0.5) * 0.4, s, h / 1.5, s]);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + r() * 0.3;
        palmLeafT.push([x + Math.cos(a) * 0.55 * s, h + 0.05, z + Math.sin(a) * 0.55 * s, a, 1.0 * s, 0.4 * s]);
      }
    };
    const scatter = (zone, density, mk) => {
      const [x0, z0, w, h] = zone.rect;
      const n = Math.floor(w * h * density);
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * w, z = z0 + r() * h;
        if (collisionAt(x, z) !== 'walk') continue;
        if (onRoad(x, z)) continue;
        mk(x, z);
      }
    };
    for (const z of SCATTER.treeSparse) scatter(z, z.density, (x, zz) => addTree(x, zz, 0.8 + r() * 0.6));
    for (const zone of FOREST_DENSE_ZONES) scatter(zone, zone.density * 0.06, (x, zz) => addTree(x, zz, 0.9 + r() * 0.8));
    // 镇周与海滩补树（画面更饱满；避开西拓建筑区，收窄至东侧）
    scatter({ rect: [4, 48, 6, 44], density: 0.04 }, 1, (x, zz) => addTree(x, zz, 0.8 + r() * 0.4));
    const PALMS = [[59, 53], [61.5, 61], [63, 55], [62, 70], [59.5, 76], [82, 52], [85.5, 55], [89, 52], [92, 57], [94, 52], [86, 59], [78, 61], [90, 63], [57.5, 66], [93.5, 59]];
    PALMS.forEach(([x, zz], i) => { if (collisionAt(x, zz) === 'walk' && !onRoad(x, zz)) addPalm(x, zz, 0.85 + ((i * 37) % 40) / 100); });
    // 边缘纵深树林（西缘 3 排 + 北坡 2 排；随西拓整体西移至新边界）
    scatter({ rect: [-48, -46, 7, 188], density: 0.14 }, 1, (x, zz) => addTree(x, zz, 0.9 + r() * 0.7));
    scatter({ rect: [-46, -44, 156, 12], density: 0.1 }, 1, (x, zz) => addTree(x, zz, 0.8 + r() * 0.6));
    for (const z of SCATTER.rock) scatter(z, z.density, (x, zz) => addRock(x, zz, 0.7 + r() * 0.7));
    // 山崖碎石带
    scatter({ rect: [-10, -44, 116, 10], density: 0.25 }, 1, (x, zz) => addRock(x, zz, 0.9 + r() * 1.1));
    // 花卉带（全图点缀，按季变色；沙滩上不长花）
    const notBeach = (x, z) => biomeAt(x, z) !== 'beach';
    scatter({ rect: [2, 2, 44, 44], density: 0.10 }, 1, (x, zz) => addFlower(x, zz));
    scatter({ rect: [48, 8, 48, 40], density: 0.07 }, 1, (x, zz) => addFlower(x, zz));
    scatter({ rect: [0, 48, 56, 48], density: 0.06 }, 1, (x, zz) => { if (notBeach(x, zz)) addFlower(x, zz); });
    scatter({ rect: [0, -44, 44, 42], density: 0.04 }, 1, (x, zz) => addFlower(x, zz));
    for (const z of SCATTER.weed) scatter(z, z.density, (x, zz) => { if (notBeach(x, zz)) addWeed(x, zz); });
    // 高草丛（全图氛围草，非交互；沙滩除外——沙地只长贝壳/碎石）
    scatter({ rect: [0, 0, 56, 96], density: 0.18 }, 1, (x, zz) => { if (notBeach(x, zz)) addBlade(x, zz); });
    scatter({ rect: [48, 8, 48, 40], density: 0.16 }, 1, (x, zz) => addBlade(x, zz));
    scatter({ rect: [0, -44, 44, 42], density: 0.12 }, 1, (x, zz) => addBlade(x, zz));
    // 小碎石点缀（全图；海滩加倍）
    scatter({ rect: [0, 0, 140, 100], density: 0.02 }, 1, (x, zz) => addPebble(x, zz));
    scatter({ rect: [56, 48, 40, 32], density: 0.06 }, 1, (x, zz) => addPebble(x, zz));
    // 海滩贝壳/海星（沙地专属点缀）
    scatter({ rect: [56, 48, 40, 32], density: 0.05 }, 1, (x, zz) => shellT.push([x, 0.03, zz, r() * Math.PI, 0.6 + r() * 0.7, r()]));

    // 创建 InstancedMesh
    const leafMats = [0, 1, 2].map((v) => {
      const m = new THREE.MeshLambertMaterial({ map: leafSprite(season, v), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = this.uTimeUniform;
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\ntransformed.x += sin(uTime * 1.5 + instanceMatrix[3][0] * 1.7 + instanceMatrix[3][2]) * 0.05 * max(0.0, position.y);');
      };
      return m;
    });
    this.uTimeUniform = { value: 0 };
    const bark = barkTex(); bark.wrapS = bark.wrapT = THREE.RepeatWrapping;
    this.leafInst = leafT.map((list, v) => {
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), leafMats[v], Math.max(1, list.length));
      list.forEach(([x, y, z, ry, s], i) => setInst(im, i, x, y, z, ry, s, s, s));
      im.castShadow = true;
      im.computeBoundingSphere();
      this.natureGroup.add(im);
      return im;
    });
    this.trunkInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.22, 1.5, 6), new THREE.MeshLambertMaterial({ map: bark }), Math.max(1, trunkT.length));
    trunkT.forEach(([x, y, z, rz, s], i) => setInst(this.trunkInst, i, x, y, z, 0, s, s, s, 0, rz));
    this.trunkInst.castShadow = true; this.trunkInst.computeBoundingSphere();
    this.natureGroup.add(this.trunkInst);
    this.branchInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.09, 1, 5), new THREE.MeshLambertMaterial({ map: bark }), Math.max(1, branchT.length));
    branchT.forEach(([x, y, z, a, len, s], i) => setInst(this.branchInst, i, x, y, z, 0, s, len, s, Math.sin(a) * 0.6, Math.cos(a) * -0.6));
    this.branchInst.computeBoundingSphere();
    this.natureGroup.add(this.branchInst);
    this.rockInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.45, 0), new THREE.MeshLambertMaterial({ map: stoneTex() }), Math.max(1, rockT.length));
    rockT.forEach(([x, y, z, ry, s], i) => setInst(this.rockInst, i, x, y, z, ry, s, s * 0.75, s));
    this.rockInst.castShadow = true; this.rockInst.computeBoundingSphere();
    this.natureGroup.add(this.rockInst);
    const weedTex = makeTexture(16, 16, (gg) => {
      gg.clearRect(0, 0, 16, 16);
      const r2 = rng(hashStr('weedtex' + season));
      for (let i = 0; i < 5; i++) {
        const x = 2 + i * 3 + (r2() - 0.5) * 2, h = 6 + r2() * 6;
        gg.fillStyle = shade(PAL.grass[season], 20 + r2() * 20);
        gg.fillRect(Math.floor(x), 16 - Math.floor(h), 1, Math.floor(h));
        gg.fillRect(Math.floor(x) + (r2() < 0.5 ? 1 : -1), 15 - Math.floor(h), 1, 1);
      }
    });
    this.weedInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshLambertMaterial({ map: weedTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), Math.max(1, weedT.length));
    weedT.forEach(([x, y, z, ry, s], i) => setInst(this.weedInst, i, x, y, z, ry, s, s, s));
    this.weedInst.computeBoundingSphere();
    this.natureGroup.add(this.weedInst);
    // 花卉批次（instanceColor 按花色）
    const flowerTex = makeTexture(12, 12, (gg) => {
      gg.clearRect(0, 0, 12, 12);
      gg.fillStyle = '#3E8B3A'; gg.fillRect(5, 5, 2, 7);
      gg.fillStyle = '#FFFFFF';
      gg.fillRect(4, 1, 4, 4); gg.fillRect(3, 2, 6, 2);
      gg.fillStyle = '#FFD98A'; gg.fillRect(5, 2, 2, 2);
    });
    const FLOWER_COLS = ['#FFC9DD', '#FFF0F4', '#FFD98A', '#E87A9A', '#B87AE8', '#FF8A5A'];
    this.flowerInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshLambertMaterial({ map: flowerTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), Math.max(1, flowerT.length));
    flowerT.forEach(([x, y, z, ry, s, c], i) => {
      setInst(this.flowerInst, i, x, y, z, ry, s, s, s);
      this.flowerInst.setColorAt(i, new THREE.Color(FLOWER_COLS[Math.floor(c * FLOWER_COLS.length)]));
    });
    if (this.flowerInst.instanceColor) this.flowerInst.instanceColor.needsUpdate = true;
    this.flowerInst.computeBoundingSphere();
    this.natureGroup.add(this.flowerInst);
    // 高草批次（深色/浅色双变体，instanceColor）
    const bladeTex = makeTexture(16, 16, (gg) => {
      gg.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 6; i++) { gg.fillStyle = '#FFFFFF'; gg.fillRect(2 + i * 2, 16 - 9 - (i % 3) * 2, 1, 9 + (i % 3) * 2); }
    });
    this.bladeInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.45, 0.45), new THREE.MeshLambertMaterial({ map: bladeTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), Math.max(1, bladeT.length));
    const bladeBase = new THREE.Color(PAL.grass[season]);
    bladeT.forEach(([x, y, z, ry, s, c], i) => {
      setInst(this.bladeInst, i, x, y, z, ry, s, s, s);
      this.bladeInst.setColorAt(i, bladeBase.clone().offsetHSL(0, 0, (c - 0.5) * 0.12));
    });
    if (this.bladeInst.instanceColor) this.bladeInst.instanceColor.needsUpdate = true;
    this.bladeInst.computeBoundingSphere();
    this.natureGroup.add(this.bladeInst);
    // 小碎石批次
    this.pebbleInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshLambertMaterial({ map: stoneTex() }), Math.max(1, pebbleT.length));
    pebbleT.forEach(([x, y, z, ry, s], i) => setInst(this.pebbleInst, i, x, y, z, ry, s, s, s));
    this.pebbleInst.computeBoundingSphere();
    this.natureGroup.add(this.pebbleInst);
    // 贝壳/海星批次（海滩专属，贴地平放）
    const shellTex = makeTexture(12, 12, (gg) => {
      gg.clearRect(0, 0, 12, 12);
      gg.fillStyle = '#FFF4E0'; // 扇贝壳纹
      gg.fillRect(3, 7, 6, 2); gg.fillRect(4, 5, 4, 2); gg.fillRect(5, 3, 2, 2);
      gg.fillStyle = '#F0C8A8'; gg.fillRect(5, 8, 2, 1);
    });
    const SHELL_COLS = ['#FFF4E0', '#FFD8C8', '#F0E8FF', '#FFE8F0', '#FF9A5A', '#E87A4A']; // 后两色为海星
    this.shellInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshLambertMaterial({ map: shellTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), Math.max(1, shellT.length));
    shellT.forEach(([x, y, z, ry, s, c], i) => {
      setInst(this.shellInst, i, x, y, z, 0, s, s, s, -Math.PI / 2, ry); // rz 先自旋再贴地平放
      this.shellInst.setColorAt(i, new THREE.Color(SHELL_COLS[Math.floor(c * SHELL_COLS.length)]));
    });
    if (this.shellInst.instanceColor) this.shellInst.instanceColor.needsUpdate = true;
    this.shellInst.computeBoundingSphere();
    this.natureGroup.add(this.shellInst);
    // 海滩棕榈批次
    const palmLeafTex = makeTexture(16, 8, (gg) => {
      gg.clearRect(0, 0, 16, 8);
      gg.strokeStyle = shade(PAL.leaf[season], 10); gg.lineWidth = 2;
      for (let i = 0; i < 5; i++) { gg.beginPath(); gg.moveTo(1, 4); gg.quadraticCurveTo(8, -2 + i * 3, 15, 4 + i); gg.stroke(); }
    });
    this.palmTrunkInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.14, 1.5, 5), new THREE.MeshLambertMaterial({ map: bark }), Math.max(1, palmTrunkT.length));
    palmTrunkT.forEach(([x, y, z, lean, sx, sy, sz], i) => setInst(this.palmTrunkInst, i, x, y, z, 0, sx, sy, sz, 0, lean));
    this.palmTrunkInst.computeBoundingSphere();
    this.natureGroup.add(this.palmTrunkInst);
    this.palmLeafInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshLambertMaterial({ map: palmLeafTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), Math.max(1, palmLeafT.length));
    palmLeafT.forEach(([x, y, z, a, sx, sy], i) => setInst(this.palmLeafInst, i, x, y, z, -a, sx, sy, sy, -0.5, 0));
    this.palmLeafInst.computeBoundingSphere();
    this.natureGroup.add(this.palmLeafInst);
    // 记录原始矩阵（隐藏/恢复用）
    this.natureGroup.userData.batches = { leaf0: this.leafInst[0], leaf1: this.leafInst[1], leaf2: this.leafInst[2], trunk: this.trunkInst, branch: this.branchInst, rock: this.rockInst, weed: this.weedInst };
    this.group.add(this.natureGroup);
  }
  // 隐藏/恢复单个自然实例（砍树/割草/碎石用）
  setNatureHidden(entry, hidden) {
    const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
    const tmpM = new THREE.Matrix4();
    const batches = this.natureGroup.userData.batches;
    for (const it of entry.items) {
      const im = batches[it.b];
      if (!im) continue;
      if (hidden) {
        if (!it.savedM) { it.savedM = new THREE.Matrix4(); im.getMatrixAt(it.idx, it.savedM); }
        im.setMatrixAt(it.idx, ZERO);
      } else if (it.savedM) {
        im.setMatrixAt(it.idx, it.savedM);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  }
  // 换季：重绘底图 + 重建植被
  setSeason(season) {
    const ground = this.group.getObjectByName('unifiedGround');
    if (ground) {
      ground.material.map.dispose();
      ground.material.map = paintUnifiedGround(season);
      ground.material.needsUpdate = true;
    }
    if (this.ridgeSnow) this.ridgeSnow.visible = season === 3;
    this.buildNature(season);
  }
  update(dt, t) {
    for (const w of this.waters) w.userData.water?.update(dt, t);
    for (const fn of this.extAnims || []) fn(dt, t); // 室外建筑装饰动画（锻炉火光/风车/串灯/霓虹/挂牌）
    for (const f of this.flags || []) f.rotation.y = Math.sin(t * 2.2 + f.position.x) * 0.3;
    if (this.windmillHub) this.windmillHub.rotation.z = t * 0.6;
    for (const jt of this.jetTexs || []) jt.offset.y = (jt.offset.y - dt * 1.8) % 1; // 喷泉水幕流动
    for (const bg of this.bobGroups || []) { // 浮标起伏
      const bs = bg.userData.bobbers || [];
      for (let i = 0; i < bs.length; i++) bs[i].position.y = 0.1 + Math.sin(t * 1.4 + i * 1.1) * 0.06;
    }
    if (this.uTimeUniform) this.uTimeUniform.value = t;
    // 旅商大篷车：周五/日出现
    if (this.cart) {
      const wd = this.game.clock.weekDay;
      this.cart.visible = wd === 4 || wd === 6;
    }
  }
}
const FOREST_DENSE_ZONES = [
  { rect: [50, 10, 44, 36], density: 0.55 },
  { rect: [-14, -46, 18, 42], density: 0.3 },
  { rect: [46, -46, 50, 36], density: 0.22 },
];
