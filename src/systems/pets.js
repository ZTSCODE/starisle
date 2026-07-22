// 宠物系统：猫/狗，农场陪伴、每日互动、喂食水盆
import * as THREE from 'three';
import { makeTexture, shade } from '../render/textures.js';

const PET_DEFS = {
  cat: { name: '小猫', body: '#8A8A96', belly: '#D8D8E0', ear: 'point', sound: 660 },
  dog: { name: '小狗', body: '#B8894A', belly: '#E8D8B8', ear: 'flop', sound: 330 },
};

export class Pets {
  constructor(game) {
    this.game = game;
    const kind = game.state.player.pet === 'dog' ? 'dog' : 'cat';
    this.kind = kind;
    if (!game.state.pet) game.state.pet = { kind, love: 0, pettedToday: false, x: 22, z: 20 };
    const def = PET_DEFS[kind];
    this.sprite = this.makePet(def);
    this.sprite.position.set(game.state.pet.x, 0, game.state.pet.z);
    game.engine.scene.add(this.sprite);
    this.t = 0;
    this.wanderT = 2;
    this.target = null;
    game.bus.on('day-start', () => { game.state.pet.pettedToday = false; });
  }
  makePet(def) {
    const tex = makeTexture(16, 14, (g) => {
      g.clearRect(0, 0, 16, 14);
      g.fillStyle = def.body;
      g.fillRect(3, 6, 10, 6); // 身
      g.fillRect(11, 3, 5, 5); // 头
      g.fillStyle = def.belly; g.fillRect(4, 10, 6, 2);
      g.fillStyle = def.body;
      if (def.ear === 'point') { g.fillRect(11, 1, 1, 2); g.fillRect(15, 1, 1, 2); }
      else { g.fillRect(10, 3, 1, 4); g.fillRect(16, 3, 1, 4); }
      g.fillStyle = '#2A2A32'; g.fillRect(13, 5, 1, 1); g.fillRect(15, 5, 1, 1);
      g.fillStyle = def.body; g.fillRect(1, 4, 2, 2); // 尾
    });
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.48), new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    m.position.y = 0.26;
    g.add(m);
    const shTex = makeTexture(16, 16, (gg) => {
      const grad = gg.createRadialGradient(8, 8, 1, 8, 8, 7);
      grad.addColorStop(0, 'rgba(10,12,20,0.35)'); grad.addColorStop(1, 'rgba(10,12,20,0)');
      gg.fillStyle = grad; gg.fillRect(0, 0, 16, 16);
    });
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02;
    g.add(blob);
    g.userData.sprite = m;
    return g;
  }
  pet() {
    const g = this.game;
    if (g.state.pet.pettedToday) {
      g.effects.floatText(this.sprite.position.clone().add(new THREE.Vector3(0, 0.8, 0)), '（满足地眯起眼）', '#D8B8E8', 11);
      return false;
    }
    g.state.pet.pettedToday = true;
    g.state.pet.love = Math.min(1000, g.state.pet.love + 12);
    g.audio.tone({ freq: PET_DEFS[this.kind].sound, dur: 0.15, type: 'triangle', vol: 0.14 });
    g.effects.burst(this.sprite.position.clone().add(new THREE.Vector3(0, 0.5, 0)), ['#FF8AB8', '#FFD98A'], 6, 1.2, 2);
    g.effects.floatText(this.sprite.position.clone().add(new THREE.Vector3(0, 0.8, 0)), `${PET_DEFS[this.kind].name}很开心 ♥`, '#FF8AB8', 12);
    g.bus.emit('pet-petted');
    return true;
  }
  update(dt) {
    const g = this.game;
    if (g.state.player.scene !== 'farm') { this.sprite.visible = false; return; }
    this.sprite.visible = true;
    this.t += dt; this.wanderT -= dt;
    const p = g.player.pos;
    const d = Math.hypot(p.x - this.sprite.position.x, p.z - this.sprite.position.z);
    // 跟随玩家（距离>4 时）或随机漫步
    if (d > 4.5) this.target = { x: p.x + (Math.random() - 0.5) * 2, z: p.z + (Math.random() - 0.5) * 2 };
    else if (this.wanderT <= 0) { this.wanderT = 3 + Math.random() * 5; this.target = Math.random() < 0.5 ? null : { x: 18 + Math.random() * 12, z: 16 + Math.random() * 10 }; }
    if (this.target) {
      const dx = this.target.x - this.sprite.position.x, dz = this.target.z - this.sprite.position.z;
      const dd = Math.hypot(dx, dz);
      if (dd < 0.3) this.target = null;
      else {
        const sp = d > 6 ? 3.4 : 1.6;
        this.sprite.position.x += dx / dd * sp * dt;
        this.sprite.position.z += dz / dd * sp * dt;
        this.sprite.userData.sprite.rotation.y = dx > 0 ? 0 : Math.PI;
      }
    }
    this.sprite.userData.sprite.position.y = 0.26 + Math.abs(Math.sin(this.t * 6)) * (this.target ? 0.05 : 0.01);
    this.sprite.userData.sprite.rotation.y = this.sprite.userData.sprite.rotation.y; // billboard 交给主循环可，简单保持
    g.state.pet.x = this.sprite.position.x; g.state.pet.z = this.sprite.position.z;
  }
  near() {
    const g = this.game;
    return g.state.player.scene === 'farm' && Math.hypot(g.player.pos.x - this.sprite.position.x, g.player.pos.z - this.sprite.position.z) < 1.3;
  }
  serialize() {}
  deserialize() {}
}
