// 任务系统：常驻任务日志 + 前7天教学链 + 公告板日常任务
import * as THREE from 'three';
import { getItem } from '../data/items.js';
import { addItem, addMoney, countItem, removeItem } from '../core/state.js';

// 任务定义：type: chain(教学链顺序触发) / board(公告板随机)
export const TUTORIAL_QUESTS = [
  {
    id: 'tut_1', name: '新的开始', day: 1,
    desc: '用锄头开垦 3 块土地，然后种下防风草种子。',
    hint: '选中锄头（数字键1），左键点击草地翻地；再选种子点击耕地。',
    goal: { type: 'tilled', count: 3 },
    reward: { money: 100 },
    intro: '欢迎来到晨风农场！先收拾出一块农田吧。',
  },
  {
    id: 'tut_2', name: '浇水与等待', day: 2,
    desc: '给作物浇水 3 次。雨天不用浇。',
    hint: '选中浇水壶（数字键2），点击耕地浇水。水壶空了去池塘灌水。',
    goal: { type: 'watered', count: 3 },
    reward: { item: 'fert_basic', qty: 2 },
    intro: '作物每天都需要水。去镇上杂货店看看？营业时间是 9:00–17:00。',
  },
  {
    id: 'tut_3', name: '矿井初探', day: 3,
    desc: '前往山路进入矿井，挖 5 块石头。',
    hint: '农场北边是山路，矿井入口在那里。带上镐（数字键4）。',
    goal: { type: 'mined', count: 5 },
    reward: { item: 'bomb1', qty: 3 },
    intro: '北边的旧矿井里全是石头和矿石——还有些不太友好的住户。',
  },
  {
    id: 'tut_4', name: '垂钓时光', day: 4,
    desc: '在任意水域钓上 1 条鱼。',
    hint: '选中鱼竿（数字键6）站在水边，按住左键蓄力，松开抛竿。咬钩后再按一次提竿。',
    goal: { type: 'fished', count: 1 },
    reward: { item: 'bait', qty: 10 },
    intro: '老船长说过：农场景塘里就有鲈鱼。去试试？',
  },
  {
    id: 'tut_5', name: '认识邻居', day: 5,
    desc: '和 3 位镇民说过话。',
    hint: '去汐溪镇（农场南边），靠近镇民按 E 对话。',
    goal: { type: 'talked', count: 3 },
    reward: { item: 'coffee', qty: 2 },
    intro: '汐溪镇的人都很好相处。送礼能更快成为朋友。',
  },
  {
    id: 'tut_6', name: '旧会馆', day: 6,
    desc: '去镇上的旧会馆看看，激活「修复小镇」长期目标。',
    hint: '旧会馆在镇广场北侧，调查发光的主祭坛。',
    goal: { type: 'cc_visit', count: 1 },
    reward: { money: 200 },
    intro: '镇北的旧会馆年久失修……听说里面有星星的孩子在等人。',
  },
  {
    id: 'tut_7', name: '第一桶金', day: 7,
    desc: '把收获放进出货箱，睡一晚拿到报酬。',
    hint: '出货箱在农舍旁边。手持作物按 E 投入。',
    goal: { type: 'shipped', count: 1 },
    reward: { item: 'sprinkler1', qty: 1 },
    intro: '从明天起，你就是一个真正的农场主了。',
  },
];

// 公告板日常任务模板
export const BOARD_TEMPLATES = [
  { id: 'board_deliver', name: '急需物资', gen: (g) => { const items = ['wood', 'stone', 'fiber', 'coal', 'copper_ore', 'hay']; const item = items[Math.floor(Math.random() * items.length)]; return { item, count: 10 + Math.floor(Math.random() * 10) * 5 }; }, text: (p) => `镇里建设需要 ${p.count} 个${getItem(p.item).name}。`, reward: (p) => ({ money: getItem(p.item).price * p.count * 2 + 50 }) },
  { id: 'board_fish', name: '尝鲜委托', gen: () => ({ count: 2 + Math.floor(Math.random() * 3) }), text: (p) => `酒吧想收 ${p.count} 条鲜鱼（任意种类）。`, reward: (p) => ({ money: 150 * p.count }) },
  { id: 'board_monster', name: '矿井清剿', gen: () => ({ count: 3 + Math.floor(Math.random() * 5) }), text: (p) => `清剿矿井怪物 ${p.count} 只，让矿工能安全作业。`, reward: (p) => ({ money: 120 * p.count }) },
  { id: 'board_crop', name: '新鲜直供', gen: () => ({ count: 3 + Math.floor(Math.random() * 5) }), text: (p) => `杂货店收购当季作物 ${p.count} 个（任意品种任意品质）。`, reward: (p) => ({ money: 100 * p.count }) },
];

export class Quests {
  constructor(game) {
    this.game = game;
    if (!game.state.quests.active) game.state.quests = { active: [], done: [] };
    if (game.state.quests.pinned === undefined) game.state.quests.pinned = null; // 置顶任务 id（存档随 state 序列化）
    // 事件 → 进度
    game.bus.on('crop-harvested', () => this.bump('harvested'));
    game.bus.on('fish-caught', () => this.bump('fished'));
    game.bus.on('monster-killed', () => this.bump('monsters'));
    game.bus.on('item-crafted', () => this.bump('crafted'));
    game.bus.on('day-start', () => this.onDayStart());
    this.counters = { tilled: 0, watered: 0, mined: 0, fished: 0, talked: 0, shipped: 0, monsters: 0, harvested: 0 };
    game.bus.on('tilled', () => this.bump('tilled'));
    game.bus.on('watered', () => this.bump('watered'));
    game.bus.on('node-broken', () => this.bump('mined'));
    game.bus.on('npc-talked', () => this.bump('talked'));
    game.bus.on('item-shipped', () => this.bump('shipped'));
  }
  startChainQuest(day) {
    const q = TUTORIAL_QUESTS.find((x) => x.day === day);
    if (!q) return null;
    const g = this.game;
    if (g.state.quests.done.includes(q.id) || g.state.quests.active.some((x) => x.id === q.id)) return null;
    g.state.quests.active.push({ ...q, progress: 0 });
    this.ensurePinned();
    g.ui.refreshQuestHint?.();
    g.ui.tutorial(`◆ 新任务「${q.name}」：${q.intro}`, 7000);
    g.bus.emit('quest-new', q.id);
    return q;
  }
  // 置顶：pinned 失效（空/已移除）时回退到第一个进行中任务
  ensurePinned() {
    const qs = this.game.state.quests;
    if (!qs.active.some((q) => q.id === qs.pinned)) qs.pinned = qs.active[0]?.id ?? null;
    return qs.pinned;
  }
  // 置顶指定任务（任务日志「置顶」按钮）
  pin(id) {
    const qs = this.game.state.quests;
    if (qs.active.some((q) => q.id === id)) qs.pinned = id;
    this.game.ui.refreshQuestHint?.();
  }
  bump(type, n = 1) {
    this.counters[type] = (this.counters[type] || 0) + n;
    const g = this.game;
    for (const q of g.state.quests.active) {
      if (q.goal.type === type || (q.goal.type === 'monsters' && type === 'monsters')) {
        q.progress = Math.min(q.goal.count, (q.progress || 0) + n);
        if (q.progress >= q.goal.count) this.complete(q.id);
        else g.ui.refreshQuestHint?.();
      }
      // 公告板：鱼/作物交付类在交付时结算（deliver 方法）
      if (q.goal.type === 'fish_any' && type === 'fished') {
        q.progress = Math.min(q.goal.count, (q.progress || 0) + n);
        if (q.progress >= q.goal.count) this.complete(q.id);
      }
      if (q.goal.type === 'crop_any' && type === 'harvested') {
        q.progress = Math.min(q.goal.count, (q.progress || 0) + n);
        if (q.progress >= q.goal.count) this.complete(q.id);
      }
    }
  }
  complete(id) {
    const g = this.game;
    const idx = g.state.quests.active.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const q = g.state.quests.active[idx];
    g.state.quests.active.splice(idx, 1);
    g.state.quests.done.push(id);
    this.ensurePinned();
    g.ui.refreshQuestHint?.();
    if (q.reward?.money) addMoney(g.state, q.reward.money);
    if (q.reward?.item) addItem(g.state, q.reward.item, q.reward.qty || 1, 0);
    g.audio.sfx('levelup');
    g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), `√ 完成任务「${q.name}」`, '#FFD98A', 15);
    g.bus.emit('quest-done', id);
  }
  onDayStart() {
    const g = this.game;
    // 公告板任务过期
    for (const q of [...g.state.quests.active]) {
      if (q.expires && g.clock.absoluteDay > q.expires) {
        g.state.quests.active = g.state.quests.active.filter((x) => x !== q);
        g.ui.tutorial(`任务「${q.name}」已过期`, 3000);
      }
    }
    this.ensurePinned();
    g.ui.refreshQuestHint?.();
    // 公告板刷新（每天1-2个，最多挂3个）
    const boardCount = g.state.quests.active.filter((q) => q.board).length;
    if (boardCount < 2 && Math.random() < 0.7) this.genBoardQuest();
  }
  genBoardQuest() {
    const g = this.game;
    const tpl = BOARD_TEMPLATES[Math.floor(Math.random() * BOARD_TEMPLATES.length)];
    const params = tpl.gen(g);
    const q = {
      id: tpl.id + '_' + g.clock.absoluteDay,
      board: true,
      name: tpl.name,
      desc: tpl.text(params),
      goal: tpl.id === 'board_deliver' ? { type: 'deliver', item: params.item, count: params.count }
        : tpl.id === 'board_fish' ? { type: 'fish_any', count: params.count }
        : tpl.id === 'board_monster' ? { type: 'monsters', count: params.count }
        : { type: 'crop_any', count: params.count },
      reward: tpl.reward(params),
      expires: g.clock.absoluteDay + 2,
      progress: 0,
    };
    if (g.state.quests.active.some((x) => x.id === q.id)) return;
    g.state.quests.active.push(q);
    this.ensurePinned();
    g.ui.refreshQuestHint?.();
  }
  // 公告板交付类任务：在公告板交互交付
  deliverItems() {
    const g = this.game;
    let done = 0;
    for (const q of [...g.state.quests.active]) {
      if (q.goal.type !== 'deliver') continue;
      if (countItem(g.state, q.goal.item) >= q.goal.count) {
        removeItem(g.state, q.goal.item, q.goal.count);
        this.complete(q.id);
        done++;
      }
    }
    if (!done) g.ui.tutorial('公告板：没有可交付的任务物资', 2500);
    return done;
  }
  serialize() { this.game.state.quests.counters = this.counters; }
  deserialize() { this.counters = this.game.state.quests.counters || this.counters; this.ensurePinned(); this.game.ui.refreshQuestHint?.(); }
}
