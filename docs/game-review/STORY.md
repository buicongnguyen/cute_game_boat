# Story progression and a proposed playable narrative

Baseline: `6c4477fdc795995fa5d7af6a58f83845591693af`, reviewed on 2026-10-17. **Current implementation** below is grounded in source and inspected tests. **Story proposal** is original writing for a future change; none of its new scenes, chapter names, choices, journal prose, or ending has been implemented by this documentation work. No natural playthrough, gameplay test suite, or player-comprehension study was performed for this manuscript.

Manuscript status: all four proposed main-story chapters are written below, covering current steps 1–29. The current Chapter 5 and endless tracker remain a separate continuing system; the proposed main ending and optional-track redesign are not implemented.

## What the game currently tells the player

The opening identifies the player as the new keeper of Clover Village. Their cabin is below the hatch; the deck, garden, and starship are theirs. The promise is to grow food, explore, befriend pets, and reach nine worlds. Six skippable cards introduce the cabin's Exchange box and Magic Mirror, workbench, stove, Wishing cabinet, chest, animal garden, Trophy wall, and Bookshelf before the final planting instruction. Closing or skipping records the cards as seen. The cards are offered to untouched new saves; older saves do not automatically receive the same opening. See `welcomeCards`, `initWelcomeCards`, `untouched`, and `welcomeCardsDue` in [welcome-cards.ts](../../src/welcome-cards.ts) and [first-run.ts](../../src/first-run.ts).

The first harvest by the player's own hand brings Pepper and 10,000 energy. The game thanks the player through a dialog in which Pepper calls herself the village cook and says she won the money in a lottery. This gift settles once, independently of completing the three-harvest story objective. `harvestAll` can trigger it too; autonomous helpers do not take this path. An earlier accepted/declined welcome decision is retained. See `firstHarvestGift` and `welcomeStart` in [friends.ts](../../src/friends.ts), harvest cases in [actions.ts](../../src/actions.ts), and `pepperGift` in [main.ts](../../src/main.ts).

This supplies an identity, a home, companions, and a sequence of goals. It does not establish whether a player understands a larger dramatic purpose. The inspected chapter data consists of tasks and reward metadata. Existing character flavor is distributed through rescue dialogs, work chatter, household exchanges, neighbour encounters, and help. A story assessment must include these together, rather than treating task count as story depth.

## Existing cast and relationships

| Character or group | Current role and encounter | Existing motivation or narrative detail | Implementation boundary |
| --- | --- | --- | --- |
| Player / keeper | Develops home, uses the cabin, explores by starship. | Welcome identifies the new keeper; companions often address the player as boss. | Name and appearance are customizable. No mandatory biography is inferred. |
| Pepper | Cook and early helper, normally granted at the first hand harvest on fresh saves. | Welcome gives her lottery-gift explanation. A separate rescue line says a robot wanted a cook who never sleeps. | Toybox robot cage rules remain for saves without her. A fresh save that already received Pepper has `cageState('pepper') === 'rescued'`; there is no second required rescue. |
| Sprout | Gardener, caged near the home-world treant until that boss has been defeated. | The treant caught her watering its roots. She offers to tend the garden. | Follows until the player reaches home, then works there. Replanting follows auto-planting settings and available seeds. |
| Clover | Farmer, caged near the home-world bear until that boss has been defeated. | She shared the bear's honey with hens. She offers animal care. | Product collection is automatic while working; crop-consuming automatic feeding requires opt-in. |
| Solo neighbours | Five seeded explorers drawn from Nova, Aria, Minh, Bao, Pip, Luna, Kai, Mai, Leo, Suri, Tam, Hana, Rio, and Lan. | Greet, request friendship, give gifts, visit, joke, and chat about gardening or outfits. | Saved seed stabilizes the cast. These are offline actors, not human accounts or a free-form conversational model. Names are not fixed chapter protagonists. |
| Pets and activity hosts | Companions and entrances into activities. | Pet presence supports companionship; mode-specific narrative belongs with each activity. | This proposal requires no new species, models, settlement, or speaking NPC. Mode-host dialogue is outside this chapter's detailed source review. |

Sources: `FRIENDS`, `CAGES`, and roles in [friends-state.ts](../../src/friends-state.ts); `cageState`, `rescue`, `arriveHome`, `friendWork`, `nextFriendTask` in [friends.ts](../../src/friends.ts); `RESCUE_LINES`, `lockedHint`, and status copy in [friend-ui.ts](../../src/friend-ui.ts); cast/gifts in [bot-logic.ts](../../src/bot-logic.ts); encounters in [bots.ts](../../src/bots.ts).

Sprout needs the home treant recorded as a defeated boss; Clover needs the home bear. Pepper's legacy cage opens after any boss away from home has been defeated, but rescue must occur on Toybox. Boss respawn does not erase the defeat record or re-lock a cage. The browser places cages beside bosses and can rescue by tapping or approaching an open cage; online authority also checks proximity. These are rescue rules, not a required order inside the 29 story tasks. See [friend-crew.ts](../../src/friend-crew.ts), [friends.test.ts](../../tests/friends.test.ts), and [friends-authority.test.mjs](../../tests/friends-authority.test.mjs).

## Existing everyday dialogue and companion life

Household dialogue already has pools for living room, kitchen, craft room, bedroom, bath, and study. Friends use childlike lines at growth stage zero and grown lines at stages one and two. Roughly a quarter of room chatter draws from role-specific pools. Two-person exchanges, player greetings, and player self-talk cover snacks, cushions, misplaced tools, gardening, and curiosity about worlds. These are foundations for belonging, not scripted chapter scenes. `TalkBag` avoids repeats until three quarters of a pool has been dealt. See [house-talk.ts](../../src/house-talk.ts) and [vi-house-talk.ts](../../src/locales/vi-house-talk.ts).

Outdoor work has separate line pools for harvesting, planting, collection, feeding, cooking, kind remarks, going home, and changing clothes. Idle friends stroll, inspect beds/animals, and rest. Pepper cooks half of eligible items she gathers, carrying odd counts between batches; with a locked kitchen she gathers without cooking. Visitors' copies animate without doing the owner's work. Pausing, calling back, and borrowing gear are existing choices. Appearance options owned by the player can dress friends without buying the same option again. See [friend-lines.ts](../../src/friend-lines.ts), [friend-lines-more.ts](../../src/friend-lines-more.ts), [friend-idle.ts](../../src/friend-idle.ts), [friend-crew.ts](../../src/friend-crew.ts), and [friend-looks.ts](../../src/friend-looks.ts).

Growth uses saved stages: half the player's height, then 0.75, then 0.8. Stages are earned at one day or 40 counted jobs, and three days or 150 jobs. Counted growth jobs are harvests/collections, capped at 60 per UTC day. Elapsed time is calculated from the rescue timestamp when growth is evaluated; saved stages never reverse. Clothing proportions and growth height are separate. These are presentation/progression rules, not a required biological age or a reason to make friends labor for affection. See [growth.ts](../../src/growth.ts), `tally` in [friends.ts](../../src/friends.ts), and [friend-view.ts](../../src/friend-view.ts).

Neighbour chat sorts English/Vietnamese keywords into intents and selects authored replies. It does not track an unfolding plot or reliably answer arbitrary gameplay questions. Friendship and promised gifts persist in a browser store; chat logs are bounded session state. Current orchestration waits out fights, retains held requests, and delays routine gifts. Older comments mention a one-in-four interruption rule; current orchestration and routing tests take precedence. See [bot-chat.ts](../../src/bot-chat.ts), [bot-lines.ts](../../src/bot-lines.ts), [bots.ts](../../src/bots.ts), and [bots-routing.test.mjs](../../tests/bots-routing.test.mjs).

## The current 29 milestones

The table uses visible step numbers; array indices are one lower. Chapter numbers are the four current indices plus one. Titles preserve current catalog wording, including older station names. Extra gifts combine `STORY_GIFTS` and the step's `end` inventory; all steps also pay variable energy, XP, and stars.

| Step | Chapter | Current title | Completion rule | Extra item reward |
| --- | --- | --- | --- | --- |
| 1 | 1 | Harvest three crops | Active `harvest` ×3 | Fertilizer ×4 |
| 2 | 1 | Earn 20 energy at the market | Active `sell` amount 20 | Potion ×3 |
| 3 | 1 | Buy or craft one item | Active `craft` ×1, or gear ownership catch-up | Straw hat ×1 |
| 4 | 1 | Equip a weapon | Live weapon or disguise equipped | Potion ×2 |
| 5 | 1 | Defeat five creatures | Active `kill` ×5 | Rod ×1, worm bait ×5 |
| 6 | 1 | Buy a crystal upgrade | Active `upgrade` ×1 | — |
| 7 | 1 | Catch two fish | Active `fish` ×2 | Fertilizer ×4 |
| 8 | 1 | Use ten skills | Active `skill` ×10 | — |
| 9 | 1 | Reach level 5 | Live level ≥5 | Star seed ×1, magic spore ×2, bed kit ×1 |
| 10 | 2 | Defeat 25 creatures | Active `kill` ×25 | Potion ×3 |
| 11 | 2 | Place another garden bed | Live beds beyond nine starter beds ≥1 | Fertilizer ×6 |
| 12 | 2 | Cook three meals | Active `cook` ×3; difficulty substitute below | Robot companion ×1 |
| 13 | 2 | Defeat a boss | Active `boss` ×1 | Potion ×3, worm bait ×5 |
| 14 | 2 | Catch five fish | Active `fish` ×5 | — |
| 15 | 2 | Reach level 8 | Live level ≥8 | Fire seed ×2, ice seed ×2, claw ×2 |
| 16 | 3 | Visit another planet | Active `planet` ×1 | — |
| 17 | 3 | Mine five deposits | Active `mine` ×5 | — |
| 18 | 3 | Discover three planets | Live `visited.length` ≥3, including home | — |
| 19 | 3 | Craft or buy three items | Active `craft` ×3, or gear ownership catch-up | — |
| 20 | 3 | Place two decorations | Live placed decorations ≥2 | — |
| 21 | 3 | Reach level 12 | Live level ≥12 | Star shard ×2, star seed ×2, magic spore ×3 |
| 22 | 4 | Defeat three bosses | Active `boss` ×3 | — |
| 23 | 4 | Discover five planets | Live `visited.length` ≥5, including home | — |
| 24 | 4 | Equip a disguise | Live disguise equipped | — |
| 25 | 4 | Defeat 150 creatures | Active `kill` ×150 | — |
| 26 | 4 | Reach level 18 | Live level ≥18 | — |
| 27 | 4 | Discover every planet | Live `visited.length` ≥9 | — |
| 28 | 4 | Defeat ten bosses | Active `boss` ×10 | — |
| 29 | 4 | Reach level 25 | Live level ≥25 | Star shard ×3, moonstone ×1, thunderstone ×2, star seed ×3 |

Sources: `STORY_STEPS` in [content.ts](../../src/content.ts); `storyStep`, `condition`, `recordEvent`, `progressEntries`, `claimProgress` in [progression.ts](../../src/progression.ts); `STORY_GIFTS` in [story-gifts.ts](../../src/story-gifts.ts). The rare-fish story gate was replaced by five ordinary catches; rare-fish dailies remain separate. Reintroducing a rare catch as a required opening gate would need a new design decision.

### Counting claiming and important variants

- **One active event goal.** Matching events increment the current step; earlier kills, sales, catches, and skills are not generally backfilled into later event goals. Totals still advance achievements/recurring tasks. Helper work can count through `asHelper`; timed challenges exclude helper harvests/skills, while helper kills can count.
- **Explicit claim.** A complete goal stays current until `claimProgress` succeeds. Claim pays, increments the index, and resets active progress. A stale/duplicate claim cannot claim the next step. Review completion-to-claim-to-next-cue as a player transition.
- **Ownership exception.** `craft` catch-up counts distinct ordinary gear IDs in bag, chest, or equipment, capped at the target. It excludes keepsakes and cooked items. This is not a history of every crafted object; gifted gear can matter.
- **Live conditions.** Level, placed beds, decorations, visited worlds, and equipment read the save. The story's Discover uses worlds visited; Goals' Planets discovered uses worlds spotted in space. These are different records.
- **Difficulty substitution.** Easy has an open kitchen. Normal/Hard lock cooking until level 14. While locked, step 12 becomes Harvest ten crops, active `harvest` ×10, retaining its companion gift. If the active event changes after difficulty/level changes, `refreshProgress` resets its event progress. Unclaimed cooking dailies/weeklies are also replaced with eligible alternatives.
- **New-save help.** Three eligible level-one plantings get 20 seconds only while step one remains active. Other trackers wait until first kill or level 3. Chapter-one pointing can be hidden/restored. Indoor practice controls remain visible without recording a first fight.
- **Conditional guidance.** Tracker navigation, bed pointer, station pointer, and moment tips have different checks. A trail does not prove every later goal is navigable or understood. Station trips can route through the hatch; natural-input verification remains open.

Sources: [story-catchup.ts](../../src/story-catchup.ts), [difficulty.ts](../../src/difficulty.ts), [first-run.ts](../../src/first-run.ts), [quest-walk.ts](../../src/quest-walk.ts), [moment-tips.ts](../../src/moment-tips.ts), [guide.ts](../../src/guide.ts), and quest/station routing in [main.ts](../../src/main.ts).

For zero-based story index `i`, claim-time level `L`, level requirement `N = round(25 × L^1.55)`, and bonus `b = 1 + (clamp(floor(L),1,51) − 1)/10`, current rewards are:

- Energy: `round((60 + 7L + 5 × min(i,40)) × b)`.
- XP: `round(N × share + 15b)`, share 0.35 for indices 0–14, 0.25 for 15–28, and 0.30 thereafter.
- Stars: 15, plus 40 when the step has an `end` gift.

Reward items use shared stow rules; a full bag can send them to the chest. Surplus bed-kit rewards beyond bed capacity convert to magic spores. This document does not rebalance these rules. See [story-gifts.ts](../../src/story-gifts.ts), `fitReward`/`give` in [progression.ts](../../src/progression.ts), and [model.ts](../../src/model.ts).

## What currently follows step 29

There is no stop at the four-chapter catalog boundary. `storyStep` supplies twenty Chapter-5 steps, then an endless cycle. These modes are currently sequential requirements of the continuing tracker, although ordinary activities remain available outside it.

| Step | Current continuing goal | Rule / extra gift |
| --- | --- | --- |
| 30 | Answer a Rescue call | `rescue` ×1 |
| 31 | Win a Flag Rush match | `ctf` ×1 |
| 32 | Clear the Delvers' Vault | `dungeon` ×1 |
| 33 | Hurt the Cinderpeak Colossus | `colossus` ×1 |
| 34 | Harvest 100 crops | `harvest` ×100 |
| 35 | Catch 10 fish | `fish` ×10 |
| 36 | Defeat 5 bosses | `boss` ×5 |
| 37 | Reach level 30 | Live level; star shard ×2, star seed ×2 |
| 38 | Complete 5 bounties | `bounty` ×5 |
| 39 | Gather 30 resources | `mine` ×30 |
| 40 | Answer 3 Rescue calls | `rescue` ×3 |
| 41 | Reach level 40 | Live level; moonstone ×1, thunderstone ×2 |
| 42 | Harvest 250 crops | `harvest` ×250 |
| 43 | Defeat 10 bosses | `boss` ×10 |
| 44 | Catch 40 fish | `fish` ×40; potion ×3 |
| 45 | Reach level 50 | Live level; star shard ×4, moonstone ×1 |
| 46 | Complete 10 bounties | `bounty` ×10 |
| 47 | Defeat 400 creatures | `kill` ×400 |
| 48 | Answer 5 Rescue calls | `rescue` ×5; honey ×3 |
| 49 | Reach level 60 | Live level; moonstone ×2, thunderstone ×3 |

Visible step 50 begins the six-goal endless cycle: defeat 120 creatures, defeat four bosses, harvest 60 crops, catch 25 fish, complete three bounties, win eight quick challenges. Each full six-step round increases base targets by 50%, rounded: `round(base × (1 + floor(endlessStepIndex/6) × 0.5))`, where `endlessStepIndex` is zero at step 50. Sources: `ENDGAME_STEPS`, `ENDLESS`, `storyStep` in [progression.ts](../../src/progression.ts).

Other return loops exist: three daily tasks/check-in, four weekly tasks, achievements, a 30-tier monthly star pass, half-hour world bounties, timed challenges, collections, flags, and next-unlock display. Journal groups are Explore / Grow / Collect. Collections do not invent a claimable completion reward. Sixteen arrival places cover four home wilds, four landmarks, and eight other planets. Online flags are personal browser mirrors keyed by explorer name. The welcome-back card uses the local day; core progression periods use UTC; individual modes have other clocks. See [journal-badges.ts](../../src/journal-badges.ts), [goals.ts](../../src/goals.ts), [goals-ui.ts](../../src/goals-ui.ts), [place-flags.ts](../../src/place-flags.ts), [place-flags-view.ts](../../src/place-flags-view.ts), and [welcome-back.ts](../../src/welcome-back.ts).

## Proposed story The Homeward Book

**Premise.** You have inherited a small home on a wooden deck and a starship with room for one more story. In the cabin's study is an unfinished household notebook: useful routes, meals, and little discoveries, with many blank entries. Pepper asks you to make it a book that helps anyone find their way home. What starts as planting enough for supper becomes a record of nine worlds and the people who make returning worthwhile.

This is an ordinary shared project, not a world-ending emergency. The book is proposed journal prose accessible from the existing Bookshelf; it is not a new inventory collectible, modeled prop, currency, or scavenger hunt. The deck stays home; the starship remains the means of interplanetary travel. No sailing system is implied. The title, inheritance detail, chapter names, and all new dialogue below are proposed lore.

**Dramatic question.** Can a place you have just arrived at become a home you choose to share? Each chapter answers through play: learn to care for it, make room for others, bring something back, then leave a useful route for whoever comes next. Progress changes what characters acknowledge and the journal remembers; numbers alone do not carry the story.

**Character arcs.** Pepper begins by helping immediately and learns to ask for company instead of doing everything herself. Sprout's curiosity once got her caught; after rescue she wants to make the garden a place where curiosity is safe. Clover learns that caring for animals includes protecting their stores and leaving enough for tomorrow. The player moves from new keeper to confident host. These arcs extend rescue explanations without changing who is currently in a cage or undoing first-harvest Pepper ownership.

### Proposed chapter 1 A place to begin

This chapter overlays current steps 1–9. The first promise is small: grow something, then decide what to do with it. A short opening line and planting action come first. Cabin functions are introduced when their relevant goal arrives, with the full guide retained as optional help. Reducing/reordering the six-card presentation would be an implementation change, not merely prose.

The first harvest brings Pepper as now. She explains the existing 10,000-energy gift without requiring a sale before it arrives. The Exchange goal teaches renewable income; gift and income must be distinguishable. A gear choice prepares the player to leave the deck. The first fight introduces danger and recovery; fishing provides a quieter contrast. The wishing goal asks what kind of explorer to become. Ten skills are practice rather than a statement that every creature must be attacked.

At step 9's claim, add an optional journal beat: the first entry is useful because the player can grow, prepare, venture out, and return. Pepper proposes room for more company. Existing bed-kit/seed rewards stay unchanged. No rescued friend is assumed to be home.

Proposed Pepper line: “The first page used to say 'someone should look after this place.' Now I can write your name.” Choices: **What is beyond the gates?** previews the next goal; **I will stay a little longer.** returns to free play. The choice changes her response, not currency or permanent access.

### Proposed chapter 2 Room for someone else

**Proposal not implemented.** This chapter overlays current steps 10–15. New dialogue and acknowledgements use existing rooms, characters, journal, and interactions; no new art, resource, or mandatory rescue is added.

#### Narrative

The keeper notices that knowing where everything belongs is different from having someone to share it with. Pepper finds the notebook open in the study. “We have written down where to buy a sword,” she says. “We have not written down where a visitor could put their muddy boots.” The next page begins with a question: what would make this place useful to somebody besides its keeper? It is an invitation, not another bill to pay.

Outside the gates, the keeper practices reading danger rather than rushing into every moving shape. The active goal asks for twenty-five creature defeats, but Pepper's proposed advice is modest: “Go a little farther if you feel ready. Come back before you stop feeling ready.” Each trip can end at the hatch. If the keeper has already wandered through these places, the notebook acknowledges familiar paths instead of pretending the wilds are being seen for the first time.

The next garden bed makes room visible. A kit from the earlier chapter may supply it; an existing extra bed may already satisfy the goal. Pepper studies the new space. “I was going to call it my bed. Then I remembered I do not fit in it.” The keeper can choose its position through the existing placement controls. The proposed notebook entry records a place made ready, without insisting on a particular crop or making the player reserve an empty bed indefinitely.

When cooking is available, three meals give the preparations a purpose. “Something for before a walk, something for after,” Pepper suggests, “and one for when the walk turns into a long story.” If the kitchen is still locked on Normal or Hard, her line changes: “The stove can wait. Let us fill the basket first.” Ten harvests complete that version of the goal. Claiming either version supplies the existing robot companion: a pet for the explorer, not a newly hired garden worker.

Before the boss objective, the keeper may learn that Sprout is waiting near the treant. The notebook can point out her location without declaring that she has been found or rescued. Any qualifying boss defeat can complete the active story goal; the player need not choose the treant. If Sprout is actually freed, her watering-roots explanation leads to a quieter request: “I meant to help a tree. Next time I might ask it first. Could you show me the way home?” Her journey follows the real rescue and arrival state.

If Sprout reaches home, the keeper can show her the garden and let her explain what she can tend. “I can help,” she says. “You can still choose what grows.” Replanting remains the player's setting. Clover has her own optional bear rescue, with the existing story about sharing honey with hens; if she has arrived, she joins the conversation about leaving enough for tomorrow. If neither friend is home, Pepper leaves the page open: “There is room for another pair of muddy boots whenever we find their owner.”

Five fish give the chapter a pause after its dangerous outing. There is no rare species to prove, and no extra serving demanded for an invented feast. Pepper asks which part of the trip the keeper would tell someone else. The proposed reply can favor a surprising catch, a close escape, or the relief of returning. It changes the journal's acknowledgement, not the catch counter or reward. The player may leave the conversation and keep fishing.

At level eight, the chapter closes on preparations rather than a departure deadline. Friends who are actually home can be acknowledged; absent friends are not placed around an imaginary table. “Should we pack for somewhere new?” Pepper asks. **Plan a journey** leads toward the existing travel information; **Stay home today** returns to ordinary play. The notebook ends its entry: “We made room before we knew who would need it. That is one way a home begins to grow.”

#### Playable scenes

| Beat | Proposed moment | Player action and consequence | Existing support / change required |
| --- | --- | --- | --- |
| Step 10 Practise the nearby paths | Pepper: “Go a little farther if you feel ready. Come back before you stop feeling ready.” | Defeat twenty-five creatures while this event goal is active, then claim. The existing reward includes three potions. Return trips remain available. | Current `kill` target is 25. New dialogue and familiar-route acknowledgement are proposed; earlier lifetime kills are not silently backfilled. |
| Step 11 Make room in the garden | “Where would another small beginning fit?” | Place an extra garden bed, or receive recognition if the live bed-count condition is already satisfied. Claim the existing six-fertilizer gift. | Current condition is at least one bed beyond the nine starters. The earlier bed kit can help; a specific location or new crop is not required. |
| Step 12 Prepare something to share | Open kitchen: “Something for before a walk, and something for after.” Locked kitchen: “The stove can wait. Let us fill the basket first.” | On Easy or with an unlocked kitchen, cook three meals during the active goal. With a locked Normal or Hard kitchen, harvest ten crops instead. Claim grants the existing robot companion. | The source already substitutes `harvest` target 10 for locked cooking. The pet is not Bolt or the pen robot. New acknowledgements must reflect the actual variant and must not unlock the kitchen. |
| Step 13 Face one difficult thing | The notebook offers Sprout's location as one possible reason to prepare. | Defeat one qualifying boss during this active step and claim its potion-and-bait reward. A treant defeat can separately open Sprout's cage; rescue and following home use their existing rules. | Any qualifying boss counts for the story. Sprout's treant gate and Clover's bear gate are separate optional rescue checks. No rescue or home-arrival scene plays solely because this goal is claimed. |
| Step 14 Catch a quieter moment | Pepper: “Which part would you tell someone else?” | Catch five fish while this goal is active, then claim. Optional response changes acknowledgement only; no fish donation or rare catch is added. | The current goal is five ordinary qualifying catches. Proposed dialogue is optional and cannot replace required catch feedback. |
| Step 15 Decide what comes next | “Should we pack for somewhere new?” **Plan a journey** or **Stay home today**. | Reach level eight and claim the existing two fire seeds, two ice seeds, and two claws. Choose travel preparation or further home play. | The level condition reads the current save. New journal closure and navigation choices are proposed. Choice adds no deadline, extra inventory cost, or automatic launch. |

#### Pacing and player choice

This chapter should alternate purposeful outings with quiet home activity. Twenty-five defeats and the boss goal remain current requirements; source reading does not establish how long they take or whether they feel repetitive. Measure natural trips, healing, preparation, menus, claims, and waiting before changing counts. The garden and fishing beats should supply a welcome change of attention, without requiring a player to wait beside a timer just to read the next line.

Help is an invitation. Rescue Sprout or Clover when the relevant gate is met, return with either later, or keep exploring. The proposed chapter still closes for players who have not rescued them. Friends already home are recognized without repeating their rescue, and Pepper is normally already present from the first hand harvest. Pausing a worker or leaving replanting off changes useful work, not affection or story worthiness. Legacy saves without Pepper need journal framing instead of a conversation with an absent actor.

The new scenes can be skipped, replayed, or interrupted. Each return should show the actual current goal and variant, with no lost credit caused by the prose. If difficulty changes the active cooking goal into harvesting or back again, the acknowledgement must explain the currently required action; it must not pretend the source's reset event progress was retained. The final choice is a stopping point, not a promise that every travel gate or off-world activity has opened.

Current-rule references: `STORY_STEPS` in [content.ts](../../src/content.ts); `storyStep`, `recordEvent`, and `claimProgress` in [progression.ts](../../src/progression.ts); step-index gifts in [story-gifts.ts](../../src/story-gifts.ts); `cageState`, `rescue`, `arriveHome`, `firstHarvestGift`, and work settings in [friends.ts](../../src/friends.ts); `RESCUE_LINES` in [friend-ui.ts](../../src/friend-ui.ts); gates in [friends-state.ts](../../src/friends-state.ts); and `kitchenLevel` in [difficulty.ts](../../src/difficulty.ts). These sources establish mechanics. New scenes, choices, text, and conditional acknowledgements above remain proposed.

#### Review and acceptance

| ID | Question | Evidence needed |
| --- | --- | --- |
| C2-01 | Does making room for others provide a clear purpose without implying a rescue is mandatory for chapter completion? | Fresh-player explanations after the bed, boss, and closing beats; inspect saves with zero, one, and two optional friends home. |
| C2-02 | Does each cooking variant communicate an achievable action and identify the reward as a pet? | Natural-input completion on Easy and locked Normal or Hard; inspect reward/equipment feedback and difficulty-switch messaging. |
| C2-03 | Do the combat, garden, and fishing beats provide useful changes of pace and clear stopping points? | Timed unassisted sessions recording trip length, repeated actions, waiting, claim discovery, optional dialogue, and chosen stopping reason. |

### Proposed chapter 3 Bring the world home

This is proposed story and presentation for current steps 16–21. The dialogue, book entries, acknowledgements, and wording changes below are not implemented. Existing travel, economy, combat, and progression rules remain the baseline.

#### Narrative

The next spread in the Homeward Book is headed **Places we can return from**. A route drawn from the cabin window would be guesswork. The keeper is ready for a real departure: the starship waits beyond the garden, while the wooden deck stays home. If Pepper is home, she studies the empty page. “Leave room for the way back,” she says. Without her, the keeper writes that reminder beside the heading.

The keeper lays out a modest plan: energy for takeoff, something to restore health, and room for what might be found. Toybox promises giant blocks and moving trains; Candy offers forests of sweets. Both are within reach after the previous chapter's level-eight milestone. Wild Jungle offers another route, with thorns and poisonous plants to consider. For a keeper who has traveled before, the page begins with a remembered landing: “Where shall we go next?”

Space makes the decision feel larger than the garden gate did. A bright world can be close enough to notice before the keeper is ready to land. **Seen from the ship** is a possibility; **stood here** is a route someone else could trust. The first visit can be brief: watch a Toybox train pass before crossing, or stop beneath Candy's trees. Either visit can end with a return home, without a boss defeated.

One small material gives the next journey a purpose. Toy gear suggests something to build; sugar makes Candy more than a shape on the map; a vine recalls Jungle's tangled growth. The keeper collects what is available and learns which gathering places need time to recover. An unavailable deposit earns no invented treasure. “Come back when it is ready” is a practical instruction, too. There is time to look around, fish, or go home and prepare.

The second off-world landing gives the spread a comparison. Toybox's blocks might lead to Candy's rounded forests; another keeper might choose Jungle and note where to wait before crossing thorns. Frost becomes an option at level ten, with slippery footing to understand. Ocean waits until twelve, with swimming and air to prepare for. These later journeys can wait. Home itself is the first of the three worlds in the book.

Back in the cabin, the keeper opens the chest before opening a shop. Useful equipment may already be there, carried, or worn. New materials can support a considered purchase or workbench recipe. If Sprout has arrived, she asks what the keeper noticed growing away from home. If Clover is home, she asks whether there was somewhere safe to pause. If neither is present, the keeper writes those questions down for another day.

Two decorations make the return visible. They need not be rare trophies or matching souvenirs. The keeper chooses things actually owned or attainable and places them where they want to see them tomorrow. A Giant teddy made with Toybox gear is one possible memory; an existing decoration has its own history. The path between cabin, garden, and starship still has to work when the decorating is done.

By level twelve, the last entry joins a route traveled, something worth noticing, and something to prepare next time. If Pepper is home, she reads it and smiles. “You brought back a way there, a way home, and a story. We have room for all three.” Otherwise the keeper writes, “Next time, I will know where to begin.” The next page can wait. Read the journal, tend the garden, or stop with a home changed by the journey.

#### Playable scenes

| Beat | Proposed moment | Player action and consequence | Existing support / change required |
| --- | --- | --- | --- |
| 16 Visit another planet | Choose a first route, or acknowledge earlier travels and choose the next landing. | Pay the current 20-energy normal takeoff cost, pilot the starship, and land on a level-eligible non-home planet while this step is active. A repeat non-home landing can supply the active `planet` event. Claim the completed step before expecting mining progress for step 17. | Travel and the event exist. Toybox opens at level 4, Candy at 6, and Jungle at 8. Autopilot additionally needs discovery and a route estimate that fits one tank. Existing visits inform proposed acknowledgement; they do not backfill this active event goal. Add a short preparation cue and explicit claim-to-next-goal transition. |
| 17 Mine five deposits | Learn a renewable gathering place rather than chase a guaranteed treasure spawn. | Successfully collect five qualifying mining rewards while the goal is active. Ordinary off-world veins grant one world material and become ready again after 20 seconds; successful collection depends on readiness and storage acceptance. A player may revisit the same veins. | Current world construction adds two ordinary veins per non-home world. This does not promise five simultaneous deposits, a particular random/special deposit spawn, or a rare secondary yield. Special environment nodes have separate conditions. Add proposed ready/unavailable guidance; verify actual findability and interaction in a natural-input route. Mining requires no invented pickaxe purchase. |
| 18 Set foot on three worlds | Compare two off-world places with home. | Have `visited.length >= 3`, including the initial home visit. Landing on Toybox and Candy is one level-eligible example; Toybox/Jungle or Candy/Jungle are alternatives at level 8. Existing qualifying visits can satisfy this live condition immediately. | The current title says Discover three planets, but its rule counts visits. Proposed wording clarifies landing; approaching a world in space only updates discovery. Frost needs level 10, Ocean 12, Volcano 14, Cloud 16, and Night 20. No destination list or level gate changes are proposed. |
| 19 Craft or buy three items | Check what the household already has, then make a useful choice. | Successful qualifying craft/buy actions while active increment the event. Separately, ownership catch-up can raise progress from distinct ordinary gear IDs held in the bag, chest, or equipment, capped at three. Existing gifted gear can contribute. | Catch-up is not all-time crafting history and does not require three new purchases. Keepsakes and cooked items are excluded from ownership catch-up; owning decorations alone does not supply gear catch-up. Crafting a decoration can still generate a current `craft` event. Proposed text distinguishes those paths before suggesting a recipe. |
| 20 Place two decorations | Choose what makes the return feel personal. | Have at least two live, validly placed decorations at home. Already placed decorations qualify; an owned item left in bag/chest does not. Placement consumes a bag copy and requires clear home space. Two valid copies may count; no distinct-world set is required. | Any valid decoration is accepted. One concrete optional workbench route is Giant teddy: 60 energy, 4 toy gear, and 3 leather per copy. The player must actually own its inputs; five mining claims alone do not guarantee two teddies. Music box needs a battery and is not promised as a guaranteed mining outcome. Premium purchases remain an existing expensive alternative. New prose must not grant or imply a free souvenir. |
| 21 Reach level 12 | Join route, observation, and preparation in a closing entry. | Reach the live level-12 condition, claim it, and receive the existing chapter-end inventory: 2 star shards, 2 star seeds, and 3 magic spores, alongside ordinary claim rewards. Choose whether to read the proposed entry or return to play. | Current level and reward rules remain. Ocean becomes landing-eligible at 12, but an Ocean visit is not a chapter-completion requirement. The recap, conditional speaker acknowledgement, and replayable reading scene need presentation/state work. Their acknowledgement must not replay economic rewards. |

Current-rule references: [story targets and recipe catalog](../../src/content.ts), [claim and condition rules](../../src/progression.ts), [gear ownership catch-up](../../src/story-catchup.ts), [travel mining and placement rules](../../src/model.ts), [space routes and controls](../../src/space.ts), [ordinary world vein placement](../../src/world.ts), [special environment resource nodes](../../src/environment-resources.ts), [premium purchase rules](../../src/special-offers.ts), and [friend rescue and arrival state](../../src/friends.ts). The book remains proposed journal prose, not a new inventory item, currency, collectible set, or travel mechanic.

#### Pacing and player choice

The chapter alternates departure, a small practical discovery, and a visible return. Offer Toybox/Candy as an understandable example, with Jungle available at level eight for a player who wants its hazards. Show landing-level requirements before a player commits to a route. Keep the first trip small enough in purpose that returning after a short visit feels complete; travel does not imply clearing a world's bosses. A player who arrives with earlier visits, three qualifying gear IDs, or two placed decorations should receive an honest acknowledgement and the current valid completion path. Active event goals still need their current events; extending catch-up would be a separate rules decision.

Measure the fifth mining claim, ingredient acquisition, decoration placement, and level-eight-to-twelve interval separately. A 20-second vein cooldown does not establish a chapter duration, and a recipe's existence does not prove that its materials are naturally available at the right moment. When the next useful action is unavailable, keep home care, fishing, preparation, and returning later legible without presenting them as guaranteed substitutes for the active goal. New reading is skippable and replayable, keeps the actionable instruction available outside transient dialogue, and resumes after interruption. No online account, rare drop, companion rescue, premium purchase, or timed event becomes a new requirement of this chapter.

#### Review and acceptance

| ID | Question | Evidence needed |
| --- | --- | --- |
| C3-01 | Does travel feel like a chosen excursion with an understandable way home? | Natural desktop and phone routes: locate ship, explain 20-energy launch, discover versus land, return safely, and describe the reason for the trip. Record assistance, mistakes, and return choice. |
| C3-02 | Can players finish the mining and decoration sequence without assuming a guaranteed spawn or rare ingredient? | Observe ready and unavailable veins, five successful active claims, storage refusal, ingredient sourcing, an optional two-teddy route, and valid placement. Record gathering, waiting, travel, menu, and repeated-combat time separately. |
| C3-03 | Are prior visits and gear acknowledged accurately while active events remain clear? | Save fixtures with prior off-world visits, step-16 repeat landing, fewer/exactly three distinct gear IDs across bag/chest/equipment, crafted decorations, duplicate gear copies, and already placed decorations. Verify no duplicate claims or false backfill. |
| C3-04 | Does the chapter change the meaning of returning without inventing friends or belongings? | Read the scene with no rescued friends, Pepper absent/home, Sprout following/home, and Clover absent/home; interrupt/reload and skip/replay it. Compare text with actual visits, materials, decorations, and arrival state in both languages. |
| C3-05 | Does level 12 provide a satisfying pause rather than an unmeasured repetition barrier? | Players explain what changed at home and what they might do next. Compare full interval breakdowns and assistance needs across short sessions and different control/reading needs before changing targets or rewards. |

### Proposed chapter 4 A home with an open door

**Proposal not implemented.** This chapter overlays current steps 22–29. Its closing scene, journal entries, saved acknowledgements and optional-track chooser require implementation. The current tracker continues into Chapter 5 and endless goals; it does not currently end here.

#### Narrative

Back in the study, the keeper opens the household book. Its margins hold preparations, wrong turns, and reasons to return. If Pepper has joined, she asks, “What would you tell someone setting out for the first time?” Without her, the unfinished entry asks the same question. The keeper begins with something learned, rather than something still missing.

Three further boss victories give that answer substance. A familiar opponent can teach a better approach; a difficult encounter can teach when to leave. The keeper's proposed entry records a useful preparation and a warning, without pretending every victory opened a new road. “A route home belongs on the page too,” Pepper says if present in the household. The keeper can close the book before the next outing. Nothing in it needs to be proved in one journey.

With five worlds visited, including home, the keeper lays their different impressions side by side. A bright place was not always an easy place. A frightening place sometimes held something worth noticing. The book makes room for both. If a route is already familiar, the entry acknowledges that familiarity. The keeper is learning to offer another explorer a choice: what to prepare for, what to look at, and where to turn back.

Trying a disguise makes that choice playful again. For a moment, the keeper's shape changes more than their purpose. They can look formidable, strange, or funny and still be the person who remembers the hatch. The proposed journal asks, “Did that feel like you, or like trying somebody else's courage?” Neither answer is better. After claiming the milestone, the keeper may keep the disguise or put their usual clothes back on.

The longer stretch of creature encounters tests the promise behind the book. Some trips go well; others finish sooner than planned. Between them, the garden still offers an ordinary task and the water offers another cast. A proposed margin note reads, “Today I came back before I was ready to give up.” The keeper can record that moment without making every outing sound triumphant. Practice has a place in the story; exhaustion need not become its moral.

As the keeper grows stronger and the remaining landing routes become available, the last unfamiliar worlds become places actually visited. The final world note need not be the grandest. It might remember difficult footing, a safe preparation, or a view worth returning for. Back at home, something already placed on the deck looks different beside those memories. Nine worlds have not made home smaller. They have given the keeper more ways to recognize it.

Before the later boss outings, the keeper chooses what feels useful to practice. Familiar victories count as victories; the book does not demand ten different trophies. If Sprout is home, she reads the warning beside an old route. “I like the bit where we get to come back,” she says. If Clover is home, she checks that tomorrow has not been forgotten. Their company is welcome, but nobody's empty place turns the keeper's progress into a failure.

When the level-25 milestone is claimed, the proposed closing entry offers Homeward evening for the keeper's next chosen return. The cabin is the same cabin. No final enemy waits outside it. If Pepper has joined, she leaves a task unfinished long enough to sit with the keeper. Without her, the journal begins, “This book started with a place I did not yet know.” The pause asks for no purchase, special dish, or missing companion.

Pepper, if owned: “I thought a full book meant there was nothing left to do.” Sprout, only if home: “There is a whole blank bit at the back. I checked.” Clover, only if home: “That is for the next good idea. Leave some room.” With or without their voices, the keeper's journal closes the chapter: “Nine worlds, and still one place I call home. I know how to leave. I know how to come back. There will be room for whoever comes next.”

The keeper can stay for a while, read the book again, or choose another adventure. Staying might mean one more planting, changing an outfit, or simply leaving the game for now. The last page does not assign a visitor or promise that someone will arrive tonight. It leaves a little space. For the first time, the unfinished part of the book feels like an invitation the keeper can accept whenever they wish.

#### Playable scenes

| Beat | Proposed moment | Player action and consequence | Existing support / change required |
| --- | --- | --- | --- |
| 22 Defeat three bosses | Turn experience into useful advice. | While this goal is active, earn three qualifying boss events, then Collect. Offer a short preparation or retreat acknowledgement. | Current target is active `boss` ×3. Bosses need not be three unique types or worlds. Saved rescue boss records and earlier lifetime victories do not backfill this counter. New prose and saved scene acknowledgement required. |
| 23 Discover five planets | Compare places actually reached. | Have five visited worlds, including home, then Collect. Acknowledge prior visits if already eligible; offer an optional route note. | Current live condition is `visited.length >= 5`, not five off-world destinations or five worlds merely spotted from space. Existing landing gates remain. Authored visit-aware copy required; no new collectible. |
| 24 Equip a disguise | Experiment without losing identity. | Equip any eligible owned disguise, or recognize one already equipped, then Collect. Keeping or removing it afterward does not change the claimed reward. | Current live disguise condition and equipment rules exist. No specific disguise, rare drop or forge result is required. Proposed reflection choice has no extra stat or reward effect; presentation/save work required. |
| 25 Defeat 150 creatures | Make preparation and return visible during a longer practice stretch. | Earn 150 `kill` events while this goal is active, with ordinary breaks and home activities available between outings, then Collect. | Current target stays 150; prior lifetime kills do not automatically complete it. No completion-time or enjoyment claim has been measured. Add optional return acknowledgement; measure repetition before selecting any target change. |
| 26 Reach level 18 | Notice growing competence without inventing a new examination. | Reach level 18, or recognize a level already reached, then Collect. Offer a recap and a choice to continue or stop. | Current live level condition exists. XP can come from supported activities; no new boss, spending quota or compulsory upgrade is added. Recap and saved presentation state are new. |
| 27 Discover every planet | Finish the practical routes in the shared book. | Have all nine worlds in the visited record, including home and eight off-world destinations, then Collect. Optional notes acknowledge actual travel. | Current live condition is `visited.length >= 9`; seeing a world in space is insufficient. Level, launch and landing rules remain. New journal prose must not require a rare catch, complete collection or online account. |
| 28 Defeat ten bosses | Practice confidence, then return on the keeper's terms. | Earn ten qualifying boss events while this goal is active, then Collect. The scene can acknowledge a chosen familiar route and companions actually home. | Current active target is `boss` ×10, not ten unique bosses. Earlier step-22 victories do not backfill it. No new final boss or timed Colossus requirement. Companion branching and optional acknowledgement are new. |
| 29 Reach level 25 | Offer Homeward evening and a main-story conclusion. | Reach level 25, then Collect the existing reward. Offer the closing entry immediately and the cabin scene on a chosen return; permit skip, later reading and replay. | Current live level condition and item gift remain: star shard ×3, moonstone ×1, thunderstone ×2, star seed ×3, plus current variable rewards. Today the claim advances directly to Chapter 5. Main-story completion, replay flags, deferred scene, optional tracks and migration need approved shared-rule/save/UI work; never pay the claim twice. |

#### Pacing and player choice

The 150-creature and ten-boss goals remain current repetition gates. Record active combat, travel, preparation, respawn waiting, menus and voluntary breaks before choosing a change; a source trace establishes neither comfortable pacing nor harmful grinding. Proposed short returns and journal pauses should give the player useful stopping points without creating additional counters. Quiet activities remain available, but the current main tracker still requires combat. A Care route would be a separately selected rule change, not an implied way to satisfy these existing goals.

Homeward evening is a scene title, not a real-time window or a requirement to wait for night. Claiming step 29 should offer its closing entry even away from home, with a deferred cabin presentation on a later chosen return. Skipping or interrupting a scene must preserve completion and permit replay. Pepper's line branches on actual ownership; Sprout and Clover speak only when their real `home` state is true. Other states use the keeper's journal. No new rescue, affection quota, worker productivity, food consumption or online presence gates the conclusion.

The proposed choices are **Stay for a while**, **Choose another adventure**, and **Read the book**. Their destination is continuing sandbox play, optional activity/goal tracks, and replay respectively. Current Chapter 5 has twenty sequential goals followed by an endless cycle; moving these into optional tracks requires a migration-safe redesign, not just a new ending paragraph. Preserve index/counters, inventory, visits, friends and existing rewards until an approved mapping exists. Saves already beyond step 29 should be offered recognition and the closing entry without re-awarding old claims. New completion and choice state must use shared actions and online authority rather than treating browser-only flags as reward proof.

#### Review and acceptance

| ID | Question | Evidence needed |
| --- | --- | --- |
| C4-01 | Does the closing evening feel earned by the keeper's actions rather than appended to a level counter? | Participant explanations before and after the route notes and closing scene: what changed, why home matters, and whether the ending answers the shared-book premise. Include players who skip optional prose; creative acceptance remains open. |
| C4-02 | Can players distinguish active boss/kill goals, live visit/level conditions, and optional breaks without mistaking them for lifetime or unique-boss requirements? | Natural-input observations across steps 22–29, including earlier boss victories, five already-visited worlds, a disguise already equipped, and level/visit goals already eligible. Record claim discovery, repeated actions, assistance and elapsed/active time. |
| C4-03 | Does main-story completion leave a clear, voluntary next action while preserving every supported save and companion state? | Before implementation, approve the completion/track migration contract. Then test fresh and midchapter saves, unclaimed step 29, beyond-step-29 saves and online/solo authority; zero duplicate rewards or lost counters. Check Pepper absent/owned and Sprout/Clover absent/following/home, ending interruption/replay, and player understanding of stay/read/choose. |

Source grounding: the existing chapter-four outline and Homeward ending in [STORY.md](STORY.md) remain the creative basis. Current milestone targets are `STORY_STEPS` in [content.ts](../../src/content.ts); `recordEvent`, `condition`, `claimProgress`, `ENDGAME_STEPS` and `storyStep` in [progression.ts](../../src/progression.ts) establish counting, explicit claims and continued Chapter 5/endless progression. `travel`, `canLand`, `equip` and the saved visited record are in [model.ts](../../src/model.ts). Ownership, rescue and arrival are separate in [friends-state.ts](../../src/friends-state.ts) and [friends.ts](../../src/friends.ts). All new chapter scenes, choices, journal prose and conclusion flags above are proposed, not current runtime behavior. No gameplay test, browser verification or participant session was run for this draft.

## Proposed opening playable arc and sample copy

These are proposed triggers/text, not measured timing or implemented interactions. The initial review slice ends at a voluntary home/field choice, then extends through the first fish and chapter ending.

| Beat | Proposed moment | Player action and consequence | Existing support / change required |
| --- | --- | --- | --- |
| Arrive | Journal: “A garden above, a cabin below, and a ship waiting by the deck. Start with something small.” **Plant my first crop** / optional **Show me the cabin**. | Choose a bed; ordinary seed picker opens and guidance remains available. | Bed interaction exists. Compact opening/choice are new flow; no free plant or teleport implied. |
| Plant | “One seed is enough to begin. This first crop grows quickly.” | Eligible planting gets current 20-second rule; player can look around or plant more. | Existing timer/eligibility. Do not promise all crops take 20 seconds. |
| Harvest | Pepper: “A first harvest! I am Pepper. I won 10,000 energy, and I would like us to make a good start with it.” | Existing grant adds Pepper/energy; crop enters normal inventory. | Gift preserved; new context ties help to the household project. |
| Understand reward | “That gift is for getting started. The Exchange box turns what we grow into energy whenever we need more.” | Claim when three crops are harvested; next tracker names Exchange and routes through the hatch. | Existing claim/routes. New acknowledgement must not confuse one harvest with completion of three. |
| First sale | “Sell a little, keep a snack, or look at the prices first.” | Existing sell-one/all choices remain; sale gain is distinguished from Pepper's gift. | No new food lock or forced full-stack sale. Copy only unless evidence warrants more. |
| Prepare | “Something comfortable for the wilds? The Magic Mirror has equipment as well as new looks.” | Compare eligible equipment. A purchase can auto-equip; the subsequent live equipped goal may already be complete. | Recognize prior equipment; do not create an unnecessary re-equip ritual. |
| First danger | “The deck is safe. Beyond it, you can practice, retreat, and try again.” | Initiate a fight or return. Real kills count; tutorial creatures are solo/new-save specific. | Do not promise identical novice encounters online. Extra assistance requires rule work. |
| Quiet contrast | “You do not have to spend the whole day being brave. There are fish by the water.” | At the right goal, previously gifted rod/bait support discovering fishing and stopping. | Gift/fishing exist. Place dialogue at the correct point. |
| Return / stop | Journal: “Next: [current goal]. Your home will be here when you return.” | Leave/reload; resume actual index, world, and variant. | A compact recap would be new presentation. No compulsory daily tour. |

Proposed failure and recovery copy branches on the actual result:

- **Missed catch:** “It slipped away. The next cast is another try.”
- **Ordinary defeat with Keep backpack enabled, the default:** “Catch your breath at home. Your backpack, equipped gear, energy, and level are safe. Prepare whenever you are ready to try again.” Do not show a recovery-bag objective.
- **Ordinary defeat with dropping explicitly enabled and a bag actually created:** “You are safe at home. Your loose items are in the marked bag where you fell. Your equipped gear, energy, and level are safe.” Offer **Show the bag** or **Prepare first**; showing the bag is a proposed navigation action, not an existing universal shortcut. If there were no loose items and no bag, say “You are safe at home. There were no loose items to recover.”
- **Vault fainting:** “The keeper carried you home. Your backpack is safe; no recovery bag was left in the Vault.” This is separate from ordinary defeat and follows the mode's actual no-drop return.
- **Locked kitchen:** “The stove can wait. Let us fill the basket first.”
- **Deferred rescue:** “We know where to look. We can prepare and come back.”

Ordinary defeat variants are grounded in `keepsBag` and `die` in [model.ts](../../src/model.ts); the Vault return uses its own mode path. Proposed copy must follow the returned result, rather than inferring a bag from a defeat animation. Existing dropped-bag expiry still applies when dropping was enabled; this copy adds no promise of indefinite recovery.

## Proposed pacing and access rules

1. **One useful request at a time.** Put the immediate verb, place, and consequence together. Retain full cabin help on demand. Introduce services when relevant. Card click-through is not proof of comprehension.
2. **Story never expires.** New entries/acknowledgements have no deadline. No guilt for missed days or lost affection for disabling automation. Existing daily rewards remain separate from main-story stakes.
3. **No new universal combat gate.** Planting, selling, decorating, reading, dressing friends, and already-open home functions acquire no fight requirement from this story. The existing main tracker still requires combat; a fully noncombat narrative route does not exist today.
4. **Possible Care route, explicitly new rules.** If broad access includes avoiding combat, add a saved route choice and alternatives for combat-focused milestones. Untuned starting candidates: step 5 harvest five additional crops; step 8 catch three additional fish; step 10 harvest 15; step 13 visit two home wilds; step 22 visit three off-world destinations; step 25 harvest 60; step 28 log ten catches across three available waters. These are proposals, not accepted replacements. Keep travel/material/level constraints visible. Wild visits can still expose players to enemies; genuine safety requires encounter/recovery work, not counter substitutions alone. Rescue gates remain until separately redesigned, so the alternate ending cannot assume all friends rescued.
5. **Allow leaving the script.** Current live conditions/gear catch-up already recognize some prior play. Before extending catch-up, decide whether a goal means first mastery or additional practice and define saved evidence. Do not backfill all lifetime actions indiscriminately or pay twice.
6. **No random-drop finale.** Main closure does not require a rare pet, forge success, mysterious fish, or complete collection. Proposed world entries use verifiable visits/interactions without new inventory collectibles.
7. **Read at the player's pace.** New scenes are skippable/replayable; no fast-reading or hold-to-read requirement. Save scene IDs for interruptions. English/Vietnamese must retain meaning, device verbs, and speaker identity. Bubbles cannot be the sole required instruction.
8. **Friends remain characters.** Work/rest/clothing controls stay understandable. Acknowledgements depend on real rescue/arrival/choices; productivity does not decide whether a friend thanks the player.
9. **Alternate quiet and demand.** Follow first combat with home/fishing opportunities. Offer several useful activities around long level gates. Measure active time, reading, travel, waiting, repetition, and menus before setting durations; one session length cannot describe every player.
10. **Keep this pass's asset budget fixed.** Use existing rooms, models, UI, and gestures. Add short text, entries, conditional acknowledgements, and goal names. Visual changes require a demonstrated action/feedback readability need.

## Proposed ending and optional-content structure

In this proposal the main story ends at step 29. Current Chapter 5 would need a migration-safe redesign into optional tracks: **Care for home** (production/decor), **Explore and collect** (worlds/fish/materials), **Take a challenge** (bosses/bounties/Vault), **Play an extra mode** (Rescue Call/Flag Rush). Existing rewards, limits, and authority remain unless selected changes specify otherwise. Moving sequential goals into a chooser is a gameplay/save/UI change; it has not happened here.

This gives three valid stopping points: finish a small task, close a chapter, or finish the main narrative. Extras serve preferences/mastery instead of one unfamiliar mode blocking every later tracker goal. Existing endless goals can remain a chosen challenge track. A return visit shows the last selected track and permits choosing another without forfeiting main-story completion.

For saves beyond step 29, propose recognizing completion without replaying rewards. Offer the closing entry; preserve current index/counters until an approved migration maps tracks. Midchapter updates never overwrite inventory, friends, gear, or visits simply to force linear text. Online choices/new flags must use shared actions/authority; browser-only arrival flags must not become economic reward proof.

## Review findings and acceptance boundaries

- Current catalog/base Help refer to market, Outfitters, and crystal; boat services are Exchange, Magic Mirror, and Wishing cabinet. Friend-panel cook copy still says volcano kitchen. These are confirmed text differences; confusion/severity are unobserved.
- Pepper's fresh-save arrival and older cage backstory coexist. New scenes branch on actual state; the proposal uses her as opening anchor without claiming the old route was removed.
- Active story actions differ from totals. Independent early play can help the save without satisfying a later goal. Document this before deciding whether to change it.
- Tests simulate many outcomes and advance clocks. They support mechanical reachability, not natural-play timing, meaning, combat feel, or physical-phone readability.

Inspected tests: [start](../../tests/start.test.ts), [first run](../../tests/first-run.test.ts), [story rewards](../../tests/story-rewards.test.ts), [progression](../../tests/progression.test.ts), [guide](../../tests/guide.test.ts), [friends](../../tests/friends.test.ts), [friend authority](../../tests/friends-authority.test.mjs), [house talk](../../tests/house-talk.test.ts), [friend lines](../../tests/friend-lines.test.ts), [friend idle](../../tests/friend-idle.test.ts), [bots](../../tests/bots.test.ts), [bot routing](../../tests/bots-routing.test.mjs), [goals](../../tests/goals.test.ts), [journal badges](../../tests/journal-badges.test.ts), and [welcome](../../tests/welcome.test.ts). Inspected means read, not run; coverage limits are in the source ledger.

For the first implementation batch verify: the player can state their role/next action; planting/harvest/claim leads to discoverable Exchange access; sale consequence is understood; prior equipment is recognized; Pepper cannot duplicate; scene skipping preserves instructions; kitchen substitution stays finishable; reload resumes the correct beat; and both languages preserve action/consequence. Record failed, assisted, skipped, and unrun cases separately. Evaluate later continuity/ending with actual participants before claiming broad appeal.
