// 矿石与宝石数据表：层段分布对标 docs/research/sdv-systems.md §2.3（铜浅层/铁中层/金深层/宝石按层段），按本矿洞 1–80 层折算。
// floors: [起始层, 结束层]；nodesFrom: 产出该物的矿点类型（stone=普通石头概率掉，xxxNode=专属矿点）；gem: true 为宝石。
import { registerItem } from './items.js';

export const ORES = [
  // ── 金属矿石 ×4 ─────────────────────────────────────────
  { id: 'copper_ore',  name: '铜矿石', floors: [2, 26],  nodesFrom: 'copperNode',  price: 5,   xp: 5 },
  { id: 'iron_ore',    name: '铁矿石', floors: [27, 53], nodesFrom: 'ironNode',    price: 10,  xp: 12 },
  { id: 'gold_ore',    name: '金矿石', floors: [54, 80], nodesFrom: 'goldNode',    price: 25,  xp: 18 },
  { id: 'iridium_ore', name: '铱矿石', floors: [61, 80], nodesFrom: 'iridiumNode', price: 100, xp: 50 },
  // ── 煤（items.js 已注册为 resource，此处仅登记矿洞分布数据） ──
  { id: 'coal',        name: '煤',     floors: [1, 80],  nodesFrom: 'stone',       price: 15,  xp: 5 },
  // ── 宝石 ×8 ─────────────────────────────────────────────
  { id: 'quartz',        name: '石英',   floors: [1, 80],  nodesFrom: 'stone',         price: 25,  xp: 8,  gem: true },
  { id: 'earth_crystal', name: '地晶',   floors: [1, 29],  nodesFrom: 'stone',         price: 50,  xp: 8,  gem: true },
  { id: 'amethyst',      name: '紫晶',   floors: [1, 26],  nodesFrom: 'amethystNode',  price: 100, xp: 16, gem: true },
  { id: 'topaz',         name: '黄玉',   floors: [1, 26],  nodesFrom: 'topazNode',     price: 80,  xp: 16, gem: true },
  { id: 'jade',          name: '翡翠',   floors: [27, 53], nodesFrom: 'jadeNode',      price: 200, xp: 24, gem: true },
  { id: 'tear_crystal',  name: '泪晶',   floors: [27, 53], nodesFrom: 'tearNode',      price: 150, xp: 24, gem: true },
  { id: 'ruby',          name: '红宝石', floors: [54, 80], nodesFrom: 'rubyNode',      price: 250, xp: 32, gem: true },
  { id: 'diamond',       name: '钻石',   floors: [54, 80], nodesFrom: 'diamondNode',   price: 750, xp: 40, gem: true },
];

// 金属锭：熔炉 5 矿石 + 1 煤熔炼（对标调研 §7.6），售价 60/120/250/1500
export const BARS = [
  { id: 'copper_bar',  name: '铜锭', from: 'copper_ore',  price: 60 },
  { id: 'iron_bar',    name: '铁锭', from: 'iron_ore',    price: 120 },
  { id: 'gold_bar',    name: '金锭', from: 'gold_ore',    price: 250 },
  { id: 'iridium_bar', name: '铱锭', from: 'iridium_ore', price: 1500 },
];

for (const o of ORES) {
  if (o.id === 'coal') continue; // 煤已在 items.js 基础资源段注册，不重复登记
  registerItem(o.id, o.name, o.gem ? 'gem' : 'ore', o.price);
}
for (const b of BARS) {
  registerItem(b.id, b.name, 'bar', b.price);
}
