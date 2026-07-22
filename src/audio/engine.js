// 音频引擎（核心）：三总线 + 合成 SFX。BGM/环境声床在本模块扩展（audio/bgm.js 接入）。
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.lastPlay = new Map(); // 防高频重复
    this.volumes = { master: 0.8, music: 0.8, sfx: 0.8 };
    this.unlocked = false;
    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      this.init();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });
  }
  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const c = this.ctx;
    this.master = c.createGain();
    this.comp = c.createDynamicsCompressor();
    this.master.connect(this.comp); this.comp.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
    this.ambBus = c.createGain(); this.ambBus.connect(this.master);
    this.applyVolumes();
    // 共享噪声 buffer
    const len = c.sampleRate * 1.2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }
  applyVolumes() {
    if (!this.ctx) return;
    this.master.gain.value = this.volumes.master ** 2;
    this.musicBus.gain.value = this.volumes.music ** 2;
    this.sfxBus.gain.value = this.volumes.sfx ** 2;
    this.ambBus.gain.value = this.volumes.sfx ** 2 * 0.8;
  }
  setVolume(group, v01) { this.volumes[group] = v01; this.applyVolumes(); }

  // ---- 基础合成原语 ----
  tone({ freq = 440, freq2 = null, dur = 0.15, type = 'square', vol = 0.2, attack = 0.005, bus = null, delay = 0 }) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (freq2) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq2), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(bus || this.sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  noise({ dur = 0.2, vol = 0.25, type = 'lowpass', freq = 800, freq2 = null, q = 1, attack = 0.003, bus = null, delay = 0, rate = 1 }) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    s.playbackRate.value = rate * (0.9 + Math.random() * 0.2);
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus || this.sfxBus);
    s.start(t0); s.stop(t0 + dur + 0.05);
  }

  // ---- SFX 注册表 ----
  sfx(name, opt = {}) {
    if (!this.ctx) return;
    const now = performance.now();
    if (this.lastPlay.has(name) && now - this.lastPlay.get(name) < 60) return;
    this.lastPlay.set(name, now);
    const v = opt.vol ?? 1;
    const fn = this['sfx_' + name];
    if (fn) fn.call(this, v, opt);
  }
  // UI
  sfx_click(v) { this.tone({ freq: 880, dur: 0.05, type: 'square', vol: 0.12 * v }); }
  sfx_open(v) { this.tone({ freq: 520, freq2: 780, dur: 0.12, type: 'triangle', vol: 0.15 * v }); this.noise({ dur: 0.08, freq: 2400, type: 'highpass', vol: 0.05 * v }); }
  sfx_close(v) { this.tone({ freq: 700, freq2: 460, dur: 0.12, type: 'triangle', vol: 0.14 * v }); }
  sfx_error(v) { this.tone({ freq: 160, dur: 0.18, type: 'sawtooth', vol: 0.14 * v }); }
  // 农耕
  sfx_hoe(v) { this.noise({ dur: 0.16, freq: 500, freq2: 180, vol: 0.3 * v }); this.tone({ freq: 90, dur: 0.1, type: 'sine', vol: 0.2 * v }); }
  sfx_hoe_grass(v) { this.noise({ dur: 0.14, freq: 900, freq2: 300, vol: 0.24 * v }); }
  sfx_water(v) { this.noise({ dur: 0.35, freq: 1800, freq2: 3600, type: 'bandpass', vol: 0.22 * v, q: 2 }); }
  sfx_plant(v) { this.noise({ dur: 0.09, freq: 1200, vol: 0.16 * v }); this.tone({ freq: 620, dur: 0.06, vol: 0.1 * v, delay: 0.02 }); }
  sfx_harvest(v) { this.tone({ freq: 660, dur: 0.08, type: 'square', vol: 0.14 * v }); this.tone({ freq: 990, dur: 0.12, type: 'square', vol: 0.14 * v, delay: 0.07 }); }
  sfx_pickup(v) { this.tone({ freq: 740, freq2: 1180, dur: 0.09, type: 'square', vol: 0.12 * v }); }
  sfx_scythe(v) { this.noise({ dur: 0.18, freq: 3000, freq2: 1200, type: 'bandpass', vol: 0.2 * v, q: 1.5 }); }
  // 采集
  sfx_chop(v) { this.noise({ dur: 0.12, freq: 700, vol: 0.3 * v }); this.tone({ freq: 140, dur: 0.08, vol: 0.2 * v }); }
  sfx_stone(v) { this.noise({ dur: 0.1, freq: 2400, type: 'highpass', vol: 0.26 * v }); this.tone({ freq: 220, freq2: 90, dur: 0.09, vol: 0.18 * v }); }
  // 战斗
  sfx_swing(v) { this.noise({ dur: 0.14, freq: 900, freq2: 2400, type: 'bandpass', vol: 0.2 * v, q: 2 }); }
  sfx_hit(v) { this.noise({ dur: 0.1, freq: 500, vol: 0.32 * v }); this.tone({ freq: 120, freq2: 60, dur: 0.12, vol: 0.24 * v }); }
  sfx_hurt(v) { this.tone({ freq: 200, freq2: 90, dur: 0.2, type: 'sawtooth', vol: 0.2 * v }); }
  // 钓鱼
  sfx_cast(v) { this.noise({ dur: 0.25, freq: 1200, freq2: 3000, type: 'bandpass', vol: 0.16 * v, q: 3 }); }
  sfx_splash(v) { this.noise({ dur: 0.3, freq: 900, freq2: 300, vol: 0.25 * v }); }
  sfx_bite(v) { for (let i = 0; i < 3; i++) this.tone({ freq: 1200, dur: 0.05, type: 'square', vol: 0.16 * v, delay: i * 0.09 }); }
  sfx_reel(v) { this.noise({ dur: 0.1, freq: 2000, type: 'bandpass', vol: 0.08 * v, q: 4, rate: 1.3 }); }
  sfx_catch(v) { [523, 659, 784, 1047].forEach((f, i) => this.tone({ freq: f, dur: 0.12, type: 'square', vol: 0.13 * v, delay: i * 0.08 })); }
  sfx_escape(v) { this.tone({ freq: 500, freq2: 200, dur: 0.3, type: 'triangle', vol: 0.16 * v }); }
  // 经济/UI 数值
  sfx_coin(v) { this.tone({ freq: 1320, dur: 0.06, type: 'square', vol: 0.12 * v }); this.tone({ freq: 1760, dur: 0.1, type: 'square', vol: 0.1 * v, delay: 0.05 }); }
  sfx_buy(v) { this.sfx_coin(v); this.tone({ freq: 660, dur: 0.08, vol: 0.1 * v, delay: 0.08 }); }
  sfx_levelup(v) { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone({ freq: f, dur: 0.16, type: 'square', vol: 0.12 * v, delay: i * 0.1 })); }
  sfx_sleep(v) { [784, 659, 523, 392].forEach((f, i) => this.tone({ freq: f, dur: 0.25, type: 'triangle', vol: 0.12 * v, delay: i * 0.18 })); }
  sfx_eat(v) { this.noise({ dur: 0.12, freq: 1000, vol: 0.14 * v }); this.tone({ freq: 300, dur: 0.08, delay: 0.06, vol: 0.1 * v }); }
  // 脚步（材质变体）
  step(surface = 'grass') {
    if (!this.ctx) return;
    const now = performance.now();
    if (this.lastPlay.has('step') && now - this.lastPlay.get('step') < 200) return;
    this.lastPlay.set('step', now);
    const conf = {
      grass: { freq: 600, dur: 0.05, vol: 0.05 },
      dirt: { freq: 400, dur: 0.06, vol: 0.06 },
      stone: { freq: 1600, dur: 0.04, vol: 0.05 },
      snow: { freq: 900, dur: 0.07, vol: 0.055 },
    }[surface] || { freq: 600, dur: 0.05, vol: 0.05 };
    this.noise({ ...conf, type: 'lowpass' });
  }
}
