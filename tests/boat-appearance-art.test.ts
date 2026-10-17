import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { createGltfLoader } from '../src/assets.ts';
import { readGlb } from '../art/compress-models.mjs';

const bytes = (file: string) => readFileSync(new URL(`../public/assets/models/${file}.glb`, import.meta.url));
const hash = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
const costumes = ['dz_swimmer', 'dz_kpop', 'dz_yoga', 'dz_nurse'];

test('appearance append preserves every legacy compressed stream and model definition from ba81fc7', () => {
  // Pinned to the source assets before this addition, rather than trusting the generator's own metadata.
  const original = {
    'hero-parts': ['7f460985064aa0623d8951dfb5212741c9abd7c4dca3da16c4abc99870c7ce66', 'b5b562fb4c234755848eb73fdede9f9c29a660517802b5ceb5238c84212f07db'],
    disguises: ['70f35a66f74fce8a684579f1f70a14acc3dfc768bb8ce9deb3ba534d0db01d79', 'bf6224fad4e62fbd90d21c7f19582d875e5593c4b0fe71350a236f27bdebec97'],
  };
  for (const [file, [binaryHash, structureHash]] of Object.entries(original)) {
    const { json: doc, bin } = readGlb(bytes(file)), base = doc.extras.boatAppearance.base;
    assert.equal(hash(bin.subarray(0, base.binaryBytes)), binaryHash, `${file}: old compressed geometry bytes`);
    for (const [key, count] of Object.entries(base.counts)) doc[key] = doc[key].slice(0, count);
    doc.buffers = base.buffers;
    doc.scenes.forEach((scene: { nodes: number[] }, i: number) => { scene.nodes = base.scenes[i]; });
    for (const [i, children] of base.children) doc.nodes[i].children = children;
    doc.extensionsUsed = base.extensionsUsed; doc.extensionsRequired = base.extensionsRequired;
    delete doc.extras.boatAppearance;
    if (!Object.keys(doc.extras).length) delete doc.extras;
    assert.equal(hash(JSON.stringify(doc)), structureHash, `${file}: old materials, pivots, names and indices`);
  }
});

test('new costume roots have all six animated body parts, plain baked materials and bounded geometry', async () => {
  const data = bytes('disguises'), { json: doc } = readGlb(data);
  assert.ok(data.length <= 900 * 1024, `${data.length} bytes: existing whole-kit budget`);
  const scene = (await createGltfLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer, '')).scene;
  for (const id of costumes) {
    const root = doc.scenes[doc.scene ?? 0].nodes.map((i: number) => doc.nodes[i]).find((node: { name: string }) => node.name === id);
    assert.ok(root, id);
    const pieces = root.children.map((i: number) => doc.nodes[i]);
    const parts = new Set(pieces.map((piece: { name: string }) => piece.name.split('@')[1]));
    for (const part of ['arm-left', 'arm-right', 'body', 'head', 'leg-left', 'leg-right']) assert.ok(parts.has(part), `${id} covers ${part}`);
    for (const part of parts) assert.ok(['arm-left', 'arm-right', 'body', 'head', 'leg-left', 'leg-right', 'hand-right'].includes(part as string), `${id}: ${part} is a hero part`);
    let triangles = 0;
    for (const piece of pieces) {
      assert.ok(piece.name.startsWith(id + '_'), piece.name);
      for (const prim of doc.meshes[piece.mesh].primitives) {
        triangles += doc.accessors[prim.indices].count / 3;
        const material = doc.materials[prim.material];
        assert.equal(material.emissiveFactor, undefined, `${id}: no emission lost by avatar baking`);
        assert.equal(material.pbrMetallicRoughness?.baseColorTexture, undefined, `${id}: no texture lost by avatar baking`);
      }
    }
    assert.ok(triangles > 1000 && triangles <= 2500, `${id}: ${triangles} triangles`);
    const actual = scene.getObjectByName(id)!;
    const bounds = new T.Box3().setFromObject(actual);
    assert.ok(bounds.min.y > -.05 && bounds.max.y < 2.5 && bounds.min.x > -.8 && bounds.max.x < .8, `${id}: fitted around the default hero`);
    actual.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      const normal = object.geometry.getAttribute('normal');
      for (let i = 0; i < normal.count; i += 13) assert.ok(Math.abs(Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1) < .03, `${id}: decoded normals`);
    });
  }
});

// The Blender kit's costumes (art/blender/kit/build_everyday_disguises.py): each carries the named pieces that make it read
// as its job, and the ears keep their node names so saves and the mirror keep finding them.
test('each everyday costume loads the pieces that tell its job, and the bear and fox ears keep their names', async () => {
  const load = async (file: string) => { const data = bytes(file); return (await createGltfLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer, '')).scene; };
  const disguises = await load('disguises'), parts = await load('hero-parts');
  const must: Record<string, string[]> = {
    dz_swimmer: ['cap@head', 'ring@body', 'fin@leg-left', 'fin@leg-right', 'suit@body'],
    dz_kpop: ['hair@head', 'headset@head', 'crown@head', 'jacket@body', 'skirt@body', 'stick@hand-right'],
    dz_yoga: ['band@head', 'bun@head', 'mat@body', 'lotus@body', 'foot@leg-left'],
    dz_nurse: ['cap@head', 'dress@body', 'scope@body', 'pack@body', 'syringe@hand-right'],
  };
  for (const [id, pieces] of Object.entries(must)) for (const piece of pieces) assert.ok(disguises.getObjectByName(`${id}_${piece}`), `${id}_${piece}`);
  for (const name of ['ears-bear_ears', 'tail-bear_ears', 'ears-fox_ears', 'tail-fox_ears']) {
    const node = parts.getObjectByName(name); assert.ok(node, name); assert.equal(node.parent?.name, 'hero-parts', name + ' sits under hero-parts like the cat and bunny');
  }
  // Vivid, not pastel: every costume has at least three strongly saturated colours.
  for (const id of costumes) {
    const colours = new Set<string>(); disguises.getObjectByName(id)!.traverse(o => { if (o instanceof T.Mesh) for (const m of [o.material].flat() as T.MeshStandardMaterial[]) { const hsl = { h: 0, s: 0, l: 0 }; m.color.getHSL(hsl); if (hsl.s > .7 && hsl.l > .2 && hsl.l < .75) colours.add(m.color.getHexString()); } });
    assert.ok(colours.size >= 3, `${id}: ${[...colours]}`);
  }
});
