// 低语森林场景（48×40）：密林 + 湖泊（冬季结冰可走）+ 旅行商人大车（周五/日出摊）+ 蘑菇圈 + 可砍伐老树（预留）
// 湖泊 rect 对齐 data/festivals.js {x:22,z:14,w:14,h:16}；旅行商人出摊日对齐 data/shops.js traveler（仅周五、周日）。
import * as THREE from 'three';
import { rng, hashStr } from '../core/rng.js';
import { heldItem } from '../core/state.js';
import { PAL, mkCanvas, shade } from '../render/textures.js';
import { makeTree, makeLamp, makeRock, makeGrassTuft } from './proto.js';
import {
  disposeGroup, collectProps, stdPropUpdate, GRES,
  paintGrassBase, paintPathStroke, paintWaterEllipse, groundMesh, makeAnimatedWater, makeFlowerPatch,
} from './scenekit.js';

export const FOREST_W = 48, FOREST_H = 40;
const LAKE = { cx: 29, cz: 22, rx: 6.5, rz: 7.5 };
const OLD_TREES = [[6, 16], [16, 25], [26, 8], [40, 34]]; // 可砍伐老树（预留交互）

// 旅行商人大车（篷车 + 大车轮 + 灯笼）
function makeMerchantCart() {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: PAL.wood, flatShading: true });
  const woodD = new THREE.MeshLambertMaterial({ color: PAL.woodD, flatShading: true });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1.8), wood);
  bed.position.y = 0.85;
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 3.0, 8, 1, false, 0, Math.PI),
    new THREE.MeshLambertMaterial({ color: '#B84A4A', flatShading: true, side: THREE.DoubleSide })
  );
  canopy.rotation.z = Math.PI / 2; canopy.position.y = 1.35;
  g.add(bed, canopy);
  for (const [wx, wz] of [[-1.1, 0.95], [1.1, 0.95], [-1.1, -0.95], [1.1, -0.95]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 10), woodD);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(wx, 0.5, wz);
    g.add(wheel);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), wood);
    hub.position.set(wx, 0.5, wz * 1.06);
    g.add(hub);
  }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5), woodD);
  shaft.rotation.z = Math.PI / 2 - 0.25; shaft.position.set(2.1, 0.55, 0);
  g.add(shaft);
  const lampMat = new THREE.MeshLambertMaterial({ color: PAL.winLit, emissive: new THREE.Color(PAL.winLit), emissiveIntensity: 0 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), lampMat);
  lamp.position.set(-1.6, 1.6, 0);
  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.8, 5), woodD);
  lampPost.position.set(-1.6, 1.2, 0);
  g.add(lamp, lampPost);
  g.userData.lamp = { bulbMat: lampMat };
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// 小蘑菇
function makeMushroom(r, big = false) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 0.16, 5),
    new THREE.MeshLambertMaterial({ color: '#F0EAD8', flatShading: true })
  );
  stem.position.y = 0.08;
  const capCol = ['#C84A3A', '#B87333', '#8A5A6E'][Math.floor(r() * 3)];
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(big ? 0.16 : 0.11, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: capCol, flatShading: true })
  );
  cap.position.y = big ? 0.2 : 0.15;
  g.add(stem, cap);
  if (big) g.scale.setScalar(1.6);
  return g;
}

// 商人大车是否出摊（周五=4、周日=6，对齐 shops.js traveler.closedDays）
export function isTravelerHere(clock) { const wd = clock.weekDay; return wd === 4 || wd === 6; }

function onLake(x, z) {
  const dx = (x + 0.5 - LAKE.cx) / LAKE.rx, dz = (z + 0.5 - LAKE.cz) / LAKE.rz;
  return dx * dx + dz * dz < 1;
}

export function buildForestScene(game, season) {
  const group = new THREE.Group();
  group.name = 'scene-forest';
  let curSeason = season;
  let props = null;
  let cart = null;

  function drawGround(s) {
    const c = mkCanvas(FOREST_W * GRES, FOREST_H * GRES);
    const g = c.getContext('2d');
    const r = rng(hashStr('forest' + s));
    // 林地底色（比农场更深的草色）
    paintGrassBase(g, c.width, c.height, s, r, {
      base: shade(PAL.grass[s], -14), dark: shade(PAL.grassD[s], -10), flowers: true,
    });
    // 落叶斑块（林地地面质感）
    for (let i = 0; i < 260; i++) {
      g.fillStyle = r() < 0.5 ? shade(PAL.leaf[s], -20) : shade(PAL.trunk, 10);
      g.globalAlpha = 0.12 + r() * 0.12;
      g.fillRect(Math.floor(r() * c.width), Math.floor(r() * c.height), 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
    }
    g.globalAlpha = 1;
    // 路径：西→湖北→东（绕湖北岸）
    paintPathStroke(g, 0, 20, 21, 20, 1.8);
    paintPathStroke(g, 21, 20, 21, 13, 1.8);
    paintPathStroke(g, 21, 13, 45, 13, 1.8);
    paintPathStroke(g, 45, 13, 45, 20, 1.8);
    paintPathStroke(g, 45, 20, FOREST_W, 20, 1.8);
    // 通往商人营地的小径
    paintPathStroke(g, 8, 20, 8, 10, 1.4);
    // 湖泊（冬季画冰面）
    if (s === 3) {
      g.fillStyle = shade(PAL.waterD[3], 6);
      g.beginPath(); g.ellipse(LAKE.cx * GRES, LAKE.cz * GRES, LAKE.rx * GRES + 4, LAKE.rz * GRES + 4, 0, 0, 7); g.fill();
      g.fillStyle = '#DCEAF4';
      g.beginPath(); g.ellipse(LAKE.cx * GRES, LAKE.cz * GRES, LAKE.rx * GRES, LAKE.rz * GRES, 0, 0, 7); g.fill();
      for (let i = 0; i < 26; i++) { // 冰面裂纹
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.fillRect(LAKE.cx * GRES - LAKE.rx * GRES + r() * LAKE.rx * 2 * GRES, LAKE.cz * GRES - LAKE.rz * GRES + r() * LAKE.rz * 2 * GRES, 4 + r() * 10, 1);
      }
    } else {
      paintWaterEllipse(g, LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz, s, r);
    }
    return groundMesh(FOREST_W, FOREST_H, c);
  }

  function isClear(x, z) {
    // 路径/湖/空地不种树
    if (onLake(x, z)) return false;
    const dLake = Math.hypot((x - LAKE.cx) / (LAKE.rx + 1.5), (z - LAKE.cz) / (LAKE.rz + 1.5));
    if (dLake < 1) return false;
    if (z >= 18.4 && z <= 21.6 && x <= 21.6) return false;
    if (x >= 19.4 && x <= 22.6 && z >= 11.4 && z <= 21.6) return false;
    if (z >= 11.4 && z <= 14.6 && x >= 19.4) return false;
    if (x >= 43.4 && x <= 46.6 && z >= 11.4 && z <= 21.6) return false;
    if (z >= 18.4 && z <= 21.6 && x >= 43.4) return false;
    if (Math.hypot(x - 10, z - 8) < 4.5) return false;  // 商人营地
    if (Math.hypot(x - 38, z - 30) < 4) return false;   // 蘑菇圈空地
    if (Math.hypot(x - 8, z - 15) < 2) return false;    // 营地小径
    for (const [ox, oz] of OLD_TREES) if (Math.hypot(x - ox, z - oz) < 2.2) return false;
    return true;
  }

  function buildVisuals(s) {
    // 地面：由 world/unified.js 一体化底图统一提供（不再分块拼接）
    // 湖面动态波光（非冬季）
    if (s !== 3) {
      const w = makeAnimatedWater(LAKE.rx * 1.7, LAKE.rz * 1.7, s, { glintOpacity: 0.25 });
      w.position.set(LAKE.cx, 0.02, LAKE.cz);
      group.add(w);
    }
    // 密林（种子固定；避让路径/湖/空地）
    const r = rng(hashStr('foresttrees' + s));
    let placed = 0, guard = 0;
    while (placed < 85 && guard++ < 900) {
      const x = 1 + r() * (FOREST_W - 2), z = 1 + r() * (FOREST_H - 2);
      if (!isClear(x, z)) continue;
      const t = makeTree(s, 0.9 + r() * 0.9);
      t.position.set(x, 0, z);
      group.add(t);
      placed++;
    }
    // 可砍伐老树（更粗壮 + 树桩旁苔石）
    for (const [ox, oz] of OLD_TREES) {
      const t = makeTree(s, 1.55);
      t.position.set(ox + 0.5, 0, oz + 0.5);
      group.add(t);
      const rock = makeRock(0.5);
      rock.material.color.set(shade(PAL.stone, 18));
      rock.position.set(ox + 1.2, 0.06, oz + 0.1);
      group.add(rock);
    }
    // 旅行商人大车（营地：篷车 + 铺位毯 + 杂物箱）
    cart = makeMerchantCart();
    cart.position.set(10, 0, 8); cart.rotation.y = -0.5;
    group.add(cart);
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.8),
      new THREE.MeshLambertMaterial({ color: '#7A4A6E', flatShading: true })
    );
    rug.rotation.x = -Math.PI / 2; rug.position.set(12, 0.02, 9.5);
    group.add(rug);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial({ color: PAL.woodD, flatShading: true }));
    crate.position.set(11.8, 0.35, 7.2); crate.castShadow = true;
    group.add(crate);
    cart.userData.campExtras = [rug, crate];
    // 蘑菇圈（空地上一圈小蘑菇 + 中心大蘑菇）
    const mr = rng(hashStr('shroomring'));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const m = makeMushroom(mr);
      m.position.set(38 + Math.cos(a) * 1.7, 0, 30 + Math.sin(a) * 1.7);
      group.add(m);
    }
    const big = makeMushroom(mr, true);
    big.position.set(38, 0, 30);
    group.add(big);
    // 路灯（林中小径口）
    for (const [lx, lz] of [[2, 21.5], [21.5, 14.5], [44, 21.5]]) {
      const l = makeLamp(); l.position.set(lx, 0, lz); group.add(l);
    }
    // 花草
    for (let i = 0; i < 46; i++) {
      const x = 1 + r() * (FOREST_W - 2), z = 1 + r() * (FOREST_H - 2);
      if (!isClear(x, z)) continue;
      const tu = r() < 0.6 ? makeGrassTuft(s) : makeFlowerPatch(s);
      tu.position.set(x, 0, z);
      group.add(tu);
    }
    props = collectProps(group);
  }

  const scene = {
    id: 'forest', name: '低语森林', W: FOREST_W, H: FOREST_H, group,
    defaultSpawn: [4, 20],
    groundType(x, z) {
      if (x < 0 || z < 0 || x >= FOREST_W || z >= FOREST_H) return 'blocked';
      if (onLake(x, z)) return curSeason === 3 ? 'snow' : 'water'; // 冬季冰面可走
      if ((z === 19 || z === 20) && x <= 20) return 'path';
      if ((x === 20 || x === 21) && z >= 12 && z <= 20) return 'path';
      if ((z === 12 || z === 13) && x >= 20) return 'path';
      if ((x === 44 || x === 45) && z >= 12 && z <= 20) return 'path';
      if ((z === 19 || z === 20) && x >= 44) return 'path';
      return curSeason === 3 ? 'snow' : 'grass';
    },
    interactables: [
      {
        x: 10.5, z: 9, r: 2.4, label: 'E 旅行商人',
        when: (g) => isTravelerHere(g.clock),
        action: () => {
          game.audio.sfx('open');
          game.ui.tutorial('蒙面商人笑眯眯地拍拍货箱：「都是远方来的稀罕物——周五和周日我都在这儿摆摊。」', 6000);
        },
      },
      ...OLD_TREES.map(([ox, oz]) => ({
        x: ox + 0.5, z: oz + 1.2, r: 1.5, label: 'E 砍伐老树',
        action: () => {
          const held = heldItem(game.state);
          if (held && held.id === 'axe') {
            game.audio.sfx('chop');
            game.effects.floatText(new THREE.Vector3(ox + 0.5, 1.6, oz + 0.5), '这棵树太粗壮，你还砍不动（需要更高的伐木技巧）', '#E8C469', 12);
          } else {
            game.audio.sfx('error');
            game.ui.tutorial('需要斧头才能砍倒这棵老树。', 4000);
          }
        },
      })),
      {
        x: 38, z: 30, r: 2.2, label: 'E 蘑菇圈',
        action: () => {
          game.audio.sfx('plant');
          game.ui.tutorial('一圈小蘑菇围着朵大蘑菇。雨后的清晨，这里会冒出更多小蘑菇。', 5000);
        },
      },
    ],
    exits: [
      { x: 0, z: 19, w: 2, h: 2, to: 'farm', spawn: [45, 23] },      // 西 → 农场
      { x: 46, z: 19, w: 2, h: 2, to: 'town', spawn: [3, 27] },      // 东 → 汐溪镇
    ],
    update(dt, t) {
      if (!props) return;
      stdPropUpdate(props, dt, t, game);
      // 旅行商人周五/日出摊（对齐 shops.js traveler），其余时间营地收起
      const here = isTravelerHere(game.clock);
      if (cart.visible !== here) {
        cart.visible = here;
        for (const ex of cart.userData.campExtras || []) ex.visible = here;
      }
    },
    setSeason(s) { curSeason = s; disposeGroup(group); buildVisuals(s); },
  };
  buildVisuals(season);
  return scene;
}
