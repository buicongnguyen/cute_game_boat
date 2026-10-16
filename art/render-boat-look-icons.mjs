/** Render option thumbnails from the actual game avatar. Run against a local dev server:
 * PLAYWRIGHT_MODULE=<installed playwright/index.mjs> node art/render-boat-look-icons.mjs
 */
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(process.env.BOAT_DEV_URL??'http://127.0.0.1:5461/');
 await page.waitForFunction(()=>window.__zoo?.world);
 const icons=await page.evaluate(async()=>{
  const {ROWS,swapOption}=await import('/src/looks.ts'),{heroKit,heroKitFor}=await import('/src/assets.ts'),{MirrorPreview,restPose}=await import('/src/mirror-preview.ts');
  await heroKit.load();const out=[];
  const portrait=new MirrorPreview({width:128,height:128,reach:3.25,yaw:-.28});
  for(const [row,options] of Object.entries(ROWS))for(const option of options){
   const look=swapOption('boy-tall-none-bare',option);await heroKitFor(look).load();
   if(!portrait.show(null,look,()=>restPose(window.__zoo.world.lookAvatar('#4aa8ff',{},look))))portrait.reset();
   out.push({option,row,look,data:portrait.canvas.toDataURL('image/webp',.94)});
  }
  return out;
 });
 for(const icon of icons)fs.writeFileSync(new URL('../public/assets/icons/looks/'+icon.option+'.webp',import.meta.url),Buffer.from(icon.data.split(',')[1],'base64'));
 await page.evaluate(icons=>{document.body.innerHTML='';document.body.style.cssText='margin:0;background:#f6ead5;color:#34291f;font:16px sans-serif;overflow:auto';const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(7,140px);gap:8px;padding:20px';for(const icon of icons){const tile=document.createElement('div');tile.style.cssText='background:#fff9ee;border-radius:12px;text-align:center;padding-bottom:10px';tile.innerHTML=`<img width="128" height="128" src="${icon.data}"><div>${icon.option}</div>`;grid.append(tile);}document.body.append(grid);},icons);
 await page.screenshot({path:(process.env.TEMP??'.')+'/boat-look-contact.png',fullPage:true});console.log('Rendered '+icons.length+' Tall-style option portraits.');
}finally{await browser.close();}
