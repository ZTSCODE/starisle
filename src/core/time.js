// 游戏时钟：0.9 现实秒 = 10 游戏分钟；6:00(360) – 次日2:00(1560)
import { bus } from './events.js';

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_CN = ['春', '夏', '秋', '冬'];
export const WEEK_CN = ['一', '二', '三', '四', '五', '六', '日'];

export class GameClock {
  constructor() {
    this.minute = 360;          // 当日分钟 360..1560
    this.year = 1; this.season = 0; this.day = 1;
    this.paused = false;
    this.timeScale = 1;
    this.acc = 0;
    this.speedPerRealSec = 10 / 1.35; // 游戏分钟/现实秒（1.35 现实秒 = 10 游戏分钟，一天约 27 分钟）
  }
  get absoluteDay() { return (this.year - 1) * 112 + this.season * 28 + this.day; }
  get absMinute() { return (this.absoluteDay - 1) * 1200 + (this.minute - 360); }
  get weekDay() { return (this.absoluteDay - 1) % 7; } // 0=周一
  get isNight() { return this.minute >= this.darkMinute || this.minute < 330; }
  get darkMinute() { return [1200, 1200, 1140, 1080][this.season]; } // 天黑锚点
  fmt(m = this.minute) {
    const h24 = Math.floor(m / 60), mm = Math.floor(m % 60 / 10) * 10;
    const h = h24 > 24 ? h24 - 24 : h24;
    return `${h}:${String(mm).padStart(2, '0')}`;
  }
  dateStr() { return `${SEASON_CN[this.season]}${this.day}日 周${WEEK_CN[this.weekDay]} 第${this.year}年`; }
  pause(v) { this.paused = v; }
  update(dt) {
    if (this.paused) return;
    this.acc += dt * this.speedPerRealSec * this.timeScale;
    while (this.acc >= 1) {
      this.acc -= 1;
      this.minute += 1;
      bus.emit('minute', this.minute);
      if (this.minute % 60 === 0) bus.emit('hour', this.minute / 60);
      if (this.minute >= 1560) bus.emit('overtime'); // 2:00 昏倒判定（由玩法系统处理并调用 advanceDay）
    }
  }
  // 睡觉/昏倒推进到新的一天（结算完成后调用）
  advanceDay() {
    bus.emit('day-end', this.snapshot());
    this.day += 1; this.minute = 360; this.acc = 0;
    if (this.day > 28) {
      this.day = 1; this.season += 1;
      if (this.season > 3) { this.season = 0; this.year += 1; }
      bus.emit('season-start', this.season);
    }
    bus.emit('day-start', this.snapshot());
  }
  snapshot() { return { year: this.year, season: this.season, day: this.day, minute: this.minute }; }
  restore(s) { Object.assign(this, s); this.acc = 0; }
}
