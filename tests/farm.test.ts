import { CABIN_PEN, gardenGround, cabinWalkable } from '../src/cabin-garden.ts';
import { HOUSE, furnitureObstacles } from '../src/house.ts';
import { findRoute } from '../src/navigation.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as M from '../src/model.ts';
import { World } from '../src/world.ts';
import { FarmPenView, PEN_PROPS, BACK_FENCE_Z, penGoal, placeholderAnimal, rigOf } from '../src/farm-view.ts';
import { penHtml, collectText, dishesHtml, penSignature, type FarmUi } from '../src/farm-ui.ts';

// The animal pen (our extension: the reference has no farm animals), built on the crop rules.
const t0 = 1_000_000;
const home = (level = 10, energy = 1000, built = true) => { const s = M.newGame(); s.level = level; s.energy = energy; s.farm.built = built; return s; };
const reload = (s: M.SaveState) => M.parseSave(JSON.stringify(s))!;

test('chicks and calves cost energy, are level-gated like seeds and fill the pen up to its caps', () => {
  const s = home(1, 1000);
  assert.equal(M.canBuyAnimal(s, 'chicken'), 'level'); assert.equal(M.buyAnimal(s, 'chicken', t0), null); assert.equal(s.energy, 1000);
  s.level = 2; assert.equal(M.canBuyAnimal(s, 'cow'), 'level', 'cows open at level 5');
  const a = M.buyAnimal(s, 'chicken', t0)!; assert.equal(a.kind, 'chicken'); assert.equal(s.energy, 1000 - M.ANIMALS.chicken.price);
  for (let i = 1; i < 4; i++) assert.ok(M.buyAnimal(s, 'chicken', t0));
  assert.equal(M.canBuyAnimal(s, 'chicken'), 'full'); assert.equal(M.buyAnimal(s, 'chicken', t0), null); assert.equal(M.penCapacity(s, 'chicken'), 4);
  s.level = 5; assert.ok(M.buyAnimal(s, 'cow', t0)); assert.ok(M.buyAnimal(s, 'cow', t0)); assert.equal(M.canBuyAnimal(s, 'cow'), 'full');
  const poor = home(10, M.ANIMALS.cow.price - 1); assert.equal(M.canBuyAnimal(poor, 'cow'), 'energy'); assert.equal(M.buyAnimal(poor, 'cow', t0), null);
  const away = home(); away.planet = 'candy'; assert.equal(M.canBuyAnimal(away, 'chicken'), 'away');
  assert.deepEqual(new Set(s.farm.animals.map(x => x.uid)).size, 6, 'every animal has its own id');
});

test('the pen grows to ten chickens and ten cows over two paid expansions', () => {
  const s = home(10, 140 + 280);
  assert.equal(M.penExpandCost(s), 140); assert.ok(M.expandPen(s)); assert.equal(M.penCapacity(s, 'chicken'), 7); assert.equal(M.penCapacity(s, 'cow'), 6);
  assert.ok(M.expandPen(s)); assert.equal(s.energy, 0); assert.equal(M.penCapacity(s, 'chicken'), 10); assert.equal(M.penCapacity(s, 'cow'), 10);
  s.energy = 1e6; assert.equal(M.penExpandCost(s), null); assert.equal(M.expandPen(s), false); assert.equal(s.energy, 1e6);
  const poor = home(10, 139); assert.equal(M.expandPen(poor), false); assert.equal(poor.farm.penLevel, 0);
});

test('young animals grow up on a timer, then accumulate up to three products while away', () => {
  const s = home(), a = M.buyAnimal(s, 'chicken', t0)!, d = M.ANIMALS.chicken;
  assert.equal(M.isAdult(a, t0 + d.growMs - 1), false); assert.equal(M.growth(a, t0 + d.growMs / 2), .5);
  assert.equal(M.productProgress(a, t0 + d.growMs - 1), 0, 'no eggs while young');
  assert.equal(M.isAdult(a, t0 + d.growMs), true);
  const adult = t0 + d.growMs;
  assert.equal(M.productReady(a, adult + d.productMs - 1), false); assert.equal(M.timeLeft(a, adult + d.productMs - 1), 1);
  assert.equal(M.productReady(a, adult + d.productMs), true);
  // Offline stock stops at three; collecting a full store resets the next cycle.
  const later = adult + d.productMs * 10, got = M.collectProducts(s, later);
  assert.deepEqual(got, Array.from({length:3},()=>({ uid: a.uid, kind: 'chicken', item: 'egg' }))); assert.equal(s.bag.egg, 3);
  assert.equal(M.productReady(a, later), false, 'the next cycle starts at the collect'); assert.equal(M.productReady(a, later + d.productMs), true);
  assert.deepEqual(M.collectProducts(s, later + 1), [], 'nothing to collect twice');
  const cow = M.buyAnimal(s, 'cow', t0)!, c = M.ANIMALS.cow; assert.equal(M.collectProducts(s, t0 + c.growMs + c.productMs, [cow.uid])[0].item, 'milk');
});

test('a crop from the bag halves the time left, once while young and once per product cycle', () => {
  const s = home(), a = M.buyAnimal(s, 'chicken', t0)!, d = M.ANIMALS.chicken;
  assert.equal(M.feedAnimal(s, a.uid, t0), null, 'nothing to feed without a crop');
  M.addItem(s, 'pumpkin'); M.addItem(s, 'carrot', 3);
  assert.equal(M.feedCrop(s), 'carrot', 'the cheapest crop is the default feed');
  const half = t0 + d.growMs / 2;
  assert.equal(M.feedAnimal(s, a.uid, half), 'carrot'); assert.equal(s.bag.carrot, 2);
  assert.equal(M.timeLeft(a, half), d.growMs / 4, 'half of the remaining 30 s'); assert.equal(M.canFeed(a, half), false);
  assert.equal(M.feedAnimal(s, a.uid, half), null, 'once while young'); assert.equal(s.bag.carrot, 2);
  const adult = M.adultAt(a); assert.equal(adult, half + d.growMs / 4);
  assert.ok(M.canFeed(a, adult), 'a new stage takes feed again');
  assert.equal(M.feedAnimal(s, a.uid, adult, 'pumpkin'), 'pumpkin'); assert.equal(s.bag.pumpkin, undefined);
  assert.equal(M.timeLeft(a, adult), d.productMs / 2); assert.equal(M.productReady(a, adult + d.productMs / 2), true);
  assert.equal(M.feedAnimal(s, a.uid, adult + d.productMs / 2), null, 'not while an egg waits');
  M.collectProducts(s, adult + d.productMs / 2); assert.equal(a.fed, false); assert.ok(M.canFeed(a, adult + d.productMs / 2));
  assert.equal(M.feedAnimal(s, a.uid, adult, 'sword_wood'), null, 'only crops are feed');
  assert.equal(M.feedAnimal(s, 999, adult), null, 'no such animal');
  // Feed all feeds every hungry animal while crops last.
  const t = home(); M.addItem(t, 'radish', 2); for (let i = 0; i < 3; i++) M.buyAnimal(t, 'chicken', t0);
  assert.equal(M.feedAll(t, t0), 0, 'Feed all skips young animals'); assert.equal(t.bag.radish, 2);
  const grown = t0 + M.ANIMALS.chicken.growMs + 1; assert.equal(M.feedAll(t, grown), 2); assert.equal(t.bag.radish, undefined);
});

test('one collect gathers every waiting product with XP, in the order given', () => {
  const s = home(), d = M.ANIMALS.chicken, c = M.ANIMALS.cow;
  const hens = [0, 1, 2].map(() => M.buyAnimal(s, 'chicken', t0)!), cow = M.buyAnimal(s, 'cow', t0)!;
  const now = t0 + c.growMs + c.productMs; hens[1].cycleAt = now; // that hen just laid
  const xp = s.xp, level = s.level, got = M.collectProducts(s, now, [cow.uid, hens[2].uid, hens[1].uid, hens[0].uid]);
  assert.deepEqual(got.map(g => g.uid), [cow.uid, hens[2].uid, hens[2].uid, hens[0].uid, hens[0].uid]); assert.equal(s.bag.egg, 4); assert.equal(s.bag.milk, 1);
  assert.ok(s.level > level || s.xp > xp, 'collecting gives XP');
  assert.equal(collectText(got), 'Collected 5: 1 milk, 4 eggs.');
  assert.ok(d.productMs < c.productMs && M.ITEMS.milk.sell > M.ITEMS.egg.sell, 'milk is slower and worth more');
  const away = reload(s); away.planet = 'ice'; assert.deepEqual(M.collectProducts(away, now * 2), []);
});

test('products sell at the market and cook into dishes with buffs like the roasted foods', () => {
  const s = home(10, 0); M.addItem(s, 'egg', 3); M.addItem(s, 'milk', 4);
  assert.equal(M.sell(s, 'egg', 1), M.ITEMS.egg.sell); assert.equal(s.energy, 6);
  assert.equal(M.canCookDish(s, 'omelette'), true); assert.ok(M.cookDish(s, 'omelette')); assert.equal(s.bag.egg, undefined); assert.equal(s.bag.omelette, 1);
  assert.equal(M.cookDish(s, 'omelette'), false, 'needs two eggs');
  assert.ok(M.cookDish(s, 'cheese')); assert.equal(s.bag.milk, 1); assert.equal(M.cookDish(s, 'milkshake'), false);
  assert.equal(s.progression.totals.cook, 2, 'dishes count as meals');
  for (const d of M.FARM_DISHES) { const item = M.ITEMS[d.id]; assert.equal(item.type, 'food'); assert.ok(item.heal! >= 40 && item.buff && item.buff.time >= 90 && item.sell > 0, d.id); }
  s.hp = 1; assert.ok(M.eat(s, 'omelette')); assert.equal(s.buffs.def?.value, 10);
  const away = home(); M.addItem(away, 'egg', 2); away.planet = 'toy'; assert.equal(M.cookDish(away, 'omelette'), false);
  // Live farm animals are not inventory items; kitchen recipes use their products.
  assert.ok(!('chicken' in M.ITEMS) && !('cow' in M.ITEMS)); assert.ok(!M.FARM_DISHES.some(d => 'meat' in d.materials));
});

test('the farm saves and loads; old saves get an empty pen; bad entries are dropped', () => {
  const s = home(); M.expandPen(s); M.buyAnimal(s, 'chicken', t0); const cow = M.buyAnimal(s, 'cow', t0)!; M.addItem(s, 'carrot'); M.feedAnimal(s, cow.uid, t0 + 1000);
  const r = reload(s); assert.deepEqual(r.farm, s.farm);
  assert.equal(r.farm.built, true);
  const old = JSON.parse(JSON.stringify(s)); delete old.farm; assert.deepEqual(M.parseSave(JSON.stringify(old))!.farm, M.emptyFarm());
  const odd = JSON.parse(JSON.stringify(s)); odd.farm = { penLevel: 99, nextId: -4, animals: [{ uid: 1, kind: 'unicorn', bornAt: 1 }, { uid: 2, kind: 'cow', bornAt: 'x' }, { uid: 3, kind: 'cow', bornAt: 5 }, { uid: 3, kind: 'cow', bornAt: 6 }, ...Array.from({ length: 12 }, (_, i) => ({ uid: 10 + i, kind: 'chicken', bornAt: 7 }))] };
  const f = M.parseSave(JSON.stringify(odd))!.farm;
  assert.equal(f.penLevel, M.MAX_PEN_LEVEL); assert.deepEqual(f.animals.filter(a => a.kind === 'cow').map(a => a.uid), [3], 'unknown kinds, bad times and repeated ids go');
  assert.equal(f.animals.filter(a => a.kind === 'chicken').length, 10, 'never more than the pen holds'); assert.ok(f.nextId > Math.max(...f.animals.map(a => a.uid)));
  assert.equal(f.animals[0].cycleAt, 5 + M.ANIMALS.cow.growMs, 'a missing cycle starts at adulthood');
  const garbage = JSON.parse(JSON.stringify(s)); garbage.farm = 'nope'; assert.deepEqual(M.parseSave(JSON.stringify(garbage))!.farm, M.emptyFarm());
});

test('the pen is bought first: level 2 and ϟ40 on a marked plot; older saves with animals or a bigger pen count as built', () => {
  const s = home(1, 1000, false);
  assert.equal(M.penBuilt(s), false); assert.equal(M.canBuyAnimal(s, 'chicken'), 'unbuilt'); assert.equal(M.expandPen(s), false);
  assert.equal(M.canBuildPen(s), 'level'); assert.equal(M.buildPen(s), false); assert.equal(s.energy, 1000);
  s.level = 2; s.energy = M.PEN_BUILD.price - 1; assert.equal(M.canBuildPen(s), 'energy'); assert.equal(M.buildPen(s), false);
  const away = home(5, 1000, false); away.planet = 'ice'; assert.equal(M.canBuildPen(away), 'away');
  s.energy = 100; assert.ok(M.buildPen(s)); assert.equal(s.energy, 100 - M.PEN_BUILD.price); assert.equal(M.canBuildPen(s), 'built'); assert.equal(M.buildPen(s), false);
  assert.ok(M.PEN_BUILD.price > M.ANIMALS.chicken.price && M.PEN_BUILD.price < M.PEN_EXPANSIONS[0], 'between a chick and the first expansion');
  assert.equal(M.canBuyAnimal(s, 'chicken'), 'ok'); assert.equal(reload(s).farm.built, true, 'saved');
  assert.equal(M.newGame().farm.built, false, 'a new game starts with the plot');
  const raw = (farm: unknown) => { const o = JSON.parse(JSON.stringify(M.newGame())); o.farm = farm; return M.parseSave(JSON.stringify(o))!.farm.built; };
  assert.equal(raw({ animals: [], nextId: 1, penLevel: 0 }), false, 'an empty old pen is a plot');
  assert.equal(raw({ animals: [{ uid: 1, kind: 'chicken', bornAt: 5 }], nextId: 2, penLevel: 0 }), true, 'animals mean it stood');
  assert.equal(raw({ animals: [], nextId: 1, penLevel: 1 }), true, 'so does an expansion');
  const ui: FarmUi = { art: (id, icon) => icon, esc: x => x, mini: id => id, chips: () => '', effect: () => '' };
  assert.match(penHtml(home(1, 0, false), ui), /Reach level 2/); assert.match(penHtml(home(2, 0, false), ui), /data-action="build-pen"[^>]*>🔨 Build the animal pen · ϟ 40/);
});

test('the pen stands on clear ground: off the trails, the fence, the cottage, the well, the chest and the trees', () => {
  const { x, z, hw, hd } = M.PEN;
  for (const [cx, cz] of [[x - hw, z - hd], [x + hw, z - hd], [x - hw, z + hd], [x + hw, z + hd]]) {
    assert.ok(Math.hypot(cx, cz) < 16, 'inside the village fence');
    assert.ok(Math.abs(cx) > 1.4 && Math.abs(cz) > 1.4, 'off the stepping-stone trails');
  }
  for (const o of M.HOME_CLEARANCE) assert.ok(M.penDistance(o.x, o.z) >= o.r, `clear of ${o.x},${o.z}`);
  // The roaming yard is wider than the old fence but still clear of the trails, the village fence and everything above.
  for (let i = 0; i < 72; i++) {
    const a = i / 72 * Math.PI * 2, px = x + Math.cos(a) * M.YARD.rx, pz = z + Math.sin(a) * M.YARD.rz;
    assert.ok(Math.hypot(px, pz) < 15.5 && Math.abs(px) > 1.4 && Math.abs(pz) > 1.4, `yard edge ${px.toFixed(1)},${pz.toFixed(1)}`);
    for (const o of M.HOME_CLEARANCE) assert.ok(Math.hypot(px - o.x, pz - o.z) >= o.r * .9, `yard edge clear of ${o.x},${o.z}`);
  }
  assert.ok(M.YARD.rx > hw && M.YARD.rz > hd, 'a little wider than the old fence');
  // The starting garden keeps a path to the gate.
  for (let i = 0; i < 9; i++) { const b = M.defaultBed(i); assert.ok(M.clearOfPen(b.x, b.z, M.BED_HALF, 1.4), `bed ${i}`); }
  for (const p of PEN_PROPS) assert.ok(Math.abs(p.x) + p.r * .5 < hw && Math.abs(p.z) + p.r * .5 < hd, `${p.id} inside the fence`);
  let n = 1; const rng = () => (n = (n * 16807) % 2147483647) / 2147483647;
  const keep = [{ x: 3.4, z: 1.5, r: 1 }];
  for (let i = 0; i < 200; i++) { const g = penGoal(rng, .45, keep, i % 2 ? { x: 1, z: 1 } : undefined); assert.ok(M.inYard(x + g.x, z + g.z) && PEN_PROPS.every(p => Math.hypot(g.x - p.x, g.z - p.z) > p.r) && Math.hypot(g.x - 3.4, g.z - 1.5) > 1); }
  assert.equal(M.decorSpotOk(M.newGame(), x, z), true, 'the former deck pen is now clear');
  assert.equal(M.decorSpotOk(M.newGame(), x + M.YARD.rx - .3, z), true, 'the former yard is now clear');
});

test('the compact downstairs pen preserves livestock and lets them roam safely around the cabin', () => {
  const w = Object.assign(Object.create(World.prototype), {
    state: home(), scene: new T.Scene(), camera: new T.PerspectiveCamera(40, 4/3, .5, 300), root: new T.Group(), player: new T.Group(), companion: new T.Group(), position: new T.Vector3(),
    destination:null,route:[],selected:null,obstacles:[],entities:[],enemies:[],plotMeshes:[],cropSignatures:[],particles:[],keys:new Set<string>(),facing:0,time:0,planet:'home',hazardTimer:0,
    marker:new T.Mesh(),ring:new T.Mesh(),cameraTarget:new T.Vector3(),sun:new T.DirectionalLight(),raycaster:new T.Raycaster(),onInteract(){},onAttackEnemy(){},onDamage(){},onZone(){},
  }) as World;
  w.build('home'); const pen=w.cabinPen!,view=w.farmView!;
  assert.equal(w.entities.some(e=>e.kind==='pen'),false);assert.deepEqual([pen.x,pen.z],[CABIN_PEN.x,CABIN_PEN.z]);
  const route=findRoute(HOUSE.spawn,{x:CABIN_PEN.x,z:CABIN_PEN.z+3},furnitureObstacles(),{bounds:30,gridSize:.5,walkable:cabinWalkable});
  assert.ok(route.length,'the kitchen doorway reaches the garden without crossing walls');
  const now=Date.now();for(let i=0;i<4;i++)M.buyAnimal(w.state,'chicken',now-3e5);M.buyAnimal(w.state,'cow',now);M.buyAnimal(w.state,'cow',now-1e6);
  const before=structuredClone(w.state.farm),camera=new T.OrthographicCamera(-30,30,30,-30,.1,100);camera.position.set(0,50,0);camera.lookAt(0,0,0);camera.updateMatrixWorld();view.setCamera(camera);
  view.update(w.state.farm.animals,.1,1,now);
  const hens=view.animals.getObjectByName('farm-chicken:body') as T.InstancedMesh;assert.equal(hens.count,4);assert.ok(view.draws<=18);
  let far=0,rest=0,count=0;const cells=new Set<string>();
  for(let i=0;i<6000;i++) {view.update(w.state.farm.animals,.1,i*.1,now);for(const a of view.activities()){
    const r=a.kind==='cow'?(a.young?.5:.75):(a.young?.2:.28);
    assert.ok(gardenGround(a.x,a.z,r*.9),'animals stay on the green perimeter and out of the cabin');
    assert.ok(w.cabinPenObstacles().every(o=>Math.hypot(a.x-o.x,a.z-o.z)>=o.r+r*.85),'animals avoid the coop and fence');
    if(Math.hypot(a.x-CABIN_PEN.x,a.z-CABIN_PEN.z)>8)far++;if(!a.walking)rest++;count++;cells.add(Math.floor(a.x/4)+','+Math.floor(a.z/4));
  }}
  assert.ok(far>0&&cells.size>15,'animals explore around the house');assert.ok(rest/count>.35,'animals pause to graze');assert.deepEqual(w.state.farm,before,'moving and animating the farm never rewrites ownership or product timers');
  w.build('ice');assert.equal(w.farmView,undefined);
});

test('stand-in animals carry the contract part names, and the rig splits them into body, head, tail and legs', () => {
  const cow = rigOf(placeholderAnimal('cow')), hen = rigOf(placeholderAnimal('chicken'));
  assert.deepEqual(cow.parts.map(p => p.draw), ['body', 'head', 'tail', 'legs']); assert.equal(cow.parts.find(p => p.draw === 'legs')!.pivots.length, 4);
  assert.deepEqual(hen.parts.map(p => p.draw), ['body', 'head', 'legs'], 'a hen\'s wings and tail ride on its body');
  assert.deepEqual(cow.parts.find(p => p.draw === 'legs')!.pivots.map(p => p.sign), [1, -1, -1, 1], 'diagonal pairs swing together');
  assert.ok(cow.height > 1.3 && hen.height < .6);
});

test('the pen panel lists animals, feed, buying and growing; the kitchen shows farm dishes once there are products', () => {
  const ui: FarmUi = { art: (id, icon) => icon, esc: s => s, mini: id => id, chips: m => Object.keys(m ?? {}).join(','), effect: i => `${i.heal}` };
  const s = home(3, 30), now = Date.now();
  let html = penHtml(s, ui, now); assert.match(html, /farm is empty/); assert.match(html, /data-action="buy-animal" data-kind="chicken"/); assert.match(html, /Level 5/);
  M.buyAnimal(s, 'chicken', now - 1e6); M.addItem(s, 'carrot', 2); html = penHtml(s, ui, now);
  assert.match(html, /Collect 3/); assert.match(html, /Feed: carrot/); assert.match(html, /data-animal="1"/);
  const sig = penSignature(s, now); M.collectProducts(s, now); assert.notEqual(penSignature(s, now), sig);
  assert.equal(dishesHtml(M.newGame(), ui), ''); assert.match(dishesHtml(s, ui), /data-action="cook-dish" data-item="omelette"/);
});

test('view: a missing kit leaves the stand-ins, and disposing frees the pen', () => {
  const v = new FarmPenView(); assert.equal(v.usesKit, false); v.update([{ uid: 1, kind: 'cow', bornAt: 0, cycleAt: 0 }], .1, 1, 1e12);
  assert.ok(v.positionOf(1)); v.collect(1); v.update([], .1, 1.1, 1e12); assert.equal(v.positionOf(1), null, 'a removed animal leaves');
  v.dispose(); assert.equal(v.statics.children.length, 0); assert.equal(v.draws, 0);
});
