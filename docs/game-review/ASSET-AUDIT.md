# Boat edition asset audit (2026-10-18)

Scope: the assets and visuals Codex added for Cute Game Boat (fork of Zoo Garden at 74d2be9), audited on c30374d. Captured in game with the mid-game save (`promo/save.json` seeded under the `cute-game-boat:` prefix) on a phone (390 x 844, touch) and a PC (1600 x 900). Pictures are kept locally under `.shots-agent/before/` and `.shots-agent/after/` (untracked).

| Item | Source | Rank | Why |
| --- | --- | --- | --- |
| Home deck floor | `src/boat-deck.ts` plank texture | weak | One flat orange with +-4.5 % tone change; at 40 x 44 m it reads as a single colour field, no plank lengths or joints. |
| Deck fence and four gates | village `fence`/`gate` pickets from `scenery.glb` | weak | Garden pickets and a swing-seat gate: out of theme for a boat, thin, beige on orange wood (low contrast on a phone). |
| Cabin hatch | `boat-hatch.glb`, borrowed from Cloudback | weak | A round barrel lid with two iron straps; small, brown on brown wood, nothing says "ship" except the lantern. |
| First view of the home area | deck + hatch + fence together | weak | Large empty orange plane; no boat props, the hatch is the only feature. |
| Home pond shore | `src/pond-view.ts` rectangular bank | weak | A flat pale-sand rectangle under a flat translucent plane: no edge, no depth, no boat detail. |
| Combat harpoon (held and thrown) | `src/harpoon-art.ts` | weak | 84-triangle box fork in pale grey-beige; reads as a stick in the hero's hand. |
| Cabin interior (deeper plan) | `house.glb` | OK | Warm, readable rooms and labelled stations; flat floors are acceptable indoors. |
| Indoor workbench, chest, exchange box | `art/build-boat-workbench.mjs` | OK | Correct props and silhouettes; a little small and dark on a phone, but in kit colours. |
| Cabin garden and meadow | `src/cabin-garden.ts`, `src/cabin-meadow.ts` | OK | Cute low grass and flowers in one batched mesh; the pen ground is a flat ellipse but reads fine. |
| Hero bodies (Tiny/Chibi/Teen scaled) | `art/build-boat-looks.mjs` | good | Proportions consistent with the kit; no seams seen. |
| Hero faces | `art/build-boat-faces.mjs` | good | Soft reference faces as the owner asked; left alone. |
| Look icons | `art/render-boat-look-icons.mjs` | good | Rendered from the real models, readable at Mirror size. |
| Everyday disguises, bear/fox ears | Blender (c30374d) | good | Already rebuilt; out of scope. |

Rebuilt (see `docs/boat-fork.md`, "Boat deck kit"): deck floor, fence and gates, hatch, first-view dressing, pond shore, harpoon. Left: cabin interior, workbench, garden, heroes (OK or good).

Notes: in close-zoom captures the explorer sometimes draws semi-transparent (the scenery/hero fade while the test pins the hero); this is not a model defect and was not changed.
