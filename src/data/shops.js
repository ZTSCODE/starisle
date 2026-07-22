// 商店数据包（纯数据）：5 常驻店 + 旅行商人 + 赌场。
// 作息/定价对标 docs/research/sdv-core.md §5.2–§5.3（周三休杂货店、铁匠工具升级 2000→25000、
// 玛妮动物价目、酒吧无休、旅行商人周五/日、赌场 1000g=100 币）。
// owner 为 npc id（与 npcs.js 商店主一致：pierre/clint/marnie/gus/willy/morris/robin）。
// open 为分钟制 [起,止]（540=9:00）；closedDays 0=周一；qty -1 = 不限量；seasons 限定上架季节（0春1夏2秋3冬）。
// 动物 id（chicken/cow 等）由畜牧包注册，此处只引用；price 缺省 = 物品售价的 2 倍（商店系统规则）。
import { registerItem } from './items.js';

// ── 渔具店商品 ─────────────────────────────────────────────
registerItem('bait', '鱼饵', 'bait', 1);
registerItem('deluxe_bait', '豪华鱼饵', 'bait', 10);
registerItem('crab_pot', '蟹笼', 'machine', 500);
registerItem('worm_bin', '虫饵盒', 'machine', 400);
registerItem('fiberglass_rod', '玻璃纤维竿', 'tool', 0, { stack: 1, energy: 8, rodTier: 1 });
registerItem('iridium_rod', '铱金竿', 'tool', 0, { stack: 1, energy: 8, rodTier: 2 });

// ── 牧场设备 ───────────────────────────────────────────────
registerItem('incubator', '孵化器', 'machine', 500);

// ── 旅行商人特供 ───────────────────────────────────────────
registerItem('rare_seed', '稀有种子', 'seed', 250, { crop: 'sweet_gem_berry', seasons: [2] });

// ── 酒吧饮食（对标 §5.2 常驻价目：啤酒400/沙拉220/面包120/意面240/披萨600/咖啡300） ──
registerItem('beer', '麦酒', 'food', 200, { edible: true, energy: 50, health: 22, buff: { type: 'speed', value: -1, minutes: 300 } });
registerItem('coffee', '咖啡', 'food', 150, { edible: true, energy: 3, health: 1, buff: { type: 'speed', value: 1, minutes: 120 } });
registerItem('pizza', '披萨', 'food', 300, { edible: true, energy: 150, health: 67 });
registerItem('spaghetti', '意面', 'food', 120, { edible: true, energy: 75, health: 33 });

// ── 赌场特供 ───────────────────────────────────────────────
registerItem('fortune_statue', '财富雕像', 'furniture', 1000000, { stack: 1 });

// ── 茶馆特供（云杉茶馆） ──
registerItem('green_tea', '云雾绿茶', 'food', 120, { edible: true, energy: 40, health: 10, buff: { type: 'speed', value: 1, minutes: 90 } });
registerItem('oolong', '松针乌龙', 'food', 160, { edible: true, energy: 60, health: 16 });
registerItem('osmanthus_cake', '桂花糕', 'food', 180, { edible: true, energy: 90, health: 40 });
registerItem('preserved_fruit', '蜜饯果子', 'food', 100, { edible: true, energy: 55, health: 24 });
// ── 裁缝铺特供（锦绣裁缝铺） ──
registerItem('straw_hat', '草帽', 'furniture', 300, { stack: 1 });
registerItem('wool_hat', '毛线帽', 'furniture', 500, { stack: 1 });
registerItem('hair_ribbon', '蝴蝶结发带', 'furniture', 350, { stack: 1 });
registerItem('silk_scarf', '丝巾', 'furniture', 600, { stack: 1 });

export const SHOPS = [
  {
    id: 'pierre', name: '汐溪杂货店', owner: 'pierre',
    open: [540, 1020], closedDays: [2], scene: 'town', buyback: true,
    special: 'upgrade_backpack',
    upgrades: [{ slots: 36, price: 6000 }], // 背包扩容一档（初始 24 → 36）
    stock: [
      { tag: 'seed', qty: -1 },                       // 当季全部种子（系统按当前季节过滤，noShop 除外）
      { item: 'fert_basic', price: 100, qty: -1 },
      { item: 'fert_quality', price: 150, qty: -1 },
      { item: 'soil_basic', price: 100, qty: -1 },
      { item: 'soil_quality', price: 150, qty: -1 },
      { item: 'gro_basic', price: 100, qty: -1 },
      { item: 'gro_quality', price: 150, qty: -1 },
      { item: 'flour', price: 100, qty: -1 },
      { item: 'sugar', price: 100, qty: -1 },
      { item: 'rice', price: 200, qty: -1 },
      { item: 'oil', price: 200, qty: -1 },
      { item: 'vinegar', price: 200, qty: -1 },
      { item: 'bouquet', price: 200, qty: -1 },
    ],
  },
  {
    id: 'blacksmith', name: '岩火铁匠铺', owner: 'clint',
    open: [540, 960], closedDays: [4], scene: 'town', buyback: true,
    special: 'upgrade_tool',
    upgrades: [ // 工具升级四档：对应锭×5，耗时 2 天（对标 §5.2）
      { level: 1, material: 'copper_bar', qty: 5, price: 2000, days: 2 },
      { level: 2, material: 'iron_bar', qty: 5, price: 5000, days: 2 },
      { level: 3, material: 'gold_bar', qty: 5, price: 10000, days: 2 },
      { level: 4, material: 'iridium_bar', qty: 5, price: 25000, days: 2 },
    ],
    stock: [
      { item: 'copper_ore', price: 75, qty: -1 },
      { item: 'iron_ore', price: 150, qty: -1 },
      { item: 'gold_ore', price: 400, qty: -1 },
      { item: 'coal', price: 150, qty: -1 },
    ],
  },
  {
    id: 'ranch', name: '青草地牧场', owner: 'marnie',
    open: [540, 960], closedDays: [0, 1], scene: 'town',
    special: 'animal',
    stock: [ // 动物价目对标 §5.2：鸡800/鸭1200/牛1500/山羊4000/绵羊8000/猪16000/兔8000
      { item: 'chicken', price: 800, qty: -1 },
      { item: 'duck', price: 1200, qty: -1 },
      { item: 'cow', price: 1500, qty: -1 },
      { item: 'goat', price: 4000, qty: -1 },
      { item: 'sheep', price: 8000, qty: -1 },
      { item: 'pig', price: 16000, qty: -1 },
      { item: 'rabbit', price: 8000, qty: -1 },
      { item: 'hay', price: 50, qty: -1 },
      { item: 'incubator', price: 1000, qty: -1 },
    ],
  },
  {
    id: 'saloon', name: '汐浪酒吧', owner: 'gus',
    open: [720, 1440], closedDays: [], scene: 'town',
    stock: [
      { item: 'beer', price: 400, qty: -1 },
      { item: 'salad', price: 220, qty: -1 },
      { item: 'bread', price: 120, qty: -1 },
      { item: 'spaghetti', price: 240, qty: -1 },
      { item: 'pizza', price: 600, qty: -1 },
      { item: 'coffee', price: 300, qty: -1 },
    ],
  },
  {
    id: 'fishshop', name: '潮声渔具店', owner: 'willy',
    open: [480, 1020], closedDays: [], scene: 'town', buyback: true,
    stock: [
      { item: 'fiberglass_rod', price: 1500, qty: -1 },
      { item: 'iridium_rod', price: 7500, qty: -1 },
      { item: 'bait', price: 5, qty: -1 },
      { item: 'deluxe_bait', price: 25, qty: -1 },
      { item: 'crab_pot', price: 1500, qty: -1 },
    ],
  },
  {
    id: 'traveler', name: '旅行商队', owner: 'morris',
    open: [360, 1200], closedDays: [0, 1, 2, 3, 5], scene: 'forest', // 仅周五、周日出摊
    stock: [
      { tag: 'random', qty: 10 },                     // 10 格随机货，每次出摊刷新（对标 §5.3）
      { item: 'rare_seed', price: 1000, qty: 1, seasons: [0, 1] }, // 春夏必出的稀有种子
    ],
  },
  {
    id: 'casino', name: '星灯赌场', owner: 'gus', // 酒吧内隔间
    open: [720, 1440], closedDays: [], scene: 'town',
    special: 'casino',
    exchange: { gold: 1000, coin: 100 }, // 1000 金 = 100 星币，星币不可兑回
    stock: [
      { item: 'farm_totem', price: 1000, qty: 20, currency: 'coin' },
      { item: 'scarecrow_deluxe', price: 10000, qty: 1, currency: 'coin' },
      { item: 'fortune_statue', price: 1000000, qty: -1, currency: 'gold' },
    ],
  },
  {
    id: 'carpenter', name: '穆青木工坊', owner: 'robin',
    open: [540, 1020], closedDays: [1], scene: 'town', buyback: true,
    stock: [
      { item: 'wood', price: 8, qty: -1 },
      { item: 'stone', price: 10, qty: -1 },
      { item: 'fiber', price: 6, qty: -1 },
      { item: 'fence_wood', price: 6, qty: -1 },
      { item: 'fence_stone', price: 12, qty: -1 },
      { item: 'fence_iron', price: 30, qty: -1 },
    ],
  },
  {
    id: 'teahouse', name: '云杉茶馆', owner: 'qiaoyin',
    open: [600, 1140], closedDays: [], scene: 'town', buyback: true,
    stock: [
      { item: 'green_tea', price: 120, qty: -1 },
      { item: 'oolong', price: 160, qty: -1 },
      { item: 'osmanthus_cake', price: 180, qty: -1 },
      { item: 'preserved_fruit', price: 100, qty: -1 },
    ],
  },
  {
    id: 'tailor', name: '锦绣裁缝铺', owner: 'suwanyin',
    open: [540, 1020], closedDays: [2], scene: 'town', buyback: true,
    stock: [
      { item: 'straw_hat', price: 300, qty: -1 },
      { item: 'wool_hat', price: 500, qty: -1 },
      { item: 'hair_ribbon', price: 350, qty: -1 },
      { item: 'silk_scarf', price: 600, qty: -1 },
    ],
  },
];
