// 物品图标工厂：24×24 程序化图标（全物品可用，缓存）
import { getItem, CROPS } from '../data/items.js';
import { mkCanvas, PAL, shade } from '../render/textures.js';
import { hashStr } from '../core/rng.js';
import { DRAWERS as D_crops_a } from './iconart/crops_a_作物图标.js';
import { DRAWERS as D_crops_b } from './iconart/crops_b.js';
import { DRAWERS as D_seeds } from './iconart/seeds.js';
import { DRAWERS as D_fish_a } from './iconart/fish_a_鱼类图标.js';
import { DRAWERS as D_fish_b } from './iconart/fish_b_鱼类图标.js';
import { DRAWERS as D_food_a } from './iconart/food_a_菜肴图标.js';
import { DRAWERS as D_food_b } from './iconart/food_b_餐食饮品图标.js';
import { DRAWERS as D_forage_gems } from './iconart/forage_gems.js';
import { DRAWERS as D_animal_artisan } from './iconart/animal_artisan_动物产品加工品.js';
import { DRAWERS as D_machines } from './iconart/machines.js';
import { DRAWERS as D_resources } from './iconart/resources_基础资源矿石锭杂物.js';
import { DRAWERS as D_tools_gear } from './iconart/tools_gear.js';
import { DRAWERS as D_farm_misc } from './iconart/farm_misc.js';

// 每物品专属图标（覆盖全部 323 个物品）；未命中时回退到按类型的通用绘制
const PER_ITEM = Object.assign(
  {}, D_crops_a, D_crops_b, D_seeds, D_fish_a, D_fish_b, D_food_a, D_food_b,
  D_forage_gems, D_animal_artisan, D_machines, D_resources, D_tools_gear, D_farm_misc,
);

const cache = new Map();
const FRUIT_COLORS = ['#E84A4A', '#F0A83C', '#E8E84A', '#8AE84A', '#4AC8E8', '#B84AE8', '#E84A8A', '#F0F0F0', '#4A5AE8', '#E87A3C'];
export function cropColor(id) { return FRUIT_COLORS[hashStr(id) % FRUIT_COLORS.length]; }

function base() { const c = mkCanvas(24, 24), g = c.getContext('2d'); g.clearRect(0, 0, 24, 24); return [c, g]; }
function finish(c) { return c.toDataURL(); }

const drawers = {
  tool(g, it) {
    g.strokeStyle = '#8A5A2A'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(7, 17); g.lineTo(16, 8); g.stroke();
    g.fillStyle = '#A0A0AC';
    const shapes = {
      hoe: () => { g.fillRect(14, 4, 6, 3); g.fillRect(17, 6, 3, 5); },
      wateringcan: () => { g.fillStyle = '#5A8AC8'; g.fillRect(12, 8, 8, 7); g.fillRect(19, 6, 2, 4); g.fillStyle = '#9FD4F0'; g.fillRect(13, 9, 2, 2); },
      axe: () => { g.fillRect(13, 3, 7, 6); g.fillStyle = '#7A7A88'; g.fillRect(13, 8, 7, 2); },
      pickaxe: () => { g.beginPath(); g.moveTo(10, 6); g.quadraticCurveTo(18, 2, 21, 9); g.lineTo(18, 11); g.quadraticCurveTo(15, 6, 11, 9); g.closePath(); g.fill(); },
      scythe: () => { g.strokeStyle = '#A0A0AC'; g.beginPath(); g.arc(14, 12, 7, -0.6, 1.2); g.stroke(); },
      fishingrod: () => { g.strokeStyle = '#B89B5A'; g.lineWidth = 2; g.beginPath(); g.moveTo(6, 19); g.quadraticCurveTo(14, 8, 20, 4); g.stroke(); g.strokeStyle = '#D0D0D8'; g.lineWidth = 1; g.beginPath(); g.moveTo(20, 4); g.lineTo(20, 12); g.stroke(); g.fillStyle = '#E84A4A'; g.fillRect(19, 12, 2, 3); },
    };
    (shapes[it.id] || shapes.hoe)();
  },
  weapon(g) { g.strokeStyle = '#8A5A2A'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 16); g.lineTo(12, 12); g.stroke(); g.fillStyle = '#C0C0CC'; g.beginPath(); g.moveTo(11, 13); g.lineTo(19, 5); g.lineTo(20, 6); g.lineTo(13, 15); g.closePath(); g.fill(); },
  seed(g, it) {
    const col = cropColor(it.crop || it.id);
    g.fillStyle = '#6B4E2E'; g.fillRect(4, 14, 16, 6);
    g.fillStyle = col;
    g.fillRect(7, 11, 3, 3); g.fillRect(12, 10, 3, 3); g.fillRect(16, 12, 3, 3);
    g.fillStyle = shade(col, 40); g.fillRect(8, 11, 1, 1); g.fillRect(13, 10, 1, 1);
  },
  crop(g, it) {
    const col = cropColor(it.id);
    g.fillStyle = shade(col, -20);
    g.beginPath(); g.moveTo(12, 5); g.lineTo(19, 12); g.lineTo(12, 20); g.lineTo(5, 12); g.closePath(); g.fill();
    g.fillStyle = col;
    g.beginPath(); g.moveTo(12, 7); g.lineTo(17, 12); g.lineTo(12, 18); g.lineTo(7, 12); g.closePath(); g.fill();
    g.fillStyle = shade(col, 50); g.fillRect(10, 9, 2, 2);
    g.fillStyle = '#4AA84A'; g.fillRect(12, 3, 2, 3); g.fillRect(14, 4, 2, 1);
  },
  forage(g, it) { drawers.crop(g, it); },
  resource(g, it) {
    const cols = { wood: '#9A6B3F', stone: '#8D8D96', fiber: '#7EC850', sap: '#E8C469', coal: '#2E2E38', clay: '#B87A5A', hardwood: '#6E4A2A', hay: '#E8D8A8' };
    const col = cols[it.id] || '#9A8A6A';
    g.fillStyle = shade(col, -25); g.fillRect(5, 9, 14, 10);
    g.fillStyle = col; g.fillRect(5, 6, 14, 10);
    g.fillStyle = shade(col, 30); g.fillRect(7, 8, 4, 2);
  },
  fertilizer(g, it) {
    g.fillStyle = '#B89B6A'; g.fillRect(6, 7, 12, 13);
    g.fillStyle = '#8A6B3F'; g.fillRect(6, 7, 12, 3);
    g.fillStyle = it.fert?.startsWith('quality') ? '#8AE84A' : it.fert?.startsWith('retain') ? '#4AC8E8' : '#E8C469';
    g.fillRect(10, 12, 4, 4);
  },
  sprinkler(g, it) {
    const col = it.range === 1 ? '#B87333' : it.range === 2 ? '#C0C0C8' : '#7AE8E0';
    g.fillStyle = col; g.fillRect(10, 8, 4, 12);
    g.fillStyle = shade(col, 30); g.beginPath(); g.arc(12, 7, 4, 0, 7); g.fill();
    g.fillStyle = '#4AC8E8'; g.fillRect(4, 4, 2, 2); g.fillRect(18, 4, 2, 2); g.fillRect(11, 1, 2, 2);
  },
  scarecrow(g) {
    g.fillStyle = '#B89B5A'; g.fillRect(11, 8, 2, 13); g.fillRect(5, 11, 14, 2);
    g.fillStyle = '#E8C469'; g.beginPath(); g.arc(12, 6, 4, 0, 7); g.fill();
    g.fillStyle = '#8A5A2A'; g.beginPath(); g.moveTo(7, 4); g.lineTo(17, 4); g.lineTo(12, 0); g.closePath(); g.fill();
  },
  food(g, it) {
    g.fillStyle = '#F0F0F0'; g.beginPath(); g.arc(12, 13, 8, 0, 7); g.fill();
    g.fillStyle = '#C0C0C8'; g.beginPath(); g.arc(12, 13, 6, 0, 7); g.fill();
    g.fillStyle = '#E8A84A'; g.beginPath(); g.arc(12, 13, 4, 0, 7); g.fill();
    g.fillStyle = '#8AE84A'; g.fillRect(10, 10, 2, 2); g.fillRect(13, 12, 2, 2);
  },
  gift(g) {
    g.fillStyle = '#E84A6A'; g.fillRect(5, 9, 14, 11);
    g.fillStyle = '#FFD98A'; g.fillRect(11, 9, 2, 11); g.fillRect(5, 13, 14, 2);
    g.fillStyle = '#FFD98A'; g.beginPath(); g.arc(9, 7, 3, 0, 7); g.arc(15, 7, 3, 0, 7); g.fill();
  },
  misc(g) { g.fillStyle = '#B8B0C8'; g.fillRect(7, 6, 10, 12); g.fillStyle = '#8A82A0'; g.fillRect(9, 9, 6, 2); g.fillRect(9, 13, 6, 2); },
};

export function itemIcon(id, quality = 0) {
  const key = id + '_' + quality;
  if (cache.has(key)) return cache.get(key);
  const it = getItem(id);
  const [c, g] = base();
  const d = PER_ITEM[id] || drawers[it.type] || drawers.misc;
  d(g, it);
  if (quality > 0) { // 品质角标
    g.fillStyle = ['', '#C0C0C8', '#FFD98A', '#7AE8E0'][quality];
    g.beginPath(); g.moveTo(20, 16); g.lineTo(21.5, 19); g.lineTo(24, 19.5); g.lineTo(21.5, 20); g.lineTo(20, 23); g.lineTo(18.5, 20); g.lineTo(16, 19.5); g.lineTo(18.5, 19); g.closePath(); g.fill();
  }
  const url = finish(c);
  cache.set(key, url);
  return url;
}
