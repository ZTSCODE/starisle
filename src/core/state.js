// 游戏状态：单一可序列化 GameState + 背包操作（各系统只读写自己的字段）
import { getItem } from '../data/items.js';
import { bus } from './events.js';

export const SAVE_VERSION = 1;
export const XP_TABLE = [100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];

export function newGame(cfg = {}) {
  const inv = new Array(36).fill(null);
  const s = {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    player: {
      name: cfg.name || '小屿', farmName: cfg.farmName || '晨风农场',
      appearance: cfg.appearance || { skin: 0, hair: 0, shirt: 0 },
      pet: cfg.pet || 'cat',
      x: 24, z: 26, scene: 'farm',
      energy: 270, maxEnergy: 270,
      health: 100, maxHealth: 100,
      money: 500,
      inventory: inv, invSize: 24, toolbarSel: 0,
      tools: { hoe: 0, wateringcan: 0, axe: 0, pickaxe: 0, fishingrod: 0 }, // 0基础 1铜 2钢 3金 4铱
      equipment: { weapon: null, ring1: null, ring2: null, boots: null },
      skills: { farming: { xp: 0, prof: [] }, mining: { xp: 0, prof: [] }, foraging: { xp: 0, prof: [] }, fishing: { xp: 0, prof: [] }, combat: { xp: 0, prof: [] } },
      luck: 0,
      stats: { earned: 0, spent: 0, steps: 0, fished: 0, mined: 0, tilled: 0, harvested: 0, gifts: 0, daysPlayed: 0, deepestMine: 0, shipped: 0, monstersKilled: 0, cropsShipped: {} },
    },
    time: { year: 1, season: 0, day: 1, minute: 360 },
    weather: { today: 'sunny', tomorrow: null },
    farm: { tiles: {}, objects: [], greenhouse: false, buildings: [] },
    chests: {},
    npcs: {},
    mine: { elevator: 0 },
    bundles: {},
    quests: { active: [], done: [] },
    achievements: [],
    codex: { crops: {}, fish: {}, minerals: {}, forage: {} },
    flags: { intro: false, tutorial: 0, petChosen: !!cfg.pet },
    mails: [],
    settings: { volumes: { master: 80, music: 80, sfx: 80 }, quality: 'auto', uiScale: 1, timeScale: 1, keybinds: null, tutorialsSeen: [] },
  };
  // 初始背包：工具 + 15 防风草种子
  const start = ['hoe', 'wateringcan', 'axe', 'pickaxe', 'scythe', 'fishingrod', 'sword'];
  start.forEach((id, i) => { inv[i] = { id, qty: 1, quality: 0 }; });
  inv[7] = { id: 'parsnip_seeds', qty: 15, quality: 0 };
  return s;
}

// ---- 背包操作 ----
export function addItem(state, id, qty = 1, quality = 0) {
  const it = getItem(id);
  const inv = state.player.inventory;
  // 先堆叠
  for (let i = 0; i < state.player.invSize && qty > 0; i++) {
    const s = inv[i];
    if (s && s.id === id && s.quality === quality && s.qty < it.stack) {
      const add = Math.min(qty, it.stack - s.qty);
      s.qty += add; qty -= add;
    }
  }
  // 再空格
  for (let i = 0; i < state.player.invSize && qty > 0; i++) {
    if (!inv[i]) {
      const add = Math.min(qty, it.stack);
      inv[i] = { id, qty: add, quality };
      qty -= add;
    }
  }
  if (qty <= 0) bus.emit('item-gained', { id, quality });
  return qty; // 剩余放不下的数量
}
export function removeItem(state, id, qty = 1) {
  const inv = state.player.inventory;
  for (let i = 0; i < inv.length && qty > 0; i++) {
    const s = inv[i];
    if (s && s.id === id) {
      const take = Math.min(qty, s.qty);
      s.qty -= take; qty -= take;
      if (s.qty <= 0) inv[i] = null;
    }
  }
  return qty === 0;
}
export function countItem(state, id) {
  return state.player.inventory.reduce((n, s) => n + (s && s.id === id ? s.qty : 0), 0);
}
export function hasSpace(state, id) {
  const it = getItem(id);
  const inv = state.player.inventory;
  for (let i = 0; i < state.player.invSize; i++) {
    if (!inv[i]) return true;
    if (inv[i].id === id && inv[i].qty < it.stack) return true;
  }
  return false;
}
export function heldItem(state) {
  return state.player.inventory[state.player.toolbarSel] || null;
}
export function isTool(id) { return getItem(id).type === 'tool' || getItem(id).type === 'weapon'; }

// ---- 体力/生命 ----
export function useEnergy(state, n) {
  const lvl = 0; // 工具熟练减免由调用方算好传入
  state.player.energy = Math.max(-15, state.player.energy - Math.max(0, n - lvl));
  bus.emit('energy-changed', state.player.energy);
  return state.player.energy;
}
export function restoreEnergy(state, n) {
  state.player.energy = Math.min(state.player.maxEnergy, state.player.energy + n);
}
export function damage(state, n) {
  state.player.health = Math.max(0, state.player.health - n);
  bus.emit('health-changed', state.player.health);
  return state.player.health;
}
export function heal(state, n) {
  state.player.health = Math.min(state.player.maxHealth, state.player.health + n);
}
export function addMoney(state, n) {
  state.player.money = Math.max(0, state.player.money + n);
  if (n > 0) state.player.stats.earned += n; else state.player.stats.spent -= n;
  bus.emit('money-changed', state.player.money);
}

// ---- 技能 ----
export function skillLevel(state, skill) {
  const xp = state.player.skills[skill].xp;
  let lvl = 0;
  for (let i = 0; i < XP_TABLE.length; i++) if (xp >= XP_TABLE[i]) lvl = i + 1;
  return lvl;
}
export function addXP(state, skill, amount) {
  const before = skillLevel(state, skill);
  state.player.skills[skill].xp += amount;
  const after = skillLevel(state, skill);
  bus.emit('xp-float', { skill, amount });
  if (after > before) bus.emit('skill-levelup-pending', { skill, from: before, to: after });
  return after - before;
}

// ---- Buff（食物/饮品）----
export function addBuff(state, type, value, minutes) {
  if (!state.player.buffs) state.player.buffs = [];
  const ex = state.player.buffs.find((b) => b.type === type);
  if (ex) { ex.value = value; ex.remain = minutes; }
  else state.player.buffs.push({ type, value, remain: minutes });
}
export function buffValue(state, type) {
  const b = (state.player.buffs || []).find((x) => x.type === type);
  return b ? b.value : 0;
}
export function effectiveSkill(state, skill) {
  return Math.min(14, skillLevel(state, skill) + buffValue(state, skill));
}
export function tickBuffs(state) {
  for (const b of state.player.buffs || []) b.remain -= 1;
  state.player.buffs = (state.player.buffs || []).filter((b) => b.remain > 0);
}
