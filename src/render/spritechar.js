// 像素精灵角色：程序化绘制 4 向 × 行走/闲置/挥工具帧，圆柱 billboard + 团影（八方旅人式 2D 精灵 × 3D 世界）
import * as THREE from 'three';
import { makeTexture, PAL, shade } from './textures.js';

const W = 20, H = 30; // sprite 像素尺寸

// 帧绘制：dir 0=下 1=上 2=侧(右, 左镜像)；phase -1=闲置 0..3 行走；swing 0..2 挥工具(前/上/侧由 dir 决定)
function drawFrame(g, dir, phase, opt, swing = -1) {
  const skin = opt.skin, hair = opt.hair, shirt = opt.shirt, pants = opt.pants;
  const shirtD = shade(shirt, -32), pantsD = shade(pants, -28), skinD = shade(skin, -30), hairD = shade(hair, -30);
  const cx = 10; // 中心 x
  // 行走腿部相位
  const legOff = phase < 0 ? 0 : [1, 0, -1, 0][phase];
  const bob = phase < 0 ? 0 : [0, 1, 0, 1][phase];
  const y0 = 2 - bob; // 整体起伏

  // 腿
  g.fillStyle = pants;
  if (dir === 2) {
    g.fillRect(cx - 3 + legOff * 2, y0 + 20, 3, 8 - Math.max(0, legOff));
    g.fillRect(cx + 1 - legOff * 2, y0 + 20, 3, 8 - Math.max(0, -legOff));
  } else {
    g.fillRect(cx - 4, y0 + 20 + Math.max(0, legOff), 3, 8 - Math.max(0, legOff));
    g.fillRect(cx + 1, y0 + 20 + Math.max(0, -legOff), 3, 8 - Math.max(0, -legOff));
  }
  // 鞋
  g.fillStyle = '#3A2A1E';
  if (dir === 2) { g.fillRect(cx - 3 + legOff * 2, y0 + 27, 3, 2); g.fillRect(cx + 1 - legOff * 2, y0 + 27, 3, 2); }
  else { g.fillRect(cx - 4, y0 + 27, 3, 2); g.fillRect(cx + 1, y0 + 27, 3, 2); }
  // 身体（背带工装）
  g.fillStyle = shirt; g.fillRect(cx - 5, y0 + 11, 10, 9);
  g.fillStyle = shirtD; g.fillRect(cx - 5, y0 + 18, 10, 2);
  g.fillStyle = pantsD; g.fillRect(cx - 3, y0 + 11, 2, 4); g.fillRect(cx + 1, y0 + 11, 2, 4); // 背带
  // 手臂
  const armSwing = swing >= 0 ? [-3, -5, -1][swing] : legOff * -1;
  g.fillStyle = shirt;
  if (dir === 2) {
    g.fillRect(cx + 4, y0 + 12 - armSwing, 3, 7);
    g.fillStyle = skin; g.fillRect(cx + 4, y0 + 18 - armSwing, 3, 2);
  } else {
    g.fillRect(cx - 7, y0 + 12 + armSwing, 2, 7); g.fillRect(cx + 5, y0 + 12 - armSwing, 2, 7);
    g.fillStyle = skin; g.fillRect(cx - 7, y0 + 18 + armSwing, 2, 2); g.fillRect(cx + 5, y0 + 18 - armSwing, 2, 2);
  }
  // 头
  g.fillStyle = skin; g.fillRect(cx - 4, y0 + 2, 8, 8);
  g.fillStyle = skinD; g.fillRect(cx - 4, y0 + 9, 8, 1);
  // 发
  g.fillStyle = hair;
  if (dir === 1) { g.fillRect(cx - 4, y0 + 0, 8, 9); g.fillStyle = hairD; g.fillRect(cx - 4, y0 + 8, 8, 2); }
  else {
    g.fillRect(cx - 4, y0 + 0, 8, 3); g.fillRect(cx - 4, y0 + 3, 1, 3); g.fillRect(cx + 3, y0 + 3, 1, 3);
    g.fillStyle = hairD; g.fillRect(cx - 4, y0 + 2, 8, 1);
  }
  // 脸
  g.fillStyle = '#23232E';
  if (dir === 0) { g.fillRect(cx - 2, y0 + 5, 1, 2); g.fillRect(cx + 1, y0 + 5, 1, 2); if (swing < 0) { g.fillStyle = skinD; g.fillRect(cx - 1, y0 + 8, 2, 1); } }
  else if (dir === 2) { g.fillRect(cx + 2, y0 + 5, 1, 2); g.fillStyle = skinD; g.fillRect(cx + 3, y0 + 7, 1, 1); }
}

export function makeSpriteChar(opt = {}) {
  const o = { skin: opt.skin || PAL.skin, hair: opt.hair || PAL.hair[0], shirt: opt.shirt || PAL.shirt[0], pants: opt.pants || PAL.pants };
  const frames = { down: [], up: [], side: [], swingDown: [], swingUp: [], swingSide: [] };
  for (let p = -1; p < 4; p++) {
    frames.down.push(makeTexture(W, H, (g) => drawFrame(g, 0, p, o)));
    frames.up.push(makeTexture(W, H, (g) => drawFrame(g, 1, p, o)));
    frames.side.push(makeTexture(W, H, (g) => drawFrame(g, 2, p, o)));
  }
  for (let s = 0; s < 3; s++) {
    frames.swingDown.push(makeTexture(W, H, (g) => drawFrame(g, 0, -1, o, s)));
    frames.swingUp.push(makeTexture(W, H, (g) => drawFrame(g, 1, -1, o, s)));
    frames.swingSide.push(makeTexture(W, H, (g) => drawFrame(g, 2, -1, o, s)));
  }
  const mat = new THREE.MeshLambertMaterial({ map: frames.down[0], transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const spriteGeo = new THREE.PlaneGeometry(1.0, 1.5);
  // 法线统一朝上：精灵与地面同受平行光/点光照明（昼夜变化、夜灯均生效），不再"自发亮"
  {
    const n = spriteGeo.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    n.needsUpdate = true;
  }
  const mesh = new THREE.Mesh(spriteGeo, mat);
  mesh.position.y = 0.72;
  const group = new THREE.Group();
  group.add(mesh);
  // 团影
  const shTex = makeTexture(32, 32, (g) => {
    const grad = g.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, 'rgba(10,12,20,0.42)'); grad.addColorStop(1, 'rgba(10,12,20,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
  });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02;
  group.add(blob);

  const api = {
    group, mesh, frames,
    dir: 'down', phase: -1, animT: 0, swingT: -1, flip: false,
    swing() { if (api.swingT < 0) api.swingT = 0; },
    update(dt, moving, running, facing) {
      // facing: 弧度（0=+z 朝镜头下方）
      const deg = ((facing * 180 / Math.PI) + 360) % 360;
      if (deg > 45 && deg <= 135) { api.dir = 'side'; api.flip = true; }        // +x 右→侧面朝右
      else if (deg > 135 && deg <= 225) { api.dir = 'up'; api.flip = false; }
      else if (deg > 225 && deg <= 315) { api.dir = 'side'; api.flip = false; }
      else { api.dir = 'down'; api.flip = false; }
      mesh.scale.x = api.flip ? -1 : 1;
      if (api.swingT >= 0) {
        api.swingT += dt * 4.5;
        const i = Math.min(2, Math.floor(api.swingT * 3));
        const key = api.dir === 'up' ? 'swingUp' : api.dir === 'side' ? 'swingSide' : 'swingDown';
        mat.map = frames[key][i];
        if (api.swingT >= 1) api.swingT = -1;
      } else if (moving) {
        api.animT += dt * (running ? 9 : 6.5);
        const i = Math.floor(api.animT) % 4;
        mat.map = frames[api.dir][i];
      } else {
        mat.map = frames[api.dir][0]; // 闲置帧
        api.animT = 0;
      }
      // billboard：面向镜头（仅绕 Y）
    },
    faceCamera(camera) {
      const camPos = new THREE.Vector3();
      camera.getWorldPosition(camPos);
      mesh.rotation.y = Math.atan2(camPos.x - group.position.x, camPos.z - group.position.z);
    },
  };
  return api;
}

// 玩家控制器（sprite 版）
export class PlayerController {
  constructor(char, camera, input) {
    this.char = char; this.camera = camera; this.input = input;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.yaw = Math.PI * 0.75;
    this.dist = 15; this.pitch = 0.66;
    this.speed = 4.2; this.runMul = 1.55;
    this.facing = Math.PI;
    this.moving = false; this.running = false;
    this.collide = null;
    this.target = null;
    this.frozen = false;
  }
  teleport(x, z) { this.pos.set(x, 0, z); this.target = null; }
  update(dt) {
    const inp = this.input;
    if (inp.mouse.wheel) this.dist = THREE.MathUtils.clamp(this.dist + inp.mouse.wheel * 1.3, 0.5, 26);
    // 第一人称切换（滞回：进 4.2 / 出 6.0）
    const wasFpv = this.fpv;
    if (this.dist < 4.2) this.fpv = true;
    else if (this.dist > 6) this.fpv = false;
    if (this.fpv && !wasFpv) { // 进入第一人称：锁定鼠标，视角初值
      this.fpPitch = -0.12;
      try { inp.dom?.requestPointerLock?.()?.catch?.(() => {}); } catch { /* 需用户手势时忽略 */ }
    } else if (!this.fpv && wasFpv) {
      document.exitPointerLock?.();
      if (inp.touchLook) { this.yaw = Math.PI * 0.75; this.pitch = 0.66; } // 触屏：退出第一人称恢复默认视角（电脑保持不变）
    }
    if (this.frozen && document.pointerLockElement) document.exitPointerLock?.();
    if (inp.hitKey('KeyQ')) this.yaw += Math.PI / 4;
    if (inp.hitKey('KeyR')) this.yaw -= Math.PI / 4;
    // 第一人称鼠标视角：移动鼠标即转向（指针锁定后取增量）；未锁定时点击画面重新锁定
    if (this.fpv && !document.pointerLockElement && inp.mouse.clicked && !this.frozen) {
      try { inp.dom?.requestPointerLock?.()?.catch?.(() => {}); } catch { /* 忽略 */ }
    }
    if (this.fpv && (document.pointerLockElement || inp.touchLook)) {
      const k = inp.touchLook ? 0.0048 : 0.0021; // 触屏灵敏度单独调高，电脑不变
      this.yaw += inp.mouse.mdx * k;
      this.fpPitch = THREE.MathUtils.clamp((this.fpPitch ?? -0.12) - inp.mouse.mdy * k, -1.15, 0.65);
    } else if (!this.fpv && inp.touchLook) {
      // 触屏第三人称：单指横拖 = 切换快捷栏（touchcontrols 手势层处理），此处不再转视角
    }
    // FOV：第一人称宽广 58°，第三人称 38°，平滑过渡（照相模式下交还用户控制）
    if (!this.freeCam) {
      const fovT = this.fpv ? 58 : 38;
      if (Math.abs(this.camera.fov - fovT) > 0.1) {
        this.camera.fov += (fovT - this.camera.fov) * Math.min(1, dt * 5);
        this.camera.updateProjectionMatrix();
      }
    }

    let vx = 0, vz = 0;
    if (!this.frozen) {
      const ax = inp.axis();
      if (ax.x || ax.z) {
        const len = Math.hypot(ax.x, ax.z); ax.x /= len; ax.z /= len;
        // 相机相对移动：F=远离相机（屏幕上方），R=屏幕右方
        const fx = -Math.cos(this.yaw), fz = -Math.sin(this.yaw);
        const rx = -fz, rz = fx;
        vx = rx * ax.x + fx * (-ax.z);
        vz = rz * ax.x + fz * (-ax.z);
        this.target = null;
      } else if (this.target) {
        const dx = this.target.x - this.pos.x, dz = this.target.z - this.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.15) this.target = null;
        else { vx = dx / d; vz = dz / d; }
      }
    }
    this.running = inp.down('run') && (vx || vz);
    const sp = this.speed * (this.running ? this.runMul : 1);
    this.moving = !!(vx || vz);
    if (this.moving) {
      const nx = this.pos.x + vx * sp * dt, nz = this.pos.z + vz * sp * dt;
      if (!this.collide || !this.collide(nx, this.pos.z)) this.pos.x = nx;
      if (!this.collide || !this.collide(this.pos.x, nz)) this.pos.z = nz;
      this.facing = Math.atan2(vx, vz);
      // FPV 下 A/D 为左右平移，镜头朝向不随移动改变（转向只用 Q/R）
    }
    // 站立高度（栈桥甲板等抬升面，平滑过渡）
    if (this.groundYFn) {
      const gy = this.groundYFn(this.pos.x, this.pos.z);
      this.pos.y += (gy - this.pos.y) * Math.min(1, dt * 10);
    }
    this.char.group.position.copy(this.pos);
    this.char.update(dt, this.moving, this.running, this.facing);
    this.char.group.visible = !this.fpv;
    if (!this.fpv) {
      this.char.faceCamera(this.camera);
      // 像素对齐修正：主角永远在画面正中，广告牌与屏幕平面完全平行时采样相位恒定对齐，
      // 边缘异常光滑（NPC 偏离画面中心有透视剪切，呈正常像素锯齿）；
      // 加固定微偏角让主角获得与 NPC 一致的亚像素剪切颗粒感，几何形变可忽略（cos≈0.995）
      this.char.mesh.rotation.y += 0.1;
    }
    if (this.freeCam) return; // 照相模式：相机由 main 自由驱动

    if (this.fpv) {
      // 第一人称：镜头贴头，朝 yaw/fpPitch 方向（鼠标控制），走路轻微视点颠簸
      const bob = this.moving ? Math.sin(performance.now() / 90) * 0.04 : 0;
      const head = new THREE.Vector3(this.pos.x, this.pos.y + 1.32 + bob, this.pos.z);
      this.camera.position.lerp(head, Math.min(1, dt * 12));
      const p = this.fpPitch ?? -0.12, cp = Math.cos(p);
      this.camera.lookAt(head.x - Math.cos(this.yaw) * cp * 5, head.y + Math.sin(p) * 5, head.z - Math.sin(this.yaw) * cp * 5);
    } else {
      const cx = this.pos.x + Math.cos(this.yaw) * this.dist * Math.cos(this.pitch);
      const cz = this.pos.z + Math.sin(this.yaw) * this.dist * Math.cos(this.pitch);
      const cy = this.pos.y + this.dist * Math.sin(this.pitch);
      this.camera.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, dt * 6));
      this.camera.lookAt(this.pos.x, this.pos.y + 0.6, this.pos.z);
    }
  }
}
