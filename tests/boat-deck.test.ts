import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as T from 'three';
import { createGltfLoader, RefinedAssetLibrary } from '../src/assets.ts';
import { woodenSafeDeck, makeDeckHatch } from '../src/boat-deck.ts';

test('borrowed hatch keeps its animated lid after loading, baking and cloning', async () => {
  const bytes = await readFile(new URL('../public/assets/models/boat-hatch.glb', import.meta.url));
  const scene = (await createGltfLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
  const library = new RefinedAssetLibrary(async () => scene.clone(true)); await library.loadAll();
  const hatch = library.clone('hatch')!, lid = hatch.getObjectByName('door')!;
  assert.ok(lid, 'original hinge survives colour batching');
  const closed = new T.Box3().setFromObject(lid); lid.rotation.x = -1.9;
  const open = new T.Box3().setFromObject(lid);
  assert.ok(open.max.y > closed.max.y + 1, 'lid rises clear of the entrance');
  assert.equal(Math.abs(library.clone('hatch')!.getObjectByName('door')!.rotation.x), 0, 'instances have independent hinges');
  assert.ok(makeDeckHatch().getObjectByName('door'), 'fallback also has a working lid');
});

test('wooden deck covers the safe zone but leaves the pond open and owns its texture', () => {
  const deck = woodenSafeDeck(); deck.updateMatrixWorld(true);
  const ray = new T.Raycaster();
  const hit = (x: number, z: number) => { ray.set(new T.Vector3(x, 5, z), new T.Vector3(0, -1, 0)); return ray.intersectObject(deck).length > 0; };
  assert.ok(hit(5, 0)); assert.ok(hit(19.9, 21.9)); assert.ok(!hit(20.1, 0));
  assert.ok(!hit(-7.5, 11.2), 'water remains visible'); assert.ok(hit(0, -8), 'hatch recess hides the grass');
  const mesh = deck.getObjectByName('deck-planks') as T.Mesh<T.BufferGeometry, T.MeshToonMaterial>;
  assert.equal(mesh.material.map!.userData.owned, true, 'world rebuilds dispose the generated map');
});
