// 游戏 UI 主题：像素风镶板/标题栏/按钮（注入全局样式，统一所有面板观感）
export function injectTheme() {
  const css = `
  .xg-panel {
    background: linear-gradient(180deg, #2B2F45 0%, #222538 100%);
    border: 3px solid #0C0E18;
    outline: 2px solid #B8895A;
    outline-offset: -1px;
    border-radius: 3px;
    box-shadow: 0 10px 34px rgba(0,0,0,.55), inset 0 0 0 1px #4A5578;
    color: #F0E8D8;
  }
  .xg-titlebar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 14px;
    background: linear-gradient(180deg, #96652E, #6E4423);
    border-bottom: 2px solid #0C0E18;
    color: #FFE8B0; font-weight: bold; font-size: 15px; letter-spacing: 3px;
    text-shadow: 1px 1px 0 #000;
  }
  .xg-titlebar .xg-x {
    cursor: pointer; padding: 0 8px; color: #FFD98A; font-size: 16px;
  }
  .xg-titlebar .xg-x:hover { color: #FFF; }
  .xg-body { padding: 12px 14px; }
  .xg-btn {
    display: inline-block; padding: 6px 16px; cursor: pointer; user-select: none;
    background: linear-gradient(180deg, #7A6240, #5A4630);
    border: 2px solid #0C0E18; border-radius: 3px;
    color: #FFE8C0; font-size: 13px; text-shadow: 1px 1px 0 #000;
    box-shadow: inset 0 1px 0 #B89B6A, 0 2px 4px rgba(0,0,0,.4);
  }
  .xg-btn:hover { background: linear-gradient(180deg, #8A7248, #6A5238); color: #FFF; }
  .xg-btn:active { transform: translateY(1px); box-shadow: inset 0 2px 4px rgba(0,0,0,.5); }
  .xg-btn.xg-dim { background: #3A3E52; color: #9AA2C0; cursor: not-allowed; }
  .xg-btn.xg-gold { background: linear-gradient(180deg, #A87A2E, #7A5520); color: #FFF0C8; }
  .xg-btn.xg-danger { background: linear-gradient(180deg, #8A4040, #5A2828); color: #FFD0C8; }
  .xg-input {
    background: #14161F; color: #F0E8D8; border: 2px solid #0C0E18; border-radius: 3px;
    padding: 7px 10px; font-size: 14px; outline: none;
  }
  .xg-input:focus { border-color: #B8895A; }
  .xg-hr { border: none; border-top: 1px solid #4A5578; margin: 10px 0; }
  .xg-tag {
    display: inline-block; padding: 1px 8px; font-size: 11px; border-radius: 8px;
    background: #4A3A5E; color: #D8C8F0; border: 1px solid #6A5A8A;
  }
  .xg-scroll::-webkit-scrollbar { width: 8px; }
  .xg-scroll::-webkit-scrollbar-track { background: #1A1D2A; }
  .xg-scroll::-webkit-scrollbar-thumb { background: #4A5578; border-radius: 4px; }
  input[type="range"] { accent-color: #B8895A; }
  `;
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
}
// 快捷构造：标题栏（含关闭按钮）
export function titleBar(title, onClose) {
  return `<div class="xg-titlebar"><span>${title}</span>${onClose ? '<span class="xg-x" data-xclose>✕</span>' : '<span></span>'}</div>`;
}
