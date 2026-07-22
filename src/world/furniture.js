// ============================================================
// 家具库 furniture.js —— 室内家具/装饰/主题道具的统一工厂
// 契约（所有导出函数共同遵守）：
//   1. 每个 makeXxx() 返回 THREE.Group，局部坐标，底面贴地（y=0 为地面）。
//   2. 所有 Mesh 默认 castShadow = true；自发光/屏幕/火焰/水面类除外（不设阴影）。
//   3. 阻挡玩家通行的家具：group.userData.collide = [halfW, halfD]（X/Z 半宽，米）；
//      地毯、挂画、吊饰、蜡烛等不阻挡的：group.userData.collide = null。
//   4. 需要动画的部件：group.userData.anim = (dt, t) => {}，由调用方每帧驱动。
// 风格：低多边形盒体拼搭 + 程序化像素纹理（woodTex/stoneTex/metalTex/hayTex/PAL）。
// ============================================================
import * as THREE from 'three';
import { makeTexture, shade, woodTex, stoneTex, metalTex, hayTex, barkTex, PAL } from '../render/textures.js';

const L = (o) => new THREE.MeshLambertMaterial(o);
const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const CYL = (rt, rb, h, m, seg = 8) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
const put = (parent, mesh, x, y, z, ry = 0) => { mesh.position.set(x, y, z); mesh.rotation.y = ry; parent.add(mesh); return mesh; };
const WOOD = () => L({ map: woodTex() });
const STONE = () => L({ map: stoneTex() });
const METAL = () => L({ map: metalTex() });
// 收尾：全部 Mesh 投影，collide/anim 挂到 userData
function fin(g, collide, anim) {
  g.traverse((o) => { if (o.isMesh) o.castShadow = !o.userData.noShadow; });
  g.userData.collide = collide || null;
  if (anim) g.userData.anim = anim;
  return g;
}
const noSh = (mesh) => { mesh.userData.noShadow = true; return mesh; };

// ============================================================
// A. 迁移并改进 interiors.js 现有家具
// ============================================================

// 商店柜台：柜体 + 台面 + 抽屉线 + 账本 + 摆件 + 小盆栽
export function makeCounter(w = 2.4) {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(w, 0.8, 0.6, wood), 0, 0.4, 0);
  put(g, B(w + 0.16, 0.08, 0.72, wood), 0, 0.84, 0);
  // 抽屉线（正面两条 + 拉手）
  put(g, B(w - 0.3, 0.02, 0.02, L({ color: '#5A3A20' })), 0, 0.55, 0.31);
  put(g, B(w - 0.3, 0.02, 0.02, L({ color: '#5A3A20' })), 0, 0.3, 0.31);
  for (const dx of [-w / 4, w / 4]) {
    put(g, B(0.12, 0.04, 0.04, L({ color: '#3A2A18' })), dx, 0.42, 0.32);
    put(g, B(0.12, 0.04, 0.04, L({ color: '#3A2A18' })), dx, 0.68, 0.32);
  }
  put(g, B(0.3, 0.06, 0.2, L({ color: '#E8DCC8' })), -0.6, 0.9, 0);          // 账本
  put(g, B(0.26, 0.02, 0.17, L({ color: '#C8B088' })), -0.6, 0.94, 0);       // 账页
  put(g, B(0.14, 0.18, 0.14, L({ color: '#B8543E' })), 0.5, 0.95, 0);        // 摆件
  put(g, CYL(0.06, 0.08, 0.1, L({ color: '#8A5A3A' }), 6), 0.85, 0.93, 0.1); // 小陶盆
  put(g, B(0.1, 0.12, 0.1, L({ color: '#5DBB4A' })), 0.85, 1.04, 0.1);       // 绿植
  return fin(g, [w / 2 + 0.08, 0.36]);
}

// 货架：柜体 + 三层隔板 + 密集商品（两层摆放）
export function makeShelf(w = 1.6, goods = ['#E8C469', '#8AE84A', '#7AB8E8', '#E87A9A']) {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(w, 1.7, 0.4, wood), 0, 0.85, 0);
  put(g, B(w + 0.06, 0.06, 0.44, wood), 0, 1.72, 0); // 顶檐
  for (let i = 0; i < 3; i++) put(g, B(w - 0.1, 0.05, 0.36, L({ color: '#6A4A2A' })), 0, 0.45 + i * 0.5, 0.02);
  // 商品加密：每层摆一排，颜色循环，大小交替
  for (let layer = 0; layer < 2; layer++) {
    const n = goods.length + 1;
    for (let i = 0; i < n; i++) {
      const c = goods[i % goods.length];
      const s = i % 2 ? [0.2, 0.22, 0.2] : [0.16, 0.28, 0.16];
      put(g, B(s[0], s[1], s[2], L({ color: c })), -w / 2 + 0.22 + i * ((w - 0.4) / (n - 1)), 0.45 + layer * 0.5 + 0.025 + s[1] / 2, 0.05);
    }
  }
  // 顶层罐子
  put(g, CYL(0.09, 0.09, 0.16, L({ color: '#C8B088' }), 6), -w / 2 + 0.2, 1.83, 0);
  put(g, CYL(0.09, 0.09, 0.16, L({ color: '#7AB8E8' }), 6), -w / 2 + 0.45, 1.83, 0);
  return fin(g, [w / 2 + 0.03, 0.22]);
}

// 铁砧：木墩 + 砧体 + 砧角 + 锤
export function makeAnvil() {
  const g = new THREE.Group();
  const metal = L({ color: '#4A4A56', flatShading: true });
  put(g, B(0.5, 0.3, 0.5, L({ color: '#6A4A2A' })), 0, 0.15, 0);
  put(g, B(0.9, 0.25, 0.35, metal), 0, 0.42, 0);
  put(g, B(0.3, 0.18, 0.3, metal), 0.55, 0.4, 0);
  put(g, B(0.34, 0.05, 0.06, L({ color: '#8A5E34' })), -0.2, 0.57, 0.1, 0.5);  // 锤柄
  put(g, B(0.12, 0.08, 0.08, METAL()), -0.35, 0.6, 0.02, 0.5);                // 锤头
  return fin(g, [0.48, 0.28]);
}

// 圆桌：8 棱台面 + 中柱 + 十字底足 + 两把圆凳 + 杯
export function makeTable(r = 0.45) {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, CYL(r, r, 0.06, wood, 8), 0, 0.55, 0);
  put(g, CYL(0.05, 0.07, 0.55, wood, 6), 0, 0.27, 0);
  put(g, B(0.5, 0.06, 0.12, wood), 0, 0.05, 0);
  put(g, B(0.12, 0.06, 0.5, wood), 0, 0.05, 0);
  for (const [dx, dz] of [[-0.7, 0.2], [0.6, -0.4]]) {
    put(g, CYL(0.16, 0.18, 0.35, wood, 6), dx, 0.18, dz);
    put(g, CYL(0.19, 0.19, 0.04, L({ color: '#8A5E34' }), 6), dx, 0.37, dz);
  }
  put(g, CYL(0.05, 0.06, 0.1, L({ color: '#E8DCC8' }), 6), 0.15, 0.63, 0.1); // 杯子
  return fin(g, [r + 0.45, r + 0.45]);
}

// 床：床架 + 床头板 + 床垫 + 毯子 + 枕头 + 床头小柜灯
export function makeBed() {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(1.2, 0.4, 2.2, wood), 0, 0.2, 0);
  put(g, B(1.24, 0.5, 0.24, wood), 0, 0.25, -1.1);
  put(g, B(1.24, 0.1, 0.26, L({ color: '#7A5230' })), 0, 0.55, -1.1); // 床头檐
  put(g, B(1.1, 0.14, 2.0, L({ color: '#FFF4E0' })), 0, 0.45, 0.02);
  put(g, B(1.14, 0.16, 1.45, L({ color: '#4A7AB8' })), 0, 0.52, 0.32);
  put(g, B(1.16, 0.06, 0.2, L({ color: '#3A5F96' })), 0, 0.55, 1.0);  // 毯尾深边
  put(g, B(0.6, 0.16, 0.4, L({ color: '#E84A6A' })), 0, 0.54, -0.72);
  // 床头柜 + 小夜灯
  put(g, B(0.4, 0.45, 0.4, wood), 0.85, 0.22, -1.0);
  put(g, CYL(0.05, 0.07, 0.06, L({ color: '#8A5E34' }), 6), 0.85, 0.48, -1.0);
  const lamp = put(g, B(0.12, 0.12, 0.12, L({ color: '#FFD98A', emissive: 0xffc86a, emissiveIntensity: 0.9 })), 0.85, 0.58, -1.0);
  noSh(lamp);
  return fin(g, [0.62, 1.12]);
}

// 电视机：机身 + 屏幕（微光）+ 天线 + 底座柜
export function makeTV() {
  const g = new THREE.Group();
  put(g, B(1.0, 0.45, 0.45, WOOD()), 0, 0.22, 0);                       // 电视柜
  put(g, B(0.9, 0.6, 0.5, L({ color: '#3A3230' })), 0, 0.75, 0);
  const screen = put(g, B(0.7, 0.4, 0.05, L({ color: '#2A4A6A', emissive: 0x2a4a6a, emissiveIntensity: 0.5 })), 0, 0.83, 0.26);
  noSh(screen);
  put(g, CYL(0.012, 0.012, 0.4, L({ color: '#8A8A96' }), 4), -0.25, 1.25, 0).rotation.z = 0.4;
  put(g, CYL(0.012, 0.012, 0.4, L({ color: '#8A8A96' }), 4), 0.25, 1.25, 0).rotation.z = -0.4;
  g.userData.anim = (dt, t) => { screen.material.emissiveIntensity = 0.4 + 0.15 * Math.sin(t * 7.3); };
  return fin(g, [0.5, 0.26]);
}

// 祭坛：双层石台 + 悬浮晶体（旋转+浮动）+ 双石柱
export function makeAltar() {
  const g = new THREE.Group();
  const stone = STONE();
  put(g, B(2.2, 0.5, 1.0, stone), 0, 0.25, 0);
  put(g, B(1.6, 0.5, 0.7, stone), 0, 0.68, -0.1);
  put(g, B(1.2, 0.08, 0.5, L({ color: '#6E6E78' })), 0, 0.97, -0.1); // 台面深色压边
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), L({ color: '#7AE8C8', emissive: 0x2a8a70, emissiveIntensity: 1.2 }));
  put(g, noSh(orb), 0, 1.25, -0.1);
  g.userData.orb = orb;
  for (const dx of [-1.28, 1.28]) {
    put(g, CYL(0.14, 0.18, 1.8, stone, 6), dx, 0.9, -0.2);
    put(g, B(0.4, 0.1, 0.4, stone), dx, 1.85, -0.2);
  }
  g.userData.anim = (dt, t) => {
    orb.rotation.y += dt * 0.8;
    orb.position.y = 1.25 + Math.sin(t * 1.6) * 0.06;
  };
  return fin(g, [1.35, 0.55]);
}

// 木工台：台面 + 四腿 + 横梁 + 木料 + 刨子 + 锯子
export function makeWorkbench() {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(2.0, 0.12, 0.8, wood), 0, 0.75, 0);
  for (const [dx, dz] of [[-0.85, -0.3], [0.85, -0.3], [-0.85, 0.3], [0.85, 0.3]]) put(g, B(0.1, 0.75, 0.1, wood), dx, 0.37, dz);
  put(g, B(1.8, 0.08, 0.08, wood), 0, 0.3, 0.32); // 腿间横梁
  put(g, B(0.5, 0.16, 0.3, L({ color: '#C8B088' })), -0.5, 0.9, 0);   // 木料
  put(g, B(0.44, 0.1, 0.24, L({ color: '#B89B6A' })), -0.45, 1.02, 0);
  put(g, B(0.4, 0.1, 0.24, L({ color: '#8A8A96' })), 0.4, 0.86, 0.1); // 刨子
  put(g, B(0.5, 0.02, 0.08, METAL()), 0.2, 0.82, -0.2, 0.3);          // 锯条
  put(g, B(0.1, 0.06, 0.1, L({ color: '#7A5230' })), 0.48, 0.83, -0.28, 0.3);
  return fin(g, [1.0, 0.42]);
}

// 木桶组：三只错落 + 桶箍
export function makeBarrelG() {
  const g = new THREE.Group();
  for (const [dx, dz] of [[0, 0], [0.62, 0.2], [0.3, 0.55]]) {
    put(g, CYL(0.26, 0.3, 0.6, WOOD(), 8), dx, 0.3, dz);
    put(g, CYL(0.275, 0.275, 0.04, L({ color: '#4A4A56' }), 8), dx, 0.42, dz);
    put(g, CYL(0.29, 0.29, 0.04, L({ color: '#4A4A56' }), 8), dx, 0.14, dz);
  }
  return fin(g, [0.6, 0.55]);
}

// 石灶：灶体 + 铁台面 + 锅 + 烟囱段
export function makeStove() {
  const g = new THREE.Group();
  const stone = STONE();
  put(g, B(1.0, 0.8, 0.7, stone), 0, 0.4, 0);
  put(g, B(0.8, 0.1, 0.6, L({ color: '#2A2A30' })), 0, 0.85, 0);
  put(g, CYL(0.16, 0.2, 0.25, L({ color: '#3A3A46' }), 6), -0.2, 1.0, 0);
  put(g, CYL(0.17, 0.17, 0.03, L({ color: '#2A2A30' }), 6), -0.2, 1.14, 0); // 锅盖
  const fire = put(g, B(0.3, 0.2, 0.04, L({ color: '#E8783A', emissive: 0xd85a1a, emissiveIntensity: 0.8 })), 0, 0.3, 0.36); // 灶膛火口
  noSh(fire);
  g.userData.anim = (dt, t) => { fire.material.emissiveIntensity = 0.65 + 0.3 * Math.sin(t * 9.1) * Math.sin(t * 3.7); };
  return fin(g, [0.5, 0.38]);
}

// ============================================================
// B. 通用居家
// ============================================================

// 满墙书架：框体 + 四层彩色书脊
export function makeBookshelf(w = 1.8) {
  const g = new THREE.Group();
  const wood = L({ color: '#6A4A2A' });
  put(g, B(w, 2.0, 0.32, wood), 0, 1.0, 0);
  const spineCols = ['#B8543E', '#4A7AB8', '#4AA84A', '#E8C469', '#8A5A8A', '#5EC8E8', '#E87A9A', '#C87A3A'];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let s = 0; s < 4; s++) {
    const y = 0.35 + s * 0.45;
    put(g, B(w - 0.14, 0.04, 0.28, L({ color: '#54371E' })), 0, y, 0.02);
    let x = -w / 2 + 0.12;
    while (x < w / 2 - 0.16) {
      const bw = 0.06 + rnd() * 0.05, bh = 0.26 + rnd() * 0.1;
      if (rnd() < 0.12) { x += 0.09; continue; } // 偶尔留空
      const bk = put(g, B(bw, bh, 0.2, L({ color: spineCols[Math.floor(rnd() * spineCols.length)] })), x + bw / 2, y + 0.02 + bh / 2, 0.04);
      if (rnd() < 0.15) bk.rotation.z = 0.12;    // 偶尔斜靠
      x += bw + 0.015;
    }
  }
  return fin(g, [w / 2 + 0.02, 0.18]);
}

// 壁炉：石框 + 炉膛 + 柴堆 + 跳动火焰（anim）
export function makeFireplace() {
  const g = new THREE.Group();
  const stone = STONE();
  put(g, B(1.4, 1.2, 0.5, stone), 0, 0.6, -0.05);
  put(g, B(0.9, 0.7, 0.52, L({ color: '#1A1A22' })), 0, 0.35, 0.02);  // 炉膛
  put(g, B(1.6, 0.12, 0.6, stone), 0, 1.26, -0.02);                   // 壁炉台
  put(g, B(1.5, 0.08, 0.62, L({ color: '#6E6E78' })), 0, 0.04, 0.02); // 炉前石沿
  // 柴
  put(g, CYL(0.06, 0.06, 0.55, L({ color: '#6E4A2A' }), 6), 0, 0.12, 0.05).rotation.z = Math.PI / 2;
  put(g, CYL(0.05, 0.05, 0.5, L({ color: '#5A3A20' }), 6), 0, 0.2, 0.02).rotation.z = Math.PI / 2;
  // 火焰（三层锥状盒，闪烁）
  const flames = [];
  const fcols = [0xd85a1a, 0xe8783a, 0xffc86a];
  for (let i = 0; i < 3; i++) {
    const f = put(g, noSh(B(0.34 - i * 0.1, 0.3 - i * 0.07, 0.2, L({ color: '#E8783A', emissive: fcols[i], emissiveIntensity: 1.1 }))), 0, 0.25 + i * 0.14, 0.05);
    flames.push(f);
  }
  g.userData.anim = (dt, t) => {
    flames.forEach((f, i) => {
      f.scale.y = 1 + 0.18 * Math.sin(t * 11 + i * 2.1);
      f.scale.x = 1 + 0.1 * Math.sin(t * 8.3 + i);
      f.material.emissiveIntensity = 0.9 + 0.35 * Math.sin(t * 9.7 + i * 1.3);
    });
  };
  return fin(g, [0.8, 0.31]);
}

// 地毯：平铺多层色块织纹，不阻挡
export function makeRug(w = 1.6, d = 2.2, colors = ['#B8543E', '#E8DCC8', '#8A5A8A']) {
  // 兼容调用：makeRug('#B8543E') 视作主色
  if (typeof w === 'string') { colors = [w, '#E8DCC8', shade(w, -30)]; w = 1.6; }
  const g = new THREE.Group();
  const tex = makeTexture(16, 16, (gg) => {
    gg.fillStyle = colors[0]; gg.fillRect(0, 0, 16, 16);
    gg.fillStyle = colors[1]; gg.fillRect(1, 1, 14, 14);
    gg.fillStyle = colors[2] || colors[0]; gg.fillRect(3, 3, 10, 10);
    gg.fillStyle = colors[1]; for (let i = 4; i < 12; i += 4) { gg.fillRect(i, 7, 2, 2); }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), L({ map: tex }));
  m.rotation.x = -Math.PI / 2;
  put(g, m, 0, 0.015, 0);
  return fin(g, null);
}

// 盆栽：陶盆 + 土层 + 多层叶球
export function makePlant(scale = 1) {
  const g = new THREE.Group();
  put(g, CYL(0.14, 0.11, 0.22, L({ color: '#B8543E' }), 8), 0, 0.11, 0);
  put(g, CYL(0.12, 0.12, 0.03, L({ color: '#4E3822' }), 8), 0, 0.22, 0);
  put(g, CYL(0.02, 0.03, 0.25, L({ color: '#6E4A2A' }), 5), 0, 0.34, 0);
  put(g, B(0.3, 0.22, 0.3, L({ color: '#5DBB4A' })), 0, 0.55, 0);
  put(g, B(0.2, 0.16, 0.2, L({ color: '#4AA83B' })), 0.08, 0.72, 0.05);
  put(g, B(0.14, 0.12, 0.14, L({ color: '#5DBB4A' })), -0.1, 0.68, -0.06);
  g.scale.setScalar(scale);
  return fin(g, [0.16 * scale, 0.16 * scale]);
}

// 挂画：木框 + 像素画布（山水小景），贴墙（z 朝外侧），不阻挡
export function makePainting(w = 0.7, h = 0.55, theme = 0) {
  const g = new THREE.Group();
  const tex = makeTexture(16, 12, (gg) => {
    const skies = ['#FFD98A', '#B9D9EB', '#FFC9DD'];
    gg.fillStyle = skies[theme % 3]; gg.fillRect(0, 0, 16, 12);
    gg.fillStyle = '#7AB8E8'; gg.fillRect(0, 8, 16, 4);            // 海
    gg.fillStyle = '#5DBB4A'; gg.fillRect(0, 7, 16, 2);            // 岸
    gg.fillStyle = '#6E6E78'; gg.fillRect(3, 3, 4, 5);             // 山
    gg.fillStyle = '#F2F6FA'; gg.fillRect(4, 3, 2, 1);             // 雪顶
    gg.fillStyle = '#E8783A'; gg.fillRect(12, 2, 2, 2);            // 日
  });
  put(g, B(w + 0.08, h + 0.08, 0.04, L({ color: '#7A5230' })), 0, 0, 0);
  const cv = put(g, noSh(new THREE.Mesh(new THREE.PlaneGeometry(w, h), L({ map: tex }))), 0, 0, 0.026);
  return fin(g, null);
}

// 落地灯：底座 + 立杆 + 灯罩（发光）+ 顶端微光动画
export function makeFloorLamp() {
  const g = new THREE.Group();
  put(g, CYL(0.18, 0.22, 0.05, METAL(), 8), 0, 0.025, 0);
  put(g, CYL(0.025, 0.025, 1.35, L({ color: '#3A3A46' }), 6), 0, 0.72, 0);
  const shadeM = L({ color: '#FFD98A', emissive: 0xffc86a, emissiveIntensity: 0.8 });
  const shadeBox = put(g, noSh(CYL(0.16, 0.24, 0.28, shadeM, 8)), 0, 1.5, 0);
  g.userData.anim = (dt, t) => { shadeBox.material.emissiveIntensity = 0.75 + 0.1 * Math.sin(t * 2.2); };
  return fin(g, [0.22, 0.22]);
}

// 双人沙发：底座 + 靠背 + 双扶手 + 靠垫
export function makeSofa(w = 1.5, color = '#8A5A8A') {
  const g = new THREE.Group();
  const m = L({ color });
  const md = L({ color: shade(color, -22) });
  put(g, B(w, 0.35, 0.7, m), 0, 0.2, 0);
  put(g, B(w, 0.5, 0.18, md), 0, 0.6, -0.27);
  put(g, B(0.18, 0.55, 0.7, md), -w / 2 + 0.09, 0.42, 0);
  put(g, B(0.18, 0.55, 0.7, md), w / 2 - 0.09, 0.42, 0);
  put(g, B(w / 2 - 0.2, 0.12, 0.55, L({ color: shade(color, 18) })), -w / 4 + 0.04, 0.43, 0.03);
  put(g, B(w / 2 - 0.2, 0.12, 0.55, L({ color: shade(color, 18) })), w / 4 - 0.04, 0.43, 0.03);
  put(g, B(0.3, 0.3, 0.12, L({ color: '#E8C469' })), -w / 4, 0.62, -0.16, 0.15); // 抱枕
  return fin(g, [w / 2, 0.37]);
}

// 靠背椅：坐面 + 四腿 + 靠背
export function makeChair(color = null) {
  const g = new THREE.Group();
  const wood = color ? L({ color }) : WOOD();
  put(g, B(0.42, 0.06, 0.42, wood), 0, 0.42, 0);
  for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) put(g, B(0.06, 0.42, 0.06, wood), dx, 0.21, dz);
  put(g, B(0.42, 0.5, 0.06, wood), 0, 0.7, -0.18);
  put(g, B(0.3, 0.08, 0.05, wood), 0, 0.82, -0.18);
  return fin(g, [0.23, 0.23]);
}

// 圆凳：座面 + 单柱 + 底盘
export function makeStool(color = '#8A5E34') {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, CYL(0.2, 0.2, 0.06, L({ color }), 8), 0, 0.42, 0);
  put(g, CYL(0.045, 0.06, 0.4, wood, 6), 0, 0.2, 0);
  put(g, CYL(0.14, 0.17, 0.04, wood, 8), 0, 0.02, 0);
  return fin(g, [0.2, 0.2]);
}

// 书桌：台面 + 侧柜 + 羽毛笔 + 书堆 + 墨水瓶
export function makeDesk() {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(1.4, 0.08, 0.7, wood), 0, 0.74, 0);
  put(g, B(0.45, 0.7, 0.62, wood), -0.45, 0.37, 0);      // 左侧抽屉柜
  for (let i = 0; i < 3; i++) {
    put(g, B(0.38, 0.02, 0.02, L({ color: '#5A3A20' })), -0.45, 0.2 + i * 0.2, 0.32);
    put(g, B(0.08, 0.03, 0.03, L({ color: '#3A2A18' })), -0.45, 0.3 + i * 0.2, 0.33);
  }
  put(g, B(0.06, 0.7, 0.06, wood), 0.65, 0.37, -0.28);
  put(g, B(0.06, 0.7, 0.06, wood), 0.65, 0.37, 0.28);
  put(g, B(0.34, 0.05, 0.24, L({ color: '#E8DCC8' })), 0.1, 0.81, 0.05, 0.2); // 摊开的书
  put(g, CYL(0.015, 0.015, 0.24, L({ color: '#F2F6FA' }), 4), 0.35, 0.85, -0.1).rotation.z = -0.7; // 羽毛笔
  put(g, CYL(0.035, 0.045, 0.07, L({ color: '#1A1A22' }), 6), 0.42, 0.82, -0.15);                  // 墨水瓶
  put(g, B(0.26, 0.16, 0.2, L({ color: '#B8543E' })), 0.55, 0.86, 0.15);   // 书堆
  put(g, B(0.22, 0.05, 0.17, L({ color: '#4A7AB8' })), 0.55, 0.97, 0.15, 0.2);
  return fin(g, [0.72, 0.37]);
}

// 厨房组合：地柜 + 水槽 + 龙头 + 吊柜 + 挂锅
export function makeKitchenSet(w = 2.2) {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(w, 0.8, 0.6, wood), 0, 0.4, 0);
  put(g, B(w + 0.08, 0.06, 0.66, L({ color: '#E8DCC8' })), 0, 0.83, 0); // 石台面
  put(g, B(0.5, 0.08, 0.4, L({ color: '#8D8D96' })), 0.3, 0.86, 0);     // 水槽
  put(g, B(0.4, 0.03, 0.3, L({ color: '#5FB4E8' })), 0.3, 0.89, 0);     // 水面
  put(g, CYL(0.02, 0.02, 0.24, METAL(), 5), 0.3, 0.97, -0.18);
  put(g, B(0.14, 0.02, 0.02, METAL()), 0.3, 1.09, -0.11);
  put(g, B(w * 0.7, 0.6, 0.35, wood), -0.1, 1.85, -0.15);               // 吊柜
  put(g, B(0.02, 0.02, w * 0.5, METAL()), -0.1, 1.5, 0.05).rotation.y = Math.PI / 2; // 挂杆
  for (const [dx, s] of [[-0.5, 0.14], [-0.15, 0.11], [0.15, 0.12]]) {
    put(g, CYL(s, s * 0.8, 0.1, L({ color: '#3A3A46' }), 7), dx, 1.4, 0.05);
    put(g, B(0.02, 0.08, 0.02, METAL()), dx, 1.48, 0.05);
  }
  put(g, B(0.3, 0.12, 0.2, L({ color: '#E8C469' })), -0.7, 0.92, 0.1);  // 面包板
  return fin(g, [w / 2 + 0.04, 0.35]);
}

// 冰箱：双门柜体 + 门缝 + 把手 + 顶部纸箱
export function makeFridge() {
  const g = new THREE.Group();
  const body = L({ color: '#DDE6EE' });
  put(g, B(0.7, 1.5, 0.6, body), 0, 0.75, 0);
  put(g, B(0.66, 0.02, 0.02, L({ color: '#B9C4CC' })), 0, 0.95, 0.31);
  put(g, B(0.02, 1.44, 0.02, L({ color: '#B9C4CC' })), 0, 0.75, 0.31);
  put(g, B(0.04, 0.3, 0.04, L({ color: '#8A8A96' })), 0.26, 0.7, 0.32);
  put(g, B(0.04, 0.3, 0.04, L({ color: '#8A8A96' })), 0.26, 1.2, 0.32);
  put(g, B(0.4, 0.25, 0.35, L({ color: '#C8B088' })), -0.05, 1.65, 0); // 顶箱
  return fin(g, [0.37, 0.32]);
}

// 蜡烛：座 + 烛身 + 火苗（微光闪烁），不阻挡
export function makeCandle() {
  const g = new THREE.Group();
  put(g, CYL(0.09, 0.11, 0.03, METAL(), 7), 0, 0.015, 0);
  put(g, CYL(0.045, 0.05, 0.18, L({ color: '#FFF4E0' }), 7), 0, 0.12, 0);
  const flame = put(g, noSh(B(0.05, 0.09, 0.05, L({ color: '#FFC86A', emissive: 0xffb84a, emissiveIntensity: 1.3 }))), 0, 0.26, 0);
  g.userData.anim = (dt, t) => {
    flame.scale.y = 1 + 0.25 * Math.sin(t * 13.7);
    flame.material.emissiveIntensity = 1.1 + 0.4 * Math.sin(t * 11.3);
  };
  return fin(g, null);
}

// 窗帘：挂杆 + 两片垂布（微摆），贴墙，不阻挡
export function makeCurtain(w = 1.2, color = '#7A4A9E') {
  const g = new THREE.Group();
  put(g, CYL(0.02, 0.02, w + 0.2, L({ color: '#8A5E34' }), 6), 0, 0, 0).rotation.z = Math.PI / 2;
  const cloths = [];
  for (const dx of [-w / 4, w / 4]) {
    const c = put(g, B(w / 2 - 0.06, 1.3, 0.05, L({ color })), dx, -0.68, 0);
    put(g, B(w / 2 - 0.06, 0.06, 0.06, L({ color: shade(color, -20) })), dx, -1.3, 0);
    cloths.push(c);
  }
  g.userData.anim = (dt, t) => {
    cloths.forEach((c, i) => { c.rotation.z = 0.03 * Math.sin(t * 1.4 + i * 2.4); });
  };
  return fin(g, null);
}

// 散落书堆：几本叠歪的书
export function makeBookStack(n = 4) {
  const g = new THREE.Group();
  const cols = ['#B8543E', '#4A7AB8', '#4AA84A', '#E8C469', '#8A5A8A', '#C87A3A'];
  let y = 0;
  for (let i = 0; i < n; i++) {
    const h = 0.05 + (i % 2) * 0.02;
    put(g, B(0.34 - i * 0.03, h, 0.26 - i * 0.02, L({ color: cols[i % cols.length] })), (i % 2 ? 0.02 : -0.02), y + h / 2, 0, (i * 0.35) % 0.7 - 0.35);
    y += h;
  }
  put(g, B(0.28, 0.02, 0.2, L({ color: '#E8DCC8' })), 0.05, y + 0.01, 0, 0.5); // 摊开的一页
  return fin(g, [0.2, 0.16]);
}

// ============================================================
// C. 主题专用
// ============================================================

// 点唱机：拱顶机身 + 音符色块 + 发光面板（呼吸动画）
export function makeJukebox() {
  const g = new THREE.Group();
  put(g, B(0.7, 1.1, 0.5, L({ color: '#8A4A6A' })), 0, 0.55, 0);
  put(g, CYL(0.35, 0.35, 0.5, L({ color: '#8A4A6A' }), 12), 0, 1.1, 0).rotation.x = Math.PI / 2;
  put(g, B(0.5, 0.9, 0.04, L({ color: '#3A3230' })), 0, 0.65, 0.26);
  const panel = put(g, noSh(B(0.4, 0.3, 0.03, L({ color: '#FFD98A', emissive: 0xffc86a, emissiveIntensity: 0.7 }))), 0, 1.15, 0.26);
  const notes = [];
  const ncols = ['#E84A6A', '#5EC8E8', '#8AE84A', '#E8C469'];
  for (let i = 0; i < 4; i++) {
    const nx = -0.18 + (i % 2) * 0.36, ny = 0.35 + Math.floor(i / 2) * 0.3;
    notes.push(put(g, noSh(B(0.1, 0.1, 0.03, L({ color: ncols[i], emissive: ncols[i], emissiveIntensity: 0.4 }))), nx, ny, 0.28));
  }
  g.userData.anim = (dt, t) => {
    panel.material.emissiveIntensity = 0.55 + 0.25 * Math.sin(t * 3.1);
    notes.forEach((n, i) => { n.material.emissiveIntensity = 0.3 + 0.35 * Math.max(0, Math.sin(t * 2.6 + i * 1.57)); });
  };
  return fin(g, [0.37, 0.27]);
}

// 鱼缸：木座 + 玻璃缸（半透明蓝）+ 鱼 + 上升气泡（anim）
export function makeAquarium(w = 0.9) {
  const g = new THREE.Group();
  put(g, B(w + 0.1, 0.4, 0.45, WOOD()), 0, 0.2, 0);
  put(g, B(w, 0.04, 0.38, L({ color: '#E8D8A8' })), 0, 0.42, 0);       // 缸底砂
  const glass = put(g, noSh(B(w, 0.45, 0.4, new THREE.MeshLambertMaterial({ color: '#7AC8E8', transparent: true, opacity: 0.35 }))), 0, 0.66, 0);
  const water = put(g, noSh(B(w - 0.06, 0.38, 0.34, new THREE.MeshLambertMaterial({ color: '#3E94C8', transparent: true, opacity: 0.5 }))), 0, 0.63, 0);
  const fish = put(g, noSh(B(0.12, 0.07, 0.04, L({ color: '#E8783A' }))), 0, 0.62, 0);
  put(g, noSh(B(0.05, 0.05, 0.03, L({ color: '#E8783A' }))), 0, 0.62, 0); // 鱼尾（随 fish 摆动由 anim 控）
  const bubbles = [];
  for (let i = 0; i < 3; i++) bubbles.push(put(g, noSh(B(0.03, 0.03, 0.03, L({ color: '#B9D9EB', transparent: true, opacity: 0.8 }))), (i - 1) * 0.2, 0.45 + i * 0.1, 0.08));
  g.userData.anim = (dt, t) => {
    fish.position.x = Math.sin(t * 0.9) * (w / 2 - 0.15);
    fish.rotation.y = Math.cos(t * 0.9) > 0 ? 0 : Math.PI;
    bubbles.forEach((b, i) => {
      b.position.y += dt * (0.12 + i * 0.03);
      if (b.position.y > 0.84) b.position.y = 0.45;
    });
  };
  return fin(g, [w / 2 + 0.05, 0.24]);
}

// 裁缝人台：三脚底座 + 立杆 + 布面躯干
export function makeMannequin(clothColor = '#FFC9DD') {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const leg = put(g, B(0.05, 0.4, 0.05, L({ color: '#3A3230' })), 0, 0.18, 0);
    leg.rotation.z = 0.5; leg.rotation.y = (i / 3) * Math.PI * 2;
    leg.position.x = Math.sin((i / 3) * Math.PI * 2) * 0.14;
    leg.position.z = Math.cos((i / 3) * Math.PI * 2) * 0.14;
  }
  put(g, CYL(0.025, 0.025, 0.5, L({ color: '#3A3230' }), 6), 0, 0.55, 0);
  put(g, CYL(0.14, 0.19, 0.55, L({ color: clothColor }), 8), 0, 1.05, 0);  // 躯干
  put(g, CYL(0.1, 0.14, 0.18, L({ color: clothColor }), 8), 0, 1.4, 0);    // 肩
  put(g, CYL(0.035, 0.035, 0.1, L({ color: '#3A3230' }), 6), 0, 1.53, 0);
  put(g, B(0.42, 0.05, 0.02, L({ color: '#E8C469' })), 0, 1.1, 0.17);      // 软尺
  return fin(g, [0.2, 0.2]);
}

// 挂布架：双立柱 + 横杆 + 彩色布匹垂挂
export function makeClothRack(w = 1.4, bolts = ['#E84A6A', '#B87AE8', '#7AB8E8', '#FFD98A', '#4AA84A']) {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(0.08, 1.5, 0.08, wood), -w / 2, 0.75, 0);
  put(g, B(0.08, 1.5, 0.08, wood), w / 2, 0.75, 0);
  put(g, B(0.2, 0.06, 0.3, wood), -w / 2, 0.03, 0);
  put(g, B(0.2, 0.06, 0.3, wood), w / 2, 0.03, 0);
  put(g, CYL(0.025, 0.025, w, wood, 6), 0, 1.45, 0).rotation.z = Math.PI / 2;
  bolts.forEach((c, i) => {
    const x = -w / 2 + 0.18 + i * ((w - 0.36) / Math.max(1, bolts.length - 1));
    put(g, B(0.18, 1.0, 0.04, L({ color: c })), x, 0.95, 0);
    put(g, B(0.18, 0.06, 0.05, L({ color: shade(c, -24) })), x, 0.48, 0);
  });
  return fin(g, [w / 2 + 0.1, 0.16]);
}

// 缝纫机：台桌 + 机身 + 手轮 + 针线细节
export function makeSewingMachine() {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(0.9, 0.06, 0.5, wood), 0, 0.72, 0);
  for (const [dx, dz] of [[-0.38, -0.18], [0.38, -0.18], [-0.38, 0.18], [0.38, 0.18]]) put(g, B(0.06, 0.72, 0.06, wood), dx, 0.36, dz);
  const body = L({ color: '#2A2A30' });
  put(g, B(0.5, 0.12, 0.18, body), 0, 0.81, -0.05);
  put(g, B(0.12, 0.22, 0.14, body), -0.2, 0.95, -0.05);   // 立柱
  put(g, B(0.42, 0.1, 0.12, body), 0.02, 1.05, -0.05);    // 横臂
  put(g, B(0.05, 0.14, 0.05, body), 0.2, 0.95, -0.05);    // 针柱
  const wheel = put(g, CYL(0.09, 0.09, 0.04, METAL(), 10), -0.31, 1.02, -0.05);
  wheel.rotation.z = Math.PI / 2;
  put(g, B(0.24, 0.02, 0.18, L({ color: '#FFC9DD' })), 0.12, 0.76, 0.05); // 布料
  g.userData.anim = (dt, t) => { wheel.rotation.x += dt * 1.2; };
  return fin(g, [0.47, 0.27]);
}

// 锻造炉：石砌炉体 + 炭火（emissive 闪烁）+ 烟囱 + 风箱
export function makeForge() {
  const g = new THREE.Group();
  const stone = STONE();
  put(g, B(1.3, 0.9, 1.0, stone), 0, 0.45, 0);
  put(g, B(0.9, 0.5, 0.7, L({ color: '#1A1A22' })), 0, 0.55, 0.18);   // 炉膛
  const coals = [];
  for (let i = 0; i < 5; i++) {
    const c = put(g, noSh(B(0.14, 0.08, 0.14, L({ color: '#E8783A', emissive: 0xd85a1a, emissiveIntensity: 0.9 }))), -0.28 + (i % 3) * 0.28, 0.72, 0.1 + Math.floor(i / 3) * 0.22);
    coals.push(c);
  }
  put(g, B(0.5, 1.2, 0.5, stone), 0, 1.5, -0.25);                      // 烟囱
  put(g, B(0.6, 0.12, 0.6, L({ color: '#6E6E78' })), 0, 2.12, -0.25);
  put(g, B(0.5, 0.18, 0.35, L({ color: '#8A5E34' })), 0.85, 0.35, 0.3); // 风箱
  put(g, B(0.4, 0.1, 0.26, L({ color: '#6E4A2A' })), 0.85, 0.48, 0.3);
  put(g, CYL(0.03, 0.05, 0.2, METAL(), 6), 0.6, 0.4, 0.3).rotation.z = Math.PI / 2;
  g.userData.anim = (dt, t) => {
    coals.forEach((c, i) => { c.material.emissiveIntensity = 0.7 + 0.4 * Math.sin(t * 6.3 + i * 2.2); });
  };
  return fin(g, [0.68, 0.52]);
}

// 武器架：木框 + 横放剑 + 斧 + 盾
export function makeWeaponRack() {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(1.1, 1.4, 0.12, wood), 0, 0.7, -0.08);
  put(g, B(1.2, 0.08, 0.2, wood), 0, 0.04, 0);
  const metal = METAL();
  // 剑（竖挂）
  put(g, B(0.05, 0.7, 0.02, metal), -0.3, 0.85, 0.02);
  put(g, B(0.16, 0.04, 0.03, L({ color: '#8A5E34' })), -0.3, 0.52, 0.02);
  put(g, CYL(0.025, 0.025, 0.12, L({ color: '#6E4A2A' }), 5), -0.3, 0.45, 0.02);
  // 斧
  put(g, CYL(0.02, 0.02, 0.7, L({ color: '#8A5E34' }), 5), 0.05, 0.8, 0.02);
  put(g, B(0.2, 0.16, 0.03, metal), 0.14, 1.05, 0.02);
  // 盾
  put(g, CYL(0.2, 0.2, 0.04, L({ color: '#4A7AB8' }), 10), 0.38, 0.9, 0.02).rotation.x = Math.PI / 2;
  put(g, CYL(0.06, 0.06, 0.05, metal, 8), 0.38, 0.9, 0.05).rotation.x = Math.PI / 2;
  return fin(g, [0.6, 0.12]);
}

// 矿石堆：碎石块 + 嵌矿晶（微光）
export function makeOrePile() {
  const g = new THREE.Group();
  const stone = L({ color: '#6E6E78' });
  const rocks = [[0, 0.14, 0, 0.4], [0.3, 0.1, 0.15, 0.28], [-0.28, 0.1, 0.1, 0.24], [0.05, 0.3, -0.05, 0.26], [-0.15, 0.28, 0.2, 0.2]];
  for (const [x, y, z, s] of rocks) put(g, B(s, s * 0.7, s, stone), x, y, z, x * 3);
  const gems = [];
  const gcols = [0x7ae8c8, 0xb87ae8, 0xffd98a];
  for (let i = 0; i < 3; i++) {
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), L({ color: '#7AE8C8', emissive: gcols[i], emissiveIntensity: 0.7 }));
    put(g, noSh(gem), -0.15 + i * 0.16, 0.32 + (i % 2) * 0.08, 0.12 - i * 0.08);
    gems.push(gem);
  }
  g.userData.anim = (dt, t) => { gems.forEach((gm, i) => { gm.material.emissiveIntensity = 0.5 + 0.3 * Math.sin(t * 2 + i * 2); }); };
  return fin(g, [0.42, 0.35]);
}

// 干草捆：圆柱捆 + 捆绳
export function makeHayBale(r = 0.4) {
  const g = new THREE.Group();
  const bale = put(g, CYL(r, r, 0.7, L({ map: hayTex() }), 10), 0, r, 0);
  bale.rotation.z = Math.PI / 2;
  for (const dx of [-0.2, 0.2]) {
    const rope = put(g, CYL(r + 0.01, r + 0.01, 0.04, L({ color: '#8A5E34' }), 10), dx, r, 0);
    rope.rotation.z = Math.PI / 2;
  }
  return fin(g, [0.38, r + 0.03]);
}

// 饲料槽：长木槽 + 草料 + 四腿
export function makeTrough(w = 1.2) {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(w, 0.2, 0.36, wood), 0, 0.28, 0);
  put(g, B(w - 0.12, 0.1, 0.24, L({ map: hayTex() })), 0, 0.4, 0); // 草料
  put(g, B(w, 0.06, 0.04, wood), 0, 0.4, 0.17);
  put(g, B(w, 0.06, 0.04, wood), 0, 0.4, -0.17);
  for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) {
    put(g, B(0.08, 0.28, 0.3, wood), dx, 0.14, 0);
  }
  return fin(g, [w / 2, 0.2]);
}

// 茶桌套装：矮方桌 + 茶壶 + 双杯 + 两个蒲团
export function makeTeaSet() {
  const g = new THREE.Group();
  const wood = L({ color: '#54371E' });
  put(g, B(0.8, 0.06, 0.8, wood), 0, 0.3, 0);
  for (const [dx, dz] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) put(g, B(0.07, 0.3, 0.07, wood), dx, 0.15, dz);
  const china = L({ color: '#D8E8E0' });
  put(g, CYL(0.09, 0.11, 0.12, china, 8), 0, 0.4, 0);                     // 茶壶
  put(g, CYL(0.02, 0.02, 0.08, china, 5), 0, 0.5, 0);
  put(g, B(0.07, 0.03, 0.03, china), 0.11, 0.42, 0);                      // 壶嘴
  for (const [dx, dz] of [[-0.24, 0.18], [0.22, -0.2]]) put(g, CYL(0.04, 0.03, 0.05, china, 7), dx, 0.36, dz);
  put(g, B(0.16, 0.04, 0.1, L({ color: '#8AE84A' })), 0.26, 0.35, 0.2);   // 茶点
  // 蒲团
  put(g, CYL(0.22, 0.24, 0.08, L({ color: '#B8543E' }), 8), 0, 0.04, 0.7);
  put(g, CYL(0.22, 0.24, 0.08, L({ color: '#4A7AB8' }), 8), 0, 0.04, -0.7);
  return fin(g, [0.42, 0.42]);
}

// 盆景：浅盆 + 蟠曲树干 + 云片状叶冠
export function makeBonsai() {
  const g = new THREE.Group();
  put(g, B(0.4, 0.1, 0.3, L({ color: '#3A5A8C' })), 0, 0.05, 0);
  put(g, B(0.36, 0.03, 0.26, L({ color: '#4E3822' })), 0, 0.11, 0);
  const trunk = L({ color: '#5A3A20' });
  const t1 = put(g, CYL(0.025, 0.04, 0.22, trunk, 5), 0, 0.22, 0);
  t1.rotation.z = 0.3;
  const t2 = put(g, CYL(0.015, 0.025, 0.18, trunk, 5), 0.08, 0.36, 0);
  t2.rotation.z = -0.4;
  put(g, B(0.26, 0.08, 0.2, L({ color: '#3E8B5A' })), 0.16, 0.46, 0);   // 叶云
  put(g, B(0.2, 0.07, 0.16, L({ color: '#2E8B3D' })), -0.08, 0.4, 0.04);
  put(g, B(0.16, 0.06, 0.13, L({ color: '#3E8B5A' })), 0.05, 0.54, -0.03);
  return fin(g, [0.22, 0.17]);
}

// 石柱：基座 + 柱身 + 柱头
export function makeColumn(h = 2.4) {
  const g = new THREE.Group();
  const stone = STONE();
  put(g, B(0.5, 0.16, 0.5, stone), 0, 0.08, 0);
  put(g, CYL(0.16, 0.2, h - 0.3, stone, 8), 0, h / 2, 0);
  put(g, B(0.46, 0.14, 0.46, stone), 0, h - 0.07, 0);
  return fin(g, [0.26, 0.26]);
}

// 断柱：基座 + 半截柱 + 斜口碎块 + 落地残段
export function makeBrokenPillar() {
  const g = new THREE.Group();
  const stone = STONE();
  put(g, B(0.5, 0.16, 0.5, stone), 0, 0.08, 0);
  const stub = put(g, CYL(0.16, 0.2, 0.9, stone, 8), 0, 0.6, 0);
  const top = put(g, B(0.34, 0.18, 0.34, stone), 0.03, 1.1, 0);
  top.rotation.z = 0.35; top.rotation.y = 0.4;                          // 斜口
  const fallen = put(g, CYL(0.15, 0.15, 0.7, stone, 8), 0.55, 0.16, 0.35);
  fallen.rotation.z = Math.PI / 2 - 0.12; fallen.rotation.y = 0.5;      // 倒地残段
  put(g, B(0.2, 0.14, 0.18, stone), -0.4, 0.07, 0.3, 0.7);              // 碎块
  return fin(g, [0.55, 0.4]);
}

// 藤蔓墙饰：贴墙绿叶串（垂挂感），不阻挡
export function makeVine(h = 1.6) {
  const g = new THREE.Group();
  const leaf = L({ color: '#4AA83B' });
  const leafD = L({ color: '#358843' });
  let x = 0, seed = 13;
  const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let y = 0; y < h; y += 0.16) {
    x += (rnd() - 0.5) * 0.14;
    x = Math.max(-0.25, Math.min(0.25, x));
    put(g, B(0.1, 0.12, 0.04, rnd() < 0.5 ? leaf : leafD), x, -y, 0);
    if (rnd() < 0.35) put(g, B(0.08, 0.08, 0.04, leaf), x + 0.1, -y - 0.05, 0);
  }
  return fin(g, null);
}

// 地球仪：底座 + 斜轴 + 像素地球（自转）
export function makeGlobe() {
  const g = new THREE.Group();
  put(g, CYL(0.16, 0.2, 0.06, WOOD(), 8), 0, 0.03, 0);
  put(g, CYL(0.025, 0.025, 0.3, L({ color: '#8A5E34' }), 6), 0, 0.2, 0);
  const globeTex = makeTexture(16, 8, (gg) => {
    gg.fillStyle = '#3E94C8'; gg.fillRect(0, 0, 16, 8);
    gg.fillStyle = '#5DBB4A';
    gg.fillRect(2, 2, 4, 3); gg.fillRect(9, 1, 3, 2); gg.fillRect(11, 4, 4, 3); gg.fillRect(5, 5, 2, 2);
    gg.fillStyle = '#F2F6FA'; gg.fillRect(0, 0, 16, 1); gg.fillRect(0, 7, 16, 1);
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), L({ map: globeTex }));
  put(g, ball, 0, 0.5, 0);
  ball.rotation.z = 0.4;
  const ring = put(g, new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.015, 6, 16), METAL()), 0, 0.5, 0);
  ring.rotation.x = 0.4;
  g.userData.anim = (dt) => { ball.rotation.y += dt * 0.5; };
  return fin(g, [0.26, 0.26]);
}

// 棋牌桌：方桌 + 棋盘格 + 棋子
export function makeChessTable() {
  const g = new THREE.Group();
  const wood = WOOD();
  put(g, B(0.9, 0.08, 0.9, wood), 0, 0.62, 0);
  put(g, B(0.12, 0.6, 0.12, wood), 0, 0.3, 0);
  put(g, B(0.6, 0.05, 0.6, wood), 0, 0.03, 0);
  const boardTex = makeTexture(8, 8, (gg) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      gg.fillStyle = (x + y) % 2 ? '#3A3230' : '#E8DCC8';
      gg.fillRect(x, y, 1, 1);
    }
  });
  put(g, noSh(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.6), L({ map: boardTex }))), 0, 0.67, 0);
  const pieces = [[-0.2, -0.15, '#1A1A22'], [-0.05, -0.2, '#1A1A22'], [0.12, 0.1, '#FFF4E0'], [0.22, 0.18, '#FFF4E0'], [0.05, 0.22, '#FFF4E0']];
  for (const [dx, dz, c] of pieces) put(g, CYL(0.03, 0.04, 0.08, L({ color: c }), 6), dx, 0.72, dz);
  return fin(g, [0.47, 0.47]);
}

// 玻璃展示柜：木座 + 玻璃罩 + 展品（宝石/贝壳）
export function makeDisplayCase(w = 0.9) {
  const g = new THREE.Group();
  put(g, B(w, 0.7, 0.5, WOOD()), 0, 0.35, 0);
  put(g, B(w - 0.14, 0.04, 0.38, L({ color: '#7A4A6E' })), 0, 0.72, 0); // 绒布底
  const glassM = new THREE.MeshLambertMaterial({ color: '#B9D9EB', transparent: true, opacity: 0.25 });
  put(g, noSh(B(w - 0.06, 0.4, 0.44, glassM)), 0, 0.94, 0);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), L({ color: '#B87AE8', emissive: 0x7a4a9e, emissiveIntensity: 0.6 }));
  put(g, noSh(gem), -w / 4 + 0.05, 0.85, 0);
  put(g, B(0.14, 0.1, 0.1, L({ color: '#FFC9DD' })), 0, 0.79, 0.05);     // 贝壳
  put(g, CYL(0.06, 0.08, 0.08, L({ color: '#FFD98A' }), 7), w / 4 - 0.05, 0.78, -0.03);
  g.userData.anim = (dt, t) => { gem.rotation.y += dt * 0.6; gem.material.emissiveIntensity = 0.45 + 0.25 * Math.sin(t * 2.4); };
  return fin(g, [w / 2, 0.27]);
}

// ============================================================
// D. 挂饰 / 氛围
// ============================================================

// 吊灯：顶链 + 木环 + 三支蜡烛灯（发光微闪），不阻挡
export function makeHangingLamp(drop = 0.6) {
  const g = new THREE.Group();
  put(g, CYL(0.015, 0.015, drop, METAL(), 4), 0, -drop / 2, 0);
  put(g, B(0.5, 0.05, 0.5, L({ color: '#6A4A2A' })), 0, -drop, 0);
  const flames = [];
  for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [0, 0.2]]) {
    put(g, CYL(0.035, 0.04, 0.1, L({ color: '#FFF4E0' }), 6), dx, -drop + 0.07, dz);
    flames.push(put(g, noSh(B(0.04, 0.07, 0.04, L({ color: '#FFC86A', emissive: 0xffb84a, emissiveIntensity: 1.2 }))), dx, -drop + 0.16, dz));
  }
  g.userData.anim = (dt, t) => {
    flames.forEach((f, i) => { f.material.emissiveIntensity = 1.0 + 0.35 * Math.sin(t * 10.7 + i * 2.1); });
    g.rotation.y = 0.04 * Math.sin(t * 0.9);
  };
  return fin(g, null);
}

// 旗帜挂布：横杆 + 垂旗（徽记 + 摆动画），贴墙，不阻挡
export function makeWallBanner(w = 0.6, h = 1.2, color = '#B8543E', sigil = '#FFD98A') {
  const g = new THREE.Group();
  put(g, CYL(0.02, 0.02, w + 0.16, L({ color: '#8A5E34' }), 6), 0, 0, 0).rotation.z = Math.PI / 2;
  const flagTex = makeTexture(12, 16, (gg) => {
    gg.fillStyle = color; gg.fillRect(0, 0, 12, 16);
    gg.fillStyle = shade(color, -24); gg.fillRect(0, 0, 1, 16); gg.fillRect(11, 0, 1, 16);
    gg.fillStyle = sigil;
    gg.fillRect(4, 4, 4, 4); gg.fillRect(5, 3, 2, 6); gg.fillRect(3, 5, 6, 2); // 星形徽记
    gg.fillStyle = shade(color, -24); gg.fillRect(0, 14, 12, 2);
  });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(w, h), L({ map: flagTex, side: THREE.DoubleSide }));
  put(g, flag, 0, -h / 2 - 0.02, 0.02);
  g.userData.anim = (dt, t) => { flag.rotation.x = 0.05 * Math.sin(t * 1.7); };
  return fin(g, null);
}

// 星形灯：悬挂星（emissive 呼吸），供旧会馆祭坛上空，不阻挡
export function makeStarLamp(drop = 0.5, color = 0x7ae8c8) {
  const g = new THREE.Group();
  put(g, CYL(0.012, 0.012, drop, METAL(), 4), 0, -drop / 2, 0);
  const star = new THREE.Group();
  const m = L({ color: '#7AE8C8', emissive: color, emissiveIntensity: 0.9 });
  star.add(noSh(new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), m)));
  const spikes = [[0.22, 0, 0], [-0.22, 0, 0], [0, 0.22, 0], [0, -0.22, 0], [0, 0, 0.22], [0, 0, -0.22]];
  for (const [sx, sy, sz] of spikes) {
    const s = noSh(new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), m));
    s.position.set(sx, sy, sz); s.scale.set(0.6, 0.6, 0.6);
    star.add(s);
  }
  star.position.y = -drop - 0.15;
  g.add(star);
  g.userData.anim = (dt, t) => {
    star.rotation.y += dt * 0.7;
    m.emissiveIntensity = 0.7 + 0.3 * Math.sin(t * 2.8);
  };
  return fin(g, null);
}

// ==================== interiors.js fx() 命名兼容层 ====================
// 语义等价别名
export const makeBookPile = makeBookStack;
export const makeCardTable = makeChessTable;
export const makeFeedTrough = makeTrough;
export const makeFishTank = makeAquarium;
export const makeKitchenCounter = makeKitchenSet;
export const makeTableLamp = makeFloorLamp;
export const makeTeaTable = makeTeaSet;
export const makeToolRack = makeWeaponRack;
export const makeVines = makeVine;
export const makeHangingScroll = makeWallBanner;

// 木箱：板条 + 十字钉线
export function makeCrate(s = 0.5) {
  const g = new THREE.Group();
  const tex = makeTexture(16, 16, (gg) => {
    gg.fillStyle = '#B89B6A'; gg.fillRect(0, 0, 16, 16);
    gg.fillStyle = '#8A6B3F'; for (let y = 0; y < 16; y += 4) gg.fillRect(0, y, 16, 1);
    gg.strokeStyle = '#7A5230'; gg.lineWidth = 1;
    gg.beginPath(); gg.moveTo(0, 0); gg.lineTo(16, 16); gg.moveTo(16, 0); gg.lineTo(0, 16); gg.stroke();
  });
  put(g, B(s, s, s, L({ map: tex })), 0, s / 2, 0);
  return fin(g, [s / 2, s / 2]);
}
// 木箱堆
export function makeCrateStack() {
  const g = new THREE.Group();
  const c1 = makeCrate(0.5); c1.position.set(0, 0, 0); g.add(c1);
  const c2 = makeCrate(0.45); c2.position.set(0.42, 0, 0.18); c2.rotation.y = 0.4; g.add(c2);
  const c3 = makeCrate(0.4); c3.position.set(0.1, 0.5, 0.05); c3.rotation.y = 0.25; g.add(c3);
  return fin(g, [0.55, 0.45]);
}
// 麻袋：鼓袋 + 束口
export function makeSack(s = 1) {
  const g = new THREE.Group();
  const m = L({ color: '#C8B088' });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 8, 6), m);
  body.scale.set(1, 1.15, 1);
  put(g, body, 0, 0.32 * s, 0);
  put(g, CYL(0.08 * s, 0.12 * s, 0.14 * s, L({ color: '#A8906A' }), 6), 0, 0.72 * s, 0);
  return fin(g, [0.3 * s, 0.3 * s]);
}
// 木料堆：交错圆木
export function makeLumberPile() {
  const g = new THREE.Group();
  const rows = [[-0.25, 0.11, 0], [0.25, 0.11, 0.05], [0, 0.33, -0.05]];
  for (const [dx, y, dz] of rows) {
    const log = CYL(0.11, 0.11, 1.6, L({ map: barkTex() }), 7);
    log.rotation.z = Math.PI / 2;
    put(g, log, dx, y, dz, 0.08);
  }
  for (const ex of [-0.82, 0.82]) {
    const end = CYL(0.11, 0.11, 0.03, L({ color: '#C8A86A' }), 7);
    end.rotation.z = Math.PI / 2;
    put(g, end, ex, 0.11, -0.25 + (ex > 0 ? 0.05 : 0));
  }
  return fin(g, [0.85, 0.35]);
}
// 鱼竿架：立架 + 斜靠鱼竿
export function makeFishingRack() {
  const g = new THREE.Group();
  put(g, B(0.7, 0.08, 0.3, WOOD()), 0, 0.04, 0);
  for (const dx of [-0.3, 0.3]) put(g, B(0.06, 0.9, 0.06, WOOD()), dx, 0.45, 0);
  put(g, B(0.7, 0.05, 0.05, WOOD()), 0, 0.82, 0);
  for (let i = 0; i < 3; i++) {
    const rod = CYL(0.015, 0.025, 1.3, L({ color: ['#8A5A2A', '#6E4A2A', '#9A6B3F'][i] }), 5);
    rod.rotation.z = 0.28;
    put(g, rod, -0.22 + i * 0.22, 0.68, 0.1 + (i % 2) * 0.03);
  }
  return fin(g, [0.38, 0.2]);
}
// 瓦砾堆：碎石块 + 尘土地面
export function makeRubble() {
  const g = new THREE.Group();
  const st = STONE();
  const bits = [[0, 0.09, 0, 0.2], [0.22, 0.06, 0.14, 0.13], [-0.2, 0.05, 0.12, 0.11], [0.05, 0.05, -0.2, 0.1], [-0.14, 0.13, -0.08, 0.09]];
  for (const [dx, y, dz, s] of bits) {
    const r = B(s, s * 0.8, s, st);
    put(g, r, dx, y, dz, Math.random() * 1.5);
  }
  return fin(g, null);
}
// 石灯笼：座 + 柱 + 灯室（暖光呼吸）+ 顶
export function makeStoneLantern(h = 1.1) {
  const g = new THREE.Group();
  const st = STONE();
  put(g, B(0.34, 0.12, 0.34, st), 0, 0.06, 0);
  put(g, CYL(0.07, 0.09, h * 0.5, st, 6), 0, 0.12 + h * 0.25, 0);
  const glow = L({ color: '#FFD98A', emissive: 0xffd98a, emissiveIntensity: 0.7 });
  put(g, B(0.24, 0.18, 0.24, st), 0, h * 0.72, 0);
  put(g, noSh(B(0.16, 0.12, 0.16, glow)), 0, h * 0.72, 0);
  put(g, B(0.34, 0.08, 0.34, st), 0, h * 0.85, 0);
  put(g, CYL(0.02, 0.05, 0.1, st, 5), 0, h * 0.93, 0);
  g.userData.anim = (dt, t) => { glow.emissiveIntensity = 0.55 + 0.2 * Math.sin(t * 3.1); };
  return fin(g, [0.18, 0.18]);
}
// 竹丛：数根青竹 + 叶簇
export function makeBamboo(n = 3) {
  const g = new THREE.Group();
  const bm = L({ color: '#7AB84A' });
  for (let i = 0; i < n; i++) {
    const dx = (i - (n - 1) / 2) * 0.16 + (i % 2) * 0.05, dz = (i % 2) * 0.12 - 0.06;
    const h = 1.5 + (i % 3) * 0.35;
    put(g, CYL(0.035, 0.04, h, bm, 5), dx, h / 2, dz);
    for (let k = 1; k < 4; k++) put(g, CYL(0.042, 0.042, 0.02, L({ color: '#5A9438' }), 5), dx, (h / 4) * k, dz);
    put(g, B(0.3, 0.16, 0.2, L({ color: '#5DBB4A' })), dx + 0.08, h - 0.1, dz, i * 0.7);
    put(g, B(0.22, 0.12, 0.16, L({ color: '#4AA83B' })), dx - 0.1, h - 0.3, dz + 0.04, i * 1.3);
  }
  return fin(g, [0.3, 0.25]);
}
// 穿衣镜：木框 + 反光面（淡蓝 emissive 模拟镜面）
export function makeMirror() {
  const g = new THREE.Group();
  put(g, B(0.6, 1.5, 0.08, WOOD()), 0, 0.95, 0);
  const glass = L({ color: '#B8D8E8', emissive: 0x8ab8d8, emissiveIntensity: 0.25 });
  put(g, noSh(B(0.46, 1.32, 0.03, glass)), 0, 0.95, 0.035);
  for (const dx of [-0.24, 0.24]) put(g, B(0.06, 0.24, 0.14, WOOD()), dx, 0.12, 0.02);
  return fin(g, [0.3, 0.1]);
}
