// 畜牧系统：鸡舍/畜棚建造、动物放养 AI、抚摸/喂食/拣产物、心情×好感双轨、加工机器
// 设计文档：docs/design/animals.md；数值来源：docs/research/sdv-systems.md §3
import * as THREE from 'three';
import { ANIMALS, BUILDINGS, animalDef, buildingDef, machineDef } from '../data/animals.js';
import { getItem } from '../data/items.js';
import { addItem, removeItem, countItem, addMoney, addXP, heldItem } from '../core/state.js';
import { makeAnimalSprite } from '../render/spriteanimal.js';
import { makeTexture, PAL, shade } from '../render/textures.js';
import { farmGroundType } from './farming.js';

export const PASTURE = { x0: 4, z0: 25, x1: 20, z1: 38 }; // 西侧放养区（草地区，池塘/农舍/农田之外）
const SLOTS = [ // 建筑落位候选（中心点，间距 ≥6.5m）
  { x: 8, z: 28 }, { x: 14.5, z: 28 }, { x: 8, z: 34.5 }, { x: 14.5, z: 34.5 },
];
const BSIZE = { coop: [3.6, 2.8], coop2: [4.1, 3.2], barn: [4.6, 3.4], barn2: [5.2, 3.9] }; // [宽,深]
const RETURN_MINUTE = 1020; // 17:00 回舍
const QUALITY_GLOW = ['#FFF8DC', '#C0C0C8', '#FFD98A', '#7AE8E0'];

export class AnimalsSystem {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group(); // 畜牧可视层（建筑/动物/产物/机器）
    game.engine.scene.add(this.group);
    this.aRt = new Map();      // 动物实例 id -> { sprite, target, grazeT, thinkT, voiceT, returning, outDelay, digT, trufflesPending, facing }
    this.bMeshes = new Map();  // 建筑 uid -> { group, door, hayMesh, doorRot }
    this.mMeshes = new Map();  // 机器 uid -> { group, lampMat, bubbleT }
    this.pMeshes = new Map();  // 产物 uid -> { group, glowMat }
    this.ray = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.ensureState();
    game.bus.on('day-start', () => this.onDayStart());
    game.bus.on('minute', () => this.onMinute());
    game.bus.on('weather-change', (w) => this.onWeather(w));
    this.rebuildAll();
  }

  // ---- state ----
  ensureState() {
    const s = this.game.state;
    if (!s.animals) s.animals = {};
    const A = s.animals;
    if (!A.list) A.list = [];
    if (!A.products) A.products = [];
    if (!A.machines) A.machines = [];
    if (A.hayStock == null) A.hayStock = 0;
    if (!A.nextUid) A.nextUid = 1;
    if (!A.nameSeq) A.nameSeq = {};
    if (!s.farm.buildings) s.farm.buildings = [];
    for (const b of s.farm.buildings) { if (!b.uid) b.uid = A.nextUid++; if (b.hay == null) b.hay = 0; if (b.doorOpen == null) b.doorOpen = true; }
    return A;
  }
  get A() { return this.game.state.animals; }
  byId(id) { return this.A.list.find((a) => a.id === id); }
  bById(uid) { return this.game.state.farm.buildings.find((b) => b.uid === uid); }
  mById(uid) { return this.A.machines.find((m) => m.uid === uid); }
  buildingOf(a) { return this.bById(a.building); }
  animalsIn(b) { return this.A.list.filter((a) => a.building === b.uid); }
  countType(type) { return this.A.list.filter((a) => a.type === type).length; }
  canOutToday() {
    const w = this.game.state.weather.today;
    return this.game.clock.season !== 3 && !['rain', 'storm', 'snow'].includes(w);
  }
  doorPos(b) { const s = BSIZE[b.id] || BSIZE.coop; return { x: b.x, z: b.z + s[1] / 2 + 0.6 }; }

  denyAt(x, z, msg) {
    this.game.audio.sfx('error');
    this.game.effects.floatText(new THREE.Vector3(x, 1.1, z), msg, '#E84A4A', 12);
    return false;
  }

  // ==================== 建筑 ====================
  // 购买建筑（商店系统调用；校验金钱+材料，自动落位放养区槽位）
  buyBuilding(id) {
    const g = this.game, def = buildingDef(id);
    if (!def) return null;
    const p = new THREE.Vector3(g.player?.pos.x || 24, 1.2, g.player?.pos.z || 26);
    if (g.state.player.money < def.price) { this.denyAt(p.x, p.z, `金钱不足（需 ${def.price}g）`); return null; }
    for (const [mat, n] of Object.entries(def.materials)) {
      if (countItem(g.state, mat) < n) { this.denyAt(p.x, p.z, `材料不足：${getItem(mat).name} ×${n}`); return null; }
    }
    const slot = SLOTS.find((s) => !g.state.farm.buildings.some((b) => Math.abs(b.x - s.x) < 6 && Math.abs(b.z - s.z) < 6));
    if (!slot) { this.denyAt(p.x, p.z, '放养区没有空位了'); return null; }
    addMoney(g.state, -def.price);
    for (const [mat, n] of Object.entries(def.materials)) removeItem(g.state, mat, n);
    const b = { uid: this.A.nextUid++, id, x: slot.x, z: slot.z, hay: 0, doorOpen: true };
    g.state.farm.buildings.push(b);
    this.spawnBuildingMesh(b);
    g.audio.sfx('buy');
    g.effects.burst(new THREE.Vector3(b.x, 1, b.z), ['#9A6B3F', '#E8DCC8', '#B8543E'], 18, 2.6);
    g.effects.floatText(new THREE.Vector3(b.x, 2.4, b.z), `${def.name} 建成！`, '#FFD98A', 15);
    g.effects.shakeScreen(0.04);
    g.bus.emit('building-built', { id, x: b.x, z: b.z });
    return b;
  }

  // ==================== 动物购买/出售 ====================
  buyAnimal(type, name) {
    const g = this.game, def = animalDef(type);
    if (!def) return null;
    const p = g.player?.pos || { x: 24, z: 26 };
    const b = g.state.farm.buildings.find((b) => b.id.startsWith(def.house) && this.animalsIn(b).length < buildingDef(b.id).capacity);
    if (!b) { this.denyAt(p.x, p.z, `需要有空位的${def.house === 'coop' ? '鸡舍' : '畜棚'}`); return null; }
    if (g.state.player.money < def.buyPrice) { this.denyAt(p.x, p.z, `金钱不足（需 ${def.buyPrice}g）`); return null; }
    addMoney(g.state, -def.buyPrice);
    const A = this.A;
    A.nameSeq[type] = (A.nameSeq[type] || 0) + 1;
    const d = this.doorPos(b);
    const a = {
      id: A.nextUid++, type, name: name || `${def.name}${A.nameSeq[type]}号`,
      x: d.x, z: d.z, friendship: 0, mood: 150,
      fedToday: true, pettedToday: false, // 新购当天不进食（SDV），无断粮惩罚
      age: def.adultDays, produceTimer: 0, inside: true, outside: false,
      building: b.uid, boughtAt: g.clock.absoluteDay,
    };
    A.list.push(a);
    this.spawnAnimalMesh(a);
    g.audio.sfx('buy');
    this.voice(type);
    g.effects.burst(new THREE.Vector3(d.x, 0.8, d.z), ['#FF8AA8', '#FFFFFF'], 10, 1.8);
    g.effects.floatText(new THREE.Vector3(d.x, 1.4, d.z), `${a.name} 加入了农场！`, '#FFD98A', 14);
    g.bus.emit('animal-bought', { type, name: a.name });
    return a;
  }
  // 出售价 = 买价 × (好感/1000 + 0.3)（SDV 公式）
  sellPriceOf(a) { return Math.round(animalDef(a.type).buyPrice * (a.friendship / 1000 + 0.3)); }
  sellAnimal(id) {
    const g = this.game, a = typeof id === 'object' ? id : this.byId(id);
    if (!a) return 0;
    const price = this.sellPriceOf(a);
    addMoney(g.state, price);
    g.audio.sfx('coin');
    g.effects.burst(new THREE.Vector3(a.x, 0.8, a.z), ['#FFD98A', '#FFFFFF'], 10, 2);
    g.effects.floatText(new THREE.Vector3(a.x, 1.3, a.z), `售出 ${a.name} +${price}g`, '#FFD98A', 13);
    this.removeAnimalMesh(a);
    this.A.list = this.A.list.filter((x) => x.id !== a.id);
    return price;
  }

  // ==================== 互动（全部带六层反馈） ====================
  // 抚摸：好感 +8/日，心情 +32
  pet(id) {
    const g = this.game, a = typeof id === 'object' ? id : this.byId(id);
    if (!a) return false;
    const p = new THREE.Vector3(a.x, 0.9, a.z);
    if (a.pettedToday) { g.effects.floatText(p, `${a.name} 今天已经摸过了`, '#B8C0D8', 12); return false; }
    a.pettedToday = true;
    a.friendship = Math.min(1000, a.friendship + 8);
    a.mood = Math.min(255, a.mood + 32);
    g.effects.burst(p, ['#FF8AA8', '#FFC0D0', '#FF6A90'], 10, 1.5, -1.2); // 爱心粒子（上浮）
    g.effects.floatText(p, '♥ 好感 +8', '#FF8AA8', 14);                    // 表情气泡+好感数值
    g.effects.floatText(new THREE.Vector3(a.x, 1.4, a.z), '♪ 心情 +32', '#FFD98A', 12);
    g.audio.tone({ freq: 880, freq2: 1174, dur: 0.16, type: 'triangle', vol: 0.14 }); // 音符
    g.audio.tone({ freq: 1318, dur: 0.14, type: 'triangle', vol: 0.1, delay: 0.12 });
    this.voice(a.type);
    return true;
  }
  // 喂食：手持 hay 点建筑 → 填满食槽；食槽已满 → 存入干草仓库
  feedBuilding(uid) {
    const g = this.game, b = this.bById(uid);
    if (!b) return false;
    const def = buildingDef(b.id);
    const have = countItem(g.state, 'hay');
    if (have <= 0) return this.denyAt(b.x, b.z, '没有干草（玛妮处有售）');
    const need = def.capacity - (b.hay || 0);
    const p = new THREE.Vector3(b.x, 1.2, b.z);
    if (need <= 0) { // 食槽满 → 全部转仓库（日结自动消耗）
      removeItem(g.state, 'hay', have);
      this.A.hayStock += have;
      g.audio.sfx('plant');
      g.effects.floatText(p, `干草入库 +${have}（库存 ${this.A.hayStock}）`, '#E8D8A8', 13);
      return true;
    }
    const n = Math.min(need, have);
    removeItem(g.state, 'hay', n);
    b.hay += n;
    g.audio.sfx('eat');
    g.effects.burst(p, ['#E8D8A8', '#C9B878'], 8, 1.6);
    g.effects.floatText(p, `食槽 +${n} 干草（${b.hay}/${def.capacity}）`, '#E8D8A8', 13);
    this.syncBuilding(b);
    return true;
  }
  // 舍门开关（夜不关门 → 全舍心情 -10；门关时动物无法出入）
  toggleDoor(uid) {
    const g = this.game, b = this.bById(uid);
    if (!b) return false;
    b.doorOpen = !b.doorOpen;
    this.syncBuilding(b);
    g.audio.sfx(b.doorOpen ? 'open' : 'close');
    const d = this.doorPos(b);
    g.effects.floatText(new THREE.Vector3(d.x, 1.2, d.z), b.doorOpen ? '打开了舍门' : '关上了舍门', '#E8DCC8', 12);
    return true;
  }
  // 拾取地面产物
  pickupProduct(uid) {
    const g = this.game, pr = this.A.products.find((p) => p.uid === uid);
    if (!pr) return false;
    const leftover = addItem(g.state, pr.item, 1, pr.quality);
    if (leftover > 0) { g.effects.floatText(new THREE.Vector3(pr.x, 1, pr.z), '背包已满！', '#E84A4A', 13); return false; }
    this.A.products = this.A.products.filter((p) => p.uid !== uid);
    this.removeProductMesh(uid);
    const it = getItem(pr.item);
    g.audio.sfx('pickup');
    g.effects.burst(new THREE.Vector3(pr.x, 0.5, pr.z), [QUALITY_GLOW[pr.quality], '#FFFFFF'], 8, 1.6);
    g.effects.floatText(new THREE.Vector3(pr.x, 0.9, pr.z), `${it.name}${pr.quality ? ' ★' + pr.quality : ''}`, pr.quality >= 2 ? '#FFD98A' : '#FFFFFF', 13);
    addXP(g.state, 'farming', 5);
    return true;
  }
  pickupNearest(x, z, r = 1.6) {
    const pr = this.A.products.find((p) => Math.hypot(p.x - x, p.z - z) < r);
    return pr ? this.pickupProduct(pr.uid) : false;
  }

  // ==================== 加工机器 ====================
  placeMachine(x, z) {
    const g = this.game, held = heldItem(g.state);
    if (!held || getItem(held.id).type !== 'machine' || !machineDef(held.id)) return false;
    const fx = Math.floor(x), fz = Math.floor(z);
    if (farmGroundType(fx, fz) !== 'grass') return this.denyAt(x, z, '这里不能放');
    if (g.state.farm.buildings.some((b) => { const s = BSIZE[b.id] || BSIZE.coop; return Math.abs(x - b.x) < s[0] / 2 + 1 && Math.abs(z - b.z) < s[1] / 2 + 1; })) return this.denyAt(x, z, '离建筑太近了');
    if (this.A.machines.some((m) => Math.hypot(m.x - x, m.z - z) < 1)) return this.denyAt(x, z, '这里太挤了');
    removeItem(g.state, held.id, 1);
    const m = { uid: this.A.nextUid++, id: held.id, x, z, input: null, out: null, outQuality: 0, remaining: 0, done: false };
    this.A.machines.push(m);
    this.spawnMachineMesh(m);
    g.audio.sfx('plant');
    g.effects.burst(new THREE.Vector3(x, 0.5, z), ['#E8C469', '#FFFFFF'], 8, 1.6);
    g.effects.floatText(new THREE.Vector3(x, 1, z), getItem(m.id).name, '#E8C469', 12);
    return true;
  }
  loadMachine(uid) {
    const g = this.game, m = this.mById(uid);
    if (!m) return false;
    const def = machineDef(m.id), held = heldItem(g.state);
    if (m.done) return this.collectMachine(uid);
    if (m.input) { g.effects.floatText(new THREE.Vector3(m.x, 1, m.z), `加工中…还需约 ${Math.ceil(m.remaining / 60)} 小时`, '#B8C0D8', 12); return false; }
    const recipe = held && def.inputs[held.id];
    if (!recipe) return this.denyAt(m.x, m.z, '手持原料点入（蛋/奶）');
    removeItem(g.state, held.id, 1);
    m.input = held.id; m.out = recipe.out; m.outQuality = recipe.quality || 0; m.remaining = def.minutes;
    g.audio.sfx('plant');
    g.effects.burst(new THREE.Vector3(m.x, 0.7, m.z), ['#FFF8DC', '#E8C469'], 8, 1.4);
    g.effects.floatText(new THREE.Vector3(m.x, 1.1, m.z), `开始加工：${getItem(m.out).name}`, '#FFF8DC', 12);
    this.syncMachine(m);
    return true;
  }
  collectMachine(uid) {
    const g = this.game, m = this.mById(uid);
    if (!m || !m.done) return false;
    const leftover = addItem(g.state, m.out, 1, m.outQuality);
    if (leftover > 0) { g.effects.floatText(new THREE.Vector3(m.x, 1, m.z), '背包已满！', '#E84A4A', 13); return false; }
    const it = getItem(m.out);
    g.audio.sfx('harvest');
    g.effects.burst(new THREE.Vector3(m.x, 0.8, m.z), ['#FFD98A', '#FFFFFF'], 10, 1.8);
    g.effects.floatText(new THREE.Vector3(m.x, 1.1, m.z), `${it.name}${m.outQuality ? ' ★' + m.outQuality : ''}`, '#FFD98A', 13);
    addXP(g.state, 'farming', 5);
    m.input = null; m.out = null; m.outQuality = 0; m.remaining = 0; m.done = false;
    this.syncMachine(m);
    return true;
  }

  // ==================== 点击路由（主循环/QA 调用） ====================
  interactAt(x, z) {
    const g = this.game, held = heldItem(g.state);
    const pp = g.player?.pos;
    const near = (px, pz, r) => !pp || Math.hypot(pp.x - px, pp.z - pz) <= r;
    // 1) 地面发光产物
    const pr = this.A.products.find((p) => Math.hypot(p.x - x, p.z - z) < 1.3);
    if (pr && near(pr.x, pr.z, 3.5)) return this.pickupProduct(pr.uid);
    // 2) 加工机器（投入/收取）
    const m = this.A.machines.find((m) => Math.hypot(m.x - x, m.z - z) < 1.4);
    if (m && near(m.x, m.z, 3.5)) return this.loadMachine(m.uid);
    // 3) 动物 → 抚摸
    let best = null, bd = 1.4;
    for (const a of this.A.list) { if (a.inside) continue; const d = Math.hypot(a.x - x, a.z - z); if (d < bd) { bd = d; best = a; } }
    if (best && near(best.x, best.z, 3.5)) return this.pet(best.id);
    // 4) 建筑：手持干草→喂食槽；否则→开关门
    const b = g.state.farm.buildings.find((b) => { const s = BSIZE[b.id] || BSIZE.coop; const d = this.doorPos(b); return Math.hypot(d.x - x, d.z - z) < 1.6 || (Math.abs(x - b.x) < s[0] / 2 + 0.8 && Math.abs(z - b.z) < s[1] / 2 + 0.8); });
    if (b && near(b.x, b.z, 5)) return held?.id === 'hay' ? this.feedBuilding(b.uid) : this.toggleDoor(b.uid);
    // 5) 手持加工机器 → 放置
    if (held && getItem(held.id).type === 'machine' && machineDef(held.id) && near(x, z, 4.5)) return this.placeMachine(x, z);
    return false;
  }
  handleInput() {
    const g = this.game;
    if (g.daycycle?.sleeping || g.player?.frozen) return;
    if (g.state.player.scene !== 'farm') return;
    if (!(g.input.mouse.clicked || g.input.hit('use'))) return;
    if (g.input.mouse.clicked) {
      this.ray.setFromCamera({ x: g.input.mouse.nx, y: g.input.mouse.ny }, g.engine.camera);
      const hit = new THREE.Vector3();
      if (this.ray.ray.intersectPlane(this.plane, hit)) this.interactAt(hit.x, hit.z);
    } else {
      const p = g.player.pos, f = g.player.facing;
      this.interactAt(p.x + Math.sin(f) * 1.1, p.z + Math.cos(f) * 1.1);
    }
  }

  // ==================== 日结算 ====================
  onDayStart() {
    const g = this.game, A = this.A;
    const absDay = g.clock.absoluteDay;
    for (const a of A.list) {
      const def = animalDef(a.type), b = this.buildingOf(a), rt = this.aRt.get(a.id);
      // 夜里自己回舍（门开着）
      if (!a.inside && b?.doorOpen) { a.inside = true; a.outside = false; this.moveMeshHome(a, b); }
      const fresh = a.boughtAt === absDay - 1; // 新购当天不进食不生长、无断粮惩罚，成年照常产出
      if (fresh) {
        if (a.age >= def.adultDays) this.rollProduce(a, def, b);
        a.fedToday = false; a.pettedToday = false;
        if (rt) rt.trufflesPending = 0;
        continue;
      }
      // 1) 昨日照料结算
      const fed = a.fedToday, petted = a.pettedToday;
      if (!fed) { a.mood = Math.max(0, a.mood - 100); a.friendship = Math.max(0, a.friendship - 20); }
      if (!petted) { a.friendship = Math.max(0, a.friendship - 10); a.mood = Math.max(0, a.mood - 20); }
      if (!a.inside) { a.mood = Math.floor(a.mood / 2); a.friendship = Math.max(0, a.friendship - 20); } // 露宿
      if (b && b.doorOpen) a.mood = Math.max(0, a.mood - 10);                                          // 夜不关门
      // 2) 产出（成年 + 昨日进食 + 心情门槛）
      const adult = a.age >= def.adultDays;
      if (fed && adult) this.rollProduce(a, def, b);
      // 3) 成长与重置
      a.age++;
      a.fedToday = false; a.pettedToday = false;
    }
  }
  rollProduce(a, def, b) {
    const g = this.game;
    const moodGate = a.mood >= 70 ? 1 : a.mood / 70; // 心情 <70 按比例概率产出
    const base = def.produce.find((p) => !p.large && !p.rare && !p.forage);
    if (base) {
      a.produceTimer++;
      if (a.produceTimer >= base.days && Math.random() < moodGate) {
        a.produceTimer = 0; // 未过门槛的天数不计冷却（timer 保留）
        let item = base.item;
        const rare = def.produce.find((p) => p.rare), large = def.produce.find((p) => p.large);
        if (rare && a.friendship >= (rare.requireFriendship || 0) && this.rollRare(a)) item = rare.item;
        else if (large && a.friendship >= (large.requireFriendship || 0) && this.rollLarge(a)) item = large.item;
        this.spawnProduct(item, this.rollQuality(a), b);
      }
    }
    // 猪：白天放养刨松露（冬季不出门 → 不产）
    const forage = def.produce.find((p) => p.forage);
    if (forage && this.canOutToday()) {
      const rt = this.aRt.get(a.id);
      if (rt) {
        let n = Math.random() < Math.min(0.95, 0.6 + a.friendship / 2000) ? 1 : 0;
        if (n && a.friendship >= 600 && Math.random() < 0.4) n++;
        rt.trufflesPending = n;
      }
    }
  }
  // 品质（SDV：得分=好感/1000 − (1−心情/225)；>0.95 才可能铱星）
  rollQuality(a) {
    const score = a.friendship / 1000 - (1 - a.mood / 225);
    const r = Math.random();
    if (score > 0.95 && r < score / 2) return 3;
    if (r < score / 2) return 2;
    if (r < score) return 1;
    return 0;
  }
  moodMod(a) { return a.mood > 200 ? a.mood * 1.5 : a.mood <= 100 ? a.mood - 100 : a.mood; }
  rollLarge(a) { return Math.random() < (a.friendship + this.moodMod(a)) / 1200; }        // 大蛋/大奶
  rollRare(a) { return Math.random() < (a.friendship + this.moodMod(a)) / 4750 + (this.game.state.player.luck || 0); } // 鸭毛/兔脚
  spawnProduct(item, quality, b) {
    const g = this.game;
    const d = b ? this.doorPos(b) : { x: 24, z: 26 };
    const pr = { uid: this.A.nextUid++, item, quality, x: d.x + (Math.random() - 0.5) * 1.6, z: d.z + Math.random() * 0.6 };
    this.A.products.push(pr);
    this.spawnProductMesh(pr);
    return pr;
  }
  digTruffle(a, rt) {
    const g = this.game;
    rt.trufflesPending--;
    rt.digT = 15 + Math.random() * 25;
    const pr = { uid: this.A.nextUid++, item: 'truffle', quality: this.rollQuality(a), x: a.x + (Math.random() - 0.5) * 1.2, z: a.z + (Math.random() - 0.5) * 1.2 };
    this.A.products.push(pr);
    this.spawnProductMesh(pr);
    g.audio.noise({ dur: 0.18, freq: 500, freq2: 200, vol: 0.16 });
    g.effects.burst(new THREE.Vector3(pr.x, 0.2, pr.z), ['#6B4E2E', '#5A4026', '#8B6F47'], 12, 2.2); // 土坑粒子
    g.effects.floatText(new THREE.Vector3(pr.x, 0.8, pr.z), `${a.name} 刨出了松露！`, '#FFD98A', 13);
  }

  // ==================== 时钟 ====================
  onMinute() {
    const g = this.game, minute = g.clock.minute;
    // 机器计时
    for (const m of this.A.machines) {
      if (m.input && !m.done && m.remaining > 0) {
        m.remaining--;
        if (m.remaining <= 0) {
          m.done = true;
          this.syncMachine(m);
          g.audio.sfx('harvest');
          g.effects.floatText(new THREE.Vector3(m.x, 1.1, m.z), `${getItem(m.out).name} 完成了！`, '#FFD98A', 13);
        }
      }
    }
    // 晨间喂食（舍内动物：食槽优先，仓库自动补给；会出门的动物吃鲜草）
    if (minute >= 360 && minute < RETURN_MINUTE) {
      const canOut = this.canOutToday();
      for (const a of this.A.list) {
        if (a.fedToday || !a.inside) continue;
        const b = this.buildingOf(a);
        if (!b || (canOut && b.doorOpen)) continue;
        if ((b.hay || 0) > 0) { b.hay--; this.feedOne(a, b); }
        else if (this.A.hayStock > 0) { this.A.hayStock--; this.feedOne(a, b); }
      }
    }
  }
  feedOne(a, b) {
    a.fedToday = true;
    a.mood = Math.min(255, a.mood + 8);
    this.syncBuilding(b);
  }
  onWeather(w) {
    if (['rain', 'storm', 'snow'].includes(w)) { // 雨天收回
      for (const [, rt] of this.aRt) rt.returning = true;
    }
  }

  // ==================== 每帧 ====================
  update(dt, t) {
    const g = this.game;
    if (!g.state?.animals) return;
    this.handleInput();
    const minute = g.clock.minute, canOut = this.canOutToday();
    for (const a of this.A.list) this.updateAnimal(a, dt, t, minute, canOut);
    // 产物浮动+面向镜头+光晕脉动
    for (const pr of this.A.products) {
      const m = this.pMeshes.get(pr.uid);
      if (!m) continue;
      m.group.position.y = 0.22 + Math.sin(t * 3 + pr.uid) * 0.05;
      m.glowMat.opacity = 0.35 + Math.sin(t * 4 + pr.uid) * 0.15;
      const cam = g.engine.camera.getWorldPosition(new THREE.Vector3());
      m.group.children[0].rotation.y = Math.atan2(cam.x - pr.x, cam.z - pr.z);
    }
    // 机器动画（工作摇晃/完成冒泡）
    for (const m of this.A.machines) {
      const mm = this.mMeshes.get(m.uid);
      if (!mm) continue;
      if (m.done) {
        mm.bubbleT -= dt;
        if (mm.bubbleT <= 0) {
          mm.bubbleT = 0.9 + Math.random() * 0.6;
          g.effects.burst(new THREE.Vector3(m.x, 0.9, m.z), ['#FFF8DC', '#FFD98A'], 3, 0.7, -0.8, 0.9);
        }
        mm.lampMat.emissiveIntensity = 1.6 + Math.sin(t * 6) * 0.6;
      } else if (m.input) {
        mm.group.rotation.y = Math.sin(t * 2.5) * 0.06;
        mm.lampMat.emissiveIntensity = 0.9 + Math.sin(t * 3) * 0.3;
      }
    }
    // 舍门开合动画
    for (const [, bm] of this.bMeshes) {
      bm.door.rotation.y += (bm.doorRot - bm.door.rotation.y) * Math.min(1, dt * 6);
    }
  }
  updateAnimal(a, dt, t, minute, canOut) {
    const g = this.game, rt = this.aRt.get(a.id);
    if (!rt) return;
    const b = this.buildingOf(a), sprite = rt.sprite, mesh = sprite.group;
    // 早晨出舍（天气好 + 门开 + 个体出门延迟）
    if (a.inside && canOut && b?.doorOpen && minute >= 360 + rt.outDelay && minute < RETURN_MINUTE) {
      a.inside = false; a.outside = true;
      const d = this.doorPos(b);
      a.x = d.x; a.z = d.z;
      a.fedToday = true; a.mood = 255; // 吃鲜草直接置满（SDV）
      a.friendship = Math.min(1000, a.friendship + 8);
      rt.target = null; rt.grazeT = 0;
    }
    // 已在户外（如昨夜露宿）白天照常啃草
    if (a.outside && canOut && !a.fedToday && minute >= 360 && minute < RETURN_MINUTE) { a.fedToday = true; a.mood = 255; }
    // 17:00 回舍
    if (a.outside && !rt.returning && minute >= RETURN_MINUTE) rt.returning = true;
    if (a.inside) { mesh.visible = false; return; }
    mesh.visible = true;
    mesh.position.set(a.x, 0, a.z);
    let moving = false, grazing = false;
    if (rt.returning && b) {
      const d = this.doorPos(b);
      const dx = d.x - a.x, dz = d.z - a.z, dist = Math.hypot(dx, dz);
      if (dist < 0.35) {
        rt.returning = false;
        if (b.doorOpen) { a.inside = true; a.outside = false; mesh.visible = false; return; }
        rt.target = null; // 被关门外：原地过夜
      } else {
        a.x += (dx / dist) * 2.4 * dt; a.z += (dz / dist) * 2.4 * dt;
        rt.facing = Math.atan2(dx, dz); moving = true;
      }
    } else {
      rt.thinkT -= dt;
      if (rt.grazeT > 0) { rt.grazeT -= dt; grazing = true; }
      else if (rt.target) {
        const dx = rt.target.x - a.x, dz = rt.target.z - a.z, dist = Math.hypot(dx, dz);
        if (dist < 0.25) rt.target = null;
        else {
          const sp = animalDef(a.type).size === 'small' ? 1.4 : 1.1;
          a.x += (dx / dist) * sp * dt; a.z += (dz / dist) * sp * dt;
          rt.facing = Math.atan2(dx, dz); moving = true;
        }
      }
      if (rt.thinkT <= 0) {
        const r = Math.random();
        if (r < 0.32) { rt.grazeT = 2 + Math.random() * 1.5; rt.thinkT = rt.grazeT; }   // 吃草
        else if (r < 0.85) { rt.target = this.wanderTarget(); rt.thinkT = 4 + Math.random() * 4; } // 漫步
        else { rt.target = null; rt.thinkT = 1.5 + Math.random() * 2; }                 // 发呆
      }
    }
    sprite.update(dt, moving, rt.facing ?? Math.PI, grazing);
    sprite.faceCamera(g.engine.camera);
    // 偶尔叫声
    rt.voiceT -= dt;
    if (rt.voiceT <= 0) {
      rt.voiceT = 8 + Math.random() * 14;
      const pp = g.player?.pos;
      if (!pp || Math.hypot(pp.x - a.x, pp.z - a.z) < 20) this.voice(a.type);
    }
    // 猪刨松露
    if (a.type === 'pig' && rt.trufflesPending > 0 && !rt.returning && !grazing) {
      rt.digT -= dt;
      if (rt.digT <= 0) this.digTruffle(a, rt);
    }
  }
  wanderTarget() {
    for (let i = 0; i < 8; i++) {
      const x = PASTURE.x0 + Math.random() * (PASTURE.x1 - PASTURE.x0);
      const z = PASTURE.z0 + Math.random() * (PASTURE.z1 - PASTURE.z0);
      if (farmGroundType(Math.floor(x), Math.floor(z)) !== 'grass') continue;
      if (this.game.state.farm.buildings.some((b) => { const s = BSIZE[b.id] || BSIZE.coop; return Math.abs(x - b.x) < s[0] / 2 + 0.4 && Math.abs(z - b.z) < s[1] / 2 + 0.4; })) continue;
      return { x, z };
    }
    return null;
  }

  // ==================== 叫声（audio.tone 合成） ====================
  voice(type) {
    const au = this.game.audio;
    if (!au.ctx) return;
    if (type === 'chicken') { au.tone({ freq: 980, freq2: 700, dur: 0.07, type: 'square', vol: 0.08 }); au.tone({ freq: 1100, freq2: 800, dur: 0.06, type: 'square', vol: 0.07, delay: 0.09 }); }
    else if (type === 'duck') au.tone({ freq: 420, freq2: 300, dur: 0.12, type: 'sawtooth', vol: 0.09 });
    else if (type === 'cow') au.tone({ freq: 170, freq2: 120, dur: 0.45, type: 'sine', vol: 0.12 });
    else if (type === 'goat') { au.tone({ freq: 520, freq2: 470, dur: 0.1, type: 'triangle', vol: 0.09 }); au.tone({ freq: 540, freq2: 480, dur: 0.09, type: 'triangle', vol: 0.08, delay: 0.12 }); }
    else if (type === 'sheep') au.tone({ freq: 390, freq2: 350, dur: 0.22, type: 'triangle', vol: 0.09 });
    else if (type === 'pig') { au.noise({ dur: 0.1, freq: 700, freq2: 250, vol: 0.1 }); au.tone({ freq: 320, freq2: 220, dur: 0.09, type: 'square', vol: 0.06, delay: 0.1 }); }
    else if (type === 'rabbit') au.tone({ freq: 1250, freq2: 1400, dur: 0.05, type: 'sine', vol: 0.06 });
  }

  // ==================== 可视 ====================
  rebuildAll() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.aRt.clear(); this.bMeshes.clear(); this.mMeshes.clear(); this.pMeshes.clear();
    for (const b of this.game.state.farm.buildings) this.spawnBuildingMesh(b);
    for (const a of this.A.list) this.spawnAnimalMesh(a);
    for (const m of this.A.machines) this.spawnMachineMesh(m);
    for (const p of this.A.products) this.spawnProductMesh(p);
  }
  spawnAnimalMesh(a) {
    const def = animalDef(a.type);
    const sprite = makeAnimalSprite({ type: a.type, color: def.color, size: def.size });
    sprite.group.position.set(a.x, 0, a.z);
    sprite.group.visible = !a.inside;
    this.group.add(sprite.group);
    this.aRt.set(a.id, {
      sprite, target: null, grazeT: 0, thinkT: Math.random() * 3,
      voiceT: 3 + Math.random() * 8, returning: false,
      outDelay: Math.floor(Math.random() * 40), digT: 10 + Math.random() * 10,
      trufflesPending: 0, facing: Math.PI,
    });
  }
  removeAnimalMesh(a) {
    const rt = this.aRt.get(a.id);
    if (rt) { this.group.remove(rt.sprite.group); this.aRt.delete(a.id); }
  }
  moveMeshHome(a, b) {
    const d = this.doorPos(b);
    a.x = d.x; a.z = d.z;
    const rt = this.aRt.get(a.id);
    if (rt) { rt.returning = false; rt.sprite.group.visible = false; rt.sprite.group.position.set(a.x, 0, a.z); }
  }
  spawnBuildingMesh(b) {
    const made = makeBuildingMesh(b.id);
    made.group.position.set(b.x, 0, b.z);
    this.group.add(made.group);
    this.bMeshes.set(b.uid, { ...made, doorRot: 0 });
    this.syncBuilding(b);
  }
  syncBuilding(b) {
    const bm = this.bMeshes.get(b.uid);
    if (!bm) return;
    bm.hayMesh.visible = (b.hay || 0) > 0;
    bm.doorRot = b.doorOpen ? -1.35 : 0;
    if (Math.abs(bm.door.rotation.y - bm.doorRot) > 1) bm.door.rotation.y = bm.doorRot; // 初始化直接到位
  }
  spawnMachineMesh(m) {
    const g = new THREE.Group();
    const isMayo = m.id === 'mayonnaise_machine';
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.4, 0.52),
      new THREE.MeshLambertMaterial({ color: isMayo ? '#9A6B3F' : '#7A5230', flatShading: true })
    );
    base.position.y = 0.2;
    const vat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.2, 0.3, 7),
      new THREE.MeshLambertMaterial({ color: isMayo ? '#C0C0C8' : '#8D8D96', flatShading: true })
    );
    vat.position.y = 0.55;
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.05, 7),
      new THREE.MeshLambertMaterial({ color: isMayo ? '#FFF8DC' : '#E8DCC8', flatShading: true })
    );
    lid.position.y = 0.72;
    const lampMat = new THREE.MeshLambertMaterial({ color: '#666670', emissive: new THREE.Color('#FFD98A'), emissiveIntensity: 0 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), lampMat);
    lamp.position.set(0.2, 0.42, 0.2);
    g.add(base, vat, lid, lamp);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.position.set(m.x, 0, m.z);
    this.group.add(g);
    this.mMeshes.set(m.uid, { group: g, lampMat, bubbleT: 0 });
    this.syncMachine(m);
  }
  syncMachine(m) {
    const mm = this.mMeshes.get(m.uid);
    if (!mm) return;
    mm.lampMat.emissive.set(m.done ? '#FFD98A' : m.input ? '#8AE84A' : '#000000');
    mm.lampMat.emissiveIntensity = m.done ? 1.8 : m.input ? 1 : 0;
    if (!m.input && !m.done) mm.group.rotation.y = 0;
  }
  spawnProductMesh(pr) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ map: productTexture(pr.item), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, emissive: new THREE.Color('#FFF8DC'), emissiveIntensity: 0.25 });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), mat);
    plane.position.y = 0.1;
    const glowMat = new THREE.MeshBasicMaterial({ map: glowTexture(), color: QUALITY_GLOW[pr.quality] || '#FFF8DC', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), glowMat);
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.02;
    g.add(plane, glow);
    g.position.set(pr.x, 0.22, pr.z);
    this.group.add(g);
    this.pMeshes.set(pr.uid, { group: g, glowMat });
  }
  removeProductMesh(uid) {
    const m = this.pMeshes.get(uid);
    if (m) { this.group.remove(m.group); this.pMeshes.delete(uid); }
  }

  serialize() { this.ensureState(); } // state.animals + state.farm.buildings 均为纯数据，随主存档 JSON 序列化
  deserialize() { this.ensureState(); this.rebuildAll(); }
}

// ==================== 建筑低模（风格同 proto.js makeHouse） ====================
function makeBuildingMesh(id) {
  const barn = id.startsWith('barn'), big = id.endsWith('2');
  const [w, d] = BSIZE[id] || BSIZE.coop;
  const h = (barn ? 2.4 : 1.9) * (big ? 1.12 : 1);
  const g = new THREE.Group();
  const wallCol = barn ? '#B8543E' : '#C8A06A';
  const wallMat = new THREE.MeshLambertMaterial({ color: wallCol, flatShading: true });
  const trimMat = new THREE.MeshLambertMaterial({ color: '#F0EBE0', flatShading: true });
  const roofMat = new THREE.MeshLambertMaterial({ color: barn ? PAL.roofD : PAL.roof, flatShading: true });
  // 墙身
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  base.position.y = h / 2;
  g.add(base);
  // 大建筑：石基座
  if (big) {
    const found = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), new THREE.MeshLambertMaterial({ color: PAL.stoneD, flatShading: true }));
    found.position.y = 0.15;
    g.add(found);
  }
  // 双坡屋顶 + 山墙（同 makeHouse 模式）
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(w + 0.7, 0.14, d * 0.62), roofMat);
  roofL.position.set(0, h + 0.45, -d * 0.26); roofL.rotation.x = 0.55;
  const roofR = roofL.clone(); roofR.position.z = d * 0.26; roofR.rotation.x = -0.55;
  const tri = new THREE.Shape();
  tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, d * 0.36); tri.closePath();
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: w, bevelEnabled: false }), wallMat);
  gable.rotation.y = Math.PI / 2; gable.position.set(w / 2, h, d / 2);
  g.add(roofL, roofR, gable);
  // 白色包边（畜棚风）
  if (barn) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.12, d + 0.06), trimMat);
    trim.position.y = h - 0.06;
    g.add(trim);
  }
  // 门（铰链在左，开门旋转）
  const dw = barn ? 1.2 : 0.85, dh = barn ? 1.5 : 1.1;
  const door = new THREE.Group();
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.08), new THREE.MeshLambertMaterial({ color: '#5A4026', flatShading: true }));
  doorMesh.position.set(dw / 2, dh / 2, 0);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(dw * 0.9, 0.08, 0.1), trimMat);
  brace.position.set(dw / 2, dh * 0.7, 0);
  door.add(doorMesh, brace);
  door.position.set(-dw / 2, 0, d / 2 + 0.03);
  g.add(door);
  // 窗
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.08), new THREE.MeshLambertMaterial({ color: PAL.winDark, emissive: new THREE.Color(PAL.winLit), emissiveIntensity: 0.15 }));
  win.position.set(w * 0.28, h * 0.62, d / 2 + 0.03);
  g.add(win);
  // 食槽（建筑右前；hay>0 时显示干草面）
  const trough = new THREE.Group();
  const tBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.4), new THREE.MeshLambertMaterial({ color: PAL.wood, flatShading: true }));
  tBox.position.y = 0.11;
  const hayMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.32), new THREE.MeshLambertMaterial({ color: '#E8D8A8', flatShading: true }));
  hayMesh.position.y = 0.24;
  trough.add(tBox, hayMesh);
  trough.position.set(w / 2 + 0.8, 0, d / 2 - 0.4);
  g.add(trough);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { group: g, door, hayMesh };
}

// ==================== 产物贴图 ====================
const prodTexCache = new Map();
function productTexture(item) {
  if (prodTexCache.has(item)) return prodTexCache.get(item);
  const t = makeTexture(16, 16, (g) => {
    g.clearRect(0, 0, 16, 16);
    if (item.startsWith('egg') || item === 'duck_egg') { // 蛋
      const big = item === 'egg_large';
      g.fillStyle = item === 'duck_egg' ? '#E8E8D0' : '#FFF8EC';
      g.beginPath(); g.ellipse(8, 9, big ? 5 : 4, big ? 6 : 5, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(200,180,140,0.8)'; g.fillRect(6, 11, 2, 1);
      g.fillStyle = '#FFFFFF'; g.fillRect(6, 5, 2, 2);
    } else if (item.includes('milk')) { // 奶瓶
      const big = item.includes('large');
      g.fillStyle = '#F4F8FF';
      g.fillRect(big ? 5 : 6, 6, big ? 6 : 4, big ? 8 : 7);
      g.fillRect(7, 3, 2, 3);
      g.fillStyle = '#5A8AC8'; g.fillRect(6, 2, 4, 2);
      g.fillStyle = '#D8E8FF'; g.fillRect(big ? 6 : 7, 8, 2, 3);
    } else if (item === 'wool') { // 羊毛团
      g.fillStyle = '#F0EBE0';
      g.beginPath(); g.arc(6, 9, 3.4, 0, 7); g.arc(10, 9, 3.4, 0, 7); g.arc(8, 6.5, 3, 0, 7); g.fill();
      g.fillStyle = '#D8D0C0'; g.fillRect(5, 10, 2, 1); g.fillRect(9, 8, 2, 1);
    } else if (item === 'truffle') { // 松露
      g.fillStyle = '#4A3626';
      g.beginPath(); g.arc(8, 9, 5, 0, 7); g.fill();
      g.fillStyle = '#6B5238'; g.fillRect(5, 6, 2, 2); g.fillRect(10, 10, 2, 2); g.fillRect(8, 12, 1, 1);
    } else if (item === 'duck_feather') { // 羽毛
      g.fillStyle = '#F4F8FF';
      g.beginPath(); g.ellipse(8, 7, 2.6, 5.5, 0.5, 0, 7); g.fill();
      g.fillStyle = '#C8D8E8'; g.fillRect(8, 4, 1, 9);
      g.fillStyle = '#E8C469'; g.fillRect(8, 12, 1, 3);
    } else if (item === 'rabbit_foot') { // 兔脚
      g.fillStyle = '#C8B8A8';
      g.fillRect(6, 8, 5, 6); g.fillRect(7, 3, 1.6, 5); g.fillRect(9.5, 3, 1.6, 5);
      g.fillStyle = '#E88A9A'; g.fillRect(6, 12, 5, 2);
    } else { // 兜底
      g.fillStyle = '#FFF8DC'; g.beginPath(); g.arc(8, 8, 5, 0, 7); g.fill();
    }
  });
  prodTexCache.set(item, t);
  return t;
}
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  glowTex = makeTexture(32, 32, (g) => {
    const grad = g.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255,248,220,0.9)'); grad.addColorStop(1, 'rgba(255,248,220,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
  });
  return glowTex;
}
