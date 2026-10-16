import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY } from '../src/model.ts';
import { activeSlot, activeKey, setActiveSlot, slotKey, indoorsKey, neighboursKey } from '../src/profiles.ts';

test('boat profiles cannot read or overwrite the original game on a shared Pages origin', () => {
  const original = new Map([['cute-game-save-v1', 'original save'], ['cute-game-slot', '2'], ['zoo-garden-indoors', '1'], ['cute-game-neighbours-v1', 'original neighbours']]);
  const values = new Map(original), descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } });
  try {
    assert.equal(activeSlot(), 0); assert.equal(values.get(activeKey()), undefined);
    assert.equal(SAVE_KEY, 'cute-game-boat:cute-game-save-v1');
    assert.equal(setActiveSlot(2), true); assert.equal(activeKey(), slotKey(2));
    for (let slot = 0; slot < 3; slot++) for (const key of [slotKey(slot), indoorsKey(slot), neighboursKey(slot)]) { assert.ok(key.startsWith('cute-game-boat:')); values.set(key, 'boat data'); }
    for (const [key, value] of original) assert.equal(values.get(key), value);
  } finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else Reflect.deleteProperty(globalThis, 'localStorage'); }
});
