// 对话系统：打字机对话框 / 选项分支 / 像素头像 / 表情气泡
import { mkCanvas } from '../render/textures.js';

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;

export function makePortrait(colorScheme, size = 48, npcId = null) {
  // 立绘图片优先：.assetflow/portraits/<id>.png 已生成则直接用（启动时探测注册）
  if (npcId && window.game?.portraitFiles?.has(npcId)) return `.assetflow/portraits/${npcId}.png`;
  // 逐人特征立绘：由配色串哈希确定 发型/眼型/眼镜/雀斑（同一 NPC 恒定）
  const hashStr2 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const seed = hashStr2((colorScheme.hair || '') + (colorScheme.skin || '') + (colorScheme.shirt || ''));
  const hairStyle = seed % 6;                       // 0平刘海 1侧分 2丸子 3长发 4双辫 5乱发
  const glasses = (seed >> 3) % 5 === 0;
  const freckles = (seed >> 5) % 4 === 0;
  const smile = (seed >> 7) % 3;                    // 0微笑 1平 2开口
  const dark = (c) => shade2(c, -30);
  function shade2(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
  const c = mkCanvas(24, 24), g = c.getContext('2d');
  // 底色（衬衫色压暗的圆形衬底）
  g.fillStyle = dark(colorScheme.shirt); g.fillRect(0, 0, 24, 24);
  g.fillStyle = shade2(dark(colorScheme.shirt), 18); g.fillRect(0, 18, 24, 6);
  const skin = colorScheme.skin, hair = colorScheme.hair, skinD = dark(skin);
  // 脖子 + 衬衫（含领口）
  g.fillStyle = skinD; g.fillRect(10, 15, 4, 2);
  g.fillStyle = colorScheme.shirt; g.fillRect(5, 17, 14, 7);
  g.fillStyle = dark(colorScheme.shirt); g.fillRect(5, 17, 14, 1);
  g.fillStyle = '#F0E8D8'; g.fillRect(10, 17, 4, 1); // 领口
  // 脸（带下颌阴影）
  g.fillStyle = skin; g.fillRect(6, 5, 12, 11);
  g.fillStyle = skinD; g.fillRect(6, 14, 12, 2);
  // 发型
  g.fillStyle = hair;
  if (hairStyle === 0) { g.fillRect(6, 2, 12, 4); g.fillRect(6, 6, 2, 4); g.fillRect(16, 6, 2, 4); } // 平刘海
  else if (hairStyle === 1) { g.fillRect(6, 2, 12, 3); g.fillRect(11, 5, 2, 3); g.fillRect(6, 5, 3, 2); g.fillRect(15, 5, 3, 2); } // 侧分
  else if (hairStyle === 2) { g.fillRect(6, 3, 12, 3); g.fillRect(9, 0, 6, 4); g.fillStyle = dark(hair); g.fillRect(10, 1, 4, 2); } // 丸子
  else if (hairStyle === 3) { g.fillRect(6, 2, 12, 4); g.fillRect(4, 5, 3, 12); g.fillRect(17, 5, 3, 12); } // 长发
  else if (hairStyle === 4) { g.fillRect(6, 2, 12, 4); g.fillRect(4, 6, 2, 6); g.fillRect(18, 6, 2, 6); g.fillStyle = dark(hair); g.fillRect(4, 11, 2, 2); g.fillRect(18, 11, 2, 2); } // 双辫
  else { g.fillRect(6, 2, 12, 3); g.fillRect(7, 5, 2, 2); g.fillRect(11, 5, 2, 2); g.fillRect(15, 5, 2, 2); } // 乱发
  // 眉 + 眼（眼白+瞳色取发色深调）
  const eyeC = dark(hair);
  g.fillStyle = dark(hair); g.fillRect(8, 8, 3, 1); g.fillRect(13, 8, 3, 1); // 眉
  g.fillStyle = '#FFFFFF'; g.fillRect(8, 9, 3, 2); g.fillRect(13, 9, 3, 2);
  g.fillStyle = eyeC; g.fillRect(9, 9, 2, 2); g.fillRect(14, 9, 2, 2);
  g.fillStyle = '#FFFFFF'; g.fillRect(9, 9, 1, 1); g.fillRect(14, 9, 1, 1); // 高光
  // 鼻 + 嘴
  g.fillStyle = skinD; g.fillRect(11, 11, 2, 1);
  g.fillStyle = '#A8553F';
  if (smile === 0) { g.fillRect(10, 13, 4, 1); g.fillRect(9, 12, 1, 1); g.fillRect(14, 12, 1, 1); }
  else if (smile === 1) g.fillRect(10, 13, 4, 1);
  else { g.fillRect(10, 12, 4, 2); }
  // 腮红 / 雀斑 / 眼镜
  g.fillStyle = 'rgba(232,138,138,0.55)'; g.fillRect(7, 11, 2, 1); g.fillRect(15, 11, 2, 1);
  if (freckles) { g.fillStyle = dark(skin); g.fillRect(8, 11, 1, 1); g.fillRect(9, 12, 1, 1); g.fillRect(15, 12, 1, 1); }
  if (glasses) { g.strokeStyle = '#3A3230'; g.lineWidth = 1; g.strokeRect(7.5, 8.5, 4, 3); g.strokeRect(12.5, 8.5, 4, 3); g.beginPath(); g.moveTo(11.5, 10); g.lineTo(12.5, 10); g.stroke(); }
  const img = document.createElement('canvas');
  img.width = img.height = size;
  const ig = img.getContext('2d');
  ig.imageSmoothingEnabled = false;
  ig.drawImage(c, 0, 0, size, size);
  return img.toDataURL();
}

export class DialogUI {
  constructor(game) {
    this.game = game;
    this.el = document.createElement('div');
    this.el.style.cssText = `position:fixed;left:50%;bottom:90px;transform:translateX(-50%);width:640px;max-width:92vw;display:none;z-index:160;padding:14px 16px;${PANEL}`;
    document.getElementById('ui').appendChild(this.el);
    this.queue = [];
    this.typing = null;
    this.onDone = null;
    window.addEventListener('keydown', (e) => {
      if (this.el.style.display === 'none') return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') this.advance();
      else if (e.code === 'Escape' && !this._awaitChoice) this.hide(); // Esc 退出对话；等待选项时不允许跳过
    });
    this.el.addEventListener('click', () => this.advance());
  }
  get isOpen() { return this.el.style.display !== 'none'; }
  // lines: [{name, text, portrait, emo?}]，choices?: [{text, cb}]
  show(lines, { onDone = null } = {}) {
    const g = this.game;
    this.queue = [...lines];
    this.onDone = onDone;
    this.choices = null;
    g.clock.pause(true);
    g.player.frozen = true;
    g.engine.setDofAmount?.(2.0); // 对话景深加强
    this.el.style.display = 'block';
    g.audio.sfx('open');
    this.next();
  }
  hide() {
    const g = this.game;
    this.el.style.display = 'none';
    this._awaitChoice = false;
    g.clock.pause(false);
    g.player.frozen = false;
    g.engine.setDofAmount?.(1.0);
    clearInterval(this.typing);
    const cb = this.onDone;
    this.onDone = null;
    if (cb) cb();
  }
  next() {
    clearInterval(this.typing);
    if (!this.queue.length) {
      if (this.choices) { this.renderChoices(); return; }
      this.hide();
      return;
    }
    const line = this.queue.shift();
    this.renderLine(line, () => this.next());
  }
  advance() {
    if (this.choices && !this.queue.length) return; // 等选择
    const textEl = this.el.querySelector('.dlg-text');
    if (this.typing) {
      // 快进当前行
      clearInterval(this.typing);
      this.typing = null;
      if (this._fullText) textEl.textContent = this._fullText;
      return;
    }
    this.next();
  }
  renderLine(line, done) {
    const g = this.game;
    // 立绘分两路：.assetflow 路径（手绘插画）外挂到对话框左侧大图展示；data URL 像素头像维持盒内 56px
    const isIllust = !!line.portrait && !line.portrait.startsWith('data:');
    const small = window.innerWidth < 860; // 小窗兜底：立绘缩小、右移量减少
    this.el.style.transform = isIllust ? `translateX(calc(-50% + ${small ? 72 : 104}px))` : 'translateX(-50%)';
    const portrait = line.portrait && !isIllust ? `<img src="${line.portrait}" style="width:56px;height:56px;image-rendering:pixelated;border:2px solid #4A5578;border-radius:6px">` : '';
    this.el.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${portrait}
        <div style="flex:1">
          <div style="color:#FFD98A;font-size:13px;margin-bottom:4px">${line.name || ''}${line.emo ? ' ' + line.emo : ''}</div>
          <div class="dlg-text" style="font-size:14px;line-height:1.7;min-height:52px"></div>
          <div style="text-align:right;font-size:11px;color:#8A92B8;margin-top:4px">空格/E 继续 ▼</div>
        </div>
      </div>`;
    if (isIllust) {
      // 立绘挂在对话框左侧外面（容器是 fixed 定位元素，直接作包含块；手绘插画平滑显示，不加 pixelated）
      const illust = document.createElement('img');
      illust.className = 'dlg-illust';
      illust.src = line.portrait;
      illust.style.cssText = `position:absolute;left:${small ? -164 : -252}px;bottom:-14px;width:${small ? 150 : 236}px;height:auto;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.55);border:2px solid rgba(255,217,138,.5)`;
      this.el.appendChild(illust);
    }
    const textEl = this.el.querySelector('.dlg-text');
    const full = line.text;
    this._fullText = full;
    let i = 0;
    g.audio.sfx('click');
    this.typing = setInterval(() => {
      i += 1;
      textEl.textContent = full.slice(0, i);
      if (i % 3 === 0) g.audio.tone({ freq: 700 + Math.random() * 200, dur: 0.02, vol: 0.03 });
      if (i >= full.length) { clearInterval(this.typing); this.typing = null; }
    }, 33);
  }
  showChoices(prompt, options) {
    // options: [{text, cb}]
    this.choices = options;
    this.queue = [{ name: prompt.name, text: prompt.text, portrait: prompt.portrait }];
    this.next();
  }
  _resetShift() {
    // 纯选项面板等场景：复位整体位移，并移除外挂立绘（若有）
    this.el.style.transform = 'translateX(-50%)';
    const illust = this.el.querySelector('.dlg-illust');
    if (illust) illust.remove();
  }
  renderChoices() {
    const opts = this.choices;
    this.choices = null;
    this._awaitChoice = true; // 等待玩家点选项，期间禁用 Esc 关闭
    this._resetShift(); // 选项面板不需要立绘，复位 transform
    const g = this.game;
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;gap:8px;margin-top:10px;justify-content:flex-end';
    for (const o of opts) {
      const btn = document.createElement('button');
      btn.textContent = o.text;
      btn.style.cssText = 'padding:6px 14px;background:#4A5578;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:13px';
      btn.onclick = () => { g.audio.sfx('click'); this.hide(); o.cb && o.cb(); };
      box.appendChild(btn);
    }
    this.el.appendChild(box);
  }
  // 对话结束后跟选项
  showWithChoices(lines, options, { onDone = null } = {}) {
    const g = this.game;
    this.show(lines, {
      onDone: () => {
        // 重开面板只显示选项
        this.el.style.display = 'block';
        g.clock.pause(true);
        g.player.frozen = true;
        this.el.innerHTML = '<div style="font-size:13px;color:#B8C0D8;margin-bottom:8px">你的回应：</div>';
        this._resetShift(); // 纯选项面板：复位位移（innerHTML 重写已清掉外挂立绘，这里兜底）
        const box = document.createElement('div');
        box.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap';
        for (const o of options) {
          const btn = document.createElement('button');
          btn.textContent = o.text;
          btn.style.cssText = 'padding:6px 14px;background:#4A5578;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:13px';
          btn.onclick = () => {
            g.audio.sfx('click');
            this.el.style.display = 'none';
            g.clock.pause(false);
            g.player.frozen = false;
            if (onDone) onDone();
            o.cb && o.cb();
          };
          box.appendChild(btn);
        }
        this.el.appendChild(box);
      },
    });
  }
  // 表情气泡（NPC 头顶）
  static bubble(game, npc, emo, ms = 2000) {
    const v = npc.mesh.position.clone();
    v.y += 1.6;
    game.effects.floatText(v, emo, '#FFD98A', 20);
  }
}
