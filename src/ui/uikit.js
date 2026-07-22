// UI 共享库：样式常量 / DOM 助手 / tooltip / 模态弹窗 / 拖放管理 / 暂停深度 / 物品描述 / 像素头像与技能图标
// 供 menus.js / chestui.js / title.js / wire.js 复用（视觉对齐 hud.js 的 PANEL 面板风）
import { itemIcon } from './icons.js';
import { getItem, sellPrice, QUALITY_NAMES, CROPS } from '../data/items.js';
import { isTool } from '../core/state.js';
import { mkCanvas, shade } from '../render/textures.js';
import { hashStr } from '../core/rng.js';

export const PANEL = 'background:rgba(20,22,34,0.92);border:2px solid #4A5578;border-radius:6px;color:#E8E8F0;font-size:14px;';
export const BTN = 'padding:6px 18px;background:#4A5578;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:14px;';
export const BTN_BLUE = 'padding:6px 18px;background:#4A7AB8;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:14px;';
export const INPUT_CSS = 'background:#1A1A26;border:1px solid #4A5578;border-radius:4px;color:#E8E8F0;padding:5px 8px;font-size:14px;outline:none;';
export const GOLD = '#FFD98A', RED = '#E86A6A', GREEN = '#8AE84A', BLUE = '#4AC8E8', DIM = '#8A92B8';

let _game = null;
export function bindGame(g) { _game = g; injectStyle(); }
export function sfx(name) { _game?.audio?.sfx(name); }

export function el(tag, css, parent, html) {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}

let _styled = false;
export function injectStyle() {
  if (_styled) return;
  _styled = true;
  const s = document.createElement('style');
  s.textContent = `
.ui-slot{transition:box-shadow .08s,border-color .08s,background .08s;user-select:none;-webkit-user-drag:none}
.ui-slot:hover{border-color:#8A92B8 !important}
.drag-over{border-color:#FFD98A !important;box-shadow:0 0 8px #FFD98A88 !important;background:#2A2E44 !important}
.ui-sellmode .ui-slot[data-area="inv"]{cursor:cell}
@keyframes ui-blink{0%,100%{opacity:1}50%{opacity:.3}}
.ui-blink{animation:ui-blink 1s infinite}
@keyframes ui-pagein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ui-page{animation:ui-pagein .18s ease}
@keyframes ui-toast-in{from{opacity:0;transform:translate(-50%,-18px)}to{opacity:1;transform:translate(-50%,0)}}
.ui-scroll::-webkit-scrollbar{width:8px}
.ui-scroll::-webkit-scrollbar-thumb{background:#4A5578;border-radius:4px}
.ui-scroll::-webkit-scrollbar-track{background:#1A1A26}
`;
  document.head.appendChild(s);
}

// ---- 暂停（计数深度，支持 标题→设置 这类嵌套打开）----
const _pauseDepth = new WeakMap();
export function pauseGame(game) {
  const n = (_pauseDepth.get(game) || 0) + 1;
  _pauseDepth.set(game, n);
  if (n === 1) { game.clock.pause(true); if (game.player) game.player.frozen = true; game.bus?.emit('ui-open'); }
}
export function resumeGame(game) {
  const n = Math.max(0, (_pauseDepth.get(game) || 0) - 1);
  _pauseDepth.set(game, n);
  if (n === 0) { game.clock.pause(false); if (game.player) game.player.frozen = false; game.bus?.emit('ui-close'); }
}

// ---- UI 注册表（互斥打开：菜单/箱子/标题）----
const _uis = new Map();
export function registerUI(name, api) { _uis.set(name, api); }
export function closeOthers(except) { for (const [n, a] of _uis) if (n !== except && a.isOpen()) a.close(); }
export function anyUIOpen() { for (const a of _uis.values()) if (a.isOpen()) return true; return false; }

// ---- Tooltip 单例 ----
class Tooltip {
  constructor() {
    this.el = el('div', `position:fixed;z-index:820;pointer-events:none;max-width:270px;padding:8px 10px;display:none;line-height:1.5;${PANEL}`, document.body);
  }
  show(html, x, y) { this.el.innerHTML = html; this.el.style.display = 'block'; this.move(x, y); }
  move(x, y) {
    if (this.el.style.display === 'none') return;
    const r = this.el.getBoundingClientRect();
    let lx = x + 16, ly = y + 18;
    if (lx + r.width > innerWidth - 8) lx = x - 14 - r.width;
    if (ly + r.height > innerHeight - 8) ly = y - 12 - r.height;
    this.el.style.left = lx + 'px'; this.el.style.top = ly + 'px';
  }
  hide() { this.el.style.display = 'none'; }
}
export const tooltip = new Tooltip();

// ---- 物品描述（items.js 无 desc 字段，按类型/属性合成）----
const TOOL_DESC = {
  hoe: '翻耕土地，为播种做准备。', wateringcan: '给作物浇水；对着水源可灌满水壶。',
  axe: '砍伐树木，获取木头。', pickaxe: '敲碎石块与矿石，也可垦除耕地。',
  scythe: '收割牧草、清理枯萎作物，不耗体力。', fishingrod: '在水边抛竿垂钓。',
  sword: '防身用的旧剑，对付矿井里的家伙。',
};
const FERT_DESC = {
  quality1: '混入土壤，略微提升作物品质。', quality2: '混入土壤，明显提升作物品质。', quality3: '混入土壤，极大提升作物品质。',
  retain1: '混入土壤，有小概率隔夜保持水分。', retain2: '混入土壤，有较大概率隔夜保持水分。', retain3: '混入土壤，隔夜必定保持水分。',
  speed1: '混入土壤，作物生长提速 10%。', speed2: '混入土壤，作物生长提速 25%。', speed3: '混入土壤，作物生长提速 33%。',
};
export function describeItem(it) {
  if (it.type === 'tool') return TOOL_DESC[it.id] || '顺手的农具。';
  if (it.type === 'weapon') return `武器。攻击力 +${it.atk || 0}。`;
  if (it.type === 'seed') {
    const c = CROPS.find((x) => x.id === it.crop);
    const seasons = (it.seasons || []).map((s) => ['春', '夏', '秋', '冬'][s]).join('、');
    return `种子。适合${seasons}季播种${c ? `，约 ${c.days} 天成熟` : ''}${c?.regrow ? '，可反复收获' : ''}。`;
  }
  if (it.type === 'crop') return `新鲜作物。食用恢复体力 +${it.energy || 0}。`;
  if (it.type === 'fish') return `渔获。食用恢复体力 +${it.energy || 0}，也可出售或送礼。`;
  if (it.type === 'forage') return `野外采集物。食用恢复体力 +${it.energy || 0}。`;
  if (it.type === 'food') return `料理。恢复体力 +${it.energy || 0}、生命 +${it.health || 0}${it.buff ? '，附带增益效果' : ''}。`;
  if (it.type === 'fertilizer') return FERT_DESC[it.fert] || '肥料，播种前混入耕地。';
  if (it.type === 'sprinkler') return `每天清晨自动为周围地块浇水（范围 ${it.range}）。`;
  if (it.type === 'scarecrow') return `驱赶偷吃作物的乌鸦（保护半径 ${it.radius}）。`;
  if (it.type === 'ore') return '矿石，可在熔炉中熔炼成金属锭。';
  if (it.type === 'bar') return '金属锭，制造与工具升级的材料。';
  if (it.type === 'gem') return '漂亮的宝石，出售价值高，也适合送礼。';
  if (it.type === 'machine') return '加工设备，放置在农场后投入使用。';
  if (it.type === 'bait') return '挂在鱼钩上，让鱼更快咬钩。';
  if (it.type === 'animal') return '农场动物，需要对应的圈舍饲养。';
  if (it.type === 'gift') return '送给镇民的珍贵礼物。';
  if (it.id === 'rain_totem') return '使用后祈求明日降雨。';
  if (it.use === 'warp_farm' || it.use === 'warp_beach') return '使用后传送到对应地点，消耗品。';
  if (it.type === 'bomb') return `爆炸物，可炸开矿井岩石（半径 ${it.radius}）。`;
  return '农场生活少不了的物件。';
}
export function itemTipHTML(stack) {
  const it = getItem(stack.id);
  const q = stack.quality || 0;
  const stars = q > 0 ? ` <span style="color:${['', '#C0C0C8', '#FFD98A', '#7AE8E0'][q]}">${'★'.repeat(q)}</span> <span style="font-size:11px;color:${DIM}">${QUALITY_NAMES[q]}</span>` : '';
  const price = sellPrice(stack.id, q);
  return `<div style="display:flex;align-items:center;gap:8px"><img src="${itemIcon(stack.id, q)}" style="width:26px;height:26px;image-rendering:pixelated"><b>${it.name}</b>${stars}</div>
    <div style="font-size:12px;color:#B8C0D8;margin-top:4px">${describeItem(it)}</div>
    <div style="font-size:12px;margin-top:4px;color:${price > 0 ? GOLD : DIM}">${price > 0 ? `售价 ${price} g` : '不可出售'}${stack.qty > 1 ? ` · ×${stack.qty}` : ''}</div>`;
}

// ---- 模态弹窗（Promise 模式，对齐 hud.showSettlement）----
export function modalBox({ title, body = '', width = 400, buttons = [{ label: '确定', value: true, primary: true }] }) {
  return new Promise((resolve) => {
    const back = el('div', 'position:fixed;inset:0;background:rgba(5,5,12,0.6);z-index:860;display:flex;align-items:center;justify-content:center;', document.body);
    const box = el('div', `min-width:${width - 60}px;max-width:${width}px;padding:18px;${PANEL}`, back);
    el('div', `font-size:17px;color:${GOLD};margin-bottom:10px`, box, title);
    const bodyEl = el('div', 'font-size:14px;line-height:1.6;max-height:50vh;overflow:auto', box, body);
    const row = el('div', 'display:flex;gap:10px;justify-content:center;margin-top:16px', box);
    sfx('open');
    const done = (v) => { back.remove(); resolve(v); };
    for (const b of buttons) {
      const btn = el('button', `${b.primary ? BTN_BLUE : BTN}${b.danger ? ';background:#8A3A3A' : ''}${b.css ? ';' + b.css : ''}`, row, b.label);
      btn.onclick = () => { sfx('click'); done(b.value); };
      if (b.disabled) { btn.disabled = true; btn.style.opacity = '.45'; btn.style.cursor = 'not-allowed'; }
      if (b.id) btn.id = b.id;
    }
    back.addEventListener('mousedown', (e) => { if (e.target === back) { sfx('close'); done(null); } });
    box._body = bodyEl; back._box = box;
  });
}
export function confirmDialog(title, html, okText = '确定', danger = false) {
  return modalBox({
    title, body: html,
    buttons: [{ label: '取消', value: false }, { label: okText, value: true, primary: !danger, danger }],
  }).then((v) => v === true);
}
// 输入弹窗：validate(v) 返回 true 时确定键才可用（删档防呆用）
export function promptDialog(title, html, { placeholder = '', mustBe = null, okText = '确定' } = {}) {
  return new Promise((resolve) => {
    const back = el('div', 'position:fixed;inset:0;background:rgba(5,5,12,0.6);z-index:860;display:flex;align-items:center;justify-content:center;', document.body);
    const box = el('div', `min-width:340px;padding:18px;${PANEL}`, back);
    el('div', `font-size:17px;color:${GOLD};margin-bottom:10px`, box, title);
    el('div', 'font-size:14px;line-height:1.6;margin-bottom:10px', box, html);
    const input = el('input', `${INPUT_CSS};width:100%;box-sizing:border-box`, box);
    input.placeholder = placeholder;
    const hint = el('div', `font-size:12px;color:${RED};min-height:16px;margin-top:4px`, box, '');
    const row = el('div', 'display:flex;gap:10px;justify-content:center;margin-top:12px', box);
    const cancel = el('button', BTN, row, '取消');
    const ok = el('button', BTN_BLUE, row, okText);
    const check = () => {
      const pass = mustBe == null ? input.value.trim().length > 0 : input.value.trim() === mustBe;
      ok.disabled = !pass; ok.style.opacity = pass ? '1' : '.45';
      hint.textContent = mustBe != null && input.value.trim() && !pass ? `请输入「${mustBe}」以确认` : '';
    };
    input.addEventListener('input', check); check();
    sfx('open');
    const done = (v) => { back.remove(); resolve(v); };
    cancel.onclick = () => { sfx('close'); done(null); };
    ok.onclick = () => { if (!ok.disabled) { sfx('click'); done(input.value.trim()); } };
    input.addEventListener('keydown', (e) => { if (e.code === 'Enter' && !ok.disabled) { sfx('click'); done(input.value.trim()); } e.stopPropagation(); });
    setTimeout(() => input.focus(), 30);
    back.addEventListener('mousedown', (e) => { if (e.target === back) { sfx('close'); done(null); } });
  });
}

// ---- 背包格工厂 ----
export function slotEl(area, idx, stack, { size = 44, tip = null } = {}) {
  const s = el('div', `width:${size}px;height:${size}px;background:#1A1A26;border:2px solid #3A4260;border-radius:4px;position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-sizing:border-box;`);
  s.className = 'ui-slot';
  s.dataset.area = area; s.dataset.idx = idx;
  if (stack) {
    const img = el('img', `width:${size - 10}px;height:${size - 10}px;image-rendering:pixelated;pointer-events:none`, s);
    img.src = itemIcon(stack.id, stack.quality); img.draggable = false;
    if (stack.qty > 1) el('span', 'position:absolute;right:2px;bottom:0;font-size:11px;color:#fff;text-shadow:1px 1px 0 #000;pointer-events:none', s, stack.qty);
  }
  s.addEventListener('mouseenter', (e) => { if (stack) tooltip.show((tip || itemTipHTML)(stack), e.clientX, e.clientY); });
  s.addEventListener('mousemove', (e) => tooltip.move(e.clientX, e.clientY));
  s.addEventListener('mouseleave', () => tooltip.hide());
  return s;
}
// 把 item 并入 slots[0..count)，返回剩余数量
export function mergeInto(slots, item, count) {
  const it = getItem(item.id);
  let qty = item.qty;
  for (let i = 0; i < count && qty > 0; i++) {
    const s = slots[i];
    if (s && s.id === item.id && s.quality === item.quality && s.qty < it.stack) {
      const add = Math.min(it.stack - s.qty, qty); s.qty += add; qty -= add;
    }
  }
  for (let i = 0; i < count && qty > 0; i++) {
    if (!slots[i]) { const add = Math.min(it.stack, qty); slots[i] = { id: item.id, qty: add, quality: item.quality }; qty -= add; }
  }
  return qty;
}

// ---- 拖放管理（单例 per game）：按住拖动 / 点击拿起再点击放下 / 右键拆分一半 / 右键点一格放一个 / Shift 快转 ----
export class DragCtx {
  constructor(game) {
    this.game = game;
    this.held = null;          // { item:{id,qty,quality}, origin:{area,idx} }
    this.pressed = false;      // 鼠标按住拖动中
    this.downPos = null;
    this.areas = new Map();    // name → { slots:()=>[], count:()=>n }
    this.routes = {};          // area → (slotRef, stack) => void  （Shift 快转）
    this.refreshers = new Set();
    this.intercept = null;     // (slotRef, event) => bool  出售模式接管点击
    this.follower = el('div', 'position:fixed;z-index:840;pointer-events:none;display:none;opacity:.8;width:46px;height:46px;align-items:center;justify-content:center;background:rgba(26,26,38,0.65);border:2px solid #8A92B8;border-radius:4px;transform:translate(-50%,-50%);', document.body);
    this.fImg = el('img', 'width:36px;height:36px;image-rendering:pixelated', this.follower);
    this.fQty = el('span', 'position:absolute;right:1px;bottom:0;font-size:11px;color:#fff;text-shadow:1px 1px 0 #000;', this.follower);
    this.hoverEl = null;
    document.addEventListener('mousemove', (e) => this.onMove(e));
    document.addEventListener('mousedown', (e) => this.onDown(e), true);
    document.addEventListener('mouseup', (e) => this.onUp(e), true);
    document.addEventListener('mouseover', (e) => this.onOver(e), true);
    document.addEventListener('contextmenu', (e) => { if (e.target.closest?.('[data-area]')) e.preventDefault(); }, true);
  }
  registerArea(name, api) { this.areas.set(name, api); }
  unregisterArea(name) { this.areas.delete(name); }
  onRefresh(fn) { this.refreshers.add(fn); }
  refreshAll() { for (const f of this.refreshers) { try { f(); } catch { /* 已关闭的 UI */ } } }
  slotFromEvent(e) {
    const t = e.target.closest?.('[data-area]');
    if (!t) return null;
    const api = this.areas.get(t.dataset.area);
    if (!api) return null;
    return { el: t, area: t.dataset.area, idx: +t.dataset.idx, api };
  }
  stackOf(s) { return s.api.slots()[s.idx] || null; }
  setStack(s, v) { s.api.slots()[s.idx] = v; }

  onDown(e) {
    const s = this.slotFromEvent(e);
    if (!s) return;
    if (e.button === 0) {
      if (e.shiftKey) { this.quickTransfer(s); e.preventDefault(); return; }
      if (this.intercept?.(s, e)) { e.preventDefault(); return; }
      if (this.held) { this.placeOn(s); this.pressed = false; this.refreshAll(); e.preventDefault(); return; }
      const st = this.stackOf(s);
      if (!st) return;
      this.held = { item: st, origin: { area: s.area, idx: s.idx } };
      this.setStack(s, null);
      this.pressed = true;
      this.downPos = { x: e.clientX, y: e.clientY };
      this.updateFollower(e);
      sfx('click');
      this.refreshAll();
      e.preventDefault();
    } else if (e.button === 2) {
      if (this.held) this.dropOne(s);
      else {
        const st = this.stackOf(s);
        if (st && st.qty > 1 && !isTool(st.id)) {
          const take = Math.ceil(st.qty / 2);
          this.held = { item: { id: st.id, qty: take, quality: st.quality }, origin: { area: s.area, idx: s.idx } };
          st.qty -= take;
          this.pressed = true;
          this.downPos = { x: e.clientX, y: e.clientY };
          this.updateFollower(e);
          sfx('click');
        }
      }
      this.refreshAll();
      e.preventDefault();
    }
  }
  onUp(e) {
    if (e.button !== 0 || !this.pressed) return;
    this.pressed = false;
    if (!this.held) return;
    const s = this.slotFromEvent(e);
    const moved = this.downPos ? Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y) : 99;
    if (s && moved >= 6) { this.placeOn(s); this.refreshAll(); }
    else if (s) { /* 原地松手：保持拿起状态（再点击放下） */ }
    else { this.returnToOrigin(); this.refreshAll(); }
  }
  onMove(e) {
    if (this.held) this.updateFollower(e);
  }
  onOver(e) {
    const t = e.target.closest?.('[data-area]');
    if (this.hoverEl && this.hoverEl !== t) this.hoverEl.classList.remove('drag-over');
    this.hoverEl = t;
    if (t && this.held) t.classList.add('drag-over');
  }
  updateFollower(e) {
    if (!this.held) { this.follower.style.display = 'none'; return; }
    this.fImg.src = itemIcon(this.held.item.id, this.held.item.quality);
    this.fQty.textContent = this.held.item.qty > 1 ? this.held.item.qty : '';
    this.follower.style.display = 'flex';
    this.follower.style.left = e.clientX + 'px';
    this.follower.style.top = e.clientY + 'px';
  }
  placeOn(s) {
    const cur = this.stackOf(s), h = this.held.item, it = getItem(h.id);
    if (!cur) { this.setStack(s, h); this.held = null; }
    else if (cur.id === h.id && cur.quality === h.quality && cur.qty < it.stack && !isTool(h.id)) {
      const add = Math.min(it.stack - cur.qty, h.qty);
      cur.qty += add; h.qty -= add;
      if (h.qty <= 0) this.held = null;
    } else { // 交换
      this.setStack(s, h);
      this.held = { item: cur, origin: { area: s.area, idx: s.idx } };
    }
    sfx('click');
  }
  dropOne(s) {
    const h = this.held.item, it = getItem(h.id), cur = this.stackOf(s);
    if (!cur) this.setStack(s, { id: h.id, qty: 1, quality: h.quality });
    else if (cur.id === h.id && cur.quality === h.quality && cur.qty < it.stack && !isTool(h.id)) cur.qty++;
    else { sfx('error'); return; }
    h.qty -= 1;
    if (h.qty <= 0) this.held = null;
    sfx('click');
  }
  returnToOrigin() {
    if (!this.held) return;
    const o = this.held.origin, api = this.areas.get(o.area);
    if (api) {
      const slots = api.slots(), count = api.count();
      if (!slots[o.idx]) slots[o.idx] = this.held.item;
      else this.held.item.qty = mergeInto(slots, this.held.item, count) || this.held.item.qty;
      if (!this.held.item.qty) this.held = null;
    }
    this.held = null; // 极端情况（区域已关闭）不丢物：mergeInto 已尽力并入
    this.follower.style.display = 'none';
  }
  cancel() { if (this.held) { this.returnToOrigin(); this.refreshAll(); } this.pressed = false; this.follower.style.display = 'none'; }
  quickTransfer(s) {
    const route = this.routes[s.area];
    if (!route) return;
    const st = this.stackOf(s);
    if (!st) return;
    route(s, st);
    this.refreshAll();
  }
}

// ---- 像素头像（NPC colorScheme → 16×16 脸）----
const _iconCache = new Map();
function iconURL(key, w, h, draw) {
  if (_iconCache.has(key)) return _iconCache.get(key);
  const c = mkCanvas(w, h);
  draw(c.getContext('2d'), w, h);
  const u = c.toDataURL();
  _iconCache.set(key, u);
  return u;
}
export function avatarIcon(cs = {}, tag = '') {
  const skin = cs.skin || '#F0C8A0', hair = cs.hair || '#4A3220', shirt = cs.shirt || '#4A7AB8';
  const style = hashStr(tag || (skin + hair + shirt)) % 8;
  return iconURL(`av_${skin}_${hair}_${shirt}_${style}`, 16, 16, (g) => {
    g.fillStyle = '#3A4260'; g.fillRect(0, 0, 16, 16);          // 底
    g.fillStyle = shirt; g.fillRect(3, 12, 10, 4);               // 肩/衣
    g.fillStyle = shade(shirt, -30); g.fillRect(3, 15, 10, 1);
    g.fillStyle = skin; g.fillRect(4, 4, 8, 8);                  // 脸
    g.fillStyle = shade(skin, -30); g.fillRect(4, 11, 8, 1);
    g.fillStyle = hair;                                          // 发型 ×8
    if (style === 0) { g.fillRect(4, 2, 8, 3); g.fillRect(4, 5, 1, 2); g.fillRect(11, 5, 1, 2); }
    else if (style === 1) { g.fillRect(4, 2, 8, 3); g.fillRect(3, 4, 2, 8); g.fillRect(11, 4, 2, 8); } // 长发
    else if (style === 2) { g.fillRect(4, 3, 8, 2); g.fillRect(5, 1, 2, 2); g.fillRect(9, 1, 2, 2); }  // 冲天
    else if (style === 3) { g.fillRect(4, 2, 8, 3); g.fillRect(11, 1, 3, 3); }                          // 丸子
    else if (style === 4) { g.fillRect(3, 2, 10, 2); g.fillRect(4, 4, 2, 2); g.fillRect(10, 4, 2, 2); g.fillRect(6, 1, 1, 1); g.fillRect(9, 0, 1, 2); } // 乱发
    else if (style === 5) { g.fillRect(4, 2, 8, 3); g.fillRect(3, 4, 2, 5); g.fillRect(11, 4, 2, 5); g.fillRect(3, 8, 1, 2); g.fillRect(12, 8, 1, 2); } // 波波头
    else if (style === 6) { g.fillRect(4, 2, 8, 3); g.fillRect(12, 3, 2, 7); g.fillRect(13, 9, 1, 3); }  // 马尾
    else { g.fillRect(4, 2, 8, 2); g.fillStyle = shade(hair, 25); g.fillRect(5, 1, 6, 1); }              // 短寸
    g.fillStyle = '#23232E'; g.fillRect(6, 8, 1, 2); g.fillRect(9, 8, 1, 2); // 眼
    g.fillStyle = shade(skin, -50); g.fillRect(7, 10, 2, 1);                 // 嘴
  });
}

// ---- 技能图标（24×24）----
export function skillIcon(skill) {
  return iconURL('skill_' + skill, 24, 24, (g) => {
    if (skill === 'farming') { // 幼苗
      g.fillStyle = '#6B4E2E'; g.fillRect(3, 18, 18, 4);
      g.fillStyle = '#4AA84A'; g.fillRect(11, 8, 2, 10);
      g.fillStyle = '#8AE84A'; g.fillRect(6, 10, 5, 3); g.fillRect(13, 7, 5, 3); g.fillRect(10, 4, 4, 4);
    } else if (skill === 'mining') { // 镐
      g.strokeStyle = '#8A5A2A'; g.lineWidth = 3; g.beginPath(); g.moveTo(6, 18); g.lineTo(14, 10); g.stroke();
      g.fillStyle = '#A0A0AC'; g.beginPath(); g.moveTo(9, 8); g.quadraticCurveTo(17, 3, 20, 10); g.lineTo(17, 12); g.quadraticCurveTo(14, 7, 10, 11); g.closePath(); g.fill();
    } else if (skill === 'foraging') { // 叶
      g.fillStyle = '#3E9B4F'; g.beginPath(); g.moveTo(12, 3); g.quadraticCurveTo(22, 8, 18, 18); g.quadraticCurveTo(8, 20, 6, 12); g.quadraticCurveTo(6, 5, 12, 3); g.fill();
      g.strokeStyle = '#247633'; g.lineWidth = 1; g.beginPath(); g.moveTo(9, 16); g.lineTo(16, 7); g.stroke();
    } else if (skill === 'fishing') { // 鱼
      g.fillStyle = '#4AC8E8'; g.beginPath(); g.moveTo(4, 12); g.quadraticCurveTo(10, 5, 17, 10); g.lineTo(21, 6); g.lineTo(21, 18); g.lineTo(17, 14); g.quadraticCurveTo(10, 19, 4, 12); g.fill();
      g.fillStyle = '#0C0E18'; g.fillRect(8, 10, 2, 2);
      g.fillStyle = '#9FD4F0'; g.fillRect(11, 9, 3, 1);
    } else { // combat 剑
      g.strokeStyle = '#8A5A2A'; g.lineWidth = 3; g.beginPath(); g.moveTo(6, 18); g.lineTo(10, 14); g.stroke();
      g.fillStyle = '#C0C0CC'; g.beginPath(); g.moveTo(9, 15); g.lineTo(18, 4); g.lineTo(20, 6); g.lineTo(11, 17); g.closePath(); g.fill();
      g.fillStyle = '#8A92B8'; g.fillRect(8, 13, 4, 2);
    }
  });
}
