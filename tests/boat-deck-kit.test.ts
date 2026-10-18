import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as T from 'three';
import { createGltfLoader } from '../src/assets.ts';
import { boatDeckKit, deckFurniture, pondFrame, extraRailPosts, deckLanterns, DECK_CARGO } from '../src/boat-deck.ts';
import { homeFence, HOME_GATES, HOME_SAFE } from '../src/safe-zone.ts';
import { HOME_POND } from '../src/pond-shape.ts';
import { createHarpoonProjectile } from '../src/harpoon-art.ts';

// The Blender boat kit (art/blender/kit/build_boat_deck.py): named models, budgets and the instanced deck furniture.
const load = async (file: string) => { const b = await readFile(new URL(`../public/assets/models/${file}`, import.meta.url)); return (await createGltfLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '')).scene; };
const tris = (o: T.Object3D) => { let n = 0; o.traverse(m => { if (m instanceof T.Mesh) n += (m.geometry.index?.count ?? m.geometry.getAttribute('position').count) / 3; }); return n; };
(boatDeckKit as unknown as { loadScene: () => Promise<T.Group> }).loadScene = () => load('boat-deck.glb');

test('boat kit holds every model the deck code reads, within budget', async () => {
  const scene = await load('boat-deck.glb');
  const budget: Record<string, number> = { rail: 200, rail_post: 100, boat_gate: 1900, deck_cargo: 1600, deck_lantern: 260, pond_frame: 3000, harpoon: 240 };
  for (const [name, max] of Object.entries(budget)) { const o = scene.getObjectByName(name); assert.ok(o, name); assert.ok(tris(o!) <= max, `${name} ${tris(o!)} > ${max}`); }
  const rail = new T.Box3().setFromObject(scene.getObjectByName('rail')!);
  assert.ok(Math.abs(rail.min.x + 1.1) < .05 && Math.abs(rail.max.x - 1) < .06, 'one 2 m segment along x, post at -1');
  const frame = new T.Box3().setFromObject(scene.getObjectByName('pond_frame')!);
  assert.ok(Math.abs(frame.max.x - (HOME_POND.rx + .5)) < .1 && Math.abs(frame.max.z - (HOME_POND.rz + .5)) < .1, 'frame fits the pond');
});

test('deck furniture places every fence segment, post, gate and dressing piece on shared baked parts', async () => {
  await boatDeckKit.load();
  const pieces = deckFurniture(), count = (name: string) => pieces.filter(g => g.name === name).length;
  assert.equal(count('rail'), homeFence().length); assert.equal(count('boat_gate'), HOME_GATES.length);
  assert.equal(count('rail_post'), extraRailPosts().length); assert.equal(count('deck_lantern'), deckLanterns().length); assert.equal(count('deck_cargo'), DECK_CARGO.length);
  // Plain copies on shared geometry and one baked material, so World.batchScenery folds them into its culled chunks.
  const materials = new Set<T.Material>(); for (const g of pieces) g.traverse(o => { if (o instanceof T.Mesh) { assert.ok(!(o instanceof T.InstancedMesh)); materials.add(o.material as T.Material); } });
  assert.ok(materials.size <= 2, `${materials.size} materials`); assert.ok(pieces.every(g => !g.userData.environment));
  for (const p of [...DECK_CARGO, ...deckLanterns(), ...extraRailPosts()]) assert.ok(Math.abs(p.x) <= HOME_SAFE.x && Math.abs(p.z) <= HOME_SAFE.z);
  const rail = pieces.find(g => g.name === 'rail')!; assert.ok(Math.abs(Math.abs(rail.position.z) - HOME_SAFE.z) < .01 || Math.abs(Math.abs(rail.position.x) - HOME_SAFE.x) < .01);
  const frame = pondFrame()!; frame.updateMatrixWorld(true);
  const ray = new T.Raycaster(new T.Vector3(HOME_POND.rx + .2, 5, 0), new T.Vector3(0, -1, 0));
  assert.equal(ray.intersectObject(frame).length, 0, 'taps on the frame fall through to walking');
  const harpoon = createHarpoonProjectile(); assert.ok(tris(harpoon) > 84, 'Blender harpoon');
  assert.notEqual(harpoon.geometry.userData.sharedKit, true); assert.notEqual((harpoon.material as T.Material).userData.sharedKit, true);
});

test('hatch keeps the hinge contract and fits the obstacle', async () => {
  const hatch = await load('boat-hatch.glb'), root = hatch.getObjectByName('hatch')!, door = hatch.getObjectByName('door')!;
  assert.ok(root && door && door.parent === root); assert.ok(door.position.z < -.8, 'hinge at the back');
  const box = new T.Box3().setFromObject(root); assert.ok(tris(root) <= 3000);
  assert.ok(Math.max(-box.min.z, box.max.z) * 1.8 < 1.9, 'coaming within the 1.7 m obstacle plus the lantern');
});
