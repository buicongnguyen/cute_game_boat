import test from 'node:test';
import assert from 'node:assert/strict';
import { initHudLayout } from '../src/hud-layout.ts';

test('the task stack follows visible hero height after start and responsive resizes without repeated writes', () => {
  const names = ['document', 'ResizeObserver', 'MutationObserver', 'requestAnimationFrame', 'addEventListener', 'setTimeout'] as const;
  const saved = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const install = (name: string, value: unknown) => Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  const styles = new Map<string, string>(), writes: [string, string][] = [], observed: unknown[] = [];
  const events = new Map<string, () => void>(), frames: (() => void)[] = [];
  let height = 0, resized = () => {};
  const hero = { getBoundingClientRect: () => ({ height }) };
  const menu = {
    getBoundingClientRect: () => ({ width: 44, right: 500, bottom: 100 }),
    querySelectorAll: (selector: string) => selector === 'button' ? [{ getBoundingClientRect: () => ({ width: 34, height: 34, left: 461, bottom: 94 }) }] : [],
  };
  try {
    install('document', {
      querySelector: (selector: string) => selector.endsWith('.top-actions') ? menu : hero,
      documentElement: { style: { setProperty: (name: string, value: string) => { styles.set(name, value); writes.push([name, value]); } } },
    });
    install('ResizeObserver', class { constructor(callback: () => void) { resized = callback; } observe(target: unknown) { observed.push(target); } });
    install('MutationObserver', undefined);
    install('requestAnimationFrame', (callback: () => void) => { frames.push(callback); return frames.length; });
    install('addEventListener', (name: string, callback: () => void) => events.set(name, callback));
    install('setTimeout', () => 0);

    initHudLayout();
    assert.deepEqual(observed, [menu, hero], 'both changing dock and hero sizes are observed');
    assert.equal(styles.get('--hero-h'), undefined, 'a hidden startup plate preserves the CSS fallback');
    assert.equal(styles.get('--dock-w'), '39px');
    assert.equal(styles.get('--menu-bottom'), '94px');

    height = 57.2; resized();
    assert.equal(styles.get('--hero-h'), '58px', 'visible height rounds up so tasks clear the plate');
    const count = writes.length;
    resized();
    assert.equal(writes.length, count, 'unchanged dimensions publish nothing');
    height = 0; resized();
    assert.equal(styles.get('--hero-h'), '58px', 'hiding the HUD does not collapse the task anchor');

    height = 81.2;
    events.get('resize')!(); events.get('orientationchange')!();
    assert.equal(frames.length, 1, 'viewport events share one scheduled measurement');
    frames.shift()!();
    assert.equal(styles.get('--hero-h'), '82px', 'a responsive plate updates the task anchor');
  } finally {
    for (const name of names) { const descriptor = saved.get(name); if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
  }
});
