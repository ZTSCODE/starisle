# 视觉 / 音频标杆调研 —— Three.js 3D 像素风农场模拟

> 调研日期：2026-07。目标：为"体素/低多边形 + 像素贴图"的 Three.js 农场模拟游戏确立画面与音频标杆，并给出可落地、可验收的参数。
> 场景尺度约定：1 单位 = 1 米，农场可视范围约 100–200 m。

---

## 1. Minecraft 光影包（BSL / SEUS / Complementary）光照特征拆解

三款包的光照骨架一致（Complementary 即基于 BSL 衍生）：**日光/月光平行光 + 天空环境光 + 局部点光（火把）+ 屏幕空间后处理**。差别只在调色倾向：BSL 偏高饱和"浪漫电影感"，SEUS 偏写实（PTGI 为路径追踪），Complementary 偏克制、 gameplay 友好。

### 1.1 平行光（太阳 / 月亮）色温与强度（可量化参考）

| 时段 | 色温参考 | 建议光色 (hex) | Three.js DirectionalLight 强度* |
|---|---|---|---|
| 日出/日落（低角度） | 2000–3000 K | `#FF8A3C` → `#FFB46B` | 1.2–2.0 |
| 上午/下午 | 4500–5500 K | `#FFE3C1` → `#FFF1E0` | 2.0–2.6 |
| 正午 | 5500–6500 K | `#FFF4EC`（近白微暖） | 2.6–3.2 |
| 夜晚（月光） | 7000–9000 K（艺术化偏蓝） | `#7B93C9` → `#A8BFFF` | 0.10–0.25 |

\* 强度基于 `renderer.useLegacyLights = false`（物理光照单位）+ ACES 色调映射 + exposure≈1.0 的经验区间。BSL/Complementary 的夜景特点是**月光刻意偏蓝且弱**（约为日光的 1/10 量级），靠 bloom 和点光撑氛围。

### 1.2 环境光

- 天空环境光用 `HemisphereLight`：白天 sky `#BFD9E8` / ground `#8A7A5F`，强度 0.6–1.0；夜晚 sky `#1E2A4A` / ground `#141820`，强度 0.15–0.3。
- BSL 系特征：阴影区不死黑，阴影亮度约为受光面的 25–40%（由环境光+SSAO 共同决定）。

### 1.3 God rays（体积光）实现思路

MC 光影用的是**屏空间径向模糊**（把太阳/遮挡关系渲染到离屏 buffer，向太阳位置做 radial blur，再叠加回画面），只有望向太阳时有效。低成本替代（推荐本作采用）是 **billboard 近似**（[cyanilux 拆解](https://www.cyanilux.com/tutorials/god-rays-shader-breakdown/)）：
- 竖直 quad，顶点着色器做圆柱形 billboard（锁 Y 轴），顶部顶点沿光照方向拉伸；
- 片元用场景深度差做"插入地面淡出"、用相机距离做近处淡出；
- UV 横轴 smoothstep 做两侧羽化；可加噪声条纹与尘埃闪烁（亮度 >1 交给 bloom 发光）；
- Alpha 加法/普通透明混合均可，强度建议 5–15%（cyanilux 示例 alpha≈10/255）。

### 1.4 Bloom / SSAO / 水体 / 雾参数风格

| 效果 | BSL/Complementary 观感 | Three.js 建议值 |
|---|---|---|
| Bloom | 只让"高亮部"（太阳、火把、水面高光、发光方块）溢出，画面整体不糊 | threshold **0.8–1.0**（HDR 亮度），strength 白天 **0.3–0.5**、夜晚 **0.6–0.9**，radius **0.4–0.8** |
| SSAO | 方块接触处柔和暗角，半径小、强度克制 | N8AO：aoRadius **0.5–1.0 m**，intensity **2.0–4.0**，falloff 1.0 |
| 水体 | 菲涅尔反射天空 + SSR 反射场景 + 折射扰动；夜晚反射月光 | 本作简化：`MeshStandardMaterial` + envMap（天空 cubemap）+ fresnel 自定义 shader；不做真 SSR |
| 雾 | 远距离空气透视，白天淡蓝、黄昏暖橙、夜深蓝；密度随天气/时段调制 | `FogExp2`：白天 density **0.008–0.012**，雨 **0.02–0.03**，夜 **0.015**；雾色见 §6 参数表 |

参考来源：[BSL 官网](https://capttatsu.com/bslshaders/)、[Complementary Unbound vs Reimagined](https://complementaryshaders.com/complementary-unbound-vs-reimagined-shaders/)（Reimagined 分支更贴原版气质、性能更轻——本作对标它而非写实向 Unbound）。

---

## 2. 《Octopath Traveler》HD-2D 光效拆解

HD-2D = **SNES 时代像素贴图/精灵 + UE4 现代 3D 光照与后处理**，呈现"掌中微缩模型（diorama）"观感。技术资料：Digital Foundry 技术分析、Unreal Fest Europe 2019 官方讲座（索引见 [Awesome Game Analysis](https://github.com/OTFCG/Awesome-Game-Analysis)），续作延续 UE4 + HD-2D（[报道](https://foro3d.com/en/2026/january/octopath-traveler-0-confirms-its-use-of-unreal-engine-4-and-the-hd-2d-style.html)）。

关键手法（对本作可迁移的部分）：

1. **像素素材不做逐像素光照，而做"面级"光照**：贴图保持 16×16 像素颗粒，但材质走完整 PBR 管线（法线/粗糙度），平行光让体素面产生真实明暗梯度——像素感来自贴图，立体感来自光照，两者正交。
2. **强 bloom 是"梦幻感"核心**：高阈值 + 中等强度，水面高光、灯火、魔法全部溢光；配合 HDR 管线亮度 >1 的自发光。
3. **浅景深 / 移轴（tilt-shift）**：俯视角 + 焦外 bokeh 模糊，是把 3D 场景拍成"微缩模型"的最关键一步。本作俯视角农场可直接复用：焦点锁定玩家/选中地块，前景与远景各自渐糊。
4. **体积光点缀**：树林、窗边定点摆放 god rays，非全屏效果，用于引导视线（宝箱、出口）。
5. **色调映射 + 收尾滤镜**：Filmic 色调映射压高光；画面叠加 vignette + 轻 film grain，统一像素质感并掩盖低分辨率贴图的平铺感。

**结论**：本作把"体素 + 像素贴图"当 Octopath 的 2D 精灵对待——贴图负责风格，3D 光照与后处理（bloom/DoF/体积光/ACES/vignette）负责质感。

---

## 3. 体素/低模 + 像素贴图独立游戏的调色板与 texel density

- **Teardown**：[体素材质用 8-bit 调色板，单个 voxel volume 最多 255 种材质](https://blog.voxagon.se/)——有限调色板保证全场景色彩统一，且便于做破坏后的材质映射。做法：先定全局材质/调色板，再建模，而不是边建边取色。
- **Dorfromantik**：团队[明确定义"手工策划调色板 + 模块化资产"而非纯随机生成](https://80.lv/articles/how-dorfromantik-expands-its-cozy-world-through-minimalist-design)：每类地块（森林/麦田/村落/河流）有独立但互洽的低饱和暖色系，靠**统一饱和度区间**而非统一色相获得整体感。其夜间模式直接把白昼调色板整体映射到蓝调（低成本昼夜方案，值得借鉴）。
- **texel density 工程做法**（[Beyond Extent 深潜](https://www.beyondextent.com/deep-dives/deepdive-texeldensity)、[RebusFarm 基础](https://rebusfarm.net/blog/texel-density-basics-every-artist-should-know)）：统一"每米像素数"是所有像素风 3D 的共同纪律——Minecraft 即 16 px/m（每方块面 16×16）。

**本作方案（texel density 统一规格）**：

| 项 | 规格 |
|---|---|
| 基准密度 | **16 px/m**（与 Minecraft 一致，像素颗粒感最强）；细节道具（作物、工具、角色）可用 **32 px/m**，但同屏同类物件必须同密度 |
| 贴图尺寸 | 地面/墙面块：**16×16**；作物与道具：**16×16 或 32×32**；禁止非标尺寸 |
| 图集 | 全部小块贴图打包进 texture atlas（如 256×256 容纳 16×16 块 ×256），一次 draw call |
| 采样 | `NearestFilter`（magFilter），mipmap + `LinearMipmapLinearFilter`（minFilter）防远景闪烁；各向异性 2–4 |
| UV 纪律 | 1 m² 面 = 一张 16×16 贴图；拉伸面必须按米数重复 UV，不允许单面拉伸整张贴图 |
| 调色板 | 全局主调色板 ≤ 64 色（参考 Teardown 8-bit 思路），四季在骨架色上做色相偏移（见 §7） |

---

## 4. Three.js 技术路线结论

| 效果 | 选型 | 要点与性能注意 |
|---|---|---|
| 渲染管线 | `EffectComposer` + `RenderPass` | 全屏 pass 数量控制在 **4–6 个以内**；`renderer.setPixelRatio` 上限 1.5–2 |
| Bloom | `UnrealBloomPass` | 全屏多 mip 模糊，是后处理里最贵之一；低端机可降 composer 分辨率或换选择性 bloom。threshold 0.8+ 避免整体泛白 |
| AO | **N8AO**（[github/N8python/n8ao](https://github.com/N8python/n8ao)）优于内置 SSAOPass：时域更稳、参数更直观、性能更好（[three.js 官方论坛讨论](https://discourse.threejs.org/t/new-ambient-occlusion-example-hbao-vs-n8ao/58847)）；也可评估 `postprocessing` 库的合并 uber-shader 管线省 pass |
| 雾 | `scene.fog = FogExp2(color, density)`，随昼夜/天气脚本插值 | 成本几乎为零；务必让天空 shader 与雾色匹配，否则地平线穿帮 |
| 天空 | `three/examples` 的 `Sky`（Preetham 大气散射）或渐变 dome shader | 太阳位置与 DirectionalLight 同步；黄昏用 turbidity/elevation 调暖 |
| 体积光 | billboard quad 近似（§1.3），加法混合 | 不要 raymarching；每束光一个 quad，50 个以内，instancing 合并 |
| 色调映射 | `renderer.toneMapping = ACESFilmicToneMapping`，exposure 白天 1.0–1.2、夜晚 0.8–1.0 | ACES 会压饱和度，调色板需比目标观感略饱和一点补偿 |
| Vignette | 自定义 `ShaderPass`（`smoothstep(0.5, 1.5, dist)` 乘暗角 0.25–0.4） | 可与 grain、色调微调合并成一个收尾 pass |
| 景深 | 后期 `BokehPass` 或简化：按深度对远/近景各做一次半分辨率模糊合成 | BokehPass 较贵；俯视角游戏建议"固定焦平面 + 两段模糊"的移轴简化版 |
| 光照 | 1 盏 DirectionalLight（昼夜旋转/变色温）+ 1 盏 HemisphereLight + 少量 PointLight（灯火，夜晚才开） | 阴影：`PCFSoftShadowMap`，shadow map 2048，shadow camera 紧跟玩家视野裁剪；点光 ≤ 8 盏 |

性能总原则（参照 [Codrops three.js 优化综述](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)、[100 three.js tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips)）：draw call 用 instancing/atlas 压到三位数以内；后处理全屏 pass 是最大 GPU 开销，按"低档机关 DoF/降 bloom 分辨率/关 AO"做分级画质。

---

## 5. 农场模拟音频设计参考

### 5.1 《Stardew Valley》音乐结构（[官方 wiki Soundtrack](https://stardewvalleywiki.com/Soundtrack)）

- **季节曲轮换**：每季 3 首户外曲（春：It's A Big World Outside / The Valley Comes Alive / Wild Horseradish Jam；夏、秋、冬同理），**每天随机选一首，播完不循环**——静默与音乐交替是"农场感"的关键，不是持续 BGM。
- **触发条件矩阵**：曲目按【季节 × 天气（晴/风/雨）× 时段（正午前）× 地点】触发；**雨天户外不放音乐，只剩环境声**；镇上有独立城镇曲（春夏秋共用一首 Pelican Town）。
- **地点分层**：矿井按层段换曲且随深度变阴暗；节日、角色剧情各有专属曲。OST 全曲 1–4 分钟，配器以钢琴/班卓琴/合成垫为主，冬季转向冰冷合成器（Nocturne of Ice）。
- **可迁移规则**：本作 BGM 结构 = 4 季 × 2–3 首轮换 + 雨天静音 + 城镇/室内主题 + 昼夜两套环境声床。

### 5.2 环境音层（ambience bed）惯例

| 层 | 内容 | 触发 |
|---|---|---|
| 清晨/白天 | 鸟鸣（春季最密）、风穿过树叶 | 晴天白天 |
| 夏季正午 | 蝉鸣循环 | 夏、晴 |
| 夜晚 | 蟋蟀/夜虫、猫头鹰点缀 | 20:00 后 |
| 雨天 | 雨点循环（密/疏两档）+ 远雷 | 雨/暴雨 |
| 冬季 | 空旷风声、踩雪声 | 冬 |
| 交互点缀 | 风声随玩家移动轻微起伏 | 持续低音量 |

### 5.3 SFX 清单惯例（农场模拟必备）

耕作（锄地、播种、浇水、收割）、工具挥动、脚步（草/土/木/雪分材质）、拾取/入包、UI（悬停/确认/取消/开背包）、门/建筑、动物叫声（近景随机）、钱币/出售、作物生长完成提示、昼夜转换提示音、天气雷暴。要点：同动作准备 3–4 个随机变体防重复疲劳，高频 SFX（浇水、脚步）压低中频避免盖音乐。

### 5.4 WebAudio 程序化 chiptune 的可行做法

可行且轻量（零音频资源体积）：

- **BGM**：`OscillatorNode` 走 NES 声部配置——2×square（主旋律+和声，duty 可调）、1×triangle（bass）、1×噪声 buffer（鼓点 hats/kick）。step sequencer 按 16 分音符调度（`AudioContext.currentTime` 精确排程，避免 setTimeout 抖动）；ADSR 用 `GainNode` 包络。参考：[Procedural Music with Web Audio](https://www.mysimulator.uk/content/tutorials/procedural-music.html)、[Web Audio 振荡器教程](https://dev.to/rayalva407/creating-an-oscillator-with-the-web-audio-api-5b8m)、[Fireship Web Audio 入门](https://fireship.dev/web-audio-api)。也可用 Tone.js 省掉调度器轮子。
- **SFX**：噪声 buffer + `BiquadFilter`（浇水=高通噪声扫频，锄地=低通噪声短爆发 + 低频 thump），拾取=方波双音 arpeggio；`playbackRate` 随机 ±10% 即得变体（[Web Audio API 书 §pitch](https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch04.html)）。
- **环境声**：循环噪声 + 滤波做风/雨底床，鸟鸣用正弦滑音 chirp 随机排程。
- 整体经由 `DynamicsCompressorNode` 收总线，防 clipping；音乐/环境/SFX 三总线独立音量。

---

## 6. 昼夜量化参数总表（建议默认值）

| 参数 | 清晨 6–8 | 正午 11–14 | 黄昏 17–19 | 夜晚 20–5 |
|---|---|---|---|---|
| 平行光色温 | 2500–3500 K | 5500–6500 K | 2000–2800 K | 8000 K（偏蓝） |
| 平行光颜色 | `#FFB46B` | `#FFF4EC` | `#FF8A3C` | `#8FA3D9` |
| 平行光强度 | 1.2–1.8 | 2.6–3.2 | 1.5–2.0 | 0.12–0.2 |
| HemisphereLight 强度 | 0.5 | 0.9–1.0 | 0.5 | 0.18 |
| Bloom threshold | 0.9 | 0.95–1.0 | 0.85 | 0.8 |
| Bloom strength | 0.4 | 0.3 | 0.5 | 0.7 |
| 雾色 | `#E8C9A8` | `#CFE4F0` | `#F0A868` | `#141B2E` |
| 雾密度 (FogExp2) | 0.012 | 0.008 | 0.011 | 0.016 |
| 曝光 | 1.0 | 1.1 | 1.0 | 0.9 |
| 环境声床 | 鸟鸣 | 蝉(夏)/风 | 风+虫渐起 | 蟋蟀/夜虫 |

雨天修正：雾密度 ×2.2（0.02–0.03），雾色转灰蓝 `#9AA7B0`，平行光强度 ×0.4，bloom strength +0.1，BGM 静音只留雨声。

## 7. 四季调色板方向（hex）

| 季 | 主色（植被） | 辅色 | 点缀 | 天空/氛围 | 土壤 |
|---|---|---|---|---|---|
| 春 | `#7EC850` 新绿 | `#A8E063` 嫩绿 | `#FFC9DD` 樱粉 | `#9FD4F0` | `#8B6F47` |
| 夏 | `#3E9B4F` 浓绿 | `#E8C469` 麦金 | `#FFD23F` 向日葵 | `#5FB0E8` | `#9C7A4D` |
| 秋 | `#E8873A` 橙 | `#C94F3D` 枫红 | `#B98A4A` 金棕 | `#9FB4C7` 雾蓝 | `#7A5C3E` |
| 冬 | `#F2F6FA` 雪白 | `#B9D9EB` 冰蓝 | `#3E5F4E` 松绿 | `#8FA8C8` 冷灰蓝 | `#6E5741` |

原则：同一季节内饱和度方差小（Dorfromantik 式统一），换季时植被/氛围色相偏移、骨架色（木、石、屋顶）不变。

## 8. 本作视觉支柱（5 条，可执行可验收）

1. **像素颗粒统一**：全场景 texel density 16 px/m（道具 32 px/m），`NearestFilter`，无拉伸贴图——验收：任意截图中相邻物体像素颗粒大小一致。
2. **光影是第二张贴图**：所有体素面受平行光+HemisphereLight 真实照明，阴影区亮度 25–40% 不死黑，夜间蓝调低照度 + 暖色点光对比——验收：同一场景昼/夜/黄昏三张截图氛围明显区分且无纯黑区域。
3. **高阈值 bloom 的梦幻收尾**：threshold ≥0.8，只有太阳、水面高光、灯火、自发光溢光——验收：白天画面不泛白，夜晚灯火有明显光晕。
4. **微缩模型镜头感**：俯视角 + ACES 色调映射 + vignette + 移轴式浅景深——验收：焦点内地块清晰、画面前景与远景有可感知柔焦，整体观感接近 Octopath 的 diorama 质感。
5. **大气随时间流动**：FogExp2 雾色/密度、god rays billboard、天空 shader 均随昼夜与天气脚本插值——验收：连续 24 小时游戏时间内无跳变，雨天明显更朦胧。

## 9. 来源

- BSL Shaders 官网：https://capttatsu.com/bslshaders/
- Complementary Shaders（Unbound vs Reimagined）：https://complementaryshaders.com/complementary-unbound-vs-reimagined-shaders/
- God rays billboard 拆解（cyanilux）：https://www.cyanilux.com/tutorials/god-rays-shader-breakdown/
- Octopath Traveler 技术分析索引（DF / Unreal Fest Europe 2019）：https://github.com/OTFCG/Awesome-Game-Analysis
- Octopath 0 UE4 + HD-2D 报道：https://foro3d.com/en/2026/january/octopath-traveler-0-confirms-its-use-of-unreal-engine-4-and-the-hd-2d-style.html
- Teardown 开发者博客（8-bit 调色板、体素格式）：https://blog.voxagon.se/
- Dorfromantik 极简设计与调色板（80 Level）：https://80.lv/articles/how-dorfromantik-expands-its-cozy-world-through-minimalist-design
- Texel density 深潜（Beyond Extent）：https://www.beyondextent.com/deep-dives/deepdive-texeldensity
- Texel density 基础（RebusFarm）：https://rebusfarm.net/blog/texel-density-basics-every-artist-should-know
- N8AO（three.js SSAO）：https://github.com/N8python/n8ao
- three.js 论坛 HBAO vs N8AO：https://discourse.threejs.org/t/new-ambient-occlusion-example-hbao-vs-n8ao/58847
- Codrops three.js 性能优化：https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
- Stardew Valley Soundtrack wiki：https://stardewvalleywiki.com/Soundtrack
- Procedural Music with Web Audio API：https://www.mysimulator.uk/content/tutorials/procedural-music.html
- Web Audio 振荡器教程（dev.to）：https://dev.to/rayalva407/creating-an-oscillator-with-the-web-audio-api-5b8m
- Web Audio API 书（Boris Smus，playbackRate）：https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch04.html
