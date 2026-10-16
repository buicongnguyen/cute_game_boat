/** Reference-game face transfer, preserving every body, height, pivot and clothing fit.
 * node --experimental-strip-types art/build-boat-faces.mjs
 * Then rebuild short heights and compress hero GLBs. Pass an optional reference models directory. Safe to rerun.
 */
import fs from 'node:fs';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import path from 'node:path';
const referenceModels=path.resolve(process.argv[2]??'../3d_farmer_fish_sell/public/assets/models');
import {readGlb,writeGlb} from './compress-models.mjs';
import {createGltfLoader} from '../src/assets.ts';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}};
for(const body of ['boy','girl','man','woman'])for(const size of ['tall','grown']){
 const name='hero-'+(body==='boy'?'':body+'-')+size+'.glb',file=new URL('../public/assets/models/'+name,import.meta.url),b=fs.readFileSync(file);
 if(!fs.existsSync(file))continue;
 const scene=(await createGltfLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene,hero=scene.getObjectByName('hero'),head=scene.getObjectByName('head');
 // Copy only facial decals, preserving the boat's neck, body, rig and clothing fit.
 const refBytes=fs.readFileSync(path.join(referenceModels,name.replace('hero-man-','hero-').replace('hero-woman-','hero-girl-')));
 const reference=(await createGltfLoader().parseAsync(refBytes.buffer.slice(refBytes.byteOffset,refBytes.byteOffset+refBytes.byteLength),'')).scene.getObjectByName('head');
 const skin=head.children.find(o=>o.isMesh&&o.material.name==='Hero skin'),refSkin=reference.children.find(o=>o.isMesh&&o.material.name==='Hero skin');
 skin.geometry.computeBoundingBox();refSkin.geometry.computeBoundingBox();
 const scale=skin.geometry.boundingBox.max.x/refSkin.geometry.boundingBox.max.x;
 for(const material of ['Hero eye','Hero pants','Hero blush']){
  const target=head.children.find(o=>o.isMesh&&o.material.name===material),source=reference.children.find(o=>o.isMesh&&o.material.name===material);
  if(!target||!source)throw Error('Missing facial decal '+material+' in '+name);
  target.geometry.dispose();target.geometry=source.geometry.clone().scale(scale,scale,scale);target.material=source.material.clone();
 }
 hero.userData.boatFace=2;
 const output=new T.Scene();output.add(hero);const data=await new GLTFExporter().parseAsync(output,{binary:true,trs:true});const {json,bin}=readGlb(Buffer.from(data)),removed=new Set();
 for(const part of json.nodes){
  if(!['body','head','arm-left','arm-right','leg-left','leg-right'].includes(part.name)||part.mesh!==undefined)continue;
  const kids=(part.children??[]).filter(i=>json.nodes[i].mesh!==undefined&&json.nodes[i].name?.startsWith(part.name+'_'));
  if(!kids.length)continue;
  part.mesh=json.meshes.length;json.meshes.push({name:part.name,primitives:kids.flatMap(i=>json.meshes[json.nodes[i].mesh].primitives)});
  part.children=part.children.filter(i=>!kids.includes(i));kids.forEach(i=>removed.add(i));
 }
 const nodeMap=new Map();json.nodes.forEach((_,i)=>{if(!removed.has(i))nodeMap.set(i,nodeMap.size);});json.nodes=json.nodes.filter((_,i)=>!removed.has(i));for(const n of json.nodes)if(n.children)n.children=n.children.map(i=>nodeMap.get(i));for(const scene of json.scenes)scene.nodes=scene.nodes.map(i=>nodeMap.get(i));
 const used=[...new Set(json.nodes.flatMap(n=>n.mesh===undefined?[]:[n.mesh]))],meshMap=new Map(used.map((i,j)=>[i,j]));json.meshes=used.map(i=>json.meshes[i]);for(const n of json.nodes)if(n.mesh!==undefined)n.mesh=meshMap.get(n.mesh);
 fs.writeFileSync(file,writeGlb(json,bin));console.log(name+': reference eyes, highlights, cheeks and smile');
}
