// 鱼类数据表：分布对标 docs/research/sdv-systems.md §1.7（代表鱼表）与 §1.8（传说鱼规则），命名全部原创。
// seasons: 0春 1夏 2秋 3冬，空数组=全年；weather 空数组=任意天气；time: [起,止] 分钟（6am=360, 2am=1560），空数组=全天。
// difficulty 5–110；behavior: mixed/dart/sinker/floater/smooth；minFloor 仅矿洞湖鱼使用；reqLevel 仅传说鱼使用。
import { registerItem } from './items.js';

export const FISH = [
  { id: 'lobster', name: '龙虾', zone: 'sea', seasons: [], weather: [], time: [], difficulty: 65, behavior: 'dart', price: 120, xp: 24 },
  { id: 'crayfish', name: '螯虾', zone: 'lake', seasons: [], weather: [], time: [], difficulty: 25, behavior: 'mixed', price: 40, xp: 10 },
  { id: 'crab', name: '青蟹', zone: 'sea', seasons: [], weather: [], time: [], difficulty: 45, behavior: 'dart', price: 80, xp: 16 },
  { id: 'shrimp', name: '白虾', zone: 'sea', seasons: [], weather: [], time: [], difficulty: 20, behavior: 'mixed', price: 35, xp: 8 },
  { id: 'oyster', name: '牡蛎', zone: 'sea', seasons: [], weather: [], time: [], difficulty: 15, behavior: 'sinker', price: 50, xp: 10 },

  // ── 河鱼 ×8 ──────────────────────────────────────────────
  { id: 'sunfish',       name: '太阳鱼',   zone: 'river', seasons: [0, 1],    weather: ['sunny'],        time: [360, 1140],  difficulty: 30, behavior: 'mixed',  price: 30,  xp: 13 },
  { id: 'catfish',       name: '鲶鱼',     zone: 'river', seasons: [0, 2],    weather: ['rain'],         time: [360, 1440],  difficulty: 72, behavior: 'mixed',  price: 200, xp: 28 },
  { id: 'shad',          name: '鲥鱼',     zone: 'river', seasons: [0, 1, 2], weather: ['rain', 'storm'], time: [540, 1560],  difficulty: 45, behavior: 'smooth', price: 60,  xp: 18 },
  { id: 'tiger_trout',   name: '虎纹鳟',   zone: 'river', seasons: [2, 3],    weather: [],               time: [360, 1140],  difficulty: 60, behavior: 'dart',   price: 150, xp: 23 },
  { id: 'walleye',       name: '玻璃梭鲈', zone: 'river', seasons: [2],       weather: ['rain', 'storm'], time: [720, 1560],  difficulty: 45, behavior: 'smooth', price: 105, xp: 18 },
  { id: 'bream',         name: '河鳊',     zone: 'river', seasons: [],        weather: [],               time: [1080, 1560], difficulty: 35, behavior: 'smooth', price: 45,  xp: 15 },
  { id: 'rainbow_trout', name: '虹鳟',     zone: 'river', seasons: [1],       weather: ['sunny'],        time: [360, 1140],  difficulty: 55, behavior: 'mixed',  price: 65,  xp: 21 },
  { id: 'salmon',        name: '鲑鱼',     zone: 'river', seasons: [2],       weather: [],               time: [360, 1140],  difficulty: 50, behavior: 'mixed',  price: 75,  xp: 20 },
  // ── 湖鱼 ×6 ──────────────────────────────────────────────
  { id: 'bass',          name: '大口鲈',   zone: 'lake',  seasons: [],        weather: [],               time: [360, 1140],  difficulty: 50, behavior: 'mixed',  price: 100, xp: 20 },
  { id: 'carp',          name: '鲤鱼',     zone: 'lake',  seasons: [],        weather: [],               time: [],           difficulty: 15, behavior: 'mixed',  price: 30,  xp: 8 },
  { id: 'bullhead',      name: '大头鱼',   zone: 'lake',  seasons: [],        weather: [],               time: [],           difficulty: 46, behavior: 'dart',   price: 75,  xp: 18 },
  { id: 'sturgeon',      name: '鲟鱼',     zone: 'lake',  seasons: [1, 3],    weather: [],               time: [360, 1140],  difficulty: 78, behavior: 'mixed',  price: 200, xp: 29 },
  { id: 'chub',          name: '白鲢',     zone: 'lake',  seasons: [],        weather: [],               time: [],           difficulty: 40, behavior: 'dart',   price: 50,  xp: 16 },
  { id: 'pondskipper',   name: '跳塘鱼',   zone: 'lake',  seasons: [],        weather: [],               time: [],           difficulty: 55, behavior: 'dart',   price: 75,  xp: 20 },
  // ── 海鱼 ×8 ──────────────────────────────────────────────
  { id: 'sardine',       name: '沙丁鱼',   zone: 'sea',   seasons: [0, 2, 3], weather: [],               time: [360, 1140],  difficulty: 30, behavior: 'dart',   price: 40,  xp: 13 },
  { id: 'tuna',          name: '金枪鱼',   zone: 'sea',   seasons: [1, 3],    weather: [],               time: [360, 1140],  difficulty: 70, behavior: 'smooth', price: 100, xp: 26 },
  { id: 'red_snapper',   name: '红鲷',     zone: 'sea',   seasons: [1, 2],    weather: ['rain'],         time: [360, 1140],  difficulty: 40, behavior: 'mixed',  price: 50,  xp: 16 },
  { id: 'tilapia',       name: '罗非鱼',   zone: 'sea',   seasons: [1, 2],    weather: [],               time: [360, 840],   difficulty: 50, behavior: 'mixed',  price: 75,  xp: 20 },
  { id: 'eel',           name: '海鳗',     zone: 'sea',   seasons: [0, 2],    weather: ['rain', 'storm'], time: [960, 1560],  difficulty: 55, behavior: 'smooth', price: 85,  xp: 21 },
  { id: 'pufferfish',    name: '河豚',     zone: 'sea',   seasons: [1],       weather: ['sunny'],        time: [720, 960],   difficulty: 80, behavior: 'floater', price: 200, xp: 29 },
  { id: 'halibut',       name: '大比目鱼', zone: 'sea',   seasons: [0, 1, 3], weather: [],               time: [360, 660],   difficulty: 50, behavior: 'sinker', price: 90,  xp: 19 },
  { id: 'squid',         name: '鱿鱼',     zone: 'sea',   seasons: [3],       weather: [],               time: [1080, 1560], difficulty: 35, behavior: 'sinker', price: 80,  xp: 15 },
  // ── 矿洞湖鱼 ×4（20/20/60/100 层地下湖；本矿洞 1–80 层，100 层鱼放最深层段） ──
  { id: 'rockskin_fish', name: '岩皮鱼',   zone: 'mine',  seasons: [],        weather: [],               time: [],           difficulty: 65, behavior: 'sinker', price: 300, xp: 25, minFloor: 20 },
  { id: 'shade_fish',    name: '幽影鱼',   zone: 'mine',  seasons: [],        weather: [],               time: [],           difficulty: 50, behavior: 'mixed',  price: 45,  xp: 20, minFloor: 20 },
  { id: 'icecore_fish',  name: '冰芯鱼',   zone: 'mine',  seasons: [],        weather: [],               time: [],           difficulty: 85, behavior: 'dart',   price: 500, xp: 31, minFloor: 60 },
  { id: 'magmelt_eel',   name: '熔芯鳗',   zone: 'mine',  seasons: [],        weather: [],               time: [],           difficulty: 90, behavior: 'mixed',  price: 700, xp: 33, minFloor: 60 },
  // ── 传说鱼 ×4（每存档各限 1 条，legendary: true） ──────────
  { id: 'lake_monarch',   name: '湖皇鱼',   zone: 'lake',  seasons: [0], weather: ['rain'], time: [], difficulty: 110, behavior: 'mixed',  price: 5000, xp: 40, legendary: true, reqLevel: 10 },
  { id: 'ember_emperor',  name: '赤霄鲷',   zone: 'sea',   seasons: [1], weather: [],       time: [], difficulty: 95,  behavior: 'dart',   price: 1500, xp: 35, legendary: true, reqLevel: 5 },
  { id: 'autumn_lantern', name: '秋灯鱼',   zone: 'river', seasons: [2], weather: [],       time: [], difficulty: 85,  behavior: 'mixed',  price: 1000, xp: 32, legendary: true, reqLevel: 3 },
  { id: 'frost_crown',    name: '霜冠鱼',   zone: 'lake',  seasons: [3], weather: [],       time: [], difficulty: 100, behavior: 'smooth', price: 2000, xp: 37, legendary: true, reqLevel: 6 },
];

// 全鱼种注册为物品（type 'fish'），可食用，能量约为售价三成
for (const f of FISH) {
  registerItem(f.id, f.name, 'fish', f.price, { energy: Math.round(f.price * 0.3), edible: true });
}
