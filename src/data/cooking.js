// 料理数据包（纯数据）：菜谱 + 每道菜注册为 food 物品（edible）。
// 回复量对标 docs/research/sdv-core.md §4.1（生命≈能量×0.45）与 sdv-systems.md §7.5；
// buff 时长为游戏分钟（酱料女皇周数 1–56；friendship 的 npc id 与 npcs.js 一致）。
// ingredients 支持 {item,qty} 或 {any:'fish'|'egg'|'milk'|'vegetable'|'fruit',qty}（对标 SDV"任意某类"原料）。
import { registerItem } from './items.js';

// ── 烹饪原料（杂货店常年有售，定价对标调研 §5.2：面粉/糖 100、米/油/醋 200 买进） ──
registerItem('flour', '面粉', 'resource', 50);
registerItem('sugar', '糖', 'resource', 50);
registerItem('rice', '大米', 'resource', 100);
registerItem('oil', '油', 'resource', 100);
registerItem('vinegar', '醋', 'resource', 100);

export const COOKING = [
  // ── 早餐/家常 ────────────────────────────────────────────
  { id: 'fried_egg', name: '煎蛋', ingredients: [{ any: 'egg', qty: 1 }], energy: 50, health: 22, unlock: { queen: 1 }, price: 35 },
  { id: 'baked_potato', name: '烤土豆', ingredients: [{ item: 'potato', qty: 1 }], energy: 60, health: 27, unlock: { queen: 2 }, price: 100 },
  { id: 'salad', name: '沙拉', ingredients: [{ any: 'vegetable', qty: 2 }, { item: 'vinegar', qty: 1 }], energy: 113, health: 50, unlock: { queen: 3 }, price: 110 },
  { id: 'survival_burger', name: '求生汉堡', ingredients: [{ item: 'bread', qty: 1 }, { any: 'vegetable', qty: 2 }], energy: 125, health: 56, unlock: { skill: 'foraging', level: 8 }, price: 180 }, // 对标 SDV 觅食 8 级解锁
  { id: 'complete_breakfast', name: '全套早餐', ingredients: [{ item: 'fried_egg', qty: 1 }, { item: 'baked_potato', qty: 1 }, { item: 'bread', qty: 1 }], energy: 200, health: 90, buff: { type: 'energy_max', value: 50, minutes: 600 }, unlock: { queen: 12 }, price: 350 },

  // ── 技能解锁（对标调研 §3：农夫午餐=耕种3/矿工特供=采矿3/海鲜汤=钓鱼3/根茎拼盘=战斗3） ──
  { id: 'farmers_lunch', name: '农夫午餐', ingredients: [{ any: 'egg', qty: 1 }, { item: 'parsnip', qty: 1 }], energy: 200, health: 90, buff: { type: 'farming', value: 2, minutes: 300 }, unlock: { skill: 'farming', level: 3 }, price: 150 },
  { id: 'miners_treat', name: '矿工特供', ingredients: [{ any: 'vegetable', qty: 2 }, { item: 'sugar', qty: 1 }, { any: 'milk', qty: 1 }], energy: 125, health: 56, buff: { type: 'mining', value: 3, minutes: 300 }, unlock: { skill: 'mining', level: 3 }, price: 200 },
  { id: 'seafood_soup', name: '海鲜汤', ingredients: [{ any: 'fish', qty: 2 }], energy: 150, health: 67, buff: { type: 'fishing', value: 3, minutes: 300 }, unlock: { skill: 'fishing', level: 3 }, price: 220 },
  { id: 'roots_platter', name: '根茎拼盘', ingredients: [{ item: 'potato', qty: 1 }, { item: 'yam', qty: 1 }], energy: 125, health: 56, buff: { type: 'defense', value: 3, minutes: 300 }, unlock: { skill: 'combat', level: 3 }, price: 100 },

  // ── 鱼类料理 ────────────────────────────────────────────
  { id: 'grilled_fish', name: '烤鱼', ingredients: [{ any: 'fish', qty: 1 }], energy: 100, health: 45, unlock: { friendship: 'willy', hearts: 3 }, price: 120 },
  { id: 'sashimi', name: '生鱼片', ingredients: [{ any: 'fish', qty: 1 }], energy: 75, health: 33, unlock: { friendship: 'willy', hearts: 5 }, price: 75 },
  { id: 'maki_roll', name: '生鱼寿司', ingredients: [{ any: 'fish', qty: 1 }, { item: 'rice', qty: 1 }], energy: 100, health: 45, unlock: { queen: 26 }, price: 220 },
  { id: 'seafood_platter', name: '海鲜拼盘', ingredients: [{ any: 'fish', qty: 2 }, { item: 'oil', qty: 1 }], energy: 225, health: 101, unlock: { queen: 34 }, price: 300 },
  { id: 'spicy_eel', name: '辣鳗鱼', ingredients: [{ item: 'eel', qty: 1 }, { item: 'hotpepper', qty: 1 }], energy: 115, health: 51, buff: { type: 'luck', value: 1, minutes: 480 }, unlock: { friendship: 'gus', hearts: 7 }, price: 175 },

  // ── 素菜/汤/主食 ─────────────────────────────────────────
  { id: 'stir_fry', name: '蔬菜杂烩', ingredients: [{ any: 'vegetable', qty: 2 }, { item: 'oil', qty: 1 }], energy: 200, health: 90, unlock: { queen: 8 }, price: 335 },
  { id: 'pumpkin_soup', name: '南瓜汤', ingredients: [{ item: 'pumpkin', qty: 1 }, { any: 'milk', qty: 1 }], energy: 200, health: 90, buff: { type: 'luck', value: 2, minutes: 480 }, unlock: { friendship: 'robin', hearts: 7 }, price: 300 },
  { id: 'fried_mushroom', name: '炒蘑菇', ingredients: [{ item: 'pine_mushroom', qty: 2 }, { item: 'oil', qty: 1 }], energy: 135, health: 60, unlock: { queen: 30 }, price: 200 },
  { id: 'super_meal', name: '超级大餐', ingredients: [{ item: 'bokchoy', qty: 1 }, { item: 'cranberry', qty: 1 }, { item: 'artichoke', qty: 1 }], energy: 160, health: 72, buff: { type: 'energy_max', value: 40, minutes: 480 }, unlock: { queen: 10 }, price: 220 },
  { id: 'lucky_lunch', name: '幸运午餐', ingredients: [{ item: 'bluejazz', qty: 1 }, { item: 'corn', qty: 1 }, { any: 'fish', qty: 1 }], energy: 100, health: 45, buff: { type: 'luck', value: 3, minutes: 960 }, unlock: { queen: 14 }, price: 250 },

  // ── 甜点/果酱 ────────────────────────────────────────────
  { id: 'blueberry_pie', name: '蓝莓派', ingredients: [{ item: 'blueberry', qty: 1 }, { item: 'flour', qty: 1 }, { item: 'sugar', qty: 1 }, { any: 'egg', qty: 1 }], energy: 125, health: 56, unlock: { queen: 18 }, price: 150 },
  { id: 'cranberry_sauce', name: '蔓越莓酱', ingredients: [{ item: 'cranberry', qty: 1 }, { item: 'sugar', qty: 1 }], energy: 125, health: 56, buff: { type: 'mining', value: 2, minutes: 240 }, unlock: { queen: 22 }, price: 120 },
];

// 每道菜注册为可食用食物（buff 一并写入 extra，供食用系统读取）
for (const c of COOKING) {
  registerItem(c.id, c.name, 'food', c.price, { edible: true, energy: c.energy, health: c.health, ...(c.buff ? { buff: c.buff } : {}) });
}
