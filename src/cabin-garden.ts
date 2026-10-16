/** Downstairs garden: saved farm coordinates remain unchanged; only their presentation moves. */
import { HOUSE, CLEARANCE, walkable, type Point } from './house.ts';
export const CABIN_GARDEN = { x0: -20, x1: 18, z0: -16, z1: 16 } as const;
export const CABIN_PEN = { x: -16, z: 3, scale: .68 } as const;
export const GARDEN_DOOR = { x: -8.6, z: HOUSE.bounds.z1 } as const;
/** Keep the whole animal body on grass, outside the cabin walls. */
export function gardenGround(x: number, z: number, radius = CLEARANCE) {
  const g = CABIN_GARDEN, b = HOUSE.bounds, edge = radius + .3;
  return x > g.x0 + edge && x < g.x1 - edge && z > g.z0 + edge && z < g.z1 - edge
    && (x < b.x0 - edge || x > b.x1 + edge || z < b.z0 - edge || z > b.z1 + edge);
}
/** The kitchen's garden doorway joins the green perimeter to the indoor rooms. */
export function cabinWalkable(p: Point) {
  return walkable(p) || gardenGround(p.x, p.z)
    || Math.abs(p.x - GARDEN_DOOR.x) < .62 && Math.abs(p.z - GARDEN_DOOR.z) < .9;
}
