// 主线剧情系统：开场 → 旧会馆与星屿之心 → 六火种 → 结局演出（之后自由经营）
import * as THREE from 'three';
import { makePortrait } from '../ui/dialog.js';

const GRANDPA_LETTER = [
  '孩子：\n\n当你读到这封信时，我已经去了很远的地方。',
  '别难过。我这一辈子最快乐的日子，是在汐溪镇南边那座旧农场度过的——清晨有雾，夜里有星，山谷会在夏夜发光。',
  '城里人管那道光叫"星屿之心"。我年轻时见过它亮起来的样子，像整个山谷捧着一颗星星。',
  '后来光熄了，小镇也渐渐安静了。农场留给你，去把它重新过成想要的日子吧。\n\n—— 爱你的祖父',
];

export class Story {
  constructor(game) {
    this.game = game;
    if (!game.state.story) game.state.story = { stage: 0, introDone: false, ccIntro: false, sparks: 0, ended: false };
    game.bus.on('room-done', (roomId) => this.onRoomDone(roomId));
    game.bus.on('cc-visited', () => this.onCCVisit());
    game.bus.on('story-complete', () => this.playEnding());
    this.orb = null;
  }
  // ---- 开场 ----
  async playIntro() {
    const g = this.game;
    if (g.state.story.introDone) return;
    g.state.story.introDone = true;
    g.clock.pause(true);
    g.player.frozen = true;
    await g.ui.fade(true);
    // 可逐句跳过：点击/按键翻到下一句
    this._skipIntro = false;
    const onSkip = () => { this._skipIntro = true; };
    window.addEventListener('pointerdown', onSkip);
    window.addEventListener('keydown', onSkip);
    // 信件演出
    const letter = document.createElement('div');
    letter.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:520px;max-width:90vw;padding:28px;background:linear-gradient(160deg,#F0E8D0,#E8DCC0);border:1px solid #B8A888;border-radius:4px;color:#4A3A28;font-size:15px;line-height:1.9;z-index:300;box-shadow:0 8px 40px #000A;font-family:"Microsoft YaHei",serif;white-space:pre-wrap`;
    const skipTip = document.createElement('div');
    skipTip.textContent = '点击翻页 ▶';
    skipTip.style.cssText = 'position:fixed;right:24px;bottom:20px;color:#B8C0D8;font-size:13px;z-index:301;opacity:.8';
    document.getElementById('ui').append(letter, skipTip);
    for (const page of GRANDPA_LETTER) {
      letter.textContent = page;
      letter.style.opacity = '0';
      letter.style.transition = 'opacity .5s';
      requestAnimationFrame(() => letter.style.opacity = '1');
      this._skipIntro = false;
      await this.waitSkippable(4.2); // 到点自动翻页；点击立即翻下一句
    }
    letter.style.opacity = '0';
    await this.waitSkippable(0.5);
    letter.remove(); skipTip.remove();
    window.removeEventListener('pointerdown', onSkip);
    window.removeEventListener('keydown', onSkip);
    this._skipIntro = false;
    g.audio.sfx('sleep');
    await g.ui.fade(false);
    g.clock.pause(false);
    g.player.frozen = false;
    g.ui.tutorial('第一天。去农场走走吧——锄地、播种、浇水，新的生活开始了。', 8000);
    g.bus.emit('intro-done');
  }
  waitSkippable(sec) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const iv = setInterval(() => {
        if (this._skipIntro || performance.now() - t0 >= sec * 1000) { clearInterval(iv); resolve(); }
      }, 80);
    });
  }
  // ---- 旧会馆初访 ----
  async onCCVisit() {
    const g = this.game;
    if (g.state.story.ccIntro) return;
    g.state.story.ccIntro = true;
    g.state.story.stage = 1;
    const robin = g.npcSystem.entities.get('robin');
    await g.cutscene.play([
      { type: 'say', who: 'npc', text: '咦？居然有人推开这扇门了。', portrait: null },
      { type: 'say', who: 'npc', text: '我是穆青，镇长。这栋旧会馆……曾经是小镇的心脏。墙上那六块铭牌，对应六种山谷的馈赠。', },
      { type: 'say', who: 'player', text: '铭牌后面那颗黯淡的珠子，就是"星屿之心"？' },
      { type: 'say', who: 'npc', text: '你祖父跟你说过？……没错。集齐各处的物产点亮六块铭牌，星屿之心就会重新亮起来。小镇已经等了很多年了。' },
      { type: 'emo', who: 'npc', emo: 'surprise' },
    ], { npc: robin, player: { mesh: g.player.char.group } });
    g.ui.tutorial('主线目标：修复旧会馆的六个区域（打开旧会馆祭坛献祭物产）', 9000);
  }
  onRoomDone(roomId) {
    const g = this.game;
    g.state.story.sparks++;
    g.ui.tutorial(`★ 星屿之心的第 ${g.state.story.sparks}/6 块铭牌亮起来了！`, 6000);
  }
  // ---- 结局 ----
  async playEnding() {
    const g = this.game;
    if (g.state.story.ended) return;
    g.state.story.ended = true;
    g.state.story.stage = 2;
    // 星屿之心宝珠升空
    this.spawnOrb();
    const robin = g.npcSystem.entities.get('robin');
    await g.scenes.switchTo('town', [40, 14]);
    await g.cutscene.play([
      { type: 'say', who: 'npc', text: '六块铭牌……全都亮了。你听到了吗？山谷在唱歌。' },
      { type: 'say', who: 'player', text: '（旧会馆的穹顶上，那颗珠子正发出温暖的光。）' },
      { type: 'say', who: 'npc', text: '星屿之心……我长这么大，第一次见它亮起来。谢谢你，把光带回了汐溪镇。' },
      { type: 'emo', who: 'npc', emo: 'heart' },
      { type: 'say', who: 'player', text: '这是我祖父见过的光。现在，它也是我的了。' },
      { type: 'sound', name: 'levelup' },
    ], { npc: robin, player: { mesh: g.player.char.group } });
    // 烟花
    for (let i = 0; i < 24; i++) {
      setTimeout(() => {
        g.effects.burst(new THREE.Vector3(36 + Math.random() * 10, 6 + Math.random() * 4, 8 + Math.random() * 6), ['#FFD98A', '#FF8AB8', '#7AB8E8', '#8AE84A'], 18, 3.5, 2);
        g.audio.sfx('harvest');
      }, i * 260);
    }
    // 制作名单
    this.showCredits();
    g.bus.emit('ending-done');
  }
  spawnOrb() {
    const g = this.game;
    if (this.orb) return;
    const orb = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), new THREE.MeshBasicMaterial({ color: '#FFF3C8' }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), new THREE.MeshBasicMaterial({ color: '#FFD98A', transparent: true, opacity: 0.3 }));
    orb.add(core, halo);
    orb.position.set(40.5, 8, 10.5);
    const town = g.scenes.get('town');
    if (town) town.group.add(orb);
    this.orb = orb;
    const float = () => { orb.position.y = 8 + Math.sin(performance.now() / 1200) * 0.3; orb.rotation.y += 0.005; if (this.orb) requestAnimationFrame(float); };
    float();
  }
  showCredits() {
    const g = this.game;
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;background:linear-gradient(#05060C,#0A0E22);z-index:400;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#E8E8F0;transition:opacity 1.5s';
    el.innerHTML = `
      <div style="font-size:34px;color:#FFD98A;letter-spacing:10px;margin-bottom:18px">星屿物语</div>
      <div style="font-size:15px;color:#B8C0D8;line-height:2.2;text-align:center">
        星屿之心重新点亮了汐溪镇<br>
        ${g.state.player.name} 与 ${g.state.player.farmName} 的故事，才刚刚开始<br><br>
        <span style="color:#8A92B8;font-size:13px">程序 · 美术 · 音乐 · 设计：星屿工作室<br>献给每一位把日子过成诗的人</span>
      </div>
      <button id="credits-ok" style="margin-top:36px;padding:10px 40px;background:#4A5578;color:#fff;border:1px solid #FFD98A;border-radius:6px;cursor:pointer;font-size:15px">回到农场</button>`;
    document.getElementById('ui').appendChild(el);
    g.audio.sfx('levelup');
    el.querySelector('#credits-ok').onclick = () => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 1500);
      g.ui.tutorial('自由经营模式开启：图鉴、成就、14 心好感……山谷里还有很多事等着你。', 9000);
    };
  }
  wait(sec) { return new Promise((r) => setTimeout(r, sec * 1000)); }
  serialize() {}
  deserialize() {}
}
