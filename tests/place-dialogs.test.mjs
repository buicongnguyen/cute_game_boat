import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as M from '../src/model.ts';
import * as Tester from '../src/tester.ts';
import { t } from '../src/i18n.ts';
import { PlaceNoticeHistory } from '../src/place-notices.ts';
import { indoorStore, purposeHtml } from '../src/house-stores.ts';
import { COLOSSUS_LEVEL } from '../src/colossus-sleep.ts';
import { photos, friendLabel } from '../src/house-activities.ts';
import { FRIENDS, FRIEND_IDS, CAGES, cageState } from '../src/friends.ts';
import { lockedHint } from '../src/friend-ui.ts';
import { PLANETS } from '../src/content.ts';

// Execute the maintained dialog routing and two real callers. The small DOM boundary records
// modal/focus/input effects; browser layout, notice rendering and timing have separate checks.
const parse = file => {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
};
const main = parse('../src/main.ts'), life = parse('../src/house-life.ts');
function variable(ast, name) {
  let declaration;
  const visit = node => { if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) declaration = node; ts.forEachChild(node, visit); };
  visit(ast); assert.ok(declaration?.initializer, `actual ${name} initializer`);
  return `const ${name} = ${declaration.initializer.getText(ast)};`;
}
const functions = ['openDialog', 'colossusDialog'].map(name => {
  const fn = main.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(fn, `actual ${name} function`); return fn.getText(main);
});
let interaction;
const findInteraction = node => { if (ts.isBinaryExpression(node) && node.left.getText(main) === 'world.onInteract') interaction = node.right; ts.forEachChild(node, findInteraction); };
findInteraction(main); assert.ok(interaction && ts.isArrowFunction(interaction), 'actual world interaction callback');
const compiled = ts.transpileModule([
  variable(main, 'esc'), variable(main, 'DIALOG_LOOK'), ...functions, variable(life, 'trophyWall'),
  `world.onInteract=${interaction.getText(main)};`,
  'globalThis.api={openDialog,colossusDialog,trophyWall};',
].join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;

function fixture({ state = M.newGame('Keeper'), storage = new Map(), actionHandler = null, persistence = null } = {}) {
  const effects = [], notices = [], bursts = [], toasts = [], history = new PlaceNoticeHistory(() => 'dialog-profile', {
    getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value),
  });
  const nodes = new Map();
  const element = selector => {
    const node = { dataset: {}, hidden: false, inert: false, innerHTML: '', textContent: '', scrollTop: 0,
      querySelector: () => null, focus: () => { effects.push('focus'); document.activeElement = node; } };
    nodes.set(selector, node); return node;
  };
  for (const selector of ['#dialog', '#dialog-layer', '#dialog-body', '#dialog-title', '#dialog-kicker', '#dialog-icon', '#hud', '#world-labels', '.close-button']) element(selector);
  nodes.get('#dialog-layer').hidden = true;
  const document = { activeElement: { id: 'world-control' } };
  const world = { state, interior: null, destination: { x: 7, z: 9 }, route: [{ x: 1, z: 2 }, { x: 7, z: 9 }],
    interactEnvironment: () => null, burst: (...args) => bursts.push(args) };
  const context = vm.createContext({ M, Tester, t, indoorStore, purposeHtml, COLOSSUS_LEVEL, photos, friendLabel, FRIENDS, FRIEND_IDS, CAGES, cageState, lockedHint, PLANETS,
    state, world, document, actionHandler, persistence, modal: '', lastFocused: { id: 'earlier-focus' }, bagMode: 'bag', shopFocus: '', fishGame: null,
    $: selector => { assert.ok(nodes.has(selector), `bounded dialog selector ${selector}`); return nodes.get(selector); },
    placeNotices: { first: id => history.first(id), show: (...args) => { notices.push(args); return true; } },
    endFishing: () => { effects.push('end-fishing'); context.fishGame = null; },
    clearHeldInput: () => effects.push('clear-input'), tone: kind => effects.push(`tone:${kind}`), setDock: kind => effects.push(`dock:${kind}`),
    foldLists: kind => effects.push(`fold:${kind}`), localizeHtml: value => value, magicMirrorTabs: () => '', focusShopRow: () => effects.push('shop-focus'),
    colossusChoice: () => null, started: true, uiBlocked: () => false, house: { interact: () => false }, visiting: null,
    toast: (...args) => toasts.push(args), perform: () => { throw new Error('Unexpected game action in dialog routing'); },
  });
  context.d = { openDialog: (...args) => context.api.openDialog(...args), tone: kind => effects.push(`house-tone:${kind}`) };
  vm.runInContext(compiled, context);
  return { context, world, state, nodes, effects, notices, bursts, toasts, storage, api: context.api, document };
}
function presentation(f) {
  return [...f.nodes].map(([selector, node]) => [selector, { dataset: { ...node.dataset }, hidden: node.hidden, inert: node.inert, innerHTML: node.innerHTML, textContent: node.textContent, scrollTop: node.scrollTop }]);
}
function expectNonmodal(f, action) {
  f.context.fishGame = { phase: 'hooked' };
  const before = { presentation: presentation(f), modal: f.context.modal, lastFocused: f.context.lastFocused,
    active: f.document.activeElement, destination: f.world.destination, route: f.world.route, fishGame: f.context.fishGame, state: JSON.stringify(f.state) };
  action();
  assert.deepEqual(presentation(f), before.presentation, 'an informational reminder does not rewrite or open the modal');
  assert.equal(f.context.modal, before.modal); assert.equal(f.context.lastFocused, before.lastFocused);
  assert.equal(f.document.activeElement, before.active, 'focus stays with the active control');
  assert.equal(f.world.destination, before.destination); assert.equal(f.world.route, before.route, 'the walking route is retained');
  assert.equal(f.context.fishGame, before.fishGame, 'a reminder does not end an active fishing session');
  assert.equal(JSON.stringify(f.state), before.state, 'dialog routing does not mutate the save');
  assert.deepEqual(f.effects, [], 'no input clearing, focus transfer, docking or open sound');
}
function expectModal(f, type) {
  assert.equal(f.context.modal, type); assert.equal(f.nodes.get('#dialog-layer').hidden, false);
  assert.equal(f.nodes.get('#hud').inert, true); assert.equal(f.nodes.get('#world-labels').inert, true);
  assert.equal(f.world.destination, null); assert.deepEqual(Array.from(f.world.route), []);
  assert.ok(f.effects.includes('clear-input')); assert.ok(f.effects.includes('focus'));
  assert.equal(f.document.activeElement, f.nodes.get('.close-button'));
  assert.deepEqual(f.notices, []);
}

test('the first fishing encounter opens one actionable introduction with the boat shop route and current rod price', () => {
  const f = fixture(), priorFocus = f.document.activeElement;
  f.api.openDialog('fish-help', 'Old pond title', '<p>Old recurring instructions</p>');
  expectModal(f, 'fish-help');
  assert.equal(f.context.lastFocused, priorFocus);
  assert.equal(f.nodes.get('#dialog').dataset.notice, 'intro');
  assert.equal(f.nodes.get('#dialog-title').textContent, 'Fishing');
  assert.equal(f.nodes.get('#dialog-kicker').textContent, '');
  const body = f.nodes.get('#dialog-body').innerHTML;
  assert.ok(body.includes('Keep a fishing rod in your backpack'));
  assert.ok(body.includes('Magic Mirror → Equipment → Supplies → Rods &amp; tools'));
  assert.ok(body.includes(`ϟ ${M.shopPrice(f.state, 'rod')}`));
  assert.match(body, /data-action="shop-rod">Visit the Magic Mirror<\/button>/);
  assert.ok(!body.includes('Old recurring instructions'));
});

test('a repeated fishing introduction after reload becomes nonmodal without touching an existing dialog or travel input', () => {
  const storage = new Map(), first = fixture({ storage });
  first.api.openDialog('fish-help', 'Fishing', 'unused');
  for (const modal of ['', 'bag']) {
    const f = fixture({ storage }); f.context.modal = modal;
    f.nodes.get('#dialog-layer').hidden = !modal;
    f.nodes.get('#hud').inert = !!modal;
    f.nodes.get('#dialog').dataset.notice = 'existing-style';
    f.nodes.get('#dialog-body').innerHTML = '<button>Keep this menu</button>';
    expectNonmodal(f, () => f.api.openDialog('fish-help', 'Fishing', 'unused'));
    assert.equal(f.notices.length, 1); assert.equal(f.notices[0][0], 'fishing');
    assert.ok(f.notices[0][1].includes('Magic Mirror → Equipment → Supplies → Rods & tools'));
    assert.equal(f.notices[0][2], '🎣');
  }
});

test('locked Normal and Hard kitchens give a passive level reminder without taking control', () => {
  for (const difficulty of ['normal', 'hard']) {
    const state = M.newGame(); state.settings.difficulty = difficulty; state.level = M.KITCHEN_LEVEL - 1;
    const f = fixture({ state }); f.world.interior = 'cottage';
    expectNonmodal(f, () => f.api.openDialog('cook', 'Kitchen', '<button>Not yet</button>'));
    assert.deepEqual(f.notices, [['kitchen-locked', `Kitchen unlocks at level ${M.KITCHEN_LEVEL}.`, '🔒', true]]);
  }
});

test('Easy, unlocked and tester kitchens keep their functional cabin menu', () => {
  for (const [difficulty, level, tester] of [['easy', 1, false], ['normal', M.KITCHEN_LEVEL, false], ['hard', M.KITCHEN_LEVEL, false], ['normal', M.KITCHEN_LEVEL - 1, true]]) {
    const state = M.newGame(); state.settings.difficulty = difficulty; state.level = level;
    if (tester) Tester.unlockTester(state);
    const f = fixture({ state }); f.world.interior = 'cottage';
    f.api.openDialog('cook', 'Kitchen', '<button data-action="cook-one">Cook 1</button>');
    expectModal(f, 'cook');
    assert.equal(f.nodes.get('#dialog-title').textContent, 'Cottage stove');
    assert.equal(f.nodes.get('#dialog').dataset.station, 'cook');
    assert.ok(f.nodes.get('#dialog-body').innerHTML.includes('data-action="cook-one"'));
  }
});

test('the real Colossus settings caller gives an online reminder for either connection path', () => {
  for (const [actionHandler, persistence] of [[() => {}, null], [null, () => {}], [() => {}, () => {}]]) {
    const f = fixture({ actionHandler, persistence });
    expectNonmodal(f, () => f.api.colossusDialog());
    assert.deepEqual(f.notices, [['well-shared', 'The Colossus follows the server’s clock and settings.', '🪨', true]]);
  }
});

test('the real offline Colossus settings caller retains every functional lid choice', () => {
  const f = fixture(); f.api.colossusDialog(); expectModal(f, 'colossus-settings');
  const body = f.nodes.get('#dialog-body').innerHTML;
  for (const action of ['well-sleep', 'well-soothe', 'well-wild', 'well-auto', 'bookshelf']) assert.ok(body.includes(`data-action="${action}"`), `${action} remains available`);
});

test('the real trophy wall stays accessible when empty and reflects actual boss and friend records', () => {
  for (const records of ['empty', 'boss', 'friend']) {
    const state = M.newGame(); state.bosses = []; state.friends = [];
    if (records === 'boss') state.bosses.push('home:treant');
    if (records === 'friend') state.friends.push({ id: 'sprout', role: 'garden', rescuedAt: 1, home: true, gear: {} });
    const f = fixture({ state }); f.api.trophyWall(); expectModal(f, 'house-trophies');
    const body = f.nodes.get('#dialog-body').innerHTML;
    assert.ok(body.includes('Missing friends')); assert.ok(body.includes('data-missing-friend="clover"'));
    assert.ok(body.includes(`Bosses beaten · ${state.bosses.length}`));
    assert.ok(body.includes(`Friends rescued · ${state.friends.length}`));
    assert.equal(body.includes('data-missing-friend="sprout"'), records !== 'friend');
    if (records === 'empty') assert.ok(body.includes('No trophies yet.'), 'empty cups do not hide the rescue board');
  }
});

test('opening a normal functional dialog after the fishing introduction clears its special intro styling', () => {
  const f = fixture(); f.api.openDialog('fish-help', 'Fishing', 'unused');
  assert.equal(f.nodes.get('#dialog').dataset.notice, 'intro');
  f.api.openDialog('bag', 'Your backpack', '<button data-action="equip">Equip</button>');
  expectModal(f, 'bag');
  assert.equal(f.nodes.get('#dialog').dataset.notice, '');
  assert.ok(f.nodes.get('#dialog-body').innerHTML.includes('data-action="equip"'));
});

test('the actual mine interaction reminds while unavailable, preserves successful rewards and gives nothing for a rejected claim', async () => {
  for (const scenario of ['missing index', 'regrowing', 'available', 'rejected']) {
    const f = fixture(), performed = [];
    f.state.planet = 'toy'; f.state.level = 4;
    if (scenario === 'regrowing') f.state.worldRewards.mineReadyAt.toy = [Date.now() + 60_000, 0];
    f.context.perform = async (type, payload) => {
      performed.push([type, { ...payload }]);
      assert.equal(type, 'claimMine');
      return scenario === 'rejected' ? false : M.claimMine(f.state, payload.index);
    };
    const before = JSON.stringify(f.state), route = f.world.route, focus = f.document.activeElement;
    const materialBefore = (f.state.bag.gear ?? 0) + (f.state.chest.gear ?? 0);
    await f.world.onInteract({ kind: 'mine', index: scenario === 'missing index' ? undefined : 0, x: -6, z: 3 });
    if (scenario === 'missing index' || scenario === 'regrowing') {
      assert.deepEqual(f.notices, [['mine-regrowing', 'This crystal needs a moment to regrow.', '💎', true]]);
      assert.deepEqual(performed, [], 'an unavailable vein never submits a reward claim');
    } else {
      assert.deepEqual(f.notices, []);
      assert.deepEqual(performed, [['claimMine', { index: 0 }]]);
    }
    if (scenario === 'available') {
      assert.equal((f.state.bag.gear ?? 0) + (f.state.chest.gear ?? 0), materialBefore + 1, 'the successful claim still grants its world material');
      assert.deepEqual(f.bursts, [[-6, 3, '#d9c9f3']]);
      assert.deepEqual(f.toasts, [['A crystal for your crafting collection!', '💎']]);
    } else {
      assert.equal(JSON.stringify(f.state), before, 'unavailable or rejected claims grant no progress or material');
      assert.deepEqual(f.bursts, []); assert.deepEqual(f.toasts, [], 'no success feedback for a failed claim');
    }
    assert.equal(f.context.modal, ''); assert.equal(f.nodes.get('#dialog-layer').hidden, true);
    assert.equal(f.world.route, route); assert.equal(f.document.activeElement, focus);
    assert.ok(!f.effects.includes('clear-input'), 'the mine reminder does not clear held movement');
  }
});
