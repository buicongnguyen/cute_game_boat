import * as T from 'three';
import { HOME_POND } from './pond-shape.ts';
import { toonMaterial } from './toon.ts';
import { HOME_SAFE, HOME_GATES, homeFence } from './safe-zone.ts';
import { KitLibrary, modelUrl } from './assets.ts';

export const HATCH_SCALE = 1.8;
/**
 * The boat deck kit (art/blender/kit/build_boat_deck.py): rope rails, rail posts, mast-post gates, deck cargo, lanterns and
 * the home pond's timber frame. Loaded with the opening art; until it arrives (or if it fails) the village pickets stand in.
 */
export const boatDeckKit = new KitLibrary([modelUrl('boat-deck.glb')]);
export interface DeckSpot { x: number; z: number; rot: number; scale?: number }

/**
 * Every copy of a boat kit model as instances: one draw per merged part (a whole rail run is one draw plus its shadow),
 * however many copies. Geometry and materials are the kit's shared ones; world disposal leaves them alone.
 */
export function deckInstances(name: string, spots: DeckSpot[], shadows = true): T.Group | null {
  const parts = boatDeckKit.ready ? boatDeckKit.mergedParts(name) : undefined;
  if (!parts || !spots.length) return null;
  const group = new T.Group(); group.name = `deck-${name}`; group.userData.environment = true; // kept out of world batching, which would flatten the instances
  const matrix = new T.Matrix4(), turn = new T.Quaternion(), up = new T.Vector3(0, 1, 0), size = new T.Vector3(), at = new T.Vector3();
  for (const part of parts) {
    const batch = new T.InstancedMesh(part.geometry, part.material, spots.length); batch.name = `${name}-batch`;
    spots.forEach((p, i) => { turn.setFromAxisAngle(up, p.rot); size.setScalar(p.scale ?? 1); batch.setMatrixAt(i, matrix.compose(at.set(p.x, 0, p.z), turn, size).multiply(part.matrix)); });
    batch.computeBoundingSphere(); batch.castShadow = shadows; batch.receiveShadow = true; group.add(batch);
  }
  return group;
}

/** Posts the rail run does not bring itself: the four corners and both sides of every gate (segments own only their -x post). */
export function extraRailPosts(): DeckSpot[] {
  const posts: DeckSpot[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) posts.push({ x: sx * HOME_SAFE.x, z: sz * HOME_SAFE.z, rot: 0 });
  for (const g of HOME_GATES) for (const s of [-2, 2]) posts.push(g.rot ? { x: g.x, z: s, rot: g.rot } : { x: s, z: g.z, rot: 0 });
  return posts;
}
/** Deck cargo in the four inner corners and a lantern either side of each gate, inside the rails: walk-through dressing. */
export const DECK_CARGO: DeckSpot[] = [{ x: -17.4, z: -19.4, rot: Math.PI }, { x: 17.4, z: -19.4, rot: Math.PI }, { x: -17.4, z: 19.4, rot: 0 }, { x: 17.4, z: 19.4, rot: 0 }];
export function deckLanterns(): DeckSpot[] {
  const spots: DeckSpot[] = [];
  for (const g of HOME_GATES) for (const s of [-2.7, 2.7]) {
    const inward = .75;
    spots.push(g.rot ? { x: g.x - Math.sign(g.x) * inward, z: s, rot: g.x > 0 ? Math.PI : 0 } : { x: s, z: g.z - Math.sign(g.z) * inward, rot: g.z > 0 ? Math.PI / 2 : -Math.PI / 2 });
  }
  return spots;
}

/** One placed copy of a boat kit model: its merged, baked-colour parts on shared geometry and material. */
export function deckPiece(name: string, p: DeckSpot, shadows = true): T.Group | null {
  const parts = boatDeckKit.ready ? boatDeckKit.mergedParts(name) : undefined;
  if (!parts) return null;
  const group = new T.Group(); group.name = name;
  for (const part of parts) { const mesh = new T.Mesh(part.geometry, part.material); mesh.applyMatrix4(part.matrix); mesh.castShadow = shadows; mesh.receiveShadow = true; group.add(mesh); }
  group.position.set(p.x, 0, p.z); group.rotation.y = p.rot; return group;
}
/**
 * The deck's rails, gates and dressing from the boat kit (80 rail segments, 12 posts, 4 gates, 4 cargo corners, 8 lanterns),
 * as plain placed copies: World.batchScenery merges them by material into its culled 48 m chunks with the trees, so the
 * whole run costs a few draws, as the old pickets did. Empty until the kit has loaded; the caller then keeps the pickets.
 * Collision is the caller's (world.ts adds the same fence obstacles either way).
 */
export function deckFurniture(): T.Group[] {
  if (!boatDeckKit.ready || !boatDeckKit.has('rail')) return [];
  const pieces: Array<T.Group | null> = [];
  // Rails and posts cast no shadow: 80 thin ropes would double their triangles in the shadow pass for little gain.
  for (const p of homeFence()) pieces.push(deckPiece('rail', p, false));
  for (const p of extraRailPosts()) pieces.push(deckPiece('rail_post', p, false));
  for (const p of HOME_GATES) pieces.push(deckPiece('boat_gate', p));
  for (const p of DECK_CARGO) pieces.push(deckPiece('deck_cargo', p, false));
  for (const p of deckLanterns()) pieces.push(deckPiece('deck_lantern', p, false));
  return pieces.filter((g): g is T.Group => !!g);
}

/** The home pond's timber frame and pool floor (one draw). It never takes taps: the water alone is picked for casting. */
export function pondFrame(): T.Group | null {
  const frame = deckInstances('pond_frame', [{ x: 0, z: 0, rot: 0 }], false);
  frame?.traverse(o => { o.raycast = () => {}; });
  return frame;
}

/** Cloudback's procedural hatch remains usable if the hatch model cannot load. */
export function makeDeckHatch() {
  const wrapper = new T.Group(), hatch = new T.Group();
  const rim = new T.Mesh(new T.TorusGeometry(.78, .12, 10, 28).rotateX(Math.PI / 2), toonMaterial({ color: '#f5b21e' }));
  rim.position.y = .08; hatch.add(rim);
  const hole = new T.Mesh(new T.CircleGeometry(.72, 28).rotateX(-Math.PI / 2), toonMaterial({ color: '#1a1d33' }));
  hole.position.y = .03; hatch.add(hole);
  const door = new T.Group(); door.name = 'door'; door.position.set(0, .14, -.75);
  const lid = new T.Mesh(new T.CylinderGeometry(.74, .74, .1, 28), toonMaterial({ color: '#c77a3a' }));
  lid.position.z = .75; door.add(lid); hatch.add(door);
  hatch.scale.setScalar(HATCH_SCALE); hatch.position.y = .03; wrapper.add(hatch);
  return wrapper;
}

/** Cheap integer hash for repeatable plank tones. */
const hash = (a: number, b: number) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 13; return ((Math.imul(h, 1103515245) >>> 0) % 1000) / 1000; };
/**
 * Warm deck boards: eight 0.5 m boards across 4 m, 8 m long repeats, each board in two or three lengths with butt joints
 * staggered board to board. Every length picks one of five warm tones (honey to caramel), with fine lengthwise grain, a
 * dark caulked seam with a light top edge, and a pair of brass-dark nails at each joint, so the 40 x 44 m deck reads as
 * real planking instead of one flat orange.
 */
function plankTexture() {
  const width = 512, height = 1024, board = 64, bytes = new Uint8Array(width * height * 4);
  const tones = [[226, 150, 80], [214, 138, 70], [234, 164, 92], [220, 144, 74], [206, 132, 66]];
  const joints = Array.from({ length: 8 }, (_, b) => { const first = Math.round(hash(b, 7) * 400) + 40; return [first, first + 360 + Math.round(hash(b, 11) * 200)]; });
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const b = Math.floor(x / board), across = x % board, [j0, j1] = joints[b];
    const piece = y < j0 ? 0 : y < j1 ? 1 : 2, segment = piece === 2 ? 0 : piece; // the last length wraps into the first
    const fromJoint = Math.min(Math.abs(y - j0), Math.abs(y - j1), y, height - y);
    const tone = tones[Math.floor(hash(b, segment * 3 + 1) * tones.length)];
    const seam = across < 3 || fromJoint < 2, lip = across === 3 || fromJoint === 2;
    const grain = Math.sin(across * .9 + Math.sin(y * .02 + b * 3) * 2.2) * .035 + Math.sin(across * .23 + y * .004 + b) * .03;
    const knot = Math.hypot(across - 20 - hash(b, segment) * 26, (y - (segment ? j0 + 140 : 120)) * .45) < 4 ? -.12 : 0;
    const nail = (across === 12 || across === 52) && fromJoint >= 6 && fromJoint <= 8;
    const shade = seam ? .45 : nail ? .6 : lip ? 1.07 : 1 + grain + knot;
    const i = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) bytes[i + c] = Math.min(255, Math.round((seam ? [112, 58, 30][c] / .45 : tone[c]) * shade));
    bytes[i + 3] = 255;
  }
  const map = new T.DataTexture(bytes, width, height); map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping; map.repeat.set(1 / 4, 1 / 8);
  map.magFilter = T.LinearFilter; map.minFilter = T.LinearMipmapLinearFilter; map.generateMipmaps = true; map.anisotropy = 4;
  map.userData.owned = true; map.needsUpdate = true; return map;
}

/** A single deck surface inside the home fence, with a cutout around the existing fishing pond. */
export function woodenSafeDeck() {
  const group = new T.Group(); group.name = 'wooden-safe-deck'; group.userData.environment = true;
  const shape = new T.Shape(); shape.moveTo(-HOME_SAFE.x, -HOME_SAFE.z); shape.lineTo(HOME_SAFE.x, -HOME_SAFE.z); shape.lineTo(HOME_SAFE.x, HOME_SAFE.z); shape.lineTo(-HOME_SAFE.x, HOME_SAFE.z); shape.closePath();
  // Shape y becomes world -z. The bank and water keep their original geometry and fishing bounds.
  const p=HOME_POND,x=p.x,z=-p.z,rx=p.rx+.45,rz=p.rz+.45;
  const pond = new T.Path(); pond.moveTo(x-rx,z-rz);pond.lineTo(x-rx,z+rz);pond.lineTo(x+rx,z+rz);pond.lineTo(x+rx,z-rz);pond.closePath();shape.holes.push(pond);
  const deck = new T.Mesh(new T.ShapeGeometry(shape, 96).rotateX(-Math.PI / 2), toonMaterial({ map: plankTexture(), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  deck.name = 'deck-planks'; deck.position.y = 0; deck.receiveShadow = true; group.add(deck);
  // A dark recess beneath the hatch covers the grass without changing navigation height (inside the 1.53 m coaming).
  const shaft = new T.Mesh(new T.CircleGeometry(1.3, 32).rotateX(-Math.PI / 2), toonMaterial({ color: '#171b29' }));
  shaft.name = 'hatch-shaft'; shaft.position.set(0, .024, -8); group.add(shaft);
  return group;
}
