// 节日系统：全镇节日（布置/活动/专属商店/对话/奖励）
// 设计文档：docs/design/festivals.md
import * as THREE from 'three';
import { FESTIVALS } from '../data/festivals.js';
import { getItem, registerItem } from '../data/items.js';
import { addItem, addMoney } from '../core/state.js';
import { SEASON_CN } from '../core/time.js';

registerItem('straw_hat', '复活草帽', 'hat', 0, { stack: 1 });
registerItem('ice_cloak', '冰雪披风', 'hat', 0, { stack: 1 });
registerItem('hot_cocoa', '热可可', 'food', 60, { edible: true, energy: 30, health: 14 });
registerItem('dressed_spinner', '精装旋式鱼漂', 'tackle', 500, { stack: 1 });

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;

export class Festivals {
  constructor(game) {
    this.game = game;
    this.decorGroup = null;
    this.active = null; // { def, state, t }
    this.panel = document.createElement('div');
    this.panel.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);min-width:min(380px,90vw);max-width:min(560px,94vw);display:none;z-index:170;padding:18px;${PANEL}`;
    document.getElementById('ui').appendChild(this.panel);
    game.bus.on('day-start', () => this.checkFestivalStart());
    game.bus.on('scene-changed', (id) => this.onSceneChanged(id));
  }
  isFestivalDay(absDay) {
    const g = this.game;
    return FESTIVALS.some((f) => f.season === g.clock.season && f.day === g.clock.day);
  }
  festivalDays() {
    // 当年全部节日的绝对日（供天气预报/昏倒特判）
    const g = this.game;
    return FESTIVALS.filter((f) => true).map((f) => (g.clock.year - 1) * 112 + f.season * 28 + f.day);
  }
  todayFestival() {
    const g = this.game;
    return FESTIVALS.find((f) => f.season === g.clock.season && f.day === g.clock.day) || null;
  }
  tomorrowFestival() {
    const g = this.game;
    const abs = g.clock.season * 28 + g.clock.day + 1;
    return FESTIVALS.find((f) => f.season * 28 + f.day === abs) || null;
  }
  currentFestival() { return this.active?.def || null; }
  checkFestivalStart() {
    const g = this.game;
    const fes = this.todayFestival();
    if (!fes) return;
    g.ui.tutorial(`◆ 今天是「${fes.name}」！去${fes.scene === 'town' ? '镇广场' : fes.scene === 'beach' ? '海滩' : '森林'}参加活动吧（${Math.floor(fes.startMinute / 60)}:00–${Math.floor(fes.endMinute / 60)}:00）。`, 9000);
    g.mail.send('镇长 穆青', `今日节日：${fes.name}`, `${g.state.player.name}：\n\n今天是「${fes.name}」！${fes.dialogueHint || ''}\n\n—— 穆青`);
  }
  onSceneChanged(id) {
    const g = this.game;
    const fes = this.todayFestival();
    if (!fes) return;
    if (id === fes.scene && g.clock.minute >= fes.startMinute && g.clock.minute < fes.endMinute) this.enterFestival(fes);
  }
  // ---- 进入节日：布置 + 活动 ----
  enterFestival(fes) {
    const g = this.game;
    if (this.active?.def === fes) return;
    this.active = { def: fes, state: {}, t: 0 };
    if (!fes.timeFlow) g.clock.pause(false); // 节日活动是否流逝（本作设定：活动期时钟照常，结束演出时暂停）
    this.setupDecor(fes);
    g.audio.sfx('catch');
    g.ui.tutorial(`◆ ${fes.name}开始了！${this.activityIntro(fes)}`, 8000);
    g.bgm.play('festival');
    g.bus.emit('festival-start', fes.id);
  }
  activityIntro(fes) {
    return {
      egg_hunt: '广场上藏着彩蛋，限时找出来！（找活动主持人开始寻蛋）',
      dance: '邀请一位 4 心以上的朋友共舞吧。',
      lantern: '夜晚的海滩点亮水灯，许下愿望，还有夜市小摊。',
      grange: '把最好的农产品摆上展台，参加农庄评比！',
      market: '冰雕市集开张，看看有什么好东西。',
      ice_fish: '冰上垂钓赛！限时钓获数最多者胜。',
    }[fes.activity.type] || '';
  }
  setupDecor(fes) {
    const g = this.game;
    this.clearDecor();
    this.decorGroup = new THREE.Group();
    const colors = { 0: 0xffc9dd, 1: 0xffd98a, 2: 0xe8873a, 3: 0xb9d9eb };
    for (const d of fes.setup?.decorations || []) {
      let mesh = null;
      if (d.type === 'flag' || d.type === 'lantern') {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 5), new THREE.MeshLambertMaterial({ color: 0x8a6a3a }));
        pole.position.set(d.x, 1.2, d.z);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: colors[fes.season], emissive: new THREE.Color(colors[fes.season]), emissiveIntensity: 1.5 }));
        bulb.position.set(d.x, 2.4, d.z);
        mesh = new THREE.Group().add(pole, bulb);
      } else if (d.type === 'stall') {
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8), new THREE.MeshLambertMaterial({ color: 0x9a6b3f, flatShading: true }));
        table.position.set(d.x, 0.4, d.z);
        const awning = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1), new THREE.MeshLambertMaterial({ color: colors[fes.season], flatShading: true }));
        awning.position.set(d.x, 1.6, d.z);
        mesh = new THREE.Group().add(table, awning);
      } else if (d.type === 'ice') {
        mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), new THREE.MeshLambertMaterial({ color: 0xb9d9eb, emissive: 0x7ab8e8, emissiveIntensity: 0.5, flatShading: true }));
        mesh.position.set(d.x, 0.4, d.z);
      } else if (d.type === 'tree') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1, 5), new THREE.MeshLambertMaterial({ color: 0x6e4a2a }));
        trunk.position.set(d.x, 0.5, d.z);
        const top = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x3e8b4a, emissive: 0xffd98a, emissiveIntensity: 0.15, flatShading: true }));
        top.position.set(d.x, 1.7, d.z);
        mesh = new THREE.Group().add(trunk, top);
      }
      if (mesh) this.decorGroup.add(mesh);
    }
    g.scenes.current.group.add(this.decorGroup);
  }
  clearDecor() {
    if (this.decorGroup?.parent) this.decorGroup.parent.remove(this.decorGroup);
    this.decorGroup = null;
  }
  // ---- 活动交互（由各节日互动点调用）----
  interact() {
    const g = this.game;
    if (!this.active) return false;
    const type = this.active.def.activity.type;
    if (type === 'egg_hunt') return this.eggHunt();
    if (type === 'dance') return this.dance();
    if (type === 'lantern') return this.lantern();
    if (type === 'grange') return this.grange();
    if (type === 'market') return this.market();
    if (type === 'ice_fish') return this.iceFish();
    return false;
  }
  showPanel(html, buttons) {
    const g = this.game;
    this.panel.style.display = 'block';
    g.clock.pause(true);
    g.player.frozen = true;
    this.panel.innerHTML = html;
    for (const [label, cb] of buttons || []) {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = 'margin:10px 6px 0 0;padding:6px 18px;background:#4A5578;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:14px';
      btn.onclick = () => { this.closePanel(); cb(); };
      this.panel.appendChild(btn);
    }
  }
  closePanel() {
    this.panel.style.display = 'none';
    this.game.clock.pause(false);
    this.game.player.frozen = false;
  }
  // 1. 寻蛋
  eggHunt() {
    const g = this.game, st = this.active.state;
    if (st.eggDone) { g.ui.tutorial('寻蛋已经结束了，明年再来吧！', 3000); return true; }
    if (!st.eggs) {
      // 生成 12 颗彩蛋
      st.eggs = [];
      const scene = g.scenes.current;
      for (let i = 0; i < 12; i++) {
        const egg = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshLambertMaterial({ color: [0xff8ab8, 0x8ae84a, 0x7ab8e8, 0xffd98a][i % 4], emissiveIntensity: 0.4, emissive: 0xffffff }));
        egg.scale.y = 1.25;
        const x = 18 + Math.random() * 20, z = 16 + Math.random() * 14;
        egg.position.set(x, 0.16, z);
        scene.group.add(egg);
        st.eggs.push({ mesh: egg, x, z, found: false });
      }
      st.eggT = 50; st.found = 0;
      g.ui.tutorial('寻蛋开始！50 秒内找出广场上的彩蛋（走近自动拾取）', 5000);
      g.audio.sfx('catch');
      return true;
    }
    return true;
  }
  updateEggHunt(dt) {
    const g = this.game, st = this.active.state;
    st.eggT -= dt;
    for (const e of st.eggs) {
      if (!e.found && Math.hypot(g.player.pos.x - e.x, g.player.pos.z - e.z) < 0.9) {
        e.found = true;
        e.mesh.visible = false;
        st.found++;
        g.audio.sfx('pickup');
        g.effects.burst(e.mesh.position, ['#FFD98A', '#FFFFFF'], 8, 1.6);
        g.effects.floatText(e.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), `彩蛋 ${st.found}/12`, '#FFD98A', 13);
      }
    }
    if ((st.eggT <= 0 || st.found >= 12) && !st.eggDone) {
      st.eggDone = true;
      for (const e of st.eggs) e.mesh.visible = false;
      const win = st.found >= 9;
      this.showPanel(`
        <div style="font-size:18px;color:#FFD98A;margin-bottom:8px">蛋 寻蛋结果</div>
        <div>找到彩蛋：<b>${st.found}</b> / 12</div>
        <div style="margin-top:8px;color:${win ? '#8AE84A' : '#B8C0D8'}">${win ? '太厉害了！冠军是你的！奖品：复活草帽' : '差一点点……明年再接再厉！'}</div>`,
        [['收下祝福', () => {
          if (win) { addItem(g.state, 'straw_hat', 1, 0); g.audio.sfx('levelup'); }
          g.bus.emit('festival-activity-done', { id: 'egg_hunt', score: st.found });
        }]]);
    }
  }
  // 2. 花舞节
  dance() {
    const g = this.game;
    const partners = [...g.npcSystem.entities.values()].filter((e) => e.def.marriage && g.npcSystem.heartsOf(e.def.id) >= 4 && !g.state.npcs[e.def.id].spouse);
    if (!partners.length) { g.ui.tutorial('花舞节需要一位 4 心以上的舞伴……先去和镇上的大家交朋友吧。', 5000); return true; }
    const p0 = partners[0];
    this.showPanel(`
      <div style="font-size:18px;color:#FFC9DD;margin-bottom:8px">花 花舞节</div>
      <div>邀请 <b>${p0.def.name}</b> 共舞一曲吗？</div>
      <div style="font-size:12px;color:#8A92B8;margin-top:4px">（共舞 +250 好感）</div>`,
      [[`邀请 ${p0.def.name}`, async () => {
        g.npcSystem.addFriendship(p0.def.id, 250);
        await g.cutscene.play([
          { type: 'say', who: p0.def.id, text: '真的吗？……乐意之至。' },
          { type: 'emo', who: p0.def.id, emo: 'heart' },
          { type: 'say', who: 'player', text: '（在花雨中跳了一支笨拙但开心的舞。）' },
        ], { [p0.def.id]: p0, player: { mesh: g.player.char.group } });
        g.ui.tutorial('花 美好的一个下午。', 4000);
        g.bus.emit('festival-activity-done', { id: 'dance', partner: p0.def.id });
      }], ['改天吧', () => {}]]);
    return true;
  }
  // 3. 萤火夜市
  lantern() {
    const g = this.game, st = this.active.state;
    if (st.lanternDone) { g.ui.tutorial('水灯已经放出去了。看，海面上都是星星。', 4000); return true; }
    this.showPanel(`
      <div style="font-size:18px;color:#FFD98A;margin-bottom:8px">灯 萤火夜市</div>
      <div>在纸灯上写下愿望，放进海里。据说顺流漂得越远，愿望就越容易实现。</div>`,
      [['放一盏水灯', async () => {
        st.lanternDone = true;
        // 水灯演出：海面漂灯
        for (let i = 0; i < 10; i++) {
          const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshLambertMaterial({ color: 0xffd98a, emissive: 0xffb46b, emissiveIntensity: 2 }));
          l.position.set(20 + Math.random() * 10, 0.1, 20 + i * 0.8);
          g.scenes.current.group.add(l);
          const dir = Math.random() * Math.PI * 2;
          const anim = () => { l.position.x += Math.cos(dir) * 0.004; l.position.z += 0.008; if (l.parent) requestAnimationFrame(anim); };
          anim();
        }
        g.audio.sfx('levelup');
        g.effects.burst(g.player.pos.clone().add(new THREE.Vector3(0, 1, 0)), ['#FFD98A', '#FF8AB8'], 16, 2);
        g.ui.tutorial('愿望顺着潮水远去了……', 4000);
        g.bus.emit('festival-activity-done', { id: 'lantern' });
      }]]);
    return true;
  }
  // 4. 丰收评比
  grange() {
    const g = this.game, st = this.active.state;
    if (st.grangeDone) { g.ui.tutorial('评比已经结束了。', 3000); return true; }
    // 评分：背包里最好的 9 件物品（作物/畜产/工匠品按价格+品质）
    const scored = g.state.player.inventory.filter(Boolean)
      .filter((s) => ['crop', 'animal', 'artisan', 'fish'].includes(getItem(s.id).type))
      .map((s) => ({ s, score: sellScore(s) }))
      .sort((a, b) => b.score - a.score).slice(0, 9);
    function sellScore(s) { return getItem(s.id).price * (1 + s.quality * 0.5); }
    const total = Math.round(scored.reduce((n, x) => n + x.score, 0) / 9);
    const rank = total >= 120 ? 1 : total >= 70 ? 2 : total >= 35 ? 3 : 4;
    st.grangeDone = true;
    const reward = [0, 500, 300, 150, 50][rank];
    this.showPanel(`
      <div style="font-size:18px;color:#FFD98A;margin-bottom:8px">棚 丰收评比</div>
      <div>展品平均评分：<b>${total}</b></div>
      <div style="margin-top:6px">名次：<b style="color:${rank === 1 ? '#FFD98A' : '#B8C0D8'}">第 ${rank} 名</b>（星币 ${reward}）</div>
      <div style="font-size:12px;color:#8A92B8;margin-top:6px">提示：高品质作物、工匠品能拿高分</div>`,
      [['领取星币', () => {
        g.state.player.casinoCoins += reward;
        g.audio.sfx('coin');
        g.bus.emit('festival-activity-done', { id: 'grange', rank });
      }]]);
    return true;
  }
  // 5. 冰雕市集 → 打开节日商店
  market() {
    const g = this.game;
    this.showPanel(`
      <div style="font-size:18px;color:#B9D9EB;margin-bottom:8px">雪 冰雕市集</div>
      <div>冰雕师傅们的手艺一年比一年好。看看纪念品？</div>`,
      [['购买 冰雪披风（500g）', () => { if (g.state.player.money >= 500) { addMoney(g.state, -500); addItem(g.state, 'ice_cloak', 1, 0); g.audio.sfx('buy'); } else g.audio.sfx('error'); }],
       ['购买 热可可×3（150g）', () => { if (g.state.player.money >= 150) { addMoney(g.state, -150); addItem(g.state, 'hot_cocoa', 3, 0); g.audio.sfx('buy'); } else g.audio.sfx('error'); }],
       ['随便逛逛', () => {}]]);
    return true;
  }
  // 6. 冰钓赛
  iceFish() {
    const g = this.game, st = this.active.state;
    if (st.iceDone) { g.ui.tutorial('比赛已经结束了。', 3000); return true; }
    if (!st.iceStart) {
      st.iceStart = true; st.iceT = 300; st.iceCount = g.state.player.stats.fished;
      g.ui.tutorial('冰钓赛开始！5 分钟内尽可能多钓鱼！', 5000);
      g.audio.sfx('catch');
      return true;
    }
    return true;
  }
  updateIceFish(dt) {
    const g = this.game, st = this.active.state;
    st.iceT -= dt;
    if (st.iceT <= 0 && !st.iceDone) {
      st.iceDone = true;
      const caught = g.state.player.stats.fished - st.iceCount;
      const win = caught >= 5;
      this.showPanel(`
        <div style="font-size:18px;color:#B9D9EB;margin-bottom:8px">钓 冰钓赛结果</div>
        <div>钓获：<b>${caught}</b> 条</div>
        <div style="margin-top:6px;color:${win ? '#8AE84A' : '#B8C0D8'}">${win ? '冠军！奖品：精装旋式鱼漂' : '还差一点……明年再来！'}</div>`,
        [['收下', () => {
          if (win) { addItem(g.state, 'dressed_spinner', 1, 0); g.audio.sfx('levelup'); }
          g.bus.emit('festival-activity-done', { id: 'ice_fish', caught });
        }]]);
    }
  }
  // ---- 帧更新 ----
  update(dt) {
    if (!this.active) return;
    const type = this.active.def.activity.type;
    if (type === 'egg_hunt' && this.active.state.eggs && !this.active.state.eggDone) this.updateEggHunt(dt);
    if (type === 'ice_fish' && this.active.state.iceStart && !this.active.state.iceDone) this.updateIceFish(dt);
    // 节日结束（过点）
    const g = this.game;
    if (g.clock.minute >= this.active.def.endMinute) {
      const fes = this.active.def;
      this.active = null;
      this.clearDecor();
      g.ui.tutorial(`${fes.name}结束了。回家吧，明天又是新的一天。`, 5000);
      g.bgm.stop();
      g.bus.emit('festival-end', fes.id);
    }
  }
  serialize() {}
  deserialize() {}
}
