/** Append the boat's new ears and four original costumes without re-exporting legacy art.
 * Node24+: node --experimental-strip-types art/build-boat-appearance.mjs [--python PATH] [--models-only|--icons-only]
 * Python with Pillow/WebP is used only for asset-derived icon resampling/encoding; PYTHON is also accepted.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {readGlb,writeGlb,compressGlb} from './compress-models.mjs';
import {createGltfLoader} from '../src/assets.ts';
import {renderAppearanceIcons} from './render-appearance-icons.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),models=path.join(root,'public/assets/models');
const args=process.argv.slice(2);let python=process.env.PYTHON??(process.platform==='win32'?'py':'python3');
for(let i=0;i<args.length;i++){if(args[i]==='--python'){if(!args[i+1])throw Error('--python needs an executable');python=args[++i];}else if(!['--models-only','--icons-only'].includes(args[i]))throw Error('Unknown argument '+args[i]);}
const sha=b=>createHash('sha256').update(b).digest('hex');
const loader=createGltfLoader();
const parse=async bytes=>(await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
globalThis.FileReader??=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}};

// Restoring the recorded append boundary makes regeneration idempotent. Old arrays and
// compressed binary streams are retained byte-for-byte; only our appended data is replaced.
function legacy(bytes){
 const {json:j,bin}=readGlb(bytes),record=j.extras?.boatAppearance;
 if(!record)return {json:j,bin};
 const b=record.base;
 for(const [key,n]of Object.entries(b.counts))j[key]=j[key].slice(0,n);
 j.buffers=b.buffers;j.scenes.forEach((s,i)=>s.nodes=b.scenes[i]);
 for(const [i,children]of b.children)j.nodes[i].children=children;
 j.extensionsUsed=b.extensionsUsed;j.extensionsRequired=b.extensionsRequired;
 delete j.extras.boatAppearance;if(!Object.keys(j.extras).length)delete j.extras;
 const original=bin.subarray(0,b.binaryBytes);
 if(sha(original)!==b.binarySha256||sha(Buffer.from(JSON.stringify(j)))!==b.structureSha256)throw Error('Legacy art changed outside the appearance append boundary');
 return {json:j,bin:original};
}
function append(base,addition,ids,underRoot){
 const j=structuredClone(base.json),n=addition.json,offset=base.bin.length;
 const keys=['nodes','meshes','accessors','bufferViews','materials'],counts=Object.fromEntries(keys.map(k=>[k,(j[k]??[]).length]));
 const boundary={counts,buffers:structuredClone(j.buffers),scenes:j.scenes.map(s=>[...s.nodes]),children:j.nodes.flatMap((node,i)=>node.children?[[i,[...node.children]]]:[]),extensionsUsed:j.extensionsUsed,extensionsRequired:j.extensionsRequired,binaryBytes:base.bin.length,binarySha256:sha(base.bin),structureSha256:sha(Buffer.from(JSON.stringify(j)))};
 const buffer=i=>i===0?0:base.json.buffers.length+i-1;
 for(const view0 of n.bufferViews){const v=structuredClone(view0),ext=v.extensions?.EXT_meshopt_compression;v.buffer=buffer(v.buffer);if(v.buffer===0)v.byteOffset=(v.byteOffset??0)+offset;if(ext){ext.buffer=buffer(ext.buffer);if(ext.buffer===0)ext.byteOffset=(ext.byteOffset??0)+offset;}j.bufferViews.push(v);}
 for(const a0 of n.accessors){const a=structuredClone(a0);a.bufferView+=counts.bufferViews;j.accessors.push(a);}
 j.materials.push(...n.materials);
 for(const m0 of n.meshes){const m=structuredClone(m0);for(const p of m.primitives){for(const k of Object.keys(p.attributes))p.attributes[k]+=counts.accessors;if(p.indices!==undefined)p.indices+=counts.accessors;if(p.material!==undefined)p.material+=counts.materials;}j.meshes.push(m);}
 for(const node0 of n.nodes){const node=structuredClone(node0);if(node.mesh!==undefined)node.mesh+=counts.meshes;if(node.children)node.children=node.children.map(i=>i+counts.nodes);j.nodes.push(node);}
 const added=n.scenes[n.scene??0].nodes.map(i=>i+counts.nodes);
 if(underRoot)j.nodes.find(node=>node.name===underRoot).children.push(...added);else j.scenes[j.scene??0].nodes.push(...added);
 j.buffers.push(...n.buffers.slice(1));j.buffers[0].byteLength=offset+addition.bin.length;
 for(const key of ['extensionsUsed','extensionsRequired'])j[key]=[...new Set([...(j[key]??[]),...(n[key]??[])])];
 j.extras={...j.extras,boatAppearance:{version:1,ids,base:boundary}};
 return writeGlb(j,Buffer.concat([base.bin,addition.bin]));
}

const material=(name,color)=>{const m=new T.MeshStandardMaterial({color,roughness:.68,metalness:0});m.name=name;return m;};
const palette=(id,colors)=>Object.fromEntries(Object.entries(colors).map(([name,color])=>[name,material(`Disguise ${id.replace('dz_','')} ${name}`,color)]));
function geometry(g,x=0,y=0,z=0,sx=1,sy=1,sz=1,rz=0,rx=0){const m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,0,rz)),new T.Vector3(sx,sy,sz));return g.applyMatrix4(m);}
const ball=(x,y,z,sx,sy,sz,segs=10,rings=6)=>geometry(new T.SphereGeometry(1,segs,rings),x,y,z,sx,sy,sz);
const box=(x,y,z,w,h,d,rz=0)=>geometry(new T.BoxGeometry(w,h,d),x,y,z,1,1,1,rz);
const tube=(a,b,r0,r1,sides=8)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),g=new T.CylinderGeometry(r1,r0,from.distanceTo(to),sides);return g.applyMatrix4(new T.Matrix4().compose(from.add(to).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...b).sub(new T.Vector3(...a)).normalize()),new T.Vector3(1,1,1)));};
function prism(points,depth=.025){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,steps:1});}
function star(x,y,z,r=.075){const points=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;return[Math.cos(a)*q,Math.sin(a)*q];});return geometry(prism(points,.018),x,y,z);}
function heart(x,y,z,r=.06){return geometry(prism([[0,-1],[-.85,-.12],[-1,.45],[-.62,.85],[0,.42],[.62,.85],[1,.45],[.85,-.12]],.025),x,y,z,r,r,1);}
function joined(name,pieces){
 const geometries=[],materials=[];
 for(const [geo,mat]of pieces){const g=geo.index?geo.toNonIndexed():geo;for(const a of Object.keys(g.attributes))if(!['position','normal'].includes(a))g.deleteAttribute(a);geometries.push(g);materials.push(mat);}
 const merged=mergeGeometries(geometries,true);merged.setIndex(Array.from({length:merged.getAttribute('position').count},(_,i)=>i));
 const mesh=new T.Mesh(merged,materials);mesh.name=name;geometries.forEach(g=>g.dispose());return mesh;
}
async function exported(scene){const bytes=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true,trs:true}));return readGlb(await compressGlb(bytes));}

async function buildModels(){
 const earBase=legacy(fs.readFileSync(path.join(models,'hero-parts.glb'))),disguiseBase=legacy(fs.readFileSync(path.join(models,'disguises.glb')));
 const ears=new T.Scene(),brown=material('Appearance bear fur','#9e623a'),cream=material('Appearance warm inner ear','#f5c9a0'),orange=material('Appearance fox fur','#ed8239'),ivory=material('Appearance fox cream','#fff1d9'),ink=material('Appearance fox ear tips','#49354a');
 let pieces=[];
 for(const side of [-1,1])pieces.push([ball(side*.43,2.065,0,.19,.20,.10),brown],[ball(side*.43,2.075,.092,.112,.125,.025,8,4),cream]);
 ears.add(joined('ears-bear_ears',pieces));ears.add(joined('tail-bear_ears',[[ball(0,.62,-.385,.135,.135,.135,8,5),brown]]));
 pieces=[];
 for(const side of [-1,1]){const rz=-side*.20;pieces.push([geometry(new T.ConeGeometry(.18,.46,8),side*.43,2.13,0,1,1,.55,rz),orange]);pieces.push([geometry(prism([[-.105,-.14],[.105,-.14],[0,.145]],.015),side*.43,2.14,.09,1,1,1,rz),ivory]);pieces.push([geometry(new T.ConeGeometry(.064,.15,6),side*.48,2.32,0,1,1,.55,rz),ink]);}
 ears.add(joined('ears-fox_ears',pieces));
 const path0=[[0,.62,-.30],[.03,.63,-.43],[.11,.72,-.60],[.17,.88,-.72],[.16,1.04,-.70]],radii=[.085,.15,.18,.13,0];
 pieces=[];for(let i=0;i<path0.length-1;i++)pieces.push([tube(path0[i],path0[i+1],radii[i],radii[i+1]),i===path0.length-2?ivory:orange]);
 ears.add(joined('tail-fox_ears',pieces));
 fs.writeFileSync(path.join(models,'hero-parts.glb'),append(earBase,await exported(ears),['bear_ears','fox_ears'],'hero-parts'));

 const source=await parse(writeGlb(disguiseBase.json,disguiseBase.bin)),navy=source.getObjectByName('dz_navy');navy.updateMatrixWorld(true);
 const shell=(piece,firstOnly=false)=>{const out=[];navy.getObjectByName(`dz_navy_${piece}`).traverse(o=>{if(o.isMesh)out.push(o.geometry.clone().applyMatrix4(o.matrixWorld));});return firstOnly?out.slice(0,1):out;};
 const scene=new T.Scene();
 const styles={
  dz_swimmer:{base:'#14798c',dark:'#243a5e',accent:'#5de0d0',light:'#fff0bf'},
  dz_kpop:{base:'#7444a3',dark:'#302345',accent:'#ffd377',light:'#68dce8'},
  dz_yoga:{base:'#bc82b4',dark:'#55426e',accent:'#efb9ce',light:'#c2e6c5'},
  dz_nurse:{base:'#54adbc',dark:'#31758e',accent:'#f5a6bd',light:'#fff6e6'},
 };
 const reports=[];
 for(const [id,colors]of Object.entries(styles)){
  const m=palette(id,colors),group=new T.Group();group.name=id;const parts=new Map(),add=(part,g,mat)=>{const a=parts.get(part)??[];a.push([g,mat]);parts.set(part,a);};
  for(const g of shell('suit@body',true))add('body',g,m.base);
  // Cover the underlying girl's skirt and shirt neckline instead of leaving blue/white base clothes visible.
  add('body',geometry(new T.CylinderGeometry(.46,.50,.25,12),0,.40,0,1,1,.86),id==='dz_swimmer'?m.dark:m.base);
  add('body',box(0,1.13,.285,.25,.16,.19),m.base);
  for(const [side,part]of [[-1,'left'],[1,'right']]){
   for(const g of shell(`sleeve@arm-${part}`))add(`arm-${part}`,g,m.base);
   for(const g of shell(`trousers@leg-${part}`))add(`leg-${part}`,g,m.dark);
   add(`leg-${part}`,geometry(new T.CylinderGeometry(.15,.14,.43,10),side*.18,.56,0),m.dark);
   if(id==='dz_swimmer'){
    add(`leg-${part}`,ball(side*.18,.10,.075,.15,.10,.21),m.dark);
    add(`leg-${part}`,box(side*.18,.035,.30,.34,.045,.43),m.accent);
    add(`leg-${part}`,box(side*.18,.065,.31,.045,.025,.35),m.light);
   }else if(id==='dz_yoga'){
    add(`leg-${part}`,ball(side*.18,.075,.065,.145,.075,.20),m.dark);
    add(`leg-${part}`,box(side*.18,.025,.085,.26,.03,.31),m.accent);
   }else for(const g of shell(`shoes@leg-${part}`))add(`leg-${part}`,g,id==='dz_nurse'?m.light:m.dark);
   add(`arm-${part}`,box(side*.37,.80,.125,.24,.055,.035),m.accent);
  }
  if(id==='dz_swimmer'){
   add('head',geometry(new T.SphereGeometry(.645,12,5,0,Math.PI*2,0,1.03),0,1.68,0),m.base);
   for(const side of [-1,1]){add('head',geometry(new T.TorusGeometry(.125,.026,4,10),side*.185,1.765,.594,1,.75,1),m.light);add('head',ball(side*.185,1.765,.595,.12,.085,.025,10,4),m.accent);}
   add('head',tube([-.06,1.765,.62],[.06,1.765,.62],.018,.018,6),m.dark);
   add('body',box(0,.91,.43,.045,.52,.025),m.light);
   for(const side of [-1,1])add('body',box(side*.255,.93,.35,.09,.43,.055,-side*.22),m.accent);
  }else if(id==='dz_kpop'){
   add('head',geometry(new T.TorusGeometry(.66,.028,4,16,Math.PI),0,1.64,-.05),m.dark);
   for(const side of [-1,1])add('head',ball(side*.59,1.72,0,.065,.12,.105,8,4),m.light);
   add('head',tube([.57,1.69,.04],[.36,1.53,.56],.016,.016,6),m.dark);add('head',ball(.36,1.53,.57,.045,.03,.035,8,4),m.light);
   for(const side of [-1,1]){add('body',box(side*.12,1.055,.42,.065,.31,.035,-side*.42),m.light);add('arm-'+(side<0?'left':'right'),star(side*.37,1.11,.145,.065),m.accent);}
   add('body',star(.22,.91,.43,.09),m.accent);add('body',box(0,.66,.43,.55,.045,.025),m.accent);
  }else if(id==='dz_yoga'){
   add('head',geometry(new T.TorusGeometry(.59,.04,5,16),0,1.90,0,1,1,1,0,Math.PI/2),m.accent);
   add('body',box(0,.69,.43,.57,.07,.025),m.accent);
   add('body',geometry(new T.CylinderGeometry(.105,.105,.50,10),.49,.86,-.04),m.light);
   for(const y of [.72,.98])add('body',geometry(new T.TorusGeometry(.108,.017,4,10),.49,y,-.04,1,1,1,0,Math.PI/2),m.accent);
   add('body',geometry(new T.TorusGeometry(.071,.014,4,10),.49,1.115,-.04,1,1,1,0,Math.PI/2),m.dark);
   add('body',heart(0,1.045,.448,.046),m.light);
  }else{
   add('head',geometry(new T.SphereGeometry(.66,12,4,0,Math.PI*2,0,.96),0,1.72,0,1,.95,1),m.light);
   add('head',box(0,2.10,.40,.48,.07,.14),m.light);
   add('head',heart(0,2.22,.45,.065),m.accent);
   for(const side of [-1,1])add('body',box(side*.08,1.11,.407,.035,.20,.03,side*.48),m.light);
   add('body',box(.215,.91,.42,.17,.16,.025),m.dark);add('body',heart(.215,.93,.45,.047),m.accent);
   add('body',tube([-.19,1.12,.37],[-.19,.91,.43],.014,.014,6),m.light);add('body',ball(-.19,.88,.44,.04,.04,.02,8,4),m.accent);
  }
  for(const [part,geos]of parts)group.add(joined(`${id}_costume@${part}`,geos));scene.add(group);
  let triangles=0;group.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;});
  if(triangles>2500)throw Error(`${id} exceeds costume triangle budget: ${triangles}`);reports.push({id,triangles,pieces:group.children.length});
 }
 fs.writeFileSync(path.join(models,'disguises.glb'),append(disguiseBase,await exported(scene),Object.keys(styles)));
 console.log(JSON.stringify({newDisguises:reports,heroPartsBytes:fs.statSync(path.join(models,'hero-parts.glb')).size,disguisesBytes:fs.statSync(path.join(models,'disguises.glb')).size}));
}

async function buildIcons(){
 // Load the exact runtime avatar/fit/merged materials from local disk, without a browser.
 GLTFLoader.prototype.loadAsync=async function(url){const file=path.join(root,'public',String(url).replace(/^\//,'').split('?')[0]),b=fs.readFileSync(file);return this.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
 const assets=await import('../src/assets.ts'),{World}=await import('../src/world.ts');
 const looks=['girl-tall-none-bare','girl-tall-bear_ears-bare','girl-tall-fox_ears-bare'];
 await Promise.all([assets.heroKit.load(),assets.disguiseKit.load(),assets.wearKit.load(),assets.weaponKit.load(),...looks.map(l=>assets.heroKitFor(l).load())]);
 const world=Object.create(World.prototype),entries=[];
 for(const id of ['bear_ears','fox_ears']){const model=world.lookAvatar('#4aa8ff',{},`girl-tall-${id}-bare`);entries.push({id,model,focus:model.getObjectByName('head'),size:128,file:path.join(root,'public/assets/icons/looks',id+'.webp')});}
 for(const id of ['dz_swimmer','dz_kpop','dz_yoga','dz_nurse'])entries.push({id,model:world.lookAvatar('#4aa8ff',{disguise:id},'girl-tall-none-bare'),size:160,file:path.join(root,'public/assets/icons/items',id+'.webp')});
 await renderAppearanceIcons(entries,{python,contact:path.join(root,'art/previews/boat-appearance.png')});
}
if(!args.includes('--icons-only'))await buildModels();
if(!args.includes('--models-only'))await buildIcons();
