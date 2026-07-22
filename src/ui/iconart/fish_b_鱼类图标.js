// 像素图标：fish_b | pondskipper(跳塘鱼), sardine(沙丁鱼), tuna(金枪鱼), red_snapper(红鲷), tilapia(罗非鱼), eel(海鳗), pufferfish(河豚), halibut(大比目鱼), squid(鱿鱼), rockskin_fish(岩皮鱼), shade_fish(幽影鱼), icecore_fish(冰芯鱼), magmelt_eel(熔芯鳗), lake_monarch(湖皇鱼), ember_emperor(赤霄鲷), autumn_lantern(秋灯鱼), frost_crown(霜冠鱼) 分组
// 注：为避免连带加载 three.js 依赖链，shade 在此内联（与 render/textures.js 中实现一致）
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export const DRAWERS = {
  // 跳塘鱼：青绿小圆鱼 + 溅起的水花点，弧线跳跃感
  pondskipper(g) {
    const body = '#58C8A8', dk = shade(body, -45), lt = shade(body, 45);
    // 水花
    g.fillStyle = '#9CD8F0';
    g.fillRect(5, 18, 1, 1); g.fillRect(10, 19, 1, 1); g.fillRect(16, 18, 1, 1);
    g.fillRect(3, 16, 2, 1); g.fillRect(18, 16, 2, 1);
    // 尾
    g.fillStyle = dk;
    g.fillRect(4, 11, 2, 2); g.fillRect(4, 15, 2, 2); g.fillRect(5, 12, 2, 4);
    // 圆润身体
    g.fillStyle = dk; g.fillRect(7, 9, 9, 10);
    g.fillStyle = body;
    g.fillRect(8, 10, 8, 8); g.fillRect(7, 11, 9, 6);
    g.fillStyle = lt; g.fillRect(9, 10, 5, 2);
    g.fillStyle = '#1A1A22'; g.fillRect(13, 12, 2, 2);
    g.fillStyle = dk; g.fillRect(9, 7, 3, 2); // 背鳍
  },
  // 沙丁鱼：细长银蓝小鱼
  sardine(g) {
    const body = '#A8C4D8', dk = shade(body, -50), lt = '#E8F2F8';
    g.fillStyle = dk;
    g.fillRect(2, 11, 3, 1); g.fillRect(2, 13, 3, 1); g.fillRect(3, 12, 2, 1);
    g.fillRect(5, 10, 15, 5);
    g.fillStyle = body;
    g.fillRect(6, 11, 14, 3); g.fillRect(6, 10, 12, 1);
    g.fillStyle = lt; g.fillRect(7, 10, 10, 1);
    g.fillStyle = '#4A7080'; g.fillRect(6, 13, 12, 1); // 侧线
    g.fillStyle = '#1A1A22'; g.fillRect(17, 11, 1, 1);
  },
  // 金枪鱼：深蓝纺锤大鱼 + 黄色小鳍
  tuna(g) {
    const body = '#3868B8', dk = shade(body, -45), lt = shade(body, 50);
    g.fillStyle = dk;
    g.fillRect(2, 9, 3, 2); g.fillRect(2, 14, 3, 2); g.fillRect(3, 10, 2, 5);
    g.fillRect(5, 8, 15, 9);
    g.fillStyle = body;
    g.fillRect(6, 9, 14, 7); g.fillRect(5, 10, 15, 5);
    g.fillStyle = lt; g.fillRect(7, 9, 10, 1);
    g.fillStyle = '#E8E8F0'; g.fillRect(8, 14, 10, 2); // 银腹
    g.fillStyle = '#E8C840'; g.fillRect(9, 6, 2, 2); g.fillRect(13, 6, 2, 2); g.fillRect(11, 17, 2, 2); // 黄色小鳍
    g.fillStyle = '#1A1A22'; g.fillRect(17, 11, 2, 2);
  },
  // 红鲷：红粉色高背鱼 + 大眼
  red_snapper(g) {
    const body = '#E86060', dk = shade(body, -50), lt = shade(body, 50);
    g.fillStyle = dk;
    g.fillRect(2, 10, 3, 2); g.fillRect(2, 14, 3, 2); g.fillRect(3, 11, 2, 4);
    g.fillRect(6, 6, 13, 13); // 高背
    g.fillStyle = body;
    g.fillRect(7, 7, 12, 11); g.fillRect(6, 8, 13, 9);
    g.fillStyle = lt; g.fillRect(8, 8, 8, 2);
    g.fillStyle = '#F8E0D8'; g.fillRect(9, 15, 8, 3); // 浅腹
    g.fillStyle = '#FFFFFF'; g.fillRect(15, 10, 3, 3);
    g.fillStyle = '#1A1A22'; g.fillRect(16, 11, 2, 2);
    g.fillStyle = dk; g.fillRect(9, 4, 5, 2); // 尖背鳍
  },
  // 罗非鱼：灰绿鱼 + 竖条纹
  tilapia(g) {
    const body = '#88A878', dk = shade(body, -45), lt = shade(body, 45);
    g.fillStyle = dk;
    g.fillRect(2, 10, 3, 2); g.fillRect(2, 14, 3, 2); g.fillRect(3, 11, 2, 4);
    g.fillRect(5, 7, 14, 11);
    g.fillStyle = body;
    g.fillRect(6, 8, 13, 9); g.fillRect(5, 9, 14, 7);
    g.fillStyle = lt; g.fillRect(7, 8, 9, 1);
    g.fillStyle = dk; // 竖条纹
    for (let i = 0; i < 4; i++) g.fillRect(8 + i * 3, 9, 1, 7);
    g.fillStyle = '#1A1A22'; g.fillRect(16, 10, 2, 2);
    g.fillStyle = dk; g.fillRect(8, 5, 6, 2); // 长背鳍
  },
  // 海鳗：S 形棕色长鳗
  eel(g) {
    const body = '#8A6A48', dk = shade(body, -45), lt = shade(body, 40);
    g.fillStyle = dk;
    g.fillRect(3, 15, 6, 4); g.fillRect(7, 10, 8, 6); g.fillRect(13, 5, 7, 6);
    g.fillStyle = body;
    g.fillRect(4, 16, 5, 2); g.fillRect(8, 11, 7, 4); g.fillRect(14, 6, 6, 4);
    g.fillStyle = lt;
    g.fillRect(5, 16, 3, 1); g.fillRect(9, 11, 5, 1); g.fillRect(15, 6, 4, 1);
    // 头（右上）+ 眼 + 嘴
    g.fillStyle = '#1A1A22'; g.fillRect(17, 7, 1, 1);
    g.fillStyle = dk; g.fillRect(19, 9, 2, 1); // 下颌
    g.fillStyle = '#D8C8A8'; g.fillRect(20, 8, 1, 1); // 牙
  },
  // 河豚：圆球 + 尖刺
  pufferfish(g) {
    const body = '#E8C868', dk = shade(body, -50), lt = shade(body, 45);
    // 刺
    g.fillStyle = dk;
    g.fillRect(11, 3, 2, 2); g.fillRect(5, 6, 2, 2); g.fillRect(17, 6, 2, 2);
    g.fillRect(3, 11, 2, 2); g.fillRect(19, 11, 2, 2); g.fillRect(6, 17, 2, 2); g.fillRect(16, 17, 2, 2);
    g.fillRect(11, 19, 2, 2);
    // 圆身体
    g.fillStyle = dk; g.fillRect(6, 6, 12, 12);
    g.fillStyle = body;
    g.fillRect(7, 7, 10, 10); g.fillRect(6, 8, 12, 8); g.fillRect(8, 6, 8, 12);
    g.fillStyle = '#F8F0D8'; g.fillRect(8, 13, 8, 4); // 白腹
    g.fillStyle = lt; g.fillRect(8, 7, 5, 2);
    // 眼 + 小嘴
    g.fillStyle = '#1A1A22'; g.fillRect(14, 9, 2, 2); g.fillRect(17, 12, 1, 1);
  },
  // 大比目鱼：扁平椭圆 + 两眼同侧
  halibut(g) {
    const body = '#B89878', dk = shade(body, -45), lt = shade(body, 40);
    g.fillStyle = dk;
    g.fillRect(3, 10, 18, 6); g.fillRect(5, 8, 14, 10); g.fillRect(2, 11, 2, 4); g.fillRect(20, 11, 2, 4);
    g.fillStyle = body;
    g.fillRect(4, 11, 17, 4); g.fillRect(6, 9, 13, 8);
    g.fillStyle = lt; g.fillRect(7, 10, 9, 2);
    // 斑点
    g.fillStyle = dk;
    g.fillRect(8, 13, 1, 1); g.fillRect(12, 11, 1, 1); g.fillRect(15, 14, 1, 1); g.fillRect(10, 15, 1, 1);
    // 同侧双眼
    g.fillStyle = '#1A1A22'; g.fillRect(17, 10, 2, 2); g.fillRect(19, 13, 2, 2);
    // 小尾
    g.fillStyle = dk; g.fillRect(1, 12, 2, 2);
  },
  // 鱿鱼：三角外套膜 + 多条触手
  squid(g) {
    const body = '#C878B8', dk = shade(body, -45), lt = shade(body, 45);
    // 外套膜（倒立三角）
    g.fillStyle = dk; g.fillRect(8, 3, 8, 3); g.fillRect(9, 6, 6, 3); g.fillRect(10, 9, 4, 3);
    g.fillStyle = body; g.fillRect(9, 4, 6, 2); g.fillRect(10, 6, 4, 3); g.fillRect(11, 9, 2, 2);
    g.fillStyle = lt; g.fillRect(10, 4, 2, 4);
    // 鳍
    g.fillStyle = dk; g.fillRect(6, 4, 2, 2); g.fillRect(16, 4, 2, 2);
    // 眼
    g.fillStyle = '#1A1A22'; g.fillRect(9, 11, 2, 2); g.fillRect(13, 11, 2, 2);
    // 触手
    g.fillStyle = body;
    g.fillRect(7, 14, 2, 6); g.fillRect(10, 14, 1, 7); g.fillRect(12, 14, 1, 6); g.fillRect(14, 14, 1, 7); g.fillRect(16, 14, 2, 5);
    g.fillStyle = dk;
    g.fillRect(7, 19, 2, 1); g.fillRect(10, 20, 1, 1); g.fillRect(14, 20, 1, 1); g.fillRect(16, 18, 2, 1);
  },
  // 岩皮鱼：灰石色粗鱼 + 岩石斑
  rockskin_fish(g) {
    const body = '#909098', dk = shade(body, -45), lt = shade(body, 40);
    g.fillStyle = dk;
    g.fillRect(2, 11, 3, 2); g.fillRect(2, 14, 3, 2); g.fillRect(3, 12, 2, 3);
    g.fillRect(5, 8, 15, 10);
    g.fillStyle = body;
    g.fillRect(6, 9, 14, 8); g.fillRect(5, 10, 15, 6);
    // 岩石质感碎斑
    g.fillStyle = lt;
    g.fillRect(7, 9, 2, 2); g.fillRect(12, 11, 2, 1); g.fillRect(9, 14, 2, 2); g.fillRect(15, 9, 2, 2);
    g.fillStyle = dk;
    g.fillRect(10, 10, 1, 1); g.fillRect(14, 13, 1, 1); g.fillRect(7, 12, 1, 1);
    g.fillStyle = '#1A1A22'; g.fillRect(17, 11, 2, 2);
    g.fillStyle = dk; g.fillRect(8, 6, 4, 2); // 钝背鳍
  },
  // 幽影鱼：深紫近黑鱼 + 发光紫眼
  shade_fish(g) {
    const body = '#4A3A68', dk = shade(body, -30), lt = shade(body, 40);
    g.fillStyle = dk;
    g.fillRect(2, 10, 3, 2); g.fillRect(2, 14, 3, 2); g.fillRect(3, 11, 2, 4);
    g.fillRect(5, 8, 14, 10);
    g.fillStyle = body;
    g.fillRect(6, 9, 13, 8); g.fillRect(5, 10, 14, 6);
    g.fillStyle = lt; g.fillRect(7, 9, 8, 1);
    // 幽紫光纹
    g.fillStyle = '#9878E8';
    g.fillRect(8, 12, 2, 1); g.fillRect(12, 14, 2, 1); g.fillRect(10, 15, 1, 1);
    // 发光眼
    g.fillStyle = '#C8A8FF'; g.fillRect(16, 10, 2, 2);
    g.fillStyle = '#FFFFFF'; g.fillRect(16, 10, 1, 1);
    g.fillStyle = dk; g.fillRect(9, 6, 4, 2);
  },
  // 冰芯鱼：冰蓝透明感鱼 + 白色冰晶芯
  icecore_fish(g) {
    const body = '#A8DCF0', dk = shade(body, -45), lt = '#F0FAFF';
    g.fillStyle = dk;
    g.fillRect(2, 10, 3, 2); g.fillRect(2, 14, 3, 2); g.fillRect(3, 11, 2, 4);
    g.fillRect(5, 8, 14, 10);
    g.fillStyle = body;
    g.fillRect(6, 9, 13, 8); g.fillRect(5, 10, 14, 6);
    // 冰晶核心（菱形）
    g.fillStyle = lt;
    g.fillRect(10, 10, 2, 2); g.fillRect(9, 11, 4, 2); g.fillRect(10, 13, 2, 2);
    g.fillStyle = '#E0F4FF'; g.fillRect(7, 9, 4, 1); g.fillRect(14, 9, 3, 1);
    // 冰碴
    g.fillStyle = lt; g.fillRect(4, 7, 1, 1); g.fillRect(20, 8, 1, 1); g.fillRect(19, 17, 1, 1);
    g.fillStyle = '#1A3040'; g.fillRect(16, 11, 2, 2);
  },
  // 熔芯鳗：黑红鳗 + 岩浆纹路
  magmelt_eel(g) {
    const body = '#3A2A28', dk = '#241816', lava = '#F06028';
    g.fillStyle = dk;
    g.fillRect(3, 16, 6, 4); g.fillRect(7, 11, 8, 6); g.fillRect(13, 5, 7, 7);
    g.fillStyle = body;
    g.fillRect(4, 17, 5, 2); g.fillRect(8, 12, 7, 4); g.fillRect(14, 6, 6, 5);
    // 岩浆裂纹
    g.fillStyle = lava;
    g.fillRect(5, 17, 2, 1); g.fillRect(9, 13, 3, 1); g.fillRect(10, 14, 1, 1);
    g.fillRect(14, 7, 3, 1); g.fillRect(15, 8, 1, 2); g.fillRect(17, 10, 2, 1);
    // 亮心
    g.fillStyle = '#FFB040'; g.fillRect(10, 13, 1, 1); g.fillRect(16, 8, 1, 1);
    // 火眼
    g.fillStyle = '#FFD040'; g.fillRect(17, 7, 2, 2);
    g.fillStyle = '#1A1A22'; g.fillRect(18, 8, 1, 1);
  },
  // 湖皇鱼：金色华丽大鱼 + 小皇冠
  lake_monarch(g) {
    const body = '#D8A838', dk = shade(body, -50), lt = shade(body, 50);
    // 皇冠
    g.fillStyle = '#F0D060';
    g.fillRect(10, 2, 1, 2); g.fillRect(12, 1, 1, 3); g.fillRect(14, 2, 1, 2);
    g.fillRect(10, 4, 5, 1);
    // 尾（扇形大尾）
    g.fillStyle = dk;
    g.fillRect(1, 8, 3, 2); g.fillRect(1, 16, 3, 2); g.fillRect(2, 10, 3, 6); g.fillRect(3, 9, 2, 8);
    // 华丽身体
    g.fillRect(5, 7, 15, 11);
    g.fillStyle = body;
    g.fillRect(6, 8, 14, 9); g.fillRect(5, 9, 15, 7);
    g.fillStyle = lt; g.fillRect(7, 8, 9, 2);
    // 鳞纹
    g.fillStyle = dk;
    g.fillRect(8, 11, 1, 1); g.fillRect(11, 12, 1, 1); g.fillRect(14, 11, 1, 1); g.fillRect(9, 14, 1, 1); g.fillRect(12, 15, 1, 1);
    g.fillStyle = '#FFFFFF'; g.fillRect(16, 10, 3, 3);
    g.fillStyle = '#1A1A22'; g.fillRect(17, 11, 2, 2);
  },
  // 赤霄鲷：朱红鲷 + 火焰形鳍
  ember_emperor(g) {
    const body = '#C83820', dk = shade(body, -45), lt = '#F08048';
    // 火焰形背鳍
    g.fillStyle = '#F08048';
    g.fillRect(8, 4, 2, 3); g.fillRect(11, 2, 2, 5); g.fillRect(14, 4, 2, 3);
    g.fillStyle = '#F8C058'; g.fillRect(11, 3, 1, 3); g.fillRect(8, 5, 1, 1);
    // 尾
    g.fillStyle = dk;
    g.fillRect(2, 9, 3, 2); g.fillRect(2, 15, 3, 2); g.fillRect(3, 10, 2, 6);
    // 身体
    g.fillRect(6, 7, 14, 11);
    g.fillStyle = body;
    g.fillRect(7, 8, 13, 9); g.fillRect(6, 9, 14, 7);
    g.fillStyle = lt; g.fillRect(8, 8, 8, 2); g.fillRect(7, 11, 2, 4); // 火纹
    g.fillStyle = '#F8D0A0'; g.fillRect(9, 15, 8, 2);
    g.fillStyle = '#FFFFFF'; g.fillRect(16, 10, 3, 3);
    g.fillStyle = '#1A1A22'; g.fillRect(17, 11, 2, 2);
  },
  // 秋灯鱼：橙黄小鱼 + 垂下的发光灯笼
  autumn_lantern(g) {
    const body = '#D89040', dk = shade(body, -45), lt = shade(body, 45);
    // 灯笼吊杆
    g.fillStyle = dk; g.fillRect(15, 2, 1, 5); g.fillRect(15, 2, 3, 1);
    // 发光灯笼
    g.fillStyle = '#FFD868'; g.fillRect(17, 3, 3, 3);
    g.fillStyle = '#FFF0B0'; g.fillRect(18, 4, 1, 1);
    g.fillStyle = 'rgba(255,216,104,0.35)'; g.fillRect(16, 2, 5, 5);
    // 尾
    g.fillStyle = dk;
    g.fillRect(2, 10, 3, 2); g.fillRect(2, 14, 3, 2); g.fillRect(3, 11, 2, 4);
    // 身体
    g.fillRect(5, 8, 13, 10);
    g.fillStyle = body;
    g.fillRect(6, 9, 12, 8); g.fillRect(5, 10, 13, 6);
    g.fillStyle = lt; g.fillRect(7, 9, 7, 1);
    // 秋叶斑点
    g.fillStyle = '#B85828'; g.fillRect(8, 12, 2, 2); g.fillRect(12, 14, 2, 2);
    g.fillStyle = '#1A1A22'; g.fillRect(15, 10, 2, 2);
  },
  // 霜冠鱼：雪白蓝鱼 + 冰晶冠
  frost_crown(g) {
    const body = '#D8ECF8', dk = shade(body, -40), lt = '#FFFFFF';
    // 冰晶冠
    g.fillStyle = '#B8E4F8';
    g.fillRect(10, 3, 1, 3); g.fillRect(12, 1, 1, 5); g.fillRect(14, 3, 1, 3);
    g.fillStyle = lt; g.fillRect(12, 2, 1, 3); g.fillRect(10, 4, 1, 1); g.fillRect(14, 4, 1, 1);
    // 尾
    g.fillStyle = dk;
    g.fillRect(2, 10, 3, 2); g.fillRect(2, 14, 3, 2); g.fillRect(3, 11, 2, 4);
    // 身体
    g.fillRect(5, 8, 14, 10);
    g.fillStyle = body;
    g.fillRect(6, 9, 13, 8); g.fillRect(5, 10, 14, 6);
    g.fillStyle = lt; g.fillRect(7, 9, 9, 2);
    // 霜纹
    g.fillStyle = '#98C8E8';
    g.fillRect(8, 12, 1, 3); g.fillRect(11, 12, 1, 4); g.fillRect(14, 12, 1, 3);
    g.fillStyle = '#20384A'; g.fillRect(16, 10, 2, 2);
    // 飘落雪花
    g.fillStyle = lt; g.fillRect(20, 5, 1, 1); g.fillRect(3, 6, 1, 1);
  },
};
