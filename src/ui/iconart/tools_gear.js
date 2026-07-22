// 像素图标：tools_gear | 工具+武器+装备+杂项：hoe(锄头), wateringcan(浇水壶), axe(斧头), pickaxe(镐), scythe(镰刀), fishingrod(竹鱼竿), fiberglass_rod(玻璃纤维竿), iridium_rod(铱金竿), sword(锈剑), sword_steel(钢剑), sword_frost(霜刃), sword_shadow(暗影剑), boots_leather(皮靴), boots_lava(熔岩靴), ring_vampire(吸能戒指), ring_thorns(荆棘戒指), straw_hat(复活草帽), ice_cloak(冰雪披风), bait(鱼饵), deluxe_bait(豪华鱼饵), dressed_spinner(精装旋式鱼漂), bomb1(樱桃炸弹), bomb2(炸弹), bomb3(超级炸弹), bouquet(花束), mermaid_pendant(人鱼吊坠) 分组
// 内联 shade（原实现在 render/textures.js，但其依赖 three，无法在本模块独立加载）
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// 通用：剑（对角斜剑：柄在左下，尖在右上）
function sword(g, blade, edge, guard, hilt) {
  const bd = shade(blade, -50), bl = shade(blade, 45);
  for (let i = 0; i < 11; i++) {
    const x = 9 + i, y = 14 - i;
    g.fillStyle = bd; g.fillRect(x + 1, y + 1, 2, 2);
    g.fillStyle = blade; g.fillRect(x, y, 2, 2);
    g.fillStyle = bl; g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = edge; g.fillRect(19, 3, 2, 2); g.fillRect(20, 4, 1, 1);
  g.fillStyle = guard; g.fillRect(7, 13, 2, 2); g.fillRect(10, 16, 2, 2); g.fillRect(8, 15, 3, 1); g.fillRect(9, 14, 1, 3);
  g.fillStyle = shade(guard, -40); g.fillRect(8, 16, 3, 1);
  g.fillStyle = hilt; g.fillRect(6, 17, 2, 2); g.fillRect(5, 19, 2, 2); g.fillRect(4, 20, 2, 2);
  g.fillStyle = shade(hilt, -45); g.fillRect(4, 21, 2, 1);
}
// 通用：工具柄（从左下向右上对角）+ 头部回调
function tool(g, handle, headFn) {
  const hd = shade(handle, -45), hl = shade(handle, 35);
  for (let i = 0; i < 10; i++) {
    const x = 5 + i, y = 18 - i;
    g.fillStyle = hd; g.fillRect(x + 1, y + 1, 1, 1);
    g.fillStyle = handle; g.fillRect(x, y, 1, 2);
    g.fillStyle = hl; g.fillRect(x, y, 1, 1);
  }
  headFn(g);
}

export const DRAWERS = {
  // 锄头：木柄 + 宽扁金属头向下
  hoe: (g) => {
    tool(g, '#9A6B3F', (g) => {
      g.fillStyle = '#8D8D96'; g.fillRect(14, 4, 3, 3); g.fillRect(15, 7, 4, 2); g.fillRect(16, 9, 4, 2);
      g.fillStyle = '#6E6E78'; g.fillRect(16, 10, 4, 1); g.fillRect(17, 11, 3, 1);
      g.fillStyle = '#C8C8D0'; g.fillRect(14, 4, 2, 1);
    });
  },
  // 浇水壶：壶身 + 壶嘴 + 提手 + 水滴
  wateringcan: (g) => {
    g.fillStyle = '#4E8E46'; g.fillRect(7, 10, 10, 9); // 壶身
    g.fillStyle = '#3E7339'; g.fillRect(7, 18, 10, 1); g.fillRect(16, 10, 1, 9);
    g.fillStyle = '#6FAF66'; g.fillRect(8, 11, 3, 2); // 高光
    g.fillStyle = '#4E8E46'; g.fillRect(3, 8, 4, 2); g.fillRect(2, 9, 2, 3); g.fillRect(1, 11, 2, 2); // 壶嘴
    g.fillStyle = '#3E7339'; g.fillRect(2, 12, 1, 1);
    g.fillStyle = '#3E7339'; g.fillRect(9, 6, 6, 2); g.fillRect(9, 8, 2, 2); g.fillRect(13, 8, 2, 2); // 提手
    g.fillStyle = '#5FB4E8'; g.fillRect(0, 14, 1, 1); g.fillRect(1, 16, 1, 1); g.fillRect(0, 18, 1, 1); // 水滴
  },
  // 斧头：木柄 + 单侧斧刃
  axe: (g) => {
    tool(g, '#8A5A2A', (g) => {
      g.fillStyle = '#9A9AA6'; g.fillRect(13, 3, 5, 6); g.fillRect(17, 4, 2, 4);
      g.fillStyle = '#C8C8D4'; g.fillRect(18, 4, 1, 4); // 刃口亮
      g.fillStyle = '#6E6E78'; g.fillRect(13, 8, 5, 1); g.fillRect(13, 3, 1, 6);
    });
  },
  // 镐：木柄 + 双尖镐头
  pickaxe: (g) => {
    tool(g, '#9A6B3F', (g) => {
      g.fillStyle = '#7E7E8A'; g.fillRect(9, 6, 10, 2);
      g.fillRect(7, 7, 3, 2); g.fillRect(5, 8, 2, 2); g.fillRect(4, 9, 1, 1); // 左尖
      g.fillRect(18, 7, 3, 2); g.fillRect(20, 8, 2, 2); g.fillRect(22, 9, 1, 1); // 右尖
      g.fillStyle = '#5E5E68'; g.fillRect(9, 8, 10, 1); g.fillRect(5, 10, 2, 1); g.fillRect(20, 10, 2, 1);
      g.fillStyle = '#B0B0BC'; g.fillRect(10, 6, 8, 1);
    });
  },
  // 镰刀：短柄 + 大弯月刀刃
  scythe: (g) => {
    const hd = shade('#9A6B3F', -45);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = hd; g.fillRect(6 + i + 1, 16 - i + 1, 1, 1);
      g.fillStyle = '#9A6B3F'; g.fillRect(6 + i, 16 - i, 1, 2);
    }
    g.fillStyle = '#B8B8C4'; g.fillRect(11, 8, 2, 2); g.fillRect(13, 6, 3, 2); g.fillRect(16, 5, 4, 2); g.fillRect(20, 6, 2, 2); g.fillRect(21, 7, 1, 2);
    g.fillStyle = '#8A8A96'; g.fillRect(12, 9, 2, 1); g.fillRect(14, 8, 3, 1); g.fillRect(17, 7, 4, 1);
    g.fillStyle = '#E0E0EA'; g.fillRect(14, 6, 2, 1); g.fillRect(17, 5, 3, 1);
  },
  // 竹鱼竿：细竹竿 + 线 + 软木浮漂
  fishingrod: (g) => {
    for (let i = 0; i < 14; i++) {
      g.fillStyle = i % 4 === 3 ? '#7A5A28' : '#B8924A'; g.fillRect(4 + i, 19 - i, 1, 1);
    }
    g.fillStyle = '#D8D8D8'; g.fillRect(18, 6, 1, 6); // 线
    g.fillStyle = '#C8402E'; g.fillRect(17, 12, 3, 2); g.fillStyle = '#F0F0F0'; g.fillRect(17, 14, 3, 2); // 浮漂
    g.fillStyle = '#5E4A20'; g.fillRect(4, 19, 2, 2); // 握把
  },
  // 玻璃纤维竿：蓝绿竿 + 绕线轮 + 线
  fiberglass_rod: (g) => {
    for (let i = 0; i < 14; i++) {
      g.fillStyle = i % 5 === 4 ? '#2E7A8C' : '#3FA8BC'; g.fillRect(4 + i, 19 - i, 1, 1);
    }
    g.fillStyle = '#E8E8E8'; g.fillRect(18, 6, 1, 7);
    g.fillStyle = '#C8402E'; g.fillRect(17, 13, 3, 2); g.fillStyle = '#F0F0F0'; g.fillRect(17, 15, 3, 1);
    g.fillStyle = '#C8A02E'; g.fillRect(6, 18, 3, 3); g.fillStyle = '#8A6A1A'; g.fillRect(7, 19, 1, 1); // 绕线轮
    g.fillStyle = '#4A4A52'; g.fillRect(4, 20, 2, 2);
  },
  // 铱金竿：紫白金属竿 + 金轮 + 闪光
  iridium_rod: (g) => {
    for (let i = 0; i < 14; i++) {
      g.fillStyle = i % 4 === 2 ? '#8A6AC8' : '#C8BCE8'; g.fillRect(4 + i, 19 - i, 1, 1);
    }
    g.fillStyle = '#F0E8FF'; g.fillRect(18, 6, 1, 7);
    g.fillStyle = '#C8402E'; g.fillRect(17, 13, 3, 2); g.fillStyle = '#F0F0F0'; g.fillRect(17, 15, 3, 1);
    g.fillStyle = '#E8C84A'; g.fillRect(6, 18, 3, 3); g.fillStyle = '#FFF0B0'; g.fillRect(7, 18, 1, 1);
    g.fillStyle = '#FFFFFF'; g.fillRect(15, 6, 1, 1); g.fillRect(20, 4, 1, 1); g.fillRect(13, 9, 1, 1); // 闪光
  },
  // 锈剑：褐锈色剑
  sword: (g) => sword(g, '#9A6B3F', '#B88A5A', '#6E4A2A', '#4A3220'),
  // 钢剑：亮银钢剑
  sword_steel: (g) => sword(g, '#C8CCD4', '#F0F2F8', '#8A7A3E', '#5E4A2E'),
  // 霜刃：冰蓝剑 + 寒气
  sword_frost: (g) => {
    sword(g, '#9AD8F0', '#E8F8FF', '#5E9AB8', '#3E6E8C');
    g.fillStyle = '#E8F8FF'; g.fillRect(16, 2, 1, 1); g.fillRect(21, 6, 1, 1); g.fillRect(13, 8, 1, 1);
  },
  // 暗影剑：深紫黑剑 + 紫焰
  sword_shadow: (g) => {
    sword(g, '#3A2A52', '#6A4A9E', '#2A1A3E', '#1A1028');
    g.fillStyle = '#8A5AC8'; g.fillRect(14, 7, 1, 1); g.fillRect(17, 4, 1, 1); g.fillRect(11, 11, 1, 1);
  },
  // 皮靴：棕色高筒靴
  boots_leather: (g) => {
    g.fillStyle = '#8A5A2A'; g.fillRect(8, 4, 7, 12); g.fillRect(8, 16, 12, 5);
    g.fillStyle = '#6E4218'; g.fillRect(8, 19, 12, 2); g.fillRect(14, 4, 1, 17); g.fillRect(19, 16, 1, 5);
    g.fillStyle = '#AA7640'; g.fillRect(9, 5, 2, 8); g.fillRect(9, 17, 3, 1);
    g.fillStyle = '#5E3410'; g.fillRect(8, 4, 7, 1); // 靴口
  },
  // 熔岩靴：黑靴 + 熔岩裂纹
  boots_lava: (g) => {
    g.fillStyle = '#3A3038'; g.fillRect(8, 4, 7, 12); g.fillRect(8, 16, 12, 5);
    g.fillStyle = '#241C22'; g.fillRect(8, 19, 12, 2); g.fillRect(14, 4, 1, 17); g.fillRect(19, 16, 1, 5);
    g.fillStyle = '#E85A1E'; g.fillRect(9, 7, 2, 1); g.fillRect(10, 8, 1, 3); g.fillRect(11, 17, 3, 1); g.fillRect(15, 18, 1, 1);
    g.fillStyle = '#FFB03A'; g.fillRect(10, 7, 1, 1); g.fillRect(12, 17, 1, 1);
  },
  // 吸能戒指：金环 + 血红宝石 + 獠牙光
  ring_vampire: (g) => {
    g.fillStyle = '#C8A02E'; g.fillRect(8, 12, 8, 3); g.fillRect(8, 15, 2, 4); g.fillRect(14, 15, 2, 4); g.fillRect(9, 19, 6, 2);
    g.fillStyle = '#8A6A1A'; g.fillRect(9, 20, 6, 1); g.fillRect(15, 15, 1, 4);
    g.fillStyle = '#C81E3A'; g.fillRect(10, 6, 5, 5); g.fillStyle = '#8A0E24'; g.fillRect(10, 10, 5, 1); g.fillRect(14, 6, 1, 5);
    g.fillStyle = '#FF7A8A'; g.fillRect(11, 7, 2, 1);
    g.fillStyle = '#F0F0F0'; g.fillRect(9, 12, 1, 2); g.fillRect(15, 12, 1, 2); // 獠牙
  },
  // 荆棘戒指：藤绿环 + 尖刺 + 红花
  ring_thorns: (g) => {
    g.fillStyle = '#4E7A2E'; g.fillRect(8, 12, 8, 3); g.fillRect(8, 15, 2, 4); g.fillRect(14, 15, 2, 4); g.fillRect(9, 19, 6, 2);
    g.fillStyle = '#3A5E20'; g.fillRect(9, 20, 6, 1); g.fillRect(15, 15, 1, 4);
    g.fillStyle = '#6E9A3E'; g.fillRect(9, 13, 3, 1);
    g.fillStyle = '#3A5E20'; g.fillRect(7, 10, 1, 3); g.fillRect(16, 10, 1, 3); g.fillRect(6, 15, 2, 1); g.fillRect(16, 17, 2, 1); // 尖刺
    g.fillStyle = '#C8405A'; g.fillRect(10, 6, 4, 4); g.fillStyle = '#8A2438'; g.fillRect(10, 9, 4, 1);
    g.fillStyle = '#F08A9A'; g.fillRect(11, 7, 1, 1);
  },
  // 复活草帽：黄草帽 + 红带 + 小花
  straw_hat: (g) => {
    g.fillStyle = '#E8C84A'; g.fillRect(5, 13, 14, 4); // 帽檐
    g.fillStyle = '#C8A02E'; g.fillRect(5, 16, 14, 1);
    g.fillStyle = '#E8C84A'; g.fillRect(9, 7, 6, 6); // 帽顶
    g.fillStyle = '#F0DC8A'; g.fillRect(10, 8, 2, 2);
    g.fillStyle = '#C8483E'; g.fillRect(9, 11, 6, 2); // 红带
    g.fillStyle = '#FFC9DD'; g.fillRect(15, 9, 2, 2); g.fillRect(14, 10, 4, 1); g.fillRect(15, 8, 2, 4); // 小花
    g.fillStyle = '#E8A02E'; g.fillRect(16, 10, 1, 1);
  },
  // 冰雪披风：冰蓝披风 + 雪花 + 高领
  ice_cloak: (g) => {
    g.fillStyle = '#7AB8DC'; g.fillRect(7, 7, 10, 3); g.fillRect(6, 10, 12, 5); g.fillRect(5, 15, 14, 4); g.fillRect(4, 19, 16, 3);
    g.fillStyle = '#5E96BC'; g.fillRect(4, 21, 16, 1); g.fillRect(17, 10, 1, 9);
    g.fillStyle = '#A8D8F0'; g.fillRect(8, 8, 2, 1); g.fillRect(7, 11, 2, 3);
    g.fillStyle = '#4E7E9E'; g.fillRect(9, 4, 6, 3); // 高领
    g.fillStyle = '#FFFFFF'; g.fillRect(10, 12, 1, 1); g.fillRect(14, 15, 1, 1); g.fillRect(8, 17, 1, 1); g.fillRect(16, 19, 1, 1); g.fillRect(12, 20, 1, 1); // 雪花
  },
  // 鱼饵：小虫团
  bait: (g) => {
    g.fillStyle = '#B87848'; g.fillRect(8, 10, 9, 3); g.fillRect(7, 13, 10, 3); g.fillRect(8, 16, 8, 2);
    g.fillStyle = '#96582E'; g.fillRect(8, 15, 9, 1); g.fillRect(10, 10, 1, 8); g.fillRect(13, 10, 1, 8);
    g.fillStyle = '#D89A68'; g.fillRect(9, 11, 3, 1);
    g.fillStyle = '#6E3E1A'; g.fillRect(17, 12, 2, 2); // 尾
  },
  // 豪华鱼饵：彩条软虫 + 金钩
  deluxe_bait: (g) => {
    g.fillStyle = '#E85A8A'; g.fillRect(7, 9, 10, 3);
    g.fillStyle = '#F0C84A'; g.fillRect(7, 12, 10, 3);
    g.fillStyle = '#5AC85A'; g.fillRect(7, 15, 10, 3);
    g.fillStyle = '#8A2E52'; g.fillRect(7, 11, 10, 1); g.fillRect(7, 14, 10, 1); g.fillRect(7, 17, 10, 1);
    g.fillStyle = '#E8E8E8'; g.fillRect(17, 6, 1, 5); g.fillRect(16, 10, 2, 1); g.fillRect(15, 8, 1, 2); // 钩
    g.fillStyle = '#FFFFFF'; g.fillRect(9, 10, 2, 1); g.fillRect(11, 13, 2, 1);
  },
  // 精装旋式鱼漂：金属亮片 + 彩羽钩
  dressed_spinner: (g) => {
    g.fillStyle = '#E8C84A'; g.fillRect(10, 4, 6, 8); // 亮片
    g.fillStyle = '#FFF0B0'; g.fillRect(11, 5, 2, 5);
    g.fillStyle = '#B8941E'; g.fillRect(10, 11, 6, 1); g.fillRect(15, 4, 1, 8);
    g.fillStyle = '#C8C8D0'; g.fillRect(12, 12, 2, 2); // 连接环
    g.fillStyle = '#C8483E'; g.fillRect(9, 14, 8, 2); g.fillRect(8, 16, 4, 2); g.fillRect(14, 16, 4, 2); // 彩羽
    g.fillStyle = '#E88A3E'; g.fillRect(10, 18, 2, 2); g.fillRect(14, 18, 2, 2);
    g.fillStyle = '#8A8A96'; g.fillRect(11, 20, 4, 1); g.fillRect(10, 21, 1, 2); g.fillRect(15, 21, 1, 2); // 双钩
  },
  // 樱桃炸弹：小红球 + 引线火花
  bomb1: (g) => {
    g.fillStyle = '#D83838'; g.fillRect(8, 11, 9, 8); g.fillRect(9, 10, 7, 10);
    g.fillStyle = '#A01818'; g.fillRect(8, 17, 9, 2); g.fillRect(15, 11, 2, 8);
    g.fillStyle = '#F08080'; g.fillRect(10, 12, 3, 2);
    g.fillStyle = '#5E4A2E'; g.fillRect(11, 7, 3, 3); g.fillRect(13, 5, 2, 2); // 引线
    g.fillStyle = '#F0C84A'; g.fillRect(15, 3, 2, 2); g.fillStyle = '#FFF0B0'; g.fillRect(16, 2, 1, 1); g.fillRect(17, 4, 1, 1); // 火花
  },
  // 炸弹：黑色圆炸弹 + 引线
  bomb2: (g) => {
    g.fillStyle = '#3A3A44'; g.fillRect(7, 10, 11, 10); g.fillRect(9, 8, 7, 14);
    g.fillStyle = '#1E1E26'; g.fillRect(7, 18, 11, 2); g.fillRect(15, 10, 3, 10);
    g.fillStyle = '#8A8A96'; g.fillRect(9, 11, 3, 3);
    g.fillStyle = '#6E5A3E'; g.fillRect(11, 5, 3, 3); g.fillRect(13, 3, 2, 2);
    g.fillStyle = '#F0C84A'; g.fillRect(15, 2, 2, 2); g.fillStyle = '#FFFFFF'; g.fillRect(16, 1, 1, 1);
  },
  // 超级炸弹：大红黑炸弹 + 骷髅纹 + 大火花
  bomb3: (g) => {
    g.fillStyle = '#8A1E2E'; g.fillRect(6, 9, 13, 12); g.fillRect(8, 7, 9, 15);
    g.fillStyle = '#5E0E1A'; g.fillRect(6, 19, 13, 2); g.fillRect(16, 9, 3, 12);
    g.fillStyle = '#C84A5A'; g.fillRect(8, 10, 4, 3);
    g.fillStyle = '#F0E8D8'; g.fillRect(11, 13, 2, 2); g.fillRect(14, 13, 2, 2); g.fillRect(12, 16, 3, 1); // 骷髅眼鼻
    g.fillStyle = '#3A2A1A'; g.fillRect(11, 4, 3, 3); g.fillRect(13, 2, 2, 2);
    g.fillStyle = '#FFB03A'; g.fillRect(15, 0, 2, 2); g.fillRect(17, 2, 2, 2); g.fillStyle = '#FFF0B0'; g.fillRect(16, 1, 1, 1);
  },
  // 花束：彩花 + 绿纸包裹
  bouquet: (g) => {
    g.fillStyle = '#4E8E46'; g.fillRect(10, 15, 5, 7); g.fillRect(9, 18, 7, 4); // 包装
    g.fillStyle = '#3E7339'; g.fillRect(9, 21, 7, 1); g.fillRect(14, 15, 1, 7);
    g.fillStyle = '#E85A8A'; g.fillRect(7, 7, 4, 4); g.fillRect(13, 5, 4, 4); // 粉花
    g.fillStyle = '#C8402E'; g.fillRect(10, 9, 4, 4); g.fillRect(17, 8, 4, 4); // 红花
    g.fillStyle = '#F0C84A'; g.fillRect(9, 4, 3, 3); g.fillRect(16, 4, 3, 3); // 黄花
    g.fillStyle = '#FFF0B0'; g.fillRect(8, 8, 1, 1); g.fillRect(14, 6, 1, 1); g.fillRect(18, 9, 1, 1);
    g.fillStyle = '#8A2438'; g.fillRect(11, 11, 1, 1); g.fillRect(14, 9, 1, 1);
    g.fillStyle = '#E8C84A'; g.fillRect(10, 16, 5, 2); // 扎带
  },
  // 人鱼吊坠：青绿贝壳坠 + 珍珠 + 银链
  mermaid_pendant: (g) => {
    g.fillStyle = '#C8C8D0'; g.fillRect(10, 2, 1, 3); g.fillRect(13, 2, 1, 3); g.fillRect(11, 4, 2, 1); // 链
    g.fillStyle = '#3EA89E'; g.fillRect(8, 8, 8, 4); g.fillRect(7, 12, 10, 5); g.fillRect(6, 17, 12, 4); // 贝壳
    g.fillStyle = '#2E8A80'; g.fillRect(6, 20, 12, 1); g.fillRect(10, 8, 1, 13); g.fillRect(13, 8, 1, 13); g.fillRect(8, 11, 1, 8); g.fillRect(15, 11, 1, 8);
    g.fillStyle = '#7AD8CE'; g.fillRect(9, 9, 1, 3); g.fillRect(14, 9, 1, 2);
    g.fillStyle = '#F0F0F8'; g.fillRect(11, 14, 3, 3); g.fillStyle = '#C8C8D8'; g.fillRect(13, 16, 1, 1); // 珍珠
  },
};
