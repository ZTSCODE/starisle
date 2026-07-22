// 场景管理器（无缝世界版）：区域注册/统一世界坐标/区域切换检测（横幅）/传送切换/碰撞
// 设计文档：docs/design/world.md；无缝化改造：5 区域同坐标系连续行走，切场景仅用于传送（矿洞/图腾/剧情）
import * as THREE from 'three';
import { REGIONS, toWorld, toLocal, regionAt } from './seamless.js';
import { collisionAt, collisionInfo } from './builder.js';

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.scenes = new Map();
    this.current = null;          // 当前所在区域（仅逻辑标签，渲染常开）
    this.worldGroup = new THREE.Group(); // 全部区域 + 农场系统层的容器（矿洞隐藏用）
    game.engine.scene.add(this.worldGroup);
    this.switching = false;
    this.cooldown = 0;
    this.bannerEl = document.createElement('div');
    this.bannerEl.style.cssText = 'position:fixed;left:50%;top:24%;transform:translateX(-50%);padding:10px 38px;'
      + 'background:rgba(20,22,34,0.78);border:2px solid #FFD98A;border-radius:6px;color:#FFE8B0;'
      + 'font-size:26px;letter-spacing:8px;text-shadow:2px 2px 0 #000;opacity:0;transition:opacity .45s;'
      + 'pointer-events:none;z-index:150;white-space:nowrap';
    document.getElementById('ui').appendChild(this.bannerEl);
    game.bus.on('scene-change', (e) => { if (e && e.target) this.switchTo(e.target, e.spawn); });
  }

  register(scene) {
    const r = REGIONS[scene.id];
    if (r) scene.group.position.set(r.ox, 0, r.oz);
    this.scenes.set(scene.id, scene);
    this.worldGroup.add(scene.group);
    return scene;
  }
  get(id) { return this.scenes.get(id); }
  get currentId() { return this.current ? this.current.id : null; }

  // 世界坐标 → 区域地面类型
  groundType(x, z) {
    const id = typeof x === 'string' ? x : regionAt(this.scenes, x, z);
    if (typeof x !== 'string') {
      // 栈桥甲板豁免：延伸到海面（区域边界外）的桥段仍可行走，统一碰撞中 source 为 pier-deck
      if (!id) return collisionInfo(x, z).source === 'pier-deck' ? 'walk' : 'blocked';
      const sc = this.scenes.get(id);
      const r = REGIONS[id];
      const t = sc.groundType(x - r.ox, z - r.oz);
      if ((t === 'blocked' || t === 'water') && collisionInfo(x, z).source === 'pier-deck') return 'walk';
      return t;
    }
    const sc = this.scenes.get(id);
    if (!sc) return 'blocked';
    const r = REGIONS[id];
    return sc.groundType(x - r.ox, z - r.oz);
  }

  attachPlayer(player) {
    player.collide = (x, z) => {
      const t = this.groundType(Math.floor(x), Math.floor(z));
      return t === 'water' || t === 'blocked';
    };
  }

  // 最近交互点（跨全区域，坐标转世界系）
  nearestInteractable(x, z) {
    let best = null, bd = Infinity;
    for (const [id, sc] of this.scenes) {
      const r = REGIONS[id];
      for (const it of sc.interactables) {
        if (it.when && !it.when(this.game)) continue;
        const d = Math.hypot(x - (it.x + r.ox), z - (it.z + r.oz));
        if (d < it.r && d < bd) { best = it; bd = d; }
      }
    }
    return best;
  }

  // 传送切换（矿洞/图腾/剧情/调试）：世界坐标落位 + 横幅 + scene-changed
  async switchTo(id, spawn) {
    if (this.switching) return false;
    const next = this.scenes.get(id);
    if (!next) return false;
    this.switching = true;
    const g = this.game;
    const wasFrozen = g.player ? g.player.frozen : false;
    if (g.player) g.player.frozen = true;
    const r = REGIONS[id];
    const sp = spawn || next.defaultSpawn || [next.W / 2, next.H / 2];
    const wx = sp[0] + r.ox, wz = sp[1] + r.oz;
    // 跨区域传送走短渐隐（0.25s），避免黑屏感
    await this.quickFade(true);
    if (g.player) g.player.teleport(wx, wz);
    this.current = next;
    g.state.player.scene = id;
    g.state.player.x = wx; g.state.player.z = wz;
    this.cooldown = 0.5;
    await this.quickFade(false);
    if (g.player) g.player.frozen = wasFrozen;
    this.showBanner(next.name);
    g.bus.emit('scene-changed', id);
    this.switching = false;
    return true;
  }
  async quickFade(on) {
    const g = this.game;
    g.ui.fadeEl.style.transition = 'opacity .22s';
    g.ui.fadeEl.style.opacity = on ? '0.85' : '0';
    await new Promise((r) => setTimeout(r, 240));
    g.ui.fadeEl.style.transition = 'opacity .5s';
  }
  // 直接落位初始场景（开场用，无演出）
  enterInitial(id, spawn) {
    const sc = this.scenes.get(id);
    this.current = sc;
    const r = REGIONS[id];
    const sp = spawn || sc.defaultSpawn;
    this.game.state.player.scene = id;
    this.game.player.teleport(sp[0] + r.ox, sp[1] + r.oz);
  }
  showBanner(name) {
    this.bannerEl.textContent = name;
    this.bannerEl.style.opacity = '1';
    clearTimeout(this._bt);
    this._bt = setTimeout(() => { this.bannerEl.style.opacity = '0'; }, 1600);
  }
  // 每帧：区域动画 + 跨区域检测（无缝，不黑屏，仅横幅提示）
  update(dt, t) {
    const g = this.game;
    for (const sc of this.scenes.values()) if (sc.update) sc.update(dt, t);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.switching || !g.player) return;
    const id = regionAt(this.scenes, g.player.pos.x, g.player.pos.z);
    if (id && this.current && id !== this.current.id && this.cooldown <= 0) {
      this.current = this.scenes.get(id);
      g.state.player.scene = id;
      this.cooldown = 0.5;
      this.showBanner(this.current.name);
      g.bus.emit('scene-changed', id);
    }
  }
  setSeason(s) {
    for (const sc of this.scenes.values()) if (sc.setSeason) sc.setSeason(s);
  }
}
