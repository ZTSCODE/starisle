// 汐溪镇场景（56×48）：中央广场 12×12 + 5 商店 + 民宅×4 + 社区中心 + 河流石桥×2 + 路灯×10 + 公告板
// 布局坐标对齐 data/festivals.js 广场 rect{x:22,z:18,w:12,h:12} 与 data/npcs.js 日程点位（如酒吧 [44,32]）。
// 商店营业时间取自 data/shops.js（真实数据，无死按钮：营业中=店主不在柜台，打烊=报营业时间）。
import * as THREE from 'three';
import { rng, hashStr } from '../core/rng.js';
import { SEASON_CN } from '../core/time.js';
import { PAL, mkCanvas, shade } from '../render/textures.js';
import { makeTree, makeLamp, makeGrassTuft } from './proto.js';
import {
  disposeGroup, collectProps, stdPropUpdate, GRES,
  paintGrassBase, paintPathStroke, paintPathRect, paintStoneFloor, paintWaterRect,
  groundMesh, makeAnimatedWater, makeBuilding, makeSignBoard, makeStoneBridge,
  makeNoticeBoard, makeBench, makeFlowerBed, makeFlowerPatch,
} from './scenekit.js';
import { SHOPS } from '../data/shops.js';
import { FESTIVALS } from '../data/festivals.js';
import { NPCS } from '../data/npcs.js';

export const TOWN_W = 56, TOWN_H = 48;
const WEATHER_CN = { sunny: '晴', cloudy: '多云', wind: '大风', rain: '雨', storm: '暴雨', snow: '雪' };

// 建筑 footprint（blocked 用），门点位（交互用）
const BUILDINGS = [
  { id: 'pierre',     shop: 'pierre',     x: 18, z: 10, w: 6, d: 6, face: 1,  sign: '杂货', roof: '#B8543E' },
  { id: 'blacksmith', shop: 'blacksmith', x: 31, z: 10, w: 6, d: 6, face: 1,  sign: '铁匠', roof: '#5A5A66' },
  { id: 'ranch',      shop: 'ranch',      x: 6,  z: 30, w: 7, d: 7, face: -1, sign: '牧场', roof: '#8A5A2A' },
  { id: 'saloon',     shop: 'saloon',     x: 41, z: 29, w: 6, d: 7, face: -1, sign: '酒吧', roof: '#7A4A6E' },
  { id: 'fishshop',   shop: 'fishshop',   x: 52, z: 3,  w: 4, d: 7, face: 1,  sign: '渔具', roof: '#3E8E96' },
  { id: 'house1', x: 6,  z: 18, w: 6, d: 6, face: 1,  roof: PAL.roof,  home: '莫阿姨家' },
  { id: 'house2', x: 14, z: 30, w: 6, d: 7, face: -1, roof: '#C86E3A', home: '老船长的家' },
  { id: 'house3', x: 22, z: 30, w: 6, d: 7, face: -1, roof: '#4A7AB8', home: '教书先生的家' },
  { id: 'house4', x: 14, z: 6,  w: 6, d: 6, face: 1,  roof: '#4AA86E', home: '花匠小屋' },
  { id: 'community', x: 37, z: 2, w: 8, d: 8, face: 1, sign: '旧会馆', ruined: true },
];
const RIVER_X = [47, 49];        // 河面 tile 范围（x 47..49）
const BRIDGES = [6, 26];         // 两座石桥的 z（各 2 格宽：z, z+1）

function inRect(x, z, b) { return x >= b.x && x < b.x + b.w && z >= b.z && z < b.z + b.d; }

export function buildTownScene(game, season) {
  const group = new THREE.Group();
  group.name = 'scene-town';
  let curSeason = season;
  let props = null;

  function drawGround(s) {
    const c = mkCanvas(TOWN_W * GRES, TOWN_H * GRES);
    const g = c.getContext('2d');
    const r = rng(hashStr('town' + s));
    paintGrassBase(g, c.width, c.height, s, r, { flowers: true });
    // 主街（东西）+ 北街（南北）
    paintPathRect(g, 0, 26, TOWN_W, 2, r);
    paintPathRect(g, 26, 0, 2, 18, r);
    // 中央广场（石板）
    paintStoneFloor(g, 22, 18, 12, 12, r);
    // 渔具店门前小径（接桥 2 上岸点）
    paintPathStroke(g, 51, 7, 52.5, 7, 1.4);
    paintPathStroke(g, 52.5, 7, 52.5, 10.5, 1.4);
    // 河流（两座桥面位置留空不画水）
    paintWaterRect(g, RIVER_X[0], 0, 3, BRIDGES[0], s, r);
    paintWaterRect(g, RIVER_X[0], BRIDGES[0] + 2, 3, BRIDGES[1] - BRIDGES[0] - 2, s, r);
    paintWaterRect(g, RIVER_X[0], BRIDGES[1] + 2, 3, TOWN_H - BRIDGES[1] - 2, s, r);
    return groundMesh(TOWN_W, TOWN_H, c);
  }

  function buildVisuals(s) {
    // 地面：由 world/unified.js 一体化底图统一提供（不再分块拼接）
    // 河面动态波光（三段避开桥面）
    for (const [z0, z1] of [[0, BRIDGES[0]], [BRIDGES[0] + 2, BRIDGES[1]], [BRIDGES[1] + 2, TOWN_H]]) {
      const w = makeAnimatedWater(4.6, z1 - z0, s, { glintOpacity: 0.22 });
      w.position.set(RIVER_X[0] + 1.5, 0.02, (z0 + z1) / 2);
      group.add(w);
    }
    // 石桥 ×2
    for (const bz of BRIDGES) {
      const b = makeStoneBridge(6.4, 2.9);
      b.position.set(RIVER_X[0] + 1.5, 0, bz + 1);
      group.add(b);
    }
    // 建筑 + 门牌
    for (const b of BUILDINGS) {
      const house = makeBuilding({
        w: b.w, d: b.d, face: b.face, roof: b.roof || PAL.roof,
        ruined: !!b.ruined, windows: b.w >= 7 ? 3 : 2, chimney: !b.ruined,
      });
      house.position.set(b.x + b.w / 2, 0, b.z + b.d / 2);
      group.add(house);
      if (b.sign) {
        const sign = makeSignBoard(b.sign, { faceRotY: b.face === 1 ? 0 : Math.PI });
        sign.position.set(b.x + b.w / 2 + 1.6, 0, b.face === 1 ? b.z + b.d + 0.6 : b.z - 0.6);
        group.add(sign);
      }
    }
    // 公告板（广场西北）
    const nb = makeNoticeBoard();
    nb.position.set(24.5, 0, 20.5); nb.rotation.y = Math.PI / 4;
    group.add(nb);
    // 广场花坛 + 长椅
    for (const [fx, fz] of [[22.8, 27.5], [32.6, 27.5]]) {
      const bed = makeFlowerBed(s); bed.position.set(fx, 0, fz); group.add(bed);
    }
    for (const [bx, bz, ry] of [[25.5, 25.5, 0], [30, 25.5, 0]]) {
      const bench = makeBench(); bench.position.set(bx, 0, bz); bench.rotation.y = ry; group.add(bench);
    }
    // 路灯 ×10
    for (const [lx, lz] of [[25.2, 4], [28.8, 14], [22, 16.5], [33.8, 16.5], [21.8, 29.8],
      [34, 29.8], [8, 25.2], [38, 25.2], [45.8, 25.2], [51.5, 8.8]]) {
      const l = makeLamp(); l.position.set(lx, 0, lz); group.add(l);
    }
    // 树木花草点缀（避开建筑/路/河/广场）
    const r = rng(hashStr('towntrees'));
    for (const [tx, tz] of [[2, 2], [12, 3], [34, 4], [2, 12], [3, 44], [12, 44], [20, 44],
      [30, 44], [40, 44], [54, 13], [54, 21], [54, 44], [46, 44], [2, 36]]) {
      const t = makeTree(s, 0.8 + r() * 0.5);
      t.position.set(tx + r() * 0.8, 0, tz + r() * 0.8);
      group.add(t);
    }
    for (let i = 0; i < 40; i++) {
      const tu = r() < 0.5 ? makeGrassTuft(s) : makeFlowerPatch(s);
      tu.position.set(1 + r() * 53, 0, 1 + r() * 45);
      group.add(tu);
    }
    props = collectProps(group);
  }

  const shopBy = (id) => SHOPS.find((s) => s.id === id);
  function shopInteractable(b, dx, dz) {
    const shop = shopBy(b.shop);
    return {
      x: b.x + b.w / 2 + (dx || 0), z: (b.face === 1 ? b.z + b.d : b.z) + (dz || 0) + (b.face === 1 ? 0.5 : -0.5),
      r: 1.5, label: `E ${shop.name}`,
      action: () => {
        const c = game.clock;
        const closedDay = shop.closedDays.includes(c.weekDay);
        const [o, cl] = shop.open;
        const open = !closedDay && c.minute >= o && c.minute < cl;
        if (open) {
          if (!game.shopPanel.show(shop.id)) {
            game.ui.tutorial(`「${shop.name}」营业中 · 营业时间 ${c.fmt(o)}–${c.fmt(cl)}`, 4000);
          }
        } else {
          game.audio.sfx('error');
          game.ui.tutorial(`「${shop.name}」${closedDay ? '今天店休' : '现在打烊'} · 营业时间 ${c.fmt(o)}–${c.fmt(cl)}`, 6000);
        }
      },
    };
  }

  const scene = {
    id: 'town', name: '汐溪镇', W: TOWN_W, H: TOWN_H, group,
    defaultSpawn: [27, 24],
    groundType(x, z) {
      if (x < 0 || z < 0 || x >= TOWN_W || z >= TOWN_H) return 'blocked';
      // 河流（桥面通行）
      if (x >= RIVER_X[0] && x <= RIVER_X[1]) {
        const onBridge = BRIDGES.some((bz) => z === bz || z === bz + 1);
        return onBridge ? 'path' : 'water';
      }
      if (x === 51 && z >= 5 && z <= 8) return 'path';      // 渔具店引路
      if (z >= 26 && z <= 27) return 'path';                 // 主街
      if (x >= 26 && x <= 27 && z <= 18) return 'path';      // 北街
      if (x >= 22 && x <= 33 && z >= 18 && z <= 29) return 'path'; // 广场石板
      for (const b of BUILDINGS) if (inRect(x, z, b)) return 'blocked';
      return curSeason === 3 ? 'snow' : 'grass';
    },
    interactables: [
      ...BUILDINGS.filter((b) => b.shop).map((b) => shopInteractable(b)),
      ...BUILDINGS.filter((b) => b.home).map((b) => ({
        x: b.x + b.w / 2, z: (b.face === 1 ? b.z + b.d : b.z) + (b.face === 1 ? 0.5 : -0.5),
        r: 1.4, label: `E ${b.home}`,
        action: () => {
          game.audio.sfx('close');
          game.ui.tutorial(`「${b.home}」门锁着，窗帘后透出暖暖的灯光。`, 4000);
        },
      })),
      {
        x: 40.5, z: 10.5, r: 1.8, label: 'E 社区旧会馆',
        action: () => {
          game.audio.sfx('open');
          game.bundleUI.show();
        },
      },
      {
        x: 24.5, z: 21.5, r: 1.6, label: 'E 查看公告板',
        action: () => {
          const c = game.clock;
          const abs = (s, d) => s * 28 + d;
          const now = abs(c.season, c.day);
          const lines = [`今日 ${c.dateStr()}`];
          const nextF = FESTIVALS.map((f) => ({ f, d: abs(f.season, f.day) }))
            .filter((x) => x.d >= now).sort((a, b) => a.d - b.d)[0];
          if (nextF) lines.push(`节日预告：${nextF.f.name}（${SEASON_CN[nextF.f.season]}季${nextF.f.day}日）`);
          const bd = NPCS.filter((n) => n.birthday)
            .map((n) => ({ n, d: abs(n.birthday.season, n.birthday.day) }))
            .filter((x) => x.d >= now && x.d <= now + 14).sort((a, b) => a.d - b.d)[0];
          if (bd) lines.push(`近期生日：${bd.n.name}（${SEASON_CN[bd.n.birthday.season]}季${bd.n.birthday.day}日）`);
          lines.push(`明日天气：${WEATHER_CN[game.state.weather.tomorrow] || '未知'}`);
          const delivered = game.quests.deliverItems();
          if (delivered > 0) lines.push(`√ 交付了 ${delivered} 项委托物资！`);
          else lines.push('（公告板委托在任务日志查看，凑齐物资后到这里交付）');
          game.audio.sfx('open');
          game.ui.tutorial(lines.join('<br>'), 9000);
        },
      },
    ],
    exits: [
      { x: 26, z: 0, w: 2, h: 2, to: 'farm', spawn: [24, 44] },      // 北 → 农场
      { x: 0, z: 26, w: 2, h: 2, to: 'forest', spawn: [45, 20] },    // 西 → 森林
      { x: 54, z: 26, w: 2, h: 2, to: 'beach', spawn: [2, 15] },     // 东 → 海滩
    ],
    update(dt, t) { if (props) stdPropUpdate(props, dt, t, game); },
    setSeason(s) { curSeason = s; disposeGroup(group); buildVisuals(s); },
  };
  buildVisuals(season);
  return scene;
}
