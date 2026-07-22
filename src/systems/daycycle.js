// 日循环：天气机 / 运气 / 睡觉结算 / 昏倒 / 出货结算
import { addMoney, restoreEnergy } from '../core/state.js';
import { sellPrice } from '../data/items.js';

const WEATHER_TABLE = {
  0: [['sunny', 55], ['cloudy', 15], ['wind', 10], ['rain', 17], ['storm', 3]],
  1: [['sunny', 60], ['cloudy', 10], ['wind', 8], ['rain', 15], ['storm', 7]],
  2: [['sunny', 50], ['cloudy', 20], ['wind', 15], ['rain', 13], ['storm', 2]],
  3: [['sunny', 30], ['cloudy', 15], ['snow', 50], ['wind', 5]],
};
export const WEATHER_CN = { sunny: '晴', cloudy: '多云', wind: '大风', rain: '雨', storm: '暴雨', snow: '雪' };

export function rollWeather(season, absoluteDay, festivalDays = []) {
  if (festivalDays.includes(absoluteDay + 1)) return 'sunny'; // 节日必晴
  if (season === 0 && absoluteDay + 1 === 3) return 'rain';    // 春3必雨（教学）
  const table = WEATHER_TABLE[season];
  let r = Math.random() * 100;
  for (const [w, p] of table) { if (r < p) return w; r -= p; }
  return 'sunny';
}
export function rollLuck() { return Math.round((Math.random() * 0.2 - 0.1) * 1000) / 1000; }

export class DayCycle {
  constructor(game) {
    this.game = game;
    this.sleeping = false;
    game.bus.on('overtime', () => this.passOut('熬夜到深夜，你昏倒了'));
    // 初始天气
    if (!game.state.weather.tomorrow) game.state.weather.tomorrow = rollWeather(game.clock.season, game.clock.absoluteDay);
    game.state.weather.today = rollWeather(game.clock.season, game.clock.absoluteDay - 1);
  }
  get isFestivalDay() { return this.game.festivals?.isFestivalDay?.(this.game.clock.absoluteDay) || false; }
  rollTomorrow() {
    const g = this.game;
    g.state.weather.tomorrow = rollWeather(g.clock.season, g.clock.absoluteDay, this.game.festivals?.festivalDays?.() || []);
  }
  // 出货箱：投入 held 物品（amount=1 或全部）
  depositShipping(state, slotIdx, all = false) {
    const inv = state.player.inventory;
    const s = inv[slotIdx];
    if (!s) return false;
    const it = sellPrice(s.id, s.quality);
    if (it <= 0) return false;
    const n = all ? s.qty : 1;
    if (!state.farm.shipping) state.farm.shipping = [];
    const ex = state.farm.shipping.find((x) => x.id === s.id && x.quality === s.quality);
    if (ex) ex.qty += n; else state.farm.shipping.push({ id: s.id, qty: n, quality: s.quality });
    s.qty -= n;
    if (s.qty <= 0) inv[slotIdx] = null;
    this.game.bus.emit('item-shipped', { id: s.id, qty: n });
    return true;
  }
  settleShipping() {
    const g = this.game, list = g.state.farm.shipping || [];
    let total = 0;
    const lines = list.map((s) => {
      const p = sellPrice(s.id, s.quality) * s.qty;
      total += p;
      return { id: s.id, qty: s.qty, quality: s.quality, price: p };
    });
    if (total > 0) {
      // 职业加成（耕作者+10%作物价在 sellPrice 处不含，结算时统一加成）
      addMoney(g.state, total);
      g.state.player.stats.shipped += list.reduce((n, s) => n + s.qty, 0);
    }
    g.state.farm.shipping = [];
    return { lines, total };
  }
  // 睡觉流程（UI 由 hud/menus 调用）
  async sleep() {
    const g = this.game;
    if (this.sleeping) return;
    this.sleeping = true;
    g.audio.sfx('sleep');
    await g.ui?.fade(true);
    // 出货结算
    const settlement = this.settleShipping();
    // 熬夜体力折扣
    const m = g.clock.minute;
    let penalty = 0;
    if (m >= 1440) penalty = Math.min(0.5, ((m - 1440) / 10) * 0.025 + 0.025); // 24:10 起每10分钟 -2.5%
    const exhausted = g.state.player.energy <= 0;
    if (exhausted) penalty = Math.max(penalty, 0.5);
    // 推进日期
    g.clock.advanceDay();
    // 新一天：天气/运气
    g.state.weather.today = g.state.weather.tomorrow;
    this.rollTomorrow();
    g.state.player.luck = rollLuck();
    g.bus.emit('weather-change', g.state.weather.today);
    // 体力恢复
    const target = Math.max(1, Math.round(g.state.player.maxEnergy * (1 - penalty)));
    g.state.player.energy = Math.min(g.state.player.maxEnergy, target);
    g.state.player.health = g.state.player.maxHealth;
    g.state.player.stats.daysPlayed++;
    // 存档
    g.save.autoSave(g);
    await g.ui?.showSettlement(settlement, { penalty });
    await g.ui?.fade(false);
    this.sleeping = false;
  }
  // 昏倒（熬夜/体力透支/生命归零）
  async passOut(reason) {
    const g = this.game;
    if (this.sleeping) return;
    this.sleeping = true;
    const inHouse = g.state.player.scene === 'farmhouse';
    let lost = 0;
    if (!inHouse) {
      lost = Math.min(1000, Math.floor(g.state.player.money * 0.1));
      if (lost > 0) addMoney(g.state, -lost);
    }
    g.audio.sfx('escape');
    await g.ui?.fade(true);
    g.clock.advanceDay();
    g.state.weather.today = g.state.weather.tomorrow;
    this.rollTomorrow();
    g.state.player.luck = rollLuck();
    g.bus.emit('weather-change', g.state.weather.today);
    g.state.player.energy = Math.max(1, Math.round(g.state.player.maxEnergy * 0.5));
    g.state.player.health = Math.round(g.state.player.maxHealth * 0.5);
    g.state.player.stats.daysPlayed++;
    if (g.scenes?.currentId !== 'farm') await g.scenes.switchTo('farm', [22, 14]);
    else g.player.teleport(22, 14);
    g.save.autoSave(g);
    await g.ui?.showPassOut(reason, lost);
    await g.ui?.fade(false);
    this.sleeping = false;
  }
  serialize() {}
  deserialize() {}
}
