import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {dismissWelcome} from './browser-start.mjs';
const url=process.env.BOAT_DECK_URL;
for(const width of [360,1440])test('rectangular pond casts and caught fish rest on dry shore at '+width,{skip:!url&&'set BOAT_DECK_URL',timeout:120000},async()=>{
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
 const browser=await chromium.launch({args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width,height:width===360?740:900},hasTouch:width===360,isMobile:width===360}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('cute-game-boat:cute-game-language','en'));
  await page.goto(url);await page.waitForSelector('#name-input');await page.fill('#name-input','PondTest');await page.click('#title-screen button.primary');await dismissWelcome(page);
  await page.waitForFunction(()=>window.__zoo?.world.entities.some(e=>e.kind==='fish'));
  // Moving across the harpoon range must preserve every visible fish, including decorative shadows.
  await page.waitForFunction(()=>window.__zoo.fishingView.school.draws>0);
  let original;
  for(const distance of [20,15,20,15]){
   await page.evaluate(distance=>{const g=window.__zoo;g.state.bag.harpoon=1;g.state.gear.weapon='harpoon';g.world.position.set(-7.5,0,distance);g.world.destination=null;g.world.route=[];},distance);
   await page.waitForTimeout(750);
   const roster=await page.evaluate(()=>{const g=window.__zoo;return [...g.fishingView.fish.filter(f=>f.pond.id==='home:fish:0'&&f.obj.visible).map(f=>f.species),...g.huntingView.fish.filter(f=>f.obj.visible).map(f=>f.id)].sort();});
   if(!original)original=roster;else assert.deepEqual(roster,original,'fish roster is stable near and far');
  }
  await page.evaluate(()=>{delete window.__zoo.state.bag.harpoon;delete window.__zoo.state.gear.weapon;});
  await page.evaluate(()=>{const z=window.__zoo,w=z.world;z.state.bag.rod=1;w.position.set(-7.5,0,15);w.destination=null;w.route=[];w.facing=Math.PI;w.refreshPlayer();});
  await page.waitForTimeout(1600);
  await page.evaluate(()=>{const w=window.__zoo.world,p=w.entities.find(e=>e.kind==='fish');w.pondTap={id:p.id,x:p.x+2.5,z:p.z+1.7};w.select(p);});
  await page.waitForFunction(()=>window.__zoo.fishGame?.simulation||window.__zoo.fishGame?.simulation===null||window.__zoo.fishGame?.simulation===undefined&&window.__zoo.fishGame);
  const cast=await page.evaluate(()=>{const z=window.__zoo;return {point:z.fishingView.castTo.toArray(),rect:z.fishingView.pond.rectangular,rx:z.fishingView.pond.rx,rz:z.fishingView.pond.rz};});assert.equal(cast.rect,true);
  assert.equal(cast.rx,4);assert.equal(cast.rz,2.9);
  assert.ok(Math.abs(cast.point[0]+7.5)<cast.rx&&Math.abs(cast.point[2]-11.2)<cast.rz);
  // Cancel through the normal movement control, then exercise the rendered catch presentation.
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);await page.keyboard.up('ArrowRight');
  await page.waitForFunction(()=>!window.__zoo.fishGame);
  const landed=await page.evaluate(async()=>{
   const z=window.__zoo,w=z.world,v=z.fishingView,e=w.entities.find(e=>e.kind==='fish'),pond={id:e.id,x:e.x,z:e.z,...e.pond,waterId:e.waterId};
   const {bankCatchSpot}=await import('/src/bank-catch.ts');w.position.set(-7.5,0,15);w.destination=null;w.route=[];
   const spots=[];for(let i=0;i<4;i++){const at=bankCatchSpot(w.position,{...pond,r:pond.rx},i,(x,z)=>w.blocked(x,z));if(!at)throw Error('no dry spot');spots.push(at);v.begin(pond,w.position,pond);v.approachDistance(['fish_koi','fish_perch','fish_carp','fish_clown'][i]);v.land(()=>w.position,()=>{}, {fish:true,id:['fish_koi','fish_perch','fish_carp','fish_clown'][i]},at);}
   return spots;
  });assert.equal(landed.length,4);
  await page.waitForTimeout(2000);
  const fish=await page.evaluate(()=>window.__zoo.fishingView.bankFish.map(f=>({x:f.obj.position.x,z:f.obj.position.z,roll:f.obj.rotation.z})));
  assert.equal(fish.length,4);assert.ok(fish.every(f=>Math.abs(f.roll-Math.PI/2)<.11));
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/rectangular-pond-'+width+'.png'});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
