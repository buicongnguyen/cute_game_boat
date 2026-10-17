import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.ts';
import { applyGameAction } from '../src/actions.ts';
import { CombatSimulation, DISGUISE_KITS, DZ, type CombatEffect, type CombatTarget } from '../src/combat.ts';
import { AXES, axisBest, allProfiles, profile, rawProfile } from '../src/disguise-profile.ts';
import { AIR_CAST, airCastPlan } from '../src/air-cast.ts';
import { SKILL_WIND } from '../src/skill-wind.ts';
import { DISGUISE_INFO, skillDescription, skillTip } from '../src/skill-info.ts';
import { skillSound } from '../src/skill-sounds.ts';
import { levelledCooldown } from '../src/skill-upgrades.ts';
import { VI_PACK } from '../src/locales/vi-pack.ts';
import { setLanguage, t } from '../src/i18n.ts';

const IDS = ['dz_swimmer', 'dz_kpop', 'dz_yoga', 'dz_nurse'];
const LEGACY_PRICES = {
  dz_superhero: 600, dz_ninja: 550, dz_mage: 410, dz_knight: 480, dz_mecha: 530, dz_dino: 300,
  dz_fairy: 480, dz_pirate: 300, dz_vampire: 440, dz_snowman: 530, dz_army: 380, dz_navy: 400,
  dz_aodai: 420, dz_aodai_man: 310, dz_usa: 510, dz_vietnam: 320, dz_dawnstar: 410,
};

test('the four outfits buy through the shared action, consume the shown cost, equip and survive saving', () => {
  assert.deepEqual(M.RECIPES.slice(-5).map(r => r.result), ['harpoon', ...IDS], 'new recipes append after the previous last recipe');
  const shop = M.SHOP_CATEGORIES.find(c => c.tab === 'Disguises')!;
  for (const id of IDS) {
    const s = M.newGame(), item = M.ITEMS[id], offer = shop.items.find(o => o.id === id)!;
    assert.ok(offer, id); assert.equal(offer.cost, item.price); assert.deepEqual(offer.mats, item.materials);
    assert.ok(item.price! >= 300 && item.price! <= 550, 'accessible existing mid-game price range');
    s.energy = item.price!;
    for (const [material, count] of Object.entries(item.materials!)) assert.ok(M.addItem(s, material, count));
    assert.equal(applyGameAction(s, { type: 'buy', payload: { id } }, { now: 1_000_000, random: () => .5 }), true);
    assert.equal(s.energy, 0); assert.equal(s.bag[id], 1);
    for (const material of Object.keys(item.materials!)) assert.equal(s.bag[material] ?? 0, 0);
    assert.equal(applyGameAction(s, { type: 'equip', payload: { id } }), true);
    assert.equal(s.gear.disguise, id); assert.equal(M.weaponStats(s).kind, M.DISGUISES[id].weapon.kind);
    const loaded = M.parseSave(JSON.stringify(s))!;
    assert.equal(loaded.gear.disguise, id); assert.equal(loaded.bag[id], 1);
    assert.deepEqual(M.activeStats(loaded), M.activeStats(s));
    assert.equal(M.unequip(loaded, 'disguise'), true); assert.equal(loaded.bag[id], 1);
  }
});

test('new combinations leave the previous radar maxima, scores and prices unchanged', () => {
  const legacy = Object.keys(LEGACY_PRICES).map(id => rawProfile(id));
  const legacyBest = Object.fromEntries(AXES.map(axis => [axis, Math.max(...legacy.map(p => p.raw[axis]))]));
  assert.deepEqual(axisBest(), legacyBest, 'new outfits must not rescale existing radar charts');
  for (const [id, price] of Object.entries(LEGACY_PRICES)) {
    const p = profile(id);
    assert.equal(M.ITEMS[id].price, price, id);
    for (const axis of AXES) assert.equal(p.scores[axis], Math.round(p.raw[axis] / legacyBest[axis] * 100), id + ' ' + axis);
  }
  assert.deepEqual(IDS.map(id => profile(id).role), ['sweeper', 'striker', 'controller', 'healer']);
  for (const id of IDS) assert.equal(M.ITEMS[id].price, Math.round(profile(id).total / 6) * 10);
  assert.equal(allProfiles().length, Object.keys(LEGACY_PRICES).length + IDS.length);
});

// The four kits are their own (2026-10-17): every effect id is new, has an air class, a wind class and a look, and does
// what its tooltip says, with the numbers of combat.ts DZ.
const KITS = { dz_swimmer: ['splash', 'bubble', 'torpedo', 'whirlpool'], dz_kpop: ['micdrop', 'stickbeam', 'encore', 'spotlight'],
  dz_yoga: ['treepose', 'sunsalute', 'breath', 'lotusbloom'], dz_nurse: ['firstaid', 'bandage', 'vitamin', 'ambulance'] };
function arena(spots: Array<{ x: number; z: number }>, airborne = false) {
  const p = { x: 0, z: 0 }, effects: CombatEffect[] = [], hits: Record<string, number> = {}, knocks: Record<string, number> = {}, stuns: Record<string, number> = {}, statuses: Record<string, Record<string, number>> = {};
  let healed = 0;
  const targets: CombatTarget[] = spots.map((s, i) => ({ id: 't' + i, x: s.x, z: s.z, radius: .5, hp: 1e6, maxHp: 1e6 }));
  const sim = new CombatSimulation({ position: () => p, facing: () => 0, face: () => {}, targets: () => targets, weapon: () => ({ kind: 'fist' }),
    stats: () => ({ attack: 100, critChance: 0, maxHp: 1000 }), move: (x, z) => { p.x += x; p.z += z; },
    effect: e => effects.push(e), hit: (target, hit) => { hits[target.id] = (hits[target.id] ?? 0) + 1; knocks[target.id] = Math.max(knocks[target.id] ?? 0, hit.knock); stuns[target.id] = Math.max(stuns[target.id] ?? 0, hit.stun); target.hp -= hit.amount; return hit.amount; },
    heal: amount => { healed += amount; }, status: (target, kind, duration) => { (statuses[target.id] ??= {})[kind] = Math.max(statuses[target.id]?.[kind] ?? 0, duration); },
    moveTarget: (target, x, z) => { target.x = x; target.z = z; }, ...(airborne ? { height: () => 2 } : {}) }, () => .5);
  const run = (seconds: number) => { for (let i = 0; i < seconds / .025; i++) sim.update(.025, true); };
  return { sim, p, effects, hits, knocks, stuns, statuses, targets, run, healed: () => healed };
}

test('the four kits are their own: new effect ids with an air class, a wind class, a sound and looks that DisguiseFx draws', () => {
  const others = new Set(Object.entries(DISGUISE_KITS).filter(([id]) => !IDS.includes(id)).flatMap(([, kit]) => kit));
  for (const id of IDS) {
    assert.deepEqual(DISGUISE_KITS[id], KITS[id as keyof typeof KITS], id);
    for (const effect of DISGUISE_KITS[id]) { assert.ok(!others.has(effect), `${effect} is borrowed`); assert.ok(AIR_CAST[effect] && airCastPlan(effect, 'air'), effect); assert.ok(SKILL_WIND[effect], effect); }
    for (let slot = 0; slot < 4; slot++) assert.notEqual(skillSound(slot, id), 'punch');
  }
  for (const [id, kit] of Object.entries(KITS)) for (let slot = 0; slot < 4; slot++) {
    const a = arena([{ x: 0, z: 3 }, { x: 1, z: 5 }, { x: -1, z: 6 }]);
    assert.equal(a.sim.disguise(id, slot), true, kit[slot]); a.run(6);
    const looks = a.effects.map(e => e.look).filter(Boolean);
    assert.ok(looks.some(l => !['rush'].includes(l!)), `${kit[slot]} draws a look of its own`);
    a.sim.reset(); assert.equal(a.sim.allies.length, 0); assert.deepEqual(a.sim.statuses, {});
    // Cast from a jump it works too (air-cast.ts), and still does something.
    const air = arena([{ x: 0, z: 3 }], true), rule = AIR_CAST[kit[slot]];
    assert.equal(air.sim.disguise(id, slot, { grounded: rule.cls !== 'air' || rule.at !== 'body', power: 1.1, landed: rule.cls === 'plunge' }), true, kit[slot] + ' in the air');
  }
});

test('swimmer: the splash wave hits its cone only, the bubble guards and heals, the torpedo dives through, the whirlpool gathers', () => {
  const K = DZ;
  let a = arena([{ x: 0, z: 4 }, { x: 0, z: -3 }]); a.sim.disguise('dz_swimmer', 0); a.run(.1);
  assert.equal(a.hits.t0, 1); assert.equal(a.hits.t1, undefined, 'nothing behind'); assert.equal(a.statuses.t0.slow, K.splash.slow); assert.ok(a.knocks.t0 >= K.splash.knock, 'washed back');
  a = arena([]); a.sim.disguise('dz_swimmer', 1); assert.equal(a.sim.statuses.shield, K.bubble.time); assert.equal(a.healed(), K.bubble.heal); assert.equal(a.sim.invulnerable, true);
  a = arena([{ x: .3, z: 5 }]); a.sim.disguise('dz_swimmer', 2); a.run(.6); assert.ok(Math.abs(a.p.z - K.torpedo.speed * K.torpedo.time) < .3, `dove ${a.p.z}`); assert.equal(a.hits.t0, 1);
  a = arena([{ x: 0, z: 6 }, { x: 7, z: 6 }]); a.sim.disguise('dz_swimmer', 3); a.run(K.whirlpool.time + .2);
  assert.ok(Math.hypot(a.targets[1].x - 0, a.targets[1].z - 6) < 2, 'the outer creature is pulled into the eye'); assert.ok((a.hits.t0 ?? 0) >= 5, 'the eye stings each tick');
});

test('K-pop: the mic drop stuns round her, the beam hits its line, the encore heals and cheers, the finale beats then stuns', () => {
  const K = DZ;
  let a = arena([{ x: 3, z: 3 }, { x: 0, z: K.micdrop.radius + 2 }]); a.sim.disguise('dz_kpop', 0); a.run(.05);
  assert.equal(a.hits.t0, 1); assert.equal(a.stuns.t0, K.micdrop.stun); assert.equal(a.hits.t1, undefined);
  a = arena([{ x: .4, z: 10 }, { x: 3, z: 5 }]); a.sim.disguise('dz_kpop', 1); a.run(.05);
  assert.equal(a.hits.t0, 1); assert.equal(a.statuses.t0.blind, K.stickbeam.blind); assert.equal(a.hits.t1, undefined, 'off the line');
  a = arena([]); a.sim.disguise('dz_kpop', 2); assert.equal(a.healed(), K.encore.heal); assert.equal(a.sim.statuses.cheer, K.encore.cheerTime); assert.equal(a.sim.statuses.swift, K.encore.time);
  a = arena([{ x: 0, z: 8 }]); a.sim.disguise('dz_kpop', 3); a.run(K.spotlight.delay + K.spotlight.beats * K.spotlight.gap + .1);
  assert.equal(a.hits.t0, K.spotlight.beats + 1); assert.equal(a.stuns.t0, K.spotlight.stun, 'the finale stuns');
  assert.ok(a.effects.filter(e => e.look === 'confetti').length >= 2 && a.effects.some(e => e.look === 'spotlight'));
});

test('yoga: the tree pose adds defence while it lasts, the salutation heals over time, the breath pushes its cone, the lotus roots then slows', () => {
  const K = DZ;
  let a = arena([]); a.sim.disguise('dz_yoga', 0); assert.equal(a.sim.defenseBonus, K.treepose.defence); assert.equal(a.healed(), K.treepose.heal);
  a.run(K.treepose.time + .1); assert.equal(a.sim.defenseBonus, 0);
  a = arena([]); a.sim.disguise('dz_yoga', 1); a.run(K.sunsalute.time + .1); assert.ok(Math.abs(a.healed() - K.sunsalute.perTick * K.sunsalute.time / K.sunsalute.tick) < 1e-9);
  a = arena([{ x: 0, z: 5 }, { x: 5, z: 0 }]); a.sim.disguise('dz_yoga', 2); a.run(.05); assert.equal(a.hits.t0, 1); assert.equal(a.hits.t1, undefined, 'outside the cone'); assert.equal(a.statuses.t0.slow, K.breath.slow);
  a = arena([{ x: 2, z: 2 }]); a.sim.disguise('dz_yoga', 3); assert.equal(a.statuses.t0.stun, K.lotusbloom.root); a.run(K.lotusbloom.time + .1); assert.equal(a.hits.t0, K.lotusbloom.time / K.lotusbloom.tick);
});

test('nurse: first aid heals big, the bandage holds three, the vitamin bounces through four and heals, the ambulance shoves aside', () => {
  const K = DZ;
  let a = arena([]); a.sim.disguise('dz_nurse', 0); assert.equal(a.healed(), K.firstaid.heal); assert.equal(a.sim.invulnerable, true);
  a = arena([{ x: 0, z: 5 }, { x: 2, z: 6 }, { x: -2, z: 6 }, { x: 0, z: 20 }]); a.sim.disguise('dz_nurse', 1);
  for (const id of ['t0', 't1', 't2']) assert.equal(a.statuses[id]?.stun, K.bandage.stun, id); assert.equal(a.statuses.t3, undefined);
  a = arena([{ x: 0, z: 4 }, { x: 3, z: 6 }, { x: 6, z: 8 }, { x: 9, z: 10 }, { x: 30, z: 30 }]); a.sim.disguise('dz_nurse', 2); a.run(1);
  for (const id of ['t0', 't1', 't2', 't3']) assert.equal(a.hits[id], 1, id); assert.equal(a.hits.t4, undefined);
  assert.ok(Math.abs(a.healed() - K.vitamin.bounces * K.vitamin.heal) < 1e-9);
  a = arena([]); assert.equal(a.sim.disguise('dz_nurse', 2), false, 'no pill without a target');
  a = arena([{ x: .4, z: 4 }]); a.sim.disguise('dz_nurse', 3); a.run(.6);
  assert.ok(Math.abs(a.p.z - K.ambulance.speed * K.ambulance.time) < .3); assert.equal(a.hits.t0, 1); assert.ok(a.targets[0].x > 4, 'shoved off the road'); assert.equal(a.sim.statuses.swift > 0, true);
});

test('tooltips expose fixed cooldowns and actual effects in both languages with no fallback sound', () => {
  const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.'));
  for (const id of IDS) {
    const d = M.DISGUISES[id]; assert.equal(d.skills.length, 4); assert.equal(DISGUISE_INFO[id].length, 4);
    for (const text of [M.ITEMS[id].name, M.ITEMS[id].desc, ...d.skills.map(s => s.name)]) assert.ok(VI_PACK[text], text);
    d.skills.forEach((s, slot) => {
      assert.equal(levelledCooldown(slot, s.cd, 5, true), s.cd);
      assert.notEqual(skillSound(slot, id), 'punch', id + ' ' + slot);
      setLanguage('en'); const en = skillDescription(slot, { disguise: id });
      assert.ok(en.length > 0 && numbers(en).length > 0); assert.ok(skillTip(s, slot, { disguise: id, level: 5 }).includes(s.cd + ' s cooldown'));
      try {
        setLanguage('vi'); const vi = skillDescription(slot, { disguise: id });
        assert.notEqual(vi, en); assert.notEqual(t(s.name), s.name); assert.deepEqual(numbers(vi), numbers(en));
      } finally { setLanguage('en'); }
    });
  }
  assert.match(M.ITEMS.dz_swimmer.desc, /flippers/);
  assert.match(M.ITEMS.dz_nurse.desc, /your health, not other explorers/);
});
