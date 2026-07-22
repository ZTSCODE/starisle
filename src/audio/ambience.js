// 环境声床：12 层循环环境音，按 场景×时段×天气×玩家位置 计算目标增益并平滑过渡
// 近场声源点位（与 lights.js 篝火/火把、layout.js 水体一致）
const FIRES = [[70, 74], [88, 58], [64, 32], [12, 20], [22.4, -26], [25.6, -26]];
const LAKES = [[33, 32, 5], [70, 18, 7], [24, -8, 4.5]];
export class Ambience {
  constructor(audio) {
    this.audio = audio;
    this.layers = {};   // name -> { gain, target, start(), stop() }
    this.started = false;
    this.creak = 0;
  }
  ensure() {
    if (this.started || !this.audio.ctx) return;
    this.started = true;
    const c = this.audio.ctx;
    const mk = (name, setup) => {
      const g = c.createGain(); g.gain.value = 0; g.connect(this.audio.ambBus);
      const layer = { gain: g, target: 0, timer: null };
      setup(g, layer);
      this.layers[name] = layer;
    };
    // 风（常驻底床）
    mk('wind', (g, layer) => {
      const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.13; lg.gain.value = 120;
      lfo.connect(lg); lg.connect(f.frequency);
      s.connect(f); f.connect(g); s.start(); lfo.start();
    });
    // 雨（氛围型：低频雨幕底床 + 柔和落雨颗粒层，慢速阵风起伏）
    mk('rain', (g) => {
      // 底床：雨幕轰鸣，低通软化
      const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
      s.connect(f); f.connect(g); s.start();
      // 颗粒层：落雨沙沙，带通 + 慢 LFO 起伏
      const s2 = c.createBufferSource(); s2.buffer = this.audio.noiseBuf; s2.loop = true; s2.playbackRate.value = 1.4;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2100; bp.Q.value = 0.45;
      const pg = c.createGain(); pg.gain.value = 0.4;
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.07; lg.gain.value = 0.18;
      lfo.connect(lg); lg.connect(pg.gain);
      s2.connect(bp); bp.connect(pg); pg.connect(g); s2.start(); lfo.start();
    });
    // 鸟鸣（随机 chirp 排程）
    mk('birds', (g, layer) => {
      const chirp = () => {
        if (g.gain.value > 0.02) {
          const t0 = c.currentTime;
          const o = c.createOscillator(), og = c.createGain();
          const f0 = 2200 + Math.random() * 1800;
          o.frequency.setValueAtTime(f0, t0);
          o.frequency.exponentialRampToValueAtTime(f0 * (1.2 + Math.random() * 0.5), t0 + 0.08);
          o.frequency.exponentialRampToValueAtTime(f0 * 0.9, t0 + 0.16);
          og.gain.setValueAtTime(0, t0);
          og.gain.linearRampToValueAtTime(0.05, t0 + 0.02);
          og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
          o.connect(og); og.connect(g); o.start(t0); o.stop(t0 + 0.25);
        }
        layer.timer = setTimeout(chirp, 1500 + Math.random() * 5000);
      };
      chirp();
    });
    // 蝉（夏正午）
    mk('cicada', (g) => {
      const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 4800;
      const am = c.createOscillator(); am.frequency.value = 28;
      const amg = c.createGain(); amg.gain.value = 0.5;
      const base = c.createGain(); base.gain.value = 0.5;
      am.connect(amg); amg.connect(base.gain);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 4800; f.Q.value = 8;
      o.connect(base); base.connect(f); f.connect(g); o.start(); am.start();
    });
    // 夜虫（蟋蟀）
    mk('cricket', (g, layer) => {
      const chirp = () => {
        if (g.gain.value > 0.02) {
          const t0 = c.currentTime;
          for (let i = 0; i < 3; i++) {
            const o = c.createOscillator(), og = c.createGain();
            o.frequency.value = 4200 + Math.random() * 300;
            og.gain.setValueAtTime(0, t0 + i * 0.09);
            og.gain.linearRampToValueAtTime(0.04, t0 + i * 0.09 + 0.015);
            og.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.09 + 0.07);
            o.connect(og); og.connect(g); o.start(t0 + i * 0.09); o.stop(t0 + i * 0.09 + 0.09);
          }
        }
        layer.timer = setTimeout(chirp, 2500 + Math.random() * 4000);
      };
      chirp();
    });
    // 海浪
    mk('waves', (g) => {
      const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf; s.loop = true; s.playbackRate.value = 0.5;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.09; lg.gain.value = 0.5;
      const depth = c.createGain(); depth.gain.value = 0.5;
      lfo.connect(lg); lg.connect(depth.gain);
      s.connect(f); f.connect(depth); depth.connect(g); s.start(); lfo.start();
    });
    // 矿井水滴+空洞感
    mk('mine', (g, layer) => {
      const drip = () => {
        if (g.gain.value > 0.02) {
          const t0 = c.currentTime;
          const o = c.createOscillator(), og = c.createGain();
          o.frequency.setValueAtTime(900 + Math.random() * 600, t0);
          o.frequency.exponentialRampToValueAtTime(400, t0 + 0.08);
          og.gain.setValueAtTime(0.07, t0);
          og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
          o.connect(og); og.connect(g); o.start(t0); o.stop(t0 + 0.35);
        }
        layer.timer = setTimeout(drip, 3000 + Math.random() * 7000);
      };
      drip();
    });
    // 篝火/火把 噼啪（近场，随机爆点）
    mk('fire', (g, layer) => {
      // 底床：火焰呼呼声
      const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf; s.loop = true; s.playbackRate.value = 0.7;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      const base = c.createGain(); base.gain.value = 0.35;
      s.connect(f); f.connect(base); base.connect(g); s.start();
      const crackle = () => {
        if (g.gain.value > 0.02) {
          const t0 = c.currentTime;
          // 爆点：短促带通噪声 ×2~4 连发
          const n = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) {
            const dt2 = i * (0.03 + Math.random() * 0.06);
            const src = c.createBufferSource(); src.buffer = this.audio.noiseBuf;
            src.playbackRate.value = 1.5 + Math.random();
            const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400 + Math.random() * 2200; bp.Q.value = 2.5;
            const og = c.createGain();
            og.gain.setValueAtTime(0.14 + Math.random() * 0.1, t0 + dt2);
            og.gain.exponentialRampToValueAtTime(0.001, t0 + dt2 + 0.05);
            src.connect(bp); bp.connect(og); og.connect(g);
            src.start(t0 + dt2); src.stop(t0 + dt2 + 0.08);
          }
        }
        layer.timer = setTimeout(crackle, 400 + Math.random() * 1400);
      };
      crackle();
    });
    // 湖岸水拍（近场，慢涌）
    mk('waterlap', (g) => {
      const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf; s.loop = true; s.playbackRate.value = 0.6;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 480;
      const depth = c.createGain(); depth.gain.value = 0.5;
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.22; lg.gain.value = 0.35;
      lfo.connect(lg); lg.connect(depth.gain);
      s.connect(f); f.connect(depth); depth.connect(g); s.start(); lfo.start();
    });
    // 喷泉溅落（近场，亮水声）
    mk('fountain', (g) => {
      const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf; s.loop = true; s.playbackRate.value = 1.2;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3600; bp.Q.value = 0.5;
      const wob = c.createGain(); wob.gain.value = 0.6;
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.5; lg.gain.value = 0.2;
      lfo.connect(lg); lg.connect(wob.gain);
      s.connect(bp); bp.connect(wob); wob.connect(g); s.start(); lfo.start();
    });
    // 蛙鸣（春夏夜晚，湖畔近场）
    mk('frogs', (g, layer) => {
      const croak = () => {
        if (g.gain.value > 0.02) {
          const t0 = c.currentTime;
          const n = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) {
            const dt2 = i * (0.22 + Math.random() * 0.15);
            const o = c.createOscillator(), og = c.createGain();
            o.type = 'sawtooth';
            const f0 = 150 + Math.random() * 110;
            o.frequency.setValueAtTime(f0, t0 + dt2);
            o.frequency.linearRampToValueAtTime(f0 * 0.8, t0 + dt2 + 0.12);
            const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
            og.gain.setValueAtTime(0, t0 + dt2);
            og.gain.linearRampToValueAtTime(0.06, t0 + dt2 + 0.03);
            og.gain.exponentialRampToValueAtTime(0.001, t0 + dt2 + 0.16);
            o.connect(lp); lp.connect(og); og.connect(g);
            o.start(t0 + dt2); o.stop(t0 + dt2 + 0.2);
          }
        }
        layer.timer = setTimeout(croak, 2500 + Math.random() * 6000);
      };
      croak();
    });
    // 猫头鹰（深夜，稀疏两音节）
    mk('owl', (g, layer) => {
      const hoot = () => {
        if (g.gain.value > 0.02) {
          const t0 = c.currentTime;
          for (const [dt2, dur, f0] of [[0, 0.28, 380], [0.42, 0.5, 330]]) {
            const o = c.createOscillator(), og = c.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(f0, t0 + dt2);
            o.frequency.linearRampToValueAtTime(f0 * 0.92, t0 + dt2 + dur);
            og.gain.setValueAtTime(0, t0 + dt2);
            og.gain.linearRampToValueAtTime(0.05, t0 + dt2 + 0.06);
            og.gain.linearRampToValueAtTime(0, t0 + dt2 + dur);
            o.connect(og); og.connect(g);
            o.start(t0 + dt2); o.stop(t0 + dt2 + dur + 0.05);
          }
        }
        layer.timer = setTimeout(hoot, 16000 + Math.random() * 26000);
      };
      hoot();
    });
  }
  // 每帧/每秒评估目标增益
  update({ scene, minute, season, weather, px, pz }) {
    if (!this.audio.ctx) return;
    this.ensure();
    const isNight = minute >= 1200 || minute < 330;
    const isRain = weather === 'rain' || weather === 'storm';
    // 近场衰减：dist → 0..1
    const prox = (x, z, r) => {
      if (px == null) return 0;
      const d = Math.hypot(px - x, pz - z);
      return Math.max(0, 1 - d / r);
    };
    let fireT = 0;
    for (const [fx, fz] of FIRES) fireT = Math.max(fireT, prox(fx, fz, 8));
    let lakeT = 0;
    for (const [lx, lz, lr] of LAKES) {
      const d = px == null ? 99 : Math.hypot(px - lx, pz - lz);
      lakeT = Math.max(lakeT, Math.max(0, 1 - Math.max(0, d - lr) / 6));
    }
    const fountainT = prox(30, 69, 10);
    const t = {
      wind: 0.14 + (weather === 'wind' ? 0.12 : 0) + (season === 3 ? 0.06 : 0),
      rain: isRain ? (weather === 'storm' ? 0.2 : 0.13) : 0,
      birds: !isRain && !isNight && season <= 1 && scene !== 'mine' ? 0.5 : 0,
      cicada: !isRain && !isNight && season === 1 && minute >= 600 && minute <= 960 && scene !== 'mine' ? 0.16 : 0,
      cricket: isNight && scene !== 'mine' && !isRain ? 0.4 : 0,
      waves: scene === 'beach' ? 0.3 : 0,
      mine: scene === 'mine' ? 0.5 : 0,
      fire: fireT * 0.55,
      waterlap: scene === 'mine' ? 0 : lakeT * 0.32,
      fountain: fountainT * 0.3,
      frogs: isNight && season <= 1 && !isRain ? lakeT * 0.7 : 0,
      owl: isNight && scene !== 'mine' && !isRain ? 0.55 : 0,
    };
    for (const k of Object.keys(this.layers)) {
      const layer = this.layers[k];
      const target = t[k] ?? 0;
      const cur = layer.gain.gain.value;
      layer.gain.gain.setTargetAtTime(target, this.audio.ctx.currentTime, 1.2);
    }
  }
  // 远雷（暴雨随机）
  thunder(intensity = 1) {
    if (!this.audio.ctx) return;
    const c = this.audio.ctx, t0 = c.currentTime + 0.8 + Math.random() * 2.2;
    const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf; s.loop = true; s.playbackRate.value = 0.3;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(300, t0);
    f.frequency.exponentialRampToValueAtTime(60, t0 + 1.8);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.5 * intensity, t0 + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 2.2);
    s.connect(f); f.connect(g); g.connect(this.audio.ambBus);
    s.start(t0); s.stop(t0 + 2.4);
  }
}
