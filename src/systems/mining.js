// 矿井与战斗系统：80层4主题带 / 程序生成楼层 / 挖掘 / 怪物AI / 实时战斗 / 电梯 / 宝箱 / 晕厥
// 设计文档：docs/design/mining.md
import * as THREE from 'three';
import { ORES } from '../data/ores.js';
import { MONSTERS } from '../data/monsters.js';
import { getItem, registerItem, sellPrice } from '../data/items.js';
import { addItem, removeItem, useEnergy, damage, heal, addXP, addMoney, skillLevel, heldItem } from '../core/state.js';
import { makeTexture, shade } from '../render/textures.js';
import { rng, irange, pick } from '../core/rng.js';

// 装备物品注册（武器/戒指/鞋）
registerItem('sword_steel', '钢剑', 'weapon', 400, { stack: 1, atk: 8 });
registerItem('sword_frost', '霜刃', 'weapon', 900, { stack: 1, atk: 13 });
registerItem('sword_shadow', '暗影剑', 'weapon', 2000, { stack: 1, atk: 19 });
registerItem('boots_leather', '皮靴', 'boots', 200, { stack: 1, def: 1 });
registerItem('boots_lava', '熔岩靴', 'boots', 600, { stack: 1, def: 3 });
registerItem('ring_vampire', '吸能戒指', 'ring', 500, { stack: 1, vampire: 1 });
registerItem('ring_thorns', '荆棘戒指', 'ring', 500, { stack: 1, thorns: 3 });
registerItem('stardrop', '星之果实', 'food', 0, { stack: 1, edible: true, stardrop: true });

const THEMES = [
  { name: '土层', floor: '#6B5236', floorD: '#5A442C', wall: '#4A3826', rock: '#8A7A6A', glow: null, fogC: '#2A2018', fogD: 0.028, amb: 0.5 },
  { name: '冰层', floor: '#5A7A94', floorD: '#4A687E', wall: '#3A5468', rock: '#9FC4DC', glow: '#7AE8E0', fogC: '#1A2836', fogD: 0.03, amb: 0.55 },
  { name: '熔岩层', floor: '#5A3630', floorD: '#4A2A24', wall: '#3A1E18', rock: '#7A5A50', glow: '#FF6A2A', fogC: '#2A120C', fogD: 0.032, amb: 0.45 },
  { name: '深渊', floor: '#3A3450', floorD: '#2E2842', wall: '#241E36', rock: '#5A5478', glow: '#B87AE8', fogC: '#120E20', fogD: 0.034, amb: 0.4 },
];
const themeOf = (f) => Math.min(3, Math.floor((f - 1) / 20));
const NODE_HP = { stone: 2, copperNode: 3, ironNode: 4, goldNode: 5, iridiumNode: 7, amethystNode: 3, topazNode: 3, jadeNode: 4, tearNode: 4, rubyNode: 5, diamondNode: 6 };
const NODE_ORE = { copperNode: 'copper_ore', ironNode: 'iron_ore', goldNode: 'gold_ore', iridiumNode: 'iridium_ore', amethystNode: 'amethyst', topazNode: 'topaz', jadeNode: 'jade', tearNode: 'tear_crystal', rubyNode: 'ruby', diamondNode: 'diamond' };
const NODE_COLORS = { stone: '#8A8A92', copperNode: '#C8864A', ironNode: '#B8B8C0', goldNode: '#E8C84A', iridiumNode: '#8AE8DC', amethystNode: '#B87AE8', topazNode: '#E8B84A', jadeNode: '#4AE88A', tearNode: '#7AB8E8', rubyNode: '#E84A5A', diamondNode: '#D8F0F8' };
// 每10层宝箱奖励
export const CHEST_REWARDS = { 10: 'boots_leather', 20: 'sword_steel', 30: 'ring_vampire', 40: 'sword_frost', 50: 'ring_thorns', 60: 'boots_lava', 70: 'sword_shadow', 80: 'stardrop' };
const MW = 24, MH = 24;

export class Mining {
  constructor(game) {
    this.game = game;
    this.floor = 0;
    this.group = null;
    this.grid = null;       // 0空地 1墙 2石头/矿点 3熔岩
    this.nodes = new Map(); // key -> {type, hp}
    this.monsters = [];
    this.projectiles = [];
    this.ladder = null;     // {x,z,mesh}
    this.chest = null;
    this.infested = false;
    this.swingCd = 0;
    this.hurtCd = 0;
    this.torch = new THREE.PointLight(0xffc888, 1.6, 14, 1.2);
    this.mobSprites = new Map();
  }
  get inMine() { return this.floor > 0; }

  // ---- 楼层生成（种子可复现）----
  genFloor(f) {
    const g = this.game;
    const r = rng(1000003 + f * 7919);
    const theme = THEMES[themeOf(f)];
    this.grid = new Uint8Array(MW * MH);
    this.nodes.clear();
    for (const m of this.monsters) g.engine.scene.remove(m.mesh);
    this.monsters = [];
    for (const p of this.projectiles) g.engine.scene.remove(p.mesh);
    this.projectiles = [];
    this.ladder = null; this.chest = null;

    // 边界墙 + 随机岩柱/石群
    const idx = (x, z) => z * MW + x;
    for (let x = 0; x < MW; x++) for (let z = 0; z < MH; z++) {
      if (x === 0 || z === 0 || x === MW - 1 || z === MH - 1) this.grid[idx(x, z)] = 1;
    }
    // 岩柱簇
    for (let i = 0; i < 5; i++) {
      const cx = irange(r, 3, MW - 4), cz = irange(r, 3, MH - 4);
      const w = irange(r, 1, 3);
      for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < w; dz++) this.grid[idx(cx + dx, cz + dz)] = 1;
    }
    // 中央出生区清空
    const sx = 3, sz = Math.floor(MH / 2);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) this.grid[idx(sx + dx, sz + dz)] = 0;

    // 石头与矿点
    const oresHere = ORES.filter((o) => f >= o.floors[0] && f <= o.floors[1] && o.nodesFrom !== 'stone');
    const stoneCount = irange(r, 18, 30);
    const place = (type) => {
      for (let tries = 0; tries < 60; tries++) {
        const x = irange(r, 1, MW - 2), z = irange(r, 1, MH - 2);
        if (this.grid[idx(x, z)] === 0 && !this.nodes.has(x + ',' + z)) {
          this.grid[idx(x, z)] = 2;
          this.nodes.set(x + ',' + z, { type, hp: NODE_HP[type] || 2 });
          return true;
        }
      }
      return false;
    };
    for (let i = 0; i < stoneCount; i++) place('stone');
    const nodeCount = irange(r, 5, 10) + Math.floor(f / 12);
    for (let i = 0; i < nodeCount && oresHere.length; i++) place(pick(r, oresHere).nodesFrom);
    // 熔岩层：熔岩池
    if (themeOf(f) === 2) {
      for (let i = 0; i < 3; i++) {
        const cx = irange(r, 5, MW - 6), cz = irange(r, 5, MH - 6);
        for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
          const k = idx(cx + dx, cz + dz);
          if (this.grid[k] === 0) this.grid[k] = 3;
        }
      }
    }
    // 怪物
    const mobsHere = MONSTERS.filter((m) => f >= m.floors[0] && f <= m.floors[1]);
    this.infested = r() < 0.12 && mobsHere.length > 0 && f % 5 !== 0;
    const mobCount = this.infested ? irange(r, 7, 10) : irange(r, 2, 5) + Math.floor(f / 25);
    for (let i = 0; i < mobCount && mobsHere.length; i++) {
      const def = pick(r, mobsHere);
      for (let tries = 0; tries < 40; tries++) {
        const x = irange(r, 3, MW - 3), z = irange(r, 3, MH - 3);
        if (this.grid[idx(x, z)] === 0 && Math.hypot(x - sx, z - sz) > 5) { this.spawnMonster(def, x + 0.5, z + 0.5); break; }
      }
    }
    // 宝箱层
    if (CHEST_REWARDS[f]) {
      for (let tries = 0; tries < 60; tries++) {
        const x = irange(r, MW - 5, MW - 3), z = irange(r, 2, MH - 3);
        if (this.grid[idx(x, z)] === 0) { this.chest = { x, z, item: CHEST_REWARDS[f], opened: false }; break; }
      }
    }
    this.spawn = { x: sx + 0.5, z: sz + 0.5 };
    this.buildScene(f, theme);
  }

  // ---- 场景构建 ----
  buildScene(f, theme) {
    const g = this.game;
    if (this.group) g.engine.scene.remove(this.group);
    this.group = new THREE.Group();
    // 地面（手绘纹理）
    const gtex = makeTexture(96, 96, (gg) => {
      const r = rng(f * 31);
      gg.fillStyle = theme.floor; gg.fillRect(0, 0, 96, 96);
      for (let i = 0; i < 500; i++) {
        gg.fillStyle = r() < 0.6 ? theme.floorD : shade(theme.floor, 14);
        gg.globalAlpha = 0.3 + r() * 0.4;
        gg.fillRect(Math.floor(r() * 96), Math.floor(r() * 96), 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
      }
      gg.globalAlpha = 1;
    });
    gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping; gtex.repeat.set(12, 12);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshLambertMaterial({ map: gtex }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(MW / 2, 0, MH / 2);
    floor.receiveShadow = true;
    this.group.add(floor);
    // 墙与障碍
    const wallMat = new THREE.MeshLambertMaterial({ color: theme.wall, flatShading: true });
    const rockMat = new THREE.MeshLambertMaterial({ color: theme.rock, flatShading: true });
    const idx = (x, z) => z * MW + x;
    for (let x = 0; x < MW; x++) for (let z = 0; z < MH; z++) {
      const v = this.grid[idx(x, z)];
      if (v === 1) {
        const h = x === 0 || z === 0 || x === MW - 1 || z === MH - 1 ? 2.2 : 1.4;
        const w = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), wallMat);
        w.position.set(x + 0.5, h / 2, z + 0.5);
        w.castShadow = true; w.receiveShadow = true;
        this.group.add(w);
      } else if (v === 2) {
        this.group.add(this.nodeMesh(x, z));
      } else if (v === 3) {
        const lava = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#FF5A1A' }));
        lava.rotation.x = -Math.PI / 2; lava.position.set(x + 0.5, 0.02, z + 0.5);
        this.group.add(lava);
      }
    }
    // 主题装饰：发光晶体/火把一个
    if (theme.glow) {
      for (let i = 0; i < 6; i++) {
        const cry = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 5),
          new THREE.MeshLambertMaterial({ color: theme.glow, emissive: new THREE.Color(theme.glow), emissiveIntensity: 1.6 }));
        cry.position.set(2 + Math.random() * (MW - 4), 0.25, 2 + Math.random() * (MH - 4));
        this.group.add(cry);
      }
    }
    // 宝箱
    if (this.chest) {
      const box = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: '#8A5A2A', flatShading: true }));
      body.position.y = 0.25;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.52), new THREE.MeshLambertMaterial({ color: '#A87A3E', flatShading: true }));
      lid.position.y = 0.55;
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshLambertMaterial({ color: '#FFD98A', emissive: 0xffd98a, emissiveIntensity: 2 }));
      glint.position.y = 0.8;
      box.add(body, lid, glint);
      box.position.set(this.chest.x + 0.5, 0, this.chest.z + 0.5);
      this.group.add(box);
      this.chest.mesh = box;
    }
    // 上行梯（出生点旁）
    const up = this.ladderMesh();
    up.position.set(2.5, 0, Math.floor(MH / 2) + 0.5);
    this.group.add(up);
    g.engine.scene.add(this.group);
    // 矿洞光照：压暗环境 + 玩家火把；隐藏天空
    g.engine.scene.fog.color.set(theme.fogC);
    g.engine.scene.fog.density = theme.fogD;
    g.lighting.sun.intensity = 0.05;
    g.lighting.hemi.intensity = theme.amb * 0.35;
    g.lighting.hemi.color.set(theme.floor); g.lighting.hemi.groundColor.set('#0A0A12');
    g.sky.dome.visible = g.sky.stars.visible = g.sky.sunDisc.visible = g.sky.moonDisc.visible = false;
    if (!this.torch.parent) g.engine.scene.add(this.torch);
    this.upLadder = { x: 2, z: Math.floor(MH / 2) };
  }
  nodeMesh(x, z) {
    const k = x + ',' + z, node = this.nodes.get(k);
    const col = NODE_COLORS[node.type] || '#8A8A92';
    const g2 = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), new THREE.MeshLambertMaterial({ color: '#7A7A84', flatShading: true }));
    rock.scale.y = 0.75; rock.position.y = 0.24;
    rock.castShadow = true;
    g2.add(rock);
    if (node.type !== 'stone') {
      for (let i = 0; i < 3; i++) {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), new THREE.MeshLambertMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: 0.7, flatShading: true }));
        c.position.set((Math.random() - 0.5) * 0.4, 0.4, (Math.random() - 0.5) * 0.4);
        c.rotation.set(Math.random() * 0.8 - 0.4, 0, Math.random() * 0.8 - 0.4);
        g2.add(c);
      }
    }
    g2.position.set(x + 0.5, 0, z + 0.5);
    g2.userData.nodeKey = k;
    const node2 = this.nodes.get(k);
    if (node2) node2.mesh = g2;
    return g2;
  }
  ladderMesh() {
    const g2 = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: '#8A6A3A', flatShading: true });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.8), mat);
    frame.position.y = 0.06;
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ color: '#0A0810' }));
    hole.rotation.x = -Math.PI / 2; hole.position.y = 0.13;
    g2.add(frame, hole);
    return g2;
  }

  // ---- 怪物 ----
  mobTexture(def) {
    if (this.mobSprites.has(def.id)) return this.mobSprites.get(def.id);
    const col = '#' + def.color.toString(16).padStart(6, '0');
    const t = makeTexture(20, 20, (g2) => {
      g2.clearRect(0, 0, 20, 20);
      const c = col, cd = shade(col, -35);
      if (def.behavior === 'flyer' && !def.id.includes('bug')) { // 蝙蝠
        g2.fillStyle = cd; g2.fillRect(2, 8, 6, 4); g2.fillRect(12, 8, 6, 4);
        g2.fillStyle = c; g2.fillRect(7, 6, 6, 8);
        g2.fillStyle = '#E84A4A'; g2.fillRect(8, 8, 1, 1); g2.fillRect(11, 8, 1, 1);
      } else if (def.id.includes('ghost')) { // 幽灵
        g2.fillStyle = c; g2.fillRect(5, 4, 10, 10);
        g2.fillRect(5, 14, 2, 3); g2.fillRect(9, 14, 2, 3); g2.fillRect(13, 14, 2, 3);
        g2.fillStyle = '#2A2A3A'; g2.fillRect(7, 7, 2, 2); g2.fillRect(11, 7, 2, 2);
      } else if (def.id.includes('crab')) { // 岩蟹
        g2.fillStyle = cd; g2.fillRect(4, 8, 12, 7);
        g2.fillStyle = c; g2.fillRect(3, 6, 14, 5);
        g2.fillStyle = '#2A2A3A'; g2.fillRect(7, 8, 1, 2); g2.fillRect(12, 8, 1, 2);
      } else if (def.id.includes('squid')) { // 鱿鱼娃
        g2.fillStyle = c; g2.fillRect(5, 4, 10, 9);
        for (let i = 0; i < 4; i++) g2.fillRect(4 + i * 4, 13, 2, 5);
        g2.fillStyle = '#2A2A3A'; g2.fillRect(7, 7, 2, 2); g2.fillRect(11, 7, 2, 2);
      } else { // 史莱姆/甲虫/跳虫
        g2.fillStyle = c; g2.fillRect(4, 8, 12, 8);
        g2.fillStyle = shade(col, 25); g2.fillRect(6, 6, 8, 4);
        g2.fillStyle = '#FFFFFF'; g2.fillRect(7, 9, 2, 2); g2.fillRect(11, 9, 2, 2);
        g2.fillStyle = '#2A2A3A'; g2.fillRect(7, 10, 2, 1); g2.fillRect(11, 10, 2, 1);
      }
    });
    this.mobSprites.set(def.id, t);
    return t;
  }
  spawnMonster(def, x, z) {
    const mat = new THREE.MeshLambertMaterial({ map: this.mobTexture(def), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * def.size, 0.9 * def.size), mat);
    mesh.position.set(x, 0.45 * def.size, z);
    // 血条
    const barBg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.07), new THREE.MeshBasicMaterial({ color: '#1A1A26' }));
    barBg.position.y = 0.65 * def.size;
    const barFg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.05), new THREE.MeshBasicMaterial({ color: '#E84A4A' }));
    barFg.position.y = 0.65 * def.size; barFg.position.z = 0.001;
    mesh.add(barBg, barFg);
    barBg.visible = barFg.visible = false;
    this.game.engine.scene.add(mesh);
    const m = { def, mesh, hp: def.hp, maxHp: def.hp, x, z, vx: 0, vz: 0, state: 'idle', t: Math.random() * 2, cd: 0, barBg, barFg, flash: 0, jumpT: 0 };
    if (def.behavior === 'lurker') mesh.visible = false; // 岩蟹伪装
    this.monsters.push(m);
    return m;
  }
  // 剑击（主循环在玩家持剑点击时调用）
  attack() {
    const g = this.game;
    if (this.swingCd > 0) return false;
    this.swingCd = 0.38;
    const p = g.player;
    g.audio.sfx('swing');
    p.char.swing();
    const held = heldItem(g.state);
    const weapon = held && getItem(held.id).type === 'weapon' ? getItem(held.id) : getItem('sword');
    const lvl = skillLevel(g.state, 'combat');
    let dmg = (weapon.atk || 3) + Math.floor(lvl / 2);
    if (g.state.player.skills.combat.prof.includes('fighter')) dmg = Math.round(dmg * 1.1);
    if (g.state.player.skills.combat.prof.includes('brute')) dmg = Math.round(dmg * 1.15);
    const fx = Math.sin(p.facing), fz = Math.cos(p.facing);
    let hitAny = false;
    for (const m of [...this.monsters]) {
      const dx = m.x - p.pos.x, dz = m.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 1.6) continue;
      const dot = (dx * fx + dz * fz) / (d || 1);
      if (dot < 0.35) continue;
      hitAny = true;
      const crit = Math.random() < (g.state.player.skills.combat.prof.includes('scout') ? 0.15 : 0.1);
      const real = Math.max(1, Math.round((crit ? dmg * 2 : dmg) - m.def.def));
      m.hp -= real;
      m.flash = 0.15;
      m.vx = fx * 6; m.vz = fz * 6;
      m.barBg.visible = m.barFg.visible = true;
      const ratio = Math.max(0, m.hp / m.maxHp);
      m.barFg.scale.x = ratio; m.barFg.position.x = -0.3 * (1 - ratio);
      g.effects.floatText(new THREE.Vector3(m.x, 1.2, m.z), String(real), crit ? '#FFD98A' : '#FFFFFF', crit ? 16 : 13);
      g.effects.burst(new THREE.Vector3(m.x, 0.5, m.z), ['#E84A4A', '#FFFFFF'], 6, 2);
      g.audio.sfx('hit');
      if (m.hp <= 0) this.killMonster(m);
    }
    if (hitAny) g.effects.shakeScreen(0.04);
    return true;
  }
  killMonster(m) {
    const g = this.game;
    g.engine.scene.remove(m.mesh);
    this.monsters = this.monsters.filter((x) => x !== m);
    g.effects.burst(new THREE.Vector3(m.x, 0.5, m.z), ['#' + m.def.color.toString(16).padStart(6, '0'), '#FFFFFF'], 14, 2.6);
    g.audio.sfx('harvest');
    addXP(g.state, 'combat', m.def.xp);
    g.state.player.stats.monstersKilled++;
    for (const d of m.def.drops) {
      if (Math.random() < d.chance) {
        const qty = irange(Math.random, d.qty[0], d.qty[1]);
        addItem(g.state, d.item, qty, 0);
        g.effects.floatText(new THREE.Vector3(m.x, 1, m.z), `+${getItem(d.item).name} ×${qty}`, '#8AE84A', 12);
      }
    }
    // 击杀掉梯 15%
    if (!this.ladder && Math.random() < 0.15) this.revealLadder(Math.floor(m.x), Math.floor(m.z), '击杀怪物露出了向下的梯子！');
    // 吸能戒指
    if (g.state.player.equipment?.ring1 === 'ring_vampire' || g.state.player.equipment?.ring2 === 'ring_vampire') heal(g.state, 2);
    // infested 全灭出梯
    if (this.infested && this.monsters.length === 0 && !this.ladder) {
      this.infested = false;
      this.revealLadder(Math.floor(this.game.player.pos.x), Math.floor(this.game.player.pos.z), '怪物全灭！向下的梯子出现了！');
    }
    g.bus.emit('monster-killed', m.def.id);
  }
  revealLadder(x, z, msg) {
    if (this.ladder) return;
    x = Math.max(1, Math.min(MW - 2, x)); z = Math.max(1, Math.min(MH - 2, z));
    const mesh = this.ladderMesh();
    mesh.position.set(x + 0.5, 0, z + 0.5);
    this.group.add(mesh);
    this.ladder = { x, z, mesh };
    this.game.audio.sfx('levelup');
    this.game.effects.floatText(new THREE.Vector3(x + 0.5, 1.2, z + 0.5), msg || '发现了向下的梯子！', '#FFD98A', 14);
  }

  // ---- 挖掘 ----
  breakNode(x, z) {
    const g = this.game, k = x + ',' + z;
    const node = this.nodes.get(k);
    if (!node) return false;
    const tier = g.state.player.tools.pickaxe || 0;
    node.hp -= 1 + Math.floor(tier / 2);
    g.audio.sfx('stone');
    g.effects.burst(new THREE.Vector3(x + 0.5, 0.4, z + 0.5), ['#8A8A92', NODE_COLORS[node.type]], 7, 2.2);
    g.effects.shakeScreen(0.03);
    useEnergy(g.state, Math.max(1, 2 - skillLevel(g.state, 'mining') * 0.1));
    if (node.hp > 0) return true;
    // 破坏
    this.nodes.delete(k);
    if (node.mesh) this.group.remove(node.mesh);
    this.grid[z * MW + x] = 0;
    g.state.player.stats.mined++;
    const lvl = skillLevel(g.state, 'mining');
    const drops = [];
    if (node.type === 'stone') {
      drops.push(['stone', 1]);
      if (Math.random() < 0.15) drops.push(['coal', 1]);
      if (Math.random() < 0.06) drops.push(['quartz', 1]);
      if (Math.random() < 0.04) drops.push(['earth_crystal', 1]);
    } else {
      const oreId = NODE_ORE[node.type];
      const oreDef = ORES.find((o) => o.id === oreId);
      let qty = 1 + (Math.random() < 0.35 ? 1 : 0);
      if (g.state.player.skills.mining.prof.includes('miner')) qty += 1;
      drops.push([oreId, qty]);
      if (Math.random() < 0.1) drops.push(['coal', 1]);
      addXP(g.state, 'mining', oreDef?.xp || 5);
      // 地质学家：宝石 50% 成对
      if (oreDef?.gem && g.state.player.skills.mining.prof.includes('geologist') && Math.random() < 0.5) drops.push([oreId, 1]);
    }
    for (const [id, qty] of drops) {
      addItem(g.state, id, qty, 0);
      g.effects.floatText(new THREE.Vector3(x + 0.5, 1, z + 0.5), `+${getItem(id).name} ×${qty}`, '#D8D8E8', 12);
    }
    g.audio.sfx('pickup');
    // 石头出梯：基础 2% + 运气 + 保底
    if (!this.ladder) {
      const stonesLeft = this.nodes.size;
      let chance = 0.02 + Math.max(0, g.state.player.luck) * 0.05 + (stonesLeft === 0 ? 1 : 0) + (this.monsters.length === 0 ? 0.04 : 0);
      if ([12, 32, 52, 72].includes(this.floor)) chance = Math.max(chance, 0.3);
      if (Math.random() < chance) this.revealLadder(x, z);
    }
    g.bus.emit('node-broken', node.type);
    return true;
  }

  // ---- 进入/离开/电梯 ----
  enter(floor) {
    const g = this.game;
    floor = Math.max(1, Math.min(80, floor));
    this.floor = floor;
    g.state.player.scene = 'mine';
    // 隐藏地表世界（矿洞独占渲染）
    if (g.scenes?.worldGroup) g.scenes.worldGroup.visible = false;
    this.genFloor(floor);
    g.player.teleport(this.spawn.x, this.spawn.z);
    g.player.collide = (x, z) => this.collide(x, z);
    g.state.player.stats.deepestMine = Math.max(g.state.player.stats.deepestMine, floor);
    // 电梯解锁（每5层）
    if (floor % 5 === 0) g.state.mine.elevator = Math.max(g.state.mine.elevator, floor);
    g.ui.tutorial(`矿井 第${floor}层 · ${THEMES[themeOf(floor)].name}`, 3000);
    g.bus.emit('mine-enter', floor);
  }
  exit(opts = {}) {
    const { goMountain = true } = opts;
    const g = this.game;
    this.floor = 0;
    g.engine.scene.remove(this.group);
    g.engine.scene.remove(this.torch);
    for (const m of this.monsters) g.engine.scene.remove(m.mesh);
    this.monsters = [];
    g.sky.dome.visible = g.sky.stars.visible = g.sky.sunDisc.visible = g.sky.moonDisc.visible = true;
    if (g.scenes?.worldGroup) g.scenes.worldGroup.visible = true;
    // 恢复地表碰撞（矿洞网格碰撞在出洞后必须交还场景系统，否则玩家寸步难行）
    g.scenes.attachPlayer(g.player);
    if (goMountain) {
      g.state.player.scene = 'mountain';
      g.scenes.switchTo('mountain');
    }
    g.bus.emit('mine-exit');
  }
  descend() {
    if (!this.ladder) return;
    this.game.audio.sfx('close');
    this.enter(this.floor + 1);
  }
  collide(x, z) {
    const gx = Math.floor(x), gz = Math.floor(z);
    if (gx < 0 || gz < 0 || gx >= MW || gz >= MH) return true;
    const v = this.grid[gz * MW + gx];
    return v === 1 || v === 2 || v === 3;
  }
  // 电梯面板（UI 由 menus 触发，这里提供数据）
  elevatorFloors() {
    const max = this.game.state.mine.elevator;
    const out = [];
    for (let f = 5; f <= Math.min(80, max); f += 5) out.push(f);
    return out;
  }
  // 开宝箱
  openChest() {
    const g = this.game;
    if (!this.chest || this.chest.opened) return false;
    this.chest.opened = true;
    const item = this.chest.item;
    addItem(g.state, item, 1, 0);
    g.audio.sfx('catch');
    g.effects.burst(new THREE.Vector3(this.chest.x + 0.5, 0.8, this.chest.z + 0.5), ['#FFD98A', '#FFFFFF'], 16, 2.4);
    g.effects.floatText(new THREE.Vector3(this.chest.x + 0.5, 1.4, this.chest.z + 0.5), `获得 ${getItem(item).name}！`, '#FFD98A', 15);
    if (this.chest.mesh) this.chest.mesh.children[2].visible = false;
    g.ui.refreshToolbar();
    return true;
  }
  // 玩家死亡（战斗/熔岩）
  async playerDied(cause) {
    const g = this.game;
    const lost = Math.min(10000, Math.floor(g.state.player.money * (0.05 + Math.random() * 0.2)));
    if (lost > 0) addMoney(g.state, -lost);
    // 丢物品（工具/武器豁免），最多3件
    const inv = g.state.player.inventory;
    const droppable = [];
    inv.forEach((s, i) => { if (s && getItem(s.id).type !== 'tool' && getItem(s.id).type !== 'weapon') droppable.push(i); });
    const lostItems = [];
    for (let i = 0; i < Math.min(3, droppable.length); i++) {
      const idx = droppable.splice(Math.floor(Math.random() * droppable.length), 1)[0];
      lostItems.push(getItem(inv[idx].id).name + '×' + inv[idx].qty);
      inv[idx] = null;
    }
    g.ui.refreshToolbar();
    this.exit({ goMountain: false });
    await g.daycycle.passOut(`${cause} 你被救回了矿井入口。` + (lost ? ` 损失 ${lost}g。` : '') + (lostItems.length ? ` 丢失：${lostItems.join('、')}` : ''));
    g.state.player.health = Math.round(g.state.player.maxHealth * 0.25);
  }

  // ---- 帧更新 ----
  update(dt, t) {
    if (!this.inMine) return;
    const g = this.game, p = g.player;
    this.swingCd = Math.max(0, this.swingCd - dt);
    this.hurtCd = Math.max(0, this.hurtCd - dt);
    // 火把跟随
    this.torch.position.set(p.pos.x, 1.6, p.pos.z);
    // 交互判定：梯子/宝箱
    const px = Math.floor(p.pos.x), pz = Math.floor(p.pos.z);
    if (this.ladder && px === this.ladder.x && pz === this.ladder.z) this.descend();
    if (this.upLadder && px === this.upLadder.x && pz === this.upLadder.z) {
      g.audio.sfx('close');
      if (this.floor > 1) this.enter(this.floor - 1); else this.exit();
    }
    if (this.chest && !this.chest.opened && Math.abs(p.pos.x - this.chest.x - 0.5) < 1 && Math.abs(p.pos.z - this.chest.z - 0.5) < 1 && g.input.hit('interact')) this.openChest();
    // 怪物 AI
    for (const m of this.monsters) this.updateMonster(m, dt, t);
    // 投射物
    for (const pr of [...this.projectiles]) {
      pr.x += pr.vx * dt; pr.z += pr.vz * dt;
      pr.mesh.position.set(pr.x, 0.5, pr.z);
      pr.life -= dt;
      if (pr.life <= 0 || this.collide(pr.x, pr.z)) { g.engine.scene.remove(pr.mesh); this.projectiles = this.projectiles.filter((x) => x !== pr); continue; }
      if (Math.hypot(pr.x - p.pos.x, pr.z - p.pos.z) < 0.5) {
        g.engine.scene.remove(pr.mesh);
        this.projectiles = this.projectiles.filter((x) => x !== pr);
        this.hurtPlayer(pr.dmg, pr.x, pr.z);
      }
    }
  }
  updateMonster(m, dt, t) {
    const g = this.game, p = g.player;
    m.t += dt; m.cd -= dt; m.flash -= dt;
    const dx = p.pos.x - m.x, dz = p.pos.z - m.z;
    const d = Math.hypot(dx, dz);
    const sp = m.def.speed;
    let mx = 0, mz = 0;
    if (m.def.behavior === 'lurker') {
      if (d < 2.5 && !m.mesh.visible) { m.mesh.visible = true; g.audio.sfx('error'); }
      if (d < 6 && m.mesh.visible) { mx = dx / d * sp; mz = dz / d * sp; }
    } else if (m.def.behavior === 'chaser') {
      if (d < 8) { mx = dx / d * sp; mz = dz / d * sp; }
      else { mx = Math.sin(m.t * 0.7) * sp * 0.3; mz = Math.cos(m.t * 0.5) * sp * 0.3; }
    } else if (m.def.behavior === 'flyer') {
      if (d < 9) { mx = (dx / d) * sp + Math.sin(m.t * 3) * 0.8; mz = (dz / d) * sp + Math.cos(m.t * 2.6) * 0.8; }
      else { mx = Math.sin(m.t) * sp * 0.4; mz = Math.cos(m.t * 1.3) * sp * 0.4; }
    } else if (m.def.behavior === 'jumper') {
      m.jumpT -= dt;
      if (m.jumpT < 0 && d < 7) { m.vx = dx / d * sp * 2.2; m.vz = dz / d * sp * 2.2; m.jumpT = 1.6; g.audio.sfx('swing'); }
    } else if (m.def.behavior === 'shooter') {
      if (d < 4) { mx = -dx / d * sp; mz = -dz / d * sp; }
      else if (d > 8) { mx = dx / d * sp * 0.6; mz = dz / d * sp * 0.6; }
      if (m.cd <= 0 && d < 9) {
        m.cd = 2.4;
        const pr = { x: m.x, z: m.z, vx: dx / d * 5, vz: dz / d * 5, dmg: m.def.atk, life: 3 };
        pr.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshBasicMaterial({ color: '#D88AB8' }));
        pr.mesh.position.set(pr.x, 0.5, pr.z);
        g.engine.scene.add(pr.mesh);
        this.projectiles.push(pr);
        g.audio.sfx('cast');
      }
    }
    // 击退衰减 + 移动
    m.vx *= (1 - dt * 4); m.vz *= (1 - dt * 4);
    const nx = m.x + (mx + m.vx) * dt, nz = m.z + (mz + m.vz) * dt;
    if (!this.collide(nx, m.z)) m.x = nx;
    if (!this.collide(m.x, nz)) m.z = nz;
    m.mesh.position.set(m.x, 0.45 * m.def.size + (m.def.behavior === 'flyer' ? 0.3 + Math.sin(m.t * 4) * 0.1 : 0) + (m.def.behavior === 'jumper' && m.jumpT > 1.2 ? 0.4 : 0), m.z);
    m.mesh.rotation.y = Math.atan2(g.engine.camera.position.x - m.x, g.engine.camera.position.z - m.z);
    // 受击闪白
    m.mesh.material.emissive = m.mesh.material.emissive || new THREE.Color(0);
    m.mesh.material.emissive.setScalar(m.flash > 0 ? 0.8 : 0);
    // 接触伤害
    if (d < 0.7 && this.hurtCd <= 0) this.hurtPlayer(m.def.atk, m.x, m.z);
  }
  hurtPlayer(atk, fromX, fromZ) {
    const g = this.game;
    this.hurtCd = 0.7;
    const eq = g.state.player.equipment || {};
    const def = (getItem(eq.boots || 'boots_leather').def || 0) * (eq.boots ? 1 : 0) + skillLevel(g.state, 'combat') * 0;
    const real = Math.max(1, atk - def);
    const hp = damage(g.state, real);
    g.audio.sfx('hurt');
    g.effects.shakeScreen(0.08);
    g.effects.burst(new THREE.Vector3(g.player.pos.x, 0.8, g.player.pos.z), ['#E84A4A'], 8, 2);
    g.effects.floatText(new THREE.Vector3(g.player.pos.x, 1.3, g.player.pos.z), '-' + real, '#E84A4A', 15);
    // 击退
    const dx = g.player.pos.x - fromX, dz = g.player.pos.z - fromZ;
    const d = Math.hypot(dx, dz) || 1;
    if (!this.collide(g.player.pos.x + dx / d * 0.6, g.player.pos.z)) g.player.pos.x += dx / d * 0.6;
    if (!this.collide(g.player.pos.x, g.player.pos.z + dz / d * 0.6)) g.player.pos.z += dz / d * 0.6;
    if (hp <= 0) this.playerDied('伤重不治。');
  }
  serialize() {}
  deserialize() {}
}
