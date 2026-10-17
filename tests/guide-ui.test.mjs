import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import * as rules from '../src/guide.ts';

// Exercise the real frame loop with only the rendering and DOM surfaces replaced.
const source=stripTypeScriptTypes(readFileSync(new URL('../src/guide-ui.ts',import.meta.url),'utf8'))
  .replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
const vector=()=>({x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}});
class Group {
  position=vector(); children=[]; parent=null;
  add(...children){for(const child of children){child.parent=this;this.children.push(child);}}
}
class Mesh extends Group {rotation={x:0};scale={setScalar(){}};}
const T={Group,Mesh,MeshBasicMaterial:class{},RingGeometry:class{},ConeGeometry:class{}};

function harness(storage=new Map(),throws=false) {
  const state={key:'a',off:false,restart:0,active:true,goal:true,retired:0};
  const parts=new Map();
  const element=()=>({hidden:true,style:{setProperty(){}},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){}});
  const pointer={...element(),querySelector(selector){if(!parts.has(selector))parts.set(selector,element());return parts.get(selector);}};
  const world={scene:new Group(),position:vector(),screen:()=>({front:true,x:500,y:300}),interior:null};
  const save={planet:'home',level:1,plots:[],counters:{harvests:0}};
  const context=vm.createContext({...rules,T,t:text=>text,document:{createElement:()=>pointer},innerWidth:1000,innerHeight:800,
    localStorage:{getItem(key){if(throws)throw Error('blocked');return storage.get(key)??null;},setItem(key,value){if(throws)throw Error('blocked');storage.set(key,value);}}});
  vm.runInContext(source,context);
  const guide=context.mountGardenGuide({world,hud:{append(){}},state:()=>save,bedAt:()=>({x:20,z:0}),
    active:()=>state.active,key:()=>state.key,restart:()=>state.restart,off:()=>state.off,
    setOff(){state.off=true;state.retired++;},goal:()=>state.goal?{x:9,z:4,label:'Cabin workbench'}:null});
  return {state,world,save,pointer,storage,frame:dt=>guide.frame(dt)};
}
const key=id=>'cute-game-boat:zoo-guide-seconds:'+id;

test('the pointer budgets visible target time and pauses while inactive or without a target',()=>{
  const h=harness();h.state.active=false;h.frame(30);h.state.active=true;h.state.goal=false;h.frame(30);
  h.state.goal=true;h.frame(19);assert.equal(h.state.off,false);h.frame(1);
  assert.equal(h.state.retired,1);assert.equal(h.pointer.hidden,true);assert.equal(h.storage.get(key('a')),'20');
});

test('pointer budgets persist across reloads and remain separate for each save',()=>{
  const h=harness();h.frame(7);h.state.key='b';h.frame(3);h.state.key='a';h.frame(12);
  assert.equal(h.state.off,false);assert.equal(h.storage.get(key('a')),'19');assert.equal(h.storage.get(key('b')),'3');
  const reloaded=harness(h.storage);reloaded.frame(1);assert.equal(reloaded.state.retired,1);
  assert.equal(reloaded.storage.get(key('b')),'3');
});

test('an explicit request restarts the budget even when the pointer is already visible',()=>{
  const h=harness();h.frame(18);h.state.restart++;h.storage.delete(key('a'));h.frame(5);h.frame(14);
  assert.equal(h.state.off,false);h.frame(1);assert.equal(h.state.retired,1);
});

test('guidance still retires within the session when browser storage is unavailable',()=>{
  const h=harness(new Map(),true);h.frame(19);assert.equal(h.state.off,false);h.frame(1);assert.equal(h.state.retired,1);
});

test('boat interior guidance follows the station in the interior scene instead of an outdoor bed',()=>{
  const h=harness();h.save.plots=[{crop:null}];h.world.interior={scene:new Group()};h.frame(1);
  const ringGroup=h.world.interior.scene.children[0];
  assert.ok(ringGroup);assert.equal(ringGroup.position.x,9);assert.equal(ringGroup.position.z,4);
});
