# Worlds travel optional activities and online play

Baseline: `6c4477fdc795995fa5d7af6a58f83845591693af`, reviewed 2026-10-17, Asia/Seoul. This document describes executable rules and traced runtime entry points. **Code** means source inspection; **Test source** means assertions inspected, not executed. No new gameplay walkthrough, multiplayer session, test suite, device benchmark, or player study was performed for this record. Large scene and mode controllers remain partly reviewed; the coverage ledger names those limits.

## The exploration structure

**Code.** Home is both the production base and the entrance to optional activities. The eight other planets open by level, offer their own creatures/materials, and return resources to home progression. Discovery and visitation are separate saved lists: approaching a planet in space discovers it; landing also records a visit. Journal conditions named `visited` count landed-on worlds even where a milestone says “Discover.” A designer changing the exploration order should examine both lists and the active story conditions.

The ordinary outdoor movement boundary is a radius of 148 world units. Scenery mainly fills an approximately 138-unit radius, with three decorative border rows starting near 149.5. Indoor and activity spaces use their own walkability rules. World layouts and scenery use seeded placement; visible art loading is separated from the positions of obstacles. Creatures receive clearings so blocking scenery, low scenery, and similar-looking scenery do not crowd their spawn points.

Sources: [planet catalog and story](../../src/content.ts), [discovery/travel rules](../../src/model.ts), [world construction](../../src/world.ts), [navigation](../../src/navigation.ts), [biome planning](../../src/biomes.ts).

| World, in landing-level order | Level | Main identity and encounters | Distinct activities or environmental rules |
| --- | ---: | --- | --- |
| Clover Village, `home` | 1 | Wooden home deck and cabin; Mushroom Forest to the west, Lake Meadow to the south, Chomper Swamp to the north, Redrock Canyon to the east. Ordinary home bosses include Bear, Treant, Crocodile, and Mushroom King. | Home production, cabin services, several fishing waters, rescued friends, optional-mode entrances, and the timed Colossus in the canyon. The home protection boundary is the shared rectangular deck boundary. |
| Toybox Planet, `toy` | 4 | Giant blocks and balls; toy soldiers, wind-up mice, jack-in-the-boxes; Robot boss. | Moving trains, 26 renewable mystery presents, fishing ponds, and two material veins. |
| Candy Planet, `candy` | 6 | Candy trees, canes, gumdrops, donuts and cupcakes; jelly, gummy, lollipop, bunny and chocolate-beetle creatures; Cake, Gingerbread and Jelly Queen bosses. | Fishing ponds and sugar veins. The inspected environment simulation defines no separate candy-only damage hazard; “springy surprises” in descriptive text is not itself an executable mechanic. |
| Wild Jungle, `jungle` | 8 | Dense trees and ferns; monkeys, snakes, chameleons, flytraps; Gorilla boss. | Timed thorn walls, poison areas, restorative fruit, fishing ponds and vine veins. |
| Frost Planet, `ice` | 10 | Snowy pines, ice spires, snowmen; snowball, penguin, ice-blossom, seal and owl creatures; Yeti, Mammoth and Frost Owl bosses. | Slippery movement beyond the landing pad, fishing ponds and ice-crystal veins. |
| Ocean Planet, `ocean` | 12 | Islands, palms and coral; jellyfish, hammerhead sharks, urchins and crabs; Leviathan boss. | Swimming and oxygen, bubble refills, turtle rides, clams, and coral veins. |
| Volcano Planet, `lava` | 14 | Lava pools, stones, high mesas and a dragon nest; magma/fire creatures; Golem and event-linked Dragon. | Tides, vents, weather events, temporary meteor ore, persistent cave access and furnace activation, daily cave treasure, magma/obsidian/fire-crystal resources. |
| Cloud Islands, `cloud` | 16 | Floating islands, cloud trees and sky rocks; cloud sheep, thunderbirds and wind spirits; Phoenix boss. | Bounce links, falling and recovery, wind gusts, lightning, feather veins. |
| Night Planet, `shadow` | 20 | Dark trees and glowing plants; wisps, shadow spiders and demon eyes; Night Lord. | Limited reveal radius, interactable light pillars, healing and creature repulsion inside lit areas, fishing ponds and shadow-essence veins. |

The table lists the base planet catalog and prominent special encounters, not every later-added creature or Titan. Combat encounter details belong with the combat specification. “Boss present” does not imply that every boss is active immediately; the volcano dragon is event-dependent.

## Travel preparation discovery and return

**Code.** The home starship stands at `(13.5, -3)`; other worlds place their ship at the landing pad. The star map can also be opened through cabin navigation. A normal takeoff costs **20 energy**, fills a **100-unit fuel tank**, and enters a piloted, flat space map. The old planet catalog’s `fuel` values are not the current trip-price rule.

| Travel element | Current rule and player consequence |
| --- | --- |
| Manual steering | Hold a pointer to steer toward it, or use W/A/D; S brakes. Shift, Space, or the Boost control boosts. |
| Cruise and boost | Cruise speed tends toward 26 units/s; boost toward 48. Thrust burns 1.1 fuel/s normally or 5/s while boosting. These are simulation values; the interface displays a scaled speed number. |
| Empty fuel | Thrust falls to 35% rather than stopping. Boost ends. The player can crawl toward dust or choose Return home. |
| Stardust | Collect within 3 units in the local simulation: +14 fuel, capped at 100. The progression action grants +3 energy and an 8% star-shard roll; capacity can prevent the shard. Dust relocates after collection. |
| Discovery | Fly within the planet radius plus 45 units. Discovery can occur below its landing level. |
| Landing | The ship must be over the planet, within 1.3 times its radius, and meet its level. A 1.6-second spiral precedes arrival; the ship then performs its landing animation. |
| Space boundary | Beyond 680 units from home, a restoring force pulls the ship inward. Asteroids bounce it; the inspected collision path does not charge health or inventory. |
| Autopilot | Only an already discovered, level-eligible destination whose estimated fuel fits one tank can be chosen. Routes are sorted by landing level, then distance. The highest eligible non-home destination is recommended. |
| Route estimate | `ceil(max(0, center distance − both planet radii) / 26 × 1.1) + 4`, except zero for the current planet. Autopilot bypasses asteroid collisions, runs at 4× simulation time, and offers Skip. Skip deducts estimated remaining cruise fuel and begins landing. |
| Return from another world | Home initiates a free return-flight sequence directly; it does not use the paid normal-launch path. |
| Return while already in space | Sets an autopilot destination of home. At fuel 10 or below, pay 20 energy for a full tank when affordable; otherwise receive at least 40 fuel as a free tow. Above 10 fuel it keeps the existing tank. |

Leaving a world cancels fishing, placement and selected movement and resets combat presentation. Arriving applies the travel/return action before rebuilding the destination. Online launch/discovery/dust actions require a server-recorded paid journey and bounded reported positions; this constrains claims but does not prove honest human steering. A space flight's transient physics are not saved as a resumable flight; the saved planet changes on successful arrival.

Sources: [flight simulation and routes](../../src/space.ts), [launch/arrival orchestration](../../src/main.ts), [return helper](../../src/guide.ts), [ship animation](../../src/ship-sequence.ts), [shared travel rules](../../src/model.ts), [online flight validation](../../server/action-service.mjs). **Test source:** [space tests](../../tests/space.test.ts), [flight authority](../../tests/flight-authority.test.mjs).

## What changes the way each world plays

**Code.** Environment percentages below use maximum health before relevant immunity/resistance and the caller's damage handling. They are hazards, not guaranteed final health losses on every rendered frame. Flying, equipment and invulnerability can change the result. Ordinary world simulation time, wall-clock timestamps, and daily reset dates are distinct.

| Environment | Numbers and behavior to preserve when redesigning |
| --- | --- |
| Ice | Beyond radius 13, velocity eases toward input and decays after release, producing stopping distance. The central landing pad does not use this inertia. |
| Toy railway | Three circular tracks, each with four cars. Contact can cause 15% maximum-health damage and a shove, gated to once a second for the player. Trains also damage creatures: 30% maximum health for ordinary creatures or 4% for bosses per permitted contact. |
| Jungle | Thorns are raised for 16 of each 36 seconds. Contact can take 5% maximum health every 0.6s; poison takes 3.5% every 0.6s without immunity. Fruit regrows after 60 real seconds, heals 30% maximum health, gives either regeneration 4 or haste +30% for 30s, and has a 35% vine roll. |
| Ocean | 18 generated islands; swimming normally runs at 60% speed, flippers restore full speed, turtle riding uses 135%. Oxygen starts at 100, drains 8/s swimming or 4/s with flippers, refills 45/s on land or 60/s in bubbles. At zero, damage can take 6% maximum health every 0.5s. A turtle ride lasts 45s and stops oxygen drain. |
| Cloud | 26 generated islands connected by bounce links. Bounce flight lasts 0.9–2.2s based on distance. Falling returns the player to the last safe platform after 0.8s, taking 12% maximum health unless feather-fall protection applies. Gust warnings run at seconds 18–20 of a 25s cycle; gusts push at 3.2 units/s during seconds 20–23.5. Lightning uses a 1.2s warning, with later attempts 7–13s apart, and can take 12% maximum health. |
| Night | 18 light pillars; lighting lasts 150s and covers radius 8. Lit areas heal 3% maximum health per second and become avoidance obstacles for shadow creatures. Ordinary visibility also considers the player's light radius and glowing flowers. Eclipse state can reduce the nearby reveal radius. |
| Volcano pools | Tide height oscillates from −0.82 to −0.40 over 100s, with storm offset up to +0.28. Stones, rafts, mesas and nest islands offer different safe heights. Lava can take 7% maximum health every 0.5s, multiplied by remaining fire vulnerability. Jumping postpones a due burn until landing if the player remains in lava. |
| Volcano vents | Six phased vents normally use a 140s cycle; eruption weather shortens it to 50s. Each cycle gives a 5s warning then a 3s eruption. Low-ground contact can take 14% maximum health every 0.5s; falling fire can take 12% on impact. High ground, resistance and flying change exposure. |

The weather cycle is **360 seconds**: one weighted event occupies the first **240s**, then calm for **120s**. Weights are eruption 2, meteor 2, storm 1.5, dragon 1.5, treasure 1.5. Selection is deterministic for the cycle index. Local world construction starts an environment clock; online the server initializes its world clock from epoch seconds and broadcasts state, so one should not assume local and server events align after loading.

- **Meteor shower:** 1.8s warning, radius 2.6; a hit can take 30% maximum health, affect creatures and leave a meteor deposit for 90s. Later attempts are 2.6–5s apart near an eligible player.
- **Magma storm:** rising tide plus 1s fireball warnings; fireballs can take 10% maximum health. Attempts are 1.6–3.1s apart.
- **Treasure eruption:** two ore candidates near each vent within 40 units, every 18s after the initial delay; temporary ore lasts 100s.
- **Dragon invasion:** one summon per event. The rules can also summon a dragon during another active event when at least three players are nearby. The event end dismisses it.

Sources: [environment simulation](../../src/environments.ts), [lava weather](../../src/lava-weather.ts), [world environment application](../../src/world.ts), [server environment stepping](../../server/combat-authority.mjs). **Test source:** [environment tests](../../tests/environments.test.ts), [weather tests](../../tests/lava-weather.test.ts). Physical readability, timing fairness and avoidance success are unrun.

## Renewable materials and volcano progression

**Code.** Each non-home planet has two ordinary veins, each ready again after **20 seconds**, granting one of its material: sugar, ice crystal, magma crystal, toy gear, vine, coral, feather or shadow essence. Rewards use the shared storage rule; material collection records a mining event.

Toybox has **26 presents**, each regrowing after **45 seconds**. Weighted outcomes total 17: giant 3, tiny 3, energy 3, full heal 2, explosion 2, toy parts 3, sticky-feet curse 1. Giant gives scale 1.7 and +50% attack for 20s; tiny gives scale .55 and +60% speed for 20s. Energy is 20–60 plus twice player level. Explosion removes 10% maximum health and attacks within radius 4.5 at multiplier 3. Parts yield 2–4 gears and a 15% battery roll. Curse applies −40% speed for 8s. A failed capacity check can refuse an item outcome rather than consume it successfully.

Volcano has an **eight-strike cave gate**. Opening is saved. Fire crystals need two strikes and 120s regrowth; magma ore three strikes and 150s; obsidian four and 180s. Clams on Ocean need three strikes and 150s, returning coral and a 30% pearl roll. Online strikes have a minimum 250ms interval and proximity checks. Deposit yields and bonuses are centralized in the loot tables, so changing a view mesh alone does not change the resource economy.

Each of the three furnace braziers consumes one fire crystal. Lighting the final one also grants two fire cores, one volcano decoration and 2–3 obsidian. All three permanently open the furnace recipe set. The cave chest requires an opened cave and can be claimed once per **UTC calendar day**, unlike the UTC+7 optional-mode day. It grants 3–5 obsidian and 1–2 fire cores, with independent dragon egg 35%, nest decoration 30%, and star shard 50% rolls. A capacity refusal does not count the claim as successful.

Sources: [material and world reward rules](../../src/model.ts), [resource node layout](../../src/environment-resources.ts), [interaction flow](../../src/world.ts), [authoritative resource actions](../../server/action-service.mjs).

## Optional activities entry stakes and durable rewards

### Delvers Vault

**Code.** Talk to Vault Keeper Wren near `(5.8,22.8)` and enter the glowing circle at `(11,27.5)`, outside the south gate. Level 20 is a recommendation, not the start rule's hard level gate. One eligible player is enough to start a **10s countdown**; the party holds at most **five**. Offline neighbours fill empty places, friends first and then stronger neighbours. Their presence does not raise the human party scaling and they do not take rewards. Online the server gathers eligible players in the same room, in arrival order, and creates a private run room.

There are **six entries per UTC+7 day**, consumed on starting, not on completion. A run lasts at most **30 minutes**. Each stage introduces creatures, then its guardian. After a guardian, a portal advances the party immediately when entered or automatically after **8s**. The final room returns players home after **25s**. Home/Leave asks for confirmation; leaving forfeits re-entry to that run. Fainting is handled inside the activity, without a normal death bag; offline return restores at least 30% maximum health. Arena state is transient and not a resumable saved dungeon.

| Stage | Creature composition | Guardian | Guaranteed guardian seal range |
| --- | --- | --- | ---: |
| Glowcap Grotto | 8 lantern gnats +6 truffle beetles | Mother Morel | 4–6 |
| Belfry of Hushed Bells | 8 tin toads +6 wax wisps | Bellwarden Owl | 5–7 |
| Coral Throne | 8 puff urchins +6 squirt shrimps | Queen Anemone | 6–8 |
| Ember Forge | 9 cinder imps +6 bellows beetles | Old Bellows | 7–9 |
| Starfall Observatory | 9 comet sprites +7 moon hares | Moon Moth Empress | 10–14 |

Every guardian has four telegraphed skills. The patterns include circles, lanes, binding, spreading moon dust and finding safe light during eclipse. The common difficulty multiplier is 4.8; guardian health gains another ×1.4 and attack ×1.35. Each extra human adds 35% guardian HP, 20% creature HP and 5% attack; base XP scaling is `round(base XP × 2.52)` and is not multiplied by party size.

Each completed stage rolls the guardian's companion at **25%**, unaffected by luck, and always gives Rune Seals. Ordinary creatures add a seal roll at 35% each; final-stage creature seals can double. The final guardian independently has a **50% Delver's Chest decoration** chance. Stage XP represents its creatures and guardian; rewards use bag/chest stowing. Claims must be sequential, at least **15s** apart, and within the run limit plus a **60s** grace. The controller attempts already-earned, unclaimed stage rewards after exit before closing the run.

Online, the first member's browser simulates the arena and guardian skills and relays them; another member becomes host if it leaves. The server owns membership, start permission, cleared-stage reports and reward clocks/dice. It checks a claim against what the host reported, rather than independently simulating every kill. Damage inside the online vault uses a local health shadow and is restored on exit; it is not canonical overworld damage. Past cleared rooms remain claimable for **two minutes** in the lobby's membership record, also subject to shared claim limits.

Sources: [Vault runtime](../../src/dungeon.ts), [rules](../../src/dungeon-rules.ts), [content](../../src/dungeon-content.ts), [patterns](../../src/dungeon-patterns.ts), [server lobby](../../server/dungeon-lobby.mjs). **Test source:** [dungeon rules and patterns](../../tests/dungeon.test.ts), [lobby integration](../../tests/dungeon-lobby.test.mjs).

### Flag Rush

**Code.** Gatekeeper Orrin and the Multiworld Gate are outside the south gate, near `(-6.8,24)` and `(-12,29)`. Flag Rush is playable against AI in **1v1, 2v2, 3v3, or 5v5**. The player selects one of ten heroes and plays blue. All match stats normalize to **level 8**, with four skills available; borrowed appearance and match health are restored afterward. This remains local AI practice when signed in. Online human matches are disabled. Lane Clash and Last One Standing appear as unavailable choices, not implemented activities.

Capture the enemy flag and return to the own stand while the own flag is home. First to **three captures** wins. A match has a **3s intro**, **8-minute** ordinary time and, on a tie, **3-minute golden-point overtime**; a remaining tie can draw. Carriers run **15% slower**, are revealed, cannot teleport, and drop their flag when downed. Teammates return a dropped flag by touching it, otherwise it returns after **15s**. Respawn takes **5s**, followed by **2s** guard. Bridges and jump pads cross the river.

Power-ups start after **8s**, then every **22s**: speed +60% for 6s; 350-point shield; delayed pumpkin explosion; 5s invisibility unless carrying; giant form for 8s with ×1.3 damage and ×.7 damage taken; 1.5s nearby freeze; or full heal.

The reward is **EXP, not energy**: win 600, draw 200, loss 0; plus 120 per capture (up to six), 40 per return (up to ten), and 10 per knock-out (up to twenty). Team size multiplies this by `1 + .075 × (size−1)`, capped at **1,400 base EXP** before the character's XP modifiers. Up to **12 paid matches per UTC+7 day**. A match under **45s** is ineligible; leave/forfeit grants zero. Duplicate IDs, implausible counters and overlapping claim times are rejected. Rewards can be server-applied when connected, but the server does not simulate the match.

Source: [Flag Rush runtime](../../src/ctf.ts), [content](../../src/ctf-content.ts), [rules/reward formula](../../src/ctf-rules.ts), [claim validation](../../src/ctf-claim.ts), [save fields](../../src/ctf-save.ts). **Test source:** [Flag Rush](../../tests/ctf.test.ts), [controller regressions](../../tests/ctf-regressions.test.mjs).

### Rescue Call

**Code.** The normal entry is a permanent Rescue portal at `(2.5,35)`. It offers Toybox at level **4**, Candy at **6**, and Jungle at **8**, without requiring planet discovery or a random SOS. The source still contains SOS data describing 30–60 minute calls, a first call at six minutes, and four calls/day; the inspected normal `sosFrame` does not invoke that scheduling. `callNow` remains an exposed hook. Those constants should not be described as a current player-facing schedule.

The player leads up to **five total members**: the hero plus up to four rescued helpers or neighbours. Helpers have fighter, ranged and support roles; unknown neighbour roles are spread across the least-used roles. Gear, Spark, Star bits, defences, squad ladder and hero boosts belong to the mission only. The hero's combat is normalized to its recommended level. Rescued friends' ordinary inventories and gear are not consumed by the borrowed mission ladder.

Defend **ten hearts**. Start with **150 Spark**, no Star bits, and **40s** to build; between waves allow **25s**, with a Start wave control to skip the remaining wait. Normal leaks cost one heart; bosses cost three. Falling members retreat for **15s**, hero for **5s**. Exhausting hearts loses the mission; three leaks while every non-hero squad member is down also lose it. A hero with no companions cannot lose through this routing rule. Toybox has **6 waves**, Candy **7**, Jungle **8**, with its Robot/Cake/Gorilla in the final wave. Enemy HP grows ×1.18 per wave and gains ×1.4 on the boss wave; damage grows ×1.06. A clear gives `40 + 10 × wave number` Spark and one Star bit.

There are five three-level defences: fast anti-air popcorn turret, chaining anti-air Tesla, ground splash cannon, blocking wall, and frost lantern. Initial costs are respectively **50/80/90/40/60 Spark**. Defence selling refunds **60%** of total spend. Companion ladder steps 1–6 cost **35/45/60/75/90/110 Spark** plus **0/0/1/2/3/4 Star bits**, progressing from a starter weapon through outfit, better weapon, disguise/skills, armour and ultimate. Hero boosts purchase damage, haste, cooldown reduction, healing or a temporary shield.

Portrait rotates the field so enemies enter from the top. Three core lanes exist on narrower views; landscape at least **900px** wide adds lanes and pads. Changing screen orientation after entry does not regenerate the initial field selection. This is a meaningful gameplay variant, not just a different interface layout.

| Mission | Per cleared wave before modifiers/caps | Full-win additions |
| --- | --- | --- |
| Toybox | 80 EXP +70 energy | +200 EXP; 6 pumpkins; teddy decoration; 6% Viking-hat roll |
| Candy | 100 EXP +90 energy | +200 EXP; 6 candy blooms; rainbow decoration; 6% Viking-hat roll |
| Jungle | 120 EXP +110 energy | +200 EXP; 6 mangoes; giant-forest-flower decoration; 6% Samurai-hat roll |

At most **80 waves/day** pay wave rewards and **eight wins/day** receive full wins and gifts, resetting at **UTC+7 midnight**. A later win reduces its remaining eligible wave EXP/energy to **25%** and gives no gift. The first victory in each mission also records its “Hero of” badge. A claim needs at least **18s per cleared wave**, at most **one hour**, and sufficient spacing since the prior claim. Leaving can preserve cleared-wave rewards. No normal death bag is created; pre-mission health returns on exit or reload. Every exit, including a reload recovery, starts a **three-minute device-local recovery timer** before another entry. Match state itself is not resumed. The runtime remains local AI when signed in; online claims check time/level/caps, not a fully server-simulated mission.

Sources: [Rescue runtime](../../src/rescue.ts), [content and costs](../../src/rescue-content.ts), [run rules](../../src/rescue-rules.ts), [borrowed gear ladder](../../src/rescue-ladder.ts), [claim validation](../../src/rescue-claim.ts), [save scope](../../src/rescue-save.ts). **Test source:** [Rescue](../../tests/rescue.test.ts), [camera geometry](../../tests/rescue-camera.test.ts), [opt-in browser coverage](../../tests/rescue-view-browser.test.mjs).

### Cinderpeak Colossus

**Code.** The daily window runs **08:00–24:00 UTC+7**, with a **10-minute** advance warning, at `(78,0)` in Redrock Canyon. This is **10:00–02:00 the following day in Korea**. It is a stationary large boss with a rotating set of stomp, bite, slap, breath, grab, spit, sweep, meteor and roar attacks. Kneeling starts below **25%** HP; attacks speed up below **50%** and again around **30%**. A reachable lowered head takes **×2.5 damage**.

| Edition/choice | Base HP with one explorer | Other effects |
| --- | ---: | --- |
| Online | 3,000,000 | Server-owned event; local soothing/sleep choice does not change it. |
| Solo Wild | 1,000,000 | Full solo attack strength, global darkening while awake. |
| Solo Soothed | 200,000 | Attacks approximately 50× lighter; sky remains bright. |
| Solo Asleep | No encounter | No event sky, banner or fight. |

The default Automatic choice sleeps below **level 20**, then becomes Soothed. Full Wild strength requires an explicit choice. Controls now belong to the cabin **Bookshelf**, despite older comments calling them the Ember Well. Solo encounter size scales from nearby visible explorers, including neighbour representations, at **+80% HP per extra**; online spawn size counts home-room players. These are spawn-time values, not a promise of continually rescaling every join/leave.

Full attack has base 3,200 and pierces **75% defence**. Stomp can halve outfit defence for 30s on a 35% roll; breath scorches defence for 12s and burns for 6s at 3% maximum health per 0.6s; grab throws and can take 25% maximum health on landing; roar stuns for 2s unless protected near a foot. Soothed damage reduction also affects these special effects and local minions. Attack telegraphs and safe positions need observed fairness checks.

Solo reward participation requires a hit within the final **20s**, with AI neighbours excluded from reward eligibility; their damage is capped at **1,200 per hit**. Base reward is **30,000 XP**, normal loot includes crown 15%, 4–8 heartstones, 6–10 star shards, 3–5 star seeds, 4–6 fire cores, royal crown 50%, and 1–3 dragon scales at 60%. Luck can increase eligible low-probability rolls. The final human blow additionally stows Little Cinderpeak directly. Solo material loot appears on the ground. A neighbour can land the last blow, leaving an eligible player their ordinary share but no final-blow companion.

Roar hours start at **02:00, 12:00 and 19:00 UTC**, each for one hour. They add **25% XP and probabilistically rounded +25% loot-stack quantities in solo only**, where the daily boss window and awake choice also permit a fight. Online they are presentation, not an additional reward multiplier. Note that a roar hour outside the daily awake window does not independently wake the boss.

Solo records today's defeated day in a device-local storage key, not an adventure-slot field. Online each home room holds its own Colossus kill state in memory. Server restarts/empty-room recreation and profile switching therefore deserve explicit event-continuity testing rather than assuming a durable global once-per-day kill lock.

Sources: [Colossus data and clocks](../../src/colossus-content.ts), [sleep choices](../../src/colossus-sleep.ts), [runtime](../../src/colossus.ts), [attacks](../../src/colossus-patterns.ts), [rewards](../../src/colossus-rewards.ts), [server encounter](../../server/colossus-authority.mjs). **Test source:** [server encounter](../../tests/colossus-server.test.mjs), [roar hours](../../tests/roar-hours.test.ts).

## Solo server and authority boundaries

**Code.** Pages builds set static-host mode and use the `/cute_game_boat/` deployment base. They support local progress and optional AI play; they do not create account sessions or WebSockets. If an online-server URL is configured at build time, the title can check public health and link to the server, and the leaderboard can display its public real-player board. This optional read-only networking differs from multiplayer participation.

The server edition can create an independent account adventure using username/password, with no email. Signing in retains the local adventure separately; signing out restores it after pending online actions finish. Only one browser connection per account is active; another tab replaces it and stops the old tab's online work. A global default cap is **60 connected players**, and a world room holds **24**. A private party code separates the party's planet rooms. Home gardens are private spaces even when their explorers share wild areas. Visiting is limited to friends and does not replace the visitor's saved travel destination.

| System | Who decides the result |
| --- | --- |
| Solo economy/progression | Browser applies shared rules and saves locally. Device clock affects real-time progress and scheduled activities. |
| Online purchases, crops, crafting, upgrades, rewards | Server applies explicit intents against its canonical profile using its clock and dice; client-save uploads are rejected. |
| Online ordinary combat | Server calculates hit values, health, cooldowns, projectiles/effects, deaths, rewards and durable health changes. Elected browser host still supplies bounded creature positions and some AI phase/contact reports. |
| Online environment | Server steps the shared environment and weather and broadcasts snapshots. Clients render and predict between updates. |
| Online Vault | Server lobby and reward authority; browser-hosted arena simulation. |
| Flag Rush and Rescue | Browser-local AI simulation even when connected; shared/server reward validation covers plausibility, duplicate claims, timing and caps. |
| Online fishing/flight | Server owns tickets, catches, dust and rewards with position/telemetry checks. Supplied telemetry remains client-originated input. |

Online home protection, accepted movement and proximity are validated independently of the shown coordinates. Poses use a replenishing movement budget rather than unrestricted teleports; rejected movement can snap the client back to the last accepted position. This is cooperative multiplayer with bounded client trust, not a complete anti-cheat simulation.

Sources: [online client](../../src/online.ts), [bridge contract](../../src/game-bridge.ts), [HTTP/WebSocket server](../../server/server.mjs), [action service](../../server/action-service.mjs), [combat authority](../../server/combat-authority.mjs), [movement budget](../../server/pose-budget.mjs), [Pages build](../../server/build-pages.mjs).

## Social rewards shared loot ranking and announcements

**Code.** Friends can visit, water, gift, exchange private messages and attempt ripe-crop collection. Visiting a protected garden can trigger its guard dog. Messages and social events enter a 30-entry guest diary; unsolicited notices can go quietly into the News inbox while fighting. World chat is room-scoped and its last local history is transient. Unconfirmed chat retains the draft and request identity for retry instead of silently clearing it.

Ordinary online combat tracks recent contributors for **30s**; Colossus uses **one hour**, unlike solo's 20s rule. Contributors receive progression/XP via their own profile updates. In the inspected `kill` path, loot is rolled for each contributor with immediate banking disabled, but only the killer's rolled material list is retained as shared ground drops. These last **30s**, with **10s killer priority**, and the owner can release nearby protected loot sooner. Do not describe this as independently banked material loot for every contributor. This behavior and its fairness need an isolated two-player check before choosing a redesign.

The leaderboard offers weekly EXP, harvests, fish, kills and bosses; all-time adds level and largest fish. Top **50** display, with one's own place reported separately. Ties share ranks as 1,2,2,4. The week starts **Monday 00:00 UTC**. Online authoritative gains update weekly counters; a reset does not subtract earlier weekly gains. Server boards cache for up to **45s**. Local boards compare the player with five deterministic AI neighbours and are explicitly a neighbourhood board. A configured Pages build can show a public remote board without joining it.

There are two related announcement systems: the saved personal News inbox holds up to **50** entries, while published update/coming-soon cards come from `public/news.json` inside the leaderboard's News section. Read update IDs and the pop-up preference are device-local. Pop-ups are **off by default**. Fresh saves mark already-published updates read to protect the first minutes. Existing returning-save auto-open waits for a started, idle game and respects the preference; automated browsers suppress it unless explicitly enabled. Test walkthroughs can consequently miss a returning player's announcement experience.

Sources: [social client](../../src/online.ts), [action service](../../server/action-service.mjs), [online kill/drop path](../../server/combat-authority.mjs), [ranking rules](../../src/ranking-logic.ts), [ranking dialog](../../src/ranking.ts), [server board](../../server/ranking.mjs), [News inbox](../../src/news-inbox.ts), [update board](../../src/news-board.ts).

## Saving retrying and recovering

**Code.** Browser save families use the `cute-game-boat:` namespace, preventing this fork from reading or overwriting the original game's unprefixed saves. Device settings and some event/recovery flags are not account-synchronized or slot-specific; review those deliberately when changing profiles or devices.

Offline SaveGuard supports save version **1**, content version **3**. Unreadable saves are copied aside before a replacement can be written, retaining the last **three** corrupt backups. A newer-format save freezes writes; if another tab writes newer progress or clears the save, the old tab also stops writing. Settings can restore a corrupt backup and reload. If browser storage cannot preserve a corrupt copy, saving stays frozen. This is protection against accidental overwrite, not cloud backup or recovery after the browser's data is removed.

Online actions are a serialized queue of intents with immutable request IDs and revisions. Uncertain network results retain the same ID. A 409 conflict reloads canonical state and retries up to three times; expired or incompatible receipt responses (410/426) refresh state and retire unsafe old work. Network/server failures remain pending and back off from **0.5s to 5s**. A returning account loads up to **100** queued jobs from device storage. Signing out is refused while pending work remains, preventing it from being represented as safely saved. “Save now” flushes intents; it does not upload arbitrary client state.

The server stores at most **512 action receipts per account** and preserves an origin-revision floor. Replaying a known ID returns its original result with the latest canonical profile, without awarding it twice. Related account changes, drops and receipts commit transactionally. File storage writes and renames a complete replacement before publishing it; PostgreSQL uses row locks and transactions. A configured database failure does not fall back to an empty local database. Sessions last **60 days**, store token hashes, and can survive server restarts. Accounts/profiles/friend relationships persist; connected rooms, parties and chat do not. The architecture expects one server instance because live world state is in memory.

Production builds generate a service worker scoped to the deployment base. Hashed files use cache-first exact-version URLs; navigation and unversioned files prefer network with cache fallback. Models can be fetched on demand and retained. API/socket traffic bypasses that cache. “Offline installation supported” does not guarantee that every unvisited world or model is already present before a background download completes.

Sources: [save guard](../../src/save-guard.ts), [recovery UI](../../src/save-guard-ui.ts), [online queue](../../src/online.ts), [account storage](../../server/account-store.mjs), [schema](../../server/schema.sql), [cache generator](../../server/build-offline.mjs), [cache strategies](../../server/sw-logic.mjs). **Test source:** [receipt recovery](../../tests/receipt-recovery.test.mjs), [offline-cache fixtures](../../tests/offline.test.mjs), [online session fixtures](../../tests/online-session.test.mjs), [network integration](../../tests/network.test.mjs), [static-host behavior](../../tests/static-host.test.mjs).

## Review questions raised by the current implementation

These are source-grounded discrepancies or **Hypotheses**, not accepted gameplay changes or playtest findings.

| ID | Question or discrepancy | Evidence needed before changing the game |
| --- | --- | --- |
| WO-01 | Current README describes Flag Rush energy, recurring SOS, and unqualified Colossus health/head damage that differ from current rules. | Correct verified documentation; check remaining instructions against live entry routes. |
| WO-02 | Rescue's permanent portal and three-minute recovery may be simpler than the older SOS model, but the result screen still encourages immediate replay. | Natural completion/exit/replay observation on desktop and phone; decide the intended stopping cadence. |
| WO-03 | Optional activities introduce normalized stats, borrowed gear, local-only simulations and several clocks alongside normal progression. | Ask players to explain what carries out of each activity, why it is useful, and when another reward is available. |
| WO-04 | Online material contribution behavior differs from a plain “everyone gets loot” expectation. | Isolated two-account kill, drop inspection and pickup/release tests; compare intended cooperative reward policy. |
| WO-05 | Colossus kill/strength controls have device/room scope rather than one durable global daily state. | Profile-switch, room-empty/recreate and server-restart scenarios, without changing real player progress. |
| WO-06 | Ordinary world time, UTC cave day, UTC+7 mode day, UTC leaderboard week and local device flags are mixed. | Boundary-time tests and returning-player comprehension, including clear labels in the chosen language. |
| WO-07 | Late-game hazards can remove large maximum-health shares, with different controls and wider-screen Rescue layouts. | Physical-phone avoidance/readability observations, keyboard paths, and matched-session pacing across supported player situations. |
