// 昼夜光照：太阳/月亮平行光 + 半球光，色温强度曲线 + 全屏色调分级关键帧（参数：RESEARCH.md §1.3）
import * as THREE from 'three';

// 关键帧：[minute, color, intensity, hemiIntensity, exposure, bloomStrength, bloomThreshold, fogColor, fogDensity, liftRGB, gainRGB, gamma, sat]
const KEYS = [
  [360,  '#FFB46B', 1.4, 0.45, 1.0, 0.4, 0.9,  '#E8C9A8', 0.010, [0.012, 0.008, 0.02], [1.05, 1.0, 0.95], 1.0, 1.05], // 6:00 清晨
  [540,  '#FFE3C1', 2.0, 0.65, 1.02, 0.35, 0.92, '#DCE8E8', 0.008, [0.008, 0.008, 0.012], [1.02, 1.01, 1.0], 1.0, 1.03], // 9:00
  [780,  '#FFF4EC', 2.5, 0.78, 1.02, 0.3, 0.96, '#CFE4F0', 0.0065, [0.005, 0.005, 0.006], [1.01, 1.01, 1.01], 1.0, 1.02], // 13:00 正午
  [1020, '#FFF1E0', 2.0, 0.62, 1.0, 0.35, 0.92, '#E0DCC8', 0.008, [0.012, 0.008, 0.016], [1.06, 1.0, 0.93], 1.0, 1.06],  // 17:00
  [1110, '#FF8A3C', 1.6, 0.45, 1.0, 0.5, 0.85, '#F0A868', 0.009, [0.024, 0.012, 0.026], [1.1, 0.98, 0.88], 1.02, 1.05],   // 18:30 黄昏
  [1170, '#A8C0F0', 0.85, 0.62, 1.0, 0.6, 0.8, '#2B3E6E', 0.008, [0.02, 0.035, 0.08], [0.85, 0.92, 1.2], 0.93, 0.94], // 19:30 入夜（静谧蓝）
  [1500, '#A8C0F0', 0.8, 0.6, 1.0, 0.6, 0.8, '#2B3E6E', 0.008, [0.02, 0.035, 0.08], [0.85, 0.92, 1.2], 0.93, 0.94],
  [1560, '#A8C0F0', 0.8, 0.6, 1.0, 0.6, 0.8, '#2B3E6E', 0.008, [0.02, 0.035, 0.08], [0.85, 0.92, 1.2], 0.93, 0.94],
  [1740, '#A8C0F0', 0.8, 0.6, 1.0, 0.6, 0.8, '#2B3E6E', 0.008, [0.02, 0.035, 0.08], [0.85, 0.92, 1.2], 0.93, 0.94],
];
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();

function sample(minute, darkAdjust = 0) {
  // 把 6:00 前的凌晨折算到曲线尾部
  let m = minute < 360 ? minute + 1200 + 360 - 240 : minute;
  // 夜晚随季节提前/延后：darkAdjust>0 表示更早天黑（冬），平移入夜关键帧
  let keys = KEYS;
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1][0] < m) i++;
  const a = keys[i], b = keys[i + 1];
  let t = THREE.MathUtils.clamp((m - a[0]) / (b[0] - a[0]), 0, 1);
  t = t * t * (3 - 2 * t); // smoothstep
  _c1.set(a[1]); _c2.set(b[1]); _c1.lerp(_c2, t);
  const fog = new THREE.Color(a[7]).lerp(_c2.set(b[7]), t);
  const lerp3 = (k) => new THREE.Vector3(
    THREE.MathUtils.lerp(a[k][0], b[k][0], t),
    THREE.MathUtils.lerp(a[k][1], b[k][1], t),
    THREE.MathUtils.lerp(a[k][2], b[k][2], t),
  );
  return {
    color: _c1.clone(),
    intensity: THREE.MathUtils.lerp(a[2], b[2], t),
    hemi: THREE.MathUtils.lerp(a[3], b[3], t),
    exposure: THREE.MathUtils.lerp(a[4], b[4], t),
    bloomS: THREE.MathUtils.lerp(a[5], b[5], t),
    bloomT: THREE.MathUtils.lerp(a[6], b[6], t),
    fogColor: fog,
    fogD: THREE.MathUtils.lerp(a[8], b[8], t),
    lift: lerp3(9),
    gain: lerp3(10),
    gamma: THREE.MathUtils.lerp(a[11], b[11], t),
    sat: THREE.MathUtils.lerp(a[12], b[12], t),
  };
}

export class Lighting {
  constructor(engine) {
    this.engine = engine;
    this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sun.castShadow = true;
    const s = this.sun.shadow;
    s.mapSize.set(2048, 2048);
    s.camera.left = -35; s.camera.right = 35; s.camera.top = 35; s.camera.bottom = -35;
    s.camera.near = 10; s.camera.far = 160;
    s.bias = -0.0004; s.normalBias = 0.02;
    engine.scene.add(this.sun); engine.scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xbfd9e8, 0x8a7a5f, 0.9);
    engine.scene.add(this.hemi);

    // 玩家夜灯（夜晚跟随的暖光，矿洞由火把系统接管）
    this.playerLight = new THREE.PointLight(0xffc890, 0, 10, 1.3);
    engine.scene.add(this.playerLight);

    engine.scene.fog = new THREE.FogExp2(0xcfe4f0, 0.008);
    this.target = new THREE.Vector3();
    this.env = { lightLevel: 1, isNight: false, phase: sample(360) };
  }
  // minute: 游戏分钟；focus: 阴影相机跟随点；weather: {fogMul, lightMul, fogTint}
  update(minute, focus, weather = null) {
    const p = sample(minute);
    this.env.phase = p;
    this.env.lightLevel = p.intensity / 3.0;
    // 夜晚判定：按时间（19:20 后 / 5:40 前），不再用强度阈值
    this.env.isNight = minute >= 1160 || minute < 340;

    // 太阳/月亮方位：白天 6→18 点从东到西；夜间月亮镜像
    const dayT = THREE.MathUtils.clamp((minute - 360) / 720, 0, 1);      // 6:00–18:00
    const nightT = minute > 1110 ? (minute - 1110) / 570 : (minute + 240 - 0) / 570;
    const isNight = minute >= 1110 || minute < 360;
    const ang = (isNight ? nightT : dayT) * Math.PI; // 0..π 东→西
    const elev = Math.sin(ang) * (isNight ? 0.5 : 0.85) + 0.12;
    const R = 90;
    this.sun.position.set(
      focus.x + Math.cos(ang) * R,
      Math.max(14, elev * R),
      focus.z + 42
    );
    this.sun.target.position.copy(focus);

    const lightMul = weather?.lightMul ?? 1;
    this.sun.color.copy(p.color);
    this.sun.intensity = p.intensity * lightMul;
    this.hemi.intensity = p.hemi * (weather ? 0.85 : 1);
    this.hemi.color.set(isNight ? 0x5a7ac0 : 0xbfd9e8);        // 夜：月光蓝天空半球
    this.hemi.groundColor.set(isNight ? 0x2e3a58 : 0x8a7a5f);  // 夜：地面反射深蓝

    const e = this.engine;
    if (!e.game?.photoActive) { // 照相模式：曝光/雾浓度交给用户滑条
      e.renderer.toneMappingExposure = p.exposure;
    }
    e.bloom.strength = p.bloomS + (weather?.bloomAdd ?? 0);
    e.bloom.threshold = p.bloomT;
    // 色调分级（lift/gamma/gain 随时段连续变化）
    if (e.grade) {
      e.grade.uniforms.uLift.value.copy(p.lift);
      e.grade.uniforms.uGain.value.copy(p.gain);
      e.grade.uniforms.uGamma.value = p.gamma;
      e.grade.uniforms.uSat.value = p.sat;
    }
    // 玩家夜灯：白天 1.8 可见光环，19:00 起全亮 2.4（矿洞内由 mining 火把接管）
    this._minute = minute;
    this.playerLight.position.set(focus.x, 1.7, focus.z);
    const nightLight = minute >= 1140 || minute < 330;
    const targetGlow = nightLight ? 2.4 : 1.8;
    this.playerLight.intensity += (targetGlow - this.playerLight.intensity) * 0.3;
    const fogC = p.fogColor.clone();
    if (weather?.fogTint) fogC.lerp(new THREE.Color(weather.fogTint), 0.6);
    e.scene.fog.color.copy(fogC);
    if (!e.game?.photoActive) e.scene.fog.density = p.fogD * (weather?.fogMul ?? 1);
  }
}
