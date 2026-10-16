import test from 'node:test';
import assert from 'node:assert/strict';
import { meadowPlants, meadowGeometry } from '../src/cabin-meadow.ts';
import { CABIN_PEN, gardenGround } from '../src/cabin-garden.ts';
import { newRoamer, spawnSpot, stepRoamer, roamRadius, type RoamArea, type RoamKind } from '../src/farm-roam.ts';
import { findRoute, clearSegment } from '../src/navigation.ts';
import { PEN_PROPS } from '../src/farm-view.ts';
import { HANGOUTS } from '../src/house-activities.ts';
import { friendRoute, friendObstacles, FRIEND_ROUTE_OPTIONS } from '../src/house-routes.ts';
const rngFor = (seed: number) => () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
const obstacles = PEN_PROPS.map(p => ({x:CABIN_PEN.x+p.x*CABIN_PEN.scale,z:CABIN_PEN.z+p.z*CABIN_PEN.scale,r:p.r*CABIN_PEN.scale*.85}));
const area: RoamArea = {
  home: {...CABIN_PEN, rx: 2.2, rz: 1.8}, radius: 30,
  blocked: (x,z,r) => !gardenGround(x,z,r) || obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<r+o.r),
  route: (x,z,bx,bz,r) => findRoute({x,z},{x:bx,z:bz},obstacles,{bounds:30,clearance:r,gridSize:.5,maxIterations:6000,walkable:p=>gardenGround(p.x,p.z,r)}),
};
test('meadow planting leaves the cabin, entrance and pen clear and stays within the geometry budget',()=>{
 const plants=meadowPlants(); assert.deepEqual(plants,meadowPlants());
 assert.ok(plants.length>500); assert.ok(plants.filter(p=>p.flower).length>70);
 assert.ok(plants.every(p=>gardenGround(p.x,p.z,.35)&&p.height<.35));
 const g=meadowGeometry();assert.ok(g.getAttribute('position').count/3<18000);g.dispose();
});
test('all indoor activity pairs have a route around walls and other furniture',()=>{
 for(const from of HANGOUTS)for(const to of HANGOUTS){
  const route=friendRoute(from,to);assert.ok(route.length,JSON.stringify({from,to}));
  let last=from;const keep=friendObstacles(from,to);
  for(const p of route){assert.ok(clearSegment(last,p,keep,FRIEND_ROUTE_OPTIONS));last={...from,...p};}
 }
 assert.deepEqual(friendRoute({x:100,z:100},HANGOUTS[0]),[],'invalid starts cannot fall through to a straight walk');
});
test('blocked random spawns use a checked, spaced fallback',()=>{
 const all=[];
 for(let i=0;i<18;i++){
  const kind:RoamKind=i%3?'chicken':'cow';const at=spawnSpot(area,()=>0,kind,false,all);
  assert.ok(!area.blocked(at.x,at.z,roamRadius({kind,young:false})));
  assert.ok(all.every(o=>Math.hypot(at.x-o.x,at.z-o.z)>.4));
  all.push(newRoamer(i,kind,false,at,()=>.5));
 }
});
test('a calf growing beside the cabin is recovered onto safe ground and keeps roaming',()=>{
 const rng=rngFor(18),w=newRoamer(1,'cow',true,{x:-12.4,z:0},rng);
 assert.ok(!area.blocked(w.x,w.z,roamRadius(w)));w.young=false;
 assert.ok(area.blocked(w.x,w.z,roamRadius(w)));
 for(let i=0;i<15;i++)stepRoamer(w,[w],area,rng,.1,null);
 assert.ok(!area.blocked(w.x,w.z,roamRadius(w)));
 const start={x:w.x,z:w.z};let far=0;
 for(let i=0;i<3000;i++){stepRoamer(w,[w],area,rng,.1,null);assert.ok(!area.blocked(w.x,w.z,roamRadius(w)));far=Math.max(far,Math.hypot(w.x-start.x,w.z-start.z));}
 assert.ok(far>3);
});
test('a herd stacked against a garden corner separates and every animal moves again',()=>{
 const rng=rngFor(902),all=Array.from({length:12},(_,i)=>newRoamer(i,i%4?'chicken':'cow',false,{x:-18.9,z:-14.9},rng));
 const distance=all.map(()=>0);
 for(let t=0;t<6000;t++)for(let i=0;i<all.length;i++){
  const w=all[i],x=w.x,z=w.z;stepRoamer(w,all,area,rng,.1,null);
  assert.ok(!area.blocked(w.x,w.z,roamRadius(w)), 'body stays on usable garden ground');
  if(t>50)distance[i]+=Math.hypot(w.x-x,w.z-z);
 }
 assert.ok(distance.every(d=>d>12),JSON.stringify(distance));
 for(const w of all)for(const o of all)if(w!==o)assert.ok(Math.hypot(w.x-o.x,w.z-o.z)>.35);
});
