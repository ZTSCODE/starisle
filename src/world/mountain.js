// 星峰山路场景（40×32）：矿井入口（emit enter-mine）+ 采石场（断桥，bundles 修复后通行）+ 山洞湖 + 矿车点（锁定态）
// 修复状态约定：state.bundles.rewards.bridge / state.bundles.rewards.minecart（bundles 系统发放 roomReward 时写入，
// 对齐 data/bundles.js 的 roomReward type: bridge / minecart）。
import * as THREE from 'three';
import { rng, hashStr } from '../core/rng.js';
import { PAL, mkCanvas, shade } from '../render/textures.js';
import { makeTree, makeLamp, makeRock, makeGrassTuft } from './proto.js';
import {
  disposeGroup, collectProps, stdPropUpdate, GRES,
  paintGrassBase, paintPathStroke, paintWaterEllipse, groundMesh, makeAnimatedWater, makeStoneBridge,
} from './scenekit.js';

export const MT_W = 40, MT_H = 32;
const LAKE = { cx: 9, cz: 24, rx: 4, rz: 3 };
const CHASM_X = [24, 25];          // 裂谷纵贯 tile 列
const BRIDGE_Z = [14, 15];         // 断桥跨越行
const BOULDERS = [[30, 10], [34, 16], [29, 18], [36, 9]]; // 采石场巨石（阻挡）

// 矿井入口：岩壁洞口 + 木支撑门框 + 矿灯
function makeMineEntrance() {
  const g = new THREE.Group();
  const dark = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.5),
    new THREE.MeshBasicMaterial({ color: '#05050C' })
  );
  dark.position.set(0, 1.25, -0.15);
  const wood = new THREE.MeshLambertMaterial({ color: PAL.woodD, flatShading: true });
  for (const sx of [-1.05, 1.05]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.6, 0.22), wood);
    post.position.set(sx, 1.3, 0);
    g.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.24, 0.24), wood);
  beam.position.set(0, 2.62, 0);
  // 洞口拱石
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.3, 6, 10, Math.PI),
    new THREE.MeshLambertMaterial({ color: shade(PAL.stone, -8), flatShading: true })
  );
  arch.position.set(0, 1.35, -0.05);
  const lampMat = new THREE.MeshLambertMaterial({ color: PAL.winLit, emissive: new THREE.Color(PAL.winLit), emissiveIntensity: 0 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), lampMat);
  lamp.position.set(0, 2.3, 0.2);
  g.add(dark, beam, arch, lamp);
  g.userData.lamp = { bulbMat: lampMat };
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// 矿车点（锁定态：锈轨道 + 翻倒矿车）
function makeMinecartSpot() {
  const g = new THREE.Group();
  const railMat = new THREE.MeshLambertMaterial({ color: '#6A5A48', flatShading: true });
  for (const sz of [-0.35, 0.35]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 0.08), railMat);
    rail.position.set(0, 0.1, sz);
    g.add(rail);
  }
  for (let i = 0; i < 5; i++) {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 1.1), new THREE.MeshLambertMaterial({ color: PAL.woodD, flatShading: true }));
    tie.position.set(-1.8 + i * 0.9, 0.04, 0);
    g.add(tie);
  }
  const cartBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.7, 0.9),
    new THREE.MeshLambertMaterial({ color: '#4A4A55', flatShading: true })
  );
  cartBody.position.set(0.4, 0.42, 0.9); cartBody.rotation.z = 0.5; cartBody.rotation.x = 0.2; // 翻倒
  g.add(cartBody);
  for (const [wx, wz] of [[-0.2, 0.75], [0.9, 1.1]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 8), railMat);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(wx, 0.18, wz);
    g.add(wheel);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// 断桥（西端残桥板 + 断口）
function makeBrokenBridge() {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: PAL.wood, flatShading: true });
  const woodD = new THREE.MeshLambertMaterial({ color: PAL.woodD, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 2.4), i === 2 ? woodD : wood);
    plank.position.set(-1 + i * 0.55, 0.35 - i * 0.06, 0);
    plank.rotation.z = i === 2 ? -0.35 : 0; // 末端下垂
    g.add(plank);
  }
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.9, 5), woodD);
  post.position.set(-1.2, 0.45, 1); g.add(post);
  const post2 = post.clone(); post2.position.z = -1; g.add(post2);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function onLake(x, z) {
  const dx = (x + 0.5 - LAKE.cx) / LAKE.rx, dz = (z + 0.5 - LAKE.cz) / LAKE.rz;
  return dx * dx + dz * dz < 1;
}
const bridgeRepaired = (state) => !!state.bundles?.rewards?.bridge;
const cartRepaired = (state) => !!state.bundles?.rewards?.minecart;

export function buildMountainScene(game, season) {
  const group = new THREE.Group();
  group.name = 'scene-mountain';
  let curSeason = season;
  let props = null;
  let bridgeHolder = null;
  let lastBridgeState = null;

  function drawGround(s) {
    const c = mkCanvas(MT_W * GRES, MT_H * GRES);
    const g = c.getContext('2d');
    const r = rng(hashStr('mountain' + s));
    // 山地石底 + 草斑
    paintGrassBase(g, c.width, c.height, s, r, {
      base: s === 3 ? PAL.grass[3] : '#8A9A6A', dark: s === 3 ? PAL.grassD[3] : '#7A8A5C', flowers: s < 2,
    });
    // 石质斑块
    for (let i = 0; i < 320; i++) {
      g.fillStyle = r() < 0.5 ? PAL.stone : PAL.stoneD;
      g.globalAlpha = 0.1 + r() * 0.14;
      g.fillRect(Math.floor(r() * c.width), Math.floor(r() * c.height), 2 + Math.floor(r() * 4), 1 + Math.floor(r() * 3));
    }
    g.globalAlpha = 1;
    // 采石场石地（更深）
    g.fillStyle = 'rgba(110,110,120,0.35)';
    g.fillRect(26 * GRES, 4 * GRES, 14 * GRES, 18 * GRES);
    // 主路径（南→矿井）+ 支路（→断桥）
    paintPathStroke(g, 20, MT_H, 20, 4, 1.8);
    paintPathStroke(g, 20, 15, 24, 15, 1.6);
    paintPathStroke(g, 20, 8, 12, 4, 1.4); // 矿井前小径
    // 裂谷（深黑 + 岩壁边）
    g.fillStyle = '#15131E';
    g.fillRect(CHASM_X[0] * GRES, 0, 2 * GRES, c.height);
    g.fillStyle = shade(PAL.stoneD, -14);
    g.fillRect(CHASM_X[0] * GRES - 3, 0, 3, c.height);
    g.fillRect((CHASM_X[1] + 1) * GRES, 0, 3, c.height);
    paintWaterEllipse(g, LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz, s, r); // 山洞湖
    return groundMesh(MT_W, MT_H, c);
  }

  function rebuildBridge() {
    const repaired = bridgeRepaired(game.state);
    lastBridgeState = repaired;
    disposeGroup(bridgeHolder);
    if (repaired) {
      const b = makeStoneBridge(5.2, 2.6);
      b.position.set(25, 0, 15);
      bridgeHolder.add(b);
    } else {
      const bb = makeBrokenBridge();
      bb.position.set(23.4, 0, 15);
      bridgeHolder.add(bb);
    }
    props = collectProps(group);
  }

  function buildVisuals(s) {
    // 地面：由 world/unified.js 一体化底图统一提供（不再分块拼接）
    // 山洞湖波光
    const w = makeAnimatedWater(LAKE.rx * 1.6, LAKE.rz * 1.6, s, { glintOpacity: 0.22 });
    w.position.set(LAKE.cx, 0.02, LAKE.cz);
    group.add(w);
    // 湖北侧洞窟岩壁（山洞感）
    const cr = rng(hashStr('crag'));
    for (let i = 0; i < 5; i++) {
      const rock = makeRock(1.6 + cr() * 1.4);
      rock.material.color.set(shade(PAL.stone, -26));
      rock.position.set(LAKE.cx - 3 + i * 1.7, 0.4, LAKE.cz - 3.6 - cr());
      group.add(rock);
    }
    // 北缘岩壁（含矿井两侧）
    const r = rng(hashStr('mtwall'));
    for (let x = 1; x < MT_W - 1; x += 1.6) {
      if (x > 9.5 && x < 14.5) continue; // 矿井口留空
      if (x >= 23 && x <= 26.5) continue; // 裂谷口
      const rock = makeRock(1.5 + r() * 1.3);
      rock.material.color.set(shade(PAL.stone, -12));
      rock.position.set(x + r() * 0.5, 0.25, 1.2 + r() * 0.5);
      group.add(rock);
    }
    // 矿井入口
    const mine = makeMineEntrance();
    mine.position.set(12, 0, 2.6);
    group.add(mine);
    // 矿车点（锁定态）
    const cart = makeMinecartSpot();
    cart.position.set(17, 0, 5.5); cart.rotation.y = 0.15;
    group.add(cart);
    // 采石场巨石（阻挡）+ 碎石点缀
    for (const [bx, bz] of BOULDERS) {
      const rock = makeRock(1.3 + r() * 1.1);
      rock.position.set(bx + 0.5, 0.15, bz + 0.5);
      group.add(rock);
    }
    for (let i = 0; i < 12; i++) {
      const peb = makeRock(0.25 + r() * 0.3);
      peb.position.set(27 + r() * 11, 0.05, 5 + r() * 16);
      group.add(peb);
    }
    // 断桥（动态：修复后重建为石桥）
    bridgeHolder = new THREE.Group();
    group.add(bridgeHolder);
    rebuildBridge();
    // 路灯（主路径）
    for (const [lx, lz] of [[21.5, 28], [21.5, 18], [14, 4.5]]) {
      const l = makeLamp(); l.position.set(lx, 0, lz); group.add(l);
    }
    // 零星树木草丛（山南）
    for (let i = 0; i < 10; i++) {
      const x = 2 + r() * 20, z = 6 + r() * 24;
      if (onLake(x, z) || (x >= 18 && x <= 22) || (z >= 13 && z <= 17 && x >= 18)) continue;
      const t = makeTree(s, 0.7 + r() * 0.5);
      t.position.set(x, 0, z);
      group.add(t);
    }
    for (let i = 0; i < 24; i++) {
      const tu = makeGrassTuft(s);
      tu.position.set(1 + r() * 22, 0, 3 + r() * 28);
      group.add(tu);
    }
    props = collectProps(group);
  }

  const scene = {
    id: 'mountain', name: '星峰山路', W: MT_W, H: MT_H, group,
    defaultSpawn: [20, 28],
    groundType(x, z) {
      if (x < 0 || z < 0 || x >= MT_W || z >= MT_H) return 'blocked';
      if (z <= 2) return 'blocked';                                   // 北缘岩壁
      if (x >= CHASM_X[0] && x <= CHASM_X[1]) {                       // 裂谷
        if ((z === BRIDGE_Z[0] || z === BRIDGE_Z[1]) && bridgeRepaired(game.state)) return 'path';
        return 'blocked';
      }
      if (onLake(x, z)) return 'water';
      if (x >= 19 && x <= 20) return 'path';                          // 主路径
      if ((z === 14 || z === 15) && x >= 20 && x <= 23) return 'path'; // 断桥支路
      if (x === 17 && z === 5) return 'blocked';                      // 矿车点
      for (const [bx, bz] of BOULDERS) if (x === bx && z === bz) return 'blocked';
      return curSeason === 3 ? 'snow' : 'grass';
    },
    interactables: [
      {
        x: 12, z: 4.2, r: 1.7, label: 'E 进入矿井',
        action: () => {
          game.audio.sfx('open');
          game.bus.emit('enter-mine'); // 矿井内部由 mining 系统实现（主循环接 mining.enter）
        },
      },
      {
        x: 23, z: 15, r: 1.6, label: 'E 查看断桥',
        when: (g) => !bridgeRepaired(g.state),
        action: () => {
          game.audio.sfx('error');
          game.ui.tutorial('木桥从中间断开，对岸就是采石场。修好它需要在社区旧会馆完成对应的收集包。', 6000);
        },
      },
      {
        x: 17, z: 6.2, r: 1.6, label: 'E 矿车',
        when: (g) => !cartRepaired(g.state),
        action: () => {
          game.audio.sfx('error');
          game.ui.tutorial('矿车翻倒在锈住的轨道旁。修复后可在镇区与矿井间快速移动（社区旧会馆收集包）。', 6000);
        },
      },
      {
        x: 9, z: 21, r: 2, label: 'E 山洞湖',
        action: () => {
          game.audio.sfx('splash');
          game.ui.tutorial('岩壁环抱的一泓清水，水面平静如镜——是钓鱼的好地方。', 5000);
        },
      },
    ],
    exits: [
      { x: 19, z: 30, w: 2, h: 2, to: 'farm', spawn: [24, 3] },      // 南 → 农场
    ],
    update(dt, t) {
      if (!props) return;
      stdPropUpdate(props, dt, t, game);
      // 断桥修复后即时重建为可通行石桥
      const rep = bridgeRepaired(game.state);
      if (rep !== lastBridgeState) rebuildBridge();
    },
    setSeason(s) { curSeason = s; disposeGroup(group); buildVisuals(s); },
  };
  buildVisuals(season);
  return scene;
}
