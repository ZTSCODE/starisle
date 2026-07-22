// 农场场景（48×48）：proto 农场场景化改造。
// groundType 逻辑与 systems/farming.js 的 farmGroundType 完全一致（tiles/水域/建筑保持一致），
// 冬季草地在碰撞/脚步口径返回 'snow'（不影响 farming 内部判定——farming 用自己的 farmGroundType）。
import * as THREE from 'three';
import { rng, hashStr } from '../core/rng.js';
import { heldItem } from '../core/state.js';
import { PAL, mkCanvas, makeTexture, shade } from '../render/textures.js';
import { makeGround, makeTree, makeHouse, makeLamp, makeFence, makeGrassTuft, makeRock } from './proto.js';
import { disposeGroup, collectProps, stdPropUpdate, GRES } from './scenekit.js';

export const FARM_W = 48, FARM_H = 48;

// 东侧土路（视觉贴花，x24→47 与 proto 横向小径相接；冬季被雪覆盖隐藏）
function makeEastTrail() {
  const w = 23, h = 2;
  const c = mkCanvas(w * GRES, h * GRES);
  const g = c.getContext('2d');
  const r = rng(hashStr('easttrail'));
  g.fillStyle = PAL.path; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = shade(PAL.path, -14); g.fillRect(0, 2, c.width, c.height - 4);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = shade(PAL.path, r() < 0.5 ? -22 : 12);
    g.fillRect(Math.floor(r() * c.width), Math.floor(r() * c.height), 2, 2);
  }
  const t = makeTexture(c.width, c.height, (gg) => gg.drawImage(c, 0, 0));
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(24 + w / 2, 0.008, 23.5);
  m.receiveShadow = true;
  return m;
}

// 出货箱（木箱 + 斜盖 + 投货口）
function makeShippingBin() {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: PAL.wood, flatShading: true });
  const woodD = new THREE.MeshLambertMaterial({ color: PAL.woodD, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1), wood);
  body.position.y = 0.45;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 1.1), woodD);
  lid.position.y = 0.96; lid.rotation.z = -0.06;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.06), new THREE.MeshLambertMaterial({ color: '#2A1E12', flatShading: true }));
  slot.position.set(0, 0.72, 0.51);
  const label = makeTexture(32, 32, (gg) => {
    gg.fillStyle = '#E8C469'; gg.fillRect(4, 6, 24, 20);
    gg.fillStyle = '#8A5A2A'; gg.fillRect(8, 12, 16, 3); gg.fillRect(13, 8, 6, 14);
  });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshLambertMaterial({ map: label, transparent: true, alphaTest: 0.4 }));
  tag.position.set(0, 0.4, 0.52);
  g.add(body, lid, slot, tag);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function buildFarmScene(game, season) {
  const group = new THREE.Group();
  group.name = 'scene-farm';
  let curSeason = season;
  let props = null;
  let trail = null;

  function buildVisuals(s) {
    // 与 proto buildProtoFarm 同种子布局，保证老存档记忆中的一致观感
    const r = rng(hashStr('protofarm2'));
    // 地面：由 world/unified.js 一体化底图统一提供（不再分块拼接）
    trail = makeEastTrail();
    trail.visible = s !== 3;
    group.add(trail);
    const spots = [];
    for (let i = 0; i < 12; i++) spots.push([4 + r() * 12, 4 + r() * 13]);
    for (let i = 0; i < 7; i++) spots.push([37 + r() * 8, 5 + r() * 18]);
    for (const [tx, tz] of spots) {
      const t = makeTree(s, 0.85 + r() * 0.6);
      t.position.set(tx, 0, tz);
      group.add(t);
    }
    for (let i = 0; i < 60; i++) {
      const tu = makeGrassTuft(s);
      tu.position.set(3 + r() * 42, 0, 3 + r() * 34);
      group.add(tu);
    }
    for (let i = 0; i < 8; i++) {
      const rock = makeRock(0.6 + r() * 0.9);
      rock.position.set(5 + r() * 38, 0.1, 5 + r() * 38);
      group.add(rock);
    }
    const house = makeHouse();
    house.position.set(21, 0, 8);
    group.add(house);
    // 栅栏在南侧小径处留 2 格门（x23-24），其余与 proto 一致
    const fence1 = makeFence(17, true); fence1.position.set(6, 0, 39);
    const fence1b = makeFence(1, true); fence1b.position.set(25, 0, 39);
    const fence2 = makeFence(8, false); fence2.position.set(5, 0, 40);
    group.add(fence1, fence1b, fence2);
    for (const [lx, lz] of [[23.5, 20], [23.5, 30], [10, 23.5]]) {
      const l = makeLamp(); l.position.set(lx, 0, lz);
      group.add(l);
    }
    const bin = makeShippingBin();
    bin.position.set(28, 0, 13.2);
    group.add(bin);
    props = collectProps(group);
  }

  const scene = {
    id: 'farm', name: '晨风农场', W: FARM_W, H: FARM_H, group,
    defaultSpawn: [24, 26],
    // 逻辑地形：与 farming.farmGroundType 逐行一致（冬季草地→snow 供脚步/氛围）
    groundType(x, z) {
      if (x < 0 || z < 0 || x >= FARM_W || z >= FARM_H) return 'blocked';
      if (x === 23 || x === 24) return 'path';
      if (z === 23 && x >= 8 && x <= 24) return 'path';
      const dx = (x + 0.5 - 33) / 4.4, dz = (z + 0.5 - 32) / 3.6;
      if (dx * dx + dz * dz < 1) return 'water';
      if (x >= 18 && x <= 24 && z >= 5 && z <= 10) return 'blocked'; // 农舍（与模型体积一致）
      if (z >= 39 && (x === 5 || x === 26)) return 'blocked';        // 栅栏角
      return curSeason === 3 ? 'snow' : 'grass';
    },
    interactables: [
      {
        x: 21, z: 12, r: 1.8, label: 'E 进入农舍 / 睡觉',
        action: async () => { await game.daycycle.sleep(); },
      },
      {
        x: 28, z: 12.5, r: 1.5, label: 'E 出货箱（投入手持物品）',
        action: () => {
          const held = heldItem(game.state);
          if (!held) { game.ui.tutorial('手持要出售的物品再按 E（整组出售）'); return; }
          const ok = game.daycycle.depositShipping(game.state, game.state.player.toolbarSel, true);
          if (ok) {
            game.audio.sfx('coin');
            game.ui.refreshToolbar();
            game.effects.floatText(new THREE.Vector3(28, 1.2, 14), '已出货（睡前结算）', '#FFD98A', 13);
          } else {
            game.audio.sfx('error');
            game.ui.tutorial('这个不能出售');
          }
        },
      },
    ],
    exits: [
      { x: 23, z: 46, w: 2, h: 2, to: 'town', spawn: [27, 3] },      // 南 → 汐溪镇
      { x: 46, z: 22, w: 2, h: 3, to: 'forest', spawn: [2, 20] },    // 东 → 低语森林
      { x: 23, z: 0, w: 2, h: 2, to: 'mountain', spawn: [20, 29] },  // 北 → 星峰山路
    ],
    update(dt, t) { if (props) stdPropUpdate(props, dt, t, game); },
    setSeason(s) { curSeason = s; disposeGroup(group); buildVisuals(s); },
  };
  buildVisuals(season);
  return scene;
}
