// 主题 vignette 道具库：中大型组合摆件（喷泉/咖啡座/渔船/营地/矿车…）
// 全部零碰撞、纯装饰；材质复用 render/textures.js 的像素贴图，风格与建筑一致。
import * as THREE from 'three';
import { stoneTex, woodTex, barkTex, metalTex, hayTex, makeTexture, shade } from '../render/textures.js';

const L = (o) => new THREE.MeshLambertMaterial(o);
const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const C = (rt, rb, h, n, m) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m);
const put = (parent, mesh, x, y, z, ry = 0, rx = 0, rz = 0) => {
  mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz); parent.add(mesh); return mesh;
};
const shadow = (g) => { g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; };

// ---------- 镇：喷泉（双层石泉，带流动水幕与溅花） ----------
export function makeFountain() {
  const g = new THREE.Group();
  const stone = L({ map: stoneTex() });
  const waterM = L({ color: '#5EC8E8', transparent: true, opacity: 0.85 });
  // 外池（八边形）+ 池沿 + 池水
  put(g, C(1.5, 1.6, 0.5, 8, stone), 0, 0.25, 0);
  put(g, C(1.62, 1.62, 0.14, 8, stone), 0, 0.52, 0);
  put(g, C(1.38, 1.38, 0.06, 8, waterM), 0, 0.5, 0);
  // 中柱 + 上盘 + 上盘水
  put(g, C(0.22, 0.3, 0.8, 7, stone), 0, 0.9, 0);
  put(g, C(0.72, 0.6, 0.22, 8, stone), 0, 1.35, 0);
  put(g, C(0.62, 0.62, 0.05, 8, waterM), 0, 1.44, 0);
  put(g, C(0.09, 0.12, 0.5, 6, stone), 0, 1.6, 0);
  // 水幕（UV 滚动纹理，两片交叉）
  const jetTex = makeTexture(8, 32, (gg) => {
    gg.clearRect(0, 0, 8, 32);
    for (let i = 0; i < 8; i++) { gg.fillStyle = i % 2 ? 'rgba(220,245,255,0.9)' : 'rgba(160,215,240,0.5)'; gg.fillRect(0, i * 4, 8, 2); }
  });
  jetTex.wrapS = jetTex.wrapT = THREE.RepeatWrapping;
  const jetM = new THREE.MeshBasicMaterial({ map: jetTex, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
  const j1 = put(g, new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.85), jetM), 0, 1.15, 0);
  const j2 = put(g, new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.85), jetM), 0, 1.15, 0, Math.PI / 2);
  j1.castShadow = j2.castShadow = false;
  g.userData.jetTex = jetTex;
  // 溅花（四颗小水珠）
  const dropM = new THREE.MeshBasicMaterial({ color: '#D8F4FF' });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    put(g, new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), dropM), Math.cos(a) * 0.75, 0.56, Math.sin(a) * 0.75);
  }
  return shadow(g);
}

// ---------- 镇：露天咖啡座（圆桌 + 遮阳伞 + 双凳） ----------
export function makeCafeSet(col = '#B8543E') {
  const g = new THREE.Group();
  const wood = L({ map: woodTex() });
  put(g, C(0.42, 0.42, 0.05, 8, wood), 0, 0.62, 0); // 桌面
  put(g, C(0.05, 0.06, 0.6, 6, wood), 0, 0.31, 0);  // 桌腿
  // 伞：杆 + 布锥 + 顶珠
  put(g, C(0.035, 0.045, 1.9, 6, L({ map: barkTex() })), 0.3, 0.95, 0.2);
  const canopyTex = makeTexture(16, 8, (gg) => {
    for (let i = 0; i < 8; i++) { gg.fillStyle = i % 2 ? col : '#FFF4E0'; gg.fillRect(i * 2, 0, 2, 8); }
  });
  put(g, C(0.02, 1.05, 0.5, 8, L({ map: canopyTex, side: THREE.DoubleSide })), 0.3, 1.95, 0.2);
  put(g, new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), L({ color: '#E8C469' })), 0.3, 2.25, 0.2);
  // 凳子 ×2 + 桌上小物（杯/花瓶）
  for (const [dx, dz] of [[-0.75, 0.15], [0.55, -0.65]]) {
    put(g, C(0.2, 0.24, 0.08, 7, wood), dx, 0.36, dz);
    put(g, C(0.05, 0.06, 0.32, 5, wood), dx, 0.16, dz);
  }
  put(g, C(0.05, 0.04, 0.1, 6, L({ color: '#FFF4E0' })), -0.12, 0.7, 0.1);
  put(g, C(0.035, 0.05, 0.14, 6, L({ color: '#E87A9A' })), 0.15, 0.72, -0.12);
  return shadow(g);
}

// ---------- 镇：A字广告牌（黑板粉笔字） ----------
export function makeASign(title = '特价') {
  const g = new THREE.Group();
  const wood = L({ map: woodTex() });
  const boardTex = makeTexture(32, 32, (gg) => {
    gg.fillStyle = '#2A2E33'; gg.fillRect(0, 0, 32, 32);
    gg.strokeStyle = '#E8E0C8'; gg.lineWidth = 2; gg.strokeRect(2, 2, 28, 28);
    gg.fillStyle = '#F0E8D0'; gg.font = 'bold 9px sans-serif'; gg.textAlign = 'center';
    gg.fillText(title, 16, 14);
    gg.fillRect(8, 20, 16, 2); gg.fillRect(10, 25, 12, 1);
  });
  const boardM = L({ map: boardTex, side: THREE.DoubleSide });
  put(g, B(0.55, 0.62, 0.04, boardM), 0, 0.32, 0.1, 0, 0.32);
  put(g, B(0.55, 0.62, 0.04, wood), 0, 0.32, -0.1, 0, -0.32);
  return shadow(g);
}

// ---------- 农场：柴堆 + 劈柴墩 + 斧头 ----------
export function makeWoodpile() {
  const g = new THREE.Group();
  const bark = L({ map: barkTex() });
  const endM = L({ color: '#D8B888' });
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 3 - row; i++) {
      const log = C(0.11, 0.11, 1.1, 6, [endM, bark, endM]);
      put(g, log, -0.3 + i * 0.32 + row * 0.16, 0.12 + row * 0.2, 0, 0, 0, Math.PI / 2);
    }
  }
  const stump = C(0.26, 0.3, 0.42, 7, bark);
  put(g, stump, 0.95, 0.21, 0.3);
  put(g, B(0.05, 0.5, 0.05, L({ map: woodTex() })), 0.95, 0.62, 0.3, 0, 0, -0.5); // 斧柄
  put(g, B(0.2, 0.12, 0.04, L({ map: metalTex() })), 0.86, 0.82, 0.3, 0, 0, -0.5); // 斧头
  return shadow(g);
}

// ---------- 农场：工具架（挂锄/锹/洒水壶） ----------
export function makeToolRack() {
  const g = new THREE.Group();
  const wood = L({ map: barkTex() });
  put(g, C(0.05, 0.06, 1.4, 5, wood), -0.7, 0.7, 0);
  put(g, C(0.05, 0.06, 1.4, 5, wood), 0.7, 0.7, 0);
  put(g, B(1.55, 0.07, 0.07, wood), 0, 1.32, 0);
  const metal = L({ map: metalTex() });
  // 锄头（挂）
  put(g, C(0.025, 0.025, 1.1, 5, L({ map: woodTex() })), -0.4, 0.62, 0.06);
  put(g, B(0.2, 0.12, 0.03, metal), -0.4, 1.12, 0.08, 0, 0.5);
  // 铁锹（挂）
  put(g, C(0.025, 0.025, 1.05, 5, L({ map: woodTex() })), 0.05, 0.6, 0.06);
  put(g, B(0.14, 0.2, 0.03, metal), 0.05, 1.18, 0.06);
  // 洒水壶（立地）
  const can = B(0.24, 0.2, 0.16, L({ color: '#5A7A8A' }));
  put(g, can, 0.48, 0.1, 0.12);
  put(g, C(0.02, 0.03, 0.24, 5, L({ color: '#5A7A8A' })), 0.62, 0.16, 0.12, 0, 0, 1.1);
  return shadow(g);
}

// ---------- 农场：蜂箱组 ×3 ----------
export function makeBeehouses() {
  const g = new THREE.Group();
  const hiveTex = makeTexture(16, 16, (gg) => {
    gg.fillStyle = '#E8C469'; gg.fillRect(0, 0, 16, 16);
    gg.fillStyle = '#B8892A'; for (let y = 2; y < 16; y += 5) gg.fillRect(0, y, 16, 2);
    gg.fillStyle = '#3A2A20'; gg.fillRect(6, 12, 4, 3); // 巢门
  });
  for (let i = 0; i < 3; i++) {
    const x = i * 0.75;
    put(g, B(0.5, 0.42, 0.42, L({ map: hiveTex })), x, 0.45, 0);
    put(g, B(0.56, 0.08, 0.48, L({ map: woodTex() })), x, 0.7, 0); // 顶盖
    put(g, B(0.46, 0.24, 0.36, L({ map: woodTex() })), x, 0.12, 0); // 底座
  }
  return shadow(g);
}

// ---------- 农场：手推车 ----------
export function makeWheelbarrow() {
  const g = new THREE.Group();
  const wood = L({ map: woodTex() });
  const tray = B(0.7, 0.25, 0.5, wood);
  put(g, tray, 0, 0.42, 0, 0, 0, -0.06);
  put(g, new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 10), L({ color: '#3A3230' })), 0.42, 0.18, 0); // 前轮（轴向 Z，无需旋转）
  put(g, B(0.5, 0.04, 0.04, wood), -0.5, 0.35, 0.14);
  put(g, B(0.5, 0.04, 0.04, wood), -0.5, 0.35, -0.14);
  put(g, B(0.04, 0.22, 0.04, wood), -0.25, 0.11, 0.16);
  put(g, B(0.04, 0.22, 0.04, wood), -0.25, 0.11, -0.16);
  put(g, new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), L({ color: '#8A6A4A' })), 0, 0.58, 0); // 车里土堆
  return shadow(g);
}

// ---------- 农场：牲畜水槽 ----------
export function makeTrough() {
  const g = new THREE.Group();
  const wood = L({ map: woodTex() });
  put(g, B(1.5, 0.3, 0.08, wood), 0, 0.2, 0.28);
  put(g, B(1.5, 0.3, 0.08, wood), 0, 0.2, -0.28);
  put(g, B(0.08, 0.3, 0.64, wood), 0.72, 0.2, 0);
  put(g, B(0.08, 0.3, 0.64, wood), -0.72, 0.2, 0);
  put(g, B(1.42, 0.04, 0.48, L({ color: '#4A90B8', transparent: true, opacity: 0.85 })), 0, 0.3, 0);
  put(g, new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), L({ map: hayTex() })), 0.9, 0.18, 0.35);
  return shadow(g);
}

// ---------- 海滩：搁浅渔船（高舷内舱 + 桅杆，可倾斜） ----------
export function makeRowboat(tilt = 0, col = '#8A5A2A') {
  const g = new THREE.Group();
  const wood = L({ map: woodTex() });
  const hullM = L({ color: col });
  const innerM = L({ color: '#3A2A20' });
  put(g, B(2.4, 0.24, 0.66, hullM), 0, 0.26, 0);                  // 船底
  put(g, B(2.5, 0.5, 0.09, hullM), 0, 0.52, 0.4, 0, -0.22);       // 高舷侧
  put(g, B(2.5, 0.5, 0.09, hullM), 0, 0.52, -0.4, 0, 0.22);
  put(g, B(2.2, 0.3, 0.5, innerM), 0, 0.42, 0);                   // 暗色内舱
  // 尖船头/船尾（楔形块）
  put(g, C(0.02, 0.34, 0.62, 4, hullM), 1.3, 0.5, 0, Math.PI / 4, 0, Math.PI / 2);
  put(g, B(0.14, 0.5, 0.7, hullM), -1.2, 0.5, 0, 0, 0, -0.15);
  put(g, B(0.5, 0.06, 0.56, wood), -0.45, 0.56, 0);               // 坐板
  put(g, B(0.5, 0.06, 0.56, wood), 0.55, 0.56, 0);
  // 桅杆 + 卷起的帆 + 缆绳
  put(g, C(0.045, 0.055, 2.2, 6, wood), 0.1, 1.5, 0);
  put(g, C(0.09, 0.09, 1.3, 6, L({ color: '#E8DCC8' })), 0.1, 2.15, 0, 0, 0, Math.PI / 2);
  // 船桨（搭在船舷）
  for (const dz of [0.32, -0.32]) {
    put(g, C(0.025, 0.025, 1.7, 5, wood), 0.2, 0.66, dz, 0, 0, Math.PI / 2 - 0.1);
    put(g, B(0.3, 0.1, 0.03, wood), 1.05, 0.56, dz);
  }
  if (tilt) g.rotation.z = tilt;
  return shadow(g);
}

// ---------- 海滩：渔网晾晒架 ----------
export function makeNetRack() {
  const g = new THREE.Group();
  const wood = L({ map: barkTex() });
  put(g, C(0.06, 0.07, 1.7, 5, wood), -1.1, 0.85, 0);
  put(g, C(0.06, 0.07, 1.7, 5, wood), 1.1, 0.85, 0);
  put(g, B(2.4, 0.06, 0.06, wood), 0, 1.62, 0);
  const netTex = makeTexture(16, 16, (gg) => {
    gg.clearRect(0, 0, 16, 16);
    gg.strokeStyle = 'rgba(230,220,190,0.95)'; gg.lineWidth = 2;
    for (let i = 0; i <= 16; i += 4) {
      gg.beginPath(); gg.moveTo(i, 0); gg.lineTo(i, 16); gg.stroke();
      gg.beginPath(); gg.moveTo(0, i); gg.lineTo(16, i); gg.stroke();
    }
    // 网结浮子
    gg.fillStyle = '#C85A3A';
    for (const [fx, fy] of [[4, 4], [12, 8], [8, 12]]) gg.fillRect(fx - 1, fy - 1, 2, 2);
  });
  const net = put(g, new THREE.Mesh(new THREE.PlaneGeometry(2, 1.1), L({ map: netTex, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide })), 0, 1.0, 0, 0, 0.06);
  net.castShadow = false;
  // 绳圈 + 鱼筐
  put(g, new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 6, 10), L({ color: '#C8B088' })), 1.35, 0.06, 0.3, 0, Math.PI / 2);
  put(g, C(0.28, 0.22, 0.3, 7, L({ color: '#B8892A' })), -1.4, 0.15, 0.35);
  return shadow(g);
}

// ---------- 海滩：浮标线（海面，浮动动画由 builder.update 驱动） ----------
export function makeBuoyLine(n = 5, spacing = 2.2) {
  const g = new THREE.Group();
  const bobbers = [];
  const cols = ['#E84A4A', '#FFF4E0', '#E84A4A', '#FFF4E0', '#E84A4A'];
  const pts = [];
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 6), L({ color: cols[i % cols.length] }));
    b.position.set(i * spacing, 0.1, Math.sin(i * 1.3) * 0.5);
    g.add(b); bobbers.push(b);
    pts.push(new THREE.Vector3(i * spacing, 0.06, Math.sin(i * 1.3) * 0.5));
  }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#6A6255' })));
  g.userData.bobbers = bobbers;
  return g;
}

// ---------- 海滩：遮阳伞 + 躺椅 + 沙滩桶 ----------
export function makeBeachSet(col = '#4A7AB8') {
  const g = new THREE.Group();
  put(g, C(0.04, 0.05, 1.8, 6, L({ map: barkTex() })), 0, 0.9, 0);
  const canopyTex = makeTexture(16, 8, (gg) => {
    for (let i = 0; i < 8; i++) { gg.fillStyle = i % 2 ? col : '#FFF4E0'; gg.fillRect(i * 2, 0, 2, 8); }
  });
  put(g, C(0.02, 1.15, 0.45, 8, L({ map: canopyTex, side: THREE.DoubleSide })), 0, 1.8, 0);
  // 躺椅（斜板 + 支架）
  const wood = L({ map: woodTex() });
  for (const [dx, ry] of [[-0.9, 0.4], [0.9, -0.5]]) {
    put(g, B(0.55, 0.05, 1.2, wood), dx, 0.22, 0.3, ry, -0.45);
    put(g, B(0.55, 0.05, 0.5, wood), dx, 0.08, 0.95, ry);
  }
  // 小桶 + 铲子
  put(g, C(0.14, 0.11, 0.2, 7, L({ color: '#E84A4A' })), 0.5, 0.1, 0.9);
  put(g, B(0.05, 0.25, 0.02, wood), 0.62, 0.2, 0.9, 0, 0, 0.4);
  return shadow(g);
}

// ---------- 森林：营地（帐篷 + 睡袋 + 背包 + 木凳） ----------
export function makeCampsite() {
  const g = new THREE.Group();
  // 帐篷（三角 prism）
  const tentTex = makeTexture(16, 16, (gg) => {
    gg.fillStyle = '#C8843A'; gg.fillRect(0, 0, 16, 16);
    gg.fillStyle = '#A8642A'; for (let i = 0; i < 16; i += 4) gg.fillRect(i, 0, 1, 16);
  });
  const tentM = L({ map: tentTex, side: THREE.DoubleSide });
  const left = put(g, B(1.7, 0.04, 1.5, tentM), -0.62, 0.72, 0, 0, 0, 0.98);
  const right = put(g, B(1.7, 0.04, 1.5, tentM), 0.62, 0.72, 0, 0, 0, -0.98);
  left.castShadow = right.castShadow = true;
  put(g, B(0.06, 0.06, 1.6, L({ map: barkTex() })), 0, 1.28, 0); // 脊杆
  const back = put(g, C(0.75, 0.75, 0.05, 3, tentM), 0, 0.62, -0.72, Math.PI / 2, 0, Math.PI / 2);
  back.rotation.x = 0; back.rotation.y = Math.PI / 2; back.rotation.z = -Math.PI / 2;
  // 睡袋 + 背包
  put(g, B(0.5, 0.14, 1.1, L({ color: '#7AB8E8' })), 0.2, 0.07, -0.1, 0.2);
  const pack = put(g, B(0.36, 0.42, 0.22, L({ color: '#8A5A2A' })), 1.3, 0.21, 0.5, -0.4);
  put(g, B(0.3, 0.08, 0.06, L({ color: '#5A3A1A' })), 1.3, 0.34, 0.62, -0.4);
  pack.castShadow = true;
  // 原木凳 ×2
  for (const [dx, dz, ry] of [[-1.1, 0.9, 0.4], [0.9, 1.2, -0.9]]) {
    put(g, C(0.18, 0.2, 0.42, 7, L({ map: barkTex() })), dx, 0.21, dz, ry);
  }
  return shadow(g);
}

// ---------- 森林：立石阵 ----------
export function makeStoneCircle(n = 5, radius = 2.2) {
  const g = new THREE.Group();
  const stone = L({ map: stoneTex() });
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const h = 1.3 + (i % 3) * 0.35;
    const s = put(g, B(0.6, h, 0.45, stone), Math.cos(a) * radius, h / 2 - 0.1, Math.sin(a) * radius, a + 0.3, (i % 2 ? 0.06 : -0.05));
    s.castShadow = true;
  }
  put(g, C(0.7, 0.8, 0.22, 7, stone), 0, 0.06, 0); // 中心祭台
  return g;
}

// ---------- 湖畔：垂钓台 + 鱼竿架 ----------
export function makeFishingDock() {
  const g = new THREE.Group();
  const wood = L({ map: woodTex() });
  put(g, B(2.2, 0.1, 1.6, wood), 0, 0.42, 0);
  for (const [dx, dz] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]]) {
    put(g, C(0.07, 0.08, 0.85, 5, L({ map: barkTex() })), dx, 0.2, dz);
  }
  // 竿架：两立柱 + 横杆 + 三根斜靠鱼竿
  put(g, C(0.04, 0.05, 0.9, 5, wood), -0.95, 0.85, 0.55);
  put(g, C(0.04, 0.05, 0.9, 5, wood), -0.35, 0.85, 0.55);
  put(g, B(0.7, 0.05, 0.05, wood), -0.65, 1.25, 0.55);
  for (let i = 0; i < 3; i++) {
    put(g, C(0.015, 0.02, 1.5, 4, L({ color: '#6A4A2A' })), -0.85 + i * 0.22, 1.05, 0.45, 0, -0.5, 0.35);
  }
  put(g, C(0.16, 0.13, 0.24, 7, L({ color: '#8A8A96' })), 0.7, 0.54, 0.4); // 鱼饵桶
  return shadow(g);
}

// ---------- 矿口：轨道矿车（带矿石） ----------
export function makeOreCart() {
  const g = new THREE.Group();
  const metal = L({ map: metalTex() });
  const bodyM = L({ color: '#5A4A3A' });
  // 梯形车斗（上宽下窄，两斜面近似）
  put(g, B(1.1, 0.35, 0.8, bodyM), 0, 0.62, 0);
  put(g, B(1.2, 0.1, 0.9, bodyM), 0, 0.82, 0);
  for (const [dx, dz] of [[-0.4, 0.42], [0.4, 0.42], [-0.4, -0.42], [0.4, -0.42]]) {
    put(g, C(0.14, 0.14, 0.08, 8, metal), dx, 0.28, dz, 0, 0, Math.PI / 2); // 轮轴沿 X，与轨道同向
  }
  put(g, B(0.9, 0.28, 0.6, metal), 0, 0.4, 0); // 底盘
  // 矿石堆（黑亮 + 晶点）
  const oreM = L({ color: '#3A3A46' });
  for (let i = 0; i < 5; i++) {
    put(g, new THREE.Mesh(new THREE.IcosahedronGeometry(0.13 + (i % 3) * 0.04, 0), oreM), -0.3 + (i % 3) * 0.3, 0.95, -0.15 + Math.floor(i / 3) * 0.3, i);
  }
  const gem = put(g, new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), L({ color: '#7AE8C8', emissive: 0x2a8a70, emissiveIntensity: 0.7 })), 0.15, 1.08, 0.1);
  gem.castShadow = false;
  return shadow(g);
}

// ---------- 矿口：危险警示牌 ----------
export function makeWarningSign() {
  const g = new THREE.Group();
  put(g, C(0.05, 0.06, 1.3, 5, L({ map: barkTex() })), 0, 0.65, 0);
  const signTex = makeTexture(24, 24, (gg) => {
    gg.fillStyle = '#E8C469'; gg.fillRect(0, 0, 24, 24);
    gg.strokeStyle = '#2A2418'; gg.lineWidth = 3; gg.strokeRect(1, 1, 22, 22);
    gg.fillStyle = '#2A2418'; gg.font = 'bold 18px sans-serif'; gg.textAlign = 'center';
    gg.fillText('!', 12, 19);
  });
  put(g, B(0.5, 0.5, 0.05, L({ map: signTex })), 0, 1.25, 0.04);
  put(g, B(0.55, 0.08, 0.06, L({ map: woodTex() })), 0, 0.95, 0);
  return shadow(g);
}

// ---------- 公园：八角凉亭 ----------
export function makeGazebo() {
  const g = new THREE.Group();
  const wood = L({ map: woodTex() });
  const stone = L({ map: stoneTex() });
  // 石台基 + 木地板
  put(g, C(2.2, 2.4, 0.3, 8, stone), 0, 0.15, 0);
  put(g, C(2.0, 2.0, 0.12, 8, wood), 0, 0.36, 0);
  // 8 柱 + 围栏 + 双层顶
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    put(g, C(0.07, 0.08, 2.2, 6, wood), Math.cos(a) * 1.85, 1.45, Math.sin(a) * 1.85);
    const rail = put(g, B(1.35, 0.4, 0.06, wood), Math.cos(a + Math.PI / 8) * 1.82, 0.85, Math.sin(a + Math.PI / 8) * 1.82);
    rail.rotation.y = -a - Math.PI / 8 + Math.PI / 2;
  }
  put(g, C(0.02, 2.75, 1.1, 8, L({ color: '#B8543E', flatShading: true })), 0, 3.1, 0);
  put(g, C(0.02, 1.35, 0.75, 8, L({ color: '#A8443A', flatShading: true })), 0, 4.0, 0);
  put(g, new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), L({ color: '#E8C469' })), 0, 4.5, 0);
  // 内部石桌石凳
  put(g, C(0.42, 0.46, 0.5, 8, stone), 0, 0.6, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    put(g, C(0.2, 0.22, 0.35, 6, stone), Math.cos(a) * 1.1, 0.55, Math.sin(a) * 1.1);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// ---------- 樱花树（西巷公园特色树，粉冠） ----------
export function makeBlossomTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.2 * scale, 1.6 * scale, 6), L({ map: barkTex() }));
  put(g, trunk, 0, 0.8 * scale, 0);
  const pink = ['#FFC9DD', '#FFB8D0', '#FFD8E8'];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry((0.85 - i * 0.08) * scale, 0), L({ color: pink[i % 3], flatShading: true }));
    blob.position.set(Math.cos(a) * 0.55 * scale, (1.9 + (i % 2) * 0.5) * scale, Math.sin(a) * 0.55 * scale);
    blob.castShadow = true;
    g.add(blob);
  }
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 * scale, 0), L({ color: '#FFD0E0', flatShading: true }));
  top.position.y = 2.6 * scale; top.castShadow = true;
  g.add(top);
  // 飘落花瓣（静态点缀在根部）
  const petal = new THREE.Mesh(new THREE.CircleGeometry(0.5 * scale, 8), L({ color: '#FFC9DD', transparent: true, opacity: 0.6 }));
  petal.rotation.x = -Math.PI / 2; petal.position.y = 0.02;
  g.add(petal);
  return g;
}

// ---------- 镇：石井（与农场景观井错位的镇口老井） ----------
export function makeTownWell() {
  const g = new THREE.Group();
  const stone = L({ map: stoneTex() });
  put(g, C(0.75, 0.85, 0.8, 8, stone), 0, 0.4, 0);
  put(g, C(0.68, 0.68, 0.1, 8, L({ color: '#16202A' })), 0, 0.78, 0); // 井口黑洞
  const wood = L({ map: woodTex() });
  put(g, C(0.05, 0.06, 1.6, 5, wood), -0.7, 0.8, 0);
  put(g, C(0.05, 0.06, 1.6, 5, wood), 0.7, 0.8, 0);
  put(g, C(0.03, 0.03, 1.5, 5, wood), 0, 1.5, 0, 0, 0, Math.PI / 2);
  put(g, C(0.09, 0.09, 0.5, 6, L({ map: barkTex() })), 0, 1.5, 0, 0, 0, Math.PI / 2); // 辘轳
  put(g, B(0.62, 0.4, 0.9, L({ color: '#8A4A3A' })), 0, 1.85, 0); // 顶
  put(g, C(0.12, 0.1, 0.22, 6, L({ color: '#8A6A4A' })), 0.1, 0.9, 0.2); // 吊桶
  put(g, B(0.02, 0.5, 0.02, L({ color: '#C8B088' })), 0.1, 1.25, 0.2); // 绳
  return shadow(g);
}
