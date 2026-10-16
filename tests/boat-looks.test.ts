import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {createGltfLoader} from '../src/assets.ts';
import {bodyFile, type FileBody, type Height} from '../src/looks.ts';
import {scaleLimb} from '../src/walk-cycle.ts';
const targets = JSON.parse(await readFile(new URL('../art/boat-height-targets.json',import.meta.url),'utf8'));
async function load(file:string) {const b=await readFile(new URL('../public/assets/models/'+file,import.meta.url));return (await createGltfLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}

test('each short body keeps its original standing height with exactly the Tall proportions and rig', async()=>{
 for(const body of ['boy','girl','man','woman'] as FileBody[]){
  const tall=await load(bodyFile(body,'tall')), tallSize=new T.Box3().setFromObject(tall).getSize(new T.Vector3());
  for(const height of ['tiny','chibi','teen'] as Height[]){
   const file=bodyFile(body,height), short=await load(file), size=new T.Box3().setFromObject(short).getSize(new T.Vector3()), q=size.y/tallSize.y;
   assert.ok(Math.abs(size.y-targets[file])<.002,file+' keeps its old height');
   assert.ok(Math.abs(size.x/tallSize.x-q)<.0001&&Math.abs(size.z/tallSize.z-q)<.0001,file+' scales uniformly');
   for(const part of ['head','body','arm-left','arm-right','leg-left','leg-right']){
    const a=short.getObjectByName(part)!,b=tall.getObjectByName(part)!;
    assert.ok(a.position.distanceTo(b.position.clone().multiplyScalar(q))<.0001,file+' '+part+' pivot');
    assert.ok(a.scale.distanceTo(new T.Vector3(q,q,q))<.0001,file+' '+part+' proportions');
   }
  }
 }
});

test('punch scaling restores the authored small arms rather than stretching them back to full Tall size',()=>{
 const arm=new T.Group();arm.scale.setScalar(.85);
 scaleLimb(arm,1.3,2,1.3);assert.equal(arm.scale.y,1.7);
 scaleLimb(arm);assert.deepEqual(arm.scale.toArray(),[.85,.85,.85]);
 scaleLimb(arm,1,1.5,1);scaleLimb(arm);assert.deepEqual(arm.scale.toArray(),[.85,.85,.85]);
});
