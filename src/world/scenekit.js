// 场景共享工具库：手绘地面绘制 + 平滑低模建筑/道具 + 动态水面 + 道具动画收集
// 美术规范同 world/proto.js：手绘纹理（8px/m）+ 平滑低模 flatShading，禁止盒子堆砌风。
import * as THREE from 'three';
import { rng, hashStr } from '../core/rng.js';
import { PAL, mkCanvas, makeTexture, shade, woodTex, barkTex } from '../render/textures.js';

export const GRES = 8; // 地面纹理 8px/m（与 proto.js 一致）

// ---- 资源释放（场景换季重建时用）----
export function disposeGroup(group) {
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) { if (m.map) m.map.dispose(); m.dispose(); }
  });
  group.clear();
}

// ---- 道具动画钩子收集（树摇/草丛摆/灯/窗/水面）----
export function collectProps(group) {
  const p = { trees: [], tufts: [], lamps: [], windows: [], waters: [] };
  group.traverse((o) => {
    if (o.userData.sway?.canopy) p.trees.push(o.userData.sway);
    else if (o.userData.sway?.tuft) p.tufts.push(o.userData.sway);
    if (o.userData.lamp) p.lamps.push(o.userData.lamp.bulbMat);
    if (o.userData.windows) p.windows.push(...o.userData.windows);
    if (o.userData.water) p.waters.push(o.userData.water);
  });
  return p;
}

// 标准道具动画（对标 main.js updateProps 的行为，搬到场景内）
export function stdPropUpdate(p, dt, t, game) {
  const windMul = game.state.weather.today === 'wind' ? 2.5 : 1;
  for (const sw of p.trees) {
    sw.canopy.rotation.z = Math.sin(t * 1.2 + sw.phase) * 0.035 * windMul;
    sw.canopy.rotation.x = Math.cos(t * 0.9 + sw.phase) * 0.02 * windMul;
  }
  for (const sw of p.tufts) sw.tuft.rotation.z = Math.sin(t * 2.2 + sw.phase) * 0.08 * windMul;
  const night = game.lighting.env.isNight;
  for (const m of p.lamps) m.emissiveIntensity += ((night ? 2.4 : 0) - m.emissiveIntensity) * Math.min(1, dt * 2);
  for (const m of p.windows) m.emissiveIntensity += ((night ? 1.8 : 0) - m.emissiveIntensity) * Math.min(1, dt * 1.2);
  for (const w of p.waters) w.update(dt, t);
}

// ================= 手绘地面绘制 =================
const M = (v) => v * GRES;

// 草地底色（水彩大斑 + 细草点 + 季节小花）
export function paintGrassBase(g, wPx, hPx, season, r, opt = {}) {
  const grass = opt.base || PAL.grass[season], grassD = opt.dark || PAL.grassD[season];
  const grassL = shade(grass, 18);
  g.fillStyle = grass; g.fillRect(0, 0, wPx, hPx);
  for (let i = 0; i < Math.floor((wPx * hPx) / 1600); i++) {
    g.fillStyle = r() < 0.5 ? grassD : grassL;
    g.globalAlpha = 0.08 + r() * 0.1;
    const rad = 6 + r() * 22;
    g.beginPath(); g.arc(r() * wPx, r() * hPx, rad, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < Math.floor((wPx * hPx) / 55); i++) {
    g.fillStyle = r() < 0.6 ? grassD : grassL;
    g.fillRect(Math.floor(r() * wPx), Math.floor(r() * hPx), 1 + Math.floor(r() * 2), 1);
  }
  if (opt.flowers && season <= 1) {
    for (let i = 0; i < Math.floor((wPx * hPx) / 2400); i++) {
      g.fillStyle = r() < 0.5 ? PAL.flower : '#FFF8DC';
      const x = r() * wPx, y = r() * hPx;
      g.fillRect(x, y, 2, 2); g.fillRect(x - 1, y + 1, 1, 1); g.fillRect(x + 2, y + 1, 1, 1);
    }
  }
}

// 土路描边（圆头双线，proto 风格）
export function paintPathStroke(g, x0, z0, x1, z1, wM = 1.6) {
  g.strokeStyle = PAL.path; g.lineWidth = M(wM); g.lineCap = 'round';
  g.beginPath(); g.moveTo(M(x0), M(z0)); g.lineTo(M(x1), M(z1)); g.stroke();
  g.strokeStyle = shade(PAL.path, -14); g.lineWidth = M(wM) * 0.75;
  g.beginPath(); g.moveTo(M(x0), M(z0)); g.lineTo(M(x1), M(z1)); g.stroke();
}

// 矩形路面（含边缘撒石）
export function paintPathRect(g, x, z, w, h, r, color = PAL.path) {
  g.fillStyle = color; g.fillRect(M(x), M(z), M(w), M(h));
  g.fillStyle = shade(color, -14);
  g.fillRect(M(x), M(z), M(w), 1); g.fillRect(M(x), M(z + h) - 1, M(w), 1);
  for (let i = 0; i < w * h * 2.2; i++) {
    g.fillStyle = shade(color, r() < 0.5 ? -22 : 12);
    g.fillRect(M(x) + Math.floor(r() * M(w)), M(z) + Math.floor(r() * M(h)), 2, 2);
  }
}

// 石板广场（方格勾缝）
export function paintStoneFloor(g, x, z, w, h, r, base = '#B8B0A0') {
  g.fillStyle = base; g.fillRect(M(x), M(z), M(w), M(h));
  const lite = shade(base, 14), dark = shade(base, -18);
  for (let i = 0; i < w * h * 3; i++) {
    g.fillStyle = r() < 0.5 ? dark : lite;
    g.fillRect(M(x) + Math.floor(r() * M(w)), M(z) + Math.floor(r() * M(h)), 1 + Math.floor(r() * 2), 1);
  }
  g.fillStyle = shade(base, -30);
  for (let ix = 0; ix <= w; ix += 2) g.fillRect(M(x + ix), M(z), 1, M(h));
  for (let iz = 0; iz <= h; iz += 2) g.fillRect(M(x), M(z + iz), M(w), 1);
}

// 水面椭圆（深色岸线 + 波光，proto 池塘风格）
export function paintWaterEllipse(g, cx, cz, rx, rz, season, r) {
  g.fillStyle = shade(PAL.waterD[season], -10);
  g.beginPath(); g.ellipse(M(cx), M(cz), M(rx) + 4, M(rz) + 4, 0, 0, 7); g.fill();
  g.fillStyle = PAL.water[season];
  g.beginPath(); g.ellipse(M(cx), M(cz), M(rx), M(rz), 0, 0, 7); g.fill();
  for (let i = 0; i < rx * rz * 1.6; i++) {
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(M(cx) - M(rx) + r() * M(rx) * 2, M(cz) - M(rz) + r() * M(rz) * 2, 3 + r() * 5, 1);
  }
}

// 水面矩形（河流/裂谷水，含两岸线）
export function paintWaterRect(g, x, z, w, h, season, r) {
  g.fillStyle = shade(PAL.waterD[season], -10);
  g.fillRect(M(x) - 3, M(z) - 3, M(w) + 6, M(h) + 6);
  g.fillStyle = PAL.water[season];
  g.fillRect(M(x), M(z), M(w), M(h));
  for (let i = 0; i < (w * h) * 1.2; i++) {
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.fillRect(M(x) + r() * M(w), M(z) + r() * M(h), 3 + r() * 5, 1);
  }
}

// 沙滩（含与草地的碎边过渡）
export function paintSandRect(g, x, z, w, h, r) {
  g.fillStyle = PAL.sand; g.fillRect(M(x), M(z), M(w), M(h));
  for (let i = 0; i < w * h * 2.4; i++) {
    g.fillStyle = r() < 0.5 ? '#D8C48E' : '#F4E8C4';
    g.fillRect(M(x) + Math.floor(r() * M(w)), M(z) + Math.floor(r() * M(h)), 1 + Math.floor(r() * 2), 1);
  }
}

// 地面画布 → 地面网格（LinearMipmap + anisotropy，proto 同款）
export function groundMesh(w, h, canvas) {
  const t = makeTexture(canvas.width, canvas.height, (gg) => gg.drawImage(canvas, 0, 0));
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h, 1, 1),
    new THREE.MeshLambertMaterial({ map: t })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(w / 2, 0, h / 2);
  mesh.receiveShadow = true;
  return mesh;
}

// ================= 动态水面（uv 滚动 + 高光层）=================
function waterWaveTex(season, glint) {
  const t = makeTexture(64, 64, (g) => {
    const r = rng(hashStr('wave' + season + glint));
    if (!glint) {
      g.fillStyle = PAL.water[season]; g.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 26; i++) {
        g.fillStyle = PAL.waterD[season];
        g.fillRect(Math.floor(r() * 60), Math.floor(r() * 64), 4 + Math.floor(r() * 8), 1);
      }
      for (let i = 0; i < 10; i++) {
        g.fillStyle = shade(PAL.water[season], 22);
        g.fillRect(Math.floor(r() * 60), Math.floor(r() * 64), 3 + Math.floor(r() * 6), 1);
      }
    } else {
      g.clearRect(0, 0, 64, 64);
      for (let i = 0; i < 12; i++) {
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.fillRect(Math.floor(r() * 58), Math.floor(r() * 64), 3 + Math.floor(r() * 6), 1);
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  return t;
}

// 返回带 userData.water.update 的组：底色层 + 加法高光层，双向滚动 = 波光
export function makeAnimatedWater(w, h, season, opt = {}) {
  const g = new THREE.Group();
  const repX = Math.max(1, Math.round(w / 8)), repY = Math.max(1, Math.round(h / 8));
  const base = waterWaveTex(season, false);
  base.repeat.set(repX, repY);
  const m1 = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshLambertMaterial({ map: base, transparent: true, opacity: opt.opacity ?? 0.92 })
  );
  m1.rotation.x = -Math.PI / 2;
  const glint = waterWaveTex(season, true);
  glint.repeat.set(repX, repY);
  const m2 = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: glint, transparent: true, opacity: opt.glintOpacity ?? 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false,
      color: new THREE.Color(2.1, 2.0, 1.7), // HDR 发光（触发 bloom 辉光）
    })
  );
  m2.rotation.x = -Math.PI / 2; m2.position.y = 0.012;
  g.add(m1, m2);
  const sp = (opt.speed ?? 1) * 2.6;
  g.userData.water = {
    mats: [m1.material, m2.material],
    update(dt, t) {
      base.offset.x = (t * 0.021 * sp) % 1; base.offset.y = (t * 0.013 * sp) % 1;
      glint.offset.x = (1 - t * 0.024 * sp) % 1; glint.offset.y = (t * 0.015 * sp) % 1;
      m2.material.opacity = (opt.glintOpacity ?? 0.32) * (0.75 + 0.25 * Math.sin(t * 2.6));
    },
  };
  return g;
}

// ================= 建筑与道具 =================
// 通用低模建筑：盒墙 + 双坡屋顶 + 山墙 + 门窗 + 烟囱；face=1 门在 +z 侧，-1 在 -z 侧
// 程序化建筑纹理
function plasterTex(base, beam, ruined) {
  return makeTexture(32, 32, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 32, 32);
    const r = rng(hashStr('plaster' + base));
    for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? shade(base, -10) : shade(base, 10); g.globalAlpha = 0.5; g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 2, 1); }
    g.globalAlpha = 1;
    // 木骨梁（角柱 + 上下横梁）
    g.fillStyle = beam;
    g.fillRect(0, 0, 3, 32); g.fillRect(29, 0, 3, 32);
    g.fillRect(0, 0, 32, 2); g.fillRect(0, 29, 32, 3);
    g.fillRect(0, 15, 32, 1);
    if (ruined) { g.fillStyle = shade(beam, -20); for (let i = 0; i < 6; i++) g.fillRect(4 + Math.floor(r() * 24), 4 + Math.floor(r() * 22), 2, 1); }
  });
}
function roofTileTex(col, ruined) {
  return makeTexture(32, 32, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, 32, 32);
    const dark = shade(col, -26), lite = shade(col, 18);
    for (let y = 0; y < 32; y += 6) {
      g.fillStyle = dark; g.fillRect(0, y, 32, 1);
      for (let x = (y % 12 === 0 ? 0 : 4); x < 32; x += 8) { g.fillStyle = dark; g.fillRect(x, y + 1, 1, 5); }
      g.fillStyle = lite; g.fillRect(0, y + 1, 32, 1);
    }
    if (ruined) { const r = rng(hashStr('ruin' + col)); g.fillStyle = '#3A3026'; for (let i = 0; i < 8; i++) g.fillRect(Math.floor(r() * 28), Math.floor(r() * 28), 4, 3); }
  });
}
function doorTex(col) {
  return makeTexture(16, 24, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, 16, 24);
    const dark = shade(col, -22);
    g.fillStyle = dark;
    g.fillRect(7, 1, 1, 22); g.fillRect(1, 1, 1, 22); g.fillRect(14, 1, 1, 22);
    g.fillRect(1, 6, 14, 1); g.fillRect(1, 17, 14, 1);
    g.fillStyle = '#E8C469'; g.fillRect(12, 12, 2, 2); // 把手
  });
}

// 通用低模建筑（细致版）：石基座 + 木骨墙 + 瓦片双坡屋顶 + 门框窗框 + 烟囱
export function makeBuilding(opt = {}) {
  const {
    w = 6, d = 5, h = 2.6, face = 1,
    wall = PAL.wall, roof = PAL.roof, trim = PAL.woodD,
    windows = 2, chimney = true, ruined = false,
  } = opt;
  const g = new THREE.Group();
  const wallC = ruined ? shade(wall, -34) : wall;
  const roofC = ruined ? shade(roof, -40) : roof;
  const wallTex = plasterTex(wallC, shade(trim, -10), ruined);
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(Math.max(1, Math.round(w / 3)), 1);
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTex });
  const roofTex = roofTileTex(roofC, ruined);
  roofTex.wrapS = roofTex.wrapT = THREE.RepeatWrapping;
  roofTex.repeat.set(Math.max(1, Math.round(w / 3)), 1);
  const roofMat = new THREE.MeshLambertMaterial({ map: roofTex });
  const trimMat = new THREE.MeshLambertMaterial({ color: trim, flatShading: true });
  const stoneMat = new THREE.MeshLambertMaterial({ color: PAL.stoneD, flatShading: true });

  // 石基座
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3), stoneMat);
  plinth.position.y = 0.17;
  // 墙体
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  base.position.y = 0.3 + h / 2;
  // 屋顶：双坡（绕屋脊线旋转）+ 屋脊 + 檐口 + 两端山墙
  const rw = w + 1.0, rz = d / 2 + 0.75;
  const ridgeY = 0.3 + h + 1.06;
  const rise = ridgeY - (0.3 + h) + 0.06; // 屋脊高出墙顶
  const L = Math.hypot(rz, rise);
  const alpha = Math.atan2(rise, rz);
  const slopeS = new THREE.BoxGeometry(rw, 0.16, L);
  slopeS.translate(0, 0, L / 2); // 内缘对齐屋脊
  const roofR = new THREE.Mesh(slopeS, roofMat);
  roofR.rotation.x = alpha;
  roofR.position.set(0, ridgeY, 0);
  const slopeN = new THREE.BoxGeometry(rw, 0.16, L);
  slopeN.translate(0, 0, -L / 2);
  const roofL = new THREE.Mesh(slopeN, roofMat);
  roofL.rotation.x = -alpha;
  roofL.position.set(0, ridgeY, 0);
  if (ruined) { roofL.rotation.x = -alpha + 0.14; roofL.position.x = -0.3; roofL.position.y = ridgeY - 0.2; }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.18, 0.26), trimMat);
  ridge.position.y = ridgeY + 0.06;
  // 两端山墙（平面三角，贴合墙体两侧，DoubleSide）
  const tri = new THREE.Shape();
  tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, rise + 0.1); tri.closePath();
  const gableGeo = new THREE.ShapeGeometry(tri);
  const gableMat = new THREE.MeshLambertMaterial({ color: wallC, side: THREE.DoubleSide });
  const gableL = new THREE.Mesh(gableGeo, gableMat);
  gableL.rotation.y = Math.PI / 2;
  gableL.position.set(-w / 2, 0.3 + h, 0);
  const gableR = new THREE.Mesh(gableGeo, gableMat);
  gableR.rotation.y = -Math.PI / 2;
  gableR.position.set(w / 2, 0.3 + h, 0);
  // 门（框 + 门板纹理 + 石阶）
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.14), trimMat);
  doorFrame.position.set(0, 1.0, face * (d / 2 + 0.05));
  const doorPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshLambertMaterial({ map: doorTex(ruined ? '#4A3A28' : shade(trim, -8)) }));
  doorPanel.position.set(0, 0.95, face * (d / 2 + 0.13));
  if (face === -1) doorPanel.rotation.y = Math.PI;
  const step = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 0.7), stoneMat);
  step.position.set(0, 0.07, face * (d / 2 + 0.4));
  g.add(plinth, base, roofL, roofR, ridge, gableL, gableR, doorFrame, doorPanel, step);
  // 窗（框 + 棂 + 夜间发光 + 窗台）
  const winMats = [];
  const paneMat = ruined
    ? new THREE.MeshLambertMaterial({ color: '#5A4A34', flatShading: true })
    : new THREE.MeshLambertMaterial({ color: PAL.winDark, emissive: new THREE.Color(PAL.winLit), emissiveIntensity: 0 });
  for (let i = 0; i < windows; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const wx = side * (w / 2 - 1.4);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.14), trimMat);
    frame.position.set(wx, 1.6, face * (d / 2 + 0.06));
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.1), paneMat);
    pane.position.set(wx, 1.6, face * (d / 2 + 0.1));
    const mullV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.04), trimMat);
    mullV.position.set(wx, 1.6, face * (d / 2 + 0.16));
    const mullH = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.04), trimMat);
    mullH.position.set(wx, 1.6, face * (d / 2 + 0.16));
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.24), trimMat);
    sill.position.set(wx, 0.95, face * (d / 2 + 0.1));
    g.add(frame, pane, mullV, mullH, sill);
    if (ruined) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 0.14), trimMat);
      plank.position.set(wx, 1.6, face * (d / 2 + 0.18)); plank.rotation.z = 0.35 * side;
      g.add(plank);
    } else if (i === 0) {
      // 窗台花箱
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.26), trimMat);
      box.position.set(wx, 0.78, face * (d / 2 + 0.14));
      const flowers = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.18), new THREE.MeshLambertMaterial({ color: '#E87A9A', flatShading: true }));
      flowers.position.set(wx, 0.95, face * (d / 2 + 0.15));
      g.add(box, flowers);
    }
  }
  if (!ruined) winMats.push(paneMat);
  // 烟囱（带帽檐，立在屋脊旁）
  if (chimney) {
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.3, 0.55), stoneMat);
    ch.position.set(w / 2 - 1.2, ridgeY - 0.3, -d / 6);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.75), trimMat);
    cap.position.set(w / 2 - 1.2, ridgeY + 0.4, -d / 6);
    g.add(ch, cap);
    g.userData.chimney = { x: w / 2 - 1.2, y: ridgeY + 0.5, z: -d / 6 };
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.windows = winMats;
  return g;
}

// 门牌（手绘文字小木牌，挂在建筑门旁）
export function makeSignBoard(text, opt = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: PAL.wood, flatShading: true });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.1, 5), mat);
  post.position.y = 0.55;
  const tex = makeTexture(64, 32, (gg) => {
    gg.fillStyle = '#B89B6A'; gg.fillRect(0, 0, 64, 32);
    gg.fillStyle = '#8A6A42'; gg.fillRect(0, 0, 64, 2); gg.fillRect(0, 30, 64, 2);
    gg.fillStyle = '#3A2A1A';
    gg.font = 'bold 15px "Microsoft YaHei", sans-serif';
    gg.textAlign = 'center'; gg.textBaseline = 'middle';
    gg.fillText(text, 32, 17);
  });
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.58),
    new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })
  );
  board.position.y = 1.25;
  if (opt.faceRotY != null) board.rotation.y = opt.faceRotY;
  g.add(post, board);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// 石桥（拱面 + 栏杆 + 桥头柱）
export function makeStoneBridge(len = 6, wid = 2.6) {
  const g = new THREE.Group();
  const stone = new THREE.MeshLambertMaterial({ color: shade(PAL.stone, 6), flatShading: true });
  const stoneD = new THREE.MeshLambertMaterial({ color: PAL.stoneD, flatShading: true });
  const n = Math.max(3, Math.round(len));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const y = 0.12 + Math.sin(t * Math.PI) * 0.35; // 拱
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.22, wid), stone);
    slab.position.set(-len / 2 + 0.5 + i * (len / n), y, 0);
    slab.rotation.z = Math.cos(t * Math.PI) * -0.18;
    g.add(slab);
  }
  for (const sz of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.14), stoneD);
    rail.position.set(0, 0.75, sz * (wid / 2 - 0.07));
    g.add(rail);
    for (let i = 0; i <= n; i += Math.max(1, Math.floor(n / 3))) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.18), stoneD);
      p.position.set(-len / 2 + i * (len / n), 0.45, sz * (wid / 2 - 0.07));
      g.add(p);
    }
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// 木码头（桩 + 板面 + 边绳）
export function makePier(len = 8, wid = 2.2) {
  const g = new THREE.Group();
  const wt = woodTex(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(Math.max(1, len / 2), 1);
  const wood = new THREE.MeshLambertMaterial({ map: wt });
  const woodD = new THREE.MeshLambertMaterial({ map: barkTex() });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, wid), wood);
  deck.position.y = 0.42;
  g.add(deck);
  for (let i = 0; i <= len; i += 2) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.1, 5), woodD);
      post.position.set(-len / 2 + i, 0, sz * (wid / 2 - 0.12));
      g.add(post);
    }
  }
  for (const sz of [-1, 1]) {
    const rope = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.05), woodD);
    rope.position.set(0, 0.72, sz * (wid / 2 - 0.12));
    g.add(rope);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// 公告板（板面 + 手绘告示纸条）
export function makeNoticeBoard() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: PAL.wood, flatShading: true });
  for (const sx of [-0.8, 0.8]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 5), mat);
    post.position.set(sx, 1.1, 0);
    g.add(post);
  }
  const tex = makeTexture(64, 40, (gg) => {
    const r = rng(hashStr('notice'));
    gg.fillStyle = '#8A6A42'; gg.fillRect(0, 0, 64, 40);
    gg.fillStyle = '#A8845A'; gg.fillRect(2, 2, 60, 36);
    const cols = ['#F0EAD8', '#F5E8C8', '#E8F0D8', '#F0D8D8'];
    for (let i = 0; i < 6; i++) {
      gg.fillStyle = cols[i % 4];
      const x = 5 + (i % 3) * 19, y = 5 + Math.floor(i / 3) * 17;
      gg.fillRect(x, y, 15, 13);
      gg.fillStyle = '#6A5A48';
      for (let l = 0; l < 3; l++) gg.fillRect(x + 2, y + 3 + l * 3, 11 * (0.5 + r() * 0.5), 1);
    }
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.1), mat);
  board.position.y = 1.7;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 1.25), new THREE.MeshLambertMaterial({ map: tex }));
  face.position.set(0, 1.7, 0.06);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.5), new THREE.MeshLambertMaterial({ color: PAL.roofD, flatShading: true }));
  roof.position.y = 2.48; roof.rotation.x = 0.15;
  g.add(board, face, roof);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// 长椅
export function makeBench() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: PAL.wood, flatShading: true });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.09, 0.5), mat);
  seat.position.y = 0.45;
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.08), mat);
  back.position.set(0, 0.75, -0.22); back.rotation.x = -0.12;
  g.add(seat, back);
  for (const sx of [-0.65, 0.65]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.45), mat);
    leg.position.set(sx, 0.22, 0);
    g.add(leg);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// 花丛（交叉面片 + 手绘花）
export function makeFlowerPatch(season) {
  const cols = ['#FFC9DD', '#FFF8DC', '#E86A8A', '#B89AE8'];
  const tex = makeTexture(16, 16, (g) => {
    const r = rng(hashStr('flower' + Math.random()));
    g.clearRect(0, 0, 16, 16);
    for (let i = 0; i < 4; i++) {
      const x = 2 + i * 3.5, h = 5 + r() * 5;
      g.fillStyle = shade(PAL.grass[season], 26);
      g.fillRect(x, 16 - h, 1, h);
      g.fillStyle = cols[Math.floor(r() * 4)];
      g.fillRect(x - 1, 16 - h - 2, 3, 2);
    }
  });
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), mat);
  p1.position.y = 0.28;
  const p2 = p1.clone(); p2.rotation.y = Math.PI / 2;
  g.add(p1, p2);
  g.userData.sway = { tuft: g, phase: Math.random() * 6 };
  return g;
}

// 花坛（石边 + 花）
export function makeFlowerBed(season) {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.2, 0.3, 8),
    new THREE.MeshLambertMaterial({ color: PAL.stoneD, flatShading: true })
  );
  rim.position.y = 0.15;
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.32, 8),
    new THREE.MeshLambertMaterial({ color: PAL.till, flatShading: true })
  );
  soil.position.y = 0.17;
  g.add(rim, soil);
  const r = rng(hashStr('bed'));
  for (let i = 0; i < 5; i++) {
    const f = makeFlowerPatch(season);
    const a = r() * 6.28, rad = r() * 0.6;
    f.position.set(Math.cos(a) * rad, 0.3, Math.sin(a) * rad);
    g.add(f);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
