// 世界地图数据与绘制：五区缩略示意图（canvas 手绘）+ 当前场景放大标注点位
// 供 UI 地图页调用：drawWorldMap(canvas, currentScene, playerPos, npcDots)
//   currentScene: 场景 id（'farm'|'town'|'beach'|'forest'|'mountain'）
//   playerPos: { x, z }（当前场景本地坐标）
//   npcDots: [{ scene, x, z, name, color? }]

const SCENE_META = {
  farm:     { name: '晨风农场', W: 48, H: 48, tint: '#7EC850' },
  town:     { name: '汐溪镇',   W: 56, H: 48, tint: '#C8A86A' },
  beach:    { name: '碎星海滩', W: 40, H: 32, tint: '#E8D8A8' },
  forest:   { name: '低语森林', W: 48, H: 40, tint: '#3E9B4F' },
  mountain: { name: '星峰山路', W: 40, H: 32, tint: '#8D8D96' },
};

// 缩略图布局（相对 520×400 逻辑画布）：农场北、山西北、林西、镇中、海滩东
const REGION_RECTS = {
  farm:     { x: 190, y: 14,  w: 120, h: 96 },
  mountain: { x: 330, y: 14,  w: 110, h: 88 },
  forest:   { x: 16,  y: 130, w: 132, h: 110 },
  town:     { x: 168, y: 130, w: 144, h: 118 },
  beach:    { x: 332, y: 130, w: 120, h: 100 },
};
const LINKS = [['farm', 'town'], ['farm', 'mountain'], ['farm', 'forest'], ['forest', 'town'], ['town', 'beach']];

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
const cx = (R) => R.x + R.w / 2, cy = (R) => R.y + R.h / 2;

// 各区缩略特征（简化手绘符号）
function drawRegionFeatures(g, id, R) {
  const sx = R.w / SCENE_META[id].W, sy = R.h / SCENE_META[id].H;
  const px = (x) => R.x + x * sx, py = (z) => R.y + z * sy;
  g.save();
  rr(g, R.x, R.y, R.w, R.h, 8); g.clip();
  if (id === 'farm') {
    g.fillStyle = '#6B4E2E'; g.fillRect(px(6), py(40), 20 * sx, 7 * sy);          // 农田
    g.fillStyle = '#E8DCC8'; g.fillRect(px(19), py(6), 7 * sx, 6 * sy);           // 农舍
    g.fillStyle = '#5FB4E8';
    g.beginPath(); g.ellipse(px(33), py(32), 4 * sx, 3.4 * sy, 0, 0, 7); g.fill(); // 池塘
    g.strokeStyle = '#B89B6A'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(px(23.5), R.y); g.lineTo(px(23.5), R.y + R.h); g.stroke(); // 小径
  } else if (id === 'town') {
    g.fillStyle = '#B8B0A0'; g.fillRect(px(22), py(18), 12 * sx, 12 * sy);        // 广场
    g.fillStyle = '#5FB4E8'; g.fillRect(px(47), R.y, 3 * sx, R.h);                // 河
    g.fillStyle = '#8D8D96';
    g.fillRect(px(46), py(6), 5 * sx, 2 * sy); g.fillRect(px(46), py(26), 5 * sx, 2 * sy); // 桥
    g.fillStyle = '#96422F';
    for (const [bx, bz] of [[18, 10], [31, 10], [6, 30], [41, 29], [14, 30], [14, 6], [37, 2]])
      g.fillRect(px(bx), py(bz), 4 * sx, 3 * sy);                                  // 建筑
  } else if (id === 'beach') {
    g.fillStyle = '#5FB4E8'; g.fillRect(px(29), R.y, R.w - 29 * sx, R.h);          // 海
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(px(28.2), R.y, 1.6 * sx, R.h); // 岸线
    g.fillStyle = '#9A6B3F'; g.fillRect(px(26), py(19), 9 * sx, 2 * sy);           // 码头
    g.fillStyle = '#8D8D96'; g.fillRect(px(9), py(25), 3 * sx, 3 * sy);            // 礁石
  } else if (id === 'forest') {
    g.fillStyle = '#247633';
    const trees = [[6, 6], [12, 30], [20, 8], [38, 8], [44, 30], [8, 24], [30, 34], [16, 16], [42, 18], [24, 30]];
    for (const [tx, tz] of trees) { g.beginPath(); g.arc(px(tx), py(tz), 3.2, 0, 7); g.fill(); }
    g.fillStyle = '#5FB4E8';
    g.beginPath(); g.ellipse(px(29), py(22), 6.5 * sx, 7.5 * sy, 0, 0, 7); g.fill(); // 湖
    g.fillStyle = '#B84A4A'; g.fillRect(px(9), py(7), 3 * sx, 2 * sy);             // 商队
  } else if (id === 'mountain') {
    g.fillStyle = '#6E6E78';
    for (const [mx, mw] of [[4, 12], [14, 14], [26, 12]]) {                        // 山峰
      g.beginPath(); g.moveTo(px(mx), py(10)); g.lineTo(px(mx + mw / 2), R.y + 2); g.lineTo(px(mx + mw), py(10)); g.closePath(); g.fill();
    }
    g.fillStyle = '#15131E'; g.fillRect(px(24), R.y, 2 * sx, R.h);                 // 裂谷
    g.fillStyle = '#2A2A32'; g.fillRect(px(11), py(2), 3 * sx, 3 * sy);            // 矿井口
    g.fillStyle = '#5FB4E8';
    g.beginPath(); g.ellipse(px(9), py(24), 4 * sx, 3 * sy, 0, 0, 7); g.fill();    // 山洞湖
  }
  g.restore();
}

function drawPlayerDot(g, x, y, r) {
  g.fillStyle = '#FFD98A';
  g.beginPath(); g.arc(x, y, r + 2.5, 0, 7); g.fill();
  g.fillStyle = '#FFFFFF';
  g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}

export function drawWorldMap(canvas, currentScene, playerPos, npcDots = []) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const sc = Math.min(W / 520, H / 400);
  g.clearRect(0, 0, W, H);
  g.save();
  g.scale(sc, sc);
  // 底板
  g.fillStyle = '#141622'; g.fillRect(0, 0, 520, 400);
  g.strokeStyle = '#4A5578'; g.lineWidth = 3; g.strokeRect(2, 2, 516, 396);
  // 连接虚线
  g.strokeStyle = '#8A92B8'; g.lineWidth = 2; g.setLineDash([6, 5]);
  for (const [a, b] of LINKS) {
    g.beginPath();
    g.moveTo(cx(REGION_RECTS[a]), cy(REGION_RECTS[a]));
    g.lineTo(cx(REGION_RECTS[b]), cy(REGION_RECTS[b]));
    g.stroke();
  }
  g.setLineDash([]);
  // 各区缩略
  for (const [id, R] of Object.entries(REGION_RECTS)) {
    g.fillStyle = SCENE_META[id].tint;
    rr(g, R.x, R.y, R.w, R.h, 8); g.fill();
    drawRegionFeatures(g, id, R);
    // 边框（当前场景金色高亮）
    g.strokeStyle = id === currentScene ? '#FFD98A' : '#3A4260';
    g.lineWidth = id === currentScene ? 4 : 2;
    rr(g, R.x, R.y, R.w, R.h, 8); g.stroke();
    // 名称
    g.font = 'bold 15px "Microsoft YaHei", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = '#05050C';
    g.fillText(SCENE_META[id].name, cx(R) + 1, R.y + R.h + 5);
    g.fillStyle = id === currentScene ? '#FFD98A' : '#E8E8F0';
    g.fillText(SCENE_META[id].name, cx(R), R.y + R.h + 4);
    // 概览上的 NPC 暗点
    const meta = SCENE_META[id];
    for (const n of npcDots) {
      if (n.scene !== id) continue;
      g.fillStyle = n.color || '#E86A6A';
      g.beginPath(); g.arc(R.x + (n.x / meta.W) * R.w, R.y + (n.z / meta.H) * R.h, 2.5, 0, 7); g.fill();
    }
  }
  // 当前场景玩家点（概览）
  const cur = SCENE_META[currentScene];
  if (cur && playerPos) {
    const R = REGION_RECTS[currentScene];
    drawPlayerDot(g, R.x + (playerPos.x / cur.W) * R.w, R.y + (playerPos.z / cur.H) * R.h, 3.5);
  }
  // 当前场景放大标注（左下角 190×150）
  if (cur) {
    const IX = 12, IY = 242, IW = 190, IH = 150;
    g.fillStyle = '#0C0E18';
    rr(g, IX, IY, IW, IH, 6); g.fill();
    g.strokeStyle = '#FFD98A'; g.lineWidth = 2; rr(g, IX, IY, IW, IH, 6); g.stroke();
    const pad = 22, mw = IW - pad * 2, mh = IH - pad * 2 - 10;
    g.fillStyle = cur.tint;
    rr(g, IX + pad, IY + pad, mw, mh, 4); g.fill();
    g.save();
    rr(g, IX + pad, IY + pad, mw, mh, 4); g.clip();
    drawRegionFeatures(g, currentScene, { x: IX + pad, y: IY + pad, w: mw, h: mh });
    g.restore();
    g.font = 'bold 13px "Microsoft YaHei", sans-serif';
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = '#FFD98A';
    g.fillText(cur.name + ' · 当前位置', IX + 10, IY + 11);
    const dot = (x, z) => [IX + pad + (x / cur.W) * mw, IY + pad + (z / cur.H) * mh];
    for (const n of npcDots) {
      if (n.scene !== currentScene) continue;
      const [nx, ny] = dot(n.x, n.z);
      g.fillStyle = n.color || '#E86A6A';
      g.beginPath(); g.arc(nx, ny, 3.5, 0, 7); g.fill();
      g.font = '11px "Microsoft YaHei", sans-serif';
      g.fillStyle = '#FFFFFF';
      g.fillText(n.name || '', nx + 6, ny);
    }
    if (playerPos) drawPlayerDot(g, ...dot(playerPos.x, playerPos.z), 4);
  }
  g.restore();
  return canvas;
}
