# 设计文档：渲染与氛围系统（光照/天空/后处理/天气视觉/季节视觉）

> 依据：docs/research/visual-audio.md（终稿）。对照组：Minecraft BSL/Complementary 光影、《Octopath Traveler》HD-2D。

## 0. 系统概述
负责全部视觉表现：昼夜光照曲线、天空/星轨/流星、后处理（AO/Bloom/vignette/移轴）、天气粒子与地表联动、季节视觉签名、点光源池、体积光。接口：监听 `minute/day-start/season-start/weather-change/scene-change`；读 `state.settings.quality`；向 gameplay 暴露 `env.lightLevel`（影响作物以外的纯表现逻辑，如窗户亮灯）。

## 1. 功能树
```
L1 渲染与氛围
├─ L2 昼夜光照
│  ├─ L3 太阳/月亮平行光绕转 [视觉][氛围]
│  │  ├─ L4 太阳方位角 = f(minute)：6:00 东起、12:00 天顶偏南、18:00 西落；18:30–次日5:30 切换为月光（方位镜像），过渡区 30 分钟内光色/强度 lerp，无跳变
│  │  ├─ L4 色温曲线：关键帧 (360,#FFB46B,1.5)(720,#FFF4EC,3.0)(1020,#FFF1E0,2.4)(1110,#FF8A3C,1.8)(1200,#8FA3D9,0.16)，catmull-rom 插值
│  │  └─ L4 阴影：PCFSoft 2048，shadow camera 以玩家为中心 60×60m 跟随，texel 对齐防抖动
│  ├─ L3 半球环境光 [视觉]
│  │  └─ L4 白天 sky #BFD9E8/ground #8A7A5F 强度 0.9；夜 sky #1E2A4A/ground #141820 强度 0.18；黄昏 10 分钟 lerp
│  └─ L3 曝光与氛围联动 [氛围]
│     └─ L4 toneMappingExposure 白天 1.1/夜 0.9 随曲线；雨天 ×0.95
├─ L2 天空
│  ├─ L3 程序化渐变穹顶 [视觉]
│  │  └─ L4 大球背面 shader：top/horizon 双色渐变，颜色关键帧同光照曲线；地平线色=雾色（防穿帮）
│  ├─ L3 太阳/月亮盘 [视觉][氛围]
│  │  └─ L4 太阳盘 HDR 亮度 2.5（触发 bloom）、月亮盘 1.2 带相位；低于地平线淡出
│  ├─ L3 星空与银河 [视觉][氛围]
│  │  └─ L4 2000 颗 Points 星（大小/色温随机）20:00–4:00 淡入；银河带 = 5000 微点沿银经分布；星星随地球自转绕转（星轨）
│  └─ L3 流星偶发 [氛围]
│     └─ L4 晴夜每 45–120s 一颗：拖尾粒子 + 细微"咻"声，2s 生命周期
├─ L2 后处理
│  ├─ L3 N8AO 接触阴影 [视觉]
│  │  └─ L4 aoRadius 0.75、intensity 3.0、falloff 1.0；quality=low 时整 pass 移除
│  ├─ L3 Bloom [视觉][氛围]
│  │  └─ L4 UnrealBloomPass：threshold/strength 按 §参数表昼夜曲线；灯/火/萤火虫/水面高光材质 emissive>1 触发
│  ├─ L3 收尾 pass [视觉]
│  │  └─ L4 单 ShaderPass 合并：vignette(smoothstep(0.55,1.45,uvDist)×0.32) + film grain(强度0.03) + 季节色相微调
│  └─ L3 移轴景深 [氛围]
│     └─ L4 对话/过场启用：焦平面=玩家高度，上下半屏各一次半分辨率高斯，0.3s 淡入出；quality=low 禁用
├─ L2 天气视觉
│  ├─ L3 雨 [视觉][听觉][氛围]
│  │  ├─ L4 雨滴：1200 段 LineSegments 圆柱域跟随相机，速度 18m/s，斜率随风
│  │  ├─ L4 地面涟漪：水面/地面 8 个涟漪 quad 池循环扩散（法线扰动贴图动画）
│  │  └─ L4 湿润：地面材质 roughness 0.9→0.55、颜色 ×0.8，雨后 10 分钟恢复
│  ├─ L3 暴雨 [视觉][听觉][氛围]
│  │  └─ L4 雨量 ×1.8 + 闪电：天空闪白 80ms×(2~3 次) + 平行光瞬时 ×3 + 0.8–3s 后雷声（距離感延迟）
│  ├─ L3 雪 [视觉]
│  │  └─ L4 800 片 Points 雪花螺旋下落，着地 0.5s 消融；冬季雨自动转雪
│  ├─ L3 大风 [视觉][听觉]
│  │  └─ L4 花瓣(春)/落叶(秋) 200 粒子沿风场飘；树/作物摆动幅度 ×2.5；风声增益 +6dB
│  └─ L3 雾联动 [视觉]
│     └─ L4 FogExp2 density 基准值×天气系数(雨2.2/雪1.6/多云1.2)，颜色 10s lerp
├─ L2 季节视觉签名
│  ├─ L3 四季材质切换 [视觉]
│  │  └─ L4 换季时草/树/农田贴图 atlas 行偏移切换 + 主色 lerp 30s；骨架色(木/石/屋顶)不变
│  ├─ L3 季节粒子 [视觉]
│  │  └─ L4 春花瓣(常驻 60 粒)/夏光斑(林间 god rays 增强)/秋落叶(常驻 80 粒)/冬呵气(角色每 4s 一团白雾粒子)
│  └─ L3 冬季积雪 [视觉]
│     └─ L4 地面/屋顶贴图换雪白顶版；水面结冰贴图；首场雪触发"初雪"提示
├─ L2 点光源池
│  ├─ L3 光源注册与调度 [视觉]
│  │  └─ L4 全局光源注册表（路灯/窗光/篝火/蜡烛/熔炉/萤火虫）；每帧按"距玩家<40m 且重要度"取前 8 激活为 PointLight，其余退化为 emissive+bloom
│  ├─ L3 路灯黄昏自动亮 [视觉][氛围]
│  │  └─ L4 17:45–18:15 逐盏随机亮（间隔 0.5–2s），亮时暖光 #FFB46B 强度 1.2 半径 8m + 灯罩 emissive 2.0；6:00 熄灭
│  ├─ L3 窗户渐次亮灯 [视觉][氛围]
│  │  └─ L4 黄昏每栋建筑窗户贴图 emissive 随机次序亮起（±10 分钟抖动）；NPC 在家才亮（联动日程）
│  └─ L3 萤火虫（夏夜）[视觉][氛围]
│     └─ L4 夏 20:00–24:00 草丛/水边 40 只：正弦漂浮 + 亮度呼吸 0.3–1.6Hz，emissive 2.2 触发 bloom
└─ L2 体积光
   ├─ L3 清晨林间光柱 [视觉][氛围]
   │  └─ L4 6:00–9:00 晴，树冠下生成 ≤12 个 billboard 光柱（圆柱billboard+顶部沿光向拉伸+深度淡出），alpha≈0.10，加法混合
   └─ L3 矿井光束 [视觉][氛围]
      └─ L4 矿井每层 2–4 束从顶部落下，尘埃粒子在柱内漂浮；熔岩带改为上升热光晕
```

## 2. 对照组对标表
对照组：Minecraft Complementary Reimagined 光影 + Octopath Traveler HD-2D
| 对照组行为 | 本作是否实现 | 实现方式/理由 |
|---|---|---|
| 昼夜平行光色温连续变化 | ✅ | 关键帧 catmull-rom 曲线（§1 功能树） |
| 阴影区不死黑（25–40%） | ✅ | 半球光+AO 调校，QA 截图核验 |
| 高阈值 bloom 只溢高光 | ✅ | threshold 0.8–1.0 昼夜曲线 |
| 夜蓝调+暖点光对比 | ✅ | 月光 #8FA3D9 × 路灯 #FFB46B |
| god rays 林间光柱 | ✅ | billboard 近似（对照组为屏空间径向模糊，本作俯视视角下 billboard 观感更稳且省性能） |
| 移轴浅景深 diorama 感 | ✅ | 简化移轴（对话/过场）；常开全屏 DoF 不做——俯视角全程清晰更利于操作，理由成立 |
| 雨天雾密度上升/画面朦胧 | ✅ | FogExp2 系数 2.2 + 湿润材质 |
| 体积尘埃/光柱内微粒 | ✅ | 矿井光束尘埃粒子 |
| 水面反射天空/月光 | ✅ | envMap+ fresnel（不做 SSR：体素水面镜面反射性价比低，bloom 高光替代） |
| film grain + vignette 收尾 | ✅ | 合并收尾 pass |

## 3. 数值表
全部光效数值：见 RESEARCH.md §1.3 量化参数总表（来源：visual-audio.md 调研，BSL/Complementary 官方参数未公开，数值为工程建议区间，QA 截图时实测微调并记录）。

## 4. 边界与异常清单
- 低端机：quality=low → 关 AO/移轴、bloom 半分辨率、阴影 1024、粒子减半（设置页三档，已实现分级）。
- WebGL context lost：监听 `webglcontextlost`，暂停循环并显示"点击恢复"遮罩，恢复后重建管线。
- QA 无头环境（swiftshader）：自动检测渲染器名含 SwiftShader 时 quality 强制 low，保证截图脚本稳定。
- 极夜穿帮：夜晚 hemisphere 0.18 保底 + 曝光 0.9，禁止纯黑（QA 核验无 #000 区域）。
- 雾/天空地平线色不匹配：天空地平线色每帧同步雾色。
- 点光源超限：池化 8 盏，争抢时按距离+重要度排序，远处退化为 emissive，无闪烁（滞回阈值 2m）。
- 天气切换跳变：所有天气参数 10s lerp；季节切换 30s lerp。
- 2:00 昏倒演出：画面渐暗滤镜与晕厥 UI 叠加，光照曲线不被打断。

## 5. 接口契约
- 监听：`minute`（曲线推进）、`weather-change`、`season-start`、`scene-change`、`quality-change`
- 发出：无 gameplay 事件（纯表现）；暴露 `render.env = { lightLevel, isNight, weather }`
- state：`state.settings.quality/volume`；不持有玩法状态
- 依赖：render/textures.js（季节 atlas）、world 场景注册光源点

## 6. 完工三连问
1. 对照组还有什么行为我没有？——屏空间径向 god rays 与 SSR 未做，已在对标表给出成立理由（视角与性价比）；其余行为维度齐。
2. 六层反馈链核验：本系统多为被动氛围，主动交互为"切换天气/昼夜过渡"——[视觉]粒子与材质变化✅ [听觉]风雨雷✅ [氛围]光照雾色联动✅；操作/UI/数值层不适用（无玩家直接操作）。
3. 边界清单每条：低端分级/context lost/swiftshader/极夜/雾天匹配/光源池/跳变/昏倒演出——全部有实现方案，QA 阶段逐项核验。

## 7. 来源
1. https://capttatsu.com/bslshaders/
2. https://complementaryshaders.com/complementary-unbound-vs-reimagined-shaders/
3. https://www.cyanilux.com/tutorials/god-rays-shader-breakdown/
4. https://github.com/OTFCG/Awesome-Game-Analysis
5. https://blog.voxagon.se/
6. https://80.lv/articles/how-dorfromantik-expands-its-cozy-world-through-minimalist-design
7. https://github.com/N8python/n8ao
