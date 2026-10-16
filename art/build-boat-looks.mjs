/** Rebuild the boat's short heights from Tall while preserving the original standing heights.
 * Run with Node 24+: node --experimental-strip-types art/build-boat-looks.mjs
 * Keep each root limb's scale: clothing and ear/hood geometry attach in Tall part space and shrink with it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Box3, Vector3 } from 'three';
import { createGltfLoader } from '../src/assets.ts';
import { readGlb, writeGlb } from './compress-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), models=path.join(root,'public/assets/models');
const targetFile=path.join(root,'art/boat-height-targets.json');
const loader=createGltfLoader();
async function height(file){const b=fs.readFileSync(path.join(models,file));const scene=(await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;return new Box3().setFromObject(scene).getSize(new Vector3()).y;}
const file=(body,height)=>body==='boy'&&height==='chibi'?'hero.glb':`hero-${[...(body==='boy'?[]:[body]),...(height==='chibi'?[]:[height])].join('-')}.glb`;
let targets=fs.existsSync(targetFile)?JSON.parse(fs.readFileSync(targetFile,'utf8')):{};
for(const body of ['boy','girl','man','woman'])for(const size of ['tiny','chibi','teen']){const name=file(body,size);targets[name]??=await height(name);}
fs.writeFileSync(targetFile,JSON.stringify(targets,null,2)+'\n');
for(const body of ['boy','girl','man','woman']){
 const source=file(body,'tall'), tallHeight=await height(source), {json,bin}=readGlb(fs.readFileSync(path.join(models,source)));
 for(const size of ['tiny','chibi','teen']){
  const name=file(body,size), q=targets[name]/tallHeight, doc=structuredClone(json), hero=doc.nodes.find(n=>n.name==='hero');
  for(const i of hero.children){const n=doc.nodes[i];n.translation=(n.translation??[0,0,0]).map(v=>v*q);n.scale=(n.scale??[1,1,1]).map(v=>v*q);}
  fs.writeFileSync(path.join(models,name),writeGlb(doc,bin));console.log(`${name}: Tall x ${q.toFixed(5)}, target ${targets[name].toFixed(4)} m`);
 }
}
