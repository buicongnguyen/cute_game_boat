import * as T from 'three';
import { CABIN_GARDEN, CABIN_PEN, GARDEN_DOOR, gardenGround } from './cabin-garden.ts';

/** Low, walk-through planting, batched with the cabin shell. Keep the pen and entrance legible. */
export function meadowPlants() {
  let seed = 4187;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const plants: { x: number; z: number; height: number; flower: boolean; angle: number }[] = [];
  const g = CABIN_GARDEN;
  for (let i = 0; i < 1800; i++) {
    const x = g.x0 + random() * (g.x1 - g.x0), z = g.z0 + random() * (g.z1 - g.z0);
    if (!gardenGround(x, z, .35) || Math.abs(x - GARDEN_DOOR.x) < .95 && z > 9 ||
        ((x - CABIN_PEN.x) / 2.8) ** 2 + ((z - CABIN_PEN.z) / 2.4) ** 2 < 1) continue;
    plants.push({ x, z, height: .16 + random() * .18, flower: random() < .17, angle: random() * Math.PI * 2 });
  }
  return plants;
}

export function meadowGeometry() {
  const positions: number[] = [], colors: number[] = [], color = new T.Color();
  const tri = (a: number[], b: number[], c: number[], hex: string, double = false) => {
    color.set(hex); positions.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
    if (double) { positions.push(...c, ...b, ...a); for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b); }
  };
  meadowPlants().forEach((p, index) => {
    for (let k = 0; k < 3; k++) {
      const a = p.angle + k * 2.1, dx = Math.cos(a), dz = Math.sin(a), h = p.height * (1 - k * .13);
      tri([p.x - dx * .075, -.02, p.z - dz * .075], [p.x + dx * .075, -.02, p.z + dz * .075],
        [p.x + dz * .09, h, p.z - dx * .09], ['#579342', '#6aa64c', '#7ab457'][k], true);
    }
    if (!p.flower) return;
    const y = p.height + .045, hue = ['#fff2bd', '#f6c4d6', '#c5b5f0', '#fffaf0'][index % 4];
    for (let k = 0; k < 5; k++) {
      const a = p.angle + k * Math.PI * 2 / 5, dx = Math.cos(a), dz = Math.sin(a);
      const tip = [p.x + dx * .15, y - .025, p.z + dz * .15];
      tri([p.x, y, p.z], [p.x + dx * .07 - dz * .06, y + .015, p.z + dz * .07 + dx * .06], tip, hue, true);
      tri([p.x, y, p.z], tip, [p.x + dx * .07 + dz * .06, y + .015, p.z + dz * .07 - dx * .06], hue, true);
    }
    tri([p.x - .045, y + .02, p.z - .035], [p.x, y + .02, p.z + .05], [p.x + .045, y + .02, p.z - .035], '#eebc47', true);
  });
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
