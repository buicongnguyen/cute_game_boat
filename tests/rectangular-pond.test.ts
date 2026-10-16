import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {HOME_POND,waterEdge,waterShore} from '../src/pond-shape.ts';
import {planCast,earlyPull,CAST} from '../src/fishing.ts';
import {blocked,clearSegment,findRoute} from '../src/navigation.ts';
import {modeAt,shorePoint} from '../src/swim-rules.ts';
import {bankCatchSpot} from '../src/bank-catch.ts';
import {FishingView} from '../src/fishing-view.ts';
import {World} from '../src/world.ts';
const pond={...HOME_POND,r:HOME_POND.rx};
test('home pond water and collider share a rectangular outline, including corners',()=>{
 const w=Object.assign(Object.create(World.prototype),{planet:'home',root:new T.Group(),entities:[],obstacles:[]}) as World;
 w.makePond(pond.x,pond.z,pond.r,'home');const e=w.entities[0];e.mesh.updateMatrixWorld(true);
 const water=e.mesh.getObjectByName('pond-water') as T.Mesh;
 const ray=new T.Raycaster();ray.set(new T.Vector3(pond.x+3.1,5,pond.z+2.2),new T.Vector3(0,-1,0));
 assert.ok(ray.intersectObject(water).length);assert.ok(blocked({x:pond.x+3.1,z:pond.z+2.2},w.obstacles));
 assert.equal(blocked({x:pond.x,z:pond.z+3},w.obstacles),false,'short bank is dry, not the old circle');
 const from={x:pond.x-4,z:pond.z},to={x:pond.x+4,z:pond.z};assert.equal(clearSegment(from,to,w.obstacles),false);
 const route=findRoute(from,to,w.obstacles,{gridSize:.25});assert.ok(route.length);let last=from;for(const p of route){assert.ok(clearSegment(last,p,w.obstacles));last=p;}
});
test('casts, early pulls and swim exits agree at every rectangular edge and corner',()=>{
 for(const [dx,dz] of [[4,0],[-4,0],[0,3.1],[0,-3.1],[4,3.1],[-4,-3.1]]){
  const player={x:pond.x+dx,z:pond.z+dz};const {cast,shore}=planCast(pond,player,{x:pond.x+dx*2,z:pond.z+dz*2});
  assert.ok(waterEdge(pond,cast.x,cast.z)<=-CAST.edgeGap+1e-6);assert.ok(Math.hypot(cast.x-shore.x,cast.z-shore.z)<=CAST.max+1e-6);
  assert.ok(waterEdge(pond,shore.x,shore.z)>=CAST.shoreGap-1e-6);const exit=shorePoint(pond,player.x,player.z);assert.equal(modeAt([pond],exit.x,exit.z).mode,'land');
  assert.ok(earlyPull(pond,waterShore(pond,player.x,player.z,-.05),player).reeledIn);
 }
 assert.equal(modeAt([pond],pond.x,pond.z).mode,'swim');assert.equal(modeAt([pond],pond.x,pond.z+3).mode,'land');
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
