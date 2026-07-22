// 制造配方数据包（纯数据）：手工制造 + 熔炉熔炼。
// 配方/解锁等级对标 docs/research/sdv-core.md §3（技能解锁链）、§2.5（肥料）、§2.7（洒水器）、§2.8（稻草人）
// 与 docs/research/sdv-systems.md §3.5（加工机器）、§7.6（熔炼）。
// 材料引用：基础资源=items.js；矿石/金属锭/宝石=ores.js；枫糖浆/橡树脂/松焦油=forage.js；鱼=fish.js。
// 本包注册缺失的中间物品与设施/机器物品；out 与材料均为物品 id。
// 适配说明：本矿洞怪物不掉落史莱姆泥/虫肉/蝙蝠翼（见 monsters.js），凡 SDV 配方含这些材料处
// 以树液/纤维/地晶替代（产油机=树液50、鱼饵=树液2、避雷针=地晶3），其余严格对标。
import { registerItem } from './items.js';

// ── 中间材料/消耗品 ─────────────────────────────────────────
registerItem('battery', '电池组', 'resource', 500);        // 避雷针产出，对标 SDV Battery Pack
registerItem('refined_quartz', '精炼石英', 'resource', 50); // 熔炉烧制（见 smelt_refined_quartz）
registerItem('torch', '火把', 'misc', 2, { placeable: true });
registerItem('coral', '珊瑚', 'forage', 80);               // 海滩拾取（npcs.js 前瞻引用同 id）
registerItem('bomb1', '樱桃炸弹', 'bomb', 50, { radius: 3 });
registerItem('bomb2', '炸弹', 'bomb', 100, { radius: 5 });
registerItem('bomb3', '超级炸弹', 'bomb', 150, { radius: 7 });
registerItem('chest', '宝箱', 'furniture', 100, { storage: 36 });
registerItem('staircase', '楼梯', 'misc', 10, { use: 'mine_down' });
registerItem('cookout_kit', '野炊工具', 'misc', 100, { use: 'cookout' });
registerItem('farm_totem', '农场传送图腾', 'misc', 250, { use: 'warp_farm' });
registerItem('beach_totem', '海滩传送图腾', 'misc', 200, { use: 'warp_beach' });

// ── 栅栏 ×3 / 地板 ×3 ───────────────────────────────────────
registerItem('fence_wood', '木栅栏', 'misc', 2, { placeable: true });
registerItem('fence_stone', '石栅栏', 'misc', 4, { placeable: true });
registerItem('fence_iron', '铁栅栏', 'misc', 10, { placeable: true });
registerItem('floor_wood', '木地板', 'misc', 1, { placeable: true });
registerItem('floor_stone', '石地板', 'misc', 1, { placeable: true });
registerItem('floor_crystal', '水晶地板', 'misc', 10, { placeable: true });

// ── 加工机器/设施 ×14 ───────────────────────────────────────
registerItem('furnace', '熔炉', 'machine', 250);
registerItem('mayonnaise_machine', '蛋黄酱机', 'machine', 380);
registerItem('cheese_press', '奶酪机', 'machine', 450);
registerItem('keg', '小桶', 'machine', 400);
registerItem('preserves_jar', '罐头瓶', 'machine', 300);
registerItem('bee_house', '蜂房', 'machine', 350);
registerItem('loom', '织布机', 'machine', 500);
registerItem('oil_maker', '产油机', 'machine', 600);
registerItem('seed_maker', '种子机', 'machine', 800);
registerItem('lightning_rod', '避雷针', 'machine', 300);
registerItem('tapper', '树液采集器', 'machine', 200);
registerItem('charcoal_kiln', '木炭窑', 'machine', 250);
registerItem('recycling_machine', '回收机', 'machine', 350);
registerItem('crystalarium', '宝石复制机', 'machine', 1000);

// RECIPES：{ id, out, qty, ingredients:[{item,qty}|{any,qty}], unlock, station? }
// unlock: {skill,level} 技能升级 | {shop,price} 商店售图纸 | {story:'cc'} 剧情事件 | {start:true} 开局即会
// any 仅用于 SDV 原配方就是"任意某类"的场合（如高级肥料=任意鱼）；station 缺省 = 徒手制造
export const RECIPES = [
  // ── 农耕设施（对标 §3.2 耕种解锁链） ──────────────────────
  { id: 'craft_scarecrow', out: 'scarecrow', qty: 1, ingredients: [{ item: 'wood', qty: 50 }, { item: 'coal', qty: 1 }, { item: 'fiber', qty: 20 }], unlock: { skill: 'farming', level: 1 } },
  { id: 'craft_sprinkler1', out: 'sprinkler1', qty: 1, ingredients: [{ item: 'copper_bar', qty: 1 }, { item: 'iron_bar', qty: 1 }], unlock: { skill: 'farming', level: 2 } },
  { id: 'craft_sprinkler2', out: 'sprinkler2', qty: 1, ingredients: [{ item: 'iron_bar', qty: 1 }, { item: 'gold_bar', qty: 1 }, { item: 'refined_quartz', qty: 1 }], unlock: { skill: 'farming', level: 6 } },
  { id: 'craft_sprinkler3', out: 'sprinkler3', qty: 1, ingredients: [{ item: 'gold_bar', qty: 1 }, { item: 'iridium_bar', qty: 1 }, { item: 'battery', qty: 1 }], unlock: { skill: 'farming', level: 9 } },

  // ── 加工机器（对标 §3.5 配方表） ──────────────────────────
  { id: 'craft_mayonnaise_machine', out: 'mayonnaise_machine', qty: 1, ingredients: [{ item: 'wood', qty: 15 }, { item: 'stone', qty: 15 }, { item: 'earth_crystal', qty: 1 }, { item: 'copper_bar', qty: 1 }], unlock: { skill: 'farming', level: 2 } },
  { id: 'craft_bee_house', out: 'bee_house', qty: 1, ingredients: [{ item: 'wood', qty: 40 }, { item: 'coal', qty: 8 }, { item: 'iron_bar', qty: 1 }, { item: 'maple_syrup', qty: 1 }], unlock: { skill: 'farming', level: 3 } },
  { id: 'craft_preserves_jar', out: 'preserves_jar', qty: 1, ingredients: [{ item: 'wood', qty: 50 }, { item: 'stone', qty: 40 }, { item: 'coal', qty: 8 }], unlock: { skill: 'farming', level: 4 } },
  { id: 'craft_cheese_press', out: 'cheese_press', qty: 1, ingredients: [{ item: 'wood', qty: 45 }, { item: 'stone', qty: 45 }, { item: 'hardwood', qty: 10 }, { item: 'copper_bar', qty: 1 }], unlock: { skill: 'farming', level: 6 } },
  { id: 'craft_loom', out: 'loom', qty: 1, ingredients: [{ item: 'wood', qty: 60 }, { item: 'fiber', qty: 30 }, { item: 'pine_tar', qty: 1 }], unlock: { skill: 'farming', level: 7 } },
  { id: 'craft_keg', out: 'keg', qty: 1, ingredients: [{ item: 'wood', qty: 30 }, { item: 'copper_bar', qty: 1 }, { item: 'iron_bar', qty: 1 }, { item: 'oak_resin', qty: 1 }], unlock: { skill: 'farming', level: 8 } },
  { id: 'craft_oil_maker', out: 'oil_maker', qty: 1, ingredients: [{ item: 'sap', qty: 50 }, { item: 'hardwood', qty: 20 }, { item: 'gold_bar', qty: 1 }], unlock: { skill: 'farming', level: 8 } },
  { id: 'craft_seed_maker', out: 'seed_maker', qty: 1, ingredients: [{ item: 'wood', qty: 25 }, { item: 'coal', qty: 10 }, { item: 'gold_bar', qty: 1 }], unlock: { skill: 'farming', level: 9 } },
  { id: 'craft_crystalarium', out: 'crystalarium', qty: 1, ingredients: [{ item: 'stone', qty: 99 }, { item: 'gold_bar', qty: 5 }, { item: 'iridium_bar', qty: 2 }, { item: 'battery', qty: 1 }], unlock: { skill: 'mining', level: 9 } },

  // ── 熔炉与熔炼（对标 §7.6：5 矿石 + 1 煤 → 1 锭） ──────────
  { id: 'craft_furnace', out: 'furnace', qty: 1, ingredients: [{ item: 'copper_ore', qty: 20 }, { item: 'stone', qty: 25 }], unlock: { story: 'cc' } }, // 剧情：首次获得铜矿后铁匠上门赠图纸
  { id: 'smelt_copper', out: 'copper_bar', qty: 1, ingredients: [{ item: 'copper_ore', qty: 5 }, { item: 'coal', qty: 1 }], unlock: { story: 'cc' }, station: 'furnace' },
  { id: 'smelt_iron', out: 'iron_bar', qty: 1, ingredients: [{ item: 'iron_ore', qty: 5 }, { item: 'coal', qty: 1 }], unlock: { story: 'cc' }, station: 'furnace' },
  { id: 'smelt_gold', out: 'gold_bar', qty: 1, ingredients: [{ item: 'gold_ore', qty: 5 }, { item: 'coal', qty: 1 }], unlock: { story: 'cc' }, station: 'furnace' },
  { id: 'smelt_iridium', out: 'iridium_bar', qty: 1, ingredients: [{ item: 'iridium_ore', qty: 5 }, { item: 'coal', qty: 1 }], unlock: { story: 'cc' }, station: 'furnace' },
  { id: 'smelt_refined_quartz', out: 'refined_quartz', qty: 1, ingredients: [{ item: 'quartz', qty: 1 }, { item: 'coal', qty: 1 }], unlock: { story: 'cc' }, station: 'furnace' },

  // ── 炸弹 ×3（对标 §3.3 采矿解锁链） ───────────────────────
  { id: 'craft_bomb1', out: 'bomb1', qty: 1, ingredients: [{ item: 'copper_ore', qty: 4 }, { item: 'coal', qty: 1 }], unlock: { skill: 'mining', level: 1 } },
  { id: 'craft_bomb2', out: 'bomb2', qty: 1, ingredients: [{ item: 'iron_ore', qty: 4 }, { item: 'coal', qty: 1 }], unlock: { skill: 'mining', level: 6 } },
  { id: 'craft_bomb3', out: 'bomb3', qty: 1, ingredients: [{ item: 'gold_ore', qty: 4 }, { item: 'iridium_ore', qty: 1 }, { item: 'coal', qty: 1 }], unlock: { skill: 'mining', level: 8 } },
  { id: 'craft_staircase', out: 'staircase', qty: 1, ingredients: [{ item: 'stone', qty: 99 }], unlock: { skill: 'mining', level: 2 } },

  // ── 宝箱 / 栅栏 ×3 / 地板 ×3 ──────────────────────────────
  { id: 'craft_chest', out: 'chest', qty: 1, ingredients: [{ item: 'wood', qty: 50 }], unlock: { start: true } },
  { id: 'craft_fence_wood', out: 'fence_wood', qty: 1, ingredients: [{ item: 'wood', qty: 2 }], unlock: { start: true } },
  { id: 'craft_fence_stone', out: 'fence_stone', qty: 1, ingredients: [{ item: 'stone', qty: 2 }], unlock: { skill: 'farming', level: 2 } },
  { id: 'craft_fence_iron', out: 'fence_iron', qty: 1, ingredients: [{ item: 'iron_bar', qty: 1 }], unlock: { skill: 'farming', level: 4 } },
  { id: 'craft_floor_wood', out: 'floor_wood', qty: 1, ingredients: [{ item: 'wood', qty: 1 }], unlock: { start: true } },
  { id: 'craft_floor_stone', out: 'floor_stone', qty: 1, ingredients: [{ item: 'stone', qty: 1 }], unlock: { start: true } },
  { id: 'craft_floor_crystal', out: 'floor_crystal', qty: 5, ingredients: [{ item: 'refined_quartz', qty: 1 }], unlock: { shop: 'blacksmith', price: 500 } },

  // ── 觅食设备（对标 §3.4 觅食解锁链） ──────────────────────
  { id: 'craft_charcoal_kiln', out: 'charcoal_kiln', qty: 1, ingredients: [{ item: 'wood', qty: 20 }, { item: 'copper_bar', qty: 2 }], unlock: { skill: 'foraging', level: 2 } },
  { id: 'craft_cookout_kit', out: 'cookout_kit', qty: 1, ingredients: [{ item: 'wood', qty: 10 }, { item: 'coal', qty: 3 }, { item: 'fiber', qty: 5 }], unlock: { skill: 'foraging', level: 3 } },
  { id: 'craft_tapper', out: 'tapper', qty: 1, ingredients: [{ item: 'wood', qty: 40 }, { item: 'copper_bar', qty: 2 }], unlock: { skill: 'foraging', level: 4 } },
  { id: 'craft_lightning_rod', out: 'lightning_rod', qty: 1, ingredients: [{ item: 'iron_bar', qty: 1 }, { item: 'refined_quartz', qty: 1 }, { item: 'earth_crystal', qty: 3 }], unlock: { skill: 'foraging', level: 6 } },
  { id: 'craft_beach_totem', out: 'beach_totem', qty: 1, ingredients: [{ item: 'hardwood', qty: 1 }, { item: 'coral', qty: 2 }, { item: 'fiber', qty: 10 }], unlock: { skill: 'foraging', level: 6 } },
  { id: 'craft_farm_totem', out: 'farm_totem', qty: 1, ingredients: [{ item: 'hardwood', qty: 1 }, { item: 'maple_syrup', qty: 1 }, { item: 'fiber', qty: 20 }], unlock: { skill: 'foraging', level: 8 } },
  { id: 'craft_rain_totem', out: 'rain_totem', qty: 1, ingredients: [{ item: 'hardwood', qty: 1 }, { item: 'maple_syrup', qty: 1 }, { item: 'sap', qty: 10 }], unlock: { skill: 'foraging', level: 9 } },

  // ── 渔具制造（对标 §3.5 钓鱼解锁链） ──────────────────────
  { id: 'craft_bait', out: 'bait', qty: 5, ingredients: [{ item: 'sap', qty: 2 }], unlock: { skill: 'fishing', level: 2 } },
  { id: 'craft_crab_pot', out: 'crab_pot', qty: 1, ingredients: [{ item: 'wood', qty: 40 }, { item: 'iron_bar', qty: 3 }], unlock: { skill: 'fishing', level: 3 } },
  { id: 'craft_recycling_machine', out: 'recycling_machine', qty: 1, ingredients: [{ item: 'wood', qty: 25 }, { item: 'stone', qty: 25 }, { item: 'iron_bar', qty: 1 }], unlock: { skill: 'fishing', level: 4 } },
  { id: 'craft_worm_bin', out: 'worm_bin', qty: 1, ingredients: [{ item: 'hardwood', qty: 25 }, { item: 'gold_bar', qty: 1 }, { item: 'iron_bar', qty: 1 }, { item: 'fiber', qty: 50 }], unlock: { skill: 'fishing', level: 4 } },

  // ── 开局杂项 ─────────────────────────────────────────────
  { id: 'craft_torch', out: 'torch', qty: 3, ingredients: [{ item: 'wood', qty: 1 }, { item: 'sap', qty: 2 }], unlock: { start: true } },

  // ── 肥料各档（对标 §2.5 配方列；怪物材料已按上文适配） ─────
  { id: 'craft_fert_basic', out: 'fert_basic', qty: 1, ingredients: [{ item: 'sap', qty: 2 }], unlock: { skill: 'farming', level: 1 } },
  { id: 'craft_fert_quality', out: 'fert_quality', qty: 2, ingredients: [{ item: 'sap', qty: 4 }, { any: 'fish', qty: 1 }], unlock: { skill: 'farming', level: 9 } },
  { id: 'craft_fert_deluxe', out: 'fert_deluxe', qty: 5, ingredients: [{ item: 'iridium_bar', qty: 1 }, { item: 'sap', qty: 40 }], unlock: { story: 'cc' } },
  { id: 'craft_soil_basic', out: 'soil_basic', qty: 1, ingredients: [{ item: 'stone', qty: 2 }], unlock: { skill: 'farming', level: 4 } },
  { id: 'craft_soil_quality', out: 'soil_quality', qty: 2, ingredients: [{ item: 'stone', qty: 3 }, { item: 'clay', qty: 1 }], unlock: { skill: 'farming', level: 7 } },
  { id: 'craft_soil_deluxe', out: 'soil_deluxe', qty: 1, ingredients: [{ item: 'stone', qty: 5 }, { item: 'fiber', qty: 3 }, { item: 'clay', qty: 1 }], unlock: { story: 'cc' } },
  { id: 'craft_gro_basic', out: 'gro_basic', qty: 5, ingredients: [{ item: 'pine_tar', qty: 1 }, { item: 'fiber', qty: 5 }], unlock: { skill: 'farming', level: 3 } },
  { id: 'craft_gro_quality', out: 'gro_quality', qty: 5, ingredients: [{ item: 'oak_resin', qty: 1 }, { item: 'clay', qty: 5 }], unlock: { skill: 'farming', level: 8 } },
  { id: 'craft_gro_hyper', out: 'gro_hyper', qty: 2, ingredients: [{ item: 'iridium_bar', qty: 1 }, { item: 'diamond', qty: 1 }, { item: 'sap', qty: 20 }], unlock: { story: 'cc' } },
];
