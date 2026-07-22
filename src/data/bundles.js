// 收集包数据：「修复小镇」主线，汐溪镇旧会馆 6 个修复区 × 4 包 = 24 包。纯数据，无逻辑。
// 对标：docs/research/sdv-systems.md §6（社区中心 6 房间收集包）。
// 字段：
//   slots: 每包 3–6 格；{ item, qty, quality? } 指定物品，或 { any, qty, quality? } 接受该类别任意物品
//          any 枚举：crop 作物 / fish 鱼 / forage 觅食物 / ore 矿石 / artisan 工匠品
//          quality: 0普通/1银星/2金星/3铱星（省略=任意品质，更高品质也可）
//   reward: 单包完成立即发放 { item, qty }
//   roomReward: 整区完成大奖 type: greenhouse 温室 / minecart 矿车快行 / bridge 断桥修复 /
//               quarry 采石场 / bus 山道缆车 / friendship 全镇+2心
// 物品 id：作物/资源/肥料引用 items.js 已注册 id；鱼/宝石/畜产/工匠品/机器为扩展 id，
// 按 docs/integration.md §3 规范后续在 items.js 对应段落注册。

export const BUNDLE_ROOMS = [
  {
    id: 'workshop',
    name: '拾木工坊',
    bundles: [
      {
        id: 'spring_forage',
        name: '溪岸春采包',
        slots: [
          { item: 'wild_horseradish', qty: 1 },  // 山葵根
          { item: 'daffodil', qty: 1 },     // 水仙花
          { item: 'dandelion', qty: 1 },    // 蒲公英
          { item: 'leek', qty: 1 },         // 野韭葱
        ],
        reward: { item: 'wildseeds_spring', qty: 30 },
      },
      {
        id: 'summer_forage',
        name: '溪岸夏采包',
        slots: [
          { item: 'spice_berry', qty: 1 },  // 香料浆果
          { item: 'sweet_pea', qty: 1 },    // 甜豌豆花
          { item: 'fiddlehead', qty: 1 },   // 蕨菜卷
          { item: 'spring_onion', qty: 1 },    // 野薄荷
        ],
        reward: { item: 'wildseeds_summer', qty: 30 },
      },
      {
        id: 'fall_forage',
        name: '溪岸秋采包',
        slots: [
          { item: 'wild_plum', qty: 1 },    // 野李
          { item: 'hazelnut', qty: 1 },     // 榛子
          { item: 'blackberry', qty: 1 },   // 黑莓
          { item: 'chanterelle', qty: 1 },  // 鸡油菌
        ],
        reward: { item: 'wildseeds_fall', qty: 30 },
      },
      {
        id: 'winter_forage',
        name: '溪岸冬采包',
        slots: [
          { item: 'snow_root', qty: 1 },   // 冬根
          { item: 'frost_fruit', qty: 1 }, // 水晶果
          { item: 'snow_yam', qty: 1 },      // 雪山药
          { item: 'holly', qty: 1 },         // 冬青果
        ],
        reward: { item: 'wildseeds_winter', qty: 30 },
      },
    ],
    roomReward: { type: 'bridge', desc: '修复镇东河上的断桥，打通前往采石场的路。' },
  },
  {
    id: 'pantry',
    name: '溪谷膳房',
    bundles: [
      {
        id: 'spring_crops',
        name: '春播包',
        slots: [
          { item: 'parsnip', qty: 1 },
          { item: 'greenbean', qty: 1 },
          { item: 'potato', qty: 1 },
          { item: 'kale', qty: 1 },
        ],
        reward: { item: 'gro_basic', qty: 20 },
      },
      {
        id: 'summer_crops',
        name: '夏耘包',
        slots: [
          { item: 'melon', qty: 1 },
          { item: 'blueberry', qty: 1 },
          { item: 'tomato', qty: 1 },
          { item: 'hotpepper', qty: 1 },
        ],
        reward: { item: 'sprinkler2', qty: 1 },
      },
      {
        id: 'fall_crops',
        name: '秋收包',
        slots: [
          { item: 'pumpkin', qty: 1 },
          { item: 'corn', qty: 1 },
          { item: 'eggplant', qty: 1 },
          { item: 'yam', qty: 1 },
        ],
        reward: { item: 'bee_house', qty: 1 },
      },
      {
        id: 'quality_crops',
        name: '金穗品质包',
        slots: [
          { item: 'parsnip', qty: 5, quality: 2 },
          { item: 'melon', qty: 5, quality: 2 },
          { item: 'pumpkin', qty: 5, quality: 2 },
          { item: 'corn', qty: 5, quality: 2 },
        ],
        reward: { item: 'preserves_jar', qty: 1 },
      },
    ],
    roomReward: { type: 'greenhouse', desc: '修复农场温室：玻璃暖房全年可种植任何季节的作物。' },
  },
  {
    id: 'fish_tank',
    name: '观澜渔轩',
    bundles: [
      {
        id: 'river_fish',
        name: '溪河鱼包',
        slots: [
          { item: 'sunfish', qty: 1 },     // 太阳鱼
          { item: 'catfish', qty: 1 },     // 鲶鱼
          { item: 'shad', qty: 1 },        // 鲥鱼
          { item: 'tiger_trout', qty: 1 }, // 虎鳟
        ],
        reward: { item: 'deluxe_bait', qty: 30 },
      },
      {
        id: 'lake_fish',
        name: '山湖鱼包',
        slots: [
          { item: 'bass', qty: 1 }, // 大口黑鲈
          { item: 'carp', qty: 1 },            // 鲤鱼
          { item: 'bullhead', qty: 1 },        // 大头鱼
          { item: 'sturgeon', qty: 1 },        // 鲟鱼
        ],
        reward: { item: 'dressed_spinner', qty: 1 },
      },
      {
        id: 'ocean_fish',
        name: '潮汐海鱼包',
        slots: [
          { item: 'sardine', qty: 1 },      // 沙丁鱼
          { item: 'tuna', qty: 1 },         // 金枪鱼
          { item: 'red_snapper', qty: 1 },  // 红鲷鱼
          { item: 'tilapia', qty: 1 },      // 罗非鱼
        ],
        reward: { item: 'warp_totem_beach', qty: 5 },
      },
      {
        id: 'crab_pot',
        name: '蟹笼丰收包',
        slots: [
          { item: 'lobster', qty: 1 },  // 龙虾
          { item: 'crayfish', qty: 1 }, // 小龙虾
          { item: 'crab', qty: 1 },     // 螃蟹
          { item: 'shrimp', qty: 1 },   // 虾
          { item: 'oyster', qty: 1 },   // 牡蛎
        ],
        reward: { item: 'crab_pot', qty: 3 },
      },
    ],
    roomReward: { type: 'quarry', desc: '移走矿井口的塌方巨石，修复采石场卷扬机，开放采石场深层矿点。' },
  },
  {
    id: 'boiler',
    name: '暖炉机房',
    bundles: [
      {
        id: 'blacksmith',
        name: '炉焰铁匠包',
        slots: [
          { item: 'copper_bar', qty: 1 },
          { item: 'iron_bar', qty: 1 },
          { item: 'gold_bar', qty: 1 },
        ],
        reward: { item: 'furnace', qty: 1 },
      },
      {
        id: 'geologist',
        name: '晶石地质包',
        slots: [
          { item: 'quartz', qty: 1 },        // 石英
          { item: 'earth_crystal', qty: 1 }, // 地晶
          { item: 'tear_crystal', qty: 1 },   // 泪晶
          { item: 'quartz', qty: 1 },   // 火水晶
        ],
        reward: { item: 'omni_geode', qty: 5 },
      },
      {
        id: 'adventurer',
        name: '冒险者募征包',
        slots: [
          { item: 'sap', qty: 99 },
          { item: 'fiber', qty: 10 },
          { item: 'earth_crystal', qty: 1 },
          { item: 'tear_crystal', qty: 1 },
        ],
        reward: { item: 'ring_magnet_small', qty: 1 },
      },
      {
        id: 'construction',
        name: '修缮材料包',
        slots: [
          { item: 'wood', qty: 198 },
          { item: 'stone', qty: 99 },
          { item: 'hardwood', qty: 10 },
        ],
        reward: { item: 'charcoal_kiln', qty: 1 },
      },
    ],
    roomReward: { type: 'minecart', desc: '修复矿车轨道：农场、镇中心、矿井、采石场四站快速通行。' },
  },
  {
    id: 'bulletin',
    name: '萤火布告廊',
    bundles: [
      {
        id: 'animal',
        name: '牧场奉献包',
        slots: [
          { item: 'milk_large', qty: 1 },      // 大瓶牛奶
          { item: 'egg_large', qty: 1 },       // 大鸡蛋
          { item: 'goat_milk_large', qty: 1 }, // 大瓶羊奶
          { item: 'wool', qty: 1 },            // 羊毛
          { item: 'duck_egg', qty: 1 },        // 鸭蛋
        ],
        reward: { item: 'cheese_press', qty: 1 },
      },
      {
        id: 'artisan',
        name: '工匠珍品包',
        slots: [
          { item: 'honey', qty: 1 },        // 蜂蜜
          { item: 'cloth', qty: 1 },        // 布料
          { item: 'cheese', qty: 1 },       // 奶酪
          { item: 'goat_cheese', qty: 1 },  // 山羊奶酪
          { item: 'truffle_oil', qty: 1 },  // 松露油
          { item: 'wine', qty: 1 },         // 果酒
        ],
        reward: { item: 'keg', qty: 1 },
      },
      {
        id: 'chef',
        name: '镇宴厨师包',
        slots: [
          { item: 'maple_syrup', qty: 1 }, // 枫糖浆
          { item: 'truffle', qty: 1 },     // 松露
          { item: 'poppy', qty: 1 },       // 虞美人
          { item: 'fried_egg', qty: 1 },   // 煎蛋
          { any: 'crop', qty: 3, quality: 1 }, // 任意银星作物 ×3（当季鲜材）
        ],
        reward: { item: 'pink_cake', qty: 3 },
      },
      {
        id: 'enchanter',
        name: '微光法师包',
        slots: [
          { item: 'oak_resin', qty: 1 },   // 橡树脂
          { item: 'wine', qty: 1 },
          { item: 'rabbit_foot', qty: 1 }, // 兔脚
          { item: 'grape', qty: 1 }, // 石榴
        ],
        reward: { item: 'gold_bar', qty: 5 },
      },
    ],
    roomReward: { type: 'friendship', desc: '布告廊的心愿全部了结：全镇已结识居民好感 +2 心（500 点）。' },
  },
  {
    id: 'vault',
    name: '旧镇金库',
    bundles: [
      {
        id: 'lumber_fund',
        name: '缆车集资·建材',
        slots: [
          { item: 'wood', qty: 250 },
          { item: 'stone', qty: 150 },
          { item: 'hardwood', qty: 15 },
          { item: 'fiber', qty: 60 },
        ],
        reward: { item: 'fert_quality', qty: 30 },
      },
      {
        id: 'mineral_fund',
        name: '缆车集资·五金',
        slots: [
          { item: 'coal', qty: 30 },
          { item: 'gold_bar', qty: 5 },
          { item: 'refined_quartz', qty: 5 }, // 精炼石英
          { item: 'battery', qty: 1 },   // 电池组
        ],
        reward: { item: 'lightning_rod', qty: 1 },
      },
      {
        id: 'gem_fund',
        name: '缆车集资·宝石',
        slots: [
          { item: 'diamond', qty: 1 },    // 钻石
          { item: 'ruby', qty: 1 },       // 红宝石
          { item: 'jade', qty: 1 },    // 祖母绿
          { item: 'amethyst', qty: 1 }, // 海蓝宝石
        ],
        reward: { item: 'crystalarium', qty: 1 },
      },
      {
        id: 'rare_fund',
        name: '缆车集资·山珍',
        slots: [
          { item: 'ancientfruit', qty: 1 }, // 上古灵果
          { item: 'starfruit', qty: 1 },    // 杨桃
          { item: 'fairyrose', qty: 1 },    // 仙子玫瑰
          { item: 'rabbit_foot', qty: 1 },
        ],
        reward: { item: 'golden_pumpkin', qty: 1 },
      },
    ],
    roomReward: { type: 'bus', desc: '集资修复山道缆车，开通山顶台地新觅食区。' },
  },
];
