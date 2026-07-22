// 畜牧数据包（纯数据 + 物品注册）：动物 / 建筑 / 加工机器配方。
// 数值对标 docs/research/sdv-systems.md §3（stardewvalleywiki.com/Animals）；
// 动物 id 与 shops.js 牧场货架一致（chicken/duck/cow/goat/sheep/pig/rabbit，由本包注册）。
// 机器物品本体（mayonnaise_machine/cheese_press）已由 recipes.js 注册，此处只引用。
import { registerItem } from './items.js';

// ── 活体动物（type 'animal'，creature 标记；购买入口=玛妮牧场/调试） ──
registerItem('chicken', '鸡', 'animal', 800, { stack: 1, creature: true });
registerItem('duck', '鸭', 'animal', 1200, { stack: 1, creature: true });
registerItem('cow', '牛', 'animal', 1500, { stack: 1, creature: true });
registerItem('goat', '山羊', 'animal', 4000, { stack: 1, creature: true });
registerItem('sheep', '绵羊', 'animal', 8000, { stack: 1, creature: true });
registerItem('pig', '猪', 'animal', 16000, { stack: 1, creature: true });
registerItem('rabbit', '兔子', 'animal', 8000, { stack: 1, creature: true });

// ── 动物产出（type 'animal'；cat 供料理 any:'egg'|'milk' 匹配） ──
registerItem('egg', '鸡蛋', 'animal', 50, { cat: 'egg', edible: true, energy: 20 });
registerItem('egg_large', '大鸡蛋', 'animal', 95, { cat: 'egg', edible: true, energy: 40 });
registerItem('duck_egg', '鸭蛋', 'animal', 95, { cat: 'egg', edible: true, energy: 30 });
registerItem('duck_feather', '鸭毛', 'animal', 250);
registerItem('milk', '牛奶', 'animal', 125, { cat: 'milk', edible: true, energy: 30 });
registerItem('milk_large', '大瓶牛奶', 'animal', 190, { cat: 'milk', edible: true, energy: 55 });
registerItem('goat_milk', '羊奶', 'animal', 225, { cat: 'milk', edible: true, energy: 40 });
registerItem('goat_milk_large', '大瓶羊奶', 'animal', 345, { cat: 'milk', edible: true, energy: 70 });
registerItem('wool', '羊毛', 'animal', 340);
registerItem('truffle', '松露', 'animal', 625);
registerItem('rabbit_foot', '兔脚', 'animal', 565);

// ── 加工品（type 'artisan'；售价按任务书规格，见 docs/design/animals.md §3） ──
registerItem('mayonnaise', '蛋黄酱', 'artisan', 190);
registerItem('duck_mayonnaise', '鸭蛋黄酱', 'artisan', 285);
registerItem('cheese', '奶酪', 'artisan', 230);
registerItem('goat_cheese', '山羊奶酪', 'artisan', 345);
registerItem('truffle_oil', '松露油', 'artisan', 1065);

// ── 动物档案 ─────────────────────────────────────────────
// house: 建筑族（coop=鸡舍系/barn=畜棚系）；size: 精灵体型（small 家禽/medium 家畜）；
// sellPrice: 满好感出售价 = buyPrice×1.3（实际售价 = buyPrice×(好感/1000+0.3)，SDV 公式）；
// produce: item=产物 id，days=周期天数，requireFriendship=资格好感门槛，
//   large=大产物（概率替换基础产物），rare=稀有产物（概率替换，鸭毛/兔脚公式），
//   forage=户外寻获型（猪刨松露：放养时地面产出，冬季不产）。
export const ANIMALS = [
  { id: 'chicken', name: '鸡', house: 'coop', buyPrice: 800, sellPrice: 1040, color: '#F5F0E0', size: 'small', adultDays: 3,
    produce: [{ item: 'egg', days: 1 }, { item: 'egg_large', days: 1, requireFriendship: 200, large: true }] },
  { id: 'duck', name: '鸭', house: 'coop', buyPrice: 1200, sellPrice: 1560, color: '#F0EBD8', size: 'small', adultDays: 5,
    produce: [{ item: 'duck_egg', days: 2 }, { item: 'duck_feather', days: 2, requireFriendship: 150, rare: true }] },
  { id: 'cow', name: '牛', house: 'barn', buyPrice: 1500, sellPrice: 1950, color: '#C89A78', size: 'medium', adultDays: 5,
    produce: [{ item: 'milk', days: 1 }, { item: 'milk_large', days: 1, requireFriendship: 200, large: true }] },
  { id: 'goat', name: '山羊', house: 'barn', buyPrice: 4000, sellPrice: 5200, color: '#D8D0C0', size: 'medium', adultDays: 5,
    produce: [{ item: 'goat_milk', days: 2 }, { item: 'goat_milk_large', days: 2, requireFriendship: 200, large: true }] },
  { id: 'sheep', name: '绵羊', house: 'barn', buyPrice: 8000, sellPrice: 10400, color: '#F0EBE0', size: 'medium', adultDays: 4,
    produce: [{ item: 'wool', days: 3 }] },
  { id: 'pig', name: '猪', house: 'barn', buyPrice: 16000, sellPrice: 20800, color: '#F0B0BC', size: 'medium', adultDays: 10,
    produce: [{ item: 'truffle', days: 1, forage: true }] },
  { id: 'rabbit', name: '兔子', house: 'coop', buyPrice: 8000, sellPrice: 10400, color: '#C8B8A8', size: 'small', adultDays: 6,
    produce: [{ item: 'wool', days: 4 }, { item: 'rabbit_foot', days: 4, requireFriendship: 150, rare: true }] },
];

// ── 农场建筑（购买由商店系统写入 state.farm.buildings，本数据为唯一价目来源） ──
export const BUILDINGS = [
  { id: 'coop', name: '鸡舍', price: 4000, materials: { wood: 300, stone: 100 }, capacity: 4 },
  { id: 'coop2', name: '大鸡舍', price: 10000, materials: { wood: 400, stone: 150 }, capacity: 8, autoFeed: false },
  { id: 'barn', name: '畜棚', price: 6000, materials: { wood: 350, stone: 150 }, capacity: 4 },
  { id: 'barn2', name: '大畜棚', price: 12000, materials: { wood: 450, stone: 200 }, capacity: 8 },
];

// ── 加工机器配方（minutes=游戏分钟；蛋黄酱 3h=180，奶酪 3.3h=200） ──
// 大产物→金星加工品（quality 2），对标 SDV「大蛋→金星蛋黄酱 / 大奶→金星奶酪」。
export const MACHINES = [
  { id: 'mayonnaise_machine', name: '蛋黄酱机', minutes: 180, inputs: {
    egg: { out: 'mayonnaise' }, egg_large: { out: 'mayonnaise', quality: 2 }, duck_egg: { out: 'duck_mayonnaise' },
  } },
  { id: 'cheese_press', name: '奶酪机', minutes: 200, inputs: {
    milk: { out: 'cheese' }, milk_large: { out: 'cheese', quality: 2 },
    goat_milk: { out: 'goat_cheese' }, goat_milk_large: { out: 'goat_cheese', quality: 2 },
  } },
];

export const animalDef = (id) => ANIMALS.find((a) => a.id === id);
export const buildingDef = (id) => BUILDINGS.find((b) => b.id === id);
export const machineDef = (id) => MACHINES.find((m) => m.id === id);
