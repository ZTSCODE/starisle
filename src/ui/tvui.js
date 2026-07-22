// 电视面板：频道列表 + 节目内容
const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;

export class TVUI {
  constructor(game) {
    this.game = game;
    this.el = document.createElement('div');
    this.el.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:460px;max-width:94vw;display:none;z-index:150;padding:0;overflow:hidden;${PANEL}`;
    document.getElementById('ui').appendChild(this.el);
    window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.el.style.display !== 'none') this.hide(); });
  }
  show() {
    const g = this.game;
    this.el.style.display = 'block';
    g.clock.pause(true);
    g.player.frozen = true;
    g.audio.sfx('open');
    const channels = g.tv.channels();
    this.el.innerHTML = `
      <div style="padding:10px 14px;background:#0A0C14;border-bottom:2px solid #4A5578;display:flex;justify-content:space-between">
        <span style="color:#FFD98A;font-size:15px">视 汐溪电视台</span><span style="font-size:11px;color:#8A92B8">Esc 关机</span>
      </div>
      <div style="display:flex;gap:10px;padding:14px">
        <div style="display:flex;flex-direction:column;gap:6px;width:110px">
          ${channels.map((c, i) => `<button data-ch="${i}" style="padding:7px 10px;background:#2A3048;color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer;font-size:13px;text-align:left">${c.name}</button>`).join('')}
        </div>
        <div id="tv-content" style="flex:1;min-height:130px;background:#05060C;border:1px solid #2A3048;border-radius:6px;padding:14px;font-size:13px;line-height:1.7;color:#B8E8A8;text-shadow:0 0 6px #4AA84A66">
          <div style="color:#4AA84A;text-align:center;margin-top:40px">— 选择频道 —</div>
        </div>
      </div>`;
    this.el.querySelectorAll('button[data-ch]').forEach((btn) => {
      btn.onclick = () => {
        const c = channels[parseInt(btn.dataset.ch)];
        g.audio.sfx('click');
        const content = this.el.querySelector('#tv-content');
        content.innerHTML = `<div style="color:#FFD98A;margin-bottom:6px">▶ ${c.name}</div>${c.desc}`;
        if (c.action) {
          const r = c.action();
          if (r) content.innerHTML += `<div style="color:#FFD98A;margin-top:10px">★ 学会了「${r.name}」！</div>`;
        }
      };
    });
  }
  hide() {
    this.el.style.display = 'none';
    this.game.clock.pause(false);
    this.game.player.frozen = false;
    this.game.audio.sfx('close');
  }
}
