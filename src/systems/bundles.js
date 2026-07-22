// 收集包（修复小镇主线）：旧会馆祭坛捐献 → 单包奖励 → 整区大奖（温室/矿车/断桥/采石场/缆车/全镇好感）
// 设计文档：docs/design/bundles.md
import * as THREE from 'three';
import { BUNDLE_ROOMS } from '../data/bundles.js';
import { getItem } from '../data/items.js';
import { addItem, removeItem, countItem } from '../core/state.js';
import { unlockQuarry } from '../world/builder.js';

const ANY_MATCH = {
  crop: (id) => getItem(id).type === 'crop',
  fish: (id) => getItem(id).type === 'fish',
  forage: (id) => getItem(id).type === 'forage',
  ore: (id) => getItem(id).type === 'ore' || getItem(id).type === 'gem',
  artisan: (id) => getItem(id).type === 'artisan',
};

export class Bundles {
  constructor(game) {
    this.game = game;
    // state.bundles = { [bundleId]: boolean[] }，roomsDone: []
    if (!game.state.bundles.progress) game.state.bundles = { progress: {}, roomsDone: [] };
  }
  slotsOf(bundleId) {
    for (const room of BUNDLE_ROOMS) {
      const b = room.bundles.find((x) => x.id === bundleId);
      if (b) return { room, bundle: b };
    }
    return null;
  }
  progress(bundleId) {
    const p = this.game.state.bundles.progress;
    if (!p[bundleId]) {
      const info = this.slotsOf(bundleId);
      p[bundleId] = new Array(info.bundle.slots.length).fill(false);
    }
    return p[bundleId];
  }
  isBundleDone(bundleId) { return this.progress(bundleId).every(Boolean); }
  isRoomDone(roomId) {
    const room = BUNDLE_ROOMS.find((r) => r.id === roomId);
    return room.bundles.every((b) => this.isBundleDone(b.id));
  }
  slotMatch(slot, itemId, quality = 0) {
    if (slot.item && slot.item !== itemId) return false;
    if (slot.any && !ANY_MATCH[slot.any]?.(itemId)) return false;
    if (slot.quality != null && quality < slot.quality) return false;
    return true;
  }
  // 手持物品献祭（返回 'filled'|'done'|'room-done'|false）
  contribute(bundleId, slotIdx) {
    const g = this.game;
    const held = g.state.player.inventory[g.state.player.toolbarSel];
    if (!held) return false;
    const info = this.slotsOf(bundleId);
    if (!info) return false;
    const prog = this.progress(bundleId);
    const slot = info.bundle.slots[slotIdx];
    if (prog[slotIdx] || !this.slotMatch(slot, held.id, held.quality)) return false;
    if (!removeItem(g.state, held.id, slot.qty)) return false;
    prog[slotIdx] = true;
    g.audio.sfx('levelup');
    g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), `${getItem(held.id).name} 已献祭`, '#B87AE8', 13);
    g.ui.refreshToolbar();
    if (this.isBundleDone(bundleId)) {
      const rw = info.bundle.reward;
      addItem(g.state, rw.item, rw.qty, 0);
      g.audio.sfx('catch');
      g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 2, 0)), `完成「${info.bundle.name}」！奖励 ${getItem(rw.item).name}×${rw.qty}`, '#FFD98A', 15);
      g.bus.emit('bundle-done', bundleId);
      if (this.isRoomDone(info.room.id)) this.completeRoom(info.room);
      return 'done';
    }
    g.bus.emit('bundle-contribute', bundleId);
    return 'filled';
  }
  completeRoom(room) {
    const g = this.game;
    if (g.state.bundles.roomsDone.includes(room.id)) return;
    g.state.bundles.roomsDone.push(room.id);
    const rw = room.roomReward;
    g.audio.sfx('levelup');
    g.effects.shakeScreen(0.06);
    const applyText = {
      greenhouse: () => { g.state.farm.greenhouse = true; return '温室已修复！农场上方的玻璃温室现在全年可种植任何作物。'; },
      minecart: () => { g.state.flags.minecart = true; return '矿车系统修复！地图上的矿车点可以快速传送。'; },
      bridge: () => { g.state.flags.bridgeFixed = true; unlockQuarry(); return '镇东断桥修复！采石场区域开放。'; },
      quarry: () => { g.state.flags.quarry = true; return '采石场开放！每天刷新矿石与宝石。'; },
      bus: () => { g.state.flags.cableCar = true; return '山道缆车修复！高山觅食区开放。'; },
      friendship: () => {
        for (const id of Object.keys(g.state.npcs)) g.state.npcs[id].friendship = (g.state.npcs[id].friendship || 0) + 500;
        return '全镇居民对你的好感大幅提升（+2心）！';
      },
    };
    const msg = applyText[rw.type]?.() || rw.desc;
    g.ui.tutorial(`◆ 「${room.name}」修复完成！${msg}`, 8000);
    g.bus.emit('room-done', room.id);
    // 全部完成 → 主线结局
    if (g.state.bundles.roomsDone.length >= BUNDLE_ROOMS.length) g.bus.emit('story-complete');
  }
  totalDone() {
    return Object.keys(this.game.state.bundles.progress).filter((b) => this.isBundleDone(b)).length;
  }
  serialize() {}
  deserialize() {}
}
