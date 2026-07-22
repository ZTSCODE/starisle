// 入口：总装配（场景管理 + 全部玩法系统 + UI + 音频 + 调试钩子）
import * as THREE from 'three';
import { Engine } from './core/engine.js';
import { Input } from './core/input.js';
import { GameClock } from './core/time.js';
import { bus } from './core/events.js';
import { newGame, addItem, heldItem, tickBuffs } from './core/state.js';
import { SaveSystem } from './core/save.js';
import { AudioEngine } from './audio/engine.js';
import { BGMPlayer } from './audio/bgm.js';
import { Ambience } from './audio/ambience.js';
import { Lighting } from './render/lighting.js';
import { Sky } from './render/sky.js';
import { Effects } from './render/effects.js';
import { WeatherFX } from './render/weather.js';
import { makeSpriteChar, PlayerController } from './render/spritechar.js';
import { FpHand } from './render/fphand.js';
import { Farming, farmGroundType } from './systems/farming.js';
import { DayCycle } from './systems/daycycle.js';
import { Mining } from './systems/mining.js';
import { Fishing } from './systems/fishing.js';
import { Crafting } from './systems/crafting.js';
import { Shops } from './systems/shops.js';
import { Bundles } from './systems/bundles.js';
import { Achievements } from './systems/achievements.js';
import { Quests } from './systems/quests.js';
import { TV } from './systems/tv.js';
import { Pets } from './systems/pets.js';
import { Mail } from './systems/mail.js';
import { AnimalsSystem } from './systems/animals.js';
import { NPCSystem } from './systems/npc.js';
import { NPCS } from './data/npcs.js';
import { Festivals } from './systems/festivals.js';
import { Foraging } from './systems/foraging.js';
import { Story } from './systems/story.js';
import { Cutscene } from './systems/cutscene.js';
import { DialogUI } from './ui/dialog.js';
import { HUD } from './ui/hud.js';
import { injectTheme } from './ui/theme.js';
import { CraftUI } from './ui/craftui.js';
import { ShopPanel } from './ui/shoppanel.js';
import { BundleUI } from './ui/bundleui.js';
import { TVUI } from './ui/tvui.js';
import { Menus } from './ui/menus.js';
import { TitleScreen } from './ui/title.js';
import { Chests } from './ui/chestui.js';
import { getItem } from './data/items.js';
import { SceneManager } from './world/scenes.js';
import { REGIONS, toWorld, toLocal, regionAt } from './world/seamless.js';
import { WorldBuilder, collisionAt } from './world/builder.js';
import { BUILDINGS as LAYOUT_BUILDINGS, POI, DECOR as LAYOUT_DECOR, WATERS } from './world/layout.js';
import { Interiors } from './world/interiors.js';
import { DevTools } from './ui/devtools.js';
import { TouchControls, isTouchDevice } from './ui/touchcontrols.js';
import { WorldEdge } from './world/edge.js';
import { LightProps } from './world/lights.js';

const app = document.getElementById('app');
injectTheme();
const engine = new Engine(app);
const input = new Input(engine.renderer.domElement);
// 触屏设备：启用虚拟摇杆 + 触屏按键（伪键码注入，与键鼠并存）
const touch = isTouchDevice() ? new TouchControls(input) : null;
if (touch) {
  const kbAxis = input.axis.bind(input);
  input.axis = () => (touch.active ? touch.axis() : kbAxis());
  // 移动端渲染精度加倍（像素块缩小 50%）：4→2，锯齿明显变细；画质切换也保持
  engine.pixelScale = 2;
  engine.resize();
  const _setQ = engine.setQuality.bind(engine);
  engine.setQuality = (q) => { _setQ(q); engine.pixelScale = 2; engine.resize(); };
}
const clock = new GameClock();
const state = newGame({ name: '小屿', farmName: '晨风农场' });
const save = new SaveSystem(bus);
const audio = new AudioEngine();
const bgm = new BGMPlayer(audio);
const ambience = new Ambience(audio);
const lighting = new Lighting(engine);
const sky = new Sky(engine);
const effects = new Effects(engine);
const game = { engine, input, clock, state, save, audio, bus, effects, lighting, sky, bgm, ambience };
engine.game = game; // 供光照等底层模块读取全局开关（如照相模式）
window.game = game;
// 立绘图片探测：.assetflow/portraits/<id>.png 存在则注册（makePortrait 优先用图）
game.portraitFiles = new Set();
Promise.allSettled(
  NPCS.map((n) =>
    fetch(`.assetflow/portraits/${n.id}.png`, { method: 'HEAD' }).then((r) => { if (r.ok) game.portraitFiles.add(n.id); })
  )
).catch(() => {});
const weatherFxSys = new WeatherFX(game);
game.weatherFxSys = weatherFxSys;

// ---- 场景管理 ----
const sceneManager = new SceneManager(game);
game.scenes = sceneManager;

const char = makeSpriteChar({});
engine.scene.add(char.group);
const player = new PlayerController(char, engine.camera, input);
player.teleport(21, 14); // 出生点：农舍门口
// 站立高度：栈桥甲板抬升 0.5m（边缘 0.6m 内平滑过渡），其余地面为 0
player.groundYFn = (x, z) => {
  const P = LAYOUT_DECOR.pier;
  if (!P) return 0;
  const inX = Math.abs(x - P.from[0]) <= P.w / 2 + 0.2;
  const z0 = Math.min(P.from[1], P.to[1]), z1 = Math.max(P.from[1], P.to[1]);
  if (!inX || z < z0 - 0.6 || z > z1 + 0.6) return 0;
  const edge = Math.min(1, Math.max(0, (z - (z0 - 0.6)) / 0.6), Math.max(0, ((z1 + 0.6) - z) / 0.6));
  return 0.5 * Math.min(1, edge * 1.2);
};
game.player = player;
// 第一人称手部（手持当前快捷栏物品；内部按需把相机挂进场景）
const fpHand = new FpHand(game);
game.fpHand = fpHand;

// ---- 系统 ----
const farming = new Farming(game);
game.farming = farming;
const daycycle = new DayCycle(game);
game.daycycle = daycycle;
const mining = new Mining(game);
game.mining = mining;
const fishing = new Fishing(game);
game.fishing = fishing;
fishing.zoneProvider = (scene, x, z) => {
  // 矿洞：仅熔岩池（tile 3）可钓 zone:'mine' 的鱼
  if (scene === 'mine') {
    return mining.inMine && mining.grid && mining.grid[z * 24 + x] === 3 ? 'mine' : null;
  }
  const region = regionAt(sceneManager.scenes, x, z);
  // 农场塘：像素级地表判定（与布局池塘一致，双保险）
  if (region === 'farm') {
    const [lx, lz] = toLocal('farm', x, z);
    if (farmGroundType(lx, lz) === 'water') return 'lake';
  }
  // 海域/湖泊：按 WATERS 实际水域判定，不要求落在任何区域边界内（海延伸出区域外也能钓）
  const cx = x + 0.5, cz = z + 0.5;
  for (const w of WATERS) {
    if (w.kind === 'sea') {
      const [rx, rz, rw, rh] = w.rect;
      if (cx >= rx && cx < rx + rw && cz >= rz && cz < rz + rh) return 'sea';
    } else if (w.kind === 'lake') {
      const [ex, ez, erx, erz] = w.ellipse;
      const dx = (cx - ex) / erx, dz = (cz - ez) / erz;
      if (dx * dx + dz * dz <= 1) return 'lake';
    }
  }
  return null;
};
const crafting = new Crafting(game);
game.crafting = crafting;
const shops = new Shops(game);
game.shops = shops;
const bundles = new Bundles(game);
game.bundles = bundles;
const achievements = new Achievements(game);
game.achievements = achievements;
const quests = new Quests(game);
game.quests = quests;
const hud = new HUD(game);
game.ui = hud;
if (touch) touch.game = game; // 触屏手势层需要访问 game（滑屏切快捷栏/判断第一人称）
const tv = new TV(game);
game.tv = tv;
const pets = new Pets(game);
game.pets = pets;
const mail = new Mail(game);
game.mail = mail;
mail.checkIntroLetters(); // 启动态补发（真实新游戏/读档会在 applyLoadedState 里再判一次，不重复）
const animals = new AnimalsSystem(game);
game.animals = animals;
const dialog = new DialogUI(game);
game.dialog = dialog;
const cutscene = new Cutscene(game);
game.cutscene = cutscene;
const npcSystem = new NPCSystem(game);
game.npcSystem = npcSystem;
const festivals = new Festivals(game);
game.festivals = festivals;
const foraging = new Foraging(game);
game.foraging = foraging;
const story = new Story(game);
game.story = story;

// ---- UI ----
const craftUI = new CraftUI(game);
game.craftUI = craftUI;
const shopPanel = new ShopPanel(game);
game.shopPanel = shopPanel;
const tvUI = new TVUI(game);
game.tvUI = tvUI;
const bundleUI = new BundleUI(game);
game.bundleUI = bundleUI;
const menus = new Menus(game);
game.menus = menus;
const title = new TitleScreen(game);
game.title = title;
const chests = new Chests(game);
game.chests = chests;
const interiors = new Interiors(game);
game.interiors = interiors;
const devtools = new DevTools(game);
game.devtools = devtools;
// 面板互斥（打开菜单前检查）
game.ui.anyPanelOpen = () =>
  menus.isOpen || craftUI.open || !!shopPanel.shopId || dialog.isOpen || title.isOpen || cutscene.active || interiors.active !== null ||
  tvUI.el.style.display !== 'none' || bundleUI.el.style.display !== 'none' || mail.el.style.display !== 'none' ||
  hud.centerPanel.style.display !== 'none' || daycycle.sleeping;
// 是否有面板/对话占用 Esc（不含"在室内"本身），用于决定 Esc 是关面板还是退出房屋
game.ui.panelBusy = () =>
  menus.isOpen || craftUI.open || !!shopPanel.shopId || !!chests.openKey || dialog.isOpen || title.isOpen || cutscene.active ||
  tvUI.el.style.display !== 'none' || bundleUI.el.style.display !== 'none' || mail.el.style.display !== 'none' ||
  hud.centerPanel.style.display !== 'none' || daycycle.sleeping;
// 面板自己的 Esc 监听在 keydown 冒泡阶段就把面板关了，主循环下一帧再判断就晚了；
// 所以在捕获阶段（先于面板监听）记录"这次 Esc 按下时是否有面板开着"
let escUsedByPanel = false;
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') escUsedByPanel = game.ui.panelBusy();
}, true);
// 存档装载（新游戏/读档共用）
game.applyLoadedState = (st) => {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, st);
  // 子状态结构兜底（各系统 ensure 的集中版）
  if (!state.bundles.progress) state.bundles = { progress: {}, roomsDone: [] };
  if (state.player.casinoCoins == null) state.player.casinoCoins = 0;
  if (!state.player.toolUpgrades) state.player.toolUpgrades = [];
  // 旧档迁移：stats 字段补全（含 daysPlayed——缺失会导致 NPC 委托永不发布）
  const dpMissing = !Number.isFinite(st.player?.stats?.daysPlayed); // 要在合并默认值前判断，否则默认 0 会掩盖缺失
  state.player.stats = { earned: 0, spent: 0, steps: 0, fished: 0, mined: 0, tilled: 0, harvested: 0, gifts: 0, daysPlayed: 0, deepestMine: 0, shipped: 0, monstersKilled: 0, cropsShipped: {}, ...state.player.stats };
  if (dpMissing) {
    state.player.stats.daysPlayed = Math.max(0, (st.time.year - 1) * 112 + st.time.season * 28 + st.time.day - 1);
  }
  if (!state.farm.machines) state.farm.machines = [];
  if (!state.farm.buildings) state.farm.buildings = [];
  if (!state.forage) state.forage = { trees: {}, stumps: {}, spawned: [], weekCount: {}, lastWeek: 0 };
  if (!state.story) state.story = { stage: 0, introDone: false, ccIntro: false, sparks: 0, ended: false };
  if (!state.pet) state.pet = { kind: state.player.pet || 'cat', love: 0, pettedToday: false, x: 22, z: 20 };
  npcSystem.ensureState();
  if ((st.player.invSize ?? 0) < 24) st.player.invSize = 24; // 旧档迁移：背包至少 24 格
  clock.restore(st.time);
  builder.setSeason(st.time.season); // 直接重绘世界（门面 setSeason 为空操作）
  foraging.scanTrees(); // 场景换季重建后重扫自然资源引用
  farming.syncAll();
  crafting.syncAll();
  animals.deserialize();
  quests.deserialize?.();
  mail.checkIntroLetters?.(); // 开场信/引导信（读档或新游戏替换 state 后补发，各只发一次）
  hud.refreshToolbar();
  // 出生点兜底：存档坐标不可行走（旧档/布局变动导致落水或卡墙）→ 农舍门口
  const HOME_SPAWN = [21, 14];
  const sx = st.player.x ?? HOME_SPAWN[0], sz = st.player.z ?? HOME_SPAWN[1];
  const [tx, tz] = collisionAt(sx, sz) === 'walk' ? [sx, sz] : HOME_SPAWN;
  if (st.player.scene && st.player.scene !== sceneManager.currentId) sceneManager.switchTo(st.player.scene);
  player.teleport(tx, tz);
};

// ---- 世界构建（一体化底图 + 建筑/设施/植被，layout.js 单一权威） ----
const builder = new WorldBuilder(game).build(clock.season);
game.worldBuilder = builder;
sceneManager.worldGroup.add(builder.group);

// 门面区域（逻辑标签 + 碰撞查询 + 节日装饰挂载点）
function makeFacade(id, name, W, H, spawn) {
  const r = REGIONS[id];
  return {
    id, name, W, H,
    group: new THREE.Group(),
    defaultSpawn: spawn,
    groundType: (x, z) => collisionAt(x + r.ox, z + r.oz),
    interactables: [],
    exits: [],
    update: (dt, t) => builder.update(dt, t),
    setSeason: () => {}, // 视觉换季走 builder.setSeason（见 load/debug 调用点），门面不重复触发
  };
}
sceneManager.register(makeFacade('farm', '晨风农场', 48, 48, [24, 26]));
sceneManager.register(makeFacade('town', '汐溪镇', 56, 48, [24, 60]));
sceneManager.register(makeFacade('beach', '碎星海滩', 40, 32, [4, 15]));
sceneManager.register(makeFacade('forest', '低语森林', 48, 40, [4, 20]));
sceneManager.register(makeFacade('mountain', '星峰山路', 40, 32, [20, 29]));
sceneManager.attachPlayer(player);

// 布局交互点（建筑门/设施，按区域注册到对应门面）
function addInteract(wx, wz, r, label, action) {
  const region = regionAt(sceneManager.scenes, wx, wz);
  if (!region) return;
  sceneManager.get(region).interactables.push({ x: wx - REGIONS[region].ox, z: wz - REGIONS[region].oz, r, label, action });
}
for (const b of LAYOUT_BUILDINGS) {
  const [dx, dz, act] = b.door;
  if (act === 'sleep') addInteract(dx, dz, 1.8, 'E 进入农舍', () => interiors.enter('farmhouse'));
  else if (act?.startsWith('shop:')) {
    const sid = act.slice(5);
    addInteract(dx, dz, 1.8, `E ${b.name}`, () => { if (!interiors.enter(sid)) game.shopPanel.show(sid); });
  } else if (act === 'cc') addInteract(dx, dz, 2.2, 'E 社区旧会馆', () => { if (!interiors.enter('cc')) bundleUI.show(); });
  else if (act === 'home') addInteract(dx, dz, 1.5, `E ${b.name}`, () => { audio.sfx('close'); hud.tutorial(`「${b.name}」门锁着，窗帘后透出暖暖的灯光。`, 4000); });
  else if (act === 'mine') addInteract(dx, dz, 2, 'E 进入矿洞', () => bus.emit('enter-mine'));
}
// 设施点
addInteract(28, 12.5, 1.5, 'E 出货箱（投入手持物品）', () => {
  const held = heldItem(state);
  if (!held) { hud.tutorial('手持要出售的物品再按 E（整组出售）'); return; }
  const ok = daycycle.depositShipping(state, state.player.toolbarSel, true);
  if (ok) { audio.sfx('coin'); hud.refreshToolbar(); effects.floatText(new THREE.Vector3(28, 1.2, 12.5), '已出货（睡前结算）', '#FFD98A', 13); }
  else { audio.sfx('error'); hud.tutorial('这个不能出售'); }
});
addInteract(26, 12.2, 1.3, 'E 信箱', () => mail.show());
addInteract(19, 12, 1.3, 'E 看电视', () => tvUI.show());
addInteract(24, -24.5, 2.2, 'E 进入矿洞', () => bus.emit('enter-mine'));
addInteract(24.5, 69.5, 1.7, 'E 查看公告板', () => {
  const c = clock;
  const lines = [`今日 ${c.dateStr()}`];
  const nextF = game.festivals.tomorrowFestival?.();
  if (nextF) lines.push(`节日预告：${nextF.name}（临近）`);
  const bd = npcSystem.birthdayTomorrow();
  if (bd) lines.push(`近期生日：${bd.name}`);
  const delivered = quests.deliverItems();
  lines.push(delivered > 0 ? `√ 交付了 ${delivered} 项委托物资！` : '（委托见任务日志，凑齐物资后到此交付）');
  audio.sfx('open');
  hud.tutorial(lines.join('<br>'), 9000);
});
addInteract(47.8, 80.5, 1.4, 'E 星灯赌场', () => game.shopPanel.show('casino'));
addInteract(30, -20, 1.8, 'E 矿车', () => {
  if (!state.flags.minecart) { hud.tutorial('矿车轨道锈死了。旧会馆的收集包也许能修复它。', 5000); return; }
  hud.tutorial('矿车快行：农场 ↔ 山路（已开通）', 3000);
});
addInteract(88, 30, 2, 'E 旅行商队', () => {
  if (shops.isOpen('traveler')) game.shopPanel.show('traveler');
  else hud.tutorial(`商队只在周五、周日摆摊。${shops.openText('traveler')}`, 4000);
});
addInteract(42, -24, 2, 'E 断桥（采石场方向）', () => {
  if (state.flags.bridgeFixed) hud.tutorial('桥已修好，往前走就是采石场。', 3000);
  else hud.tutorial('桥断了。旧会馆的收集包也许能修复它……', 4000);
});
// 农场系统层并入世界容器（矿洞进入时整体隐藏）
sceneManager.worldGroup.add(farming.group, crafting.group, animals.group, chests.group, foraging.group, pets.sprite, npcSystem.group);
// 初始落位（无演出）
sceneManager.enterInitial('farm');
// 世界边缘屏障（林墙/山崖，遮挡地块外缘）
const worldEdge = new WorldEdge(game);
game.worldEdge = worldEdge;
// 氛围光源系统（12 种光源 + 实点光源池）
const lightProps = new LightProps(game);
lightProps.placeAll();
sceneManager.worldGroup.add(lightProps.group);
game.lightProps = lightProps;
// 自然资源全区域扫描与生成
foraging.scanTrees();
foraging.initSpecialSpots();
for (const id of ['farm', 'forest', 'beach', 'mountain', 'town']) foraging.spawnSceneItems(id);
// 换季：重绘底图与植被 + 重扫自然资源
bus.on('season-start', (s) => { builder.setSeason(s); foraging.scanTrees(); });
bus.on('scene-changed', () => {});
farming.syncAll();
crafting.syncAll();

// ---- 全局事件 ----
bus.on('overtime', () => { if (mining.inMine) mining.exit({ goMountain: false }); });
bus.on('energy-changed', (e) => { if (e <= -15) { if (mining.inMine) mining.exit({ goMountain: false }); daycycle.passOut('体力透支，你累倒了'); } });
bus.on('health-changed', (h) => { if (h <= 0 && !mining.inMine) daycycle.passOut('伤重不治，你昏了过去'); });
bus.on('minute', () => tickBuffs(state));
bus.on('warp-request', (scene) => { sceneManager.switchTo(scene); audio.sfx('levelup'); });
bus.on('enter-mine', () => { if (!mining.inMine) mining.enter(1); });
bus.on('buy-animal', (type) => animals.buyAnimal(type));
bus.on('buy-building', (id) => animals.buyBuilding(id));
bus.on('room-done', () => farming.syncGreenhouse());
farming.syncGreenhouse();

// 天气 → 光照参数
const weatherFx = {
  sunny: { fogMul: 1, lightMul: 1 },
  cloudy: { fogMul: 1.15, lightMul: 0.8, fogTint: '#B8C4CC' },
  rain: { fogMul: 1.55, lightMul: 0.45, fogTint: '#7A8A9C', bloomAdd: 0.05 },
  snow: { fogMul: 1.35, lightMul: 0.65, fogTint: '#C8D8E8' },
  wind: { fogMul: 1.05, lightMul: 0.95 },
  storm: { fogMul: 1.85, lightMul: 0.32, fogTint: '#6E7E90', bloomAdd: 0.08 },
};

// 音乐总监
const SEASON_TRACKS = ['spring', 'summer', 'autumn', 'winter'];
function currentTrack() {
  const scene = state.player.scene;
  if (scene === 'mine') return 'mine';
  if (daycycle.isFestivalDay && ['town', 'beach'].includes(scene)) return 'festival';
  const w = state.weather.today;
  if (['rain', 'storm', 'snow'].includes(w)) return null;
  if (scene === 'beach') return 'sea'; // 海边专属：静默孤独
  if (clock.isNight) return 'night';
  return SEASON_TRACKS[clock.season];
}
bgm.onSilence = () => { const t = currentTrack(); if (t) bgm.play(t); };

// ============ 照相模式（KeyP）：时间暂停 + 角色静止 + 自由镜头 + 参数调节 ============
const photo = {
  active: false,
  saved: null,
  pos: new THREE.Vector3(),
  yaw: 0, pitch: 0.5,
  el: null,
};
function togglePhoto() {
  const g = game;
  if (!photo.active) {
    photo.active = true;
    g.photoActive = true;
    photo.saved = {
      fov: engine.camera.fov, dof: engine.dof.uniforms.uAmount.value,
      fog: engine.scene.fog.density, exposure: engine.renderer.toneMappingExposure,
    };
    clock.pause(true);
    player.frozen = true;
    player.freeCam = true;
    photo.pos.copy(engine.camera.position);
    photo.yaw = player.yaw; photo.pitch = 0.5;
    try { engine.renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); } catch { /* 忽略 */ }
    if (!photo.el) buildPhotoPanel();
    photo.el.style.display = 'block';
    hud.tutorial('照相模式：WASD+鼠标移动镜头，Space/Ctrl 升降，P 退出', 4000);
  } else {
    photo.active = false;
    g.photoActive = false;
    clock.pause(false);
    player.frozen = false;
    player.freeCam = false;
    engine.camera.fov = photo.saved.fov;
    engine.camera.updateProjectionMatrix();
    engine.dof.uniforms.uAmount.value = photo.saved.dof;
    engine.scene.fog.density = photo.saved.fog;
    engine.renderer.toneMappingExposure = photo.saved.exposure;
    document.exitPointerLock?.();
    photo.el.style.display = 'none';
  }
}
function buildPhotoPanel() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;right:16px;top:90px;z-index:120;padding:12px 14px;background:rgba(20,22,32,0.88);border:1px solid #4A5578;border-radius:6px;color:#E8E4DA;font-size:12px;width:210px;display:none';
  const row = (label, id, min, max, step, val) => `
    <div style="margin-bottom:8px"><span style="display:inline-block;width:52px">${label}</span>
    <input type="range" id="photo-${id}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:100px;vertical-align:middle">
    <span id="photo-${id}-v">${val}</span></div>`;
  el.innerHTML = `<div style="color:#FFD98A;margin-bottom:10px;font-weight:bold">照相模式</div>`
    + row('曝光', 'exp', 0.3, 2.2, 0.01, engine.renderer.toneMappingExposure)
    + row('FOV', 'fov', 20, 90, 1, engine.camera.fov)
    + row('景深', 'dof', 0, 2.5, 0.05, engine.dof.uniforms.uAmount.value)
    + row('雾浓度', 'fog', 0, 0.03, 0.0005, engine.scene.fog.density)
    + `<label style="display:block;margin-top:6px"><input type="checkbox" id="photo-hideui" style="vertical-align:-2px"> 隐藏游戏 UI</label>`;
  document.body.appendChild(el);
  el.querySelector('#photo-exp').oninput = (e) => { engine.renderer.toneMappingExposure = +e.target.value; el.querySelector('#photo-exp-v').textContent = e.target.value; };
  el.querySelector('#photo-fov').oninput = (e) => { engine.camera.fov = +e.target.value; engine.camera.updateProjectionMatrix(); el.querySelector('#photo-fov-v').textContent = e.target.value; };
  el.querySelector('#photo-dof').oninput = (e) => { engine.dof.uniforms.uAmount.value = +e.target.value; el.querySelector('#photo-dof-v').textContent = e.target.value; };
  el.querySelector('#photo-fog').oninput = (e) => { engine.scene.fog.density = +e.target.value; el.querySelector('#photo-fog-v').textContent = e.target.value; };
  el.querySelector('#photo-hideui').onchange = (e) => { document.getElementById('ui').style.display = e.target.checked ? 'none' : ''; };
  photo.el = el;
}
function drivePhotoCamera(dt) {
  const runMul = input.down('run') ? 3 : 1;
  const sp = 10 * runMul * dt;
  const cp = Math.cos(photo.pitch);
  const fwd = new THREE.Vector3(-Math.cos(photo.yaw) * cp, Math.sin(photo.pitch), -Math.sin(photo.yaw) * cp);
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x).normalize();
  const flat = new THREE.Vector3(fwd.x, 0, fwd.z).normalize();
  const ax = input.axis();
  photo.pos.addScaledVector(right, ax.x * sp);
  photo.pos.addScaledVector(flat, -ax.z * sp);
  if (input.keys.has('Space')) photo.pos.y += sp;
  if (input.keys.has('ControlLeft') || input.keys.has('KeyC')) photo.pos.y -= sp;
  photo.pos.y = Math.max(0.5, photo.pos.y);
  if (document.pointerLockElement) {
    photo.yaw += input.mouse.mdx * 0.0022;
    photo.pitch = THREE.MathUtils.clamp(photo.pitch - input.mouse.mdy * 0.0022, -1.35, 1.35);
  }
  engine.camera.position.copy(photo.pos);
  engine.camera.lookAt(photo.pos.clone().addScaledVector(fwd, 5));
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' && !game.ui.anyPanelOpen()) togglePhoto();
  else if (e.code === 'KeyP' && photo.active) togglePhoto();
});

let frames = 0, fpsAcc = 0, fps = 60, elapsed = 0, musicTick = 9;
let _footAcc = 0, _footSide = 1;
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  elapsed += dt; frames++;
  fpsAcc += dt; if (fpsAcc >= 0.5) { fps = Math.round(frames / fpsAcc); frames = 0; fpsAcc = 0; }

  clock.update(dt);
  // 冻结看门狗：任何面板/过场/睡觉都不在时强制解冻（防面板异常残留导致的"动不了"）
  if (player.frozen && !game.ui.anyPanelOpen() && !daycycle.sleeping && !cutscene.active && !dialog.isOpen && !title.isOpen && fishing.phase === 'idle') player.frozen = false;
  player.update(dt);
  fpHand.update(dt); // 第一人称手部：可见性/摆动/挥动
  sceneManager.update(dt, elapsed);
  if (sceneManager.currentId === 'farm') {
    farming.updateMouse(engine.camera, input);
    farming.update(dt, elapsed);
  }
  mining.update(dt, elapsed);
  fishing.update(dt);
  achievements.update(dt);
  pets.update(dt);
  animals.update(dt, elapsed);
  npcSystem.update(dt);
  mail.update(); // 信箱未读 ! 标记
  festivals.update(dt);
  foraging.update(dt, elapsed);

  // 工具使用（左键/F）
  if ((input.mouse.clicked || input.hit('use')) && !daycycle.sleeping && !sceneManager.switching) {
    if (fishing.phase !== 'idle') {
      fishing.hook();
    } else if (mining.inMine) {
      const held = heldItem(state);
      const heldType = held ? getItem(held.id).type : null;
      if (heldType === 'weapon') { if (mining.attack() !== false) fpHand.swing(); }
      else if (held?.id === 'pickaxe') {
        const p = player.pos, f = player.facing;
        const tx = Math.floor(p.x + Math.sin(f) * 1.0), tz = Math.floor(p.z + Math.cos(f) * 1.0);
        if (mining.breakNode(tx, tz)) { char.swing(); fpHand.swing(); }
      } else if (held?.id === 'sword' || !held) { if (mining.attack() !== false) fpHand.swing(); }
    } else {
      const held = heldItem(state);
      if (held?.id === 'fishingrod' && fishing.canFish()) {
        if (fishing.startCast()) fpHand.swing(); // 起竿蓄力
      } else if (held?.id === 'axe') {
        const tp = toolTargetPoint();
        const tree = foraging.nearestTree(tp.x, tp.z, 2.4);
        if (tree) { foraging.chopTree(tree); char.swing(); fpHand.swing(); }
        else { effects.floatText(player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), '再走近一点砍', '#B8C0D8', 11); }
      } else if (held?.id === 'scythe') {
        const tp = toolTargetPoint();
        const weed = foraging.nearestWeed(tp.x, tp.z, 2.0);
        if (weed) { foraging.cutWeed(weed); char.swing(); fpHand.swing(); }
        else if (sceneManager.currentId === 'farm') {
          const tg = farming.targetTile();
          if (tg && farming.scythe(tg.x, tg.z)) { char.swing(); fpHand.swing(); }
        }
      } else if (held?.id === 'pickaxe') {
        const tp = toolTargetPoint();
        const rock = foraging.nearestRock(tp.x, tp.z, 2.2);
        if (rock) { foraging.chopRock(rock); char.swing(); fpHand.swing(); }
        else if (sceneManager.currentId === 'farm') {
          const tg = farming.targetTile();
          if (tg) { const used = farming.useHeld(tg); if (used) { char.swing(); fpHand.swing(); hud.refreshToolbar(); } }
        }
      } else if (held && (getItem(held.id).type === 'machine' || getItem(held.id).type === 'bomb' || getItem(held.id).use || held.id === 'chest')) {
        crafting.useSpecial(state.player.toolbarSel) && fpHand.swing();
      } else if (sceneManager.currentId === 'farm') {
        const tg = farming.targetTile();
        if (tg) {
          const used = farming.useHeld(tg);
          if (used) { char.swing(); fpHand.swing(); hud.refreshToolbar(); }
        }
      }
    }
  }
  // 右键吃/喝
  if (input.mouse.rclicked && !daycycle.sleeping) { if (crafting.eat(state.player.toolbarSel)) fpHand.swing(); }
  // E 交互：建筑内部优先 / 场景交互点 / 节日活动 / NPC / 加工机器 / 宠物
  let tip = interiors.active ? interiors.nearestSpot(player.pos.x, player.pos.z) : null;
  if (!tip) tip = sceneManager.nearestInteractable(player.pos.x, player.pos.z);
  const nearNpc = npcSystem.nearestEnt(player.pos.x, player.pos.z);
  if (!tip && festivals.active && nearNpc && nearNpc.def.id === 'robin') tip = { label: `E 参加${festivals.active.def.name}`, action: () => festivals.interact() };
  if (!tip && festivals.active && ['egg_hunt', 'ice_fish'].includes(festivals.active.def.activity.type) && !festivals.active.state.eggs && !festivals.active.state.iceStart) tip = { label: `E 开始${festivals.active.def.name}活动`, action: () => festivals.interact() };
  if (!tip && nearNpc) tip = { label: `E 与${nearNpc.def.name}交谈`, action: () => npcSystem.talk(nearNpc) };
  if (!tip && pets.near()) tip = { label: 'E 摸摸宠物', action: () => pets.pet() };
  if (!tip) {
    const forageItem = foraging.nearestForage(player.pos.x, player.pos.z);
    if (forageItem) tip = { label: `E 拾取${getItem(forageItem.item).name}`, action: () => foraging.pickForage(forageItem) };
  }
  if (!tip) {
    const sp = foraging.specialTip(player.pos.x, player.pos.z);
    if (sp) tip = { label: sp.label, action: () => foraging.collectSpecial(sp.spot) };
  }
  if (!tip && sceneManager.currentId === 'farm') {
    const p = player.pos, f = player.facing;
    const tx = Math.floor(p.x + Math.sin(f) * 1.0), tz = Math.floor(p.z + Math.cos(f) * 1.0);
    if (crafting.machineAt(tx, tz)) tip = { label: 'E 使用机器', action: () => crafting.interactMachine(tx, tz) };
    else if (chests.at(tx, tz)) tip = { label: 'E 打开宝箱', action: () => chests.open(tx, tz) };
  }
  hud.setInteractTip(tip ? tip.label : null);
  if (input.hitKey('Escape')) {
    // Esc 优先关面板/对话；只有没有任何界面占用时才退出房屋
    const swallowed = escUsedByPanel; escUsedByPanel = false;
    if (interiors.active && !swallowed && !game.ui.panelBusy()) interiors.exit();
  }
  if (tip && input.hit('interact') && !daycycle.sleeping) tip.action();
  // 滚轮切快捷栏
  if (input.mouse.wheel) {
    state.player.toolbarSel = (state.player.toolbarSel + (input.mouse.wheel > 0 ? 1 : 9)) % 10;
    hud.refreshToolbar(true);
  }
  if (player.moving) audio.step(sceneManager.groundType(Math.floor(player.pos.x), Math.floor(player.pos.z)) === 'path' ? 'dirt' : 'grass');
  // 冬季雪地脚印（左右交替，矿洞内不留）
  if (clock.season === 3 && player.moving && !mining.inMine) {
    _footAcc = (_footAcc || 0) + player.speed * (player.running ? player.runMul : 1) * dt;
    if (_footAcc > 0.36) {
      _footAcc = 0;
      _footSide = -(_footSide || 1);
      effects.footprint(player.pos.x, player.pos.z, player.facing, _footSide);
    }
  }

  if (!mining.inMine) {
    lighting.playerLight.visible = true;
    lighting.update(clock.minute, player.pos, weatherFx[state.weather.today]);
    sky.update(clock.minute, dt, engine.scene.fog.color, lighting.env.isNight, lighting.sun.position.clone().sub(player.pos), player.pos);
  } else lighting.playerLight.visible = false;
  musicTick += dt;
  if (musicTick > 1.2) {
    musicTick = 0;
    const t = currentTrack();
    if (audio.unlocked) {
      if (t !== bgm.current) { if (t) bgm.play(t); else bgm.stop(); }
      ambience.update({ scene: state.player.scene, minute: clock.minute, season: clock.season, weather: state.weather.today, px: player.pos.x, pz: player.pos.z });
      if (state.weather.today === 'storm' && Math.random() < 0.15) ambience.thunder(0.8 + Math.random() * 0.5);
    }
  }
  effects.update(dt);
  if (photo.active) drivePhotoCamera(dt);
  interiors.update(dt, elapsed);
  weatherFxSys.update(dt, elapsed);
  worldEdge.update(dt, elapsed);
  lightProps.update(dt, elapsed, lighting.env.isNight, player.pos, clock.minute);
  hud.update();
  devtools.update();
  save.update(dt, game);
  engine.render(dt);
  input.endFrame();
  // 触屏：可 Esc 关闭的面板/对话打开时，隐藏控件并垫"点空白关闭"背景层；
  // 主界面/过场/睡觉/在室内不垫背景（否则会挡住标题按钮与过场点击推进）
  const touchPanels = !!(menus.isOpen || craftUI.open || shopPanel.shopId || chests.openKey || dialog.isOpen
    || tvUI.el.style.display !== 'none' || bundleUI.el.style.display !== 'none'
    || mail.el.style.display !== 'none' || hud.centerPanel.style.display !== 'none');
  touch?.setUiBlocked(touchPanels || title.isOpen || cutscene.active, touchPanels);
  if (elapsed > 0.2 && !window.__ready) {
    // 等标题背景视频可播放（或失败/超时兜底）再撤加载条，避免主界面动画白加载
    if (!window.__waitTitle) {
      window.__waitTitle = true;
      const v = title.video;
      const lt = document.getElementById('loadtext');
      if (lt) lt.textContent = '正在加载主视觉…';
      const fin = () => {
        if (window.__ready) return;
        window.__ready = true;
        const lo = document.getElementById('loading');
        if (lo) { lo.style.opacity = '0'; setTimeout(() => lo.remove(), 700); }
      };
      if (!v || !title.bgOk) fin();
      else {
        if (v.readyState >= 4) fin();
        else {
          v.addEventListener('canplaythrough', fin, { once: true });
          v.addEventListener('error', fin, { once: true });
          setTimeout(fin, 8000); // 弱网兜底：8s 后也放行
        }
      }
    }
  }
}
requestAnimationFrame(loop);

// 应用持久化设置
if (state.settings.dof != null) engine.dof.enabled = state.settings.dof;
if (state.settings.uiScale) document.getElementById('ui').style.fontSize = (14 * state.settings.uiScale) + 'px';
if (state.settings.keybinds) Object.assign(input.bindings, state.settings.keybinds);
Object.assign(audio.volumes, {
  master: (state.settings.volumes.master ?? 80) / 100,
  music: (state.settings.volumes.music ?? 80) / 100,
  sfx: (state.settings.volumes.sfx ?? 80) / 100,
});

hud.tutorial('WASD 移动 · 左键/F 使用工具 · E 交互 · 滚轮/数字键切换物品 · Shift 奔跑 · C 制造 · Tab 菜单', 12000);

// 工具目标点：优先鼠标指向地面（6m 内），否则角色面前 1m
const _raycaster = new THREE.Raycaster();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hitPoint = new THREE.Vector3();
function toolTargetPoint() {
  _raycaster.setFromCamera({ x: input.mouse.nx, y: input.mouse.ny }, engine.camera);
  if (_raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
    if (Math.hypot(_hitPoint.x - player.pos.x, _hitPoint.z - player.pos.z) < 6) return { x: _hitPoint.x, z: _hitPoint.z };
  }
  return { x: player.pos.x + Math.sin(player.facing) * 1.1, z: player.pos.z + Math.cos(player.facing) * 1.1 };
}

// 标题界面（QA 脚本经 localStorage 标记跳过）
if (localStorage.getItem('xinglugu_skip_title') !== '1') title.show();

// 调试钩子
game.debug = {
  screenshotReady: () => !!window.__ready,
  skipTitle: () => { localStorage.setItem('xinglugu_skip_title', '1'); if (title.isOpen) title.hide(); },
  setTime: (m) => { clock.minute = m; },
  setSeason: (s) => { clock.season = s; builder.setSeason(s); farming.syncAll(); },
  setWeather: (w) => { state.weather.today = w; bus.emit('weather-change', w); },
  teleport: (scene, floor) => {
    if (scene === 'mine') mining.enter(floor || 1);
    else sceneManager.switchTo(scene);
  },
  give: (id, qty = 1, q = 0) => addItem(state, id, qty, q),
  sleep: () => daycycle.sleep(),
  state: () => state,
  renderStats: () => ({
    fps, calls: engine.renderer.info.render.calls, tris: engine.renderer.info.render.triangles,
    quality: engine.quality, minute: clock.minute,
  }),
};
