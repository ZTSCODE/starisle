// 动物精灵：与 spritechar.js 同构（程序化 4 向帧 + billboard 面片 + 团影），体型更小更宽。
// 帧：dir 0=正面(下) 1=背面(上) 2=侧面(右, 左镜像)；每种 dir × [闲置, 走1, 走2, 吃草]。
import * as THREE from 'three';
import { makeTexture, shade } from './textures.js';

const SIZE = {
  small: { W: 18, H: 14, pw: 0.95, ph: 0.74, y: 0.36, sh: 0.62 },
  medium: { W: 26, H: 18, pw: 1.55, ph: 1.05, y: 0.52, sh: 1.05 },
};

// dir: 0正 1背 2侧(右)；phase: 0闲 1/2走；graze: 低头吃草（覆盖 phase）
function drawFrame(g, type, S, dir, phase, graze, col) {
  const body = col, dark = shade(col, -42), lite = shade(col, 26), deep = shade(col, -70);
  const leg = phase === 1 ? 1 : phase === 2 ? -1 : 0; // 行走腿相位
  const small = S.W < 20;
  g.clearRect(0, 0, S.W, S.H);

  if (small) {
    // ── 家禽/小兽（18×14）：两腿，圆身 ──
    const rabbit = type === 'rabbit';
    if (dir === 2) {
      // 体
      g.fillStyle = body; g.fillRect(4, 6, 8, 5);
      g.fillStyle = dark; g.fillRect(4, 10, 8, 1);
      if (type === 'chicken') { g.fillStyle = dark; g.fillRect(6, 7, 3, 2); } // 翅
      if (type === 'duck') { g.fillStyle = dark; g.fillRect(5, 8, 4, 2); g.fillStyle = lite; g.fillRect(2, 5, 2, 2); } // 翘尾
      if (rabbit) { g.fillStyle = lite; g.fillRect(2, 7, 2, 2); } // 圆尾
      // 头（吃草时低到头贴地）
      const hy = graze ? 8 : 3, hx = 11;
      g.fillStyle = body; g.fillRect(hx, hy, 4, 4);
      g.fillStyle = '#23232E'; g.fillRect(hx + 2, hy + 1, 1, 1); // 眼
      if (type === 'chicken') { // 冠+喙
        g.fillStyle = '#E84A4A'; g.fillRect(hx, hy - 2, 2, 2); g.fillRect(hx + 2, hy - 1, 1, 1); g.fillRect(hx + 1, hy + 4, 1, 1);
        g.fillStyle = '#F0A83C'; g.fillRect(hx + 4, hy + 2, 2, 1);
      } else if (type === 'duck') { // 扁喙
        g.fillStyle = '#F0A83C'; g.fillRect(hx + 4, hy + 2, 3, 2);
      } else if (rabbit) { // 长耳+粉鼻
        g.fillStyle = body; g.fillRect(hx, hy - 4, 1, 4); g.fillRect(hx + 2, hy - 5, 1, 5);
        g.fillStyle = '#E88A9A'; g.fillRect(hx + 4, hy + 2, 1, 1);
      }
      // 腿
      g.fillStyle = type === 'chicken' || type === 'duck' ? '#F0A83C' : dark;
      g.fillRect(6 + leg, 11, 1, 2 - Math.max(0, leg)); g.fillRect(9 - leg, 11, 1, 2 - Math.max(0, -leg));
    } else {
      // 正/背面
      g.fillStyle = body; g.fillRect(5, 6, 8, 5);
      g.fillStyle = dark; g.fillRect(5, 10, 8, 1);
      const hy = graze ? 6 : 2;
      if (dir === 0) {
        g.fillStyle = body; g.fillRect(6, hy, 6, 4);
        g.fillStyle = '#23232E'; g.fillRect(7, hy + 1, 1, 1); g.fillRect(10, hy + 1, 1, 1);
        if (type === 'chicken') {
          g.fillStyle = '#E84A4A'; g.fillRect(7, hy - 2, 4, 2);
          g.fillStyle = '#F0A83C'; g.fillRect(8, hy + 3, 2, 1);
        } else if (type === 'duck') {
          g.fillStyle = '#F0A83C'; g.fillRect(7, hy + 2, 4, 2);
        } else if (rabbit) {
          g.fillStyle = body; g.fillRect(6, hy - 4, 2, 4); g.fillRect(10, hy - 5, 2, 5);
          g.fillStyle = '#E88A9A'; g.fillRect(8, hy + 2, 2, 1);
        }
      } else { // 背：尾朝上
        g.fillStyle = dark; g.fillRect(7, 2, 4, 3);
        if (rabbit) { g.fillStyle = lite; g.fillRect(8, 3, 2, 2); }
      }
      g.fillStyle = type === 'chicken' || type === 'duck' ? '#F0A83C' : dark;
      g.fillRect(6 + leg, 11, 2, 2 - Math.max(0, leg)); g.fillRect(10 - leg, 11, 2, 2 - Math.max(0, -leg));
    }
    return;
  }

  // ── 家畜（26×18）：四腿，长身 ──
  if (dir === 2) {
    // 体
    g.fillStyle = body; g.fillRect(3, 5, 17, 7);
    g.fillStyle = dark; g.fillRect(3, 11, 17, 1);
    if (type === 'cow') { // 斑块 + 乳房
      g.fillStyle = deep; g.fillRect(6, 6, 4, 3); g.fillRect(13, 8, 4, 3); g.fillRect(9, 10, 2, 1);
      g.fillStyle = '#E8A8A0'; g.fillRect(11, 12, 3, 2);
    }
    if (type === 'sheep') { // 羊毛疙瘩
      g.fillStyle = lite;
      for (let x = 3; x < 20; x += 3) { g.fillRect(x, 3, 2, 2); g.fillRect(x, 12, 2, 2); }
      g.fillRect(1, 6, 2, 4);
    }
    if (type === 'goat') { g.fillStyle = dark; g.fillRect(3, 4, 3, 2); } // 短尾翘
    if (type === 'pig') { g.fillStyle = deep; g.fillRect(2, 4, 1, 1); g.fillRect(1, 5, 1, 1); } // 卷尾
    if (type === 'cow') { g.fillStyle = deep; g.fillRect(2, 5, 1, 7); g.fillRect(1, 11, 2, 2); } // 尾+尾穗
    // 头（吃草低垂）
    const hy = graze ? 10 : 5, hx = 20;
    if (type === 'sheep') {
      g.fillStyle = '#4A4048'; g.fillRect(hx, hy + 1, 4, 4); // 黑脸
      g.fillStyle = lite; g.fillRect(hx - 1, hy - 1, 5, 3);   // 头顶毛
      g.fillStyle = '#F0F0F0'; g.fillRect(hx + 1, hy + 2, 1, 1);
    } else {
      g.fillStyle = body; g.fillRect(hx, hy, 4, 5);
      g.fillStyle = '#23232E'; g.fillRect(hx + 1, hy + 1, 1, 1);
      if (type === 'cow') {
        g.fillStyle = '#E8B8A0'; g.fillRect(hx, hy + 3, 5, 3); // 鼻镜
        g.fillStyle = deep; g.fillRect(hx + 1, hy + 4, 1, 1); g.fillRect(hx + 3, hy + 4, 1, 1);
        g.fillStyle = lite; g.fillRect(hx, hy - 2, 1, 2); g.fillRect(hx + 3, hy - 2, 1, 2); // 角
        g.fillStyle = dark; g.fillRect(hx - 1, hy, 2, 2); // 耳
      } else if (type === 'goat') {
        g.fillStyle = '#B8A888'; g.fillRect(hx, hy - 3, 1, 3); g.fillRect(hx + 2, hy - 3, 1, 3); // 弯角
        g.fillStyle = dark; g.fillRect(hx + 1, hy + 5, 1, 2); // 胡
        g.fillStyle = deep; g.fillRect(hx + 3, hy + 2, 2, 2);
      } else if (type === 'pig') {
        g.fillStyle = deep; g.fillRect(hx + 3, hy + 2, 3, 3); // 拱嘴
        g.fillStyle = '#23232E'; g.fillRect(hx + 4, hy + 3, 1, 1);
        g.fillStyle = dark; g.fillRect(hx, hy - 1, 2, 2); // 耳
      }
    }
    // 四腿
    g.fillStyle = type === 'sheep' ? '#4A4048' : deep;
    g.fillRect(5 + leg, 12, 2, 5 - Math.max(0, leg)); g.fillRect(8 - leg, 12, 2, 5 - Math.max(0, -leg));
    g.fillRect(14 + leg, 12, 2, 5 - Math.max(0, leg)); g.fillRect(17 - leg, 12, 2, 5 - Math.max(0, -leg));
  } else {
    // 正/背面
    g.fillStyle = body; g.fillRect(7, 7, 12, 6);
    g.fillStyle = dark; g.fillRect(7, 12, 12, 1);
    const hy = graze ? 7 : 3;
    if (dir === 0) {
      if (type === 'sheep') {
        g.fillStyle = lite;
        for (let x = 7; x < 19; x += 3) { g.fillRect(x, 4, 2, 2); }
        g.fillStyle = '#4A4048'; g.fillRect(10, hy + 3, 6, 5);
        g.fillStyle = '#F0F0F0'; g.fillRect(11, hy + 4, 1, 1); g.fillRect(14, hy + 4, 1, 1);
      } else {
        g.fillStyle = body; g.fillRect(9, hy, 8, 5);
        g.fillStyle = '#23232E'; g.fillRect(10, hy + 1, 1, 1); g.fillRect(15, hy + 1, 1, 1);
        if (type === 'cow') {
          g.fillStyle = '#E8B8A0'; g.fillRect(10, hy + 3, 6, 3);
          g.fillStyle = lite; g.fillRect(8, hy - 1, 1, 2); g.fillRect(17, hy - 1, 1, 2);
          g.fillStyle = dark; g.fillRect(8, hy + 1, 1, 2); g.fillRect(17, hy + 1, 1, 2);
        } else if (type === 'goat') {
          g.fillStyle = '#B8A888'; g.fillRect(9, hy - 2, 1, 3); g.fillRect(16, hy - 2, 1, 3);
          g.fillStyle = deep; g.fillRect(11, hy + 3, 4, 2);
        } else if (type === 'pig') {
          g.fillStyle = deep; g.fillRect(11, hy + 2, 4, 3);
          g.fillStyle = '#23232E'; g.fillRect(12, hy + 3, 1, 1); g.fillRect(14, hy + 3, 1, 1);
          g.fillStyle = dark; g.fillRect(9, hy - 1, 2, 2); g.fillRect(15, hy - 1, 2, 2);
        }
      }
    } else { // 背：尾
      g.fillStyle = deep; g.fillRect(12, 3, 2, 5);
      if (type === 'sheep') { g.fillStyle = lite; for (let x = 7; x < 19; x += 3) g.fillRect(x, 4, 2, 2); }
      if (type === 'cow') { g.fillStyle = deep; g.fillRect(8, 8, 3, 2); g.fillRect(15, 9, 3, 2); }
    }
    g.fillStyle = type === 'sheep' ? '#4A4048' : deep;
    g.fillRect(8 + leg, 13, 2, 4 - Math.max(0, leg)); g.fillRect(16 - leg, 13, 2, 4 - Math.max(0, -leg));
  }
}

const texCache = new Map();
function frameTex(type, size, dir, phase, graze, col) {
  const key = `${type}_${dir}_${phase}_${graze ? 1 : 0}`;
  if (texCache.has(key)) return texCache.get(key);
  const S = SIZE[size] || SIZE.small;
  const t = makeTexture(S.W, S.H, (g) => drawFrame(g, type, S, dir, phase, graze, col));
  texCache.set(key, t);
  return t;
}

export function makeAnimalSprite({ type = 'chicken', color = '#F5F0E0', size = 'small' } = {}) {
  const S = SIZE[size] || SIZE.small;
  const frames = { down: [], up: [], side: [] };
  for (const [name, dir] of [['down', 0], ['up', 1], ['side', 2]]) {
    for (const ph of [0, 1, 2]) frames[name].push(frameTex(type, size, dir, ph, false, color));
    frames[name].push(frameTex(type, size, dir, 0, true, color)); // [3]=吃草
  }
  const mat = new THREE.MeshLambertMaterial({ map: frames.down[0], transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const ageo = new THREE.PlaneGeometry(S.pw, S.ph);
  { const n = ageo.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); n.needsUpdate = true; }
  const mesh = new THREE.Mesh(ageo, mat);
  mesh.position.y = S.y;
  const group = new THREE.Group();
  group.add(mesh);
  // 团影（同 spritechar 模式）
  const shTex = makeTexture(32, 32, (g) => {
    const grad = g.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, 'rgba(10,12,20,0.4)'); grad.addColorStop(1, 'rgba(10,12,20,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
  });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(S.sh, S.sh), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02;
  group.add(blob);

  const api = {
    group, mesh, frames,
    dir: 'down', flip: false, animT: 0,
    update(dt, moving, facing, grazing) {
      const deg = ((facing * 180 / Math.PI) + 360) % 360;
      if (deg > 45 && deg <= 135) { api.dir = 'side'; api.flip = true; }
      else if (deg > 135 && deg <= 225) { api.dir = 'up'; api.flip = false; }
      else if (deg > 225 && deg <= 315) { api.dir = 'side'; api.flip = false; }
      else { api.dir = 'down'; api.flip = false; }
      mesh.scale.x = api.flip ? -1 : 1;
      if (grazing) { mat.map = frames[api.dir][3]; api.animT = 0; }       // 吃草
      else if (moving) { api.animT += dt * 7; mat.map = frames[api.dir][1 + Math.floor(api.animT) % 2]; }
      else { mat.map = frames[api.dir][0]; api.animT = 0; }               // 闲置
    },
    faceCamera(camera) {
      const camPos = new THREE.Vector3();
      camera.getWorldPosition(camPos);
      mesh.rotation.y = Math.atan2(camPos.x - group.position.x, camPos.z - group.position.z);
    },
  };
  return api;
}
