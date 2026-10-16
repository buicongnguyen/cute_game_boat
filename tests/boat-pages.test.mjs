// Opt in with BOAT_PAGES_URL; accepts the production build or the actual GitHub Pages URL.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { dismissWelcome } from './browser-start.mjs';
const url = process.env.BOAT_PAGES_URL;
for (const viewport of [{ width: 360, height: 740 }, { width: 1440, height: 900 }]) {
  test('boat Pages starts, saves independently and opens the bag at ' + viewport.width, { skip: !url && 'set BOAT_PAGES_URL', timeout: 120000 }, async () => {
    const pw = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
    const browser = await pw.chromium.launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
    try {
      const page = await browser.newPage({ viewport, hasTouch: viewport.width < 600, isMobile: viewport.width < 600 });
      const errors = [], api = [], missing = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (/\/(api|socket)(\/|$)/.test(new URL(r.url()).pathname)) api.push(r.url()); });
      page.on('response', r => { if (r.status() >= 400) missing.push(r.status() + ' ' + r.url()); });
      await page.addInitScript(() => { localStorage.setItem('cute-game-save-v1', 'original save sentinel'); localStorage.setItem('cute-game-slot', '2'); localStorage.setItem('cute-game-boat:cute-game-language', 'en'); });
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      assert.match(await page.title(), /Cute Game Boat/);
      await page.waitForSelector('#title-screen button.primary', { timeout: 60000 });
      await page.waitForFunction(() => !document.querySelector('#title-screen').inert);
      await page.fill('#name-input', 'BoatTest'); await page.click('#title-screen button.primary');
      await dismissWelcome(page); await page.waitForSelector('#hud', { state: 'visible' });
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(400); await page.keyboard.up('ArrowRight');
      await page.locator('#hud [data-action="bag"]:visible').first().click(); await page.waitForSelector('#dialog-layer', { state: 'visible' });
      assert.ok((await page.locator('#dialog').innerText()).length > 30);
      await page.keyboard.press('Escape'); await page.waitForSelector('#dialog-layer', { state: 'hidden' });
      await page.waitForFunction(() => !!localStorage.getItem('cute-game-boat:cute-game-save-v1'), null, { timeout: 20000 });
      const saved = await page.evaluate(() => ({ original: localStorage.getItem('cute-game-save-v1'), slot: localStorage.getItem('cute-game-slot'), boat: JSON.parse(localStorage.getItem('cute-game-boat:cute-game-save-v1')) }));
      assert.equal(saved.original, 'original save sentinel'); assert.equal(saved.slot, '2'); assert.equal(saved.boat.name, 'BoatTest');
      const info = await (await page.request.get(new URL('build-info.json', url).href)).json();
      assert.deepEqual(info, { base: '/cute_game_boat/', edition: 'solo' });
      const manifest = await (await page.request.get(new URL('manifest.webmanifest', url).href)).json(); assert.equal(manifest.short_name, 'Cute Game Boat');
      const sw = await page.request.get(new URL('sw.js', url).href); assert.equal(sw.status(), 200); assert.ok((await sw.text()).includes('const BASE="/cute_game_boat/"'));
      assert.deepEqual(api, []); assert.deepEqual(errors, []); assert.deepEqual(missing, []);
      if (process.env.BOAT_SHOT_DIR) await page.screenshot({ path: process.env.BOAT_SHOT_DIR + '/boat-' + viewport.width + '.png' });
    } finally { await browser.close(); }
  });
}
