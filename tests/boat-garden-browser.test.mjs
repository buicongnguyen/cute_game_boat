import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {dismissWelcome} from './browser-start.mjs';
const url=process.env.BOAT_DECK_URL;
for(const width of [360,1440])test('downstairs garden, livestock, rescue wall and bookshelf at '+width,{skip:!url&&'set BOAT_DECK_URL',timeout:180000},async()=>{
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
 const browser=await chromium.launch({args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width,height:width===360?740:900},hasTouch:width===360,isMobile:width===360}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('cute-game-boat:cute-game-language','en'));
  await page.goto(url);await page.waitForSelector('#name-input');await page.fill('#name-input','GardenTest');await page.click('#title-screen button.primary');await dismissWelcome(page);
  await page.waitForFunction(()=>window.__zoo?.world.entities.some(e=>e.kind==='home'));
  const initial=await page.evaluate(async()=>{
   const z=window.__zoo,w=z.world,M=await import('/src/model.ts');z.state.level=30;z.state.energy=100000;z.state.farm.built=true;
   M.buyAnimal(z.state,'cow',Date.now()-600000);M.buyAnimal(z.state,'chicken',Date.now()-300000);w.build('home');
   const out={removed:w.entities.filter(e=>['pen','well','upgrade'].includes(e.kind)).length,badge:!!document.querySelector('#discovery-progress')};z.house.enter(true);return out;
  });assert.deepEqual(initial,{removed:0,badge:false});
  await page.waitForFunction(()=>window.__zoo.house.inside&&window.__zoo.world.farmView.positions().length===2);
  await page.waitForTimeout(1800);
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/garden-entry-'+width+'.png'});
  await page.evaluate(()=>window.__zoo.world.walkTo(-16,6));
  await page.waitForFunction(()=>{const w=window.__zoo.world;return Math.hypot(w.position.x+16,w.position.z-6)<.6},null,{timeout:45000});
  assert.equal(await page.evaluate(()=>window.__zoo.house.inside),true,'garden doorway stays downstairs');
  await page.waitForTimeout(1300);
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/garden-pen-'+width+'.png'});
  const pen=await page.evaluate(()=>{const w=window.__zoo.world,e=w.entities.find(e=>e.kind==='pen');return {parent:e.mesh.parent===w.interior.root,x:e.x,z:e.z};});assert.deepEqual(pen,{parent:true,x:-16,z:3});
  const close=async()=>{await page.locator('#dialog [data-action="close"]').click();await page.waitForSelector('#dialog-layer',{state:'hidden'});};
  await page.evaluate(()=>{const w=window.__zoo.world;w.state.farm.animals.forEach(a=>a.cycleAt=Date.now());w.select(w.entities.find(e=>e.kind==='pen'));});
  await page.waitForSelector('#dialog-layer:not([hidden])');assert.match(await page.locator('#dialog-title').innerText(),/animal pen/i);await close();
  async function activity(id){
   await page.evaluate(async id=>{const w=window.__zoo.world,e=w.entities.find(e=>e.id==='house:'+id),{approach}=await import('/src/navigation.ts');const p=approach(w.position,e,.7,w.obstacles,1.3,{bounds:30,clearance:.36,gridSize:.5,walkable:w.interior.walkable});if(!p)throw Error('No approach '+id);w.position.set(p.x,0,p.z);w.destination=null;w.route=[];},id);
   await page.waitForTimeout(1300);await page.evaluate(id=>{const w=window.__zoo.world;w.select(w.entities.find(e=>e.id==='house:'+id));},id);await page.waitForSelector('#dialog-layer:not([hidden])');
  }
  await activity('trophies');assert.match(await page.locator('#dialog-body').innerText(),/Missing friends/);assert.equal(await page.locator('[data-missing-friend="sprout"]').count(),1);
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/friends-wall-'+width+'.png'});await close();
  await page.evaluate(async()=>{const z=window.__zoo,{rescue}=await import('/src/friends.ts');(z.state.bosses??=[]).push('home:treant');if(!rescue(z.state,'sprout'))throw Error('rescue failed');});
  await activity('trophies');assert.equal(await page.locator('[data-missing-friend="sprout"]').count(),0);assert.match(await page.locator('#dialog-body').innerText(),/Sprout/);await close();
  await activity('wishing');assert.match(await page.locator('#dialog-title').innerText(),/wish|crystal/i);if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/wishing-cabinet-'+width+'.png'});await close();
  await activity('books');await page.locator('[data-action="bookshelf-colossus"]').click();await page.locator('[data-action="well-sleep"]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('cute-game-boat:zoo-colossus-sleeps')),'asleep');assert.equal(await page.locator('[data-action="well-sleep"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-action="well-soothe"]').click();assert.equal(await page.evaluate(()=>localStorage.getItem('cute-game-boat:zoo-colossus-sleeps')),'soothed');
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/bookshelf-colossus-'+width+'.png'});
  await page.locator('[data-action="bookshelf"]').click();assert.match(await page.locator('#dialog-title').innerText(),/Bookshelf/);await close();
  await page.locator('.house-out:visible').click();await page.waitForFunction(()=>!window.__zoo.house.inside);
  assert.equal(await page.evaluate(()=>window.__zoo.world.entities.some(e=>e.kind==='pen'||e.kind==='well')),false);
  await page.evaluate(()=>window.__zoo.house.enter(true));await page.waitForFunction(()=>window.__zoo.house.inside);assert.equal(await page.evaluate(()=>window.__zoo.world.entities.filter(e=>e.kind==='pen').length),1);
  await page.locator('.house-out:visible').click();await page.waitForFunction(()=>!window.__zoo.house.inside);
  await page.evaluate(()=>window.__zoo.panel('help'));await page.locator('[data-action="cabin-guide"]').click();
  for(let i=0;i<3;i++)await page.locator('[data-wc="next"]').click();
  await page.locator('[data-wc="place"][data-place="craft"]').click();
  await page.waitForFunction(()=>document.querySelector('#dialog-title')?.textContent?.toLowerCase().includes('workbench')&&!document.querySelector('#dialog-layer').hidden,null,{timeout:60000});
  assert.equal(await page.evaluate(()=>window.__zoo.house.inside),true,'introduction walks through the hatch to the workbench');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
