// 收集包祭坛面板：房间 → 包格子 → 手持献祭 → 奖励展示
import { BUNDLE_ROOMS } from '../data/bundles.js';
import { itemIcon } from './icons.js';
import { getItem } from '../data/items.js';
import { heldItem } from '../core/state.js';

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;

export class BundleUI {
  constructor(game) {
    this.game = game;
    this.el = document.createElement('div');
    this.el.className = 'xg-panel';
    this.el.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:680px;max-width:94vw;max-height:80vh;display:none;z-index:150;padding:0;overflow:hidden`;
    document.getElementById('ui').appendChild(this.el);
    this.roomIdx = 0;
    window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.el.style.display !== 'none') this.hide(); });
  }
  async show() {
    const g = this.game;
    // 先播旧会馆初访过场，再开面板（避免面板与演出叠压导致的"无法退出"）
    if (!g.state.flags.ccUnlocked) {
      g.state.flags.ccUnlocked = true;
      g.bus.emit('cc-visited');
      await g.story.onCCVisit();
      g.quests.bump('cc_visit');
    }
    this.el.style.display = 'block';
    g.clock.pause(true);
    g.player.frozen = true;
    g.audio.sfx('open');
    this.render();
  }
  hide() {
    this.el.style.display = 'none';
    this.game.clock.pause(false);
    this.game.player.frozen = false;
    this.game.audio.sfx('close');
  }
  render() {
    const g = this.game;
    const room = BUNDLE_ROOMS[this.roomIdx];
    const roomDone = g.state.bundles.roomsDone.includes(room.id);
    const tabs = BUNDLE_ROOMS.map((r, i) => {
      const done = g.state.bundles.roomsDone.includes(r.id);
      return `<button data-room="${i}" style="padding:6px 10px;background:${i === this.roomIdx ? '#B87AE8' : '#2A3048'};color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer;font-size:12px">${done ? '★' : ''}${r.name}</button>`;
    }).join('');
    const bundleRows = room.bundles.map((b) => {
      const prog = g.bundles.progress(b.id);
      const done = prog.every(Boolean);
      const slots = b.slots.map((s, si) => {
        const filled = prog[si];
        const icon = s.item ? itemIcon(s.item, s.quality || 0) : null;
        const anyNames = { crop: '任意作物', fish: '任意鱼', forage: '任意觅食物', ore: '任意矿石', artisan: '任意工匠品' };
        return `<div data-bundle="${b.id}" data-slot="${si}" title="${s.item ? getItem(s.item).name : anyNames[s.any]}${s.qty > 1 ? ' ×' + s.qty : ''}${s.quality ? '（需' + ['', '银', '金', '铱'][s.quality] + '星以上）' : ''}"
          style="width:44px;height:44px;background:${filled ? '#3A5A2A' : '#1A1A26'};border:2px solid ${filled ? '#8AE84A' : '#4A5578'};border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative">
          ${filled ? '<span style="color:#8AE84A;font-size:20px">✓</span>' : icon ? `<img src="${icon}" style="width:34px;height:34px;image-rendering:pixelated;opacity:${filled ? 1 : 0.55}">` : `<span style="font-size:9px;color:#8A92B8;text-align:center">${anyNames[s.any]}</span>`}
          ${s.qty > 1 && !filled ? `<span style="position:absolute;right:2px;bottom:0;font-size:10px;color:#fff">×${s.qty}</span>` : ''}
        </div>`;
      }).join('');
      return `<div style="padding:10px;border-bottom:1px solid #2A3048">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:130px;font-size:13px;color:${done ? '#8AE84A' : '#E8E8F0'}">${done ? '√' : ''}${b.name}</div>
          <div style="display:flex;gap:6px">${slots}</div>
          <div style="flex:1;text-align:right;font-size:11px;color:#FFD98A">奖励：${getItem(b.reward.item).name}×${b.reward.qty}</div>
        </div>
      </div>`;
    }).join('');
    const held = heldItem(g.state);
    this.el.innerHTML = `
      <div class="xg-titlebar"><span>汐溪旧会馆 · 修复小镇</span><span class="xg-x" data-xclose>✕</span></div>
      <div style="padding:12px 14px">
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">${tabs}</div>
      <div style="font-size:12px;color:#B8C0D8;margin-bottom:8px">整区奖励：<b style="color:#FFD98A">${room.roomReward.desc}</b>${roomDone ? ' <span style="color:#8AE84A">（已完成）</span>' : ''}</div>
      <div style="overflow:auto;max-height:48vh" class="xg-scroll">${bundleRows}</div>
      <div style="margin-top:10px;font-size:12px;color:#8A92B8">手持：<b style="color:#FFD98A">${held ? getItem(held.id).name : '（空）'}</b> —— 点击格子献祭手持物品（Esc/✕ 关闭）</div>
      </div>`;
    this.el.querySelector('[data-xclose]').onclick = () => this.hide();
    this.el.querySelectorAll('button[data-room]').forEach((btn) => {
      btn.onclick = () => { this.roomIdx = parseInt(btn.dataset.room); this.game.audio.sfx('click'); this.render(); };
    });
    this.el.querySelectorAll('[data-bundle][data-slot]').forEach((cell) => {
      cell.onclick = () => {
        const r = this.game.bundles.contribute(cell.dataset.bundle, parseInt(cell.dataset.slot));
        if (r) this.render(); else this.game.audio.sfx('error');
      };
    });
  }
}
