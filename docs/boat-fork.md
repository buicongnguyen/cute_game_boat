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

## Cabin garden, stations and faces (2026-10-17)

The downstairs cabin now has a rectangular green garden reached through the kitchen-side front doorway. A compact pen sits on the left lawn; its animals and helper route around the cabin. Existing animal ownership, production, species-pen positions and inventory are retained; the saved pen coordinates are mapped into the new garden for display.

The Trophy wall lists missing/rescued friends and their rescue locations, replacing the outdoor discovery counter. The study Bookshelf keeps the collection log and now opens the Colossus controls formerly at the removed outdoor Ember Well. The lower-right bookshelf beside the workbench is now a teal-and-brass Wishing cabinet opening the existing wishing upgrades; the outdoor crystal is removed. The six-card introduction and Help > Cabin guide lead to the actual deck and cabin stations, walking through the hatch when needed.

All body/height choices have a smaller smile; boy/man faces gain fine outer lashes, while the existing girl/woman lashes remain. Facial patches no longer produce jagged outline spikes; the head silhouette stays outlined. Rebuild faces on the original Tall/Grown source GLBs with art/build-boat-faces.mjs, then rebuild short heights with art/build-boat-looks.mjs, compress all hero GLBs, and regenerate the look icons. The face generator records its version to prevent applying the mouth reduction twice.

Validation: full unit/save/model suite, Pages build (including TypeScript), 360/1440 cabin and deck browser checks, downstairs garden/friend/bookshelf/wishing/introduction browser checks, repeated cabin transitions and indoor HUD checks, and production Pages smoke tests.

## Exchange box, Magic Mirror and Pepper (2026-10-17)

Pepper now considers even one remaining ripe bed, still skipping a bed claimed by Sprout. Friend arrival and idle decisions use the shared rectangular home boundary. Regression checks cover a lone fruit tree at all four outer corners and actual walking/harvesting beyond the old circle.

The Exchange box replaces the plant on the right of the cabin's lower exit and opens the existing Harvest market selling actions. Magic Mirror opens on Equipment, preserving every former shop category, buying, equipping and try-on action; Looks remains a second main tab. Switching back clears any unbought appearance preview. The outdoor market and outfitters, including their placement blockers, are removed. The introduction and station shortcuts lead indoors. Existing inventory, owned looks, equipment and saves remain compatible.

Rebuild the Exchange box with art/build-boat-workbench.mjs, then compress house.glb. Verify with npm test, npm run build:pages, the cabin browser tests and tests/boat-exchange-browser.test.mjs (360/1440), then the live Pages smoke tests.


## First-frame art, reference faces and cabin practice (2026-10-17)

Player eyes, highlights, cheeks and smile now come from the sibling 3d_farmer_fish_sell models (source commit 9ca557b). The face generator transfers those head decals to each boat head size; Man uses the reference Boy face and Woman uses Girl. Neck geometry, body proportions, saved look IDs, equipment fits and original standing heights are retained. Regenerate with art/build-boat-faces.mjs (optional reference-model directory argument), then art/build-boat-looks.mjs, model compression and art/render-boat-look-icons.mjs.

The outdoor deck now lies at y=0, matching the walking plane. A depth offset keeps the underlying coplanar grass from flickering through. Opening art finishes loading before the world is constructed; the title shows a loading message. Existing failed-download retries and fallback remain available when assets are unreachable. A saved cabin session resumes before the title disappears.

Indoor skills, attack, jump and weapon swapping are visible, including for fresh saves. Guns can fire practice shots without a creature target. Indoor attacks cannot target outdoor enemies or harvest outdoor scenery. Projectiles and delayed attacks clear across the doorway, their visuals follow the current scene, and skill cooldowns are preserved.

Two review passes:
- Pass 1 checked rendering, first-scene readiness, floor coordinates, avatar geometry and indoor input. Fixed duplicate CSS hiding controls, new-player HUD gating, missing indoor projectile/effect scenes, jump cancellation and outdoor target/scenery leakage.
- Pass 2 checked transitions, cooldowns, automatic targeting, saved-cabin resume and untargeted weapon behavior. Fixed doorway cooldown resets, outdoor auto-targeting, the one-frame outdoor resume and guns failing to fire during practice. Updated obsolete tests that expected hidden indoor controls or removed outdoor shops.

Validation: full unit suite (2,169 passed), TypeScript and Pages production build. Targeted browser checks cover delayed opening art, cabin controls, all four skills, jumping, gun shots, matching-coordinate outdoor enemy protection, cooldown preservation and room transitions at 360 and 1440 pixels. Existing deck/cabin/shop/garden and asset-recovery browser checks also run before publication.

## Cat ears and everyday disguises (2026-10-17)

New explorers start with free, owned cat ears on the existing Girl/Tall body. Valid saved appearances and legacy no-ear defaults remain intact. Bear ears and fox ears are separate 150-energy choices in the Ears row; their ownership is independent of the similarly named hoods.

The Magic Mirror adds Sporty swimmer, K-pop singer, Yoga teacher and Kindhearted nurse disguises. Descriptions state the actual effects, including self-healing. The swimmer uses the existing swimming controls. All older disguise prices and strength scores remain stable.

### Blender rebuild and own kits (2026-10-17, branch dz-blender)

The first versions were one recoloured hoodie with a small hat, built in JS. They are now modelled in the Blender kit (`art/blender/kit/build_everyday_disguises.py`, on build_hero.py's helpers) in saturated colours: the swimmer has a coral swim cap with goggles, an aqua rash guard with coral bands, a yellow duck ring and coral flippers; the K-pop idol has pink idol hair with a gold star clip, a headset, a violet stage jacket with gold epaulettes and sequins, a layered pink-and-gold skirt, white stage boots and a star light stick; the yoga teacher has a bun and headband, a lime top over a bare midriff, magenta leggings, bare feet, a lotus charm and a rolled tangerine mat across the shoulders; the nurse has a white cap and dress with red crosses, a pink stethoscope, a medical bag and a cute syringe. The bear and fox ears and tails were rebuilt there too (chocolate with cream; orange with white and dark tips), with the same node names.

Each costume now has its own four skills (combat.ts DISGUISE_KITS and DZ, looks in skill-visuals.ts painted into the shared DisguiseFx batches, tooltips in skill-info.ts, Vietnamese in locales/vi-everyday-disguises.ts): swimmer Splash wave, Bubble shield, Torpedo dash, Whirlpool; K-pop Mic drop, Light-stick beam, Encore, Spotlight finale; yoga Tree pose, Sun salutation, Calm breath, Lotus bloom; nurse First aid, Bandage wrap, Vitamin toss, Ambulance rush. Cooldowns are tuned so each price still equals the strength formula and no older radar maximum moves. The server runs the same CombatSimulation.

Regenerate with `blender -b --factory-startup --python art/blender/kit/build_everyday_disguises.py -- --install [--render]`. `--install` copies the portraits and runs `node art/build-boat-appearance.mjs`, which compresses the Blender output and appends it to `disguises.glb` and `hero-parts.glb` behind the recorded boundary, so every older model keeps its exact bytes. `--before` renders the installed models as a line-up for comparisons. That JS file no longer builds geometry or portraits.

## Boat deck kit (2026-10-18, branch boat-art)

An asset audit (docs/game-review/ASSET-AUDIT.md) ranked the deck floor, fence and gates, hatch, pond shore and harpoon weak. They are now Blender kit pieces from `art/blender/kit/build_boat_deck.py`: `boat-deck.glb` holds `rail` (white post with a red band and brass cap, two rope swags, teal toe board; 156 triangles), `rail_post`, `boat_gate` (mast posts, navy anchor sign, bunting, life ring; 1,740), `deck_cargo` (crates, barrel, rope coil, ring stand; 1,168), `deck_lantern` (184), `pond_frame` (timber kerb in three plank tones, white cap, teal lining and floor, brass-capped bollards, ladder, ring; 2,960) and `harpoon` (198). `boat-hatch.glb` is a teal companionway with brass corners, a planked lid with a porthole and ring handle, a lantern and a life ring (1,724), with the same `hatch` root and `door` hinge child.

`src/boat-deck.ts` loads the kit with the opening art (`boatDeckKit`) and places plain copies on its merged baked-colour parts, which `World.batchScenery` folds into its culled 48 m chunks, so 80 rails, 12 posts, 4 gates, 4 cargo corners and 8 lanterns cost about two draws. Rails cast no shadow. Collision, gate positions, the fence obstacles and the pond outline are unchanged; until the kit loads the old pickets and sand bank stand in. The deck texture now has 0.5 m boards in five warm tones with staggered butt joints, caulked seams and nails. The harpoon uses the kit model when loaded, else the old box fork.

Regenerate with `blender -b --factory-startup --python art/blender/kit/build_boat_deck.py -- --install --render`, then `npm run art:compress`. Previews: `art/previews/kit/boat-deck.webp`, `boat-hatch.webp`, `boat-pond.webp`. `tests/boat-deck-kit.test.ts` checks names, budgets, placements and the hinge.
