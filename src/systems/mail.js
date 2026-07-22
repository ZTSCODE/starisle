// 邮件系统：信箱（NPC来信/节日提醒/生日提醒/系统信件）
import * as THREE from 'three';
import { SEASON_CN } from '../core/time.js';
import { toWorld } from '../world/seamless.js';

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;

export class Mail {
  constructor(game) {
    this.game = game;
    if (!game.state.mails) game.state.mails = [];
    this.buildUI();
    game.bus.on('day-start', () => this.dailyLetters());
    // 信箱未读标记（DOM 悬浮，与 NPC 委托标记同风格）
    if (!document.getElementById('poi-mark-style')) {
      const st = document.createElement('style');
      st.id = 'poi-mark-style';
      st.textContent = `
        @keyframes poiMarkBob { 0%,100% { transform: translate(-50%,-100%); } 50% { transform: translate(-50%,-135%); } }
        .poi-mark { position: fixed; left: 0; top: 0; display: none; z-index: 40; pointer-events: none;
          font: bold 22px/1 monospace; color: #FFD94A; animation: poiMarkBob 1.2s ease-in-out infinite;
          text-shadow: -2px 0 0 #23232E, 2px 0 0 #23232E, 0 -2px 0 #23232E, 0 2px 0 #23232E, 1px 1px 0 #23232E, -1px -1px 0 #23232E, 1px -1px 0 #23232E, -1px 1px 0 #23232E; }`;
      document.head.appendChild(st);
    }
    this.markEl = document.createElement('div');
    this.markEl.className = 'poi-mark';
    this.markEl.textContent = '!';
    document.body.appendChild(this.markEl);
    this._markV = new THREE.Vector3();
    const [mx, mz] = toWorld('farm', 26, 12.2); // 信箱世界坐标（layout.js POI mailbox）
    this._boxPos = { x: mx, z: mz };
  }
  // 开场信 + 引导信：必须在 applyLoadedState 之后补发（构造函数在启动态执行，新游戏/读档会整体替换 state，
  // 在构造时发信会被清掉）。每种信按 flags 只发一次；旧档缺 flag 会在下次读档时补齐。
  checkIntroLetters() {
    const g = this.game;
    if (!g.state.flags.introMailSent) {
      g.state.flags.introMailSent = true;
      this.send('镇长 穆青', '欢迎来到汐溪镇',
        `${g.state.player.name}：\n\n我是镇长穆青。你的祖父年轻时曾在这座小镇度过了最好的时光——他说这里的星星会落在山谷里。\n\n农场就拜托你了。有任何困难，来找镇上的大家聊聊。\n\n—— 穆青`);
      this.send('杂货店 常满仓', '新店惠顾',
        `${g.state.player.name}：\n\n听说你接手的农场要重新开张了！本店种子、肥料、厨具一应俱全，周三休息，别跑空。\n\n开业前七天，种子九五折。\n\n—— 汐溪杂货店`);
    }
    // 引导信：第一天先休息，明天找常满仓开启委托
    if (!g.state.flags.restMailSent) {
      g.state.flags.restMailSent = true;
      this.send('常满仓', '好好休息，明天见',
        `${g.state.player.name}：\n\n刚到镇上，先别急着干活——好好休息一晚，养足精神。\n\n明天起，镇上的大家会有事想拜托你。我店里正缺些材料，先来杂货店找我聊聊吧。\n\n留意大家头上的标记：黄色「!」是有委托可接，绿色「?」是东西凑齐可以交付了。\n\n—— 汐溪杂货店 常满仓`);
    }
  }
  buildUI() {
    this.el = document.createElement('div');
    this.el.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:520px;max-width:94vw;max-height:70vh;display:none;z-index:150;padding:16px;${PANEL}`;
    document.getElementById('ui').appendChild(this.el);
    window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.el.style.display !== 'none') this.hide(); });
  }
  send(from, title, body, gift = null) {
    this.game.state.mails.push({ from, title, body, gift, read: false, day: this.game.clock.absoluteDay });
    this.game.state.flags.mailNew = true; // 信箱未读标记：打开信箱（show）时消除，与单封已读无关
    if (this.game.ui && this.game.state.player.scene === 'farm') this.game.ui.tutorial('✉ 信箱里有新邮件', 3000);
  }
  unread() { return this.game.state.mails.filter((m) => !m.read).length; }
  // 每帧：信箱头顶 ! 标记（有新邮件且在农场时显示；打开信箱即消除）
  update() {
    const el = this.markEl;
    if (!el) return;
    const g = this.game;
    const show = g.state.flags.mailNew && g.state.player.scene === 'farm' && !g.mining.inMine;
    if (!show) { if (el.style.display !== 'none') el.style.display = 'none'; return; }
    const v = this._markV.set(this._boxPos.x, 1.9, this._boxPos.z).project(g.engine.camera);
    if (v.z >= 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05) { if (el.style.display !== 'none') el.style.display = 'none'; return; }
    el.style.left = ((v.x * 0.5 + 0.5) * innerWidth).toFixed(1) + 'px';
    el.style.top = ((-v.y * 0.5 + 0.5) * innerHeight).toFixed(1) + 'px';
    if (el.style.display !== 'block') el.style.display = 'block';
  }
  dailyLetters() {
    const g = this.game;
    // 节日前一天提醒
    const fes = g.festivals?.tomorrowFestival?.();
    if (fes) this.send('镇长 穆青', `明日节日：${fes.name}`, `${g.state.player.name}：\n\n明天是「${fes.name}」！${fes.dialogueHint || '大家都盼着见到你。'}\n\n—— 穆青`);
    // NPC 生日提醒（明日生日）
    const npcB = g.npcSystem?.birthdayTomorrow?.();
    if (npcB) this.send('公告栏', `${npcB.name}明天生日`, `别忘了！明天是${npcB.name}的生日，送份礼物吧（生日礼物 8 倍好感）。`);
  }
  show() {
    const g = this.game;
    g.state.flags.mailNew = false; // 查看信箱即消除未读标记（不要求逐封阅读）
    if (this.markEl) this.markEl.style.display = 'none';
    this.el.style.display = 'block';
    g.clock.pause(true);
    g.player.frozen = true;
    g.audio.sfx('open');
    const list = [...g.state.mails].reverse();
    this.el.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <span style="color:#FFD98A;font-size:16px">✉ 信箱（${this.unread()} 封未读）</span>
        <span style="font-size:11px;color:#8A92B8">Esc 关闭</span>
      </div>
      <div style="overflow:auto;max-height:56vh">
        ${list.length ? list.map((m, i) => `
          <div data-mail="${i}" style="padding:10px;border-bottom:1px solid #2A3048;cursor:pointer;${m.read ? 'opacity:.55' : ''}">
            <div style="font-size:13px;color:${m.read ? '#B8C0D8' : '#FFD98A'}">${m.read ? '' : '● '}${m.title}</div>
            <div style="font-size:11px;color:#8A92B8">${m.from} · ${SEASON_CN[g.clock.season]}季</div>
          </div>`).join('') : '<div style="opacity:.5;text-align:center;padding:20px">没有邮件</div>'}
      </div>
      <div id="mail-body" style="display:none;margin-top:10px;padding:14px;background:#141826;border:1px solid #4A5578;border-radius:6px;font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:38vh;overflow:auto"></div>`;
    this.el.querySelectorAll('[data-mail]').forEach((el) => {
      el.onclick = () => {
        const m = list[parseInt(el.dataset.mail)];
        m.read = true;
        g.audio.sfx('open');
        const body = this.el.querySelector('#mail-body');
        body.style.display = 'block';
        body.innerHTML = `<b>${m.title}</b>\n${m.from}\n\n${m.body}`;
        if (m.gift) {
          const btn = document.createElement('button');
          btn.textContent = `领取附件：${m.gift.name}×${m.gift.qty}`;
          btn.style.cssText = 'margin-top:8px;padding:5px 14px;background:#4A7AB8;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer';
          btn.onclick = () => { m.gift.receive(); btn.remove(); g.audio.sfx('buy'); };
          body.appendChild(btn);
        }
        el.style.opacity = '.55';
        el.querySelector('div').textContent = m.title;
      };
    });
  }
  hide() {
    this.el.style.display = 'none';
    this.game.clock.pause(false);
    this.game.player.frozen = false;
    this.game.audio.sfx('close');
  }
  serialize() {}
  deserialize() {}
}
