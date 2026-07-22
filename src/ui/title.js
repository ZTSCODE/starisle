// 标题界面：主菜单 / 3 槽读档 / 新游戏（角色创建）/ 删档二次确认
import { PAL } from '../render/textures.js';
import { newGame } from '../core/state.js';
import { SEASON_CN } from '../core/time.js';

// 主菜单美化样式（注入一次，id 防重复注入）
function ensureTitleStyle() {
  if (document.getElementById('title-ui-style')) return;
  const st = document.createElement('style');
  st.id = 'title-ui-style';
  st.textContent = `
    .t-title{font-size:64px;color:#FFE9B8;letter-spacing:18px;font-weight:600;text-shadow:0 0 34px #FF9D4D66,0 2px 0 #3A2410,2px 2px 0 #000}
    .t-sub{font-size:15px;color:#D8C9A8;letter-spacing:5px;opacity:.92}
    .t-btn{display:block;width:100%;padding:13px;background:rgba(18,22,44,.72);color:#F0E6D2;border:1.5px solid rgba(255,217,138,.45);border-radius:10px;font-size:16px;letter-spacing:6px;cursor:pointer;backdrop-filter:blur(6px);transition:all .18s}
    .t-btn:hover{background:rgba(38,44,74,.85);border-color:#FFD98A;transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.35)}
    .t-btn-primary{background:rgba(184,119,58,.85);color:#FFF7E8}
    .t-btn-primary:hover{background:rgba(209,142,74,.9)}
    .t-foot{font-size:12px;color:rgba(216,201,168,.55);letter-spacing:2px}
  `;
  document.head.appendChild(st);
}

export class TitleScreen {
  constructor(game) {
    this.game = game;
    this.el = document.createElement('div');
    // 主视觉背景（.assetflow/keyart_mainmenu.png）：顶部/底部压暗保证文字可读；图片缺失时回退原渐变
    this.el.style.cssText = 'position:fixed;inset:0;z-index:250;display:none;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(rgba(10,14,34,.62) 0%, rgba(10,14,34,.18) 45%, rgba(10,14,34,.55) 100%),url(".assetflow/keyart_mainmenu.png") center/cover no-repeat,linear-gradient(#0A0E22 0%, #1A2A4A 55%, #2A4A3A 100%)';
    document.getElementById('ui').appendChild(this.el);
    ensureTitleStyle();

    // ── 实时像素化视频背景 ──────────────────────────────
    // 播放原视频 .assetflow/keyart_loop.mp4，前端实时降采样→关闭平滑放大，得到锐利像素块；
    // 视频加载/解码失败时整体停用，容器原有 CSS 背景（静态图+兜底渐变）继续显示
    this.bgOk = true;
    this.video = document.createElement('video');
    this.video.src = '.assetflow/keyart_loop.mp4';
    this.video.muted = true;
    this.video.loop = true;
    this.video.playsInline = true;
    this.video.preload = 'auto';
    this.video.addEventListener('error', () => {
      this.bgOk = false;
      this._stopLoop();
      this.bg.remove();
    });
    // 离屏小 canvas：视频帧先画到这里取平均色
    this.off = document.createElement('canvas');
    this.off.width = 320;
    this.off.height = 180;
    this.offCtx = this.off.getContext('2d');
    // 显示 canvas：压在容器 CSS 背景之上、文字之下（容器 fixed+z250 形成层叠上下文）
    this.bg = document.createElement('canvas');
    this.bg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1';
    this.bgCtx = this.bg.getContext('2d');
    this.scrim = null;
    this.scrimH = 0;
    this.raf = 0;
    this._onResize = () => this._resizeBg();
    window.addEventListener('resize', this._onResize);
  }
  get isOpen() { return this.el.style.display !== 'none'; }
  show() {
    const g = this.game;
    this.el.style.display = 'flex';
    g.clock.pause(true);
    g.player.frozen = true;
    g.bgm.play('title');
    this.renderMenu();
    this._startLoop();
  }
  hide() {
    this.el.style.display = 'none';
    this._stopLoop();
    this.game.clock.pause(false);
    this.game.player.frozen = false;
  }
  // innerHTML 重建会清掉子元素，每次渲染后把 bg canvas 重新挂到最底层
  _attachBg() {
    if (this.bgOk) this.el.prepend(this.bg);
  }
  _startLoop() {
    if (!this.bgOk) return;
    this.video.play().catch(() => {});
    this._resizeBg();
    if (this.raf) return;
    const step = () => {
      this.raf = requestAnimationFrame(step);
      this._drawBg();
    };
    this.raf = requestAnimationFrame(step);
  }
  _stopLoop() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.video.pause();
  }
  _resizeBg() {
    const w = this.el.clientWidth || window.innerWidth;
    const h = this.el.clientHeight || window.innerHeight;
    if (this.bg.width !== w || this.bg.height !== h) {
      this.bg.width = w;
      this.bg.height = h;
    }
    // scrim 渐变随高度重建，平时复用同一个 CanvasGradient
    if (this.scrimH !== h) {
      this.scrimH = h;
      const grd = this.bgCtx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, 'rgba(10,14,34,.62)');
      grd.addColorStop(0.45, 'rgba(10,14,34,.18)');
      grd.addColorStop(1, 'rgba(10,14,34,.55)');
      this.scrim = grd;
    }
  }
  _drawBg() {
    if (!this.bgOk) return;
    const v = this.video;
    if (v.readyState < 2) return; // 视频未 ready：bg 保持透明，露出静态图兜底
    const ow = this.off.width, oh = this.off.height;
    // 默认平滑地缩到 320×180，得到平均色
    this.offCtx.drawImage(v, 0, 0, ow, oh);
    const w = this.bg.width, h = this.bg.height;
    if (!w || !h) return;
    // cover 适配：等比放大 + 居中裁剪，关闭平滑 → 锐利像素块
    const s = Math.max(w / ow, h / oh);
    const dw = ow * s, dh = oh * s;
    const dx = (w - dw) / 2, dy = (h - dh) / 2;
    const ctx = this.bgCtx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.off, 0, 0, ow, oh, dx, dy, dw, dh);
    ctx.fillStyle = this.scrim;
    ctx.fillRect(0, 0, w, h);
  }
  renderMenu() {
    const g = this.game;
    const hasAny = [1, 2, 3, 'auto'].some((s) => g.save.has(s));
    this.el.innerHTML = `
      <div class="t-title" style="margin-bottom:6px">星屿物语</div>
      <div class="t-sub" style="margin-bottom:42px">—— 汐溪镇的山谷在等一颗星星 ——</div>
      <div style="display:flex;flex-direction:column;gap:12px;width:260px">
        ${hasAny ? `<button id="t-continue" class="t-btn t-btn-primary">继续游戏</button>` : ''}
        <button id="t-new" class="t-btn">新的开始</button>
        ${hasAny ? `<button id="t-load" class="t-btn">读取存档</button>` : ''}
        <button id="t-help" class="t-btn">操作说明</button>
      </div>
      <div class="t-foot" style="position:absolute;bottom:14px">星屿工作室 · 网页版 v1.0</div>`;
    this._attachBg();
    if (hasAny) this.el.querySelector('#t-continue').onclick = () => this.loadSlot('auto');
    this.el.querySelector('#t-new').onclick = () => this.renderCreate();
    this.el.querySelector('#t-load')?.addEventListener('click', () => this.renderSlots());
    this.el.querySelector('#t-help').onclick = () => this.renderHelp();
  }
  renderHelp() {
    const row = (k, v) => `<tr><td style="padding:3px 14px 3px 0;color:#FFD98A;white-space:nowrap">${k}</td><td style="padding:3px 0;color:#D8DCE8">${v}</td></tr>`;
    const { isTouchDevice } = { isTouchDevice: () => ('ontouchstart' in window || navigator.maxTouchPoints > 0) && (/Android|iPhone|iPad|iPod|Mobile|HarmonyOS|webOS/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) <= 820) };
    const pcTable = `
        <table style="font-size:13px;border-spacing:0">
          <tr><td colspan="2" style="padding-bottom:6px;color:#8AE84A;font-size:14px">⌨ 电脑</td></tr>
          ${row('W A S D / 方向键', '移动')}
          ${row('Shift（按住）', '跑步')}
          ${row('E', '交互 / 对话 / 开箱')}
          ${row('F / 鼠标左键', '使用工具·抛竿·攻击（按住蓄力/遛鱼上升）')}
          ${row('鼠标滚轮', '缩放视角（推到最近进入第一人称）')}
          ${row('Tab / Esc', '菜单 / 关闭面板')}
          ${row('B', '背包')}
          ${row('C', '制造')}
          ${row('M / J', '地图 / 任务日志')}
          ${row('数字键 1-0', '切换快捷栏')}
          ${row('P', '照相模式')}
          ${row('F8', '碰撞坐标显示（开发者调试）')}
        </table>`;
    const mobTable = `
        <table style="font-size:13px;border-spacing:0">
          <tr><td colspan="2" style="padding-bottom:6px;color:#5FB4E8;font-size:14px">📱 手机 / 平板</td></tr>
          ${row('左下摇杆', '移动（推到底全速）')}
          ${row('「跑」（按住）', '跑步')}
          ${row('「E」', '交互 / 对话')}
          ${row('「用」（按住）', '使用工具·抛竿·遛鱼上升')}
          ${row('双指捏合/张开', '缩放视角（捏到最近进入第一人称）')}
          ${row('第一人称单指滑动', '转动视角')}
          ${row('第三人称左右滑屏', '切换快捷栏工具')}
          ${row('「菜单」「制造」', '对应面板（背包/地图在菜单里）')}
          ${row('✕', '关闭当前面板')}
          ${row('点按快捷栏', '切换手持物品')}
        </table>`;
    this.el.innerHTML = `
      <div class="t-title" style="font-size:26px;letter-spacing:4px;margin-bottom:14px">操作说明</div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;justify-content:center;max-width:640px;max-height:62vh;overflow:auto">
        ${isTouchDevice() ? mobTable : pcTable}
      </div>
      <button id="t-back" style="${this.btn()};margin-top:18px">返回</button>`;
    this._attachBg();
    this.el.querySelector('#t-back').onclick = () => this.renderMenu();
  }
  btn(bg = '#4A5578') {
    return `padding:12px;background:${bg};color:#fff;border:2px solid #8A92B8;border-radius:6px;cursor:pointer;font-size:16px;letter-spacing:6px`;
  }
  renderSlots() {
    const g = this.game;
    const slots = ['auto', 1, 2, 3].map((s) => {
      const info = g.save.slotInfo(s);
      const label = s === 'auto' ? '自动存档' : `存档 ${s}`;
      if (!info) return `<div style="padding:14px;background:#1A1A26;border:1px solid #3A4260;border-radius:6px;color:#5A6488">${label} · 空</div>`;
      return `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:#1A1A26;border:1px solid #4A5578;border-radius:6px">
        <div style="flex:1;cursor:pointer" data-load="${s}">
          <div style="font-size:14px;color:#FFD98A">${label} · ${info.name} @ ${info.farmName}</div>
          <div style="font-size:12px;color:#8A92B8">${SEASON_CN[info.season]}季${info.day}日 第${info.year}年 · ${info.money}g · 第${info.daysPlayed}天</div>
        </div>
        ${s !== 'auto' ? `<button data-del="${s}" style="padding:4px 10px;background:#5A3A4A;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:12px">删除</button>` : ''}
      </div>`;
    }).join('');
    this.el.innerHTML = `
      <div class="t-title" style="font-size:30px;letter-spacing:6px;margin-bottom:22px">读取存档</div>
      <div style="display:flex;flex-direction:column;gap:10px;width:440px;max-width:92vw">${slots}</div>
      <button id="t-back" style="${this.btn()};margin-top:24px">返回</button>`;
    this._attachBg();
    this.el.querySelector('#t-back').onclick = () => this.renderMenu();
    this.el.querySelectorAll('[data-load]').forEach((el) => {
      el.onclick = () => this.loadSlot(el.dataset.load);
    });
    this.el.querySelectorAll('[data-del]').forEach((el) => {
      el.onclick = () => {
        const s = el.dataset.del;
        const confirm = document.createElement('div');
        confirm.style.cssText = 'position:fixed;inset:0;background:#000C;display:flex;align-items:center;justify-content:center;z-index:300';
        confirm.innerHTML = `<div style="background:#1A1A26;border:2px solid #E86A6A;border-radius:8px;padding:24px;text-align:center">
          <div style="color:#E86A6A;font-size:16px;margin-bottom:12px">删除存档 ${s}？此操作不可恢复</div>
          <div style="font-size:13px;color:#B8C0D8;margin-bottom:14px">输入「确认」二字以删除</div>
          <input id="del-input" style="padding:6px;background:#0A0C14;color:#fff;border:1px solid #4A5578;border-radius:4px;text-align:center">
          <div style="margin-top:14px">
            <button id="del-ok" style="padding:6px 18px;background:#B83A3A;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:8px">删除</button>
            <button id="del-cancel" style="padding:6px 18px;background:#4A5578;color:#fff;border:none;border-radius:4px;cursor:pointer">取消</button>
          </div></div>`;
        document.getElementById('ui').appendChild(confirm);
        confirm.querySelector('#del-cancel').onclick = () => confirm.remove();
        confirm.querySelector('#del-ok').onclick = () => {
          if (confirm.querySelector('#del-input').value === '确认') {
            this.game.save.remove(s);
            confirm.remove();
            this.renderSlots();
          } else {
            confirm.querySelector('#del-input').style.borderColor = '#E86A6A';
          }
        };
      };
    });
  }
  loadSlot(slot) {
    const g = this.game;
    const state = g.save.load(slot);
    if (!state) return;
    g.applyLoadedState(state);
    this.hide();
    g.ui.tutorial(`欢迎回来，${state.player.name}！`, 4000);
  }
  renderCreate() {
    const g = this.game;
    const cfg = { name: '小屿', farmName: '晨风农场', pet: 'cat', appearance: { skin: 0, hair: 0, shirt: 0 } };
    const skins = ['#F0C8A0', '#E8B088', '#D09878', '#B87A5A', '#9A6248', '#7A4A38', '#F0D8C0', '#E0B89A'];
    const hairs = PAL.hair, shirts = PAL.shirt;
    this.el.innerHTML = `
      <div class="t-title" style="font-size:30px;letter-spacing:6px;margin-bottom:18px">新的开始</div>
      <div style="display:flex;gap:26px;align-items:flex-start;${innerWidth < 760 || 'ontouchstart' in window ? 'flex-wrap:wrap;justify-content:center;max-width:94vw;max-height:66vh;overflow:auto;padding:0 8px' : ''}">
        <canvas id="t-preview" width="120" height="180" style="image-rendering:pixelated;background:#1A2A4A;border:2px solid #4A5578;border-radius:8px"></canvas>
        <div style="width:300px;display:flex;flex-direction:column;gap:12px">
          <label style="font-size:13px;color:#B8C0D8">你的名字<input id="t-name" value="${cfg.name}" maxlength="6" style="display:block;width:100%;margin-top:4px;padding:8px;background:#0A0C14;color:#fff;border:1px solid #4A5578;border-radius:4px"></label>
          <label style="font-size:13px;color:#B8C0D8">农场名字<input id="t-farm" value="${cfg.farmName}" maxlength="8" style="display:block;width:100%;margin-top:4px;padding:8px;background:#0A0C14;color:#fff;border:1px solid #4A5578;border-radius:4px"></label>
          <div style="font-size:13px;color:#B8C0D8">肤色<div id="t-skin" style="display:flex;gap:4px;margin-top:4px">${skins.map((c, i) => `<div data-skin="${i}" style="width:22px;height:22px;background:${c};border:2px solid ${i === 0 ? '#FFD98A' : '#4A5578'};border-radius:4px;cursor:pointer"></div>`).join('')}</div></div>
          <div style="font-size:13px;color:#B8C0D8">发色<div id="t-hair" style="display:flex;gap:4px;margin-top:4px">${hairs.map((c, i) => `<div data-hair="${i}" style="width:22px;height:22px;background:${c};border:2px solid ${i === 0 ? '#FFD98A' : '#4A5578'};border-radius:4px;cursor:pointer"></div>`).join('')}</div></div>
          <div style="font-size:13px;color:#B8C0D8">衣色<div id="t-shirt" style="display:flex;gap:4px;margin-top:4px">${shirts.map((c, i) => `<div data-shirt="${i}" style="width:22px;height:22px;background:${c};border:2px solid ${i === 0 ? '#FFD98A' : '#4A5578'};border-radius:4px;cursor:pointer"></div>`).join('')}</div></div>
          <div style="font-size:13px;color:#B8C0D8">宠物<div style="display:flex;gap:8px;margin-top:4px">
            <button data-pet="cat" style="padding:6px 18px;background:#4A7AB8;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer">猫 猫</button>
            <button data-pet="dog" style="padding:6px 18px;background:#2A3048;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer">狗 狗</button>
          </div></div>
          <button id="t-start" style="${this.btn('#4A7AB8')};margin-top:8px">开始新生活</button>
          <button id="t-back" style="${this.btn('#2A3048')}">返回</button>
        </div>
      </div>`;
    this._attachBg();
    const draw = async () => {
      const { makeSpriteChar } = await import('../render/spritechar.js');
      const ch = makeSpriteChar({ skin: skins[cfg.appearance.skin], hair: hairs[cfg.appearance.hair], shirt: shirts[cfg.appearance.shirt] });
      const cv = this.el.querySelector('#t-preview');
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 120, 180);
      const img = new Image();
      img.src = ch.frames.down[0].image.toDataURL();
      img.onload = () => ctx.drawImage(img, 0, 0, 20, 30, 10, 6, 100, 150);
    };
    draw();
    const bindGroup = (id, key, list) => {
      this.el.querySelectorAll(`#t-${id} [data-${id}]`).forEach((el) => {
        el.onclick = () => {
          cfg.appearance[key] = parseInt(el.dataset[id]);
          this.el.querySelectorAll(`#t-${id} [data-${id}]`).forEach((x) => x.style.borderColor = '#4A5578');
          el.style.borderColor = '#FFD98A';
          draw();
        };
      });
    };
    bindGroup('skin', 'skin', skins);
    bindGroup('hair', 'hair', hairs);
    bindGroup('shirt', 'shirt', shirts);
    this.el.querySelectorAll('[data-pet]').forEach((el) => {
      el.onclick = () => {
        cfg.pet = el.dataset.pet;
        this.el.querySelectorAll('[data-pet]').forEach((x) => x.style.background = '#2A3048');
        el.style.background = '#4A7AB8';
      };
    });
    this.el.querySelector('#t-back').onclick = () => this.renderMenu();
    this.el.querySelector('#t-start').onclick = () => {
      cfg.name = this.el.querySelector('#t-name').value.trim() || '小屿';
      cfg.farmName = this.el.querySelector('#t-farm').value.trim() || '晨风农场';
      this.startNewGame(cfg);
    };
  }
  startNewGame(cfg) {
    const g = this.game;
    const state = newGame(cfg);
    g.applyLoadedState(state);
    this.hide();
    g.story.playIntro();
  }
}
