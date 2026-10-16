import { FURNITURE, footprintCircles, walkable, type Point } from './house.ts';
import { findRoute } from './navigation.ts';

/** Seats may contain the endpoint, but every other piece of furniture remains an obstacle. */
export function friendObstacles(from: Point, to: Point) {
  return FURNITURE.flatMap(p => {
    const circles = footprintCircles(p);
    return circles.some(o => [from, to].some(at => Math.hypot(at.x - o.x, at.z - o.z) < o.r + .18)) ? [] : circles;
  });
}
export const FRIEND_ROUTE_OPTIONS = { walkable, gridSize: .25, bounds: 16, clearance: .18, maxIterations: 12000 };
export function friendRoute(from: Point, to: Point) {
  return findRoute(from, to, friendObstacles(from, to), FRIEND_ROUTE_OPTIONS);
}
