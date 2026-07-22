// 物品注册表：所有物品唯一来源。其他数据文件只引用 id。
// type: tool/seed/crop/forage/resource/ore/bar/gem/fish/food/machine/fertilizer/sprinkler/scarecrow/bait/tackle/weapon/ring/boots/animal/artisan/furniture/misc

// 作物表：id, 名, 季(0春1夏2秋3冬), 种子价, 生长天数, 售价, 再收天数(0=单次), 爬藤, 多果(每次收获个数)
export const CROPS = [
  // 春 ×8
  { id: 'parsnip', name: '防风草', seasons: [0], seed: 20, days: 4, price: 35, regrow: 0 },
  { id: 'potato', name: '土豆', seasons: [0], seed: 50, days: 6, price: 80, regrow: 0, extra: 0.25 },
  { id: 'kale', name: '羽衣甘蓝', seasons: [0], seed: 70, days: 6, price: 110, regrow: 0 },
  { id: 'greenbean', name: '青豆', seasons: [0], seed: 60, days: 10, price: 40, regrow: 3, vine: true },
  { id: 'strawberry', name: '草莓', seasons: [0], seed: 100, days: 8, price: 120, regrow: 4 },
  { id: 'bluejazz', name: '蓝爵花', seasons: [0], seed: 30, days: 7, price: 50, regrow: 0 },
  { id: 'tulip', name: '郁金香', seasons: [0], seed: 20, days: 6, price: 30, regrow: 0 },
  { id: 'rhubarb', name: '大黄', seasons: [0], seed: 100, days: 13, price: 220, regrow: 0 },
  // 夏 ×11
  { id: 'melon', name: '甜瓜', seasons: [1], seed: 80, days: 12, price: 250, regrow: 0, giant: true },
  { id: 'blueberry', name: '蓝莓', seasons: [1], seed: 80, days: 13, price: 50, regrow: 4, multi: 3 },
  { id: 'starfruit', name: '杨桃', seasons: [1], seed: 400, days: 13, price: 750, regrow: 0 },
  { id: 'hops', name: '啤酒花', seasons: [1], seed: 60, days: 11, price: 25, regrow: 1, vine: true },
  { id: 'tomato', name: '番茄', seasons: [1], seed: 50, days: 11, price: 60, regrow: 4 },
  { id: 'hotpepper', name: '辣椒', seasons: [1], seed: 40, days: 5, price: 40, regrow: 3 },
  { id: 'corn', name: '玉米', seasons: [1, 2], seed: 150, days: 14, price: 50, regrow: 4 },
  { id: 'radish', name: '樱桃萝卜', seasons: [1], seed: 40, days: 6, price: 90, regrow: 0 },
  { id: 'wheat', name: '小麦', seasons: [1, 2], seed: 10, days: 4, price: 25, regrow: 0 },
  { id: 'sunflower', name: '向日葵', seasons: [1, 2], seed: 200, days: 8, price: 80, regrow: 0, dropSeed: true },
  { id: 'poppy', name: '虞美人', seasons: [1], seed: 100, days: 7, price: 140, regrow: 0 },
  // 秋 ×10
  { id: 'pumpkin', name: '南瓜', seasons: [2], seed: 100, days: 13, price: 320, regrow: 0, giant: true },
  { id: 'cranberry', name: '蔓越莓', seasons: [2], seed: 240, days: 7, price: 75, regrow: 5, multi: 2 },
  { id: 'grape', name: '葡萄', seasons: [2], seed: 60, days: 10, price: 80, regrow: 3, vine: true },
  { id: 'eggplant', name: '茄子', seasons: [2], seed: 20, days: 5, price: 60, regrow: 5 },
  { id: 'amaranth', name: '苋菜', seasons: [2], seed: 70, days: 7, price: 150, regrow: 0 },
  { id: 'artichoke', name: '洋蓟', seasons: [2], seed: 30, days: 8, price: 160, regrow: 0 },
  { id: 'beet', name: '甜菜', seasons: [2], seed: 20, days: 6, price: 100, regrow: 0 },
  { id: 'bokchoy', name: '小白菜', seasons: [2], seed: 50, days: 4, price: 80, regrow: 0 },
  { id: 'fairyrose', name: '仙子玫瑰', seasons: [2], seed: 200, days: 12, price: 290, regrow: 0 },
  { id: 'yam', name: '山药', seasons: [2], seed: 60, days: 10, price: 160, regrow: 0 },
  // 冬 ×8（含霜瓜/冰晶花等原创耐寒作物）
  { id: 'powdermelon', name: '霜瓜', seasons: [3], seed: 60, days: 7, price: 120, regrow: 0, giant: true },
  { id: 'snowpea', name: '雪豆', seasons: [3], seed: 40, days: 5, price: 90, regrow: 0 },
  { id: 'icebloom', name: '冰晶花', seasons: [3], seed: 60, days: 6, price: 140, regrow: 0 },
  { id: 'frostroot', name: '霜根菜', seasons: [3], seed: 50, days: 7, price: 120, regrow: 0 },
  { id: 'wintercress', name: '冬水芹', seasons: [3], seed: 30, days: 4, price: 70, regrow: 0 },
  { id: 'snowberry', name: '雪莓', seasons: [3], seed: 120, days: 8, price: 200, regrow: 5 },
  { id: 'icewheat', name: '冰麦', seasons: [3], seed: 20, days: 5, price: 55, regrow: 0 },
  { id: 'frostflower', name: '霜雪花', seasons: [3], seed: 80, days: 6, price: 160, regrow: 0 },
  // 野生混合（收集包奖励种子，外观为当季野花混合）
  { id: 'wildmix_spring', name: '春日野花', seasons: [0], seed: 0, days: 7, price: 90, regrow: 0, noShop: true },
  { id: 'wildmix_summer', name: '夏日野花', seasons: [1], seed: 0, days: 7, price: 110, regrow: 0, noShop: true },
  { id: 'wildmix_autumn', name: '秋日野花', seasons: [2], seed: 7, price: 130, regrow: 0, noShop: true, days: 7 },
  { id: 'wildmix_winter', name: '冬日冰花', seasons: [3], seed: 0, days: 7, price: 150, regrow: 0, noShop: true },
  { id: 'ancientfruit', name: '上古灵果', seasons: [0, 1, 2], seed: 0, days: 28, price: 550, regrow: 7, noShop: true },
];

export const QUALITY_MUL = [1, 1.25, 1.5, 2]; // 普通/银/金/铱
export const QUALITY_NAMES = ['普通', '银星', '金星', '铱星'];

const items = {};
function reg(id, name, type, price, extra = {}) {
  items[id] = { id, name, type, price, stack: 99, ...extra };
}

// 工具（不可出售）
reg('hoe', '锄头', 'tool', 0, { stack: 1, energy: 2 });
reg('wateringcan', '浇水壶', 'tool', 0, { stack: 1, energy: 2 });
reg('axe', '斧头', 'tool', 0, { stack: 1, energy: 2 });
reg('pickaxe', '镐', 'tool', 0, { stack: 1, energy: 2 });
reg('scythe', '镰刀', 'tool', 0, { stack: 1, energy: 0 });
reg('fishingrod', '竹鱼竿', 'tool', 0, { stack: 1, energy: 8 });
reg('sword', '锈剑', 'weapon', 50, { stack: 1, atk: 4 });

// 作物种子与果实（程序生成）
for (const c of CROPS) {
  reg(c.id + '_seeds', c.name + '种子', 'seed', c.seed, { crop: c.id, seasons: c.seasons, noShop: !!c.noShop });
  reg(c.id, c.name, 'crop', c.price, { energy: Math.round(c.price * 0.36), edible: true });
}

// 肥料
reg('fert_basic', '初级肥料', 'fertilizer', 50, { fert: 'quality1' });
reg('fert_quality', '高级肥料', 'fertilizer', 100, { fert: 'quality2' });
reg('fert_deluxe', '顶级肥料', 'fertilizer', 300, { fert: 'quality3' });
reg('soil_basic', '初级保湿土', 'fertilizer', 50, { fert: 'retain1' });
reg('soil_quality', '高级保湿土', 'fertilizer', 100, { fert: 'retain2' });
reg('soil_deluxe', '顶级保湿土', 'fertilizer', 200, { fert: 'retain3' });
reg('gro_basic', '生长激素', 'fertilizer', 60, { fert: 'speed1' });
reg('gro_quality', '高级激素', 'fertilizer', 120, { fert: 'speed2' });
reg('gro_hyper', '超级激素', 'fertilizer', 250, { fert: 'speed3' });

// 农耕设施
reg('sprinkler1', '洒水器', 'sprinkler', 100, { range: 1 });
reg('sprinkler2', '优质洒水器', 'sprinkler', 300, { range: 2 });
reg('sprinkler3', '铱金洒水器', 'sprinkler', 800, { range: 3 });
reg('scarecrow', '稻草人', 'scarecrow', 150, { radius: 8 });
reg('scarecrow_deluxe', '豪华稻草人', 'scarecrow', 800, { radius: 16 });

// 基础资源
reg('wood', '木头', 'resource', 2);
reg('stone', '石头', 'resource', 2);
reg('fiber', '纤维', 'resource', 1);
reg('sap', '树液', 'resource', 2);
reg('coal', '煤', 'resource', 15);
reg('clay', '黏土', 'resource', 20);
reg('hardwood', '硬木', 'resource', 15);
reg('hay', '干草', 'resource', 5);

// 食物（基础）
reg('field_snack', '田野小吃', 'food', 20, { energy: 45, health: 20, edible: true });
reg('bread', '面包', 'food', 60, { energy: 50, health: 22, edible: true });

// 礼物/杂项
reg('bouquet', '花束', 'gift', 200, { stack: 1 });
reg('mermaid_pendant', '人鱼吊坠', 'gift', 5000, { stack: 1 });
reg('rain_totem', '求雨图腾', 'misc', 300, { stack: 1, use: 'rain' });
reg('wildseeds_spring', '野生种子（春）', 'seed', 0, { crop: 'wildmix_spring', seasons: [0] });
reg('wildseeds_summer', '野生种子（夏）', 'seed', 0, { crop: 'wildmix_summer', seasons: [1] });
reg('wildseeds_fall', '野生种子（秋）', 'seed', 0, { crop: 'wildmix_autumn', seasons: [2] });
reg('wildseeds_winter', '野生种子（冬）', 'seed', 0, { crop: 'wildmix_winter', seasons: [3] });

export const ITEMS = items;
// 分布式注册：各数据文件在自己的模块作用域调用，注册表仍为单一来源
export function registerItem(id, name, type, price, extra = {}) { reg(id, name, type, price, extra); }
export function getItem(id) { const it = items[id]; if (!it) throw new Error('unknown item: ' + id); return it; }
export function sellPrice(id, quality = 0) {
  const it = getItem(id);
  return Math.floor(it.price * (it.type === 'crop' || it.type === 'fish' || it.type === 'animal' || it.type === 'artisan' || it.type === 'forage' ? QUALITY_MUL[quality] : 1));
}
