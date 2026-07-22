// 触屏操控：仅在真·移动设备启用——左侧虚拟摇杆（移动）+ 右侧动作键 + 右缘功能键 + 双指捏合缩放视角
// 原理：按键直接派发真实 KeyboardEvent，与键盘走完全相同的监听链路（菜单/背包/制造等原生 keydown 面板全部兼容）
export function isTouchDevice() {
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  if (!hasTouch) return false;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|webOS/i.test(navigator.userAgent);
  const smallScreen = Math.min(screen.width, screen.height) <= 820;
  return mobileUA || smallScreen; // 触屏笔记本（大屏 + 桌面 UA）不算，避免误显示
}

const BTN_BASE = 'position:fixed;z-index:90;touch-action:none;user-select:none;-webkit-user-select:none;'
  + 'display:flex;align-items:center;justify-content:center;'
  + 'background:rgba(20,22,34,.5);border:2px solid rgba(138,146,184,.65);color:#E8E8F0;'
  + 'font:bold 14px/1 monospace;text-shadow:1px 1px 0 #000;';

function key(type, code) { window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true })); }

export class TouchControls {
  constructor(input) {
    this.input = input;
    this.stick = { id: null, x: 0, z: 0, cx: 0, cy: 0 };
    this.pinch = { d: 0, acc: 0 };
    this.uiBlocked = false;
    this.parts = [];
    // 移动端整体 UI 缩小到约 50%，接近浏览器手动缩小 50% 的效果
    document.getElementById('ui').style.zoom = '0.5';
    this.buildJoystick();
    this.buildButtons();
    this.buildGestures();
    // 「✕」关闭钮：面板打开时显示在左上角，点它 = Esc（替代已移除的空白处关闭）
    this.btnClose = this.makeButton('✕', 'Escape', 'left:12px;top:12px;width:44px;height:44px;border-radius:10px;font-size:18px;display:none;');
  }
  // ---- 虚拟摇杆 ----
  buildJoystick() {
    const base = document.createElement('div');
    base.style.cssText = BTN_BASE + 'left:22px;bottom:22px;width:120px;height:120px;border-radius:50%;';
    const knob = document.createElement('div');
    knob.style.cssText = 'width:48px;height:48px;border-radius:50%;background:rgba(255,217,138,.85);border:2px solid #8A6B3F;pointer-events:none;';
    base.appendChild(knob);
    document.body.appendChild(base);
    this.knob = knob;
    this.joystick = base;
    this.parts.push(base);
    const R = 38;
    const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px,${dy}px)`; };
    base.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.stick.id = t.identifier;
      const r = base.getBoundingClientRect();
      this.stick.cx = r.left + r.width / 2; this.stick.cy = r.top + r.height / 2;
    }, { passive: false });
    const move = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== this.stick.id) continue;
        e.preventDefault();
        let dx = t.clientX - this.stick.cx, dy = t.clientY - this.stick.cy;
        const d = Math.hypot(dx, dy);
        if (d > R) { dx = dx / d * R; dy = dy / d * R; }
        setKnob(dx, dy);
        const nx = dx / R, nz = dy / R;
        if (Math.hypot(nx, nz) < 0.18) { this.stick.x = 0; this.stick.z = 0; }
        else { this.stick.x = nx; this.stick.z = nz; }
      }
    };
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== this.stick.id) continue;
        this.stick.id = null; this.stick.x = 0; this.stick.z = 0;
        setKnob(0, 0);
      }
    };
    base.addEventListener('touchmove', move, { passive: false });
    base.addEventListener('touchend', end);
    base.addEventListener('touchcancel', end);
  }
  // ---- 按键（派发真实键码，原生 keydown 面板直接兼容）----
  makeButton(text, code, style) {
    const b = document.createElement('div');
    b.textContent = text;
    b.style.cssText = BTN_BASE + style;
    document.body.appendChild(b);
    this.parts.push(b);
    b.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      b.style.background = 'rgba(255,217,138,.75)'; b.style.color = '#23232E';
      key('keydown', code);
    }, { passive: false });
    const off = (e) => {
      e.preventDefault();
      b.style.background = 'rgba(20,22,34,.5)'; b.style.color = '#E8E8F0';
      key('keyup', code);
    };
    b.addEventListener('touchend', off);
    b.addEventListener('touchcancel', off);
    return b;
  }
  buildButtons() {
    // 右下主动作键：用(F) 大键 / 交(E) / 跑(Shift)，错位布置互不重叠
    this.actUse = this.makeButton('用', 'KeyF', 'right:24px;bottom:96px;width:72px;height:72px;border-radius:50%;font-size:19px;');
    this.actTalk = this.makeButton('E', 'KeyE', 'right:106px;bottom:146px;width:56px;height:56px;border-radius:50%;font-size:16px;');
    this.actRun = this.makeButton('跑', 'ShiftLeft', 'right:112px;bottom:52px;width:48px;height:48px;border-radius:50%;font-size:13px;');
    // 右缘功能键只保留 菜单(Tab)/制造(C)：背包/地图等在菜单里都有入口
    const col = 'right:12px;width:52px;height:38px;border-radius:9px;font-size:12px;';
    this.btnMenu = this.makeButton('菜单', 'Tab', col + 'top:96px;');
    this.btnCraft = this.makeButton('制造', 'KeyC', col + 'top:142px;');
    this.panelParts = [this.joystick, this.actUse, this.actTalk, this.actRun, this.btnCraft];
  }
  // ---- 画布手势：单指拖动转视角 / 双指捏合缩放（仅未按住摇杆时）----
  buildGestures() {
    this.input.touchLook = true; // 通知玩家控制器：无指针锁定时也允许增量转视角
    const canvas = document.querySelector('#app canvas') || document.body;
    this.ct = new Map(); // 画布上的触点 identifier -> {x,y}
    this.pinchAcc = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.target !== canvas) return;
      for (const t of e.changedTouches) this.ct.set(t.identifier, { x: t.clientX, y: t.clientY });
      this.pinchAcc = 0;
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.target !== canvas) return;
      const moved = [...e.changedTouches].filter((t) => this.ct.has(t.identifier));
      if (!moved.length) return;
      e.preventDefault();
      const ids = [...this.ct.keys()];
      if (this.stick.id === null && this.ct.size >= 2) {
        // 双指捏合缩放（映射滚轮；dist<4.2 自动进入第一人称）——仅在没按住移动摇杆时生效
        const [ia, ib] = ids;
        const pa = this.ct.get(ia), pb = this.ct.get(ib);
        const d0 = Math.hypot(pa.x - pb.x, pa.y - pb.y);
        for (const t of moved) { const p = this.ct.get(t.identifier); p.x = t.clientX; p.y = t.clientY; }
        const d1 = Math.hypot(this.ct.get(ia).x - this.ct.get(ib).x, this.ct.get(ia).y - this.ct.get(ib).y);
        this.pinchAcc += d1 - d0;
        while (this.pinchAcc > 30) { this.pinchAcc -= 30; this.input.mouse.wheel -= 1; }
        while (this.pinchAcc < -30) { this.pinchAcc += 30; this.input.mouse.wheel += 1; }
      } else {
        // 单指拖动：第一人称 = 转视角；第三人称 = 横向滑动切换快捷栏工具（每 64px 一格）
        for (const t of moved) {
          const p = this.ct.get(t.identifier);
          const dx = t.clientX - p.x, dy = t.clientY - p.y;
          const g = this.game;
          if (g && !g.player?.fpv) {
            this.swipeAcc = (this.swipeAcc || 0) + dx;
            while (this.swipeAcc > 64) { this.swipeAcc -= 64; this.cycleTool(1); }
            while (this.swipeAcc < -64) { this.swipeAcc += 64; this.cycleTool(-1); }
          } else {
            this.input.mouse.mdx += dx;
            this.input.mouse.mdy += dy;
          }
          p.x = t.clientX; p.y = t.clientY;
        }
      }
    }, { passive: false });
    const clear = (e) => { for (const t of e.changedTouches) this.ct.delete(t.identifier); };
    window.addEventListener('touchend', clear);
    window.addEventListener('touchcancel', clear);
  }
  cycleTool(dir) {
    const g = this.game;
    if (!g?.state?.player) return;
    const st = g.state.player;
    st.toolbarSel = (st.toolbarSel + dir + 10) % 10;
    g.ui?.refreshToolbar?.(true);
    g.audio?.sfx?.('click');
  }
  // 面板/对话/标题打开时隐藏游戏控件（保留菜单键用于关闭面板），避免遮挡 UI
  // 面板/对话打开时隐藏游戏控件（保留菜单键）；showClose 单独控制 ✕ 关闭键（主界面/过场不出 ✕）
  setUiBlocked(b, showClose = b) {
    if (b !== this.uiBlocked) {
      this.uiBlocked = b;
      for (const el of this.panelParts) el.style.display = b ? 'none' : 'flex';
    }
    this.btnClose.style.display = showClose ? 'flex' : 'none';
  }
  axis() { return { x: this.stick.x, z: this.stick.z }; }
  get active() { return this.stick.id !== null; }
}
