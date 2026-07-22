// 存档：localStorage 3 槽位 + 自动存档
import { SAVE_VERSION } from './state.js';

const KEY = (slot) => `xinglugu_save_${slot}`;
const AUTO = 'xinglugu_save_auto';
const META = 'xinglugu_meta';

export class SaveSystem {
  constructor(bus) {
    this.bus = bus;
    this.autoTimer = 0;
  }
  serialize(game) {
    const { state, clock } = game;
    state.time = clock.snapshot();
    return JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), state });
  }
  save(game, slot) {
    try {
      localStorage.setItem(KEY(slot), this.serialize(game));
      this.writeMeta();
      return true;
    } catch (e) {
      console.warn('存档失败', e);
      return false;
    }
  }
  autoSave(game) {
    try { localStorage.setItem(AUTO, this.serialize(game)); this.writeMeta(); } catch (e) { console.warn('自动存档失败', e); }
  }
  load(slot) {
    const raw = localStorage.getItem(slot === 'auto' ? AUTO : KEY(slot));
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data.version > SAVE_VERSION) return null;
      return data.state;
    } catch { return null; }
  }
  has(slot) { return !!localStorage.getItem(slot === 'auto' ? AUTO : KEY(slot)); }
  remove(slot) { localStorage.removeItem(slot === 'auto' ? AUTO : KEY(slot)); this.writeMeta(); }
  slotInfo(slot) {
    const s = this.load(slot);
    if (!s) return null;
    return {
      name: s.player.name, farmName: s.player.farmName,
      money: s.player.money, daysPlayed: s.player.stats.daysPlayed,
      season: s.time.season, day: s.time.day, year: s.time.year,
      savedAt: JSON.parse(localStorage.getItem(slot === 'auto' ? AUTO : KEY(slot))).savedAt,
    };
  }
  writeMeta() { localStorage.setItem(META, JSON.stringify({ lastWrite: Date.now() })); }
  // 每天入睡时调用：写自动存档；每 5 分钟现实时间滚动自动存档
  update(dt, game) {
    this.autoTimer += dt;
    if (this.autoTimer > 300) { this.autoTimer = 0; this.autoSave(game); }
  }
}
