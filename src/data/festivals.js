// 节日数据：汐溪镇全年 6 个节日（4 主节日 + 2 小型）。纯数据，无逻辑。
// 时间约定：分钟制 360(6:00)–1560(次日2:00)，与 src/core/time.js 一致；season: 0春/1夏/2秋/3冬。
// 坐标约定（场景本地 tile 坐标，来源 docs/design/world.md 场景尺寸）：
//   town 56×48：节日广场 12×12，取 rect { x:22, z:18, w:12, h:12 }（中心 27.5, 23.5）
//   beach 40×32：海在东侧（出口西→镇），灯位沿岸线 x≈31–34，摊位在沙地中部
//   forest 48×40：湖泊在东部，取 rect { x:22, z:14, w:14, h:16 }，冬季结冰为冰湖
// 装饰 type 枚举：flag 彩旗 / lantern 灯笼 / stall 摊位 / tree 花树 / ice 冰雕
// 对标：docs/research/sdv-systems.md §5（蛋蛋节/月光水母/博览会/冰雪节/花舞节/夜市）

export const FESTIVALS = [
  {
    id: 'egg_festival',
    name: '彩蛋节',
    season: 0,
    day: 13,
    scene: 'town',
    startMinute: 540,   // 9:00
    endMinute: 840,     // 14:00
    timeFlow: false,    // 主节日：活动中时间冻结，商店全天关门，动物视为已喂
    setup: {
      decorations: [
        { type: 'flag', x: 22, z: 18 }, { type: 'flag', x: 33, z: 18 },
        { type: 'flag', x: 22, z: 29 }, { type: 'flag', x: 33, z: 29 },
        { type: 'flag', x: 27, z: 18 }, { type: 'flag', x: 28, z: 18 },
        { type: 'flag', x: 27, z: 29 }, { type: 'flag', x: 28, z: 29 },
        { type: 'tree', x: 22, z: 23 }, { type: 'tree', x: 33, z: 24 },
        { type: 'stall', x: 24, z: 19 }, { type: 'stall', x: 31, z: 19 },
      ],
      blockedAreas: [{ x: 22, z: 18, w: 12, h: 12 }], // 寻蛋进行中广场封闭
    },
    activity: {
      type: 'egg_hunt',
      params: {
        durationSec: 50,        // 现实 50 秒（对标蛋蛋节）
        eggItem: 'painted_egg', // 彩蛋（节日道具）
        eggCount: 12,           // 广场内随机藏 12 枚
        winCount: 9,            // 捡到 ≥9 枚获胜
        area: { x: 22, z: 18, w: 12, h: 12 },
      },
    },
    shop: [
      { item: 'strawberry_seeds', price: 100 },   // 对标蛋蛋节草莓种子
      { item: 'deco_plush_rabbit', price: 800 },  // 毛绒兔摆件
      { item: 'deco_pinwheel', price: 500 },      // 纸风车摆件
    ],
    rewards: {
      win: [{ item: 'hat_straw', qty: 1 }],          // 首胜：麦秆草帽（草帽型装饰帽）
      winRepeat: [{ item: 'prize_ticket', qty: 1 }], // 往后再胜：兑奖券
    },
    dialogueHint: '镇长：彩蛋藏在广场的每个角落——50 秒内找到 9 枚就算你赢！',
  },
  {
    id: 'flower_dance',
    name: '花舞节',
    season: 0,
    day: 24,
    scene: 'forest',
    startMinute: 540,   // 9:00
    endMinute: 840,     // 14:00
    timeFlow: false,
    setup: {
      decorations: [
        { type: 'tree', x: 20, z: 16 }, { type: 'tree', x: 28, z: 16 }, // 花树拱门
        { type: 'flag', x: 19, z: 19 }, { type: 'flag', x: 29, z: 19 },
        { type: 'flag', x: 19, z: 25 }, { type: 'flag', x: 29, z: 25 },
        { type: 'lantern', x: 21, z: 27 }, { type: 'lantern', x: 27, z: 27 },
        { type: 'stall', x: 24, z: 15 },
      ],
    },
    activity: {
      type: 'dance',
      params: {
        minHearts: 4,     // 邀请舞伴需 ≥4 心
        askTwice: true,   // 需对话两次正式邀请（对标花舞节）
        danceMinute: 720, // 12:00 开场共舞
        floor: { x: 21, z: 19, w: 7, h: 6 }, // 舞池
      },
    },
    shop: [
      { item: 'deco_flower_basket', price: 1000 }, // 一篮春花
      { item: 'scarecrow_rare', price: 2500 },     // 稀有稻草人（对标花舞节摊位）
    ],
    rewards: {
      danceFriendship: 250, // 与舞伴共舞 +250 好感（=1 心）
    },
    dialogueHint: '花匠：邀请一位四颗心的朋友共舞吧，花香会记住这个春天。',
  },
  {
    id: 'firefly_night_market',
    name: '萤火夜市',
    season: 1,
    day: 11,
    scene: 'beach',
    startMinute: 1020,  // 17:00
    endMinute: 1380,    // 23:00
    timeFlow: false,    // 对标月光水母起舞：仪式期间时间冻结
    setup: {
      decorations: [
        { type: 'lantern', x: 31, z: 6 }, { type: 'lantern', x: 32, z: 9 },
        { type: 'lantern', x: 31, z: 12 }, { type: 'lantern', x: 33, z: 15 },
        { type: 'lantern', x: 31, z: 18 }, { type: 'lantern', x: 32, z: 21 },
        { type: 'lantern', x: 31, z: 24 }, { type: 'lantern', x: 33, z: 27 },
        { type: 'flag', x: 14, z: 8 }, { type: 'flag', x: 14, z: 24 },
        { type: 'stall', x: 12, z: 12 }, { type: 'stall', x: 12, z: 16 },
        { type: 'stall', x: 12, z: 20 },
      ],
    },
    activity: {
      type: 'lantern',
      params: {
        lightUpMinute: 1260,  // 21:00 全镇同放天灯（对标水母抵达时刻）
        lanternItem: 'sky_lantern', // 许愿天灯（商店有售，1 个即可参与）
        wishLuck: 0.02,       // 许愿：次日运气 +0.02
        wishFriendship: 20,   // 与在场村民寒暄 +20（节日通用规则）
      },
    },
    shop: [
      { item: 'sky_lantern', price: 100 },       // 许愿天灯
      { item: 'food_grilled_squid', price: 250 }, // 烤鱿鱼
      { item: 'firework', price: 300 },           // 手持烟花
      { item: 'deco_shell_chime', price: 1200 },  // 贝壳风铃
    ],
    rewards: {
      firstWish: [{ item: 'deco_glow_lantern', qty: 1 }], // 首次放灯纪念：萤火灯笼
    },
    dialogueHint: '老渔夫：把心愿写进灯里，萤火会把它带给海湾的月亮。',
  },
  {
    id: 'harvest_fair',
    name: '丰收博览会',
    season: 2,
    day: 16,
    scene: 'town',
    startMinute: 540,   // 9:00
    endMinute: 900,     // 15:00
    timeFlow: false,
    setup: {
      decorations: [
        { type: 'flag', x: 22, z: 18 }, { type: 'flag', x: 33, z: 18 },
        { type: 'flag', x: 22, z: 29 }, { type: 'flag', x: 33, z: 29 },
        { type: 'flag', x: 27, z: 18 }, { type: 'flag', x: 28, z: 29 },
        { type: 'stall', x: 24, z: 20 }, { type: 'stall', x: 27, z: 20 },
        { type: 'stall', x: 30, z: 20 }, { type: 'stall', x: 24, z: 27 },
        { type: 'stall', x: 30, z: 27 }, { type: 'stall', x: 27, z: 28 },
      ],
      blockedAreas: [{ x: 23, z: 19, w: 10, h: 10 }], // 评比期间展区封闭
    },
    activity: {
      type: 'grange',
      params: {
        displaySlots: 9,      // 摆 9 件展品（对标农庄展览）
        judgeMinute: 780,     // 13:00 开评
        // 单件得分 = 品质分 + 稀有度分；另加类别丰富度
        qualityPoints: [0, 2, 4, 6],   // 普通/银/金/铱
        rarityPrice: [200, 750],       // 单价 ≥200 +2，≥750 再 +2
        categoryBonus: 3,              // 每出现 1 个新类别 +3（crop/fish/forage/artisan/animal/gem）
      },
    },
    shop: [
      { item: 'stardrop', price: 2000, currency: 'star_token' },          // 星之果实（对标博览会头奖）
      { item: 'scarecrow_deluxe', price: 800, currency: 'star_token' },
      { item: 'fert_deluxe', price: 150, currency: 'star_token' },
      { item: 'deco_harvest_wreath', price: 300, currency: 'star_token' }, // 丰收花环
    ],
    rewards: {
      currency: 'star_token', // 星币：评比名次与小游戏产出，仅本日商店可用
      ranks: [
        { rank: 1, minScore: 60, tokens: 1000 },
        { rank: 2, minScore: 45, tokens: 500 },
        { rank: 3, minScore: 30, tokens: 200 },
        { rank: 4, minScore: 0, tokens: 50 },
      ],
      participate: [{ item: 'food_harvest_platter', qty: 1 }], // 免费丰收拼盘（对标格斯汉堡）
    },
    dialogueHint: '镇长：把农庄最得意的九件收成摆上台，让全镇看看你的本事！',
  },
  {
    id: 'ice_sculpture_market',
    name: '冰雕市集',
    season: 3,
    day: 8,
    scene: 'town',
    startMinute: 540,   // 9:00
    endMinute: 840,     // 14:00
    timeFlow: true,     // 小型被动节日：时间正常流逝，商店照常营业（对标夜市类）
    setup: {
      decorations: [
        { type: 'ice', x: 23, z: 19 }, { type: 'ice', x: 32, z: 19 },
        { type: 'ice', x: 23, z: 28 }, { type: 'ice', x: 32, z: 28 },
        { type: 'ice', x: 27, z: 19 }, { type: 'ice', x: 28, z: 28 },
        { type: 'ice', x: 22, z: 23 }, { type: 'ice', x: 33, z: 24 },
        { type: 'lantern', x: 25, z: 18 }, { type: 'lantern', x: 30, z: 18 },
        { type: 'stall', x: 25, z: 26 }, { type: 'stall', x: 28, z: 26 },
        { type: 'stall', x: 30, z: 26 },
      ],
    },
    activity: {
      type: 'market',
      params: {
        iceSculptures: 8,          // 冰雕陈列数（观赏点位）
        sculptorShowMinute: 660,   // 11:00 冰雕师现场凿刻表演
      },
    },
    shop: [
      { item: 'powdermelon_seeds', price: 80 },  // 霜瓜种子（冬季限定）
      { item: 'deco_ice_swan', price: 900 },     // 小冰雕·天鹅
      { item: 'food_hot_cocoa', price: 150 },    // 热可可
    ],
    rewards: {
      attend: [{ item: 'food_hot_cocoa', qty: 2 }], // 入场送热可可 ×2
    },
    dialogueHint: '镇长夫人：冰雕会在阳光下亮一整天，市集的热可可管够。',
  },
  {
    id: 'ice_fishing_contest',
    name: '冰雪垂钓赛',
    season: 3,
    day: 25,
    scene: 'forest',
    startMinute: 540,   // 9:00
    endMinute: 840,     // 14:00
    timeFlow: false,
    setup: {
      decorations: [
        { type: 'ice', x: 22, z: 15 }, { type: 'ice', x: 35, z: 15 },
        { type: 'ice', x: 22, z: 29 }, { type: 'ice', x: 35, z: 29 },
        { type: 'flag', x: 23, z: 16 }, { type: 'flag', x: 34, z: 16 },
        { type: 'flag', x: 23, z: 28 }, { type: 'flag', x: 34, z: 28 },
        { type: 'stall', x: 21, z: 21 }, { type: 'stall', x: 21, z: 24 },
      ],
      blockedAreas: [{ x: 22, z: 14, w: 14, h: 16 }], // 比赛期间冰湖封闭
    },
    activity: {
      type: 'ice_fish',
      params: {
        durationSec: 300,         // 现实 5 分钟计数赛
        rivalScores: [6, 4, 3],   // 三名对手的模拟钓获数，超过最高者即夺冠
        holes: [                  // 冰面钓点（凿开的冰洞）
          { x: 26, z: 18 }, { x: 29, z: 21 }, { x: 25, z: 24 },
          { x: 31, z: 25 }, { x: 28, z: 27 },
        ],
      },
    },
    rewards: {
      win: [ // 首胜渔具套（对标冰雪节：2 钓具 + 磁铁饵 + 水手帽）
        { item: 'tackle_spinner', qty: 1 },
        { item: 'tackle_trap_bobber', qty: 1 },
        { item: 'bait_magnet', qty: 1 },
        { item: 'hat_sailor', qty: 1 },
      ],
      winRepeat: [{ item: 'prize_ticket', qty: 1 }],
    },
    dialogueHint: '钓具店老板：冰湖开洞了——五分钟内钓得最多的人，拿走今年的渔具大奖！',
  },
];
