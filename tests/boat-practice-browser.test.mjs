import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {dismissWelcome} from './browser-start.mjs';
const url=process.env.BOAT_DECK_URL;
for(const width of [360,1440])test('opening art and cabin combat practice at '+width,{skip:!url&&'set BOAT_DECK_URL',timeout:150000},async()=>{
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
 const browser=await chromium.launch({args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width,height:width===360?740:900},hasTouch:width===360,isMobile:width===360}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('cute-game-boat:cute-game-language','en'));
  let release;const gate=new Promise(r=>release=r);let requested;const request=new Promise(r=>requested=r);
  await page.route('**/assets/models/boat-hatch.glb*',async route=>{requested();await gate;await route.continue();});
  await page.goto(url,{waitUntil:'domcontentloaded'});await request;await page.waitForTimeout(4500);
  assert.equal(await page.locator('#title-screen').evaluate(e=>e.inert),true);
  assert.equal(await page.locator('#world canvas').count(),0,'no fallback scene drawn while opening art is loading');
  release();await page.waitForFunction(()=>!!window.__zoo);
  const opening=await page.evaluate(async()=>{const z=window.__zoo,{heroKit,heroKitFor}=await import('/src/assets.ts'),{lookOf}=await import('/src/looks.ts');return {hero:heroKit.ready,savedLook:heroKitFor(lookOf(z.state)).ready,hatch:!!z.world.entities.find(e=>e.mesh.userData.refinedAsset==='hatch'),floor:z.world.root.getObjectByName('deck-planks').position.y};});
  assert.deepEqual(opening,{hero:true,savedLook:true,hatch:true,floor:0});
  await page.fill('#name-input','PracticeTest');await page.click('#title-screen button.primary');await dismissWelcome(page);
  await page.evaluate(()=>window.__zoo.house.enter(true));await page.waitForFunction(()=>window.__zoo.house.inside);await page.waitForTimeout(300);
  for(const selector of ['.skills .attack-pad','.skills .jump-pad',...Array.from({length:4},(_,i)=>'.skills [data-index="'+i+'"]')])assert.equal(await page.locator(selector).isVisible(),true,selector+' visible for a new player');
  const before=await page.evaluate(()=>{const z=window.__zoo,w=z.world;w.position.set(0,0,0);w.destination=null;w.route=[];w.facing=0;const e=w.enemies.find(e=>e.hp>0);e.x=0;e.z=1;e.mesh.position.set(0,0,1);window.practiceEnemy=e;return e.hp;});
  await page.locator('.skills .jump-pad').click();await page.waitForFunction(()=>window.__zoo.world.jump.height>.2);
  await page.waitForFunction(()=>!window.__zoo.world.jump.airborne);
  for(let i=0;i<4;i++){
   await page.evaluate(()=>{const z=window.__zoo;z.resetCombat();z.world.position.set(0,0,0);z.world.facing=0;});
   await page.locator('.skills [data-index="'+i+'"]').click();
   assert.ok(await page.evaluate(i=>window.__zoo.cooldowns[i]>0,i),'skill '+i+' casts');
   await page.waitForTimeout(750);
  }
  assert.equal(await page.evaluate(()=>window.practiceEnemy.hp),before,'indoor attacks cannot damage an outdoor enemy at matching coordinates');
  await page.evaluate(()=>{const z=window.__zoo;z.resetCombat();z.state.gear.weapon='gun_pea';z.state.bag.gun_pea=1;z.world.refreshPlayer();z.world.position.set(0,0,0);z.world.facing=0;z.fight.basicAttack();});
  await page.waitForFunction(()=>window.__zoo.combat.projectiles.length>0);
  assert.equal(await page.evaluate(()=>window.__zoo.world.interior.scene.getObjectByName('skill-fx')?.parent===window.__zoo.world.interior.scene),true,'skill effects belong to the indoor scene');
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/indoor-practice-'+width+'.png'});
  await page.evaluate(()=>{window.__zoo.cooldowns[3]=20;});
  await page.locator('.house-out:visible').click();await page.waitForFunction(()=>!window.__zoo.house.inside);
  assert.ok(await page.evaluate(()=>window.__zoo.cooldowns[3])>10,'doorway preserves cooldown');
  assert.equal(await page.evaluate(()=>window.__zoo.combat.projectiles.length),0,'doorway clears practice projectiles');
  assert.equal(await page.evaluate(()=>window.__zoo.world.scene.getObjectByName('skill-fx')?.parent===window.__zoo.world.scene),true);
  assert.deepEqual(errors,[]);
 }catch(error){console.error(error);throw error;}finally{await browser.close();}
});
