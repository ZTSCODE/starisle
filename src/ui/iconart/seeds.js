// 像素图标：seeds 分组——全部为种子袋/种子图标，每个用对应作物的颜色+不同排列的小颗粒区分
// 覆盖：parsnip/potato/kale/greenbean/strawberry/bluejazz/tulip/rhubarb/melon/blueberry/starfruit/hops/
// tomato/hotpepper/corn/radish/wheat/sunflower/poppy/pumpkin/cranberry/grape/eggplant/amaranth/artichoke/
// beet/bokchoy/fairyrose/yam/powdermelon/snowpea/icebloom/frostroot/wintercress/snowberry/icewheat/
// frostflower/wildmix×4/ancientfruit/wildseeds×4/rare_seed/acorn/maple_seed/pine_cone
// 注：任务书指定的长文件名超出 Windows 260 字符路径上限，故使用 seeds.js。

// 内联 shade（避免连带加载 textures.js 的 three.js 依赖链）
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---- 颗粒排列图案（2x2 颗粒，坐标为左上角）----
const ROW3  = [[8,19],[11,19],[14,19]];
const TRI   = [[11,16],[9,19],[13,19]];
const CLU   = [[10,17],[12,17],[9,19],[11,19],[13,19]];
const LN5   = [[7,18],[9,18],[11,18],[13,18],[15,18]];
const XX    = [[8,16],[14,16],[11,18],[8,20],[14,20]];
const ZIG   = [[8,16],[11,18],[14,16],[9,20],[13,20]];
const RING  = [[11,16],[9,18],[13,18],[11,20]];
const SPILL = [[7,16],[9,17],[11,19],[13,20],[15,21]];
const PAIR  = [[9,18],[13,19]];
const PLUS  = [[11,16],[11,20],[9,18],[13,18]];
const GRID  = [[8,16],[11,16],[14,16],[8,19],[11,19],[14,19]];
const VEE   = [[8,16],[14,16],[10,19],[12,19],[11,21]];
const ARC   = [[8,19],[10,17],[12,17],[14,19],[11,21]];
const SNAKE = [[8,16],[10,17],[12,18],[14,19]];
const DUOV  = [[10,17],[12,17],[11,20]];
const SCAT  = [[8,17],[13,16],[10,19],[15,20],[11,21]];

// 单粒种子：暗色底 + 主色高光
function grain(g, x, y, col) {
  g.fillStyle = shade(col, -50); g.fillRect(x, y, 2, 2);
  g.fillStyle = col; g.fillRect(x, y, 1, 1);
}
function dots(g, pts, col) {
  if (Array.isArray(col)) pts.forEach((p, i) => grain(g, p[0], p[1], col[i % col.length]));
  else pts.forEach(p => grain(g, p[0], p[1], col));
}

// 纸袋：折叠袋口 + 主体 + 彩色标签带 + 袋前洒落颗粒
function bag(g, band, pts, col, body = '#C8A86B') {
  const dark = shade(body, -55), lite = shade(body, 35);
  g.fillStyle = dark; g.fillRect(7, 3, 10, 2);
  g.fillStyle = lite; g.fillRect(8, 4, 8, 1);
  g.fillStyle = dark; g.fillRect(6, 5, 12, 11);
  g.fillStyle = body; g.fillRect(7, 6, 10, 9);
  g.fillStyle = lite; g.fillRect(7, 6, 2, 9);
  g.fillStyle = shade(band, -35); g.fillRect(7, 8, 10, 5);
  g.fillStyle = band; g.fillRect(8, 9, 8, 3);
  g.fillStyle = shade(band, 40); g.fillRect(8, 9, 8, 1);
  dots(g, pts, col === undefined ? band : col);
}

export const DRAWERS = {
  parsnip_seeds:      (g) => bag(g, '#E8E0C8', ROW3),
  potato_seeds:       (g) => bag(g, '#B98A50', TRI),
  kale_seeds:         (g) => bag(g, '#2E7D32', CLU),
  greenbean_seeds:    (g) => bag(g, '#5DAE3E', SNAKE),
  strawberry_seeds:   (g) => bag(g, '#E0393E', GRID),
  bluejazz_seeds:     (g) => bag(g, '#5B7FD9', RING),
  tulip_seeds:        (g) => bag(g, '#F2698C', DUOV),
  rhubarb_seeds:      (g) => bag(g, '#D94F63', LN5),
  melon_seeds:        (g) => bag(g, '#F2843C', VEE),
  blueberry_seeds:    (g) => bag(g, '#3E4FA8', CLU),
  starfruit_seeds:    (g) => bag(g, '#F2D13C', PLUS),
  hops_seeds:         (g) => bag(g, '#7BAE3E', ZIG),
  tomato_seeds:       (g) => bag(g, '#D9362B', ROW3),
  hotpepper_seeds:    (g) => bag(g, '#C8232B', SPILL),
  corn_seeds:         (g) => bag(g, '#F7C93E', GRID),
  radish_seeds:       (g) => bag(g, '#E85B79', TRI),
  wheat_seeds:        (g) => bag(g, '#D9B04C', LN5),
  sunflower_seeds:    (g) => bag(g, '#F7A81C', SNAKE, '#5A3A1E'),
  poppy_seeds:        (g) => bag(g, '#B84AD9', XX),
  pumpkin_seeds:      (g) => bag(g, '#E8761C', ROW3, '#F2E0C8'),
  cranberry_seeds:    (g) => bag(g, '#A81C3E', CLU),
  grape_seeds:        (g) => bag(g, '#7A3EA8', TRI),
  eggplant_seeds:     (g) => bag(g, '#5B2E78', PAIR),
  amaranth_seeds:     (g) => bag(g, '#C84A78', ZIG),
  artichoke_seeds:    (g) => bag(g, '#6E9E5B', VEE),
  beet_seeds:         (g) => bag(g, '#8E1E4E', RING),
  bokchoy_seeds:      (g) => bag(g, '#8ED96E', ROW3),
  fairyrose_seeds:    (g) => bag(g, '#F79BC8', PLUS),
  yam_seeds:          (g) => bag(g, '#B86E3E', PAIR),
  powdermelon_seeds:  (g) => bag(g, '#E8F2F0', ARC, '#B8D8D0'),
  snowpea_seeds:      (g) => bag(g, '#BEE8C8', LN5),
  icebloom_seeds:     (g) => bag(g, '#9ED9F2', RING),
  frostroot_seeds:    (g) => bag(g, '#C8D9E8', TRI),
  wintercress_seeds:  (g) => bag(g, '#6E8E3E', SNAKE),
  snowberry_seeds:    (g) => bag(g, '#F2F2F2', CLU, '#D9D9E2'),
  icewheat_seeds:     (g) => bag(g, '#C8E8E8', GRID),
  frostflower_seeds:  (g) => bag(g, '#A8C8F2', PLUS),
  ancientfruit_seeds: (g) => bag(g, '#2E9E8E', XX),
  // 四季混合种子包：彩带 + 多色颗粒
  wildmix_spring_seeds: (g) => bag(g, '#7EC850', SCAT, ['#F79BC8', '#7EC850', '#F2D13C']),
  wildmix_summer_seeds: (g) => bag(g, '#3E9B4F', SCAT, ['#5DAE3E', '#E0393E', '#5B7FD9']),
  wildmix_autumn_seeds: (g) => bag(g, '#C9A24B', SCAT, ['#E8761C', '#8A5A2A', '#D9362B']),
  wildmix_winter_seeds: (g) => bag(g, '#B9D9EB', SCAT, ['#F2F2F2', '#9ED9F2', '#8D8D96']),
  // 野生种子（麻袋质感，袋体偏灰褐）
  wildseeds_spring: (g) => bag(g, '#5DBB4A', SPILL, ['#F79BC8', '#5DBB4A'], '#A8926B'),
  wildseeds_summer: (g) => bag(g, '#2E8B3D', SPILL, ['#F7C93E', '#2E8B3D'], '#A8926B'),
  wildseeds_fall:   (g) => bag(g, '#D9782D', SPILL, ['#D9782D', '#7A5230'], '#A8926B'),
  wildseeds_winter: (g) => bag(g, '#D5DEE6', SPILL, ['#F2F6FA', '#9CC4DC'], '#A8926B'),
  // 稀有种子：深色袋 + 金星标记 + 闪点
  rare_seed: (g) => {
    bag(g, '#F7C93E', [], '#F7C93E', '#3A2E5A');
    const gold = '#FFD94C', gd = shade(gold, -45);
    g.fillStyle = gd;   g.fillRect(10, 9, 4, 4);
    g.fillStyle = gold; g.fillRect(11, 8, 2, 6); g.fillRect(9, 10, 6, 2);
    g.fillStyle = '#FFF2B0'; g.fillRect(11, 10, 1, 1);
    g.fillStyle = gold; g.fillRect(6, 17, 1, 1); g.fillRect(17, 18, 1, 1); g.fillRect(12, 21, 1, 1);
  },
  // 橡子：帽 + 椭圆果身 + 短柄
  acorn: (g) => {
    const body = '#C89B5A', cap = '#7A5230', cd = shade(cap, -30), bl = shade(body, 35);
    g.fillStyle = cd; g.fillRect(11, 4, 2, 3);                 // 柄
    g.fillStyle = cd; g.fillRect(8, 7, 8, 3);                  // 帽沿
    g.fillStyle = cap; g.fillRect(9, 6, 6, 3); g.fillRect(8, 8, 8, 1);
    g.fillStyle = shade(body, -40); g.fillRect(9, 10, 6, 6); g.fillRect(10, 16, 4, 2); g.fillRect(11, 18, 2, 1);
    g.fillStyle = body; g.fillRect(10, 10, 4, 6); g.fillRect(11, 16, 2, 2);
    g.fillStyle = bl; g.fillRect(10, 11, 1, 3);
  },
  // 枫树种子：双翅翅果（V 形翼 + 中央籽粒）
  maple_seed: (g) => {
    const wing = '#D9B98A', wd = shade(wing, -45), seed = '#8A5A2A';
    g.fillStyle = wd;
    g.fillRect(5, 6, 3, 2); g.fillRect(6, 8, 3, 2); g.fillRect(8, 10, 3, 2);    // 左翼
    g.fillRect(16, 6, 3, 2); g.fillRect(15, 8, 3, 2); g.fillRect(13, 10, 3, 2); // 右翼
    g.fillStyle = wing;
    g.fillRect(5, 6, 2, 1); g.fillRect(7, 8, 2, 1); g.fillRect(9, 10, 2, 1);
    g.fillRect(17, 6, 2, 1); g.fillRect(15, 8, 2, 1); g.fillRect(13, 10, 2, 1);
    g.fillStyle = shade(seed, -30); g.fillRect(11, 12, 3, 4);
    g.fillStyle = seed; g.fillRect(11, 12, 2, 3);
    g.fillStyle = shade(wing, 30); g.fillRect(11, 12, 1, 1);
  },
  // 松果：层叠鳞片的锥形
  pine_cone: (g) => {
    const sc = '#8A5A2A', sd = shade(sc, -40), sl = shade(sc, 30);
    g.fillStyle = sd; g.fillRect(11, 4, 2, 2);                              // 顶
    const rows = [[10, 6, 4], [9, 9, 6], [8, 12, 8], [9, 15, 6], [10, 18, 4]];
    for (const [x, y, w] of rows) { g.fillStyle = sd; g.fillRect(x, y, w, 3); }
    for (const [x, y, w] of rows) { g.fillStyle = sc; g.fillRect(x + 1, y, w - 2, 2); }
    // 鳞片缝
    g.fillStyle = sd;
    g.fillRect(11, 9, 1, 2); g.fillRect(13, 9, 1, 2);
    g.fillRect(10, 12, 1, 2); g.fillRect(12, 12, 1, 2); g.fillRect(14, 12, 1, 2);
    g.fillRect(11, 15, 1, 2); g.fillRect(13, 15, 1, 2);
    g.fillStyle = sl; g.fillRect(10, 6, 1, 1); g.fillRect(9, 9, 1, 1);
  },
};
