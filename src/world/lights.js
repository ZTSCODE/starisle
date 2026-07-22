// 氛围光源系统：≥10 种光源道具（自发光+夜间增强+火光闪烁）+ 实点光源池（夜间就近照明）
import * as THREE from 'three';
import { PAL, shade, makeTexture } from '../render/textures.js';
import { stoneTex, metalTex, woodTex, barkTex } from '../render/textures.js';

const POOL_N = 8;

export class LightProps {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group();
    this.lit = []; // { x, z, y, kind, mats:[{mat, day, night}], flicker?, base }
    // 实点光源池（夜间分配给距玩家最近的发光体）
    this.pool = [];
    for (let i = 0; i < POOL_N; i++) {
      const l = new THREE.PointLight(0xffc888, 0, 9, 1.4);
      this.pool.push(l);
      game.engine.scene.add(l);
    }
  }
  reg(x, z, y, kind, mats, flicker = false, color = 0xffc888) {
    this.lit.push({ x, z, y, kind, mats, flicker, color, t: Math.random() * 6 });
  }
  // ============ 光源建造器（12 种） ============
  porchLamp(x, z) { // 1. 门前灯（铁艺小壁灯）
    const g = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.4), new THREE.MeshLambertMaterial({ map: metalTex() }));
    arm.position.set(0, 2.1, 0.15);
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), new THREE.MeshLambertMaterial({ color: '#3A3A46' }));
    cage.position.set(0, 2.0, 0.35);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshLambertMaterial({ color: PAL.winLit, emissive: 0xffc888, emissiveIntensity: 0 }));
    bulb.position.copy(cage.position);
    g.add(arm, cage, bulb);
    g.position.set(x, 0, z);
    this.group.add(g);
    this.reg(x, z, 2.0, 'porch', [bulb.material]);
  }
  campfire(x, z) { // 2. 篝火（石圈+柴堆+火苗）
    const g = new THREE.Group();
    const stoneM = new THREE.MeshLambertMaterial({ map: stoneTex() });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), stoneM);
      s.position.set(Math.cos(a) * 0.5, 0.08, Math.sin(a) * 0.5);
      g.add(s);
    }
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 5), new THREE.MeshLambertMaterial({ map: woodTex() }));
      log.rotation.z = Math.PI / 2; log.rotation.y = (i / 4) * Math.PI;
      log.position.y = 0.12 + i * 0.04;
      g.add(log);
    }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.1, 0.35) }));
    flame.position.y = 0.45;
    const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.0, 0.8) }));
    flame2.position.y = 0.4;
    g.add(flame, flame2);
    g.position.set(x, 0, z);
    this.group.add(g);
    this.reg(x, z, 0.5, 'fire', [flame.material, flame2.material], true, 0xff9a3c);
  }
  stringLight(x0, z0, x1, z1, n = 7) { // 3. 彩灯带（两点间悬链彩球，两端木杆支撑）
    const g = new THREE.Group();
    const cols = ['#FFD98A', '#FF8AB8', '#8AE84A', '#7AB8E8', '#E8A84A'];
    const lineMat = new THREE.MeshBasicMaterial({ color: '#3A3226' });
    const poleMat = new THREE.MeshLambertMaterial({ map: barkTex() });
    for (const [px, pz] of [[x0, z0], [x1, z1]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.5, 5), poleMat);
      pole.position.set(px, 1.25, pz);
      g.add(pole);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), poleMat);
      knob.position.set(px, 2.52, pz);
      g.add(knob);
    }
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      const y = 2.3 - Math.sin(t * Math.PI) * 0.35;
      pts.push(new THREE.Vector3(x, y, z));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshLambertMaterial({ color: cols[i % cols.length], emissive: new THREE.Color(cols[i % cols.length]), emissiveIntensity: 0 }));
      bulb.position.set(x, y - 0.08, z);
      g.add(bulb);
      this.reg(x, z, y, 'string', [bulb.material], false, 0xffd98a);
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
    g.add(line);
    this.group.add(g);
  }
  stoneLantern(x, z) { // 4. 石灯笼
    const g = new THREE.Group();
    const stoneM = new THREE.MeshLambertMaterial({ map: stoneTex() });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.5, 6), stoneM);
    base.position.y = 0.25;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.34), stoneM);
    box.position.y = 0.65;
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.36), new THREE.MeshLambertMaterial({ color: PAL.winLit, emissive: 0xffd080, emissiveIntensity: 0 }));
    glow.position.y = 0.65;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.3, 4), stoneM);
    cap.position.y = 0.95;
    g.add(base, box, glow, cap);
    g.position.set(x, 0, z);
    this.group.add(g);
    this.reg(x, z, 0.65, 'stone', [glow.material]);
  }
  torch(x, z) { // 5. 火把
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.3, 5), new THREE.MeshLambertMaterial({ map: woodTex() }));
    post.position.y = 0.65;
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 5), new THREE.MeshLambertMaterial({ color: '#5A3A20' }));
    wrap.position.y = 1.3;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.3, 1.2, 0.3) }));
    flame.position.y = 1.55;
    g.add(post, wrap, flame);
    g.position.set(x, 0, z);
    this.group.add(g);
    this.reg(x, z, 1.5, 'torch', [flame.material], true, 0xff9a3c);
  }
  hangingLantern(x, z, y = 2.2) { // 6. 挂灯（树枝/檐下垂灯）
    const g = new THREE.Group();
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 3), new THREE.MeshBasicMaterial({ color: '#2A2A32' }));
    chain.position.set(x, y - 0.25, z);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.26, 7), new THREE.MeshLambertMaterial({ color: '#B8543E', emissive: 0xff9a50, emissiveIntensity: 0 }));
    body.position.set(x, y - 0.55, z);
    g.add(chain, body);
    this.group.add(g);
    this.reg(x, z, y - 0.5, 'hang', [body.material]);
  }
  floatLantern(x, z) { // 7. 河灯（水面漂灯，慢漂）
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.1, 6), new THREE.MeshLambertMaterial({ color: '#E8D8A8' }));
    base.rotation.x = Math.PI;
    const glow = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 6), new THREE.MeshLambertMaterial({ color: PAL.winLit, emissive: 0xffc888, emissiveIntensity: 0 }));
    glow.position.y = 0.12;
    g.add(base, glow);
    g.position.set(x, 0.03, z);
    this.group.add(g);
    const rec = { x, z, y: 0.1, kind: 'float', mats: [glow.material], flicker: false, color: 0xffc888, t: Math.random() * 6, mesh: g, drift: Math.random() * Math.PI * 2 };
    this.lit.push(rec);
  }
  candleSet(x, z) { // 8. 蜡烛台（三根一组）
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const h = 0.18 + i * 0.05;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, h, 6), new THREE.MeshLambertMaterial({ color: '#F0E8D0' }));
      c.position.set(i * 0.12 - 0.12, h / 2 + 0.3, 0);
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.6, 0.7) }));
      f.position.set(i * 0.12 - 0.12, h + 0.34, 0);
      g.add(c, f);
      if (i === 1) this.reg(x, z, 0.6, 'candle', [f.material], true, 0xffd080);
    }
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.06, 8), new THREE.MeshLambertMaterial({ map: metalTex() }));
    tray.position.y = 0.28;
    g.add(tray);
    g.position.set(x, 0, z);
    this.group.add(g);
  }
  mushroomLight(x, z) { // 9. 蘑菇灯（发光小蘑菇）
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.2, 5), new THREE.MeshLambertMaterial({ color: '#D8E8D0' }));
    stem.position.y = 0.1;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#7AE8C8', emissive: 0x7ae8c8, emissiveIntensity: 0 }));
    cap.position.y = 0.2;
    g.add(stem, cap);
    g.position.set(x, 0, z);
    this.group.add(g);
    this.reg(x, z, 0.2, 'shroom', [cap.material]);
  }
  railLamp(x, z) { // 10. 矿道轨灯
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), new THREE.MeshLambertMaterial({ map: metalTex() }));
    post.position.y = 0.75;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), new THREE.MeshLambertMaterial({ color: '#3A3A46' }));
    box.position.y = 1.55;
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), new THREE.MeshLambertMaterial({ color: PAL.winLit, emissive: 0xffc888, emissiveIntensity: 0 }));
    glow.position.y = 1.55;
    g.add(post, box, glow);
    g.position.set(x, 0, z);
    this.group.add(g);
    this.reg(x, z, 1.5, 'rail', [glow.material]);
  }
  gardenLight(x, z) { // 11. 花园小灯（矮柱庭院灯）
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.5, 5), new THREE.MeshLambertMaterial({ map: metalTex() }));
    post.position.y = 0.25;
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshLambertMaterial({ color: '#D8F0C8', emissive: 0xc8ffa8, emissiveIntensity: 0 }));
    top.position.y = 0.55;
    g.add(post, top);
    g.position.set(x, 0, z);
    this.group.add(g);
    this.reg(x, z, 0.5, 'garden', [top.material]);
  }
  stringFlags(x0, z0, x1, z1, n = 6) { // 12. 彩旗带（三角旗串，两端木杆支撑）
    const g = new THREE.Group();
    const cols = ['#E8873A', '#4A7AB8', '#B8543E', '#4AA84A', '#B87AE8', '#E8C469'];
    const poleMat = new THREE.MeshLambertMaterial({ map: barkTex() });
    for (const [px, pz] of [[x0, z0], [x1, z1]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.8, 5), poleMat);
      pole.position.set(px, 1.4, pz);
      g.add(pole);
    }
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      const y = 2.6 - Math.sin(t * Math.PI) * 0.3;
      pts.push(new THREE.Vector3(x, y, z));
      const flag = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 3), new THREE.MeshLambertMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
      flag.position.set(x, y - 0.18, z);
      flag.rotation.x = Math.PI;
      g.add(flag);
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#5A5244' })));
    this.group.add(g);
  }

  pierLamp(x, z, deckY = 0.5) { // 13. 栈桥末端灯（甲板高度）
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.7, 5), new THREE.MeshLambertMaterial({ map: metalTex() }));
    post.position.y = deckY + 0.85;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 6), new THREE.MeshLambertMaterial({ color: '#3A3A46' }));
    cap.position.y = deckY + 1.85;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshLambertMaterial({ color: PAL.winLit, emissive: 0xffc888, emissiveIntensity: 0 }));
    bulb.position.y = deckY + 1.68;
    g.add(post, cap, bulb);
    g.position.set(x, 0, z);
    this.group.add(g);
    this.reg(x, z, deckY + 1.68, 'porch', [bulb.material]);
  }

  // ============ 批量摆放 ============
  placeAll() {
    // 门前灯：每栋建筑门口
    const doors = [[21, 11.2], [21, 64.7], [34, 64.7], [44, 71.2], [9.5, 77.3], [44, 77.4], [54, 59.7], [14, 72.7], [32, 86.3], [51, 63.3]];
    for (const [x, z] of doors) { this.porchLamp(x - 0.8, z); this.porchLamp(x + 0.8, z); }
    // 篝火：海滩×2 + 森林×1 + 农场×1
    this.campfire(70, 74); this.campfire(88, 58); this.campfire(64, 32); this.campfire(12, 20);
    // 彩灯带：广场×2 + 农场门廊×1 + 酒吧街×1
    this.stringLight(20, 60, 36, 60, 9);
    this.stringLight(24, 70, 40, 70, 8);
    this.stringLight(18, 11, 24, 11, 5);
    this.stringLight(40, 77, 48, 77, 5);
    // 彩灯带增补：西镇街/东镇街/海滩小径/农田边
    this.stringLight(8, 66, 14, 66, 5);
    this.stringLight(44, 62, 52, 62, 6);
    this.stringLight(58, 74, 66, 74, 6);
    this.stringLight(18, 36, 26, 36, 6);
    // 渔船彩灯（搁浅渔船桅杆两端）
    this.stringLight(78.9, 76.7, 79.9, 76.1, 3);
    this.stringLight(79.9, 76.1, 81.1, 75.3, 3);
    // 石灯笼：主路/山路/广场
    for (const [x, z] of [[22, 40], [25, 48], [22, 10], [26, -8], [24, -20], [30, 62], [26, 66], [10, 52], [46, 56], [34, 30], [44, 44], [58, 44], [70, 54], [84, 46], [16, 86], [48, 88], [36, -6], [20, -18]]) this.stoneLantern(x, z);
    // 火把：矿口/栅栏/农场边
    for (const [x, z] of [[22.4, -26], [25.6, -26], [6, 39], [26, 39], [4, 44], [48, 46]]) this.torch(x, z);
    // 挂灯：农场树/镇口树/森林树
    for (const [x, z] of [[8, 10], [40, 8], [14, 50], [30, 52], [58, 18], [74, 28], [86, 16]]) this.hangingLantern(x, z, 2.2);
    // 河灯：农场景塘/森林湖/南海
    for (const [x, z] of [[32, 31], [34, 33], [69, 17], [71, 19], [80, 90], [100, 70]]) this.floatLantern(x, z);
    // 蜡烛台：酒吧/旧会馆/教堂感
    this.candleSet(43, 77.5); this.candleSet(45, 77.5); this.candleSet(44, 71.3); this.candleSet(20, 11.2);
    // 蘑菇灯：森林×6
    for (const [x, z] of [[56, 14], [62, 22], [68, 30], [76, 16], [82, 26], [90, 32]]) this.mushroomLight(x, z);
    // 矿道灯：矿口与矿车点
    for (const [x, z] of [[23, -25], [30, -20], [36, -22]]) this.railLamp(x, z);
    // 花园灯：农场小径/镇花园/海滩与林间路
    for (const [x, z] of [[22, 18], [25, 22], [21, 34], [26, 44], [18, 62], [38, 68], [46, 74], [12, 66], [30, 10], [38, 16], [18, 74], [30, 86], [54, 66], [64, 74], [78, 70], [86, 62], [58, 26], [72, 36], [20, -12], [28, -16]]) this.gardenLight(x, z);
    // 彩旗带：广场×1 + 海滩码头×1
    this.stringFlags(22, 62, 34, 62, 7);
    this.stringFlags(88, 70, 94, 76, 5);
    // 栈桥末端灯（甲板末端，夜里给码头尽头照明）
    this.pierLamp(92, 93.3, 0.5);
  }

  update(dt, t, isNight, playerPos, minute) {
    // 自发光：18:00 起渐亮至 2.0，白天暗态 0.3；火光闪烁
    const litTarget = (minute != null && minute >= 1080) ? 2.0 : (isNight ? 2.0 : 0.3);
    for (const l of this.lit) {
      l.t += dt;
      for (const m of l.mats) {
        if (l.flicker) m.opacity = 0.85 + Math.sin(l.t * 9 + l.x) * 0.15;
        if (m.emissive) m.emissiveIntensity += (litTarget - m.emissiveIntensity) * Math.min(1, dt * 2);
      }
      if (l.kind === 'float' && l.mesh) {
        l.mesh.position.x = l.x + Math.sin(l.t * 0.3 + l.drift) * 0.5;
        l.mesh.position.z = l.z + Math.cos(l.t * 0.22 + l.drift) * 0.5;
      }
    }
    // 点光源池：18:00 起把池灯分配给距玩家最近的发光体
    if (playerPos) {
      const poolOn = isNight || (minute != null && minute >= 1080);
      const sorted = [...this.lit].sort((a, b) => Math.hypot(a.x - playerPos.x, a.z - playerPos.z) - Math.hypot(b.x - playerPos.x, b.z - playerPos.z));
      for (let i = 0; i < POOL_N; i++) {
        const pl = this.pool[i];
        const target = poolOn && sorted[i] ? 1.4 : 0;
        if (sorted[i]) pl.position.set(sorted[i].x, sorted[i].y + 0.3, sorted[i].z);
        pl.intensity += (target - pl.intensity) * Math.min(1, dt * 3);
      }
    }
  }
}
