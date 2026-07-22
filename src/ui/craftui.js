// 制造/烹饪面板（C 键打开制造，厨房灶台打开烹饪）
import { RECIPES } from '../data/recipes.js';
import { COOKING } from '../data/cooking.js';
import { itemIcon } from './icons.js';
import { getItem } from '../data/items.js';
import { countItem } from '../core/state.js';

const PANEL = `background:linear-gradient(180deg,#2B2F45,#222538);border:3px solid #0C0E18;outline:2px solid #B8895A;outline-offset:-1px;border-radius:3px;box-shadow:0 10px 34px rgba(0,0,0,.55),inset 0 0 0 1px #4A5578;color:#F0E8D8;`;

export class CraftUI {
  constructor(game) {
    this.game = game;
    this.mode = 'craft'; // craft | cook
    this.open = false;
    this.el = document.createElement('div');
    this.el.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:640px;max-width:94vw;max-height:76vh;display:none;z-index:150;padding:16px;${PANEL}`;
    document.getElementById('ui').appendChild(this.el);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyC' && !this.open) this.show('craft');
      else if (e.code === 'Escape' && this.open) this.hide();
    });
  }
  show(mode = 'craft') {
    this.mode = mode;
    this.open = true;
    this.el.style.display = 'block';
    this.game.clock.pause(true);
    this.game.player.frozen = true;
    this.game.audio.sfx('open');
    this.render();
  }
  hide() {
    this.open = false;
    this.el.style.display = 'none';
    this.game.clock.pause(false);
    this.game.player.frozen = false;
    this.game.audio.sfx('close');
  }
  ingText(ing) {
    const g = this.game;
    if (ing.item) {
      const have = countItem(g.state, ing.item);
      const ok = have >= ing.qty;
      return `<span style="color:${ok ? '#8AE84A' : '#E86A6A'}"><img src="${itemIcon(ing.item)}" style="width:16px;height:16px;vertical-align:-3px;image-rendering:pixelated"> ${getItem(ing.item).name} ${have}/${ing.qty}</span>`;
    }
    const names = { fish: '任意鱼', egg: '任意蛋', milk: '任意奶', vegetable: '任意蔬菜', fruit: '任意水果' };
    const have = this.game.crafting.countAny(ing.any);
    const ok = have >= ing.qty;
    return `<span style="color:${ok ? '#8AE84A' : '#E86A6A'}">${names[ing.any] || ing.any} ${have}/${ing.qty}</span>`;
  }
  render() {
    const g = this.game;
    const isCraft = this.mode === 'craft';
    const list = isCraft ? g.crafting.knownRecipes() : g.crafting.knownCooking();
    const rows = list.map((r) => {
      const id = isCraft ? r.out : r.id;
      const name = isCraft ? getItem(r.out).name : r.name;
      const can = isCraft ? g.crafting.canCraft(r) : r.ingredients.every((ing) => ing.item ? countItem(g.state, ing.item) >= ing.qty : g.crafting.countAny(ing.any) >= ing.qty);
      const ings = r.ingredients.map((i) => this.ingText(i)).join(' · ');
      return `<div style="display:flex;align-items:center;gap:10px;padding:7px 8px;border-bottom:1px solid #2A3048">
        <img src="${itemIcon(id)}" style="width:30px;height:30px;image-rendering:pixelated">
        <div style="flex:1"><div style="font-size:14px">${name}${isCraft && r.qty > 1 ? ' ×' + r.qty : ''}</div><div style="font-size:11px;opacity:.85">${ings}</div></div>
        <button data-id="${r.id}" style="padding:5px 16px;background:${can ? '#4A7AB8' : '#3A3A4A'};color:#fff;border:1px solid #8A92B8;border-radius:4px;cursor:${can ? 'pointer' : 'not-allowed'};font-size:13px">${isCraft ? '制造' : '烹饪'}</button>
      </div>`;
    }).join('');
    this.el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:17px;color:#FFD98A">${isCraft ? '制 制造' : '烹 烹饪'}</div>
        <div style="font-size:12px;color:#8A92B8">C 制造 · Esc 关闭</div>
      </div>
      <div style="overflow:auto;max-height:60vh">${rows || '<div style="opacity:.6;padding:20px;text-align:center">还没有学会的配方</div>'}</div>`;
    this.el.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.onclick = () => {
        const ok = isCraft ? g.crafting.craft(btn.dataset.id) : g.crafting.cook(btn.dataset.id);
        if (ok) this.render(); else g.audio.sfx('error');
      };
    });
  }
}
