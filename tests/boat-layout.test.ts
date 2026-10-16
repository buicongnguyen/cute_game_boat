import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.ts';
import { GATE_BEDS, HOME_GATES, HOME_SAFE, homeFence, inSafeZone } from '../src/safe-zone.ts';
import { HOUSE, ROOMS, furnitureObstacles, walkable } from '../src/house.ts';
import { ACTIVITIES } from '../src/house-activities.ts';
import { approach, findRoute } from '../src/navigation.ts';
import { houseFocus } from '../src/house-session.ts';
import { setCameraPitch, CAMERA_PITCH } from '../src/camera-rig.ts';

test('expanded safe corners, four clear gates and one movable tree bed beside each gate',()=>{
  const s=M.newGame();s.level=100;
  const tree=Object.keys(M.CROPS).find(M.isTreeCrop)!;
  for(let j=0;j<4;j++){
    const i=5+j,p=M.bedPosition(s,i),gate=HOME_GATES[j];
    assert.deepEqual(p,GATE_BEDS[j]);assert.ok(inSafeZone(p,'home'));assert.ok(M.bedClear(p.x,p.z));
    assert.ok(Math.hypot(p.x-gate.x,p.z-gate.z)<4);
    assert.ok(homeFence().every(f=>Math.hypot(f.x-gate.x,f.z-gate.z)>=3));
    const seed=M.CROPS[tree].seed;if(seed)s.bag[seed]=4;
    assert.equal(M.plant(s,i,tree,10000),true);
    const before={...s.plots[i]};assert.ok(M.moveBed(s,i,[[16,17],[-17,-16],[16,-18],[-17,17]][j][0],[[16,17],[-17,-16],[16,-18],[-17,17]][j][1],Math.PI/4));
    const after=M.parseSave(JSON.stringify(s))!.plots[i];assert.equal(after.crop,tree);assert.equal(after.plantedAt,before.plantedAt);assert.equal(after.growDuration,before.growDuration);assert.equal(after.rotation,Math.PI/4);
  }
  assert.ok(inSafeZone({x:19,z:21},'home'));assert.ok(!inSafeZone({x:20.1,z:21},'home'));assert.ok(!inSafeZone({x:19,z:22.1},'home'));
  assert.ok(M.bedSpotOk(M.newGame(),17,18));assert.ok(!M.bedSpotOk(M.newGame(),19.5,21.5));
  assert.ok(HOME_SAFE.x>=18&&HOME_SAFE.z>=18);
});

test('older garden migrates once, preserving planted trees, chest contents and later bed moves',()=>{
  const old=M.newGame();delete old.boatGateBeds;
  for(let i=5;i<9;i++)Object.assign(old.plots[i],M.GARDEN_GRID[i]);
  Object.assign(old.plots[5],{crop:'carrot',plantedAt:12345,growDuration:98765,level:2});old.chest.wood=12;
  const s=M.parseSave(JSON.stringify(old))!;assert.equal(s.boatGateBeds,true);
  assert.deepEqual(M.bedPosition(s,5),GATE_BEDS[0]);assert.equal(s.plots[5].plantedAt,12345);assert.equal(s.plots[5].level,2);assert.equal(s.chest.wood,12);
  assert.ok(M.moveBed(s,5,17,18));const r=M.parseSave(JSON.stringify(s))!;assert.deepEqual(M.bedPosition(r,5),{x:17,z:18});assert.equal(r.plots[5].crop,'carrot');
  // A bed previously placed by hand stays where its owner left it.
  Object.assign(old.plots[6],{x:-17,z:15});assert.deepEqual(M.bedPosition(M.parseSave(JSON.stringify(old))!,6),{x:-17,z:15});
});

test('every cabin station can be approached from the bottom entrance and camera shifts into each room',()=>{
  setCameraPitch(CAMERA_PITCH.initial);
  assert.equal(CAMERA_PITCH.initial,42);assert.ok(HOUSE.bounds.z1-HOUSE.bounds.z0>21);
  const obs=furnitureObstacles(),options={bounds:180,clearance:.36,gridSize:.5,walkable,maxIterations:12000};
  for(const a of ACTIVITIES){
    const goal=approach(HOUSE.spawn,a.at,.7,obs,1.65,options);
    assert.ok(goal,a.id+' approach');assert.ok(findRoute(HOUSE.spawn,goal!,obs,options).length,a.id+' reachable');
  }
  const storage=ACTIVITIES.find(a=>a.id==='storage')!;assert.equal(storage.entity,'chest');assert.equal(storage.room,'bedroom');assert.ok(storage.at.x< -9&&storage.at.z< -8);
  for(const aspect of [360/740,1440/900]){
    const zoom=aspect>1?HOUSE.wideZoom:HOUSE.zoom,entry=houseFocus(HOUSE.spawn,aspect,zoom);
    for(const room of ROOMS.filter(r=>r.id!=='living')){
      const p={x:(room.rect.x0+room.rect.x1)/2,z:(room.rect.z0+room.rect.z1)/2},focus=houseFocus(p,aspect,zoom);
      assert.ok(Math.abs(focus.x-p.x)<1);if(room.rect.z1<0)assert.ok(focus.z<entry.z-4,room.id+' rear camera');
    }
  }
  setCameraPitch(CAMERA_PITCH.max);
});
