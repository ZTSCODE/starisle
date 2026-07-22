// 怪物数据表：数值对标 docs/research/sdv-systems.md §2.4（绿史莱姆 24/5、蝙蝠 24/6、幽灵 96/10、暗影狂徒 160/18 等量级）。
// floors: [起始层, 结束层]，矿井共 1–80 层；behavior: chaser/flyer/jumper/shooter/lurker；
// drops: [{ item(物品id), chance(0-1), qty:[min,max] }]；color 为渲染主色，size 为相对体型倍率。
export const MONSTERS = [
  // ── 史莱姆 ×3 色（土层/冰层/熔岩层递进） ──────────────────
  { id: 'slime_green', name: '绿史莱姆',   floors: [1, 19],  hp: 24,  atk: 5,  def: 1, speed: 2, xp: 3,  behavior: 'chaser',
    drops: [{ item: 'sap', chance: 0.15, qty: [1, 2] }, { item: 'fiber', chance: 0.10, qty: [1, 1] }], color: 0x58c24a, size: 1.0 },
  { id: 'slime_blue',  name: '冰蓝史莱姆', floors: [27, 53], hp: 106, atk: 7,  def: 0, speed: 2, xp: 6,  behavior: 'chaser',
    drops: [{ item: 'sap', chance: 0.50, qty: [1, 2] }, { item: 'coal', chance: 0.10, qty: [1, 1] }, { item: 'jade', chance: 0.02, qty: [1, 1] }], color: 0x4aa8e0, size: 1.1 },
  { id: 'slime_red',   name: '熔红史莱姆', floors: [54, 80], hp: 205, atk: 16, def: 0, speed: 2, xp: 10, behavior: 'chaser',
    drops: [{ item: 'sap', chance: 0.50, qty: [1, 2] }, { item: 'coal', chance: 0.15, qty: [1, 2] }, { item: 'diamond', chance: 0.01, qty: [1, 1] }], color: 0xd84a3a, size: 1.2 },
  // ── 岩蟹（伪装成石头的伏击者） ──────────────────────────
  { id: 'rock_crab',   name: '岩蟹',       floors: [1, 26],  hp: 30,  atk: 5,  def: 3, speed: 1, xp: 4,  behavior: 'lurker',
    drops: [{ item: 'stone', chance: 0.60, qty: [1, 3] }, { item: 'copper_ore', chance: 0.15, qty: [1, 2] }, { item: 'earth_crystal', chance: 0.04, qty: [1, 1] }], color: 0x8a7f70, size: 1.0 },
  // ── 蝙蝠 ×2 ─────────────────────────────────────────────
  { id: 'bat',         name: '洞穴蝙蝠',   floors: [21, 39], hp: 24,  atk: 6,  def: 1, speed: 3, xp: 3,  behavior: 'flyer',
    drops: [{ item: 'fiber', chance: 0.25, qty: [1, 2] }, { item: 'coal', chance: 0.20, qty: [1, 1] }], color: 0x6b5a7a, size: 0.9 },
  { id: 'frost_bat',   name: '霜翼蝙蝠',   floors: [40, 59], hp: 36,  atk: 7,  def: 1, speed: 3, xp: 7,  behavior: 'flyer',
    drops: [{ item: 'coal', chance: 0.25, qty: [1, 2] }, { item: 'tear_crystal', chance: 0.03, qty: [1, 1] }], color: 0x9fd4e8, size: 0.9 },
  // ── 幽灵（无视障碍直线飘行） ────────────────────────────
  { id: 'ghost',       name: '地缚幽灵',   floors: [41, 59], hp: 96,  atk: 10, def: 3, speed: 4, xp: 15, behavior: 'flyer',
    drops: [{ item: 'gold_ore', chance: 0.20, qty: [1, 3] }, { item: 'quartz', chance: 0.08, qty: [1, 1] }, { item: 'tear_crystal', chance: 0.05, qty: [1, 1] }], color: 0xd8e8f0, size: 1.1 },
  // ── 暗影怪 / 鱿鱼娃（深层） ──────────────────────────────
  { id: 'shadow_brute', name: '暗影狂徒',  floors: [61, 80], hp: 160, atk: 18, def: 2, speed: 3, xp: 15, behavior: 'chaser',
    drops: [{ item: 'coal', chance: 0.40, qty: [1, 2] }, { item: 'iridium_ore', chance: 0.06, qty: [1, 1] }, { item: 'ruby', chance: 0.02, qty: [1, 1] }], color: 0x2a2438, size: 1.3 },
  { id: 'squid_kid',   name: '鱿鱼娃',     floors: [71, 80], hp: 1,   atk: 18, def: 2, speed: 3, xp: 15, behavior: 'shooter',
    drops: [{ item: 'gold_ore', chance: 0.20, qty: [1, 2] }, { item: 'quartz', chance: 0.10, qty: [1, 1] }], color: 0xd88ab8, size: 0.8 },
  // ── 甲虫 / 跳岩虫 ───────────────────────────────────────
  { id: 'cave_bug',    name: '矿甲虫',     floors: [1, 29],  hp: 1,   atk: 8,  def: 0, speed: 2, xp: 1,  behavior: 'flyer',
    drops: [{ item: 'sap', chance: 0.50, qty: [1, 1] }, { item: 'fiber', chance: 0.30, qty: [1, 2] }], color: 0x7a6a4a, size: 0.7 },
  { id: 'rock_hopper', name: '跳岩虫',     floors: [21, 49], hp: 50,  atk: 9,  def: 1, speed: 4, xp: 8,  behavior: 'jumper',
    drops: [{ item: 'stone', chance: 0.50, qty: [1, 2] }, { item: 'iron_ore', chance: 0.10, qty: [1, 1] }], color: 0xb0905a, size: 0.8 },
];
