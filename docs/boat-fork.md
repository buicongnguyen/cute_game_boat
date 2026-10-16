# Cute Game Boat

This repository starts from the copied cute_game checkout at 74d2be9, including the local pickup-feed animation fix and welcome-card browser helper fix. It is independently published at https://buicongnguyen.github.io/cute_game_boat/ from the main branch of https://github.com/buicongnguyen/cute_game_boat.

## Publish updates

Run npm test and npm run build:pages before committing. Push reviewed changes to this repository's main branch; the GitHub Actions Pages workflow tests, builds and deploys the solo edition. The default local Pages build uses /cute_game_boat/. Multiplayer needs its own separately configured server; this Pages release makes no account or socket requests.

## Independent player progress

All existing browser storage key families are prefixed with cute-game-boat:. The original game uses unprefixed keys, which this copy does not read, overwrite or migrate. Saves, profile selection, settings, neighbour progress, rankings and recovery flags therefore stay separate on the shared GitHub Pages origin. This is a namespace change for a new game, not a save-schema change. Service-worker scopes and cache prefixes already include the deployment path.

## Replace assets gradually

- Runtime models live in public/assets/models/; textures, item icons and audio live in the adjacent asset folders.
- src/assets.ts and the world/view modules choose model files and named nodes. Keep the existing file names, node names and expected transforms when replacing an asset in place, or update its specific loader mapping together with the file.
- art/ASSET_GUIDE.md documents the existing asset contract and generators. The initial publication does not alter the art.
- Build asset hashes automatically change when a model, icon or audio file changes, so the offline cache can fetch replacements.
- Check the changed asset in desktop and phone layouts, including its collision/silhouette and any animation pivots. Preserve required attribution and licenses.
- Browser/PWA titles identify Cute Game Boat. The existing in-game branding can be changed as part of the later art/design pass.

## First boat art pass: cabin hatch and wooden safe zone

The cottage exterior is replaced by the `hatch` root extracted from `new_cute_game/public/assets/models/props.glb` (Cloudback, same owner). Only that root and its `door` child are included in `public/assets/models/boat-hatch.glb`; the original source file is unchanged. The model uses the existing meshopt compression pipeline (17.3 KiB), preserves its rear hinge, and is mapped through `REFINED_ASSET_FILES.hatch` in `src/assets.ts`. Change that file mapping for a later art replacement. World scale is `HATCH_SCALE` in `src/boat-deck.ts`.

The hatch keeps the existing house interior and saved indoor state. Its lid opens on approach, and the home entity retains its interaction kind. `src/boat-deck.ts` also draws the home safe-zone wooden floor, cut around the original fishing pond. The radius, fence exits, gardens and other planets retain their existing gameplay. Grass/flower ground cover and stepping stones inside the deck are removed; trees and decorative bushes remain.

Validation: `npm test`, `npm run build:pages`, and the opt-in `tests/boat-deck-browser.test.mjs` on 360 px phone and 1440 px desktop. The browser regression checks the real lid, walking inside, reloading an indoor save and exiting. `tests/boat-pages.test.mjs` checks the published build and isolated saves.
