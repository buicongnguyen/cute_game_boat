/** Deterministic CPU triangle projection of real avatar geometry; no browser or external art. */
import * as T from 'three';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const toByte=v=>Math.round(clamp(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055,0,1)*255);
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(kind,data){const t=Buffer.from(kind),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(data.length);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([n,t,data,c]);}
function png(rgba,w,h){const header=Buffer.alloc(13);header.writeUInt32BE(w,0);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)rows.set(rgba.subarray(y*w*4,(y+1)*w*4),y*(w*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
function visible(o){for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;}
export function projectAppearance(model,focus=model,size=480){
 for(const [name,angle]of [['arm-left',-.22],['arm-right',.22]]){const arm=model.getObjectByName(name);if(arm)arm.rotation.z=angle;}
 model.updateMatrixWorld(true);const meshes=[];model.traverse(o=>{if(o.isMesh&&visible(o)&&!o.userData.outline&&o.name!=='outline')meshes.push(o);});
 const bounds=new T.Box3().setFromObject(focus),center=bounds.getCenter(new T.Vector3()),direction=new T.Vector3(3.3,2,8).normalize();
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,1000);camera.position.copy(center).addScaledVector(direction,100);camera.lookAt(center);camera.updateMatrixWorld(true);
 const view=camera.matrixWorldInverse,points=[];focus.traverse(o=>{if(o.isMesh&&visible(o)&&!o.userData.outline){const a=o.geometry.getAttribute('position'),m=new T.Matrix4().multiplyMatrices(view,o.matrixWorld);for(let i=0;i<a.count;i++)points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(m));}});
 const box=new T.Box3().setFromPoints(points),span=Math.max(box.max.x-box.min.x,box.max.y-box.min.y)*1.16,scale=size/span,cx=(box.min.x+box.max.x)/2,cy=(box.min.y+box.max.y)/2;
 const rgba=new Uint8Array(size*size*4),depth=new Float32Array(size*size);depth.fill(-Infinity);const sun=new T.Vector3(-3,7,6).normalize();
 for(const mesh of meshes){const g=mesh.geometry,pos=g.getAttribute('position'),normal=g.getAttribute('normal'),colors=g.getAttribute('color'),index=g.index,matrix=new T.Matrix4().multiplyMatrices(view,mesh.matrixWorld),nm=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),verts=[];
  for(let i=0;i<pos.count;i++){const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(matrix);verts.push({x:(p.x-cx)*scale+size/2,y:size/2-(p.y-cy)*scale,z:p.z,n:normal?new T.Vector3().fromBufferAttribute(normal,i).applyMatrix3(nm).normalize():null,c:colors?[colors.getX(i),colors.getY(i),colors.getZ(i)]:null});}
  for(let start=0;start<(index?.count??pos.count);start+=3){const mat=Array.isArray(mesh.material)?mesh.material[g.groups.find(group=>start>=group.start&&start<group.start+group.count)?.materialIndex??0]:mesh.material;if(!mat||mat.visible===false||mat.opacity<.5)continue;const[a,b,c]=[0,1,2].map(i=>verts[index?index.getX(start+i):start+i]),area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(area)<.001)continue;
   const base=mat.color??new T.Color('#ffffff'),rgb=[base.r,base.g,base.b];if(mat.vertexColors&&colors)for(let k=0;k<3;k++)rgb[k]*=(a.c[k]+b.c[k]+c.c[k])/3;
   const n=a.n?.clone().add(b.n).add(c.n).normalize()??new T.Vector3(0,1,0),shade=mat.isMeshBasicMaterial?1:.60+.40*Math.max(0,n.dot(sun)),out=rgb.map(v=>toByte(v*shade));
   for(let y=clamp(Math.floor(Math.min(a.y,b.y,c.y)),0,size-1);y<=clamp(Math.ceil(Math.max(a.y,b.y,c.y)),0,size-1);y++)for(let x=clamp(Math.floor(Math.min(a.x,b.x,c.x)),0,size-1);x<=clamp(Math.ceil(Math.max(a.x,b.x,c.x)),0,size-1);x++){const px=x+.5,py=y+.5,u=((b.x-px)*(c.y-py)-(b.y-py)*(c.x-px))/area,v=((c.x-px)*(a.y-py)-(c.y-py)*(a.x-px))/area,w=1-u-v;if(u<0||v<0||w<0)continue;const z=u*a.z+v*b.z+w*c.z,i=y*size+x;if(z<=depth[i])continue;depth[i]=z;rgba.set([...out,255],i*4);}
  }
 }
 return png(rgba,size,size);
}
export async function renderAppearanceIcons(entries,{python,contact}){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'boat-appearance-icons-'));
 const convert='from PIL import Image\nimport sys\nim=Image.open(sys.argv[1]).convert("RGBA")\nim=im.resize((int(sys.argv[3]),int(sys.argv[3])),Image.Resampling.LANCZOS)\nim.save(sys.argv[2],"WEBP",quality=94,method=6,alpha_quality=100)';
 for(const entry of entries){const source=path.join(temp,entry.id+'.png');fs.writeFileSync(source,projectAppearance(entry.model,entry.focus));fs.mkdirSync(path.dirname(entry.file),{recursive:true});execFileSync(python,['-c',convert,source,entry.file,String(entry.size)],{stdio:'inherit'});console.log(`${entry.id}: ${entry.size}px, ${fs.statSync(entry.file).size} bytes`);}
 fs.mkdirSync(path.dirname(contact),{recursive:true});
 const sheet='from PIL import Image,ImageDraw\nimport sys,json\na=json.loads(sys.argv[1]);out=Image.new("RGB",(192*len(a),220),(249,241,226));d=ImageDraw.Draw(out)\nfor i,e in enumerate(a):\n im=Image.open(e["file"]).convert("RGBA");im.thumbnail((180,180));out.paste(im,(i*192+(192-im.width)//2,8),im);d.text((i*192+10,195),e["id"],fill=(50,35,53))\nout.save(sys.argv[2])';
 execFileSync(python,['-c',sheet,JSON.stringify(entries.map(({id,file})=>({id,file}))),contact],{stdio:'inherit'});
 // Keep source projections in the OS temporary folder for optional inspection; no recursive deletes.
 console.log('Contact sheet: '+path.relative(process.cwd(),contact));
}
