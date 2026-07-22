// 商店与经济系统：营业时间/休息日/库存解析/购买出售/背包扩容/工具升级/旅行商人/赌场
// 设计文档：docs/design/economy.md
import * as THREE from 'three';
import { SHOPS } from '../data/shops.js';
import { CROPS, getItem, sellPrice } from '../data/items.js';
import { addItem, removeItem, countItem, addMoney, hasSpace } from '../core/state.js';
import { rng, hashStr } from '../core/rng.js';

export class Shops {
  constructor(game) {
    this.game = game;
    if (game.state.player.casinoCoins == null) game.state.player.casinoCoins = 0;
    if (!game.state.player.toolUpgrades) game.state.player.toolUpgrades = []; // {tool, level, readyAtDay}
  }
  shop(id) { return SHOPS.find((s) => s.id === id); }
  isOpen(id) {
    const g = this.game, s = this.shop(id);
    if (!s) return false;
    if (s.closedDays.includes(g.clock.weekDay)) return false;
    return g.clock.minute >= s.open[0] && g.clock.minute < s.open[1];
  }
  openText(id) {
    const s = this.shop(id);
    const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const closed = s.closedDays.length ? `（周${s.closedDays.map((d) => days[d]).join('、')}休）` : '（无休）';
    return `${fmt(s.open[0])}–${fmt(s.open[1])} ${closed}`;
  }
  // 库存解析（tag 展开 + 当日种子/随机货）
  stockFor(id) {
    const g = this.game, s = this.shop(id);
    const out = [];
    for (const st of s.stock) {
      if (st.seasons && !st.seasons.includes(g.clock.season)) continue;
      if (st.tag === 'seed') {
        for (const c of CROPS) {
          if (c.noShop || !c.seasons.includes(g.clock.season)) continue;
          out.push({ item: c.id + '_seeds', price: c.seed, qty: -1 });
        }
      } else if (st.tag === 'random') {
        out.push(...this.randomStock());
      } else {
        out.push({ item: st.item, price: st.price ?? getItem(st.item).price * 2, qty: st.qty ?? -1, currency: st.currency });
      }
    }
    return out;
  }
  // 旅行商人随机货：每天 10 种（种子随机 + 价格上浮）
  randomStock() {
    const g = this.game;
    const daySeed = hashStr('traveler' + g.clock.absoluteDay);
    const r = rng(daySeed);
    const pool = ['fert_deluxe', 'soil_deluxe', 'gro_hyper', 'coffee', 'pizza', 'battery', 'hardwood', 'geode', 'amethyst', 'topaz', 'jade', 'ruby', 'honey', 'cloth', 'bomb1', 'bomb2', 'coral', 'starfruit_seeds', 'ancientfruit_seeds', 'stardrop'];
    const picked = [];
    const used = new Set();
    while (picked.length < 10) {
      const id = pool[Math.floor(r() * pool.length)];
      if (used.has(id)) continue;
      used.add(id);
      let exists = true;
      try { getItem(id); } catch { exists = false; }
      if (!exists) continue;
      const base = getItem(id).price || 100;
      picked.push({ item: id, price: Math.max(50, Math.floor(base * (1.5 + r() * 2))), qty: r() < 0.3 ? 5 : 1 });
    }
    return picked;
  }
  // 购买
  buy(shopId, itemId, price, qty = 1, currency = 'gold') {
    const g = this.game;
    const cost = price * qty;
    if (currency === 'coin') {
      if (g.state.player.casinoCoins < cost) { g.audio.sfx('error'); return false; }
      g.state.player.casinoCoins -= cost;
    } else {
      if (g.state.player.money < cost) { g.audio.sfx('error'); g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), '钱不够…', '#E84A4A', 13); return false; }
      addMoney(g.state, -cost);
    }
    // 动物购买走畜牧系统
    if (['chicken', 'duck', 'cow', 'goat', 'sheep', 'pig', 'rabbit'].includes(itemId)) {
      g.bus.emit('buy-animal', itemId);
    } else if (itemId === 'fiberglass_rod' || itemId === 'iridium_rod') {
      // 鱼竿替换：旧竿移除，新竿入包
      addItem(g.state, itemId, 1, 0);
      g.state.player.tools.fishingrod = getItem(itemId).rodTier;
    } else {
      const left = addItem(g.state, itemId, qty, 0);
      if (left > 0) { g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), '背包满了！', '#E84A4A', 13); }
    }
    g.audio.sfx('buy');
    g.state.player.stats.spent += 0; // addMoney 已记
    g.bus.emit('shop-buy', { shopId, itemId, qty, price });
    g.ui.refreshToolbar();
    return true;
  }
  // 出售（全价，同出货箱）
  sell(slotIdx, qty = 1) {
    const g = this.game;
    const s = g.state.player.inventory[slotIdx];
    if (!s) return false;
    const p = sellPrice(s.id, s.quality);
    if (p <= 0) { g.audio.sfx('error'); return false; }
    qty = Math.min(qty, s.qty);
    addMoney(g.state, p * qty);
    s.qty -= qty;
    if (s.qty <= 0) g.state.player.inventory[slotIdx] = null;
    g.audio.sfx('coin');
    g.ui.refreshToolbar();
    return true;
  }
  // 背包扩容
  buyBackpack() {
    const g = this.game;
    const cur = g.state.player.invSize;
    const next = cur < 24 ? { slots: 24, price: 2000 } : cur < 36 ? { slots: 36, price: 10000 } : null;
    if (!next) { g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), '背包已是最大', '#B8C0D8', 12); return false; }
    if (g.state.player.money < next.price) { g.audio.sfx('error'); return false; }
    addMoney(g.state, -next.price);
    g.state.player.invSize = next.slots;
    g.audio.sfx('levelup');
    g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), `背包扩容到 ${next.slots} 格！`, '#FFD98A', 14);
    return true;
  }
  // 工具升级（铁匠：材料×5+钱，2天后取）
  upgradeTool(toolId) {
    const g = this.game;
    const cur = g.state.player.tools[toolId] || 0;
    if (cur >= 4) { g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), '已是最高级', '#B8C0D8', 12); return false; }
    if (g.state.player.toolUpgrades.find((u) => u.tool === toolId)) { g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), '升级中，两天后取', '#B8C0D8', 12); return false; }
    const up = this.shop('blacksmith').upgrades.find((u) => u.level === cur + 1);
    if (countItem(g.state, up.material) < up.qty) { g.audio.sfx('error'); g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), `需要 ${getItem(up.material).name}×${up.qty}`, '#E84A4A', 12); return false; }
    if (g.state.player.money < up.price) { g.audio.sfx('error'); g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), '钱不够…', '#E84A4A', 12); return false; }
    removeItem(g.state, up.material, up.qty);
    addMoney(g.state, -up.price);
    // 工具暂时收走（除水壶/鱼竿这类生存必需？对标 SDV 全收走）
    g.state.player.toolUpgrades.push({ tool: toolId, level: up.level, readyAtDay: g.clock.absoluteDay + up.days });
    const slot = g.state.player.inventory.findIndex((s) => s && s.id === toolId);
    if (slot >= 0) g.state.player.inventory[slot] = null;
    g.audio.sfx('buy');
    g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), `${getItem(toolId).name}交给铁匠了，两天后取`, '#FFD98A', 13);
    g.ui.refreshToolbar();
    return true;
  }
  collectTool() {
    const g = this.game;
    const ready = g.state.player.toolUpgrades.filter((u) => g.clock.absoluteDay >= u.readyAtDay);
    if (!ready.length) return [];
    for (const u of ready) {
      g.state.player.tools[u.tool] = u.level;
      addItem(g.state, u.tool, 1, 0);
      g.state.player.toolUpgrades = g.state.player.toolUpgrades.filter((x) => x !== u);
      g.audio.sfx('levelup');
    }
    g.ui.refreshToolbar();
    return ready.map((u) => u.tool);
  }
  pendingTools() { return this.game.state.player.toolUpgrades.filter((u) => this.game.clock.absoluteDay < u.readyAtDay); }
  // 赌场兑换
  exchange(gold) {
    const g = this.game;
    if (g.state.player.money < gold) { g.audio.sfx('error'); return false; }
    addMoney(g.state, -gold);
    g.state.player.casinoCoins += Math.floor(gold / 10);
    g.audio.sfx('coin');
    return true;
  }
  // 老虎机（运气影响）：返奖表
  slotSpin(bet) {
    const g = this.game;
    if (g.state.player.casinoCoins < bet) return null;
    g.state.player.casinoCoins -= bet;
    const luck = g.state.player.luck;
    const symbols = ['🍒', '🔔', '★', '💎', '7️⃣'];
    const weights = [30, 25, 20, 15, 10].map((w, i) => w * (1 + (i - 2) * luck * 2));
    const spin = () => {
      let sum = weights.reduce((a, b) => a + b, 0), rr = Math.random() * sum;
      for (let i = 0; i < 5; i++) { rr -= weights[i]; if (rr <= 0) return i; }
      return 0;
    };
    const reels = [spin(), spin(), spin()];
    let payout = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) payout = bet * [3, 5, 10, 25, 100][reels[0]];
    else if (reels[0] === reels[1] || reels[1] === reels[2]) payout = Math.floor(bet * 1.5);
    g.state.player.casinoCoins += payout;
    if (payout > 0) g.audio.sfx('coin'); else g.audio.sfx('escape');
    return { reels: reels.map((i) => symbols[i]), payout };
  }
  // 21点（简化规则）
  blackjackDeal(bet) {
    const g = this.game;
    if (g.state.player.casinoCoins < bet) return null;
    g.state.player.casinoCoins -= bet;
    const deck = [];
    for (let i = 0; i < 4; i++) for (let v = 1; v <= 13; v++) deck.push(v);
    const draw = () => deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
    const bj = { bet, player: [draw(), draw()], dealer: [draw(), draw()], draw, done: false, result: null };
    this.bj = bj;
    return bj;
  }
  bjValue(hand) {
    let sum = 0, aces = 0;
    for (const c of hand) { if (c === 1) { aces++; sum += 11; } else sum += Math.min(10, c); }
    while (sum > 21 && aces > 0) { sum -= 10; aces--; }
    return sum;
  }
  bjHit() {
    const bj = this.bj;
    if (!bj || bj.done) return bj;
    bj.player.push(bj.draw());
    if (this.bjValue(bj.player) > 21) this.bjStand();
    return bj;
  }
  bjStand() {
    const g = this.game, bj = this.bj;
    if (!bj || bj.done) return bj;
    while (this.bjValue(bj.dealer) < 17) bj.dealer.push(bj.draw());
    const pv = this.bjValue(bj.player), dv = this.bjValue(bj.dealer);
    let win = 0;
    if (pv > 21) win = 0;
    else if (dv > 21 || pv > dv) win = bj.bet * 2;
    else if (pv === dv) win = bj.bet;
    g.state.player.casinoCoins += win;
    bj.done = true;
    bj.result = win > bj.bet ? 'win' : win === bj.bet ? 'push' : 'lose';
    if (bj.result === 'win') g.audio.sfx('coin');
    return bj;
  }
  serialize() {}
  deserialize() {}
}
