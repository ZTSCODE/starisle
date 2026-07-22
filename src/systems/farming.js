// 农耕系统：耕地/浇水/播种/施肥/生长/收获/品质/洒水器/稻草人/乌鸦/换季枯萎
// 设计文档：docs/design/farming.md
import * as THREE from 'three';
import { CROPS, getItem, sellPrice } from '../data/items.js';
import { addItem, countItem, removeItem, useEnergy, addXP, skillLevel } from '../core/state.js';
import { makeTexture, PAL, shade, barkTex, metalTex, hayTex, woodTex, stoneTex } from '../render/textures.js';
import { dynamicBlocked, onRoad } from '../world/builder.js';
import { rng, hashStr } from '../core/rng.js';

export const FARM_W = 48, FARM_H = 48;
// 温室区域（农场东北，解锁后全年可种）
export const GREENHOUSE = { x0: 34, z0: 6, x1: 44, z1: 12 };
export function inGreenhouse(x, z) { return x >= GREENHOUSE.x0 && x <= GREENHOUSE.x1 && z >= GREENHOUSE.z0 && z <= GREENHOUSE.z1; }
// 逻辑地形（与 world/unified.js 一体化底图一致）
export function farmGroundType(x, z) {
  if (x < 0 || z < 0 || x >= FARM_W || z >= FARM_H) return 'blocked';
  if (x === 23 || x === 24) return 'path';
  if (z === 23 && x >= 8 && x <= 24) return 'path';
  const dx = (x + 0.5 - 33) / 4.4, dz = (z + 0.5 - 32) / 3.6;
  if (dx * dx + dz * dz < 1) return 'water';
  if (x >= 18 && x <= 24 && z >= 5 && z <= 10) return 'blocked'; // 农舍（与模型体积一致：6×5 底 + 门沿）
  if (z >= 39 && (x === 5 || x === 26)) return 'blocked';        // 栅栏角
  return 'grass';
}

const cropDef = (id) => CROPS.find((c) => c.id === id);
const FRUIT_COLORS = ['#E84A4A', '#F0A83C', '#E8E84A', '#8AE84A', '#4AC8E8', '#B84AE8', '#E84A8A', '#F0F0F0', '#4A5AE8', '#E87A3C'];
function cropColor(id) { return FRUIT_COLORS[hashStr(id) % FRUIT_COLORS.length]; }

// 作物阶段贴图（十字面片用）
const stageTexCache = new Map();
function cropStageTex(crop, stage, maxStage) {
  const key = crop.id + '_' + stage;
  if (stageTexCache.has(key)) return stageTexCache.get(key);
  const t = makeTexture(16, 24, (g) => {
    const fruit = cropColor(crop.id);
    const stem = '#3E8B3A', leaf = '#4AA84A', leafD = '#358A35';
    g.clearRect(0, 0, 16, 24);
    if (crop.vine) { // 藤架
      g.fillStyle = '#7A5230';
      g.fillRect(2, 0, 2, 24); g.fillRect(12, 0, 2, 24);
      for (let y = 2; y < 24; y += 5) g.fillRect(2, y, 12, 1);
    }
    if (stage === 0) { // 幼苗
      g.fillStyle = leaf; g.fillRect(6, 20, 2, 3); g.fillRect(9, 19, 2, 4);
      g.fillStyle = leafD; g.fillRect(7, 22, 3, 1);
    } else if (stage < maxStage) { // 生长期
      const h = 8 + stage * 3;
      g.fillStyle = stem; g.fillRect(7, 24 - h, 2, h);
      g.fillStyle = leaf;
      g.fillRect(4, 24 - h + 2, 3, 3); g.fillRect(9, 24 - h + 4, 3, 3); g.fillRect(5, 24 - h - 2, 6, 4);
      g.fillStyle = leafD; g.fillRect(4, 24 - h + 4, 2, 2); g.fillRect(10, 24 - h + 6, 2, 2);
      if (crop.vine) { g.fillStyle = leaf; g.fillRect(2, 6, 3, 3); g.fillRect(11, 10, 3, 3); g.fillRect(3, 14, 3, 3); }
    } else { // 成熟
      g.fillStyle = stem; g.fillRect(7, 6, 2, 18);
      g.fillStyle = leaf;
      g.fillRect(3, 8, 10, 8); g.fillRect(4, 16, 8, 6);
      g.fillStyle = leafD; g.fillRect(3, 13, 10, 2); g.fillRect(4, 20, 8, 2);
      g.fillStyle = fruit; // 果实
      const r = rng(hashStr(crop.id) );
      for (let i = 0; i < 5; i++) g.fillRect(4 + Math.floor(r() * 8), 8 + Math.floor(r() * 10), 2, 2);
      g.fillStyle = shade(fruit, 40);
      g.fillRect(5, 9, 1, 1); g.fillRect(9, 13, 1, 1);
      if (crop.vine) { g.fillStyle = fruit; for (let i = 0; i < 4; i++) g.fillRect(2 + (i % 2) * 10, 4 + i * 5, 2, 3); }
    }
  });
  stageTexCache.set(key, t);
  return t;
}
function witheredTex() {
  if (stageTexCache.has('withered')) return stageTexCache.get('withered');
  const t = makeTexture(16, 24, (g) => {
    g.clearRect(0, 0, 16, 24);
    g.fillStyle = '#8A7A4A'; g.fillRect(7, 8, 2, 16);
    g.fillStyle = '#9A8A5A'; g.fillRect(4, 10, 8, 5); g.fillRect(5, 16, 6, 4);
    g.fillStyle = '#7A6A3E'; g.fillRect(4, 13, 8, 2);
  });
  stageTexCache.set('withered', t);
  return t;
}
let tillTex = null, tillWetTex = null;
function tillTextures() {
  if (!tillTex) {
    const draw = (wet) => (g) => {
      const base = wet ? '#4E3822' : '#6B4E2E', dark = wet ? '#3A2A18' : '#5A4026', lite = wet ? '#5E4630' : '#7A5A38';
      g.fillStyle = base; g.fillRect(0, 0, 16, 16);
      for (let y = 1; y < 16; y += 4) { g.fillStyle = dark; g.fillRect(0, y, 16, 1); g.fillStyle = lite; g.fillRect(0, y + 1, 16, 1); }
    };
    tillTex = makeTexture(16, 16, draw(false));
    tillWetTex = makeTexture(16, 16, draw(true));
  }
  return { tillTex, tillWetTex };
}

export class Farming {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group();       // 农田可视层
    game.engine.scene.add(this.group);
    this.tileMeshes = new Map();          // key -> {soil, cropMesh, objMesh}
    this.matCache = new Map();
    this.highlight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, 0.98),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.35, depthWrite: false })
    );
    this.highlight.rotation.x = -Math.PI / 2; this.highlight.position.y = 0.03;
    this.highlight.visible = false;
    this.group.add(this.highlight);
    this.mouseTile = null;
    this.ray = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.sway = [];
    game.bus.on('day-start', () => this.onDayStart());
    game.bus.on('season-start', () => this.onSeasonStart());
    game.bus.on('weather-change', (w) => { if (w === 'rain' || w === 'storm') this.waterAll(true); });
  }
  key(x, z) { return x + ',' + z; }
  tile(x, z) { return this.game.state.farm.tiles[this.key(x, z)]; }
  ensureTile(x, z) {
    const k = this.key(x, z);
    if (!this.game.state.farm.tiles[k]) this.game.state.farm.tiles[k] = { tilled: false, watered: false, fert: null, crop: null };
    return this.game.state.farm.tiles[k];
  }

  // ---- 目标格 ----
  targetTile() {
    if (this.mouseTile) return this.mouseTile;
    const p = this.game.player.pos, f = this.game.player.facing;
    return { x: Math.floor(p.x + Math.sin(f) * 0.9), z: Math.floor(p.z + Math.cos(f) * 0.9) };
  }
  updateMouse(camera, input) {
    this.ray.setFromCamera({ x: input.mouse.nx, y: input.mouse.ny }, camera);
    const hit = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(this.plane, hit)) {
      const x = Math.floor(hit.x), z = Math.floor(hit.z);
      if (x >= 0 && z >= 0 && x < FARM_W && z < FARM_H) {
        this.mouseTile = { x, z };
        this.mousePoint = { x: hit.x, z: hit.z };
      } else { this.mouseTile = null; this.mousePoint = null; }
    } else { this.mouseTile = null; this.mousePoint = null; }
  }

  // ---- 动作（全部带六层反馈）----
  useHeld(target) {
    const g = this.game, held = g.state.player.inventory[g.state.player.toolbarSel];
    const { x, z } = target;
    const gt = farmGroundType(x, z);
    const id = held?.id || null;
    const type = id ? getItem(id).type : 'hand';
    // 成熟作物优先收获：手持任何物品（含工具）都能收（巨大作物/被吸收格除外）
    {
      const t = this.tile(x, z);
      if (t?.crop?.mature && !t.crop.withered && !t.crop.giant && !t.crop.absorbed) return this.harvest(x, z);
    }
    if (type === 'tool') {
      if (id === 'hoe') return this.till(x, z, gt);
      if (id === 'wateringcan') return this.water(x, z, gt);
      if (id === 'scythe') return this.scythe(x, z);
      if (id === 'pickaxe') return this.until(x, z);
      if (id === 'axe') {
        const t = this.tile(x, z);
        if (t?.crop?.giant) return this.giantHit(x, z);
        return this.chopObj(x, z);
      }
      return false;
    }
    if (type === 'seed') return this.plant(x, z, id, gt);
    if (type === 'fertilizer') return this.fertilize(x, z, id);
    if (type === 'sprinkler' || type === 'scarecrow') return this.placeObject(x, z, id, gt);
    if (id && getItem(id).placeable) return this.placeGeneric(x, z, id, gt);
    // 空手/其他：收获（优先鼠标真实落点就近判定）
    const p = this.mousePoint || { x: x + 0.5, z: z + 0.5 };
    return this.harvestAt(p.x, p.z);
  }

  till(x, z, gt) {
    const g = this.game;
    if (gt === 'water' || gt === 'blocked') return this.deny(x, z, gt === 'water' ? '不能锄水面' : '这里不能耕种');
    const t = this.ensureTile(x, z);
    if (t.tilled) return this.deny(x, z, '已经耕过了');
    if (this.objAt(x, z)) return this.deny(x, z, '有东西挡着');
    g.audio.sfx(gt === 'grass' ? 'hoe_grass' : 'hoe');
    useEnergy(g.state, this.toolCost('hoe'));
    g.effects.burst(new THREE.Vector3(x + 0.5, 0.2, z + 0.5), ['#6B4E2E', '#5A4026', '#8B6F47'], 10, 2.2);
    g.effects.floatText(new THREE.Vector3(x + 0.5, 1, z + 0.5), '-2 体力', '#8AE84A', 12);
    g.effects.shakeScreen(0.05);
    t.tilled = true; t.watered = false;
    g.state.player.stats.tilled++;
    g.bus.emit('tilled');
    this.syncTile(x, z);
    return true;
  }
  water(x, z, gt) {
    const g = this.game;
    // 水面补水
    if (gt === 'water') {
      g.state.player.canWater = 40;
      g.audio.sfx('splash'); g.audio.sfx('water');
      g.effects.burst(new THREE.Vector3(x + 0.5, 0.2, z + 0.5), ['#5FB4E8', '#FFFFFF'], 10, 2);
      g.effects.floatText(new THREE.Vector3(x + 0.5, 1, z + 0.5), '水壶已灌满', '#5FB4E8', 12);
      return true;
    }
    const t = this.tile(x, z);
    if (!t || !t.tilled) return this.deny(x, z, '先锄地再浇水');
    if (t.watered) return this.deny(x, z, '已经浇过了');
    if ((g.state.player.canWater ?? 40) <= 0) return this.deny(x, z, '水壶空了，去池塘灌水');
    g.state.player.canWater = (g.state.player.canWater ?? 40) - 1;
    useEnergy(g.state, this.toolCost('wateringcan'));
    t.watered = true;
    g.audio.sfx('water');
    g.bus.emit('watered');
    g.effects.burst(new THREE.Vector3(x + 0.5, 0.5, z + 0.5), ['#5FB4E8', '#9FD4F0', '#FFFFFF'], 12, 1.8, 5);
    g.effects.floatText(new THREE.Vector3(x + 0.5, 1, z + 0.5), '-2 体力', '#8AE84A', 12);
    this.syncTile(x, z);
    return true;
  }
  plant(x, z, seedId, gt) {
    const g = this.game, seed = getItem(seedId), crop = cropDef(seed.crop);
    const t = this.tile(x, z);
    if (!t || !t.tilled) return this.deny(x, z, '需要先耕地');
    if (t.crop) return this.deny(x, z, '这里已经种了');
    const season = g.clock.season;
    const gh = inGreenhouse(x, z) && g.state.farm.greenhouse;
    if (!gh && !crop.seasons.includes(season)) return this.deny(x, z, `「${crop.name}」不在本季生长`);
    if (!removeItem(g.state, seedId, 1)) return this.deny(x, z, '没有种子');
    const fert = getItem(t.fert || 'fert_basic');
    const speedMul = t.fert === 'gro_basic' ? 0.9 : t.fert === 'gro_quality' ? 0.75 : t.fert === 'gro_hyper' ? 0.67 : 1;
    t.crop = { id: crop.id, progress: 0, mature: false, withered: false, needDays: Math.max(1, Math.ceil(crop.days * speedMul)) };
    g.audio.sfx('plant');
    g.effects.burst(new THREE.Vector3(x + 0.5, 0.3, z + 0.5), ['#8AE84A', '#6B4E2E'], 6, 1.5);
    this.syncTile(x, z);
    return true;
  }
  fertilize(x, z, fertId) {
    const g = this.game, t = this.tile(x, z);
    if (!t || !t.tilled) return this.deny(x, z, '需要先耕地');
    if (t.crop && t.crop.progress > 0 && getItem(fertId).fert.startsWith('quality')) return this.deny(x, z, '品质肥料要在发芽前施');
    if (t.fert === fertId) return this.deny(x, z, '已经施过这种肥了');
    if (!removeItem(g.state, fertId, 1)) return false;
    t.fert = fertId;
    g.audio.sfx('plant');
    g.effects.floatText(new THREE.Vector3(x + 0.5, 1, z + 0.5), getItem(fertId).name, '#E8C469', 12);
    this.syncTile(x, z);
    return true;
  }
  // 按世界坐标就近收获（容差 1.6m，点作物视觉位置也能收）
  harvestAt(wx, wz) {
    const g = this.game;
    let best = null, bd = 1.6;
    for (const k of Object.keys(g.state.farm.tiles)) {
      const t = g.state.farm.tiles[k];
      if (!t.crop?.mature || t.crop.withered || t.crop.giant || t.crop.absorbed) continue;
      const [x, z] = k.split(',').map(Number);
      const d = Math.hypot(x + 0.5 - wx, z + 0.5 - wz);
      if (d < bd) { bd = d; best = [x, z]; }
    }
    if (best) return this.harvest(best[0], best[1]);
    // 空手点到无作物处：无反馈（保持安静）
    return false;
  }
  harvest(x, z) {
    const g = this.game;
    // 巨大作物直达格拦截（必须用斧头）
    {
      const dt = this.tile(x, z);
      if (dt?.crop?.giant) return this.deny(x, z, '巨大作物需要用斧头砍收');
      if (dt?.crop?.absorbed) return this.deny(x, z, '巨大作物：砍中间那颗');
    }
    // 优先本格；鼠标落点偏移时容差 1 格邻域（点击作物视觉位置也能收获）
    let target = [x, z];
    let t = this.tile(x, z);
    if (!t?.crop?.mature || t.crop.withered || t.crop.giant || t.crop.absorbed) {
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dz) continue;
        const nt = this.tile(x + dx, z + dz);
        if (nt?.crop?.mature && !nt.crop.withered && !nt.crop.giant && !nt.crop.absorbed) { target = [x + dx, z + dz]; t = nt; break; }
      }
    }
    [x, z] = target;
    if (!t || !t.crop || !t.crop.mature || t.crop.withered) {
      if (t?.crop?.withered) return this.deny(x, z, '枯死了，用镰刀清除');
      return false;
    }
    const crop = cropDef(t.crop.id);
    const quality = this.rollQuality(t.fert);
    const count = (crop.multi || 1) + (crop.extra && Math.random() < crop.extra ? 1 : 0);
    const leftover = addItem(g.state, crop.id, count, quality);
    if (crop.dropSeed && Math.random() < 0.5) addItem(g.state, crop.id + '_seeds', 1, 0);
    g.audio.sfx('harvest');
    g.effects.burst(new THREE.Vector3(x + 0.5, 0.6, z + 0.5), [cropColor(crop.id), '#FFFFFF', '#8AE84A'], 12, 2.2);
    g.effects.floatText(new THREE.Vector3(x + 0.5, 1.2, z + 0.5), `${crop.name} ×${count}${quality ? ' ★' + quality : ''}`, quality >= 2 ? '#FFD98A' : '#FFFFFF', 13);
    if (leftover > 0) g.effects.floatText(new THREE.Vector3(x + 0.5, 1.6, z + 0.5), '背包已满！', '#E84A4A', 13);
    const xp = Math.max(1, Math.round(crop.price / 10)) + 2;
    addXP(g.state, 'farming', xp);
    g.state.player.stats.harvested += count;
    g.bus.emit('crop-harvested', { id: crop.id, quality, count });
    if (crop.regrow > 0) {
      t.crop.progress = t.crop.needDays - crop.regrow;
      t.crop.mature = false;
    } else {
      t.crop = null;
    }
    this.syncTile(x, z);
    return true;
  }
  scythe(x, z) {
    const g = this.game, t = this.tile(x, z);
    if (!t || !t.crop || !t.crop.withered) return false;
    t.crop = null;
    g.audio.sfx('scythe');
    g.effects.burst(new THREE.Vector3(x + 0.5, 0.4, z + 0.5), ['#9A8A5A', '#8A7A4A'], 8, 2);
    addItem(g.state, 'fiber', 1, 0);
    this.syncTile(x, z);
    return true;
  }
  // 巨大作物：斧头 3 击砍收（每击裂纹+屏震），崩解出 15–21 个果实
  giantHit(x, z) {
    const g = this.game, t = this.tile(x, z);
    if (!t?.crop?.giant) return false;
    t.crop.hits = (t.crop.hits || 0) + 1;
    useEnergy(g.state, this.toolCost('axe'));
    g.audio.sfx('chop');
    g.effects.shakeScreen(0.06);
    g.effects.burst(new THREE.Vector3(x + 0.5, 1.4, z + 0.5), ['#8AE84A', '#6B4E2E'], 8, 2);
    if (t.crop.hits < 3) { this.syncTile(x, z); return true; }
    const def = cropDef(t.crop.id);
    const count = 15 + Math.floor(Math.random() * 7);
    const quality = this.rollQuality(t.fert);
    addItem(g.state, def.id, count, quality);
    addXP(g.state, 'farming', Math.max(1, Math.round(def.price / 10)) + 8);
    g.state.player.stats.harvested += count;
    g.bus.emit('crop-harvested', { id: def.id, quality, count });
    g.audio.sfx('harvest'); g.audio.sfx('levelup');
    g.effects.burst(new THREE.Vector3(x + 0.5, 1.6, z + 0.5), [cropColor(def.id), '#FFD98A', '#FFFFFF'], 26, 3.6);
    g.effects.floatText(new THREE.Vector3(x + 0.5, 2.2, z + 0.5), `巨大${def.name} ×${count}！`, '#FFD98A', 15);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const tt = this.tile(x + dx, z + dz);
      if (tt?.crop && (tt.crop.giant || tt.crop.absorbed)) { tt.crop = null; this.syncTile(x + dx, z + dz); }
    }
    return true;
  }
  // 夜间结算：3×3 同种成熟可巨大化作物有 1% 概率融合为巨大作物
  giantEvent() {
    const g = this.game;
    for (const k of Object.keys(g.state.farm.tiles)) {
      const t = g.state.farm.tiles[k];
      if (!t.crop?.mature || t.crop.withered || t.crop.giant || t.crop.absorbed) continue;
      const def = cropDef(t.crop.id);
      if (!def.giant) continue;
      const [x0, z0] = k.split(',').map(Number);
      if (inGreenhouse(x0, z0)) continue;
      // (x0,z0) 作为左上角扫描 3×3
      let ok = true;
      for (let dx = 0; dx < 3 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) {
        const nt = this.tile(x0 + dx, z0 + dz);
        if (!(nt?.crop?.mature && nt.crop.id === def.id && !nt.crop.withered && !nt.crop.giant && !nt.crop.absorbed)) ok = false;
      }
      if (!ok || Math.random() >= 0.01) continue;
      const cx = x0 + 1, cz = z0 + 1;
      for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
        const tt = this.tile(x0 + dx, z0 + dz);
        if (dx === 1 && dz === 1) { tt.crop.giant = true; tt.crop.hits = 0; }
        else tt.crop.absorbed = true;
        this.syncTile(x0 + dx, z0 + dz);
      }
      g.effects.burst(new THREE.Vector3(cx + 0.5, 1.2, cz + 0.5), ['#FFD98A', '#FFFFFF', cropColor(def.id)], 18, 3);
      g.audio.sfx('levelup');
      g.ui?.tutorial?.(`田里长出了巨大的${def.name}！用斧头砍收。`, 4500);
      return; // 每晚最多融合一处
    }
  }
  until(x, z) {
    const g = this.game, t = this.tile(x, z);
    const obj = this.objAt(x, z);
    if (obj) return this.removeObject(x, z);
    if (!t || !t.tilled) return false;
    if (t.crop) return this.deny(x, z, '上面有作物');
    t.tilled = false; t.watered = false; t.fert = null;
    useEnergy(g.state, this.toolCost('pickaxe'));
    g.audio.sfx('hoe');
    this.syncTile(x, z);
    return true;
  }
  chopObj(x, z) { return this.removeObject(x, z); }

  // ---- 设施 ----
  objAt(x, z) { return this.game.state.farm.objects.find((o) => o.x === x && o.z === z); }
  placeObject(x, z, id, gt) {
    const g = this.game;
    if (gt === 'water' || gt === 'blocked') return this.deny(x, z, '这里不能放');
    if (this.objAt(x, z)) return this.deny(x, z, '这里有东西了');
    const t = this.tile(x, z);
    if (t?.crop) return this.deny(x, z, '有作物');
    if (!removeItem(g.state, id, 1)) return false;
    g.state.farm.objects.push({ id, x, z });
    g.audio.sfx('plant');
    g.effects.burst(new THREE.Vector3(x + 0.5, 0.5, z + 0.5), ['#E8C469', '#FFFFFF'], 8, 1.6);
    this.syncTile(x, z);
    return true;
  }
  removeObject(x, z) {
    const g = this.game, i = g.state.farm.objects.findIndex((o) => o.x === x && o.z === z);
    if (i < 0) return false;
    const obj = g.state.farm.objects[i];
    g.state.farm.objects.splice(i, 1);
    if (obj.id.startsWith('fence_')) dynamicBlocked.delete(`${x},${z}`);
    addItem(g.state, obj.id, 1, 0);
    g.audio.sfx('pickup');
    this.syncTile(x, z);
    return true;
  }
  // 通用摆放：栅栏（带碰撞）/地板（可行走）/火把（发光）等
  placeGeneric(x, z, id, gt) {
    const g = this.game;
    if (gt === 'water' || gt === 'blocked') return this.deny(x, z, '这里不能放');
    if (onRoad(x + 0.5, z + 0.5)) return this.deny(x, z, '别挡着路');
    if (this.objAt(x, z)) return this.deny(x, z, '这里有东西了');
    const t = this.tile(x, z);
    if (t?.crop) return this.deny(x, z, '有作物');
    if (!removeItem(g.state, id, 1)) return false;
    g.state.farm.objects.push({ id, x, z });
    if (id.startsWith('fence_')) dynamicBlocked.add(`${x},${z}`);
    g.audio.sfx('plant');
    g.effects.burst(new THREE.Vector3(x + 0.5, 0.5, z + 0.5), ['#E8C469', '#FFFFFF'], 8, 1.6);
    this.syncTile(x, z);
    return true;
  }
  sprinklerTiles(obj) {
    const r = getItem(obj.id).range;
    const out = [];
    if (r === 1) { [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => out.push([obj.x + dx, obj.z + dz])); }
    else { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { if (r === 3 ? (Math.abs(dx) <= 2 && Math.abs(dz) <= 2) : true) { if (dx || dz) out.push([obj.x + dx, obj.z + dz]); } } }
    return out;
  }
  scarecrowCovers(x, z) {
    return this.game.state.farm.objects.some((o) => {
      if (getItem(o.id).type !== 'scarecrow') return false;
      const r = getItem(o.id).radius;
      const dx = Math.abs(o.x - x), dz = Math.abs(o.z - z);
      return dx <= r && dz <= r && (dx < r || dz < r || (dx <= Math.floor(r * 0.75) && dz <= Math.floor(r * 0.75)));
    });
  }

  // ---- 日结算 ----
  onDayStart() {
    const g = this.game;
    const raining = ['rain', 'storm'].includes(g.state.weather.today);
    // 1) 洒水器浇水
    for (const obj of g.state.farm.objects) {
      if (getItem(obj.id).type !== 'sprinkler') continue;
      for (const [x, z] of this.sprinklerTiles(obj)) {
        const t = this.tile(x, z);
        if (t?.tilled) t.watered = true;
      }
    }
    // 2) 雨天全浇
    if (raining) this.waterAll(false);
    // 3) 生长
    for (const k of Object.keys(g.state.farm.tiles)) {
      const t = g.state.farm.tiles[k];
      if (t.crop && !t.crop.mature && !t.crop.withered && t.watered) {
        t.crop.progress++;
        if (t.crop.progress >= t.crop.needDays) t.crop.mature = true;
      }
      // 4) 水分保持/蒸发
      if (t.watered) {
        const keep = t.fert === 'soil_basic' ? 0.33 : t.fert === 'soil_quality' ? 0.66 : t.fert === 'soil_deluxe' ? 1 : 0;
        t.watered = Math.random() < keep;
      }
      const [x, z] = k.split(',').map(Number);
      this.syncTile(x, z);
    }
    // 5) 乌鸦（清晨发现）
    this.crowEvent();
    // 6) 巨大作物融合（每晚 1%/块）
    this.giantEvent();
  }
  waterAll(sync) {
    for (const k of Object.keys(this.game.state.farm.tiles)) {
      const t = this.game.state.farm.tiles[k];
      if (t.tilled) t.watered = true;
      if (sync) { const [x, z] = k.split(',').map(Number); this.syncTile(x, z); }
    }
  }
  crowEvent() {
    const g = this.game;
    // 5) 乌鸦（清晨发现，巨大作物与其被吸收格免疫）
    const crops = Object.entries(g.state.farm.tiles).filter(([k, t]) => {
      if (!t.crop || t.crop.withered || t.crop.giant || t.crop.absorbed) return false;
      const [x, z] = k.split(',').map(Number);
      return !inGreenhouse(x, z); // 温室无乌鸦
    });
    if (crops.length <= 15) return;
    const crows = Math.min(4, Math.floor(crops.length / 16));
    let hit = 0;
    for (let i = 0; i < crows; i++) {
      if (Math.random() >= 0.3) continue;
      const targets = crops.filter(([k]) => { const [x, z] = k.split(',').map(Number); return !this.scarecrowCovers(x, z); });
      if (!targets.length) break;
      const [k, t] = targets[Math.floor(Math.random() * targets.length)];
      t.crop = null; hit++;
      const [x, z] = k.split(',').map(Number);
      g.effects.burst(new THREE.Vector3(x + 0.5, 1, z + 0.5), ['#23232E', '#4A4A5A'], 10, 2.4);
      g.effects.floatText(new THREE.Vector3(x + 0.5, 1.4, z + 0.5), '乌鸦叼走了作物！', '#23232E', 13);
      this.syncTile(x, z);
    }
    if (hit > 0) g.audio.sfx('error');
  }
  onSeasonStart() {
    const g = this.game, season = g.clock.season;
    for (const k of Object.keys(g.state.farm.tiles)) {
      const t = g.state.farm.tiles[k];
      const [x, z] = k.split(',').map(Number);
      const gh = inGreenhouse(x, z) && g.state.farm.greenhouse;
      if (t.crop && !gh) {
        const def = cropDef(t.crop.id);
        if (!def.seasons.includes(season) && !t.crop.withered) {
          t.crop.withered = true; t.crop.mature = false;
        }
        // 跨季作物格保留肥料，其余清除
        if (!def.seasons.includes(season)) t.fert = null;
      } else if (!gh) {
        t.fert = null;
      }
      if (!gh) t.watered = false;
      this.syncTile(x, z);
    }
  }

  // ---- 品质判定（RESEARCH §4.2 概率表，按等级插值）----
  rollQuality(fert) {
    const lvl = skillLevel(this.game.state, 'farming');
    const t = lvl / 10;
    const lerp = (a, b) => a + (b - a) * t;
    let table;
    if (fert === 'fert_deluxe') table = [0, lerp(0.84, 0.11), lerp(0.10, 0.48), lerp(0.06, 0.41)]; // 银/金/铱
    else if (fert === 'fert_quality') table = [lerp(0.78, 0.10), lerp(0.14, 0.29), lerp(0.08, 0.61), 0];
    else if (fert === 'fert_basic') table = [lerp(0.88, 0.15), lerp(0.08, 0.44), lerp(0.04, 0.41), 0];
    else table = [lerp(0.97, 0.46), lerp(0.02, 0.33), lerp(0.01, 0.21), 0];
    let r = Math.random(), q = 0;
    for (let i = 0; i < 4; i++) { if (r < table[i]) { q = i; break; } r -= table[i]; }
    return q;
  }
  toolCost(tool) {
    const skillMap = { hoe: 'farming', wateringcan: 'farming', axe: 'foraging', pickaxe: 'mining' };
    const lvl = skillLevel(this.game.state, skillMap[tool] || 'farming');
    return Math.max(1, 2 - lvl * 0.1);
  }
  deny(x, z, msg) {
    this.game.audio.sfx('error');
    this.game.effects.floatText(new THREE.Vector3(x + 0.5, 1, z + 0.5), msg, '#E84A4A', 12);
    return false;
  }

  // ---- 可视同步 ----
  syncTile(x, z) {
    const k = this.key(x, z), t = this.game.state.farm.tiles[k];
    let m = this.tileMeshes.get(k);
    if (!m) {
      m = { soil: null, crop: null, obj: null };
      this.tileMeshes.set(k, m);
    }
    // 土壤
    const { tillTex, tillWetTex } = tillTextures();
    if (t?.tilled) {
      if (!m.soil) {
        const mat = new THREE.MeshLambertMaterial({ map: tillTex });
        m.soil = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), mat);
        m.soil.rotation.x = -Math.PI / 2;
        m.soil.position.set(x + 0.5, 0.015, z + 0.5);
        m.soil.receiveShadow = true;
        this.group.add(m.soil);
      }
      m.soil.material.map = t.watered ? tillWetTex : tillTex;
      m.soil.material.needsUpdate = true;
    } else if (m.soil) {
      this.group.remove(m.soil); m.soil = null;
    }
    // 作物（被吸收格不渲染；巨大作物放大渲染+裂纹变暗）
    if (t?.crop && !t.crop.absorbed) {
      const def = cropDef(t.crop.id);
      const stage = t.crop.withered ? -1 : (t.crop.mature ? 3 : Math.min(2, Math.floor((t.crop.progress / t.crop.needDays) * 3)));
      const tex = t.crop.withered ? witheredTex() : cropStageTex(def, Math.max(0, stage), 3);
      if (!m.crop) {
        const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
        m.crop = new THREE.Group();
        const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), mat);
        p1.position.y = 0.55;
        const p2 = p1.clone(); p2.rotation.y = Math.PI / 2;
        m.crop.add(p1, p2);
        m.crop.position.set(x + 0.5, 0, z + 0.5);
        this.group.add(m.crop);
        this.sway.push(m.crop);
      }
      for (const p of m.crop.children) { p.material.map = tex; p.material.needsUpdate = true; }
      if (t.crop.giant) {
        const shrink = 1 - (t.crop.hits || 0) * 0.18; // 裂纹：越砍越暗
        m.crop.scale.setScalar(2.6);
        for (const p of m.crop.children) p.material.color.setScalar(shrink);
      } else {
        const s = t.crop.mature ? 1 : 0.45 + (t.crop.progress / t.crop.needDays) * 0.5;
        m.crop.scale.setScalar(t.crop.withered ? 0.9 : s);
        for (const p of m.crop.children) p.material.color.setScalar(1);
      }
    } else if (m.crop) {
      this.group.remove(m.crop);
      this.sway = this.sway.filter((c) => c !== m.crop);
      m.crop = null;
    }
    // 设施
    const obj = this.objAt(x, z);
    if (obj && !m.obj) {
      m.obj = this.makeObjectMesh(obj.id);
      m.obj.position.set(x + 0.5, 0, z + 0.5);
      this.group.add(m.obj);
    } else if (!obj && m.obj) {
      this.group.remove(m.obj); m.obj = null;
    }
  }
  makeObjectMesh(id) {
    const g = new THREE.Group();
    if (id.startsWith('fence_')) {
      // 栅栏段（木/石/铁）
      const tier = id === 'fence_wood' ? 0 : id === 'fence_stone' ? 1 : 2;
      const mats = [
        new THREE.MeshLambertMaterial({ map: woodTex() }),
        new THREE.MeshLambertMaterial({ map: stoneTex() }),
        new THREE.MeshLambertMaterial({ map: metalTex() }),
      ];
      const m = mats[tier];
      for (const dx of [-0.4, 0.4]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), m);
        post.position.set(dx, 0.37, 0);
        g.add(post);
      }
      for (const y of [0.3, 0.55]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.06), m);
        rail.position.y = y;
        g.add(rail);
      }
    } else if (id.startsWith('floor_')) {
      // 地板（薄板贴地，可行走）
      const tier = id === 'floor_wood' ? 0 : id === 'floor_stone' ? 1 : 2;
      const mats = [
        new THREE.MeshLambertMaterial({ map: woodTex() }),
        new THREE.MeshLambertMaterial({ map: stoneTex() }),
        new THREE.MeshLambertMaterial({ color: '#7AE8E0', emissive: 0x2a8a90, emissiveIntensity: 0.4 }),
      ];
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.05, 0.96), mats[tier]);
      slab.position.y = 0.03;
      slab.receiveShadow = true;
      g.add(slab);
    } else if (id === 'torch') {
      // 火把（木杆 + 发光火焰）
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.0, 5), new THREE.MeshLambertMaterial({ map: barkTex() }));
      post.position.y = 0.5;
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.1, 0.35) }));
      flame.position.y = 1.1;
      flame.userData.flicker = true;
      g.add(post, flame);
    } else if (getItem(id).type === 'sprinkler') {
      const tier = getItem(id).range;
      const col = tier === 1 ? '#B87333' : tier === 2 ? '#C0C0C8' : '#7AE8E0';
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 6), new THREE.MeshLambertMaterial({ map: metalTex() }));
      base.position.y = 0.25;
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshLambertMaterial({ color: shade(col, 30), flatShading: true }));
      top.position.y = 0.55;
      g.add(base, top);
    } else { // 稻草人
      const mat = new THREE.MeshLambertMaterial({ map: hayTex() });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.5, 5), mat);
      post.position.y = 0.75;
      const arms = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), mat);
      arms.position.y = 1.15;
      const headM = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), new THREE.MeshLambertMaterial({ color: '#E8C469', flatShading: true }));
      headM.position.y = 1.5;
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.25, 6), new THREE.MeshLambertMaterial({ color: '#8A5A2A', flatShading: true }));
      hat.position.y = 1.68;
      g.add(post, arms, headM, hat);
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  // 全量重建（读档/初始化）
  syncAll() {
    for (const k of Object.keys(this.game.state.farm.tiles)) {
      const [x, z] = k.split(',').map(Number);
      this.syncTile(x, z);
    }
    for (const obj of this.game.state.farm.objects) this.syncTile(obj.x, obj.z);
  }
  // ---- 温室建筑可视（解锁后建造）----
  syncGreenhouse() {
    const g = this.game;
    if (!g.state.farm.greenhouse || this.ghMesh) return;
    const grp = new THREE.Group();
    const frameMat = new THREE.MeshLambertMaterial({ color: '#D8E8E0', flatShading: true });
    const glassMat = new THREE.MeshLambertMaterial({ color: '#B9E8F0', transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const w = GREENHOUSE.x1 - GREENHOUSE.x0 + 1, d = GREENHOUSE.z1 - GREENHOUSE.z0 + 1;
    const cx = GREENHOUSE.x0 + w / 2, cz = GREENHOUSE.z0 + d / 2;
    // 玻璃墙
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, 0.12), glassMat);
    wallN.position.set(cx, 1.1, GREENHOUSE.z0);
    const wallS = wallN.clone(); wallS.position.z = GREENHOUSE.z1 + 1;
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, d), glassMat);
    wallW.position.set(GREENHOUSE.x0, 1.1, cz);
    const wallE = wallW.clone(); wallE.position.x = GREENHOUSE.x1 + 1;
    // 屋顶（双坡玻璃）
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.1, d / 2 + 0.8), glassMat);
    roofL.position.set(cx, 2.6, cz - d / 4); roofL.rotation.x = 0.42;
    const roofR = roofL.clone(); roofR.position.z = cz + d / 4; roofR.rotation.x = -0.42;
    // 框架柱
    for (const [px, pz] of [[GREENHOUSE.x0, GREENHOUSE.z0], [GREENHOUSE.x1 + 1, GREENHOUSE.z0], [GREENHOUSE.x0, GREENHOUSE.z1 + 1], [GREENHOUSE.x1 + 1, GREENHOUSE.z1 + 1]]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), frameMat);
      pillar.position.set(px, 1.3, pz);
      grp.add(pillar);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.16, 0.16), frameMat);
    ridge.position.set(cx, 2.95, cz);
    grp.add(wallN, wallS, wallW, wallE, roofL, roofR, ridge);
    grp.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.group.add(grp);
    this.ghMesh = grp;
    g.ui.tutorial('芽 温室修复完成！东北角的玻璃房全年可种任何作物。', 7000);
  }
  update(dt, t) {
    // 作物随风摆动（§4.5 生动性）
    const windMul = this.game.state.weather.today === 'wind' ? 2.2 : 1;
    for (let i = 0; i < this.sway.length; i++) {
      const c = this.sway[i];
      c.rotation.z = Math.sin(t * 2 + i * 1.7) * 0.05 * windMul;
    }
    // 目标格高亮
    const tg = this.targetTile();
    if (tg && this.game.state.player.scene === 'farm') {
      this.highlight.visible = true;
      this.highlight.position.set(tg.x + 0.5, 0.03, tg.z + 0.5);
    } else this.highlight.visible = false;
  }
}
