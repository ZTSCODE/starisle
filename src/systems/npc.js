// NPC 系统：日程 AI / 对话 / 好感 / 送礼 / 花束·吊坠·婚礼·配偶 / 好感事件
// 设计文档：docs/design/npc.md
import * as THREE from 'three';
import { NPCS } from '../data/npcs.js';
import { getItem } from '../data/items.js';
import { heldItem, addMoney } from '../core/state.js';
import { makeSpriteChar } from '../render/spritechar.js';
import { makePortrait } from '../ui/dialog.js';
import { pick } from '../core/rng.js';
import { toWorld } from '../world/seamless.js';

const GIFT_POINTS = { love: 80, like: 45, neutral: 20, dislike: -20, hate: -40 };
const EMO = { love: '♥', like: '♪', neutral: '…', dislike: '※', hate: '…' };

// NPC 新手委托（第 2 天起首次对话触发，交付物资得金钱+好感）
export const STARTER_QUESTS = {
  pierre: { item: 'wood', count: 10, money: 150, fp: 30, ask: '店里的木材不够用了，能帮我弄 10 根木头吗？', thanks: '太及时了！这批木头能撑过整个春天。', name: '木材采购' },
  clint: { item: 'stone', count: 10, money: 120, fp: 30, ask: '炉火要熄了，帮我敲 10 块石头来！', thanks: '好石料！今晚又能开炉了。', name: '炉膛燃料' },
  willy: { item: 'fish:any', count: 2, money: 100, fp: 40, ask: '让老头子看看你的本事——钓 2 条鱼来。', thanks: '好小子，有我当年的风范！', name: '老船长的考验' },
  marnie: { item: 'hay', count: 3, money: 80, fp: 40, ask: '小动物们断粮了，匀 3 捆干草给我好吗？', thanks: '它们会感谢你的，我也一样。', name: '牧草告急' },
};

// ── 轮换委托：第 2 天起可接；有新手委托的 NPC 需先完成新手委托；交付后隔 1 天刷新 ──
// 每天每个 NPC 按 hash(id)+日期 确定性出 1 个委托；count 在 [min,max] 内按日变动；money 由物品单价动态计算
export const ROT_QUESTS = {
  pierre: [
    { item: 'fiber', count: [8, 14], fp: 15, name: '编织材料', ask: (n) => `店里想进一批编织材料，帮我割 ${n} 把纤维来好吗？`, thanks: '这些纤维够编好一阵子篮子了！' },
    { item: 'sap', count: [6, 10], fp: 15, name: '树液订单', ask: (n) => `有客户订了树液做胶水，帮我收集 ${n} 份树液吧。`, thanks: '黏度正好，客户肯定满意。' },
    { item: 'clay', count: [3, 5], fp: 20, name: '陶土补货', ask: (n) => `陶艺课缺陶土了，帮我挖 ${n} 块黏土来。`, thanks: '孩子们又能捏泥巴了，谢谢你！' },
  ],
  yunxiang: [
    { item: 'dandelion', count: [2, 3], fp: 15, name: '蒲公英茶', ask: (n) => `我想晒点蒲公英茶，帮我摘 ${n} 朵蒲公英好吗？`, thanks: '晒干了泡茶，清热又去火。' },
    { item: 'spring_onion', count: [4, 6], fp: 15, name: '野葱香包', ask: (n) => `店里想做些香包，帮我采 ${n} 把野葱来。`, thanks: '这味道真清爽，香包一定好卖。' },
    { item: 'daffodil', count: [2, 4], fp: 20, name: '窗台水仙', ask: (n) => `想在窗台摆几株黄水仙，帮我带 ${n} 朵回来吧。`, thanks: '真好看，店里都亮堂了。' },
  ],
  clint: [
    { item: 'coal', count: [4, 6], fp: 20, name: '炉煤告急', ask: (n) => `炉子里的煤快烧完了，帮我弄 ${n} 块煤来！`, thanks: '好煤！炉火烧得正旺。' },
    { item: 'copper_ore', count: [8, 12], fp: 20, name: '铜料订单', ask: (n) => `接了批铜器订单，帮我采 ${n} 块铜矿石。`, thanks: '成色不错，今晚就开炉。' },
    { item: 'quartz', count: [3, 5], fp: 25, name: '石英摆件', ask: (n) => `有客人想要石英摆件，帮我找 ${n} 块石英。`, thanks: '透亮的石英，客人肯定喜欢。' },
  ],
  robin: [
    { item: 'wood', count: [12, 18], fp: 15, name: '镇务木材', ask: (n) => `镇里修缮要木料，帮我备 ${n} 根木头。`, thanks: '辛苦你了，镇里记着这份情。' },
    { item: 'stone', count: [12, 18], fp: 15, name: '镇务石料', ask: (n) => `广场铺路缺石料，帮我搬 ${n} 块石头来。`, thanks: '路能接着铺了，多谢！' },
    { item: 'hardwood', count: [3, 5], fp: 25, name: '硬木横梁', ask: (n) => `旧会馆翻新要硬木做梁，帮我弄 ${n} 根硬木。`, thanks: '好木料！会馆有救了。' },
  ],
  willy: [
    { item: 'fish:any', count: [2, 3], fp: 20, name: '渔获补给', ask: (n) => `店里渔获不够卖了，帮我钓 ${n} 条鱼来。`, thanks: '新鲜得很！今晚就能上架。' },
    { item: 'shrimp', count: [2, 3], fp: 20, name: '白虾订单', ask: (n) => `有餐馆订了白虾，帮我抓 ${n} 只来。`, thanks: '活蹦乱跳的，好虾！' },
    { item: 'crayfish', count: [2, 3], fp: 20, name: '螯虾订单', ask: (n) => `帮我弄 ${n} 只螯虾，客人等着要。`, thanks: '个头不小，客人该满意了。' },
  ],
  haiyue: [
    { item: 'sea_urchin', count: [1, 2], fp: 25, name: '海胆蒸蛋', ask: (n) => `我想试试海胆蒸蛋，帮我捡 ${n} 个海胆好吗？`, thanks: '哇，好肥的海胆！谢谢你！' },
    { item: 'oyster', count: [2, 3], fp: 20, name: '牡蛎汤', ask: (n) => `帮我捡 ${n} 个牡蛎吧，想给奶奶炖汤。`, thanks: '奶奶肯定很高兴！' },
    { item: 'coral', count: [2, 3], fp: 20, name: '珊瑚标本', ask: (n) => `我在做海洋标本，帮我找 ${n} 块珊瑚吧。`, thanks: '好漂亮！我会好好收着的。' },
  ],
  marnie: [
    { item: 'hay', count: [4, 6], fp: 20, name: '干草储备', ask: (n) => `草料快见底了，匀 ${n} 捆干草给我好吗？`, thanks: '小家伙们今晚能吃饱了。' },
    { item: 'egg', count: [2, 3], fp: 15, name: '鸡蛋样品', ask: (n) => `有买家想看看鸡蛋品质，帮我带 ${n} 个鸡蛋来。`, thanks: '蛋壳真结实，好蛋！' },
    { item: 'milk', count: [1, 2], fp: 20, name: '鲜牛奶', ask: (n) => `帮我带 ${n} 瓶鲜牛奶来吧，有客人订了。`, thanks: '真新鲜，谢谢你跑一趟。' },
  ],
  maidong: [
    { item: 'fiber', count: [10, 15], fp: 15, name: '草绳原料', ask: (n) => `我想编草绳，帮我割 ${n} 把纤维吧！`, thanks: '够了够了，能编好长一条！' },
    { item: 'hay', count: [3, 5], fp: 15, name: '小羊的口粮', ask: (n) => `我家小羊最能吃，帮我带 ${n} 捆干草来吧。`, thanks: '小羊肯定会喜欢你的！' },
    { item: 'wood', count: [8, 12], fp: 15, name: '修围栏', ask: (n) => `围栏被顶坏了，帮我砍 ${n} 根木头修一修。`, thanks: '这下羊跑不出去了！' },
  ],
  morris: [
    { item: 'daffodil', count: [2, 3], fp: 15, name: '写生素材', ask: (n) => `黄水仙开得正好，帮我带 ${n} 朵来当写生素材。`, thanks: '嗯——这个光影，值得入画。' },
    { item: 'sweet_pea', count: [2, 3], fp: 20, name: '香豌豆速写', ask: (n) => `帮我找 ${n} 株香豌豆吧，想画一组速写。`, thanks: '线条真优雅，多谢。' },
    { item: 'hazelnut', count: [1, 2], fp: 15, name: '静物榛子', ask: (n) => `静物练习缺点东西，帮我带 ${n} 颗榛子来。`, thanks: '形状很完美，正好入画。' },
  ],
  suwanyin: [
    { item: 'wild_grape', count: [1, 2], fp: 20, name: '润喉野葡萄', ask: (n) => `嗓子有点干，帮我摘 ${n} 串野葡萄润润喉好吗？`, thanks: '酸酸甜甜的，嗓子舒服多了。' },
    { item: 'spice_berry', count: [1, 2], fp: 20, name: '刺莓果酱', ask: (n) => `想熬点刺莓酱，帮我采 ${n} 把刺莓来吧。`, thanks: '熬出来一定很香，谢谢你。' },
    { item: 'blackberry', count: [3, 5], fp: 15, name: '黑莓点心', ask: (n) => `演出前想烤点黑莓点心，帮我摘 ${n} 把黑莓。`, thanks: '真好，今晚请大家吃点心。' },
  ],
  gus: [
    { item: 'potato', count: [2, 3], fp: 15, name: '土豆炖菜', ask: (n) => `后厨土豆不够了，帮我带 ${n} 个土豆来。`, thanks: '个头真足，今晚加菜！' },
    { item: 'leek', count: [2, 3], fp: 15, name: '韭葱提味', ask: (n) => `帮我采 ${n} 把韭葱，炖汤最提味。`, thanks: '这香味，汤肯定鲜。' },
    { item: 'egg', count: [2, 3], fp: 15, name: '鸡蛋补货', ask: (n) => `厨房鸡蛋见底了，匀 ${n} 个鸡蛋给我吧。`, thanks: '帮大忙了，早市的蛋都没你的好。' },
  ],
  shenzhibai: [
    { item: 'clay', count: [2, 4], fp: 15, name: '修补书页', ask: (n) => `修补旧书要黏土调浆，帮我带 ${n} 块黏土来。`, thanks: '这些旧书有救了，多谢。' },
    { item: 'earth_crystal', count: [1, 2], fp: 25, name: '地晶研究', ask: (n) => `我在查地晶的资料，能帮我找 ${n} 块来对照吗？`, thanks: '和古籍里记载的一样……有意思。' },
    { item: 'quartz', count: [2, 4], fp: 20, name: '石英标本', ask: (n) => `图书室想做个小展柜，帮我找 ${n} 块石英。`, thanks: '放在窗边一定很好看。' },
  ],
  anning: [
    { item: 'dandelion', count: [2, 3], fp: 15, name: '草药蒲公英', ask: (n) => `蒲公英能入药，帮我采 ${n} 朵来好吗？`, thanks: '晾起来备用，谢谢你。' },
    { item: 'wild_horseradish', count: [2, 3], fp: 20, name: '山葵药膏', ask: (n) => `帮我挖 ${n} 棵野山葵，做药膏要用。`, thanks: '很新鲜，药效肯定好。' },
    { item: 'crocus', count: [1, 3], fp: 20, name: '番红花安神', ask: (n) => `番红花能安神，帮我采 ${n} 朵来。`, thanks: '我会小心使用的。' },
  ],
  qiaoyin: [
    { item: 'fiber', count: [10, 15], fp: 15, name: '柴扉草绳', ask: (n) => `山里扎篱笆要草绳，帮我割 ${n} 把纤维。`, thanks: '嗯，够用一阵子了。' },
    { item: 'hardwood', count: [2, 4], fp: 25, name: '硬木柴薪', ask: (n) => `帮我劈 ${n} 根硬木吧，冬天烧炕用。`, thanks: '好柴，烧起来旺。' },
    { item: 'pine_mushroom', count: [2, 3], fp: 20, name: '松林菇汤', ask: (n) => `雨后松林出菇了，帮我采 ${n} 朵松林菇。`, thanks: '炖汤最鲜不过。' },
  ],
};
const ROT_COOLDOWN_DAYS = 2; // 交付后 absoluteDay + 2 才刷出下一条（即隔 1 天）

function hashStr(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; }

// 头顶委托标记：3D Sprite 挂进场景，与所有精灵一起走引擎统一的低分辨率后处理像素化管线（亮色自然被 bloom 提出辉光）
function makeMarkTexture(ch, color) {
  const c = document.createElement('canvas'); c.width = c.height = 48;
  const g = c.getContext('2d');
  g.font = '900 38px "Courier New", monospace';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.lineJoin = 'round'; g.strokeStyle = '#23232E';
  g.strokeText(ch, 24, 26);
  g.fillStyle = color; g.fillText(ch, 24, 26);
  return new THREE.CanvasTexture(c);
}
let _markMats = null;
function markMats() {
  if (!_markMats) _markMats = {
    // depthWrite:false + alphaTest：防止透明 quad 的深度/低透明度像素被 DOF/bloom 后处理显示成半透明方块
    offer: new THREE.SpriteMaterial({ map: makeMarkTexture('!', '#FFD94A'), transparent: true, depthWrite: false, alphaTest: 0.1 }),
    turnin: new THREE.SpriteMaterial({ map: makeMarkTexture('?', '#8AE84A'), transparent: true, depthWrite: false, alphaTest: 0.1 }),
  };
  return _markMats;
}

export class NPCSystem {
  constructor(game) {
    this.game = game;
    this.entities = new Map();
    this.group = new THREE.Group();
    game.engine.scene.add(this.group);
    for (const def of NPCS) {
      this.ensureOne(def);
      const char = makeSpriteChar(def.colorScheme);
      char.group.visible = false;
      this.group.add(char.group);
      const mark = new THREE.Sprite(markMats().offer);
      mark.scale.set(0.65, 0.65, 1);
      mark.visible = false;
      this.group.add(mark);
      const [wx, wz] = toWorld(def.scene, def.schedule[0].spot[0], def.schedule[0].spot[1]);
      const ent = { def, char, mesh: char.group, x: wx, z: wz, scene: def.scene, moving: false, idleT: Math.random() * 3, mark };
      char.group.position.set(ent.x, 0, ent.z);
      this.entities.set(def.id, ent);
    }
    game.bus.on('day-start', () => this.onDayStart());
    game.bus.on('scene-changed', () => this.checkHeartEvent());
    game.bus.on('hour', () => this.checkHeartEvent());
    // 婚礼定时
    this.weddingTimer = null;
  }
  ensureOne(def) {
    if (!this.game.state.npcs[def.id]) {
      this.game.state.npcs[def.id] = { friendship: 0, talkedToday: false, giftsToday: false, giftsThisWeek: 0, eventsSeen: [], dating: false, spouse: false, married: false };
    }
  }
  ensureState() { for (const def of NPCS) this.ensureOne(def); }
  // ---- 好感 ----
  addFriendship(id, n) {
    const g = this.game, st = g.state.npcs[id];
    if (!st) return;
    const def = NPCS.find((x) => x.id === id);
    let cap = 2500;
    if (def.marriage && !st.dating && !st.spouse) cap = 2000 - 1; // 未交往封顶 8 心（1999）
    st.friendship = Math.max(0, Math.min(cap, st.friendship + n));
    g.bus.emit('friendship-changed', { id, value: st.friendship });
  }
  heartsOf(id) {
    const st = this.game.state.npcs[id];
    if (!st) return 0;
    if (st.spouse) return Math.min(14, Math.floor(st.friendship / 250));
    return Math.min(10, Math.floor(st.friendship / 250));
  }
  // ---- 日程 ----
  spotFor(def, minute) {
    const g = this.game;
    const rain = ['rain', 'storm'].includes(g.state.weather.today);
    const sched = (rain && def.scheduleRain?.length ? def.scheduleRain : def.schedule) || def.schedule;
    for (const s of sched) {
      if (minute >= s.time[0] && minute < s.time[1]) return s;
    }
    return sched[sched.length - 1];
  }
  update(dt) {
    const g = this.game;
    const curScene = g.state.player.scene;
    this._markT = (this._markT || 0) + dt;
    this.syncRotProgress();
    // 对话对象追踪：对话框关闭后清除（showWithChoices 的选项回调同步衔接，isOpen 不会闪断）
    if (this.talkingTo && !g.dialog?.isOpen) this.talkingTo = null;
    for (const ent of this.entities.values()) {
      const st = g.state.npcs[ent.def.id];
      this.updateQuestMark(ent, st);
      // 配偶住农场
      if (st?.spouse) { this.updateSpouse(ent, dt); continue; }
      const spot = this.spotFor(ent.def, g.clock.minute);
      ent.scene = spot.scene || ent.def.scene;
      const [tx, tz] = toWorld(spot.scene || ent.def.scene, spot.spot[0], spot.spot[1]);
      // 无缝世界：按与玩家距离控制可见性（同区域或邻近即渲染）
      const inScene = ent.scene === curScene && !g.mining.inMine;
      const distToPlayer = Math.hypot(g.player.pos.x - ent.x, g.player.pos.z - ent.z);
      ent.mesh.visible = inScene || distToPlayer < 40;
      if (!ent.mesh.visible) { ent.x = tx; ent.z = tz; ent.mesh.position.set(ent.x, 0, ent.z); continue; }
      // 正在与玩家对话的 NPC：原地站住（不走向日程点），面向玩家
      if (this.talkingTo === ent.def.id && g.dialog?.isOpen) {
        ent.moving = false;
        ent.facing = Math.atan2(g.player.pos.x - ent.x, g.player.pos.z - ent.z);
        ent.char.update(dt, false, false, ent.facing);
        ent.char.faceCamera(g.engine.camera);
        continue;
      }
      // 向目标点移动（受碰撞约束：不进水/建筑/虚空）
      const dx = tx - ent.x, dz = tz - ent.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.4) {
        const sp = 2.2;
        const step = Math.min(sp * dt, d);
        const nx = ent.x + dx / d * step, nz = ent.z + dz / d * step;
        const blocked = (bx, bz) => { const t = g.scenes.groundType(Math.floor(bx), Math.floor(bz)); return t === 'water' || t === 'blocked'; };
        if (!blocked(nx, ent.z)) ent.x = nx;
        if (!blocked(ent.x, nz)) ent.z = nz;
        ent.moving = true;
        ent.facing = Math.atan2(dx, dz);
      } else ent.moving = false;
      ent.mesh.position.set(ent.x, 0, ent.z);
      ent.char.update(dt, ent.moving, false, ent.facing ?? Math.PI);
      ent.char.faceCamera(g.engine.camera);
    }
  }
  nearestEnt(x, z, r = 1.6) {
    let best = null, bd = r;
    for (const ent of this.entities.values()) {
      if (!ent.mesh.visible) continue;
      const d = Math.hypot(ent.x - x, ent.z - z);
      if (d < bd) { bd = d; best = ent; }
    }
    return best;
  }
  // ---- 对话 ----
  dialogueLine(ent) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    const d = def.dialogues;
    if (!ent.seenFirst) { ent.seenFirst = true; return d.first; }
    // 节日
    const fes = g.festivals?.currentFestival?.();
    if (fes) {
      const key = ['festival_spring', 'festival_summer', 'festival_autumn', 'festival_winter'][fes.season];
      if (d[key]) return Array.isArray(d[key]) ? d[key][0] : d[key];
    }
    const rain = ['rain', 'storm'].includes(g.state.weather.today);
    if (rain && d.rain?.length) return pick(Math.random, d.rain);
    const hearts = this.heartsOf(def.id);
    const tierKey = hearts >= 10 && d.heart10 ? 'heart10' : hearts >= 8 && d.heart8 ? 'heart8' : hearts >= 6 && d.heart6 ? 'heart6' : hearts >= 4 && d.heart4 ? 'heart4' : hearts >= 2 && d.heart2 ? 'heart2' : 'heart0';
    const pool = d[tierKey] || d.heart0;
    return pick(Math.random, pool);
  }
  talk(ent) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    this.talkingTo = def.id; // 对话期间该 NPC 原地站住（对话框关闭后由 update 清除）
    const portrait = makePortrait(def.colorScheme, 48, def.id);
    // 首聊好感 +20 与 npc-talked 事件：闲聊/发布/提醒路径共用（维持各路径原有副作用）
    const markTalked = () => {
      if (!st.talkedToday) { st.talkedToday = true; this.addFriendship(def.id, 20); }
      g.bus.emit('npc-talked', def.id);
    };
    // 常驻选项：送礼（手持可送物品时出现）→ 查看任务 → 再见
    // 送礼是独立按钮；委托的提交/接受统一收进「查看任务」，日常对话不再被任务文本抢占
    const giftable = (h) => h && !['tool', 'weapon'].includes(getItem(h.id).type);
    const tailOptions = () => {
      const opts = [];
      const h = heldItem(g.state);
      if (giftable(h)) {
        opts.push({
          text: `赠送「${getItem(h.id).name}」`,
          cb: () => { const cur = heldItem(g.state); if (giftable(cur)) this.giveGift(ent, cur); }, // 点击时重新取手持，防期间切换
        });
      }
      opts.push({ text: '查看任务', cb: () => this.showNpcQuest(ent) }, { text: '再见', cb: () => {} });
      return opts;
    };
    // 日常闲聊（对话内容、首聊好感 +20、npc-talked 事件全部保留）
    const line = this.dialogueLine(ent);
    markTalked();
    g.dialog.showWithChoices(
      [{ name: def.name, text: line, portrait }],
      tailOptions(),
    );
    return true;
  }
  // ---- 委托通用：新手委托与轮换委托统一归一化为 { src, item, count, money, fp, name, ask, thanks } ----
  // 背包中已有数量（fish:any 任意鱼特例：按鱼类合计）
  haveCount(q) {
    const inv = this.game.state.player.inventory;
    return q.item === 'fish:any'
      ? inv.reduce((n, s) => n + (s && getItem(s.id).type === 'fish' ? s.qty : 0), 0)
      : inv.reduce((n, s) => n + (s && s.id === q.item ? s.qty : 0), 0);
  }
  // 检查背包是否凑齐（交付逻辑跨格子扣减，这里也按合计判断）
  hasQuestItems(q) { return this.haveCount(q) >= q.count; }
  // 进行中的委托（新手优先）
  activeQuest(def) {
    const st = this.game.state.npcs[def.id];
    if (!st) return null;
    const sq = STARTER_QUESTS[def.id];
    if (sq && st.starterQuest && !st.starterQuest.done) return { src: 'starter', ...sq };
    if (st.rot) return { src: 'rot', ...st.rot };
    return null;
  }
  // 游戏天数：旧存档可能缺 stats.daysPlayed（字段后加的），缺失时按日历推导（绝对天数-1）
  daysPlayed() {
    const g = this.game;
    const v = g.state.player.stats?.daysPlayed;
    return Number.isFinite(v) ? v : Math.max(0, g.clock.absoluteDay - 1);
  }
  // 轮换委托当日可接的报价：确定性生成并缓存于 st.rotOffer（随存档序列化）
  rotOfferFor(ent) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    if (!st || this.daysPlayed() < 1) return null;
    if (STARTER_QUESTS[def.id] && !st.starterQuest?.done) return null; // 有新手委托的 NPC 需先完成新手委托
    if (st.rot) return null; // 已有进行中的轮换委托
    const day = g.clock.absoluteDay;
    if (st.rotCd != null && day < st.rotCd) return null; // 交付冷却中
    const pool = ROT_QUESTS[def.id];
    if (!pool?.length) return null;
    if (st.rotOffer && st.rotOffer._day === day) return st.rotOffer;
    const h = hashStr(def.id);
    const t = pool[(h + day) % pool.length];
    const count = t.count[0] + (((h >> 3) + day) % (t.count[1] - t.count[0] + 1));
    const unit = t.item === 'fish:any' ? 45 : getItem(t.item).price;
    const offer = {
      _day: day, item: t.item, count, fp: t.fp, name: t.name,
      ask: t.ask(count), thanks: t.thanks,
      money: Math.round((unit * 2 + 6) * count / 5) * 5,
    };
    st.rotOffer = offer;
    return offer;
  }
  // 可接的委托（新手优先于轮换）
  offerQuest(ent) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    if (!st) return null;
    const sq = STARTER_QUESTS[def.id];
    if (sq && !st.starterQuest && this.daysPlayed() >= 1) return { src: 'starter', ...sq };
    const rot = this.rotOfferFor(ent);
    return rot ? { src: 'rot', ...rot } : null;
  }
  // 头顶标记（3D Sprite，随后处理像素化）：可接取 → 黄 ! ；进行中且货已凑齐 → 绿 ? ；NPC 不可见即隐藏
  updateQuestMark(ent, st) {
    const mark = ent.mark;
    if (!mark || !st) return;
    const active = this.activeQuest(ent.def);
    let kind = null;
    if (active && this.hasQuestItems(active)) kind = 'turnin';
    else if (!active && this.offerQuest(ent)) kind = 'offer';
    if (!kind || !ent.mesh.visible) { mark.visible = false; return; }
    mark.material = markMats()[kind];
    // 头顶浮动（按 NPC 横坐标错相，避免全镇同频）
    mark.position.set(ent.x, 2.35 + Math.sin(performance.now() / 300 + ent.x * 1.7) * 0.1, ent.z);
    mark.visible = true;
  }
  // 任务日志里的轮换委托进度与背包同步（置顶追踪器实时显示 x/y）
  syncRotProgress() {
    const g = this.game, qs = g.state.quests;
    if (!qs?.active?.length) return;
    let changed = false;
    for (const q of qs.active) {
      if (q.goal?.type !== 'npc_deliver') continue;
      const p = Math.min(q.goal.count, this.haveCount({ item: q.goal.item }));
      if (p !== q.progress) { q.progress = p; changed = true; }
    }
    if (changed) g.ui.refreshQuestHint?.();
  }
  // 「查看任务」：当前 NPC 的委托交涉入口——可提交（货已凑齐）/ 可接受（有报价）/ 进度或状态说明
  showNpcQuest(ent) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    const portrait = makePortrait(def.colorScheme, 48, def.id);
    const active = this.activeQuest(def);
    if (active) {
      const itemName = active.item === 'fish:any' ? '任意鱼类' : getItem(active.item).name;
      const ready = this.hasQuestItems(active);
      const text = ready
        ? `怎么样，${itemName}凑齐了吗？（「${active.name}」：交付 ${active.count} 个，报酬 ${active.money}g）`
        : `「${active.name}」：交付 ${itemName} ×${active.count}，报酬 ${active.money}g。（你身上现有 ${this.haveCount(active)}/${active.count}）凑齐后来找我提交就行。`;
      const opts = [];
      if (ready) opts.push({ text: `提交「${active.name}」`, cb: () => this.deliverQuest(ent) });
      opts.push({ text: '再见', cb: () => {} });
      g.dialog.showWithChoices([{ name: def.name, text, portrait, emo: ready ? '!' : undefined }], opts);
      return;
    }
    const offer = this.offerQuest(ent);
    if (offer) {
      g.dialog.showWithChoices(
        [{ name: def.name, text: offer.ask + `（${offer.name}：交付 ${offer.count} 个，报酬 ${offer.money}g）`, portrait, emo: '!' }],
        [{ text: `接受「${offer.name}」`, cb: () => this.acceptQuest(ent, offer) }, { text: '再见', cb: () => {} }],
      );
      return;
    }
    let text;
    if (st.rotCd != null && g.clock.absoluteDay < st.rotCd) {
      text = '今天没什么要拜托你的了，过两天再来吧。';
    } else if (STARTER_QUESTS[def.id] && st.starterQuest?.done) {
      text = `「${STARTER_QUESTS[def.id].name}」已经完成了。帮大忙了，谢谢你！`;
    } else {
      text = '眼下我没什么要拜托的事。镇上的公告板偶尔会贴委托，可以去看看。';
    }
    g.dialog.show([{ name: def.name, text, portrait }]);
  }
  // 接受委托：新手写入 starterQuest；轮换写入 st.rot 并进任务日志（可置顶追踪，提交仍需回来找该 NPC）
  acceptQuest(ent, offer) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    const portrait = makePortrait(def.colorScheme, 48, def.id);
    if (offer.src === 'starter') {
      if (st.starterQuest || !STARTER_QUESTS[def.id]) return; // 兜底：已接受/无委托则不重复接受
      st.starterQuest = { done: false };
    } else {
      if (st.rot) return; // 兜底：已有进行中的轮换委托
      const qid = `rot_${def.id}_${g.clock.absoluteDay}`;
      st.rot = { questId: qid, item: offer.item, count: offer.count, money: offer.money, fp: offer.fp, name: offer.name, thanks: offer.thanks };
      st.rotOffer = null;
      const itemName = offer.item === 'fish:any' ? '任意鱼类' : getItem(offer.item).name;
      g.state.quests.active.push({
        id: qid, name: `${offer.name}（${def.name}）`, npcQuest: true,
        desc: `帮${def.name}收集 ${itemName} ×${offer.count}，凑齐后回去找 TA 提交。`,
        goal: { type: 'npc_deliver', item: offer.item, count: offer.count },
        progress: Math.min(offer.count, this.haveCount(offer)),
        reward: { money: offer.money },
      });
      g.quests.ensurePinned();
      g.ui.refreshQuestHint?.();
    }
    g.bus.emit('quest-new', 'npc_' + def.id);
    g.dialog.show([{ name: def.name, text: '太好了，那就拜托你了！', portrait, emo: '♪' }]);
  }
  // 交付委托（新手/轮换通用）：扣物品（fish:any 特例跨格子）、加钱、好感×2、音效、飘字、感谢对话、刷新工具栏、发事件
  deliverQuest(ent) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    const q = this.activeQuest(def);
    if (!q) return; // 兜底：状态已变化则不重复交付
    if (!this.hasQuestItems(q)) return; // 兜底：回调时背包已不满足则不扣货发奖
    let n = q.count;
    for (let i = 0; i < g.state.player.inventory.length && n > 0; i++) {
      const s = g.state.player.inventory[i];
      const match = s && (q.item === 'fish:any' ? getItem(s.id).type === 'fish' : s.id === q.item);
      if (match) { const take = Math.min(n, s.qty); s.qty -= take; n -= take; if (s.qty <= 0) g.state.player.inventory[i] = null; }
    }
    if (q.src === 'starter') {
      st.starterQuest.done = true;
    } else {
      // 从任务日志移除并记入已完成
      const qs = g.state.quests;
      const idx = qs.active.findIndex((x) => x.id === st.rot.questId);
      if (idx >= 0) { const [doneEntry] = qs.active.splice(idx, 1); qs.done.push(doneEntry.id); }
      st.rot = null;
      st.rotCd = g.clock.absoluteDay + ROT_COOLDOWN_DAYS;
      g.quests.ensurePinned();
      g.bus.emit('quest-done', q.questId);
    }
    addMoney(g.state, q.money);
    this.addFriendship(def.id, q.fp * 2);
    g.audio.sfx('levelup');
    g.effects.floatText(ent.mesh.position.clone().add(new THREE.Vector3(0, 1.6, 0)), `+${q.money}g`, '#FFD98A', 14);
    g.dialog.show([{ name: def.name, text: q.thanks || '……多谢你了。', portrait: makePortrait(def.colorScheme, 48, def.id), emo: '♥' }]);
    g.ui.refreshToolbar();
    g.ui.refreshQuestHint?.();
    g.bus.emit('npc-quest-done', def.id);
  }
  giftTier(def, itemId) {
    const g = def.gifts;
    if (g.love?.includes(itemId)) return 'love';
    if (g.like?.includes(itemId)) return 'like';
    if (g.dislike?.includes(itemId)) return 'dislike';
    if (g.hate?.includes(itemId)) return 'hate';
    return 'neutral';
  }
  giveGift(ent, held) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    // 特殊物品：花束/吊坠
    if (held.id === 'bouquet') return this.giveBouquet(ent);
    if (held.id === 'mermaid_pendant') return this.givePendant(ent);
    if (st.giftsToday) {
      g.dialog.show([{ name: def.name, text: '今天已经收过你的礼物啦，明天再来吧。', portrait: makePortrait(def.colorScheme, 48, def.id) }]);
      return false;
    }
    if (st.giftsThisWeek >= 2) {
      g.dialog.show([{ name: def.name, text: '这周收了你好多礼物，我都不好意思了……下周再说？', portrait: makePortrait(def.colorScheme, 48, def.id) }]);
      return false;
    }
    const tier = this.giftTier(def, held.id);
    let pts = GIFT_POINTS[tier];
    // 品质加成
    if (held.quality === 1) pts = Math.round(pts * 1.1);
    else if (held.quality === 2) pts = Math.round(pts * 1.25);
    else if (held.quality === 3) pts = Math.round(pts * 1.5);
    // 生日 8 倍
    const isBirthday = def.birthday && def.birthday.season === g.clock.season && def.birthday.day === g.clock.day;
    if (isBirthday) pts *= 8;
    // 扣物品
    held.qty -= 1;
    if (held.qty <= 0) g.state.player.inventory[g.state.player.toolbarSel] = null;
    st.giftsToday = true;
    st.giftsThisWeek += 1;
    g.state.player.stats.gifts++;
    this.addFriendship(def.id, pts);
    // 反应
    const reactionKey = isBirthday ? 'birthdayGift' : 'giftReaction';
    const reaction = def.dialogues[reactionKey]?.[tier] || def.dialogues.giftReaction?.[tier] || '……谢谢。';
    const p = ent.mesh.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    g.effects.floatText(p, EMO[tier], '#FFD98A', 22);
    g.audio.sfx(tier === 'love' || tier === 'like' ? 'harvest' : tier === 'neutral' ? 'click' : 'error');
    g.effects.burst(ent.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), tier === 'love' ? ['#FFD98A', '#FF8AB8'] : ['#B8C0D8'], tier === 'love' ? 10 : 4, 1.5);
    g.dialog.show([{ name: def.name, text: reaction, portrait: makePortrait(def.colorScheme, 48, def.id), emo: EMO[tier] }]);
    g.ui.refreshToolbar();
    g.bus.emit('gift-given', { npc: def.id, tier, birthday: isBirthday });
    return true;
  }
  giveBouquet(ent) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    if (!def.marriage) { g.dialog.show([{ name: def.name, text: '（尴尬地笑了笑）谢、谢谢？', portrait: makePortrait(def.colorScheme, 48, def.id) }]); return false; }
    if (st.dating || st.spouse) { g.dialog.show([{ name: def.name, text: '我们已经在一起了呀。', portrait: makePortrait(def.colorScheme, 48, def.id) }]); return false; }
    if (this.heartsOf(def.id) < 8) { g.dialog.show([{ name: def.name, text: '你的心意我领了……但我还想再了解你多一点。（需要 8 心好感）', portrait: makePortrait(def.colorScheme, 48, def.id) }]); return false; }
    st.dating = true;
    const held = heldItem(g.state);
    held.qty -= 1; if (held.qty <= 0) g.state.player.inventory[g.state.player.toolbarSel] = null;
    g.audio.sfx('catch');
    g.effects.burst(ent.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), ['#FF8AB8', '#FFD98A'], 16, 2);
    g.dialog.show([{ name: def.name, text: '这束花……是送给我的？（接过花，脸红到了耳根）那……以后请多指教了。', portrait: makePortrait(def.colorScheme, 48, def.id), emo: '♥' }]);
    g.ui.tutorial(`♥ 你和 ${def.name} 正式交往了！`, 5000);
    g.bus.emit('dating', def.id);
    return true;
  }
  givePendant(ent) {
    const g = this.game, def = ent.def, st = g.state.npcs[def.id];
    if (!def.marriage || !st.dating) { g.dialog.show([{ name: def.name, text: '（看着吊坠，困惑地摇头）', portrait: makePortrait(def.colorScheme, 48, def.id) }]); return false; }
    if (st.spouse) { g.dialog.show([{ name: def.name, text: '我们都结婚啦，傻瓜。', portrait: makePortrait(def.colorScheme, 48, def.id) }]); return false; }
    if (this.heartsOf(def.id) < 10) { g.dialog.show([{ name: def.name, text: '这……太突然了。让我再想想好吗？（需要 10 心好感）', portrait: makePortrait(def.colorScheme, 48, def.id) }]); return false; }
    const held = heldItem(g.state);
    held.qty -= 1; if (held.qty <= 0) g.state.player.inventory[g.state.player.toolbarSel] = null;
    st.engaged = true;
    st.weddingDay = g.clock.absoluteDay + 3;
    g.audio.sfx('catch');
    g.effects.shakeScreen(0.05);
    g.dialog.show([{ name: def.name, text: '人鱼吊坠……！（双手捂住嘴，眼眶瞬间红了）我愿意。三天后，在广场上，当着全镇人的面——我愿意！', portrait: makePortrait(def.colorScheme, 48, def.id), emo: '♥' }]);
    g.ui.tutorial(`♥ 婚期定在 3 天后（${g.clock.dateStr()} 起算）`, 6000);
    g.bus.emit('engaged', def.id);
    return true;
  }
  // ---- 婚礼 ----
  onDayStart() {
    const g = this.game;
    for (const st of Object.values(g.state.npcs)) { st.talkedToday = false; st.giftsToday = false; st.giftsThisWeek = 0; }
    // 每周重置送礼次数（周一）
    if (g.clock.weekDay === 0) for (const st of Object.values(g.state.npcs)) st.giftsThisWeek = 0;
    // 婚礼日
    for (const [id, st] of Object.entries(g.state.npcs)) {
      if (st.engaged && !st.spouse && st.weddingDay && g.clock.absoluteDay >= st.weddingDay) this.startWedding(id);
    }
    // 配偶每日帮工
    for (const [id, st] of Object.entries(g.state.npcs)) {
      if (st.spouse) this.spouseMorningHelp(id);
    }
  }
  async startWedding(id) {
    const g = this.game, def = NPCS.find((x) => x.id === id), st = g.state.npcs[id];
    st.spouse = true; st.married = true; st.engaged = false;
    await g.scenes.switchTo('town', [28, 26]);
    const script = [
      { type: 'say', who: 'npc', text: `各位乡亲！今天，${g.state.player.name} 和 ${def.name} 要在这里结为伴侣！` },
      { type: 'say', who: id, text: '我愿意把今后的每一个清晨和黄昏，都交给身边这个人。' },
      { type: 'emo', who: id, emo: 'heart' },
      { type: 'say', who: 'player', text: '我愿意。' },
      { type: 'say', who: 'npc', text: '那么——亲事礼成！大家都来沾沾喜气！' },
      { type: 'sound', name: 'catch' },
      { type: 'fade', to: 'black', ms: 600 },
    ];
    const actors = { player: { mesh: g.player.char.group }, npc: this.entities.get('robin'), [id]: this.entities.get(id) };
    await g.cutscene.play(script, actors);
    // 配偶搬入农场
    const ent = this.entities.get(id);
    ent.scene = 'farm'; ent.x = 22; ent.z = 18;
    st.friendship = Math.max(st.friendship, 3000);
    await g.scenes.switchTo('farm', [22, 20]);
    g.ui.tutorial(`♥ ${def.name} 搬进了你的农场！TA 会帮你做些农活。`, 7000);
    g.bus.emit('married', id);
  }
  updateSpouse(ent, dt) {
    const g = this.game;
    ent.scene = 'farm';
    ent.mesh.visible = g.state.player.scene === 'farm';
    if (!ent.mesh.visible) return;
    // 在农舍附近慢走
    ent.idleT -= dt;
    if (ent.idleT <= 0) {
      ent.idleT = 4 + Math.random() * 6;
      ent.wanderTo = Math.random() < 0.6 ? null : { x: 18 + Math.random() * 10, z: 14 + Math.random() * 8 };
    }
    if (ent.wanderTo) {
      const dx = ent.wanderTo.x - ent.x, dz = ent.wanderTo.z - ent.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.3) ent.wanderTo = null;
      else { ent.x += dx / d * 1.6 * dt; ent.z += dz / d * 1.6 * dt; ent.moving = true; ent.facing = Math.atan2(dx, dz); }
    } else ent.moving = false;
    ent.mesh.position.set(ent.x, 0, ent.z);
    ent.char.update(dt, ent.moving, false, ent.facing ?? Math.PI);
    ent.char.faceCamera(g.engine.camera);
  }
  spouseMorningHelp(id) {
    const g = this.game, def = NPCS.find((x) => x.id === id), st = g.state.npcs[id];
    const helps = def.spouseHelp || ['water', 'breakfast'];
    const help = helps[Math.floor(Math.random() * helps.length)];
    if (help === 'water') {
      let n = 0;
      for (const k of Object.keys(g.state.farm.tiles)) {
        const t = g.state.farm.tiles[k];
        if (t.tilled && !t.watered) { t.watered = true; n++; }
      }
      if (n > 0) { g.farming.syncAll(); g.ui.tutorial(`♥ ${def.name} 今早帮你浇了 ${n} 块地`, 4000); }
    } else if (help === 'feed') {
      if (g.state.animals?.list?.length) {
        for (const a of g.state.animals.list) a.fedToday = true;
        g.ui.tutorial(`♥ ${def.name} 帮你喂过了动物`, 4000);
      }
    } else if (help === 'breakfast') {
      g.quests && g.ui.tutorial(`♥ ${def.name} 给你留了早餐（+50 体力）`, 4000);
      g.state.player.energy = Math.min(g.state.player.maxEnergy, g.state.player.energy + 50);
    } else if (help === 'fence') {
      g.ui.tutorial(`♥ ${def.name} 检修了农场围栏`, 3000);
    }
  }
  // ---- 好感事件 ----
  checkHeartEvent() {
    const g = this.game;
    if (g.cutscene.active || g.dialog.isOpen || g.mining.inMine) return;
    for (const ent of this.entities.values()) {
      const def = ent.def, st = g.state.npcs[def.id];
      if (!def.heartEvents?.length || st.spouse) continue;
      for (const ev of def.heartEvents) {
        if (st.eventsSeen.includes(ev.hearts)) continue;
        if (this.heartsOf(def.id) < ev.hearts) continue;
        if (ev.scene !== g.state.player.scene) continue;
        if (ev.time && (g.clock.minute < ev.time[0] || g.clock.minute > ev.time[1])) continue;
        if (ev.weather && g.state.weather.today !== ev.weather) continue;
        st.eventsSeen.push(ev.hearts);
        const actors = { player: { mesh: g.player.char.group }, npc: ent, [def.id]: ent };
        g.cutscene.play(ev.script, actors);
        return;
      }
    }
  }
  birthdayTomorrow() {
    const g = this.game;
    const abs = (s, d) => s * 28 + d;
    const now = abs(g.clock.season, g.clock.day) + 1;
    return NPCS.find((n) => n.birthday && abs(n.birthday.season, n.birthday.day) === now) || null;
  }
  dots() {
    const g = this.game;
    const out = [];
    for (const ent of this.entities.values()) {
      const st = g.state.npcs[ent.def.id];
      out.push({ id: ent.def.id, name: ent.def.name, scene: st?.spouse ? 'farm' : ent.scene, x: ent.x, z: ent.z });
    }
    return out;
  }
  serialize() {}
  deserialize() {}
}
