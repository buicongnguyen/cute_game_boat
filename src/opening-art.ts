import { sceneryKit, wildsKit, cropKit, heroKit, heroKitFor, refinedAssets, spaceKit, wearKit, weaponKit, disguiseKit, petKit } from './assets.ts';
import { houseKit } from './house-view.ts';
import { toLook, DEFAULT_LOOK } from './looks.ts';
/** Finish initial art loading before constructing the world. Loaders retain offline fallback/retry behavior. */
export async function loadOpeningArt(look: string) {
  await Promise.all([sceneryKit.load(), wildsKit.load(), cropKit.load(), heroKit.load(),
    heroKitFor(toLook(look) ?? DEFAULT_LOOK).load(), refinedAssets.loadAll(), spaceKit.load(),
    houseKit.load(), wearKit.load(), weaponKit.load(), disguiseKit.load(), petKit.load()]);
}
