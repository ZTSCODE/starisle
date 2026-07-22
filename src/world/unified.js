// 一体化世界底图：整个汐溪谷绘制在一张大画布上（连续路网/海岸线/生物群系过渡）
// 替代原先 5 块拼接地面纹理，从根上消除接缝、色块切割、边缘不规则。
// 画布范围：x -16..144, z -48..112（160×160m，8px/m = 1280×1280）
import * as THREE from 'three';
import { PAL, shade, mkCanvas } from '../render/textures.js';
import { rng, hashStr } from '../core/rng.js';

export const WORLD_BOUNDS = { x0: -16, z0: -48, w: 160, h: 160 };
const RES = 8; // px/m

export function buildUnifiedGround(season) {
  const W = WORLD_BOUNDS.w * RES, H = WORLD_BOUNDS.h * RES;
  const c = mkCanvas(W, H);
  const g = c.getContext('2d');
  const r = rng(hashStr('unified' + season));
  const grass = PAL.grass[season], grassD = PAL.grassD[season];
  const X = (wx) => (wx - WORLD_BOUNDS.x0) * RES;
  const Z = (wz) => (wz - WORLD_BOUNDS.z0) * RES;

  // ============ 1. 基础草地（全图统一底） ============
  g.fillStyle = grass; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() < 0.5 ? grassD : shade(grass, 18);
    g.globalAlpha = 0.06 + r() * 0.09;
    g.beginPath(); g.arc(r() * W, r() * H, 5 + r() * 20, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 22000; i++) {
    g.fillStyle = r() < 0.6 ? grassD : shade(grass, 16);
    g.fillRect(Math.floor(r() * W), Math.floor(r() * H), 1 + Math.floor(r() * 2), 1);
  }

  // ============ 2. 生物群系底色（自然晕染过渡） ============
  const biome = (cx, cz, rx, rz, color, alpha, edge) => {
    // 椭圆渐变晕染（径向 alpha 衰减，天然过渡无生硬边）
    for (let i = 0; i < 900; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const px = cx + Math.cos(a) * rx * d, pz = cz + Math.sin(a) * rz * d;
      const fade = Math.max(0, 1 - d * (edge || 1));
      g.fillStyle = color;
      g.globalAlpha = alpha * fade;
      g.fillRect(px - 3 + r() * 6, pz - 3 + r() * 6, 2 + r() * 3, 1 + r() * 2);
    }
    g.globalAlpha = 1;
  };
  // 森林（东）：深绿浓密
  biome(X(72), Z(28), 30 * RES, 22 * RES, shade(grass, -22), 0.5);
  // 山路（北）：岩草色
  biome(X(24), Z(-16), 26 * RES, 18 * RES, '#8A9A6A', 0.55);
  // 海滩（东南）：沙色
  biome(X(76), Z(64), 24 * RES, 18 * RES, shade(PAL.sand, -8), 0.75);
  // 镇中心（广场）：石板色
  biome(X(28), Z(66), 10 * RES, 8 * RES, '#B8B0A0', 0.7, 1.4);

  // ============ 3. 海洋（南/东边界 + 海岸线） ============
  const paintSea = (x0, z0, x1, z1) => {
    g.fillStyle = shade(PAL.water[season], -18);
    g.fillRect(X(x0), Z(z0), X(x1) - X(x0), Z(z1) - Z(z0));
    // 波浪纹理
    for (let i = 0; i < 700; i++) {
      const px = X(x0) + r() * (X(x1) - X(x0)), pz = Z(z0) + r() * (Z(z1) - Z(z0));
      g.fillStyle = r() < 0.5 ? shade(PAL.water[season], -30) : shade(PAL.water[season], 8);
      g.fillRect(px, pz, 3 + r() * 6, 1);
    }
  };
  paintSea(-16, 96, 144, 112);   // 南海
  paintSea(96, -48, 144, 96);    // 东海
  // 海岸线：泡沫白边（正弦弯曲）
  g.strokeStyle = 'rgba(240,250,252,0.8)'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath();
  for (let x = -16; x <= 96; x += 2) {
    const y = 96 + Math.sin(x * 0.15) * 1.5;
    x === -16 ? g.moveTo(X(x), Z(y)) : g.lineTo(X(x), Z(y));
  }
  g.stroke();
  g.beginPath();
  for (let z = -48; z <= 96; z += 2) {
    const x = 96 + Math.sin(z * 0.15) * 1.5;
    z === -48 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z));
  }
  g.stroke();
  // 海滩南岸沙地（沙色晕染入海）
  biome(X(76), Z(88), 24 * RES, 10 * RES, shade(PAL.sand, -8), 0.5, 1.6);

  // ============ 4. 连续路网（一体化绘制，永不脱节） ============
  const pathC = PAL.path, pathD = shade(PAL.path, -14);
  const road = (pts, w) => {
    g.strokeStyle = pathC; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    pts.forEach(([x, z], i) => i === 0 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z)));
    g.stroke();
    g.strokeStyle = pathD; g.lineWidth = w * 0.7;
    g.beginPath();
    pts.forEach(([x, z], i) => i === 0 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z)));
    g.stroke();
  };
  // 农场主路（纵贯农场→进镇）
  road([[23.5, -2], [23.5, 48], [23.5, 66]], 12);
  // 山路连接（农场北→矿井）
  road([[23.5, 2], [24, -14], [24, -28]], 9);
  // 农场→森林→海滩（横向）
  road([[10, 23], [40, 23], [56, 26], [72, 28], [88, 34], [92, 48]], 8);
  // 镇内环路
  road([[12, 52], [40, 52], [48, 60], [48, 76], [40, 84], [12, 84], [6, 68], [12, 52]], 9);
  // 镇→海滩
  road([[48, 74], [64, 74], [80, 72], [92, 68]], 8);
  // 镇广场（石板铺地）
  g.fillStyle = '#B8B0A0';
  g.beginPath(); g.ellipse(X(28), Z(66), 9 * RES, 7 * RES, 0, 0, 7); g.fill();
  for (let i = 0; i < 120; i++) {
    g.fillStyle = r() < 0.5 ? '#A8A090' : '#C8C0B0';
    g.fillRect(X(28) - 9 * RES + r() * 18 * RES, Z(66) - 7 * RES + r() * 14 * RES, 2, 1);
  }
  // 路面碎石
  for (let i = 0; i < 500; i++) {
    g.fillStyle = shade(pathC, r() < 0.5 ? -20 : 12);
    g.fillRect(r() * W, r() * H, 2, 1);
  }

  // ============ 5. 水体（池塘/湖/河——岸线晕染，动态水面在其上） ============
  const waterBody = (cx, cz, rx, rz) => {
    g.fillStyle = shade(PAL.waterD[season], -10);
    g.beginPath(); g.ellipse(X(cx), Z(cz), (rx + 4) * RES, (rz + 4) * RES, 0, 0, 7); g.fill();
    g.fillStyle = PAL.water[season];
    g.beginPath(); g.ellipse(X(cx), Z(cz), rx * RES, rz * RES, 0, 0, 7); g.fill();
    for (let i = 0; i < 30; i++) {
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.fillRect(X(cx) - rx * RES + r() * rx * 2 * RES, Z(cz) - rz * RES + r() * rz * 2 * RES, 3 + r() * 5, 1);
    }
  };
  waterBody(33, 32, 4.4, 3.6);   // 农场景塘
  waterBody(70, 18, 6, 4.5);     // 森林湖
  waterBody(24, -8, 3.5, 3);     // 山间湖
  // 镇内河（弯曲河道）
  g.strokeStyle = shade(PAL.waterD[season], -10); g.lineWidth = 5 * RES; g.lineCap = 'round';
  g.beginPath();
  const riverPts = [[-4, 58], [12, 60], [26, 62], [40, 66], [52, 74], [60, 88], [64, 96]];
  riverPts.forEach(([x, z], i) => i === 0 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z)));
  g.stroke();
  g.strokeStyle = PAL.water[season]; g.lineWidth = 3.4 * RES;
  g.beginPath();
  riverPts.forEach(([x, z], i) => i === 0 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z)));
  g.stroke();

  // ============ 6. 农田垄沟（农场南区） ============
  const fx = X(6), fz = Z(40), fw = 20 * RES, fh = 8 * RES;
  g.fillStyle = PAL.till; g.fillRect(fx, fz, fw, fh);
  for (let y = 0; y < fh; y += 4) {
    g.fillStyle = shade(PAL.till, -16); g.fillRect(fx, fz + y, fw, 2);
    g.fillStyle = shade(PAL.till, 12); g.fillRect(fx, fz + y + 2, fw, 1);
  }

  // ============ 7. 氛围细节（花点/石点/落叶） ============
  for (let i = 0; i < 240; i++) {
    const inForest = r() < 0.5;
    const x = inForest ? 48 + r() * 48 : r() * 48, z = r() * 96;
    if (season <= 1) {
      g.fillStyle = r() < 0.5 ? PAL.flower : '#FFF8DC';
      g.fillRect(X(x), Z(z), 2, 2);
    }
    if (season === 2) {
      g.fillStyle = r() < 0.5 ? '#E8873A' : '#C94F3D';
      g.fillRect(X(x), Z(z), 2, 1);
    }
  }
  // 山地石点
  for (let i = 0; i < 260; i++) {
    g.fillStyle = r() < 0.5 ? PAL.stone : PAL.stoneD;
    g.fillRect(X(-10 + r() * 56), Z(-44 + r() * 38), 2 + r() * 3, 1 + r() * 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 一体化地面网格（单 Mesh 覆盖全图）
export function makeUnifiedGroundMesh(season) {
  const tex = buildUnifiedGround(season);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_BOUNDS.w, WORLD_BOUNDS.h),
    new THREE.MeshLambertMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(WORLD_BOUNDS.x0 + WORLD_BOUNDS.w / 2, -0.01, WORLD_BOUNDS.z0 + WORLD_BOUNDS.h / 2);
  mesh.receiveShadow = true;
  mesh.name = 'unifiedGround';
  return mesh;
}
