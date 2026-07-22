// 成就数据包（纯数据）：阶梯对标 docs/research/sdv-core.md §5.4（收入 1.5万/5万/25万/100万/隐藏千万）
// 与 sdv-systems.md（钓鱼图鉴、矿井层数、怪物猎杀等）。
// icon 为物品 id（用于 UI 展示）；value 为达成阈值，'all' 表示"全部"类目标；hidden 未达成前不显示。
export const ACHIEVEMENTS = [
  // ── 累计收入阶梯 ×4 ──────────────────────────────────────
  { id: 'money_rookie', name: '新手万元户', desc: '累计收入达到 15,000 金', icon: 'parsnip', check: { type: 'money_total', value: 15000 } },
  { id: 'money_middle', name: '中产阶层', desc: '累计收入达到 50,000 金', icon: 'melon', check: { type: 'money_total', value: 50000 } },
  { id: 'money_rich', name: '农场富翁', desc: '累计收入达到 250,000 金', icon: 'starfruit', check: { type: 'money_total', value: 250000 } },
  { id: 'money_million', name: '百万富翁', desc: '累计收入达到 1,000,000 金', icon: 'ancientfruit', hidden: true, check: { type: 'money_total', value: 1000000 } },

  // ── 出货 ────────────────────────────────────────────────
  { id: 'ship_all', name: '全套出货', desc: '通过出货箱售出全部种类的物品', icon: 'chest', check: { type: 'item_shipped', value: 'all' } },

  // ── 钓鱼 ×3 ──────────────────────────────────────────────
  { id: 'fish_10', name: '入门钓手', desc: '钓到 10 种不同的鱼', icon: 'sashimi', check: { type: 'fish_count', value: 10 } },
  { id: 'fish_50', name: '老练渔夫', desc: '累计钓到 50 条鱼', icon: 'grilled_fish', check: { type: 'fish_count', value: 50 } },
  { id: 'fish_all', name: '鱼类图鉴大师', desc: '钓齐全部鱼种', icon: 'iridium_rod', check: { type: 'fish_count', value: 'all' } },

  // ── 矿井 ×2 ──────────────────────────────────────────────
  { id: 'mine_40', name: '深入地层', desc: '到达矿井第 40 层', icon: 'torch', check: { type: 'mine_depth', value: 40 } },
  { id: 'mine_80', name: '深渊行者', desc: '到达矿井第 80 层', icon: 'staircase', check: { type: 'mine_depth', value: 80 } },

  // ── 技能 ×2（五技能等级之和） ─────────────────────────────
  { id: 'skill_25', name: '全能学徒', desc: '五项技能全部达到 5 级', icon: 'field_snack', check: { type: 'skill_total', value: 25 } },
  { id: 'skill_50', name: '五艺宗师', desc: '五项技能全部达到 10 级', icon: 'scarecrow_deluxe', check: { type: 'skill_total', value: 50 } },

  // ── 社交 ×2 ──────────────────────────────────────────────
  { id: 'friend_4', name: '乡里熟人', desc: '与一位村民达到 4 心好感', icon: 'bouquet', check: { type: 'friend_hearts', value: 4 } },
  { id: 'friend_8', name: '挚友', desc: '与一位村民达到 8 心好感', icon: 'fairyrose', check: { type: 'friend_hearts', value: 8 } },

  // ── 收集包 ×2 ────────────────────────────────────────────
  { id: 'bundle_1', name: '第一份心意', desc: '完成 1 个收集包', icon: 'maple_syrup', check: { type: 'bundles_done', value: 1 } },
  { id: 'bundle_all', name: '社区之星', desc: '完成全部收集包', icon: 'crystalarium', check: { type: 'bundles_done', value: 'all' } },

  // ── 制造/烹饪/战斗/畜牧/探索 ──────────────────────────────
  { id: 'cook_10', name: '小厨神', desc: '累计烹饪 10 道料理', icon: 'complete_breakfast', check: { type: 'cook_count', value: 10 } },
  { id: 'craft_30', name: '能工巧匠', desc: '累计制造 30 件物品', icon: 'keg', check: { type: 'craft_count', value: 30 } },
  { id: 'kill_100', name: '怪物猎人', desc: '累计击败 100 只怪物', icon: 'sword', check: { type: 'monster_kills', value: 100 } },
  { id: 'chicken_4', name: '养鸡能手', desc: '同时饲养 4 只鸡', icon: 'incubator', check: { type: 'animals', value: 4 } },
  { id: 'steps_10k', name: '行万里路', desc: '累计行走 10,000 步', icon: 'cookout_kit', check: { type: 'steps', value: 10000 } },

  // ── 补充：任务/博物馆 ─────────────────────────────────────
  { id: 'quest_10', name: '热心肠', desc: '完成 10 个村民委托', icon: 'mermaid_pendant', check: { type: 'quests_done', value: 10 } },
  { id: 'museum_10', name: '收藏家', desc: '向博物馆捐赠 10 件藏品', icon: 'quartz', check: { type: 'museum', value: 10 } },
];
