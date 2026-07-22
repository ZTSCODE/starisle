# 畜牧系统（Animals）设计文档

## 0. 系统概述
农场畜牧循环：建鸡舍/畜棚 → 买动物 → 每日抚摸/喂食/放养 → 心情×好感双轨决定产出与品质 → 地面拣产物 → 加工机器升值（蛋→蛋黄酱、奶→奶酪）。
接口：监听 `day-start/minute/weather-change`；发出 `building-built/animal-bought`；state 字段 `state.animals.{list,products,machines,hayStock}` 与 `state.farm.buildings`；依赖 `src/data/animals.js`（物品注册/动物/建筑/机器配方），复用 `farming.farmGroundType`、`render/spriteanimal.js`（与 spritechar 同构的动物精灵）。

## 1. 功能树（≥4层）
```
L1 畜牧
├─ L2 建筑（鸡舍线/畜棚线）
│  ├─ L3 购买建造 —— [操作]商店系统调 buyBuilding(id)/debug [视觉]木石粒子爆发+建筑落位低模 [听觉]sfx_buy [UI]「鸡舍建成！」飘字 [数值]扣钱扣木石 [氛围]shakeScreen(0.04)
│  │  ├─ L4 校验顺序：钱够→材料够(wood/stone 按 BUILDINGS.materials)→放养区 4 槽位有空；任一不满足红字拒绝且不扣费
│  │  └─ L4 落位：SLOTS 前 4 个空位（间距≥6m），b={uid,id,x,z,hay:0,doorOpen:true} 写入 state.farm.buildings
│  ├─ L3 建筑可视 —— [视觉]低模小屋（墙身+双坡屋顶+山墙+门窗+食槽，风格同 makeHouse；大建筑+石基座，畜棚红色白包边）
│  │  ├─ L4 食槽干草面：hay>0 显示（syncBuilding）
│  │  └─ L4 舍门铰链动画：开门 rotation.y→-1.35（每帧 lerp），点击切换
│  └─ L3 舍门开关 —— [操作]空手点建筑 [视觉]门旋转 [听觉]sfx_open/close [UI]「打开了/关上了舍门」飘字 [数值]doorOpen [氛围]—
│     ├─ L4 门开=动物白天可出/夜不关门全舍心情-10；门关=动物不出不进
│     └─ L4 关门时被关门外动物原地过夜（露宿惩罚）
├─ L2 动物（鸡/鸭/牛/山羊/绵羊/猪/兔）
│  ├─ L3 购买 —— [操作]玛妮牧场(special:'animal')/buyAnimal(type) [视觉]爱心粒子+门口出现 [听觉]sfx_buy+叫声 [UI]「鸡1号 加入了农场！」 [数值]扣买价 [氛围]—
│  │  ├─ L4 前置：存在对应建筑族(coop/barn 系)且 在舍数<capacity；满员红字拒绝不扣费
│  │  └─ L4 新购当天不进食不生长无惩罚（boughtAt 标记，SDV 规则），成年即可产出
│  ├─ L3 放养 AI —— [视觉]4 向像素 sprite 漫步/吃草(低头帧)/偶尔叫声 [听觉]tone 合成叫声(8-22s 随机,20m 内可闻)
│  │  ├─ L4 出舍：晴天类天气+非冬+门开+6:00 后个体延迟 0-40 分钟 → 出门吃鲜草：fedToday=true、心情=255、好感+8
│  │  ├─ L4 漫步：thinkT 决策 32% 吃草 2-3.5s / 53% 新目标点(放养区内、避开水面与建筑) / 15% 发呆
│  │  ├─ L4 回舍：17:00(1020) 或天气转雨/雪 → 走向门口，门开则入舍隐藏，门关则门外过夜
│  │  └─ L4 冬季/雨天不出舍；舍内过夜
│  ├─ L3 抚摸 —— [操作]点动物(≤3.5m) [视觉]爱心粒子上浮+♥气泡 [听觉]音符 tone+动物叫声 [UI]「♥ 好感 +8」「♪ 心情 +32」双飘字 [数值]好感+8(上限1000)/心情+32(上限255)，每日1次 [氛围]粒子上飘(负重力)
│  │  ├─ L4 当日重复抚摸：灰字「今天已经摸过了」，无数值变化
│  │  └─ L4 未抚摸日结：好感-10、心情-20
│  ├─ L3 喂食 —— [操作]手持 hay 点建筑 [视觉]干草粒子+食槽干草面出现 [听觉]sfx_eat [UI]「食槽 +N 干草（x/容量）」 [数值]扣背包 hay，b.hay 增加 [氛围]—
│  │  ├─ L4 食槽已满→手持 hay 全部转入 hayStock 仓库（飘字报库存）
│  │  └─ L4 晨间喂食(minute 事件)：舍内且不会出门的动物，食槽优先、不足自动耗 hayStock；喂食成功心情+8
│  ├─ L3 拣产物 —— [操作]点地面发光产物(≤3.5m) [视觉]物品 sprite 浮动+品质色光晕+拾取粒子 [听觉]sfx_pickup [UI]「鸡蛋 ★2」飘字 [数值]入包(品质)、农耕 XP+5 [氛围]光晕脉动
│  │  ├─ L4 产出位置：舍门口随机散布；背包满→红字「背包已满」产物保留
│  │  └─ L4 光晕色=品质（普通米白/银/金/铱青）
│  └─ L3 猪刨松露 —— [操作]—(放养自动) [视觉]土坑粒子爆发+松露发光可拾 [听觉]noise 刨土 [UI]「猪X号 刨出了松露！」 [数值]每日 0-2 个(60%+好感/2000 概率，≥600 好感 40% 加产 1) [氛围]—
│     ├─ L4 仅白天户外触发(digT 15-40s 间隔)；冬季/雨天不出门 → 不产
│     └─ L4 松露品质走统一 rollQuality
├─ L2 双轨数值（心情 0-255 × 好感 0-1000）
│  ├─ L3 日结算(day-start) —— [UI]无(后台) [数值]见下 [异常]新购首日跳过
│  │  ├─ L4 昨日未喂食：心情-100、好感-20、必不产出
│  │  ├─ L4 昨日未抚摸：好感-10、心情-20；露宿：心情减半、好感-20；夜不关门：全舍心情-10
│  │  ├─ L4 产出：成年+昨日进食 → produceTimer+1，到周期且过心情门槛(心情≥70 必产，否则 心情/70 概率；未过门槛天数不计冷却)
│  │  └─ L4 age+1；重置 fedToday/pettedToday
│  ├─ L3 品质判定 —— [数值]得分=好感/1000−(1−心情/225)；>0.95 才可能铱星(得分/2 掷验)→金(得分/2)→银(得分)→普通
│  │  └─ L4 铱星实际需要 好感≈1000 且 心情>200（得分>0.95）
│  └─ L3 大产物/稀有产物 —— [数值]大蛋/大奶：好感≥200 且 (好感+心情修正)/1200 掷验；鸭毛/兔脚：(好感+心情修正)/4750+日运气
│     ├─ L4 心情修正：心情>200 ×1.5；≤100 取(心情-100)
│     └─ L4 命中则替换当次基础产物
└─ L2 加工机器（蛋黄酱机/奶酪机）
   ├─ L3 放置 —— [操作]手持机器点草地 [视觉]低模机器(木箱+罐+指示灯)落位 [听觉]sfx_plant [UI]机器名飘字 [数值]扣手持 [氛围]—
   │  └─ L4 校验：grass 地格+离建筑≥1m+离机器≥1m；crab_pot 等非本系机器拒绝
   ├─ L3 投料加工 —— [操作]手持原料点机器 [视觉]原料粒子+指示灯变绿呼吸 [听觉]sfx_plant [UI]「开始加工：蛋黄酱」 [数值]扣原料 1，计时 180/200 游戏分钟 [氛围]工作时机身轻晃
   │  ├─ L4 蛋黄酱机：蛋→蛋黄酱；大蛋→金星蛋黄酱；鸭蛋→鸭蛋黄酱
   │  ├─ L4 奶酪机：牛奶→奶酪；大奶→金星奶酪；羊奶→山羊奶酪；大羊奶→金星山羊奶酪
   │  └─ L4 加工中再点：灰字报剩余小时
   └─ L3 收取 —— [操作]点已完成机器 [视觉]金灯脉动+冒泡粒子(0.9-1.5s) [听觉]sfx_harvest [UI]「蛋黄酱 ★2」飘字 [数值]入包、农耕 XP+5、机器复位 [氛围]完成瞬间「完成了！」飘字+sfx
      └─ L4 背包满→红字，机器保持完成态
```

## 2. 对照组对标表
对照组：Stardew Valley 畜牧（v1.6，stardewvalleywiki.com/Animals）
| 对照组行为 | 本作是否实现 | 本作实现方式或不做的理由 |
|---|---|---|
| 鸡舍/畜棚三级升级线 | 部分 | 两级（普通/大，容量 4/8）；Deluxe 级与自动喂食机留待建筑升级系统 |
| 动物购买价（鸡800/鸭1200/牛1500/山羊4000/绵羊8000/猪16000/兔8000） | 是 | 与 SDV 一致，见 §3 |
| 出售价=买价×(好感/1000+0.3) | 是 | sellPriceOf/sellAnimal |
| 干草喂食（每只每天 1 份，食槽/仓库存） | 是 | 食槽+hayStock 自动消耗；割草入筒仓待筒仓建筑 |
| 不喂食：心情-100、好感-20、不产出 | 是 | onDayStart |
| 抚摸+好感/未抚摸衰减 | 是 | 抚摸+8/日（任务书规格；SDV 为+15，本作 NPC 社交亦为 +8 量级，统一手感），未抚摸-10 |
| 吃鲜草心情置 255、外出+8 好感 | 是 | updateAnimal 出舍分支 |
| 心情 0-255 三档文案（happy/fine/sad） | 否 | 以数值飘字呈现，动物状态面板随 NPC/动物 UI 包后续接入 |
| 心情<70 按 心情/70 概率产出 | 是 | rollProduce moodGate |
| 品质公式（好感/1000−(1−心情/225)，铱星需>0.95） | 是 | rollQuality 逐字实现 |
| 大蛋/大奶（好感≥200，/1200 掷验） | 是 | rollLarge |
| 鸭毛/兔脚（/4750+日运气） | 是 | rollRare |
| 猪户外刨松露、冬季不产 | 是 | digTruffle；冬季不出门 |
| 幼崽/怀孕/孵化器 | 否 | 任务书明确「孵化器另接」；age 字段已预留 adultDays |
| 野生动物夜袭 | 否 | 无战斗系统支撑；露宿已有心情/好感惩罚 |
| 挤奶桶/剪毛器工具交互 | 否 | 简化为舍内地面自产+捡拾（与鸡蛋统一，减少工具槽压力） |
| 蛋黄酱机/奶酪机/产油机计时加工 | 部分 | 蛋黄酱 3h/奶酪 3.3h（任务书规格）；产油机随工匠机器包后续（松露油物品已注册可出货） |
| 建筑内景（舍内地面） | 否 | 本作无舍内场景，产物生成在舍门口地面，语义等同 |

## 3. 数值表
| 关键数值 | 数值 | 来源URL | 本作调整理由 |
|---|---|---|---|
| 鸡舍/大鸡舍造价 | 4000g+300木100石 / 10000g+400木150石，容量 4/8 | stardewvalley.fandom.com/wiki/Carpenter%27s_Shop | 任务书规格（与 SDV 前两档一致） |
| 畜棚/大畜棚造价 | 6000g+350木150石 / 12000g+450木200石，容量 4/8 | www.gamespot.com/articles/every-barn-upgrade-in-stardew-valley/1100-6525081/ | 同上 |
| 动物买价 | 800/1200/1500/4000/8000/16000/8000(兔) | stardewvalleywiki.com/Animals | 与 shops.js 牧场货架一致 |
| 产出基价 | 蛋50/大蛋95/鸭蛋95/鸭毛250/奶125/大奶190/羊奶225/大羊奶345/羊毛340/松露625/兔脚565 | stardewvalleywiki.com/Animals | 无调整 |
| 抚摸好感 | +8/日，未抚摸 -10 | 任务书（SDV 为 +15/-(10−好感/200)） | 与本作 NPC 社交日增益量级统一 |
| 心情增减 | 吃鲜草=255；抚摸+32；喂食+8；未喂食-100；未抚摸-20；露宿减半；夜不关门-10 | stardewvalleywiki.com/Animals | 夜不关门 -10 为任务书新增（SDV 隐含于袭击风险） |
| 品质公式 | 得分=好感/1000−(1−心情/225)；铱>0.95 | stardewvalleywiki.com/Animals | 无调整 |
| 大产物 | 好感≥200，(好感+心情修正)/1200 | stardewvalleywiki.com/Animals | 无调整 |
| 鸭毛/兔脚 | (好感+心情修正)/4750+日运气 | stardewvalleywiki.com/Animals | 兔沿用鸭的 /4750（SDV 兔 /5000，本作统一） |
| 加工品价格 | 蛋黄酱190/鸭蛋黄酱285/奶酪230/山羊奶酪345/松露油1065 | 任务书规格 | SDV 鸭蛋黄酱375/山羊奶酪400；任务书数值=大蛋/大奶金星档，按任务书执行 |
| 加工耗时 | 蛋黄酱 180 分钟(3h)/奶酪 200 分钟(3.3h) | 任务书规格 | 无调整 |
| 松露日产 | 60%+好感/2000 概率 1 个，≥600 好感 40% 追加 1 个 | stardewvalleywiki.com/Animals（机制） | SDV 按友谊分档多次判定，本作简化为 0-2 个 |

## 4. 边界与异常清单
- 空/满状态：无建筑买动物→红字「需要有空位的鸡舍/畜棚」不扣费；建筑满员→同样拒绝；放养区 4 槽位占满→「没有空位了」；食槽已满→hay 自动转仓库；背包满拣产物→产物保留在地面。
- 极端时间：17:00 强制回舍（走向门口）；2:00 昏倒推进日期走同一 day-start 结算；季末跨季：冬季首日 canOut=false 动物自动转为舍内吃草料。
- 天气联动：雨/暴雨/雪 → 不出舍+已在外的立即返程（weather-change 收回）；雨天舍内动物吃干草；雪季=冬季规则。
- 并发冲突（谁优先）：点击路由优先级 产物>机器>动物>建筑>放置机器；喂食与抚摸同日独立互斥不冲突；睡觉结算中 day-start 在天气切换前触发，结算用「刚结束那天」的照料记录，语义正确。
- 失败路径：钱/材料不足、无空位、非草地放机器、机器原料不符、重复抚摸——全部红字+sfx_error，不产生任何数值副作用。
- 本系统特有：
  - 满员：buyAnimal 前置校验 在舍数<capacity。
  - 饿肚：未喂食心情-100/好感-20/必不产出；morning feed 食槽优先、仓库兜底。
  - 冬季：所有动物不出门（猪不产松露），必须备干草。
  - 雨天收回：weather-change 事件全部置 returning。
  - 动物挡路：动物不参与玩家碰撞（SDV 可挤开，本作直接穿过），漫步目标点避开水面/建筑。
  - 夜不关门：全舍心情-10；门关时晚归动物被关门外→露宿（心情减半、好感-20），次日天晴照常啃草。

## 5. 接口契约
- 监听事件：`day-start`（日结算）、`minute`（机器计时+晨间喂食）、`weather-change`（雨天收回）。
- 发出事件：`building-built {id,x,z}`、`animal-bought {type,name}`。
- state 字段（serialize 范围）：`state.animals={list:[{id,type,name,x,z,friendship,mood,fedToday,pettedToday,age,produceTimer,inside,outside,building,boughtAt}], products:[{uid,item,quality,x,z}], machines:[{uid,id,x,z,input,out,outQuality,remaining,done}], hayStock, nextUid, nameSeq}`；`state.farm.buildings=[{uid,id,x,z,hay,doorOpen}]`（商店系统写入购买，本系统提供 buyBuilding API）。
- 依赖数据文件：`src/data/animals.js`（ANIMALS/BUILDINGS/MACHINES+物品注册）、`src/data/items.js`、`src/render/spriteanimal.js`、`src/systems/farming.js`(farmGroundType)。
- 对外 API：buyBuilding(id)、buyAnimal(type,name?)、sellAnimal(id)、sellPriceOf(a)、pet(id)、feedBuilding(uid)、toggleDoor(uid)、placeMachine(x,z)、loadMachine(uid)、collectMachine(uid)、pickupProduct(uid)、pickupNearest(x,z,r)、interactAt(x,z)、countType(type)、serialize()/deserialize()。

## 6. 完工三连问
1. 对照组还有什么行为我没有？Deluxe 级建筑与自动喂食、孵化器/怀孕幼崽（任务书指定另接）、挤奶桶/剪毛器工具、野生动物夜袭、加热器、产油机。均有明确交接方或简化理由（见 §2）。
2. 每个交互的六层反馈链都齐了吗？逐条核验：购买(粒子+sfx+飘字+扣费+震动)✓ 抚摸(爱心粒子+♥气泡+音符+叫声+双飘字+数值)✓ 喂食(粒子+sfx_eat+飘字+食槽可视+数值)✓ 拣产物(光晕+sfx+飘字+XP)✓ 开关门(门动画+sfx+飘字)✓ 放机器(模型+sfx+飘字)✓ 投料(粒子+绿灯+飘字)✓ 收取(冒泡+金灯+sfx+飘字+XP)✓ 刨松露(土坑粒子+noise+飘字)✓。
3. 边界清单每条都实现了吗？§4 全部 11 条均在代码中有对应分支（qa/animals.mjs 覆盖满员/饿肚喂食/睡觉产出/加工全链）。

## 7. 来源
1. https://stardewvalleywiki.com/Animals （动物价格/双轨/产出/品质与大产物公式/松露）
2. https://stardewvalley.fandom.com/wiki/Carpenter%27s_Shop （鸡舍/畜棚造价与升级线）
3. https://www.gamespot.com/articles/every-barn-upgrade-in-stardew-valley/1100-6525081/ （畜棚升级交叉验证）
4. https://stardewvalley.fandom.com/wiki/Artisan_Goods （加工机器产出价）
5. docs/research/sdv-systems.md §3（文末来源列表：stardewvalleywiki.com/Coop、/Festivals 动物喂食规则）
