import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {dismissWelcome} from './browser-start.mjs';
const url=process.env.BOAT_DECK_URL;
for(const width of [360,1440])test('Pepper reaches rectangle edge; Exchange box sells and Magic Mirror buys at '+width,{skip:!url&&'set BOAT_DECK_URL',timeout:150000},async()=>{
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
 const browser=await chromium.launch({args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width,height:width===360?740:900},hasTouch:width===360,isMobile:width===360}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('cute-game-boat:cute-game-language','en'));
  await page.goto(url);await page.waitForSelector('#name-input');await page.fill('#name-input','ExchangeTest');await page.click('#title-screen button.primary');await dismissWelcome(page);
  const pepper=await page.evaluate(async()=>{
   const z=window.__zoo,s=z.state,M=await import('/src/model.ts'),F=await import('/src/friends.ts');s.level=30;s.energy=100000;s.friends=[{id:'pepper',role:'cook',rescuedAt:Date.now(),gear:{},home:true,callUntil:Date.now()+1000000}];
   s.plots.forEach(p=>p.crop=null);Object.assign(s.plots[0],{x:18,z:18,crop:'apple',plantedAt:Date.now()-100000000});z.world.syncCrops();
   const before=s.bag.apple??0;let reached=false;
   for(let i=0;i<2000;i++){z.crew.update(.1);await Promise.resolve();const a=z.crew.actors.get('pepper');if(a&&Math.hypot(a.x-18,a.z-18)<1)reached=true;if((s.bag.apple??0)>before)break;}
   return {reached,gained:(s.bag.apple??0)-before,inside:F.inVillage({x:18,z:18}),outdoorShops:z.world.entities.filter(e=>['sell','shop'].includes(e.kind)).length};
  });assert.deepEqual(pepper,{reached:true,gained:1,inside:true,outdoorShops:0});
  await page.evaluate(()=>{document.querySelector('[data-action="close"]')?.click();window.__zoo.house.enter(true);window.__zoo.state.bag.carrot=5;});
  await page.waitForFunction(()=>window.__zoo.house.inside);
  const close=async()=>{await page.locator('.close-button').click();await page.waitForSelector('#dialog-layer',{state:'hidden'});};
  async function use(kind){
   await page.evaluate(async kind=>{const w=window.__zoo.world,e=w.entities.find(e=>e.kind===kind),{approach}=await import('/src/navigation.ts');const p=approach(w.position,e,.7,w.obstacles,1.3,{bounds:180,clearance:.36,gridSize:.5,walkable:w.interior.walkable});if(!p)throw Error('No approach '+kind);w.position.set(p.x,0,p.z);w.destination=null;w.route=[];},kind);
   await page.waitForTimeout(1300);if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/exchange-world-'+kind+'-'+width+'.png'});
   await page.evaluate(kind=>{const w=window.__zoo.world;w.select(w.entities.find(e=>e.kind===kind));},kind);await page.waitForSelector('#dialog-layer:not([hidden])');
  }
  await use('sell');assert.equal(await page.locator('#dialog-title').innerText(),'Exchange box');
  const money=await page.evaluate(()=>window.__zoo.state.energy);await page.locator('[data-action="sell-one"][data-item="carrot"]').click();assert.equal(await page.evaluate(()=>window.__zoo.state.bag.carrot),4);assert.ok(await page.evaluate(()=>window.__zoo.state.energy)>money);await close();
  await use('house-mirror');assert.equal(await page.locator('#dialog-title').innerText(),'Magic Mirror');assert.equal(await page.locator('[data-action="mirror-equipment"]').getAttribute('aria-pressed'),'true');
  const buy=page.locator('[data-action="buy"]:not([disabled]):not([aria-disabled="true"])').first(),id=await buy.getAttribute('data-item');
  const before=await page.evaluate(id=>window.__zoo.state.bag[id]??0,id);await buy.click();await page.waitForFunction(({id,before})=>(window.__zoo.state.bag[id]??0)>before,{id,before});
  await page.locator('[data-action="mirror-looks"]').click();await page.locator('[data-look-option="tiny"]').click();await page.waitForFunction(()=>!!window.__zoo.world.tryOnLook);
  await page.locator('[data-action="mirror-equipment"]').click();assert.equal(await page.evaluate(()=>window.__zoo.world.tryOnLook),null);assert.equal(await page.locator('#dialog-layer').evaluate(e=>e.classList.contains('trying-on')),false);
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/magic-mirror-'+width+'.png'});
  await close();assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
