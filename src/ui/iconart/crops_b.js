// 像素图标：crops_b | grape(葡萄), eggplant(茄子), amaranth(苋菜), artichoke(洋蓟), beet(甜菜), bokchoy(小白菜), fairyrose(仙子玫瑰), yam(山药), powdermelon(霜瓜), snowpea(雪豆), icebloom(冰晶花), frostroot(霜根菜), wintercress(冬水芹), snowberry(雪莓), icewheat(冰麦), frostflower(霜雪花), wildmix_spring(春日野花), wildmix_summer(夏日野花), wildmix_autumn(秋日野花), wildmix_winter(冬日冰花), ancientfruit(上古灵果) 分组
import { shade } from '../../render/textures.js';

// 葡萄：倒三角紫葡萄串
function grape(g) {
  const P = '#7b4ba6', PD = shade(P, -40), PL = shade(P, 35);
  g.fillStyle = '#4c8a3f'; g.fillRect(10, 3, 5, 3); g.fillRect(8, 4, 2, 2);
  const rows = [[9, 6, 6], [8, 9, 8], [9, 12, 6], [10, 15, 4], [11, 18, 2]];
  for (const [x, y, w] of rows) {
    g.fillStyle = PD; g.fillRect(x - 1, y - 1, w + 2, 3);
  }
  for (const [x, y, w] of rows) {
    g.fillStyle = P; g.fillRect(x, y, w, 2);
  }
  g.fillStyle = PL;
  g.fillRect(9, 6, 2, 1); g.fillRect(13, 9, 2, 1); g.fillRect(9, 12, 2, 1); g.fillRect(11, 15, 1, 1);
}

// 茄子：紫色胖茄子+绿萼
function eggplant(g) {
  const P = '#5b3a8e', PD = shade(P, -40), PL = shade(P, 40);
  g.fillStyle = '#4c8a3f'; g.fillRect(8, 3, 3, 4); g.fillRect(8, 6, 8, 3);
  g.fillStyle = PD; g.fillRect(7, 8, 11, 10); g.fillRect(9, 17, 7, 3);
  g.fillStyle = P; g.fillRect(8, 9, 9, 8); g.fillRect(10, 17, 5, 2);
  g.fillStyle = PL; g.fillRect(9, 10, 2, 5); g.fillRect(10, 9, 2, 1);
}

// 苋菜：红紫穗状花序
function amaranth(g) {
  const P = '#c0385f', PD = shade(P, -35), PL = shade(P, 30);
  g.fillStyle = '#4c8a3f'; g.fillRect(11, 17, 2, 5); g.fillRect(8, 18, 3, 2); g.fillRect(13, 18, 3, 2);
  g.fillStyle = PD; g.fillRect(9, 4, 6, 13);
  g.fillStyle = P;
  g.fillRect(10, 4, 4, 2); g.fillRect(9, 6, 6, 2); g.fillRect(10, 8, 5, 2);
  g.fillRect(9, 10, 5, 2); g.fillRect(10, 12, 4, 2); g.fillRect(10, 14, 3, 2);
  g.fillStyle = PL; g.fillRect(10, 5, 1, 9); g.fillRect(12, 7, 1, 5);
}

// 洋蓟：绿色鳞片花苞
function artichoke(g) {
  const P = '#5e8f4e', PD = shade(P, -35), PL = shade(P, 30);
  g.fillStyle = PD; g.fillRect(11, 18, 2, 4);
  g.fillRect(6, 9, 12, 10);
  g.fillStyle = P;
  g.fillRect(8, 7, 8, 2); g.fillRect(7, 9, 10, 3); g.fillRect(7, 12, 10, 3); g.fillRect(8, 15, 8, 3);
  g.fillStyle = PL;
  g.fillRect(11, 5, 2, 3);
  g.fillRect(8, 8, 2, 2); g.fillRect(14, 8, 2, 2);
  g.fillRect(7, 11, 2, 2); g.fillRect(15, 11, 2, 2);
  g.fillStyle = PD;
  g.fillRect(10, 11, 1, 1); g.fillRect(13, 11, 1, 1); g.fillRect(10, 14, 1, 1); g.fillRect(13, 14, 1, 1);
}

// 甜菜：红色球根+绿叶
function beet(g) {
  const P = '#a82c4e', PD = shade(P, -40), PL = shade(P, 35);
  g.fillStyle = '#4c8a3f';
  g.fillRect(8, 2, 2, 5); g.fillRect(11, 1, 2, 6); g.fillRect(14, 2, 2, 5);
  g.fillStyle = PD; g.fillRect(7, 8, 10, 9); g.fillRect(9, 17, 6, 3); g.fillRect(11, 20, 2, 2);
  g.fillStyle = P; g.fillRect(8, 9, 8, 8); g.fillRect(10, 17, 4, 2); g.fillRect(11, 19, 2, 2);
  g.fillStyle = PL; g.fillRect(9, 10, 2, 4); g.fillRect(10, 9, 2, 1);
}

// 小白菜：绿叶白帮
function bokchoy(g) {
  const G1 = '#4c9a4c', GD = shade(G1, -35), W = '#e8ecdd', WD = shade(W, -25);
  g.fillStyle = GD;
  g.fillRect(5, 2, 4, 8); g.fillRect(15, 2, 4, 8); g.fillRect(9, 1, 6, 9);
  g.fillStyle = G1;
  g.fillRect(6, 3, 3, 6); g.fillRect(15, 3, 3, 6); g.fillRect(10, 2, 4, 7);
  g.fillStyle = shade(G1, 25); g.fillRect(11, 3, 2, 4);
  g.fillStyle = WD; g.fillRect(7, 9, 10, 12);
  g.fillStyle = W; g.fillRect(8, 9, 8, 11);
  g.fillStyle = WD; g.fillRect(11, 10, 2, 10); g.fillRect(9, 11, 1, 7); g.fillRect(14, 11, 1, 7);
}

// 仙子玫瑰：粉色层叠玫瑰
function fairyrose(g) {
  const P = '#f09ac2', PD = shade(P, -40), PL = shade(P, 25);
  g.fillStyle = '#4c8a3f'; g.fillRect(11, 15, 2, 6); g.fillRect(8, 17, 3, 2); g.fillRect(13, 18, 3, 2);
  g.fillStyle = PD; g.fillRect(6, 5, 12, 10);
  g.fillStyle = P; g.fillRect(7, 6, 10, 8);
  g.fillStyle = PD;
  g.fillRect(7, 6, 3, 3); g.fillRect(14, 6, 3, 3); g.fillRect(7, 11, 3, 3); g.fillRect(14, 11, 3, 3);
  g.fillStyle = PL; g.fillRect(9, 8, 6, 4);
  g.fillStyle = '#fff0f6'; g.fillRect(11, 9, 2, 2);
}

// 山药：褐色长块根
function yam(g) {
  const P = '#9c7444', PD = shade(P, -35), PL = shade(P, 30);
  g.fillStyle = PD; g.fillRect(9, 3, 8, 17); g.fillRect(8, 5, 2, 12);
  g.fillStyle = P; g.fillRect(10, 4, 6, 16); g.fillRect(9, 6, 1, 10);
  g.fillStyle = PL; g.fillRect(11, 5, 2, 12);
  g.fillStyle = PD;
  g.fillRect(8, 20, 2, 1); g.fillRect(15, 21, 2, 1); g.fillRect(12, 21, 1, 2);
  g.fillRect(9, 9, 1, 1); g.fillRect(15, 13, 1, 1);
}

// 霜瓜：白绿色瓜+霜纹
function powdermelon(g) {
  const P = '#d9e8d0', PD = shade(P, -45), G = '#8fb890';
  g.fillStyle = PD; g.fillRect(5, 7, 14, 12);
  g.fillStyle = P; g.fillRect(6, 8, 12, 10);
  g.fillStyle = G;
  g.fillRect(8, 8, 2, 10); g.fillRect(14, 8, 2, 10); g.fillRect(11, 8, 2, 10);
  g.fillStyle = shade(G, -25); g.fillRect(6, 8, 1, 10); g.fillRect(17, 8, 1, 10);
  g.fillStyle = '#ffffff';
  g.fillRect(7, 9, 1, 1); g.fillRect(12, 11, 1, 1); g.fillRect(9, 14, 1, 1); g.fillRect(15, 15, 1, 1);
  g.fillStyle = '#4c8a3f'; g.fillRect(11, 4, 2, 3); g.fillRect(13, 5, 2, 1);
}

// 雪豆：浅绿扁豆荚+豆粒
function snowpea(g) {
  const P = '#a8d97a', PD = shade(P, -35), PL = shade(P, 25);
  g.fillStyle = '#4c8a3f'; g.fillRect(4, 5, 3, 2);
  g.fillStyle = PD; g.fillRect(6, 7, 12, 4); g.fillRect(8, 11, 10, 4); g.fillRect(10, 15, 7, 3);
  g.fillStyle = P; g.fillRect(7, 8, 10, 3); g.fillRect(9, 12, 8, 3); g.fillRect(11, 15, 5, 2);
  g.fillStyle = PL;
  g.fillRect(8, 8, 2, 2); g.fillRect(12, 9, 2, 2); g.fillRect(15, 12, 2, 2); g.fillRect(11, 13, 2, 2);
}

// 冰晶花：蓝色六角冰晶
function icebloom(g) {
  const P = '#9fd4f0', PD = shade(P, -40), PL = '#eaf7ff';
  g.fillStyle = '#6a9fc4'; g.fillRect(11, 16, 2, 5);
  g.fillStyle = PD; g.fillRect(11, 4, 2, 14); g.fillRect(5, 10, 14, 2);
  g.fillStyle = P;
  g.fillRect(11, 3, 2, 14); g.fillRect(6, 10, 12, 2);
  g.fillRect(7, 6, 2, 2); g.fillRect(15, 6, 2, 2); g.fillRect(7, 14, 2, 2); g.fillRect(15, 14, 2, 2);
  g.fillRect(9, 4, 1, 2); g.fillRect(14, 4, 1, 2); g.fillRect(5, 8, 2, 1); g.fillRect(17, 8, 2, 1);
  g.fillStyle = PL; g.fillRect(10, 9, 4, 4); g.fillRect(11, 5, 2, 2);
}

// 霜根菜：白色根茎+蓝叶
function frostroot(g) {
  const P = '#e6eef2', PD = shade(P, -30), B = '#7ab3d9';
  g.fillStyle = B;
  g.fillRect(8, 2, 2, 5); g.fillRect(11, 1, 2, 6); g.fillRect(14, 2, 2, 5);
  g.fillStyle = shade(B, -30); g.fillRect(9, 3, 1, 3); g.fillRect(14, 3, 1, 3);
  g.fillStyle = PD; g.fillRect(8, 7, 8, 8); g.fillRect(10, 15, 4, 4); g.fillRect(11, 19, 2, 3);
  g.fillStyle = P; g.fillRect(9, 8, 6, 7); g.fillRect(10, 15, 3, 3); g.fillRect(11, 18, 2, 3);
  g.fillStyle = '#ffffff'; g.fillRect(10, 9, 2, 4);
  g.fillStyle = B; g.fillRect(9, 12, 6, 1);
}

// 冬水芹：深绿细茎羽状叶
function wintercress(g) {
  const P = '#3d7a3d', PD = shade(P, -30), PL = shade(P, 35);
  g.fillStyle = PD; g.fillRect(11, 6, 2, 16);
  g.fillStyle = P;
  const leaf = [[8, 7], [14, 7], [6, 10], [16, 10], [7, 13], [15, 13], [8, 16], [14, 16]];
  for (const [x, y] of leaf) { g.fillRect(x, y, 3, 2); }
  g.fillRect(10, 4, 4, 3);
  g.fillStyle = PL;
  g.fillRect(9, 7, 1, 1); g.fillRect(15, 7, 1, 1); g.fillRect(7, 10, 1, 1); g.fillRect(17, 10, 1, 1);
  g.fillRect(11, 4, 2, 1);
  g.fillStyle = '#f0d040'; g.fillRect(10, 2, 2, 2); g.fillRect(13, 2, 2, 2);
}

// 雪莓：白色浆果串+红枝
function snowberry(g) {
  const P = '#f2f4f6', PD = shade(P, -35);
  g.fillStyle = '#8a4a3a'; g.fillRect(11, 3, 2, 12); g.fillRect(7, 6, 4, 2); g.fillRect(13, 8, 4, 2);
  const B = [[7, 9], [15, 11], [9, 13], [13, 15], [6, 13], [16, 16]];
  for (const [x, y] of B) {
    g.fillStyle = PD; g.fillRect(x - 1, y - 1, 5, 5);
    g.fillStyle = P; g.fillRect(x, y, 3, 3);
    g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1);
  }
}

// 冰麦：蓝白色麦穗
function icewheat(g) {
  const P = '#cfe0ee', PD = shade(P, -40), B = '#8fb8d8';
  g.fillStyle = B; g.fillRect(11, 10, 2, 12);
  g.fillStyle = PD; g.fillRect(9, 2, 6, 9);
  g.fillStyle = P;
  g.fillRect(10, 2, 4, 2); g.fillRect(9, 4, 6, 2); g.fillRect(10, 6, 4, 2); g.fillRect(9, 8, 5, 2);
  g.fillStyle = '#ffffff';
  g.fillRect(8, 3, 2, 1); g.fillRect(14, 3, 2, 1); g.fillRect(8, 6, 2, 1); g.fillRect(14, 6, 2, 1);
  g.fillRect(11, 1, 2, 1);
  g.fillStyle = B; g.fillRect(11, 5, 2, 5);
}

// 霜雪花：白蓝花瓣小花
function frostflower(g) {
  const P = '#e8f2fa', PD = shade(P, -30), C = '#7ab3d9';
  g.fillStyle = '#5a8a6a'; g.fillRect(11, 13, 2, 8); g.fillRect(8, 16, 3, 2);
  g.fillStyle = PD;
  g.fillRect(9, 3, 6, 3); g.fillRect(9, 10, 6, 3); g.fillRect(5, 6, 3, 6); g.fillRect(16, 6, 3, 6);
  g.fillStyle = P;
  g.fillRect(10, 4, 4, 3); g.fillRect(10, 10, 4, 3); g.fillRect(6, 7, 3, 4); g.fillRect(15, 7, 3, 4);
  g.fillStyle = C; g.fillRect(10, 7, 4, 4);
  g.fillStyle = '#ffffff'; g.fillRect(11, 8, 2, 2);
}

// 野花组合辅助：三朵小花
function wildflowers(g, colors, leafC) {
  const L = shade(leafC, -20);
  g.fillStyle = L;
  g.fillRect(6, 14, 2, 7); g.fillRect(11, 12, 2, 9); g.fillRect(16, 15, 2, 6);
  g.fillStyle = leafC;
  g.fillRect(4, 18, 3, 2); g.fillRect(13, 19, 3, 2); g.fillRect(17, 19, 3, 2);
  const F = [[5, 10, colors[0]], [10, 7, colors[1]], [15, 11, colors[2]]];
  for (const [x, y, c] of F) {
    const cd = shade(c, -30);
    g.fillStyle = cd; g.fillRect(x, y, 5, 5);
    g.fillStyle = c; g.fillRect(x + 1, y, 3, 5); g.fillRect(x, y + 1, 5, 3);
    g.fillStyle = '#ffe98a'; g.fillRect(x + 2, y + 2, 1, 1);
  }
}

function wildmix_spring(g) { wildflowers(g, ['#f5a8c8', '#c8a8f0', '#ffffff'], '#6aae5a'); }
function wildmix_summer(g) { wildflowers(g, ['#f0d040', '#f07838', '#e04868'], '#3d8a3d'); }
function wildmix_autumn(g) { wildflowers(g, ['#e08830', '#c04828', '#d8b830'], '#8a7a3a'); }
function wildmix_winter(g) { wildflowers(g, ['#cfe6f8', '#9fd4f0', '#ffffff'], '#7a9ab0'); }

// 上古灵果：蓝绿异果+金色纹路
function ancientfruit(g) {
  const P = '#3fae9c', PD = shade(P, -40), PL = shade(P, 30);
  g.fillStyle = '#6aae5a'; g.fillRect(10, 2, 4, 3); g.fillRect(12, 3, 4, 2);
  g.fillStyle = PD; g.fillRect(7, 6, 11, 13); g.fillRect(9, 18, 7, 3);
  g.fillStyle = P; g.fillRect(8, 7, 9, 11); g.fillRect(10, 18, 5, 2);
  g.fillStyle = '#f0c040';
  g.fillRect(10, 8, 1, 8); g.fillRect(14, 9, 1, 7);
  g.fillRect(10, 11, 5, 1); g.fillRect(9, 15, 6, 1);
  g.fillStyle = PL; g.fillRect(9, 8, 1, 6);
  g.fillStyle = '#bfefff'; g.fillRect(12, 12, 2, 2);
}

export const DRAWERS = {
  grape,
  eggplant,
  amaranth,
  artichoke,
  beet,
  bokchoy,
  fairyrose,
  yam,
  powdermelon,
  snowpea,
  icebloom,
  frostroot,
  wintercress,
  snowberry,
  icewheat,
  frostflower,
  wildmix_spring,
  wildmix_summer,
  wildmix_autumn,
  wildmix_winter,
  ancientfruit,
};
