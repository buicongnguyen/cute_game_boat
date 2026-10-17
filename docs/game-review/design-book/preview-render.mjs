// Read-only source asset projection. No browser, scene server, or original file writes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import zlib from 'node:zlib';
const stage=path.dirname(fileURLToPath(import.meta.url));
const repoRootFlag=process.argv.indexOf('--repo-root');
if(repoRootFlag>=0&&!process.argv[repoRootFlag+1])throw new Error('--repo-root requires a directory.');
const repo=path.resolve(repoRootFlag>=0?process.argv[repoRootFlag+1]:path.resolve(stage,'../../..'));
const out=path.join(stage,'assets'); await fs.mkdir(out,{recursive:true});
const imp=p=>import(pathToFileURL(path.join(repo,p)).href);
const T=await imp('node_modules/three/build/three.module.js');
const {GLTFLoader}=await imp('node_modules/three/examples/jsm/loaders/GLTFLoader.js');
const {MeshoptDecoder}=await imp('node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
const loadFile=async url=>{const data=await fs.readFile(path.join(repo,'public',url.replace(/^\//,'').split('?')[0]));return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);};
GLTFLoader.prototype.loadAsync=async function(url){return this.parseAsync(await loadFile(url),'');};
const assets=await imp('src/assets.ts');
const {World}=await imp('src/world.ts');
const friends=await imp('src/friend-view.ts');
await Promise.all([assets.heroKit.load(),assets.heroKitFor('girl-tall-none-bare').load(),assets.heroKitFor('girl-chibi-none-bare').load(),assets.wearKit.load()]);
const world=Object.create(World.prototype);
friends.setFriendDresser((...args)=>world.friendAvatar(...args));
const house=new assets.KitLibrary(['/assets/models/house.glb']);
const creatures=new assets.KitLibrary(['/assets/models/creatures.glb']);
await Promise.all([house.load(),creatures.load()]);
const loader=assets.createGltfLoader();
const raw=async file=>(await loader.loadAsync('/assets/models/'+file)).scene;
const tasks=[];
const add=(id,model,source,description)=>{if(!model)throw Error('Missing model '+id);tasks.push({id,model,source,description});};
add('hero',world.lookAvatar('#4aa8ff',{},'girl-tall-none-bare'),['src/model.ts','src/world.ts','src/assets.ts','public/assets/models/hero-girl-tall.glb'],'Default explorer look and blue shirt; resting arms.');
const pepper=friends.friendModel({id:'pepper',role:'cook',rescuedAt:1,gear:{},home:true,borrowed:true,look:'girl-chibi-none-bare',grown:0});
friends.poseFriend(pepper,'idle',0);pepper.getObjectByName('friend-blob')?.removeFromParent();
add('pepper',pepper,['src/friend-view.ts','src/friends-state.ts','src/friends.ts','public/assets/models/hero-girl.glb','public/assets/models/gear-wear.glb'],'Pepper at initial growth stage with the helper look, actual white shirt, dark hair and automatic chef hat. Independently fitted thumbnail does not show relative character size.');
for(const [id,name] of [['exchange','exchange_box'],['magic-mirror','mirror'],['storage-chest','storage_chest'],['stove','stove'],['workbench','workbench'],['upgrade-bench','upgrade_bench'],['wishing-cabinet','wishing_cabinet'],['sleeping-bed','bed']]) add(id,house.instance(name),['src/house.ts','public/assets/models/house.glb'],`Current cottage furniture kit node ${name}; isolated model preview.`);
add('garden-bed',await raw('garden-bed.glb'),['public/assets/models/garden-bed.glb'],'Existing raised garden plot model, empty.');
add('hatch',await raw('boat-hatch.glb'),['public/assets/models/boat-hatch.glb'],'Existing boat hatch model, isolated from the boat.');
add('mushroom',creatures.instance('mushroom'),['src/creature-art.ts','public/assets/models/creatures.glb'],'Existing mushroom enemy model in its unanimated rest pose.');

const W=384,H=384;
const cameraDirection=new T.Vector3(4,3.5,7).normalize();
const sun=new T.Vector3(-3,7,6).normalize();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const linearToByte=x=>Math.round(clamp(x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055,0,1)*255);
function visible(o){for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;}
function project(model){
  for(const name of ['arm-left','arm-right']){const arm=model.getObjectByName(name);if(arm)arm.rotation.z=name==='arm-left'?-.3:.3;}
  model.updateMatrixWorld(true);
  const meshes=[];model.traverse(o=>{if(o.isMesh&&visible(o)&&!o.userData.outline&&o.name!=='outline'&&o.geometry.getAttribute('position'))meshes.push(o);});
  const box=new T.Box3();for(const mesh of meshes)box.union(new T.Box3().setFromObject(mesh));
  const center=box.getCenter(new T.Vector3());
  const cam=new T.OrthographicCamera(-1,1,1,-1,.01,1000);cam.position.copy(center).addScaledVector(cameraDirection,100);cam.lookAt(center);cam.updateMatrixWorld(true);
  const view=new T.Matrix4().copy(cam.matrixWorldInverse);
  let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;
  const p=new T.Vector3();for(const mesh of meshes){const attr=mesh.geometry.getAttribute('position'),mat=new T.Matrix4().multiplyMatrices(view,mesh.matrixWorld);for(let i=0;i<attr.count;i++){p.fromBufferAttribute(attr,i).applyMatrix4(mat);xmin=Math.min(xmin,p.x);xmax=Math.max(xmax,p.x);ymin=Math.min(ymin,p.y);ymax=Math.max(ymax,p.y);}}
  const span=Math.max(xmax-xmin,ymax-ymin)*1.16,cx=(xmin+xmax)/2,cy=(ymin+ymax)/2,scale=W/span;
  const rgba=new Uint8Array(W*H*4),depth=new Float32Array(W*H);depth.fill(-Infinity);
  let triangles=0;
  for(const mesh of meshes){
    const geometry=mesh.geometry,attr=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),colour=geometry.getAttribute('color'),index=geometry.index;
    const matrix=new T.Matrix4().multiplyMatrices(view,mesh.matrixWorld),nm=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
    const verts=[];for(let i=0;i<attr.count;i++){const v=new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(matrix);const n=normal?new T.Vector3().fromBufferAttribute(normal,i).applyMatrix3(nm).normalize():null;verts.push({x:(v.x-cx)*scale+W/2,y:H/2-(v.y-cy)*scale,z:v.z,n,c:colour?[colour.getX(i),colour.getY(i),colour.getZ(i)]:null});}
    const count=index?index.count:attr.count;
    for(let start=0;start<count;start+=3){
      const material=Array.isArray(mesh.material)?mesh.material[geometry.groups.find(g=>start>=g.start&&start<g.start+g.count)?.materialIndex??0]:mesh.material;
      if(!material||material.visible===false||material.opacity<.5)continue;
      const ids=[0,1,2].map(i=>index?index.getX(start+i):start+i),[a,b,c]=ids.map(i=>verts[i]);
      const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(area)<.001)continue;
      const loX=clamp(Math.floor(Math.min(a.x,b.x,c.x)),0,W-1),hiX=clamp(Math.ceil(Math.max(a.x,b.x,c.x)),0,W-1),loY=clamp(Math.floor(Math.min(a.y,b.y,c.y)),0,H-1),hiY=clamp(Math.ceil(Math.max(a.y,b.y,c.y)),0,H-1);
      const base=material.color??new T.Color('#ffffff');
      const col=[base.r,base.g,base.b];if(material.vertexColors&&colour)for(let k=0;k<3;k++)col[k]*=(a.c[k]+b.c[k]+c.c[k])/3;
      let shade=1;if(!material.isMeshBasicMaterial){const n=a.n?.clone().add(b.n).add(c.n).normalize()??new T.Vector3(0,1,0);const lambert=Math.max(0,n.dot(sun));shade=.55+.45*lambert;}
      const rgb=col.map(v=>linearToByte(v*shade));
      for(let y=loY;y<=hiY;y++)for(let x=loX;x<=hiX;x++){const px=x+.5,py=y+.5;const u=((b.x-px)*(c.y-py)-(b.y-py)*(c.x-px))/area,v=((c.x-px)*(a.y-py)-(c.y-py)*(a.x-px))/area,w=1-u-v;if(u<-.0001||v<-.0001||w<-.0001)continue;const z=u*a.z+v*b.z+w*c.z,at=y*W+x;if(z<=depth[at])continue;depth[at]=z;rgba[4*at]=rgb[0];rgba[4*at+1]=rgb[1];rgba[4*at+2]=rgb[2];rgba[4*at+3]=255;}
      triangles++;
    }
  }
  return {rgba,triangles,bounds:{min:box.min.toArray(),max:box.max.toArray()}};
}
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(buffer){let c=0xffffffff;for(const b of buffer)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(kind,data){const type=Buffer.from(kind),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([size,type,data,sum]);}
function png(rgba,width=W,height=H){const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)rows.set(rgba.subarray(y*width*4,(y+1)*width*4),y*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
const mapping={schema:1,render:{method:'Pure Node CPU orthographic triangle projection using Three GLTFLoader and actual game asset/avatar construction; transparent PNG. Flat material/vertex colors with fixed Lambert lighting; excludes shader ink outlines. These are model previews, not gameplay screenshots.',width:W,height:H,cameraDirection:cameraDirection.toArray(),padding:1.16,lightDirection:sun.toArray(),eachModelFittedIndependently:true},assets:{}};
const contactSize=1024,tile=256,contact=new Uint8Array(contactSize*contactSize*4);for(let i=0;i<contact.length;i+=4)contact.set([248,244,233,255],i);
for(const [i,task] of tasks.entries()){const rendered=project(task.model);const file=path.join(out,task.id+'.png');await fs.writeFile(file,png(rendered.rgba));mapping.assets[task.id]={file:'assets/'+task.id+'.png',type:'model-preview',source:task.source,description:task.description,triangles:rendered.triangles,bounds:rendered.bounds};for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){const src=(Math.floor(y*H/tile)*W+Math.floor(x*W/tile))*4;if(!rendered.rgba[src+3])continue;const dest=((Math.floor(i/4)*tile+y)*contactSize+(i%4)*tile+x)*4;contact.set(rendered.rgba.subarray(src,src+4),dest);}console.log(task.id,rendered.triangles);}
await fs.writeFile(path.join(out,'contact-sheet.png'),png(contact,contactSize,contactSize));
mapping.contactSheet={file:'assets/contact-sheet.png',columns:4,order:tasks.map(task=>task.id)};
const originals={carrot:'crops/carrot.webp',radish:'crops/radish.webp',sprout:'crops/sprout.webp',pumpkin:'crops/pumpkin.webp',mint:'crops/mint.webp',bean:'crops/bean.webp',sword_wood:'items/sword_wood.webp',gun_pea:'items/gun_pea.webp',hat_straw:'items/hat_straw.webp',rod:'items/rod.webp',armor_leather:'items/armor_leather.webp',manure:'items/manure.webp',spore:'items/spore.webp',potion:'items/potion.webp',worm:'items/worm.webp',seed_star:'items/seed_star.webp',plot_kit:'items/plot_kit.webp',leather:'items/leather.webp',fish_perch:'fish/fish_perch.webp',fish_clown:'fish/fish_clown.webp','cooked-carrot':'items/cooked_carrot.webp','cooked-radish':'items/cooked_radish.webp'};
for(const [id,relative] of Object.entries(originals)){const file=path.join(repo,'public/assets/icons',relative),dest=path.join(out,id+'.webp');await fs.copyFile(file,dest);mapping.assets[id]={file:'assets/'+id+'.webp',type:'existing-icon',source:['public/assets/icons/'+relative],description:'Existing game icon copied byte-for-byte.'};}
mapping.assets.keeper={...mapping.assets.hero,description:mapping.assets.hero.description+' Keeper cover image alias.'};
await fs.writeFile(path.join(stage,'asset-map.json'),JSON.stringify(mapping,null,2));
await fs.writeFile(path.join(stage,'imagery-map.json'),JSON.stringify(mapping,null,2));
console.log('Saved',Object.keys(mapping.assets).length,'assets to',out);
