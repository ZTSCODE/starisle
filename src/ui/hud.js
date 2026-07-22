// HUD：时钟/日期/金钱、体力/生命条、快捷栏、过场渐隐、结算面板
import { itemIcon } from './icons.js';
import { getItem } from '../data/items.js';
import { SEASON_CN } from '../core/time.js';

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;

export class HUD {
  constructor(game) {
    this.game = game;
    const ui = document.getElementById('ui');
    this.root = document.createElement('div');
    ui.appendChild(this.root);

    // 右上：时钟/日期/金钱
    this.clockPanel = document.createElement('div');
    this.clockPanel.style.cssText = `position:fixed;top:12px;right:12px;padding:8px 14px;text-align:right;${PANEL}`;
    this.root.appendChild(this.clockPanel);
    // 右上时钟下方：置顶任务追踪（任务日志可切换置顶，默认第一个进行中任务）
    this.questHint = document.createElement('div');
    this.questHint.id = 'quest-pin-hint';
    this.questHint.style.cssText = `position:fixed;top:118px;right:12px;max-width:240px;padding:8px 12px;display:none;font-size:12px;text-align:left;${PANEL}`;
    this.root.appendChild(this.questHint);
    // 右下：体力/生命
    this.bars = document.createElement('div');
    this.bars.style.cssText = `position:fixed;right:12px;bottom:12px;width:210px;padding:10px;${PANEL}`;
    this.bars.innerHTML = `
      <div style="margin-bottom:6px"><span style="font-size:12px;color:#8AE84A">体力</span>
        <div style="height:10px;background:#1A1A26;border:1px solid #4A5578;border-radius:3px"><div id="hud-energy" style="height:100%;width:100%;background:linear-gradient(90deg,#4AA84A,#8AE84A);border-radius:3px;transition:width .25s"></div></div></div>
      <div><span style="font-size:12px;color:#E86A6A">生命</span>
        <div style="height:10px;background:#1A1A26;border:1px solid #4A5578;border-radius:3px"><div id="hud-health" style="height:100%;width:100%;background:linear-gradient(90deg,#B83A3A,#E86A6A);border-radius:3px;transition:width .25s"></div></div></div>
      <div id="hud-money" style="margin-top:6px;text-align:right;color:#FFD98A;font-weight:bold">500 g</div>`;
    this.root.appendChild(this.bars);
    // 快捷栏
    this.toolbar = document.createElement('div');
    this.toolbar.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:4px;padding:6px;' + PANEL;
    this.slots = [];
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('div');
      s.style.cssText = 'width:44px;height:44px;background:#1A1A26;border:2px solid #3A4260;border-radius:4px;position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center';
      s.innerHTML = `<img style="width:36px;height:36px;image-rendering:pixelated;display:none"><span style="position:absolute;right:2px;bottom:0;font-size:11px;color:#fff;text-shadow:1px 1px 0 #000"></span><span style="position:absolute;left:3px;top:1px;font-size:9px;color:#8A92B8">${(i + 1) % 10}</span>`;
      s.onclick = () => { this.game.state.player.toolbarSel = i; this.refreshToolbar(); this.game.audio.sfx('click'); };
      // 触屏：一根手指按住摇杆时第二指点击不触发 click（移动端兼容事件限制），用 touchstart 直接选中
      s.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.state.player.toolbarSel = i; this.refreshToolbar(); this.game.audio.sfx('click'); }, { passive: false });
      this.toolbar.appendChild(s);
      this.slots.push(s);
    }
    this.root.appendChild(this.toolbar);
    // 选中物品名浮现
    this.heldLabel = document.createElement('div');
    this.heldLabel.style.cssText = 'position:fixed;left:50%;bottom:66px;transform:translateX(-50%);color:#FFD98A;font-size:13px;text-shadow:1px 1px 0 #000;opacity:0;transition:opacity .8s;pointer-events:none';
    this.root.appendChild(this.heldLabel);
    // 交互提示
    this.interactTip = document.createElement('div');
    this.interactTip.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);padding:4px 12px;background:rgba(20,22,34,0.85);border:1px solid #FFD98A;border-radius:4px;color:#FFD98A;font-size:13px;display:none';
    this.root.appendChild(this.interactTip);
    // 渐隐遮罩
    this.fadeEl = document.createElement('div');
    this.fadeEl.style.cssText = 'position:fixed;inset:0;background:#05050C;opacity:0;pointer-events:none;transition:opacity .5s;z-index:200';
    document.getElementById('ui').appendChild(this.fadeEl);
    // 中央面板（结算/提示）
    this.centerPanel = document.createElement('div');
    this.centerPanel.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);min-width:340px;max-width:520px;padding:18px;display:none;z-index:210;${PANEL}`;
    document.getElementById('ui').appendChild(this.centerPanel);
    // 教学提示条
    this.tutBar = document.createElement('div');
    this.tutBar.style.cssText = `position:fixed;left:50%;top:14px;transform:translateX(-50%);padding:8px 18px;display:none;z-index:100;${PANEL}`;
    this.root.appendChild(this.tutBar);

    window.addEventListener('keydown', (e) => {
      if (e.code.startsWith('Digit')) {
        const n = parseInt(e.code.slice(5));
        this.game.state.player.toolbarSel = (n + 9) % 10;
        this.refreshToolbar(true);
      }
    });
    this.refreshToolbar();
    this.refreshQuestHint();
  }
  // 置顶任务追踪：由 quests 系统在新增/进度/完成/过期/读档时调用
  refreshQuestHint() {
    const g = this.game, qs = g.state.quests;
    if (!qs || !this.questHint) return;
    const q = qs.active.find((x) => x.id === qs.pinned) || qs.active[0];
    if (!q) { this.questHint.style.display = 'none'; return; }
    const left = q.expires != null ? ` · 剩 ${Math.max(0, q.expires - g.clock.absoluteDay)} 天` : '';
    this.questHint.innerHTML = `<div style="color:#FFD98A;font-size:12px;font-weight:bold;margin-bottom:2px">📌 ${q.name}</div>`
      + `<div style="color:#B8C0D8;font-size:11px;line-height:1.4;margin-bottom:3px">${q.desc || ''}</div>`
      + `<div style="color:#8AE84A;font-size:12px">进度 ${q.progress || 0}/${q.goal.count}${left}</div>`;
    this.questHint.style.display = 'block';
  }
  fade(onBlack) {
    this.fadeEl.style.opacity = onBlack ? '1' : '0';
    return new Promise((r) => setTimeout(r, 550));
  }
  refreshToolbar(showLabel = false) {
    const g = this.game, st = g.state.player;
    for (let i = 0; i < 10; i++) {
      const s = this.slots[i], it = st.inventory[i];
      const img = s.querySelector('img'), qty = s.querySelectorAll('span')[0];
      if (it) {
        img.src = itemIcon(it.id, it.quality); img.style.display = 'block';
        qty.textContent = it.qty > 1 ? it.qty : '';
      } else { img.style.display = 'none'; qty.textContent = ''; }
      s.style.borderColor = i === st.toolbarSel ? '#FFD98A' : '#3A4260';
      s.style.boxShadow = i === st.toolbarSel ? '0 0 8px #FFD98A66' : 'none';
    }
    const held = st.inventory[st.toolbarSel];
    if (showLabel && held) {
      this.heldLabel.textContent = getItem(held.id).name;
      this.heldLabel.style.opacity = '1';
      clearTimeout(this._lt);
      this._lt = setTimeout(() => this.heldLabel.style.opacity = '0', 1200);
    }
  }
  setInteractTip(text) {
    if (text) { this.interactTip.textContent = text; this.interactTip.style.display = 'block'; }
    else this.interactTip.style.display = 'none';
  }
  tutorial(html, ms = 8000) {
    this.tutBar.innerHTML = html;
    this.tutBar.style.display = 'block';
    clearTimeout(this._tt);
    this._tt = setTimeout(() => this.tutBar.style.display = 'none', ms);
  }
  async showSettlement({ lines, total }, { penalty } = {}) {
    const rows = lines.length
      ? lines.map((l) => `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0"><span><img src="${itemIcon(l.id, l.quality)}" style="width:18px;height:18px;vertical-align:-4px;image-rendering:pixelated"> ${getItem(l.id).name} ×${l.qty}</span><span style="color:#FFD98A">${l.price}g</span></div>`).join('')
      : '<div style="opacity:.6;margin:8px 0">今天没有出货。</div>';
    this.centerPanel.innerHTML = `
      <div style="font-size:18px;color:#FFD98A;margin-bottom:10px">今日结算</div>
      <div style="max-height:280px;overflow:auto">${rows}</div>
      <hr style="border-color:#4A5578;margin:10px 0">
      <div style="display:flex;justify-content:space-between;font-size:16px"><span>总收入</span><span style="color:#FFD98A;font-weight:bold">${total} g</span></div>
      ${penalty ? `<div style="color:#E86A6A;font-size:12px;margin-top:6px">熬夜惩罚：明日体力 -${Math.round(penalty * 100)}%</div>` : ''}
      <div style="text-align:center;margin-top:14px"><button id="settle-ok" style="padding:6px 26px;background:#4A5578;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:14px">确定</button></div>`;
    this.centerPanel.style.display = 'block';
    if (total > 0) this.game.audio.sfx('coin');
    await new Promise((r) => { this.centerPanel.querySelector('#settle-ok').onclick = () => { this.centerPanel.style.display = 'none'; this.game.audio.sfx('click'); r(); }; });
  }
  async showPassOut(reason, lost) {
    this.centerPanel.innerHTML = `
      <div style="font-size:18px;color:#E86A6A;margin-bottom:10px">你昏倒了…</div>
      <div>${reason}</div>
      ${lost ? `<div style="color:#E86A6A;margin-top:8px">被好心人送回家，损失了 ${lost} g</div>` : '<div style="margin-top:8px">好在你在家附近，没有损失。</div>'}
      <div style="text-align:center;margin-top:14px"><button id="po-ok" style="padding:6px 26px;background:#4A5578;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:14px">确定</button></div>`;
    this.centerPanel.style.display = 'block';
    await new Promise((r) => { this.centerPanel.querySelector('#po-ok').onclick = () => { this.centerPanel.style.display = 'none'; this.game.audio.sfx('click'); r(); }; });
  }
  update() {
    const g = this.game, st = g.state.player, c = g.clock;
    this.clockPanel.innerHTML = `
      <div style="font-size:20px;font-weight:bold;color:${c.minute >= 1500 ? '#E86A6A' : '#E8E8F0'}">${c.fmt()}</div>
      <div style="font-size:12px;color:#B8C0D8">${SEASON_CN[c.season]}季 ${c.day}日 · 第${c.year}年</div>
      <div style="font-size:11px;color:#8A92B8">${['周一','周二','周三','周四','周五','周六','周日'][c.weekDay]}</div>`;
    this.bars.querySelector('#hud-energy').style.width = `${Math.max(0, (st.energy / st.maxEnergy) * 100)}%`;
    this.bars.querySelector('#hud-health').style.width = `${Math.max(0, (st.health / st.maxHealth) * 100)}%`;
    const moneyEl = this.bars.querySelector('#hud-money');
    const newText = `${st.money.toLocaleString()} g`;
    if (moneyEl.textContent !== newText) {
      moneyEl.textContent = newText;
      moneyEl.style.transform = 'scale(1.15)';
      setTimeout(() => moneyEl.style.transform = 'scale(1)', 150);
    }
  }
}
