// 天气与氛围粒子：雨/暴雨闪电/雪/大风花瓣落叶/湿润地面/涟漪/晨间光柱/夏夜萤火虫/蝴蝶/炊烟
import * as THREE from 'three';
import { makeTexture } from './textures.js';

function dotTexture(r = 3, col = '#fff') {
  return makeTexture(8, 8, (g) => { g.fillStyle = col; g.fillRect(3, 3, 2, 2); });
}

export class WeatherFX {
  constructor(game) {
    this.game = game;
    const g = game.engine;
    // 雨滴（线段池）
    const rainN = 900;
    this.rainPos = new Float32Array(rainN * 6);
    this.rainVel = new Float32Array(rainN);
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3));
    this.rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x9fc8e8, transparent: true, opacity: 0.55 }));
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    g.scene.add(this.rain);
    this.rainN = rainN;
    // 雪（点池）
    const snowN = 700;
    this.snowPos = new Float32Array(snowN * 3);
    this.snowVel = new Float32Array(snowN * 2);
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(this.snowPos, 3));
    this.snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ size: 0.11, map: dotTexture(), transparent: true, alphaTest: 0.2, color: 0xffffff, depthWrite: false }));
    this.snow.frustumCulled = false;
    this.snow.visible = false;
    g.scene.add(this.snow);
    this.snowN = snowN;
    // 风媒粒子（春花瓣/秋落叶）
    const windN = 120;
    this.windPos = new Float32Array(windN * 3);
    this.windVel = new Float32Array(windN * 3);
    const windGeo = new THREE.BufferGeometry();
    windGeo.setAttribute('position', new THREE.BufferAttribute(this.windPos, 3));
    this.wind = new THREE.Points(windGeo, new THREE.PointsMaterial({ size: 0.09, map: dotTexture(), transparent: true, alphaTest: 0.2, color: 0xffc9dd, depthWrite: false }));
    this.wind.frustumCulled = false;
    g.scene.add(this.wind);
    this.windN = windN;
    // 涟漪池
    this.ripples = [];
    this.rippleT = 0;
    // 萤火虫（夏夜）
    const ffN = 40;
    this.ffPos = new Float32Array(ffN * 3);
    this.ffPhase = new Float32Array(ffN);
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute('position', new THREE.BufferAttribute(this.ffPos, 3));
    this.fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ size: 0.08, map: dotTexture(), transparent: true, alphaTest: 0.1, color: 0xd8ff8a, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.fireflies.frustumCulled = false;
    this.fireflies.visible = false;
    g.scene.add(this.fireflies);
    this.ffN = ffN;
    // 蝴蝶（春夏晴日）
    this.butterflies = [];
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.12), new THREE.MeshBasicMaterial({ color: [0xffc9dd, 0xffd98a, 0xb9d9eb][i % 3], side: THREE.DoubleSide, transparent: true, alphaTest: 0.3 }));
      b.visible = false;
      g.scene.add(b);
      this.butterflies.push({ mesh: b, t: Math.random() * 10, cx: 0, cz: 0, r: 2 + Math.random() * 3 });
    }
    // 晨间光柱（billboard 梯形面片）
    this.rays = new THREE.Group();
    const rayTex = makeTexture(16, 64, (g2) => {
      // 两端都羽化：顶端淡入、底端淡出，拉远也看不到切面
      const grad = g2.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, 'rgba(255,240,200,0)');
      grad.addColorStop(0.22, 'rgba(255,240,200,0.55)');
      grad.addColorStop(0.7, 'rgba(255,240,200,0.28)');
      grad.addColorStop(1, 'rgba(255,240,200,0)');
      g2.fillStyle = grad; g2.fillRect(0, 0, 16, 64);
      // 水平方向羽化边缘，避免硬边"帘子"感
      g2.globalCompositeOperation = 'destination-in';
      const hg = g2.createLinearGradient(0, 0, 16, 0);
      hg.addColorStop(0, 'rgba(0,0,0,0)');
      hg.addColorStop(0.35, 'rgba(0,0,0,1)');
      hg.addColorStop(0.65, 'rgba(0,0,0,1)');
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      g2.fillStyle = hg; g2.fillRect(0, 0, 16, 64);
      g2.globalCompositeOperation = 'source-over';
    });
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 18), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.position.set(4 + Math.random() * 40, 7.5, 4 + Math.random() * 30);
      m.rotation.z = 0.35;
      this.rays.add(m);
    }
    this.rays.visible = false;
    g.scene.add(this.rays);
    // 闪电计时
    this.lightningT = 8;
    this.flashEl = null;
    this.wetApplied = false;
  }
  setGroundWet(wet) {
    const g = this.game;
    if (wet === this.wetApplied) return;
    this.wetApplied = wet;
    const ground = g.scenes.current?.group;
    if (!ground) return;
    ground.traverse((o) => {
      if (o.isMesh && o.receiveShadow && o.material?.map && o.geometry?.parameters?.width >= 30) {
        o.material.color.setScalar(wet ? 0.72 : 1);
      }
    });
  }
  lightning() {
    const g = this.game;
    // 天空闪白 + 光强脉冲 + 雷声
    if (!this.flashEl) {
      this.flashEl = document.createElement('div');
      this.flashEl.style.cssText = 'position:fixed;inset:0;background:#E8F0FF;opacity:0;pointer-events:none;z-index:90';
      document.getElementById('ui').appendChild(this.flashEl);
    }
    const seq = [0.85, 0.1, 0.6, 0];
    seq.forEach((op, i) => setTimeout(() => { if (this.flashEl) this.flashEl.style.opacity = op; }, i * 90));
    const sun = g.lighting.sun;
    const oldI = sun.intensity;
    sun.intensity = oldI * 4;
    setTimeout(() => sun.intensity = oldI, 120);
    g.ambience.thunder(0.7 + Math.random() * 0.5);
  }
  update(dt, t) {
    const g = this.game;
    const weather = g.state.weather.today;
    const p = g.player.pos;
    const season = g.clock.season;
    const minute = g.clock.minute;
    const isNight = g.lighting.env.isNight;
    const inMine = g.mining.inMine || !!g.interiors?.active; // 矿洞与建筑内部都不落雨雪
    // 雨
    const raining = (weather === 'rain' || weather === 'storm') && !inMine;
    this.rain.visible = raining;
    if (raining) {
      const n = weather === 'storm' ? this.rainN : Math.floor(this.rainN * 0.55);
      for (let i = 0; i < n; i++) {
        let y = this.rainPos[i * 6 + 1];
        if (y < 0 || this.rainPos[i * 6 + 3] === 0) {
          this.rainPos[i * 6] = p.x + (Math.random() - 0.5) * 30;
          this.rainPos[i * 6 + 1] = 6 + Math.random() * 6;
          this.rainPos[i * 6 + 2] = p.z + (Math.random() - 0.5) * 30;
          this.rainVel[i] = 14 + Math.random() * 5;
          y = this.rainPos[i * 6 + 1];
        }
        y -= this.rainVel[i] * dt;
        this.rainPos[i * 6 + 1] = y;
        this.rainPos[i * 6 + 3] = this.rainPos[i * 6] - 0.15;
        this.rainPos[i * 6 + 4] = y - 0.5;
        this.rainPos[i * 6 + 5] = this.rainPos[i * 6 + 2];
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
      // 涟漪
      this.rippleT -= dt;
      if (this.rippleT <= 0) {
        this.rippleT = 0.12;
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.09, 10), new THREE.MeshBasicMaterial({ color: 0xcfe4f0, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(p.x + (Math.random() - 0.5) * 14, 0.03, p.z + (Math.random() - 0.5) * 14);
        this.game.engine.scene.add(ring);
        this.ripples.push({ mesh: ring, t: 0 });
      }
    }
    for (const r of [...this.ripples]) {
      r.t += dt;
      r.mesh.scale.setScalar(1 + r.t * 5);
      r.mesh.material.opacity = Math.max(0, 0.6 - r.t * 1.2);
      if (r.t > 0.55) { this.game.engine.scene.remove(r.mesh); this.ripples = this.ripples.filter((x) => x !== r); }
    }
    this.setGroundWet(raining);
    // 暴雨闪电
    if (weather === 'storm' && !inMine) {
      this.lightningT -= dt;
      if (this.lightningT <= 0) {
        this.lightningT = 6 + Math.random() * 14;
        this.lightning();
      }
    }
    // 雪（冬季常驻飘雪：雪天全量，冬季晴天也为零星小雪）
    const snowing = !inMine && (weather === 'snow' || (season === 3 && weather !== 'rain' && weather !== 'storm'));
    this.snow.visible = snowing;
    if (snowing) {
      const snowCount = weather === 'snow' ? this.snowN : 220;
      this.snow.geometry.setDrawRange(0, snowCount);
      for (let i = 0; i < snowCount; i++) {
        let y = this.snowPos[i * 3 + 1];
        if (y <= 0) {
          this.snowPos[i * 3] = p.x + (Math.random() - 0.5) * 32;
          this.snowPos[i * 3 + 1] = 5 + Math.random() * 7;
          this.snowPos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 32;
          this.snowVel[i * 2] = (Math.random() - 0.5) * 0.6;
          this.snowVel[i * 2 + 1] = 0.8 + Math.random() * 0.8;
          y = this.snowPos[i * 3 + 1];
        }
        this.snowPos[i * 3] += (this.snowVel[i * 2] + Math.sin(t * 1.5 + i) * 0.3) * dt;
        this.snowPos[i * 3 + 1] = y - this.snowVel[i * 2 + 1] * dt;
      }
      this.snow.geometry.attributes.position.needsUpdate = true;
    }
    // 风媒（春季常驻花瓣 / 秋季常驻落叶 / 大风加强）
    const petalSeason = season === 0 || season === 2;
    const windy = weather === 'wind';
    const windActive = !inMine && petalSeason && (windy || Math.sin(t * 0.05) > 0);
    this.wind.visible = windActive;
    if (windActive) {
      this.wind.material.color.set(season === 0 ? 0xffc9dd : 0xe8873a);
      const mul = windy ? 2.5 : 1;
      for (let i = 0; i < this.windN; i++) {
        let y = this.windPos[i * 3 + 1];
        if (y < 0.05 || Math.random() < 0.002) {
          this.windPos[i * 3] = p.x + (Math.random() - 0.5) * 34;
          this.windPos[i * 3 + 1] = 1 + Math.random() * 6;
          this.windPos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 34;
          this.windVel[i * 3] = 1 + Math.random() * 1.5;
          this.windVel[i * 3 + 1] = 0.2 + Math.random() * 0.4;
          this.windVel[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        }
        this.windPos[i * 3] += this.windVel[i * 3] * mul * dt;
        this.windPos[i * 3 + 1] -= this.windVel[i * 3 + 1] * dt;
        this.windPos[i * 3 + 2] += (this.windVel[i * 3 + 2] + Math.sin(t * 2 + i) * 0.5) * dt;
      }
      this.wind.geometry.attributes.position.needsUpdate = true;
    }
    // 萤火虫（夏夜 20:00-24:00，非雨）
    const ffActive = !inMine && season === 1 && minute >= 1200 && minute < 1440 && weather !== 'rain' && weather !== 'storm';
    this.fireflies.visible = ffActive;
    if (ffActive) {
      for (let i = 0; i < this.ffN; i++) {
        this.ffPhase[i] += dt;
        if (this.ffPos[i * 3 + 1] === 0) {
          this.ffPos[i * 3] = p.x + (Math.random() - 0.5) * 24;
          this.ffPos[i * 3 + 1] = 0.4 + Math.random() * 1.6;
          this.ffPos[i * 3 + 2] = p.z + (Math.random() - 0.5) * 24;
        }
        this.ffPos[i * 3] += Math.sin(this.ffPhase[i] * 0.9 + i) * dt * 0.7;
        this.ffPos[i * 3 + 1] += Math.cos(this.ffPhase[i] * 1.3 + i * 2) * dt * 0.35;
        this.ffPos[i * 3 + 2] += Math.cos(this.ffPhase[i] * 0.7 + i) * dt * 0.7;
      }
      this.fireflies.material.opacity = 0.6 + Math.sin(t * 2.2) * 0.35;
      this.fireflies.geometry.attributes.position.needsUpdate = true;
    }
    // 蝴蝶（春夏晴日白天）
    const bActive = !inMine && season <= 1 && !isNight && weather === 'sunny';
    for (const bf of this.butterflies) {
      bf.mesh.visible = bActive;
      if (!bActive) continue;
      if (bf.cx === 0) { bf.cx = p.x; bf.cz = p.z; }
      if (Math.hypot(bf.cx - p.x, bf.cz - p.z) > 26) { bf.cx = p.x + (Math.random() - 0.5) * 16; bf.cz = p.z + (Math.random() - 0.5) * 16; }
      bf.t += dt * (1.2 + bf.r * 0.2);
      const x = bf.cx + Math.cos(bf.t) * bf.r;
      const z = bf.cz + Math.sin(bf.t * 1.3) * bf.r;
      bf.mesh.position.set(x, 0.6 + Math.sin(bf.t * 2.4) * 0.25, z);
      bf.mesh.rotation.y = bf.t;
      bf.mesh.rotation.z = Math.sin(bf.t * 18) * 0.7; // 振翅
    }
    // 晨间光柱（晴日 6:00-9:00，有树的场景）
    const raysActive = !inMine && weather === 'sunny' && minute >= 360 && minute <= 540 && ['farm', 'forest', 'town'].includes(g.state.player.scene);
    this.rays.visible = raysActive;
    if (raysActive) {
      for (const m of this.rays.children) {
        m.rotation.y = Math.atan2(g.engine.camera.position.x - m.position.x, g.engine.camera.position.z - m.position.z);
        m.material.opacity = 0.3 + Math.sin(t * 0.8 + m.position.x) * 0.1;
      }
    }
  }
}
