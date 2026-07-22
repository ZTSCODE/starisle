// TAB 大菜单：背包/技能/地图/图鉴/社交/任务/成就/统计/设置（游戏暂停）
import { itemIcon } from './icons.js';
import { getItem, sellPrice, QUALITY_NAMES, CROPS } from '../data/items.js';
import { RECIPES } from '../data/recipes.js';
import { NPCS } from '../data/npcs.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { FISH } from '../data/fish.js';
import { ORES } from '../data/ores.js';
import { FORAGE } from '../data/forage.js';
import { skillLevel, countItem, addItem, removeItem, XP_TABLE } from '../core/state.js';
import { makePortrait } from './dialog.js';
import { SEASON_CN } from '../core/time.js';

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;
const TABS = [
  ['inventory', '背包'], ['skills', '技能'], ['map', '地图'], ['codex', '图鉴'],
  ['social', '社交'], ['quests', '任务'], ['achievements', '成就'], ['stats', '统计'], ['settings', '设置'],
];

export class Menus {
  constructor(game) {
    this.game = game;
    this.tab = 'inventory';
    this.isOpen = false;
    this.drag = null; // { from, ghost }
    this.el = document.createElement('div');
    this.el.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:780px;max-width:96vw;max-height:86vh;display:none;z-index:140;${PANEL}`;
    document.getElementById('ui').appendChild(this.el);
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `position:fixed;display:none;z-index:220;padding:8px 12px;pointer-events:none;max-width:260px;font-size:12px;${PANEL}`;
    document.getElementById('ui').appendChild(this.tooltip);
    window.addEventListener('keydown', (e) => {
      // 注意：Escape 只用于关闭，不用于打开（避免关其他面板时误开菜单导致"不能移动"）
      if ((e.code === 'Tab' || e.code === 'KeyB') && !this.isOpen && !game.ui.anyPanelOpen?.()) { e.preventDefault(); this.open(); }
      else if ((e.code === 'Tab' || e.code === 'Escape') && this.isOpen) { e.preventDefault(); this.close(); }
    });
  }
  open(tab = 'inventory') {
    const g = this.game;
    this.tab = tab;
    this.isOpen = true;
    this.el.style.display = 'block';
    g.clock.pause(true);
    g.player.frozen = true;
    g.audio.sfx('open');
    this.render();
  }
  close() {
    this.isOpen = false;
    this.el.style.display = 'none';
    this.hideTip();
    this.game.clock.pause(false);
    this.game.player.frozen = false;
    this.game.audio.sfx('close');
  }
  hideTip() { this.tooltip.style.display = 'none'; }
  showTip(html, x, y) {
    this.tooltip.innerHTML = html;
    this.tooltip.style.display = 'block';
    this.tooltip.style.left = Math.min(innerWidth - 280, x + 16) + 'px';
    this.tooltip.style.top = (y - 10) + 'px';
  }
  itemTip(s) {
    const it = getItem(s.id);
    const q = s.quality ? `<span style="color:${['', '#C0C0C8', '#FFD98A', '#7AE8E0'][s.quality]}">★${QUALITY_NAMES[s.quality]}</span> ` : '';
    const lines = [`<b style="color:#FFD98A">${it.name}</b> ${q}`];
    if (it.type) lines.push(`<span style="color:#8A92B8">${it.type}</span>`);
    if (sellPrice(s.id, s.quality) > 0) lines.push(`售价 ${sellPrice(s.id, s.quality)}g`);
    if (it.edible) lines.push(`食用：体力+${it.energy || 0} 生命+${it.health || 0}`);
    if (it.desc) lines.push(it.desc);
    return lines.join('<br>');
  }
  render() {
    const g = this.game;
    const tabs = TABS.map(([id, name]) => `<button data-tab="${id}" class="xg-btn" style="border-radius:3px 3px 0 0;${this.tab === id ? 'background:linear-gradient(180deg,#A87A2E,#7A5520);color:#FFF0C8' : ''}">${name}</button>`).join('');
    this.el.innerHTML = `
      <div class="xg-titlebar"><span>${TABS.find((t) => t[0] === this.tab)?.[1] || '菜单'}</span><span class="xg-x" data-xclose>✕</span></div>
      <div style="display:flex;gap:4px;padding:8px 10px 0;border-bottom:2px solid #0C0E18">${tabs}</div>
      <div id="menu-body" class="xg-scroll" style="padding:14px;overflow:auto;max-height:66vh"></div>`;
    this.el.querySelector('[data-xclose]').onclick = () => this.close();
    this.el.querySelectorAll('button[data-tab]').forEach((b) => {
      b.onclick = () => { this.tab = b.dataset.tab; this.game.audio.sfx('click'); this.render(); };
    });
    const body = this.el.querySelector('#menu-body');
    body.append(this['page_' + this.tab]());
    this['bind_' + this.tab]?.(body);
  }
  // ==================== 背包 ====================
  page_inventory() {
    const g = this.game;
    const wrap = document.createElement('div');
    const inv = g.state.player.inventory, size = g.state.player.invSize;
    const rows = Math.ceil(size / 12);
    let html = `<div style="font-size:12px;color:#8A92B8;margin-bottom:8px">拖放整理 · 右键拆分一半 · ${size}/36 格（杂货店可扩容）</div><div style="display:grid;grid-template-columns:repeat(12,52px);gap:4px">`;
    for (let i = 0; i < 36; i++) {
      const s = inv[i];
      const inRange = i < size;
      html += `<div data-slot="${i}" style="width:52px;height:52px;background:${inRange ? '#1A1A26' : '#10121C'};border:2px solid ${i < 10 ? '#5A6488' : '#3A4260'};border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;${inRange ? 'cursor:grab' : 'opacity:.35'}">
        ${s && inRange ? `<img src="${itemIcon(s.id, s.quality)}" style="width:42px;height:42px;image-rendering:pixelated;pointer-events:none">` : ''}
        ${s && inRange && s.qty > 1 ? `<span style="position:absolute;right:3px;bottom:1px;font-size:11px;color:#fff;text-shadow:1px 1px 0 #000">${s.qty}</span>` : ''}
      </div>`;
    }
    html += '</div>';
    wrap.innerHTML = html;
    return wrap;
  }
  bind_inventory(body) {
    const g = this.game;
    body.querySelectorAll('[data-slot]').forEach((cell) => {
      const idx = parseInt(cell.dataset.slot);
      if (idx >= g.state.player.invSize) return;
      cell.addEventListener('mouseenter', (e) => {
        const s = g.state.player.inventory[idx];
        if (s) this.showTip(this.itemTip(s), e.clientX, e.clientY);
      });
      cell.addEventListener('mouseleave', () => this.hideTip());
      cell.addEventListener('mousemove', (e) => { if (this.tooltip.style.display !== 'none') this.showTip(this.tooltip.innerHTML, e.clientX, e.clientY); });
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const inv = g.state.player.inventory;
        const s = inv[idx];
        if (!s || s.qty < 2) return;
        const half = Math.ceil(s.qty / 2);
        const empty = inv.findIndex((x, i) => i < g.state.player.invSize && !x && i !== idx);
        if (empty < 0) return;
        s.qty -= half;
        inv[empty] = { id: s.id, qty: half, quality: s.quality };
        g.audio.sfx('click');
        this.render();
      });
      cell.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        const s = g.state.player.inventory[idx];
        if (!s) return;
        e.preventDefault();
        const ghost = document.createElement('img');
        ghost.src = itemIcon(s.id, s.quality);
        ghost.style.cssText = 'position:fixed;width:44px;height:44px;image-rendering:pixelated;opacity:.75;pointer-events:none;z-index:230';
        document.body.appendChild(ghost);
        this.drag = { from: idx, ghost };
        const move = (ev) => { ghost.style.left = ev.clientX - 22 + 'px'; ghost.style.top = ev.clientY - 22 + 'px'; };
        const up = (ev) => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
          ghost.remove();
          const fromIdx = this.drag?.from;
          const inv = g.state.player.inventory;
          const hitEl = document.elementFromPoint(ev.clientX, ev.clientY);
          const target = hitEl?.closest('[data-slot]');
          if (target) {
            const to = parseInt(target.dataset.slot);
            if (to < g.state.player.invSize && to !== fromIdx) {
              // 同物品同品质则合并，否则交换
              if (inv[to] && inv[to].id === inv[fromIdx].id && inv[to].quality === inv[fromIdx].quality) {
                const cap = getItem(inv[to].id).stack;
                const move2 = Math.min(cap - inv[to].qty, inv[fromIdx].qty);
                inv[to].qty += move2;
                inv[fromIdx].qty -= move2;
                if (inv[fromIdx].qty <= 0) inv[fromIdx] = null;
              } else {
                [inv[to], inv[fromIdx]] = [inv[fromIdx], inv[to]];
              }
              g.audio.sfx('click');
              g.ui.refreshToolbar();
            }
          } else if (fromIdx != null && !(hitEl && this.el.contains(hitEl)) && inv[fromIdx]) {
            // 拖到面板外（地上）：丢弃整组（工具/武器除外，防误丢）
            const s = inv[fromIdx];
            const it = getItem(s.id);
            if (it.type === 'tool' || it.type === 'weapon' || it.type === 'ring' || it.type === 'boots') {
              g.ui.tutorial?.(`${it.name}不能丢弃`, 2200);
            } else {
              inv[fromIdx] = null;
              g.audio.sfx('close');
              const p = g.player.pos.clone(); p.y += 1.4;
              g.effects?.floatText?.(p, `丢掉了 ${it.name}${s.qty > 1 ? '×' + s.qty : ''}`, '#C8C0B0', 13);
              g.ui.refreshToolbar();
            }
          }
          this.drag = null;
          this.render();
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      });
    });
  }
  // ==================== 技能 ====================
  page_skills() {
    const g = this.game;
    const wrap = document.createElement('div');
    const names = { farming: '穗 耕种', mining: '镐 采矿', foraging: '木 觅食', fishing: '钓 钓鱼', combat: '剑 战斗' };
    const profNames = {
      rancher: '牧场主', tiller: '耕作者', coopmaster: '鸡舍大师', shepherd: '牧羊人', artisan: '工匠', agriculturist: '农业学家',
      miner: '矿工', geologist: '地质学家', blacksmith: '铁匠', prospector: '勘探者', excavator: '挖掘机', gemologist: '宝石学家',
      forester: '护林人', gatherer: '收集者', lumberjack: '伐木工', tapper: '榨取者', botanist: '植物学家', tracker: '追踪者',
      fisher: '渔夫', trapper: '捕蟹人', angler: '垂钓者', pirate: '海盗', mariner: '水手', luremaster: '诱饵大师',
      fighter: '斗士', scout: '侦查员', brute: '野蛮人', defender: '防御者', acrobat: '杂技演员', desperado: '亡命徒',
    };
    wrap.innerHTML = Object.entries(names).map(([skill, name]) => {
      const lvl = skillLevel(g.state, skill);
      const xp = g.state.player.skills[skill].xp;
      const next = lvl >= 10 ? null : XP_TABLE[lvl];
      const prev = lvl === 0 ? 0 : XP_TABLE[lvl - 1];
      const pct = next ? Math.min(100, ((xp - prev) / (next - prev)) * 100) : 100;
      const profs = g.state.player.skills[skill].prof.map((p) => `<span style="background:#5A4A8C;padding:2px 8px;border-radius:8px;font-size:11px">${profNames[p] || p}</span>`).join(' ');
      const unlocks = RECIPES.filter((r) => r.unlock?.skill === skill && r.unlock.level <= lvl)
        .map((r) => `<span style="font-size:11px;color:#8A92B8">${r.unlock.level}级·${getItem(r.out).name}</span>`).join('、');
      return `<div style="margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:86px;font-size:14px">${name}</span>
          <span style="color:#FFD98A;font-weight:bold">Lv.${lvl}</span>
          <div style="flex:1;height:12px;background:#1A1A26;border:1px solid #4A5578;border-radius:3px" title="${xp} XP${next ? ' / 下级 ' + next : ''}">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#4AA84A,#8AE84A);border-radius:3px"></div>
          </div>${profs}
        </div>
        <div style="margin:4px 0 0 96px">${unlocks || '<span style="font-size:11px;color:#5A6488">升级解锁配方</span>'}</div>
      </div>`;
    }).join('');
    return wrap;
  }
  // ==================== 地图 ====================
  page_map() {
    const g = this.game;
    const wrap = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.width = 720; canvas.height = 560;
    canvas.style.cssText = 'width:100%;image-rendering:pixelated;border:1px solid #4A5578;border-radius:6px';
    wrap.append(canvas);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // 一体化世界底图（builder 的画布纹理）
    const ground = g.worldBuilder?.group.getObjectByName('unifiedGround');
    const src = ground?.material?.map?.image;
    const WB = { x0: -48, z0: -48, w: 192, h: 160 };
    const sx = (wx) => ((wx - WB.x0) / WB.w) * canvas.width;
    const sz = (wz) => ((wz - WB.z0) / WB.h) * canvas.height;
    if (src) ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    else { ctx.fillStyle = '#2A3048'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    // 区域名标注
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#FFFC';
    ctx.strokeStyle = '#000A'; ctx.lineWidth = 3;
    const labels = [['晨风农场', 20, 20], ['汐溪镇', 24, 64], ['低语森林', 68, 24], ['碎星海滩', 72, 60], ['星峰山路', 20, -18]];
    for (const [name, x, z] of labels) {
      ctx.strokeText(name, sx(x), sz(z));
      ctx.fillText(name, sx(x), sz(z));
    }
    // NPC 实时位置
    for (const n of g.npcSystem.dots()) {
      ctx.fillStyle = '#5FB4E8';
      ctx.beginPath(); ctx.arc(sx(n.x), sz(n.z), 3, 0, 7); ctx.fill();
    }
    // 玩家箭头
    const px = g.player.pos.x, pz = g.player.pos.z, f = g.player.facing;
    ctx.save();
    ctx.translate(sx(px), sz(pz));
    ctx.rotate(Math.atan2(Math.sin(f), Math.cos(f)) * 0 + Math.PI - f);
    ctx.fillStyle = '#FFD98A';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-5, 5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    const legend = document.createElement('div');
    legend.style.cssText = 'font-size:12px;color:#8A92B8;margin-top:6px';
    legend.textContent = '🟡 你 · 🔵 镇民（实时位置）· 蓝色水域可钓鱼（湖=农场景塘/森林湖、河=镇内河、海=东/南海）';
    wrap.append(legend);
    return wrap;
  }
  // ==================== 图鉴 ====================
  page_codex() {
    const g = this.game;
    const wrap = document.createElement('div');
    const cats = [
      ['作物', CROPS.map((c) => c.id), g.state.codex.crops],
      ['鱼类', FISH.map((f) => f.id), g.state.codex.fish],
      ['矿物', ORES.map((o) => o.id), g.state.codex.minerals],
      ['觅食', Object.values(FORAGE).flat().map((f) => f.id), g.state.codex.forage],
    ];
    wrap.innerHTML = cats.map(([name, ids, rec]) => {
      const got = ids.filter((id) => rec[id]).length;
      const cells = ids.map((id) => {
        const has = !!rec[id];
        const fishRec = g.state.codex.fish[id];
        const extra = fishRec && fishRec.maxSize ? `<br><span style="color:#8A92B8">最大 ${fishRec.maxSize}cm · ${fishRec.count}条</span>` : '';
        return `<div title="${has ? getItem(id).name + extra.replace(/<[^>]*>/g, ' ') : '???'}" style="width:46px;height:46px;background:#1A1A26;border:2px solid ${has ? '#8AE84A' : '#3A4260'};border-radius:4px;display:flex;align-items:center;justify-content:center;filter:${has ? 'none' : 'grayscale(1) brightness(.5)'}">
          <img src="${itemIcon(id)}" style="width:36px;height:36px;image-rendering:pixelated"></div>`;
      }).join('');
      return `<div style="margin-bottom:12px"><div style="font-size:14px;color:#FFD98A;margin-bottom:6px">${name} <span style="font-size:12px;color:#8A92B8">${got}/${ids.length}（${ids.length ? Math.round((got / ids.length) * 100) : 0}%）</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${cells}</div></div>`;
    }).join('');
    return wrap;
  }
  // ==================== 社交 ====================
  page_social() {
    const g = this.game;
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">` + NPCS.map((n) => {
      const st = g.state.npcs[n.id] || { friendship: 0, giftsThisWeek: 0 };
      const hearts = g.npcSystem.heartsOf(n.id);
      const heartStr = Array.from({ length: 10 }, (_, i) => `<span style="color:${i < hearts ? '#E84A6A' : '#3A4260'}">♥</span>`).join('');
      const bd = n.birthday ? `${SEASON_CN[n.birthday.season]}季${n.birthday.day}日` : '';
      const badge = st.spouse ? '<span style="color:#FFD98A"> ♥配偶</span>' : st.dating ? '<span style="color:#FF8AB8"> ♥恋人</span>' : '';
      return `<div style="display:flex;gap:10px;padding:8px;background:#1A1A26;border:1px solid #3A4260;border-radius:6px;align-items:center">
        <img src="${makePortrait(n.colorScheme, 40, n.id)}" style="width:40px;height:40px;image-rendering:pixelated;border-radius:4px">
        <div style="flex:1">
          <div style="font-size:13px">${n.name} <span style="font-size:11px;color:#8A92B8">${n.title}</span>${badge}</div>
          <div style="font-size:12px;letter-spacing:2px">${heartStr}</div>
          <div style="font-size:10px;color:#8A92B8">生日 ${bd} · 本周已送礼 ${st.giftsThisWeek}/2</div>
        </div>
      </div>`;
    }).join('') + '</div>';
    return wrap;
  }
  // ==================== 任务 ====================
  page_quests() {
    const g = this.game;
    const wrap = document.createElement('div');
    const active = g.state.quests.active, done = g.state.quests.done;
    const pinnedId = g.state.quests.pinned;
    wrap.innerHTML = `
      <div style="font-size:14px;color:#FFD98A;margin-bottom:8px">进行中（${active.length}）</div>
      ${active.length ? active.map((q) => `
        <div style="padding:10px;background:#1A1A26;border:1px solid ${q.id === pinnedId ? '#FFD98A' : '#4A5578'};border-radius:6px;margin-bottom:8px">
          <div style="font-size:14px;color:#E8E8F0;display:flex;justify-content:space-between;align-items:center;gap:8px"><span>${q.name} ${q.expires ? `<span style="font-size:11px;color:#E8A84A">（剩 ${q.expires - g.clock.absoluteDay} 天）</span>` : ''}</span>
            ${q.id === pinnedId ? '<span style="font-size:11px;color:#FFD98A;white-space:nowrap">📌 已置顶</span>' : `<button data-pin="${q.id}" style="padding:2px 10px;background:#2A3048;color:#B8C0D8;border:1px solid #4A5578;border-radius:4px;cursor:pointer;font-size:11px;white-space:nowrap">置顶</button>`}</div>
          <div style="font-size:12px;color:#B8C0D8;margin:4px 0">${q.desc}</div>
          ${q.hint ? `<div style="font-size:11px;color:#8A92B8">灯 ${q.hint}</div>` : ''}
          <div style="font-size:12px;color:#8AE84A;margin-top:4px">进度：${q.progress || 0}/${q.goal.count}</div>
          ${q.reward ? `<div style="font-size:11px;color:#FFD98A">奖励：${q.reward.money ? q.reward.money + 'g' : ''}${q.reward.item ? getItem(q.reward.item).name + '×' + (q.reward.qty || 1) : ''}</div>` : ''}
        </div>`).join('') : '<div style="opacity:.5;padding:10px">暂无进行中的任务</div>'}
      <div style="font-size:14px;color:#8A92B8;margin:12px 0 8px">已完成（${done.length}）</div>
      ${done.map((id) => `<div style="font-size:12px;color:#5A6488;padding:2px 0">✓ ${id}</div>`).join('')}`;
    wrap.querySelectorAll('[data-pin]').forEach((b) => {
      b.onclick = () => { g.quests.pin(b.dataset.pin); g.audio.sfx('click'); this.render(); };
    });
    return wrap;
  }
  // ==================== 成就 ====================
  page_achievements() {
    const g = this.game;
    const wrap = document.createElement('div');
    const got = ACHIEVEMENTS.filter((a) => g.state.achievements.includes(a.id)).length;
    wrap.innerHTML = `<div style="font-size:13px;color:#FFD98A;margin-bottom:10px">已解锁 ${got}/${ACHIEVEMENTS.length}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,200px);gap:8px">` +
      ACHIEVEMENTS.map((a) => {
        const has = g.state.achievements.includes(a.id);
        const hidden = a.hidden && !has;
        return `<div style="padding:8px;background:#1A1A26;border:2px solid ${has ? '#FFD98A' : '#3A4260'};border-radius:6px;${has ? '' : 'opacity:.55'}">
          <div style="font-size:13px;color:${has ? '#FFD98A' : '#8A92B8'}">${has ? '★ ' : ''}${hidden ? '？？？' : a.name}</div>
          <div style="font-size:11px;color:#8A92B8;margin-top:2px">${hidden ? '隐藏成就' : a.desc}</div>
        </div>`;
      }).join('') + '</div>';
    return wrap;
  }
  // ==================== 统计 ====================
  page_stats() {
    const g = this.game, st = g.state.player.stats;
    const wrap = document.createElement('div');
    const rows = [
      ['总收入', st.earned + ' g'], ['总支出', st.spent + ' g'], ['当前金钱', g.state.player.money + ' g'],
      ['游戏天数', st.daysPlayed], ['最深矿井', st.deepestMine + ' 层'], ['挖掘次数', st.mined],
      ['收获作物', st.harvested], ['出货件数', st.shipped], ['钓获鱼类', st.fished],
      ['击杀怪物', st.monstersKilled], ['送出礼物', st.gifts], ['烹饪料理', st.cooked || 0],
      ['制造物品', st.crafted || 0], ['完成任务', g.state.quests.done.length],
      ['成就进度', `${g.state.achievements.length} 个`], ['收集包进度', `${g.bundles.totalDone()}/24`],
    ];
    wrap.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">` +
      rows.map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:#1A1A26;border:1px solid #3A4260;border-radius:6px"><span style="color:#8A92B8">${k}</span><b style="color:#E8E8F0">${v}</b></div>`).join('') + '</div>';
    return wrap;
  }
  // ==================== 设置 ====================
  page_settings() {
    const g = this.game, s = g.state.settings;
    const wrap = document.createElement('div');
    const slider = (id, label, val) => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="width:90px;font-size:13px">${label}</span>
        <input type="range" min="0" max="100" value="${val}" data-set="${id}" style="flex:1">
        <span id="set-${id}" style="width:36px;text-align:right;font-size:13px">${val}</span>
      </div>`;
    wrap.innerHTML = `
      ${slider('master', '主音量', s.volumes.master)}
      ${slider('music', '音乐', s.volumes.music)}
      ${slider('sfx', '音效', s.volumes.sfx)}
      <div style="display:flex;align-items:center;gap:10px;margin:14px 0 10px">
        <span style="width:90px;font-size:13px">画质</span>
        ${['high', 'medium', 'low'].map((q) => `<button data-quality="${q}" style="padding:5px 14px;background:${(g.engine.quality === q) ? '#4A7AB8' : '#2A3048'};color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer">${{ high: '高', medium: '中', low: '低' }[q]}</button>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="width:90px;font-size:13px">移轴景深</span>
        <button data-dof style="padding:5px 14px;background:${g.engine.dof.enabled ? '#4A7AB8' : '#2A3048'};color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer">${g.engine.dof.enabled ? '开' : '关'}</button>
        <span style="font-size:11px;color:#8A92B8">微缩模型感的前后景柔焦</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="width:90px;font-size:13px">UI 缩放</span>
        <input type="range" min="80" max="130" value="${(s.uiScale || 1) * 100}" data-set="uiscale" style="flex:1">
        <span id="set-uiscale" style="width:42px;text-align:right;font-size:13px">${Math.round((s.uiScale || 1) * 100)}%</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="width:90px;font-size:13px">时间流速</span>
        ${[0.5, 1, 2, 4].map((v) => `<button data-speed="${v}" style="padding:5px 14px;background:${g.clock.timeScale === v ? '#4A7AB8' : '#2A3048'};color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer">${v}×</button>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="width:90px;font-size:13px">季节（测试）</span>
        ${['春', '夏', '秋', '冬'].map((n, i) => `<button data-season="${i}" style="padding:5px 14px;background:${g.clock.season === i ? '#4A7AB8' : '#2A3048'};color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer">${n}</button>`).join('')}
        <span style="font-size:11px;color:#8A92B8">立即切换季节（视觉与作物同步刷新）</span>
      </div>
      <div style="font-size:13px;color:#FFD98A;margin:14px 0 8px">键位</div>
      <div id="keybinds" style="font-size:12px;color:#B8C0D8;line-height:2">
        <div>移动 WASD/方向键 · 使用 左键/F · 交互 E · 奔跑 Shift · 菜单 Tab · 制造 C · 地图 M · 日志 J</div>
        <div style="color:#8A92B8;font-size:11px">点击重绑： <button data-rebind="use" style="padding:2px 10px;background:#2A3048;color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer">使用</button>
        <button data-rebind="interact" style="padding:2px 10px;background:#2A3048;color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer">交互</button>
        <button data-rebind="menu" style="padding:2px 10px;background:#2A3048;color:#fff;border:1px solid #4A5578;border-radius:4px;cursor:pointer">菜单</button></div>
      </div>
      <div style="margin-top:16px;border-top:1px solid #4A5578;padding-top:10px">
        <button id="to-title" style="padding:8px 20px;background:#5A3A4A;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer">保存并回到标题</button>
      </div>`;
    return wrap;
  }
  bind_settings(body) {
    const g = this.game;
    body.querySelectorAll('input[data-set]').forEach((inp) => {
      inp.oninput = () => {
        const v = parseInt(inp.value);
        const key = inp.dataset.set;
        if (key === 'uiscale') {
          g.state.settings.uiScale = v / 100;
          document.getElementById('ui').style.fontSize = (14 * (v / 100)) + 'px';
          body.querySelector('#set-uiscale').textContent = v + '%';
        } else {
          g.state.settings.volumes[key] = v;
          g.audio.setVolume(key, v / 100);
          body.querySelector('#set-' + key).textContent = v;
        }
      };
    });
    body.querySelectorAll('button[data-quality]').forEach((b) => {
      b.onclick = () => { g.engine.setQuality(b.dataset.quality); this.render(); };
    });
    body.querySelector('button[data-dof]')?.addEventListener('click', (e) => {
      g.engine.dof.enabled = !g.engine.dof.enabled;
      g.state.settings.dof = g.engine.dof.enabled;
      this.render();
    });
    body.querySelectorAll('button[data-speed]').forEach((b) => {
      b.onclick = () => { g.clock.timeScale = parseFloat(b.dataset.speed); this.render(); };
    });
    body.querySelectorAll('button[data-season]').forEach((b) => {
      b.onclick = () => { g.debug.setSeason(+b.dataset.season); this.render(); };
    });
    body.querySelectorAll('button[data-rebind]').forEach((b) => {
      b.onclick = () => {
        b.textContent = '按新键…';
        const once = (e) => {
          e.preventDefault();
          g.input.bindings[b.dataset.rebind] = [e.code];
          g.state.settings.keybinds = { ...g.state.settings.keybinds, [b.dataset.rebind]: [e.code] };
          b.textContent = { use: '使用', interact: '交互', menu: '菜单' }[b.dataset.rebind] + '=' + e.code;
          window.removeEventListener('keydown', once, true);
        };
        window.addEventListener('keydown', once, true);
      };
    });
    body.querySelector('#to-title').onclick = () => {
      g.save.autoSave(g);
      location.reload();
    };
  }
}
