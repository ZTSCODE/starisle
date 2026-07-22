// 像素图标：fish_a | 鱼类图标，鱼身剪影+不同颜色/斑纹/鳍形区分：lobster(龙虾), crayfish(螯虾), crab(青蟹), shrimp(白虾), oyster(牡蛎), sunfish(太阳鱼), catfish(鲶鱼), shad(鲥鱼), tiger_trout(虎纹鳟), walleye(玻璃梭鲈), bream(河鳊), rainbow_trout(虹鳟), salmon(鲑鱼), bass(大口鲈), carp(鲤鱼), bullhead(大头鱼), sturgeon(鲟鱼), chub(白鲢) 分组

// 内联 shade（避免连带加载 render/textures.js 的 three.js 依赖链）
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---- 通用像素鱼画法（头朝右）----
function fish(g, x, y, len, color, opts = {}) {
  const dark = shade(color, -55);
  const lite = shade(color, 35);
  const belly = opts.belly || lite;
  const hy = opts.tall ? 5 : (opts.slim ? 2 : 3); // 半高
  // 尾巴（叉形）
  g.fillStyle = opts.tail || dark;
  g.fillRect(x, y - 2, 2, 1);
  g.fillRect(x, y + 2, 2, 1);
  g.fillRect(x + 1, y - 1, 2, 3);
  // 身体逐行（头右尾左）
  const bx = x + 3, bw = len - 3;
  if (opts.tall) {
    // 高身鱼（太阳鱼/河鳊）：菱形高扁身
    const rows = [[2, -4], [1, -3], [0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [1, 3], [2, 4]];
    for (const [pad, dy] of rows) {
      g.fillStyle = dy >= 2 ? belly : (dy <= -2 ? dark : color);
      g.fillRect(bx + pad, y + dy, bw - pad - 1, 1);
    }
  } else {
    for (let dy = -hy; dy <= hy; dy++) {
      const taper = Math.abs(dy);
      const pad = taper >= hy ? 2 : (taper >= hy - 1 ? 1 : 0);
      g.fillStyle = dy >= hy - 1 ? belly : (dy <= -hy + 1 ? dark : color);
      g.fillRect(bx + pad, y + dy, bw - pad, 1);
    }
  }
  // 背鳍
  g.fillStyle = opts.dorsal || dark;
  const df = Math.floor(bw * 0.45);
  g.fillRect(bx + df, y - hy - 1, 4, 1);
  g.fillRect(bx + df + 1, y - hy - 2, 2, 1);
  // 眼
  const hx = bx + bw - 3;
  g.fillStyle = '#101018'; g.fillRect(hx + 1, y - 1, 1, 1);
  // 竖条纹（虎纹）
  if (opts.stripes) {
    g.fillStyle = opts.stripes;
    for (let i = 1; i <= 3; i++) g.fillRect(bx + 1 + i * 3, y - hy + 1, 1, hy * 2 - 1);
  }
  // 斑点
  if (opts.spots) {
    g.fillStyle = opts.spots;
    g.fillRect(bx + 2, y - 2, 1, 1); g.fillRect(bx + 5, y - 1, 1, 1);
    g.fillRect(bx + 8, y - 2, 1, 1); g.fillRect(bx + 4, y, 1, 1);
    g.fillRect(bx + 7, y + 1, 1, 1);
  }
  // 侧线粉带（虹鳟）
  if (opts.lateral) {
    g.fillStyle = opts.lateral;
    g.fillRect(bx, y, bw - 1, 1);
  }
  // 骨板（鲟鱼）
  if (opts.plates) {
    g.fillStyle = shade(color, 50);
    for (let i = 0; i < 4; i++) g.fillRect(bx + 2 + i * 3, y - hy + 1, 1, 1);
  }
  // 胡须（鲶鱼/鲤鱼）
  if (opts.barbel) {
    g.fillStyle = dark;
    g.fillRect(hx + 3, y - 2, 2, 1);
    g.fillRect(hx + 3, y + 2, 2, 1);
  }
  // 大头描边
  if (opts.headBig) {
    g.fillStyle = dark;
    g.fillRect(hx, y - hy, 3, 1);
    g.fillRect(hx, y + hy, 3, 1);
  }
}

// ---- 甲壳类画法 ----
function crustacean(g, color, opts = {}) {
  const dark = shade(color, -55);
  const lite = shade(color, 35);
  // 分节尾部（左下蜷曲）
  g.fillStyle = dark;
  g.fillRect(3, 16, 2, 2); g.fillRect(5, 17, 2, 2); g.fillRect(7, 18, 2, 1);
  g.fillStyle = color;
  g.fillRect(4, 14, 3, 2); g.fillRect(7, 15, 3, 2); g.fillRect(10, 14, 3, 3);
  // 头胸部
  g.fillStyle = color; g.fillRect(13, 12, 5, 6);
  g.fillStyle = lite; g.fillRect(14, 13, 2, 1);
  g.fillStyle = dark; g.fillRect(13, 17, 5, 1);
  // 眼
  g.fillStyle = '#101018'; g.fillRect(17, 12, 1, 1);
  // 触须
  g.fillStyle = dark;
  g.fillRect(18, 9, 1, 3); g.fillRect(19, 7, 1, 3); g.fillRect(16, 10, 2, 1);
  // 大螯
  if (opts.claws) {
    g.fillStyle = color;
    g.fillRect(17, 14, 3, 2); g.fillRect(20, 13, 2, 3);
    g.fillStyle = lite; g.fillRect(20, 13, 1, 1);
    g.fillStyle = dark; g.fillRect(21, 15, 1, 1);
    if (opts.claws === 2) {
      g.fillStyle = color;
      g.fillRect(17, 17, 3, 2); g.fillRect(20, 17, 2, 2);
      g.fillStyle = dark; g.fillRect(21, 18, 1, 1);
    }
  }
  // 小腿
  g.fillStyle = dark;
  for (let i = 0; i < 3; i++) g.fillRect(8 + i * 3, 19, 1, 2);
}

export const DRAWERS = {
  // 龙虾：大红，双巨螯
  lobster: (g) => {
    crustacean(g, '#c8342a', { claws: 2 });
  },
  // 螯虾：暗棕红，体型小一截、单螯
  crayfish: (g) => {
    g.save(); g.translate(1, 3); g.scale(0.85, 0.85);
    crustacean(g, '#8a4a2e', { claws: 1 });
    g.restore();
  },
  // 青蟹：横宽甲壳 + 两侧腿 + 双钳
  crab: (g) => {
    const c = '#3e8e5a', dark = shade(c, -55), lite = shade(c, 40);
    // 腿
    g.fillStyle = dark;
    g.fillRect(3, 13, 2, 1); g.fillRect(3, 16, 2, 1);
    g.fillRect(19, 13, 2, 1); g.fillRect(19, 16, 2, 1);
    g.fillRect(2, 14, 1, 2); g.fillRect(21, 14, 1, 2);
    // 甲壳（扇形横宽）
    g.fillStyle = c;
    g.fillRect(6, 10, 12, 3);
    g.fillRect(5, 13, 14, 4);
    g.fillStyle = lite; g.fillRect(7, 11, 5, 1); g.fillRect(13, 11, 3, 1);
    g.fillStyle = dark; g.fillRect(5, 16, 14, 1);
    // 眼柄
    g.fillStyle = dark; g.fillRect(10, 8, 1, 2); g.fillRect(13, 8, 1, 2);
    g.fillStyle = '#101018'; g.fillRect(10, 8, 1, 1); g.fillRect(13, 8, 1, 1);
    // 双钳
    g.fillStyle = c;
    g.fillRect(3, 9, 3, 2); g.fillRect(2, 8, 2, 2);
    g.fillRect(18, 9, 3, 2); g.fillRect(20, 8, 2, 2);
    g.fillStyle = lite; g.fillRect(2, 8, 1, 1); g.fillRect(21, 8, 1, 1);
  },
  // 白虾：浅粉半透明，弓形细身 + 长触须
  shrimp: (g) => {
    const c = '#f0b8a8', dark = shade(c, -50), lite = shade(c, 30);
    // 弓形身体（分节）
    g.fillStyle = c;
    g.fillRect(5, 10, 3, 2); g.fillRect(8, 9, 3, 2); g.fillRect(11, 9, 3, 2);
    g.fillRect(14, 10, 3, 3);
    g.fillStyle = lite; g.fillRect(8, 9, 2, 1); g.fillRect(14, 10, 2, 1);
    g.fillStyle = dark;
    g.fillRect(5, 11, 2, 1); g.fillRect(8, 10, 1, 1); g.fillRect(11, 10, 1, 1);
    // 尾扇
    g.fillStyle = dark;
    g.fillRect(3, 9, 2, 1); g.fillRect(3, 11, 2, 1); g.fillRect(2, 8, 1, 1); g.fillRect(2, 12, 1, 1);
    // 眼 + 长触须
    g.fillStyle = '#101018'; g.fillRect(16, 10, 1, 1);
    g.fillStyle = dark;
    g.fillRect(17, 7, 1, 3); g.fillRect(18, 5, 1, 3); g.fillRect(19, 4, 2, 1);
    g.fillRect(17, 13, 1, 3); g.fillRect(18, 15, 1, 2);
    // 细腿
    g.fillRect(8, 11, 1, 3); g.fillRect(11, 11, 1, 3); g.fillRect(14, 13, 1, 3);
  },
  // 牡蛎：灰褐双壳微张，内有软肉与小珍珠
  oyster: (g) => {
    const c = '#8d8578', dark = shade(c, -50), lite = shade(c, 40);
    // 下壳（不规则扇形 + 放射纹）
    g.fillStyle = c;
    g.fillRect(5, 13, 14, 3);
    g.fillRect(4, 16, 16, 2);
    g.fillRect(7, 18, 10, 2);
    g.fillStyle = dark;
    g.fillRect(5, 13, 1, 3); g.fillRect(18, 13, 1, 3);
    g.fillRect(7, 19, 10, 1);
    g.fillRect(9, 14, 1, 4); g.fillRect(13, 14, 1, 4); g.fillRect(16, 14, 1, 4);
    // 壳内软肉
    g.fillStyle = '#e8dcc8';
    g.fillRect(8, 12, 8, 3);
    g.fillStyle = shade('#e8dcc8', -30); g.fillRect(10, 14, 4, 1);
    // 小珍珠
    g.fillStyle = '#f4f0ff'; g.fillRect(11, 12, 2, 2);
    g.fillStyle = '#c8c0e0'; g.fillRect(12, 13, 1, 1);
    // 上壳（掀起）
    g.fillStyle = lite;
    g.fillRect(6, 6, 12, 2);
    g.fillRect(5, 8, 13, 2);
    g.fillRect(6, 10, 11, 1);
    g.fillStyle = dark;
    g.fillRect(5, 9, 1, 1); g.fillRect(17, 8, 1, 2);
    g.fillRect(8, 7, 1, 2); g.fillRect(12, 6, 1, 3); g.fillRect(15, 7, 1, 2);
  },
  // 太阳鱼：高扁圆身，蓝背橙腹 + 耳斑
  sunfish: (g) => {
    fish(g, 3, 12, 17, '#4a7ec2', { tall: true, belly: '#e8a33c', dorsal: '#2e5a94' });
    // 鳃盖黑斑（耳斑）
    g.fillStyle = '#16202e'; g.fillRect(18, 11, 2, 2);
    g.fillStyle = '#e86a3c'; g.fillRect(19, 12, 1, 1);
  },
  // 鲶鱼：深灰褐，大平头 + 长胡须
  catfish: (g) => {
    fish(g, 2, 12, 19, '#6a6a72', { belly: '#b8b4a8', barbel: true, headBig: true });
    // 额外长须
    g.fillStyle = shade('#6a6a72', -55);
    g.fillRect(20, 9, 2, 1); g.fillRect(21, 8, 1, 1);
    g.fillRect(20, 15, 2, 1); g.fillRect(21, 16, 1, 1);
  },
  // 鲥鱼：银亮修长
  shad: (g) => {
    fish(g, 3, 12, 18, '#c8d4dc', { slim: true, belly: '#eef4f8', dorsal: '#8aa0ae' });
    g.fillStyle = '#ffffff'; g.fillRect(9, 10, 6, 1);
  },
  // 虎纹鳟：橄榄黄 + 黑色竖纹
  tiger_trout: (g) => {
    fish(g, 3, 12, 18, '#b8a03c', { belly: '#e0d088', stripes: '#3a3418', dorsal: '#7a6828' });
  },
  // 玻璃梭鲈：金橄榄，大玻璃眼 + 斑纹
  walleye: (g) => {
    fish(g, 3, 12, 18, '#9a8a4a', { belly: '#d8cca0', spots: '#5a4e26', dorsal: '#6a5c2e' });
    // 玻璃大眼
    g.fillStyle = '#e8f0f8'; g.fillRect(18, 10, 2, 2);
    g.fillStyle = '#101018'; g.fillRect(19, 11, 1, 1);
  },
  // 河鳊：高扁银灰，红鳍红尾
  bream: (g) => {
    fish(g, 3, 12, 16, '#a8a89a', { tall: true, belly: '#d8d8cc', dorsal: '#c84a3a', tail: '#c84a3a' });
  },
  // 虹鳟：蓝绿背 + 粉色侧带 + 细斑
  rainbow_trout: (g) => {
    fish(g, 3, 12, 18, '#5a8a7a', { belly: '#e8e0d0', lateral: '#e87a9a', spots: '#2a3a34', dorsal: '#3a6055' });
  },
  // 鲑鱼：粉红身 + 钩状颚
  salmon: (g) => {
    fish(g, 3, 12, 18, '#e8788a', { belly: '#f4c8cc', dorsal: '#a84a5a', spots: '#7a3040' });
    // 上钩颚
    g.fillStyle = shade('#e8788a', -55);
    g.fillRect(20, 13, 1, 2); g.fillRect(21, 14, 1, 1);
  },
  // 大口鲈：深绿 + 大嘴裂
  bass: (g) => {
    fish(g, 3, 12, 18, '#4a7a3a', { belly: '#c8d8a0', dorsal: '#2e5424', spots: '#2a4420' });
    // 大嘴裂（斜线）
    g.fillStyle = '#1e3016';
    g.fillRect(18, 14, 2, 1); g.fillRect(16, 15, 2, 1);
  },
  // 鲤鱼：金黄 + 小须 + 大鳞片
  carp: (g) => {
    fish(g, 3, 12, 18, '#c8a03c', { belly: '#ecd898', barbel: true, dorsal: '#8a6820' });
    // 大鳞片感
    g.fillStyle = shade('#c8a03c', -25);
    g.fillRect(8, 11, 1, 1); g.fillRect(11, 12, 1, 1); g.fillRect(14, 11, 1, 1);
    g.fillRect(9, 13, 1, 1); g.fillRect(12, 10, 1, 1); g.fillRect(15, 13, 1, 1);
  },
  // 大头鱼：暗青灰，超大头占半身
  bullhead: (g) => {
    const c = '#5a5a4e', dark = shade(c, -50), lite = shade(c, 40);
    // 尾
    g.fillStyle = dark;
    g.fillRect(2, 10, 2, 1); g.fillRect(2, 14, 2, 1); g.fillRect(3, 11, 2, 3);
    // 细身后段
    g.fillStyle = c;
    g.fillRect(5, 10, 6, 1); g.fillRect(5, 11, 7, 3); g.fillRect(5, 14, 6, 1);
    g.fillStyle = lite; g.fillRect(5, 14, 6, 1);
    // 巨大圆头
    g.fillStyle = c;
    g.fillRect(12, 8, 8, 2); g.fillRect(11, 10, 10, 5); g.fillRect(12, 15, 8, 2);
    g.fillStyle = dark;
    g.fillRect(12, 8, 8, 1); g.fillRect(11, 15, 10, 1);
    g.fillStyle = lite; g.fillRect(13, 9, 4, 1);
    // 眼 + 须
    g.fillStyle = '#101018'; g.fillRect(17, 10, 1, 1);
    g.fillStyle = dark;
    g.fillRect(20, 9, 2, 1); g.fillRect(20, 14, 2, 1); g.fillRect(21, 11, 1, 2);
  },
  // 鲟鱼：青灰长身，尖吻 + 骨板 + 上翘尾叶
  sturgeon: (g) => {
    fish(g, 2, 12, 20, '#7a8894', { slim: true, belly: '#c8d0d8', plates: true, dorsal: '#4a5862' });
    // 尖吻
    g.fillStyle = '#7a8894'; g.fillRect(21, 11, 2, 1);
    g.fillStyle = shade('#7a8894', -55); g.fillRect(22, 12, 1, 1);
    // 上翘尾叶
    g.fillStyle = shade('#7a8894', -55);
    g.fillRect(2, 8, 2, 2); g.fillRect(3, 9, 1, 2);
  },
  // 白鲢：银白细长 + 深色叉尾
  chub: (g) => {
    fish(g, 3, 12, 18, '#d0d8d4', { slim: true, belly: '#f0f4f0', dorsal: '#8a9890' });
    g.fillStyle = '#5a6860';
    g.fillRect(3, 9, 2, 1); g.fillRect(3, 15, 2, 1);
  },
};
