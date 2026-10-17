/** Install the boat's Blender-built additions into the shared model files without re-exporting legacy art.
 * The four everyday disguises (dz_swimmer, dz_kpop, dz_yoga, dz_nurse) and the bear and fox ears are modelled in
 * art/blender/kit/build_everyday_disguises.py, which writes plain GLBs to art/generated/kit/models/ and runs this:
 *   node art/build-boat-appearance.mjs      (normally via the Blender script's --install)
 * Each GLB is meshopt-compressed (art/compress-models.mjs) and appended to public/assets/models/disguises.glb or
 * hero-parts.glb behind the recorded append boundary, so every older model keeps its exact bytes.
 *
 * Retired (2026-10-17): this file used to BUILD the four costumes and the ears itself from three.js primitives (the
 * same recoloured hoodie for every costume) and render their portraits through Python. Do not bring that back; the
 * looks and the portraits come from the Blender kit now, like every other disguise.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readGlb,writeGlb,compressGlb} from './compress-models.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),models=path.join(root,'public/assets/models'),built=path.join(root,'art/generated/kit/models');
if(process.argv.length>2)throw Error('No arguments: run art/blender/kit/build_everyday_disguises.py -- --install');
const sha=b=>createHash('sha256').update(b).digest('hex');

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

async function blender(file){const p=path.join(built,file);if(!fs.existsSync(p))throw Error(`${p} is missing: run art/blender/kit/build_everyday_disguises.py first`);return readGlb(await compressGlb(fs.readFileSync(p)));}
const ears=await blender('boat-ears.glb'),costumes=await blender('boat-disguises.glb');
const earBase=legacy(fs.readFileSync(path.join(models,'hero-parts.glb'))),disguiseBase=legacy(fs.readFileSync(path.join(models,'disguises.glb')));
fs.writeFileSync(path.join(models,'hero-parts.glb'),append(earBase,ears,['bear_ears','fox_ears'],'hero-parts'));
fs.writeFileSync(path.join(models,'disguises.glb'),append(disguiseBase,costumes,['dz_swimmer','dz_kpop','dz_yoga','dz_nurse']));
console.log(JSON.stringify({heroPartsBytes:fs.statSync(path.join(models,'hero-parts.glb')).size,disguisesBytes:fs.statSync(path.join(models,'disguises.glb')).size}));
