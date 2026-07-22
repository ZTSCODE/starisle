# 《Stardew Valley》系统行为对标调研（逐条实现清单）

- 调研日期：2026-07-17
- 对标版本：Stardew Valley v1.6.x（含 1.6 新增内容，已标注）
- 调研方式：以官方维基 stardewvalleywiki.com 为主源，逐页 FetchURL 核对；另用 ≥3 个独立来源（fandom 维基、GameSpot、Game Rant、Eurogamer、Carl's Guides、stardewvalleysprinkler 等）交叉验证关键数值。
- 用法：每条行为即一条待实现的规格；URL 为该条数据来源。

---

## 1. 钓鱼（Fishing）

### 1.1 抛竿蓄力与距离
- 按住使用键蓄力出现力度条，松开抛竿；抛竿过程中可用方向键微调落点，可向斜方向偏移 1 格（用于够气泡点）。来源：https://stardewvalleywiki.com/Fishing
- 最大抛竿距离由钓鱼等级决定：0 级时南北向 3 格、东西向 4 格；在 1、4、8、15 级各 +1 格（全方向）。蓄力超过最大值 99% 显示 "Max"，但无额外收益。来源：https://stardewvalleywiki.com/Fishing
- 真正影响收益的是"离陆距离"（Distance from Land，上限按 5 格计）：越远垃圾率越低、鱼尺寸/品质越好、部分鱼（鲟鱼、传说鱼）上钩率越高、宝箱内容更好。码头、石桥算"陆地"，木桥不算。来源：https://stardewvalleywiki.com/Fishing

### 1.2 咬钩等待时间
- 基础上钩时间为 0.6–30 秒随机；每级钓鱼等级使最大值 -0.25 秒。来源：https://stardewvalleywiki.com/Fishing
- Spinner 最大值 -5 秒，Dressed Spinner -10 秒；本竿首次咬钩最小/最大时间再 -25%。来源：https://stardewvalleywiki.com/Fishing
- 挂 Bait/Magnet/Magic Bait/Targeted Bait 时最小、最大时间均 -50%；Wild Bait/Challenge Bait 再 -25%（合计 -62.5%）；Deluxe Bait -67%；最小时间下限 0.5 秒。来源：https://stardewvalleywiki.com/Fishing
- 抛入气泡点：咬钩速度 4 倍，且判定鱼种时离陆距离 +1（不影响尺寸/品质/宝箱）。每个区域同时至多 1 个气泡点。来源：https://stardewvalleywiki.com/Fishing

### 1.3 感叹号反应窗口
- 鱼咬钩时浮标抖动、头顶出现"!"并播放音效，需及时按使用键进入小游戏；超时鱼逃走。官方维基未单列窗口时长数值（代码层面约 0.8 秒量级，待二次核对）；Sonar Bobber 类装备/模组可延长该窗口。来源：https://stardewvalleywiki.com/Fishing ；https://www.nexusmods.com/stardewvalley/mods/24837

### 1.4 遛鱼小游戏机制
- 目标：保持鱼图标在绿色滑条内，直到右侧进度条蓄满；鱼在条外则进度条下降，清空则鱼逃脱。单机模式下小游戏期间游戏内时间暂停。来源：https://stardewvalleywiki.com/Fishing
- 绿条物理：按住键绿条上升且速度渐增，松开下落，带惯性/动量（难以急停，易 overshoot）；轨道总长 568 像素。来源：https://stardewvalleywiki.com/Fishing
- 绿条长度：0 级 96px，每级 +8px，10 级 176px；Cork Bobber、Deluxe Bait、锻造 Master 附魔、食物 buff 可继续加；常规最大 284px（轨道一半），沙漠节极限 308px。来源：https://stardewvalleywiki.com/Fishing
- 鱼的 AI 难度：每种鱼有 difficulty 值 5–110（Fish.xnb），并按行为类型（mixed/smooth/sinker/floater/dart）运动；难度决定移动剧烈程度（如沙丁鱼 30、深红鱼 95、传说鱼 110）。来源：https://stardewvalleywiki.com/Fishing ；https://stardewvalleywiki.com/Fish
- 宝箱：小游戏开始 1–3 秒后可能出现，基础概率 15%；Magnet +15%、Treasure Hunter +5%（两个 +10%）、Pirate 职业 +15%；日运气 ±5%（特殊护符 +1.25%）、每点运气 buff +0.5%。宝箱有独立进度条，需将绿条保持在宝箱图标处收集；鱼逃脱则宝箱一并失去。来源：https://stardewvalleywiki.com/Fishing
- 金宝箱（钓鱼精通后）：基础 25%，日运气 ±10%（护符 +2.5%），上限 37.5%；内容物平均多 27.4%。来源：https://stardewvalleywiki.com/Fishing

### 1.5 完美垂钓（Perfect Catch）
- 判定：全程鱼图标从未离开绿条（装备 Treasure Hunter 时，仅收集宝箱期间离开也算完美）。来源：https://stardewvalleywiki.com/Fishing
- 收益：银星→金星、金星→铱星（普通品质不升）；经验 ×2.4。来源：https://stardewvalleywiki.com/Fishing
- 经验公式：XP = (品质系数+1)×3 + 难度/3（品质系数：普通 0/银 1/金 2/铱 4）；宝箱 ×2.2、完美 ×2.4、传说鱼 ×5，按顺序相乘且每步截断取整；品质按原始品质计。来源：https://stardewvalleywiki.com/Fishing

### 1.6 尺寸、品质与图鉴
- 尺寸系数 fishSize = (离陆距离/5) × ((等级+2)/10) × 随机(90–110)/100，等级向下取偶数，结果截断到 0–1。来源：https://stardewvalleywiki.com/Fishing
- 实际尺寸(英寸) = minSize + (maxSize−minSize)×fishSize + 1（向下取整）；遛鱼每 0.8 秒没收线尺寸 -1"（不低于 minSize）；非完美且恰为 maxSize 时再 -1"。来源：https://stardewvalleywiki.com/Fishing
- 品质由 fishSize 直接决定：<0.33 普通，0.33–0.66 银，≥0.66 金；铱星只能由完美垂钓（银/金升一级）或 Quality Bobber（+1 级）获得，两者可叠加。来源：https://stardewvalleywiki.com/Fishing
- Training Rod：尺寸固定最小、品质固定普通；且计算绿条时钓鱼等级按 5 级（不足 5 级时）。来源：https://stardewvalleywiki.com/Fishing
- 图鉴：收藏菜单记录每种鱼的捕获数量与最大尺寸纪录；每种鱼首次捕获弹 "First catch!"（1.6）；成就：10 种/24 种/100 条/全鱼类。来源：https://stardewvalleywiki.com/Fishing

### 1.7 鱼种分布（季节/天气/时段/水域）——代表鱼表
以下 20 种条件均经 Bundles 页核对；价格为维基基础售价（详见 Fish 页）。来源：https://stardewvalleywiki.com/Bundles ；https://stardewvalleywiki.com/Fish

| 鱼 | 水域 | 季节 | 天气 | 时段 | 基础价 |
|---|---|---|---|---|---|
| Sunfish 太阳鱼 | 河流 | 春/夏 | 晴 | 6am–7pm | 30g |
| Catfish 鲶鱼 | 河流/秘密森林 | 春/秋（夏限定秘密森林/巫婆沼泽） | 雨 | 6am–12am | 200g |
| Shad 鲥鱼 | 河流 | 春/夏/秋 | 雨 | 9am–2am | 60g |
| Tiger Trout 虎鳟 | 河流 | 秋/冬 | 任意 | 6am–7pm | 150g |
| Largemouth Bass 大口黑鲈 | 山湖 | 全年 | 任意 | 6am–7pm | 100g |
| Carp 鲤鱼 | 山湖(春夏秋)/秘密森林/下水道 | 全年 | 任意 | 全天 | 30g |
| Bullhead 大头鱼 | 山湖 | 全年 | 任意 | 全天 | 75g |
| Sturgeon 鲟鱼 | 山湖 | 夏/冬 | 任意 | 6am–7pm | 200g |
| Chub 鲢鱼 | 山湖/河流 | 全年 | 任意 | 全天 | 50g |
| Sardine 沙丁鱼 | 海洋 | 春/秋/冬 | 任意 | 6am–7pm | 40g |
| Tuna 金枪鱼 | 海洋 | 夏/冬 | 任意 | 6am–7pm | 100g |
| Red Snapper 红鲷鱼 | 海洋 | 夏/秋 | 雨 | 6am–7pm | 50g |
| Tilapia 罗非鱼 | 海洋 | 夏/秋 | 任意 | 6am–2pm | 75g |
| Walleye 玻璃梭鲈 | 河流/山湖/森林池塘 | 秋（冬需祈雨图腾） | 雨 | 12pm–2am | 105g |
| Bream 鲷鱼 | 河流 | 全年 | 任意 | 6pm–2am | 45g |
| Eel 鳗鱼 | 海洋 | 春/秋 | 雨 | 4pm–2am | 85g |
| Pufferfish 河豚 | 海洋 | 夏 | 晴 | 12pm–4pm | 200g |
| Rainbow Trout 虹鳟 | 河流 | 夏 | 晴 | 6am–7pm | 65g |
| Salmon 鲑鱼 | 河流 | 秋 | 任意 | 6am–7pm | 75g |
| Woodskip 木跃鱼 | 秘密森林/森林农场 | 全年 | 任意 | 全天 | 75g |

- 补充（天气/时段条件）：Rainbow Trout 夏·晴·6am–7pm（来源：https://stardewvalleywiki.com/Fish）；Halibut 大比目鱼 海洋 春/夏/冬 6am–11am 与 7pm–2am（同上）。
- 矿洞湖鱼：Ghostfish 幽灵鱼——矿井 20、60 层地下湖，全季节全天（来源：https://stardewvalleywiki.com/Bundles）；Stonefish 石鱼——20 层（来源：https://stardewvalleywiki.com/The_Mine 楼层表备注 "Fishing: Ghostfish, Stonefish and Cave Jelly"）；Ice Pip 冰pip——60 层；Lava Eel 熔岩鳗——100 层（来源：https://stardewvalleywiki.com/Fish）。
- 沙漠/特殊：Sandfish 沙鱼 沙漠池塘 6am–8pm 全年；Scorpion Carp 蝎鲤 沙漠（来源：https://stardewvalleywiki.com/Bundles ；https://stardewvalleywiki.com/Fish）。
- 蟹笼鱼类见 1.9。

### 1.8 传说鱼规则
- 5 条传说鱼，每条每存档限钓 1 次（联机每人 1 次）；尺寸固定（min=max），难度 80–110，需满足专属站位/钓区（一般要求离陆 ≥3 格，气泡可放宽 1 格）。来源：https://stardewvalley.fandom.com/wiki/Glacierfish ；https://stardewvalleywiki.com/Fish
- The Legend 传说鱼：山湖（建议朝沉没原木抛竿，离陆 ≥5 格），春季·雨天·全天，钓鱼等级 10，难度 110。来源：https://stardewguide.com/fish/mountain-lake-stardew ；https://theriagames.com/guide/stardew-valley-legendary-fish/
- Crimsonfish 深红鱼：海滩东码头（需 300 木材修桥），夏季·任意天气，等级 5，难度 95，售价 1500g。来源：https://vip-develop.gamepur.com/guides/all-fish-locations-in-stardew-valley ；https://www.fandomspot.com/stardew-valley-most-profitable-fish/
- Angler 安康鱼：JojaMart 北侧河流，秋季，等级 3，难度 85。来源：https://vip-develop.gamepur.com/guides/all-fish-locations-in-stardew-valley
- Glacierfish 冰川鱼：煤炭森林 Arrowhead Island 最南端站位，冬季，等级 6（可用食物 buff 凑），钓区 ≥3，难度 100。来源：https://stardewvalley.fandom.com/wiki/Glacierfish
- Mutant Carp 变异鲤鱼：下水道，全季节任意天气，难度 80。来源：https://stardewvalleywiki.com/Fish
- 传说鱼二代（1.6，齐先生"Extended Family"特别订单期间）：Crimsonfish Son、Ms. Angler、Legend II、Glacierfish Jr.、Radioactive Carp，订单期间可在同地点重复钓。来源：https://vip-develop.gamepur.com/guides/all-fish-locations-in-stardew-valley
- 1.6 鱼群狂潮（Fish Frenzy）：条件为游玩 ≥4 天且钓过 ≥3 条鱼（或 ≥15 天）；气泡生成时 1% 变为狂潮，只上指定鱼、咬钩时间减半，至少持续 90 分钟。来源：https://stardewvalleywiki.com/Fishing

### 1.9 鱼竿 / 鱼饵 / 钓具
- 鱼竿：Training Rod 25g（只上普通鱼、按 5 级算绿条）；Bamboo Pole 500g（春 2 日威利赠送）；Fiberglass Rod 1,800g（钓鱼 2 级解锁，可用鱼饵）；Iridium Rod 7,500g（钓鱼 6 级，鱼饵+钓具）；Advanced Iridium Rod 25,000g（1.6 钓鱼精通，鱼饵+双钓具）。来源：https://stardewvalleywiki.com/Fishing
- 鱼饵：Bait（咬钩时间 -50%，虫肉制作）；Wild Bait（-62.5%，概率双倍捕获，Linus 4 心事件给配方）；Magnet（宝箱率 +15%）；Magic Bait（无视季节/天气/时段钓任何鱼）；Challenge Bait（最多同钓 3 条，脱钩全失）；Targeted Bait（1.6，指定鱼种）；Deluxe Bait（-67% + 加大绿条）。来源：https://stardewvalleywiki.com/Fishing ；https://stardewvalleywiki.com/Bait
- 钓具：Cork Bobber（绿条加大）；Trap Bobber（鱼在条外时进度条下降变慢）；Lead Bobber（绿条到底不弹跳）；Spinner（最大咬钩时间 -5s）；Dressed Spinner（-10s）；Treasure Hunter（宝箱率 +5%，收宝箱时鱼不离条）；Barbed Hook（鱼更难挣脱）；Curiosity Lure（稀有鱼率升）；Quality Bobber（品质 +1 级）；Sonar Bobber（1.6，起钩前显示鱼种）。来源：https://stardewvalleywiki.com/Fishing ；https://stardewvalleywiki.com/Tackle
- 钓鱼消耗体力：0 级每次抛竿 8 点，每级 -0.1，10 级为 7 点。来源：https://stardewvalleywiki.com/Fishing

### 1.10 蟹笼（Crab Pot）
- 解锁：钓鱼 3 级；制作 40 木材 + 3 铁锭（Trapper 职业降为 25 木材 + 2 铜锭）；或威利鱼店 1,500g 购买；蟹笼收集包奖励 3 个。来源：https://stardewvalley.fandom.com/wiki/Crab_Pot ；https://www.eurogamer.net/stardew-valley-crab-pots-pot-products-7014 ；https://www.carlsguides.com/stardewvalley/fishing.php
- 规则：放入水体，每天需装 1 个鱼饵，次日收获；不会损坏。来源：https://bosslevelgamer.com/stardew-valley-lobster-catch/
- 产出：海洋＝龙虾/螃蟹/虾/Cockle/贻贝/牡蛎/蛤蜊；淡水＝小龙虾/蜗牛/Periwinkle；另可能出垃圾。每次收获 5 XP。来源：https://stardewvalleywiki.com/Bundles （蟹笼收集包清单）；https://stardewvalleywiki.com/Fishing
- 职业联动：Mariner（10 级 Trapper 分支）蟹笼不出垃圾；Luremaster 蟹笼免鱼饵。来源：https://stardewvalleywiki.com/Fishing

---

## 2. 矿井（The Mines）

### 2.1 结构
- 位于山区北部，春 5 日（Y1）山体滑坡清理后开放；共 120 层，分 3 段主题带各 40 层：1–39 棕色土层（31–39 阴影变体）、40–79 冰冻层（70–79 冰牢城堡变体）、80–119 熔岩紫层（110–119 深红变体）；每段对应层布局相同（如 5/45/85 同布局）。来源：https://stardewvalleywiki.com/The_Mines
- 每 5 层解锁电梯检查点，可随时乘电梯直达；每 10 层为奖励层（无怪物、1 个宝箱，奖励一次性）。来源：https://stardewvalleywiki.com/The_Mines
- 下楼层后 1 秒无敌（1.6.4）。来源：https://stardewvalleywiki.com/The_Mines

### 2.2 梯子生成规则
- 楼层加载时 95% 概率尝试在随机空格生成 1 个梯子（该方式生成的梯子会阻止石头再出梯子）；12、52、92 层预置保底梯子（不阻止石头出梯子）。来源：https://stardewvalleywiki.com/The_Mines
- 每击杀 1 只怪物 15% 概率掉梯子（矮人王雕像 buff 后 22%），需死亡位置无遮挡。来源：https://stardewvalleywiki.com/The_Mines
- 每块石头被摧毁基础 2% 出梯子；日运气 ±(最高 +2.5%，含护符 0.5%)，运气 buff 每点 +1%，加上剩余石头数倒数（如剩 5 块 +20%），无剩余敌人再 +4%，矮人王雕像最后 ×1.25。来源：https://stardewvalleywiki.com/The_Mines
- 楼梯（Staircase）：采矿 2 级，99 石头制作，直接下一层。来源：https://stardewvalleywiki.com/The_Mines

### 2.3 矿石与宝石分布深度
- 铜矿：2 层起（1–39 层富集，31–39 铜矿/晶球常见）；铁矿/冰封晶球/海蓝宝石/翡翠/泪晶：41 层起；金矿/岩浆晶球/祖母绿/红宝石/火水晶：81 层起；神秘石：101 层起；放射性矿：危险矿井任意非 5 倍数层。来源：https://stardewvalleywiki.com/The_Mines
- 到达 120 层前宝石节点按层段限定：1–39 层＝紫水晶/黄水晶；41–79 层＝+翡翠/海蓝宝石；到顶后任意层宝石节点可出全种类（含钻石）；到顶后全怪物可稀有掉落钻石/五彩碎片（各 0.05%）。来源：https://stardewvalleywiki.com/The_Mines

### 2.4 怪物（HP/攻击/防御/速度/经验/掉落）
来源：https://stardewvalleywiki.com/Slimes ；https://stardewvalleywiki.com/Bats ；https://stardewvalleywiki.com/Ghost ；https://stardewvalleywiki.com/Shadow_Brute ；https://stardewvalleywiki.com/Bug ；https://stardewvalleywiki.com/Squid_Kid ；https://stardewvalleywiki.com/Dust_Sprite

| 怪物 | 楼层 | HP | 攻击 | 防御 | 速度 | XP | 主要掉落 |
|---|---|---|---|---|---|---|---|
| Green Slime 绿史莱姆 | 1–29 | 24 | 5 | 1 | 2 | 3 | Slime 75%、Sap 15%、Green Algae 10% |
| Blue Slime 冰霜果冻 | 41–79 | 106 | 7 | 0 | 2 | 6 | Slime 75%、Sap 50%、Winter Root 8%、Jade 2% |
| Red Slime 红史莱姆 | 81–119 | 205 | 16 | 0 | 2 | 10 | Slime 80%、Sap 50%、Coal 10%、Diamond 1% |
| Bug 臭虫 | 1–39 | 1 | 8 | 0 | 2 | 1 | Bug Meat（主掉落）、Ancient Seed 0.5% |
| Bat 蝙蝠 | 31–39 | 24 | 6 | 1 | 3 | 3 | Bat Wing 1–2 个(94%)、Bomb 2% |
| Frost Bat 冰冻蝙蝠 | 41–79 | 36 | 7 | 1 | 3 | 7 | Bat Wing 1–2 个(95%)、Bomb 2% |
| Lava Bat 熔岩蝙蝠 | 81–119 | 80 | 15 | 1 | 3 | 15 | Bat Wing 1–2 个(97%)、Bomb 2% |
| Dust Sprite 灰尘精灵 | 41–79 | 40 | 6 | 2 | 3 | 2 | Coal 50%、Crystal Fruit 2%、Coffee Bean 1% |
| Ghost 幽灵 | 51–79 | 96 | 10 | 3 | 4 | 15 | Solar Essence 95%、Gold Ore 1–3(20%)、Ghostfish 8%、Refined Quartz 8% |
| Shadow Brute 暗影狂徒 | 81–119 | 160 | 18 | 2 | 3 | 15 | Void Essence 75%(+10%)、Strange Bun 4%、Copper Bar 4%、Iridium Bar 0.2% |
| Squid Kid 鱿鱼娃 | 91–119 | 1 | 18 | 2 | 3 | 15 | Solar Essence（主）、Squid Ink、金锭等 |
| Stick Bug 竹节虫（危险矿） | 41–69(危险) | 700 | 20 | — | — | — | 危险矿专属 |

- 史莱姆行为：4 格仇恨范围；49% 为雄性（+25% HP、+1 攻击、2.5% 激怒 +50% 攻击）；被击中概率触发狂暴加速；Slimed debuff 速度 -4 持续 2.5–3 秒；Slime Charmer Ring（击杀 1000 史莱姆的公会奖励）免疫史莱姆伤害。来源：https://stardewvalleywiki.com/Slimes
- 幽灵行为：无视障碍物直线飘向玩家，命中后瞬移到随机位置再回击。来源：https://stardewvalleywiki.com/Ghost
- 到达 120 层后全矿井怪物永久强化：防御 +50%、未命中率 ×2、HP +0–100% 随机、攻击 +0–50% 随机；新增 20 种替换布局。来源：https://stardewvalleywiki.com/The_Mines
- 危险矿井（齐先生任务/挑战神龛）：怪物换成 dangerous 变体（约 2 倍 HP/攻击），难度等级 0–2 影响怪物刷新率(+2%/级)、堆叠史莱姆率(+10%/级)等。来源：https://stardewvalleywiki.com/The_Mines

### 2.5 Infested（怪物侵占）层与特殊层
- 侵占层：无石头、满是怪物，需杀光全部怪物（含土里 Duggy）才出现梯子；当天保持侵占状态；不会出现在 0/5 结尾层、每段前 5 层、每段第 19 层、每段最后 10 层；大蒜油 buff 可免疫侵占。来源：https://stardewvalleywiki.com/The_Mines
- 蘑菇层：81–119 层（非电梯层）每天首次进入时 3.5% 概率生成，红/紫蘑菇大量、石头极少，离开即消失。来源：https://stardewvalleywiki.com/The_Mines
- 地牢层：进入过采石场矿洞后，任意合规层 4.4% 概率变成采石场样式（铜/铁史莱姆、幽灵骷髅），当天保持。来源：https://stardewvalleywiki.com/The_Mines
- 蜂群事件：每 10 分钟 8.9% 概率单只飞行怪来袭（侵占层/采石场矿洞 10%）；1.1% 概率起雾 30–40 秒群体来袭；大蒜油免疫。来源：https://stardewvalleywiki.com/The_Mines

### 2.6 宝箱层奖励（每 10 层）
- 10 层 皮靴；20 层 钢制轻剑；30 层 无；40 层 弹弓；50 层 冻原靴；60 层 水晶匕首；70 层 大师弹弓；80 层 火行者靴；90 层 黑曜石之刃；100 层 星之果实（Stardrop）；110 层 太空靴；120 层 骷髅钥匙（开启沙漠骷髅洞穴+酒馆祝尼魔赛车）。来源：https://stardewvalleywiki.com/The_Mines
- 开局高级选项可"混合"奖励层内容（每层从给定池随机）。来源：https://stardewvalleywiki.com/The_Mines

### 2.7 生命归零晕厥惩罚
- 精力耗尽或 2:00am 倒地：损失 10% 金钱，上限 1,000g。来源：https://stardewvalleywiki.com/The_Mines
- 生命值归零：损失金钱 5%–25%（上限 15,000g，1.6 由 5,000g 上调），并丢失若干物品栏物品（含武器与工具，银河剑除外）；工具次日邮件返还，但钓竿与武器不返还；在矿洞入口被村民救醒。来源：https://stardewvalleywiki.com/The_Mines
- 马龙（冒险家公会）物品找回：可按物品基础售价购回 1 件（或 1 组）丢失物（持 Mapping Cave Systems 能力 5 折）；找回列表在下一次晕厥时被覆盖。来源：https://stardewvalleywiki.com/The_Mines

### 2.8 装备体系（武器/戒指/鞋）
- 装备槽：武器 ×1、戒指 ×2、靴子 ×1（另有帽子）；靴子提供防御/免疫（如太空靴），戒指提供特效（发光、磁力、史莱姆魅惑、盗贼等）。来源：https://stardewvalleywiki.com/The_Mines （奖励层与箱子特殊物品池）
- 武器/戒指/鞋来源：10–110 层奖励层宝箱、矿井木箱/木桶"特殊物品"池（按层段分池，如 0–19 层出雕刻刀/木棒/运动鞋/小发光戒指等，100–119 层出 Burglar's Shank/Steel Falchion/免疫指环等）、怪物 0.175% 特殊掉落、冒险家公会商店（马龙）。来源：https://stardewvalleywiki.com/The_Mines
- 怪物猎杀目标（公会）：如 1000 史莱姆→Slime Charmer Ring、200 蝙蝠、150 虚空之魂（暗影狂徒+暗影萨满）等。来源：https://stardewvalleywiki.com/Slimes ；https://stardewvalleywiki.com/Shadow_Brute

---

## 3. 畜牧（Animals）

### 3.1 建筑建造价格与升级线（罗宾木匠店，建造 3 天、升级 2 天）
- 鸡舍线：Coop 4,000g + 300 木材 + 100 石头（4 只，鸡）→ Big Coop 10,000g + 400 木材 + 150 石头（8 只，解锁鸭/恐龙蛋孵化）→ Deluxe Coop 20,000g + 500 木材 + 200 石头（12 只，解锁兔，自动喂食）。来源：https://stardewvalley.fandom.com/wiki/Carpenter%27s_Shop ；https://stardewvalleywiki.com/Coop
- 畜棚线：Barn 6,000g + 350 木材 + 150 石头（4 头，牛）→ Big Barn 12,000g + 450 木材 + 200 石头（8 头，解锁山羊、怀孕）→ Deluxe Barn 25,000g + 550 木材 + 300 石头（12 头，解锁绵羊/猪，自动喂食）。来源：https://www.gamespot.com/articles/every-barn-upgrade-in-stardew-valley/1100-6525081/ ；https://stardewvalley.fandom.com/wiki/Building
- 筒仓 Silo：100g + 100 石头 + 10 粘土 + 5 铜锭（割草存干草）。来源：https://stardewvalley.fandom.com/wiki/Stone
- 农舍升级：1 次 10,000g + 450 木材（加厨房）；2 次 50,000g + 150 硬木（加婴儿房）。来源：https://stardewvalley.fandom.com/wiki/Carpenter%27s_Shop

### 3.2 动物购买价与产出（玛妮牧场）
来源：https://stardewvalleywiki.com/Animals

| 动物 | 购买价 | 前置建筑 | 产出（基础价） | 周期 | 满心出售价 |
|---|---|---|---|---|---|
| 鸡（白/棕/蓝） | 800g | 鸡舍 | 蛋 50g / 大蛋 95g | 每天 | 1,040g |
| 鸭 | 1,200g | 大鸡舍 | 鸭蛋 95g / 鸭毛 250g | 每 2 天 | 1,560g |
| 兔 | 8,000g | 豪华鸡舍 | 兔毛 340g / 兔脚 565g | 每 4 天 | 10,400g |
| 恐龙 | 孵化（恐龙蛋） | 大鸡舍 | 恐龙蛋 350g | 每 7 天 | 1,300g |
| 虚空鸡 | 孵化（虚空蛋 5,000g Krobus/女巫事件） | 鸡舍 | 虚空蛋 65g | 每天 | 1,040g |
| 牛 | 1,500g | 畜棚 | 牛奶 125g / 大牛奶 190g | 每天 | 1,950g |
| 山羊 | 4,000g | 大畜棚 | 羊奶 225g / 大羊奶 345g | 每 2 天 | 5,200g |
| 绵羊 | 8,000g | 豪华畜棚 | 羊毛 340g | 每 3 天（≥900 好感且抚摸过→2 天；Shepherd 职业→1 天） | 10,400g |
| 猪 | 16,000g | 豪华畜棚 | 松露 625g（冬季不出门不产） | 每天外出挖掘 | 20,800g |
| 鸵鸟 | 孵化 | 畜棚 | 鸵鸟蛋 600g | 每 7 天 | 20,800g |

- 动物出售价公式：售价 = 购买价 × ((好感/1000) + 0.3)。来源：https://stardewvalleywiki.com/Animals
- 幼崽需长成成年才可产出；新购/新生当天不进食也不生长。来源：https://stardewvalleywiki.com/Animals

### 3.3 干草喂食
- 每天每只 1 份：外出吃鲜草（鸡舍动物 2 簇草、畜棚 4 簇；蓝草减半为 1/2 簇）或舍内干草（喂料槽）；干草可割草（有筒仓）或玛妮处购买。来源：https://stardewvalleywiki.com/Animals
- 不喂食：不死亡，但当天不产出、心情 -100、好感 -20；节日当天无需喂食（沙漠节/鳟鱼大赛/鱿鱼节/夜市除外）；豪华建筑自动喂食。来源：https://stardewvalleywiki.com/Animals ；https://stardewvalleywiki.com/Festivals
- 冬季/雨天动物不外出；冬季舍内需加热器（Heater）维持心情。来源：https://stardewvalleywiki.com/Animals

### 3.4 抚摸、好感与心情对品质的影响
- 好感：上限 1000（5 心，每半心 100）；抚摸 +15（Coopmaster/Shepherd 对应动物 +30）、挤奶/剪毛 +5、外出吃草 +8（蓝草 +16）、未喂食 -20、夜困户外 -20、未抚摸 -(10 − 好感/200)。来源：https://stardewvalleywiki.com/Animals
- 心情：0–255；≥200 "really happy"、30–199 "fine"、<30 "sad"；吃鲜草直接置 255；抚摸 +32~36（对应职业 ×2）；喂食 +4~16；未抚摸 -20~-40；未喂食 -100；露宿 -当前值一半。来源：https://stardewvalleywiki.com/Animals
- 产出门槛：未喂食必不产；心情 <70 时按 心情/70 概率产出。来源：https://stardewvalleywiki.com/Animals
- 高品质/大产物资格：心情 ≥150 必得资格，否则按 心情/150 概率获得资格（特殊规则：未取得资格的天数不计入多日产物的冷却）。来源：https://stardewvalleywiki.com/Animals
- 大蛋/大奶：需好感 ≥200；得分 =(好感 + 心情×心情修正)/1200 与 0–1 随机数比较；心情修正：>200 时 ×1.5、≤100 时取(心情−100)；得分 ≥1（即 1200）必出。来源：https://stardewvalleywiki.com/Animals
- 鸭毛/兔脚：得分 =(好感 + 心情×修正)/4750（鸭）或 /5000（兔）+ 日运气；满值时约 42% 鸭毛 / 40% 兔脚。来源：https://stardewvalleywiki.com/Animals
- 品质判定：得分 = 好感/1000 − (1 − 心情/225)（对应职业 +0.333）；>0.95 才有可能铱星（得分/2 掷验）→ 金星（得分/2 掷验）→ 银星（得分掷验）→ 普通。来源：https://stardewvalleywiki.com/Animals
- 动物生育：夜间无其他事件时 50% 尝试，大畜棚以上且未满员，按"动物数 ×0.55%"判定，成年且允许怀孕的动物分娩。来源：https://stardewvalleywiki.com/Animals
- 野生动物袭击：动物夜困户外且关门时，夜间无其他事件则 50% 尝试，按 1/农场建筑数 抽中建筑，第 1 只户外动物被移除。来源：https://stardewvalleywiki.com/Animals

### 3.5 加工机器（配方与产出价）
来源：https://stardewvalley.fandom.com/wiki/Artisan_Goods ；https://stardewvalleysprinkler.com/post/from_ore_to_bar_every_secret_to_mastering_copper_in_stardew_valley ；https://listium.com/@terrynd/133218/stardew-valley-crafting-recipe-checklist-16

| 机器 | 解锁 | 配方 | 产出（基础价） |
|---|---|---|---|
| 蛋黄酱机 | 耕种 2 | 15 木材+15 石头+1 地晶+1 铜锭 | 蛋黄酱 190g；大蛋→金星蛋黄酱 285g；鸭蛋→鸭蛋黄酱 375g |
| 奶酪机 | 耕种 6 | 45 木材+45 石头+10 硬木+1 铜锭 | 奶酪 230g；大奶→金星奶酪 345g；山羊奶酪 400g（大羊奶→金星 600g） |
| 产油机 | 耕种 8 | 50 史莱姆+20 硬木+1 金锭 | 松露油 1,065g（松露 1 个，6 小时） |
| 罐头瓶 | 耕种 4 | 50 木材+40 石头+8 煤 | 果酱/腌菜 = 2×基底+50g |
| 小桶（Keg） | 耕种 8 | 30 木材+1 铜锭+1 铁锭+1 橡树脂 | 果酒 = 3×水果基价；果汁 = 2.25×蔬菜基价 |
| 蜂房 | 耕种 3 | 40 木材+8 煤+1 铁锭+1 枫糖浆 | 野蜂蜜 100g；带花蜂蜜更高（玫瑰仙子蜂蜜 680g） |
| 织布机 | 耕种 7 | 60 木材+30 纤维+1 松焦油 | 布料 470g（羊毛 1 个） |
| 种子机 | 耕种 9 | 25 木材+10 煤+1 金锭 | 作物→1–3 份种子 |

---

## 4. NPC 社交（Friendship & Marriage）

### 4.1 好感数值体系
- 每心 = 250 好感点；普通村民上限 10 心；可结婚对象未送花束前锁定 8 心（灰显 9、10 心）；配偶上限 14 心。来源：https://stardewvalleywiki.com/Friendship
- 加分：每日首次对话 +20；送货任务 +150；一周内送满 2 次礼物，次周日 +10；看电影喜爱 +200/喜欢 +100；电影零食 +50/+25；配偶每日首吻 +10。来源：https://stardewvalleywiki.com/Friendship
- 减分：弹弓击中 -30/次；在 7 格内翻垃圾桶被看到 -25（Linus 反而 +5）；heart event 选项可 ±（单次最多 +250：Linus 8 心事件；最多 -1500：Penny 8/10 心事件）。来源：https://stardewvalleywiki.com/Friendship
- 衰减（每日未对话）：配偶 -20（永不停止）；已送花束 -10（10 心停止）；未送花束 -2（8 心停止）；不可恋爱对象 -2（10 心停止）。来源：https://stardewvalleywiki.com/Friendship
- 进入卧室需 ≥2 心（一旦解锁永久有效）。来源：https://stardewvalleywiki.com/Friendship

### 4.2 送礼偏好数值（已核实）
- 最爱 Love +80；喜欢 Like +45；普通 Neutral +20；讨厌 Dislike -20；厌恶 Hate -40。来源：https://stardewvalleywiki.com/Friendship
- 生日 ×8；冬日星盛宴秘密礼物 ×5；读过 Friendship 101 全部获得 ×1.1；品质加成（仅喜爱/最爱）：银 ×1.1、金 ×1.25、铱 ×1.5；理论单次最高 960 点（铱星最爱生日礼物，×1.1 后 1056）。来源：https://stardewvalleywiki.com/Friendship
- 规则：每人每天 1 次、每周（周日起算）最多 2 次；生日可突破周上限；配偶每天可送，但礼物得失减半（且配偶所有得失减 34%）。来源：https://stardewvalleywiki.com/Friendship
- 收到最爱/厌恶礼物时分别出现爱心/厌恶气泡与专属对话；≥1 心后村民会闲聊其亲友的送礼偏好（提示系统）。来源：https://stardewvalleywiki.com/Friendship
- 普适最爱：金南瓜、魔法糖棒、珍珠、五彩碎片、兔脚、星之果茶（+250 即 1 心，不占周上限）；普适厌恶：全部鱼饵、全部化石、怪物战利品、垃圾类。来源：https://stardewvalleywiki.com/Friendship

### 4.3 恋爱与结婚
- 可结婚对象 12 人：Abigail、Alex、Elliott、Emily、Haley、Harvey、Leah、Maru、Penny、Sam、Sebastian、Shane；另有 Krobus 可做室友（Void Ghost Pendant）。来源：https://stardewvalleywiki.com/Marriage
- 花束：8 心后皮埃尔来信提示，杂货店 200g 购买；赠送后解锁 9、10 心并显示"男/女朋友"；可同时与多人约会；与同性别全部 6 人同时约会触发群体 10 心事件（可能集体冷战 1 周）；枯萎花束分手，好感立降至 5 心。来源：https://stardewvalleywiki.com/Marriage
- 美人鱼吊坠：10 心次日刘易斯来信；雨天在海滩潮汐池找老水手 5,000g 购买（需 300 木材修桥或社区升级；冬季需祈雨图腾）；要求农舍至少升级 1 次且未婚；赠送必接受。来源：https://stardewvalleywiki.com/Marriage
- 婚礼：求婚后第 3 天早晨举行（遇镇广场活动/绿雨顺延）；当天必为晴天，天气图标变爱心；婚后好感上限 14 心，12.5 心（3125 点）送星之果实（每存档 1 次）。来源：https://stardewvalleywiki.com/Marriage
- 配偶农场帮忙行为：浇全部作物（春夏秋）、喂全部动物、给宠物碗加水、修理破损围栏、赠送早/晚餐；偶尔更换屋内墙纸/地板/添家具；每日首吻解除精疲力竭；屋内被堵/没床有专属抱怨对话。来源：https://stardewvalleywiki.com/Marriage
- 嫉妒：给同性别且收过花束的候选者送礼（非厌恶礼物、非生日礼物），20–40% 概率（随日运气）配偶嫉妒，-30 好感并触发生气对话。来源：https://stardewvalleywiki.com/Marriage
- 好感事件（heart events）：达到对应心数+地点/时间/天气等条件触发的剧情；部分选项影响好感；部分事件可能永久错过，多数可后补。来源：https://stardewvalleywiki.com/Friendship
- 布告栏收集包全部完成：所有已见面的不可结婚村民 +500（2 心）。来源：https://stardewvalleywiki.com/Friendship
- 离婚：镇长庄园 50,000g，当天 22:00 前可撤销；前妻/夫好感归 0 且拒收礼物；女巫小屋 30,000g 抹除前配偶记忆。来源：https://stardewvalleywiki.com/Marriage

---

## 5. 节日（Festivals）

- 通用规则：多数节日游戏内时间不流逝；例外 4 个"被动节日"（沙漠节、鳟鱼大赛、鱿鱼节、夜市）时间正常流逝且商店不关门、动物需照常喂食；其余节日商店全天关门（下水道/社区中心/影院/温泉除外），动物自动视为已喂；节日上与村民对话同样 +20 好感。来源：https://stardewvalleywiki.com/Festivals

| 节日 | 日期 | 地点/时间 | 核心规则与奖励 |
|---|---|---|---|
| 蛋蛋节 Egg Festival | 春 13 | 镇广场 9am–2pm 进入 | 寻蛋比赛：50 秒（现实时间）捡 ≥9 个彩蛋获胜，否则 Abigail 赢；首年奖草帽，之后奖 Prize Ticket；摊位卖草莓种子、毛绒兔、火烈鸟装饰等 |
| 沙漠节 Desert Festival（1.6） | 春 15–17 | 沙漠 10am–2am | 轮换商店、赛跑下注、挑战任务赚活动货币、艾米丽每日送服装；时间流逝 |
| 花舞节 Flower Dance | 春 24 | 煤炭森林 9am–2pm | 邀请舞伴需 ≥4 心（对话两次邀请）；共舞 +250 好感（1 心）；摊位卖 Rarecrow #5、一篮花等 |
| 卢奥节 Luau | 夏 11 | 海滩 9am–2pm | 百乐汤：玩家投入 1 件食材，州长品尝后按食材品质/种类增减全体村民好感 |
| 鳟鱼大赛 Trout Derby（1.6） | 夏 20–21 | 煤炭森林（玛妮牧场下）6:10am–2am | 全天可钓虹鳟，每条概率出 Golden Tag 换奖品（帐篷套件、水桶帽、鳟鱼挂饰）；时间流逝 |
| 月光水母起舞 Dance of the Moonlight Jellies | 夏 28 | 海滩 10pm–12am | 与刘易斯对话点亮火把观看水母；纯观赏 |
| 星露谷博览会 Stardew Valley Fair | 秋 16 | 镇广场 9am–3pm | 农庄展览评比（按种类丰富度+品质给星币）；小游戏赢星币；星币商店（含星之果实等）；格斯免费 Survival Burger |
| 万灵节 Spirit's Eve | 秋 27 | 镇广场 10pm–11:50pm | 迷宫尽头奇数年得金南瓜（2,500g）、偶数年 Prize Ticket；皮埃尔摊位卖 Rarecrow、南瓜灯及配方 |
| 冰雪节 Festival of Ice | 冬 8 | 煤炭森林 9am–2pm | 冰钓比赛：钓 ≥5 条获胜（对手 Pam/Willy/Elliott）；首年奖 2 件钓具+1 磁铁饵+水手帽，之后 Prize Ticket |
| 鱿鱼节 SquidFest（1.6） | 冬 12–13 | 海滩 6:10am–2am | 按当日钓鱿鱼数分铜/铁/金/铱四档奖励；两天全拿需 12 日 8 条、13 日 10 条；奖品含鱿鱼帽、The Art O' Crabbing |
| 夜市 Night Market | 冬 15–17 | 海滩 5pm–2am | 旅行商人每天在场、潜艇深海钓鱼（特有鱼）、美人鱼秀；时间流逝；送礼照常加好感 |
| 冬日星盛宴 Feast of the Winter Star | 冬 25 | 镇广场 9am–2pm | 秘密送礼（18 日刘易斯来信告知对象），礼物好感 ×5；随机村民回礼 |

来源：https://stardewvalleywiki.com/Festivals

---

## 6. 社区中心收集包（Bundles）

- 共 6 房间 30 包；单包完成立即领奖，整房完成当晚触发祝尼魔过场给房间大奖；若走 Joja 路线则改为花钱解锁（无友谊奖）。来源：https://stardewvalleywiki.com/Bundles

| 房间（解锁顺序） | 房间大奖 | 代表收集包 → 单包奖励 |
|---|---|---|
| 工艺室 Crafts Room（初始） | 修复矿井东侧断桥 → 解锁采石场 | 春/夏/秋/冬觅食包 → 对应季节种子 ×30；建筑包（198 木+99 石+10 硬木）→ 木炭窑；异国情调包 → Autumn's Bounty ×5 |
| 储藏室 Pantry（完成 1 包后） | 修复农场温室（全年种植） | 春/夏/秋作物包 → Speed-Gro×20 / 优质洒水器 / 蜂房；优质作物包（金星防风草/甜瓜/南瓜/玉米各 5）→ 罐头瓶；动物包（大奶/大蛋/大羊奶/羊毛/鸭蛋）→ 奶酪机；工匠包（12 选 6）→ 小桶 |
| 鱼缸 Fish Tank（完成 1 包后） | 移除矿井口闪光巨石 + 威利赠铜淘盘（淘金） | 河鱼包（太阳鱼/鲶鱼/鲥鱼/虎鳟）→ 豪华鱼饵×30；湖鱼包 → Dressed Spinner；海鱼包 → 海滩传送图腾×5；夜钓包 → 发光戒指；蟹笼包（10 选 5）→ 蟹笼×3；特色鱼包（河豚/幽灵鱼/沙鱼/木跃鱼）→ 海之菜肴×5 |
| 锅炉房 Boiler Room（完成 2 包后） | 修复矿车（车站/矿井/采石场/镇 4 点快速传送） | 铁匠包（铜/铁/金锭）→ 熔炉；地质学家包（石英/地晶/泪晶/火水晶）→ 万象晶球×5；冒险家包（99 史莱姆+10 蝙蝠翼+太阳/虚空精华）→ 小磁力戒指 |
| 布告栏 Bulletin Board（完成 3 包后） | 全体已见面不可结婚村民 +2 心（500 点） | 厨师包 → 粉蛋糕×3；染料包 → 种子机；实地研究包 → 回收机；饲料包 → 加热器；魔法师包 → 金锭×5 |
| 金库 Vault（完成 4 包后） | 修复巴士 → 解锁沙漠 | 2,500g 包 → 巧克力蛋糕×3；5,000g 包 → 优质肥料×30；10,000g 包 → 避雷针；25,000g 包 → 宝石复制机（共 42,500g） |

- 全部完成后社区中心重开，获"Stardew Hero"奖杯与 Local Legend 成就；雨夜后废弃 JojaMart 解锁"遗失收集包"（银色以上果酒/恐龙蛋黄酱/五彩碎片/金星上古水果×5/金或铱虚空鲑鱼/鱼子酱）→ 奖励电影院。来源：https://stardewvalleywiki.com/Bundles
- 规则细节：多格包可选填（如工匠包 12 选 6）；不指定品质时任意品质可混堆；指定品质时更高品质也可；收集包物品均可能出现在旅行商人（少量例外）。来源：https://stardewvalleywiki.com/Bundles

---

## 7. 觅食 / 砍树 / 敲石 / 制造 / 烹饪 / 熔炼

### 7.1 觅食刷新规则
- 刷新：每天夜间在室外地图尝试生成（每晚 1~min(4, 6−已有数) 次尝试，每次最多随机抽 11 个位置校验）；每张地图每周上限 6 个标准觅食物，周日重置计数；拾取不减少周计数（周六前拾取几乎无收益）。来源：https://stardewvalleywiki.com/Foraging
- 清除：所有未拾取觅食物在周日早晨与季节首日被移除（农场山洞水果除外），清除日生成率略增；只刷在合法草地类地块（海滩/沙漠为沙地），不占占用格/遮挡格，可砍树后半数遮挡格生成率 -90%；村民路过会踩毁。来源：https://stardewvalleywiki.com/Foraging
- 季节特例：Salmonberry 仅灌木丛春 15–18 日；Blackberry 秋季地面 + 秋 8–11 日灌木丛；Spring Onion 春季煤炭森林（特殊刷新）；冬根/雪山药冬季锄地出。来源：https://stardewvalleywiki.com/Foraging
- 品质：金星判定 = 觅食等级/30，未过再判银星 = 等级/15；Botanist 职业（10 级 Gatherer 分支）全部铱星（列明例外：树液/洞穴萝卜/锄出物/海藻/敲击蘑菇树产物不适用）。来源：https://stardewvalleywiki.com/Foraging
- 经验：地面觅食物 7 XP/个；砍倒树 14 XP；树桩 2 XP；大木桩/大原木 25 XP；春笋 3 XP；摇浆果 1 XP/颗；挖种子点/远古点 15 XP。来源：https://stardewvalleywiki.com/Foraging

### 7.2 砍树与树液
- 普通树（橡树/枫树/松树/红木）：种子（橡果/枫种/松果）种植，共 4 个生长阶段+成熟；未施肥每晚 20% 概率长 1 阶段（第 4 阶段耗时 2 倍），冬季不生长；成熟中位 24 天；树肥（觅食 7 级，5 纤维+5 石头）保证每晚 1 阶段且冬季可长。来源：https://stardewvalleywiki.com/Trees ；https://stardewvalley.fandom.com/wiki/Acorn
- 树桩不会重生；农场外（森林/山区/铁路等）被砍的树会作为树苗重新长回。来源：https://stardewvalley.fandom.com/wiki/Acorn ；https://stardewvalleywiki.com/Trees
- 树液采集器（Tapper，觅食 4 级，40 木+2 铜锭）：枫树→枫糖浆每 9 天；橡树→橡树脂每 7 天；松树→松焦油每 5 天；冬季照常产出；重型采集器（30 硬木+1 放射性锭，齐先生核桃屋 20 宝石换配方）时间减半（4/3/2 天）。来源：https://gamerant.com/stardew-valley-how-to-use-tappers-guide/ ；https://www.gamespot.com/articles/how-to-get-oak-resin-in-stardew-valley/1100-6525082/
- 果树：固定 28 天成熟，幼苗期周围 3×3 必须清空，成熟后对应季节每天 1 果；樱桃/杏=春，橙/桃=夏，苹果/石榴=秋。来源：https://stardewvalleysprinkler.com/post/plant_like_a_pro_every_tree_type_in_stardew_valley_from_seed_to_harvest ；https://stardewvalleywiki.com/Traveling_Cart （树苗价格区间）
- 砍树产出：木材+树液+概率树种；Forester 职业（觅食 5）+25% 木材；Lumberjack（10 级）概率掉硬木；Lumberjack 之外硬木主要来自大木桩/大原木/红木。来源：https://stardewvalleywiki.com/Foraging

### 7.3 敲石（采矿）
- 普通石头出石材；矿石节点按层段出铜/铁/金/铱矿（见 2.3）；晶球（普通/冰封/岩浆/万象）由石头概率掉落，找铁匠 25g/个敲开；煤炭来自石头、矿车/袋（12、18、28…层固定 6 个）、灰尘精灵 50%。来源：https://stardewvalleywiki.com/The_Mines
- 土层（锄头）：洞穴萝卜 5.03%、粘土 4.68%、矮人卷轴/古物小概率、混合种子 0.16% 等（完整概率表见 Mines 页 Dirt Patches 节）。来源：https://stardewvalleywiki.com/The_Mines

### 7.4 制造（Crafting）配方解锁来源
- 主要来源：五项技能升级（如洒水器=耕种 2、优质洒水器=耕种 6、蟹笼=钓鱼 3、Tapper=觅食 4、蛋黄酱机=耕种 2、熔炉相关）；NPC 商店（罗宾：火盆/地板配方；威利：钓具鱼饵；铁匠/沙漠商人）；收集包奖励（如种子机、回收机）；NPC 邮件（Linus 4 心→Wild Bait）；特别订单/齐先生核桃屋（重型采集器等）；精通山洞（1.6）。来源：https://stardewvalleywiki.com/Fishing （钓鱼等级解锁表）；https://listium.com/@terrynd/133218/stardew-valley-crafting-recipe-checklist-16

### 7.5 烹饪
- 厨房解锁：农舍第 1 次升级（10,000g + 450 木材）；另可制作便携"野外炊具"（Cookout Kit，觅食 3 级）。来源：https://stardewvalley.fandom.com/wiki/Carpenter%27s_Shop ；https://stardewvalleywiki.com/Foraging
- 菜谱来源：酱料女皇电视节目（每周日新菜谱、周三重播）；村民好感达标邮件赠送（如 George 3+心→炸鳗鱼、7+心→香辣鳗鱼；Robin 7+心→南瓜汤；Willy 按心数寄鱼类菜谱）；技能升级（Dish O' The Sea=钓鱼 3、Seafoam Pudding=钓鱼 9、Survival Burger=觅食 8）；商店购买（酒吧格斯处部分菜谱，如 Pancakes 100g；姜岛度假村 Tropical Curry 2,000g；火山矮人 Ginger Ale 1,000g）。来源：https://stardewvalleywiki.com/Fishing ；https://stardewvalleywiki.com/Foraging ；https://stardewvalleywiki.com/Luck
- 回复数值（能量/生命，已核对样例）：鳟鱼汤 100/45；海之菜肴 150/67；法式蜗牛/海鲜杂烩/烩鱼汤/虾鸡尾酒/枫糖棒/蟹黄糕 225/101；南瓜汤 200/90；秋日恩赐 220/99；薄饼 90/40；幸运午餐 100/45（+3 运气 11m11s）；香辣鳗鱼 115/51（+1 运气+1 速度）；咖啡 3/1、三倍浓缩 8/3（+1 速度）；魔法糖棒 500/225（+2 采矿+5 运气+1 速度+5 防御+5 攻击）。来源：https://stardewvalleywiki.com/Fishing ；https://stardewvalleywiki.com/Luck ；https://stardewvalleywiki.com/Foraging
- buff 规则：新食物 buff 覆盖旧食物 buff；饮料（咖啡/三倍浓缩/姜汁汽水）与食物可叠加但饮料互不叠加；沙漠节厨师料理可再叠一层。来源：https://stardewvalleywiki.com/The_Mines （食物节注）；https://stardewvalleywiki.com/Luck

### 7.6 熔炼
- 熔炉图纸：首次获得铜矿石后次日早晨铁匠克林特上门赠送；制作 20 铜矿石 + 25 石头。来源：https://houstonaxe.com/how-to-get-copper-axe-in-stardew-valley/ ；https://gamerant.com/stardew-valley-how-get-use-heavy-furnace/
- 配比与耗时（游戏内时间）：5 矿石 + 1 煤 → 1 锭；铜 30 分钟、铁 2 小时、金 5 小时、铱 8 小时、放射性 10 小时；精炼石英 = 1 石英 + 1 煤（1.5 小时）。来源：https://stardewvalley.fandom.com/wiki/Heavy_Furnace ；https://stardewvalleysprinkler.com/post/from_ore_to_bar_every_secret_to_mastering_copper_in_stardew_valley
- 重型熔炉（1.6）：2 熔炉 + 3 铁锭 + 50 石头，3 煤可一次熔一批。来源：https://stardewvalley.fandom.com/wiki/Heavy_Furnace

---

## 8. 运气系统 / 赌场 / 旅行商人

### 8.1 运气（Luck）
- 日运气：每天开始随机生成 -0.1 ~ +0.1 共 201 个取值；特殊护符（秘密纸条 #20 解谜）永久 +0.025；占卜电视节目按区间播报 8 档文案（完美好运/坏运各 1/201 概率）。来源：https://stardewvalleywiki.com/Luck
- 日运气影响：矿井石头出梯子概率；晶球/煤掉率；宝石节点/神秘石/放射性节点生成；木箱生成；骷髅洞穴宝藏层；矿洞死亡金钱物品损失量；钓鱼宝箱出现率及金宝箱/神秘盒/特殊物品率；森林农场木跃鱼上钩率；收获时作物双倍率；鸭毛/兔脚产出；砍树木材量；淘金品质与双份；垃圾桶出货率与品质；配偶嫉妒概率；赌场老虎机结果；雷暴闪电数量（运气越高越多）与树被劈概率（越高越低）。来源：https://stardewvalleywiki.com/Luck
- 运气 buff：食物（幸运午餐 +3、南瓜汤 +2、炸鳗鱼/香辣鳗鱼/虾鸡尾酒/姜汁汽水/香蕉布丁/洞穴冻 +1、魔法糖棒 +5）、幸运戒指 +1、祝福雕像；buff 与日运气分开计算，额外影响：武器暴击率、Yoba 戒指/战士戒指触发率、三种冻（海/河/洞穴）上钩率、石头额外掉矿/粘土/骨头碎片、怪物改良掉落（红木种子/银河之魂/齐钻）；理论上限日运气 0.125 + buff +10。来源：https://stardewvalleywiki.com/Luck

### 8.2 赌场（Casino）
- 位置：沙漠绿洲商店后门，完成"The Mysterious Qi"任务线前被保安拦住；营业 9:00am–11:50pm。来源：https://stardewvalleywiki.com/Casino
- 货币：1,000g = 100 齐钻（10g/钻），齐钻不可换回金币；右上角神秘人 1,000,000g 出售无尽财富雕像。来源：https://stardewvalleywiki.com/Casino
- 玩法：老虎机（结果受日运气影响，1.4 起略偏向玩家）+ 21 点变体 CalicoJack（低注桌 100 齐钻、高注桌 1,000 齐钻）。来源：https://stardewvalleywiki.com/Casino ；https://stardewvalleywiki.com/Luck
- 商店：Rarecrow #3（10,000 钻）、礼帽（8,000）、农场传送图腾（1,000，限 20）、磁铁饵（1,000）、硬木围栏（100）、烟花（200）、画作与壁纸（最高 100,000 钻）。来源：https://stardewvalleywiki.com/Casino

### 8.3 旅行商人（Traveling Cart）
- 出现规律：每周五、周日 6:00am–8:00pm 煤炭森林（农场南侧，猪拉车）；夜市（冬 15–17）每天 5:00pm–2:00am；沙漠节（春 15–17）每天 12:00pm–2:00am；库存每次刷新。来源：https://stardewvalleywiki.com/Traveling_Cart
- 库存结构：10 件随机标准货（每种限 1 或 5 组）+ 1 件家具（146 件池等概率）+ 特殊货（稀有种子春夏必出 1,000g；Rarecrow #4 秋冬 40% 4,000g；咖啡豆 25% 2,500g；茶具第 25 年起 5% 1,000,000g；技能书 5% 6,000g 等）；配偶/室友满 14 心后肖像 30,000g 常驻。来源：https://stardewvalleywiki.com/Traveling_Cart
- 价格：每件商品在给定区间内随机（普遍溢价，偶尔低于原价），品质固定普通；当季外商品也会出现（利于补收集包）；开局选"保证第一年可完成"时，第 2–30 次出摊中随机 1 次必卖红卷心菜种子。来源：https://stardewvalleywiki.com/Traveling_Cart
- 第三方工具可预测库存与矿井侵占层（存档种子驱动）：https://mouseypounds.github.io/stardew-predictor/

---

## 来源列表

主源（逐页核对）：
1. Fishing — https://stardewvalleywiki.com/Fishing
2. The Mines — https://stardewvalleywiki.com/The_Mines
3. Friendship — https://stardewvalleywiki.com/Friendship
4. Marriage — https://stardewvalleywiki.com/Marriage
5. Animals — https://stardewvalleywiki.com/Animals
6. Coop — https://stardewvalleywiki.com/Coop
7. Festivals — https://stardewvalleywiki.com/Festivals
8. Bundles — https://stardewvalleywiki.com/Bundles
9. Foraging — https://stardewvalleywiki.com/Foraging
10. Luck — https://stardewvalleywiki.com/Luck
11. Traveling Cart — https://stardewvalleywiki.com/Traveling_Cart
12. Casino — https://stardewvalleywiki.com/Casino
13. Carpenter's Shop — https://stardewvalleywiki.com/Carpenter%27s_Shop
14. Monsters / Slimes / Bats / Ghost / Shadow Brute / Bug / Squid Kid / Dust Sprite / Stick Bug — https://stardewvalleywiki.com/Monsters 等对应页面
15. Fish — https://stardewvalleywiki.com/Fish
16. Trees — https://stardewvalleywiki.com/Trees

独立来源（交叉核对）：
17. Stardew Valley Wiki (Fandom)：Carpenter's Shop / Building / Crab Pot / Glacierfish / Artisan Goods / Heavy Furnace / Stone / Acorn — https://stardewvalley.fandom.com/
18. GameSpot：Every Barn Upgrade / How To Get Oak Resin — https://www.gamespot.com/articles/every-barn-upgrade-in-stardew-valley/1100-6525081/
19. Game Rant：How To Use Tappers / Heavy Furnace — https://gamerant.com/stardew-valley-how-to-use-tappers-guide/
20. Eurogamer：Crab Pots explained — https://www.eurogamer.net/stardew-valley-crab-pots-pot-products-7014
21. Carl's Guides：Fishing Guide（职业/蟹笼） — https://www.carlsguides.com/stardewvalley/fishing.php
22. stardewvalleysprinkler：Copper 熔炼 / 树木生长 — https://stardewvalleysprinkler.com/post/from_ore_to_bar_every_secret_to_mastering_copper_in_stardew_valley
23. Stardew Guide：Dust Sprite / Mountain Lake（传说鱼） — https://stardewguide.com/guides/stardew-valley-dust-sprites
24. Theria Games：Legendary Fish — https://theriagames.com/guide/stardew-valley-legendary-fish/
25. Gamepur：All Fish Locations（传说鱼等级要求） — https://vip-develop.gamepur.com/guides/all-fish-locations-in-stardew-valley
26. Boss Level Gamer：Lobster/Crab Pot — https://bosslevelgamer.com/stardew-valley-lobster-catch/
27. Destructoid：技能经验表（怪物 XP） — https://www.destructoid.com/the-best-ways-to-level-every-skill-in-stardew-valley/
28. Listium：1.6 制造配方清单 — https://listium.com/@terrynd/133218/stardew-valley-crafting-recipe-checklist-16
29. 存档预测工具（机制佐证）：https://mouseypounds.github.io/stardew-predictor/ ；https://stardew.selbysaurus.me/
