# 集成契约（子代理必读）：现有 API 全景与接入规范

> 任何新系统/数据/UI 模块都必须遵守本文档。先看 docs/architecture.md（模块划分）、docs/design/_TEMPLATE.md（设计文档格式）、RESEARCH.md §4（数值）。代码范例参照 src/systems/farming.js（六层反馈链标准实现）。

## 1. 全局对象 `window.game`
```js
game = {
  engine,      // src/core/engine.js：scene/camera/renderer/composer/bloom/dof/present/render(dt)/setQuality/setDofAmount
  input,       // src/core/input.js：down(action)/hit(action)/hitKey(code)/axis()/mouse{nx,ny,clicked,wheel}/endFrame()
  clock,       // src/core/time.js：minute/year/season/day/weekDay/absoluteDay/isNight/darkMinute/fmt()/dateStr()/pause(v)/advanceDay()/snapshot()
  state,       // src/core/state.js：GameState（见 §2）
  save,        // src/core/save.js：save(game,slot)/autoSave/load(slot|'auto')/has/slotInfo/remove
  audio,       // src/audio/engine.js：sfx(name,opts)/tone(opts)/noise(opts)/setVolume(group,0-1)/musicBus/ambBus/sfxBus/ctx(可能为null,用前判空)
  bus,         // src/core/events.js：on/once/emit
  effects,     // src/render/effects.js：burst(Vector3,colors,n,speed,gravity)/floatText(Vector3,text,color,size)/shakeScreen(amp)/update(dt)
  lighting,    // src/render/lighting.js：update(minute,focusVec3,weatherFx)/env{isNight,lightLevel,phase}/sun/hemi
  sky, effects, player, // player=PlayerController：pos/facing/moving/teleport(x,z)/frozen/collide/frozen
  farming, daycycle, ui, // 已有系统
  debug,       // 调试钩子（QA 脚本驱动，见 §7）
}
```

## 2. GameState（src/core/state.js `newGame()`）
- `state.player`：name/farmName/appearance/pet/x/z/scene/energy/maxEnergy/health/maxHealth/money/inventory(36格,{id,qty,quality}|null)/invSize/toolbarSel/tools{hoe..fishingrod:0-4}/skills{5技能:{xp,prof[]}}/luck/stats{...}
- `state.time`、`state.weather{today,tomorrow}`、`state.farm{tiles,objects,greenhouse,buildings,shipping}`、`state.chests`、`state.npcs`、`state.mine`、`state.bundles`、`state.quests`、`state.achievements`、`state.codex`、`state.flags`、`state.mails`、`state.settings`
- 辅助函数（必须复用，禁止重写）：`addItem/removeItem/countItem/hasSpace/heldItem/isTool`、`useEnergy/restoreEnergy/damage/heal/addMoney`、`skillLevel/addXP/skillLevel`、`XP_TABLE`、`SAVE_VERSION`

## 3. 物品与数据
- 所有物品必须在 `src/data/items.js` 注册（reg 或 CROPS 表），已有：工具7、种子/作物×32、肥料×9、洒水器×3、稻草人×2、资源×8、食物×2、礼物×2、图腾×1
- 新数据文件（fish/monsters/ores/recipes/cooking/npcs/festivals/bundles/shops/achievements/forage）放 src/data/，纯数据无逻辑；新物品 id 先加进 items.js 的对应段落再使用
- 图标：`src/ui/icons.js itemIcon(id,quality)` → dataURL（全物品自动可用；新类型在 drawers 加绘制器）
- 售价：`sellPrice(id,quality)`；品质：`QUALITY_MUL/QUALITY_NAMES`

## 4. 系统编写规范（src/systems/xxx.js）
```js
export class XxxSystem {
  constructor(game) { this.game = game; /* 监听 bus 事件；建 THREE.Group 挂 engine.scene */ }
  update(dt, elapsed) {}        // 每帧（主循环统一调用）
  serialize() { /* 写入自己负责的 state 字段 */ }
  deserialize() {}
}
```
- 时钟事件：`minute/hour/day-start/day-end/season-start/weather-change/overtime`
- 玩法事件（已存在，按需触发/监听）：`item-gained/crop-harvested/xp-float/skill-levelup-pending/energy-changed/health-changed/money-changed`
- **六层反馈链强制**：每个玩家动作 = 起手(swing/frozen) + effects.burst/材质变化 + audio.sfx + UI(floatText/面板) + 数值(体力/XP/金钱) + 氛围(shakeScreen/光)。参照 farming.till()。
- 场景暂停规范：菜单/对话打开时 `clock.pause(true)` + `player.frozen=true`；关闭时恢复（见 ui/menus.js 的 openPanel 模式）。

## 5. UI 规范（src/ui/）
- DOM 覆盖层，挂 `#ui`；面板样式常量：`PANEL` 串（见 hud.js）
- 弹窗模式：display 切换 + Esc 关闭；禁止 alert/confirm
- 图标 itemIcon；浮动文字 effects.floatText（世界坐标）；提示条 game.ui.tutorial(html,ms)
- 结算/确认面板参照 hud.showSettlement 的 Promise 模式

## 6. 渲染/场景规范
- 精灵角色：`src/render/spritechar.js makeSpriteChar({skin,hair,shirt,pants})` → {group,update(dt,moving,running,facing),faceCamera(camera),swing(),frames}；NPC/动物同构复用（改调色板/体型）
- 道具建造：`src/world/proto.js` 的 makeTree/makeHouse/makeLamp/makeFence/makeGrassTuft/makeRock 模式（平滑低模+flatShading，禁止盒子堆砌风）
- 贴图：`src/render/textures.js` PAL/makeTexture/shade/mkCanvas
- 画质：点光源 ≤8；新系统注册光源走 game.lighting（后续点光池）——当前先用 emissive+bloom

## 7. 调试与 QA
- 启动：`npm run dev`（5173）；QA 脚本在 qa/，用 puppeteer 驱动 window.game.debug
- debug 现有：screenshotReady/setTime/setSeason/setWeather/give/sleep/state/renderStats；新系统按需扩展 debug（如 teleport(scene)）
- 每个系统交付前必须：① dev 服务器下零 console 报错 ② 写一个 qa/xxx.mjs 冒烟脚本验证核心路径并跑通
- 设计文档：按 docs/design/_TEMPLATE.md 写 docs/design/<系统>.md（功能树≥4层/对照表/边界/三连问/≥3来源URL，来源从 docs/research/sdv-*.md 文末取）

## 8. 禁止事项
- 禁止 TODO/FIXME/placeholder 字样与任何占位功能；按钮必须有响应
- 禁止改写已有系统的对外 API（state.js/items.js/engine.js/hud.js/farming.js/daycycle.js）；确需扩展时在原文件追加而非改签名
- 禁止引入新 npm 依赖（除已装 three/vite/n8ao/puppeteer）
- 禁止 Minecraft 式盒子堆砌美术（用户已明确否定）；美术一律"平滑低模+手绘纹理+管线像素化"
