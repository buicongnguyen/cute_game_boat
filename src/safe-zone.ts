/**
 * The rectangular home deck (20 x 22 m half extents) and 11 m circles on other worlds: creatures never enter it, and nothing that happens
 * outside it pays the explorer inside it.
 */
/** Expanded deck: 40 m wide by 44 m deep; gate openings stay centred on each side. */
export const HOME_SAFE = { x: 20, z: 22 } as const;
export const HOME_GATES = [{ x: 20, z: 0, rot: Math.PI / 2 }, { x: -20, z: 0, rot: Math.PI / 2 }, { x: 0, z: -22, rot: 0 }, { x: 0, z: 22, rot: 0 }];
export const GATE_BEDS = [{ x: 18, z: 3 }, { x: -18, z: -3 }, { x: 3, z: -20 }, { x: -3, z: 20 }];
/** Signed boundary clearance: negative inside, positive outside. */
export const safeClearance = (p: { x: number; z: number }, planet: string) => planet === 'home' ? Math.max(Math.abs(p.x) - HOME_SAFE.x, Math.abs(p.z) - HOME_SAFE.z) : Math.hypot(p.x, p.z) - 11;
export const withinHome = (x: number, z: number, margin = 0) => Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) + margin < HOME_SAFE.x && Math.abs(z) + margin < HOME_SAFE.z;
export const homeFence = () => {
  const parts: Array<{ x: number; z: number; rot: number }> = [];
  for (const sign of [-1, 1]) {
    for (let x = -19; x <= 19; x += 2) if (Math.abs(x) > 2) parts.push({ x, z: sign * HOME_SAFE.z, rot: 0 });
    for (let z = -21; z <= 21; z += 2) if (Math.abs(z) > 2) parts.push({ x: sign * HOME_SAFE.x, z, rot: Math.PI / 2 });
  }
  return parts;
};
export const safeRadius = (planet: string) => planet === 'home' ? HOME_SAFE.x : 11;
export const inSafeZone = (p: { x: number; z: number }, planet: string) => safeClearance(p, planet) < 0;
/** How far from the explorer a creature may fall and still pay out when the explorer stands in the safe zone: the longest
 * reach in the kit (the snowball, 21 m) plus a big creature's radius, so anything you can hit from the fence still pays. */
export const SAFE_ZONE_REWARD_REACH = 24;
/**
 * Does a creature's fall pay the explorer (XP orbs, loot)? Alone in the world: not when the explorer stands in the safe zone
 * and the creature fell out of reach, whoever or whatever killed it (a neighbour, another creature, a hazard). Online, shared
 * kills are the server's rule, so this never blocks them.
 */
export function defeatPaysPlayer(player: { x: number; z: number }, fell: { x: number; z: number }, planet: string, online: boolean) {
  if (online || !inSafeZone(player, planet)) return true;
  return Math.hypot(fell.x - player.x, fell.z - player.z) <= SAFE_ZONE_REWARD_REACH;
}
