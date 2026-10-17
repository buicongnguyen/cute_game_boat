# Cute Game Boat experience review and improvement plan

The purpose of this work is to understand the current game, identify the largest problems in the player experience, and improve them in small, verifiable steps. Story, pacing, understandable systems, accessibility, and dependable play guide the work. Asset and screen changes receive a bounded budget tied to a player outcome.

Baseline: commit 6c4477fdc795995fa5d7af6a58f83845591693af, recorded 2026-10-17 in Asia/Seoul. This is the documentation starting point. Future reviews record the build they actually use.

## Direction established by the user

- Build a structured description of the game so changes account for connected systems.
- Track fixes and their acceptance carefully.
- Prioritize user experience, story, pacing, and suitability for a wider range of players.
- Prevent repeated asset and screen adjustments from consuming the work.
- Pursue AAA grade quality through a coherent and carefully finished experience.

The Homeward Book story is now drafted for creative review. Acceptance of its plot, the primary audience, session lengths, device support floor, and balance targets remain design decisions. The working assumption is to improve the existing browser adventure and preserve its farming, exploration, companions, and combat while testing how well they fit together.

## Logic review of the earlier plan

| Risk in the earlier plan | Revised approach |
| --- | --- |
| Reading everything could postpone useful findings indefinitely. | Trace one complete player journey first; continue the full file review alongside it. |
| A long system catalog could hide weak motivation or an unclear next action. | Organize the specification around player goals and decisions, with technical rules in supporting sections. |
| Better assets could become the default solution to every concern. | State the player problem and acceptance criterion before opening visual work. |
| Broad appeal could create conflicting requirements and many new modes. | Test specific player situations and decide which audience is primary before expanding scope. |
| AAA grade could become an unlimited production target. | Judge coherence, control, pacing, narrative, accessibility, reliability, and performance with explicit evidence. |
| A tracker could make implementation look like successful improvement. | Separate work status from acceptance results; require the changed player journey to be checked. |

Full code coverage remains part of the review. It is a measure of review completeness; player evidence establishes experience quality.

## Working documents

| Document | Purpose |
| --- | --- |
| [Concise design brief](DESIGN-BRIEF.md) | Start here for the short numbered game design, chapter plan, and next review decision. |
| [Design brief reading view](design-book.html) | The same concise brief in a local HTML document. |
| [Concise engineering map](ENGINEERING-MAP.md) | Systems, major checkpoints, player attention and verification in a directory tree. |
| [Current experience and intended outcomes](EXPERIENCE.md) | Start here for the current game loop, player journeys, pacing, audience situations, and evidence boundaries. |
| [Story and chapter design](STORY.md) | Current cast and progression, plus all four written Homeward Book chapters, playable scenes, pacing choices and the proposed ending. |
| [Detailed four chapter reference](design-reference.html) | Illustrated local reading and review artifact covering all 29 main-catalog milestones and the proposed four-chapter story, with rule references and diagrams. |
| [Home and player systems](SYSTEMS-HOME.md) | Current stations, production, storage, helpers, fishing, comfort, and settings. |
| [Character and combat](SYSTEMS-COMBAT.md) | Formulas, controls, upgrades, skills, pets, creatures, and feedback. |
| [Worlds modes and online play](SYSTEMS-WORLDS-ONLINE.md) | Nine worlds, hazards, flight, activities, multiplayer, and persistence. |
| [Resolved catalog](CATALOG.md) | Base crop, fish, item, recipe, and shop tables, with a machine-readable snapshot. |
| [Review coverage](COVERAGE.md) | Fixed inventory denominator, file-review states, executed checks, and remaining work. |
| [Improvement register](BACKLOG.md) | Stable work IDs, priorities, dependencies, outcomes, acceptance evidence, and status. |
| [Review and decision log](REVIEW-LOG.md) | Build-specific observations, playtest records, decisions, scope changes, and iteration results. |

These documents are the working record for this review. Earlier plans remain historical inputs. Recheck an older issue before adding it to the active register. Update an existing entry instead of creating another list of the same work.

## Concise design brief

Read [DESIGN-BRIEF.md](DESIGN-BRIEF.md) or its [HTML reading view](design-book.html) for the short numbered document. The detailed story, current rules, assets, and diagrams remain available in the reference below.

Rebuild the concise reading view with `node docs/game-review/design-book/build.mjs`. Edit DESIGN-BRIEF.md to change its content.

## Detailed four chapter reference

Open [design-reference.html](design-reference.html) to review the full four-chapter Homeward Book proposal alongside current rules. All four main chapters are written, covering the 29 main-catalog milestones. The expanded [STORY.md](STORY.md) remains the maintained prose source. Each later chapter includes narrative scenes, a playable-beat table, pacing and choice notes, and review questions. Current behavior and proposed story copy remain labeled separately. The book does not implement the proposed scenes or change the game.

| Chapter | Main-catalog steps | Reading link |
| --- | --- | --- |
| 1 A place to begin | 1–9 | [Opening chapter](design-reference.html#story) |
| 2 Room for someone else | 10–15 | [Chapter two](design-reference.html#chapter-2) |
| 3 Bring the world home | 16–21 | [Chapter three](design-reference.html#chapter-3) |
| 4 A home with an open door | 22–29 | [Chapter four and Homeward evening](design-reference.html#chapter-4) |

Reference diagrams distinguish crop level gates, material purchases, crop-bed speed, permanent wishes, rod acquisition and strengthening owned equipment. Advanced caps and costs are reference material, not prescribed opening goals. Shop purchases, unlocks, guaranteed upgrades and chance-based forging use separate relationships. There is no implied Wood sword or rod evolution chain.

The current tracker continues after step 29 into twenty Chapter-5 goals and an endless cycle. These are current continuation systems, not an unwritten fifth main chapter of this proposal. Ending the main story with Homeward evening and moving later goals into optional tracks are proposed gameplay, save and UI changes requiring an approved migration.

The generated HTML embeds its reading data, styles, scripts and asset pictures for local opening. Expanded static checks passed; exact counts are recorded in REVIEW-LOG.md and the [reference build report](design-book/reference-build-report.json). Browser layout, interaction, printing and file-open verification remain Unrun. Reader comprehension, creative acceptance and player acceptance remain open independently of artifact writing.

From the repository root, rebuild with the project's supported Node version:

```powershell
node docs/game-review/design-book/build-reference.mjs
```

The output is [design-reference.html](design-reference.html). The [reference builder](design-book/build-reference.mjs) and [chapter selection and captions](design-book/book-config.json) live under design-book. Update the maintained source rules and [STORY.md](STORY.md), then rebuild; editing the generated HTML alone will be overwritten. [BOOK-001](BACKLOG.md#book-001-chapter-one-designer-book) preserves the first-chapter artifact history; [BOOK-002](BACKLOG.md#book-002-complete-main-story-writing) records completion of the four-chapter writing and pending acceptance.

## Sequence and completion gates

| Stage | Work | Completion evidence |
| --- | --- | --- |
| 1 Baseline | Inventory first-party files and trace fresh and returning play. Document the core loop and its interruptions. | Source links, current flow, natural-input observations, save and edition context. |
| 2 Diagnosis | Review story communication, waiting and repetition, economy, controls, accessibility, and recovery. | A short list of concrete player problems; hypotheses retain their label. |
| 3 First improvement | Select one experience outcome and a small set of related changes. Define acceptance before implementation. | Clear scope, evidence, dependencies, success conditions, and an effort budget. |
| 4 Verification | Replay the affected route and appropriate regressions on the changed build. | Passed, failed, and unrun results; comparison with the baseline; remaining issues. |
| 5 Expansion | Review the next journeys and complete remaining source coverage. | The existing core route still passes; new breadth has a player purpose. |

The stages overlap. Select an improvement as soon as the affected journey has enough evidence; complete the wider story, economy, access, and code reviews alongside it. Fresh-player validation can remain open while independent analysis and justified fixes proceed.

The first complete slice is start, plant, harvest, find selling, obtain and equip a weapon, fight, claim progress, save, stop, and return. Observe the first 20 minutes and continue separately if the route is unfinished. Twenty minutes is an observation window, not a completion requirement or a reason to accelerate every system.

A blocker discovered during review can be fixed before the full inventory is finished. Record the issue and rerun its acceptance route.

## Quality criteria

| Dimension | Questions that decide readiness |
| --- | --- |
| Identity and story | Can players explain their role, current goal, the people involved, and why the result matters? Does an action produce an acknowledged consequence? |
| Pacing and economy | Are waiting, repetition, novelty, challenge, and rewards balanced for the intended session? Does the next unlock offer a useful decision? |
| Controls and feedback | Can players perform intended actions consistently and understand success, damage, failure, and recovery? |
| Access and breadth | Can the agreed player profiles read, operate, understand, and resume the supported experience? Can optional challenge coexist with a welcoming core route? |
| Reliability | Does progress survive normal save, reload, travel, defeat, and supported reconnect scenarios? |
| Performance | Does the route meet an agreed device and loading budget without compromising control? |
| Cohesion | Do story, rules, interface, sound, and visuals communicate the same world and priorities? |

A passing average cannot hide a critical failure. Agree numeric budgets after measuring the current route and identifying representative devices. Emulated phone views are layout evidence; physical-device results are recorded separately.

## Limits on visual work

These are initial operating defaults and can be revised in the decision log.

1. Link every asset or screen adjustment to a register entry. Name the player outcome: visibility, navigation, comprehension, feedback, performance, accessibility, or a specific identity inconsistency.
2. Record the current example, affected device or view, acceptance criterion, and effort budget before editing.
3. Start with a 60-minute investigation and at most two alternatives. If the change is larger, stop and estimate a separate task before continuing.
4. Check the affected desktop and phone contexts once the criterion is met. Close the task when it passes.
5. Reopen for a failed criterion or new evidence. Record preference-only alternatives as Deferred with a revisit condition.
6. While core journey blockers remain, reserve at most 10 percent of planned iteration effort for preference-only polish. Visual changes that solve a measured experience problem belong to that experience task.

A visual problem that makes text unreadable or controls unusable is a functional priority. The budget is intended to stop open-ended aesthetic iteration.

## Progress snapshot

| Measure | Current documentation checkpoint |
| --- | --- |
| Major journeys with source-based descriptions | 12 of 12; detailed chapters written |
| Player journeys fully traced through all important variants | 0 of 12; final route validation pending |
| Player journeys observed through natural input | 0 of 12 |
| First-party file coverage | 1,326 baseline paths inventoried; source/server 161 Reviewed, 53 Partial, 246 Pending of 460 |
| Release acceptance | No release scope selected |
| Executed evidence | Resolved catalog and isolated in-memory facts checked; full suites and player acceptance Unrun |
| Current work | GR-001 inventory Done; GR-002 In progress; GR-004 Verify |
| Designer book | BOOK-002 artifact writing complete: four main chapters and all 29 main-catalog milestones; expanded-build static counts Pending; browser, reader and player acceptance Unrun |

The current behavior chapters and story draft are written. Source and route completion remain bounded by the coverage ledger. Update this snapshot from the register and log after each review batch. Keep each denominator and its scope explicit; record additions and removals. Raw files read, test totals, and issue closure totals do not measure game quality.

## Iteration discipline

Keep at most two work items active, with one implementation item at a time. Use a single experience goal for each improvement batch. At the end of a batch, record what changed, what players could do more successfully, what remains uncertain, and the next selected item.

Keep documentation updates short and attached to the work. Runtime changes update the relevant experience description and register entry together. Publication remains a separate action from local implementation and verification.
