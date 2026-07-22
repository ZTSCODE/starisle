// 程序化 chiptune BGM：NES 声部（2×square + triangle bass + 噪声鼓）+ 前瞻排程器
// 曲目 ≥8：四季白天/夜晚变奏/标题/矿井/节日/雨天氛围
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// 曲谱 DSL：track = { bpm, bars, melody:[ [bar,step(0-15),midi,len], harmony同, bass:[bar,step,midi,len], drums:[bar,step,'k'|'h'|'s'], lead:'square'|'triangle', pad?:true, echo?:true }
const T = {
  spring: {
    bpm: 100, bars: 8, lead: 'square',
    melody: [
      [0, 0, 72, 2], [0, 2, 74, 2], [0, 4, 76, 3], [0, 8, 74, 2], [0, 12, 72, 4],
      [1, 0, 69, 2], [1, 2, 72, 2], [1, 4, 76, 3], [1, 8, 74, 2], [1, 12, 71, 4],
      [2, 0, 72, 2], [2, 2, 74, 2], [2, 4, 76, 3], [2, 8, 79, 2], [2, 12, 76, 4],
      [3, 0, 74, 3], [3, 4, 71, 3], [3, 8, 72, 6],
      [4, 0, 76, 2], [4, 2, 79, 2], [4, 4, 81, 3], [4, 8, 79, 2], [4, 12, 76, 4],
      [5, 0, 74, 2], [5, 2, 76, 2], [5, 4, 74, 3], [5, 8, 71, 2], [5, 12, 69, 4],
      [6, 0, 72, 2], [6, 2, 76, 2], [6, 4, 74, 3], [6, 8, 72, 2], [6, 12, 71, 4],
      [7, 0, 72, 8],
    ],
    harmony: [
      [0, 0, 60, 4], [0, 8, 64, 4], [1, 0, 57, 4], [1, 8, 59, 4], [2, 0, 60, 4], [2, 8, 64, 4], [3, 0, 59, 4], [3, 8, 60, 4],
      [4, 0, 64, 4], [4, 8, 67, 4], [5, 0, 62, 4], [5, 8, 57, 4], [6, 0, 60, 4], [6, 8, 59, 4], [7, 0, 60, 8],
    ],
    bass: [
      [0, 0, 48, 4], [0, 8, 48, 4], [1, 0, 45, 4], [1, 8, 43, 4], [2, 0, 48, 4], [2, 8, 48, 4], [3, 0, 43, 4], [3, 8, 48, 4],
      [4, 0, 48, 4], [4, 8, 45, 4], [5, 0, 41, 4], [5, 8, 43, 4], [6, 0, 48, 4], [6, 8, 43, 4], [7, 0, 48, 8],
    ],
    drums: [[0, 0, 'k'], [0, 8, 'h'], [1, 0, 'k'], [1, 8, 'h'], [2, 0, 'k'], [2, 8, 'h'], [3, 0, 'k'], [3, 8, 'h'], [4, 0, 'k'], [4, 8, 'h'], [5, 0, 'k'], [5, 8, 'h'], [6, 0, 'k'], [6, 8, 'h'], [7, 0, 'k'], [7, 4, 'h'], [7, 8, 'h']],
  },
  summer: {
    bpm: 112, bars: 8, lead: 'square',
    melody: [
      [0, 0, 74, 1], [0, 2, 78, 1], [0, 4, 81, 2], [0, 8, 78, 1], [0, 10, 74, 1], [0, 12, 71, 2],
      [1, 0, 74, 2], [1, 4, 69, 1], [1, 6, 71, 1], [1, 8, 74, 2], [1, 12, 78, 2],
      [2, 0, 81, 1], [2, 2, 78, 1], [2, 4, 74, 2], [2, 8, 71, 1], [2, 10, 74, 1], [2, 12, 78, 2],
      [3, 0, 74, 6],
      [4, 0, 78, 1], [4, 2, 81, 1], [4, 4, 83, 2], [4, 8, 81, 1], [4, 10, 78, 1], [4, 12, 74, 2],
      [5, 0, 76, 2], [5, 4, 71, 1], [5, 6, 74, 1], [5, 8, 76, 2], [5, 12, 69, 2],
      [6, 0, 71, 1], [6, 2, 74, 1], [6, 4, 78, 2], [6, 8, 74, 1], [6, 10, 71, 1], [6, 12, 69, 2],
      [7, 0, 71, 6],
    ],
    harmony: [
      [0, 0, 62, 2], [0, 8, 66, 2], [1, 0, 62, 2], [1, 8, 57, 2], [2, 0, 62, 2], [2, 8, 59, 2], [3, 0, 62, 4],
      [4, 0, 66, 2], [4, 8, 69, 2], [5, 0, 64, 2], [5, 8, 57, 2], [6, 0, 59, 2], [6, 8, 57, 2], [7, 0, 59, 4],
    ],
    bass: [
      [0, 0, 50, 2], [0, 4, 50, 1], [0, 8, 50, 2], [1, 0, 45, 2], [1, 8, 50, 2], [2, 0, 47, 2], [2, 8, 47, 2], [3, 0, 50, 4],
      [4, 0, 50, 2], [4, 8, 45, 2], [5, 0, 43, 2], [5, 8, 45, 2], [6, 0, 47, 2], [6, 8, 45, 2], [7, 0, 47, 4],
    ],
    drums: [[0, 0, 'k'], [0, 4, 'h'], [0, 8, 's'], [0, 12, 'h'], [1, 0, 'k'], [1, 4, 'h'], [1, 8, 's'], [1, 12, 'h'], [2, 0, 'k'], [2, 4, 'h'], [2, 8, 's'], [2, 12, 'h'], [3, 0, 'k'], [3, 8, 's'], [4, 0, 'k'], [4, 4, 'h'], [4, 8, 's'], [4, 12, 'h'], [5, 0, 'k'], [5, 4, 'h'], [5, 8, 's'], [5, 12, 'h'], [6, 0, 'k'], [6, 4, 'h'], [6, 8, 's'], [6, 12, 'h'], [7, 0, 'k'], [7, 8, 's']],
  },
  autumn: {
    bpm: 92, bars: 8, lead: 'square',
    melody: [
      [0, 0, 69, 3], [0, 4, 72, 3], [0, 8, 74, 3], [0, 12, 76, 4],
      [1, 0, 74, 3], [1, 4, 72, 3], [1, 8, 69, 6],
      [2, 0, 67, 3], [2, 4, 69, 3], [2, 8, 72, 3], [2, 12, 74, 4],
      [3, 0, 72, 3], [3, 4, 69, 3], [3, 8, 67, 6],
      [4, 0, 69, 3], [4, 4, 72, 3], [4, 8, 76, 3], [4, 12, 79, 4],
      [5, 0, 76, 3], [5, 4, 74, 3], [5, 8, 72, 6],
      [6, 0, 74, 3], [6, 4, 72, 3], [6, 8, 69, 3], [6, 12, 67, 4],
      [7, 0, 69, 8],
    ],
    harmony: [
      [0, 0, 57, 4], [0, 8, 60, 4], [1, 0, 57, 4], [1, 8, 55, 4], [2, 0, 55, 4], [2, 8, 57, 4], [3, 0, 55, 4], [3, 8, 57, 4],
      [4, 0, 57, 4], [4, 8, 60, 4], [5, 0, 57, 4], [5, 8, 55, 4], [6, 0, 55, 4], [6, 8, 57, 4], [7, 0, 57, 8],
    ],
    bass: [
      [0, 0, 45, 4], [0, 8, 45, 4], [1, 0, 41, 4], [1, 8, 43, 4], [2, 0, 43, 4], [2, 8, 45, 4], [3, 0, 43, 4], [3, 8, 45, 4],
      [4, 0, 45, 4], [4, 8, 41, 4], [5, 0, 38, 4], [5, 8, 43, 4], [6, 0, 43, 4], [6, 8, 45, 4], [7, 0, 45, 8],
    ],
    drums: [[0, 0, 'k'], [0, 8, 'h'], [1, 0, 'k'], [1, 8, 'h'], [2, 0, 'k'], [2, 8, 'h'], [3, 0, 'k'], [3, 8, 'h'], [4, 0, 'k'], [4, 8, 'h'], [5, 0, 'k'], [5, 8, 'h'], [6, 0, 'k'], [6, 8, 'h'], [7, 0, 'k'], [7, 8, 'h']],
  },
  winter: {
    bpm: 80, bars: 8, lead: 'triangle', pad: true,
    melody: [
      [0, 0, 74, 4], [0, 8, 72, 4], [1, 0, 69, 8], [2, 0, 70, 4], [2, 8, 72, 4], [3, 0, 74, 8],
      [4, 0, 77, 4], [4, 8, 76, 4], [5, 0, 74, 8], [6, 0, 72, 4], [6, 8, 70, 4], [7, 0, 69, 8],
    ],
    harmony: [
      [0, 0, 62, 8], [1, 0, 57, 8], [2, 0, 58, 8], [3, 0, 62, 8], [4, 0, 65, 8], [5, 0, 62, 8], [6, 0, 58, 8], [7, 0, 57, 8],
    ],
    bass: [
      [0, 0, 50, 8], [1, 0, 45, 8], [2, 0, 46, 8], [3, 0, 50, 8], [4, 0, 53, 8], [5, 0, 50, 8], [6, 0, 46, 8], [7, 0, 45, 8],
    ],
    drums: [],
  },
  night: {
    bpm: 70, bars: 4, lead: 'triangle', pad: true,
    melody: [
      [0, 0, 72, 6], [0, 8, 71, 6], [1, 0, 69, 12], [2, 0, 67, 6], [2, 8, 69, 6], [3, 0, 72, 12],
    ],
    harmony: [[0, 0, 60, 12], [1, 0, 57, 12], [2, 0, 55, 12], [3, 0, 60, 12]],
    bass: [[0, 0, 48, 12], [1, 0, 45, 12], [2, 0, 43, 12], [3, 0, 48, 12]],
    drums: [],
  },
  mine: {
    bpm: 85, bars: 8, lead: 'square', echo: true,
    melody: [
      [0, 0, 57, 4], [0, 8, 57, 4], [1, 0, 60, 4], [1, 8, 59, 4], [2, 0, 57, 8], [3, 0, 55, 8],
      [4, 0, 57, 4], [4, 8, 62, 4], [5, 0, 60, 4], [5, 8, 59, 4], [6, 0, 57, 8], [7, 0, 57, 8],
    ],
    harmony: [[0, 0, 45, 8], [1, 0, 48, 8], [2, 0, 45, 8], [3, 0, 43, 8], [4, 0, 45, 8], [5, 0, 48, 8], [6, 0, 45, 8], [7, 0, 45, 8]],
    bass: [[0, 0, 33, 4], [0, 8, 33, 4], [1, 0, 36, 4], [1, 8, 36, 4], [2, 0, 33, 8], [3, 0, 31, 8], [4, 0, 33, 4], [4, 8, 33, 4], [5, 0, 36, 4], [5, 8, 35, 4], [6, 0, 33, 8], [7, 0, 33, 8]],
    drums: [[0, 0, 'k'], [0, 12, 'h'], [1, 0, 'k'], [1, 12, 'h'], [2, 0, 'k'], [2, 12, 'h'], [3, 0, 'k'], [3, 12, 'h'], [4, 0, 'k'], [4, 12, 'h'], [5, 0, 'k'], [5, 12, 'h'], [6, 0, 'k'], [6, 12, 'h'], [7, 0, 'k'], [7, 12, 'h']],
  },
  festival: {
    bpm: 120, bars: 8, lead: 'square',
    melody: [
      [0, 0, 72, 2], [0, 4, 72, 2], [0, 8, 76, 2], [0, 12, 79, 4],
      [1, 0, 77, 2], [1, 4, 76, 2], [1, 8, 74, 2], [1, 12, 72, 4],
      [2, 0, 74, 2], [2, 4, 74, 2], [2, 8, 77, 2], [2, 12, 81, 4],
      [3, 0, 79, 2], [3, 4, 77, 2], [3, 8, 76, 2], [3, 12, 74, 4],
      [4, 0, 72, 2], [4, 4, 76, 2], [4, 8, 79, 2], [4, 12, 84, 4],
      [5, 0, 81, 2], [5, 4, 79, 2], [5, 8, 77, 2], [5, 12, 76, 4],
      [6, 0, 74, 2], [6, 4, 77, 2], [6, 8, 79, 2], [6, 12, 77, 4],
      [7, 0, 76, 2], [7, 4, 74, 2], [7, 8, 72, 8],
    ],
    harmony: [
      [0, 0, 60, 4], [0, 8, 64, 4], [1, 0, 65, 4], [1, 8, 60, 4], [2, 0, 62, 4], [2, 8, 67, 4], [3, 0, 65, 4], [3, 8, 62, 4],
      [4, 0, 60, 4], [4, 8, 64, 4], [5, 0, 65, 4], [5, 8, 64, 4], [6, 0, 62, 4], [6, 8, 65, 4], [7, 0, 64, 4], [7, 8, 60, 4],
    ],
    bass: [
      [0, 0, 48, 2], [0, 8, 48, 2], [1, 0, 53, 2], [1, 8, 48, 2], [2, 0, 50, 2], [2, 8, 55, 2], [3, 0, 53, 2], [3, 8, 50, 2],
      [4, 0, 48, 2], [4, 8, 48, 2], [5, 0, 53, 2], [5, 8, 52, 2], [6, 0, 50, 2], [6, 8, 53, 2], [7, 0, 52, 2], [7, 8, 48, 4],
    ],
    drums: [[0, 0, 'k'], [0, 4, 'h'], [0, 8, 'k'], [0, 12, 'h'], [1, 0, 'k'], [1, 4, 'h'], [1, 8, 'k'], [1, 12, 'h'], [2, 0, 'k'], [2, 4, 'h'], [2, 8, 'k'], [2, 12, 'h'], [3, 0, 'k'], [3, 4, 'h'], [3, 8, 'k'], [3, 12, 'h'], [4, 0, 'k'], [4, 4, 'h'], [4, 8, 'k'], [4, 12, 'h'], [5, 0, 'k'], [5, 4, 'h'], [5, 8, 'k'], [5, 12, 'h'], [6, 0, 'k'], [6, 4, 'h'], [6, 8, 'k'], [6, 12, 'h'], [7, 0, 'k'], [7, 4, 'h'], [7, 8, 'k'], [7, 12, 'h']],
  },
  title: {
    bpm: 96, bars: 8, lead: 'triangle', pad: true,
    melody: [
      [0, 0, 67, 3], [0, 4, 72, 3], [0, 8, 74, 3], [0, 12, 76, 6],
      [1, 0, 74, 3], [1, 4, 72, 3], [1, 8, 74, 8],
      [2, 0, 76, 3], [2, 4, 79, 3], [2, 8, 76, 3], [2, 12, 74, 6],
      [3, 0, 72, 3], [3, 4, 74, 3], [3, 8, 67, 8],
      [4, 0, 72, 3], [4, 4, 76, 3], [4, 8, 79, 3], [4, 12, 81, 6],
      [5, 0, 79, 3], [5, 4, 76, 3], [5, 8, 74, 8],
      [6, 0, 72, 3], [6, 4, 74, 3], [6, 8, 76, 3], [6, 12, 74, 6],
      [7, 0, 72, 12],
    ],
    harmony: [
      [0, 0, 55, 6], [0, 8, 59, 6], [1, 0, 57, 6], [1, 8, 55, 6], [2, 0, 59, 6], [2, 8, 57, 6], [3, 0, 55, 12],
      [4, 0, 60, 6], [4, 8, 64, 6], [5, 0, 59, 6], [5, 8, 57, 6], [6, 0, 55, 6], [6, 8, 57, 6], [7, 0, 55, 12],
    ],
    bass: [
      [0, 0, 43, 6], [0, 8, 43, 6], [1, 0, 45, 12], [2, 0, 47, 6], [2, 8, 45, 6], [3, 0, 43, 12],
      [4, 0, 48, 6], [4, 8, 48, 6], [5, 0, 47, 6], [5, 8, 45, 6], [6, 0, 43, 6], [6, 8, 45, 6], [7, 0, 43, 12],
    ],
    drums: [],
  },
  rain: {
    bpm: 75, bars: 4, lead: 'triangle', pad: true,
    melody: [
      [0, 0, 69, 6], [0, 8, 67, 6], [1, 0, 64, 12], [2, 0, 65, 6], [2, 8, 67, 6], [3, 0, 69, 12],
    ],
    harmony: [[0, 0, 57, 12], [1, 0, 52, 12], [2, 0, 53, 12], [3, 0, 57, 12]],
    bass: [[0, 0, 45, 12], [1, 0, 40, 12], [2, 0, 41, 12], [3, 0, 45, 12]],
    drums: [],
  },
  sea: { // 海边：静默孤独（稀疏长音 + 回声，小调五声）
    bpm: 66, bars: 8, lead: 'triangle', pad: true, echo: true,
    melody: [
      [0, 0, 69, 8], [1, 0, 74, 4], [1, 8, 72, 8], [2, 0, 69, 12],
      [4, 0, 76, 8], [5, 0, 74, 4], [5, 8, 72, 8], [6, 0, 67, 12],
    ],
    harmony: [
      [0, 0, 57, 16], [2, 0, 53, 16], [4, 0, 55, 16], [6, 0, 52, 16],
    ],
    bass: [
      [0, 0, 45, 16], [2, 0, 41, 16], [4, 0, 43, 16], [6, 0, 40, 16],
    ],
    drums: [],
  },
};
export const TRACKS = Object.keys(T);

export class BGMPlayer {
  constructor(audio) {
    this.audio = audio;
    this.current = null;
    this.timer = null;
    this.step = 0;
    this.bar = 0;
    this.nextTime = 0;
    this.out = null;
    this.silenceTimer = null;
  }
  play(name, { silenceAfter = true } = {}) {
    if (!this.audio.ctx || this.current === name) return;
    this.stop();
    const track = T[name];
    if (!track) return;
    this.current = name;
    const c = this.audio.ctx;
    // 输出链：echo 曲加 delay
    this.out = c.createGain();
    this.out.gain.value = 0;
    this.out.connect(this.audio.musicBus);
    if (track.echo) {
      const d = c.createDelay(1); d.delayTime.value = 0.28;
      const fb = c.createGain(); fb.gain.value = 0.3;
      const wet = c.createGain(); wet.gain.value = 0.35;
      this.out.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(this.audio.musicBus);
    }
    // 淡入
    this.out.gain.linearRampToValueAtTime(0.9, c.currentTime + 1.5);
    this.step = 0; this.bar = 0;
    this.nextTime = c.currentTime + 0.1;
    this.tick();
    // 播完不循环（对标 SDV 静默交替）：完整 2 遍后静默 25–50s 再评估
    this.loops = 0;
    this.silenceAfter = silenceAfter;
  }
  stop(fade = 1.0) {
    if (!this.current || !this.audio.ctx) { this.current = null; return; }
    const c = this.audio.ctx, out = this.out;
    if (out) {
      out.gain.cancelScheduledValues(c.currentTime);
      out.gain.setValueAtTime(out.gain.value, c.currentTime);
      out.gain.linearRampToValueAtTime(0, c.currentTime + fade);
      setTimeout(() => out.disconnect(), fade * 1000 + 100);
    }
    clearTimeout(this.timer);
    this.current = null;
  }
  tick() {
    if (!this.current) return;
    const track = T[this.current];
    const c = this.audio.ctx;
    const stepDur = 60 / track.bpm / 4;
    // 前瞻排程 2 小节
    while (this.nextTime < c.currentTime + stepDur * 32) {
      const t = this.nextTime;
      const bar = this.bar % track.bars, step = this.step;
      this.scheduleNotes(track, bar, step, t, stepDur);
      this.step++;
      if (this.step >= 16) { this.step = 0; this.bar++; if (this.bar % track.bars === 0) this.loops++; }
      this.nextTime += stepDur;
    }
    // 播完 2 遍：淡出 → 静默 → 回调
    if (this.loops >= 2 && this.silenceAfter) {
      const name = this.current;
      this.stop(2);
      this.silenceTimer = setTimeout(() => { this.onSilence && this.onSilence(name); }, 25000 + Math.random() * 25000);
      return;
    }
    this.timer = setTimeout(() => this.tick(), 80);
  }
  scheduleNotes(track, bar, step, t, stepDur) {
    const c = this.audio.ctx;
    const voices = [
      [track.melody, track.lead || 'square', 0.16],
      [track.harmony, 'square', 0.07],
      [track.bass, 'triangle', 0.15],
    ];
    for (const [notes, wave, vol] of voices) {
      for (const [b, s, midi, len] of notes) {
        if (b === bar && s === step) this.note(midi, t, len * stepDur, wave, vol, track.pad);
      }
    }
    for (const [b, s, kind] of track.drums) {
      if (b === bar && s === step) this.drum(kind, t);
    }
  }
  note(midi, t, dur, wave, vol, pad) {
    const c = this.audio.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = wave; o.frequency.value = mtof(midi);
    const atk = pad ? Math.min(0.08, dur * 0.3) : 0.008;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.setValueAtTime(vol * 0.8, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.out);
    o.start(t); o.stop(t + dur + 0.05);
  }
  drum(kind, t) {
    const c = this.audio.ctx;
    if (kind === 'k') { // kick
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.15);
    } else if (kind === 'h') { // hat
      const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
      const g = c.createGain(); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      s.connect(f); f.connect(g); g.connect(this.out); s.start(t); s.stop(t + 0.06);
    } else { // snare
      const s = c.createBufferSource(); s.buffer = this.audio.noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800;
      const g = c.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      s.connect(f); f.connect(g); g.connect(this.out); s.start(t); s.stop(t + 0.12);
    }
  }
}
