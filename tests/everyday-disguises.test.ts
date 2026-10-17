import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/model.ts';
import { applyGameAction } from '../src/actions.ts';
import { CombatSimulation, DISGUISE_KITS, type CombatEffect, type CombatTarget } from '../src/combat.ts';
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

test('every new slot uses the same mechanics as its established effect on the ground and in the air', () => {
  const run = (id: string, slot: number, airborne: boolean) => {
    const p = { x: 0, z: 0 }, effects: CombatEffect[] = [], hits: number[] = [], statuses: string[] = [];
    let healed = 0;
    const targets: CombatTarget[] = [{ id: 'target', x: 0, z: 3, radius: .5, hp: 1e6, maxHp: 1e6 }];
    const sim = new CombatSimulation({ position: () => p, facing: () => 0, face: () => {}, targets: () => targets, weapon: () => ({ kind: 'fist' }),
      stats: () => ({ attack: 100, critChance: 0, maxHp: 1000 }), move: (x, z) => { p.x += x; p.z += z; },
      effect: e => effects.push(e), hit: (_target, hit) => { hits.push(hit.amount); return hit.amount; },
      heal: amount => { healed += amount; }, status: (_target, kind) => { statuses.push(kind); }, moveTarget: () => {},
      ...(airborne ? { height: () => 2 } : {}) }, () => .5);
    const effect = DISGUISE_KITS[id][slot], rule = AIR_CAST[effect];
    assert.ok(rule && SKILL_WIND[effect], id + ' ' + effect);
    assert.equal(sim.disguise(id, slot, airborne ? { grounded: rule.cls !== 'air' || rule.at !== 'body', power: 1.1, landed: rule.cls === 'plunge' } : undefined), true);
    for (let tick = 0; tick < 400; tick++) sim.update(.025, true);
    assert.ok(effects.length || hits.length || statuses.length || healed > 0, id + ' ' + effect + ' has an observable result');
    const result = { p, effects, hits, statuses, healed, allies: sim.allies.map(a => a.kind), status: { ...sim.statuses } };
    sim.reset(); assert.equal(sim.projectiles.length, 0); assert.equal(sim.allies.length, 0); assert.deepEqual(sim.statuses, {});
    return result;
  };
  for (const id of IDS) DISGUISE_KITS[id].forEach((effect, slot) => {
    const original = Object.keys(LEGACY_PRICES).find(old => DISGUISE_KITS[old].includes(effect))!;
    const originalSlot = DISGUISE_KITS[original].indexOf(effect);
    assert.ok(original, effect); assert.ok(airCastPlan(effect, 'air'));
    for (const airborne of [false, true]) assert.deepEqual(run(id, slot, airborne), run(original, originalSlot, airborne), id + ' ' + effect);
  });
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
