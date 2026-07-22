// 过场引擎：宽银幕黑边 + 脚本执行（move/say/choice/emo/fade/wait/end）
import * as THREE from 'three';
import { makePortrait } from '../ui/dialog.js';

export class Cutscene {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.bars = document.createElement('div');
    this.bars.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:140;display:none';
    this.bars.innerHTML = '<div style="position:absolute;top:0;left:0;right:0;height:11%;background:#050508;transition:transform .6s"></div><div style="position:absolute;bottom:0;left:0;right:0;height:11%;background:#050508;transition:transform .6s"></div>';
    document.getElementById('ui').appendChild(this.bars);
  }
  // script: [{type, ...}]，actors: { npcId: npcEntity, player }
  async play(script, actors = {}, opts = {}) {
    const g = this.game;
    if (this.active) return false;
    this.active = true;
    g.player.frozen = true;
    g.clock.pause(true);
    this.bars.style.display = 'block';
    g.engine.setDofAmount?.(2.2);
    const npcOf = (who) => actors[who];
    try {
      for (const step of script) {
        if (!this.active) break;
        if (step.type === 'move') {
          const ent = npcOf(step.who === 'player' ? 'player' : step.who);
          if (ent) await this.moveTo(ent, step.to, step.speed || 2.2);
        } else if (step.type === 'say') {
          const ent = npcOf(step.who);
          const name = step.who === 'player' ? g.state.player.name : (ent?.def?.name || step.who);
          const portrait = ent?.def ? makePortrait(ent.def.colorScheme, 48, ent.def.id) : makePortrait(g.state.player.appearance ? { skin: '#F0C8A0', hair: '#4A3220', shirt: '#4A7AB8' } : { skin: '#F0C8A0', hair: '#4A3220', shirt: '#4A7AB8' });
          await this.say({ name, text: step.text, portrait });
        } else if (step.type === 'choice') {
          const r = await this.choice(step.prompt, step.options);
          step.result = r;
        } else if (step.type === 'emo') {
          const ent = npcOf(step.who);
          if (ent?.mesh) g.effects.floatText(ent.mesh.position.clone().add(new THREE.Vector3(0, 1.6, 0)), this.emoChar(step.emo), '#FFD98A', 22);
          g.audio.sfx('bite');
          await this.wait(0.8);
        } else if (step.type === 'fade') {
          await g.ui.fade(step.to === 'black');
          if (step.ms) await this.wait(step.ms / 1000);
        } else if (step.type === 'wait') {
          await this.wait(step.ms / 1000);
        } else if (step.type === 'hearts') {
          g.npcSystem?.addFriendship(step.npc, step.value);
        } else if (step.type === 'sound') {
          g.audio.sfx(step.name);
        }
      }
    } finally {
      this.end();
    }
    return true;
  }
  emoChar(emo) { return { heart: '♥', music: '♪', surprise: '!', angry: '※', sad: '…', sleep: 'Z', dot: '…' }[emo] || '!'; }
  async moveTo(ent, to, speed) {
    const g = this.game;
    const pos = ent.mesh ? ent.mesh.position : ent;
    return new Promise((resolve) => {
      const tick = () => {
        if (!this.active) return resolve();
        const dx = to[0] - pos.x, dz = to[1] - pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.15) return resolve();
        const sp = speed * 0.016;
        pos.x += dx / d * Math.min(sp, d);
        pos.z += dz / d * Math.min(sp, d);
        if (ent.group) ent.group.position.copy(pos);
        requestAnimationFrame(tick);
      };
      tick();
    });
  }
  say(line) {
    const g = this.game;
    return new Promise((resolve) => {
      g.dialog.show([line], { onDone: resolve });
    });
  }
  choice(prompt, options) {
    const g = this.game;
    return new Promise((resolve) => {
      g.dialog.showWithChoices([{ name: '', text: prompt, portrait: null }], options.map((o) => ({ text: o.text, cb: () => resolve(o) })));
    });
  }
  wait(sec) { return new Promise((r) => setTimeout(r, sec * 1000)); }
  end() {
    const g = this.game;
    this.active = false;
    this.bars.style.display = 'none';
    g.engine.setDofAmount?.(1.0);
    if (g.dialog.isOpen) g.dialog.hide();
    g.clock.pause(false);
    g.player.frozen = false;
  }
  skip() { this.active = false; }
}
