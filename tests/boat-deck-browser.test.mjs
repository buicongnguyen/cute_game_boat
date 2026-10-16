// Dev-only entrance and deck regression: BOAT_DECK_URL=http://127.0.0.1:5461/
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { dismissWelcome } from './browser-start.mjs';
const url = process.env.BOAT_DECK_URL;
for (const width of [360, 1440]) test('boat hatch opens, enters, resumes indoors and exits at ' + width, { skip: !url && 'set BOAT_DECK_URL', timeout: 120000 }, async () => {
  const pw = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
  const browser = await pw.chromium.launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width, height: width === 360 ? 740 : 900 }, hasTouch: width === 360, isMobile: width === 360 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('cute-game-boat:cute-game-language', 'en'));
    await page.goto(url); await page.waitForFunction(() => document.querySelector('#title-screen') && !document.querySelector('#title-screen').inert);
    await page.fill('#name-input', 'DeckTest'); await page.click('#title-screen button.primary'); await dismissWelcome(page);
    await page.waitForFunction(() => window.__zoo?.world.entities.some(e => e.mesh.userData.refinedAsset === 'hatch'));
    await page.evaluate(() => { const w=window.__zoo.world; w.position.set(0,0,0); w.destination=null; w.route=[]; });
    await page.waitForFunction(() => Math.abs(window.__zoo.world.entities.find(e=>e.kind==='home').mesh.getObjectByName('door').rotation.x) < .05);
    await page.evaluate(() => { const w=window.__zoo.world; w.position.set(0,0,-4.3); w.cameraTarget.copy(w.position); });
    await page.waitForFunction(() => window.__zoo.world.entities.find(e=>e.kind==='home').mesh.getObjectByName('door').rotation.x < -1.7);
    const deck = await page.evaluate(() => { const w=window.__zoo.world; return { floor: !!w.root.getObjectByName('deck-planks'), oldDoor: !!w.root.getObjectByName('cottage-door'), blocked: w.blocked(0,-4.3) }; });
    assert.deepEqual(deck,{floor:true,oldDoor:false,blocked:false});
    await page.waitForTimeout(3500);
    if(process.env.BOAT_SHOT_DIR) await page.screenshot({path:process.env.BOAT_SHOT_DIR+'/boat-deck-'+width+'.png'});
    // Walk toward the hatch through the normal input path, rather than calling house.enter.
    await page.keyboard.down('ArrowUp');
    try { await page.waitForFunction(() => document.body.classList.contains('indoors'),null,{timeout:10000}); }
    finally { await page.keyboard.up('ArrowUp'); }
    await page.waitForFunction(() => localStorage.getItem('cute-game-boat:zoo-garden-indoors') === '1');
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#title-screen') && !document.querySelector('#title-screen').inert);
    await page.click('#title-screen button.primary'); await dismissWelcome(page);
    await page.waitForFunction(() => document.body.classList.contains('indoors'));
    await page.locator('.house-out:visible').click();
    await page.waitForFunction(() => !document.body.classList.contains('indoors'));
    assert.equal(await page.evaluate(() => !!window.__zoo.world.root.getObjectByName('deck-planks')),true);
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
});
