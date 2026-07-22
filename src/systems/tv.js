// 电视系统：4 频道（天气预报/占卜运气/离地生活/酱料女皇）
import * as THREE from 'three';
import { WEATHER_CN } from './daycycle.js';
import { COOKING } from '../data/cooking.js';

const LUCK_TIERS = [
  [0.07, '今天星象极佳！出门必有好事发生。', '#FFD98A'],
  [0.02, '今天运气不错，适合下矿和钓鱼。', '#8AE84A'],
  [-0.02, '今天运气平平，一切如常。', '#B8C0D8'],
  [-0.07, '今天运势不佳，小心为上。', '#E8A84A'],
  [-2, '今天星象晦暗……最好待在农场干活。', '#E86A6A'],
];
const TIPS = [
  '乌鸦只会在作物超过 15 株时出没——稻草人能保护周围 8 格。',
  '换季时，不当季的作物会枯萎。提前规划收获时间。',
  '下雨天不用浇水，是升级浇水壶的好日子。',
  '连续收获作物（如青豆）一季能收多次，别急着铲掉。',
  '肥料分三种：提品质、保水分、促生长。每格只能施一种。',
  '钓鱼时，把鱼控制在绿色条内就能攒满进度。完美遛鱼能提升品质。',
  '矿井里每 5 层有电梯，每 10 层有宝箱。',
  '品质越高的作物卖价越高：银星 ×1.25，金星 ×1.5，铱星 ×2。',
  '体力耗尽会疲惫，透支到 -15 会昏倒并损失金钱。',
  '送礼送到心坎上：留意每个人的喜好，生日送礼效果翻 8 倍。',
  '加工机器能让农产品升值：小桶酿酒能卖 3 倍价。',
  '冬天的土地会冻结，提前囤粮和干草过冬。',
];

export class TV {
  constructor(game) {
    this.game = game;
  }
  channels() {
    const g = this.game;
    const wd = g.clock.weekDay; // 0周一
    return [
      { id: 'weather', name: '天气预报', desc: this.weatherForecast() },
      { id: 'fortune', name: '每日占卜', desc: this.fortune() },
      { id: 'tips', name: '离地生活', desc: (wd === 0 || wd === 3) ? this.tip() : '今天没有《离地生活》节目（每周一、周四播出）。', off: !(wd === 0 || wd === 3) },
      { id: 'queen', name: '酱料女皇', desc: this.queenText(), off: !(wd === 6 || wd === 2), action: wd === 6 ? () => this.learnQueenRecipe() : null },
    ];
  }
  weatherForecast() {
    const g = this.game;
    const w = g.state.weather.tomorrow;
    const extra = { sunny: '适合外出劳作。', cloudy: '云层较厚，光线柔和。', wind: '风大，注意花瓣漫天。', rain: '不用给作物浇水了。', storm: '有雷电，小心出行！避雷针能收集电池。', snow: '大地银装素裹。' };
    return `明天的天气：${WEATHER_CN[w] || w}。${extra[w] || ''}`;
  }
  fortune() {
    const g = this.game;
    const luck = g.state.player.luck;
    for (const [th, text] of LUCK_TIERS) if (luck >= th) return text;
    return LUCK_TIERS.at(-1)[1];
  }
  tip() {
    const g = this.game;
    return '「' + TIPS[g.clock.absoluteDay % TIPS.length] + '」';
  }
  queenText() {
    const g = this.game;
    const wd = g.clock.weekDay;
    if (wd === 6) {
      const next = COOKING.filter((c) => c.unlock?.queen != null && !(g.state.player.recipesKnown || []).includes(c.id)).sort((a, b) => a.unlock.queen - b.unlock.queen)[0];
      return next ? `今天教做「${next.name}」！看完节目就能学会。` : '今天是往期重播（你已学会全部菜谱）。';
    }
    if (wd === 2) return '今天是周三重播档。新菜谱每周日首播。';
    return '《酱料女皇》每周日首播新菜谱，周三重播。';
  }
  learnQueenRecipe() {
    const g = this.game;
    if (!g.state.player.recipesKnown) g.state.player.recipesKnown = [];
    const next = COOKING.filter((c) => c.unlock?.queen != null && !g.state.player.recipesKnown.includes(c.id)).sort((a, b) => a.unlock.queen - b.unlock.queen)[0];
    if (!next) return null;
    g.state.player.recipesKnown.push(next.id);
    g.audio.sfx('levelup');
    g.effects.floatText(g.player.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), `学会菜谱「${next.name}」！`, '#FFD98A', 14);
    return next;
  }
  serialize() {}
  deserialize() {}
}
