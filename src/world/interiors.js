// 建筑内部视图 v2：多房间 + 主题化装饰 + 丰富交互点
// 进门 → 场外房间（大世界隐藏），出门返回原位。对外 API 与 v1 完全一致。
import * as THREE from 'three';
import { makeSpriteChar } from '../render/spritechar.js';
import { makeTexture, shade } from '../render/textures.js';
import * as F from './furniture.js';

const ROOM = { x: 420, z: 420 }; // 场外房间位置（远离大世界，避免看见）
const L = (o) => new THREE.MeshLambertMaterial(o);
const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const put = (parent, mesh, x, y, z, ry = 0) => { mesh.position.set(x, y, z); mesh.rotation.y = ry; parent.add(mesh); return mesh; };

const HF = 2.6;   // 全墙高（外北/外东）
const HH = 1.15;  // 半墙高（外西/外南与所有内隔墙，镜头西南向剪影视角）
const DOOR_W = 1.2; // 门洞宽

// ---------- 家具调用（带安全回退：家具库缺函数时降级为木箱，不崩溃） ----------
const _missing = new Set();
function fx(name, ...args) {
  const fn = F[name];
  if (typeof fn === 'function') return fn(...args);
  if (!_missing.has(name)) { _missing.add(name); console.warn('[interiors] furniture 缺少', name); }
  const g = new THREE.Group();
  const crate = B(0.7, 0.7, 0.7, L({ color: '#9A6B3F' }));
  crate.castShadow = true;
  g.add(crate);
  g.userData.collide = [0.4, 0.4];
  return g;
}

// ---------- 风味对话 ----------
const say = (name, text) => (g) => { g.audio.sfx('click'); g.dialog.show([{ name, text }]); };

// ---------- 内部定义 ----------
// rooms: {x,z,w,d,wall,floor} 房间中心本地坐标；rooms[0] 南墙中央为入口
// doors: {x,z,axis:'x'|'y'} axis 'x'=墙沿东西向（门洞开在南北走向的横墙上）；entrance 为南门
// props: [mesh, x, z, ry] 全局本地坐标
const INTERIORS = {
  pierre: {
    name: '汐溪杂货店', light: 0xffd8a8,
    rooms: [
      { x: 0, z: 2.5, w: 8, d: 6, wall: '#E8DCC8', floor: '#B8906A' },   // 前厅卖场
      { x: -0.5, z: -3, w: 7, d: 5, wall: '#D8C8B0', floor: '#A8805A' }, // 后仓
    ],
    doors: [{ x: 0, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeCounter', 2.8), 2.0, 0.3, 0],
      [fx('makeShelf', 2.0), -3.5, 1.2, Math.PI / 2],
      [fx('makeShelf', 2.0), -3.5, 3.6, Math.PI / 2],
      [fx('makeShelf', 2.2), 3.5, 2.5, -Math.PI / 2],
      [fx('makeShelf', 1.8), -1.9, 4.7, Math.PI],
      [fx('makeCrateStack'), 3.0, 4.6, 0.3],
      [fx('makeCrate'), -2.8, -4.5, 0.2],
      [fx('makeCrateStack'), -1.2, -4.8, 0],
      [fx('makeSack'), 1.6, -4.5, 0],
      [fx('makeSack'), 2.3, -3.8, 0],
      [fx('makeBarrelG'), -3.2, -1.8, 0],
      [fx('makeHangingLamp'), 0, 2.5, 0],
      [fx('makeHangingLamp'), -0.5, -3, 0],
      [fx('makeRug', '#B8543E'), 0, 2.8, 0],
    ],
    npc: { id: 'pierre', x: 2.0, z: -0.5 },
    spots: [
      { x: 2.0, z: 0.4, r: 1.5, label: 'E 购买/出售', action: (g) => g.shopPanel.show('pierre') },
      { x: 3.0, z: 4.6, r: 1.3, label: 'E 看看板条箱', action: say('板条箱', '箱子里装满新到的种子，标签上印着「星屿一号」。') },
      { x: 1.9, z: -4.2, r: 1.4, label: 'E 摸摸麻袋', action: say('麻袋', '麻袋散发出谷物与干草混合的暖香。') },
    ],
  },
  blacksmith: {
    name: '岩火铁匠铺', light: 0xff9a5a,
    rooms: [
      { x: 0, z: 2.5, w: 8, d: 6, wall: '#B0A898', floor: '#8A7A6A' },   // 锻造间
      { x: 0, z: -2.75, w: 6, d: 4.5, wall: '#C8C0B0', floor: '#9A8A7A' }, // 前铺
    ],
    doors: [{ x: 0, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeForge'), -2.8, 0.6, Math.PI / 2],
      [fx('makeAnvil'), -1.2, 1.6, 0.4],
      [fx('makeWeaponRack'), 3.5, 1.2, -Math.PI / 2],
      [fx('makeToolRack'), -3.5, 3.4, Math.PI / 2],
      [fx('makeOrePile'), -2.6, 4.4, 0],
      [fx('makeOrePile'), -1.6, 4.6, 0.7],
      [fx('makeBarrelG'), 3.0, 4.4, 0],
      [fx('makeCounter', 2.4), 0, -3.2, Math.PI],
      [fx('makeShelf', 1.6), -2.4, -3.4, Math.PI / 2],
      [fx('makeHangingLamp'), 0, 2.5, 0],
      [fx('makeCandle'), 2.4, -4.4, 0],
    ],
    npc: { id: 'clint', x: 0, z: -4.0 },
    spots: [
      { x: 0, z: -3.2, r: 1.5, label: 'E 商店/工具升级', action: (g) => g.shopPanel.show('blacksmith') },
      { x: -2.8, z: 0.6, r: 1.5, label: 'E 看看锻造炉', action: say('锻造炉', '炭火噼啪作响，热浪扑面而来。') },
      { x: 3.5, z: 1.2, r: 1.3, label: 'E 看看武器架', action: say('武器架', '墙上挂着未开刃的剑与镰刀，泛着冷光。') },
      { x: -2.1, z: 4.5, r: 1.3, label: 'E 翻翻矿堆', action: say('矿堆', '矿石里混着几块漂亮的星砂结晶。') },
    ],
  },
  carpenter: {
    name: '穆青木工坊', light: 0xffd8a8,
    rooms: [
      { x: 0, z: 2.5, w: 8, d: 6, wall: '#E0D8C0', floor: '#C8A870' },   // 工坊（锯屑色地）
      { x: 0.5, z: -2.75, w: 7, d: 4.5, wall: '#E8E0CC', floor: '#B8906A' }, // 展厅
    ],
    doors: [{ x: 0.5, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeWorkbench'), 0.4, 1.6, 0.2],
      [fx('makeLumberPile'), -3.0, 1.2, 0],
      [fx('makeLumberPile'), -3.0, 3.4, 0.4],
      [fx('makeToolRack'), 3.5, 2.5, -Math.PI / 2],
      [fx('makeBarrelG'), 2.8, 4.6, 0],
      [fx('makeSack'), -1.6, 4.6, 0],
      [fx('makeCounter', 2.2), 0.5, -3.4, Math.PI],
      [fx('makeTable', 0.5), -1.6, -2.6, 0],
      [fx('makeStool'), -2.3, -2.2, 0],
      [fx('makeStool'), -1.0, -3.1, 0],
      [fx('makeShelf', 1.8), 3.4, -2.8, -Math.PI / 2],
      [fx('makeHangingLamp'), 0, 2.5, 0],
      [fx('makePainting'), 0.5, -4.9, 0],
    ],
    npc: { id: 'robin', x: 0.5, z: -4.1 },
    spots: [
      { x: 0.5, z: -3.4, r: 1.5, label: 'E 购买建材', action: (g) => g.shopPanel.show('carpenter') },
      { x: 0.4, z: 1.6, r: 1.4, label: 'E 看看工作台', action: say('工作台', '刨花散落一地，散发着新鲜木头的清香。') },
      { x: -3.0, z: 2.3, r: 1.4, label: 'E 摸摸木料', action: say('木料堆', '云杉与橡木分门别类，码得整整齐齐。') },
      { x: -1.6, z: -2.6, r: 1.2, label: 'E 看看样品', action: say('家具样品', '一张小圆桌，桌角雕着一朵浪花。') },
    ],
  },
  ranch: {
    name: '青草地牧场', light: 0xffe0a8,
    rooms: [
      { x: 0, z: 2, w: 7, d: 5, wall: '#F0E8D0', floor: '#C8A86A' },     // 门市
      { x: -0.5, z: -3, w: 8, d: 5, wall: '#E0D0A8', floor: '#B89858' }, // 储物棚
    ],
    doors: [{ x: 0, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeCounter', 2.6), 0, 0.6, Math.PI],
      [fx('makeHayBale'), 2.6, 3.4, 0],
      [fx('makeHayBale'), -2.6, 3.6, 0.3],
      [fx('makeShelf', 1.8), -3.0, 0.8, Math.PI / 2],
      [fx('makeFeedTrough'), 1.8, -2.2, 0],
      [fx('makeHayBale'), -3.6, -2.4, 0.2],
      [fx('makeHayBale'), -2.7, -3.4, 0],
      [fx('makeSack'), 3.0, -4.4, 0],
      [fx('makeSack'), 2.3, -4.6, 0],
      [fx('makeCrateStack'), -0.6, -4.6, 0],
      [fx('makeBarrelG'), -3.6, -4.6, 0],
      [fx('makeHangingLamp'), 0, 2, 0],
      [fx('makeRug', '#C8A84E'), 0, 2.4, 0],
    ],
    npc: { id: 'marnie', x: 0, z: -0.3 },
    spots: [
      { x: 0, z: 0.6, r: 1.5, label: 'E 动物与设备', action: (g) => g.shopPanel.show('ranch') },
      { x: 2.6, z: 3.4, r: 1.3, label: 'E 摸摸干草捆', action: say('干草捆', '干草暖烘烘的，有阳光晒过的味道。') },
      { x: 1.8, z: -2.2, r: 1.3, label: 'E 看看饲料槽', action: say('饲料槽', '槽里还剩着几口燕麦，不知哪只小家伙挑食。') },
    ],
  },
  saloon: {
    name: '汐浪酒吧', light: 0xffc878,
    rooms: [
      { x: 0, z: 3, w: 10, d: 7, wall: '#D8C0B0', floor: '#7A5A4A' },   // 大堂
      { x: 2, z: -3.25, w: 6, d: 5.5, wall: '#C8A898', floor: '#6A4A3E' }, // 里间赌场角
    ],
    doors: [{ x: 2, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeCounter', 4.2), -2, 0.5, 0],
      [fx('makeTable', 0.5), 2.4, 2.6, 0],
      [fx('makeTable', 0.5), -2.6, 3.8, 0],
      [fx('makeTable', 0.45), 2.8, 5.2, 0],
      [fx('makeStool'), 1.7, 2.2, 0],
      [fx('makeStool'), -2.0, 4.4, 0],
      [fx('makeJukebox'), -4.4, 1.0, Math.PI / 2],
      [fx('makeBarrelG'), 4.4, 0.8, 0],
      [fx('makeShelf', 2.0), -4.4, 4.8, Math.PI / 2],
      [fx('makeHangingLamp'), 0, 3, 0],
      [fx('makeHangingLamp'), 3, 4, 0],
      [fx('makeCardTable'), 2, -3.4, 0],
      [fx('makeStarLamp'), 2, -3.4, 0],
      [fx('makeShelf', 1.6), 4.6, -2.4, -Math.PI / 2],
      [fx('makeRug', '#8A4A6A'), 2, -3.4, 0],
      [fx('makeCandle'), -0.6, -5.2, 0],
    ],
    npc: { id: 'gus', x: -2, z: -0.4 },
    spots: [
      { x: -2, z: 0.5, r: 1.6, label: 'E 点单', action: (g) => g.shopPanel.show('saloon') },
      { x: 2, z: -3.4, r: 1.4, label: 'E 星灯赌场', action: (g) => g.shopPanel.show('casino') },
      { x: -4.4, z: 1.0, r: 1.3, label: 'E 听听点唱机', action: say('点唱机', '点唱机里传出走了调的老歌，倒也别有味道。') },
      { x: 4.4, z: 0.8, r: 1.2, label: 'E 敲敲酒桶', action: say('酒桶', '桶里传来沉甸甸的晃荡声——今年的果酒成了。') },
    ],
  },
  fishshop: {
    name: '潮声渔具店', light: 0x9ad8e8,
    rooms: [
      { x: 0, z: 2, w: 7, d: 5, wall: '#D0E0E0', floor: '#6A8A8A' },     // 店堂
      { x: 0, z: -2.75, w: 6, d: 4.5, wall: '#B8D0D0', floor: '#5A7A7A' }, // 码头储藏
    ],
    doors: [{ x: 0, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeFishTank'), -2.8, 1.6, Math.PI / 2],
      [fx('makeFishingRack'), 3.0, 1.6, -Math.PI / 2],
      [fx('makeCounter', 2.4), 0, 0.8, Math.PI],
      [fx('makeBarrelG'), 2.8, 3.8, 0],
      [fx('makeCrate'), -2.6, 3.8, 0.3],
      [fx('makeCrateStack'), -1.8, -4.0, 0],
      [fx('makeBarrelG'), 2.0, -4.0, 0],
      [fx('makeSack'), 0.2, -4.2, 0],
      [fx('makeHangingLamp'), 0, 2, 0],
      [fx('makeRug', '#4A7A8A'), 0, 2.6, 0],
    ],
    npc: { id: 'willy', x: 1.2, z: 0 },
    spots: [
      { x: 0, z: 0.8, r: 1.5, label: 'E 渔具/鱼饵', action: (g) => g.shopPanel.show('fishshop') },
      { x: -2.8, z: 1.6, r: 1.4, label: 'E 看看鱼缸', action: say('鱼缸', '气泡咕嘟咕嘟往上冒，小鱼围着水草打转。') },
      { x: 3.0, z: 1.6, r: 1.3, label: 'E 看看鱼竿', action: say('渔具架', '鱼竿上挂着亮晶晶的假饵，像一串小星星。') },
      { x: 0.2, z: -4.2, r: 1.3, label: 'E 闻闻鱼饵袋', action: say('鱼饵袋', '一股咸腥扑面而来——这就是大海的味道吧。') },
    ],
  },
  cc: {
    name: '汐溪旧会馆', light: 0x7ac8e8,
    rooms: [
      { x: 0, z: 3, w: 10, d: 7, wall: '#C0B0C8', floor: '#6A5A7A' },     // 大厅
      { x: -7, z: 0.75, w: 4, d: 5.5, wall: '#A898B8', floor: '#5A4A6A' }, // 侧厅废墟
    ],
    doors: [{ x: -5, z: 1.5, axis: 'y' }],
    props: [
      [fx('makeAltar'), 0, 1.0, 0],
      [fx('makeBrokenPillar'), -3.2, 2.0, 0],
      [fx('makeBrokenPillar'), 3.4, 3.2, 0.3],
      [fx('makeBrokenPillar'), -3.0, 5.2, 0],
      [fx('makeVines'), -4.7, 3.0, Math.PI / 2],
      [fx('makeVines'), 4.7, 1.4, -Math.PI / 2],
      [fx('makeVines'), 1.8, 6.3, Math.PI],
      [fx('makeCandle'), -1.6, 1.0, 0],
      [fx('makeCandle'), 1.6, 1.0, 0],
      [fx('makeCandle'), 0, 2.6, 0],
      [fx('makeCandle'), -2.4, 4.4, 0],
      [fx('makeCandle'), 2.6, 5.4, 0],
      [fx('makeRubble'), 4.0, 5.6, 0],
      [fx('makeRubble'), -7.6, 2.4, 0.4],
      [fx('makeRubble'), -6.2, -1.0, 0],
      [fx('makeBrokenPillar'), -7.8, -0.6, 0],
      [fx('makeVines'), -8.7, 0.75, Math.PI / 2],
      [fx('makeCandle'), -6.4, 2.8, 0],
      [fx('makeCandle'), -7.4, 0.4, 0],
    ],
    spots: [
      { x: 0, z: 1.0, r: 2.0, label: 'E 查看收集包', action: (g) => g.bundleUI.show() },
      { x: -3.2, z: 2.0, r: 1.3, label: 'E 看看断柱', action: say('断柱', '断裂的石柱上爬满藤蔓，刻痕里还留着旧日的金漆。') },
      { x: 0, z: 2.6, r: 1.2, label: 'E 看看烛火', action: say('蜡烛', '无风的大厅里，烛火却轻轻摇晃，像在回应什么。') },
      { x: -7.0, z: 0.2, r: 1.4, label: 'E 翻翻瓦砾', action: say('瓦砾堆', '碎砖下压着半页焦黑的议事记录，字迹已无法辨认。') },
    ],
  },
  farmhouse: {
    name: '农舍（家）', light: 0xffd8a8,
    rooms: [
      { x: 0, z: 2.5, w: 7, d: 5, wall: '#F0E8D8', floor: '#B8906A' },     // 客厅
      { x: -2.5, z: -2, w: 4, d: 4, wall: '#E8D8C8', floor: '#A8805A' },   // 卧室
      { x: 2, z: -2, w: 3.5, d: 4, wall: '#F0E0D0', floor: '#C8A070' },    // 厨房
    ],
    doors: [{ x: -2, z: 0, axis: 'x' }, { x: 2, z: 0, axis: 'x' }],
    props: [
      [fx('makeTV'), 2.8, 0.9, Math.PI],
      [fx('makeSofa'), 2.6, 3.4, 0],
      [fx('makeFireplace'), -3.0, 1.0, Math.PI / 2],
      [fx('makeRug', '#B8543E'), 0.6, 2.6, 0],
      [fx('makeBookshelf', 1.4), -0.8, 0.6, 0],
      [fx('makeTableLamp'), 3.2, 4.2, 0],
      [fx('makeBed'), -2.6, -3.0, 0],
      [fx('makeTableLamp'), -4.0, -3.6, 0],
      [fx('makeRug', '#4A7AB8'), -2.4, -1.4, 0],
      [fx('makePainting'), -3.4, -4.2, 0],
      [fx('makeKitchenCounter'), 2.0, -3.6, 0],
      [fx('makeStove'), 3.3, -2.6, -Math.PI / 2],
      [fx('makeTable', 0.42), 1.2, -1.2, 0],
      [fx('makeStool'), 0.6, -0.8, 0],
      [fx('makeStool'), 1.8, -1.6, 0],
      [fx('makeHangingLamp'), 0, 2.5, 0],
    ],
    spots: [
      { x: -2.6, z: -3.0, r: 1.4, label: 'E 睡觉（进入明天）', action: (g) => g.daycycle.sleep() },
      { x: 2.8, z: 1.6, r: 1.3, label: 'E 看电视', action: (g) => g.tvUI.show() },
      { x: 3.3, z: -2.6, r: 1.2, label: 'E 烹饪', action: (g) => g.craftUI.show('cook') },
      { x: -3.0, z: 1.0, r: 1.3, label: 'E 烤烤火', action: say('壁炉', '火苗轻轻跳动，木柴哔剥作响，屋子里暖洋洋的。') },
      { x: -0.8, z: 0.6, r: 1.1, label: 'E 看看书架', action: say('小书架', '《星屿种植年历》被翻得起了毛边。') },
    ],
  },
  teahouse: {
    name: '云杉茶馆', light: 0xa8e8c8,
    rooms: [
      { x: 0, z: 2.5, w: 8, d: 6, wall: '#D8E8E0', floor: '#6A8A7A' },   // 茶室
      { x: 3, z: -2.5, w: 4, d: 4, wall: '#C8E0D0', floor: '#5A7A6A' },  // 禅意庭院角
    ],
    doors: [{ x: 2.5, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeCounter', 2.4), -3.0, 1.0, Math.PI / 2],
      [fx('makeTeaTable'), 1.2, 1.6, 0],
      [fx('makeTeaTable'), -0.6, 3.6, 0],
      [fx('makeTeaTable'), 2.6, 4.4, 0],
      [fx('makeBonsai'), -3.2, 4.2, 0],
      [fx('makeBonsai'), 3.4, 0.6, 0],
      [fx('makeHangingScroll'), -1.2, -0.2, 0],
      [fx('makeHangingScroll'), 0.8, -0.2, 0],
      [fx('makeShelf', 1.6), -3.4, 2.8, Math.PI / 2],
      [fx('makeHangingLamp'), 0, 2.5, 0],
      [fx('makeStoneLantern'), 4.2, -3.6, 0],
      [fx('makeBamboo'), 1.6, -3.8, 0],
      [fx('makeBamboo'), 2.4, -4.0, 0.5],
      [fx('makeRubble'), 3.4, -2.2, 0],
      [fx('makeRug', '#5A8A6A'), 0.8, 2.8, 0],
    ],
    npc: { id: 'qiaoyin', x: -2.2, z: 0.4 },
    spots: [
      { x: -3.0, z: 1.0, r: 1.5, label: 'E 茶点', action: (g) => g.shopPanel.show('teahouse') },
      { x: -3.2, z: 4.2, r: 1.2, label: 'E 看看盆景', action: say('盆景', '小小的松树种在青瓷盆里，像一座微缩的星峰。') },
      { x: 2.0, z: -3.8, r: 1.3, label: 'E 听听竹叶', action: say('竹丛', '竹叶沙沙作响，像下着一场很小很小的雪。') },
      { x: 4.2, z: -3.6, r: 1.2, label: 'E 看看石灯', action: say('石灯笼', '石灯笼里的烛火常年不熄，据说是第一代店主点下的。') },
    ],
  },
  library: {
    name: '溪谷图书馆', light: 0xffe8b0,
    rooms: [
      { x: 0, z: 3, w: 9, d: 7, wall: '#D0D8E8', floor: '#5A6A8A' },     // 阅览厅
      { x: 0, z: -3, w: 7, d: 5, wall: '#B8C0D8', floor: '#4A5A7A' },    // 藏书深处
    ],
    doors: [{ x: 0, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeBookshelf', 2.2), -3.0, -0.1, 0],
      [fx('makeBookshelf', 2.2), 3.0, -0.1, 0],
      [fx('makeBookshelf', 2.0), -4.0, 2.4, Math.PI / 2],
      [fx('makeBookshelf', 2.0), 4.0, 2.4, -Math.PI / 2],
      [fx('makeBookshelf', 2.0), -4.0, 5.0, Math.PI / 2],
      [fx('makeBookshelf', 2.0), 4.0, 5.0, -Math.PI / 2],
      [fx('makeTable', 0.5), 0.6, 2.6, 0],
      [fx('makeStool'), 0.0, 2.2, 0],
      [fx('makeTable', 0.45), -1.8, 4.4, 0],
      [fx('makeGlobe'), 3.2, 0.9, 0],
      [fx('makeCandle'), 0.6, 2.6, 0],
      [fx('makeHangingLamp'), 0, 3, 0],
      [fx('makeBookshelf', 2.2), -2.4, -5.1, Math.PI],
      [fx('makeBookshelf', 2.2), 2.4, -5.1, Math.PI],
      [fx('makeBookPile'), -2.4, -2.2, 0],
      [fx('makeBookPile'), -1.7, -2.8, 0.6],
      [fx('makeBookPile'), 2.6, -3.4, 0],
      [fx('makeCandle'), 0.8, -4.4, 0],
      [fx('makeCandle'), -0.9, -4.6, 0],
      [fx('makeRug', '#4A5A8A'), 0, 3.2, 0],
    ],
    npc: { id: 'anning', x: 0.8, z: 1.2 },
    spots: [
      { x: 0.6, z: 2.6, r: 1.4, label: 'E 阅读谷地志（ lore ）', action: (g) => g.interiors.readLore() },
      { x: -2.0, z: -2.5, r: 1.4, label: 'E 翻阅废墟残页', action: (g) => g.interiors.readLore('ruins') },
      { x: 2.6, z: -3.4, r: 1.4, label: 'E 读星屿传说', action: (g) => g.interiors.readLore('tales') },
      { x: 3.2, z: 0.9, r: 1.2, label: 'E 转转地球仪', action: say('地球仪', '地球仪上，星屿只是蔚蓝海面小小的一点。') },
    ],
  },
  tailor: {
    name: '锦绣裁缝铺', light: 0xf0c8e0,
    rooms: [
      { x: 0, z: 2, w: 7, d: 5, wall: '#E8D8E0', floor: '#8A6A7A' },     // 店面
      { x: 2.5, z: -2.25, w: 4, d: 3.5, wall: '#D8C8D8', floor: '#7A5A6A' }, // 试衣间
    ],
    doors: [{ x: 2, z: -0.5, axis: 'x' }],
    props: [
      [fx('makeCounter', 2.2), 0, 0.4, Math.PI],
      [fx('makeMannequin'), -2.6, 1.4, 0.3],
      [fx('makeMannequin'), -1.8, 2.6, -0.2],
      [fx('makeClothRack'), 3.0, 1.6, -Math.PI / 2],
      [fx('makeSewingMachine'), -2.6, 3.8, 0],
      [fx('makeShelf', 1.6), 1.6, 4.2, Math.PI],
      [fx('makeCandle'), -0.6, 4.2, 0],
      [fx('makeCurtain'), 1.2, -3.8, 0],
      [fx('makeMirror'), 3.8, -2.6, -Math.PI / 2],
      [fx('makeRug', '#B87AE8'), 2.4, -2.2, 0],
      [fx('makeHangingLamp'), 0, 2, 0],
    ],
    npc: { id: 'suwanyin', x: -1.0, z: -0.2 },
    spots: [
      { x: 0, z: 0.4, r: 1.5, label: 'E 衣帽饰品', action: (g) => g.shopPanel.show('tailor') },
      { x: -2.2, z: 2.0, r: 1.3, label: 'E 看看人台', action: say('人台', '人台穿着未完成的裙子，针脚细密得像浪花。') },
      { x: 3.8, z: -2.6, r: 1.2, label: 'E 照照镜子', action: say('镜子', '镜子里的像素小人冲你眨了眨眼。') },
      { x: -2.6, z: 3.8, r: 1.2, label: 'E 看看缝纫机', action: say('缝纫机', '缝纫机擦得锃亮，踏板上有常年踩踏的痕迹。') },
    ],
  },
};

// ---------- lore 文本 ----------
const LORE_MAIN = [
  '「汐溪谷志·卷一」谷地三面环水，东海南海相拥。碎星海滩的细沙里，埋着上古潮汐留下的星砂。',
  '「汐溪谷志·卷二」低语森林的蘑菇圈终年不散。老人说，月圆之夜能听见菌丝在地下唱歌。',
  '「汐溪谷志·卷三」星峰矿洞深不见底，熔岩层之下仍有未探明的支脉。矿灯会在 40 层以下莫名熄灭。',
  '「汐溪谷志·卷四」旧会馆曾是全镇议事之地。祭坛上的星火熄灭后，小镇渐渐失去了往日的生气。',
  '「汐溪谷志·卷五」传说鱼并非传说。它们只在特定的季节、特定的天气咬钩——钓鱼佬的日历比谁都精。',
  '「汐溪谷志·卷六」云杉茶馆的老板来自森林深处。他的茶里有松针、晨露，还有一点不肯说的秘密。',
];
const LORE_RUINS = [
  '「废墟残页·其一」……会馆落成那年，全镇在祭坛前放了一整夜的天灯，海面亮如白昼……',
  '「废墟残页·其二」……星火并非熄灭，而是被人借走了。借火的人留下一句话：谷丰则还……',
  '「废墟残页·其三」……别信瓦砾下的声音。搬开石头的人，都会开始做同一个涨潮的梦……',
];
const LORE_TALES = [
  '「星屿传说·潮声」退潮最远的夜里，海滩会露出一截石阶，通向沉在湾里的旧灯塔。',
  '「星屿传说·山火」星峰顶的岩石终年温热。铁匠说，那是山的心跳，也是炉火烧得旺的原因。',
  '「星屿传说·森林」低语森林的树木会记住每一个踩过蘑菇圈的人。回头客，蘑菇长得格外肥。',
];

export class Interiors {
  constructor(game) {
    this.game = game;
    this.group = null;
    this.active = null; // 当前内部 id
    this.returnPos = null;
    this.npcChar = null;
    this._npcDef = null;
    this._oldCollide = null;
    this._oldGroundY = null;
    this._lamps = null; // 灯光组
    this._anims = [];   // 需要动画的家具
    this._loreIdx = {}; // 各 lore 列表轮播下标
  }
  has(id) { return !!INTERIORS[id]; }

  _doorsOf(def) {
    const r0 = def.rooms[0];
    return [...(def.doors || []), { x: r0.x, z: r0.z + r0.d / 2, axis: 'x', entrance: true }];
  }

  enter(id) {
    const def = INTERIORS[id];
    if (!def || this.active) return false;
    const g = this.game;
    this.active = id;
    this.returnPos = { x: g.player.pos.x, z: g.player.pos.z };
    // 隐藏大世界，搭建房间
    g.worldBuilder.group.visible = false;
    this.group = new THREE.Group();
    this.buildRooms(def);
    this.group.position.set(ROOM.x, 0, ROOM.z);
    g.engine.scene.add(this.group);
    // 玩家到门口内侧
    const r0 = def.rooms[0];
    g.player.teleport(ROOM.x + r0.x, ROOM.z + r0.z + r0.d / 2 - 1.2);
    // 碰撞：房间矩形（留边距）+ 门洞通道 + 家具 userData.collide 矩形
    this._oldCollide = g.player.collide;
    const rooms = def.rooms;
    const doors = this._doorsOf(def);
    const solids = [];
    for (const [mesh, px, pz, ry] of def.props) {
      const c = mesh.userData?.collide;
      if (!c) continue;
      const rot = Math.abs(Math.abs(((ry || 0) % Math.PI)) - Math.PI / 2) < 0.1;
      solids.push(rot ? [px, pz, c[1], c[0]] : [px, pz, c[0], c[1]]);
    }
    g.player.collide = (x, z) => {
      const lx = x - ROOM.x, lz = z - ROOM.z;
      let inside = false;
      for (const r of rooms) {
        if (Math.abs(lx - r.x) < r.w / 2 - 0.35 && Math.abs(lz - r.z) < r.d / 2 - 0.35) { inside = true; break; }
      }
      if (!inside) {
        for (const dr of doors) {
          if (dr.axis === 'x') {
            const out = dr.entrance ? 0.25 : 0.55;
            if (Math.abs(lx - dr.x) < DOOR_W / 2 && lz > dr.z - 0.55 && lz < dr.z + out) { inside = true; break; }
          } else {
            if (Math.abs(lz - dr.z) < DOOR_W / 2 && Math.abs(lx - dr.x) < 0.55) { inside = true; break; }
          }
        }
      }
      if (!inside) return true;
      for (const [px, pz, hw, hd] of solids) {
        if (Math.abs(lx - px) < hw + 0.22 && Math.abs(lz - pz) < hd + 0.22) return true;
      }
      return false;
    };
    this._oldGroundY = g.player.groundYFn;
    g.player.groundYFn = () => 0;
    // 主题灯光：每间房间一盏
    this._lamps = new THREE.Group();
    for (const r of rooms) {
      const lamp = new THREE.PointLight(def.light || 0xffd8a8, 1.4, Math.max(r.w, r.d) + 6, 1.1);
      lamp.position.set(ROOM.x + r.x, 3.0, ROOM.z + r.z);
      this._lamps.add(lamp);
    }
    g.engine.scene.add(this._lamps);
    g.audio.sfx('open');
    g.ui?.tutorial?.(`${def.name}`, 2200);
    return true;
  }

  exit() {
    if (!this.active) return;
    const g = this.game;
    g.engine.scene.remove(this.group);
    if (this._lamps) g.engine.scene.remove(this._lamps);
    if (this.npcChar) { g.engine.scene.remove(this.npcChar.group); this.npcChar = null; }
    this._npcDef = null;
    this._lamps = null;
    this._anims = [];
    this.group = null;
    g.worldBuilder.group.visible = true;
    g.player.collide = this._oldCollide;
    g.player.groundYFn = this._oldGroundY;
    g.player.teleport(this.returnPos.x, this.returnPos.z);
    this.active = null;
    g.audio.sfx('close');
  }

  // 房间是否与他房在某侧相邻（用于判断内隔墙/外墙）
  _sharedSide(def, room, side) {
    const x0 = room.x - room.w / 2, x1 = room.x + room.w / 2;
    const z0 = room.z - room.d / 2, z1 = room.z + room.d / 2;
    for (const q of def.rooms) {
      if (q === room) continue;
      const qx0 = q.x - q.w / 2, qx1 = q.x + q.w / 2;
      const qz0 = q.z - q.d / 2, qz1 = q.z + q.d / 2;
      if (side === 'N' && Math.abs(qz1 - z0) < 0.05 && Math.min(x1, qx1) - Math.max(x0, qx0) > 0.3) return true;
      if (side === 'S' && Math.abs(qz0 - z1) < 0.05 && Math.min(x1, qx1) - Math.max(x0, qx0) > 0.3) return true;
      if (side === 'W' && Math.abs(qx1 - x0) < 0.05 && Math.min(z1, qz1) - Math.max(z0, qz0) > 0.3) return true;
      if (side === 'E' && Math.abs(qx0 - x1) < 0.05 && Math.min(z1, qz1) - Math.max(z0, qz0) > 0.3) return true;
    }
    return false;
  }

  buildRooms(def) {
    const grp = this.group;
    const doors = this._doorsOf(def);
    // 深色衬底（内部剪影感，避免房间浮在雾色虚空中）
    const back = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: '#14161E' }));
    back.rotation.x = -Math.PI / 2; back.position.y = -0.05;
    grp.add(back);

    for (const room of def.rooms) {
      // 地板
      const floorTex = makeTexture(16, 16, (gg) => {
        gg.fillStyle = room.floor; gg.fillRect(0, 0, 16, 16);
        gg.fillStyle = shade(room.floor, -12); for (let y = 0; y < 16; y += 4) gg.fillRect(0, y, 16, 1);
      });
      floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(room.w / 2, room.d / 2);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.w, room.d), L({ map: floorTex }));
      floor.rotation.x = -Math.PI / 2; floor.position.set(room.x, 0, room.z);
      floor.receiveShadow = true;
      grp.add(floor);

      // 墙
      const wallTex = makeTexture(16, 16, (gg) => {
        gg.fillStyle = room.wall; gg.fillRect(0, 0, 16, 16);
        gg.fillStyle = shade(room.wall, -10); for (let i = 0; i < 20; i++) gg.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 2, 1);
        gg.fillStyle = shade(room.wall, -22); gg.fillRect(0, 14, 16, 2); // 踢脚线
      });
      wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(Math.max(room.w, room.d) / 2, 1);
      const wm = L({ map: wallTex });
      const x0 = room.x - room.w / 2, x1 = room.x + room.w / 2;
      const z0 = room.z - room.d / 2, z1 = room.z + room.d / 2;
      // 四侧：N(z0) S(z1) 沿 x；W(x0) E(x1) 沿 z
      const sides = [
        { side: 'N', axis: 'x', from: x0, to: x1, at: z0 },
        { side: 'S', axis: 'x', from: x0, to: x1, at: z1 },
        { side: 'W', axis: 'z', from: z0, to: z1, at: x0 },
        { side: 'E', axis: 'z', from: z0, to: z1, at: x1 },
      ];
      for (const s of sides) {
        const shared = this._sharedSide(def, room, s.side);
        const h = shared ? HH : (s.side === 'N' || s.side === 'E' ? HF : HH);
        // 本侧墙上的门洞
        const gaps = doors
          .filter((dr) => dr.axis === s.axis && Math.abs((s.axis === 'x' ? dr.z : dr.x) - s.at) < 0.05)
          .map((dr) => (s.axis === 'x' ? dr.x : dr.z))
          .filter((p) => p > s.from - 0.01 && p < s.to + 0.01)
          .sort((a, b) => a - b);
        // 分段砌墙
        let cur = s.from;
        const segs = [];
        for (const p of gaps) {
          const g0 = Math.max(p - DOOR_W / 2, s.from), g1 = Math.min(p + DOOR_W / 2, s.to);
          if (g0 - cur > 0.05) segs.push([cur, g0]);
          cur = Math.max(cur, g1);
        }
        if (s.to - cur > 0.05) segs.push([cur, s.to]);
        for (const [a, b] of segs) {
          const len = b - a, mid = (a + b) / 2;
          if (s.axis === 'x') put(grp, B(len, h, 0.3, wm), mid, h / 2, s.at);
          else put(grp, B(0.3, h, len, wm), s.at, h / 2, mid);
        }
        // 门楣（全高外墙上的门洞上方补一段）
        if (gaps.length && h === HF) {
          for (const p of gaps) {
            if (s.axis === 'x') put(grp, B(DOOR_W, HF - 1.9, 0.3, wm), p, 1.9 + (HF - 1.9) / 2, s.at);
            else put(grp, B(0.3, HF - 1.9, DOOR_W, wm), s.at, 1.9 + (HF - 1.9) / 2, p);
          }
        }
      }
    }

    // 家具
    this._anims = [];
    for (const [mesh, px, pz, ry] of def.props) {
      mesh.position.set(px, 0, pz);
      mesh.rotation.y = ry || 0;
      grp.add(mesh);
      if (typeof mesh.userData?.anim === 'function') this._anims.push(mesh);
    }
    // NPC 店员
    if (def.npc) {
      this.npcChar = makeSpriteChar({});
      this.npcChar.group.position.set(ROOM.x + def.npc.x, 0, ROOM.z + def.npc.z);
      this.game.engine.scene.add(this.npcChar.group);
      this._npcDef = def.npc;
    }
    // 门口地垫（第一间房南门内侧）
    const r0 = def.rooms[0];
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), L({ color: '#8A5A4A' }));
    mat.rotation.x = -Math.PI / 2; mat.position.set(r0.x, 0.01, r0.z + r0.d / 2 - 0.6);
    grp.add(mat);
  }

  // 最近交互点（含出门点与店员对话）
  nearestSpot(x, z) {
    if (!this.active) return null;
    const g = this.game;
    const def = INTERIORS[this.active];
    const lx = x - ROOM.x, lz = z - ROOM.z;
    // 出门点（第一间房南门）
    const r0 = def.rooms[0];
    const ez = r0.z + r0.d / 2;
    if (Math.abs(lx - r0.x) < 0.9 && lz > ez - 1.6 && lz < ez + 0.25) {
      return { label: 'E 出门', action: () => this.exit() };
    }
    for (const s of def.spots) {
      if (Math.hypot(lx - s.x, lz - s.z) < s.r) return { label: s.label, action: () => s.action(g) };
    }
    if (def.npc && this._npcDef) {
      if (Math.hypot(lx - def.npc.x, lz - def.npc.z) < 1.4) {
        return { label: `E 与店主交谈`, action: () => this.talkToKeeper(def.npc.id) };
      }
    }
    return null;
  }

  talkToKeeper(npcId) {
    const g = this.game;
    const ent = [...g.npcSystem.entities.values()].find((e) => e.def.id === npcId);
    if (ent) g.npcSystem.talk(ent);
  }

  // 阅读：which 为空 = 谷地志；'ruins' = 废墟残页；'tales' = 星屿传说
  readLore(which) {
    const g = this.game;
    const table = { ruins: ['废墟残页', LORE_RUINS], tales: ['星屿传说', LORE_TALES] };
    const [name, list] = table[which] || ['谷地志', LORE_MAIN];
    const key = which || 'main';
    this._loreIdx[key] = ((this._loreIdx[key] ?? -1) + 1) % list.length;
    g.dialog.show([{ name, text: list[this._loreIdx[key]] }]);
  }

  update(dt, t) {
    // 店员轻微待机动画（呼吸）
    if (this.npcChar) this.npcChar.update(dt, false, false, Math.PI);
    // 家具动画（火焰/气泡/挂牌摇晃等）
    for (const m of this._anims) m.userData.anim(dt, t);
  }
}
