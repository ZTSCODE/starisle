// 像素图标：resources | 基础资源+矿石+锭+杂物：wood(木头), stone(石头), fiber(纤维), sap(树液), coal(煤), clay(黏土), hardwood(硬木), hay(干草), maple_syrup(枫糖浆), oak_resin(橡树脂), pine_tar(松焦油), flour(面粉), sugar(糖), rice(大米), oil(油), vinegar(醋), battery(电池组), refined_quartz(精炼石英), copper_ore(铜矿石), iron_ore(铁矿石), gold_ore(金矿石), iridium_ore(铱矿石), copper_bar(铜锭), iron_bar(铁锭), gold_bar(金锭), iridium_bar(铱锭), driftwood(浮木), broken_glasses(破眼镜), soggy_newspaper(湿报纸) 分组
// shade 内联（render/textures.js 依赖 three，node 环境无法直接加载）
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// 小工具：圆角石块轮廓（阶梯像素）
function rock(g, x, y, w, h, col) {
  const d = shade(col, -45), l = shade(col, 30);
  g.fillStyle = d;
  g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = col;
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = l;
  g.fillRect(x + 2, y + 1, Math.max(2, w >> 1), 1); g.fillRect(x + 1, y + 2, 1, 2);
}
// 矿脉点
function vein(g, pts, col) { g.fillStyle = col; for (const [x, y, w, h] of pts) g.fillRect(x, y, w || 1, h || 1); }
// 金属锭（梯形堆叠感）
function bar(g, col) {
  const d = shade(col, -50), l = shade(col, 40);
  g.fillStyle = d; g.fillRect(4, 8, 16, 10); // 描边底
  g.fillStyle = col; g.fillRect(5, 9, 14, 8);
  g.fillStyle = l; g.fillRect(6, 10, 12, 2); // 顶部高光面
  g.fillStyle = shade(col, -25); g.fillRect(5, 15, 14, 2); // 底暗面
  g.fillStyle = shade(col, 60); g.fillRect(7, 10, 3, 1);
}

export const DRAWERS = {
  // 木头：一截横放圆木，年轮端面
  wood: (g) => {
    const c = '#9A6B3F';
    g.fillStyle = shade(c, -50); g.fillRect(3, 8, 18, 9);
    g.fillStyle = c; g.fillRect(4, 9, 16, 7);
    g.fillStyle = shade(c, -25); g.fillRect(4, 14, 16, 2);
    for (let x = 6; x < 19; x += 4) { g.fillStyle = shade(c, -20); g.fillRect(x, 9, 1, 7); }
    // 端面年轮
    g.fillStyle = '#C89B62'; g.fillRect(3, 9, 3, 7);
    g.fillStyle = '#8A5E34'; g.fillRect(4, 10, 1, 5); g.fillRect(3, 12, 3, 1);
    g.fillStyle = shade(c, 30); g.fillRect(6, 9, 12, 1);
  },
  // 石头：灰色圆石
  stone: (g) => {
    rock(g, 4, 7, 16, 11, '#8D8D96');
    g.fillStyle = '#6E6E78'; g.fillRect(9, 10, 5, 1); g.fillRect(13, 13, 3, 1);
  },
  // 纤维：三根绿色草叶
  fiber: (g) => {
    const c = '#5DBB4A', d = shade(c, -40);
    g.fillStyle = d;
    g.fillRect(7, 5, 2, 15); g.fillRect(11, 3, 2, 17); g.fillRect(15, 6, 2, 14);
    g.fillStyle = c;
    g.fillRect(8, 6, 1, 13); g.fillRect(12, 4, 1, 15); g.fillRect(16, 7, 1, 12);
    g.fillStyle = shade(c, 30); g.fillRect(12, 4, 1, 3); g.fillRect(8, 6, 1, 3);
    g.fillStyle = d; g.fillRect(6, 19, 12, 2);
  },
  // 树液：一滴琥珀色液滴
  sap: (g) => {
    const c = '#E8B93E';
    g.fillStyle = shade(c, -45);
    g.fillRect(11, 4, 2, 2); g.fillRect(9, 6, 6, 2); g.fillRect(8, 8, 8, 8); g.fillRect(9, 16, 6, 2); g.fillRect(11, 18, 2, 1);
    g.fillStyle = c; g.fillRect(10, 7, 4, 9); g.fillRect(9, 9, 6, 6);
    g.fillStyle = shade(c, 45); g.fillRect(10, 9, 2, 3);
  },
  // 煤：黑色多棱块+亮棱
  coal: (g) => {
    const c = '#2A2A32';
    g.fillStyle = '#101018';
    g.fillRect(5, 8, 14, 10); g.fillRect(7, 6, 10, 14);
    g.fillStyle = c; g.fillRect(6, 9, 12, 8); g.fillRect(8, 7, 8, 12);
    g.fillStyle = '#4A4A56'; g.fillRect(8, 8, 3, 2); g.fillRect(13, 11, 3, 2); g.fillRect(9, 14, 2, 2);
    g.fillStyle = '#6A6A78'; g.fillRect(8, 8, 2, 1);
  },
  // 黏土：红棕方块陶土坯
  clay: (g) => {
    const c = '#B87A5A';
    g.fillStyle = shade(c, -45); g.fillRect(4, 9, 16, 9);
    g.fillStyle = c; g.fillRect(5, 10, 14, 7);
    g.fillStyle = shade(c, 25); g.fillRect(5, 10, 14, 2);
    g.fillStyle = shade(c, -20); g.fillRect(7, 13, 4, 1); g.fillRect(13, 15, 4, 1);
  },
  // 硬木：深色竖木段，更粗壮纹理
  hardwood: (g) => {
    const c = '#5A3A20';
    g.fillStyle = shade(c, -35); g.fillRect(6, 3, 12, 18);
    g.fillStyle = c; g.fillRect(7, 4, 10, 16);
    for (let x = 9; x < 16; x += 3) { g.fillStyle = shade(c, -20); g.fillRect(x, 4, 1, 16); }
    g.fillStyle = shade(c, 25); g.fillRect(7, 4, 2, 16);
    g.fillStyle = '#7E5A38'; g.fillRect(12, 8, 2, 3);
  },
  // 干草：金黄草捆+捆绳
  hay: (g) => {
    const c = '#D8B85A';
    g.fillStyle = shade(c, -45); g.fillRect(3, 7, 18, 11);
    g.fillStyle = c; g.fillRect(4, 8, 16, 9);
    g.fillStyle = shade(c, 25); g.fillRect(4, 8, 16, 2);
    for (let y = 11; y < 17; y += 2) { g.fillStyle = shade(c, -15); g.fillRect(4, y, 16, 1); }
    g.fillStyle = '#8A5E34'; g.fillRect(8, 7, 2, 11); g.fillRect(15, 7, 2, 11);
  },
  // 枫糖浆：小瓶+琥珀液+标签
  maple_syrup: (g) => {
    const c = '#C87818';
    g.fillStyle = shade(c, -50);
    g.fillRect(10, 3, 4, 3); g.fillRect(8, 6, 8, 2); g.fillRect(7, 8, 10, 12);
    g.fillStyle = c; g.fillRect(8, 8, 8, 11);
    g.fillStyle = shade(c, 35); g.fillRect(9, 9, 2, 9);
    g.fillStyle = '#8A5E34'; g.fillRect(10, 3, 4, 2);
    g.fillStyle = '#F2E8C8'; g.fillRect(9, 12, 6, 4);
    g.fillStyle = '#B8543E'; g.fillRect(10, 13, 4, 1); g.fillRect(11, 14, 2, 1);
  },
  // 橡树脂：浅金色不规则树脂珠
  oak_resin: (g) => {
    const c = '#E8C86A';
    g.fillStyle = shade(c, -50);
    g.fillRect(8, 8, 9, 8); g.fillRect(7, 10, 11, 5); g.fillRect(10, 6, 5, 2);
    g.fillStyle = c; g.fillRect(9, 9, 7, 6); g.fillRect(10, 8, 5, 8);
    g.fillStyle = shade(c, 40); g.fillRect(10, 9, 3, 3);
    g.fillStyle = shade(c, -20); g.fillRect(13, 13, 3, 2);
  },
  // 松焦油：深黑亮油滴/小罐
  pine_tar: (g) => {
    const c = '#3A2E22';
    g.fillStyle = '#1A140E';
    g.fillRect(7, 7, 10, 12); g.fillRect(9, 5, 6, 2);
    g.fillStyle = c; g.fillRect(8, 8, 8, 10);
    g.fillStyle = '#6A5238'; g.fillRect(9, 9, 2, 6);
    g.fillStyle = '#8A6E4A'; g.fillRect(9, 9, 2, 2);
    g.fillStyle = '#1A140E'; g.fillRect(11, 19, 2, 2); // 滴落
  },
  // 面粉：白面粉袋+洒出的粉
  flour: (g) => {
    const c = '#F2EEE2';
    g.fillStyle = '#B8B0A0';
    g.fillRect(6, 6, 12, 14); g.fillRect(8, 4, 8, 2);
    g.fillStyle = c; g.fillRect(7, 7, 10, 12);
    g.fillStyle = '#D8D2C2'; g.fillRect(7, 7, 10, 3); g.fillRect(8, 4, 8, 1);
    g.fillStyle = '#8A8272'; g.fillRect(9, 12, 6, 1); g.fillRect(10, 14, 4, 1);
    g.fillStyle = c; g.fillRect(4, 19, 3, 1); g.fillRect(18, 20, 2, 1); // 洒粉
  },
  // 糖：蓝白糖罐+方糖
  sugar: (g) => {
    const c = '#7AB8D8';
    g.fillStyle = shade(c, -45);
    g.fillRect(5, 9, 11, 10); g.fillRect(6, 7, 9, 2);
    g.fillStyle = c; g.fillRect(6, 10, 9, 8);
    g.fillStyle = '#F2F6FA'; g.fillRect(6, 10, 9, 3);
    g.fillStyle = shade(c, 30); g.fillRect(7, 14, 2, 3);
    // 方糖
    g.fillStyle = '#C8CCD2'; g.fillRect(17, 14, 5, 5);
    g.fillStyle = '#FFFFFF'; g.fillRect(17, 14, 4, 4);
  },
  // 大米：米粒堆+几粒散落
  rice: (g) => {
    const c = '#F2ECD8';
    g.fillStyle = '#C8BFA8';
    g.fillRect(5, 12, 14, 6); g.fillRect(7, 9, 10, 3); g.fillRect(9, 7, 6, 2);
    g.fillStyle = c;
    g.fillRect(6, 13, 12, 4); g.fillRect(8, 10, 8, 2); g.fillRect(10, 8, 4, 1);
    g.fillStyle = '#FFFFFF'; g.fillRect(7, 13, 2, 1); g.fillRect(11, 11, 2, 1); g.fillRect(14, 14, 2, 1);
    g.fillStyle = '#C8BFA8'; g.fillRect(4, 19, 2, 1); g.fillRect(19, 18, 2, 1);
  },
  // 油：橄榄油瓶，金色液体
  oil: (g) => {
    const c = '#D8A82E';
    g.fillStyle = shade(c, -55);
    g.fillRect(10, 2, 4, 4); g.fillRect(9, 6, 6, 2); g.fillRect(8, 8, 8, 12);
    g.fillStyle = c; g.fillRect(9, 9, 6, 10);
    g.fillStyle = '#8A5E34'; g.fillRect(10, 2, 4, 3);
    g.fillStyle = shade(c, 40); g.fillRect(10, 10, 2, 7);
    g.fillStyle = '#B8861E'; g.fillRect(9, 15, 6, 4);
  },
  // 醋：透明瓶，浅黄液体+软木塞
  vinegar: (g) => {
    const c = '#E8D898';
    g.fillStyle = '#9A9278';
    g.fillRect(10, 3, 4, 3); g.fillRect(8, 6, 8, 3); g.fillRect(7, 9, 10, 11);
    g.fillStyle = '#EAF0E8'; g.fillRect(8, 9, 8, 10); // 玻璃
    g.fillStyle = c; g.fillRect(8, 12, 8, 7); // 液体
    g.fillStyle = shade(c, -20); g.fillRect(8, 18, 8, 1);
    g.fillStyle = '#FFFFFF'; g.fillRect(9, 10, 2, 3);
    g.fillStyle = '#B89B6A'; g.fillRect(10, 3, 4, 2);
  },
  // 电池组：电池+闪电符号
  battery: (g) => {
    const c = '#4AA86E';
    g.fillStyle = '#1E3A2A';
    g.fillRect(5, 6, 14, 14); g.fillRect(9, 3, 6, 3);
    g.fillStyle = c; g.fillRect(6, 7, 12, 12);
    g.fillStyle = '#8A8A96'; g.fillRect(9, 3, 6, 2);
    g.fillStyle = '#2E7A4C'; g.fillRect(6, 15, 12, 4);
    g.fillStyle = '#FFE85A'; // 闪电
    g.fillRect(12, 8, 3, 2); g.fillRect(10, 10, 3, 3); g.fillRect(12, 12, 3, 2); g.fillRect(9, 14, 3, 2); g.fillRect(11, 16, 2, 2);
  },
  // 精炼石英：白色多面晶体簇
  refined_quartz: (g) => {
    const c = '#E8EEF4';
    g.fillStyle = '#9AA4B2';
    g.fillRect(7, 8, 4, 12); g.fillRect(11, 5, 4, 15); g.fillRect(15, 10, 4, 10);
    g.fillStyle = c;
    g.fillRect(8, 9, 2, 10); g.fillRect(12, 6, 2, 13); g.fillRect(16, 11, 2, 8);
    g.fillStyle = '#FFFFFF'; g.fillRect(12, 6, 1, 5); g.fillRect(8, 9, 1, 3);
    g.fillStyle = '#C8D2DE'; g.fillRect(10, 9, 1, 10); g.fillRect(14, 6, 1, 13);
  },
  // 铜矿石：灰石+橙色矿脉
  copper_ore: (g) => {
    rock(g, 4, 6, 16, 12, '#8D8D96');
    vein(g, [[7, 9, 3, 2], [12, 12, 4, 2], [9, 14, 2, 2], [14, 8, 2, 2]], '#E08838');
    vein(g, [[8, 9, 1, 1], [13, 12, 1, 1]], '#F0A858');
  },
  // 铁矿石：灰石+铁灰色金属脉
  iron_ore: (g) => {
    rock(g, 4, 6, 16, 12, '#8D8D96');
    vein(g, [[6, 10, 4, 2], [11, 8, 3, 2], [13, 13, 4, 2], [8, 14, 2, 2]], '#B8BEC8');
    vein(g, [[7, 10, 1, 1], [12, 8, 1, 1], [14, 13, 1, 1]], '#E0E6EE');
  },
  // 金矿石：灰石+金黄矿脉
  gold_ore: (g) => {
    rock(g, 4, 6, 16, 12, '#8D8D96');
    vein(g, [[7, 8, 3, 2], [12, 11, 4, 2], [8, 13, 2, 2], [15, 14, 2, 2]], '#F0C838');
    vein(g, [[8, 8, 1, 1], [13, 11, 1, 1], [9, 13, 1, 1]], '#FFE878');
  },
  // 铱矿石：灰石+紫亮矿脉+星点
  iridium_ore: (g) => {
    rock(g, 4, 6, 16, 12, '#7A7A88');
    vein(g, [[6, 9, 3, 2], [11, 12, 4, 2], [9, 15, 2, 2], [14, 8, 2, 2]], '#B868E8');
    vein(g, [[7, 9, 1, 1], [12, 12, 1, 1], [15, 8, 1, 1]], '#E0A8FF');
    vein(g, [[16, 11, 1, 1], [8, 11, 1, 1]], '#FFFFFF');
  },
  // 铜锭
  copper_bar: (g) => bar(g, '#D8823A'),
  // 铁锭
  iron_bar: (g) => bar(g, '#B8BEC8'),
  // 金锭
  gold_bar: (g) => bar(g, '#F0C838'),
  // 铱锭（带紫色闪光）
  iridium_bar: (g) => {
    bar(g, '#C898F0');
    g.fillStyle = '#FFFFFF'; g.fillRect(16, 6, 1, 1); g.fillRect(15, 7, 3, 1); g.fillRect(16, 8, 1, 1);
  },
  // 浮木：漂白灰色扭曲木条
  driftwood: (g) => {
    const c = '#B0A894';
    g.fillStyle = shade(c, -45);
    g.fillRect(3, 11, 14, 5); g.fillRect(14, 8, 6, 4); g.fillRect(17, 6, 3, 3);
    g.fillStyle = c;
    g.fillRect(4, 12, 12, 3); g.fillRect(14, 9, 5, 2); g.fillRect(18, 7, 2, 1);
    g.fillStyle = shade(c, -20); g.fillRect(6, 13, 4, 1); g.fillRect(12, 14, 3, 1);
    g.fillStyle = shade(c, 30); g.fillRect(4, 12, 6, 1);
  },
  // 破眼镜：圆框+裂痕+断腿
  broken_glasses: (g) => {
    const d = '#3A3A44';
    g.fillStyle = d;
    // 左镜框
    g.fillRect(4, 9, 7, 2); g.fillRect(4, 15, 7, 2); g.fillRect(4, 9, 2, 8); g.fillRect(9, 9, 2, 8);
    // 右镜框
    g.fillRect(13, 9, 7, 2); g.fillRect(13, 15, 7, 2); g.fillRect(13, 9, 2, 8); g.fillRect(18, 9, 2, 8);
    g.fillRect(11, 11, 2, 2); // 鼻梁
    g.fillRect(2, 8, 2, 2); // 左镜腿（断）
    // 镜片
    g.fillStyle = '#A8D8E8'; g.fillRect(6, 11, 3, 4); g.fillRect(15, 11, 3, 4);
    // 裂痕
    g.fillStyle = '#FFFFFF'; g.fillRect(6, 11, 1, 2); g.fillRect(7, 13, 1, 1);
    g.fillStyle = '#E8F4F8'; g.fillRect(16, 12, 1, 2);
  },
  // 湿报纸：灰蓝报纸+水渍+标题行
  soggy_newspaper: (g) => {
    const c = '#C8C8BC';
    g.fillStyle = shade(c, -50);
    g.fillRect(4, 5, 16, 15);
    g.fillStyle = c; g.fillRect(5, 6, 14, 13);
    g.fillStyle = shade(c, -25); g.fillRect(5, 6, 14, 3); // 报头
    g.fillStyle = '#5A5A52'; g.fillRect(6, 7, 8, 1);
    g.fillStyle = shade(c, -30);
    g.fillRect(6, 11, 12, 1); g.fillRect(6, 13, 12, 1); g.fillRect(6, 15, 9, 1);
    // 水渍
    g.fillStyle = '#9AA8B8'; g.fillRect(14, 15, 4, 3); g.fillRect(6, 17, 3, 1);
    g.fillStyle = '#7A8898'; g.fillRect(16, 19, 2, 1);
  },
};
