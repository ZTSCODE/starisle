# 《星屿物语》工程架构约定（所有开发者/子代理必须遵守）

## 技术栈
- Three.js（npm 依赖，`import * as THREE from 'three'`）+ Vite + 原生 ES Modules（纯 JS，不用 TS）
- 渲染：单 WebGLRenderer + EffectComposer（RenderPass → UnrealBloomPass → 自定义氛围 ShaderPass[vignette/调色]）
- UI：DOM/CSS 覆盖层（`#ui`），不用 canvas 内绘 UI
- 音频：WebAudio 程序化合成（无外部音频文件）
- 存档：localStorage，3 存档位 + 自动存档

## 目录结构
```
src/
  main.js            # 入口：初始化引擎、场景管理、主循环
  core/              # 引擎层（与玩法无关）
    engine.js        # renderer/composer/resize/渲染循环
    input.js         # 键鼠状态、动作映射（含键位可配）
    events.js        # EventBus（on/off/emit）
    time.js          # GameClock：分钟推进、日期/季节/年、2:00昏倒
    save.js          # 存档序列化/读档/删档/3槽位
    rng.js           # 种子随机（每日运气等可复现）
  render/            # 表现层
    textures.js      # 程序化 16×16 像素贴图 + 图集（NearestFilter）
    chunk.js         # 地形瓦片合并几何体（统一 texel density：1 tile = 16px）
    lighting.js      # 太阳/月亮/半球光/点光源池/昼夜曲线
    sky.js           # 程序化天空穹顶/星轨/流星
    weather.js       # 雨/雪/风/花瓣落叶粒子、闪电、地面湿润
    post.js          # Bloom/SSAO/雾/vignette/ACES
    voxchar.js       # （已废弃，由 spritechar 取代）
    spritechar.js    # 像素 sprite 角色工厂（4向帧/procedural）+ 玩家控制器
    effects.js       # 粒子池、浮动文字、屏幕震动、光柱
  world/             # 场景与地图
    scenes.js        # 场景管理器（farm/town/beach/mine/interior 切换）
    maps.js          # 室外地图数据与生成
    farm.js town.js beach.js mine.js interior.js
  systems/           # 玩法系统（每个导出 class，含 update(dt)/serialize()/deserialize()）
    farming.js animals.js mining.js combat.js fishing.js foraging.js
    crafting.js cooking.js skills.js npc.js shops.js festivals.js
    bundles.js quests.js achievements.js tv.js shipping.js pets.js
  ui/                # hud.js inventory.js menus.js dialog.js shopui.js mapui.js
  data/              # 纯数据（无逻辑）：items.js crops.js fish.js recipes.js
                     # cooking.js npcs.js festivals.js bundles.js monsters.js
                     # ores.js forage.js achievements.js shops.js
docs/design/         # 每系统功能树设计文档（规范1/2/3/4/7）
docs/research/       # 调研原始资料
```

## 核心约定
1. **统一 Game 对象**：`window.game` 挂载 { engine, clock, state, scenes, systems, ui, audio, bus }；系统间只通过 bus 事件 + state 通信，禁止交叉 import 系统模块。
2. **GameState**：单一可序列化对象（`state.player`, `state.farm`, `state.npcs`, `state.mine`…）；每个系统 serialize()/deserialize() 只读写自己的字段；存档版本号 `SAVE_VERSION`。
3. **时间**：`clock.minute` 360–1560（6:00–26:00），默认 0.9 现实秒 = 10 游戏分钟；`bus.emit('day-start'|'day-end'|'season-start'|'minute', …)`。
4. **物品**：全部物品在 `data/items.js` 注册 `{ id, name, type, price, stack, ... }`；其他数据文件只引用 id。
5. **渲染管线**：低分辨率渲染（480×270 级，含全部后处理）+ 最近邻放大呈现 = 统一像素颗粒（HD-2D 方案，非体素格子）；1 tile = 1m 仅作逻辑网格；室外每个场景是独立 Group，切换时整体挂载/卸载。
6. **反馈链**：每个玩家动作必须过 `effects.js` 的六层（操作/视觉/听觉/UI/数值/氛围）；SFX 一律走 `audio.sfx(name, variant)`。
7. **画质分级**：`state.settings.quality` high/medium/low 控制阴影分辨率、SSAO 开关、粒子数。
8. **调试钩子**：`window.game.debug = { setTime, setSeason, setWeather, give, teleport, screenshotReady }`，供 QA 脚本驱动。

## 性能
- 地形/植被静态合并几何体；粒子用 Points + 对象池；点光源池 ≤ 8 盏同时激活（按距离玩家排序复用）
- 目标：1080p / 中端核显 ≥ 60 FPS（quality 可降）
