import test from 'node:test';
import assert from 'node:assert/strict';
import { PlaceNoticeHistory, NOTICE_COOLDOWN, mountPlaceNotices } from '../src/place-notices.ts';
test('place introductions show once across reloads, independently per save', () => {
 const store=new Map<string,string>(), storage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);}};
 let scope='one'; const h=new PlaceNoticeHistory(()=>scope,storage);
 assert.equal(h.first('fishing'),true);assert.equal(h.first('fishing'),false);
 assert.equal(new PlaceNoticeHistory(()=>scope,storage).first('fishing'),false);
 scope='two';assert.equal(h.first('fishing'),true);scope='one';assert.equal(h.first('fishing'),false);
});
test('repeated interactions do not spam reminders, with independent per-save cooldowns',()=>{
 let scope='one';const h=new PlaceNoticeHistory(()=>scope);
 assert.equal(h.allow('fishing',100),true);assert.equal(h.allow('fishing',101),false);
 assert.equal(h.allow('fishing',100+NOTICE_COOLDOWN),true);
 scope='two';assert.equal(h.allow('fishing',102),true);
});
test('unavailable storage still remembers the introduction for this session',()=>{
 const h=new PlaceNoticeHistory(()=>'one',{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
 assert.equal(h.first('fishing'),true);assert.equal(h.first('fishing'),false);
});

test('boat introductions have a separate persistent namespace from the reference game',()=>{
 const store=new Map([['zoo-place-intro:v1:one:fishing','1']]);
 const storage={getItem:(key:string)=>store.get(key)??null,setItem:(key:string,value:string)=>{store.set(key,value);}};
 const h=new PlaceNoticeHistory(()=>'one',storage);
 assert.equal(h.first('fishing'),true);
 assert.equal(store.get('cute-game-boat:zoo-place-intro:v1:one:fishing'),'1');
 assert.equal(new PlaceNoticeHistory(()=>'one',storage).first('fishing'),false);
});

test('cooldowns are independent per place and remain in effect when returning to a save',()=>{
 let scope='one';const h=new PlaceNoticeHistory(()=>scope);
 assert.equal(h.allow('fishing',100),true);assert.equal(h.allow('books',101),true);
 scope='two';assert.equal(h.allow('fishing',102),true);
 scope='one';assert.equal(h.allow('fishing',100+NOTICE_COOLDOWN-1),false);
 assert.equal(h.allow('fishing',100+NOTICE_COOLDOWN),true);
 assert.equal(h.allow('books',100+NOTICE_COOLDOWN),false,'another place retains its own later deadline');
});

test('one nonmodal notice replaces another and hides on save changes or title screen',context=>{
 const descriptors=new Map(['document','localStorage'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 context.after(()=>{for(const [key,descriptor] of descriptors){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}});
 function element(){
  const attributes=new Map<string,string>(),classes=new Set<string>();
  return {id:'',hidden:false,textContent:'',children:[] as ReturnType<typeof element>[],attributes,
   setAttribute(key:string,value:string){attributes.set(key,value);},
   append(...children:ReturnType<typeof element>[]){this.children.push(...children);},
   classList:{toggle(name:string,on:boolean){if(on)classes.add(name);else classes.delete(name);},contains:(name:string)=>classes.has(name)}};
 }
 const storage=new Map<string,string>();
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:element}});
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)}});
 let now=100,nextTimer=0,scope='one';const timers=new Map<number,{callback:()=>void;delay:number}>();
 context.mock.method(Date,'now',()=>now);
 context.mock.method(globalThis,'setTimeout',((callback:()=>void,delay:number)=>{const id=++nextTimer;timers.set(id,{callback,delay});return id;}) as typeof setTimeout);
 context.mock.method(globalThis,'clearTimeout',((id:number)=>{timers.delete(id);}) as typeof clearTimeout);
 const parent=element(),notices=mountPlaceNotices(parent as unknown as HTMLElement,()=>scope),el=parent.children[0];
 assert.equal(el.attributes.get('role'),'status');assert.equal(el.attributes.get('aria-live'),'polite');
 assert.equal(notices.show('fishing','First reminder','🎣'),true);assert.equal(el.hidden,false);assert.equal(timers.size,1);
 const originalTimer=[...timers.keys()][0];
 assert.equal(notices.show('fishing','Ignored reminder'),false);assert.ok(timers.has(originalTimer),'a throttled interaction preserves the visible reminder');
 now++;assert.equal(notices.show('books','Second reminder','📚',true),true);
 assert.equal(parent.children.length,1);assert.equal(timers.has(originalTimer),false);assert.equal(timers.size,1);
 assert.equal(el.children[0].textContent,'📚');assert.equal(el.classList.contains('passive'),true);
 const passiveTimer=[...timers.values()][0];assert.equal(passiveTimer.delay,3500);passiveTimer.callback();assert.equal(el.hidden,true);
 now++;notices.show('travel','Third reminder');scope='two';notices.sync(true);assert.equal(el.hidden,true);assert.equal(timers.size,0);
 notices.show('travel','Other explorer');assert.equal(el.hidden,false);notices.sync(false);assert.equal(el.hidden,true);assert.equal(timers.size,0);
});
