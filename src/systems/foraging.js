// 觅食与采集系统：砍树/树桩/采集觅食物/碎石/割草
// 设计文档：docs/design/foraging.md
import * as THREE from 'three';
import { FORAGE } from '../data/forage.js';
import { getItem, registerItem } from '../data/items.js';
import { addItem, addXP, useEnergy, skillLevel } from '../core/state.js';
import { makeTexture, shade } from '../render/textures.js';
import { REGIONS, toWorld } from '../world/seamless.js';

registerItem('acorn', '橡子', 'seed', 20, { treeSeed: 'oak' });
registerItem('maple_seed', '枫树种子', 'seed', 20, { treeSeed: 'maple' });
registerItem('pine_cone', '松果', 'seed', 20, { treeSeed: 'pine' });
registerItem('glow_berry', '微光莓', 'forage', 150, { edible: true, energy: 30 });
registerItem('chanterelle', '鸡油菌', 'forage', 160, { edible: true, energy: 35 });

const SEASON_KEY = ['spring', 'summer', 'autumn', 'winter'];
const TREE_HP = [6, 5, 4, 3, 2]; // 斧等级 0-4
const SCENE_FORAGE = { farm: 2, forest: 4, beach: 3, mountain: 3, town: 2 };

export class Foraging {
  constructor(game) {
    this.game = game;
    if (!game.state.forage) game.state.forage = { trees: {}, stumps: {}, spawned: [], weekCount: {}, lastWeek: 0 };
    this.group = new THREE.Group();
    game.engine.scene.add(this.group);
    this.itemMeshes = new Map();
    this.treeState = new Map();
    this.weedState = new Map();
    this.rockState = new Map();
    this.stumpMeshes = new Map();
    game.bus.on('day-start', () => this.onDayStart());
    // 场景换季重建后必须重扫（否则树/草/石引用过期：砍了旧网格，新树还在）
    game.bus.on('season-start', () => this.scanTrees());
    this.scanTrees();
    for (const id of Object.keys(SCENE_FORAGE)) this.spawnSceneItems(id);
  }
  // ---- 自然资源登记（读 builder.natureIndex；隐藏经矩阵置零）----
  scanTrees() {
    const g = this.game;
    this.treeState.clear();
    this.weedState.clear();
    this.rockState.clear();
    const idx = g.worldBuilder?.natureIndex || [];
    for (const entry of idx) {
      if (entry.kind === 'tree') {
        const saved = g.state.forage.trees[entry.key];
        const stump = g.state.forage.stumps[entry.key];
        if (stump && g.clock.absoluteDay < stump.regrowDay) {
          this.treeState.set(entry.key, { entry, hp: 2, stump: true, regrowDay: stump.regrowDay, wx: entry.x, wz: entry.z });
          g.worldBuilder.setNatureHidden(entry, true);
          this.makeStumpMesh(entry.key, entry.x, entry.z);
        } else if (saved && saved.cut) {
          this.treeState.set(entry.key, { entry, hp: 0, stump: false, gone: true, wx: entry.x, wz: entry.z });
          g.worldBuilder.setNatureHidden(entry, true);
        } else {
          this.treeState.set(entry.key, { entry, hp: TREE_HP[g.state.player.tools.axe || 0], stump: false, wx: entry.x, wz: entry.z });
        }
      } else if (entry.kind === 'weed') {
        const saved = g.state.forage.weeds?.[entry.key];
        if (saved && g.clock.absoluteDay < saved.cutDay + 2) {
          entry.cut = true;
          this.weedState.set(entry.key, { entry, cut: true, wx: entry.x, wz: entry.z });
          g.worldBuilder.setNatureHidden(entry, true);
        } else {
          this.weedState.set(entry.key, { entry, cut: false, wx: entry.x, wz: entry.z });
        }
      } else if (entry.kind === 'rock') {
        const saved = g.state.forage.rocks?.[entry.key];
        if (saved && g.clock.absoluteDay < saved.cutDay + 4) {
          this.rockState.set(entry.key, { entry, hp: 0, gone: true, wx: entry.x, wz: entry.z });
          g.worldBuilder.setNatureHidden(entry, true);
        } else {
          this.rockState.set(entry.key, { entry, hp: 3, gone: false, wx: entry.x, wz: entry.z });
        }
      }
    }
  }
  makeStumpMesh(key, wx, wz) {
    if (this.stumpMeshes.has(key)) return;
    const g = new THREE.Group();
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.32, 7), new THREE.MeshLambertMaterial({ color: '#7A5230', flatShading: true }));
    stump.position.y = 0.16; stump.castShadow = true;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 7), new THREE.MeshLambertMaterial({ color: '#B89B6A', flatShading: true }));
    top.position.y = 0.33;
    g.add(stump, top);
    g.position.set(wx, 0, wz);
    this.group.add(g);
    this.stumpMeshes.set(key, g);
  }
  removeStumpMesh(key) {
    const m = this.stumpMeshes.get(key);
    if (m) { this.group.remove(m); this.stumpMeshes.delete(key); }
  }
  clearItems() {
    for (const m of this.itemMeshes.values()) this.group.remove(m);
    this.itemMeshes.clear();
  }
  // ---- 觅食物生成 ----
  onDayStart() {
    const g = this.game;
    const week = Math.floor(g.clock.absoluteDay / 7);
    if (g.state.forage.lastWeek !== week) { g.state.forage.lastWeek = week; g.state.forage.weekCount = {}; }
    for (const id of Object.keys(SCENE_FORAGE)) this.spawnSceneItems(id);
    // 树桩复生 / 杂草复生 / 石块复生
    for (const [key, t] of this.treeState) {
      if (t.stump && g.clock.absoluteDay >= t.regrowDay) {
        delete g.state.forage.stumps[key];
        this.removeStumpMesh(key);
        if (t.entry) g.worldBuilder.setNatureHidden(t.entry, false);
        this.treeState.set(key, { entry: t.entry, hp: TREE_HP[g.state.player.tools.axe || 0], stump: false, wx: t.wx, wz: t.wz });
      }
    }
    for (const [key, w] of this.weedState) {
      const saved = g.state.forage.weeds?.[key];
      if (w.cut && saved && g.clock.absoluteDay >= saved.cutDay + 2) {
        w.cut = false;
        if (w.entry) g.worldBuilder.setNatureHidden(w.entry, false);
        delete g.state.forage.weeds[key];
      }
    }
    for (const [key, rk] of this.rockState) {
      const saved = g.state.forage.rocks?.[key];
      if (rk.gone && saved && g.clock.absoluteDay >= saved.cutDay + 4) {
        rk.gone = false;
        rk.hp = 3;
        if (rk.entry) g.worldBuilder.setNatureHidden(rk.entry, false);
        delete g.state.forage.rocks[key];
      }
    }
    // 特殊采集点复生
    if (this.special) {
      for (const sp of this.special) {
        if (g.clock.absoluteDay >= sp.readyDay && !sp.meshes[0]?.visible) {
          for (const m of sp.meshes) m.visible = true;
        }
      }
    }
  }
  spawnSceneItems(sceneId) {
    const g = this.game;
    const count = SCENE_FORAGE[sceneId];
    if (!count) return;
    const week = Math.floor(g.clock.absoluteDay / 7);
    const used = g.state.forage.weekCount[sceneId] || 0;
    if (used >= count * 7) return;
    const seasonList = FORAGE[SEASON_KEY[g.clock.season]] || [];
    if (!seasonList.length) return;
    const scene = g.scenes.get(sceneId);
    if (!scene) return;
    g.state.forage.weekCount[sceneId] = used + 1;
    const f = seasonList[Math.floor(Math.random() * seasonList.length)];
    const r = REGIONS[sceneId];
    for (let tries = 0; tries < 30; tries++) {
      const x = 3 + Math.random() * (scene.W - 6), z = 3 + Math.random() * (scene.H - 6);
      if (scene.groundType(Math.floor(x), Math.floor(z)) !== 'walk') continue;
      this.spawnForageItem(f, x + r.ox, z + r.oz, sceneId);
      break;
    }
  }
  spawnForageItem(f, x, z, sceneId) {
    const g = this.game;
    const uid = 'fi_' + Math.random().toString(36).slice(2, 8);
    const rec = { uid, item: f.id, x, z, scene: sceneId }; // x,z 已是世界坐标
    g.state.forage.spawned.push(rec);
    this.spawnItemMesh(rec);
    return rec;
  }
  spawnItemMesh(rec) {
    const g = this.game;
    const f = FORAGE[SEASON_KEY[g.clock.season]].find((x) => x.id === rec.item) || { id: rec.item };
    const col = ['#E84A6A', '#FFD98A', '#8AE84A', '#B87AE8', '#7AB8E8'][rec.item.length % 5];
    const g2 = new THREE.Group();
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshLambertMaterial({ color: col, flatShading: true }));
    body.position.y = 0.16;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
    glow.position.y = 0.42;
    g2.add(body, glow);
    g2.position.set(rec.x, 0, rec.z);
    g2.userData.glow = glow;
    this.group.add(g2);
    this.itemMeshes.set(rec.uid, g2);
  }
  // ---- 交互 ----
  nearestForage(x, z, r = 1.2) {
    const g = this.game;
    return g.state.forage.spawned.find((p) => Math.hypot(p.x - x, p.z - z) < r);
  }
  pickForage(rec) {
    const g = this.game;
    const quality = skillLevel(g.state, 'foraging') >= 10 && g.state.player.skills.foraging.prof.includes('botanist') ? 3 : (Math.random() < skillLevel(g.state, 'foraging') * 0.03 ? 1 : 0);
    addItem(g.state, rec.item, 1, quality);
    addXP(g.state, 'foraging', 7);
    g.audio.sfx('pickup');
    const mesh = this.itemMeshes.get(rec.uid);
    if (mesh) {
      g.effects.burst(mesh.position.clone().add(new THREE.Vector3(0, 0.4, 0)), ['#8AE84A', '#FFFFFF'], 8, 1.6);
      g.effects.floatText(mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), `+${getItem(rec.item).name}${quality ? ' ★' : ''}`, '#8AE84A', 12);
      this.group.remove(mesh);
      this.itemMeshes.delete(rec.uid);
    }
    g.state.forage.spawned = g.state.forage.spawned.filter((p) => p.uid !== rec.uid);
    g.state.codex.forage[rec.item] = true;
    g.ui.refreshToolbar();
    return true;
  }
  // ---- 砍树 ----
  nearestTree(x, z, r = 1.6) {
    let best = null, bd = r;
    for (const [key, t] of this.treeState) {
      if (t.gone) continue;
      const d = Math.hypot(t.wx - x, t.wz - z);
      if (d < bd) { bd = d; best = { key, state: t, x: t.wx, z: t.wz }; }
    }
    return best;
  }
  chopTree(tree) {
    const g = this.game;
    const st = tree.state; // 地图条目（引用，直接读写）
    if (st.stump) {
      st.hp -= 1 + (g.state.player.tools.axe >= 2 ? 1 : 0);
      g.audio.sfx('chop');
      useEnergy(g.state, Math.max(1, 2 - skillLevel(g.state, 'foraging') * 0.1));
      g.effects.burst(new THREE.Vector3(tree.x, 0.4, tree.z), ['#9A6B3F', '#6E4A2A'], 6, 2);
      if (st.hp <= 0) {
        g.state.forage.trees[tree.key] = { cut: true };
        delete g.state.forage.stumps[tree.key];
        this.removeStumpMesh(tree.key);
        if (st.entry) g.worldBuilder.setNatureHidden(st.entry, true);
        st.gone = true;
        addItem(g.state, 'wood', 2, 0);
        addXP(g.state, 'foraging', 2);
        g.audio.sfx('harvest');
        g.effects.floatText(new THREE.Vector3(tree.x, 0.8, tree.z), '+木头 ×2', '#B89B6A', 12);
      }
      return true;
    }
    if (st.falling) return true;
    st.hp -= 1 + (g.state.player.tools.axe >= 2 ? 1 : 0);
    useEnergy(g.state, Math.max(1, 2 - skillLevel(g.state, 'foraging') * 0.1));
    g.audio.sfx('chop');
    g.effects.shakeScreen(0.04);
    g.effects.burst(new THREE.Vector3(tree.x, 1, tree.z), ['#9A6B3F', '#4AA84A'], 8, 2.2);
    if (st.hp <= 0) {
      st.falling = true;
      // 立即登记树桩状态并隐藏整树（实例矩阵置零），杜绝动画期间重复砍伐刷掉落
      g.state.forage.stumps[tree.key] = { regrowDay: g.clock.absoluteDay + 5 };
      if (st.entry) g.worldBuilder.setNatureHidden(st.entry, true);
      this.treeState.set(tree.key, { entry: st.entry, hp: 2, stump: true, regrowDay: g.clock.absoluteDay + 5, wx: st.wx, wz: st.wz });
      // 倒树
      const wood = 8 + Math.floor(Math.random() * 5);
      addItem(g.state, 'wood', wood, 0);
      addItem(g.state, 'sap', 1 + Math.floor(Math.random() * 2), 0);
      if (Math.random() < 0.4) addItem(g.state, ['acorn', 'maple_seed', 'pine_cone'][Math.floor(Math.random() * 3)], 1, 0);
      if (g.state.player.skills.foraging.prof.includes('forester')) addItem(g.state, 'wood', Math.ceil(wood * 0.25), 0);
      addXP(g.state, 'foraging', 14);
      g.audio.sfx('hit');
      g.audio.noise({ dur: 0.4, freq: 300, vol: 0.3 });
      g.effects.burst(new THREE.Vector3(tree.x, 1.5, tree.z), ['#4AA84A', '#9A6B3F', '#8AE84A'], 20, 3);
      g.effects.floatText(new THREE.Vector3(tree.x, 1.2, tree.z), `+木头 ×${wood} +树液`, '#B89B6A', 13);
      g.effects.shakeScreen(0.08);
      this.makeStumpMesh(tree.key, st.wx, st.wz);
      g.bus.emit('tree-chopped', tree.key);
    }
    g.ui.refreshToolbar();
    return true;
  }
  // ---- 杂草（镰刀）----
  nearestWeed(x, z, r = 1.4) {
    let best = null, bd = r;
    for (const [key, w] of this.weedState) {
      if (w.cut) continue;
      const d = Math.hypot(w.wx - x, w.wz - z);
      if (d < bd) { bd = d; best = { key, state: w, x: w.wx, z: w.wz }; }
    }
    return best;
  }
  cutWeed(weed) {
    const g = this.game;
    weed.state.cut = true;
    if (weed.state.entry) g.worldBuilder.setNatureHidden(weed.state.entry, true);
    if (!g.state.forage.weeds) g.state.forage.weeds = {};
    g.state.forage.weeds[weed.key] = { cutDay: g.clock.absoluteDay };
    addItem(g.state, 'fiber', 1 + (Math.random() < 0.5 ? 1 : 0), 0);
    if (g.state.farm.buildings.length && Math.random() < 0.4) addItem(g.state, 'hay', 1, 0);
    addXP(g.state, 'foraging', 2);
    g.audio.sfx('scythe');
    g.effects.burst(new THREE.Vector3(weed.x, 0.3, weed.z), ['#7EC850', '#4AA84A'], 8, 1.8);
    g.effects.floatText(new THREE.Vector3(weed.x, 0.6, weed.z), '+纤维', '#8AE84A', 11);
    g.ui.refreshToolbar();
    return true;
  }
  // ---- 石块（镐）----
  nearestRock(x, z, r = 1.5) {
    let best = null, bd = r;
    for (const [key, rk] of this.rockState) {
      if (rk.gone) continue;
      const d = Math.hypot(rk.wx - x, rk.wz - z);
      if (d < bd) { bd = d; best = { key, state: rk, x: rk.wx, z: rk.wz }; }
    }
    return best;
  }
  chopRock(rock) {
    const g = this.game;
    const st = rock.state;
    if (st.gone) return false;
    st.hp -= 1 + Math.floor((g.state.player.tools.pickaxe || 0) / 2);
    useEnergy(g.state, Math.max(1, 2 - skillLevel(g.state, 'mining') * 0.1));
    g.audio.sfx('stone');
    g.effects.shakeScreen(0.03);
    g.effects.burst(new THREE.Vector3(rock.x, 0.3, rock.z), ['#8D8D96', '#B8B8C0'], 7, 2);
    if (st.hp <= 0) {
      st.gone = true;
      if (st.entry) g.worldBuilder.setNatureHidden(st.entry, true);
      if (!g.state.forage.rocks) g.state.forage.rocks = {};
      g.state.forage.rocks[rock.key] = { cutDay: g.clock.absoluteDay };
      const region = rock.key.split(':')[0];
      addItem(g.state, 'stone', 2 + Math.floor(Math.random() * 2), 0);
      if (Math.random() < 0.12) addItem(g.state, 'coal', 1, 0);
      if (region === 'mountain' && Math.random() < 0.2) addItem(g.state, Math.random() < 0.5 ? 'copper_ore' : 'quartz', 1, 0);
      addXP(g.state, 'mining', 4);
      g.state.player.stats.mined++;
      g.audio.sfx('pickup');
      g.effects.floatText(new THREE.Vector3(rock.x, 0.7, rock.z), '+石头', '#B8B8C0', 12);
    }
    g.ui.refreshToolbar();
    return true;
  }
  // ---- 特殊采集点（蘑菇圈/神秘林地，2 天一刷）----
  initSpecialSpots() {
    const g = this.game;
    const mr = g.worldBuilder?.group ? (window.__decorCache ||= null, null) : null;
    this.special = [];
    // 从 layout 读点位；可视件按邻近收集
    const mrPos = { x: 62, z: 28, r: 3 }, sgPos = { x: 88, z: 12, r: 2.5 };
    this.special.push({ kind: 'mushroom', name: '蘑菇圈', x: mrPos.x, z: mrPos.z, r: mrPos.r, item: 'chanterelle', count: 4, readyDay: 0, meshes: [] });
    this.special.push({ kind: 'grove', name: '神秘林地', x: sgPos.x, z: sgPos.z, r: sgPos.r, item: 'glow_berry', count: 2, readyDay: 0, meshes: [] });
    // 收集可视件（按邻近）
    g.worldBuilder?.group.traverse((o) => {
      if (!o.isMesh) return;
      for (const sp of this.special) {
        if (Math.hypot(o.getWorldPosition(new THREE.Vector3()).x - sp.x, o.getWorldPosition(new THREE.Vector3()).z - sp.z) < sp.r + 0.6) {
          if (sp.meshes.length < 40) sp.meshes.push(o);
        }
      }
    });
  }
  specialTip(x, z) {
    const g = this.game;
    if (!this.special) this.initSpecialSpots();
    for (const sp of this.special) {
      if (Math.hypot(x - sp.x, z - sp.z) < sp.r + 1.2 && g.clock.absoluteDay >= sp.readyDay) {
        return { label: `E 采集${sp.name}`, spot: sp };
      }
    }
    return null;
  }
  collectSpecial(sp) {
    const g = this.game;
    addItem(g.state, sp.item, sp.count, 0);
    addXP(g.state, 'foraging', 15);
    g.audio.sfx('harvest');
    g.effects.burst(new THREE.Vector3(sp.x, 0.5, sp.z), ['#8AE84A', '#FFFFFF', '#FFD98A'], 12, 2);
    g.effects.floatText(new THREE.Vector3(sp.x, 1, sp.z), `+${getItem(sp.item).name} ×${sp.count}`, '#FFD98A', 13);
    for (const m of sp.meshes) m.visible = false;
    sp.readyDay = g.clock.absoluteDay + 2;
    g.state.codex.forage[sp.item] = true;
    g.ui.refreshToolbar();
    return true;
  }
  // ---- 帧更新 ----
  update(dt, t) {
    // 觅食物闪光
    for (const m of this.itemMeshes.values()) {
      const glow = m.userData.glow;
      if (glow) glow.position.y = 0.42 + Math.sin(t * 3 + m.position.x) * 0.06;
      m.rotation.y += dt * 0.8;
    }
  }
  serialize() {}
  deserialize() {}
}
