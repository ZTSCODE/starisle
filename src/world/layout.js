// 汐溪谷·世界布局数据（单一权威来源：绘制/碰撞/交互/道具全部由此驱动）
// 世界坐标系：x -16..144, z -48..112（米）。REGIONS 区域偏移保持不变（见 seamless.js）。
// 设计文档：docs/design/world.md；绘制：world/unified.js；构建：world/builder.js

// ============ 地形分区（生物群系多边形/椭圆） ============
export const BIOMES = [
  { type: 'mountain', rect: [-16, -48, 60, 48] },           // 北境山地（岩草+碎石）
  { type: 'forest', rect: [48, 8, 48, 40] },                // 低语森林（深绿落叶层）
  { type: 'town', rect: [-40, 48, 96, 48] },                // 汐溪镇（草+石板广场；西巷区：茶馆/图书馆/裁缝铺/公园）
  { type: 'beach', rect: [56, 48, 40, 32] },                // 碎星海滩（沙地）
  { type: 'farm', rect: [0, 0, 48, 48] },                   // 晨风农场（草甸）
];

// ============ 连续路网（折线，宽 w 米；type: dirt 土路 / cobble 石板 / sand 沙径） ============
export const ROADS = [
  { id: 'main_north', type: 'dirt', w: 2.6, pts: [[24, -30], [24, -18], [23.5, -4], [23.5, 10], [23.5, 40], [23.5, 48], [26, 54], [27, 62], [24, 68], [22, 78], [20, 86]] },
  { id: 'east_west', type: 'dirt', w: 2.2, pts: [[6, 23], [20, 23], [34, 23], [46, 24], [58, 27], [70, 29], [82, 32], [90, 36], [92, 44], [92, 56], [90, 66]] },
  { id: 'town_loop', type: 'cobble', w: 2.8, pts: [[12, 54], [40, 54], [47, 58], [47, 78], [40, 84], [14, 84], [8, 76], [8, 60], [12, 54]] },
  { id: 'plaza_spur', type: 'cobble', w: 2.4, pts: [[28, 54], [28, 66], [24, 68]] },
  { id: 'to_beach', type: 'dirt', w: 2.2, pts: [[47, 74], [60, 74], [74, 73], [88, 69]] },
  { id: 'pier_walk', type: 'sand', w: 2.0, pts: [[90, 66], [92, 72], [92, 79]] },
  { id: 'forest_trail', type: 'dirt', w: 1.8, pts: [[58, 27], [64, 22], [70, 18], [80, 16], [88, 18], [90, 28], [88, 34]] },
  { id: 'mountain_trail', type: 'dirt', w: 1.8, pts: [[24, -18], [30, -20], [36, -22], [40, -24]] },
  { id: 'town_west', type: 'cobble', w: 2.2, pts: [[8, 70], [-6, 70], [-14, 70], [-22, 70], [-30, 70], [-36, 70]] }, // 西巷主街
  { id: 'west_park', type: 'sand', w: 1.8, pts: [[-22, 70], [-22, 66], [-24, 72], [-22, 78], [-18, 74]] }, // 公园曲径
  { id: 'west_lib', type: 'cobble', w: 1.8, pts: [[-14, 70], [-14, 78], [-14, 82]] },     // 图书馆支路
  { id: 'west_tea', type: 'cobble', w: 1.8, pts: [[-30, 70], [-30, 66], [-14, 66]] },   // 茶馆裁缝支路
];

// ============ 水体 ============
export const WATERS = [
  { id: 'pond', kind: 'lake', ellipse: [33, 32, 4.4, 3.6], animated: true },          // 农场景塘
  { id: 'forest_lake', kind: 'lake', ellipse: [70, 18, 6, 4.5], animated: true },     // 森林湖
  { id: 'cave_lake', kind: 'lake', ellipse: [24, -8, 3.5, 3], animated: true },       // 山间湖
  { id: 'park_pond', kind: 'lake', ellipse: [-24, 74, 3.2, 2.4], animated: true },    // 西巷公园小池塘
  { id: 'sea_south_east', kind: 'sea', rect: [56, 80, 280, 220], animated: true },    // 南海（海滩正南，延伸至海平线）
  { id: 'sea_south_west', kind: 'sea', rect: [-220, 96, 276, 200], animated: true },  // 南海（镇西南，延伸至海平线）
  { id: 'sea_east', kind: 'sea', rect: [96, -180, 240, 340], animated: true },        // 东海（延伸至海平线）
];

// ============ 建筑（footprint 即碰撞） ============
export const BUILDINGS = [
  { id: 'farmhouse', name: '农舍', x: 21, z: 8, w: 6, d: 5, face: 1, roof: '#B8543E', door: [21, 11.2, 'sleep'], windows: 2 },
  { id: 'pierre', name: '汐溪杂货店', x: 21, z: 61, w: 6, d: 6, face: 1, roof: '#B8543E', door: [21, 64.7, 'shop:pierre'], sign: '杂货', windows: 2 },
  { id: 'blacksmith', name: '岩火铁匠铺', x: 34, z: 61, w: 6, d: 6, face: 1, roof: '#5A5A66', door: [34, 64.7, 'shop:blacksmith'], sign: '铁匠', windows: 2 },
  { id: 'cc', name: '汐溪旧会馆', x: 44, z: 66, w: 10, d: 9, face: 1, roof: '#7A6A8A', door: [44, 71.2, 'cc'], ruined: true, windows: 3 },
  { id: 'ranch', name: '青草地牧场', x: 9.5, z: 81.5, w: 7, d: 7, face: -1, roof: '#8A5A2A', door: [9.5, 77.3, 'shop:ranch'], sign: '牧场', windows: 2 },
  { id: 'saloon', name: '汐浪酒吧', x: 44, z: 81.5, w: 6, d: 7, face: -1, roof: '#7A4A6E', door: [44, 77.4, 'shop:saloon'], sign: '酒吧', windows: 2 },
  { id: 'fishshop', name: '潮声渔具店', x: 54, z: 55.5, w: 4, d: 7, face: 1, roof: '#3E8E96', door: [54, 59.7, 'shop:fishshop'], sign: '渔具', windows: 1 },
  { id: 'house1', name: '民居·槐', x: 14, z: 70, w: 5, d: 4, face: 1, roof: '#8A6A4A', door: [14, 72.7, 'home'], windows: 1 },
  { id: 'house2', name: '民居·杨', x: 32, z: 89, w: 5, d: 4, face: -1, roof: '#9A5A4A', door: [32, 86.3, 'home'], windows: 1 },
  { id: 'house3', name: '民居·柳', x: 51, z: 66, w: 5, d: 4, face: -1, roof: '#6A7A8A', door: [51, 63.3, 'home'], windows: 1 },
  { id: 'carpenter', name: '穆青木工坊', x: -2, z: 77, w: 6, d: 6, face: 1, roof: '#7A8A5A', door: [-2, 80.7, 'shop:carpenter'], sign: '木工', windows: 2 },
  { id: 'house4', name: '民居·梅', x: -2, z: 57, w: 5, d: 4, face: 1, roof: '#A85A6A', door: [-2, 59.7, 'home'], windows: 1 },
  { id: 'teahouse', name: '云杉茶馆', x: -14, z: 60, w: 6, d: 5, face: 1, roof: '#3E8E96', door: [-14, 63.2, 'shop:teahouse'], sign: '茶', windows: 2 },
  { id: 'library', name: '溪谷图书馆', x: -14, z: 86, w: 7, d: 6, face: -1, roof: '#4A5A8A', door: [-14, 82.3, 'library'], sign: '书', windows: 3 },
  { id: 'tailor', name: '锦绣裁缝铺', x: -30, z: 60, w: 5, d: 5, face: 1, roof: '#8A5A8A', door: [-30, 63.2, 'shop:tailor'], sign: '衣', windows: 1 },
  { id: 'house5', name: '民居·杏', x: -30, z: 86, w: 5, d: 4, face: -1, roof: '#C87A3A', door: [-30, 83.3, 'home'], windows: 1 },
];

// ============ 重要点位（交互物/设施） ============
export const POI = [
  { id: 'shipping_bin', x: 28, z: 12.5, kind: 'shipping' },
  { id: 'mailbox', x: 26, z: 12.2, kind: 'mail' },
  { id: 'tv_home', x: 19, z: 12, kind: 'tv' },
  { id: 'notice', x: 24.5, z: 69.5, kind: 'notice' },       // 公告板（镇广场南）
  { id: 'casino_door', x: 47.8, z: 80.5, kind: 'casino' },  // 赌场（酒吧后侧）
  { id: 'minecart', x: 30, z: -20, kind: 'minecart' },      // 矿车点（修复后）
  { id: 'bridge_quarry', x: 42, z: -24, kind: 'bridge' },   // 断桥（收集包修复后通采石场）
  { id: 'cart_spot', x: 88, z: 30, kind: 'traveler' },      // 旅行商人车位（森林）
  { id: 'pier_end', x: 92, z: 93, kind: 'pier' },           // 码头尽头（伸入海面的栈桥末端）
];

// ============ 植被撒播区（树木/石头/杂草，带密度与掩码排斥） ============
export const FOREST_DENSE = [ // 密林主区
  { rect: [50, 10, 44, 36], density: 0.55, type: 'tree' },
  { rect: [0, -46, 20, 42], density: 0.3, type: 'tree' },   // 西侧林缘
  { rect: [46, -46, 54, 36], density: 0.25, type: 'tree' }, // 北坡
];
export const SCATTER = {
  treeSparse: [ // 疏树（农场/镇/海滩边缘）
    { rect: [2, 2, 18, 16], density: 0.14 },
    { rect: [36, 2, 10, 22], density: 0.12 },
    { rect: [58, 50, 10, 12], density: 0.08 },
  ],
  rock: [
    { rect: [30, 28, 10, 10], density: 0.08 },              // 农场散石
    { rect: [6, -44, 38, 40], density: 0.22 },              // 山地多石
    { rect: [80, 66, 14, 12], density: 0.06 },              // 海滩礁石
  ],
  weed: [
    { rect: [2, 2, 44, 44], density: 0.32 },                // 农场杂草
    { rect: [48, 8, 48, 40], density: 0.22 },               // 森林杂草
    { rect: [0, 48, 56, 48], density: 0.10 },               // 镇郊杂草
    { rect: [0, -44, 44, 42], density: 0.18 },              // 山地杂草
  ],
};

// ============ 点缀（灯/旗/长椅/栅栏/桥） ============
export const DECOR = {
  lamps: [[23.5, 20], [23.5, 30], [10, 23], [24, 52], [24, 62], [12, 60], [36, 60], [36, 78], [20, 78], [46, 64], [52, 58], [88, 36], [92, 66], [24, -20], [-2, 66], [-4, 80], [-14, 66], [-30, 66], [-22, 62], [-22, 80], [-36, 74]],
  benches: [[26, 64], [31, 64], [90, 70], [-19, 74], [-25, 68]],
  flags: [[26, 60], [31, 60]],                              // 广场旗杆
  fences: [
    { pts: [[6, 39], [26, 39]], type: 'wood' },             // 农田围栏
    { pts: [[5, 40], [5, 47]], type: 'wood' },
    { pts: [[6, 24], [6, 36], [17, 36], [17, 24]], type: 'wood' }, // 畜牧区（避开畜棚槽位）
  ],
  bridges: [], // 镇内河已移除
  pier: { from: [92, 76], to: [92, 94], w: 2.2 },
  signs: [[23, 6, '晨风农场'], [24, 50, '汐溪镇'], [24, -22, '星峰矿洞'], [90, 44, '碎星海滩']],
  // 矿洞入口（岩壁洞口，非房屋）
  mineEntrance: { x: 24, z: -27 },
  // 森林蘑菇圈（湖畔草地，可交互采蘑菇）
  mushroomRing: { x: 62, z: 28, r: 3 },
  // 神秘林地（稀有觅食物刷新点，微光植物）
  secretGrove: { x: 88, z: 12, r: 2.5 },
};

// ============ 碰撞掩码生成规则 ============
// water: WATERS 全部（river 按 w/2 带宽、sea rect、lake ellipse）
// blocked: BUILDINGS footprint + fences 线段 + 矿洞悬崖（z<-30 的 x<0 或 x>44）+ 世界边界
// road: ROADS（行走加速视觉用，无阻）
export const CLIFF_RECTS = [[-16, -48, 60, 16], [44, -48, 16, 16]]; // 北缘山崖带（不可通行）
export const FARM_PLOT = [6, 40, 20, 8]; // 农田垄沟区（视觉用，可耕）
