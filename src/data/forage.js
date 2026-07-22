// 觅食物数据表：品类与价位对标 docs/research/sdv-systems.md §7.1（黄水仙/蒲公英/野山葵/韭葱/葡萄/香豌豆/蘑菇/冬青/雪山药等真实植物通称名）。
// 按季分表（spring/summer/autumn/winter 对应季节 0–3）；zone 为可出现区域（可多区）：forest/beach/town/farm/mountain；
// quality: true 表示该觅食物适用品质倍率（银/金/铱星，对标 §7.1 品质判定）。
import { registerItem } from './items.js';

export const FORAGE = {
  spring: [
    { id: 'daffodil',         name: '黄水仙', price: 30, energy: 5,  zone: ['forest', 'town'],           quality: true },
    { id: 'dandelion',        name: '蒲公英', price: 40, energy: 25, zone: ['forest', 'farm', 'town'],   quality: true },
    { id: 'wild_horseradish', name: '野山葵', price: 50, energy: 13, zone: ['mountain', 'forest'],       quality: true },
    { id: 'leek',             name: '韭葱',   price: 60, energy: 40, zone: ['forest', 'mountain'],       quality: true },
    { id: 'spring_onion',     name: '野葱',   price: 8,  energy: 13, zone: ['forest'],                   quality: true },
  ],
  summer: [
    { id: 'wild_grape',  name: '野葡萄', price: 80,  energy: 38, zone: ['mountain', 'forest'], quality: true },
    { id: 'sweet_pea',   name: '香豌豆', price: 50,  energy: 10, zone: ['forest', 'farm'],     quality: true },
    { id: 'spice_berry', name: '刺莓',   price: 80,  energy: 25, zone: ['forest', 'farm'],     quality: true },
    { id: 'fiddlehead',  name: '蕨菜',   price: 90,  energy: 25, zone: ['forest'],             quality: true },
    { id: 'sea_urchin',  name: '海胆',   price: 160, energy: 30, zone: ['beach'],              quality: true },
  ],
  autumn: [
    { id: 'pine_mushroom', name: '松林菇', price: 40,  energy: 38, zone: ['forest', 'mountain'], quality: true },
    { id: 'wild_plum',     name: '野梅',   price: 80,  energy: 25, zone: ['forest', 'farm'],     quality: true },
    { id: 'hazelnut',      name: '榛子',   price: 90,  energy: 30, zone: ['forest', 'mountain'], quality: true },
    { id: 'blackberry',    name: '黑莓',   price: 20,  energy: 25, zone: ['mountain', 'town'],   quality: true },
    { id: 'chanterelle',   name: '鸡油菌', price: 160, energy: 25, zone: ['forest'],             quality: true },
  ],
  winter: [
    { id: 'crocus',      name: '番红花', price: 60,  energy: 8,  zone: ['forest', 'town'], quality: true },
    { id: 'frost_fruit', name: '霜晶果', price: 150, energy: 63, zone: ['mountain'],       quality: true },
    { id: 'snow_yam',    name: '雪山药', price: 100, energy: 30, zone: ['farm', 'town'],   quality: true },
    { id: 'snow_root',   name: '雪根',   price: 70,  energy: 25, zone: ['farm', 'forest'], quality: true },
    { id: 'holly',       name: '冬青',   price: 80,  energy: 5,  zone: ['forest', 'town'], quality: true },
  ],
};

// 树液采集器产物（对标调研 §7.2：枫糖浆 9 天 / 橡树脂 7 天 / 松焦油 5 天，冬季照常产出）
export const TAP_PRODUCTS = [
  { id: 'maple_syrup', name: '枫糖浆', days: 9, price: 200 },
  { id: 'oak_resin',   name: '橡树脂', days: 7, price: 150 },
  { id: 'pine_tar',    name: '松焦油', days: 5, price: 100 },
];

for (const list of Object.values(FORAGE)) {
  for (const f of list) {
    registerItem(f.id, f.name, 'forage', f.price, { edible: true, energy: f.energy });
  }
}
for (const t of TAP_PRODUCTS) {
  registerItem(t.id, t.name, 'resource', t.price);
}
