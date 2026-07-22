// 制造/熔炼/加工机器/烹饪/食物buff/炸弹/楼梯/图腾 系统
// 设计文档：docs/design/crafting.md
import * as THREE from 'three';
import { RECIPES } from '../data/recipes.js';
import { COOKING } from '../data/cooking.js';
import { getItem, registerItem } from '../data/items.js';
import { addItem, removeItem, countItem, addXP, skillLevel, addBuff, buffValue, restoreEnergy, heal, heldItem } from '../core/state.js';
import { makeTexture, shade, metalTex, woodTex } from '../render/textures.js';

registerItem('beer', '啤酒', 'food', 200, { edible: true, energy: 50, health: 22 });
registerItem('wine', '果酒', 'artisan', 0, {});
registerItem('juice', '果汁', 'artisan', 0, {});
registerItem('honey', '野蜂蜜', 'artisan', 100, {});
registerItem('cloth', '布料', 'artisan', 470, {});
registerItem('coffee', '咖啡', 'food', 150, { edible: true, energy: 12, health: 5, buff: { type: 'speed', value: 1, minutes: 240 } });
registerItem('pickles', '腌菜', 'artisan', 0, {});
registerItem('jelly', '果酱', 'artisan', 0, {});

// 熔炉配方：5矿+1煤 → 锭（游戏分钟）
export const SMELT = {
  copper_ore: { out: 'copper_bar', time: 30, xp: 6 },
  iron_ore: { out: 'iron_bar', time: 120, xp: 12 },
  gold_ore: { out: 'gold_bar', time: 300, xp: 18 },
  iridium_ore: { out: 'iridium_bar', time: 480, xp: 30 },
  quartz: { out: 'refined_quartz', time: 60, xp: 5 },
};
// 加工机器规则
export const PROCESSORS = {
  keg: {
    name: '小桶', accepts: (id) => getItem(id).type === 'crop' ? { out: getItem(id).type === 'crop' ? 'wine' : 'juice', time: 4320, priceMul: 3 } : null,
    custom: (id) => {
      const it = getItem(id);
      if (it.type !== 'crop') return null;
      if (id === 'wheat') return { out: 'beer', time: 1750, price: 200 };
      const isFruit = ['melon', 'strawberry', 'blueberry', 'cranberry', 'grape', 'peach', 'ancientfruit', 'starfruit'].includes(id) || it.name.match(/莓|瓜|桃|葡萄|果/);
      return isFruit ? { out: 'wine', time: 4320, priceMul: 3 } : { out: 'juice', time: 2880, priceMul: 2.25 };
    },
  },
  preserves_jar: { name: '罐头瓶', custom: (id) => { const it = getItem(id); if (it.type !== 'crop') return null; const isFruit = ['melon', 'strawberry', 'blueberry', 'cranberry', 'grape', 'starfruit'].includes(id); return isFruit ? { out: 'jelly', time: 2880, priceFn: (p) => p * 2 + 50 } : { out: 'pickles', time: 2880, priceFn: (p) => p * 2 + 50 }; } },
  oil_maker: { name: '产油机', custom: (id) => (id === 'sunflower' ? { out: 'oil', time: 1440, price: 100 } : null) },
  loom: { name: '织布机', custom: (id) => (id === 'wool' ? { out: 'cloth', time: 240, price: 470 } : null) },
  charcoal_kiln: { name: '木炭窑', custom: (id) => (id === 'wood' ? { out: 'coal', time: 30, price: 15, inQty: 10 } : null) },
  recycling_machine: { name: '回收机', custom: (id) => ({ driftwood: { out: 'wood', time: 60, qty: 2 }, broken_glasses: { out: 'refined_quartz', time: 60 }, soggy_newspaper: { out: 'fiber', time: 60, qty: 3 } }[id] || null) },
  seed_maker: { name: '种子机', custom: (id) => (getItem(id).type === 'crop' ? { out: id + '_seeds', time: 20, qtyFn: () => 1 + Math.floor(Math.random() * 3) } : null) },
  crystalarium: { name: '宝石复制机', custom: (id) => (getItem(id).type === 'gem' ? { out: id, time: 2880 } : null) },
  furnace: { name: '熔炉', smelter: true },
};

export class Crafting {
  constructor(game) {
    this.game = game;
    this.machines = new Map(); // key -> {mesh, state}
    this.group = new THREE.Group();
    game.engine.scene.add(this.group);
    if (!game.state.farm.machines) game.state.farm.machines = [];
    game.bus.on('minute', () => this.tickMachines());
    game.bus.on('day-start', () => this.tickDaily());
  }
  // ---- 配方解锁 ----
  isUnlocked(r) {
    const g = this.game, u = r.unlock || { start: true };
    if (u.start) return true;
    if (u.skill) return skillLevel(g.state, u.skill) >= u.level;
    if (u.shop) return (g.state.player.recipesBought || []).includes(r.id);
    if (u.story) return g.state.flags.ccUnlocked;
    return false;
  }
  knownRecipes() { return RECIPES.filter((r) => this.isUnlocked(r)); }
  canCraft(r) {
    const g = this.game;
    return r.ingredients.every((ing) => {
      if (ing.item) return countItem(g.state, ing.item) >= ing.qty;
      if (ing.any) return this.countAny(ing.any) >= ing.qty;
      return false;
    });
  }
  countAny(cat) {
    const g = this.game;
    return g.state.player.inventory.reduce((n, s) => {
      if (!s) return n;
      const it = getItem(s.id);
      const typeMap = { fish: 'fish', egg: ['egg', 'duck_egg'], milk: ['milk', 'goat_milk'], vegetable: null, fruit: null };
      if (cat === 'fish' && it.type === 'fish') return n + s.qty;
      if (cat === 'egg' && ['egg', 'duck_egg', 'large_egg'].includes(s.id)) return n + s.qty;
      if (cat === 'milk' && ['milk', 'goat_milk', 'large_milk'].includes(s.id)) return n + s.qty;
      if ((cat === 'vegetable' || cat === 'fruit') && it.type === 'crop') return n + s.qty;
      return n;
    }, 0);
  }
  consumeAny(cat, qty) {
    const g = this.game;
    for (let i = 0; i < g.state.player.inventory.length && qty > 0; i++) {
      const s = g.state.player.inventory[i];
      if (!s) continue;
      const it = getItem(s.id);
      const ok = (cat === 'fish' && it.type === 'fish') || (cat === 'egg' && ['egg', 'duck_egg', 'large_egg'].includes(s.id)) || (cat === 'milk' && ['milk', 'goat_milk', 'large_milk'].includes(s.id)) || ((cat === 'vegetable' || cat === 'fruit') && it.type === 'crop');
      if (ok) { const take = Math.min(qty, s.qty); s.qty -= take; qty -= take; if (s.qty <= 0) g.state.player.inventory[i] = null; }
    }
    return qty === 0;
  }
  craft(recipeId) {
    const g = this.game;
    const r = RECIPES.find((x) => x.id === recipeId);
    if (!r || !this.isUnlocked(r)) return false;
    if (!this.canCraft(r)) { g.audio.sfx('error'); return false; }
    for (const ing of r.ingredients) {
      if (ing.item) removeItem(g.state, ing.item, ing.qty);
      else if (ing.any) this.consumeAny(ing.any, ing.qty);
    }
    const left = addItem(g.state, r.out, r.qty || 1, 0);
    g.audio.sfx('harvest');
    g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), `制造了 ${getItem(r.out).name}${r.qty > 1 ? '×' + r.qty : ''}`, '#8AE84A', 13);
    if (left > 0) g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.9, 0)), '背包已满，掉在地上', '#E84A4A', 12);
    g.state.player.stats.crafted = (g.state.player.stats.crafted || 0) + 1;
    g.bus.emit('item-crafted', r.out);
    g.ui.refreshToolbar();
    return true;
  }

  // ---- 烹饪 ----
  knownCooking() {
    const g = this.game;
    return COOKING.filter((c) => {
      const u = c.unlock || {};
      if (u.queen != null) return (g.state.player.recipesKnown || []).includes(c.id) || (g.state.tvQueenWeeks || 0) >= u.queen;
      if (u.skill) return skillLevel(g.state, u.skill) >= u.level;
      if (u.friendship) return (g.state.npcs[u.friendship]?.hearts || 0) >= u.hearts;
      return false;
    });
  }
  cook(id) {
    const g = this.game;
    const c = COOKING.find((x) => x.id === id);
    if (!c) return false;
    const can = c.ingredients.every((ing) => ing.item ? countItem(g.state, ing.item) >= ing.qty : this.countAny(ing.any) >= ing.qty);
    if (!can) { g.audio.sfx('error'); return false; }
    for (const ing of c.ingredients) {
      if (ing.item) removeItem(g.state, ing.item, ing.qty);
      else this.consumeAny(ing.any, ing.qty);
    }
    addItem(g.state, c.id, 1, 0);
    g.audio.sfx('eat');
    g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), `烹饪了 ${c.name}`, '#FFD98A', 13);
    g.state.player.stats.cooked = (g.state.player.stats.cooked || 0) + 1;
    g.bus.emit('dish-cooked', c.id);
    g.ui.refreshToolbar();
    return true;
  }

  // ---- 吃/喝（含 buff）----
  eat(slotIdx) {
    const g = this.game;
    const s = g.state.player.inventory[slotIdx];
    if (!s) return false;
    const it = getItem(s.id);
    if (!it.edible) return false;
    if (it.stardrop) {
      g.state.player.maxEnergy += 34;
      restoreEnergy(g.state, 999);
      g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.6, 0)), '体力上限 +34！星星的力量涌入体内', '#B87AE8', 15);
      g.audio.sfx('levelup');
    } else {
      restoreEnergy(g.state, it.energy || 0);
      heal(g.state, it.health || 0);
      g.audio.sfx('eat');
      g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), `+${it.energy || 0} 体力`, '#8AE84A', 12);
    }
    if (it.buff) {
      addBuff(g.state, it.buff.type, it.buff.value, it.buff.minutes);
      const names = { farming: '耕种', mining: '采矿', fishing: '钓鱼', luck: '运气', speed: '速度', defense: '防御', energy_max: '体力上限' };
      g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.9, 0)), `${names[it.buff.type] || it.buff.type} +${it.buff.value}`, '#7AB8E8', 12);
    }
    s.qty -= 1;
    if (s.qty <= 0) g.state.player.inventory[slotIdx] = null;
    g.ui.refreshToolbar();
    return true;
  }

  // ---- 加工机器放置与交互 ----
  placeMachine(x, z, id) {
    const g = this.game;
    if (!getItem(id) || (getItem(id).type !== 'machine')) return false;
    if (this.machines.get(x + ',' + z) || g.state.farm.machines.find((m) => m.x === x && m.z === z)) return false;
    if (!removeItem(g.state, id, 1)) return false;
    g.state.farm.machines.push({ id, x, z, input: null, out: null, readyAt: 0, ready: false });
    this.syncMachine(x, z);
    g.audio.sfx('plant');
    return true;
  }
  machineAt(x, z) { return this.game.state.farm.machines.find((m) => m.x === x && m.z === z); }
  interactMachine(x, z) {
    const g = this.game;
    const m = this.machineAt(x, z);
    if (!m) return false;
    const rule = PROCESSORS[m.id];
    if (m.ready) { // 收获产物
      const qty = m.outQty || 1;
      addItem(g.state, m.out, qty, 0);
      g.audio.sfx('pickup');
      g.effects.floatText(new THREE.Vector3(x + 0.5, 1.2, z + 0.5), `收获 ${getItem(m.out).name}×${qty}`, '#FFD98A', 13);
      g.effects.burst(new THREE.Vector3(x + 0.5, 0.6, z + 0.5), ['#FFD98A', '#FFFFFF'], 8, 1.6);
      Object.assign(m, { input: null, out: null, readyAt: 0, ready: false, outQty: 0 });
      this.syncMachine(x, z);
      g.ui.refreshToolbar();
      return true;
    }
    if (m.input) { g.effects.floatText(new THREE.Vector3(x + 0.5, 1.2, z + 0.5), '加工中…', '#B8C0D8', 12); return false; }
    // 投入手持原料
    const held = heldItem(g.state);
    if (!held) { g.effects.floatText(new THREE.Vector3(x + 0.5, 1.2, z + 0.5), rule?.name || getItem(m.id).name, '#B8C0D8', 12); return false; }
    if (m.id === 'furnace') return this.loadFurnace(m, held);
    const job = rule?.custom?.(held.id);
    if (!job) {
      g.audio.sfx('error');
      g.effects.floatText(new THREE.Vector3(x + 0.5, 1.2, z + 0.5), '这个不能放进去', '#E84A4A', 12);
      return false;
    }
    const need = job.inQty || 1;
    if (held.qty < need) { g.audio.sfx('error'); g.effects.floatText(new THREE.Vector3(x + 0.5, 1.2, z + 0.5), `需要 ${need} 个`, '#E84A4A', 12); return false; }
    removeItem(g.state, held.id, need);
    const srcItem = getItem(held.id);
    m.input = held.id;
    m.out = job.out;
    m.outQty = job.qtyFn ? job.qtyFn() : (job.qty || 1);
    m.readyAt = g.clock.absMinute + job.time;
    m.ready = false;
    // 价格继承（酒/果汁/腌菜/果酱按原料定价）
    if (job.priceMul || job.priceFn) {
      const base = srcItem.price;
      m.outPrice = Math.floor(job.priceMul ? base * job.priceMul : job.priceFn(base));
    } else if (job.price) m.outPrice = job.price;
    else m.outPrice = 0;
    g.audio.sfx('plant');
    g.effects.floatText(new THREE.Vector3(x + 0.5, 1.2, z + 0.5), '开始加工…', '#8AE84A', 12);
    this.syncMachine(x, z);
    g.ui.refreshToolbar();
    return true;
  }
  loadFurnace(m, held) {
    const g = this.game;
    const rule = SMELT[held.id];
    if (!rule) { g.audio.sfx('error'); g.effects.floatText(new THREE.Vector3(m.x + 0.5, 1.2, m.z + 0.5), '熔炉只烧矿石/石英', '#E84A4A', 12); return false; }
    if (held.qty < 5) { g.audio.sfx('error'); g.effects.floatText(new THREE.Vector3(m.x + 0.5, 1.2, m.z + 0.5), '需要 5 个矿石 + 1 煤', '#E84A4A', 12); return false; }
    if (countItem(g.state, 'coal') < 1) { g.audio.sfx('error'); g.effects.floatText(new THREE.Vector3(m.x + 0.5, 1.2, m.z + 0.5), '缺 1 个煤', '#E84A4A', 12); return false; }
    removeItem(g.state, held.id, 5);
    removeItem(g.state, 'coal', 1);
    m.input = held.id; m.out = rule.out; m.outQty = 1;
    m.readyAt = g.clock.absMinute + rule.time;
    m.ready = false; m.xp = rule.xp;
    g.audio.sfx('stone');
    g.effects.floatText(new THREE.Vector3(m.x + 0.5, 1.2, m.z + 0.5), '点火熔炼…', '#FF8A3C', 12);
    this.syncMachine(m.x, m.z);
    g.ui.refreshToolbar();
    return true;
  }
  tickMachines() {
    const g = this.game;
    for (const m of g.state.farm.machines) {
      if (!m.ready && m.out && g.clock.absMinute >= m.readyAt) {
        m.ready = true;
        if (m.xp) { addXP(g.state, 'mining', m.xp); m.xp = 0; }
        // 产物价格写入物品（artisan 动态价：采用注册时0价+结算时读 m.outPrice——简化为直接按 artisan 固定价或原料倍率）
        this.syncMachine(m.x, m.z);
        if (g.state.player.scene === 'farm') g.audio.sfx('bite');
      }
    }
  }
  tickDaily() {
    // 蜂房：每4天产蜜；避雷针：暴雨次日电 池
    const g = this.game;
    for (const m of g.state.farm.machines) {
      if (m.id === 'bee_house' && !m.out) {
        m.beeDays = (m.beeDays || 0) + 1;
        if (m.beeDays >= 4) { m.beeDays = 0; m.out = 'honey'; m.outQty = 1; m.ready = true; this.syncMachine(m.x, m.z); }
      }
      if (m.id === 'lightning_rod' && !m.out && ['storm'].includes(g.state.weather.yesterday || '')) {
        m.out = 'battery'; m.outQty = 1; m.ready = true; this.syncMachine(m.x, m.z);
      }
    }
    g.state.weather.yesterday = g.state.weather.today;
  }
  // 炸弹（矿洞内使用）
  useBomb(x, z, bombId) {
    const g = this.game;
    if (!g.mining.inMine) return false;
    const radius = getItem(bombId).radius || 3;
    removeItem(g.state, bombId, 1);
    const pos = new THREE.Vector3(x + 0.5, 0.3, z + 0.5);
    const fuseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: '#2A2A32' }));
    fuseMesh.position.copy(pos);
    g.engine.scene.add(fuseMesh);
    g.audio.sfx('plant');
    setTimeout(() => {
      g.engine.scene.remove(fuseMesh);
      g.effects.burst(pos, ['#FF8A3C', '#FFD98A', '#4A4A4A'], 30, 5);
      g.effects.shakeScreen(0.15);
      g.audio.sfx('hit'); g.audio.noise({ dur: 0.5, freq: 200, vol: 0.5 });
      // 破坏范围内矿点
      for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
        if (dx * dx + dz * dz > radius * radius) continue;
        const k = (x + dx) + ',' + (z + dz);
        if (g.mining.nodes.has(k)) { g.mining.nodes.get(k).hp = 1; g.mining.breakNode(x + dx, z + dz); }
      }
      // 伤害怪物
      for (const m of [...g.mining.monsters]) {
        if (Math.hypot(m.x - pos.x, m.z - pos.z) < radius) { m.hp -= 50; m.flash = 0.2; if (m.hp <= 0) g.mining.killMonster(m); }
      }
      // 自伤
      if (Math.hypot(g.player.pos.x - pos.x, g.player.pos.z - pos.z) < radius * 0.8) g.mining.hurtPlayer(8, pos.x, pos.z);
      g.ui.refreshToolbar();
    }, 2000);
    return true;
  }
  useStairs() {
    const g = this.game;
    if (!g.mining.inMine) return false;
    if (!removeItem(g.state, 'staircase', 1)) return false;
    g.audio.sfx('close');
    g.mining.enter(g.mining.floor + 1);
    g.ui.refreshToolbar();
    return true;
  }
  useTotem(id) {
    const g = this.game;
    const use = getItem(id).use;
    if (use === 'rain') {
      if (g.clock.season === 3) g.state.weather.tomorrow = 'snow';
      else g.state.weather.tomorrow = 'rain';
      removeItem(g.state, id, 1);
      g.audio.sfx('levelup');
      g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), g.clock.season === 3 ? '明天会下雪' : '明天会下雨', '#7AB8E8', 13);
      g.ui.refreshToolbar();
      return true;
    }
    if (use === 'warp_farm') { g.bus.emit('warp-request', 'farm'); removeItem(g.state, id, 1); return true; }
    if (use === 'warp_beach') { g.bus.emit('warp-request', 'beach'); removeItem(g.state, id, 1); return true; }
    return false;
  }
  // 特殊物品使用分发（手持点击空气时由主循环调用）
  useSpecial(slotIdx) {
    const g = this.game;
    const s = g.state.player.inventory[slotIdx];
    if (!s) return false;
    const it = getItem(s.id);
    if (it.edible) return this.eat(slotIdx);
    if (it.type === 'bomb') {
      const p = g.player.pos, f = g.player.facing;
      return this.useBomb(Math.floor(p.x + Math.sin(f) * 1.5), Math.floor(p.z + Math.cos(f) * 1.5), s.id);
    }
    if (s.id === 'staircase') return this.useStairs();
    if (it.use) return this.useTotem(s.id);
    if (it.type === 'machine') {
      const p = g.player.pos, f = g.player.facing;
      const tx = Math.floor(p.x + Math.sin(f) * 1.2), tz = Math.floor(p.z + Math.cos(f) * 1.2);
      return this.placeMachine(tx, tz, s.id);
    }
    if (s.id === 'chest') {
      const p = g.player.pos, f = g.player.facing;
      const tx = Math.floor(p.x + Math.sin(f) * 1.2), tz = Math.floor(p.z + Math.cos(f) * 1.2);
      return g.chests.place(tx, tz);
    }
    return false;
  }
  // 机器可视
  syncMachine(x, z) {
    const k = x + ',' + z;
    const m = this.game.state.farm.machines.find((mm) => mm.x === x && mm.z === z);
    let entry = this.machines.get(k);
    if (!m) { if (entry) { this.group.remove(entry.mesh); this.machines.delete(k); } return; }
    if (!entry) {
      entry = { mesh: this.makeMachineMesh(m.id) };
      entry.mesh.position.set(x + 0.5, 0, z + 0.5);
      this.machines.set(k, entry);
      this.group.add(entry.mesh);
    }
    const glow = entry.mesh.userData.glow;
    if (glow) glow.visible = !!m.ready;
    const body = entry.mesh.userData.body;
    if (body) body.material.emissive?.setScalar(m.out && !m.ready ? 0.25 : 0);
  }
  makeMachineMesh(id) {
    const g = new THREE.Group();
    const colors = { furnace: '#5A5A66', keg: '#8A5A2A', preserves_jar: '#7A9A4A', oil_maker: '#4A6A8A', loom: '#9A7A5A', charcoal_kiln: '#3A3A44', recycling_machine: '#5A8A6A', seed_maker: '#6A8A4A', crystalarium: '#8A7AE8', bee_house: '#E8C84A', lightning_rod: '#C0C0C8', mayonnaise_machine: '#E8E0C8', cheese_press: '#D8C89A', tapper: '#7A5A3A' };
    const col = colors[id] || '#7A7A88';
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.6, 7), new THREE.MeshLambertMaterial({ map: metalTex(), color: col }));
    body.position.y = 0.3; body.castShadow = true;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshBasicMaterial({ color: '#FFD98A' }));
    glow.position.y = 0.75; glow.visible = false;
    g.add(body, glow);
    g.userData.body = body; g.userData.glow = glow;
    return g;
  }
  syncAll() { for (const m of this.game.state.farm.machines) this.syncMachine(m.x, m.z); }
  update() {}
  serialize() {}
  deserialize() {}
}
