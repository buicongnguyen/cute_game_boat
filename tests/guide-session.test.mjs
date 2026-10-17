import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { guideFinished } from '../src/guide.ts';
import * as M from '../src/model.ts';

const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const start=main.indexOf('let chapterGoal:(GuideGoal&{radius:number})|null=null');
const end=main.indexOf('const GOAL_LABEL:',start);
assert.ok(start>=0&&end>start);
const compiled=ts.transpileModule(main.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
function fixture(state=M.newGame(),available=true) {
  const store=new Map(),context=vm.createContext({state,profile:'first',activeKey(){return context.profile;},guideFinished,
    localStorage:{getItem(key){if(!available)throw Error('Storage unavailable');return store.get(key)??null;},setItem(key,value){if(!available)throw Error('Storage unavailable');store.set(key,value);},removeItem(key){if(!available)throw Error('Storage unavailable');store.delete(key);}}});
  vm.runInContext(compiled+'\nglobalThis.api={off:guideIsOff,set:setGuideOff,revision:()=>guideRun};',context);
  return {context,store,api:context.api};
}
test('actual guide session retires automatic pointing after planting and after a save reload',()=>{
  const f=fixture();assert.equal(f.api.off(),false);f.context.state.firstRun={plants:1};assert.equal(f.api.off(),true);
  const reloaded=fixture(M.parseSave(JSON.stringify(f.context.state)));assert.equal(reloaded.api.off(),true);
});
test('explicit quest guidance restores a retired pointer and resets its visible-time budget',()=>{
  const state=M.newGame();state.firstRun={plants:1};const f=fixture(state);
  assert.equal(f.api.off(),true);f.store.set('cute-game-boat:zoo-guide-seconds:first','20');
  f.api.set(false);assert.equal(f.api.off(),false);assert.equal(f.store.has('cute-game-boat:zoo-guide-seconds:first'),false);assert.equal(f.api.revision(),1);
  f.api.set(false);assert.equal(f.api.revision(),2,'requesting another hint while visible restarts the timer');
  f.api.set(true);assert.equal(f.api.off(),true);assert.equal(f.store.get('cute-game-boat:zoo-guide-off:first'),'1');
});
test('manual hint overrides are isolated when switching adventure profiles',()=>{
  const state=M.newGame();state.firstRun={plants:1};const f=fixture(state);
  f.api.off();f.api.set(false);assert.equal(f.api.off(),false);
  f.context.profile='second';assert.equal(f.api.off(),true,'a planted second adventure remains retired');
  assert.equal(f.store.has('cute-game-boat:zoo-guide-off:second'),false);
});
test('Start fresh restores automatic guidance without bypassing first-plant retirement',()=>{
  const f=fixture();f.api.off();f.api.set(true);f.store.set('cute-game-boat:zoo-guide-seconds:first','20');
  f.context.state=M.newGame();f.api.set(false,false);assert.equal(f.api.off(),false);assert.equal(f.store.has('cute-game-boat:zoo-guide-seconds:first'),false);
  f.context.state.firstRun={plants:1};assert.equal(f.api.off(),true);
});
test('a blocked storage API still allows session hint dismissal and restoration',()=>{
  const f=fixture(M.newGame(),false);assert.equal(f.api.off(),false);f.api.set(true);assert.equal(f.api.off(),true);f.api.set(false);assert.equal(f.api.off(),false);
});
