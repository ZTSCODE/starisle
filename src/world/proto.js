// 原型场景（HD-2D 版）：手绘风地面纹理 + 平滑低模道具（树/房/石/草丛/路灯）
import * as THREE from 'three';
import { rng, hashStr } from '../core/rng.js';
import { PAL, mkCanvas, makeTexture, shade } from '../render/textures.js';

const GROUND_RES = 8; // 地面纹理 8px/m

// 手绘风地面：一整张 384×384 画布覆盖 48×48m
export function makeGroundTexture(season) {
  const S = 48 * GROUND_RES;
  const r = rng(hashStr('ground' + season));
  const g = mkCanvas(S, S).getContext('2d');
  const grass = PAL.grass[season], grassD = PAL.grassD[season], grassL = shade(grass, 18);
  g.fillStyle = grass; g.fillRect(0, 0, S, S);
  // 大块色斑（水彩感）
  for (let i = 0; i < 90; i++) {
    g.fillStyle = r() < 0.5 ? grassD : grassL;
    g.globalAlpha = 0.08 + r() * 0.1;
    const rad = 6 + r() * 22;
    g.beginPath(); g.arc(r() * S, r() * S, rad, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  // 细草点
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() < 0.6 ? grassD : grassL;
    g.fillRect(Math.floor(r() * S), Math.floor(r() * S), 1 + Math.floor(r() * 2), 1);
  }
  // 小花点（春/夏）
  if (season <= 1) {
    for (let i = 0; i < 60; i++) {
      g.fillStyle = r() < 0.5 ? PAL.flower : '#FFF8DC';
      const x = r() * S, y = r() * S;
      g.fillRect(x, y, 2, 2); g.fillRect(x - 1, y + 1, 1, 1); g.fillRect(x + 2, y + 1, 1, 1);
    }
  }
  // 小径（南北 + 东西）
  const path = (x0, y0, x1, y1, w) => {
    g.strokeStyle = PAL.path; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = shade(PAL.path, -14); g.lineWidth = w * 0.75;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  };
  const m = (v) => v * GROUND_RES;
  path(m(23.5), 0, m(23.5), S, 10);
  path(m(8), m(23.5), m(23.5), m(23.5), 8);
  // 小径撒石
  for (let i = 0; i < 120; i++) {
    g.fillStyle = shade(PAL.path, r() < 0.5 ? -22 : 12);
    const onV = r() < 0.6;
    g.fillRect(onV ? m(22) + r() * m(3) : r() * S, onV ? r() * S : m(22) + r() * m(3), 2, 2);
  }
  // 农田垄沟（南）
  const fx = m(6), fz = m(40), fw = m(20), fh = m(7);
  g.fillStyle = PAL.till; g.fillRect(fx, fz, fw, fh);
  for (let y = 0; y < fh; y += 4) {
    g.fillStyle = shade(PAL.till, -16); g.fillRect(fx, fz + y, fw, 2);
    g.fillStyle = shade(PAL.till, 12); g.fillRect(fx, fz + y + 2, fw, 1);
  }
  // 池塘（东）+ 岸线
  const px = m(33), pz = m(32), pr = m(4);
  g.fillStyle = shade(PAL.waterD[season], -10);
  g.beginPath(); g.ellipse(px, pz, pr + 4, pr * 0.8 + 4, 0, 0, 7); g.fill();
  g.fillStyle = PAL.water[season];
  g.beginPath(); g.ellipse(px, pz, pr, pr * 0.8, 0, 0, 7); g.fill();
  for (let i = 0; i < 14; i++) { // 波光
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(px - pr + r() * pr * 2, pz - pr * 0.6 + r() * pr * 1.2, 3 + r() * 5, 1);
  }
  const t = makeTexture(S, S, (gg) => gg.drawImage(g.canvas, 0, 0));
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4;
  return t;
}

export function makeGround(engine, season) {
  const tex = makeGroundTexture(season);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 48, 1, 1),
    new THREE.MeshLambertMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(24, 0, 24);
  mesh.receiveShadow = true;
  return mesh;
}

// 平滑低模树 v3：纹理树干 + 分枝 + 透明叶簇面片（HD-2D 叶感）
import { barkTex, stoneTex, metalTex, woodTex, hayTex, leafSprite } from '../render/textures.js';

export function makeTree(season, scale = 1) {
  const r = rng(hashStr('tree' + season + scale.toFixed(2)));
  const g = new THREE.Group();
  const bark = barkTex();
  bark.wrapS = bark.wrapT = THREE.RepeatWrapping;
  const trunkMat = new THREE.MeshLambertMaterial({ map: bark });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.5, 6), trunkMat);
  trunk.position.y = 0.75;
  trunk.rotation.z = (r() - 0.5) * 0.08;
  g.add(trunk);
  // 分枝 ×2-3
  const nBranch = 2 + Math.floor(r() * 2);
  for (let i = 0; i < nBranch; i++) {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.7 + r() * 0.4, 5), trunkMat);
    const a = r() * Math.PI * 2;
    br.position.set(Math.cos(a) * 0.3, 1.3 + r() * 0.5, Math.sin(a) * 0.3);
    br.rotation.set(Math.sin(a) * (0.5 + r() * 0.5), 0, Math.cos(a) * -(0.5 + r() * 0.5));
    g.add(br);
  }
  // 透明叶簇面片 ×7-10（每簇交叉双面片）
  const canopy = new THREE.Group();
  const leafMats = [0, 1, 2].map((v) => new THREE.MeshLambertMaterial({ map: leafSprite(season, v), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide }));
  const nCl = 7 + Math.floor(r() * 4);
  for (let i = 0; i < nCl; i++) {
    const size = 0.7 + r() * 0.5;
    const a = (i / nCl) * Math.PI * 2 + r();
    const rr = 0.3 + r() * 0.55;
    const cx = Math.cos(a) * rr, cz = Math.sin(a) * rr;
    const cy = 1.7 + r() * 1.1;
    const m1 = new THREE.Mesh(new THREE.PlaneGeometry(size, size), leafMats[i % 3]);
    m1.position.set(cx, cy, cz);
    m1.rotation.y = r() * Math.PI;
    const m2 = m1.clone(); m2.rotation.y = m1.rotation.y + Math.PI / 2;
    canopy.add(m1, m2);
  }
  g.add(canopy);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  g.scale.setScalar(scale);
  g.userData.sway = { canopy, phase: r() * 6 };
  return g;
}

// 石头 v2：2-3 块组合 + 色抖
export function makeRock(scale = 1) {
  const g = new THREE.Group();
  const r = rng(hashStr('rock' + scale.toFixed(3)));
  const n = 1 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const col = new THREE.Color(PAL.stone).offsetHSL(0, 0, (r() - 0.5) * 0.08);
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry((0.3 + r() * 0.2) * scale, 0),
      new THREE.MeshLambertMaterial({ map: stoneTex() })
    );
    m.position.set((r() - 0.5) * 0.5 * scale, 0.15 * scale, (r() - 0.5) * 0.5 * scale);
    m.rotation.set(r() * 3, r() * 3, r() * 3);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  }
  g.userData.rock = true;
  return g;
}

// 灌木丛（小绿团）
export function makeBush(season, scale = 1) {
  const g = new THREE.Group();
  const r = rng(hashStr('bush' + Math.random()));
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Color(PAL.leaf[season]).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.06);
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + r() * 0.14, 0), new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
    b.position.set((r() - 0.5) * 0.5, 0.2 + r() * 0.15, (r() - 0.5) * 0.5);
    b.castShadow = true;
    g.add(b);
  }
  g.scale.setScalar(scale);
  return g;
}

// 花圃（交叉面片花簇，多色）
export function makeFlowerPatch(season) {
  const g = new THREE.Group();
  const cols = ['#FFC9DD', '#FFF0F4', '#FFD98A', '#E87A9A', '#B87AE8'];
  for (let i = 0; i < 5; i++) {
    const tex = makeTexture(12, 12, (gg) => {
      const c = cols[i % cols.length];
      gg.fillStyle = '#3E8B3A'; gg.fillRect(5, 5, 2, 7);
      gg.fillStyle = c;
      gg.fillRect(4, 1, 4, 4); gg.fillRect(3, 2, 6, 2);
      gg.fillStyle = '#FFD98A'; gg.fillRect(5, 2, 2, 2);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    m.position.set((Math.random() - 0.5) * 1.2, 0.15, (Math.random() - 0.5) * 1.2);
    m.rotation.y = Math.random() * Math.PI;
    const m2 = m.clone(); m2.rotation.y = m.rotation.y + Math.PI / 2;
    g.add(m, m2);
  }
  return g;
}

// 干草捆
export function makeHayBale() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ map: hayTex() });
  const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 8), mat);
  bale.rotation.z = Math.PI / 2; bale.position.y = 0.35; bale.castShadow = true;
  const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 8), new THREE.MeshLambertMaterial({ color: '#8A6A3A' }));
  band1.rotation.z = Math.PI / 2; band1.position.set(-0.15, 0.35, 0);
  const band2 = band1.clone(); band2.position.x = 0.15;
  g.add(bale, band1, band2);
  return g;
}

// 木箱（纹理面）
export function makeCrate(scale = 1) {
  const tex = makeTexture(16, 16, (g) => {
    g.fillStyle = '#9A6B3F'; g.fillRect(0, 0, 16, 16);
    g.strokeStyle = '#7A5230'; g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, 15, 15);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(16, 16); g.moveTo(16, 0); g.lineTo(0, 16); g.stroke();
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ map: tex }));
  m.position.y = 0.25; m.castShadow = true;
  m.scale.setScalar(scale);
  return m;
}

// 木桶
export function makeBarrel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.6, 9), new THREE.MeshLambertMaterial({ map: woodTex() }));
  body.position.y = 0.3; body.castShadow = true;
  for (const y of [0.15, 0.45]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 9), new THREE.MeshLambertMaterial({ color: '#4A4A52', flatShading: true }));
    band.position.y = y;
    g.add(band);
  }
  g.add(body);
  return g;
}

// 倒木
export function makeFallenLog() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: '#6E4A2A', flatShading: true });
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.4, 6), mat);
  log.rotation.z = Math.PI / 2; log.position.y = 0.24; log.castShadow = true;
  const cut1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 6), new THREE.MeshLambertMaterial({ color: '#B89B6A' }));
  cut1.rotation.z = Math.PI / 2; cut1.position.set(-1.2, 0.24, 0);
  const cut2 = cut1.clone(); cut2.position.x = 1.2;
  const moss = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.3), new THREE.MeshLambertMaterial({ color: '#4A8B3A' }));
  moss.position.set(0.2, 0.46, 0);
  g.add(log, cut1, cut2, moss);
  return g;
}

// 石井（小井栏 + 顶棚）
export function makeWell() {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshLambertMaterial({ map: stoneTex() });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.7, 8, 1, true), stoneMat);
  ring.position.y = 0.35; ring.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 6, 10), stoneMat);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.72;
  const waterM = new THREE.Mesh(new THREE.CircleGeometry(0.45, 10), new THREE.MeshLambertMaterial({ color: '#3E5A78' }));
  waterM.rotation.x = -Math.PI / 2; waterM.position.y = 0.55;
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), new THREE.MeshLambertMaterial({ color: '#7A5230' }));
  postL.position.set(-0.55, 0.9, 0);
  const postR = postL.clone(); postR.position.x = 0.55;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.5, 4), new THREE.MeshLambertMaterial({ color: '#B8543E', flatShading: true }));
  roof.position.y = 1.75; roof.rotation.y = Math.PI / 4;
  g.add(ring, rim, waterM, postL, postR, roof);
  return g;
}

// 花箱（镇店门口）
export function makePlanter(season) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.35), new THREE.MeshLambertMaterial({ color: '#7A5230', flatShading: true }));
  box.position.y = 0.15; box.castShadow = true;
  g.add(box);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), new THREE.MeshLambertMaterial({ color: ['#FFC9DD', '#E87A9A', '#FFD98A', '#B87AE8'][i % 4], flatShading: true }));
    f.position.set(-0.3 + i * 0.2, 0.36, 0);
    g.add(f);
  }
  return g;
}

// 漂流木（海滩）
export function makeDriftwood() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: '#B8A890', flatShading: true });
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.6, 5), mat);
  w.rotation.z = Math.PI / 2 + 0.2; w.position.y = 0.12;
  const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.8, 5), mat);
  w2.rotation.set(0, 0.5, Math.PI / 2 - 0.4); w2.position.set(0.4, 0.2, 0.2);
  g.add(w, w2);
  return g;
}

// 蕨类（林地）
export function makeFern(season) {
  const g = new THREE.Group();
  const tex = makeTexture(16, 16, (gg) => {
    const c = shade(PAL.leaf[season], 10);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.35;
      gg.strokeStyle = c; gg.lineWidth = 1;
      gg.beginPath(); gg.moveTo(8, 16);
      gg.quadraticCurveTo(8 + Math.sin(a) * 6, 8, 8 + Math.sin(a) * 8, 16 - 12 - Math.abs(i - 3));
      gg.stroke();
    }
  });
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    m.position.y = 0.22;
    m.rotation.y = (i / 3) * Math.PI;
    g.add(m);
  }
  return g;
}

// 农舍（调用 scenekit 细致建筑建造器：石基座/木骨墙/瓦片屋顶/门窗框/烟囱）
import { makeBuilding } from './scenekit.js';

export function makeHouse() {
  const g = makeBuilding({
    w: 6, d: 5, h: 2.6, face: 1,
    wall: PAL.wall, roof: PAL.roof, trim: PAL.woodD,
    windows: 2, chimney: true,
  });
  return g;
}

// 草丛（交叉面片 + 手绘草叶纹理，随风摆）
export function makeGrassTuft(season) {
  const tex = makeTexture(16, 16, (g) => {
    const r = rng(hashStr('tuft' + season + Math.random()));
    g.clearRect(0, 0, 16, 16);
    for (let i = 0; i < 5; i++) {
      const x = 2 + i * 3 + (r() - 0.5) * 2, h = 6 + r() * 6;
      g.fillStyle = shade(PAL.grass[season], 20 + r() * 20);
      g.fillRect(x, 16 - h, 1, h);
      g.fillRect(x + (r() < 0.5 ? 1 : -1), 16 - h - 1, 1, 1);
    }
  });
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), mat);
  p1.position.y = 0.26;
  const p2 = p1.clone(); p2.rotation.y = Math.PI / 2;
  g.add(p1, p2);
  g.userData.sway = { tuft: g, phase: Math.random() * 6 };
  return g;
}

// 路灯
export function makeLamp() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.5, 6), new THREE.MeshLambertMaterial({ map: metalTex() }));
  post.position.y = 1.25; post.castShadow = true;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 6), new THREE.MeshLambertMaterial({ color: '#2E2E3A', flatShading: true }));
  cap.position.y = 2.62;
  const bulbMat = new THREE.MeshLambertMaterial({ color: PAL.winLit, emissive: new THREE.Color(PAL.winLit), emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), bulbMat);
  bulb.position.y = 2.45;
  g.add(post, cap, bulb);
  g.userData.lamp = { bulbMat };
  return g;
}

export function makeFence(len, horizontal = true) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ map: woodTex() });
  for (let i = 0; i < len; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.85, 5), mat);
    p.position.set(horizontal ? i : 0, 0.42, horizontal ? 0 : i);
    p.castShadow = true;
    g.add(p);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? len : 0.08, 0.09, horizontal ? 0.08 : len), mat);
  rail.position.set(horizontal ? (len - 1) / 2 : 0, 0.66, horizontal ? 0 : (len - 1) / 2);
  rail.castShadow = true;
  g.add(rail);
  return g;
}

// 组装原型农场
export function buildProtoFarm(engine, season) {
  const r = rng(hashStr('protofarm2'));
  const group = new THREE.Group();
  group.name = 'protoFarm';

  const ground = makeGround(engine, season);
  group.add(ground);

  const trees = [];
  const spots = [];
  for (let i = 0; i < 12; i++) spots.push([4 + r() * 12, 4 + r() * 13]);
  for (let i = 0; i < 7; i++) spots.push([37 + r() * 8, 5 + r() * 18]);
  for (const [tx, tz] of spots) {
    const t = makeTree(season, 0.85 + r() * 0.6);
    t.position.set(tx, 0, tz);
    group.add(t); trees.push(t);
  }
  const tufts = [];
  for (let i = 0; i < 60; i++) {
    const tu = makeGrassTuft(season);
    tu.position.set(3 + r() * 42, 0, 3 + r() * 34);
    group.add(tu); tufts.push(tu);
  }
  for (let i = 0; i < 8; i++) {
    const rock = makeRock(0.6 + r() * 0.9);
    rock.position.set(5 + r() * 38, 0.1, 5 + r() * 38);
    group.add(rock);
  }

  const house = makeHouse();
  house.position.set(21, 0, 8);
  group.add(house);
  const fence1 = makeFence(20, true); fence1.position.set(6, 0, 39);
  const fence2 = makeFence(8, false); fence2.position.set(5, 0, 40);
  group.add(fence1, fence2);
  const lamps = [];
  for (const [lx, lz] of [[23.5, 20], [23.5, 30], [10, 23.5]]) {
    const l = makeLamp(); l.position.set(lx, 0, lz);
    group.add(l); lamps.push(l);
  }

  engine.scene.add(group);
  return { group, trees, tufts, lamps, house, W: 48, H: 48 };
}
