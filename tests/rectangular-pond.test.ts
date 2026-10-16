import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {HOME_POND,waterEdge,waterShore} from '../src/pond-shape.ts';
import {planCast,earlyPull,CAST} from '../src/fishing.ts';
import {blocked,clearSegment,findRoute} from '../src/navigation.ts';
import {modeAt,shorePoint} from '../src/swim-rules.ts';
import {bankCatchSpot,PACK_DISTANCE} from '../src/bank-catch.ts';
import {FishingView} from '../src/fishing-view.ts';
import {bedClear} from '../src/model.ts';
import {World} from '../src/world.ts';
const pond={...HOME_POND,r:HOME_POND.rx};
test('home pond water and collider share a rectangular outline, including corners',()=>{
 const w=Object.assign(Object.create(World.prototype),{planet:'home',root:new T.Group(),entities:[],obstacles:[]}) as World;
 w.makePond(pond.x,pond.z,pond.r,'home');const e=w.entities[0];e.mesh.updateMatrixWorld(true);
 const water=e.mesh.getObjectByName('pond-water') as T.Mesh;
 const ray=new T.Raycaster();ray.set(new T.Vector3(pond.x+pond.r-.2,5,pond.z+pond.rz-.2),new T.Vector3(0,-1,0));
 assert.ok(ray.intersectObject(water).length);assert.ok(blocked({x:pond.x+pond.r-.2,z:pond.z+pond.rz-.2},w.obstacles));
 assert.equal(blocked({x:pond.x,z:pond.z+pond.rz+.7},w.obstacles),false,'short bank is dry, not the old circle');
 const from={x:pond.x-pond.r-1,z:pond.z},to={x:pond.x+pond.r+1,z:pond.z};assert.equal(clearSegment(from,to,w.obstacles),false);
 const route=findRoute(from,to,w.obstacles,{gridSize:.25});assert.ok(route.length);let last=from;for(const p of route){assert.ok(clearSegment(last,p,w.obstacles));last=p;}
});
test('garden beds stay off the expanded water and its corners',()=>{
 assert.equal(bedClear(pond.x+pond.r+.5,pond.z+pond.rz-.1),false);
 assert.equal(bedClear(pond.x,pond.z+pond.rz+.5),false);
});
test('casts, early pulls and swim exits agree at every rectangular edge and corner',()=>{
 for(const [dx,dz] of [[pond.r+1,0],[-pond.r-1,0],[0,pond.rz+1],[0,-pond.rz-1],[pond.r+1,pond.rz+1],[-pond.r-1,-pond.rz-1]]){
  const player={x:pond.x+dx,z:pond.z+dz};const {cast,shore}=planCast(pond,player,{x:pond.x+dx*2,z:pond.z+dz*2});
  assert.ok(waterEdge(pond,cast.x,cast.z)<=-CAST.edgeGap+1e-6);assert.ok(Math.hypot(cast.x-shore.x,cast.z-shore.z)<=CAST.max+1e-6);
  assert.ok(waterEdge(pond,shore.x,shore.z)>=CAST.shoreGap-1e-6);const exit=shorePoint(pond,player.x,player.z);assert.equal(modeAt([pond],exit.x,exit.z).mode,'land');
  assert.ok(earlyPull(pond,waterShore(pond,player.x,player.z,-.05),player).reeledIn);
 }
 assert.equal(modeAt([pond],pond.x,pond.z).mode,'swim');assert.equal(modeAt([pond],pond.x,pond.z+pond.rz+1).mode,'land');
});
test('bank catches choose dry ground, persist through recasts, then clear when walking away',()=>{
 const scene=new T.Scene(),view=new FishingView(scene,{burst(){},ring(){}} as never,{ready:false} as never,()=>{});
 const p={...HOME_POND,id:'home:fish:0',surface:.3,waterId:'home'},player=new T.Vector3(pond.x,0,pond.z+3.2);
 view.populate([p],()=>['fish_perch']);let done=0;
 for(let i=0;i<14;i++){
  const at=bankCatchSpot(player,pond,i,()=>false)!;assert.ok(waterEdge(pond,at.x,at.z)>.5);
  view.begin(p,player,p);view.approachDistance('fish_perch');view.land(()=>player,()=>done++,{id:'fish_perch',fish:true},at);view.update(1,i,player,player,null);
 }
 const bank=(view as any).bankFish;assert.equal(done,14);assert.equal(bank.length,12);
 view.begin(p,player,p);view.update(.1,20,player,player,null);assert.equal(bank.length,12);
 for(const f of bank){assert.ok(Math.abs(f.obj.rotation.z-Math.PI/2)<.11);assert.ok(waterEdge(pond,f.obj.position.x,f.obj.position.z)>.5);}
 view.update(.1,21,player,new T.Vector3(50,0,50),null);assert.equal((view as any).bankFish.length,0);
 assert.equal(bankCatchSpot(player,pond,0,()=>true),null);
});


test('leaving the original fishing spot packs every catch, including fish still landing, exactly once',()=>{
 const scene=new T.Scene(),view=new FishingView(scene,{burst(){},ring(){}} as never,{ready:false} as never,()=>{});
 const p={...HOME_POND,id:'home:fish:0',surface:.3,waterId:'home'},player=new T.Vector3(pond.x,0,pond.z+pond.rz+1),origin=player.clone();
 view.populate([p],()=>['fish_perch']);let done=0;
 const inside=view as unknown as {bankFish:{obj:T.Group}[];leaps:{obj:T.Group}[]};
 const land=()=>{const ground={x:player.x+.2,z:player.z+.2};view.begin(p,player,p);view.approachDistance('fish_perch');view.land(()=>player,()=>done++,{id:'fish_perch',fish:true},ground);};
 land();view.update(1,1,player,player,null);const first=inside.bankFish[0].obj;
 player.x+=1;land();view.update(1,2,player,player,null);assert.equal(inside.bankFish.length,2);
 const second=inside.bankFish[1].obj;
 player.copy(origin).add(new T.Vector3(PACK_DISTANCE,0,0));view.update(.01,3,player,player,null);assert.equal(inside.bankFish.length,2,'boundary still belongs to this fishing spot');
 land();const flying=inside.leaps[0].obj;
 player.x+=.01;view.update(.01,4,player,player,null);
 assert.equal(inside.bankFish.length,0,'all catches pack from the first anchor, not one at a time');assert.equal(inside.leaps.length,0);assert.equal(done,3);
 for(const obj of [first,second,flying])assert.equal(obj.parent,null);
 player.copy(origin);view.update(2,6,player,player,null);assert.equal(inside.bankFish.length,0,'returning cannot resurrect a landing');assert.equal(done,3);
 land();view.update(1,7,player,player,null);assert.equal(inside.bankFish.length,1,'a new fishing session can keep a fresh catch');
});

test('harpoon catch at a new spot packs old catches before starting its landing',()=>{
 const view=new FishingView(new T.Scene(),{} as never,{ready:false} as never,()=>{}),player=new T.Vector3(0,0,0);
 const inside=view as unknown as {bankFish:unknown[];leaps:unknown[]};
 view.landHunted('fish_perch',{x:0,z:0,surface:.3},player,{x:0,z:1});view.update(1,1,player,player,null);
 player.x=PACK_DISTANCE+.1;
 view.landHunted('fish_koi',{x:0,z:0,surface:.3},player,{x:player.x,z:1});
 assert.equal(inside.bankFish.length,0);assert.equal(inside.leaps.length,1,'new landing survives packing the previous group');
 view.update(1,2,player,player,null);assert.equal(inside.bankFish.length,1);
 view.update(.01,3,player,new T.Vector3(1e6,0,1e6),null);assert.equal(inside.bankFish.length,0,'going indoors also packs the catch');
});
