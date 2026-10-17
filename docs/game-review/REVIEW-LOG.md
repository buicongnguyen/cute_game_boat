# Cute Game Boat review and decision log

Record evidence and decisions here so work can be resumed without repeating settled discussions. Link each finding to [EXPERIENCE.md](EXPERIENCE.md) and each action to [BACKLOG.md](BACKLOG.md).

## Review record for 2026 October 17

Build: 6c4477fdc795995fa5d7af6a58f83845591693af. Method: repository reconnaissance and planning review. No current gameplay playthrough, automated suite, performance benchmark, or physical-device test was performed for this record.

Source findings:

- Current welcomeCards returns six cards; earlier source comments describe three. The six-card sequence is a candidate for information-load review, not a confirmed onboarding defect.
- Boat station definitions and the latest boat change record place trade and equipment services inside the cabin. README still contains outdoor Outfitters instructions.
- Shared rules, main orchestration, and server authority all contribute to player behavior. Inspecting catalogs alone cannot establish the current experience.
- Browser acceptance files include opt-in URL settings. A default test invocation or existing CI success cannot establish that these browser scenarios ran.
- Earlier scripted timings and test counts belong to their original builds and do not establish the current baseline.

References: [welcome cards](../../src/welcome-cards.ts), [house activities](../../src/house-activities.ts), [boat change record](../boat-fork.md), [README](../../README.md), [browser acceptance example](../../tests/boat-cabin-browser.test.mjs), [Pages checks](../../tests/boat-pages.test.mjs), [CI workflow](../../.github/workflows/pages.yml).

Result: the document structure and review sequence are prepared. Full source coverage and experience acceptance remain open.

Document QA checked source claims, relative file links, status consistency, and review dependencies. The first-improvement gate uses evidence for the affected journey; it does not wait for every broader review. Source and analyst review completion is separate from fresh-player validation.

## Decisions and working assumptions

| ID | Date | Decision or assumption | Basis and revisit condition |
| --- | --- | --- | --- |
| D-01 | 2026-10-17 | Established direction: prioritize user experience, story, pacing, broader player access, and careful progress tracking. | User instruction. Changes to product direction require an explicit new decision. |
| D-02 | 2026-10-17 | Established direction: limit repeated asset and screen adjustment. | User instruction. Functional visual problems remain eligible priorities. |
| D-03 | 2026-10-17 | Working method: trace a complete core journey early and continue full-code review incrementally. | Logic review of the plan. Revisit if a missing subsystem prevents reliable tracing. |
| D-04 | 2026-10-17 | Working interpretation: AAA grade means consistent experience quality within an achievable scope. | User aspiration translated into criteria in README.md; content scale and production budget remain undecided. |
| D-05 | 2026-10-17 | Provisional limits: two active items, one implementation item, a 60-minute initial visual investigation, two alternatives, and at most 10 percent preference polish while core blockers remain. | Initial operating defaults. Review after the first improvement batch; these numbers were not supplied by the user. |
| D-06 | 2026-10-17 | Working scope: twelve journeys define the initial experience coverage denominator. | Review structure. Record splits, additions, or removals here. |
| D-07 | 2026-10-17 | Open product decisions: primary audience, intended story, session lengths, difficulty philosophy, and minimum devices. | Resolve only the decisions needed for the selected batch; avoid holding up independent source review. |

## Next baseline session

Use an isolated test profile or origin and record the exact build and edition. Preserve real player saves. Start with the normal title and welcome flow; do not preload gear, teleport, or alter progression during natural-input observation.

Observe J-01 and J-02 for the first 20 minutes. If the player stops or the route is incomplete, record where and why. Continue a separate session when needed. The observer gives no navigation hints until a stall has been recorded; log every hint and distinguish assisted completion.

Capture:

- What the player believes their role and immediate goal are.
- First meaningful action and reward, first voluntary choice, and first fight.
- Reading, waiting, movement, menus, repetition, interruptions, and reward claims.
- Discovering the hatch, Exchange, Magic Mirror, equipment, and return route.
- Whether the player understands why progress matters and what to do next.
- A natural stopping point and what the player expects on return.

A fresh participant is needed for novice-comprehension claims. An author or experienced tester can establish mechanics and a baseline route, but prior knowledge affects discovery.

## Playtest record template

- Date and build or commit:
- Scenario and linked journey or issue:
- Edition, language, difficulty, save state:
- Device, viewport, input method, and relevant performance settings:
- Participant context: game familiarity and prior knowledge of this game; collect only relevant details:
- Method: natural, assisted, or automated; assistance and developer hooks used:
- Expected outcome and preselected acceptance criterion:
- Timeline: action, elapsed time, active time, interruption, consequence:
- Observations: successful choices, wrong turns, stalls, errors, recovery, and stopping reason:
- Player explanation of role, goal, consequence, and next action:
- Check result: Pass, Fail, Unrun, or Not applicable with reason:
- Evidence location and linked register entries:
- Next action and unresolved question:

Separate observed behavior from the player's stated preference and the reviewer's explanation. A tiny qualitative sample can reveal recurring problems; it cannot establish broad-market preference. Report counts and participant contexts. Use fresh participants for onboarding after revisions; repeat testers are useful for regression and later-game comparisons.

## Verification records

Record the exact command or scenario, build, date, environment, and passed, failed, and skipped counts. Distinguish test-source inspection from execution, assisted browser checks from natural play, phone emulation from physical devices, and development from production builds.

Use existing npm test and build commands for relevant implementation changes. Enable required browser-test settings explicitly. Run focused regressions for the changed systems and a production smoke check before publication. Documentation-only edits need link, consistency, and scope checks.

Do not turn a skipped or unavailable scenario into a pass. When tests exercise a rule but not discoverability, preserve that limit next to the conclusion.

## Iteration result template

- Experience goal and fixed scope of selected issue IDs:
- Starting build, baseline evidence, and target player situation:
- Changes and implementation build:
- Acceptance results and regression evidence:
- Source coverage completed:
- Scope added or removed, with reasons:
- Effort spent, including visual work:
- What improved, what remains uncertain, and open severe issues:
- Updated experience description and register links:
- Next selected work and decision:

Close the batch when its outcome is accepted or deliberately stopped with reasons. Carry an unresolved player problem forward under the same ID rather than silently replacing it with a new idea.

## Documentation checkpoint for 2026 October 17

Baseline remains 6c4477fdc795995fa5d7af6a58f83845591693af. Written deliverables now include the current game overview, home and player systems, character/combat, worlds/modes/online, resolved catalog, current story progression and an original Homeward Book story proposal. The proposal has four chapters, conditional character acknowledgements, an opening playable arc, and a proposed main ending. New lore, scenes, alternate routes, ending triggers and postgame tracks remain unimplemented.

GR-001 inventory is complete: 1,326 tracked baseline files. Source review remains partial, with the exact per-file state in SOURCE-COVERAGE.json. GR-002 source description is drafted; its natural-input baseline is unrun. GR-004 is ready for document and creative review.

Executed evidence: Node 26.7.0 imported the first-party content, farm and model modules to extract resolved definitions: 27 crops, 325 items, 111 recipes including shop entries, nine planets, 20 fish-catalog entries including junk, and 17 disguises. The snapshot and derived tables are included. These counts are catalog sizes, not proof of player reachability.

An isolated in-memory probe confirmed six welcome cards, an eligible twenty-second planting, first hand harvest granting Pepper and 10,000 energy, active harvest credit, default retained inventory on defeat, explicit drop mode creating a bag, Normal's early cooking step becoming Harvest ten crops, and a harpoon not being selected as a fishing rod. It used newly constructed temporary states and did not read or change real player saves. [Probe output](documentation-probes.json) records the observations. This is mechanical evidence, not a browser or novice-comprehension playtest.

Document review cross-checked current-versus-proposed boundaries, station and defeat variants, links, table structure, file inventory coverage, source references and progress accounting. Final save verification checks the exact copied documents. No full test suite, build, natural-input walkthrough, two-player session, physical-device benchmark, or gameplay deployment is claimed for this documentation checkpoint.

Open product choices remain the primary audience, minimum devices, intended session ranges, and acceptance of the new story direction. Independent source and mechanical review can continue while those choices are discussed.

## Designer book implementation for 2026 October 17

Linked work: [BOOK-001](BACKLOG.md#book-001-chapter-one-designer-book). Source baseline: 6c4477fdc795995fa5d7af6a58f83845591693af. Scope: a chapter-one reading and review artifact, with current opening rules and the proposed A place to begin chapter kept distinct. No gameplay, save, balance or story-scene implementation is included.

The implementation brings together chapter navigation, searchable references, item and service pictures, detail views, source links, and six diagrams. The four upgrade/acquisition diagrams explain bed speed, permanent wishes, separate rod purchases, and forging versus gear-bench levels. The other diagrams show crop level gates and a shop purchase with materials. Advanced upgrades are reference context, not prescribed chapter-one spending.

Rebuild command from the repository root: `node docs/game-review/design-book/build.mjs`. Output: [design-book.html](design-book.html). The builder and its source data live under design-book.

Executed source and data evidence: a read-only Node check completed 294 assertions against the maintained rule exports and graph data. All four graph node sets and edge endpoints were consistent; the referenced source paths existed. Numeric checks covered bed levels 0–5 and difficulty costs, four independent wish counters and prices, three separately acquired rods and their material prices, every forge step to +15, and every Straw hat bench step to +10. Source inspection also confirmed paid forge failure without downgrade or weapon consumption, the forge multiplier on derived attack, and online gear-bench proximity rules. No false sword or rod evolution edge was introduced.

Generated-file static checks passed after the rebuild command above. The output was 430,237 bytes, with 63 unique template IDs, 43 client DOM targets and 22 local/internal links checked. The six diagrams contained 37 nodes and 27 edges; chapter content contained nine milestones and nine proposed scenes, and the canonical STORY.md hash matched. The book contained 28 asset entries. Image validation checked 32 unique embedded image structures: 22 WebP and 10 PNG, including PNG decompression and WebP container lengths. JavaScript syntax passed. Static inspection found zero runtime network dependencies. A loopback HTTP smoke check served the generated HTML with status 200 and matching bytes, then stopped its server. These checks do not establish browser behavior or a captured network trace. The 294 source-rule assertions now run on every rebuild.

Picture-content evidence: the contact sheet of 13 rendered model previews was visually inspected by the root reviewer and imagery reviewer. The previews were readable and fitted within their frames. This checks the pictured subjects and framing in the contact sheet; it does not verify page layout at browser widths.

Browser verification: Unrun. The required CUA in-app and Chrome browser surfaces were unavailable. Navigation, search/filter interactions, detail-dialog focus and Escape handling, picture sizing in the page, responsive layout, printing, local file opening and an offline browser run still need browser evidence. Static source inspection cannot establish those results.

Reader and player acceptance: Unrun. Owner review of chapter clarity and proposed story remains open; natural-input gameplay, novice understanding, pacing, physical devices and online sessions were not tested in this book batch. BOOK-001 completion records artifact implementation only and does not change the existing journey or release-acceptance denominators.

## Complete main story writing for 2026 October 17

Linked work: [BOOK-002](BACKLOG.md#book-002-complete-main-story-writing). Source baseline: 6c4477fdc795995fa5d7af6a58f83845591693af. Scope: complete the proposed four-chapter main story and expand its local HTML reading artifact. [STORY.md](STORY.md) now contains the full later-chapter narratives, playable scenes, pacing/choice notes and review questions. The four main chapters cover all 29 main-catalog milestones: 1–9, 10–15, 16–21 and 22–29.

Reading links: [Room for someone else](design-book.html#chapter-2), [Bring the world home](design-book.html#chapter-3), and [A home with an open door](design-book.html#chapter-4). The proposed Homeward evening retains Pepper's ownership branch, Sprout/Clover home-arrival branches, the keeper's journal fallback, and voluntary stay/read/choose actions. Its ending and optional tracks remain unimplemented.

Source review compared chapters two through four with the current 29 milestone definitions, active-event versus live-condition rules, explicit reward claims, optional companion rescue/arrival, cooking substitution, travel gates, ordinary mining and decoration/gear catch-up. The reviewed prose preserves Normal/Hard's locked-kitchen harvesting variant, prior live-state recognition without lifetime event backfill, visited versus space-discovered worlds, non-unique boss event counts and independent friend state. Source reading and read-only catalog inspection are the evidence here; no gameplay route or full test suite was executed for this writing batch.

The current tracker still advances beyond step 29 into twenty Chapter-5 goals and then an endless cycle. These are current continuation systems, not an unwritten fifth main chapter of the proposed story. A main-story completion flag, replayable/deferred evening and optional-track chooser require an approved migration preserving existing progress, possessions, friends, visits and rewards. This documentation has not performed that migration.

Expanded-build static verification passed. `node docs/game-review/design-book/build.mjs` produces a 590,420-byte self-contained HTML with four chapters, 29 milestones and 29 proposed scene rows (9/6/6/8), 38 asset references, nine world entries, and six diagrams with 37 nodes and 27 edges. All milestone titles, targets, events, conditions and chapter indices match the catalog and live source; the build now stops if those definitions diverge. Canonical narrative paragraphs and STORY hash match the manuscript. Checks resolved 66 unique template IDs, 46 literal client targets, 23 template links and all chapter asset references. All 42 unique embedded image structures passed PNG decompression or WebP container checks (10 PNG, 32 WebP). The existing 294 upgrade-rule assertions and JavaScript syntax checks pass. The 15 maintained chapter questions remain evidence requests. A loopback HTTP smoke check returned 200 with matching HTML bytes and closed its server. A separate link audit passed all 137 local links across the four updated review documents and generator README. Static source inspection found no runtime network dependency; no browser execution or network capture is claimed. A stale intermediate HTML was detected by the STORY hash check and rebuilt; the final check passed. BOOK-001 counts remain historical evidence for its earlier artifact.

Browser verification: Unrun. The CUA inventory again returned no browser surfaces, and an in-app browser creation attempt was unavailable; this expansion makes no browser result claim. Check chapter navigation and deep links, search/filter behavior, detail access and focus, image sizing, responsive views, printing, local file opening and offline operation when browser access is available.

Reader and player acceptance: Unrun. Four-chapter artifact writing is complete; creative approval, chapter clarity, emotional payoff, natural-input completion, pacing, supported devices and participant response remain open. BOOK-002 does not close GR-002, GR-004 or an experience issue, and it changes no gameplay journey or release-acceptance denominator.

## Concise engineering map for 2026 October 17

Added ENGINEERING-MAP.md and a matching first section in the HTML book. The directory tree separates systems, current chapter exit conditions, proposed attention focuses, checkpoint contracts and issue verification. This changes documentation only. Static rebuild, JavaScript parsing, exact tree inclusion and the existing 294 rule assertions passed; browser/print and player acceptance remain Unrun because CUA has no browser surface. Corrected the chapter-one reading link to #story and the stale README static-check status.

## Concise document correction for 2026 October 17

User requested a short structured reference rather than a narrative book. DESIGN-BRIEF.md is now the maintained 335-word summary in five numbered sections: purpose, systems, checkpoints, checkpoint contract and priorities. design-book.html renders that same concise source as static HTML. The prior illustrated story and asset reference is retained separately as design-reference.html, rebuilt through build-reference.mjs. Current rules and proposed attention goals remain separate. Static checks passed the word budget, section/table structure, escaped Markdown output, unique section IDs, all seven brief links and absence of scripts or external runtime assets. The detailed reference rebuilt with its existing 294 rule assertions. Browser and print layout remain Unrun. No gameplay or saves changed.


## Reference logic port for 2026 October 17

Source: cute_game commit e78e83914c3b1df4e88e39bf7cf99f0f36be53cc. Target baseline: 6c4477fdc795995fa5d7af6a58f83845591693af. Ported the compact welcome/HUD, bounded guidance, gentler movement and friend proportions. Boat cabin help, indoor station routing, deck/hatch and fishing behavior are retained. Guide persistence uses boat-specific keys; explicit help restarts its timer; Start fresh returns to automatic guidance. Short-landscape HUD placement is adapted for nested energy.

Validation: 2,193 automated tests passed, zero failed; 77 skipped. Production TypeScript/Vite build and offline-cache generation passed. Browser smoke at 1280 × 720 verified the compact welcome/HUD, optional six-card cabin guide and Exchange box route into its cabin station. The full optional browser suite, physical-device coverage, pacing and player acceptance remain unrun. Earlier documentation observations describe baseline 6c4477f and remain historical.


## Place reminder port for 2026 October 17

Source: cute_game commit 2e027b33cd42a9d6904f41a4aa8f88e571719c56, applied over the local e78e839 port. Recurring fishing help, locked kitchens, shared Colossus settings and regrowing crystals now use one nonblocking reminder with a ten-second per-place cooldown. First fishing help remains a compact introduction. History uses the boat namespace and existing profile-slot scope, survives reload/reset and is not a separate online-account history.

Boat adaptations: fishing points to the cabin Magic Mirror; the actual shared Colossus settings route uses the reminder while offline lid controls remain available. The Trophy wall retains its missing-friends board even without trophies. Existing cabin station routing is preserved.

Validation: 2,208 tests passed, zero failed; 77 skipped. TypeScript/Vite production build and offline-cache generation passed. Browser smoke at 1280 × 720 verified the first fishing introduction, repeated nonmodal reminders and unobstructed HUD placement. Optional browser suites, physical devices, authenticated multiplayer and player acceptance remain unrun.

## Ears and everyday disguises for 2026 October 17

Baseline: ba81fc7877eb77871c22d242f8d080828011cf51. New adventures start with owned, free cat ears; bear and fox ears are separate options from hoods. Added swimmer, K-pop singer, yoga teacher and nurse disguises, each with a model, portrait, four established skill effects and Vietnamese text. Old appearance parsing, disguise prices, radar maxima and recipe indices are preserved. The original compressed model streams and definitions remain intact; the appended art regenerates identically.

Validation: 2,233 tests passed, zero failed; 77 skipped, with eight test processes. All 1,170 previous look combinations retain their saved styles; 1,950 combinations now exist. Pages production build passed. Desktop browser checks verified starter cat ears, owned status, both new ear previews, all four catalog offers and costume try-on switching. Purchase/equip/save, skill behavior, model fit and image contracts have automated coverage. Physical devices, a complete natural-input costume purchase journey, authenticated multiplayer and player acceptance remain unrun.

The first broad run exposed two outdated catalog assertions, which were corrected while retaining the original price/translation protections. A later timing check under concurrent browser load exceeded its existing budget; it passed in isolation (0.686 ms load-adjusted) and in the final full run. No timing budget or AI behavior was changed.
