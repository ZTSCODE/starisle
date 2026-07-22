// NPC 数据表：汐溪镇 14 名村民（6 名可结婚）。纯数据无逻辑，供 social/schedule/shops 系统遍历。
// 字段契约见 docs/design/social.md 口径：
//   birthday.season 0春1夏2秋3冬，day 1-28；时间统一分钟制（360=6:00 … 1440=24:00，上限 1560=2:00）
//   schedule/scheduleRain 按时间升序、首尾相接覆盖 360→1440；action ∈ walk/stand/shop/sit/sleep/work
//   gifts.neutral 固定 'default'；未注册进 items.js 的 id 为 fish/料理/宝石等后续数据文件的前瞻引用
//   商店主 id 与 shops.js owner 对应：pierre杂货 / clint铁匠 / marnie动物 / gus酒吧 / willy渔夫 / robin木匠(镇长) / morris旅行商人
// 场景坐标约束：farm 48×48 / town 56×48 / beach 40×32 / forest 48×40 / mountain 40×32（见 docs/design/world.md）

export const NPCS = [
  // ───────────────────────── 可结婚 ×6 ─────────────────────────
  {
    id: 'haiyue',
    name: '海月',
    title: '渔村少女',
    birthday: { season: 1, day: 12 },
    home: 'beach',
    scene: 'beach',
    marriage: true,
    colorScheme: { skin: '#f0c8a0', hair: '#20465f', shirt: '#e86a5e', pants: '#37506e' },
    personality: ['爽朗', '恋海', '莽撞'],
    schedule: [
      { time: [360, 480], scene: 'beach', spot: [10, 26], action: 'work' },   // 礁石区赶早潮捡贝
      { time: [480, 660], scene: 'beach', spot: [32, 20], action: 'work' },   // 码头帮爷爷理网
      { time: [660, 780], scene: 'beach', spot: [8, 14], action: 'sit' },     // 渔家门口午饭
      { time: [780, 960], scene: 'beach', spot: [14, 28], action: 'stand' },  // 潮汐池摸鱼
      { time: [960, 1080], scene: 'town', spot: [28, 24], action: 'walk' },   // 广场闲逛
      { time: [1080, 1200], scene: 'town', spot: [44, 32], action: 'sit' },   // 酒吧听晚吟唱歌
      { time: [1200, 1260], scene: 'beach', spot: [8, 14], action: 'stand' }, // 家门口吹海风
      { time: [1260, 1440], scene: 'beach', spot: [8, 14], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 480], scene: 'beach', spot: [8, 14], action: 'sleep' },   // 雨天赖床
      { time: [480, 660], scene: 'beach', spot: [8, 14], action: 'work' },    // 屋里补渔网
      { time: [660, 780], scene: 'beach', spot: [8, 14], action: 'sit' },
      { time: [780, 960], scene: 'beach', spot: [32, 20], action: 'work' },   // 码头棚下整理渔具
      { time: [960, 1020], scene: 'town', spot: [14, 18], action: 'stand' },  // 杂货店串门
      { time: [1020, 1260], scene: 'town', spot: [44, 32], action: 'sit' },   // 泡酒吧
      { time: [1260, 1440], scene: 'beach', spot: [8, 14], action: 'sleep' },
    ],
    gifts: {
      love: ['pearl', 'coral', 'tuna', 'seafood_platter', 'melon', 'strawberry'],
      like: ['sardine', 'oyster', 'scallop', 'rainbow_shell', 'beer', 'bread'],
      neutral: 'default',
      dislike: ['clay', 'soggy_newspaper', 'fiber'],
      hate: ['trash', 'sap'],
    },
    dialogues: {
      first: '你就是新搬来的农场主？我是海月，老船长汪啸海是我爷爷。在汐溪镇，看天吃饭不如看潮吃饭——记住喽。',
      heart0: [
        '潮水涨到什么位置，鱼群就躲在哪片礁石后头。这是渔民的算术，学十年才入门。',
        '别踩那片湿沙，昨天刚埋了蟹笼。踩坏了你可赔不起。',
        '爷爷的渔船比我岁数都大，可他说船和人一样，越老越认得回家的路。',
      ],
      heart2: [
        '今早的牡蛎特别肥，给你留了两个。别跟爷爷说，他准拿去换酒。',
        '你农场那口池塘水深不错。哪天我帮你下个笼，保准有货。',
        '镇上有人嫌我一身鱼腥味。你倒好，还凑过来问东问西。',
      ],
      heart4: [
        '我想造一条自己的船，开去海平线那头看看。爷爷说我疯了，你觉得呢？',
        '每次收网我都在想，网里会不会有一尾谁也没见过的鱼。',
        '你种地，我出海，咱俩都是靠天吃饭的命。不过我挺喜欢这命。',
      ],
      heart6: [
        '奇怪，你一来码头，我数鱼都会数错。都怪你。',
        '爷爷让我收收心，说野在海上的姑娘没人敢娶。……你听了别笑。',
        '昨晚梦见船开到一片发光的海，船头站着个人，背影有点像你。',
      ],
      heart8: [
        '要是哪天我真的出海远航……你愿意在码头等我回来吗？',
        '我把最亮的彩虹贝壳藏在枕头底下，本想送给最重要的人——你紧张什么。',
        '海图我闭着眼都能背，可你一笑，我连今天初几都忘了。',
      ],
      heart10: [
        '往后我的船你就是大副。哦不，你当船长，我给你掌舵。',
        '潮汐每天两次，可我想你的次数，数不过来。',
      ],
      rain: [
        '雨天不能出海，鱼都躲在深水里打盹。正好，在家补网。',
        '你听这雨声，像不像千万条小鱼在跳水面？',
      ],
      festival_spring: ['春汛节的头一网要先祭海。今年我偷偷许愿：网网不空，人人平安。'],
      festival_summer: ['渔火节放灯喽！把心愿写在灯上漂出去，海娘娘会挑一盏实现。'],
      festival_autumn: ['丰收宴上别客气，海鲜锅是我掌的勺，咸淡可是正正宗宗海的味道。'],
      festival_winter: ['暖星节就该烤火吃鱼干，听爷爷讲他年轻时斗风浪的老故事，百听不厌。'],
      birthdayGift: {
        love: '今天是我生日？！你居然记得……这是我最想要的！比满载而归还开心！',
        like: '生日礼物？谢谢！回头我捞条大的给你补上！',
        neutral: '嗯，谢了。生日能收到心意总是好的。',
        dislike: '……今天是我生日诶，你就拿这个打发我？算了，不跟你计较。',
        hate: '喂！生日送这个，你是想被我扔进潮汐池里醒醒脑吗？',
      },
      giftReaction: {
        love: '哇——这是给我的？！你可太懂我了！今晚我请你吃烤鱼！',
        like: '好东西！谢啦，回头给你带最新鲜的。',
        neutral: '哦，谢了。',
        dislike: '……心意领了，东西你拿回去吧。',
        hate: '拿走拿走！再拿这个，我就把你拴蟹笼上！',
      },
    },
    heartEvents: [
      {
        hearts: 2, scene: 'beach', time: [780, 960],
        script: [
          { type: 'move', who: 'npc', to: [14, 28] },
          { type: 'say', who: 'npc', text: '来得正好！退潮了，潮汐池里全是小世界。过来，我教你认。' },
          { type: 'say', who: 'player', text: '这水洼里能有什么？' },
          { type: 'say', who: 'npc', text: '海胆、小蟹、搁浅的小鱼苗……喏，把手伸进来，别捏，轻轻捧着。' },
          { type: 'emo', who: 'npc', emo: 'note' },
          { type: 'choice', prompt: '要伸手进潮汐池吗？', options: [
            { text: '伸手试试，听她的。', hearts: 30 },
            { text: '不了，怕腥。', hearts: -10 },
          ] },
          { type: 'say', who: 'npc', text: '哈哈，你比镇里那些娇气的强多了！以后赶海我叫上你。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 4, scene: 'beach', time: [1020, 1140], weather: 'rainy',
        script: [
          { type: 'move', who: 'npc', to: [32, 20] },
          { type: 'say', who: 'npc', text: '风越大，鱼越肥！爷爷非拦着我不让出海，你说气不气人！' },
          { type: 'emo', who: 'npc', emo: 'angry' },
          { type: 'say', who: 'npc', text: '他说他年轻时就是这么闯过来的……凭什么他可以，我不行？' },
          { type: 'choice', prompt: '海月想冒雨出海，你怎么劝？', options: [
            { text: '你爷爷是怕你出事，船可以再等晴天。', hearts: 30 },
            { text: '去吧，我陪你一起闯。', hearts: -20 },
          ] },
          { type: 'say', who: 'npc', text: '……哼，道理我都懂。好吧，听你的，今天收网。你说话，比爷爷管用。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 6, scene: 'town', time: [1080, 1200],
        script: [
          { type: 'move', who: 'npc', to: [44, 32] },
          { type: 'say', who: 'npc', text: '晚吟这首歌，唱的是离港的人不回头。我每次听都心里发紧。' },
          { type: 'say', who: 'player', text: '你还在想出海的事？' },
          { type: 'say', who: 'npc', text: '想啊。可是最近……码头上多了个让我想留下的人。你说我该怎么办？' },
          { type: 'emo', who: 'npc', emo: 'sweat' },
          { type: 'choice', prompt: '怎么回答她？', options: [
            { text: '船可以造，人也可以不走。', hearts: 40 },
            { text: '有梦想就去追，别犹豫。', hearts: 0 },
          ] },
          { type: 'say', who: 'npc', text: '船可以造，人可以不走……你这家伙，说话总能说到我心坎里。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 8, scene: 'beach', time: [480, 660], weather: 'sunny',
        script: [
          { type: 'move', who: 'npc', to: [20, 26] },
          { type: 'say', who: 'npc', text: '嘘——别说话，看那边。太阳从海平线蹦出来的这一秒，是汐溪镇最贵的东西。' },
          { type: 'say', who: 'npc', text: '我看了二十年都看不腻。不过今天……好像比往常更好看一点。' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'say', who: 'npc', text: '大概是因为，身边多了个一起看的人吧。……喂，当我什么都没说！' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
    ],
    spouseHelp: ['feed', 'breakfast'],
  },
  {
    id: 'shenzhibai',
    name: '沈知白',
    title: '图书管理员',
    birthday: { season: 3, day: 5 },
    home: 'town',
    scene: 'town',
    marriage: true,
    colorScheme: { skin: '#f5d9bd', hair: '#4a4a52', shirt: '#7d8ea8', pants: '#3a3f4a' },
    personality: ['安静', '毒舌', '好奇'],
    schedule: [
      { time: [360, 480], scene: 'town', spot: [34, 10], action: 'sleep' },
      { time: [480, 600], scene: 'town', spot: [34, 10], action: 'sit' },    // 晨读加早饭
      { time: [600, 660], scene: 'town', spot: [32, 12], action: 'walk' },   // 走去图书室
      { time: [660, 900], scene: 'town', spot: [30, 12], action: 'work' },   // 图书室值班
      { time: [900, 960], scene: 'town', spot: [30, 12], action: 'sit' },    // 午休读书
      { time: [960, 1080], scene: 'town', spot: [30, 12], action: 'work' },
      { time: [1080, 1140], scene: 'town', spot: [28, 24], action: 'walk' }, // 广场散步
      { time: [1140, 1260], scene: 'town', spot: [44, 32], action: 'sit' },  // 酒吧角落看书
      { time: [1260, 1320], scene: 'town', spot: [34, 10], action: 'sit' },  // 夜读
      { time: [1320, 1440], scene: 'town', spot: [34, 10], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 480], scene: 'town', spot: [34, 10], action: 'sleep' },
      { time: [480, 600], scene: 'town', spot: [34, 10], action: 'sit' },
      { time: [600, 660], scene: 'town', spot: [32, 12], action: 'walk' },   // 撑伞去图书室
      { time: [660, 1080], scene: 'town', spot: [30, 12], action: 'work' },
      { time: [1080, 1140], scene: 'town', spot: [30, 12], action: 'sit' },  // 窗边听雨
      { time: [1140, 1260], scene: 'town', spot: [44, 32], action: 'sit' },
      { time: [1260, 1320], scene: 'town', spot: [34, 10], action: 'sit' },
      { time: [1320, 1440], scene: 'town', spot: [34, 10], action: 'sleep' },
    ],
    gifts: {
      love: ['coffee', 'jade', 'nautilus_shell', 'pumpkin_soup', 'bluejazz'],
      like: ['bread', 'fairyrose', 'amethyst', 'salad', 'field_snack', 'tulip'],
      neutral: 'default',
      dislike: ['hotpepper', 'beer', 'hops'],
      hate: ['trash', 'broken_cd'],
    },
    dialogues: {
      first: '……新面孔。我是沈知白，管着镇里那间小图书室。书随便看，按时还就行——我说的是“按时”。',
      heart0: [
        '图书室周三整理架位，那天别来借书。其他时间，请便。',
        '你手上的泥……嗯，农场主嘛。看书之前记得先洗手。',
        '镇志我翻过三遍。汐溪镇建镇八十年，头一回有外乡人接盘那座旧农场。',
      ],
      heart2: [
        '上次你借的那本《潮汐与农时》，比你还书期限早了两天。不错。',
        '你妈……不对，我是说，农场活儿累吗？只是随口一问，不答也行。',
        '给你留了本《汐溪风物志》，插图是莫染画的。你大概会喜欢。',
      ],
      heart4: [
        '我娘生前是抄书匠。这间图书室一半的书，扉页上都有她的字。',
        '别人觉得我闷。其实书里吵得很，只是你们听不见。',
        '你身上的土腥味，居然……不难闻。这话当我没说。',
      ],
      heart6: [
        '最近总在书里夹纸条，写着写着就发现——每张都与你有关。职业病。',
        '知白，知白守黑。我爹取的名字，盼我心里亮堂。你来了之后，好像是亮了点。',
        '图书室十点关门，但你要来，我可以假装忘了锁门。',
      ],
      heart8: [
        '我写过一句诗：“潮落知有信，人来不问期。”后半句，是写你的。',
        '别人借书，我看书。你借书……我看你。这话只许你听。',
        '如果有一天你去很远的地方，记得提前告诉我。我要开始学着等一个人。',
      ],
      heart10: [
        '往后我的书，第一页都写你的名字。最后一页也是。',
        '这间图书室，你随时推门就进——包括我心里那间。',
      ],
      rain: [
        '雨天适合读长句子。雨停之前，书页不会催你。',
        '雨点敲窗的节奏，像老式打字机。你听。',
      ],
      festival_spring: ['春汛节的号子声，隔着书页都能听见。也罢，一年就放纵这几回。'],
      festival_summer: ['渔火节的灯，一盏一盏都是没写完的句子。'],
      festival_autumn: ['丰收宴的菜单我抄了一份存进镇志。一百年后的人，会知道我们今天吃了什么。'],
      festival_winter: ['暖星节，宜烤火，宜读旧信，宜……算了，你来了再说。'],
      birthdayGift: {
        love: '生日礼物？……我查过黄历，今天宜收礼，宜……算了。这是我今年收到最好的东西，谢谢你。',
        like: '记得我生日的人不多。这份心意，我收下了，连同你这个人一起记住。',
        neutral: '谢谢。生日礼物……唔，我会登记在册的。',
        dislike: '……生日收到这个，我该写进镇志的“奇闻”一栏吗。',
        hate: '拿回去。今天是我生日，别逼我说出不符合身份的话。',
      },
      giftReaction: {
        love: '这、这是给我的？……容我失态三秒。三、二、一。好，谢谢你，真的。',
        like: '眼光不错。看来你比我想象中懂我。',
        neutral: '哦，多谢。我收下了。',
        dislike: '……你对我的了解，看来还停留在扉页。',
        hate: '如果这是恶作剧，那你的幽默感该回炉重造了。',
      },
    },
    heartEvents: [
      {
        hearts: 2, scene: 'town', time: [660, 1080],
        script: [
          { type: 'move', who: 'npc', to: [30, 12] },
          { type: 'say', who: 'npc', text: '等一下。你上次说想看“跟海有关又不太长”的书，我挑了一本。' },
          { type: 'say', who: 'npc', text: '《汐溪潮汐考》，手抄本，全镇就这一册。别弄皱，别泡水，别垫锅。' },
          { type: 'emo', who: 'player', emo: 'note' },
          { type: 'say', who: 'npc', text: '……看你答应得这么痛快，再附赠一句：第三十七页有我娘的批注，比正文好看。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 4, scene: 'forest', time: [840, 1020], weather: 'sunny',
        script: [
          { type: 'move', who: 'npc', to: [30, 20] },
          { type: 'say', who: 'npc', text: '……被发现了。今天图书室闭馆，我翘班来看云。别告诉穆青镇长。' },
          { type: 'say', who: 'player', text: '图书管理员也会翘班？' },
          { type: 'say', who: 'npc', text: '书上写“行到水穷处，坐看云起时”。我核对一下原作者有没有骗人。' },
          { type: 'choice', prompt: '他往旁边挪了挪，给你让出一块草地。', options: [
            { text: '坐下陪他看云。', hearts: 40 },
            { text: '提醒他该回去开门了。', hearts: -10 },
          ] },
          { type: 'say', who: 'npc', text: '嗯。核对结果：原作者没骗人。……你也没骗人，你说湖边的云真的好看。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 6, scene: 'town', time: [1140, 1260], weather: 'rainy',
        script: [
          { type: 'move', who: 'npc', to: [44, 32] },
          { type: 'say', who: 'npc', text: '雨夜的酒吧，连酒杯碰撞都像标点符号。……抱歉，一喝酒就说胡话。' },
          { type: 'say', who: 'npc', text: '我娘走的时候留了一箱子没抄完的书稿。这些年我一直在想，人这辈子到底图什么。' },
          { type: 'say', who: 'npc', text: '最近好像有点想通了——图一个能把这句话讲出口的人吧。比如你。' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 8, scene: 'town', time: [1200, 1320],
        script: [
          { type: 'move', who: 'npc', to: [30, 12] },
          { type: 'say', who: 'npc', text: '图书室今晚加开一场，读者一名，篇目一首。你，坐好。' },
          { type: 'say', who: 'npc', text: '“潮落知有信，人来不问期。灯下半卷书，字字皆是你。”' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'choice', prompt: '他读完了，耳根通红。', options: [
            { text: '再读一遍，好吗？', hearts: 50 },
            { text: '鼓掌。', hearts: 20 },
          ] },
          { type: 'say', who: 'npc', text: '……第二遍只读给你听。第三遍，要收门票了。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
    ],
    spouseHelp: ['water', 'breakfast'],
  },
  {
    id: 'clint',
    name: '铁珊瑚',
    title: '铁匠',
    birthday: { season: 2, day: 18 },
    home: 'town',
    scene: 'town',
    marriage: true,
    colorScheme: { skin: '#e8b48c', hair: '#8c3b2e', shirt: '#5a5f6e', pants: '#402e28' },
    personality: ['热血', '直率', '护短'],
    schedule: [
      { time: [360, 480], scene: 'town', spot: [40, 12], action: 'sleep' },
      { time: [480, 540], scene: 'town', spot: [42, 16], action: 'work' },   // 生火开炉
      { time: [540, 720], scene: 'town', spot: [42, 16], action: 'shop' },   // 铁匠铺营业
      { time: [720, 780], scene: 'town', spot: [44, 32], action: 'sit' },    // 酒吧午饭
      { time: [780, 960], scene: 'town', spot: [42, 16], action: 'shop' },
      { time: [960, 1020], scene: 'mountain', spot: [20, 10], action: 'work' }, // 矿口收矿石
      { time: [1020, 1140], scene: 'town', spot: [42, 16], action: 'work' }, // 打样备货
      { time: [1140, 1260], scene: 'town', spot: [44, 32], action: 'sit' },  // 酒吧晚饭
      { time: [1260, 1440], scene: 'town', spot: [40, 12], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 480], scene: 'town', spot: [40, 12], action: 'sleep' },
      { time: [480, 720], scene: 'town', spot: [42, 16], action: 'shop' },   // 雨天炉子更旺
      { time: [720, 780], scene: 'town', spot: [44, 32], action: 'sit' },
      { time: [780, 1140], scene: 'town', spot: [42, 16], action: 'shop' },
      { time: [1140, 1260], scene: 'town', spot: [44, 32], action: 'sit' },
      { time: [1260, 1440], scene: 'town', spot: [40, 12], action: 'sleep' },
    ],
    gifts: {
      love: ['gold_ore', 'iron_ore', 'ruby', 'beer', 'pumpkin', 'diamond'],
      like: ['coal', 'copper_ore', 'hotpepper', 'grilled_fish', 'corn', 'topaz'],
      neutral: 'default',
      dislike: ['fairyrose', 'bluejazz', 'tulip'],
      hate: ['trash', 'soggy_newspaper'],
    },
    dialogues: {
      first: '哟，生面孔！我是铁珊瑚，镇上铁匠铺是我开的。锄头卷刃了、镐头崩口了，尽管拿来——丑话说前头，好钢可不便宜！',
      heart0: [
        '打铁讲究三样：火候、手劲、耐性。种地估计也差不多，咱俩都是手艺吃饭。',
        '炉子边上别久站，火星子不长眼。伤了可别说我不提醒你。',
        '工具要当伙计养，你对它好，它才给你卖力气。这话我爹说的，在理。',
      ],
      heart2: [
        '你那把锄头我瞅过了，钢口还行，就是握柄该换了。下次来我给你缠层新的，不收钱。',
        '镇上人打家具只认我的手艺。为什么？因为我打的椅子，十年不吱声。',
        '抡锤一天，胳膊比你还粗一圈。哈哈，别躲，我又不会捏你。',
      ],
      heart4: [
        '我爹走的那年，炉差点灭了。我十四岁，踩着凳子拉风箱把这铺子撑下来的。',
        '别人姑娘绣花，我煅钢。我爹说珊瑚生在铁匠家，那是命里带火。',
        '累的时候我就听锤声。叮、当、叮、当——比什么曲儿都提神。……你现在是不是也这么觉得？',
      ],
      heart6: [
        '奇怪，最近打农具总想多淬一遍火。顾笙说我心不在焉，我看他才是喝多了。',
        '你要下矿？把那把镐先拿来，我给你加道箍。……不是担心你，是担心我的招牌。',
        '铁烧红了才软，人处久了才热。你懂我意思吧？不懂算了！',
      ],
      heart8: [
        '我打了把新锤，锤柄上刻了两个字。不给你看……好吧，刻的是你的名字。',
        '炉火烧到最旺是青白色。我看见你那天，心里就是那颜色。',
        '谁要是敢欺负你，先问过我的锤。……还有我。',
      ],
      heart10: [
        '往后你家的农具我全包了，包一辈子。听清楚没有？是一辈子。',
        '炉子我天天生，可屋里最暖的地方，是你站的那块。',
      ],
      rain: [
        '雨天好啊，炉火不受潮，打铁最出活儿！',
        '听这雨点子砸屋顶，跟我的小锤一个节奏。',
      ],
      festival_spring: ['春汛节我把农具摊摆到广场上，旧农具免费检修——图个开春吉利！'],
      festival_summer: ['渔火节的灯架子是我打的，二十年没倒过一盏。走，我指给你看！'],
      festival_autumn: ['丰收宴！谁跟我比掰手腕，赢了免单一年！……你？你就算了，我下不去手。'],
      festival_winter: ['暖星节守着炉子喝两口，一年的疲乏都化了。来，坐炉子边上。'],
      birthdayGift: {
        love: '生日礼物？！哈哈，我就知道你不会忘！这个我惦记好久了——今晚炉边庆功，就咱俩！',
        like: '好小子，还记得我生日！回头给你打件好东西！',
        neutral: '哦，谢了。让你破费了。',
        dislike: '……行吧，生日收到这个，也算……独一无二。',
        hate: '喂！我生日你就送这个？信不信我把你锄头打成麻花！',
      },
      giftReaction: {
        love: '嚯——这可是好东西！你从哪弄来的？！够意思，今晚我请酒！',
        like: '不错不错，正合我意！',
        neutral: '哦，谢了。',
        dislike: '……我对这个过敏。不是身子过敏，是心里过敏。',
        hate: '拿开！这东西进我铺子，炉火都要打喷嚏！',
      },
    },
    heartEvents: [
      {
        hearts: 2, scene: 'town', time: [540, 840],
        script: [
          { type: 'move', who: 'npc', to: [42, 16] },
          { type: 'say', who: 'npc', text: '来得正好！过来拉风箱，我腾不出手——使劲，别偷懒！' },
          { type: 'say', who: 'npc', text: '看好了，钢烧到樱桃红就锻，过白就废了。火候这东西，差一口气都不行。' },
          { type: 'emo', who: 'player', emo: 'sweat' },
          { type: 'say', who: 'npc', text: '哈，一脸汗！不过风箱拉得有模有样。下次铺子里缺人手，我还喊你！' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 4, scene: 'mountain', time: [600, 840],
        script: [
          { type: 'move', who: 'npc', to: [20, 10] },
          { type: 'say', who: 'npc', text: '嘘——听。矿洞深处有层好矿脉，我爹的笔记里标过。今天说什么也要采一块回去。' },
          { type: 'say', who: 'player', text: '里面安全吗？' },
          { type: 'say', who: 'npc', text: '铁匠的女儿怕什么矿洞！……哎，头顶掉渣了，往我这边站！' },
          { type: 'choice', prompt: '碎石塌落，你一把将她拉到身边。', options: [
            { text: '小心点，矿脉跑不了，人只有一个。', hearts: 40 },
            { text: '继续挖，富贵险中求！', hearts: -20 },
          ] },
          { type: 'say', who: 'npc', text: '……行，听你的，今天先回。不过你拉我那一下，力气不小啊。……脸红了？才没有！' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 6, scene: 'town', time: [1140, 1260],
        script: [
          { type: 'move', who: 'npc', to: [44, 32] },
          { type: 'say', who: 'npc', text: '顾笙！拿骰子来！今晚我要跟这家伙一决高下！' },
          { type: 'say', who: 'npc', text: '先说好，输了的人要学小狗叫。……什么？我怎么会输？我铁珊瑚什么时候输过！' },
          { type: 'emo', who: 'npc', emo: 'surprise' },
          { type: 'say', who: 'npc', text: '……汪。……喂！笑什么笑！愿赌服输！……行了行了，这杯我干了，你随意。' },
          { type: 'choice', prompt: '她干了一杯，眼睛亮晶晶地看着你。', options: [
            { text: '陪她一起干杯。', hearts: 30 },
            { text: '劝她少喝点。', hearts: 10 },
          ] },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 8, scene: 'town', time: [900, 1140],
        script: [
          { type: 'move', who: 'npc', to: [42, 16] },
          { type: 'say', who: 'npc', text: '过来，给你看个东西。这是我用那块矿脉最好的钢打的，打了七天。' },
          { type: 'say', who: 'npc', text: '一枚挂坠，锤子形状。铁匠不会说漂亮话，想说的话都锻在这上面了。' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'say', who: 'npc', text: '戴上它，就像……就像我天天跟着你下田似的。……别多想！就是、就是图个吉利！' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
    ],
    spouseHelp: ['fence', 'breakfast'],
  },
  {
    id: 'maidong',
    name: '麦冬',
    title: '农家少年',
    birthday: { season: 0, day: 20 },
    home: 'farm',
    scene: 'farm',
    marriage: true,
    colorScheme: { skin: '#f0c8a0', hair: '#6e5233', shirt: '#7a9a5b', pants: '#5b4a38' },
    personality: ['腼腆', '细心', '动物缘'],
    schedule: [
      { time: [360, 480], scene: 'farm', spot: [6, 26], action: 'sleep' },
      { time: [480, 600], scene: 'farm', spot: [6, 30], action: 'work' },    // 自家菜圃浇水
      { time: [600, 720], scene: 'farm', spot: [8, 32], action: 'work' },    // 喂鸡捡蛋
      { time: [720, 780], scene: 'farm', spot: [6, 26], action: 'sit' },     // 午饭
      { time: [780, 840], scene: 'town', spot: [20, 36], action: 'walk' },   // 走去动物店
      { time: [840, 1080], scene: 'town', spot: [8, 34], action: 'work' },   // 动物店帮忙
      { time: [1080, 1140], scene: 'forest', spot: [44, 20], action: 'walk' }, // 抄林间小路回家
      { time: [1140, 1260], scene: 'farm', spot: [6, 26], action: 'sit' },   // 晚饭编草绳
      { time: [1260, 1440], scene: 'farm', spot: [6, 26], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 480], scene: 'farm', spot: [6, 26], action: 'sleep' },
      { time: [480, 660], scene: 'farm', spot: [6, 26], action: 'work' },    // 屋里修农具
      { time: [660, 720], scene: 'farm', spot: [6, 26], action: 'sit' },
      { time: [720, 1020], scene: 'town', spot: [8, 34], action: 'work' },   // 动物店帮忙
      { time: [1020, 1080], scene: 'town', spot: [14, 18], action: 'stand' }, // 杂货店买种子
      { time: [1080, 1200], scene: 'town', spot: [44, 32], action: 'sit' },  // 酒吧角落躲雨
      { time: [1200, 1440], scene: 'farm', spot: [6, 26], action: 'sleep' },
    ],
    gifts: {
      love: ['pumpkin', 'cheese', 'mayonnaise', 'field_snack', 'sunflower'],
      like: ['egg', 'milk', 'tomato', 'corn', 'wheat', 'bread'],
      neutral: 'default',
      dislike: ['sardine', 'sap', 'sea_urchin'],
      hate: ['trash', 'driftwood'],
    },
    dialogues: {
      first: '你、你好……我叫麦冬，就住在农场东边的小屋。有、有什么牲口上的事，可以去苜蓿婶的店里找我……',
      heart0: [
        '鸡、鸡要顺着毛摸……啊，我是说，摸鸡的时候，要顺毛。',
        '田里的活儿，你比我懂……我就不多嘴了。',
        '苜蓿婶说我话太少。可、可是跟动物说话，它们从不嫌我笨。',
      ],
      heart2: [
        '你家的地翻得真整齐……我、我偷偷学了两手，你别笑话。',
        '今早母鸡下了个双黄蛋！……送、送给你。就当我，谢谢你看我喂鸡。',
        '你要是忙不过来……我可以帮忙。我力气，其实不小的。',
      ],
      heart4: [
        '我爹娘走得早，是苜蓿婶把我拉扯大的。她说我属牛的，认死理，也认人。',
        '动物不会说话，可谁对它好，它一辈子记得。人……人是不是也这样？',
        '跟你说话，我好像不怎么结巴了。……奇怪了。',
      ],
      heart6: [
        '昨、昨天给你菜圃拔草的时候，把你种的向日葵看了好久。它朝着你家窗户开。',
        '苜蓿婶问我最近老往农场跑什么。我说是学技术……其实、其实不全是。',
        '你要是哪天出门远行……提前说一声。我好帮你照看鸡群。……还有，等你回来。',
      ],
      heart8: [
        '我攒了句话，练了三天了。“我、我喜欢你。”……说、说出来了！',
        '我打了对草编的小蚂蚱，一只给你，一只给我。这样走到哪，都、都是一对。',
        '你别看我瘦，挑两桶水走三里地不歇脚。以后……以后家里重活都归我。',
      ],
      heart10: [
        '往后你种的每一垄地，我都陪你浇水。一、一辈子那种陪。',
        '有你在，我连睡觉都踏实。鸡窝里那只抱窝的母鸡，都没我安心。',
      ],
      rain: [
        '下雨天鸡不爱出窝……人也别淋着，蓑衣给你挂门口了。',
        '雨打在草垛上的味道，你闻闻，是甜的。',
      ],
      festival_spring: ['春汛节我给鸡群也加餐了。过节嘛，大家都要吃点好的。'],
      festival_summer: ['渔火节的灯真好看……我、我在一盏灯上写了你的名字。不许笑！'],
      festival_autumn: ['丰收宴上那道烤南瓜，是我种的。你、你多吃一块，我就高兴。'],
      festival_winter: ['暖星节，鸡要进暖棚，人要吃热乎的。这碗热汤，先、先给你。'],
      birthdayGift: {
        love: '今、今天是我生日……你居然记得！这是我最想要的！我、我今晚肯定睡不着了！',
        like: '谢、谢谢！你记得我生日，我……我去把这只蛋炒了给你下酒！',
        neutral: '谢、谢谢。生日有人惦记，真好。',
        dislike: '……谢、谢谢。就是，下次，不用这么破费……嗯。',
        hate: '呜……你、你是不是记错日子了？今天是我生日诶……',
      },
      giftReaction: {
        love: '这、这是给我的？！我、我不是做梦吧？！你掐我一下……算了别掐，疼！',
        like: '谢、谢谢！我会好好珍惜的！',
        neutral: '谢、谢谢……',
        dislike: '……这、这个，我用不上。你自己留着吧。',
        hate: '呜……你、你别这样。鸡都不吃这个……',
      },
    },
    heartEvents: [
      {
        hearts: 2, scene: 'farm', time: [480, 720],
        script: [
          { type: 'move', who: 'npc', to: [8, 32] },
          { type: 'say', who: 'npc', text: '不、不好了！芦花又越狱了！最会下蛋的那只！' },
          { type: 'say', who: 'npc', text: '它一受惊就往草丛里钻……你、你帮我堵东边，我从西边包抄！' },
          { type: 'choice', prompt: '芦花朝你这边冲过来了！', options: [
            { text: '俯身稳稳抱住它。', hearts: 30 },
            { text: '伸脚去拦。', hearts: -10 },
          ] },
          { type: 'emo', who: 'npc', emo: 'note' },
          { type: 'say', who: 'npc', text: '抓、抓到了！你抱鸡的姿势好温柔……它一点都不挣扎。谢谢你。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 4, scene: 'forest', time: [840, 1080],
        script: [
          { type: 'move', who: 'npc', to: [36, 22] },
          { type: 'say', who: 'npc', text: '嘘，小声点。草窠里有只兔子，腿被藤条勒伤了，我刚给它敷上草药。' },
          { type: 'say', who: 'player', text: '要带回镇上给安宁看看吗？' },
          { type: 'say', who: 'npc', text: '不、不用惊动大家。我天天来换药，一周就能好。……你要是有空，陪我一起来吗？' },
          { type: 'choice', prompt: '他眼巴巴地看着你。', options: [
            { text: '每天都来，说定了。', hearts: 40 },
            { text: '让他自己小心。', hearts: 0 },
          ] },
          { type: 'say', who: 'npc', text: '真、真的？！那、那说好了！拉钩！……我、我不是小孩子，就是、就是高兴！' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 6, scene: 'town', time: [840, 1020],
        script: [
          { type: 'move', who: 'npc', to: [8, 34] },
          { type: 'say', who: 'npc', text: '苜蓿婶，你别说了……什么叫我“心思不在牲口上，在农场上”……' },
          { type: 'emo', who: 'npc', emo: 'sweat' },
          { type: 'say', who: 'npc', text: '啊！你、你什么时候来的？！没、没听见什么吧？' },
          { type: 'choice', prompt: '麦冬的耳朵红透了。', options: [
            { text: '我什么都没听见，就听见“农场”两个字。', hearts: 30 },
            { text: '我全都听见了哦。', hearts: -10 },
          ] },
          { type: 'say', who: 'npc', text: '呜……你、你故意逗我。……不过，是实话。我心思，确实在农场上。在你那儿。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 8, scene: 'farm', time: [1020, 1200],
        script: [
          { type: 'move', who: 'npc', to: [10, 28] },
          { type: 'say', who: 'npc', text: '带你去看个地方。……屋后山坡，我从没跟别人说过。' },
          { type: 'say', who: 'npc', text: '看，满坡的野花。每年春天我都一个人来看。今年……今年想带你来。' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'say', who: 'npc', text: '我嘴笨，说不出好听的。但这片山坡，往后就是我们俩的了。你、你愿意吗？' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
    ],
    spouseHelp: ['feed', 'water'],
  },
  {
    id: 'morris',
    name: '莫染',
    title: '旅行画家',
    birthday: { season: 1, day: 27 },
    home: 'town',
    scene: 'town',
    marriage: true,
    colorScheme: { skin: '#f5d9bd', hair: '#b46a3c', shirt: '#d9c26a', pants: '#5e5480' },
    personality: ['浪漫', '漂泊', '敏锐'],
    schedule: [
      { time: [360, 540], scene: 'town', spot: [46, 26], action: 'sleep' },  // 酒吧楼上租房
      { time: [540, 720], scene: 'town', spot: [28, 24], action: 'work' },   // 广场写生
      { time: [720, 840], scene: 'town', spot: [28, 36], action: 'work' },   // 河边画桥
      { time: [840, 960], scene: 'beach', spot: [20, 24], action: 'work' },  // 沙滩画海
      { time: [960, 1080], scene: 'beach', spot: [32, 20], action: 'sit' },  // 码头啃面包
      { time: [1080, 1260], scene: 'forest', spot: [40, 30], action: 'shop' }, // 画具车出摊（周五周日开集）
      { time: [1260, 1380], scene: 'town', spot: [44, 32], action: 'sit' },  // 酒吧小酌
      { time: [1380, 1440], scene: 'town', spot: [46, 26], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 540], scene: 'town', spot: [46, 26], action: 'sleep' },
      { time: [540, 720], scene: 'town', spot: [46, 26], action: 'work' },   // 屋里画小幅
      { time: [720, 780], scene: 'town', spot: [46, 26], action: 'sit' },
      { time: [780, 1020], scene: 'town', spot: [44, 32], action: 'sit' },   // 酒吧窗边画雨
      { time: [1020, 1080], scene: 'town', spot: [14, 18], action: 'stand' }, // 杂货店补给
      { time: [1080, 1260], scene: 'town', spot: [46, 26], action: 'work' },
      { time: [1260, 1380], scene: 'town', spot: [44, 32], action: 'sit' },
      { time: [1380, 1440], scene: 'town', spot: [46, 26], action: 'sleep' },
    ],
    gifts: {
      love: ['rainbow_shell', 'poppy', 'fairyrose', 'starfruit', 'wine'],
      like: ['sunflower', 'tulip', 'bluejazz', 'topaz', 'juice', 'salad'],
      neutral: 'default',
      dislike: ['coal', 'stone', 'clay'],
      hate: ['trash', 'bait'],
    },
    dialogues: {
      first: '别动——就保持这个姿势。三秒。……好了。初次见面，我是莫染，走到哪画到哪的那种人。你逆光的轮廓，值得这三秒。',
      heart0: [
        '汐溪镇的蓝很特别。海边是钴蓝，镇子上空是灰蓝，你的农场……是带绿意的湖蓝。',
        '我的画具车周五和周日在森林路口开集，卖画，也卖些旅途淘来的小玩意。',
        '画画和种地一样，都是把空白变成点什么。只不过你用的是种子，我用的是颜料。',
      ],
      heart2: [
        '昨天画黄昏，调色盘里多出一格说不清的暖色。我想了很久，那是你农场灯亮起来的颜色。',
        '旅途中我画过一百座镇子，每座我都问同一个问题：这里值不值得留下？',
        '你身上有种“扎了根”的踏实感。我们这种飘着的人，最缺的就是这个。',
      ],
      heart4: [
        '我为什么一直走？小时候家里穷，墙是报纸糊的。我发誓要去看遍全世界的颜色。',
        '可是走得越远，越觉得——最美的颜色可能不在远方，在某个愿意等你回来的窗口。',
        '你猜我画了多少张汐溪镇的海？三十七张。每一张的角落里，都有同一片农场。',
      ],
      heart6: [
        '今天写生走神了，画海里全是你的影子。这张画我撕了……骗你的，我怎么舍得。',
        '画廊来信邀我办巡展，要去很远的城市。我回信只写了一句：我再想想。',
        '你说，一个人把行李收拾好了又拆开，拆开了又收拾，是不是一种病？',
      ],
      heart8: [
        '我决定了。巡展不去。汐溪镇的春天我还没画够，汐溪镇的人……我更没看够。',
        '给你看我速写本的最后一页。画了一个人站在田里。往后每一本，最后一页都是这个构图。',
        '漂泊的人一旦想停下，就是真的停下了。你让我想停下。这句话，我只说一遍。',
      ],
      heart10: [
        '往后我的画室，就是你的农场。我的模特，一辈子只有一个。',
        '世界那么大，我把万水千山都画遍了，最后想挂在家里的，只有一幅你。',
      ],
      rain: [
        '雨天不能外出写生，正好画些凭记忆的东西——比如，记忆里的某个人。',
        '雨是天在调色。你看那云层，灰里透着紫，多高级。',
      ],
      festival_spring: ['春汛节我要画一幅大画：全镇的人在河边放春灯。你站最中间，好不好？'],
      festival_summer: ['渔火节的灯火漂在海面上，像打翻了的调色盘。这一夜，颜料都是多余的。'],
      festival_autumn: ['丰收宴的颜色最足：金的南瓜、红的辣椒、还有你笑起来的样子。'],
      festival_winter: ['暖星节的雪是冷的，篝火是暖的，人心是……你猜是什么颜色的？'],
      birthdayGift: {
        love: '你还记得我的生日……这件礼物，我要画进画里，题款就写“某年夏日，得之于你”。',
        like: '生日礼物！谢谢。你的审美，我一向是信服的。',
        neutral: '哦，生日礼物。谢谢，你的心意我收下了。',
        dislike: '……谢谢。颜色和我不太合，但心意是暖的。',
        hate: '拿走。我生日这天，别让我看见这种颜色，辣眼睛。',
      },
      giftReaction: {
        love: '天哪——这正是我想要的！你怎么知道？！你眼里也有颜色，我早看出来了。',
        like: '好看。你的眼光，比镇上大多数人都好。',
        neutral: '谢谢，我收下了。',
        dislike: '……艺术家对这个一般不太感兴趣。',
        hate: '请拿走。我的画具车不收废品。',
      },
    },
    heartEvents: [
      {
        hearts: 2, scene: 'town', time: [600, 1020],
        script: [
          { type: 'move', who: 'npc', to: [28, 24] },
          { type: 'say', who: 'npc', text: '站住，别动。……好了。抱歉，职业病，你刚才扛锄头的姿势太入画了。' },
          { type: 'say', who: 'player', text: '你在画我？' },
          { type: 'say', who: 'npc', text: '速写而已。你看——三笔就是一个轮廓。种地的人身上有股劲儿，城里画一百个模特都找不着。' },
          { type: 'emo', who: 'player', emo: 'surprise' },
          { type: 'say', who: 'npc', text: '这张送你。背面我写了日期。以后你会知道，我画你的次数，远不止这一次。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 4, scene: 'beach', time: [900, 1140], weather: 'sunny',
        script: [
          { type: 'move', who: 'npc', to: [20, 24] },
          { type: 'say', who: 'npc', text: '来，坐。这个位置看海，是一天里颜色变得最快的时候。' },
          { type: 'say', who: 'npc', text: '我走过很多地方，海都长得差不多。可汐溪镇的海……总能让我想起一些不想忘掉的事。' },
          { type: 'choice', prompt: '她望着海面，声音低了下来。', options: [
            { text: '比如什么事？', hearts: 20 },
            { text: '那就别走了。', hearts: 40 },
          ] },
          { type: 'say', who: 'npc', text: '“别走了”……你说得真轻巧。可你知道吗，这三个字，我等了好多地方，好多人。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 6, scene: 'forest', time: [1080, 1260], weather: 'rainy',
        script: [
          { type: 'move', who: 'npc', to: [40, 30] },
          { type: 'say', who: 'npc', text: '快进来！画具车的棚子小，挤一挤……我的画可以淋，人不行。' },
          { type: 'say', who: 'npc', text: '这张画毁了，画布全花了。……没关系，反正画的也不是什么重要的东西。' },
          { type: 'say', who: 'player', text: '画的是什么？' },
          { type: 'say', who: 'npc', text: '……一个农场。还有农场里的人。……雨太大，你靠过来点，别淋着。' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 8, scene: 'town', time: [1140, 1260],
        script: [
          { type: 'move', who: 'npc', to: [46, 26] },
          { type: 'say', who: 'npc', text: '上来，给你看个东西。我租的小阁楼，今晚办一场画展——观众只有一位。' },
          { type: 'say', who: 'npc', text: '十二张画。春耕的、夏锄的、秋收的、冬藏的……主角都是同一个人。' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'say', who: 'npc', text: '画展的名字我想好了，就叫《归处》。画家停笔的地方，就是她的归处。……你懂吗？' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
    ],
    spouseHelp: ['water', 'breakfast'],
  },
  {
    id: 'suwanyin',
    name: '苏晚吟',
    title: '酒吧驻唱',
    birthday: { season: 2, day: 8 },
    home: 'town',
    scene: 'town',
    marriage: true,
    colorScheme: { skin: '#e8c39e', hair: '#31221c', shirt: '#7e3b5e', pants: '#2e2a38' },
    personality: ['慵懒', '深情', '夜行性'],
    schedule: [
      { time: [360, 600], scene: 'town', spot: [46, 26], action: 'sleep' },  // 上午补觉
      { time: [600, 660], scene: 'town', spot: [46, 26], action: 'sit' },    // 迟来的早饭
      { time: [660, 840], scene: 'town', spot: [44, 32], action: 'work' },   // 酒吧练歌调琴
      { time: [840, 960], scene: 'town', spot: [28, 24], action: 'walk' },   // 广场晒太阳
      { time: [960, 1020], scene: 'beach', spot: [20, 24], action: 'walk' }, // 海边找灵感
      { time: [1020, 1080], scene: 'town', spot: [46, 26], action: 'sit' },  // 写词
      { time: [1080, 1260], scene: 'town', spot: [44, 32], action: 'work' }, // 驻唱
      { time: [1260, 1380], scene: 'town', spot: [44, 32], action: 'sit' },  // 打烊后小酌
      { time: [1380, 1440], scene: 'town', spot: [46, 26], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 600], scene: 'town', spot: [46, 26], action: 'sleep' },
      { time: [600, 660], scene: 'town', spot: [46, 26], action: 'sit' },
      { time: [660, 1020], scene: 'town', spot: [44, 32], action: 'work' },  // 雨天练新曲
      { time: [1020, 1080], scene: 'town', spot: [44, 32], action: 'sit' },  // 酒吧晚饭
      { time: [1080, 1260], scene: 'town', spot: [44, 32], action: 'work' },
      { time: [1260, 1380], scene: 'town', spot: [44, 32], action: 'sit' },
      { time: [1380, 1440], scene: 'town', spot: [46, 26], action: 'sleep' },
    ],
    gifts: {
      love: ['wine', 'beer', 'grape', 'amethyst', 'spicy_noodles'],
      like: ['coffee', 'juice', 'hops', 'salad', 'blueberry', 'bread'],
      neutral: 'default',
      dislike: ['hay', 'fiber', 'wood'],
      hate: ['trash', 'soggy_newspaper'],
    },
    dialogues: {
      first: '嗯……？这个点儿有人来酒吧？我是苏晚吟，晚上在这儿唱歌。白天嘛……白天是用来睡觉和装睡的。',
      heart0: [
        '白天的我是半价处理的，晚上的我才不打折。想听正经歌，天黑以后再来。',
        '新面孔。坐吧台还是角落？角落好，适合发呆，也适合装没看见我。',
        '顾老板说我唱歌的时候像换了个人。错了，是别人醒着的时候我懒得换回来。',
      ],
      heart2: [
        '昨晚你走了以后，我多唱了一首。歌名？不告诉你。反正你没听见，亏的是你。',
        '海月说你帮她收过蟹笼。不错嘛，肯下力气的人，听歌都认真些。',
        '今天中午的太阳真好，好到我把被子晒了，顺便把自己也晒了晒。',
      ],
      heart4: [
        '我写歌从来写不完结尾。顾老板说我是懒。其实是……我怕写完了，就该唱给离开的人听了。',
        '以前在城里驻唱，台下很吵，没人真听。汐溪镇好，海浪会打拍子。',
        '你白天种地，晚上来听我唱歌。你说，咱俩谁的作息更不像话？',
      ],
      heart6: [
        '昨晚写了段旋律，哼了一宿。开头是你推开门的声响，结尾……还没想好。',
        '奇怪，你坐在台下，我唱歌就会往那边看。台风都让你带偏了。',
        '别熬夜。……哦，你是在等我散场啊？那，今晚最后一首，点给你。',
      ],
      heart8: [
        '这首歌的结尾我写好了。你猜怎么着——是个有人等我回家的结尾。',
        '我唱过一百首情歌，今天才知道它们写的都是同一个人。今晚这首，不许走神。',
        '如果你哪天不在了，我的歌大概全会跑调。所以，不许走。这是歌手的请求。',
      ],
      heart10: [
        '往后我的每一首歌，第一个听众是你，最后一个也是你。',
        '深夜散场别怕黑，我送你。路灯下我唱歌给你听，跑调也不许笑。',
      ],
      rain: [
        '雨声是最好的伴奏。今晚的歌，会比平时温柔三个度。',
        '下雨天适合写歌，也适合想人。你猜我在干哪样？……两样都在。',
      ],
      festival_spring: ['春汛节我有一首开场的歌。第一句我打算看着你的眼睛唱。'],
      festival_summer: ['渔火节的灯漂到海中央的时候，我会唱那首《归航》。别哭，忍住。'],
      festival_autumn: ['丰收宴的歌单我排好了：三首热闹的，一首只给你一个人的。'],
      festival_winter: ['暖星节就该围炉听歌。今晚的歌单我改了八遍，因为你说过喜欢慢的。'],
      birthdayGift: {
        love: '你记得我的生日……今晚我推掉所有歌，只给你一个人唱。这是歌手的回礼。',
        like: '生日礼物？谢谢。今晚你的点歌，我插队安排。',
        neutral: '哦，谢谢。生日嘛，有歌听就够了，还有礼物，赚了。',
        dislike: '……收下吧。歌手对礼物不挑，对人挑。你算过了人这关。',
        hate: '这位听众，生日礼物送成这样，今晚你的点歌环节取消了。',
      },
      giftReaction: {
        love: '——！你怎么知道我想要这个？今晚的安可曲，归你了。',
        like: '不错嘛，懂我。回头写首歌谢你。',
        neutral: '谢了。',
        dislike: '……歌手靠嗓子吃饭，不靠这个。拿回去吧。',
        hate: '拿开。我的琴闻见这个味儿都要跑调。',
      },
    },
    heartEvents: [
      {
        hearts: 2, scene: 'town', time: [1140, 1260],
        script: [
          { type: 'move', who: 'npc', to: [44, 32] },
          { type: 'say', who: 'npc', text: '今晚人不多。难得。过来，点首歌吧，新听众有优待。' },
          { type: 'choice', prompt: '点什么歌？', options: [
            { text: '唱你最喜欢的那首。', hearts: 30 },
            { text: '随便，你唱什么都行。', hearts: 10 },
          ] },
          { type: 'say', who: 'npc', text: '让我唱最喜欢的？贪心。……好吧。这首歌，平时我可不舍得唱。' },
          { type: 'emo', who: 'npc', emo: 'note' },
          { type: 'say', who: 'npc', text: '……唱完了。你听得眼睛都不眨，害我差点忘词。下次还来吗？' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 4, scene: 'beach', time: [1200, 1320],
        script: [
          { type: 'move', who: 'npc', to: [20, 24] },
          { type: 'say', who: 'npc', text: '嘘，听。浪打上来、退下去，中间有半拍空白。我写歌就找这半拍。' },
          { type: 'say', who: 'player', text: '半拍空白？' },
          { type: 'say', who: 'npc', text: '嗯。话到嘴边没说出来的半拍，最动人。比如……算了，今晚不说。' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'say', who: 'npc', text: '风大，往我这边靠一点。……别误会，我是怕你着凉，耽误明晚来听歌。' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 6, scene: 'town', time: [1200, 1380], weather: 'rainy',
        script: [
          { type: 'move', who: 'npc', to: [44, 32] },
          { type: 'say', who: 'npc', text: '打雷把电闸劈跳了。顾老板点蜡烛去了……正好，今晚会场只剩你一位。' },
          { type: 'say', who: 'npc', text: '烛光演唱会，不插电。这种场子，歌手是要把心掏出来唱的。听好了。' },
          { type: 'emo', who: 'npc', emo: 'note' },
          { type: 'say', who: 'npc', text: '……唱完了。这首歌没有名字，要不，用你的名字命名？' },
          { type: 'choice', prompt: '烛光里她抱着琴看你。', options: [
            { text: '好，这是我的荣幸。', hearts: 50 },
            { text: '还是叫《雨夜》吧。', hearts: 0 },
          ] },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
      {
        hearts: 8, scene: 'town', time: [1260, 1380],
        script: [
          { type: 'move', who: 'npc', to: [28, 24] },
          { type: 'say', who: 'npc', text: '散场了。陪我走一段吧，夜里的广场没有人，回声特别好。' },
          { type: 'say', who: 'npc', text: '你听——（她轻轻哼了一段新旋律）……这首，是最后一首写不完结尾的歌了。' },
          { type: 'say', who: 'npc', text: '因为结尾我打算留给你。什么时候你点头，这首歌什么时候算写完。' },
          { type: 'emo', who: 'npc', emo: 'heart' },
          { type: 'fade', to: 'black', ms: 400 },
          { type: 'fade', to: 'clear', ms: 400 },
        ],
      },
    ],
    spouseHelp: ['breakfast', 'fence'],
  },
  // ───────────────────────── 非可结婚 ×8 ─────────────────────────
  {
    id: 'robin',
    name: '穆青',
    title: '镇长',
    birthday: { season: 0, day: 9 },
    home: 'town',
    scene: 'town',
    marriage: false,
    colorScheme: { skin: '#f0c8a0', hair: '#5a4632', shirt: '#4e6e8e', pants: '#3c3c34' },
    personality: ['干练', '念旧', '操心'],
    schedule: [
      { time: [360, 420], scene: 'town', spot: [36, 20], action: 'sleep' },
      { time: [420, 540], scene: 'town', spot: [36, 20], action: 'sit' },    // 早饭看公文
      { time: [540, 720], scene: 'town', spot: [36, 20], action: 'work' },   // 镇公所办公
      { time: [720, 780], scene: 'town', spot: [28, 24], action: 'walk' },   // 广场巡查
      { time: [780, 840], scene: 'town', spot: [26, 22], action: 'stand' },  // 更新公告板
      { time: [840, 960], scene: 'town', spot: [12, 40], action: 'work' },   // 河边栈道修缮
      { time: [960, 1020], scene: 'town', spot: [44, 32], action: 'sit' },   // 下午茶歇
      { time: [1020, 1140], scene: 'town', spot: [16, 28], action: 'walk' }, // 走访民宅
      { time: [1140, 1260], scene: 'town', spot: [36, 20], action: 'sit' },  // 晚饭
      { time: [1260, 1320], scene: 'town', spot: [36, 20], action: 'work' }, // 夜批公文
      { time: [1320, 1440], scene: 'town', spot: [36, 20], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 420], scene: 'town', spot: [36, 20], action: 'sleep' },
      { time: [420, 540], scene: 'town', spot: [36, 20], action: 'sit' },
      { time: [540, 1020], scene: 'town', spot: [36, 20], action: 'work' },  // 雨天集中办公
      { time: [1020, 1140], scene: 'town', spot: [36, 20], action: 'sit' },
      { time: [1140, 1260], scene: 'town', spot: [44, 32], action: 'sit' },  // 酒吧听民声
      { time: [1260, 1320], scene: 'town', spot: [36, 20], action: 'work' },
      { time: [1320, 1440], scene: 'town', spot: [36, 20], action: 'sleep' },
    ],
    gifts: {
      love: ['hardwood', 'pumpkin_soup', 'jade', 'pumpkin', 'coffee'],
      like: ['wood', 'stone', 'bread', 'corn', 'tulip', 'field_snack'],
      neutral: 'default',
      dislike: ['eel', 'sea_urchin', 'sap'],
      hate: ['trash', 'driftwood'],
    },
    dialogues: {
      first: '欢迎落户汐溪镇。我是镇长穆青，木工出身，镇上的房子、农舍扩建都归我管。有事去镇公所找我，门常开着。',
      heart0: [
        '农场东边那条去森林的路，雨天容易积水，绕两步走桥。',
        '你农场那栋老农舍是我师父三十年前盖的。梁还好好的，手艺这东西，骗不了人。',
        '镇公所的登记簿上，你是汐溪镇第八十一户。好好干，别给这数字丢脸。',
      ],
      heart2: [
        '春耕的报表我看了，你那块地的复耕进度比我想的快。不错。',
        '要扩农舍、建鸡舍，拿图纸来找我。好木头我有，就看你的规划了。',
        '我当镇长八年，木匠活儿没撂下。手一闲，心里就长草。',
      ],
      heart4: [
        '我师父临走前说，盖房子和带镇子一个道理：先把地基打正，别怕慢。',
        '镇西那座老社区中心，我一直想修。唉，一年拖一年……你要是有心，咱们慢慢把它拾掇起来。',
        '你这孩子，身上有股踏实的劲儿，像我年轻的时候。',
      ],
      heart6: [
        '昨晚翻出师父的墨斗。线一弹，三十年前就弹到今天了。老物件比人念旧。',
        '镇务会上我提了你的农场当复耕样板。别骄傲，样板的活儿只会更多。',
        '有难处别硬扛。镇公所的门，对你从来不上锁。',
      ],
      heart8: [
        '我把你当自家人看了。往后镇里的事，也想听听你的想法。',
        '汐溪镇往后几十年的模样，说不得要靠你们这代人。我看着，放心。',
        '农舍升级三期的图纸我给你留了一份。什么时候想用，随时来。',
      ],
      heart10: [
        '你早就是汐溪镇的人了。不是登记簿上那种，是心里那种。',
        '等我卸任那天，镇长的印章交给谁不好说，但师父的墨斗，我想留给你。',
      ],
      rain: [
        '雨天路滑，栈道的钉子我都敲了一遍。你也慢点走。',
        '落雨不碍办公。倒是你，地里的排水沟清过没有？',
      ],
      festival_spring: ['春汛节开幕的锣，每年都由我敲。今年你站第一排，沾点开年的彩头。'],
      festival_summer: ['渔火节的灯架、摊位，都是镇里提前半月备的。图的就是这一夜热闹。'],
      festival_autumn: ['丰收宴的账本最是好看——家家户户有余粮，镇长就这一年最踏实。'],
      festival_winter: ['暖星节，一年的账都算完了。剩下的，就是围着火，把明年盼好。'],
      birthdayGift: {
        love: '还记得我的生日……好，好。这份心意比什么贺词都重。谢谢你，孩子。',
        like: '生日礼物？难为你记着。回头镇公所的好茶，给你沏一壶。',
        neutral: '哦，谢谢。让你费心了。',
        dislike: '……心意领了。下次别破费在这上头了。',
        hate: '拿回去吧。镇长的生日不收这个，谁的生日都不该收这个。',
      },
      giftReaction: {
        love: '这、这可是好东西！你有心了。镇公所的门槛，你随便踏！',
        like: '嗯，合用。谢谢。',
        neutral: '哦，多谢。',
        dislike: '……我用不上这个。你拿回去。',
        hate: '收回去。这东西，进不了镇公所的门。',
      },
    },
    heartEvents: [],
    spouseHelp: [],
  },
  {
    id: 'pierre',
    name: '常满仓',
    title: '杂货店主',
    birthday: { season: 1, day: 4 },
    home: 'town',
    scene: 'town',
    marriage: false,
    colorScheme: { skin: '#f5d9bd', hair: '#3c3228', shirt: '#8e6e3c', pants: '#4a4038' },
    personality: ['精明', '好客', '算盘精'],
    schedule: [
      { time: [360, 420], scene: 'town', spot: [14, 14], action: 'sleep' },
      { time: [420, 480], scene: 'town', spot: [14, 14], action: 'sit' },    // 早饭对账
      { time: [480, 540], scene: 'town', spot: [14, 18], action: 'work' },   // 开店备货
      { time: [540, 1020], scene: 'town', spot: [14, 18], action: 'shop' },  // 营业 9:00-17:00
      { time: [1020, 1080], scene: 'town', spot: [28, 24], action: 'walk' }, // 广场散步
      { time: [1080, 1140], scene: 'town', spot: [44, 32], action: 'sit' },  // 酒吧小酌
      { time: [1140, 1260], scene: 'town', spot: [14, 14], action: 'sit' },  // 盘账
      { time: [1260, 1440], scene: 'town', spot: [14, 14], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 420], scene: 'town', spot: [14, 14], action: 'sleep' },
      { time: [420, 480], scene: 'town', spot: [14, 14], action: 'sit' },
      { time: [480, 540], scene: 'town', spot: [14, 18], action: 'work' },
      { time: [540, 1080], scene: 'town', spot: [14, 18], action: 'shop' },  // 雨天照常营业
      { time: [1080, 1200], scene: 'town', spot: [44, 32], action: 'sit' },
      { time: [1200, 1260], scene: 'town', spot: [14, 14], action: 'sit' },
      { time: [1260, 1440], scene: 'town', spot: [14, 14], action: 'sleep' },
    ],
    gifts: {
      love: ['starfruit', 'ancientfruit', 'coffee', 'wine', 'melon'],
      like: ['pumpkin', 'tomato', 'blueberry', 'cheese', 'bread', 'jade'],
      neutral: 'default',
      dislike: ['fiber', 'sap', 'clay'],
      hate: ['trash', 'bait'],
    },
    dialogues: {
      first: '哎呀呀，新农场主大驾光临！我是常满仓，这间杂货店就是我。种子、肥料、背包扩充，样样都有，样样公道！',
      heart0: [
        '做生意讲究个你来我往。你照顾我的店，我保你的货，童叟无欺。',
        '看天吃饭，看价出货。今年的种子行情，我可是摸得门儿清。',
        '柜台那把算盘跟了我二十年。噼啪一响，一天的账就齐了。',
      ],
      heart2: [
        '你是常客，给你透个底：过季前囤点好种，开春能赚个差价。这话我只跟你说。',
        '芸香总念叨你，说你礼数周到。年轻人里，难得。',
        '进货的渠道我跑了十五年。全镇的针头线脑，都从我这条线上过。',
      ],
      heart4: [
        '早年我也种过地，赔得精光才改的买卖。所以看你把农场做起来，我是真高兴。',
        '账本上你的名字后面，我从来不画催款圈。信誉这东西，是相互的。',
        '等你的农场成了气候，咱们谈笔长期供货？你出好货，我出好价。',
      ],
      heart6: [
        '昨晚盘账，顺手给你算了笔长远账。照这么干，三年，你的农场能翻番。',
        '别人砍价我头疼，你砍价……我乐意让两分。这叫什么？这叫交情价。',
        '满仓满仓，我爹盼我仓廪常满。如今仓是满了，就是进货时没人搭手。……你懂我意思吧？',
      ],
      heart8: [
        '往后你就是店里最要紧的贵客。货先紧着你挑，价先让着你算。',
        '这镇上的买卖人不少，能让我常满仓打心底服气的，你是头一个。',
        '哪天你要扩店面、做加工，缺本钱说话。我投你，不看利息，看人。',
      ],
      heart10: [
        '你我的交情，早不在秤上了。这点，我心里有数，你心里也有数。',
        '往后店里的好茶，永远给你留一罐。账房先生不在，你就是东家。',
      ],
      rain: [
        '雨天买卖清淡，正好理货。你随便看，看中了算你便宜。',
        '落雨天，店里暖和。进来躲躲，不买也不打紧。',
      ],
      festival_spring: ['春汛节的摊位费又涨了，可我还是第一个抢的位置——图个开市大吉！'],
      festival_summer: ['渔火节的灯是我家芸香糊的，别的不敢说，比镇口那家结实！'],
      festival_autumn: ['丰收宴上的干货炒货，一半出自我家店。吃饱喝足，明年多照顾我生意！'],
      festival_winter: ['暖星节盘点一年的账：进得多，出得也多，结余是满镇子的笑脸。值了！'],
      birthdayGift: {
        love: '生日礼物？！哎呀呀，这礼可太贵重了！往后你进货，一律成本价！',
        like: '难为你记着我的生日！回头给你包一包新到的点心！',
        neutral: '哦，谢谢。让你破费了。',
        dislike: '……心意领了。就是这东西，店里可真不缺。',
        hate: '拿走拿走！我生日你就送这个？这买卖做得亏心！',
      },
      giftReaction: {
        love: '好东西！识货的我一眼就看出是好东西！这份情，记下了！',
        like: '嗯，实在。跟你打交道就是痛快。',
        neutral: '哦，多谢。',
        dislike: '……我这儿是杂货店，可也不是什么都要。',
        hate: '拿走！再这样，你的常客折扣可就没了！',
      },
    },
    heartEvents: [],
    spouseHelp: [],
  },
  {
    id: 'yunxiang',
    name: '芸香',
    title: '杂货店老板娘',
    birthday: { season: 2, day: 24 },
    home: 'town',
    scene: 'town',
    marriage: false,
    colorScheme: { skin: '#f7dcc3', hair: '#71563a', shirt: '#c98a6a', pants: '#6b5a4a' },
    personality: ['温柔', '碎嘴', '爱花'],
    schedule: [
      { time: [360, 420], scene: 'town', spot: [14, 14], action: 'sleep' },
      { time: [420, 540], scene: 'town', spot: [14, 14], action: 'work' },   // 做早饭收拾店
      { time: [540, 720], scene: 'town', spot: [14, 18], action: 'shop' },   // 看店
      { time: [720, 780], scene: 'town', spot: [14, 14], action: 'sit' },    // 午饭
      { time: [780, 960], scene: 'town', spot: [18, 26], action: 'work' },   // 门前花圃莳花
      { time: [960, 1020], scene: 'town', spot: [28, 24], action: 'walk' },  // 广场找老姐妹
      { time: [1020, 1140], scene: 'town', spot: [14, 18], action: 'shop' },
      { time: [1140, 1260], scene: 'town', spot: [14, 14], action: 'sit' },  // 晚饭织毛衣
      { time: [1260, 1440], scene: 'town', spot: [14, 14], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 420], scene: 'town', spot: [14, 14], action: 'sleep' },
      { time: [420, 540], scene: 'town', spot: [14, 14], action: 'work' },
      { time: [540, 720], scene: 'town', spot: [14, 18], action: 'shop' },
      { time: [720, 780], scene: 'town', spot: [14, 14], action: 'sit' },
      { time: [780, 1080], scene: 'town', spot: [14, 18], action: 'shop' },  // 雨天守店
      { time: [1080, 1140], scene: 'town', spot: [14, 14], action: 'work' }, // 熬粥
      { time: [1140, 1260], scene: 'town', spot: [14, 14], action: 'sit' },
      { time: [1260, 1440], scene: 'town', spot: [14, 14], action: 'sleep' },
    ],
    gifts: {
      love: ['fairyrose', 'tulip', 'bluejazz', 'jam', 'honey'],
      like: ['sunflower', 'poppy', 'salad', 'bread', 'strawberry', 'field_snack'],
      neutral: 'default',
      dislike: ['coal', 'stone', 'hotpepper'],
      hate: ['trash', 'broken_glasses'],
    },
    dialogues: {
      first: '哎哟，新搬来的孩子吧？我是芸香，满仓家里的。进屋坐，刚沏的花茶。往后缺什么，跟婶子说，别外道。',
      heart0: [
        '门前那排花圃是我侍弄的。庄稼要伺候，花也一样，就是个精心。',
        '满仓那人，嘴上全是生意，心里不坏。你别嫌他算计。',
        '年轻人一个人过，吃饭可不许糊弄。面包在左手第二格货架。',
      ],
      heart2: [
        '昨儿摘了些新茶，给你包了一小包，放柜台上了，记得拿。',
        '你农场的花开得真好，隔着半条街我都瞅见了。是什么种法？教教婶子。',
        '镇上人都说你勤快。勤快人呐，走到哪都招人喜欢。',
      ],
      heart4: [
        '我跟满仓成亲那年，家当就一间铺面两床被子。日子嘛，是一针一线缝出来的。',
        '花这东西，你对它说话，它开得就是精神些。人也一样，得有人疼。',
        '你一进门，店里都亮堂。以后常来，就当这儿是半个家。',
      ],
      heart6: [
        '给你织了副手套，就照着你上回买种子的尺寸估的。试试，不合手我再改。',
        '满仓说你做事稳当。他那人夸人金贵，一年夸不了三回。',
        '花圃里新开了几株好颜色的，我给你留了种。开春拿去种。',
      ],
      heart8: [
        '在我心里，你早跟自家孩子一样了。饿了来吃饭，乏了来喝茶。',
        '这罐蜜是我自己收的，特意留的最大一罐给你。别推，推了婶子要恼。',
        '看你农场一年比一年好，婶子比自己挣钱还高兴。',
      ],
      heart10: [
        '往后逢年过节，你要是不来，我这桌子饭菜就摆不圆。',
        '店里的茶、家里的饭、婶子的心，给你留的都是头一份。',
      ],
      rain: [
        '落雨了，快进屋。我给你焙着花生呢，趁热。',
        '雨天花圃不用浇水，倒省了我一番功夫。坐，喝口热的。',
      ],
      festival_spring: ['春汛节我蒸了两笼花糕，一笼给店里，一笼……给你留着呢。'],
      festival_summer: ['渔火节的灯是我糊的，上头画了并蒂莲。图个成双成对的好意头。'],
      festival_autumn: ['丰收宴上多吃点，看你瘦的。来，这块最大的给你。'],
      festival_winter: ['暖星节的围炉茶我煮了桂花的。一年到头，就盼着这一炉团圆。'],
      birthdayGift: {
        love: '还记得婶子的生日……好孩子，好孩子。这礼我收下了，回头给你做身新衣裳！',
        like: '哎哟，生日礼物！谢谢你记着。柜台上那包桂花糖，你拿去。',
        neutral: '谢谢。让你惦记了。',
        dislike: '……谢谢孩子。就是这东西，婶子用不惯。',
        hate: '拿走拿走。生日送这个，你爹没教过你？……罢了，你还小。',
      },
      giftReaction: {
        love: '哎哟——这颜色，这品相！孩子，你可太会挑了！婶子今晚加菜！',
        like: '真好看。还是年轻人眼光好。',
        neutral: '哦，谢谢。',
        dislike: '……婶子不缺这个。你的心意到了就行。',
        hate: '拿走。好好的日子，别拿这个堵心。',
      },
    },
    heartEvents: [],
    spouseHelp: [],
  },
  {
    id: 'marnie',
    name: '苜蓿',
    title: '动物店主',
    birthday: { season: 3, day: 16 },
    home: 'town',
    scene: 'town',
    marriage: false,
    colorScheme: { skin: '#f0c8a0', hair: '#a89a8c', shirt: '#7c6a4e', pants: '#54483c' },
    personality: ['慈祥', '絮叨', '动物痴'],
    schedule: [
      { time: [360, 420], scene: 'town', spot: [8, 30], action: 'sleep' },
      { time: [420, 540], scene: 'town', spot: [8, 34], action: 'work' },   // 开棚放牲口
      { time: [540, 1020], scene: 'town', spot: [8, 34], action: 'shop' },  // 动物店营业
      { time: [1020, 1080], scene: 'town', spot: [6, 40], action: 'work' }, // 割草备料
      { time: [1080, 1140], scene: 'town', spot: [44, 32], action: 'sit' }, // 酒吧晚饭
      { time: [1140, 1200], scene: 'town', spot: [8, 34], action: 'work' }, // 添夜草
      { time: [1200, 1260], scene: 'town', spot: [8, 30], action: 'sit' },
      { time: [1260, 1440], scene: 'town', spot: [8, 30], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 420], scene: 'town', spot: [8, 30], action: 'sleep' },
      { time: [420, 540], scene: 'town', spot: [8, 34], action: 'work' },   // 棚内喂料
      { time: [540, 1020], scene: 'town', spot: [8, 34], action: 'shop' },
      { time: [1020, 1080], scene: 'town', spot: [8, 30], action: 'work' }, // 修栅栏
      { time: [1080, 1140], scene: 'town', spot: [44, 32], action: 'sit' },
      { time: [1140, 1260], scene: 'town', spot: [8, 30], action: 'sit' },
      { time: [1260, 1440], scene: 'town', spot: [8, 30], action: 'sleep' },
    ],
    gifts: {
      love: ['cheese', 'mayonnaise', 'pumpkin', 'wool', 'pumpkin_soup'],
      like: ['egg', 'milk', 'hay', 'corn', 'wheat', 'bokchoy'],
      neutral: 'default',
      dislike: ['stone', 'coal', 'eel'],
      hate: ['trash', 'sap'],
    },
    dialogues: {
      first: '哟，新农场主来了？我是苜蓿，镇上牲口都归我照应。往后要养鸡养鸭，先来婶子这儿挑崽，保准壮实。',
      heart0: [
        '小鸡崽最娇气，头七天不能着凉。记住了？记不住就再来问，婶子不嫌烦。',
        '牲口不会说话，可眼色不会骗人。它们舒坦不舒坦，一看就知道。',
        '干草要晒足三个日头才能进棚。潮了，牲口吃了要闹肚子。',
      ],
      heart2: [
        '麦冬那孩子，手艺是我手把手教的。人腼腆，心热，你多担待。',
        '你农场的鸡舍要是盖起来了，头一窝崽我给你留最精神的。',
        '摸摸我家大黄的头，它可乖了。……看，它喜欢你。牲口的眼，毒着呢。',
      ],
      heart4: [
        '我守了这店三十年。牲口来了一茬又一茬，就跟我的一辈子似的。',
        '麦冬是我拉扯大的。那孩子命苦，可心善，你多来找他玩玩，他高兴。',
        '下雨天棚顶漏，都是麦冬爬上去补的。这孩子，就是不肯说累。',
      ],
      heart6: [
        '你要是想养奶牛，提前说。好奶牛的崽，全镇的牧场我都熟，给你挑。',
        '麦冬最近老哼小曲儿。我问他，他说是跟你学的。你俩……嗯，婶子不多问。',
        '天冷了，拿筐鸡蛋去。别推，推来推去的，见外。',
      ],
      heart8: [
        '你跟麦冬，都是我看着长大的好孩子。往后啊，互相多照应。',
        '往后你的牲口，病了伤了，半夜里也只管来敲门。',
        '店里的事我渐渐放手给麦冬了。我信他，就像信你一样。',
      ],
      heart10: [
        '你早就是婶子家里人了。牲口棚的钥匙，给你也配了一把。',
        '看着你们年轻人把日子过得有滋有味，婶子这辈子，值了。',
      ],
      rain: [
        '下雨天牲口不出棚，活儿反倒更多。料要添，圈要清。',
        '雨一大，棚里潮。我多铺了两层干草，牲口可不能受委屈。',
      ],
      festival_spring: ['春汛节我给牲口都梳了毛。过节嘛，它们也得精精神神的。'],
      festival_summer: ['渔火节我让麦冬带崽子们早早进棚，灯再好看，也比不上它们安生。'],
      festival_autumn: ['丰收宴的奶酪是我做的，用的是头一茬秋奶。你尝尝，可香了。'],
      festival_winter: ['暖星节的棚里要添双份料。牲口暖了，人心就暖了。'],
      birthdayGift: {
        love: '还记得婶子的生日……好孩子，回头我给你留一窝最好的鸡崽！',
        like: '哎哟，生日礼物！谢谢你记着。鸡蛋拿一筐去，别推。',
        neutral: '谢谢。难为你有心。',
        dislike: '……心意领了。就是婶子用不上这个。',
        hate: '拿走。牲口都不闻的东西，拿给婶子做什么。',
      },
      giftReaction: {
        love: '哎哟，这可是稀罕物！好孩子，婶子没白疼你！',
        like: '好东西，婶子收下了。回头有好崽先给你留。',
        neutral: '哦，谢谢。',
        dislike: '……婶子对这个不感冒。拿回去吧。',
        hate: '拿走拿走。棚里的牲口都不待见这个。',
      },
    },
    heartEvents: [],
    spouseHelp: [],
  },
  {
    id: 'gus',
    name: '顾笙',
    title: '酒吧老板',
    birthday: { season: 2, day: 14 },
    home: 'town',
    scene: 'town',
    marriage: false,
    colorScheme: { skin: '#e8b48c', hair: '#2c2620', shirt: '#8e3b3b', pants: '#33302c' },
    personality: ['豪爽', '仗义', '八卦'],
    schedule: [
      { time: [360, 480], scene: 'town', spot: [46, 32], action: 'sleep' },
      { time: [480, 600], scene: 'town', spot: [44, 32], action: 'work' },   // 擦杯备料
      { time: [600, 720], scene: 'town', spot: [14, 18], action: 'stand' }, // 杂货店进货
      { time: [720, 780], scene: 'beach', spot: [32, 20], action: 'stand' }, // 码头收鲜鱼
      { time: [780, 960], scene: 'town', spot: [44, 32], action: 'work' },   // 备菜
      { time: [960, 1320], scene: 'town', spot: [44, 32], action: 'shop' },  // 酒吧营业
      { time: [1320, 1380], scene: 'town', spot: [44, 32], action: 'work' }, // 打烊清扫
      { time: [1380, 1440], scene: 'town', spot: [46, 32], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 480], scene: 'town', spot: [46, 32], action: 'sleep' },
      { time: [480, 600], scene: 'town', spot: [44, 32], action: 'work' },
      { time: [600, 720], scene: 'town', spot: [14, 18], action: 'stand' },  // 雨天不去码头
      { time: [720, 960], scene: 'town', spot: [44, 32], action: 'work' },
      { time: [960, 1320], scene: 'town', spot: [44, 32], action: 'shop' },
      { time: [1320, 1380], scene: 'town', spot: [44, 32], action: 'work' },
      { time: [1380, 1440], scene: 'town', spot: [46, 32], action: 'sleep' },
    ],
    gifts: {
      love: ['beer', 'wine', 'cheese', 'pizza', 'lobster', 'hotpepper'],
      like: ['hops', 'grape', 'coffee', 'bread', 'fried_egg', 'corn'],
      neutral: 'default',
      dislike: ['tulip', 'bluejazz', 'fairyrose'],
      hate: ['trash', 'soggy_newspaper'],
    },
    dialogues: {
      first: '嘿！新面孔！我是顾笙，这间酒吧的老板。进来就是客，先坐！头一杯大麦茶我请——酒嘛，等你活儿干顺了再喝！',
      heart0: [
        '酒吧是镇上的耳朵。谁家添了丁，哪块地丰收，我这儿最先知道。',
        '晚吟那丫头，唱歌是把好手，就是白天喊不醒。你晚上来，保准值回票价。',
        '种地辛苦，晚上来坐坐。不喝酒也行，热汤面管够。',
      ],
      heart2: [
        '老规矩，你进门这杯热的，记我账上。别推，推就是看不起我顾某人。',
        '汪船长每次来都坐窗边那个位置，三十年没变过。你要是懂海，跟他聊聊。',
        '铁珊瑚昨晚又赢了三个掰手腕。这镇上的爷们儿，没一个是她对手。',
      ],
      heart4: [
        '我年轻时在城里大饭店掌勺，后来烦了。汐溪镇好，客人都是熟人，菜里有热乎气。',
        '开酒吧图什么？图这一屋子的人，进门时是客人，出门时是一家子。',
        '你这人实在。坐我这吧台的，是不是实在人，我一眼就看出来。',
      ],
      heart6: [
        '跟你说个秘密：晚吟新写的那首歌，我听着，像是有心上人了。你猜是谁？',
        '满仓那老算盘，昨天进货非跟我磨价。磨到半夜，我赢了——多亏你来搭了句话。',
        '往后你农场的菜，先紧着我这儿供。好厨子配好食材，天经地义。',
      ],
      heart8: [
        '你早不是客人了。吧台里头那个位置，我给你留的。自己倒水，别客气。',
        '这酒吧往后要是传下去，账本里得记你一笔。没你，热闹少一半。',
        '累了就来。酒够不够另说，灶上的火，给你留到天亮。',
      ],
      heart10: [
        '往后这酒吧，你说了算一半。酒单上添什么，你点个头就行。',
        '别人来是喝酒，你来是回家。灶台边永远有你的碗。',
      ],
      rain: [
        '下雨天酒吧最热闹。湿了鞋的，都来烤烤火。',
        '雨大，今晚炖锅。来晚了可就没你的份了。',
      ],
      festival_spring: ['春汛节的酒席我包了三大桌！敞开了吃，顾老板买单！'],
      festival_summer: ['渔火节我烤了二百串。卖不完？不存在的事！'],
      festival_autumn: ['丰收宴就是咱们做买卖人的大考。今年的答卷，你先尝！'],
      festival_winter: ['暖星节，酒要温着喝，话要暖着说。来，先干为敬！'],
      birthdayGift: {
        love: '好小子！还记得我的生日！今晚全场我请——不不不，你的单，我包了，一年！',
        like: '哈哈，生日礼物！够意思！坐下，给你上硬菜！',
        neutral: '哦，谢了。晚上来，给你加个菜。',
        dislike: '……心意领了。就是这东西，进不了我的厨房。',
        hate: '拿走！我生日你拿这个砸场子？罚你三天没热汤面吃！',
      },
      giftReaction: {
        love: '好东西啊！兄弟，你这礼送我心坎里了！今晚的酒，我请！',
        like: '不错，实在！回头给你留串最好的。',
        neutral: '哦，谢了。',
        dislike: '……厨房里用不上这个。拿回去吧。',
        hate: '拿走拿走！我的吧台不摆这个！',
      },
    },
    heartEvents: [],
    spouseHelp: [],
  },
  {
    id: 'willy',
    name: '汪啸海',
    title: '老船长',
    birthday: { season: 3, day: 22 },
    home: 'beach',
    scene: 'beach',
    marriage: false,
    colorScheme: { skin: '#d9a97e', hair: '#c8c8c8', shirt: '#3e5a72', pants: '#2f3a44' },
    personality: ['沉默', '硬核', '念旧'],
    schedule: [
      { time: [360, 540], scene: 'beach', spot: [32, 20], action: 'work' },  // 晨钓理船
      { time: [540, 720], scene: 'beach', spot: [30, 16], action: 'shop' },  // 渔具铺营业
      { time: [720, 780], scene: 'beach', spot: [6, 12], action: 'sit' },    // 午饭
      { time: [780, 960], scene: 'beach', spot: [32, 20], action: 'work' },  // 下午海钓
      { time: [960, 1020], scene: 'beach', spot: [10, 26], action: 'work' }, // 礁石收蟹笼
      { time: [1020, 1140], scene: 'town', spot: [44, 32], action: 'sit' },  // 酒吧老位置
      { time: [1140, 1260], scene: 'beach', spot: [6, 12], action: 'sit' },  // 门口看海
      { time: [1260, 1440], scene: 'beach', spot: [6, 12], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 540], scene: 'beach', spot: [6, 12], action: 'work' },   // 屋里补网
      { time: [540, 720], scene: 'beach', spot: [30, 16], action: 'shop' },
      { time: [720, 780], scene: 'beach', spot: [6, 12], action: 'sit' },
      { time: [780, 1020], scene: 'beach', spot: [32, 20], action: 'stand' }, // 码头看雨中海
      { time: [1020, 1140], scene: 'town', spot: [44, 32], action: 'sit' },
      { time: [1140, 1260], scene: 'beach', spot: [6, 12], action: 'sit' },
      { time: [1260, 1440], scene: 'beach', spot: [6, 12], action: 'sleep' },
    ],
    gifts: {
      love: ['catfish', 'sturgeon', 'sea_cucumber', 'nautilus_shell', 'wine', 'bread'],
      like: ['sardine', 'tuna', 'squid', 'coffee', 'corn', 'clam'],
      neutral: 'default',
      dislike: ['tulip', 'fairyrose', 'jam'],
      hate: ['trash', 'broken_cd'],
    },
    dialogues: {
      first: '……新来的。我叫汪啸海，打鱼的。要买渔具，明早来铺子。海上的事，少说，多做。',
      heart0: [
        '潮汐表贴在铺子门口。看不懂就问，别拿命去试。',
        '海不欠人，人别欠海。这话记牢了。',
        '你农场的池塘我看过。水瘦，先养水，再养鱼。',
      ],
      heart2: [
        '海月说你手脚勤快。那丫头眼高，难得夸人。',
        '钓竿不是越硬越好。懂鱼性，比懂竿性要紧。',
        '明早要是起得早，来码头。教你认认潮线。',
      ],
      heart4: [
        '我十七岁上船，四十年了。风浪里讨生活，靠的不是胆，是敬畏。',
        '那年台风，我这条船救回来七个人。船底的疤，比我的军功章还多。',
        '海月想自己造船。……她的水性像我，性子也像。我拦不住，只能多教点。',
      ],
      heart6: [
        '你下次出远海钓鱼，跟着我的船。近海的鱼，瞧不上你的饵。',
        '海月那丫头，最近总往你农场跑。……你们年轻人的事，我不问。就一句：别让她哭。',
        '这套旧渔具，送给你。别嫌老。老家伙，耐用。',
      ],
      heart8: [
        '往后出海，我这条船给你留个位置。船长说的。',
        '海月交给你，我放心。这话我只说一遍。',
        '等我哪天真下不了海了，这些船和网，你帮着照看。别人我不托付。',
      ],
      heart10: [
        '你早是船上的人了。船的规矩，就是家的规矩。',
        '这条老命交代给海了。这点念想，交代给你了。',
      ],
      rain: [
        '雨天不出海。网破了的，正好补。',
        '雨里的海，跟发脾气的人一样。离远点，看着就行。',
      ],
      festival_spring: ['春汛节的第一碗鱼汤，敬海。第二碗，敬回得来的人。'],
      festival_summer: ['渔火节的灯，照的是归航的路。老辈人的讲究，错不了。'],
      festival_autumn: ['丰收宴上别劝我酒。晚上还要出海，手不能抖。'],
      festival_winter: ['暖星节，海也歇了。烤火，补网，等开春。'],
      birthdayGift: {
        love: '……还记得我这把老骨头的生日。好，好。这份情，记下了。',
        like: '生日礼物？嗯，有心了。',
        neutral: '哦，谢了。',
        dislike: '……拿回去吧。老汉用不上。',
        hate: '拿走。海上人最忌晦气东西。',
      },
      giftReaction: {
        love: '好东西。……你从哪弄来的？行，这份情，老汉记下了。',
        like: '嗯，合用。',
        neutral: '哦，谢了。',
        dislike: '……我用不上这个。',
        hate: '拿走。别让我说第二遍。',
      },
    },
    heartEvents: [],
    spouseHelp: [],
  },
  {
    id: 'anning',
    name: '安宁',
    title: '镇护士',
    birthday: { season: 0, day: 26 },
    home: 'town',
    scene: 'town',
    marriage: false,
    colorScheme: { skin: '#f7dcc3', hair: '#4a3a30', shirt: '#e8e4da', pants: '#7a8e9a' },
    personality: ['温柔', '严谨', '小洁癖'],
    schedule: [
      { time: [360, 420], scene: 'town', spot: [22, 40], action: 'sleep' },
      { time: [420, 540], scene: 'town', spot: [22, 40], action: 'work' },   // 煎药整理诊箱
      { time: [540, 720], scene: 'town', spot: [20, 38], action: 'shop' },   // 诊所坐诊
      { time: [720, 780], scene: 'town', spot: [20, 38], action: 'sit' },    // 午饭
      { time: [780, 1020], scene: 'town', spot: [-14, 38], action: 'shop' }, // 图书馆理书（西巷）
      { time: [1020, 1080], scene: 'forest', spot: [36, 28], action: 'work' }, // 采草药
      { time: [1080, 1140], scene: 'town', spot: [-20, 24], action: 'walk' }, // 西巷公园散步
      { time: [1140, 1260], scene: 'town', spot: [22, 40], action: 'sit' },  // 晚饭记医案
      { time: [1260, 1440], scene: 'town', spot: [22, 40], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 420], scene: 'town', spot: [22, 40], action: 'sleep' },
      { time: [420, 540], scene: 'town', spot: [22, 40], action: 'work' },
      { time: [540, 720], scene: 'town', spot: [20, 38], action: 'shop' },   // 雨天坐诊
      { time: [720, 1080], scene: 'town', spot: [-14, 38], action: 'shop' }, // 雨天去图书馆
      { time: [1080, 1140], scene: 'town', spot: [14, 18], action: 'stand' }, // 杂货店买艾草
      { time: [1140, 1260], scene: 'town', spot: [22, 40], action: 'sit' },
      { time: [1260, 1440], scene: 'town', spot: [22, 40], action: 'sleep' },
    ],
    gifts: {
      love: ['ginseng', 'honey', 'coffee', 'salad', 'tulip'],
      like: ['bread', 'juice', 'bluejazz', 'strawberry', 'pumpkin_soup', 'amethyst'],
      neutral: 'default',
      dislike: ['hotpepper', 'beer', 'wine'],
      hate: ['trash', 'bait'],
    },
    dialogues: {
      first: '你好，我是安宁，诊所的护士。农活儿重，磕了碰了别硬扛，随时来找我。……对了，进屋先洗手，习惯成自然。',
      heart0: [
        '锄头柄上的毛刺要磨平，不然三天手心就起泡。别问我怎么知道的。',
        '日出而作是好事，但正午的太阳最毒，那会儿就歇一歇。',
        '诊所常备着外伤药。宁可备而不用，也别用的时候没有。',
      ],
      heart2: [
        '上次给你的草药膏用完了吗？蚊虫咬的，擦一擦就好。',
        '你气色比刚来时好多了。看来农场的水土，养人。',
        '麦冬前两天送来的草药，一半都沾着露水。那孩子，采药比谁都上心。',
      ],
      heart4: [
        '我师父说，医者先是“听者”。病人的话，听进去了，病就好了一半。',
        '镇上的老人多，我每周挨家转一圈。看着他们都硬朗，比什么都强。',
        '你总是一个人忙里忙外。……要是累了，诊所的躺椅，随时借你眯一会儿。',
      ],
      heart6: [
        '给你配了瓶新的药酒，跌打扭伤都能用。放你农场门口了，记得收。',
        '下矿要多喝水，粉尘大。要是咳嗽超过三天，必须来诊所。这是医嘱。',
        '最近散步，不知不觉就走到你农场外头了。……看你屋里的灯亮着，就放心了。',
      ],
      heart8: [
        '往后你的体检，我包了。不许推，这是护士的特权。',
        '药箱里最沉的是牵挂。这话我以前不懂，现在……有点懂了。',
        '你要是病倒了，全镇子都得跟着担心。所以，好好吃饭，好好睡觉。答应我。',
      ],
      heart10: [
        '往后你一辈子的健康，都归我管。这是最长的一份医嘱。',
        '诊所的灯为你留着。你的灯，也让我看一眼就好。',
      ],
      rain: [
        '雨天湿气重，旧伤容易犯。要是腰酸，来诊所热敷一下。',
        '落雨天病人少，正好把药柜清一清。你要不要来搭把手？',
      ],
      festival_spring: ['春汛节人多，小心着凉。我给你备了姜汤，在诊所温着。'],
      festival_summer: ['渔火节看灯别靠水太近。夜里的潮气，最伤人。'],
      festival_autumn: ['丰收宴放开吃，但酒要少沾。……好啦，就唠叨这一句。'],
      festival_winter: ['暖星节烤火别贪近，燥。我煮的梨汤，润肺，给你盛一碗。'],
      birthdayGift: {
        love: '你还记得我的生日……谢谢。这是我今年收到的、最对症的一味药。',
        like: '生日礼物？谢谢。你的这份心意，比什么都养人。',
        neutral: '谢谢。让你破费了。',
        dislike: '……心意领了。就是这东西，于身体无益，你拿回去吧。',
        hate: '拿走。生日收到这个，我得给自己开一副顺气汤了。',
      },
      giftReaction: {
        love: '这太贵重了……你从哪寻来的？谢谢，我会好好用的。',
        like: '谢谢。你总是这么周到。',
        neutral: '哦，谢谢。',
        dislike: '……我用不上这个。留着自己用吧。',
        hate: '拿走。诊所里不许出现这种东西。',
      },
    },
    heartEvents: [],
    spouseHelp: [],
  },
  {
    id: 'qiaoyin',
    name: '樵隐',
    title: '森林隐士',
    birthday: { season: 1, day: 28 },
    home: 'forest',
    scene: 'forest',
    marriage: false,
    colorScheme: { skin: '#c9a582', hair: '#e0e0d8', shirt: '#4e5a48', pants: '#3a4038' },
    personality: ['神秘', '通透', '寡言'],
    schedule: [
      { time: [360, 480], scene: 'forest', spot: [8, 32], action: 'sit' },   // 林中清晨打坐
      { time: [480, 540], scene: 'town', spot: [-10, 12], action: 'walk' },  // 下山进城
      { time: [540, 720], scene: 'town', spot: [-14, 12], action: 'shop' },  // 云杉茶馆晨市
      { time: [720, 780], scene: 'town', spot: [-14, 12], action: 'sit' },   // 午茶
      { time: [780, 1080], scene: 'town', spot: [-14, 12], action: 'shop' }, // 茶馆经营
      { time: [1080, 1140], scene: 'town', spot: [-22, 24], action: 'walk' }, // 公园看棋
      { time: [1140, 1260], scene: 'forest', spot: [8, 32], action: 'sit' }, // 回林晚饭
      { time: [1260, 1440], scene: 'forest', spot: [8, 32], action: 'sleep' },
    ],
    scheduleRain: [
      { time: [360, 480], scene: 'forest', spot: [8, 32], action: 'sit' },
      { time: [480, 540], scene: 'town', spot: [-10, 12], action: 'walk' },
      { time: [540, 1080], scene: 'town', spot: [-14, 12], action: 'shop' }, // 雨天守店
      { time: [1080, 1140], scene: 'town', spot: [-22, 24], action: 'stand' },
      { time: [1140, 1260], scene: 'forest', spot: [8, 32], action: 'sit' },
      { time: [1260, 1440], scene: 'forest', spot: [8, 32], action: 'sleep' },
    ],
    gifts: {
      love: ['morel', 'chanterelle', 'purple_mushroom', 'nautilus_shell', 'field_snack'],
      like: ['fiber', 'wood', 'hardwood', 'snow_yam', 'winter_root', 'daffodil'],
      neutral: 'default',
      dislike: ['starfruit', 'wine', 'diamond'],
      hate: ['trash', 'broken_glasses'],
    },
    dialogues: {
      first: '……稀客。我无名无姓，镇上人叫我樵隐。林子不拦客，也不留客。你既来了，便是缘分。',
      heart0: [
        '林子的规矩：取之有时，用之有节。砍一棵树，要记得看三年苗。',
        '蘑菇分红白。红的未必毒，白的未必善。人也一样。',
        '你脚步重，惊了山雀。学林子的路数，先学轻。',
      ],
      heart2: [
        '这筐菌子你拿去。雨季的头茬，最是养人。',
        '湖心的水最静。人心静了，才照得见自己。',
        '你农场那几垄地，土是活的。好好待它，它记得住。',
      ],
      heart4: [
        '我在这林子里住了多少年？树记得，我不记得。',
        '从前我也有过热闹日子。后来才明白，热闹是别人的，清宁是自己的。',
        '你身上的烟火气，不重。这是好事，守住它。',
      ],
      heart6: [
        '秘密林地的老树下，埋着些旧物件。哪日你有缘，自会挖到。',
        '你是这些年里，唯一一个坐下陪我看完日落的人。',
        '林深时不迷路，靠的是记树不记路。做人也一样，记人不记事。',
      ],
      heart8: [
        '往后这林子，你随时可以来。我的篝火，多添一根柴就是。',
        '我没什么能教你的了。非要说一句：守好你那片地，就是守好你自己。',
        '山不转水转。你我这一面之缘，比我想的要长。',
      ],
      heart10: [
        '你是林子认下的人。往后鸟兽见你，都会让三分。',
        '我这一辈子，清静到头。临了能多个你这样的朋友，不亏。',
      ],
      rain: [
        '雨落进林子，是天在给树念经。你听。',
        '雨天菌子冒头。带上筐，跟我来——脚步放轻。',
      ],
      festival_spring: ['春汛节，林子的溪水第一个知道。人间的热闹，水早就传到了。'],
      festival_summer: ['渔火节的灯，从湖面漂进林子的溪里。我捡过一盏，放了，让它继续走。'],
      festival_autumn: ['丰收宴的烟火气，隔着林子都闻得见。一年一熟，急不得。'],
      festival_winter: ['暖星节的雪落进林子，什么声音都没有。这是一年里，林子最干净的时候。'],
      birthdayGift: {
        love: '你还记得我的生日……林子里的规矩，受人之礼，还之以诚。这篮菌子，你收下。',
        like: '生日礼物。嗯，你有心了。',
        neutral: '哦，多谢。',
        dislike: '……尘世的东西，我用不惯。拿回去吧。',
        hate: '拿走。这种东西进林子，会惊了山灵。',
      },
      giftReaction: {
        love: '好东西。知我者，莫过于你。',
        like: '嗯，合用。多谢。',
        neutral: '哦，谢了。',
        dislike: '……我用不上。带回镇上去吧。',
        hate: '拿走。林子不纳秽物。',
      },
    },
    heartEvents: [],
    spouseHelp: [],
  },
];
