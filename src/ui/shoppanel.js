// 商店面板：购买/出售/扩容/工具升级/赌场（兑换/老虎机/21点）
import { itemIcon } from './icons.js';
import { getItem, sellPrice } from '../data/items.js';
import { countItem } from '../core/state.js';
import { BUILDINGS } from '../data/animals.js';

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;
const BTN = 'padding:5px 14px;background:#4A7AB8;color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:pointer;font-size:13px';

export class ShopPanel {
  constructor(game) {
    this.game = game;
    this.shopId = null;
    this.el = document.createElement('div');
    this.el.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:720px;max-width:94vw;max-height:80vh;display:none;z-index:150;padding:16px;${PANEL}`;
    document.getElementById('ui').appendChild(this.el);
    window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.shopId) this.hide(); });
  }
  show(shopId) {
    const g = this.game;
    if (!g.shops.isOpen(shopId)) {
      g.ui.tutorial(`现在不营业。营业时间：${g.shops.openText(shopId)}`, 4000);
      g.audio.sfx('error');
      return false;
    }
    this.shopId = shopId;
    this.el.style.display = 'block';
    g.clock.pause(true);
    g.player.frozen = true;
    g.audio.sfx('open');
    this.render();
    return true;
  }
  hide() {
    this.shopId = null;
    this.el.style.display = 'none';
    this.game.clock.pause(false);
    this.game.player.frozen = false;
    this.game.audio.sfx('close');
  }
  render() {
    const g = this.game, s = g.shops.shop(this.shopId);
    const stock = g.shops.stockFor(this.shopId);
    const isCasino = s.special === 'casino';
    const stockRows = stock.map((st, i) => {
      const cur = st.currency === 'coin';
      const afford = cur ? g.state.player.casinoCoins >= st.price : g.state.player.money >= st.price;
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #2A3048">
        <img src="${itemIcon(st.item)}" style="width:28px;height:28px;image-rendering:pixelated">
        <div style="flex:1"><div style="font-size:13px">${getItem(st.item).name}${st.qty > 0 && st.qty < 99 ? ` <span style="color:#8A92B8;font-size:11px">限${st.qty}</span>` : ''}</div>
        <div style="font-size:12px;color:${cur ? '#B87AE8' : '#FFD98A'}">${st.price} ${cur ? '星币' : 'g'}</div></div>
        <button data-buy="${i}" data-qty="1" style="${BTN};${afford ? '' : 'opacity:.4'}">买1</button>
        <button data-buy="${i}" data-qty="10" style="${BTN};${afford ? '' : 'opacity:.4'}">买10</button>
      </div>`;
    }).join('');
    // 出售区（背包可售物）
    const sellRows = g.state.player.inventory.map((it, i) => {
      if (!it || sellPrice(it.id, it.quality) <= 0) return '';
      return `<div style="display:flex;align-items:center;gap:8px;padding:4px 6px;border-bottom:1px solid #232840;font-size:12px">
        <img src="${itemIcon(it.id, it.quality)}" style="width:22px;height:22px;image-rendering:pixelated">
        <div style="flex:1">${getItem(it.id).name} ×${it.qty}</div>
        <div style="color:#FFD98A">${sellPrice(it.id, it.quality)}g</div>
        <button data-sell="${i}" style="${BTN};padding:2px 8px;font-size:11px">卖</button>
      </div>`;
    }).join('');
    // 特殊区
    let special = '';
    if (s.special === 'upgrade_backpack') {
      const cur = g.state.player.invSize;
      const next = cur < 24 ? { slots: 24, price: 2000 } : cur < 36 ? { slots: 36, price: 10000 } : null;
      special = next ? `<button id="sp-backpack" style="${BTN};width:100%;margin-top:8px">背包扩容到 ${next.slots} 格（${next.price}g）</button>` : '<div style="margin-top:8px;color:#8A92B8;font-size:12px">背包已是最大容量</div>';
    }
    if (s.special === 'upgrade_tool') {
      const tools = ['hoe', 'wateringcan', 'axe', 'pickaxe', 'fishingrod'];
      const names = { hoe: '锄头', wateringcan: '浇水壶', axe: '斧头', pickaxe: '镐', fishingrod: '鱼竿' };
      const tiers = ['', '铜', '钢', '金', '铱'];
      special = '<div style="margin-top:8px;font-size:13px;color:#FFD98A">工具升级（材料×5 + 2 天）</div>' + tools.map((t) => {
        const lv = g.state.player.tools[t] || 0;
        if (lv >= 4) return `<div style="font-size:12px;padding:3px;color:#8A92B8">${names[t]}：已是铱级</div>`;
        const up = s.upgrades.find((u) => u.level === lv + 1);
        const pending = g.state.player.toolUpgrades.find((u) => u.tool === t);
        const label = pending ? `${names[t]}：升级中（第${pending.readyAtDay}天可取）` : `${names[t]}→${tiers[lv + 1]}级（${getItem(up.material).name}×5 + ${up.price}g）`;
        return `<button data-tool="${t}" style="${BTN};width:100%;margin-top:4px;font-size:12px;${pending ? 'opacity:.5' : ''}">${label}</button>`;
      }).join('') + `<button id="sp-collect" style="${BTN};width:100%;margin-top:6px">取回已升级工具</button>`;
    }
    if (isCasino) special = this.casinoHTML();
    if (s.special === 'animal') {
      special = '<div style="margin-top:8px;font-size:13px;color:#FFD98A">农场建筑（含材料，3 天建成）</div>' + BUILDINGS.map((b) => {
        const mats = Object.entries(b.materials).map(([k, v]) => `${getItem(k).name}×${v}`).join(' ');
        const owned = this.game.state.farm.buildings.filter((x) => x.id === b.id).length;
        return `<button data-building="${b.id}" style="${BTN};width:100%;margin-top:4px;font-size:12px;text-align:left">${b.name}（${b.capacity} 栏位）${owned ? ' [已有]' : ''}<br><span style="color:#8A92B8">${b.price}g + ${mats}</span></button>`;
      }).join('');
    }
    this.el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:17px;color:#FFD98A">${s.name}</div>
        <div style="font-size:12px;color:#8A92B8">${g.shops.openText(this.shopId)} · 持有 ${g.state.player.money}g${isCasino ? ` / ${g.state.player.casinoCoins} 星币` : ''}</div>
      </div>
      <div style="display:flex;gap:12px">
        <div style="flex:1.2;overflow:auto;max-height:56vh">${stockRows}${special}</div>
        <div style="flex:1;border-left:1px solid #4A5578;padding-left:10px">
          <div style="font-size:13px;color:#FFD98A;margin-bottom:6px">出售（背包）</div>
          <div style="overflow:auto;max-height:52vh">${sellRows || '<div style="opacity:.5;font-size:12px">没有可出售的物品</div>'}</div>
        </div>
      </div>`;
    this.bind();
  }
  casinoHTML() {
    const g = this.game;
    return `
      <div style="margin-top:10px;border-top:1px solid #4A5578;padding-top:8px">
        <div style="font-size:13px;color:#B87AE8">星币兑换（1000g = 100 星币，不可兑回）</div>
        <button id="sp-exchange" style="${BTN};margin-top:4px">兑换 1000g</button>
        <div style="font-size:13px;color:#B87AE8;margin-top:10px">老虎机</div>
        <div style="display:flex;gap:6px;margin-top:4px">
          <button data-slot="10" style="${BTN}">转（10币）</button>
          <button data-slot="100" style="${BTN}">转（100币）</button>
        </div>
        <div id="slot-result" style="font-size:22px;margin-top:6px;min-height:30px"></div>
        <div style="font-size:13px;color:#B87AE8;margin-top:10px">星币21点（100币/局）</div>
        <button id="sp-bj" style="${BTN};margin-top:4px">开一局</button>
        <div id="bj-area" style="margin-top:6px;font-size:13px"></div>
      </div>`;
  }
  bind() {
    const g = this.game;
    this.el.querySelectorAll('button[data-buy]').forEach((btn) => {
      btn.onclick = () => {
        const st = g.shops.stockFor(this.shopId)[parseInt(btn.dataset.buy)];
        if (g.shops.buy(this.shopId, st.item, st.price, parseInt(btn.dataset.qty), st.currency)) this.render();
      };
    });
    this.el.querySelectorAll('button[data-sell]').forEach((btn) => {
      btn.onclick = () => { if (g.shops.sell(parseInt(btn.dataset.sell), 1)) this.render(); };
    });
    this.el.querySelector('#sp-backpack')?.addEventListener('click', () => { if (g.shops.buyBackpack()) this.render(); });
    this.el.querySelectorAll('button[data-tool]').forEach((btn) => {
      btn.onclick = () => { if (g.shops.upgradeTool(btn.dataset.tool)) this.render(); };
    });
    this.el.querySelector('#sp-collect')?.addEventListener('click', () => {
      const got = g.shops.collectTool();
      g.ui.tutorial(got.length ? `取回了：${got.join('、')}` : '还没有可取的工具', 3000);
      this.render();
    });
    this.el.querySelector('#sp-exchange')?.addEventListener('click', () => { if (g.shops.exchange(1000)) this.render(); });
    this.el.querySelectorAll('button[data-building]').forEach((btn) => {
      btn.onclick = () => {
        const b = g.animals.buyBuilding(btn.dataset.building);
        if (b) this.render();
      };
    });
    this.el.querySelectorAll('button[data-slot]').forEach((btn) => {
      btn.onclick = () => {
        const r = g.shops.slotSpin(parseInt(btn.dataset.slot));
        const el = this.el.querySelector('#slot-result');
        if (!r) { el.textContent = '星币不足'; return; }
        el.innerHTML = `${r.reels.join(' ')} ${r.payout > 0 ? `<span style="color:#FFD98A">+${r.payout}</span>` : '<span style="color:#8A92B8">未中</span>'}`;
        this.el.querySelector('div[style*="星币"]');
        this.renderHeader();
      };
    });
    this.el.querySelector('#sp-bj')?.addEventListener('click', () => this.renderBj());
  }
  renderHeader() {
    // 简单重绘头部金额（整页重绘代价小但会丢失21点局，故只更新文本）
    const g = this.game;
    const hdr = this.el.querySelector('div[style*="justify-content:space-between"] div:last-child');
    if (hdr) hdr.textContent = `${g.shops.openText(this.shopId)} · 持有 ${g.state.player.money}g / ${g.state.player.casinoCoins} 星币`;
  }
  renderBj() {
    const g = this.game;
    const bj = g.shops.blackjackDeal(100);
    const area = this.el.querySelector('#bj-area');
    if (!bj) { area.textContent = '星币不足'; return; }
    const show = (hideHole) => {
      const pv = g.shops.bjValue(bj.player), dv = hideHole ? '?' : g.shops.bjValue(bj.dealer);
      area.innerHTML = `你：${bj.player.join(', ')}（${pv}）<br>庄：${hideHole ? bj.dealer[0] + ', ?' : bj.dealer.join(', ') + '（' + dv + '）'}
        ${bj.done ? `<br><b style="color:${bj.result === 'win' ? '#FFD98A' : '#E86A6A'}">${bj.result === 'win' ? '赢了 +' + bj.bet * 2 : bj.result === 'push' ? '平局退还' : '输了'}</b>` : '<br><button id="bj-hit" style="' + BTN + '">要牌</button> <button id="bj-stand" style="' + BTN + '">停牌</button>'}`;
      if (!bj.done) {
        area.querySelector('#bj-hit').onclick = () => { g.shops.bjHit(); show(true); if (bj.done) this.renderHeader(); };
        area.querySelector('#bj-stand').onclick = () => { g.shops.bjStand(); show(false); this.renderHeader(); };
      }
    };
    show(true);
  }
}
