// 像素图标：machines | 机器设备+家具：furnace(熔炉), mayonnaise_machine(蛋黄酱机), cheese_press(奶酪机), keg(小桶), preserves_jar(罐头瓶), bee_house(蜂房), loom(织布机), oil_maker(产油机), seed_maker(种子机), lightning_rod(避雷针), tapper(树液采集器), charcoal_kiln(木炭窑), recycling_machine(回收机), crystalarium(宝石复制机), crab_pot(蟹笼), worm_bin(虫饵盒), incubator(孵化器), chest(宝箱), fortune_statue(财富雕像), wool_hat(毛线帽), hair_ribbon(蝴蝶结发带), silk_scarf(丝巾) 分组
// 内联 shade，避免连带加载 render/textures.js 依赖链
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export const DRAWERS = {
  // 熔炉：深灰石炉体 + 拱形火口 + 火焰
  furnace: (g) => {
    const body = '#6e6e78';
    g.fillStyle = shade(body, -40); g.fillRect(4, 5, 16, 16);       // 外轮廓
    g.fillStyle = body; g.fillRect(5, 6, 14, 14);
    g.fillStyle = shade(body, 30); g.fillRect(5, 6, 14, 2);          // 顶高光
    g.fillStyle = shade(body, -60); g.fillRect(8, 12, 8, 8);         // 火口
    g.fillStyle = '#e8641b'; g.fillRect(9, 14, 6, 5);                // 火焰
    g.fillStyle = '#f6c344'; g.fillRect(11, 15, 2, 3);
    g.fillStyle = shade(body, -20); g.fillRect(6, 8, 12, 2);         // 石缝
    g.fillStyle = '#3a3a42'; g.fillRect(6, 21, 12, 1);               // 底影
  },

  // 蛋黄酱机：白圆顶机身 + 鸡蛋出口 + 摇柄
  mayonnaise_machine: (g) => {
    const body = '#e8e4da';
    g.fillStyle = shade(body, -50); g.fillRect(6, 8, 12, 13);
    g.fillStyle = body; g.fillRect(7, 9, 10, 11);
    g.fillStyle = body; g.fillRect(8, 5, 8, 4);                      // 圆顶
    g.fillStyle = shade(body, -50); g.fillRect(7, 5, 10, 1);
    g.fillStyle = shade(body, 20); g.fillRect(8, 6, 6, 2);           // 顶高光
    g.fillStyle = '#9c9486'; g.fillRect(9, 12, 6, 5);                // 面板
    g.fillStyle = '#f6f2e8'; g.fillRect(10, 16, 4, 4);               // 鸡蛋
    g.fillStyle = shade(body, -70); g.fillRect(18, 10, 2, 5);        // 摇柄杆
    g.fillStyle = '#8a5a2b'; g.fillRect(17, 9, 4, 2);                // 摇柄头
  },

  // 奶酪机：木桶压架 + 黄色奶酪轮
  cheese_press: (g) => {
    const wood = '#8a5a2b';
    g.fillStyle = shade(wood, -40); g.fillRect(5, 3, 3, 18);         // 立柱
    g.fillStyle = shade(wood, -40); g.fillRect(16, 3, 3, 18);
    g.fillStyle = wood; g.fillRect(4, 3, 16, 3);                     // 顶梁
    g.fillStyle = shade(wood, 20); g.fillRect(4, 3, 16, 1);
    g.fillStyle = shade(wood, -20); g.fillRect(10, 6, 4, 5);         // 压杆
    g.fillStyle = '#d9d3c8'; g.fillRect(6, 11, 12, 2);               // 压板
    const cheese = '#f0c93f';
    g.fillStyle = shade(cheese, -40); g.fillRect(6, 13, 12, 7);      // 奶酪轮
    g.fillStyle = cheese; g.fillRect(7, 14, 10, 5);
    g.fillStyle = shade(cheese, 30); g.fillRect(7, 14, 10, 1);
    g.fillStyle = shade(cheese, -60); g.fillRect(9, 16, 2, 2); g.fillRect(13, 15, 2, 2); // 奶酪孔
  },

  // 小桶：棕木桶 + 铁箍
  keg: (g) => {
    const wood = '#96683a';
    g.fillStyle = shade(wood, -45); g.fillRect(6, 4, 12, 16);
    g.fillRect(5, 7, 14, 10);                                        // 鼓肚轮廓
    g.fillStyle = wood; g.fillRect(7, 5, 10, 14);
    g.fillRect(6, 8, 12, 8);
    g.fillStyle = shade(wood, 25); g.fillRect(7, 5, 2, 14);          // 侧高光
    g.fillStyle = '#4a4a52'; g.fillRect(5, 7, 14, 2);                // 上铁箍
    g.fillRect(5, 15, 14, 2);                                        // 下铁箍
    g.fillStyle = shade(wood, -25); g.fillRect(11, 5, 1, 14); g.fillRect(13, 5, 1, 14); // 板缝
  },

  // 罐头瓶：玻璃罐 + 红色果酱 + 布盖
  preserves_jar: (g) => {
    g.fillStyle = '#b8ccd4'; g.fillRect(7, 7, 10, 14);               // 玻璃
    g.fillStyle = '#dcebf0'; g.fillRect(8, 8, 3, 11);                // 玻璃高光
    g.fillStyle = '#c73e4e'; g.fillRect(8, 12, 8, 8);                // 果酱
    g.fillStyle = shade('#c73e4e', 30); g.fillRect(9, 13, 3, 2);
    g.fillStyle = '#e0b64f'; g.fillRect(7, 4, 10, 4);                // 布盖
    g.fillStyle = shade('#e0b64f', -35); g.fillRect(6, 6, 12, 2);    // 盖檐
    g.fillStyle = '#a8442e'; g.fillRect(9, 5, 2, 2); g.fillRect(13, 5, 2, 2); // 格纹
    g.fillStyle = shade('#b8ccd4', -40); g.fillRect(7, 20, 10, 1);   // 底
  },

  // 蜂房：黄棕层叠蜂箱 + 飞虫
  bee_house: (g) => {
    const box = '#c99b4a';
    g.fillStyle = shade(box, -50); g.fillRect(5, 9, 14, 12);
    g.fillStyle = box; g.fillRect(6, 10, 12, 10);
    g.fillStyle = shade(box, 25); g.fillRect(6, 10, 12, 3);          // 层板亮
    g.fillStyle = shade(box, -20); g.fillRect(6, 13, 12, 1); g.fillRect(6, 16, 12, 1); // 层缝
    g.fillStyle = '#7a4a22'; g.fillRect(4, 6, 16, 3);                // 屋顶
    g.fillStyle = shade('#7a4a22', 25); g.fillRect(4, 6, 16, 1);
    g.fillStyle = '#3a2a18'; g.fillRect(11, 17, 2, 3);               // 入口
    g.fillStyle = '#f0d040'; g.fillRect(18, 12, 2, 1); g.fillRect(3, 12, 2, 1); // 蜜蜂
  },

  // 织布机：木框架 + 竖向经线 + 横向布
  loom: (g) => {
    const wood = '#7a5228';
    g.fillStyle = shade(wood, -40); g.fillRect(4, 3, 2, 18); g.fillRect(18, 3, 2, 18);
    g.fillStyle = wood; g.fillRect(4, 3, 16, 2); g.fillRect(4, 19, 16, 2);
    g.fillStyle = '#e8e0d0'; for (let x = 7; x <= 16; x += 3) g.fillRect(x, 5, 1, 14); // 经线
    g.fillStyle = '#c9556b'; g.fillRect(7, 12, 10, 7);               // 织出的布
    g.fillStyle = shade('#c9556b', 30); g.fillRect(7, 12, 10, 1);
    g.fillStyle = '#e0a03a'; g.fillRect(7, 14, 10, 1);               // 布纹
    g.fillStyle = shade(wood, -20); g.fillRect(6, 10, 12, 2);        // 筘
  },

  // 产油机：深绿机身 + 橄榄漏斗 + 油滴
  oil_maker: (g) => {
    const body = '#5a6e4a';
    g.fillStyle = shade(body, -45); g.fillRect(7, 10, 10, 11);
    g.fillStyle = body; g.fillRect(8, 11, 8, 9);
    g.fillStyle = shade(body, 25); g.fillRect(8, 11, 8, 2);
    g.fillStyle = shade(body, -30); g.fillRect(6, 6, 12, 4);         // 漏斗
    g.fillStyle = '#46543a'; g.fillRect(8, 7, 8, 2);
    g.fillStyle = '#6b8f3e'; g.fillRect(9, 4, 3, 2); g.fillRect(13, 3, 3, 2); // 橄榄
    g.fillStyle = '#e8c53a'; g.fillRect(11, 13, 2, 4);               // 油滴
    g.fillStyle = '#f6e27a'; g.fillRect(11, 13, 1, 1);
  },

  // 种子机：料斗 + 散落种子
  seed_maker: (g) => {
    const body = '#8a7a5a';
    g.fillStyle = shade(body, -45); g.fillRect(6, 9, 12, 12);
    g.fillStyle = body; g.fillRect(7, 10, 10, 10);
    g.fillStyle = shade(body, 25); g.fillRect(7, 10, 10, 2);
    g.fillStyle = shade(body, -30); g.fillRect(8, 4, 8, 5);          // 料斗
    g.fillStyle = '#5a8f3e'; g.fillRect(9, 3, 6, 2);                 // 斗内作物
    g.fillStyle = '#3a3a42'; g.fillRect(10, 14, 4, 4);               // 出口
    g.fillStyle = '#d9b24a'; g.fillRect(10, 19, 2, 2); g.fillRect(13, 20, 2, 2); g.fillRect(8, 21, 2, 2); // 种子
  },

  // 避雷针：铁杆 + 顶端球 + 闪电
  lightning_rod: (g) => {
    g.fillStyle = '#8f97a3'; g.fillRect(11, 6, 2, 15);               // 铁杆
    g.fillStyle = '#c3cad4'; g.fillRect(11, 6, 1, 15);               // 杆高光
    g.fillStyle = '#6a7280'; g.fillRect(9, 20, 6, 2);                // 底座
    g.fillStyle = '#b8c0cc'; g.fillRect(10, 4, 4, 3);                // 顶球
    g.fillStyle = '#f6d83a'; g.fillRect(14, 2, 3, 2); g.fillRect(15, 4, 3, 2); g.fillRect(16, 6, 2, 3); // 闪电
    g.fillStyle = '#8f97a3'; g.fillRect(7, 9, 4, 1); g.fillRect(13, 12, 4, 1); // 侧针
  },

  // 树液采集器：树干 + 挂桶 + 导管
  tapper: (g) => {
    g.fillStyle = '#6e4a26'; g.fillRect(9, 2, 6, 20);                // 树干
    g.fillStyle = shade('#6e4a26', 25); g.fillRect(10, 2, 2, 20);
    g.fillStyle = shade('#6e4a26', -30); g.fillRect(12, 5, 2, 4); g.fillRect(10, 14, 2, 4); // 树皮纹
    g.fillStyle = '#b8bfc8'; g.fillRect(15, 8, 5, 6);                // 挂桶
    g.fillStyle = shade('#b8bfc8', -40); g.fillRect(15, 8, 5, 1); g.fillRect(15, 13, 5, 1);
    g.fillStyle = '#8f97a3'; g.fillRect(14, 9, 2, 1);                // 导管
    g.fillStyle = '#e8d47a'; g.fillRect(16, 10, 3, 3);               // 树液
  },

  // 木炭窑：黑色圆顶窑 + 烟 + 火门
  charcoal_kiln: (g) => {
    const body = '#3f3f47';
    g.fillStyle = shade(body, -25); g.fillRect(6, 10, 12, 11);
    g.fillStyle = body; g.fillRect(7, 11, 10, 9);
    g.fillStyle = body; g.fillRect(8, 7, 8, 4);                      // 圆顶
    g.fillStyle = shade(body, 35); g.fillRect(9, 8, 5, 2);           // 顶高光
    g.fillStyle = '#22222a'; g.fillRect(10, 15, 4, 6);               // 火门
    g.fillStyle = '#e8641b'; g.fillRect(11, 18, 2, 2);               // 火光
    g.fillStyle = '#9a9aa4'; g.fillRect(13, 4, 2, 2); g.fillRect(15, 2, 2, 2); // 烟
  },

  // 回收机：蓝绿箱体 + 循环箭头 + 出料口
  recycling_machine: (g) => {
    const body = '#4a8f8a';
    g.fillStyle = shade(body, -45); g.fillRect(5, 8, 14, 13);
    g.fillStyle = body; g.fillRect(6, 9, 12, 11);
    g.fillStyle = shade(body, 25); g.fillRect(6, 9, 12, 2);
    g.fillStyle = '#2e2e36'; g.fillRect(7, 5, 10, 3);                // 投料口
    g.fillStyle = '#d8f0e8'; g.fillRect(9, 12, 3, 2); g.fillRect(13, 12, 3, 2); // 循环箭头横
    g.fillStyle = '#d8f0e8'; g.fillRect(14, 11, 2, 1); g.fillRect(8, 13, 2, 1);
    g.fillRect(9, 15, 6, 2); g.fillRect(8, 14, 2, 1); g.fillRect(14, 16, 2, 1); // 下半环
    g.fillStyle = '#3a3a42'; g.fillRect(9, 18, 6, 2);                // 出料口
  },

  // 宝石复制机：玻璃罩 + 紫色宝石
  crystalarium: (g) => {
    g.fillStyle = '#7a6a8a'; g.fillRect(5, 17, 14, 4);               // 底座
    g.fillStyle = shade('#7a6a8a', 25); g.fillRect(5, 17, 14, 1);
    g.fillStyle = '#c8dce8'; g.fillRect(7, 5, 10, 12);               // 玻璃罩
    g.fillStyle = '#e4f2f8'; g.fillRect(8, 6, 3, 10);                // 罩高光
    g.fillStyle = '#b8ccd8'; g.fillRect(7, 5, 10, 1); g.fillRect(7, 16, 10, 1);
    const gem = '#9a5fd0';
    g.fillStyle = shade(gem, -40); g.fillRect(10, 9, 4, 6);          // 宝石
    g.fillStyle = gem; g.fillRect(11, 10, 2, 4);
    g.fillStyle = shade(gem, 40); g.fillRect(11, 10, 1, 1);
    g.fillStyle = gem; g.fillRect(10, 8, 4, 1);                      // 尖顶
  },

  // 蟹笼：铁丝笼 + 浮球
  crab_pot: (g) => {
    const wire = '#7a8288';
    g.fillStyle = shade(wire, -35); g.fillRect(5, 10, 14, 10);
    g.fillStyle = '#4a5058'; g.fillRect(6, 11, 12, 8);               // 笼内
    g.fillStyle = wire; for (let x = 6; x <= 17; x += 3) g.fillRect(x, 10, 1, 10); // 竖网
    g.fillRect(5, 13, 14, 1); g.fillRect(5, 16, 14, 1);              // 横网
    g.fillStyle = shade(wire, -20); g.fillRect(7, 7, 10, 3);         // 锥顶
    g.fillStyle = '#d84a3a'; g.fillRect(10, 3, 4, 4);                // 浮球
    g.fillStyle = shade('#d84a3a', 35); g.fillRect(10, 3, 2, 2);
    g.fillStyle = '#c96a3a'; g.fillRect(9, 14, 3, 2); g.fillRect(13, 15, 3, 2); // 蟹影
  },

  // 虫饵盒：土棕盒 + 蚯蚓
  worm_bin: (g) => {
    const box = '#7a5a34';
    g.fillStyle = shade(box, -45); g.fillRect(4, 9, 16, 11);
    g.fillStyle = box; g.fillRect(5, 10, 14, 9);
    g.fillStyle = shade(box, 25); g.fillRect(5, 10, 14, 2);
    g.fillStyle = '#4a3418'; g.fillRect(5, 12, 14, 3);               // 土层
    g.fillStyle = '#c97a8a'; g.fillRect(7, 5, 2, 4); g.fillRect(9, 4, 2, 3);   // 蚯蚓1
    g.fillStyle = '#c97a8a'; g.fillRect(13, 6, 4, 2); g.fillRect(15, 4, 2, 2); // 蚯蚓2
    g.fillStyle = shade('#c97a8a', 30); g.fillRect(7, 5, 1, 2);
    g.fillStyle = shade(box, -20); g.fillRect(4, 19, 16, 1);         // 底
  },

  // 孵化器：暖黄箱 + 鸡蛋 + 红灯
  incubator: (g) => {
    const body = '#c8a86a';
    g.fillStyle = shade(body, -45); g.fillRect(5, 8, 14, 13);
    g.fillStyle = body; g.fillRect(6, 9, 12, 11);
    g.fillStyle = shade(body, 25); g.fillRect(6, 9, 12, 2);
    g.fillStyle = '#f2e8d8'; g.fillRect(7, 12, 10, 6);               // 观察窗
    g.fillStyle = '#fdf8ee'; g.fillRect(10, 13, 4, 5);               // 鸡蛋
    g.fillStyle = shade('#fdf8ee', -25); g.fillRect(13, 13, 1, 5);
    g.fillStyle = '#d84a3a'; g.fillRect(16, 4, 2, 2);                // 红灯
    g.fillStyle = '#5a5a62'; g.fillRect(7, 4, 7, 4);                 // 加热顶
    g.fillStyle = shade('#5a5a62', 30); g.fillRect(7, 4, 7, 1);
  },

  // 宝箱：棕木箱 + 金箍 + 锁
  chest: (g) => {
    const wood = '#8a5a2b';
    g.fillStyle = shade(wood, -45); g.fillRect(4, 8, 16, 12);
    g.fillStyle = wood; g.fillRect(5, 9, 14, 10);
    g.fillStyle = shade(wood, 25); g.fillRect(5, 9, 14, 2);          // 箱盖亮
    g.fillStyle = shade(wood, -25); g.fillRect(5, 13, 14, 1);        // 盖缝
    g.fillStyle = '#e0b64f'; g.fillRect(5, 8, 2, 12); g.fillRect(17, 8, 2, 12); // 金箍
    g.fillStyle = '#f6d83a'; g.fillRect(10, 12, 4, 5);               // 锁
    g.fillStyle = shade('#f6d83a', -50); g.fillRect(11, 14, 2, 2);
  },

  // 财富雕像：金色雕像 + 底座 + 闪光
  fortune_statue: (g) => {
    const gold = '#e8c53a';
    g.fillStyle = '#8a7a5a'; g.fillRect(6, 19, 12, 3);               // 底座
    g.fillStyle = shade('#8a7a5a', 25); g.fillRect(6, 19, 12, 1);
    g.fillStyle = shade(gold, -45); g.fillRect(9, 6, 6, 13);         // 身体轮廓
    g.fillStyle = gold; g.fillRect(10, 7, 4, 12);
    g.fillStyle = shade(gold, -45); g.fillRect(10, 3, 4, 4);         // 头
    g.fillStyle = gold; g.fillRect(11, 4, 2, 2);
    g.fillStyle = shade(gold, 40); g.fillRect(10, 7, 1, 10);         // 高光
    g.fillStyle = gold; g.fillRect(7, 10, 3, 2); g.fillRect(14, 10, 3, 2); // 手臂
    g.fillStyle = '#fff6c8'; g.fillRect(16, 4, 2, 2); g.fillRect(5, 8, 1, 2); // 闪光
  },

  // 毛线帽：红绒帽 + 绒球 + 罗纹边
  wool_hat: (g) => {
    const red = '#c94a54';
    g.fillStyle = shade(red, -45); g.fillRect(6, 8, 12, 9);
    g.fillStyle = red; g.fillRect(7, 9, 10, 7);
    g.fillStyle = shade(red, -20); g.fillRect(8, 7, 8, 2);           // 帽顶
    g.fillStyle = '#f2ece0'; g.fillRect(10, 3, 4, 4);                // 绒球
    g.fillStyle = shade('#f2ece0', -25); g.fillRect(12, 5, 2, 2);
    g.fillStyle = shade(red, -35); g.fillRect(5, 16, 14, 4);         // 罗纹边
    g.fillStyle = shade(red, 15); g.fillRect(6, 17, 2, 2); g.fillRect(10, 17, 2, 2); g.fillRect(14, 17, 2, 2); // 罗纹
    g.fillStyle = shade(red, 30); g.fillRect(7, 10, 4, 1);           // 高光
  },

  // 蝴蝶结发带：粉色双环 + 中心结
  hair_ribbon: (g) => {
    const pink = '#e86a9a';
    g.fillStyle = shade(pink, -50);
    g.fillRect(4, 8, 7, 8); g.fillRect(13, 8, 7, 8);                 // 双环轮廓
    g.fillStyle = pink;
    g.fillRect(5, 9, 5, 6); g.fillRect(14, 9, 5, 6);
    g.fillStyle = shade(pink, 30); g.fillRect(6, 10, 2, 2); g.fillRect(15, 10, 2, 2); // 环高光
    g.fillStyle = shade(pink, -30); g.fillRect(10, 10, 4, 4);        // 中心结
    g.fillStyle = shade(pink, 10); g.fillRect(11, 11, 2, 2);
    g.fillStyle = pink; g.fillRect(9, 15, 2, 5); g.fillRect(13, 15, 2, 5); // 飘带
    g.fillStyle = shade(pink, -40); g.fillRect(9, 19, 2, 1); g.fillRect(13, 19, 2, 1);
  },

  // 丝巾：青色折叠丝巾 + 圆点花纹
  silk_scarf: (g) => {
    const silk = '#4ab8c8';
    g.fillStyle = shade(silk, -45); g.fillRect(5, 7, 14, 10);
    g.fillStyle = silk; g.fillRect(6, 8, 12, 8);
    g.fillStyle = shade(silk, 35); g.fillRect(6, 8, 12, 2);          // 折叠高光
    g.fillStyle = shade(silk, -20); g.fillRect(6, 12, 12, 1);        // 折痕
    g.fillStyle = shade(silk, -45); g.fillRect(7, 17, 4, 4);         // 下垂角
    g.fillStyle = silk; g.fillRect(8, 18, 2, 2);
    g.fillStyle = '#f2e8f6'; g.fillRect(8, 9, 2, 2); g.fillRect(13, 13, 2, 2); g.fillRect(15, 9, 2, 2); // 圆点
    g.fillStyle = shade(silk, 15); g.fillRect(7, 14, 3, 1);          // 亮纹
  },
};
