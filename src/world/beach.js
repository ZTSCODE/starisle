// 海滩场景（40×32）：沙滩 + 大海（动态波光：uv 滚动 + 加法高光层 + 岸线泡沫）+ 码头（旅行商人船位）+ 礁石 + 贝壳
// 布局对齐 data/npcs.js 日程点位：礁石区 [10,26]、潮汐池 [14,28]、渔家 [8,14]、码头 [32,20]；
// 以及 data/festivals.js「海在东侧，灯位沿岸线」约定。
import * as THREE from 'three';
import { rng, hashStr } from '../core/rng.js';
import { PAL, mkCanvas, makeTexture, shade } from '../render/textures.js';
import { makeTree, makeLamp, makeRock, makeGrassTuft } from './proto.js';
import {
  disposeGroup, collectProps, stdPropUpdate, GRES,
  paintGrassBase, paintSandRect, paintWaterRect, groundMesh, makeAnimatedWater,
  makeBuilding, makePier, makeFlowerPatch,
} from './scenekit.js';

export const BEACH_W = 40, BEACH_H = 32;
const SEA_X = 29;                 // 海水起始 x
const REEF_BLOCKS = [[9, 25], [10, 25], [11, 26], [9, 26], [10, 27], [11, 27]]; // 礁石阻挡格
const HUT = { x: 6, z: 11, w: 6, d: 6 };

// 小木船（码头旁，老渔夫的船）
function makeBoat() {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshLambertMaterial({ color: '#7A5230', flatShading: true });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.35, 2.6, 6, 1), hullMat);
  hull.rotation.z = Math.PI / 2; hull.scale.z = 0.55; hull.position.y = 0.3;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.55, 0.35, 6, 1), new THREE.MeshLambertMaterial({ color: PAL.wood, flatShading: true }));
  rim.rotation.z = Math.PI / 2; rim.scale.z = 0.55; rim.position.y = 0.55;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.8, 5), hullMat);
  mast.position.y = 1.4;
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.1),
    new THREE.MeshLambertMaterial({ color: '#F0EAD8', side: THREE.DoubleSide })
  );
  sail.position.set(0.05, 1.5, 0.35); sail.rotation.y = 0.2;
  g.add(hull, rim, mast, sail);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.sway = { canopy: g, phase: Math.random() * 6 }; // 借树摇通道做轻微浮动
  return g;
}

// 贝壳（低模小螺/扇贝壳，纯点缀不阻挡）
function makeShell(r) {
  const kind = r() < 0.5;
  const col = ['#F0E0D0', '#E8C8D8', '#F4E8C4'][Math.floor(r() * 3)];
  const m = kind
    ? new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 6), new THREE.MeshLambertMaterial({ color: col, flatShading: true }))
    : new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4, 0, Math.PI), new THREE.MeshLambertMaterial({ color: col, flatShading: true }));
  m.position.y = 0.05; m.rotation.set(r() * 0.6, r() * 6.28, kind ? 0.9 : 0);
  return m;
}

// 岸线泡沫带（独立滚动层）
function makeFoamStrip() {
  const tex = makeTexture(16, 128, (g) => {
    const r = rng(hashStr('foam'));
    g.clearRect(0, 0, 16, 128);
    for (let i = 0; i < 46; i++) {
      g.fillStyle = `rgba(255,255,255,${0.5 + r() * 0.4})`;
      g.fillRect(2 + Math.floor(r() * 10), Math.floor(r() * 126), 2 + Math.floor(r() * 5), 1 + Math.floor(r() * 2));
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.repeat.set(1, 6);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, BEACH_H),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  const holder = new THREE.Group();
  holder.add(m);
  holder.userData.water = {
    update(dt, t) {
      tex.offset.y = (t * 0.05) % 1;
      m.material.opacity = 0.34 + 0.2 * Math.sin(t * 1.1);
      m.position.x = Math.sin(t * 0.55) * 0.35; // 潮水进退
    },
  };
  return holder;
}

export function buildBeachScene(game, season) {
  const group = new THREE.Group();
  group.name = 'scene-beach';
  let curSeason = season;
  let props = null;

  function drawGround(s) {
    const c = mkCanvas(BEACH_W * GRES, BEACH_H * GRES);
    const g = c.getContext('2d');
    const r = rng(hashStr('beach' + s));
    paintGrassBase(g, c.width, c.height, s, r, { flowers: true });
    paintSandRect(g, 7, 0, BEACH_W - 7, BEACH_H, r);           // 沙滩（覆盖草→海之间）
    // 草沙交界碎边
    for (let i = 0; i < 130; i++) {
      g.fillStyle = r() < 0.5 ? PAL.sand : PAL.grass[s];
      const y = r() * c.height;
      g.fillRect(7 * GRES - 4 + Math.floor(r() * 8), y, 2, 2);
    }
    // 潮汐池（装饰浅洼，不阻挡）
    for (const [px, pz, pr] of [[14, 28, 1.6], [17, 29.5, 1.1]]) {
      g.fillStyle = '#C8B88E';
      g.beginPath(); g.ellipse(px * GRES, pz * GRES, pr * GRES + 3, pr * GRES * 0.7 + 3, 0, 0, 7); g.fill();
      g.fillStyle = shade(PAL.water[s], 12);
      g.beginPath(); g.ellipse(px * GRES, pz * GRES, pr * GRES, pr * GRES * 0.7, 0, 0, 7); g.fill();
    }
    paintWaterRect(g, SEA_X, 0, BEACH_W - SEA_X, BEACH_H, s, r); // 海面基底
    // 水下渐变（近岸浅、远岸深）
    const grad = g.createLinearGradient(SEA_X * GRES, 0, BEACH_W * GRES, 0);
    grad.addColorStop(0, 'rgba(232,216,168,0.55)'); grad.addColorStop(0.25, 'rgba(120,170,200,0.25)'); grad.addColorStop(1, 'rgba(30,60,110,0.5)');
    g.fillStyle = grad; g.fillRect(SEA_X * GRES, 0, (BEACH_W - SEA_X) * GRES, c.height);
    return groundMesh(BEACH_W, BEACH_H, c);
  }

  function buildVisuals(s) {
    // 地面：由 world/unified.js 一体化底图统一提供（不再分块拼接）
    // 大海动态波光层（越界延伸，营造海平线）
    const sea = makeAnimatedWater(17, BEACH_H + 4, s, { glintOpacity: 0.4, speed: 1.35, opacity: 0.88 });
    sea.position.set(SEA_X + 7.6, 0.03, BEACH_H / 2);
    group.add(sea);
    // 岸线泡沫
    const foam = makeFoamStrip();
    foam.position.set(SEA_X - 0.4, 0.05, BEACH_H / 2);
    group.add(foam);
    // 码头（旅行商人船位）
    const pier = makePier(9, 2.4);
    pier.position.set(30.5, 0, 19.5);
    group.add(pier);
    const boat = makeBoat();
    boat.position.set(36.6, 0.05, 21.6); boat.rotation.y = 0.35;
    group.add(boat);
    // 码头灯 + 岸灯（灯位沿岸线）
    for (const [lx, lz] of [[34.6, 18.2], [27, 8], [27, 24]]) {
      const l = makeLamp(); l.position.set(lx, 0, lz); group.add(l);
    }
    // 礁石区（湿润深色巨石，阻挡）
    const rr = rng(hashStr('reef'));
    for (const [rx, rz] of REEF_BLOCKS) {
      const rock = makeRock(1.1 + rr() * 1.2);
      rock.material.color.set(shade(PAL.stone, -22));
      rock.position.set(rx + 0.5, 0.12, rz + 0.5);
      group.add(rock);
    }
    // 渔家小屋
    const hut = makeBuilding({ w: HUT.w, d: HUT.d, face: 1, roof: '#3E8E96' });
    hut.position.set(HUT.x + HUT.w / 2, 0, HUT.z + HUT.d / 2);
    group.add(hut);
    // 贝壳点缀
    const r = rng(hashStr('shells'));
    for (let i = 0; i < 22; i++) {
      const sh = makeShell(r);
      sh.position.x = 8.5 + r() * 19; sh.position.z = 1 + r() * 30;
      group.add(sh);
    }
    // 西侧草木
    for (const [tx, tz] of [[3, 4], [4, 28], [2, 20]]) {
      const t = makeTree(s, 0.7 + r() * 0.4); t.position.set(tx, 0, tz); group.add(t);
    }
    for (let i = 0; i < 14; i++) {
      const tu = r() < 0.6 ? makeGrassTuft(s) : makeFlowerPatch(s);
      tu.position.set(1 + r() * 6, 0, 1 + r() * 30);
      group.add(tu);
    }
    props = collectProps(group);
  }

  const scene = {
    id: 'beach', name: '碎星海滩', W: BEACH_W, H: BEACH_H, group,
    defaultSpawn: [4, 15],
    groundType(x, z) {
      if (x < 0 || z < 0 || x >= BEACH_W || z >= BEACH_H) return 'blocked';
      if (z >= 19 && z <= 20 && x >= 26 && x <= 35) return 'path';   // 码头板面
      if (x >= SEA_X) return 'water';
      if (x >= HUT.x && x < HUT.x + HUT.w && z >= HUT.z && z < HUT.z + HUT.d) return 'blocked';
      for (const [rx, rz] of REEF_BLOCKS) if (x === rx && z === rz) return 'blocked';
      if (x >= 7) return 'sand';
      return curSeason === 3 ? 'snow' : 'grass';
    },
    interactables: [
      {
        x: 34, z: 20, r: 2.2, label: 'E 旅行商人船位',
        action: () => {
          game.audio.sfx('open');
          game.ui.tutorial('码头尽头系着老渔夫的小船，船身随浪轻晃。旅行商人的大船周五、周日会停靠在低语森林的营地。', 6000);
        },
      },
      {
        x: 9, z: 17.5, r: 1.5, label: 'E 海月的家',
        action: () => {
          game.audio.sfx('close');
          game.ui.tutorial('门锁着，门把手上挂着一串贝壳风铃，正随着海风叮当作响。', 5000);
        },
      },
      {
        x: 10, z: 26, r: 2.4, label: 'E 礁石区',
        action: () => {
          game.audio.sfx('splash');
          game.ui.tutorial('礁石上附着牡蛎和藤壶，石缝里有小蟹快速爬过——退潮时能捡到不少好东西。', 5000);
        },
      },
      {
        x: 14, z: 28, r: 2, label: 'E 潮汐池',
        action: () => {
          game.audio.sfx('splash');
          game.ui.tutorial('小水洼里映着天光，几只寄居蟹驮着贝壳慢悠悠地挪步。', 5000);
        },
      },
    ],
    exits: [
      { x: 0, z: 14, w: 2, h: 2, to: 'town', spawn: [53, 27] },      // 西 → 汐溪镇
    ],
    update(dt, t) { if (props) stdPropUpdate(props, dt, t, game); },
    setSeason(s) { curSeason = s; disposeGroup(group); buildVisuals(s); },
  };
  buildVisuals(season);
  return scene;
}
