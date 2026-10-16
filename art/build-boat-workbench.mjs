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
// The craft-room wishing cabinet: teal lacquer, brass trim and a softly glowing crystal.
scene.getObjectByName('wishing_cabinet')?.removeFromParent();
const cabinet=new T.Group();cabinet.name='wishing_cabinet';
const cb=(c,w,h,d,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.55}));m.position.set(x,y,z);cabinet.add(m);};
cb('#236b70',1.2,.66,.5,0,.38,0);cb('#16464f',1.12,1.12,.08,0,1.22,-.22);
for(const x of [-.52,.52]){cb('#dabb6a',.065,1.72,.09,x,.92,.22);cb('#845b3b',.1,.16,.38,x,.08,0);}
for(const y of [.18,.69,1.76])cb('#e7c878',1.25,.065,.55,0,y,0);
for(const x of [-.27,.27]){cb('#36898a',.46,.4,.025,x,.41,.265);cb('#e7c878',.055,.055,.055,x*.35,.43,.3);}
const gem=new T.Mesh(new T.OctahedronGeometry(.29),new T.MeshStandardMaterial({color:'#9ce4f2',emissive:'#669bd8',emissiveIntensity:.45,roughness:.2}));gem.position.set(0,1.19,.03);gem.scale.y=1.4;cabinet.add(gem);
const stand=new T.Mesh(new T.CylinderGeometry(.32,.38,.08,12),new T.MeshStandardMaterial({color:'#e6c572'}));stand.position.set(0,.78,0);cabinet.add(stand);
for(const side of [-1,1]){const star=new T.Mesh(new T.OctahedronGeometry(.09),new T.MeshStandardMaterial({color:'#fff0bc',emissive:'#cda05b',emissiveIntensity:.2}));star.position.set(side*.38,1.52,.08);cabinet.add(star);}
(scene.children.length===1&&scene.children[0].name==='Scene'?scene.children[0]:scene).add(cabinet);
// Exchange box by the cabin exit: polished oak, teal panels, brass bands and a parcel emblem.
scene.getObjectByName('exchange_box')?.removeFromParent();
const exchange=new T.Group();exchange.name='exchange_box';
const eb=(c,w,h,d,x,y,z,rz=0)=>{const g=new T.BoxGeometry(w,h,d);g.rotateZ(rz);const m=new T.Mesh(g,new T.MeshStandardMaterial({color:c,roughness:.55}));m.position.set(x,y,z);exchange.add(m);};
eb('#825134',1.3,.68,.8,0,.46,0);
for(const x of [-.51,.51])for(const z of [-.28,.28])eb('#65412c',.13,.22,.13,x,.11,z);
for(const x of [-.42,0,.42])eb('#3c8a83',.38,.49,.035,x,.49,.42);
for(const y of [.21,.76])eb('#ecc776',1.36,.07,.86,0,y,0);
for(const x of [-.64,.64])eb('#d4a557',.07,.59,.87,x,.49,0);
for(let i=0;i<5;i++)eb(i%2?'#c88c4e':'#dfab65',.27,.09,.88,-.54+i*.27,.83,0);
eb('#264f50',.56,.3,.035,0,.49,.45);eb('#f2d48d',.24,.19,.045,0,.49,.48);eb('#fff1bf',.035,.19,.05,0,.49,.51);eb('#fff1bf',.24,.035,.05,0,.49,.51);
// Two small wrapped parcels sit on the lid; the surface stays below the room's sightline.
eb('#edc17d',.36,.26,.29,-.28,1.005,-.08);eb('#fff0bd',.05,.27,.30,-.28,1.005,-.08);
eb('#d99079',.27,.2,.25,.23,.975,.07);eb('#f9e2a5',.28,.04,.26,.23,.99,.07);
(scene.children.length===1&&scene.children[0].name==='Scene'?scene.children[0]:scene).add(exchange);
const outputScene=new T.Scene();const kitRoot=scene.children.length===1&&scene.children[0].name==='Scene'?scene.children[0]:scene;outputScene.add(...kitRoot.children);
const out=await new GLTFExporter().parseAsync(outputScene,{binary:true});fs.writeFileSync(file,Buffer.from(out));console.log('Rebuilt indoor workbench; run art:compress next.');
