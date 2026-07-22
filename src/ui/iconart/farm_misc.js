// 像素图标：肥料 + 农耕设施 + 图腾/栅栏/地板等杂项（27 个）
// 每个 drawer 在 24×24 透明画布上绘制，g 为 2D context。
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// 肥料袋：袋身 + 等级色点阵 + 内容物符号
function bag(g, body, mark, dots) {
  g.fillStyle = shade(body, -50); g.fillRect(5, 6, 14, 15);      // 暗边
  g.fillStyle = body; g.fillRect(6, 5, 12, 15);
  g.fillStyle = shade(body, -35); g.fillRect(6, 5, 12, 3);       // 折口
  g.fillStyle = mark; g.fillRect(8, 10, 8, 7);                   // 标签
  g.fillStyle = shade(mark, -40);
  for (const [x, y] of dots) g.fillRect(x, y, 2, 2);
}

// 图腾柱：木杆 + 顶饰
function totem(g, pole, top, topDraw) {
  g.fillStyle = shade(pole, -40); g.fillRect(9, 8, 6, 13);
  g.fillStyle = pole; g.fillRect(10, 8, 4, 13);
  g.fillStyle = top; topDraw(g);
}

// 栅栏：两根立柱 + 横杆
function fence(g, col, dark) {
  g.fillStyle = dark;
  g.fillRect(4, 7, 4, 13); g.fillRect(16, 7, 4, 13);
  g.fillStyle = col;
  g.fillRect(5, 8, 2, 11); g.fillRect(17, 8, 2, 11);
  g.fillStyle = dark; g.fillRect(3, 10, 18, 3); g.fillRect(3, 15, 18, 3);
  g.fillStyle = col; g.fillRect(3, 11, 18, 1); g.fillRect(3, 16, 18, 1);
}

// 地板砖：2×2 拼块
function tiles(g, col, line, accent) {
  g.fillStyle = line; g.fillRect(3, 3, 18, 18);
  g.fillStyle = col;
  g.fillRect(4, 4, 8, 8); g.fillRect(13, 4, 8, 8); g.fillRect(4, 13, 8, 8); g.fillRect(13, 13, 8, 8);
  if (accent) { g.fillStyle = accent; g.fillRect(13, 13, 3, 3); g.fillRect(4, 4, 3, 3); }
}

export const DRAWERS = {
  // ---- 肥料（绿叶符号，星级点数区分等级）----
  fert_basic: (g) => bag(g, '#B89B6A', '#8AE84A', [[11, 12]]),
  fert_quality: (g) => bag(g, '#A89060', '#8AE84A', [[10, 12], [13, 12]]),
  fert_deluxe: (g) => bag(g, '#988050', '#8AE84A', [[9, 12], [12, 12], [15, 12]]),
  // ---- 保湿土（水滴符号）----
  soil_basic: (g) => bag(g, '#7A5A3A', '#4AC8E8', [[11, 12]]),
  soil_quality: (g) => bag(g, '#6E5030', '#4AC8E8', [[10, 12], [13, 12]]),
  soil_deluxe: (g) => bag(g, '#624628', '#4AC8E8', [[9, 12], [12, 12], [15, 12]]),
  // ---- 生长激素（上升箭头感，黄点）----
  gro_basic: (g) => bag(g, '#C8B45A', '#E8C469', [[11, 14]]),
  gro_quality: (g) => bag(g, '#BFAE50', '#E8C469', [[10, 14], [13, 13]]),
  gro_hyper: (g) => bag(g, '#B0A040', '#FFD98A', [[9, 14], [12, 13], [15, 12]]),

  // ---- 洒水器 ----
  sprinkler1: (g) => { // 铜
    g.fillStyle = '#7A4A20'; g.fillRect(11, 9, 2, 12);
    g.fillStyle = '#B87333'; g.fillRect(8, 6, 8, 4); g.fillRect(6, 19, 12, 2);
    g.fillStyle = '#4AC8E8'; g.fillRect(4, 3, 2, 2); g.fillRect(18, 3, 2, 2); g.fillRect(11, 1, 2, 2);
  },
  sprinkler2: (g) => { // 钢
    g.fillStyle = '#707078'; g.fillRect(11, 9, 2, 12);
    g.fillStyle = '#C0C0C8'; g.fillRect(8, 6, 8, 4); g.fillRect(6, 19, 12, 2);
    g.fillStyle = '#E8F0F8'; g.fillRect(9, 7, 2, 2);
    g.fillStyle = '#4AC8E8'; g.fillRect(3, 2, 2, 2); g.fillRect(19, 2, 2, 2); g.fillRect(7, 1, 2, 2); g.fillRect(15, 1, 2, 2);
  },
  sprinkler3: (g) => { // 铱
    g.fillStyle = '#3AA8A0'; g.fillRect(11, 9, 2, 12);
    g.fillStyle = '#7AE8E0'; g.fillRect(8, 6, 8, 4); g.fillRect(6, 19, 12, 2);
    g.fillStyle = '#E0FFFF'; g.fillRect(9, 7, 2, 2);
    g.fillStyle = '#B84AE8'; g.fillRect(3, 2, 2, 2); g.fillRect(19, 2, 2, 2); g.fillRect(11, 1, 2, 2);
    g.fillStyle = '#4AC8E8'; g.fillRect(7, 1, 2, 2); g.fillRect(15, 1, 2, 2);
  },

  // ---- 稻草人 ----
  scarecrow: (g) => {
    g.fillStyle = '#8A6B3F'; g.fillRect(11, 9, 2, 12); g.fillRect(5, 11, 14, 2); // 杆+横杆
    g.fillStyle = '#E8C469'; g.fillRect(9, 3, 6, 6);                              // 草头
    g.fillStyle = '#6B4E2E'; g.fillRect(8, 2, 8, 2); g.fillRect(10, 0, 4, 2);     // 草帽
    g.fillStyle = '#2E2E38'; g.fillRect(10, 5, 1, 1); g.fillRect(13, 5, 1, 1);    // 眼
    g.fillStyle = '#C86A4A'; g.fillRect(6, 13, 3, 4); g.fillRect(15, 13, 3, 4);   // 破袖
  },
  scarecrow_deluxe: (g) => {
    g.fillStyle = '#6B4E2E'; g.fillRect(11, 9, 2, 12); g.fillRect(4, 11, 16, 2);
    g.fillStyle = '#FFD98A'; g.fillRect(9, 3, 6, 6);
    g.fillStyle = '#8A2A3A'; g.fillRect(8, 2, 8, 2); g.fillRect(10, 0, 4, 2);     // 红帽
    g.fillStyle = '#2E2E38'; g.fillRect(10, 5, 1, 1); g.fillRect(13, 5, 1, 1);
    g.fillStyle = '#B84AE8'; g.fillRect(5, 13, 4, 5); g.fillRect(15, 13, 4, 5);   // 紫袖
    g.fillStyle = '#FFD98A'; g.fillRect(12, 18, 2, 2);                            // 金坠
  },

  // ---- 图腾 ----
  rain_totem: (g) => totem(g, '#8A6B3F', '#4AC8E8', (g) => { // 蓝雨云
    g.fillRect(7, 2, 10, 5); g.fillRect(9, 1, 6, 2);
    g.fillStyle = '#9FD4F0'; g.fillRect(9, 8, 2, 2); g.fillRect(14, 8, 2, 2);
  }),
  farm_totem: (g) => totem(g, '#8A6B3F', '#8AE84A', (g) => { // 绿叶小屋
    g.fillRect(8, 4, 8, 4); g.fillStyle = '#B89B5A'; g.beginPath(); g.moveTo(7, 4); g.lineTo(12, 0); g.lineTo(17, 4); g.closePath(); g.fill();
  }),
  beach_totem: (g) => totem(g, '#B89B5A', '#E8C469', (g) => { // 贝壳+海蓝
    g.fillRect(7, 3, 10, 4); g.fillStyle = '#4AC8E8'; g.fillRect(9, 1, 6, 2);
    g.fillStyle = '#F0F0F0'; g.fillRect(11, 4, 2, 2);
  }),

  // ---- 工具类杂项 ----
  torch: (g) => {
    g.fillStyle = '#6B4E2E'; g.fillRect(10, 10, 4, 11);
    g.fillStyle = '#E87A3C'; g.fillRect(8, 4, 8, 7);
    g.fillStyle = '#FFD98A'; g.fillRect(10, 2, 4, 5);
    g.fillStyle = '#FFF0C0'; g.fillRect(11, 3, 2, 3);
  },
  staircase: (g) => {
    g.fillStyle = '#707078';
    g.fillRect(3, 17, 6, 4); g.fillRect(9, 13, 6, 8); g.fillRect(15, 9, 6, 12);
    g.fillStyle = '#9A9AA4';
    g.fillRect(3, 17, 6, 2); g.fillRect(9, 13, 6, 2); g.fillRect(15, 9, 6, 2);
  },
  cookout_kit: (g) => { // 篝火 + 烤架
    g.fillStyle = '#6B4E2E'; g.fillRect(5, 17, 14, 3); g.fillRect(7, 15, 3, 2); g.fillRect(14, 15, 3, 2);
    g.fillStyle = '#E87A3C'; g.fillRect(9, 8, 6, 8);
    g.fillStyle = '#FFD98A'; g.fillRect(11, 6, 3, 6);
    g.fillStyle = '#3A3A44'; g.fillRect(4, 3, 16, 2); g.fillRect(4, 3, 2, 5); g.fillRect(18, 3, 2, 5);
  },

  // ---- 栅栏 ----
  fence_wood: (g) => fence(g, '#9A6B3F', '#6B4E2E'),
  fence_stone: (g) => fence(g, '#9A9AA4', '#5A5A64'),
  fence_iron: (g) => fence(g, '#C8D0D8', '#3A4A5A'),

  // ---- 地板 ----
  floor_wood: (g) => tiles(g, '#9A6B3F', '#6B4E2E', '#B8875A'),
  floor_stone: (g) => tiles(g, '#9A9AA4', '#5A5A64', '#B8B8C0'),
  floor_crystal: (g) => tiles(g, '#7AE8E0', '#3AA8A0', '#E0FFFF'),

  // ---- 晶洞 ----
  geode: (g) => {
    g.fillStyle = '#5A5A64'; g.fillRect(4, 8, 16, 12);          // 岩石外壳
    g.fillStyle = '#8D8D96'; g.fillRect(5, 6, 14, 4);
    g.fillStyle = '#3A3A44'; g.fillRect(7, 10, 10, 8);          // 内腔
    g.fillStyle = '#B84AE8'; g.fillRect(9, 12, 2, 4); g.fillRect(13, 11, 2, 5); g.fillRect(11, 14, 2, 3); // 紫晶簇
    g.fillStyle = '#E0B0F8'; g.fillRect(9, 12, 2, 1); g.fillRect(13, 11, 2, 1);
  },
};
