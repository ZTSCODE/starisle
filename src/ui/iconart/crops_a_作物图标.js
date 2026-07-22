// 像素图标：crops_a | parsnip(防风草), potato(土豆), kale(羽衣甘蓝), greenbean(青豆), strawberry(草莓), bluejazz(蓝爵花), tulip(郁金香), rhubarb(大黄), melon(甜瓜), blueberry(蓝莓), starfruit(杨桃), hops(啤酒花), tomato(番茄), hotpepper(辣椒), corn(玉米), radish(樱桃萝卜), wheat(小麦), sunflower(向日葵), poppy(虞美人), pumpkin(南瓜), cranberry(蔓越莓) 分组
// 内联 shade（避免加载 textures.js 的 three 依赖链）
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const LEAF = '#4CAF50', LEAF_D = '#2E7D32';

// 通用：画一片叶子
function leaf(g, x, y, w, h, col) {
  g.fillStyle = shade(col, -40); g.fillRect(x, y + 1, w, h);       // 暗部底
  g.fillStyle = col; g.fillRect(x, y, w - 1, h - 1);               // 主色
  g.fillStyle = shade(col, 30); g.fillRect(x, y, 1, 1);            // 高光点
}

export const DRAWERS = {
  // 防风草：白色锥形根 + 绿叶
  parsnip: (g) => {
    const B = '#F2EBD8';
    g.fillStyle = shade(B, -50); g.fillRect(10, 8, 6, 10); g.fillRect(11, 18, 4, 3); g.fillRect(12, 21, 2, 2);
    g.fillStyle = B; g.fillRect(10, 8, 5, 10); g.fillRect(11, 18, 3, 3); g.fillRect(12, 21, 1, 2);
    g.fillStyle = shade(B, 25); g.fillRect(10, 8, 1, 9);
    leaf(g, 8, 2, 3, 5, LEAF); leaf(g, 14, 1, 3, 6, LEAF); leaf(g, 11, 4, 3, 4, LEAF_D);
  },
  // 土豆：土褐色椭圆 + 芽眼
  potato: (g) => {
    const B = '#B08850';
    g.fillStyle = shade(B, -45); g.fillRect(7, 9, 11, 9); g.fillRect(8, 8, 9, 11); g.fillRect(9, 18, 7, 2);
    g.fillStyle = B; g.fillRect(8, 9, 9, 9); g.fillRect(9, 8, 7, 11);
    g.fillStyle = shade(B, 30); g.fillRect(9, 9, 3, 2);
    g.fillStyle = shade(B, -60);
    g.fillRect(11, 12, 1, 1); g.fillRect(14, 10, 1, 1); g.fillRect(13, 15, 1, 1); g.fillRect(10, 16, 1, 1);
  },
  // 羽衣甘蓝：深绿皱叶团
  kale: (g) => {
    const B = '#2F6B2F';
    g.fillStyle = shade(B, -35); g.fillRect(6, 7, 12, 13); g.fillRect(5, 9, 14, 9);
    g.fillStyle = B;
    g.fillRect(7, 8, 10, 11); g.fillRect(6, 10, 12, 7);
    g.fillStyle = shade(B, 35);
    g.fillRect(8, 8, 2, 2); g.fillRect(13, 9, 2, 2); g.fillRect(10, 12, 2, 2); g.fillRect(15, 12, 2, 2); g.fillRect(8, 14, 2, 2); g.fillRect(12, 16, 2, 2);
    g.fillStyle = shade(B, -50);
    g.fillRect(10, 9, 1, 3); g.fillRect(14, 13, 1, 3); g.fillRect(9, 15, 1, 3);
  },
  // 青豆：豆荚弧形 + 豆粒
  greenbean: (g) => {
    const B = '#58B84A';
    g.fillStyle = shade(B, -45); g.fillRect(6, 6, 4, 4); g.fillRect(8, 9, 4, 4); g.fillRect(10, 12, 4, 4); g.fillRect(12, 15, 4, 4); g.fillRect(14, 18, 3, 2);
    g.fillStyle = B; g.fillRect(6, 6, 3, 3); g.fillRect(8, 9, 3, 3); g.fillRect(10, 12, 3, 3); g.fillRect(12, 15, 3, 3); g.fillRect(14, 18, 2, 1);
    g.fillStyle = shade(B, 40);
    g.fillRect(7, 6, 1, 1); g.fillRect(9, 9, 1, 1); g.fillRect(11, 12, 1, 1); g.fillRect(13, 15, 1, 1);
    g.fillStyle = LEAF_D; g.fillRect(5, 4, 3, 2);
  },
  // 草莓：红心形 + 籽 + 叶蒂
  strawberry: (g) => {
    const B = '#E03040';
    g.fillStyle = shade(B, -45); g.fillRect(8, 9, 9, 6); g.fillRect(9, 15, 7, 3); g.fillRect(10, 18, 5, 2); g.fillRect(11, 20, 3, 2);
    g.fillStyle = B; g.fillRect(8, 9, 8, 6); g.fillRect(9, 15, 6, 3); g.fillRect(10, 18, 4, 2); g.fillRect(11, 20, 2, 1);
    g.fillStyle = shade(B, 35); g.fillRect(9, 10, 2, 2);
    g.fillStyle = '#FFE9A0';
    g.fillRect(11, 12, 1, 1); g.fillRect(14, 11, 1, 1); g.fillRect(10, 15, 1, 1); g.fillRect(13, 15, 1, 1); g.fillRect(12, 18, 1, 1);
    g.fillStyle = LEAF; g.fillRect(9, 6, 7, 2); g.fillRect(8, 7, 2, 2); g.fillRect(15, 7, 2, 2);
    g.fillStyle = LEAF_D; g.fillRect(11, 5, 3, 2);
  },
  // 蓝爵花：蓝色星形花 + 茎
  bluejazz: (g) => {
    const B = '#5B6FE0';
    g.fillStyle = LEAF_D; g.fillRect(11, 14, 2, 8); g.fillRect(9, 18, 2, 1); g.fillRect(13, 16, 2, 1);
    g.fillStyle = shade(B, -40); g.fillRect(9, 4, 6, 6); g.fillRect(7, 6, 10, 2); g.fillRect(11, 2, 2, 10);
    g.fillStyle = B; g.fillRect(10, 4, 4, 6); g.fillRect(8, 6, 8, 2); g.fillRect(11, 3, 2, 8);
    g.fillStyle = shade(B, 35); g.fillRect(10, 4, 1, 1); g.fillRect(8, 6, 1, 1);
    g.fillStyle = '#FFD85A'; g.fillRect(11, 6, 2, 2);
  },
  // 郁金香：杯状红花 + 茎叶
  tulip: (g) => {
    const B = '#E85A8A';
    g.fillStyle = LEAF_D; g.fillRect(11, 13, 2, 9); g.fillRect(8, 16, 3, 2); g.fillRect(13, 18, 3, 2);
    g.fillStyle = shade(B, -40); g.fillRect(8, 5, 8, 9); g.fillRect(7, 6, 2, 4); g.fillRect(15, 6, 2, 4);
    g.fillStyle = B; g.fillRect(9, 5, 6, 8); g.fillRect(8, 6, 1, 3); g.fillRect(15, 6, 1, 3);
    g.fillStyle = shade(B, 30); g.fillRect(10, 6, 2, 6);
    g.fillStyle = shade(B, -55); g.fillRect(11, 4, 1, 2); g.fillRect(13, 4, 1, 2);
  },
  // 大黄：红茎 + 大叶
  rhubarb: (g) => {
    const S = '#D84A5A';
    g.fillStyle = shade(S, -45); g.fillRect(10, 10, 4, 12);
    g.fillStyle = S; g.fillRect(10, 10, 3, 12);
    g.fillStyle = shade(S, 30); g.fillRect(10, 11, 1, 10);
    g.fillStyle = shade(LEAF, -40); g.fillRect(6, 3, 12, 7); g.fillRect(5, 5, 14, 3);
    g.fillStyle = LEAF; g.fillRect(7, 3, 10, 6); g.fillRect(6, 5, 12, 2);
    g.fillStyle = shade(LEAF, 30); g.fillRect(8, 4, 3, 2);
    g.fillStyle = LEAF_D; g.fillRect(11, 3, 1, 7);
  },
  // 甜瓜：圆绿瓜 + 网纹
  melon: (g) => {
    const B = '#9CC85A';
    g.fillStyle = shade(B, -45); g.fillRect(7, 8, 11, 11); g.fillRect(6, 10, 13, 7); g.fillRect(9, 7, 7, 13);
    g.fillStyle = B; g.fillRect(8, 8, 9, 10); g.fillRect(7, 10, 11, 6); g.fillRect(10, 7, 5, 12);
    g.fillStyle = shade(B, 25); g.fillRect(9, 8, 3, 3);
    g.fillStyle = shade(B, -25);
    g.fillRect(9, 8, 1, 11); g.fillRect(13, 8, 1, 11); g.fillRect(7, 11, 11, 1); g.fillRect(7, 15, 11, 1);
    g.fillStyle = LEAF_D; g.fillRect(11, 4, 2, 4); g.fillRect(13, 5, 2, 1);
  },
  // 蓝莓：三颗蓝紫浆果 + 萼
  blueberry: (g) => {
    const B = '#4A5AB8';
    const berry = (x, y, s) => {
      g.fillStyle = shade(B, -40); g.fillRect(x, y, s, s);
      g.fillStyle = B; g.fillRect(x, y, s - 1, s - 1);
      g.fillStyle = shade(B, 35); g.fillRect(x, y, 1, 1);
      g.fillStyle = shade(B, -55); g.fillRect(x + s - 2, y + s - 2, 2, 2);
    };
    berry(5, 8, 7); berry(12, 6, 7); berry(10, 13, 7);
    g.fillStyle = LEAF_D; g.fillRect(11, 3, 2, 3); g.fillRect(9, 4, 2, 1);
  },
  // 杨桃：黄色五角星截面
  starfruit: (g) => {
    const B = '#F0C83A';
    g.fillStyle = shade(B, -45);
    g.fillRect(10, 4, 4, 4); g.fillRect(4, 9, 6, 4); g.fillRect(14, 9, 6, 4); g.fillRect(7, 15, 5, 5); g.fillRect(13, 15, 5, 5);
    g.fillStyle = B;
    g.fillRect(10, 5, 4, 3); g.fillRect(5, 9, 5, 3); g.fillRect(14, 9, 5, 3); g.fillRect(8, 15, 4, 4); g.fillRect(13, 15, 4, 4);
    g.fillRect(10, 8, 4, 8);
    g.fillStyle = shade(B, 30); g.fillRect(10, 5, 2, 2); g.fillRect(8, 9, 2, 1);
    g.fillStyle = shade(B, -20); g.fillRect(11, 10, 2, 2);
  },
  // 啤酒花：绿色锥形花穗
  hops: (g) => {
    const B = '#7AB84A';
    g.fillStyle = LEAF_D; g.fillRect(11, 3, 2, 4);
    g.fillStyle = shade(B, -40);
    g.fillRect(9, 6, 6, 3); g.fillRect(8, 9, 8, 3); g.fillRect(9, 12, 6, 3); g.fillRect(10, 15, 4, 3); g.fillRect(11, 18, 2, 2);
    g.fillStyle = B;
    g.fillRect(9, 6, 5, 2); g.fillRect(8, 9, 7, 2); g.fillRect(9, 12, 5, 2); g.fillRect(10, 15, 3, 2); g.fillRect(11, 18, 1, 1);
    g.fillStyle = shade(B, 30);
    g.fillRect(10, 6, 2, 1); g.fillRect(9, 9, 2, 1); g.fillRect(10, 12, 2, 1);
    g.fillStyle = shade(B, -15);
    g.fillRect(12, 8, 2, 1); g.fillRect(11, 11, 2, 1); g.fillRect(12, 14, 1, 1);
  },
  // 番茄：圆红果 + 绿萼
  tomato: (g) => {
    const B = '#E03A28';
    g.fillStyle = shade(B, -45); g.fillRect(7, 9, 11, 9); g.fillRect(6, 11, 13, 5); g.fillRect(9, 8, 7, 12);
    g.fillStyle = B; g.fillRect(8, 9, 9, 9); g.fillRect(7, 11, 11, 4); g.fillRect(10, 8, 5, 11);
    g.fillStyle = shade(B, 35); g.fillRect(9, 10, 3, 2);
    g.fillStyle = LEAF_D; g.fillRect(9, 6, 7, 2); g.fillRect(11, 4, 2, 3);
    g.fillStyle = LEAF; g.fillRect(10, 6, 4, 1);
  },
  // 辣椒：弯曲红椒 + 绿柄
  hotpepper: (g) => {
    const B = '#D82818';
    g.fillStyle = shade(B, -45);
    g.fillRect(9, 8, 6, 3); g.fillRect(11, 11, 6, 3); g.fillRect(13, 14, 5, 3); g.fillRect(13, 17, 4, 3); g.fillRect(14, 20, 2, 2);
    g.fillStyle = B;
    g.fillRect(9, 8, 5, 2); g.fillRect(11, 11, 5, 2); g.fillRect(13, 14, 4, 2); g.fillRect(13, 17, 3, 2); g.fillRect(14, 20, 1, 1);
    g.fillStyle = shade(B, 35); g.fillRect(10, 8, 2, 1); g.fillRect(12, 11, 2, 1);
    g.fillStyle = LEAF_D; g.fillRect(8, 5, 3, 4); g.fillRect(7, 4, 2, 2);
  },
  // 玉米：黄玉米棒 + 苞叶
  corn: (g) => {
    const B = '#F0C030';
    g.fillStyle = shade(B, -40); g.fillRect(10, 4, 6, 15); g.fillRect(11, 3, 4, 1);
    g.fillStyle = B; g.fillRect(10, 4, 5, 15); g.fillRect(11, 3, 3, 1);
    g.fillStyle = shade(B, 30); g.fillRect(11, 5, 1, 1); g.fillRect(13, 7, 1, 1); g.fillRect(11, 10, 1, 1); g.fillRect(13, 13, 1, 1);
    g.fillStyle = shade(B, -20);
    g.fillRect(10, 7, 6, 1); g.fillRect(10, 11, 6, 1); g.fillRect(10, 15, 6, 1);
    g.fillStyle = shade(LEAF, -30); g.fillRect(7, 12, 3, 8); g.fillRect(16, 14, 2, 6);
    g.fillStyle = LEAF; g.fillRect(8, 12, 2, 7); g.fillRect(16, 15, 1, 5);
  },
  // 樱桃萝卜：红圆根 + 白尖 + 叶
  radish: (g) => {
    const B = '#E04858';
    g.fillStyle = shade(B, -45); g.fillRect(8, 10, 9, 8); g.fillRect(9, 9, 7, 10); g.fillRect(11, 19, 3, 3);
    g.fillStyle = B; g.fillRect(9, 10, 7, 8); g.fillRect(10, 9, 5, 10); g.fillRect(11, 19, 2, 2);
    g.fillStyle = '#FFFFFF'; g.fillRect(11, 20, 2, 2);
    g.fillStyle = shade(B, 35); g.fillRect(10, 10, 2, 2);
    g.fillStyle = LEAF; g.fillRect(8, 3, 3, 6); g.fillRect(14, 2, 3, 7);
    g.fillStyle = LEAF_D; g.fillRect(11, 4, 3, 5);
  },
  // 小麦：金黄穗 + 芒
  wheat: (g) => {
    const B = '#D8A83A';
    g.fillStyle = shade(B, -30); g.fillRect(11, 12, 2, 10);
    const grain = (x, y) => {
      g.fillStyle = shade(B, -40); g.fillRect(x, y, 4, 3);
      g.fillStyle = B; g.fillRect(x, y, 3, 2);
      g.fillStyle = shade(B, 30); g.fillRect(x, y, 1, 1);
    };
    grain(8, 5); grain(13, 5); grain(8, 8); grain(13, 8); grain(10, 2); grain(8, 11); grain(13, 11);
    g.fillStyle = shade(B, -20);
    g.fillRect(8, 3, 1, 2); g.fillRect(16, 3, 1, 2); g.fillRect(11, 0, 1, 2); g.fillRect(13, 1, 1, 1); g.fillRect(10, 1, 1, 1);
  },
  // 向日葵：棕心 + 黄花瓣 + 茎
  sunflower: (g) => {
    const P = '#F0B830', C = '#6B4520';
    g.fillStyle = LEAF_D; g.fillRect(11, 14, 2, 8); g.fillRect(8, 18, 3, 2); g.fillRect(13, 16, 3, 2);
    g.fillStyle = shade(P, -35);
    g.fillRect(10, 2, 4, 3); g.fillRect(10, 13, 4, 3); g.fillRect(3, 7, 3, 4); g.fillRect(18, 7, 3, 4);
    g.fillRect(5, 3, 3, 3); g.fillRect(16, 3, 3, 3); g.fillRect(5, 12, 3, 3); g.fillRect(16, 12, 3, 3);
    g.fillStyle = P;
    g.fillRect(11, 2, 2, 3); g.fillRect(11, 13, 2, 3); g.fillRect(4, 8, 2, 2); g.fillRect(18, 8, 2, 2);
    g.fillRect(6, 4, 1, 1); g.fillRect(17, 4, 1, 1); g.fillRect(6, 13, 1, 1); g.fillRect(17, 13, 1, 1);
    g.fillStyle = shade(C, -30); g.fillRect(8, 5, 8, 8);
    g.fillStyle = C; g.fillRect(9, 6, 6, 6);
    g.fillStyle = shade(C, 40); g.fillRect(10, 7, 2, 2); g.fillRect(13, 9, 1, 1); g.fillRect(11, 10, 1, 1);
  },
  // 虞美人：红花瓣 + 黑心 + 细茎
  poppy: (g) => {
    const B = '#E03030';
    g.fillStyle = LEAF_D; g.fillRect(11, 12, 1, 10); g.fillRect(9, 17, 2, 1);
    g.fillStyle = shade(B, -45); g.fillRect(7, 5, 10, 7); g.fillRect(6, 6, 12, 5); g.fillRect(8, 4, 8, 9);
    g.fillStyle = B; g.fillRect(8, 5, 8, 6); g.fillRect(7, 6, 10, 4); g.fillRect(9, 4, 6, 8);
    g.fillStyle = shade(B, 30); g.fillRect(8, 5, 3, 2);
    g.fillStyle = '#1A1A22'; g.fillRect(11, 7, 3, 3);
    g.fillStyle = '#FFD85A'; g.fillRect(10, 8, 1, 1); g.fillRect(14, 8, 1, 1);
  },
  // 南瓜：橙色扁圆 + 棱 + 柄
  pumpkin: (g) => {
    const B = '#E07820';
    g.fillStyle = shade(B, -45); g.fillRect(5, 10, 15, 9); g.fillRect(6, 9, 13, 11); g.fillRect(8, 8, 9, 13);
    g.fillStyle = B; g.fillRect(6, 10, 13, 8); g.fillRect(7, 9, 11, 10); g.fillRect(9, 8, 7, 12);
    g.fillStyle = shade(B, 30); g.fillRect(8, 10, 3, 3);
    g.fillStyle = shade(B, -25);
    g.fillRect(9, 9, 1, 10); g.fillRect(15, 9, 1, 10); g.fillRect(6, 12, 1, 5); g.fillRect(18, 12, 1, 5);
    g.fillStyle = '#6B4A20'; g.fillRect(11, 5, 3, 4); g.fillRect(13, 4, 2, 2);
    g.fillStyle = '#8A6230'; g.fillRect(11, 5, 2, 3);
  },
  // 蔓越莓：红色小浆果簇 + 叶
  cranberry: (g) => {
    const B = '#C02040';
    const berry = (x, y) => {
      g.fillStyle = shade(B, -40); g.fillRect(x, y, 5, 5);
      g.fillStyle = B; g.fillRect(x, y, 4, 4);
      g.fillStyle = shade(B, 40); g.fillRect(x, y, 1, 1);
    };
    berry(5, 8); berry(12, 6); berry(9, 12); berry(15, 12); berry(6, 16);
    g.fillStyle = LEAF_D; g.fillRect(11, 3, 2, 3); g.fillRect(9, 4, 2, 1); g.fillRect(13, 4, 2, 1);
    g.fillStyle = LEAF; g.fillRect(11, 3, 1, 2);
  },
};
