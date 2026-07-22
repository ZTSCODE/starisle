// 键鼠输入：可重绑定动作映射 + 鼠标/滚轮
export class Input {
  constructor(dom) {
    this.keys = new Set();
    this.pressed = new Set();   // 本帧按下
    this.mouse = { x: 0, y: 0, nx: 0, ny: 0, down: false, rdown: false, clicked: false, rclicked: false, wheel: 0, mdx: 0, mdy: 0 };
    this.dom = dom;
    this.bindings = {
      up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
      interact: ['KeyE'], use: ['KeyF'], menu: ['Tab', 'Escape'], inventory: ['KeyB'], map: ['KeyM'],
      journal: ['KeyJ'], run: ['ShiftLeft', 'ShiftRight'], toolbar: [],
    };
    window.addEventListener('keydown', (e) => {
      // 阻止浏览器快捷键：Ctrl/Cmd + 常用键（保存、书签、打印、查找等）
      if ((e.ctrlKey || e.metaKey) && ['KeyS', 'KeyD', 'KeyP', 'KeyF', 'KeyG', 'KeyH', 'KeyO', 'KeyU'].includes(e.code)) {
        e.preventDefault();
        return;
      }
      // 游戏按键一律阻止默认行为（方向键滚动、/ 快速查找、空格翻页、Tab 切焦点等）
      const gameKeys = new Set(Object.values(this.bindings).flat());
      gameKeys.add('Space');
      if (gameKeys.has(e.code) || e.code.startsWith('Arrow') || e.code === 'Slash' || e.code === 'Quote') {
        e.preventDefault();
      }
      if (e.repeat) return;
      this.keys.add(e.code); this.pressed.add(e.code);
    });
    // 窗口失焦时清空输入状态，避免切窗回来后角色卡住一直跑
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false; this.mouse.rdown = false;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    dom.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX; this.mouse.y = e.clientY;
      this.mouse.nx = (e.clientX / innerWidth) * 2 - 1; this.mouse.ny = -(e.clientY / innerHeight) * 2 + 1;
      if (document.pointerLockElement === dom) { this.mouse.mdx += e.movementX; this.mouse.mdy += e.movementY; }
    });
    dom.addEventListener('mousedown', (e) => {
      e.preventDefault(); // 阻止拖拽/双击触发文本选择
      if (e.button === 0) { this.mouse.down = true; this.mouse.clicked = true; }
      if (e.button === 2) { this.mouse.rdown = true; this.mouse.rclicked = true; }
    });
    document.addEventListener('selectstart', (e) => e.preventDefault()); // 双保险：禁止任何文本选中
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) this.mouse.rdown = false;
    });
    dom.addEventListener('wheel', (e) => { this.mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  down(action) { return (this.bindings[action] || []).some((c) => this.keys.has(c)); }
  hit(action) { return (this.bindings[action] || []).some((c) => this.pressed.has(c)); }
  hitKey(code) { return this.pressed.has(code); }
  axis() {
    let x = 0, z = 0;
    if (this.down('left')) x -= 1; if (this.down('right')) x += 1;
    if (this.down('up')) z -= 1; if (this.down('down')) z += 1;
    return { x, z };
  }
  endFrame() { this.pressed.clear(); this.mouse.clicked = false; this.mouse.rclicked = false; this.mouse.wheel = 0; this.mouse.mdx = 0; this.mouse.mdy = 0; }
}
