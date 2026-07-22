// 世界边缘与衔接：区域接缝（衔接道路 + 色彩过渡带）+ 边缘屏障（海洋/林墙/山崖，遮挡地图边界）
import * as THREE from 'three';
import { PAL, shade, mkCanvas, makeTexture } from '../render/textures.js';
import { makeAnimatedWater } from './scenekit.js';
import { REGIONS } from './seamless.js';
import { makeTree } from './proto.js';
import { rng, hashStr } from '../core/rng.js';

// 接缝定义：路连接条 + 颜色过渡带（世界坐标；过渡带沿整条接缝）
const SEAMS = [
  { id: 'farm-town', axis: 'z', at: 48, from: 0, to: 48, road: { x: 23, z: 46.5, w: 3, h: 4 }, colorA: (s) => PAL.grass[s], colorB: (s) => PAL.grass[s] },
  { id: 'farm-forest', axis: 'x', at: 48, from: 8, to: 48, road: { x: 24, z: 22, w: 26.5, h: 2.6 }, colorA: (s) => PAL.grass[s], colorB: (s) => shade(PAL.grass[s], -14) },
  { id: 'town-beach', axis: 'x', at: 56, from: 48, to: 80, road: { x: 51.5, z: 72.5, w: 7, h: 3 }, colorA: (s) => PAL.grass[s], colorB: () => shade(PAL.sand, -18) },
  { id: 'farm-mountain', axis: 'z', at: 0, from: 4, to: 44, road: { x: 23, z: -2.5, w: 2, h: 5 }, colorA: (s) => PAL.grass[s], colorB: (s) => (s === 3 ? PAL.grass[3] : '#8A9A6A') },
];

function pathTexture() {
  return makeTexture(16, 16, (g) => {
    g.fillStyle = PAL.path; g.fillRect(0, 0, 16, 16);
    const r = rng(hashStr('seampath'));
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? shade(PAL.path, -16) : shade(PAL.path, 12); g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1); }
  });
}
export class WorldEdge {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group();
    game.scenes.worldGroup.add(this.group);
    this.water = null;
    this.build();
  }
  build() {
    const g = this.game, season = g.clock.season;
    // ---- 接缝：衔接道路（用户评审：像素交错过渡带观感不佳，已移除）----
    const pathTex = pathTexture();
    for (const s of SEAMS) {
      const road = new THREE.Mesh(
        new THREE.PlaneGeometry(s.road.w, s.road.h),
        new THREE.MeshLambertMaterial({ map: pathTex })
      );
      road.rotation.x = -Math.PI / 2;
      road.position.set(s.road.x + s.road.w / 2, 0.011, s.road.z + s.road.h / 2);
      road.receiveShadow = true;
      this.group.add(road);
    }
    // ---- 边缘屏障（衬底；树林/岩石已并入 builder 实例化批次）----
    this.buildSkirts(season);
  }
  // 地面衬底：屏障之下必须有地（防浮空），并覆盖所有区域间缺口
  buildSkirts(season) {
    const grassTex = (() => {
      const t = makeTexture(32, 32, (g) => {
        g.fillStyle = shade(PAL.grass[season], -8); g.fillRect(0, 0, 32, 32);
        const r = rng(hashStr('skirtg'));
        for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? shade(PAL.grassD[season], -6) : shade(PAL.grass[season], 8); g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 2, 1); }
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    })();
    const rockTex = (() => {
      const t = makeTexture(32, 32, (g) => {
        g.fillStyle = '#6E6858'; g.fillRect(0, 0, 32, 32);
        const r = rng(hashStr('skirtr'));
        for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? '#5E584C' : '#7E7868'; g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 2, 1); }
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    })();
    const sandTex = (() => {
      const t = makeTexture(32, 32, (g) => {
        g.fillStyle = shade(PAL.sand, -10); g.fillRect(0, 0, 32, 32);
        const r = rng(hashStr('skirts'));
        for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.5 ? shade(PAL.sand, -22) : shade(PAL.sand, 8); g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 2, 1); }
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    })();
    const skirts = [
      { x: -46, z: -46, w: 46.5, h: 190, tex: grassTex, rep: [10, 40] },  // 西缘草衬（西拓后西移）
      { x: -14, z: -48, w: 130, h: 18, tex: rockTex, rep: [26, 4] },     // 北缘岩衬
      { x: -0.5, z: -32, w: 5, h: 32, tex: grassTex, rep: [1, 7] },      // 山路-农场西缺口
      { x: 44, z: -32, w: 56, h: 40, tex: rockTex, rep: [12, 9] },       // 森林北-山东缺口
      { x: 0, z: 80, w: 56, h: 16, tex: grassTex, rep: [10, 3] },        // 镇南草地衬底
    ];
    for (const sk of skirts) {
      const t = sk.tex.clone();
      t.needsUpdate = true;
      t.repeat.set(sk.rep[0], sk.rep[1]);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(sk.w, sk.h), new THREE.MeshLambertMaterial({ map: t }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(sk.x + sk.w / 2, -0.035, sk.z + sk.h / 2);
      m.receiveShadow = true;
      this.group.add(m);
    }
    // 缺口补树/补石
    const r = rng(hashStr('gaps'));
    const leafMat = new THREE.MeshLambertMaterial({ color: shade(PAL.leaf[0], -10), flatShading: true });
    const trunkMat = new THREE.MeshLambertMaterial({ color: PAL.trunk, flatShading: true });
    for (let i = 0; i < 14; i++) {
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.4, 5), trunkMat);
      trunk.position.y = 0.7;
      const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), leafMat);
      c1.position.y = 1.9;
      t.add(trunk, c1);
      t.position.set(-0.5 + r() * 5, 0, -32 + r() * 30);
      t.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.group.add(t);
    }
    const rockMat = new THREE.MeshLambertMaterial({ color: shade(PAL.stone, -12), flatShading: true });
    for (let i = 0; i < 16; i++) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + r() * 1.2, 0), rockMat);
      rock.position.set(44 + r() * 56, 0.2 + r() * 0.5, -30 + r() * 36);
      rock.rotation.set(r() * 3, r() * 3, r() * 3);
      rock.castShadow = true;
      this.group.add(rock);
    }
  }
  buildOcean(season) {
    // 东+南大海（覆盖海滩以东、全镇以南的虚空）
    const rects = [
      { x: 96, z: -10, w: 70, h: 150 },  // 东海
      { x: -10, z: 96, w: 180, h: 60 },  // 南海
    ];
    for (const rc of rects) {
      const water = makeAnimatedWater(rc.w, rc.h, season, { opacity: 0.94, glintOpacity: 0.22 });
      water.position.set(rc.x + rc.w / 2, -0.25, rc.z + rc.h / 2);
      this.group.add(water);
      if (!this.water) this.water = [];
      this.water.push(water);
    }
    // 海浪边缘泡沫线（南海岸/东海岸交界）
    const foamMat = new THREE.MeshBasicMaterial({ color: '#E8F4F8', transparent: true, opacity: 0.55 });
    for (let x = -8; x < 160; x += 3) {
      const foam = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), foamMat);
      foam.rotation.x = -Math.PI / 2;
      foam.position.set(x, 0.02, 96.5);
      this.group.add(foam);
    }
    for (let z = -8; z < 100; z += 3) {
      const foam = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), foamMat);
      foam.rotation.x = -Math.PI / 2;
      foam.rotation.z = Math.PI / 2;
      foam.position.set(96.5, 0.02, z);
      this.group.add(foam);
    }
  }
  buildForestWall() {
    // 西侧与北缘纵深树林（3 排交错 + 密度渐变 + 纹理树 v3）
    const r = rng(hashStr('edgewall2'));
    const season = this.game.clock.season;
    for (let z = -30; z < 140; z += 2.0) {
      for (const [dx, prob] of [[-2.2, 0.85], [-4.4, 0.8], [-6.6, 0.7], [-9, 0.55]]) {
        if (r() < prob) {
          const t = makeTree(season, 0.9 + r() * 0.7);
          t.position.set(dx + (r() - 0.5) * 1.6, 0, z + (r() - 0.5) * 1.6);
          this.group.add(t);
        }
      }
    }
    // 北缘山坡林（山崖石间夹树）
    for (let x = -8; x < 106; x += 3) {
      if (r() < 0.65) {
        const t = makeTree(season, 0.8 + r() * 0.6);
        t.position.set(x + (r() - 0.5) * 2, 0, -33 + (r() - 0.5) * 4);
        this.group.add(t);
      }
      if (r() < 0.4) {
        const t = makeTree(season, 1.0 + r() * 0.6);
        t.position.set(x + (r() - 0.5) * 2.5, 0, -38 + (r() - 0.5) * 4);
        this.group.add(t);
      }
    }
  }
  buildCliffs() {
    // 北缘山崖（z < -30 全边界 + 东北角）
    const r = rng(hashStr('edgecliff'));
    const rockMat = new THREE.MeshLambertMaterial({ color: shade(PAL.stone, -14), flatShading: true });
    const rockMat2 = new THREE.MeshLambertMaterial({ color: shade(PAL.stoneD, -6), flatShading: true });
    for (let x = -8; x < 110; x += 3.5) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + r() * 1.4, 0), r() < 0.5 ? rockMat : rockMat2);
      rock.position.set(x + (r() - 0.5) * 2, 0.4 + r() * 0.8, -34 + (r() - 0.5) * 3);
      rock.rotation.set(r() * 3, r() * 3, r() * 3);
      rock.castShadow = true;
      this.group.add(rock);
      if (r() < 0.5) {
        const rock2 = rock.clone();
        rock2.position.z -= 4 + r() * 3;
        rock2.scale.multiplyScalar(1.2);
        this.group.add(rock2);
      }
    }
  }
  update(dt, t) {
    if (this.water) for (const w of this.water) w.userData.water?.update(dt, t);
  }
}
