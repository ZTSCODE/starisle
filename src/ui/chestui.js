// 箱子存储：放置宝箱 → 打开 36 格双栏互转
import * as THREE from 'three';
import { getItem } from '../data/items.js';
import { itemIcon } from './icons.js';
import { removeItem, countItem } from '../core/state.js';

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;

export class Chests {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group();
    game.engine.scene.add(this.group);
    this.meshes = new Map();
    this.openKey = null;
    this.buildUI();
    if (!game.state.chests) game.state.chests = {};
    this.syncAll();
  }
  key(x, z) { return `${game.state.player.scene}:${x},${z}`; }
  // 放置（手持 chest 使用）
  place(x, z) {
    const g = this.game;
    if (this.at(x, z)) return false;
    if (!removeItem(g.state, 'chest', 1)) return false;
    g.state.chests[this.key(x, z)] = { x, z, items: new Array(36).fill(null), color: 0 };
    this.syncChest(x, z);
    g.audio.sfx('plant');
    return true;
  }
  at(x, z) { return this.game.state.chests[this.key(x, z)]; }
  syncAll() {
    for (const k of Object.keys(this.game.state.chests)) {
      const c = this.game.state.chests[k];
      if (k.startsWith(this.game.state.player.scene + ':')) this.syncChest(c.x, c.z);
    }
  }
  syncChest(x, z) {
    const k = this.key(x, z);
    if (this.meshes.has(k)) return;
    const g2 = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), new THREE.MeshLambertMaterial({ color: '#8A5A2A', flatShading: true }));
    body.position.y = 0.22; body.castShadow = true;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.52), new THREE.MeshLambertMaterial({ color: '#A87A3E', flatShading: true }));
    lid.position.y = 0.5;
    g2.add(body, lid);
    g2.position.set(x + 0.5, 0, z + 0.5);
    this.meshes.set(k, g2);
    this.group.add(g2);
  }
  // ---- UI ----
  buildUI() {
    this.el = document.createElement('div');
    this.el.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:680px;max-width:94vw;display:none;z-index:150;padding:16px;${PANEL}`;
    document.getElementById('ui').appendChild(this.el);
    window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.openKey) this.hide(); });
  }
  open(x, z) {
    const g = this.game;
    const chest = this.at(x, z);
    if (!chest) return false;
    this.openKey = this.key(x, z);
    this.el.style.display = 'block';
    g.clock.pause(true);
    g.player.frozen = true;
    g.audio.sfx('open');
    this.render();
    return true;
  }
  hide() {
    this.openKey = null;
    this.el.style.display = 'none';
    this.game.clock.pause(false);
    this.game.player.frozen = false;
    this.game.audio.sfx('close');
  }
  // 通用移动：src→dst 尽量堆叠/填空
  moveStack(srcArr, srcIdx, dstArr, dstSize, all = false) {
    const s = srcArr[srcIdx];
    if (!s) return false;
    const it = getItem(s.id);
    let qty = s.qty;
    for (let i = 0; i < dstSize && qty > 0; i++) {
      const d = dstArr[i];
      if (d && d.id === s.id && d.quality === s.quality && d.qty < it.stack) {
        const add = Math.min(qty, it.stack - d.qty);
        d.qty += add; qty -= add;
      }
    }
    for (let i = 0; i < dstSize && qty > 0; i++) {
      if (!dstArr[i]) { const add = Math.min(qty, it.stack); dstArr[i] = { id: s.id, qty: add, quality: s.quality }; qty -= add; }
    }
    const moved = s.qty - qty;
    s.qty = qty;
    if (s.qty <= 0) srcArr[srcIdx] = null;
    if (qty > 0) this.game.effects.floatText(this.game.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), '放不下了', '#E84A4A', 12);
    return moved > 0;
  }
  render() {
    const g = this.game;
    const chest = g.state.chests[this.openKey];
    if (!chest) return this.hide();
    const inv = g.state.player.inventory;
    const grid = (arr, size, prefix) => {
      let html = `<div style="display:grid;grid-template-columns:repeat(9,48px);gap:4px">`;
      for (let i = 0; i < size; i++) {
        const s = arr[i];
        html += `<div data-${prefix}="${i}" style="width:48px;height:48px;background:#1A1A26;border:2px solid #3A4260;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative">
          ${s ? `<img src="${itemIcon(s.id, s.quality)}" style="width:38px;height:38px;image-rendering:pixelated;pointer-events:none">` : ''}
          ${s && s.qty > 1 ? `<span style="position:absolute;right:2px;bottom:0;font-size:10px;color:#fff;text-shadow:1px 1px 0 #000">${s.qty}</span>` : ''}
        </div>`;
      }
      return html + '</div>';
    };
    this.el.innerHTML = `
      <div style="font-size:15px;color:#FFD98A;margin-bottom:8px">▣ 宝箱 <span style="font-size:11px;color:#8A92B8">点击物品互转 · Esc 关闭</span></div>
      ${grid(chest.items, 36, 'c')}
      <div style="font-size:13px;color:#8A92B8;margin:12px 0 6px">背包</div>
      ${grid(inv, g.state.player.invSize, 'p')}`;
    this.el.querySelectorAll('[data-c]').forEach((cell) => {
      cell.onclick = () => {
        this.moveStack(chest.items, parseInt(cell.dataset.c), inv, g.state.player.invSize, true);
        this.game.audio.sfx('click');
        this.game.ui.refreshToolbar();
        this.render();
      };
    });
    this.el.querySelectorAll('[data-p]').forEach((cell) => {
      cell.onclick = () => {
        this.moveStack(inv, parseInt(cell.dataset.p), chest.items, 36, true);
        this.game.audio.sfx('click');
        this.game.ui.refreshToolbar();
        this.render();
      };
    });
  }
  serialize() {}
  deserialize() {}
}
