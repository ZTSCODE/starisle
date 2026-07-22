// 成就系统：事件驱动 + 周期扫描，解锁 toast + 金边提示
import { ACHIEVEMENTS } from '../data/achievements.js';
import { skillLevel } from '../core/state.js';

export class Achievements {
  constructor(game) {
    this.game = game;
    if (!game.state.achievements) game.state.achievements = [];
    this.timer = 0;
    // 事件触发即时检查
    for (const ev of ['item-gained', 'fish-caught', 'monster-killed', 'crop-harvested', 'bundle-done', 'room-done', 'money-changed', 'dish-cooked', 'item-crafted', 'mine-enter']) {
      game.bus.on(ev, () => this.checkAll());
    }
  }
  unlocked(id) { return this.game.state.achievements.includes(id); }
  checkAll() {
    const g = this.game, st = g.state.player.stats;
    for (const a of ACHIEVEMENTS) {
      if (this.unlocked(a.id)) continue;
      if (this.evaluate(a.check, st)) this.unlock(a);
    }
  }
  evaluate(c, st) {
    const g = this.game;
    switch (c.type) {
      case 'money_total': return st.earned >= c.value;
      case 'item_shipped': return st.shipped >= c.value;
      case 'fish_count': return st.fished >= c.value;
      case 'mine_depth': return st.deepestMine >= c.value;
      case 'skill_total': return ['farming', 'mining', 'foraging', 'fishing', 'combat'].reduce((n, s) => n + skillLevel(g.state, s), 0) >= c.value;
      case 'friend_hearts': return Object.values(g.state.npcs).some((n) => (n.friendship || 0) >= c.value * 250);
      case 'quests_done': return (g.state.quests.done || []).length >= c.value;
      case 'bundles_done': return g.bundles ? g.bundles.totalDone() >= c.value : false;
      case 'crops_shipped_variety': return Object.keys(st.cropsShipped || {}).length >= c.value;
      case 'steps': return st.steps >= c.value;
      case 'animals': return (g.state.animals?.list || []).length >= c.value;
      case 'cook_count': return (st.cooked || 0) >= c.value;
      case 'craft_count': return (st.crafted || 0) >= c.value;
      case 'monster_kills': return st.monstersKilled >= c.value;
      case 'museum': return Object.keys(g.state.codex.minerals || {}).length >= c.value;
      case 'fish_all': return Object.keys(g.state.codex.fish).length >= c.value;
      default: return false;
    }
  }
  unlock(a) {
    const g = this.game;
    g.state.achievements.push(a.id);
    g.audio.sfx('levelup');
    // 全屏金边 toast
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;left:50%;top:18%;transform:translateX(-50%);padding:14px 32px;background:linear-gradient(135deg,rgba(60,45,10,0.95),rgba(30,25,8,0.95));border:2px solid #FFD98A;border-radius:8px;color:#FFD98A;font-size:16px;z-index:300;box-shadow:0 0 30px #FFD98A66;text-align:center;transition:opacity .8s, top .8s`;
    el.innerHTML = `<div style="font-size:12px;color:#E8C469">★ 成就解锁</div><div style="font-size:18px;font-weight:bold;margin-top:2px">${a.name}</div><div style="font-size:12px;opacity:.85;margin-top:2px">${a.desc}</div>`;
    document.getElementById('ui').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.top = '12%'; }, 2600);
    setTimeout(() => el.remove(), 3600);
    g.bus.emit('achievement-unlocked', a.id);
  }
  update(dt) {
    this.timer += dt;
    if (this.timer > 5) { this.timer = 0; this.checkAll(); }
  }
  serialize() {}
  deserialize() {}
}
