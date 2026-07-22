// 钓鱼系统：蓄力抛竿 → 等待咬钩 → 张力条遛鱼小游戏 → 结算（品质/尺寸/图鉴/传说鱼）
// 设计文档：docs/design/fishing.md
import * as THREE from 'three';
import { FISH } from '../data/fish.js';
import { getItem, registerItem } from '../data/items.js';
import { addItem, removeItem, countItem, useEnergy, addXP, skillLevel, heldItem, hasSpace } from '../core/state.js';
import { makeTexture, shade } from '../render/textures.js';

registerItem('driftwood', '浮木', 'junk', 0, {});
registerItem('broken_glasses', '破眼镜', 'junk', 0, {});
registerItem('soggy_newspaper', '湿报纸', 'junk', 0, {});
registerItem('geode', '晶洞', 'misc', 50, {});
if (!getItemSafe('bait')) registerItem('bait', '鱼饵', 'bait', 5, {});
function getItemSafe(id) { try { return getItem(id); } catch { return null; } }

const WAIT_BASE = [0.6, 10]; // 咬钩等待秒数范围（鱼饵-50%，上限 10s 内必咬钩）

export class Fishing {
  constructor(game) {
    this.game = game;
    this.phase = 'idle'; // idle/casting/waiting/biteWindow/minigame/result
    this.power = 0; this.powerDir = 1;
    this.bobber = null; this.bobberPos = new THREE.Vector3();
    this.waitT = 0; this.biteAt = 0; this.biteWindow = 0;
    this.fish = null;
    this.mg = null; // minigame state
    this.zoneProvider = null; // (scene,x,z) => 'river'|'lake'|'sea'|'mine'|null
    this.buildBobber();
    this.buildUI();
    this.ripple = [];
  }
  buildBobber() {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshLambertMaterial({ color: '#E84A4A', emissive: 0xe84a4a, emissiveIntensity: 0.4 }));
    top.position.y = 0.07;
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshLambertMaterial({ color: '#F0F0F0' }));
    g.add(top, bottom);
    g.visible = false;
    this.game.engine.scene.add(g);
    this.bobber = g;
    // 鱼线：竿尖 → 弧垂中点 → 浮标（每帧更新端点）
    this.lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
    ]);
    this.line = new THREE.Line(this.lineGeom, new THREE.LineBasicMaterial({ color: '#E8E8D8', transparent: true, opacity: 0.75 }));
    this.line.visible = false;
    this.line.frustumCulled = false;
    this.game.engine.scene.add(this.line);
  }
  updateLine() {
    const p = this.game.player;
    // 竿尖：角色手部高度 + 面朝方向前伸
    const tip = new THREE.Vector3(
      p.pos.x + Math.sin(p.facing) * 0.45,
      p.pos.y + 1.35,
      p.pos.z + Math.cos(p.facing) * 0.45,
    );
    const end = this.bobber.position;
    const mid = tip.clone().lerp(end, 0.5); mid.y -= 0.18; // 自然弧垂
    const pos = this.lineGeom.attributes.position;
    pos.setXYZ(0, tip.x, tip.y, tip.z);
    pos.setXYZ(1, mid.x, mid.y, mid.z);
    pos.setXYZ(2, end.x, end.y + 0.06, end.z);
    pos.needsUpdate = true;
  }
  buildUI() {
    const ui = document.getElementById('ui');
    // 蓄力条
    this.powerBar = document.createElement('div');
    this.powerBar.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);width:220px;height:14px;background:#1A1A26;border:2px solid #4A5578;border-radius:4px;display:none;z-index:60';
    this.powerBar.innerHTML = '<div style="height:100%;width:0%;background:linear-gradient(90deg,#8AE84A,#FFD98A,#E84A4A);border-radius:2px"></div>';
    ui.appendChild(this.powerBar);
    // 小游戏面板（canvas）
    this.mgCanvas = document.createElement('canvas');
    this.mgCanvas.width = 260; this.mgCanvas.height = 460;
    this.mgCanvas.style.cssText = 'position:fixed;right:60px;top:50%;transform:translateY(-50%);background:rgba(16,18,30,0.92);border:2px solid #4A5578;border-radius:8px;display:none;z-index:60';
    ui.appendChild(this.mgCanvas);
    this.mgCtx = this.mgCanvas.getContext('2d');
  }
  zoneAt(x, z) {
    return this.zoneProvider ? this.zoneProvider(this.game.state.player.scene, x, z) : null;
  }
  // 在面朝方向的可抛范围内找水：距离 1.2~6.5 米、左右 ±30° 锥形扫描，返回 {zone, dir} 或 null
  findWater() {
    const g = this.game, p = g.player;
    for (let d = 1.2; d <= 6.5; d += 0.4) {
      for (const off of [0, -0.26, 0.26, -0.52, 0.52]) {
        const a = p.facing + off;
        const z = this.zoneAt(Math.floor(p.pos.x + Math.sin(a) * d), Math.floor(p.pos.z + Math.cos(a) * d));
        if (z) return { zone: z, dir: a };
      }
    }
    return null;
  }
  zone() {
    return this.findWater()?.zone || null;
  }
  canFish() {
    const held = heldItem(this.game.state);
    return held && held.id === 'fishingrod' && this.phase === 'idle' && !!this.findWater();
  }
  // ---- 流程 ----
  startCast() {
    if (!this.canFish()) return false;
    this.phase = 'casting';
    this.power = 0; this.powerDir = 1;
    this.powerBar.style.display = 'block';
    this.game.player.frozen = true; // 钓鱼全程锁定移动，收竿/结算时解除
    return true;
  }
  releaseCast() {
    if (this.phase !== 'casting') return;
    const g = this.game;
    // 抛竿距离：基础3格 + 蓄力×3 + 等级加成
    const lvl = skillLevel(g.state, 'fishing');
    let dist = 2 + this.power * 3 + Math.floor(lvl / 4) * 0.5;
    const p = g.player;
    // 浮标必须落在水里：沿面朝锥形范围（±30°）从目标距离逐级回缩找水面，找不到则抛竿失败
    let bx = 0, bz = 0, ok = false;
    outer:
    for (let d = dist; d >= 1.2; d -= 0.4) {
      for (const off of [0, -0.26, 0.26, -0.52, 0.52]) {
        const a = p.facing + off;
        const cx = p.pos.x + Math.sin(a) * d, cz = p.pos.z + Math.cos(a) * d;
        if (this.zoneAt(Math.floor(cx), Math.floor(cz))) { bx = cx; bz = cz; ok = true; break outer; }
      }
    }
    if (!ok) {
      this.phase = 'idle';
      this.powerBar.style.display = 'none';
      g.player.frozen = false;
      g.ui?.tutorial?.('浮标得落在水里', 1600);
      return;
    }
    this.phase = 'waiting';
    this.powerBar.style.display = 'none';
    useEnergy(g.state, Math.max(7, 8 - lvl * 0.1));
    this.bobberPos.set(bx, 0.05, bz);
    this.bobber.position.copy(this.bobberPos);
    this.bobber.visible = true;
    g.audio.sfx('cast');
    setTimeout(() => { g.audio.sfx('splash'); g.effects.burst(this.bobberPos, ['#5FB4E8', '#FFFFFF'], 10, 1.6); this.spawnRipple(); }, 280);
    p.char.swing();
    g.fpHand?.swing?.(); // 第一人称抛竿挥动（与第三人称精灵同步）
    // 咬钩时间：0.6-30s 随机，鱼饵减半，等级每级-0.25s
    const bait = countItem(g.state, 'bait') > 0;
    let wait = WAIT_BASE[0] + Math.random() * (WAIT_BASE[1] - WAIT_BASE[0]);
    wait *= bait ? 0.5 : 1;
    wait = Math.min(10, Math.max(0.6, wait - lvl * 0.25));
    this.waitT = 0;
    this.biteAt = wait;
    this.fish = this.rollFish();
    if (bait) removeItem(g.state, 'bait', 1);
  }
  rollFish() {
    const g = this.game, zone = this.zone();
    const cands = FISH.filter((f) => {
      if (f.zone !== zone) return false;
      if (f.seasons.length && !f.seasons.includes(g.clock.season)) return false;
      if (f.weather.length && !f.weather.includes(g.state.weather.today)) return false;
      if (f.time.length && (g.clock.minute < f.time[0] || g.clock.minute > f.time[1])) return false;
      if (f.legendary) {
        if (g.state.codex.fish[f.id]) return false; // 每存档限1
        if (f.reqLevel && skillLevel(g.state, 'fishing') < f.reqLevel) return false;
      }
      return true;
    });
    if (!cands.length || Math.random() < 0.12) return { junk: true }; // 12% 垃圾
    // 难度加权：运气提高高难度概率
    const luck = g.state.player.luck;
    const weights = cands.map((f) => 1 + (f.difficulty / 110) * (luck > 0 ? luck * 8 : 1));
    let sum = weights.reduce((a, b) => a + b, 0), r = Math.random() * sum;
    for (let i = 0; i < cands.length; i++) { r -= weights[i]; if (r <= 0) return cands[i]; }
    return cands[cands.length - 1];
  }
  onBite() {
    const g = this.game;
    this.phase = 'biteWindow';
    this.biteWindow = 0.8; // 反应窗口 ≈0.8s（调研值）
    g.audio.sfx('bite');
    g.effects.floatText(this.bobberPos.clone().add(new THREE.Vector3(0, 1, 0)), '!', '#FFD98A', 26);
    g.effects.burst(this.bobberPos, ['#5FB4E8', '#FFFFFF'], 8, 1.4);
  }
  hook() {
    const g = this.game;
    if (this.phase === 'waiting') { // 提前收竿
      this.cancel('收竿太早了');
      return;
    }
    if (this.phase !== 'biteWindow') return;
    if (this.fish.junk) { this.catchJunk(); return; }
    // 进入遛鱼小游戏
    this.phase = 'minigame';
    const lvl = skillLevel(g.state, 'fishing');
    const trackH = 380;
    this.mg = {
      trackH,
      barH: 70 + lvl * 6,             // 绿条高度（96px@0级 等比缩放）
      barY: trackH / 2, barV: 0,
      fishY: trackH / 2, fishV: 0, fishTarget: trackH / 2, fishT: 0,
      progress: 0.25, perfect: true, inZone: false, time: 0,
    };
    this.mgCanvas.style.display = 'block';
    g.clock.pause(true);
    g.player.frozen = true;
  }
  cancel(msg) {
    this.phase = 'idle';
    this.bobber.visible = false;
    this.powerBar.style.display = 'none';
    this.mgCanvas.style.display = 'none';
    this.game.clock.pause(false);
    this.game.player.frozen = false;
    if (msg) this.game.effects.floatText(this.game.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), msg, '#B8C0D8', 12);
  }
  catchJunk() {
    const g = this.game;
    const junk = ['driftwood', 'broken_glasses', 'soggy_newspaper'][Math.floor(Math.random() * 3)];
    addItem(g.state, junk, 1, 0);
    g.audio.sfx('escape');
    g.effects.floatText(this.bobberPos.clone().add(new THREE.Vector3(0, 1, 0)), `钓到了${getItem(junk).name}…`, '#8A92B8', 13);
    addXP(g.state, 'fishing', 2);
    this.cancel();
  }
  finishCatch(escaped) {
    const g = this.game, f = this.fish, mg = this.mg;
    this.mgCanvas.style.display = 'none';
    this.bobber.visible = false;
    g.clock.pause(false);
    g.player.frozen = false;
    this.phase = 'idle';
    if (escaped) {
      g.audio.sfx('escape');
      g.effects.floatText(this.bobberPos.clone().add(new THREE.Vector3(0, 1, 0)), '鱼脱钩了…', '#8A92B8', 13);
      return;
    }
    // 品质：完美垂钓升1档；基础按抛竿力度
    let q = this.power > 0.85 ? 1 : 0;
    if (mg.perfect) q = Math.min(3, q + 1);
    if (f.legendary) q = 3;
    const size = Math.round((20 + f.difficulty * 1.2) * (0.85 + Math.random() * 0.4));
    addItem(g.state, f.id, 1, q);
    const xp = Math.round((f.xp + f.difficulty * 0.1) * (mg.perfect ? 2.4 : 1));
    addXP(g.state, 'fishing', xp);
    g.state.player.stats.fished++;
    // 图鉴
    const rec = g.state.codex.fish[f.id] || (g.state.codex.fish[f.id] = { count: 0, maxSize: 0 });
    rec.count++;
    rec.maxSize = Math.max(rec.maxSize, size);
    g.audio.sfx('catch');
    g.effects.burst(this.bobberPos, ['#FFD98A', '#5FB4E8', '#FFFFFF'], 16, 2.4);
    g.effects.floatText(this.bobberPos.clone().add(new THREE.Vector3(0, 1.4, 0)),
      `${f.name} ${size}cm${q ? ' ★' + ['', '银', '金', '铱'][q] : ''}${mg.perfect ? ' 完美!' : ''}`,
      f.legendary ? '#B87AE8' : q >= 2 ? '#FFD98A' : '#FFFFFF', f.legendary ? 18 : 15);
    if (f.legendary) g.ui.tutorial(`★ 传说之鱼「${f.name}」！全镇都会听说这件事。`, 6000);
    g.bus.emit('fish-caught', { id: f.id, quality: q, size, perfect: mg.perfect, legendary: !!f.legendary });
    g.ui.refreshToolbar();
    this.fish = null;
  }
  spawnRipple() {
    // 涟漪环
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.16, 16),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(this.bobberPos);
    this.game.engine.scene.add(ring);
    this.ripple.push({ mesh: ring, t: 0 });
  }
  // ---- 帧更新 ----
  update(dt) {
    const g = this.game;
    // 鱼线跟随浮标显隐，并逐帧更新端点
    this.line.visible = this.bobber.visible;
    if (this.line.visible) this.updateLine();
    // 涟漪
    for (const r of [...this.ripple]) {
      r.t += dt;
      r.mesh.scale.setScalar(1 + r.t * 6);
      r.mesh.material.opacity = Math.max(0, 0.7 - r.t * 1.1);
      if (r.t > 0.8) { g.engine.scene.remove(r.mesh); this.ripple = this.ripple.filter((x) => x !== r); }
    }
    if (this.phase === 'casting') {
      this.power += this.powerDir * dt * 1.6;
      if (this.power > 1) { this.power = 1; this.powerDir = -1; }
      if (this.power < 0) { this.power = 0; this.powerDir = 1; }
      this.powerBar.firstElementChild.style.width = (this.power * 100).toFixed(0) + '%';
      if (!g.input.mouse.down && !g.input.down('use')) this.releaseCast();
    } else if (this.phase === 'waiting') {
      this.waitT += dt;
      this.bobber.position.y = 0.05 + Math.sin(this.waitT * 2.4) * 0.03;
      if (this.waitT >= this.biteAt) {
        this.bobber.position.y = -0.03;
        this.onBite();
      }
    } else if (this.phase === 'biteWindow') {
      this.biteWindow -= dt;
      this.bobber.position.y = -0.03 + Math.sin(this.biteWindow * 30) * 0.02;
      if (this.biteWindow <= 0) this.cancel('鱼跑掉了…');
    } else if (this.phase === 'minigame') {
      this.updateMinigame(dt);
    }
  }
  updateMinigame(dt) {
    const g = this.game, mg = this.mg, f = this.fish;
    mg.time += dt;
    // 绿条物理：按住上升，松开下落
    const thrust = (g.input.mouse.down || g.input.down('use')) ? -1400 : 1100;
    mg.barV += thrust * dt;
    mg.barV *= (1 - dt * 4);
    mg.barY += mg.barV * dt;
    mg.barY = Math.max(mg.barH / 2, Math.min(mg.trackH - mg.barH / 2, mg.barY));
    // 鱼 AI（按行为类型）
    mg.fishT -= dt;
    if (mg.fishT <= 0) {
      const speed = 30 + f.difficulty * 1.1;
      if (f.behavior === 'dart') { mg.fishTarget = Math.random() * mg.trackH; mg.fishT = 0.25 + Math.random() * 0.5; }
      else if (f.behavior === 'smooth') { mg.fishTarget = mg.trackH / 2 + Math.sin(mg.time * 1.4) * mg.trackH * 0.35; mg.fishT = 0.4; }
      else if (f.behavior === 'sinker') { mg.fishTarget = mg.trackH * (0.55 + Math.random() * 0.4); mg.fishT = 0.5 + Math.random() * 0.6; }
      else if (f.behavior === 'floater') { mg.fishTarget = mg.trackH * (0.05 + Math.random() * 0.4); mg.fishT = 0.5 + Math.random() * 0.6; }
      else { mg.fishTarget = Math.random() * mg.trackH; mg.fishT = 0.5 + Math.random() * 0.8; }
      mg.fishSpeed = speed;
    }
    const dv = mg.fishTarget - mg.fishY;
    mg.fishY += Math.sign(dv) * Math.min(Math.abs(dv), (mg.fishSpeed || 60) * dt);
    // 进度
    mg.inZone = Math.abs(mg.fishY - mg.barY) < mg.barH / 2 + 8;
    if (!mg.inZone) mg.perfect = false;
    mg.progress += (mg.inZone ? 0.3 : -0.22) * dt;
    mg.progress = Math.max(0, Math.min(1, mg.progress));
    if (g.input.hit('menu')) { this.cancel(); g.clock.pause(false); return; }
    if (mg.progress >= 1) this.finishCatch(false);
    else if (mg.progress <= 0 && mg.time > 1) this.finishCatch(true);
    else if (mg.time > 60) this.finishCatch(true);
    else this.drawMinigame();
  }
  drawMinigame() {
    const c = this.mgCtx, mg = this.mg;
    const W = 260, H = 460, tx = 110, tw = 40, ty = 40;
    c.clearRect(0, 0, W, H);
    // 标题
    c.fillStyle = '#E8E8F0'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center';
    c.fillText(this.fish.legendary ? '★ ' + this.fish.name : this.fish.name, W / 2, 24);
    // 轨道
    c.fillStyle = '#0E1018'; c.fillRect(tx, ty, tw, mg.trackH);
    c.strokeStyle = '#4A5578'; c.lineWidth = 2; c.strokeRect(tx, ty, tw, mg.trackH);
    // 绿条
    const gy = ty + mg.trackH - mg.barY - mg.barH / 2;
    c.fillStyle = mg.inZone ? 'rgba(138,232,74,0.85)' : 'rgba(90,160,60,0.7)';
    c.fillRect(tx + 3, gy, tw - 6, mg.barH);
    // 鱼图标
    const fy = ty + mg.trackH - mg.fishY;
    c.fillStyle = this.fish.legendary ? '#B87AE8' : '#5FB4E8';
    c.beginPath();
    c.moveTo(tx + tw / 2 - 10, fy); c.lineTo(tx + tw / 2 + 6, fy - 6); c.lineTo(tx + tw / 2 + 10, fy); c.lineTo(tx + tw / 2 + 6, fy + 6);
    c.closePath(); c.fill();
    c.fillStyle = '#0E1018'; c.fillRect(tx + tw / 2 + 3, fy - 2, 2, 2);
    // 进度条
    c.fillStyle = '#1A1A26'; c.fillRect(tx + tw + 14, ty, 12, mg.trackH);
    c.fillStyle = mg.progress > 0.6 ? '#8AE84A' : mg.progress > 0.3 ? '#FFD98A' : '#E84A4A';
    c.fillRect(tx + tw + 14, ty + mg.trackH * (1 - mg.progress), 12, mg.trackH * mg.progress);
    c.strokeStyle = '#4A5578'; c.strokeRect(tx + tw + 14, ty, 12, mg.trackH);
    // 提示
    c.fillStyle = '#8A92B8'; c.font = '12px sans-serif';
    c.fillText('按住左键/F 上升，松开下落', W / 2, H - 30);
    if (mg.perfect) { c.fillStyle = '#FFD98A'; c.fillText('完美垂钓中！', W / 2, H - 12); }
  }
  serialize() {}
  deserialize() {}
}
