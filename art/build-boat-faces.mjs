/** Subtle chibi face polish, preserving every body, height, pivot and clothing fit.
 * node --experimental-strip-types art/build-boat-faces.mjs
 * Then rebuild short heights and compress hero GLBs. Safe to rerun (versioned in scene metadata).
 */
import fs from 'node:fs';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {readGlb,writeGlb} from './compress-models.mjs';
import {createGltfLoader} from '../src/assets.ts';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}};
for(const body of ['boy','girl','man','woman'])for(const size of ['tall','grown']){
 const name='hero-'+(body==='boy'?'':body+'-')+size+'.glb',file=new URL('../public/assets/models/'+name,import.meta.url),b=fs.readFileSync(file);
 if(!fs.existsSync(file))continue;
 const scene=(await createGltfLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene,hero=scene.getObjectByName('hero'),head=scene.getObjectByName('head');
 if(hero.userData.boatFace===1)continue;
 const skin=head.children.find(o=>o.isMesh&&o.material.name==='Hero skin'),eye=head.children.find(o=>o.isMesh&&o.material.name==='Hero eye');
 if(!skin||!eye)throw Error('Missing face '+name);
 skin.geometry.computeBoundingBox();const q=skin.geometry.boundingBox.max.x/.584,position=eye.geometry.attributes.position,ids=[];
 for(let i=0;i<position.count;i++)if(Math.abs(position.getX(i))<.08*q&&position.getY(i)<.37*q)ids.push(i);
 if(ids.length<5)throw Error('Mouth not identified '+name);
 const ys=ids.map(i=>position.getY(i)),centre=(Math.min(...ys)+Math.max(...ys))/2;
 for(const i of ids){const ox=position.getX(i),oy=position.getY(i),oz=position.getZ(i),x=ox*.72,y=centre+(oy-centre)*.75,cy=.47*q;position.setXYZ(i,x,y,Math.sqrt(Math.max(0,ox*ox+(oy-cy)**2+oz*oz-x*x-(y-cy)**2)));}
 position.needsUpdate=true;
 // Girl and woman rigs already have outer lashes. Give boy and man the same soft, shorter accent.
 if(body==='boy'||body==='man'){
  const pieces=[eye.geometry.index?eye.geometry.toNonIndexed():eye.geometry.clone()];
  for(const side of [-1,1])for(const n of [0,1]){
   const points=[[.255+n*.014,.03-n*.012],[.278+n*.014,.045-n*.009],[.295+n*.014,.07-n*.009]].map(([x,y])=>new T.Vector3(side*x*q,(.47+y)*q,Math.sqrt(.607**2-x*x-y*y)*q));
   pieces.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),4,.006*q,5,false).toNonIndexed());
  }
  for(const g of pieces)for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);
  eye.geometry=mergeVertices(mergeGeometries(pieces,false));for(const g of pieces)g.dispose();
 }
 hero.userData.boatFace=1;
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
 fs.writeFileSync(file,writeGlb(json,bin));console.log(name+': smaller smile and soft lashes');
}
