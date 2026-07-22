// 像素图标：food_a | 菜肴图标（盘子/碗+食物造型）：field_snack(田野小吃), bread(面包), fried_egg(煎蛋), baked_potato(烤土豆), salad(沙拉), survival_burger(求生汉堡), complete_breakfast(全套早餐), farmers_lunch(农夫午餐), miners_treat(矿工特供), seafood_soup(海鲜汤), roots_platter(根茎拼盘), grilled_fish(烤鱼), sashimi(生鱼片), maki_roll(生鱼寿司), seafood_platter(海鲜拼盘), spicy_eel(辣鳗鱼), stir_fry(蔬菜杂烩) 分组
import { shade } from '../../render/textures.js';

const PLATE = '#E8E4DA', PLATED = '#B8B2A4', BOWL = '#C8D4E0';

// 通用：圆盘（椭圆像素盘 + 阴影 + 高光）
function plate(g, col = PLATE) {
  g.fillStyle = PLATED; g.fillRect(5, 17, 14, 2); // 盘影
  g.fillStyle = shade(col, -25); g.fillRect(3, 15, 18, 2);
  g.fillStyle = col;
  g.fillRect(4, 14, 16, 2); g.fillRect(5, 13, 14, 1);
  g.fillStyle = shade(col, 20); g.fillRect(5, 14, 6, 1); // 高光
}
// 通用：碗（圆碗 + 碗沿）
function bowl(g, rimY, col = BOWL) {
  g.fillStyle = shade(col, -35); g.fillRect(5, rimY + 5, 14, 3); // 碗底影
  g.fillStyle = col; g.fillRect(4, rimY + 2, 16, 4); g.fillRect(6, rimY + 6, 12, 2);
  g.fillStyle = shade(col, 25); g.fillRect(4, rimY + 2, 16, 1); // 沿高光
  g.fillStyle = shade(col, -20); g.fillRect(4, rimY + 5, 2, 1);
}

export const DRAWERS = {
  // 田野小吃：小盘 + 碎点饼干/浆果
  field_snack: (g) => {
    plate(g);
    g.fillStyle = '#C89858'; g.fillRect(7, 10, 3, 3); g.fillRect(12, 9, 3, 3); g.fillRect(10, 12, 3, 3);
    g.fillStyle = shade('#C89858', -25); g.fillRect(7, 12, 3, 1); g.fillRect(12, 11, 3, 1); g.fillRect(10, 14, 3, 1);
    g.fillStyle = '#B8342E'; g.fillRect(9, 9, 1, 1); g.fillRect(14, 10, 1, 1);
    g.fillStyle = '#5DBB4A'; g.fillRect(16, 11, 2, 1);
  },
  // 面包：金黄面包块 + 切口
  bread: (g) => {
    g.fillStyle = shade('#C98A3E', -40); g.fillRect(5, 16, 14, 2);
    g.fillStyle = '#C98A3E'; g.fillRect(5, 10, 14, 6); g.fillRect(7, 8, 10, 2);
    g.fillStyle = shade('#C98A3E', 30); g.fillRect(7, 8, 10, 1); g.fillRect(5, 10, 2, 6);
    g.fillStyle = shade('#C98A3E', -25); g.fillRect(8, 11, 1, 3); g.fillRect(11, 11, 1, 3); g.fillRect(14, 11, 1, 3);
    g.fillStyle = '#8A5A2A'; g.fillRect(17, 12, 2, 4);
  },
  // 煎蛋：蛋白 + 蛋黄
  fried_egg: (g) => {
    g.fillStyle = shade('#F4F0E4', -30); g.fillRect(6, 15, 13, 2);
    g.fillStyle = '#F4F0E4';
    g.fillRect(6, 9, 12, 6); g.fillRect(8, 8, 8, 1); g.fillRect(5, 11, 1, 3); g.fillRect(18, 11, 1, 3); g.fillRect(7, 15, 10, 1);
    g.fillStyle = shade('#F4F0E4', 10); g.fillRect(8, 8, 6, 1);
    g.fillStyle = shade('#F2B32E', -25); g.fillRect(10, 13, 5, 1);
    g.fillStyle = '#F2B32E'; g.fillRect(10, 10, 5, 4); g.fillRect(11, 9, 3, 1);
    g.fillStyle = shade('#F2B32E', 35); g.fillRect(11, 10, 2, 1);
  },
  // 烤土豆：棕皮土豆 + 裂口黄油
  baked_potato: (g) => {
    plate(g, '#D8D0C0');
    g.fillStyle = shade('#A8763E', -35); g.fillRect(7, 14, 10, 1);
    g.fillStyle = '#A8763E'; g.fillRect(6, 9, 12, 5); g.fillRect(8, 8, 8, 1);
    g.fillStyle = shade('#A8763E', 25); g.fillRect(6, 9, 2, 4);
    g.fillStyle = '#F0D888'; g.fillRect(9, 9, 6, 2); // 裂口
    g.fillStyle = '#F8E8A8'; g.fillRect(10, 8, 3, 1); // 黄油
    g.fillStyle = '#5DBB4A'; g.fillRect(13, 8, 2, 1);
  },
  // 沙拉：浅碗 + 绿叶番茄
  salad: (g) => {
    bowl(g, 12, '#D8E4D0');
    g.fillStyle = '#4E9B3E'; g.fillRect(6, 10, 4, 3); g.fillRect(12, 9, 5, 3);
    g.fillStyle = '#6CBE4E'; g.fillRect(8, 8, 4, 3); g.fillRect(15, 10, 3, 2);
    g.fillStyle = '#8AD86A'; g.fillRect(9, 8, 2, 1); g.fillRect(13, 9, 2, 1);
    g.fillStyle = '#D8402E'; g.fillRect(7, 11, 2, 2); g.fillRect(14, 11, 2, 2);
    g.fillStyle = '#F0F0E0'; g.fillRect(11, 10, 1, 1);
  },
  // 求生汉堡：厚实汉堡（面包+肉+生菜）
  survival_burger: (g) => {
    g.fillStyle = '#E0A850'; g.fillRect(6, 6, 12, 3); g.fillRect(8, 5, 8, 1); // 顶包
    g.fillStyle = '#F4D88A'; g.fillRect(9, 6, 1, 1); g.fillRect(12, 6, 1, 1); g.fillRect(14, 7, 1, 1); // 芝麻
    g.fillStyle = shade('#E0A850', -30); g.fillRect(6, 8, 12, 1);
    g.fillStyle = '#5DBB4A'; g.fillRect(5, 9, 14, 2); // 生菜
    g.fillStyle = '#D8402E'; g.fillRect(6, 11, 12, 1); // 番茄
    g.fillStyle = shade('#6E3A1E', -15); g.fillRect(6, 12, 12, 3); // 肉饼
    g.fillStyle = '#F2B32E'; g.fillRect(6, 12, 12, 1); // 芝士
    g.fillStyle = '#D89840'; g.fillRect(6, 15, 12, 3); // 底包
    g.fillStyle = shade('#D89840', -30); g.fillRect(6, 17, 12, 1);
  },
  // 全套早餐：大盘 + 蛋 + 培根 + 吐司
  complete_breakfast: (g) => {
    plate(g);
    g.fillStyle = '#F4F0E4'; g.fillRect(5, 9, 7, 5); g.fillRect(6, 8, 5, 1); // 蛋白
    g.fillStyle = '#F2B32E'; g.fillRect(7, 10, 3, 3); g.fillStyle = shade('#F2B32E', 35); g.fillRect(7, 10, 1, 1);
    g.fillStyle = '#C8503E'; g.fillRect(13, 8, 6, 2); g.fillRect(13, 11, 6, 2); // 培根
    g.fillStyle = '#F0A888'; g.fillRect(13, 9, 6, 1); g.fillRect(13, 12, 6, 1);
    g.fillStyle = '#D8A050'; g.fillRect(14, 14, 5, 2); g.fillStyle = shade('#D8A050', -30); g.fillRect(14, 15, 5, 1);
  },
  // 农夫午餐：木托盘 + 面包奶酪苹果
  farmers_lunch: (g) => {
    g.fillStyle = '#9A6B3F'; g.fillRect(3, 16, 18, 3); // 托盘
    g.fillStyle = shade('#9A6B3F', -30); g.fillRect(3, 18, 18, 1);
    g.fillStyle = shade('#9A6B3F', 25); g.fillRect(3, 16, 18, 1);
    g.fillStyle = '#C98A3E'; g.fillRect(5, 10, 6, 6); g.fillRect(6, 9, 4, 1); // 面包
    g.fillStyle = shade('#C98A3E', 30); g.fillRect(6, 9, 4, 1);
    g.fillStyle = '#F2D84E'; g.fillRect(12, 11, 5, 5); // 奶酪
    g.fillStyle = shade('#F2D84E', -25); g.fillRect(14, 13, 1, 1); g.fillRect(13, 15, 1, 1);
    g.fillStyle = '#D8402E'; g.fillRect(17, 9, 4, 5); g.fillRect(18, 8, 2, 1); // 苹果
    g.fillStyle = '#5DBB4A'; g.fillRect(19, 7, 2, 1);
    g.fillStyle = '#F08080'; g.fillRect(18, 10, 1, 1);
  },
  // 矿工特供：深色盘 + 肉排
  miners_treat: (g) => {
    plate(g, '#8A8A96');
    g.fillStyle = shade('#7E3A2A', -25); g.fillRect(6, 13, 12, 2);
    g.fillStyle = '#A84A32'; g.fillRect(6, 9, 12, 5); g.fillRect(8, 8, 8, 1); // 肉排
    g.fillStyle = '#D87850'; g.fillRect(7, 9, 10, 1);
    g.fillStyle = '#6E2A1E'; g.fillRect(9, 11, 2, 1); g.fillRect(13, 12, 2, 1); // 烤痕
    g.fillStyle = '#F2B32E'; g.fillRect(18, 6, 2, 2); g.fillRect(19, 5, 1, 1); // 香料闪光
  },
  // 海鲜汤：汤碗 + 虾/鱼块
  seafood_soup: (g) => {
    bowl(g, 10, '#C8D4E0');
    g.fillStyle = '#E8A850'; g.fillRect(5, 10, 14, 2); // 汤面
    g.fillStyle = shade('#E8A850', 20); g.fillRect(6, 10, 5, 1);
    g.fillStyle = '#E86A4A'; g.fillRect(8, 8, 3, 2); g.fillRect(10, 7, 1, 1); // 虾
    g.fillStyle = '#F0F0E0'; g.fillRect(13, 8, 3, 2); // 鱼块
    g.fillStyle = '#5DBB4A'; g.fillRect(11, 9, 1, 1); g.fillRect(16, 9, 1, 1);
    g.fillStyle = shade('#E8A850', 40); g.fillRect(10, 4, 1, 2); g.fillRect(13, 3, 1, 2); // 蒸汽
  },
  // 根茎拼盘：盘 + 胡萝卜/土豆/萝卜/甜菜
  roots_platter: (g) => {
    plate(g);
    g.fillStyle = '#E8782E'; g.fillRect(5, 9, 2, 5); g.fillStyle = '#5DBB4A'; g.fillRect(5, 8, 2, 1); // 胡萝卜
    g.fillStyle = '#C8A050'; g.fillRect(9, 10, 4, 4); g.fillStyle = shade('#C8A050', -25); g.fillRect(10, 12, 1, 1); // 土豆
    g.fillStyle = '#E8E0E8'; g.fillRect(14, 9, 3, 5); g.fillStyle = '#C86A9A'; g.fillRect(14, 9, 3, 2); // 萝卜
    g.fillStyle = '#B85A8E'; g.fillRect(18, 10, 2, 4); // 甜菜
    g.fillStyle = shade('#E8782E', 30); g.fillRect(5, 9, 1, 1);
  },
  // 烤鱼：整鱼躺盘 + 烤痕
  grilled_fish: (g) => {
    plate(g);
    g.fillStyle = shade('#8A9A6A', -25); g.fillRect(6, 13, 13, 1);
    g.fillStyle = '#9AAA78'; g.fillRect(5, 10, 13, 3); g.fillRect(7, 9, 8, 1); // 鱼身
    g.fillStyle = shade('#9AAA78', 25); g.fillRect(6, 10, 10, 1);
    g.fillStyle = '#8A9A6A'; g.fillRect(18, 9, 3, 5); g.fillRect(19, 10, 1, 3); // 尾
    g.fillStyle = '#2A2A32'; g.fillRect(6, 10, 1, 1); // 眼
    g.fillStyle = '#6A5A3E'; g.fillRect(9, 11, 1, 2); g.fillRect(12, 11, 1, 2); g.fillRect(15, 11, 1, 2); // 烤痕
    g.fillStyle = '#5DBB4A'; g.fillRect(10, 8, 3, 1); // 柠檬叶
  },
  // 生鱼片：黑盘 + 三片粉橘鱼片
  sashimi: (g) => {
    plate(g, '#3A3A44');
    g.fillStyle = '#F08A6A'; g.fillRect(6, 9, 4, 5); g.fillRect(11, 8, 4, 5); g.fillRect(16, 9, 4, 5);
    g.fillStyle = shade('#F08A6A', 25); g.fillRect(6, 9, 4, 1); g.fillRect(11, 8, 4, 1); g.fillRect(16, 9, 4, 1);
    g.fillStyle = '#F8D0C0'; g.fillRect(7, 11, 2, 1); g.fillRect(12, 10, 2, 1); g.fillRect(17, 11, 2, 1); // 脂肪纹
    g.fillStyle = '#5DBB4A'; g.fillRect(8, 14, 3, 2); // 山葵叶
  },
  // 生鱼寿司：两个寿司卷（海苔+饭+鱼）
  maki_roll: (g) => {
    plate(g);
    for (const ox of [6, 13]) {
      g.fillStyle = '#2A3A2E'; g.fillRect(ox, 8, 5, 7); // 海苔
      g.fillStyle = shade('#2A3A2E', 25); g.fillRect(ox, 8, 1, 7);
      g.fillStyle = '#F4F0E4'; g.fillRect(ox + 1, 9, 3, 5); // 饭
      g.fillStyle = '#F08A6A'; g.fillRect(ox + 1, 10, 3, 2); // 鱼心
      g.fillStyle = shade('#F08A6A', 25); g.fillRect(ox + 1, 10, 3, 1);
    }
    g.fillStyle = '#D8402E'; g.fillRect(11, 15, 2, 1); // 姜片
  },
  // 海鲜拼盘：大盘 + 虾/贝/鱼片
  seafood_platter: (g) => {
    plate(g);
    g.fillStyle = '#E86A4A'; g.fillRect(5, 9, 4, 3); g.fillRect(8, 8, 1, 1); // 虾
    g.fillStyle = shade('#E86A4A', -25); g.fillRect(5, 11, 4, 1);
    g.fillStyle = '#E8D8B8'; g.fillRect(11, 9, 4, 4); g.fillStyle = '#C8A878'; g.fillRect(12, 10, 2, 2); // 扇贝
    g.fillStyle = '#F08A6A'; g.fillRect(16, 9, 4, 4); g.fillStyle = '#F8D0C0'; g.fillRect(17, 10, 2, 1); // 鱼片
    g.fillStyle = '#5DBB4A'; g.fillRect(9, 13, 2, 1); g.fillRect(15, 13, 2, 1);
    g.fillStyle = '#F2E84E'; g.fillRect(12, 14, 2, 2); // 柠檬
  },
  // 辣鳗鱼：黑盘 + 酱色鳗段 + 红椒
  spicy_eel: (g) => {
    plate(g, '#4A3A34');
    g.fillStyle = shade('#5E3A22', -20); g.fillRect(6, 13, 13, 1);
    g.fillStyle = '#7E4A2A'; g.fillRect(6, 9, 12, 4); g.fillRect(8, 8, 8, 1); // 鳗段
    g.fillStyle = shade('#7E4A2A', 30); g.fillRect(6, 9, 12, 1); // 酱汁光
    g.fillStyle = '#B86A3E'; g.fillRect(9, 10, 1, 2); g.fillRect(12, 10, 1, 2); g.fillRect(15, 10, 1, 2); // 段纹
    g.fillStyle = '#D8281E'; g.fillRect(7, 8, 2, 1); g.fillRect(14, 8, 2, 1); g.fillRect(11, 13, 2, 1); // 辣椒
    g.fillStyle = '#F4F0E4'; g.fillRect(9, 12, 1, 1); g.fillRect(13, 11, 1, 1); // 芝麻
  },
  // 蔬菜杂烩：盘 + 多彩菜块 + 蒸汽
  stir_fry: (g) => {
    plate(g, '#D0C8B8');
    g.fillStyle = '#4E9B3E'; g.fillRect(6, 9, 3, 3); g.fillRect(13, 10, 3, 3); // 青菜
    g.fillStyle = '#E8782E'; g.fillRect(10, 8, 3, 2); g.fillRect(8, 12, 3, 2); // 胡萝卜
    g.fillStyle = '#D8402E'; g.fillRect(16, 9, 2, 2); // 红椒
    g.fillStyle = '#F2E84E'; g.fillRect(11, 12, 2, 2); // 玉米
    g.fillStyle = '#F4F0E4'; g.fillRect(15, 12, 2, 2); // 洋葱
    g.fillStyle = '#6CBE4E'; g.fillRect(7, 9, 1, 1); g.fillRect(14, 10, 1, 1);
    g.fillStyle = '#B8B0A0'; g.fillRect(11, 4, 1, 2); g.fillRect(14, 3, 1, 2); // 蒸汽
  },
};
