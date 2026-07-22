// 无缝世界：5 区域统一坐标系（农场为原点，其余按邻接偏移）
// farm(0,0)48×48 | town(0,48)56×48 | forest(48,8)48×40 | beach(56,48)40×32 | mountain(4,-32)40×32
export const REGIONS = {
  farm: { id: 'farm', name: '晨风农场', ox: 0, oz: 0 },
  town: { id: 'town', name: '汐溪镇', ox: 0, oz: 48, bounds: [-40, 48, 96, 48] }, // bounds = 区域判定范围（含西巷区），ox/oz 仅坐标偏移
  forest: { id: 'forest', name: '低语森林', ox: 48, oz: 8 },
  beach: { id: 'beach', name: '白汐海滩', ox: 56, oz: 48 },
  mountain: { id: 'mountain', name: '星峰山路', ox: 4, oz: -32 },
};
export const toWorld = (scene, x, z) => [x + REGIONS[scene].ox, z + REGIONS[scene].oz];
export const toLocal = (scene, x, z) => [x - REGIONS[scene].ox, z - REGIONS[scene].oz];
// 世界坐标 → 区域 id（无覆盖处返回 null = 虚空/不可达）
export function regionAt(scenes, x, z) {
  for (const id of Object.keys(REGIONS)) {
    const sc = scenes.get(id);
    if (!sc) continue;
    const r = REGIONS[id];
    const bx = r.bounds ? r.bounds[0] : r.ox, bz = r.bounds ? r.bounds[1] : r.oz;
    const bw = r.bounds ? r.bounds[2] : sc.W, bh = r.bounds ? r.bounds[3] : sc.H;
    if (x >= bx && x < bx + bw && z >= bz && z < bz + bh) return id;
  }
  return null;
}
