# Cute Game Boat current experience and intended outcomes

Cute Game Boat is a browser adventure about tending a home, developing an explorer and companions, and travelling between themed worlds. Farming, fishing, combat, crafting, and optional modes share progression and rewards. The current opening calls the player the new keeper of Clover Village.

Baseline: repository commit 6c4477fdc795995fa5d7af6a58f83845591693af, 2026-10-17. This describes the checked-out implementation. Live deployment parity and natural player experience have not been verified in this review.

## Reading guide

| Document | What it answers |
| --- | --- |
| [Story and chapter design](STORY.md) | What narrative and milestones exist, and what coherent story is proposed. |
| [Home and player systems](SYSTEMS-HOME.md) | How starting, stations, production, helpers, storage, food, fishing, settings, and recovery work. |
| [Character and combat](SYSTEMS-COMBAT.md) | How power, equipment, skills, movement, companions, enemies, and combat feedback work. |
| [Worlds modes and online play](SYSTEMS-WORLDS-ONLINE.md) | Where players go, hazards and travel, optional activities, multiplayer, and persistence. |
| [Resolved catalog](CATALOG.md) | Exact base crop, fish, item, recipe, and shop data at this commit. |
| [Review coverage](COVERAGE.md) | Which files and behaviors have been inspected and which remain open. |
| [Improvement register](BACKLOG.md) | What we investigate or change next and what acceptance requires. |
| [Review log](REVIEW-LOG.md) | Evidence, decisions, execution results, and remaining uncertainties. |

## Evidence labels

Code means executable behavior inspected at the recorded commit. Test source means an assertion was read, without implying execution. Run means a named automated or assisted check executed on a named build. Player means natural-input observation, with participant familiarity and assistance disclosed. Hypothesis means a possible problem awaiting evidence. Proposal means a desired change or new creative content.

The story proposal and proposed experience goals are not implemented behavior. A retained action or catalog entry can exist without a normal current UI route. Keep source coverage, mechanical checks, and player acceptance separate.

## What the game asks the player to care about

The implemented systems support a home-and-adventure rhythm. The deck and cabin provide production, preparation, companions, personal appearance, storage, and recovery. Nearby regions and other planets provide danger, discoveries, resources, and bosses. Returning converts adventure rewards into improvements and further goals.

The journal supplies structure: 29 main milestones in four chapter indices, followed by fixed later goals and an endless activity cycle. Characters already have rescue reasons, work roles, chats, gifts, and home hangouts. These provide story material, but the current milestone sequence alone does not establish whether players experience a complete dramatic arc.

The proposed creative direction in STORY.md gives the existing home, friends, and journeys a shared purpose. Its named scenes and lore are design material for review. Implementing them would require a selected work item and player-facing acceptance.

## The current progression loop

| Part of play | Player action | Mechanical result | Experience question |
| --- | --- | --- | --- |
| Care for home | Plant, harvest, raise animals, assign helpers. | Items, XP, products, and production capacity. | Is this satisfying agency, understandable automation, or repeated maintenance? |
| Prepare | Sell, cook, equip, wish, craft, upgrade, and rest. | Energy, buffs, stronger equipment and stats. | Can players tell which preparation will help their next goal? |
| Venture out | Fight, fish, gather, discover, and travel. | XP, materials, catches, companions, places, and milestone credit. | Is exploration driven by curiosity and purpose as well as rewards? |
| Return | Store items, meet friends, claim progress, and choose a next step. | Persistent gains, unlocks, recovery, and more available goals. | Is there an acknowledged payoff and a comfortable stopping point? |
| Continue by choice | Attempt bosses, activities, collections, and mastery. | Additional rewards, completion records, and challenge. | Are these meaningful options rather than competing obligations? |

Energy is a currency, not a measure of real-world energy or player stamina. Flight fuel and mode resources have separate rules. A change to starter energy, automatic production, or optional-mode rewards can affect several parts of this loop.

## The opening as currently implemented

1. The title offers a player identity, language, profile, and relevant play options. Opening art loads before world construction, with fallback and retry paths for failures.
2. A fresh save starts at level one with nine empty plots. Easy is the default. First-run state controls introductory help; older saves can keep fuller controls and different tutorial behavior.
3. Six skippable cards explain keeper identity, the broad game promise, cabin trading, indoor stations, garden and friends, and planting.
4. The first three eligible level-one plantings use twenty-second timers while the first story step is active. The first successful hand harvest can grant Pepper and 10,000 energy.
5. The active story asks for three harvests. The player must Collect the completed step to advance to earning twenty energy from sales.
6. Selling is now at the cabin Exchange box. Equipment and supplies are at the bedroom Magic Mirror. Story definitions still contain market and crystal-upgrade terminology, which needs displayed-copy review.
7. Buying or crafting, equipping a weapon, and defeating five creatures introduce character growth and combat. Guide routes, moment tips, easier tutorial creatures, and calmer early HUD behavior already exist.
8. The chapter then asks for a permanent stat upgrade, two fish, ten skill uses, and level five. It ends with supplies for the next phase.
9. Continuing goals introduce more fighting, an added bed, meals or a difficulty-dependent substitute, a boss, more fish, travel, gathering, decoration, disguises, and broader exploration.

This is a code-derived sequence, not a measured twenty-minute player session. Actions performed before an event-based milestone is active may not count toward that future milestone. Ownership and condition goals have their own catch-up behavior. That can matter for a self-directed player who leaves the suggested order.

Sources: [welcomeCards](../../src/welcome-cards.ts), [first-run rules](../../src/first-run.ts), [actions](../../src/actions.ts), [milestones](../../src/content.ts), [progression](../../src/progression.ts), [catch-up](../../src/story-catchup.ts), [guide routes](../../src/guide-ui.ts).

## What changes through the adventure

The base planet gates form a rough exploration ladder: home level one, Toybox four, Candy six, Jungle eight, Frost ten, Ocean twelve, Volcano fourteen, Cloud sixteen, and Night twenty. Discovery in space and actually visiting a planet are distinct states. Story asks for the first other planet later in its sequence, so world availability and narrative availability can differ.

Early play teaches actions. Developing play adds meaningful preparation, production choices, companions, and environmental hazards. Later play adds larger encounters, modes, collections, and repeated goals. Optional content can be accessible before the main milestone sequence explicitly introduces it.

The review should locate moments when the number of available systems expands faster than player understanding. It should also find stretches where numeric requirements grow without a new decision, character response, or interesting challenge. Those are hypotheses to measure, not conclusions based only on milestone counts.

## Twelve player journeys

All twelve now have source-based descriptions across the linked chapters. Their full path-and-variant acceptance remains open, and natural-input observation is Unrun. A described journey is not counted as fully traced until important failure, persistence, and edition paths have also been checked.

| ID | Current journey and important variants | Documentation | Review state |
| --- | --- | --- | --- |
| J-01 | Start, read or skip, plant, harvest, and receive the opening grant. Compare fresh and migrated saves, bag refusal, and reloading a timer. | SYSTEMS-HOME; STORY | Code documented; route validation pending |
| J-02 | Find Exchange, acquire gear at Magic Mirror, equip, fight, and Collect progress. Compare autonomous exploration, active-step credit, control layouts, and air versus classic combat. | SYSTEMS-HOME; SYSTEMS-COMBAT; STORY | Code documented; route validation pending |
| J-03 | Stop, reload, return later, review production and chest deliveries, and resume the next goal. Compare worker ownership, pauses, rests, storage, and save guards. | SYSTEMS-HOME; SYSTEMS-WORLDS-ONLINE | Code documented; route validation pending |
| J-04 | Expand and arrange the home, run livestock, cook and craft, and use helpers. Compare difficulty gates, long absence, feed value, full storage, and manual choices. | SYSTEMS-HOME; CATALOG | Code documented; route validation pending |
| J-05 | Own a rod, approach water, cast, read a bite, reel, land or lose a fish, and use collection records. Compare rod selection, tension, mystery catches, and retained hunting rules. | SYSTEMS-HOME; CATALOG | Code documented; normal hunting reachability unresolved |
| J-06 | Prepare for a destination, launch, discover, land, face a hazard, gather, and return. Compare landing gates, low fuel, environmental equipment, and repeat visits. | SYSTEMS-WORLDS-ONLINE | Code documented; route validation pending |
| J-07 | Lose health, be defeated, understand the consequence, and recover. Compare default retained bag, explicit drop mode, expired bags, inventory capacity, and mode-specific defeat. | SYSTEMS-HOME; SYSTEMS-COMBAT; SYSTEMS-WORLDS-ONLINE | Code documented; route validation pending |
| J-08 | Find Wren, enter the Vault, form a party, clear rooms, claim rewards, and leave. Compare solo neighbours, online host changes, loss, and daily limits. | SYSTEMS-WORLDS-ONLINE | Code documented; mode validation pending |
| J-09 | Find Orrin, select Flag Rush, understand capture and return, complete or abandon a match. Compare team sizes, AI, paid limits, and reward claims. | SYSTEMS-WORLDS-ONLINE | Code documented; mode validation pending |
| J-10 | Enter Rescue Call, choose a mission and squad, build between waves, win or lose, and recover. Compare reward limits, leaving, and reloading. | SYSTEMS-WORLDS-ONLINE | Code documented; mode validation pending |
| J-11 | Understand Colossus sleep and activation, participate, recover, and choose continuing goals. Compare solo soothe rules, online scaling, loot credit, and personal time. | SYSTEMS-WORLDS-ONLINE; STORY | Code documented; encounter and continuing-play validation pending |
| J-12 | Sign in, join or visit, cooperate, disconnect, reconnect, and sign out. Compare account and offline saves, private gardens, shared combat, receipts, and host authority. | SYSTEMS-WORLDS-ONLINE | Code documented; integration validation pending |

## Player situations and intended outcomes

The primary audience and minimum devices are still open decisions. These review situations make broad appeal concrete while keeping one core game.

| Player situation | Intended outcome to test | Existing support and remaining question |
| --- | --- | --- |
| New or infrequent player | Understand a useful next action and recover from mistakes. | Guides, skippable cards, tutorial crops and creatures, Easy default, and default retained inventory exist. Test how well they teach. |
| Experienced player | Make meaningful build, timing, and exploration choices. | Weapons, skills, disguises, upgrades, bosses, and Hard exist. Test decision quality and readability. |
| Short-session or returning player | Resume comfortably and make progress without feeling late. | Wall-clock production, catch-up, helpers, and return information exist. Evaluate capped production, worker rests, livestock lifespan, and task pressure. |
| Touch player | Move and act without unintended input or hidden targets. | Joystick, side and size settings, and touch layouts exist. Test real gestures and devices. |
| Keyboard player or reduced-dexterity player | Use consistent bindings and suitable action timing. | Presets, custom keys and fishing toggle input exist. Measure held inputs, timing windows, and overload before selecting assistance changes. |
| Player needing clearer visuals or language | Read goals and recognize consequences without relying on a single cue. | English and Vietnamese, sound and vibration settings, and graphic choices exist. Text sizing, contrast, motion and cue redundancy need actual acceptance checks. |

A difficulty mode changes challenge and economy; it does not establish accessibility. Proposed story scenes should be concise, skippable, replayable from a journal summary, and understandable in both supported languages. These are implementation requirements for selected future story work.

## Pacing record and proposed review method

The source provides timers and unlock rules; it cannot provide a measured session duration. No session timing is claimed here.

For the opening and first return, log wall-clock time separately from active input. Mark card reading, walking, finding stations, waiting for crops, menu decisions, repeated actions, combat, rewards, and interruptions. Ask what the player expected at each transition.

Measure the first meaningful action, first understood reward, first voluntary purchase, first fight, first useful unlock, and first chosen stopping point. Record wrong turns and hints rather than silently helping. Faster is not always the desired outcome; production and home interaction can give rest after a demanding trip.

Compare three useful cases: following guidance, skipping and exploring, and returning after interruption. Review starter energy and automation alongside prices, level gates, and story credit. Set targets after this baseline instead of inventing a universal ideal session length.

The story proposal supplies narrative beats around existing actions. It should add motivation and acknowledgement without creating a mandatory dialog after every crop or a new asset requirement for each chapter.

## Save and edition distinctions that affect experience

Pages is a solo build. A server edition adds accounts, shared wilds, visits, parties, friends, and chat. Online outcomes use server-approved action and combat rules, while some visual and encounter simulation remains browser-hosted. The online implementation is cooperative and has explicit authority limits.

Default solo air combat and online classic combat can produce different skill and input experiences. Worker delivery, reward claims, counters, mode state, and personal versus shared drops also require edition-specific documentation.

Offline profiles and online adventures remain separate. Corrupt, newer-format, and stale-tab save guards protect local progress. Online receipts and revisions support retrying actions. A review cannot claim reliable recovery from these mechanisms alone; integration and interruption scenarios still need execution.

## Current communication and pacing questions

| Register ID | Source-grounded context | Outcome that needs evidence |
| --- | --- | --- |
| UX-001 | Six-card opening, indoor stations, multiple systems, and automatic guidance. | Fresh players can act and find services without excessive reading or hints. |
| UX-002 | Current station names differ from older story and README wording. | Labels, instructions, and routes lead to the same place in both languages. |
| PACE-001 | First hand harvest can grant 10,000 energy while early sale goals and prices are small. | Early purchases and progression still offer understandable choices. |
| STORY-001 | Keeper identity, rescues, home conversations, and sequential tasks already exist. | Players understand a personal reason to continue and recognize consequences. |
| UX-003 | Shared fishHunt rules and Guardian catalog entries remain, while normal current controls use rods. | Available activities and completion goals are discoverable and achievable. |
| UX-004 | Skill-description and upgrade copy can disagree with active combat branches. | Players receive accurate instructions for their actual edition and settings. |
| PACE-002 | Livestock age over two real hours; helpers have rests, capped catch-up, and delivery rules. | Absence and automation fit the intended welcoming return experience. |

These are review questions. A source mismatch can be confirmed while its player impact remains unmeasured. The register records both levels of evidence.

## Quality gate before the first gameplay change

Select one concrete player outcome using enough evidence from its journey. Link the current behavior and proposed change, affected save and edition variants, an effort limit, and an observable acceptance criterion. Relevant mechanical fixes can proceed while fresh-player validation remains open.

For story implementation, start with the opening playable arc in STORY.md. Compare motivation, comprehension, and interruptions with the baseline. Reuse existing locations and interactions; add visuals only when a named acceptance problem requires them.

For visual work, retain the effort and alternative limits in README.md. For the whole review, track [source coverage](COVERAGE.md), completed behavior tracing, executed checks, and player acceptance as separate measures.
