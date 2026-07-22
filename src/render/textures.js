// 程序化像素贴图：调色板 + 逐像素绘制 + 图集（NearestFilter，16px/tile）
import * as THREE from 'three';
import { rng, hashStr } from '../core/rng.js';

// 全局调色板（≤64 色，四季骨架色不变，植被/氛围换季偏移）
export const PAL = {
  grass: ['#7EC850', '#3E9B4F', '#C9A24B', '#E8EEF2'],   // 春夏秋冬
  grassD: ['#6CB43F', '#358843', '#B8923F', '#D5DEE6'],
  dirt: '#8B6F47', dirtD: '#7A5F3C', till: '#6B4E2E', tillWet: '#4E3822',
  sand: '#E8D8A8', snow: '#F2F6FA', stone: '#8D8D96', stoneD: '#6E6E78',
  path: '#B89B6A', wood: '#9A6B3F', woodD: '#7A5230', leaf: ['#5DBB4A', '#2E8B3D', '#D9782D', '#3E5F4E'],
  leafD: ['#4AA83B', '#247633', '#C05E24', '#2F4A3C'],
  water: ['#5FB4E8', '#4FA8DC', '#7AA8C8', '#B9D9EB'], waterD: ['#3E94C8', '#3A8ABC', '#5E8CA8', '#9CC4DC'],
  flower: '#FFC9DD', trunk: '#6E4A2A', roof: '#B8543E', roofD: '#96422F',
  wall: '#E8DCC8', winLit: '#FFD98A', winDark: '#4A5578', skin: '#F0C8A0',
  hair: ['#4A3220', '#2A2A32', '#8A5A2A', '#B8B0A8', '#6E3A1E', '#3A5A8C', '#7A4A6E', '#C86E3A'],
  shirt: ['#4A7AB8', '#B84A4A', '#4AA86E', '#B89A3E', '#7A4A9E', '#3E8E96'],
  pants: '#3A4A6E', white: '#FFFFFF', black: '#1A1A22',
};

function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function P(g, x, y, col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }

// 基础噪点地面：底色 + 深色斑点 + 亮斑
function groundTile(base, dark, lite, seed, density = 0.22) {
  const c = cv(16, 16), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = r();
    if (v < density * 0.5) P(g, x, y, dark);
    else if (v < density) P(g, x, y, lite || dark);
  }
  return c;
}
// 草地：底色 + 深草斑 + 2-3px 草簇
function grassTile(season, seed) {
  const c = groundTile(PAL.grass[season], PAL.grassD[season], PAL.grass[season], seed, 0.3);
  const g = c.getContext('2d'), r = rng(seed + 7);
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * 15), y = Math.floor(r() * 14);
    P(g, x, y, PAL.grassD[season]); P(g, x + 1, y, PAL.grassD[season]); P(g, x, y - 1 > 0 ? y - 1 : y, PAL.grassD[season]);
  }
  if (season === 0 && r() < 0.5) { P(g, Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, PAL.flower); } // 春花点
  return c;
}
// 耕地：垄沟纹理（横向 3px 间隔）
function tillTile(wet, seed) {
  const c = cv(16, 16), g = c.getContext('2d'), r = rng(seed);
  const base = wet ? PAL.tillWet : PAL.till, dark = wet ? '#3A2A18' : '#5A4026';
  g.fillStyle = base; g.fillRect(0, 0, 16, 16);
  for (let y = 1; y < 16; y += 4) { g.fillStyle = dark; g.fillRect(0, y, 16, 1); }
  for (let i = 0; i < 14; i++) P(g, Math.floor(r() * 16), Math.floor(r() * 16), dark);
  return c;
}
// 石板/石地
function stoneTile(seed) {
  const c = groundTile(PAL.stone, PAL.stoneD, '#A5A5AE', seed, 0.25);
  const g = c.getContext('2d');
  g.fillStyle = PAL.stoneD;
  g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1); g.fillRect(5, 0, 1, 6); g.fillRect(11, 6, 1, 6); g.fillRect(7, 12, 1, 4);
  return c;
}
// 水面（单帧；动画由材质 offset 驱动）
function waterTile(season, seed) {
  const c = cv(16, 16), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = PAL.water[season]; g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 6; i++) { // 高光波纹
    const y = Math.floor(r() * 16), x = Math.floor(r() * 12), w = 2 + Math.floor(r() * 3);
    g.fillStyle = PAL.waterD[season]; g.fillRect(x, y, w, 1);
  }
  return c;
}
// 木地板
function woodTile(seed) {
  const c = cv(16, 16), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = PAL.wood; g.fillRect(0, 0, 16, 16);
  for (let y = 0; y < 16; y += 4) { g.fillStyle = PAL.woodD; g.fillRect(0, y, 16, 1); }
  for (let i = 0; i < 8; i++) P(g, Math.floor(r() * 16), Math.floor(r() * 16), PAL.woodD);
  return c;
}

export class Atlas {
  constructor(cols = 16, rows = 16, tile = 16) {
    this.cols = cols; this.rows = rows; this.tile = tile;
    this.canvas = cv(cols * tile, rows * tile);
    this.g = this.canvas.getContext('2d');
    this.map = new Map(); this.idx = 0;
  }
  add(name, canvas) {
    if (this.idx >= this.cols * this.rows) throw new Error('atlas full: ' + name);
    const i = this.idx++;
    const x = (i % this.cols) * this.tile, y = Math.floor(i / this.cols) * this.tile;
    this.g.drawImage(canvas, x, y);
    const w = this.canvas.width, h = this.canvas.height;
    this.map.set(name, { u0: x / w, v0: 1 - (y + this.tile) / h, u1: (x + this.tile) / w, v1: 1 - y / h, i });
    return this;
  }
  uv(name) { const r = this.map.get(name); if (!r) throw new Error('no tile ' + name); return r; }
  has(name) { return this.map.has(name); }
  build() {
    const t = new THREE.CanvasTexture(this.canvas);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 4; t.generateMipmaps = true;
    t.colorSpace = THREE.SRGBColorSpace;
    this.texture = t;
    return t;
  }
}

// 注册全部地形贴图（season 变体命名：name+seasonIdx，无季节变体用原名）
export function buildTerrainAtlas() {
  const A = new Atlas();
  for (let s = 0; s < 4; s++) {
    A.add('grass' + s, grassTile(s, hashStr('grass' + s)));
    A.add('water' + s, waterTile(s, hashStr('water' + s)));
    A.add('leaf' + s, groundTile(PAL.leaf[s], PAL.leafD[s], PAL.leaf[s], hashStr('leaf' + s), 0.35));
  }
  A.add('dirt', groundTile(PAL.dirt, PAL.dirtD, '#9C7F55', hashStr('dirt'), 0.3));
  A.add('till', tillTile(false, hashStr('till')));
  A.add('tillwet', tillTile(true, hashStr('tillwet')));
  A.add('sand', groundTile(PAL.sand, '#D8C48E', '#F4E8C4', hashStr('sand'), 0.25));
  A.add('snow', groundTile(PAL.snow, '#DDE6EE', '#FFFFFF', hashStr('snow'), 0.2));
  A.add('stone', stoneTile(hashStr('stone')));
  A.add('path', groundTile(PAL.path, '#A88A5A', '#C8AC7A', hashStr('path'), 0.3));
  A.add('wood', woodTile(hashStr('wood')));
  A.add('trunk', groundTile(PAL.trunk, '#5A3A20', '#7E5A38', hashStr('trunk'), 0.35));
  A.build();
  return A;
}

// 独立小贴图（角色/道具用，不进地形图集）
export function makeTexture(w, h, draw) {
  const c = cv(w, h), g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
// ---- 共享纹理库（全资产用：树皮/石纹/金属/木纹/干草/叶簇面片）----
const texCache = new Map();
function cached(key, w, h, draw) {
  if (!texCache.has(key)) texCache.set(key, makeTexture(w, h, draw));
  return texCache.get(key);
}
// 树皮纹（竖向裂纹）
export function barkTex() {
  return cached('bark', 16, 16, (g) => {
    g.fillStyle = '#6E4A2A'; g.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x += 3) { g.fillStyle = '#5A3A20'; g.fillRect(x, 0, 1, 16); }
    for (let i = 0; i < 10; i++) { g.fillStyle = '#7E5A38'; g.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 3); }
  });
}
// 石纹（裂纹+苔点）
export function stoneTex() {
  return cached('stone', 16, 16, (g) => {
    g.fillStyle = '#8D8D96'; g.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 30; i++) { g.fillStyle = Math.random() < 0.5 ? '#7A7A84' : '#A0A0AA'; g.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 2, 1); }
    g.fillStyle = '#6E7A5A'; for (let i = 0; i < 5; i++) g.fillRect(Math.floor(Math.random() * 14) + 1, Math.floor(Math.random() * 14) + 1, 2, 2);
    g.strokeStyle = '#6A6A74'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(3, 0); g.lineTo(7, 8); g.lineTo(5, 16); g.moveTo(10, 0); g.lineTo(13, 10); g.stroke();
  });
}
// 金属（拉丝+铆点）
export function metalTex() {
  return cached('metal', 16, 16, (g) => {
    g.fillStyle = '#4A4A56'; g.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 2) { g.fillStyle = y % 4 ? '#3E3E4A' : '#565664'; g.fillRect(0, y, 16, 1); }
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) { g.fillStyle = '#6A6A78'; g.fillRect(x, y, 1, 1); }
  });
}
// 木纹（横板）
export function woodTex() {
  return cached('wood', 16, 16, (g) => {
    g.fillStyle = '#9A6B3F'; g.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) { g.fillStyle = '#7A5230'; g.fillRect(0, y, 16, 1); }
    for (let i = 0; i < 8; i++) { g.fillStyle = '#8A5E34'; g.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 4, 1); }
  });
}
// 干草（横向纤维）
export function hayTex() {
  return cached('hay', 16, 16, (g) => {
    g.fillStyle = '#D8B85A'; g.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 2) { g.fillStyle = y % 4 ? '#C8A84E' : '#E8C86A'; g.fillRect(0, y, 16, 1); }
    for (let i = 0; i < 12; i++) { g.fillStyle = '#B89840'; g.fillRect(Math.floor(Math.random() * 14), Math.floor(Math.random() * 16), 3, 1); }
  });
}
// 叶簇面片（透明底，树冠组合用；按季着色）
export function leafSprite(season, variant = 0) {
  return cached('leaf' + season + '_' + variant, 16, 16, (g) => {
    const cols = [PAL.leaf[season], shade(PAL.leaf[season], -18), shade(PAL.leaf[season], 14)];
    g.clearRect(0, 0, 16, 16);
    const r = rng(hashStr('leafspr' + season + variant));
    for (let i = 0; i < 26; i++) {
      const x = 8 + (r() - 0.5) * 12, y = 8 + (r() - 0.5) * 12;
      const d = Math.hypot(x - 8, y - 8);
      if (d > 7.5) continue;
      g.fillStyle = cols[Math.floor(r() * 3)];
      g.fillRect(Math.floor(x), Math.floor(y), 2, 2);
    }
    if (season === 0) { g.fillStyle = '#FFC9DD'; for (let i = 0; i < 4; i++) g.fillRect(3 + Math.floor(r() * 10), 3 + Math.floor(r() * 10), 1, 1); }
    if (season === 2) { g.fillStyle = '#C94F3D'; for (let i = 0; i < 4; i++) g.fillRect(3 + Math.floor(r() * 10), 3 + Math.floor(r() * 10), 1, 1); }
    if (season === 3) { g.fillStyle = '#F2F6FA'; for (let i = 0; i < 6; i++) g.fillRect(3 + Math.floor(r() * 10), 2 + Math.floor(r() * 4), 2, 1); }
  });
}
export { cv as mkCanvas, P as setPx };
