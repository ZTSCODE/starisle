// 事件总线：系统间唯一通信通道
export class EventBus {
  constructor() { this.m = new Map(); }
  on(ev, fn) {
    if (!this.m.has(ev)) this.m.set(ev, new Set());
    this.m.get(ev).add(fn);
    return () => this.m.get(ev)?.delete(fn);
  }
  once(ev, fn) { const off = this.on(ev, (...a) => { off(); fn(...a); }); return off; }
  emit(ev, ...args) { this.m.get(ev)?.forEach((fn) => fn(...args)); }
  clear() { this.m.clear(); }
}
export const bus = new EventBus();
