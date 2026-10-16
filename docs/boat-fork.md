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

## Cabin, deck and appearance pass (2026-10-17)

The home safe zone is now a 40 x 44 m rectangular wooden deck. Fence segments, four centred gates, the minimap, enemy protection/targeting, healing, worker delivery, neighbour routes and online home-space checks share its boundary. Four of the nine starter beds (indices 5–8) sit beside the gates with light-green soil. They accept normal crops and fruit trees and keep the existing Move bed / rotate controls and 24-bed limit. Existing layout-4 saves migrate only these beds still at their original positions; manually placed beds, crops, timers, levels, inventories and later moves are preserved by the `boatGateBeds` flag.

The outdoor kitchen and workshop are removed. The indoor stove opens the same cooking recipes; the indoor workbench opens the same crafting and Strengthen weapons forge. Its new oak bench includes an anvil, hammer, saw, wrench, pegboard and lower shelf. The separate upgrade bench remains because gear/skill levels are a different function. Storage is in the upper-left bedroom corner beside the bed and uses the same saved chest inventory. Outdoor map shortcuts lead to the cabin hatch.

The cabin keeps its 23 m width and extends from 15.525 to 21.6 m deep. Walls, floors, doorways, furniture, activity locations and collision shapes all use the deeper plan. The entrance is centred at the bottom; walking through it or using Outside exits. Camera pitch remains 42 degrees for players without a saved preference. Indoors it smoothly follows toward the occupied small room, with the entrance framed low on arrival.

Tiny, Chibi and Teen retain their former standing heights but use uniformly scaled Tall bodies and heads. Existing look IDs, ownership and prices remain valid. Gear fits and punch resets preserve the scaled rig. All Mirror icons are rendered from the actual updated models; Body, Ears and Hood examples use Tall.

Rebuild the appearance overrides with `node art/build-boat-looks.mjs` (targets are recorded in `art/boat-height-targets.json`). Rebuild cabin tools/chest with `node --experimental-strip-types art/build-boat-workbench.mjs`, then compress `public/assets/models/house.glb`. Generate thumbnails against a running dev server with `art/render-boat-look-icons.mjs` and `PLAYWRIGHT_MODULE` pointing to Playwright. Apply these boat overrides again after running the original Blender generators.

Validation includes `npm test`, `npm run build:pages`, the layout/save/tree-bed tests, 360 px and 1440 px cabin browser checks, hatch enter/reload/exit checks, and the production Pages smoke checks. Browser station checks perform a storage transfer, open crafting and forge, cooking, upgrades and Mirror, verify camera framing and scaled punching, and expose the gate bed Move control.
