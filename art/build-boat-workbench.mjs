/** Boat cabin workbench: a compact version of the outdoor workshop's wood bench, anvil and tool board.
 * Node 24+: node --experimental-strip-types art/build-boat-workbench.mjs
 */
import fs from 'node:fs';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createGltfLoader} from '../src/assets.ts';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}};
const file=new URL('../public/assets/models/house.glb',import.meta.url),b=fs.readFileSync(file),scene=(await createGltfLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;
const old=scene.getObjectByName('workbench');if(!old)throw Error('No workbench');
const pieces=[],materials=[],cache=new Map();
function mat(c){if(!cache.has(c)){cache.set(c,materials.length);materials.push(new T.MeshStandardMaterial({color:c,roughness:.7}));}return cache.get(c);}
function add(geo,color,x,y,z,rz=0){geo.rotateZ(rz).translate(x,y,z);pieces.push({geo,index:mat(color)});}
const box=(color,w,h,d,x,y,z,rz=0)=>add(new T.BoxGeometry(w,h,d),color,x,y,z,rz);
// Warm oak boards, dark trestle legs and a lower storage shelf.
for(const x of [-.65,.65])for(const z of [-.24,.24])box('#74432c',.12,.78,.12,x,.39,z);
box('#a96432',1.5,.07,.56,0,.22,0);
for(let i=0;i<4;i++)box(i%2?'#d7964d':'#e5ab62',1.65,.1,.17,0,.82,-.27+i*.18);
box('#69432d',1.6,.66,.075,0,1.25,-.30);
for(const x of [-.76,.76])box('#d99c53',.06,.72,.1,x,1.25,-.29);
for(const y of [.93,1.57])box('#d99c53',1.6,.06,.1,0,y,-.29);
// Anvil, with a tapered horn, a steel foot and a small hammer beside it.
box('#43515c',.42,.055,.24,-.35,.91,.02);box('#64737e',.19,.15,.16,-.35,1.01,.02);box('#8da2ad',.45,.08,.23,-.35,1.12,.02);
const horn=new T.ConeGeometry(.105,.27,4);horn.rotateZ(-Math.PI/2);add(horn,'#9aafb7',-.02,1.12,.02);
box('#a86630',.055,.025,.33,.36,.89,.05);box('#718795',.23,.08,.09,.36,.94,-.08);
// Hanging hammer, saw and wrench on the pegboard; brass hooks keep the silhouettes distinct.
box('#c98b45',.045,.28,.05,-.48,1.24,-.23,-.18);box('#8ba0ab',.22,.08,.075,-.46,1.39,-.21);
box('#d59144',.16,.09,.05,.02,1.4,-.22);box('#bac9cf',.3,.14,.035,.08,1.24,-.22,-.15);
for(let i=0;i<6;i++){const tooth=new T.ConeGeometry(.022,.045,3);tooth.rotateZ(Math.PI);add(tooth,'#bac9cf',-.045+i*.05,1.15,-.22);}
box('#a7b8c2',.055,.27,.04,.49,1.25,-.22);for(const x of [.44,.54])box('#a7b8c2',.04,.1,.04,x,1.42,-.22);box('#a7b8c2',.14,.045,.04,.49,1.35,-.22);
for(const x of [-.48,.02,.49])add(new T.SphereGeometry(.025,6,4),'#f0bf60',x,1.47,-.21);
// Spare planks and a small hardware box on the lower shelf.
for(let i=0;i<3;i++)box('#cb8b43',.58,.05,.15,-.3,.29+i*.06,.04);
box('#538d95',.35,.22,.3,.42,.36,0);box('#c6b27c',.1,.06,.025,.42,.37,.16);
const geo=mergeGeometries(pieces.map(p=>p.geo),true);geo.groups.forEach((g,i)=>g.materialIndex=pieces[i].index);
const bench=new T.Mesh(geo,materials);bench.name='workbench';bench.position.copy(old.position);bench.quaternion.copy(old.quaternion);bench.scale.copy(old.scale);old.parent.add(bench);old.removeFromParent();
// Storage chest beside the bed: warm wood, curved lid, brass straps and latch.
scene.getObjectByName('storage_chest')?.removeFromParent();
const chest = new T.Group(); chest.name = 'storage_chest';
const chestBox = (c,w,h,d,x,y,z) => {const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.7}));m.position.set(x,y,z);chest.add(m);};
chestBox('#a96936',1.25,.5,.8,0,.25,0);
const lid=new T.Mesh(new T.CylinderGeometry(.4,.4,1.25,16,1,false,0,Math.PI),new T.MeshStandardMaterial({color:'#c18b4c'}));lid.rotation.z=Math.PI/2;lid.rotation.y=Math.PI/2;lid.position.y=.5;chest.add(lid);
chestBox('#dcb15f',1.29,.08,.84,0,.12,0);
for(const x of [-.46,.46])chestBox('#e2bb67',.09,.5,.83,x,.32,0);
chestBox('#f0c875',.17,.2,.04,0,.49,.425);chestBox('#634e39',.04,.07,.05,0,.48,.45);
(scene.children.length===1&&scene.children[0].name==='Scene'?scene.children[0]:scene).add(chest);
const outputScene=new T.Scene();const kitRoot=scene.children.length===1&&scene.children[0].name==='Scene'?scene.children[0]:scene;outputScene.add(...kitRoot.children);
const out=await new GLTFExporter().parseAsync(outputScene,{binary:true});fs.writeFileSync(file,Buffer.from(out));console.log('Rebuilt indoor workbench; run art:compress next.');
