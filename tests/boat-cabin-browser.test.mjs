// BOAT_DECK_URL points to a dev build; both mouse and touch layouts exercise actual entity interactions.
import test from 'node:test';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {dismissWelcome} from './browser-start.mjs';
const url=process.env.BOAT_DECK_URL;
for(const width of [360,1440])test('boat rooms, storage, crafting, green gate beds and Mirror at '+width,{skip:!url&&'set BOAT_DECK_URL',timeout:150000},async()=>{
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');const browser=await chromium.launch({args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
 try{
  const height=width===360?740:900,page=await browser.newPage({viewport:{width,height},hasTouch:width===360,isMobile:width===360}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('cute-game-boat:cute-game-language','en'));
  await page.goto(url);await page.waitForSelector('#name-input');await page.fill('#name-input','CabinTest');await page.click('#title-screen button.primary');await dismissWelcome(page);
  await page.waitForFunction(()=>window.__zoo?.world.entities.some(e=>e.mesh.userData.refinedAsset==='hatch'));
  const outside=await page.evaluate(async()=>{const w=window.__zoo.world,{cameraPitch}=await import('/src/camera-rig.ts');return{pitch:cameraPitch(),duplicates:w.entities.filter(e=>['chest','craft','cook'].includes(e.kind)).length,green:w.scene.getObjectByName('gate-bed-green-soil')?.count};});
  assert.deepEqual(outside,{pitch:42,duplicates:0,green:4});
  await page.evaluate(()=>{const z=window.__zoo;z.state.level=30;z.state.bag.wood=3;z.state.chest.wood=7;z.house.enter(true);});
  await page.waitForFunction(()=>window.__zoo.house.inside);await page.waitForTimeout(1800);
  const door=await page.evaluate(async()=>{const {HOUSE}=await import('/src/house.ts');return window.__zoo.world.screen(HOUSE.door.x,0,HOUSE.door.z);});assert.ok(door.y>height*.7&&door.y<height*.98,'door near bottom');
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/cabin-entry-'+width+'.png'});
  const close=async()=>{await page.locator('#dialog [data-action="close"]').click();await page.waitForSelector('#dialog-layer',{state:'hidden'});};
  async function use(kind){
    await page.evaluate(async kind=>{const w=window.__zoo.world,e=w.entities.find(e=>e.kind===kind);if(!e)throw Error('Missing '+kind);const {approach}=await import('/src/navigation.ts');const p=approach(w.position,e,.7,w.obstacles,1.3,{bounds:180,clearance:.36,gridSize:.5,walkable:w.interior.walkable});if(!p)throw Error('No approach '+kind);w.position.set(p.x,0,p.z);w.destination=null;w.route=[];},kind);
    await page.waitForTimeout(1500);
    if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/cabin-'+kind+'-'+width+'.png'});
    const projected=await page.evaluate(kind=>{const w=window.__zoo.world,e=w.entities.find(e=>e.kind===kind);return w.screen(e.x,.7,e.z);},kind);assert.ok(projected.x>0&&projected.x<width&&projected.y>0&&projected.y<height,kind+' visible after camera follows');
    await page.evaluate(kind=>{const w=window.__zoo.world;w.select(w.entities.find(e=>e.kind===kind));},kind);await page.waitForSelector('#dialog-layer:not([hidden])');
  }
  await use('chest');assert.match(await page.locator('#dialog-kicker').innerText(),/storage|chest/i);
  await page.locator('[data-action="transfer"][data-direction="store"][data-item="wood"]').click();assert.equal(await page.evaluate(()=>window.__zoo.state.chest.wood),10);await close();
  await use('craft');assert.match(await page.locator('#dialog-title').innerText(),/workbench/i);await page.locator('[data-action="forge-menu"]').click();assert.match(await page.locator('#dialog-title').innerText(),/forge|strengthen/i);await close();
  await use('cook');assert.match(await page.locator('#dialog-title').innerText(),/stove/i);await close();
  await use('house-bench');assert.match(await page.locator('#dialog-title').innerText(),/upgrade/i);await close();
  await use('house-mirror');await page.locator('[data-look-option="tiny"]').click();
  await page.waitForFunction(()=>window.__zoo.world.player.userData.look?.includes('-tiny-'));
  const scale=await page.evaluate(()=>window.__zoo.world.player.getObjectByName('arm-left')?.scale.x);assert.ok(scale>.7&&scale<1,'short avatar uses scaled Tall rig');
  const attack=await page.evaluate(()=>{const w=window.__zoo.world,a=w.player.getObjectByName('arm-left'),before=a.scale.toArray();w.punchT=.2;w.punchKind=0;w.punchArm=0;w.animatePlayer(.01);w.punchT=0;w.animatePlayer(.01);return {before,after:a.scale.toArray()};});assert.deepEqual(attack.after,attack.before,'punch returns to the short rig scale');
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/cabin-mirror-'+width+'.png'});
  await close();await page.locator('.house-out:visible').click();await page.waitForFunction(()=>!window.__zoo.house.inside);await page.evaluate(()=>{const w=window.__zoo.world,p=w.state.plots[5];w.position.set(p.x-1,0,p.z+1);w.destination=null;w.route=[];});await page.waitForTimeout(1300);
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/green-gate-bed-'+width+'.png'});
  await page.evaluate(()=>{const w=window.__zoo.world;w.select(w.entities.find(e=>e.kind==='plot'&&e.index===5));});await page.waitForSelector('[data-action="move-bed"]');assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
