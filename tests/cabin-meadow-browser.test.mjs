import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {dismissWelcome} from './browser-start.mjs';
const url=process.env.BOAT_DECK_URL;
for(const width of [360,1440])test('meadow herd recovers and garden entrance remains accessible at '+width,{skip:!url&&'set BOAT_DECK_URL',timeout:180000},async()=>{
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
 const browser=await chromium.launch({args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width,height:width===360?740:900},hasTouch:width===360,isMobile:width===360}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('cute-game-boat:cute-game-language','en'));
  await page.goto(url);await page.waitForSelector('#name-input');await page.fill('#name-input','MeadowTest');await page.click('#title-screen button.primary');await dismissWelcome(page);
  await page.waitForFunction(()=>window.__zoo?.world.entities.some(e=>e.kind==='home'));
  await page.evaluate(async()=>{
   const z=window.__zoo,w=z.world,M=await import('/src/model.ts');z.state.level=30;z.state.energy=100000;z.state.farm.built=true;z.state.farm.penLevel=2;
   for(let i=0;i<8;i++)M.buyAnimal(z.state,'chicken',Date.now()-300000);
   for(let i=0;i<3;i++)M.buyAnimal(z.state,'cow',Date.now()-600000);
   z.state.friends=['sprout','clover','pepper'].map((id,i)=>({id,role:['garden','farm','cook'][i],rescuedAt:Date.now(),gear:{},home:true,paused:true,borrowed:true,look:'girl-chibi-none-bare'}));
   w.build('home');z.house.enter(true);
  });
  await page.waitForFunction(()=>window.__zoo.house.inside&&window.__zoo.world.farmView.positions().length===11);
  const result=await page.evaluate(async()=>{
   const z=window.__zoo,v=z.world.farmView,{roamRadius}=await import('/src/farm-roam.ts');
   const walkers=[...v.walkers.values()];walkers.forEach(w=>{w.x=-18.9;w.z=-14.9;w.walking=false;w.restT=.1;w.path=[];w.dest=null;});
   const paths=walkers.map(()=>0),now=Date.now();let bad=0;
   for(let i=0;i<3600;i++){
    const before=walkers.map(w=>({x:w.x,z:w.z}));v.update(z.state.farm.animals,.1,i*.1,now);
    walkers.forEach((w,j)=>{if(v.area.blocked(w.x,w.z,roamRadius(w)))bad++;if(i>20)paths[j]+=Math.hypot(w.x-before[j].x,w.z-before[j].z);});
   }
   const plants=(await import('/src/cabin-meadow.ts')).meadowPlants();
   return {paths,bad,flowers:plants.filter(p=>p.flower).length,plants:plants.length};
  });
  assert.equal(result.bad,0);assert.ok(result.paths.every(d=>d>5),JSON.stringify(result));assert.ok(result.flowers>70);
  await page.evaluate(()=>window.__zoo.world.walkTo(-16,6));
  await page.waitForFunction(()=>{const p=window.__zoo.world.position;return Math.hypot(p.x+16,p.z-6)<.6},null,{timeout:45000});
  await page.waitForTimeout(1000);
  if(process.env.BOAT_SHOT_DIR)await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/cabin-meadow-'+width+'.png'});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
