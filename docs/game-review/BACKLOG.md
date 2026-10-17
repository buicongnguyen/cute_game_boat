# Cute Game Boat improvement register

This register tracks review work and player problems. An investigation item asks for evidence; it does not establish that a defect exists. Keep the current experience in [EXPERIENCE.md](EXPERIENCE.md) and the evidence and decisions in [REVIEW-LOG.md](REVIEW-LOG.md).

## Status and acceptance

Backlog means a recorded candidate. Selected means included in the current review batch. In progress means work has started. Verify means implementation or analysis is ready for its acceptance checks. Done requires those checks to pass with linked evidence. Deferred requires a reason and a revisit condition.

Reopen the same ID if acceptance fails. Record blocked dependencies on the item without silently changing its scope. Review tasks can be Done when their documentation is accepted; that does not close a gameplay problem they discover.

Priority order is progress loss and blockers, then controls and comprehension, then motivation and pacing, then continuing depth and optional challenge. A visual issue inherits the priority of the player problem it causes. Hypotheses retain their label even when investigation is urgent.

## Current review batch

The active outcome is to establish the current core journey and a coherent story direction. The complete baseline file inventory is recorded under GR-001. Current system chapters and all main milestones are documented. All four proposed main-story chapters are now written under BOOK-002, covering steps 1–29; reader and creative acceptance remain open. GR-002 remains In progress for natural-input baseline checks; GR-004 is in Verify for document and creative review. No gameplay implementation or release scope is selected.

| ID | Type | Priority | Work | Status | Dependency |
| --- | --- | --- | --- | --- | --- |
| GR-001 | Review | P1 | Establish complete file inventory and coverage ledger. | Done | Coverage ledger at the recorded baseline |
| GR-002 | Review | P1 | Document and observe the first complete player journey. | In progress | Source description drafted; natural-input checks remain |
| GR-003 | Review | P1 | Trace stopping, returning, defeat, and recovery. | Backlog | Isolated test saves |
| GR-004 | Review | P1 | Map story communication and chapter continuity. | Verify | Current milestones and story proposal written; creative review open |
| GR-005 | Review | P1 | Measure pacing and connected economy. | Backlog | GR-002 and GR-003 observations |
| GR-006 | Review | P1 | Evaluate access across specific player situations. | Backlog | GR-002 baseline |
| GR-007 | Decision | P1 | Select one experience outcome and its first improvement batch. | Backlog | Sufficient evidence for the affected journey; relevant parts of GR-002 through GR-006 |
| GR-008 | Review | P2 | Complete remaining journeys and first-party coverage. | Backlog | GR-001; proceeds incrementally |
| GR-009 | Documentation | P2 | Reconcile current instructions and historical plans. | Backlog | Verified facts for each correction |
| GR-010 | Polish | P3 | Collect preference-only asset and screen ideas. | Deferred | Revisit after core journey gates pass |
| BOOK-001 | Documentation | P2 | Deliver the chapter-one HTML designer book and its rebuild sources. | Done for artifact implementation | Browser verification and reader acceptance remain Unrun |
| BOOK-002 | Documentation | P2 | Complete all four main-story chapters and expand the designer-book reading scope. | Done for artifact writing | Expanded-build static checks passed; browser, reader and player acceptance Unrun |

P1 marks the next important work; P2 supports broader completeness; P3 is optional polish. P0 is reserved for a confirmed critical blocker or progress-loss problem. These priorities are provisional until baseline findings are available.

## Acceptance for the initial work

### GR-001 Complete review inventory

Owner: Codex during review. Outcome: every first-party file is accounted for, and scope cannot disappear behind a vague claim of reading everything.

Acceptance: a tracked-file ledger records path, domain, Pending or Partial or Reviewed status, responsibility or unresolved role, linked journey or supporting role, and scope exclusions. State the exact denominator and commit. Include tests, generators, configuration, documentation, and asset mappings. No file is marked Reviewed merely because it was listed.

Result: [COVERAGE.md](COVERAGE.md) and [SOURCE-COVERAGE.json](SOURCE-COVERAGE.json) enumerate all 1,326 baseline tracked files, with duplicate review records merged by path and remaining work explicit. Inventory completion does not mean every file has been read.

### GR-002 First complete player journey

Owner: Codex for source tracing and assisted checks; fresh-player observation requires a participant. Outcome: J-01 and J-02 describe what currently happens and show where comprehension or progression breaks.

Review completion: trace input, UI, rules, feedback, and persistence through planting, harvest, selling, equipment, combat, and reward claiming. Record a natural-input baseline on desktop and a phone layout with prior familiarity and assistance disclosed. Compare six-card onboarding, cabin stations, reward grants, and active story-step behavior. Do not require a player to finish within the observation window.

Player validation: fresh-player comprehension remains separately open under UX-001 until participant evidence is logged. GR-002 can complete its source and analyst baseline without claiming that new players understand the game. Missing participants do not stop independent review or justified mechanical fixes.

### GR-003 Return and recovery

Owner: Codex during review. Outcome: the consequences of stopping, absence, failure, and reload are understood.

Acceptance: document J-03 and J-07 with before and after state, resumption cues, costs and recoverable items. Review manual and automated production, offline time, relevant migrated-save behavior, and edition differences. Verify using isolated profiles; retain real player progress.

### GR-004 Story communication

Deliverable: [STORY.md](STORY.md) describes current characters, 29 main milestones, 20 later continuation goals, the endless cycle, and all four written Homeward Book chapters with narrative, playable scenes, pacing choices, review questions and ending dialogue. No proposed story scene or alternate route is implemented. Creative acceptance and player validation remain open.

Owner: Codex drafts; owner reviews creative direction. Outcome: know what story is present and which beats need development.

Acceptance: map all 29 milestones and four chapter indices to relevant dialogue, characters, locations, actions, consequences, and acknowledgements. Mark missing links as review findings or hypotheses. Outline one small playable arc with a beginning, complication, payoff, and continuing question, using existing systems where possible. Keep that outline marked Proposal until selected; completing the review does not approve a new plot.

### GR-005 Pacing and economy

Owner: Codex during review. Outcome: identify observed dead periods, repetition, overload, and reward or unlock problems.

Acceptance: record wall-clock and active time for the core and return routes, including delays and assistance. Trace starter grants, prices, crop and animal output, automation, combat rewards, spending, difficulty, and useful unlocks. Compare current and intended session needs. Select targets from the baseline; do not label slower play defective without context.

### GR-006 Player access

Owner: Codex for technical checks; participant coverage recorded separately. Outcome: identify which situations the current core route supports and where it excludes players.

Acceptance: use the player-situation matrix in EXPERIENCE.md. Record controls, readability, language, motion, input forgiveness, interruption recovery, and device evidence. Include representative keyboard and touch paths. Keep physical-device testing and player feedback marked Unrun until performed. Primary audience and minimum devices become explicit decisions before release acceptance.

### GR-007 First experience decision

Owner: owner for product direction; Codex supplies options and evidence. Outcome: a small, coherent improvement batch.

Acceptance: select one player problem and desired outcome using sufficient evidence from its affected journey. Complete only the relevant story, pacing, access, and recovery checks needed to judge that change; broader reviews continue in parallel. Name the primary player situation, changes, exclusions, dependencies, effort budget, and acceptance scenarios. Include a current baseline and a meaningful comparison. Resolve material story or scope choices together; routine reversible implementation can proceed within the selected direction.

### GR-008 Complete review breadth

Owner: Codex during review. Outcome: the whole first-party implementation is understood and major variants are covered.

Acceptance: finish the ledger established by GR-001 and all twelve journeys, with each nonapplicable edition scenario explained. Extract rules and catalog appendices. Record remaining unrun scenarios explicitly. Source coverage can complete before player validation; report those results separately.

### GR-009 Current instructions

Owner: Codex during review. Outcome: one clear route to current player and developer guidance.

Acceptance: correct verified current instructions, index historical plans as dated inputs, and link the maintained experience record. Revalidate older proposed fixes before bringing them into the register. Preserve useful history.

### GR-010 Deferred preferences

Owner: owner and Codex as ideas arise. Reason: preference-only polishing could consume the time needed for core experience work.

Acceptance when selected: each idea becomes a bounded issue with a visible outcome and the visual-work limit from README.md. Revisit after the selected core journey passes, or when new evidence establishes a functional problem.

### BOOK 001 Chapter one designer book

Owner: Codex. Status: Done for artifact implementation. Browser verification: Unrun. Designer and player acceptance: Unrun. This item records a documentation deliverable; it does not close GR-002, GR-004 or an experience question.

Outcome: the owner can review the first chapter in [design-book.html](design-book.html), relate pictures to the relevant rules, and inspect costs and prerequisites without treating separate catalog items as an evolution tree. The maintained story proposal and current behavior remain distinct.

Delivered scope: a local HTML reading artifact, embedded asset pictures, chapter navigation, search and filters, detail views, six relationship diagrams, exact upgrade step tables, source references, and rebuild sources under design-book. Rebuild from the repository root with `node docs/game-review/design-book/build.mjs`. Later chapters, game implementation, story approval and balance changes are outside this item.

Source and data acceptance: 294 read-only assertions passed against current rule exports and the four upgrade/acquisition graph specifications. They cover bed levels and difficulty prices, independent stat wishes, all three rods, every forge level through +15, every Straw hat bench level through +10, graph endpoints and referenced source paths. Forge failure loss, whole-attack scaling and online bench proximity were inspected in source. These checks did not execute the game suites or a playthrough.

Artifact static verification passed for generated-file structure, client DOM targets, local/internal links, embedded image structures, graph counts, canonical story matching and JavaScript syntax. A contact sheet of 13 rendered model previews was visually inspected for picture content and framing. The dated counts and limits are recorded in [REVIEW-LOG.md](REVIEW-LOG.md).

Remaining verification: browser opening, navigation, search/filter behavior, picture sizing in the page, detail dialogs, keyboard focus, print layout, responsive views and local file opening are Unrun. The required CUA browser surfaces were unavailable during this batch. Reader understanding and creative acceptance need owner or participant evidence and remain open. Artifact completion is not evidence that the chapter is enjoyable, accessible or correctly paced.

Reopen BOOK-001 for a book defect or source/build inconsistency. A gameplay problem discovered while reading receives or updates its relevant experience ID.

### BOOK 002 Complete main story writing

Owner: Codex. Status: Done for artifact writing. Expanded-build static verification: Passed; see REVIEW-LOG.md and design-book/build-report.json. Browser verification, reader acceptance and player acceptance: Unrun. This records completion of the authored four-chapter deliverable, not approval of the story or implementation of its scenes.

Outcome: the owner can read the complete proposed main narrative in [STORY.md](STORY.md) and the [designer book](design-book.html), from the first planting through Homeward evening. The expanded reading links are [chapter two](design-book.html#chapter-2), [chapter three](design-book.html#chapter-3), and [chapter four](design-book.html#chapter-4). Chapter one remains part of the same book.

Writing acceptance: all four main chapters cover the 29 current main-catalog milestones, with later chapters supplying complete narrative scenes, playable-beat tables, pacing/player-choice notes and review questions. Chapters two through four were compared with current milestone, claim, cooking, rescue/arrival, travel, gathering and reward rules. Current facts and proposed scenes remain distinct. The original conditional Homeward ending and journal fallback are retained. No new final boss, rare-drop ending gate, compulsory rescue, timed closing window or universal noncombat completion route is claimed.

Boundary: the current tracker continues into twenty Chapter-5 goals and an endless cycle. These are current continuation systems, not another unwritten main chapter. The proposed main ending and optional-track chooser require migration-safe shared-rule, save, online-authority and UI changes. Completing the writing neither changes those systems nor accepts GR-004's creative direction.

Remaining acceptance: record the expanded generated-file build and static check counts in [REVIEW-LOG.md](REVIEW-LOG.md) when available. Browser chapter navigation, deep links, search/filter behavior, image sizing, details, keyboard access, responsive layout, printing and local file opening remain Unrun. Reader comprehension, emotional payoff, natural-input progression, pacing and participant response also remain Unrun. BOOK-001's earlier static evidence belongs to its original artifact and does not establish that this expansion passed.

Reopen BOOK-002 for a missing or contradictory chapter, broken extraction or book inconsistency. Gameplay findings continue under their existing experience IDs; completion of this documentation item changes no journey or release-acceptance denominator.

## Experience questions awaiting evidence

These entries are investigation candidates, not confirmed defects or approved changes. They keep specific player questions visible alongside the broader review work.

| ID | Type and status | Current question and evidence | Evidence needed |
| --- | --- | --- | --- |
| UX-001 | Hypothesis; Backlog | Can a fresh player move from the six-card opening to planting, cabin sale, equipment, and fighting without navigation help? F-01 and F-06 identify the current flow. | Log fresh-player natural-input observations, wrong turns, stalls, and hints. Set a comprehension acceptance target before selecting a change. |
| UX-002 | Review; Backlog | Story definitions use market and crystal-upgrade wording while current stations are Exchange and Wishing cabinet. Whether displayed copy causes hesitation is unverified. | Trace displayed English and Vietnamese instructions, station labels, and tracker routes; observe the relevant sale and upgrade steps. |
| PACE-001 | Hypothesis; Backlog | Does the first-hand-harvest 10,000-energy grant preserve meaningful early spending and progression? F-05 establishes the grant, not its effect on enjoyment. | Map what can be purchased at each gate; record actual choices, unused systems, and player understanding before proposing a balance change. |
| STORY-001 | Hypothesis; Backlog | Can players explain who they are helping, why they continue, and what their actions change beyond completing milestones? F-03 establishes the task structure. | Inventory current character and story feedback, then ask players to explain role, goal, consequence, and next interest after key beats. |

Owner for source investigation: Codex. Participant observations remain Unrun until logged. Add priority, a proposed change, effort, and final acceptance criteria when a candidate becomes selected implementation work.

## Additional experience questions

| ID | Type and status | Source context | Evidence needed |
| --- | --- | --- | --- |
| UX-003 | Reachability review; Backlog | Normal current pond controls use rods while legacy fishHunt and Guardian catalog rules remain. | Exercise normal controls and collection expectations; decide the supported feature set before changing rewards or content. |
| UX-004 | Communication review; Backlog | Upgrade and skill help can describe branches that differ from active combat settings. | Compare visible copy with the active solo/online skill and boss-block rules, then verify both languages. |
| PACE-002 | Hypothesis; Backlog | Two-hour livestock aging, capped catch-up, worker rests and three-minute Rescue recovery affect return rhythm. | Observe interrupted and returning sessions; choose an intended cadence before tuning timers. |
| PACE-003 | Hypothesis; Backlog | Almanac scores favor productivity, working helpers, spending and daily activity. | Test whether scoring language supports players who choose occasional, decorative or quiet play. |
| NET-001 | Cooperative reward review; Backlog | Online contributor XP and killer-owned shared material drops are distinct. | Isolated two-account contribution, kill, pickup and release checks; agree cooperative reward expectations. |
| SYS-001 | State and clock review; Backlog | Modes, cave treasure, weeks, helper rests and device flags use different clocks and persistence scopes. | Boundary-time, profile, room recreation and restart scenarios; clear reset and carry-over explanations. |

All are investigation candidates. Source-confirmed differences remain separate from unmeasured severity or enjoyment. The domain documents' WO and combat review labels are evidence references; status is maintained only here. WO-01 maps to GR-009, WO-02 to PACE-002, WO-03 to UX-001, WO-04 to NET-001, WO-05 and WO-06 to SYS-001, and WO-07 to GR-006. Combat communication findings map to UX-004; other combat tuning questions remain within GR-008 until a concrete player problem is selected.

## New issue template

Use one short problem record before proposing a solution.

- ID, type, priority, status, owner, and date.
- Player situation, journey, build, edition, and save context.
- When the player does a specific action, what happens and why it matters.
- Evidence: Code, Test source, Run, Player, or Hypothesis.
- Desired observable outcome and the smallest candidate change.
- Dependencies, affected rules and saves, scope exclusions, and effort budget.
- Acceptance scenario, baseline result, target, relevant regressions, and evidence needed.
- Verification result and links; reason and revisit condition if Deferred.

A code change can satisfy a mechanical acceptance check. A claim about understanding, enjoyment, or narrative impact needs player evidence appropriate to that claim. If that evidence is unavailable, keep the experience acceptance open.

## Progress accounting

For a selected release, freeze the set of acceptance items. Report accepted items over that set, with scope additions and removals beside the count. Report review tasks separately from player improvements. Keep critical open problems, unrun scenarios, failed checks, and unresolved design decisions visible.

A gameplay change reaches Done with a dated record on the changed build, appropriate regression results, and an updated experience description. A review or documentation task reaches Done with its baseline, accepted deliverable, and relevant link and consistency checks. Keep pending player validation visible independently. Do not infer release readiness from a rising closure count.
