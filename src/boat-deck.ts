import * as T from 'three';
import { toonMaterial } from './toon.ts';
import { safeRadius } from './safe-zone.ts';

export const HATCH_SCALE = 1.8;
/** Cloudback's procedural hatch remains usable if its borrowed model cannot load. */
export function makeDeckHatch() {
  const wrapper = new T.Group(), hatch = new T.Group();
  const rim = new T.Mesh(new T.TorusGeometry(.78, .12, 10, 28).rotateX(Math.PI / 2), toonMaterial({ color: '#f5b21e' }));
  rim.position.y = .08; hatch.add(rim);
  const hole = new T.Mesh(new T.CircleGeometry(.72, 28).rotateX(-Math.PI / 2), toonMaterial({ color: '#1a1d33' }));
  hole.position.y = .03; hatch.add(hole);
  const door = new T.Group(); door.name = 'door'; door.position.set(0, .14, -.75);
  const lid = new T.Mesh(new T.CylinderGeometry(.74, .74, .1, 28), toonMaterial({ color: '#c77a3a' }));
  lid.position.z = .75; door.add(lid); hatch.add(door);
  hatch.scale.setScalar(HATCH_SCALE); hatch.position.y = .03; wrapper.add(hatch);
  return wrapper;
}

/** Four honey-coloured planks per repeat, staggered joints and subtle lengthwise grain. */
function plankTexture() {
  const width = 256, height = 512, bytes = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const board = Math.floor(x / 64), across = x % 64, along = (y + (board % 2) * 128) % 256;
    const seam = across < 2 || along < 2;
    const grain = Math.sin(x * 1.7 + Math.sin(y * .025) * 1.8) * 3 + Math.sin(x * .31 + y * .009) * 4;
    const shade = seam ? .53 : 1 + (board % 3 - 1) * .045 + grain / 255;
    const nail = (across === 7 || across === 57) && (along === 8 || along === 246);
    const i = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) bytes[i + c] = Math.round([190, 133, 76][c] * (nail ? .5 : shade));
    bytes[i + 3] = 255;
  }
  const map = new T.DataTexture(bytes, width, height); map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping; map.repeat.set(1 / 2.8, 1 / 7);
  map.magFilter = T.LinearFilter; map.minFilter = T.LinearMipmapLinearFilter; map.generateMipmaps = true;
  map.userData.owned = true; map.needsUpdate = true; return map;
}

/** A single deck surface inside the home fence, with a cutout around the existing fishing pond. */
export function woodenSafeDeck() {
  const group = new T.Group(); group.name = 'wooden-safe-deck'; group.userData.environment = true;
  const shape = new T.Shape(); shape.absarc(0, 0, safeRadius('home'), 0, Math.PI * 2, false);
  // Shape y becomes world -z. The bank and water keep their original geometry and fishing bounds.
  const pond = new T.Path(); pond.absarc(-7.5, -11.2, 3.85, 0, Math.PI * 2, true); shape.holes.push(pond);
  const deck = new T.Mesh(new T.ShapeGeometry(shape, 96).rotateX(-Math.PI / 2), toonMaterial({ map: plankTexture() }));
  deck.name = 'deck-planks'; deck.position.y = .018; deck.receiveShadow = true; group.add(deck);
  // A dark recess beneath the raised hatch rim covers the grass without changing navigation height.
  const shaft = new T.Mesh(new T.CircleGeometry(1.55, 48).rotateX(-Math.PI / 2), toonMaterial({ color: '#171b29' }));
  shaft.name = 'hatch-shaft'; shaft.position.set(0, .024, -8); group.add(shaft);
  return group;
}
