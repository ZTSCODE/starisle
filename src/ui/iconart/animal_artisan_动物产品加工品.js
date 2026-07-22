// 像素图标：animal_artisan | 动物产品+加工品：chicken(鸡), duck(鸭), cow(牛), goat(山羊), sheep(绵羊), pig(猪), rabbit(兔子), egg(鸡蛋), egg_large(大鸡蛋), duck_egg(鸭蛋), duck_feather(鸭毛), milk(牛奶), milk_large(大瓶牛奶), goat_milk(羊奶), goat_milk_large(大瓶羊奶), wool(羊毛), truffle(松露), rabbit_foot(兔脚), mayonnaise(蛋黄酱), duck_mayonnaise(鸭蛋黄酱), cheese(奶酪), goat_cheese(山羊奶酪), truffle_oil(松露油), wine(果酒), juice(果汁), honey(野蜂蜜), cloth(布料), pickles(腌菜), jelly(果酱) 分组
// 注意：textures.js 依赖 three.js，node 环境无法直接 import，故内联 shade 实现（与原实现一致）
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export const DRAWERS = {
  // 鸡：白色圆身 + 红鸡冠 + 黄喙
  chicken: (g) => {
    const body = '#F2F2F0', dark = shade(body, -45), lite = '#FFFFFF';
    g.fillStyle = dark;
    g.fillRect(6, 8, 12, 10);
    g.fillRect(9, 4, 7, 6);
    g.fillStyle = body;
    g.fillRect(7, 9, 10, 8);
    g.fillRect(10, 5, 5, 5);
    g.fillStyle = lite;
    g.fillRect(8, 10, 4, 3);
    g.fillStyle = '#D8443C';
    g.fillRect(10, 3, 2, 2); g.fillRect(12, 2, 2, 3); g.fillRect(14, 3, 2, 2);
    g.fillStyle = '#E8A83E';
    g.fillRect(15, 7, 3, 2);
    g.fillStyle = '#1A1A22';
    g.fillRect(13, 6, 1, 1);
    g.fillStyle = '#D8443C';
    g.fillRect(9, 18, 2, 2); g.fillRect(13, 18, 2, 2);
  },
  // 鸭：黄身 + 橙喙 + 翘尾
  duck: (g) => {
    const body = '#F0D24B', dark = shade(body, -50);
    g.fillStyle = dark;
    g.fillRect(5, 10, 13, 7);
    g.fillRect(10, 4, 6, 7);
    g.fillRect(3, 11, 3, 4);
    g.fillStyle = body;
    g.fillRect(6, 11, 11, 5);
    g.fillRect(11, 5, 4, 6);
    g.fillStyle = shade(body, 30);
    g.fillRect(7, 12, 4, 2);
    g.fillStyle = '#E88030';
    g.fillRect(15, 7, 4, 2);
    g.fillStyle = '#1A1A22';
    g.fillRect(13, 6, 1, 1);
    g.fillStyle = '#E88030';
    g.fillRect(9, 17, 2, 2); g.fillRect(13, 17, 2, 2);
  },
  // 牛：黑白花块
  cow: (g) => {
    const body = '#F4F1EA', dark = shade(body, -50), patch = '#2A2A32';
    g.fillStyle = dark;
    g.fillRect(4, 7, 16, 10);
    g.fillRect(7, 4, 6, 5);
    g.fillStyle = body;
    g.fillRect(5, 8, 14, 8);
    g.fillRect(8, 5, 4, 4);
    g.fillStyle = patch;
    g.fillRect(6, 9, 4, 4);
    g.fillRect(13, 11, 5, 4);
    g.fillRect(9, 5, 2, 2);
    g.fillStyle = '#E8A8A0';
    g.fillRect(7, 8, 4, 3);
    g.fillStyle = '#1A1A22';
    g.fillRect(8, 9, 1, 1); g.fillRect(10, 9, 1, 1);
    g.fillStyle = '#C8B890';
    g.fillRect(7, 3, 2, 2); g.fillRect(12, 3, 2, 2);
    g.fillStyle = dark;
    g.fillRect(6, 17, 2, 3); g.fillRect(15, 17, 2, 3);
  },
  // 山羊：灰白 + 大弯角 + 胡须
  goat: (g) => {
    const body = '#D8D4CC', dark = shade(body, -45);
    g.fillStyle = dark;
    g.fillRect(5, 8, 14, 9);
    g.fillRect(8, 4, 7, 6);
    g.fillStyle = body;
    g.fillRect(6, 9, 12, 7);
    g.fillRect(9, 5, 5, 5);
    g.fillStyle = '#9A8F80';
    g.fillRect(8, 1, 2, 4); g.fillRect(14, 1, 2, 4);
    g.fillRect(7, 2, 2, 2); g.fillRect(15, 2, 2, 2);
    g.fillStyle = '#1A1A22';
    g.fillRect(10, 6, 1, 1); g.fillRect(12, 6, 1, 1);
    g.fillStyle = '#B8B0A4';
    g.fillRect(10, 10, 2, 3);
    g.fillStyle = dark;
    g.fillRect(7, 17, 2, 3); g.fillRect(15, 17, 2, 3);
  },
  // 绵羊：蓬松白云状 + 深色脸腿
  sheep: (g) => {
    const wool = '#F6F2E8', dark = shade(wool, -40), face = '#5A4A3E';
    g.fillStyle = dark;
    g.fillRect(4, 7, 16, 10);
    g.fillRect(6, 5, 12, 4);
    g.fillRect(3, 9, 3, 6);
    g.fillRect(18, 9, 3, 6);
    g.fillStyle = wool;
    g.fillRect(5, 8, 14, 8);
    g.fillRect(7, 6, 10, 4);
    g.fillRect(4, 10, 3, 4);
    g.fillRect(17, 10, 3, 4);
    g.fillStyle = shade(wool, 15);
    g.fillRect(8, 7, 3, 2); g.fillRect(12, 8, 3, 2); g.fillRect(6, 10, 3, 2);
    g.fillStyle = face;
    g.fillRect(10, 12, 5, 5);
    g.fillStyle = '#1A1A22';
    g.fillRect(11, 13, 1, 1); g.fillRect(13, 13, 1, 1);
    g.fillStyle = face;
    g.fillRect(7, 17, 2, 3); g.fillRect(15, 17, 2, 3);
  },
  // 猪：粉圆 + 大鼻 + 卷尾
  pig: (g) => {
    const body = '#F0A8B8', dark = shade(body, -45);
    g.fillStyle = dark;
    g.fillRect(5, 8, 14, 9);
    g.fillRect(7, 4, 9, 7);
    g.fillStyle = body;
    g.fillRect(6, 9, 12, 7);
    g.fillRect(8, 5, 7, 6);
    g.fillStyle = shade(body, -25);
    g.fillRect(8, 3, 3, 3); g.fillRect(13, 3, 3, 3);
    g.fillStyle = shade(body, -30);
    g.fillRect(9, 8, 5, 4);
    g.fillStyle = '#1A1A22';
    g.fillRect(10, 9, 1, 2); g.fillRect(12, 9, 1, 2);
    g.fillRect(9, 6, 1, 1); g.fillRect(14, 6, 1, 1);
    g.fillStyle = dark;
    g.fillRect(7, 17, 2, 3); g.fillRect(15, 17, 2, 3);
    g.fillStyle = shade(body, -25);
    g.fillRect(19, 9, 2, 2); g.fillRect(20, 10, 2, 2);
  },
  // 兔子：灰白 + 超长耳
  rabbit: (g) => {
    const body = '#DCD8DC', dark = shade(body, -45), inner = '#F0A8B8';
    g.fillStyle = dark;
    g.fillRect(8, 1, 2, 8); g.fillRect(13, 1, 2, 8);
    g.fillRect(7, 7, 10, 6);
    g.fillRect(6, 11, 12, 8);
    g.fillStyle = body;
    g.fillRect(8, 2, 2, 6); g.fillRect(13, 2, 2, 6);
    g.fillRect(8, 8, 8, 5);
    g.fillRect(7, 12, 10, 6);
    g.fillStyle = inner;
    g.fillRect(9, 3, 1, 4); g.fillRect(13, 3, 1, 4);
    g.fillStyle = '#1A1A22';
    g.fillRect(10, 9, 1, 1); g.fillRect(13, 9, 1, 1);
    g.fillStyle = '#E86880';
    g.fillRect(11, 11, 2, 1);
    g.fillStyle = dark;
    g.fillRect(8, 18, 3, 2); g.fillRect(13, 18, 3, 2);
  },
  // 鸡蛋：白色椭圆
  egg: (g) => {
    const c = '#F8F4EA', dark = shade(c, -35);
    g.fillStyle = dark;
    g.fillRect(9, 5, 7, 3);
    g.fillRect(7, 8, 11, 8);
    g.fillRect(8, 16, 9, 3);
    g.fillStyle = c;
    g.fillRect(10, 6, 5, 3);
    g.fillRect(8, 8, 9, 8);
    g.fillRect(9, 16, 7, 2);
    g.fillStyle = '#FFFFFF';
    g.fillRect(9, 8, 3, 3);
  },
  // 大鸡蛋：更大 + 米黄色 + 斑点
  egg_large: (g) => {
    const c = '#F0E2C0', dark = shade(c, -40);
    g.fillStyle = dark;
    g.fillRect(8, 3, 9, 4);
    g.fillRect(6, 6, 13, 10);
    g.fillRect(7, 16, 11, 4);
    g.fillStyle = c;
    g.fillRect(9, 4, 7, 3);
    g.fillRect(7, 6, 11, 10);
    g.fillRect(8, 16, 9, 3);
    g.fillStyle = '#FFFFFF';
    g.fillRect(8, 7, 3, 3);
    g.fillStyle = shade(c, -25);
    g.fillRect(13, 10, 2, 2); g.fillRect(10, 13, 2, 2); g.fillRect(14, 15, 2, 1);
  },
  // 鸭蛋：青绿色椭圆
  duck_egg: (g) => {
    const c = '#B8D8C0', dark = shade(c, -40);
    g.fillStyle = dark;
    g.fillRect(9, 5, 7, 3);
    g.fillRect(7, 8, 11, 8);
    g.fillRect(8, 16, 9, 3);
    g.fillStyle = c;
    g.fillRect(10, 6, 5, 3);
    g.fillRect(8, 8, 9, 8);
    g.fillRect(9, 16, 7, 2);
    g.fillStyle = shade(c, 35);
    g.fillRect(9, 8, 3, 3);
    g.fillStyle = shade(c, -25);
    g.fillRect(13, 12, 2, 2);
  },
  // 鸭毛：绿色羽毛（绿头鸭色）
  duck_feather: (g) => {
    const c = '#4A8E6E', dark = shade(c, -45);
    g.fillStyle = dark;
    g.fillRect(11, 3, 3, 4);
    g.fillRect(9, 6, 7, 8);
    g.fillRect(10, 14, 5, 4);
    g.fillStyle = c;
    g.fillRect(12, 4, 2, 3);
    g.fillRect(10, 7, 5, 7);
    g.fillRect(11, 14, 3, 3);
    g.fillStyle = shade(c, 40);
    g.fillRect(11, 7, 2, 4);
    g.fillStyle = '#E8D8A0';
    g.fillRect(11, 17, 3, 1); g.fillRect(12, 17, 1, 4);
  },
  // 牛奶：小盒装奶
  milk: (g) => {
    const box = '#F2F2F0', dark = shade(box, -45), label = '#4A7AB8';
    g.fillStyle = dark;
    g.fillRect(8, 6, 9, 14);
    g.fillRect(9, 4, 7, 3);
    g.fillStyle = box;
    g.fillRect(9, 7, 7, 12);
    g.fillRect(10, 5, 5, 2);
    g.fillStyle = shade(box, -20);
    g.fillRect(10, 5, 5, 1);
    g.fillStyle = label;
    g.fillRect(10, 11, 5, 4);
    g.fillStyle = '#FFFFFF';
    g.fillRect(11, 12, 2, 1);
    g.fillStyle = label;
    g.fillRect(15, 7, 1, 5);
  },
  // 大瓶牛奶：玻璃奶瓶，蓝色瓶盖
  milk_large: (g) => {
    const glass = '#EAF2F6', dark = shade(glass, -45), milkC = '#FFFFFF';
    g.fillStyle = dark;
    g.fillRect(10, 3, 5, 4);
    g.fillRect(7, 7, 11, 14);
    g.fillStyle = glass;
    g.fillRect(11, 4, 3, 4);
    g.fillRect(8, 8, 9, 12);
    g.fillStyle = milkC;
    g.fillRect(9, 11, 7, 8);
    g.fillStyle = '#4A7AB8';
    g.fillRect(10, 2, 5, 2);
    g.fillStyle = '#C8DCE8';
    g.fillRect(9, 8, 2, 3);
  },
  // 羊奶：棕色小罐
  goat_milk: (g) => {
    const c = '#C8A878', dark = shade(c, -45), milkC = '#F8F4EA';
    g.fillStyle = dark;
    g.fillRect(9, 5, 7, 3);
    g.fillRect(8, 8, 9, 12);
    g.fillStyle = c;
    g.fillRect(10, 6, 5, 3);
    g.fillRect(9, 9, 7, 10);
    g.fillStyle = milkC;
    g.fillRect(10, 12, 5, 6);
    g.fillStyle = shade(c, -30);
    g.fillRect(9, 5, 7, 1);
    g.fillStyle = shade(c, 30);
    g.fillRect(10, 9, 2, 2);
  },
  // 大瓶羊奶：大罐 + 木盖
  goat_milk_large: (g) => {
    const c = '#D8C8A8', dark = shade(c, -45), milkC = '#FFFDF4';
    g.fillStyle = dark;
    g.fillRect(8, 4, 9, 3);
    g.fillRect(6, 7, 13, 14);
    g.fillStyle = c;
    g.fillRect(9, 5, 7, 3);
    g.fillRect(7, 8, 11, 12);
    g.fillStyle = milkC;
    g.fillRect(8, 11, 9, 8);
    g.fillStyle = '#8A5A2A';
    g.fillRect(8, 3, 9, 2);
    g.fillStyle = shade(c, 25);
    g.fillRect(8, 8, 2, 3);
  },
  // 羊毛：白色卷球 + 红皮筋
  wool: (g) => {
    const c = '#F2EEE4', dark = shade(c, -40);
    g.fillStyle = dark;
    g.fillRect(7, 5, 11, 4);
    g.fillRect(5, 8, 15, 8);
    g.fillRect(7, 16, 11, 3);
    g.fillStyle = c;
    g.fillRect(8, 6, 9, 3);
    g.fillRect(6, 9, 13, 7);
    g.fillRect(8, 16, 9, 2);
    g.fillStyle = shade(c, 18);
    g.fillRect(8, 8, 3, 2); g.fillRect(13, 7, 3, 2); g.fillRect(10, 12, 3, 2);
    g.fillStyle = shade(c, -25);
    g.fillRect(7, 12, 2, 2); g.fillRect(15, 13, 2, 2);
    g.fillStyle = '#C84848';
    g.fillRect(6, 10, 13, 1);
  },
  // 松露：深棕块茎 + 浅色纹理
  truffle: (g) => {
    const c = '#4E3822', dark = shade(c, -30);
    g.fillStyle = dark;
    g.fillRect(7, 8, 11, 9);
    g.fillRect(9, 6, 7, 3);
    g.fillRect(8, 17, 8, 2);
    g.fillStyle = c;
    g.fillRect(8, 9, 9, 8);
    g.fillRect(10, 7, 5, 3);
    g.fillRect(9, 17, 6, 1);
    g.fillStyle = shade(c, 30);
    g.fillRect(9, 9, 2, 2); g.fillRect(13, 11, 2, 2); g.fillRect(10, 14, 2, 2);
    g.fillStyle = shade(c, -15);
    g.fillRect(14, 15, 2, 2);
  },
  // 兔脚：幸运兔脚挂件（浅棕 + 爪尖 + 挂环）
  rabbit_foot: (g) => {
    const c = '#D8B890', dark = shade(c, -40);
    g.fillStyle = '#B8B8C0';
    g.fillRect(10, 2, 5, 1); g.fillRect(10, 3, 1, 2); g.fillRect(14, 3, 1, 2); g.fillRect(11, 4, 3, 1);
    g.fillStyle = dark;
    g.fillRect(9, 6, 7, 9);
    g.fillRect(8, 15, 9, 4);
    g.fillStyle = c;
    g.fillRect(10, 7, 5, 8);
    g.fillRect(9, 16, 7, 2);
    g.fillStyle = shade(c, 25);
    g.fillRect(11, 8, 2, 4);
    g.fillStyle = dark;
    g.fillRect(9, 19, 2, 2); g.fillRect(11, 19, 2, 2); g.fillRect(13, 19, 2, 2); g.fillRect(15, 19, 2, 2);
  },
  // 蛋黄酱：白罐 + 黄酱 + 红盖 + 勺
  mayonnaise: (g) => {
    const jar = '#F0EEE8', dark = shade(jar, -40), sauce = '#F0D24B';
    g.fillStyle = dark;
    g.fillRect(7, 7, 10, 13);
    g.fillStyle = jar;
    g.fillRect(8, 8, 8, 11);
    g.fillStyle = sauce;
    g.fillRect(9, 11, 6, 7);
    g.fillStyle = '#C84848';
    g.fillRect(7, 5, 10, 3);
    g.fillStyle = shade('#C84848', 25);
    g.fillRect(8, 6, 3, 1);
    g.fillStyle = '#FFFFFF';
    g.fillRect(9, 12, 2, 2);
    g.fillStyle = '#B8B8C0';
    g.fillRect(17, 10, 2, 6); g.fillRect(16, 16, 3, 2);
  },
  // 鸭蛋黄酱：青绿罐 + 橙黄酱 + 青盖 + 羽毛装饰
  duck_mayonnaise: (g) => {
    const jar = '#B8D8C0', dark = shade(jar, -45), sauce = '#E8A030';
    g.fillStyle = dark;
    g.fillRect(7, 7, 10, 13);
    g.fillStyle = jar;
    g.fillRect(8, 8, 8, 11);
    g.fillStyle = sauce;
    g.fillRect(9, 11, 6, 7);
    g.fillStyle = '#3E8E96';
    g.fillRect(7, 5, 10, 3);
    g.fillStyle = shade('#3E8E96', 25);
    g.fillRect(8, 6, 3, 1);
    g.fillStyle = '#FFE8B0';
    g.fillRect(9, 12, 2, 2);
    g.fillStyle = '#4A8E6E';
    g.fillRect(18, 9, 2, 3); g.fillRect(17, 12, 3, 2);
  },
  // 奶酪：黄色三角楔 + 孔洞
  cheese: (g) => {
    const c = '#F0C83E', dark = shade(c, -40);
    g.fillStyle = dark;
    g.fillRect(4, 14, 17, 6);
    g.fillRect(7, 11, 11, 4);
    g.fillRect(10, 8, 5, 4);
    g.fillStyle = c;
    g.fillRect(5, 15, 15, 4);
    g.fillRect(8, 12, 9, 3);
    g.fillRect(11, 9, 3, 3);
    g.fillStyle = shade(c, -25);
    g.fillRect(8, 16, 2, 2); g.fillRect(13, 17, 2, 2); g.fillRect(16, 15, 2, 2); g.fillRect(11, 13, 1, 1);
    g.fillStyle = shade(c, 30);
    g.fillRect(5, 15, 15, 1);
  },
  // 山羊奶酪：白色圆轮 + 气孔 + 香草叶
  goat_cheese: (g) => {
    const c = '#F8F6EE', dark = shade(c, -35);
    g.fillStyle = dark;
    g.fillRect(6, 7, 13, 4);
    g.fillRect(4, 10, 17, 6);
    g.fillRect(6, 16, 13, 3);
    g.fillStyle = c;
    g.fillRect(7, 8, 11, 3);
    g.fillRect(5, 11, 15, 5);
    g.fillRect(7, 16, 11, 2);
    g.fillStyle = shade(c, -18);
    g.fillRect(8, 12, 2, 2); g.fillRect(13, 13, 2, 2); g.fillRect(16, 11, 2, 2);
    g.fillStyle = '#FFFFFF';
    g.fillRect(7, 9, 4, 2);
    g.fillStyle = '#9AB87A';
    g.fillRect(10, 5, 4, 1); g.fillRect(11, 4, 2, 1);
  },
  // 松露油：细瓶 + 金色油 + 黑松露片 + 软木塞
  truffle_oil: (g) => {
    const glass = '#E8E2D0', dark = shade(glass, -50), oil = '#D8A83E';
    g.fillStyle = dark;
    g.fillRect(10, 3, 5, 5);
    g.fillRect(8, 8, 9, 13);
    g.fillStyle = glass;
    g.fillRect(11, 4, 3, 5);
    g.fillRect(9, 9, 7, 11);
    g.fillStyle = oil;
    g.fillRect(10, 11, 5, 8);
    g.fillStyle = '#3A2A18';
    g.fillRect(11, 14, 2, 2); g.fillRect(13, 17, 2, 2);
    g.fillStyle = '#8A6A3A';
    g.fillRect(10, 2, 5, 2);
    g.fillStyle = '#F8E8B0';
    g.fillRect(10, 12, 1, 3);
  },
  // 果酒：高脚杯 + 红酒
  wine: (g) => {
    const glass = '#D8E8F0', dark = shade(glass, -45), wineC = '#8E2E4A';
    g.fillStyle = dark;
    g.fillRect(7, 4, 11, 9);
    g.fillRect(11, 13, 3, 5);
    g.fillRect(8, 18, 9, 2);
    g.fillStyle = glass;
    g.fillRect(8, 5, 9, 7);
    g.fillRect(12, 14, 1, 4);
    g.fillRect(9, 19, 7, 1);
    g.fillStyle = wineC;
    g.fillRect(9, 8, 7, 3);
    g.fillStyle = shade(wineC, 35);
    g.fillRect(10, 8, 2, 1);
    g.fillStyle = '#FFFFFF';
    g.fillRect(8, 5, 2, 2);
  },
  // 果汁：宽口杯 + 橙汁 + 红吸管
  juice: (g) => {
    const glass = '#E8F2F6', dark = shade(glass, -45), juiceC = '#F09A3E';
    g.fillStyle = '#E86868';
    g.fillRect(15, 2, 2, 8); g.fillRect(14, 2, 3, 2);
    g.fillStyle = dark;
    g.fillRect(6, 6, 12, 14);
    g.fillStyle = glass;
    g.fillRect(7, 7, 10, 12);
    g.fillStyle = juiceC;
    g.fillRect(8, 9, 8, 9);
    g.fillStyle = shade(juiceC, 30);
    g.fillRect(9, 10, 3, 2);
    g.fillStyle = '#C8DCE8';
    g.fillRect(8, 7, 2, 2);
    g.fillStyle = '#68B84A';
    g.fillRect(5, 5, 3, 2);
  },
  // 蜂蜜：圆罐 + 蜜液 + 木勺
  honey: (g) => {
    const jar = '#F0E8D0', dark = shade(jar, -40), honeyC = '#E8A828';
    g.fillStyle = dark;
    g.fillRect(6, 8, 12, 12);
    g.fillRect(7, 6, 10, 3);
    g.fillStyle = jar;
    g.fillRect(7, 9, 10, 10);
    g.fillRect(8, 7, 8, 2);
    g.fillStyle = honeyC;
    g.fillRect(8, 12, 8, 6);
    g.fillRect(8, 11, 2, 2); g.fillRect(12, 10, 2, 2);
    g.fillStyle = '#C84848';
    g.fillRect(6, 5, 12, 2);
    g.fillStyle = '#8A5A2A';
    g.fillRect(17, 8, 2, 8);
    g.fillStyle = honeyC;
    g.fillRect(16, 6, 4, 3);
    g.fillStyle = '#F8D878';
    g.fillRect(9, 13, 2, 2);
  },
  // 布料：折叠方布 + 红格纹
  cloth: (g) => {
    const c = '#E8DCC8', dark = shade(c, -40), line = '#B85A50';
    g.fillStyle = dark;
    g.fillRect(4, 6, 16, 13);
    g.fillRect(6, 4, 12, 3);
    g.fillStyle = c;
    g.fillRect(5, 7, 14, 11);
    g.fillRect(7, 5, 10, 2);
    g.fillStyle = line;
    g.fillRect(5, 10, 14, 1); g.fillRect(5, 14, 14, 1);
    g.fillRect(9, 7, 1, 11); g.fillRect(14, 7, 1, 11);
    g.fillStyle = shade(c, -20);
    g.fillRect(5, 17, 14, 1);
    g.fillStyle = shade(c, 20);
    g.fillRect(7, 5, 10, 1);
  },
  // 腌菜：玻璃罐 + 绿腌瓜条 + 木盖
  pickles: (g) => {
    const glass = '#DCE8E2', dark = shade(glass, -45), veg = '#5E8E3E';
    g.fillStyle = dark;
    g.fillRect(7, 7, 11, 13);
    g.fillStyle = glass;
    g.fillRect(8, 8, 9, 11);
    g.fillStyle = '#C8B898';
    g.fillRect(8, 15, 7, 3);
    g.fillStyle = veg;
    g.fillRect(9, 10, 3, 8);
    g.fillRect(13, 9, 3, 9);
    g.fillStyle = shade(veg, 25);
    g.fillRect(10, 10, 1, 4); g.fillRect(14, 9, 1, 4);
    g.fillStyle = '#8A5A2A';
    g.fillRect(7, 4, 11, 3);
    g.fillStyle = shade('#8A5A2A', 25);
    g.fillRect(8, 5, 4, 1);
  },
  // 果酱：矮罐 + 红果酱 + 果粒 + 金盖
  jelly: (g) => {
    const glass = '#F0E8E0', dark = shade(glass, -45), jam = '#C83858';
    g.fillStyle = dark;
    g.fillRect(5, 8, 14, 11);
    g.fillStyle = glass;
    g.fillRect(6, 9, 12, 9);
    g.fillStyle = jam;
    g.fillRect(7, 11, 10, 6);
    g.fillStyle = shade(jam, 30);
    g.fillRect(8, 12, 2, 2); g.fillRect(12, 14, 2, 2);
    g.fillStyle = shade(jam, -25);
    g.fillRect(14, 12, 2, 2);
    g.fillStyle = '#D8A83E';
    g.fillRect(5, 5, 14, 3);
    g.fillStyle = shade('#D8A83E', 30);
    g.fillRect(6, 6, 5, 1);
  },
};
