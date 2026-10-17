# Character and combat

Baseline: `6c4477fdc795995fa5d7af6a58f83845591693af`, reviewed 2026-10-17 (Asia/Seoul). This describes implemented source behavior. No gameplay playthrough, benchmark, player study or automated suite was run for this chapter. A read-only Node import inspected effective catalogs after initialization. Cited tests were inspected, not executed. Coverage and remaining limits are recorded separately.

## Player purpose and the combat loop

Players develop an explorer through XP, permanent stat purchases, equipment, gear levels, skills and companions. A fight involves selecting/approaching a creature, choosing range, attacking between warnings, using skills, avoiding or absorbing damage and collecting the result. Defeats grant XP/loot and advance journal goals; first boss/titan defeats can award a little companion. Production, shops, crafting, cooking and travel support this loop.

The home safe area is a strict rectangle `|x| < 20, |z| < 22`; other planets use an 11 m circle. Solo kills within 24 m of a protected player can still pay; distant deaths do not. Online rewards use server rules. Pets wait at home and follow outside safety. See [safe-zone.ts](../../src/safe-zone.ts), [main.ts](../../src/main.ts) `grantDefeat`, [model.ts](../../src/model.ts) `grantDefeat`.

Click/tap selects a creature and the world approaches and attacks. Standing still can automatically select a nearby living visible creature when there is no selection, movement, route, menu, fishing, placement or guide hold. Automatic selection scans an edge gap of 6 m for guns and 2.4 m otherwise; landing the attack still uses the weapon's range/cooldown. Selecting, approaching and striking are distinct steps.

## Controls and edition variants

| Context | Current behavior |
| --- | --- |
| New save keyboard | Absent `keyboardLayout` selects WASD: WASD movement, J/K/L/; skills, P journal. Arrow keys also work. Only exactly `classic` selects arrows with Q/W/E/R skills and J journal. |
| Default solo | Per-device Jump and air combat defaults on. Space jumps; F is contextual use/attack, N dedicated attack. Space can instead attack with Left Shift jump; custom bindings can override defaults. |
| Air switch off or online action handler present | Jump/air mechanics are off. Space attacks. Original base skills run; Lob/Rush/Quake, air attacks, timed combo/streak/power are unavailable. |
| Touch | Attack/Jump and skill buttons around them; fourth skill sits above the three. Pure layout minima: 60 px Attack, 52 px Jump, 48 px skills. Optional movement joystick. |
| Fresh Attack press near a service | A hostile target/in-range creature takes priority. Otherwise a reachable usable thing is used once at least 0.5 s passed since last swing. Held attack keeps fighting. |
| Hold Attack, air system on | Repeat at weapon pace; with power ready, hold 0.35 s to unleash. Release/slide off cancels hold. |
| Hold Jump | Uses available extra jumps at each arc's top. Does not automatically jump again after landing. |
| Jump touch slide | Same finger can slide to Attack/skill; release there or 0.06 s dwell fires one move. Other fingers remain independent. |
| Skill information | Hover or long press; long press shows tip for 3.5 s and does not cast. |
| Weapon pair | Tab/swap button; Auto also responds to target distance. |

Composition and Ctrl/Meta/Alt combinations do not trigger gameplay shortcuts. Input sources are tracked independently. These rules exist in source; they do not establish usability or physical-device behavior.

Sources: [gameplay-controls.ts](../../src/gameplay-controls.ts), [jump-rules.ts](../../src/jump-rules.ts), [attack-intent.ts](../../src/attack-intent.ts), [five-rules.ts](../../src/five-rules.ts), [main.ts](../../src/main.ts) input handlers, `syncAirCombat`, `stepHold`, `autoAttack`.

## Statistics and damage

Let L be explorer level, H/A/D/C purchased stat ranks, E(key) the sum of active gear stats after gear levels, and B(key) a live consumable buff. Stowed weapon is excluded. Side gun held contributes half its attack; both worn pet slots count.

| Statistic | Implemented rule |
| --- | --- |
| Maximum HP | `100 + 10*(L-1) + 25*H + E(hp)` |
| Attack | `(10 + 1.5*(L-1) + 3*A + E(atk)) * (1 + heldForge/100) * (1 + B(atk))` |
| Defense | `4*D + (L-1) + E(def) + B(def)` |
| Base movement | `6 * max(0.2,1+E(speed)+B(speed))` m/s, before combat movement bonuses. |
| Critical chance | `min(0.85,0.05+0.025*C+E(crit)+B(crit))` |
| Critical damage | ×4 normally; own solo jump/jump-origin criticals use ×8. |
| Regeneration | `E(regen)+B(regen)` HP/s in active solo `tickEffects`. |
| XP | Input multiplied by `1+active XP bonus` and difficulty reward factor. |
| Next level | `round(25*max(1,L)^1.55)` XP; excess carries; level-up fills new HP maximum. |
| Late milestone | Every fifth level strictly above 25: `500*level` energy and one moonstone. |

Permanent purchases cost `ceil(base*1.38^rank)`: bases 12/15/14/18 for health/attack/defense/critical, giving +25 HP/+3 ATK/+4 DEF/+2.5 percentage points critical. Critical purchases cap at 28; overall 85% cap remains. Health purchase heals 25 rather than filling HP.

A hit rounds attack x move factor x skill factor x status factors x own streak x critical x random 0.9–1.1, with minimum 1 and any raw-hit cap. Status factors include giant 1.6, opening stealth 3, marked target 1.5, torch rally 1.3, and pet surge boss opening 1.15 on own hits. Later target processing can apply barrier, Magma Turtle armor or stagger. A simulation cap should not be assumed to cap final HP loss after every later modifier.

Incoming damage after guards is `max(1,round(incoming*60/(defense+60)))`. Skill defense adds giant 20, tank 30, sandbag 60 while inside cover, knight taunt 80. Actual damage grants 0.55 s player invulnerability. Dash/shield/invulnerability can reject the hit first; knight shield blocks frontal hits and can reflect shots for ×1.5 attack. Solo flight rejects melee, but is not universal invulnerability. Taking damage interrupts fishing.

Consumable buffs share one entry per key. Weaker applications do not extend a stronger live effect. Equal/stronger applications retain the stronger value and set duration to `min(600,newDuration+oldRemaining/2)` seconds. They expire by wall clock, while combat statuses use simulation time. Stolen life is capped across sources at 6% max HP per simulation second, using the host-returned accepted amount when numeric; otherwise it assumes the attempted amount. The inspected solo main callback returns void, so rejection or overkill reduction is not reflected through that return value. Pets/most summons do not grant ordinary owner life steal; vampire bats explicitly heal through the same cap.

Sources: [model.ts](../../src/model.ts) `activeStats`, `weaponStats`, `gainXp`, `upgrade`, `addBuff`; [combat.ts](../../src/combat.ts) `damage`, `leech`; [main.ts](../../src/main.ts) `world.onDamage`, `combat.edge.crit`; [difficulty.ts](../../src/difficulty.ts).

## Equipment and upgrades

Slots: weapon, side, hat, outfit, boots, pet, pet 2, disguise. Worn items remain quantities in the bag; loose-quantity rules protect equipped copies. Two copies are needed for the same pet in both slots. Equipping hat/outfit/boots removes disguise; disguise changes visible form and four skills. Active gear still contributes stats. A combat weapon in hand determines basic attacks even in costume; absent one, costume provides its own weapon. A rod does not override a disguise's combat weapon. Otherwise fists use profile range 1 m/cooldown 0.5 s.

Automatic tool selection picks best owned rod near water/while fishing if not fighting. Combat restores manual/remembered weapon; absent one, highest attack, then range, then quicker cooldown and stable ID. Manually removing weapon records fists and prevents automatic re-equip away from water. Saves substitute remembered combat weapon for a context-held rod. With side gun, automatic main choice excludes guns. [context-gear.ts](../../src/context-gear.ts), [model.ts](../../src/model.ts) `equip`/`unequip`.

Normal buy/equip gates late special gear by source-world landing level: Toy 4, Candy 6, Jungle 8, Ice 10, Ocean 12, Lava 14, Cloud 16, Shadow 20; home pieces have no higher gate. Vault pets use 20, dyes follow base. Legacy worn gear can remain. Side-slot helper itself checks level 15/gun/ownership rather than calling normal equip. [level-gates.ts](../../src/level-gates.ts).

Weapon pair opens level 15. One gun can be side; a main gun frees side. Auto draws gun beyond 4.5 m target-edge gap, main below 3 m, keeps hand between. Forced swap holds 3 s before Auto overrides. Swap gap 0.6 s, draw delay 0.15 s, next own hit ×1.2; pet hit does not consume it. Swap restarts basic chain. Hand is transient and reload begins main. [weapon-pair.ts](../../src/weapon-pair.ts).

| Track | Effect and maximum | Cost from current rank r |
| --- | --- | --- |
| Weapon forge | Maximum +15; each rank adds 1% to complete pre-buff attack when held. Rank is shared by item ID. | Energy: 80 + 60r. Bone and leather: 4 + 2r each. Star shards: 1 + floor(r/3). From rank 5, moonstones: 1 + floor((r-5)/4). From rank 10, firecores: r-8. |
| Gear bench | Maximum +10; hats, outfits, boots and pets interpolate six stats toward their slot ceiling. Rank is shared by item ID. | Energy: (60 + 40r + 10r²) times max(0.5, 1.5 × gapShare), rounded to nearest 5 with minimum 5. Leather: 2+r. Bone: 1+floor(r/2). From rank 5, star shards: r-4. From rank 8, one moonstone. |
| Own skills | Four slots, maximum +5. Disguise kits are not raised by these ranks. | Energy: 120(r+1)², giving 120, 480, 1,080, 1,920 and 3,000. Bone: 3+2r. From rank 1, star shards: r. At rank 4, one moonstone. |

Forge succeeds 50% through+5, 30% afterward. Failures consume costs without downgrade. Rods excluded. Materials use bag and chest while home. Bench shows odds and expected costs. Gear stats interpolate `base+(ceiling-base)*rank/10`; utilities such as light/lava-proof/flippers/XP/luck stay item-specific. Pet shot/guard instead scales 1+0.04 rank, ×1.4 at+10. Keepsakes excluded from gear leveling.

| Slot ceiling at+10 | HP | DEF | ATK | Regen/s | Crit | Speed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Hat |210|42|31|7|15%|22%|
| Outfit |126|40|12|4.5|8%|18%|
| Boots |28|12|0|0|0|25%|
| Each pet |210|35|23|8.5|10%|20%|

Per own-skill level: slot 1 +10% damage/+0.12 m radius; slot 2 +10% damage/-0.2 s cooldown; slot 3 +8% damage/+0.3 m radius; slot 4 +8% damage/-4% special cooldown. Air rules also apply slot 4 level to third chain hit and Sky Spin. Final cooldown divides by max(0.2, 1+haste); costume gets haste, not own-skill levels. Ground/air Lob-Rush-Quake cooldowns are independent arrays.

Sword growth is 0.8*(forge/15)+0.2*(tier/2), tier 0 basic/1 special/2 rare-or-dye. Real bonus reach maximum 0.5 m (basic+15 gives 0.4); wind length can reach 1.6 x/brightness 1.55 x. Guns do not gain reach. [upgrades.ts](../../src/upgrades.ts), [gear-ceiling.ts](../../src/gear-ceiling.ts), [skill-upgrades.ts](../../src/skill-upgrades.ts), [weapon-forge.ts](../../src/weapon-forge.ts), [weapon-growth.ts](../../src/weapon-growth.ts), [upgrade-bench.ts](../../src/upgrade-bench.ts).

## Basic attacks and skills

Melee arcs can hit several targets; guns generally stop at first body, waves/some special shots pierce. Swept collision prevents fast shots tunneling through a body; obstacles stop them. Spread basics use 0.45 multiplier per pellet. Base attack interval is weapon cooldown/max(0.2, 1+haste).

Default solo ground chain resets after 1.2 s:

| Kind | First | Second | Third | Third result |
| --- | ---: | ---: | ---: | --- |
| Sword |0.99|1.10|1.375|Launch ordinary radius<1.2 bodies 1.7 m; stronger knock.|
| Fists |1.05|1.16|1.46|Same small-body launch.|
| Gun |0.90|1.00|1.25 total|Two half-power shots 0.09 s apart.|

These are attack multipliers before other factors. Without chain, sword basics ×1.1, fists ×1/×1/×1.5, guns ×1 before spread. Gun cabin practice can fire along facing without inventing a creature. Solo whiffs can animate/respond to scenery without granting a creature hit.

| Slot, air system on | Ground | Air | Base cooldown |
| --- | --- | --- | ---: |
| Petal Gale/Lob |Chosen target/nearest/fallback 6.5 m; lock landing 4–9 m away, 0.25 s windup+0.6 s flight. Core<=0.8 m ×2.6, splash 2 m ×1.3.|Petal Rain: three ×0.9 hits under/ahead 1.3 m apart; radius 1.3; land 0.28/0.38/0.48 s.|6 s|
| Breeze Step/Rush |0.12 s windup, 6 m at 30 m/s, ×1.6 each target once within 1.2 m path width plus radius; 0.3 s recovery. Dash itself invulnerable.|Same damage/distance while holding height; steer once after halfway by>0.5 rad.|4 s|
| Root Quake/Quake |0.35 s windup, ×2.4 ring 3.5 m, lift 2.5 m; 0.6 s stun on large/boss, 0.35 s recovery; resistance applies.|Sky Quake ring 4.5 m, ×2.2 at 0 m interpolates to 2.5 at 2 m/3.2 at 3.3 m/4 at 4.4 m; raw boss cap 15%. Main landing ALSO adds light dive when height qualifies.|7 s|
| Crown |Weapon special, or outfit uniform replacement.|Same special; costume replaces whole kit.|By special|

Classic/offline switch-off or online instead uses: Petal Gale spin ten ×0.55 ticks every 0.22 s, radius 3.4 m sword/2.8 m otherwise, 7 s CD; Breeze Step 7.2 m protected dash ×1.7, 4 s CD; Root Quake lands at 0.42 s ×2.3/radius 4.4/stun 0.8/lift 2.5, action lasts 0.8 s, 9 s CD. Fourth remains weapon/uniform special. Delayed simulation effects pause with simulation.

Weapon specials cover repeated fists, crescent arc, rush, piercing waves, pea spray, trapping bubble, thorn/ice novas, lava pillars, chained lightning, hammer stun, cyclone pulses, starfall, fire bursts and 14 m laser. Army/navy/Ao dai/Ao dai gentleman/USA/Vietnam outfits replace special with volley/anchor/lotus/dragon/eagle/goldstar when no disguise. Effective catalog table below maps items. [combat.ts](../../src/combat.ts) `basic`, `chainHit`, `skill`, `move`, `special`; [moves.ts](../../src/moves.ts); [uniform-skills.ts](../../src/uniform-skills.ts); [main.ts](../../src/main.ts) `ownSkills`, `skill`, `onLanded`.

## Jump, dodge, combo and power

Jump height does not bypass normal ground collision. Gravity 70 m/s²; rises 2 m, +1.3 m, +1.1 m (best-timed total 4.4 m), first-jump airtime~0.478 s. Landing lag 0.12 s/plain, 0.32 s/dive; input buffer 0.12 s. Double jump: explorerL 10, 600 energy, 6 bone. Triple: L 25, 2400 energy, 10 bone, 3 shards. Tester has three. Saved upgrades persist even while online air play is disabled.

Ground-class attacks miss at height>=0.9 m; body attacks can hit airborne player. Ground classes include slam/quake/low ordinary rush/burst/lava, titan leap/donut/stomps/pools, Colossus stomp/slap. Beams/shots/bites/swings/grabs and many falling attacks are body. Exact table: [jump-rules.ts](../../src/jump-rules.ts) `ATTACK_CLASS`. With air rules, ordinary windups minimum 0.35 s and boss slam adds aftershock 0.55 s later at 80% first damage.

Perfect dodge requires enough height and takeoff within 0.25 s (keys)/0.4 s (touch) of ground attack. Solo freezes 0.14 s and guarantees next own critical within 2 s. Boss low-hit blocking table exists but **BOSS_BLOCK_ON=false**, so its low-height guard is not current behavior.

Rising Attack: fists/blades ×0.8 spin, minradius 2.2 m/blade reach capped 3.4 m, cooldown 0.32 s before haste, 0.12 s stall. Gun ×0.8 shot, brief recoil stall. Falling Attack at>=0.9 m begins light dive at 34 m/s: radius 2.4 m (blade up to 3.4), damage x(0.45+0.1*startingHeight), raw boss cap 20%. From>=2.2 m using>=2 jumps it guarantees critical on boss/radius>=1.2 target. Touch can drift<=1.4 m toward nearest target within 3.6 m through normal obstacles. Late-fall presses buffer 0.5 s for ground action.

Combo window 1.5 s keys/2 s touch; hits<0.08 s apart count once. Three earlier hits prepare ×1.25 finisher for dive/Quake. Separate untouched streak adds 1.5% per counted own hit capped 30%; actual damage breaks it, 20 s without hit expires it. Zero-damage guard/dodge does not break. Display counts are not economy rewards.

Power: 20 qualifying hits ready, 40 overcharge; its own strike does not refill. Each new level gives 12 s use window, blink last 3; expiry falls to 10 hits. Hold Attack 0.35 s spends, then ground windup 0.1 s/recovery 0.3 s. Single target ×5/×8.5; shared across targets with per-target floor 1.25/2. Raw boss cap 15%. Strike resets untouched multiplier while applicable statuses/critical/target modifiers remain. Sword wave 7 m length/1.6 m halfwidth, fist cone 4.6 m radius, gun beam 11 m/0.75 m halfwidth, airborne landing ring 4 m. Overcharge dimensions ×1.25. Death/reset clears power/streak. [five-rules.ts](../../src/five-rules.ts), [power-rules.ts](../../src/power-rules.ts), [air-cast.ts](../../src/air-cast.ts), [main.ts](../../src/main.ts).



Credit boundary: main calls noteComboHit when a hit is not remote, not a hazard and lacks helper=true. Pet/dog shots set helper=true. Summons use source=summon but do not set that helper flag in CombatSimulation.damage, so their hits can reach the same combo/power path. The comments describe own-hit credit; exclusion of summons is not implemented by this filter. Validate with a controlled summon-only fight before tuning charge timing.

## Disguise kits

Seventeen forms replace four skills. Held combat weapon still determines basic attacks; built-in weapon is fallback. Own skill ranks do not level kits, but haste shortens cooldown. Parameters are [combat.ts](../../src/combat.ts) `DZ`, `GAZE`, `BOULDER` and cast code; labels/cooldowns in [content.ts](../../src/content.ts). Table gives exact representative effect rules in slot order; effective catalog below supplies all cooldowns/prices.

Effect units: × is a damage multiplier on current attack before other modifiers; m means metres and s means seconds. Percent heals use maximum HP. Each row lists the four skills in slot order; the later catalog gives each skill's base cooldown.

| Form | Four current effects |
| --- | --- |
| Superhero | Fly for 12 s at +35% speed, with toggle landing; dive 4 m forward for ×2 in a 5 m radius, or ×4 from flight; eye sweep 13 m long and 1 m wide over 1.2 s, with a 0.25 s rehit limit; rock lands after 0.6 s for ×3.2 in a 4.5 m radius and launches. |
| Shadow ninja | Four clones for 8 s, each ×0.5 every 0.45 s; vanish for 5 s at +30% speed with a ×3 opening; blink behind nearest target within 12 m for ×3.2 (critical-looking feedback alone does not guarantee the critical multiplier); 5 m smoke cloud for 5 s, blinding creatures and hiding player inside. |
| Archmage | Charge 0.8 s, then homing ×3.5 fireball with 5 m blast; blink 8 m with 0.4 s protection; sheep up to three nearby targets for 6 s; black hole pulls from 8 m for 3 s, then ×3 burst in a 5 m radius. |
| Sun knight | Frontal shield for 4 s and ×1.5 reflected shots; protected 11 m charge carries ordinary enemies, then ×2.5 hit; taunt within 12 m for 6 s and +80 defense; sword falls after 0.6 s for ×4.5 in a 3.5 m radius. |
| Battle robot | Tank for 6 s: +80% speed, +30 defense, ×1.6 contact damage per creature per 0.6 s; turret for 12 s, ×0.55 every 0.35 s within 11 m; six homing missiles for ×1.4 in 2 m blasts; shield for 4 s and heal 20%. |
| Tyrannosaur | Bite within 3.2 m for ×3, or execute ordinary enemies strictly below 40% HP and heal 25% after confirmation; tail in 3.6 m radius for ×1.8 with strong knock; fear within 9 m for 4 s; giant for 10 s, double drawn size, +60% damage, +20 defense and moving stomps for ×0.7 every 0.45 s. |
| Flower fairy | Fixed 4 m healing ring for 8 s, healing 3% HP every 0.5 s while inside; float for 8 s at +25% speed; charm nearest target for 8 s; tree for 6 s, rooting 5 m area for 4 s and lashing for ×0.8 each second. |
| Pirate captain | Cannon for 10 s, ×1.4 every 1.3 s; hook from 14 m, pull near, ×1.2 and 2 s slow; parrot for 8 s, ×0.4 every 0.6 s and 8 s mark; twelve cannonball blasts, each ×1.4 in 1.8 m radius. |
| Vampire count | Eight drain ticks for ×0.7 every 0.35 s and capped healing of 30% damage; invulnerable bat form for 2.5 s at +100% speed; five bats for 8 s, ×0.35 and 0.15% HP heal per bite; blood moon's initial targets in 7 m take ×0.3 every 0.5 s for 6 s, with 12% life steal status. Built-in passive life steal is 4%. |
| Snowman | Growing piercing snowball travels 21.6 m, damage ×(1 + radius) and 3 s slow; decoy for 6 s, bursting for ×2.5 in 4 m radius and 2 s stun; 6 m ice floor for 8 s, slowing enemies and giving +50% player speed inside; freeze within 8 m for 3 s, then ×2.8 shatter. |
| Army soldier | Five corks in fan, each ×1.2; wall for 6 s, 2.6 m ring, +60 defense inside and ×0.5 knock on setup; flare after 0.5 s, 5 m radius, 4 s blind and 6 s mark; five parachute crates for ×2 each and 15% player heal. |
| Navy sailor | Anchor for ×2 in 4.4 m radius; protected 9.1 m wave ride for ×1.4; whistle within 8 m for 2.5 s stun; lighthouse for 6 s, 12 m reach, ×1.2 per 0.6 s and 1.5 s blind. |
| Ao dai lady | Twelve lotus shots for ×0.8 and 8% heal; protected 8.4 m ribbon glide and +30% speed for 3 s; fan cone reaches 7 m for ×1.2, knock and 3 s slow; eight lanterns, each ×1.6 in 2.4 m radius and 2% heal. |
| Ao dai gentleman | Seven piercing dragon waves for ×1.3; kite flight for 5 s at +30% speed; ink circle in 5 m radius for ×0.8 and 3 s stun; dance in 4.2 m radius for 5 s, ×0.7 every 0.5 s. |
| Stars and stripes | Protected 9 m eagle dash for ×2.4 plus ×1.8 in 3 m arrival radius; shield for 3 s and nearby ×1 knock; torch gives +30% damage for 6 s, 10% heal and nearby 2 s blind; ten fireworks, each ×1.5 in 2.2 m radius. |
| Vietnam flag | Five piercing stars for ×1.4 plus close ×1.2 burst; protected 8 m vault with ×1.4 in 3 m arrival radius; three drum beats in 7 m radius for ×0.6, final beat stunning 1.5 s; delayed ×4 star in 5 m radius and 3 s slow. |
| Dawn star dancer | Ribbon cone reaches 6 m for ×1.2, 2.5 m pull and 1.5 s bind; shield 3 s, 15% heal and pet attack clocks +50% for 6 s; protected 8.4 m step leaves a 5 s trail with ×0.2 every 0.5 s and slow; eight stars for ×1.1 plus ×2.4 final burst in 6 m radius and 1.5 s stun. |

Summons can be creature targets. HP as player-max fraction: clone 25% each, snowdecoy 60%, tree 80%, cannon 50%, turret 45%, wall 90%. Clone/snowdecoy lure 8 m. Zero HP/lifetime removes them; snowdecoy burst/wall removal still resolve. Online shares at most 4 hittable summons; authority owns HP.

Air-form effects are assigned individually to body/ground/distant cast, plunge-on-landing, or glide/blink/flight. Plunges scale 1.1 at 2 m/1.2 at 3.3 m/1.3 at 4.4 m; each raw hit uses light-dive boss cap, without adding light dive. Targetless refused casts need not spend cooldown. See [air-cast.ts](../../src/air-cast.ts) all 68 assignments and [main.ts](../../src/main.ts) `airDisguise`/`castDisguise`.

## Companions and Bond Surge

Two pet slots are available immediately. Each contributes stats and independent shots/guard cooldown. Home perchers sit on fence/roof/hay, flyers hover, walkers potter. Outside safety they follow behind on opposite sides; visiting another garden leaves them at the player's own pen. Worn stats continue at home; shooting requires the follow/fight gate. Dog occupies a pet slot to travel, but garden protection belongs to ownership. Its penned item cannot be sold/stored/dropped/dyed/upgraded and takes no backpack slot.

Pets choose the selected living target in leash, otherwise an engaged creature nearest explorer. Engagement includes selected target, hostile AI phase, explorer hit within 4 s or creature hurt explorer within 5 s. Both pet and target must be within 7 m of explorer (target adds body radius). Their shots pass peaceful creatures. Because selection qualifies, saying pets can never begin a fight would be too strong.

| Guard | Effect |
| --- | --- |
| Counter | Takes power x explorer attack off incoming projectile; can destroy weak shots or intercept in flight. |
| Block | Takes power x attack off creature blow. |
| Mend | Alive below 50% HP after creature hit, within 1.5 s hurt window: heals fraction of max HP. |
| Distract | Blinds attacker; boss instead slowed for half duration. |
| Bark | Slows attacker, half duration for boss in incoming guard path. |

Guards require proximity (generally 6 m) and per-pet readiness. All counter/block protection together removes at most 30% of boss hit; hazards bypass ordinary guards. Dog throws every 2.5 s, nominal 7 m/0.5 s flight, factor`0.25*(1+min(0.5,(level-1)*0.01))`. Role table [pet-guard.ts](../../src/pet-guard.ts) is authoritative rather than old copied content.pet damage. Shop pets roughly ×0.25–0.35 per 1.2–1.8 s; boss pets ×0.4 per 1.5 s; later pets vary. Gear factor 1+0.04 rank affects shot and guard.

Third basic press accepted against an in-range target, or the third chain step, starts Bond Surge if ready and eligible pet near. Pets/dog rotate, one at a time: growth 0.3 s, large 8 s, shrink 0.4 s, shared wait 5 s. Large shots ×2/guard ×1.5; model reaches 85% explorer height. Signature opens nearby bosses to+15% explorer damage 4 s; 0.5 s interrupt attempted only while idle/chase, preserving windup/recovery. Family effects: soak next hit, return up to 3 shots, heal/ward 3 s, distract, bark. Unique Colossus stomp/Phoenix rebirth/dragon breath/Kraken slam/Shadow Lord bind. Rebirth restores 30% HP on lethal hit only when armed by surge, at most once per 300 simulation seconds; not passive resurrection for ownership.

First boss/titan defeat guarantees its pet if never already owned/collected. Later regular boss pet roll 10%, titan 6%, titan hat 12%, before relevant modifiers; first guarantee folds a same-pet roll into one. Protected grants go bag/fallback chest, not ground loot. Vault pets additionally have dungeon-content skills; see mode chapter for lifecycle. Pet-card percentage is a design estimate relative to assumed hero sustained DPS 3.6 x attack, not a measurement of every player's actual share.

Sources: [pet-slots.ts](../../src/pet-slots.ts), [pet-pen.ts](../../src/pet-pen.ts), [pet-world.ts](../../src/pet-world.ts), [pet-guard.ts](../../src/pet-guard.ts), [pet-surge.ts](../../src/pet-surge.ts), [pet-card.ts](../../src/pet-card.ts), [boss-pet-content.ts](../../src/boss-pet-content.ts), [model.ts](../../src/model.ts) `addFirstDefeatPet`.

## Creatures and bosses

Final definitions initialize initial `ENEMY_TYPES`, then overwrite with `combatRules`, apply size factors and fit boss bodies. Initial declarations alone are incorrect for many current species: Shadow Lord final base HP 1350/damage 34/XP 800 rather than initial HP 2800; Tin Soldier becomes stationary shooter rather than walking melee. [enemy-types.ts](../../src/enemy-types.ts), [enemy-roster.ts](../../src/enemy-roster.ts).

| State/family | Current behavior |
| --- | --- |
| Idle | Wanders near spawn/notices inside sight. Unhurt/status-free beyond 48 m stops thinking; intermediate distance thinks less often. |
| Chase | Obstacle-aware approach; `!` notice. Some fast/flying chargers orbit before rushing. |
| Windup | Records target/facing, warns. Melee checks range and, with air rules, shown arc. Shooters emit projectile; chargers prepare run. |
| Charge | Ordinary 13 m/s up to 0.75 s/one ×1.3 contact; boss special 18 m/s up to 0.7 s, body contact can stop/throw player. |
| Recover | Ordinary usually 0.45 s/boss 0.7 s; turtle/worm have longer exposed windows. |
| Return | Past 1.6 × sight or 30 m from spawn (dragon 75), unless struck last 4 s. Solo heals 30% max HP/s, full reset at home. |
| Dead | Ordinary 22–32 s/boss 90 s/titan 600 s. Solo also waits until all living explorers>22 m from home spot. Dormant dragon/minislime/elite children differ. |

Zone ranks 0–6 scale HP/damage by 1/1/1.7/2.6/3.6/4.8/6.2; XP by 0.6+0.4*scale. Home forest/meadow 1, swamp 2, canyon 3; Toy 2, Candy/Jungle 3, Ice/Ocean 4, Lava/Cloud 5, Shadow 6. Boss HP additionally ×5.2 (dragon ×2), titan ×7; boss damage ×1.35/titan ×1.6. Hard adds HP ×1.25/damage ×1.2 and+15% XP/drop chance; room host difficulty decides. Solo non-boss creatures gain 3% HP/damage per explorer level above 25 at spawn.

Untouched boss first target scales HP+60% per additional nearby player. Non-dragon adds HP 12%/damage 7% per player level above own, plus damage 10% per extra nearby player. Inspected dragon world flow excludes these level/damage additions. Baseline tables below are therefore not guaranteed observed encounter HP.

Ordinary weight classes affect reactions: light flinch on heavy/critical, medium on critical, heavy never; flinch 0.35 s/1.2 s cooldown. Light attack cooldown ×0.9. Light bodies knock/fling farther; heavy barely move. Boss/elites excluded. Hurt ordinary below 25% HP limps 85% speed; bunny/penguin/frog flee once 2 s below 20%. Magma Turtle takes 12% non-hazard damage except recovery ×2. Magma Slime can release 3 tiny slimes. [creature-weight.ts](../../src/creature-weight.ts), [world.ts](../../src/world.ts) `updateEnemyAi`, `damageEnemy`.

### Enabled elite variants

One sixth rounded of selected species roster is deterministically elite.

- Candy Jelly Splitter: HP ×1.15/damage ×1.1/size ×1.3/XP ×1.6, 50% extra loot roll. Death creates 2 children, 8 child-slot cap. Children 30% HP scale/55% damage/1.3 speed/15% ordinary XP, no normal loot/quest kill. Second generation off.
- Ocean Crystal-shell Stone Crab: HP ×1.4/damage ×1.1/size ×1.2/XP ×1.6, 60% extra loot. Standing shield passes 15% basic gun/pet/summon damage.3 close/skill hits crack or one dive/Quake/power breaks. Open 6 s/break stun 1 s; cracks heal after 10 s. Skill projectiles classify skill, so crack instead of ordinary-shot deflect.

Sources: [elite-roles.ts](../../src/elite-roles.ts), [elite-world.ts](../../src/elite-world.ts), [elite-rewards.ts](../../src/elite-rewards.ts).

### Regular boss patterns

Seventeen bosses rotate ordered kit lists. Above half HP generally every second attack is special; below half more frequent; below 30% every attack qualifies. Enrage special windup ×0.8 plus behavior/cooldown acceleration. Dragon alone uses strict 2/3 and 1/3 phases. Ordered kits appear in effective table below.

| Special | Warning and result |
| --- | --- |
| Slam |1.1 s/radius 4.8/×1.6; air rules add ×1.28 aftershock.|
| Quake |1.2 s; outward bands at 0.12/0.44/0.76 s, nominal radius 3/6/9 with padded hit bands, ×1.1 each.|
| Charge |1 s lane; target up to 14 m, 18 m/s, ×1.3 contact/body stop/throw.|
| Barrage |0.9 s; 14 radial shots/20 below half HP.|
| Rain |1.3 s; 3 marks (4 laterphase), radius 2/×1.3, additional nearby players get patterns. Dragon/golem/phoenix meteor dressing.|
| Spin |0.7 s; 2.4 s pursuing spin, radius 3.4/×0.5 per 0.35 s.|
| Eclipse |1.2 s; radius 7/×0.9, 6 s environmental eclipse.|

Stun<0.5 s does not hard-stun ordinary; 0.5+ does. Bosses convert hard stun/fear/charm/sheep to slow at 0.6 duration; knock 15% and launchvelocity 25% (height 6.25%). Launch or accumulated break can interrupt. Low-height guard disabled.

Separate stagger meter: heavy+22, critical+16; no filling first 3 s. First break 100, 2 s kneel, ×1.25 incoming damage; next threshold ×1.3. Titan first 200/kneel 1.2 s.15 s without hit resets. Colossus has own system. Regular bosses block player with fitted body circles; long bodies use several, sliding/shoving apart. Titans/Colossus do not inherit these solid bodies. [boss-patterns.ts](../../src/boss-patterns.ts), [boss-body.ts](../../src/boss-body.ts), [boss-feel.ts](../../src/boss-feel.ts), [boss-stagger.ts](../../src/boss-stagger.ts).

Nine titans use sweeping beam, suction/burst, six ray lines, bombardment, leap, safe-inner donut, homing orbs, poison pools, summons and repeated stomps. Windup 1–1.6 s. Donut asks player stay close; orb/pool life 7 s, pooltick 0.5 s. Solo summon can reposition/heal ordinary creatures and boost damage. Model/radius/reach scale 75% of catalog; fixed danger zones retain sizes. [titan-patterns.ts](../../src/titan-patterns.ts), [titan-content.ts](../../src/titan-content.ts), [creature-sizes.ts](../../src/creature-sizes.ts).

Cinderpeak Colossus is a separate event with body parts, attacks, weak point and reward lifecycle. Use dedicated mode/server chapter; ordinary boss/titan formulas cannot simply be applied to it.

## Defeat and authority

Keep backpack on defeat defaults to on; only an explicit false setting drops loose items. Worn copies/dog/chest/level/energy safe. Defeat returns home/max HP, clears buffs/size. Drop mode creates pink bag at original planet/spot, 7 day life/maximum 20 bags. Oldest overflow banks; expired items disappear. Recovery moves fitting stacks, leaves others. Dungeon/Flag Rush/Rescue intercept with mode rules. [death-bags.ts](../../src/death-bags.ts), [model.ts](../../src/model.ts) `die`/`recoverBag`, [main.ts](../../src/main.ts) `checkDefeat`.

Shared rules do not mean identical editions. Server-account open world authority owns accepted simulation damage/HP/cooldowns/grants. Elected browser host sends bounded creature movement/phase/telegraph/contact; server validates/replaces canonical values. Local effects remain presentation. `airOn()` disables air whenever online action handler exists. Dungeon has separate browser-host/party combat; CTF/Rescue remain local AI matches with server-checked claims. See mode/server chapter for precise claim/reconnect behavior. Menus can block actions while online fight continues; solo modal and hidden-tab policy differ. Delayed simulation effects pause; consumable buffs expire by wall clock.

## Feedback and access

Target is open red ring/bobbing arrow; last-hit target marked 3 s. Danger is filled disc/wedge growing toward impact; rain is orange and charge is amber, ground attacks ripple when jump system on. Ordinary melee wedge 120 degrees/reach+0.4 m. Boss callouts float within 30 m. Status marks show at most 2 in priority order. Shield/barrier has distinct visuals/text.

Hits: white creature flash 0.14 s (weaker titan), pink player flash 0.25 s, squash/tilt 0.16 s, stronger critical/heavy response/hitstop. Battery saver disables inspected ordinary hitstop. Boss wear adds plasters/bumps/chips at 75/50/25% HP, sweat/enrage puffs; healed/respawn clean up. Cute impact/no gore in these effects.

Buttons show cooldown/readiness/level pips/air state; long press information and cast sounds. Attack carries power ring/glow/×2/blink/hold fill and updated ARIA label. Combo counter avoids hero/target/HUD. Some CSS reduced-motion rules disable status bob/ready-pop/pulse; that does not establish all 3D and camera effects adapt. English/Vietnamese catalogs contain combat/move/pet/boss/upgrade copy; presence is not comprehension evidence.

Sources: [target-marker.ts](../../src/target-marker.ts), [telegraph.ts](../../src/telegraph.ts), [feel-rules.ts](../../src/feel-rules.ts), [hit-react.ts](../../src/hit-react.ts), [boss-wear.ts](../../src/boss-wear.ts), [combat-view.ts](../../src/combat-view.ts), [skill-info.ts](../../src/skill-info.ts), [skill-sounds.ts](../../src/skill-sounds.ts), [power-hud.ts](../../src/power-hud.ts), [skills.css](../../src/skills.css), [upgrade-bench.css](../../src/upgrade-bench.css).

## Review implications and known source/copy differences

These are hypotheses or code-confirmed communication differences, not approved changes or measured player defects.

| Evidence | Review question |
| --- | --- |
| Solo first 3 skills differ from online while keeping names. |Does edition transition teach actual throw/spin/dash behavior?|
| `skillDescription(moves=true,index=3)` returns chain text; `ownSkills` makes crown actual weapon special. |Does tooltip describe the action it fires?|
| Jump bench copy says ground/single-jump boss hits blocked; BOSS_BLOCK_ON = false. |Does double-jump purchase promise an inactive benefit?|
| Stats/levels/forge/crit/streak/form/pet openings/defense stack. |Measure controlled builds/fight duration/damage/decisions before tuning one label.|
| +10 six-stat convergence, utilities/pet behavior remain distinct. |Do players understand appearance versus build decisions and two-pet stat inflation?|
| Forge failures spend resources and odds worsen. |Measure resource/time variability and odds comprehension.|
| Defensive forms/food/guards/default bag safety coexist with execution inputs. |Can novice learn avoidance and expert retain optional mastery?|
| Touch widened timing/hold/slide. |Check real reach, accidental use, long press discovery and dexterity burden.|
| Target/danger both red with different shapes; many motion effects. |Check contrast, clutter, cues beyond color, reduced motion and low-end timing.|
| Boss level scaling connects gear progression and economy. |Measure whole farming/return/exploration pacing before adding depth.|

Inspected tests cover cone/projectile/obstacle collision, delayed pause/reset, flight/shield, eye sweep, Devour threshold/confirmation, life-steal, pet timing, boss rotation, forge odds, reach and pair stat exclusion: [combat](../../tests/combat.test.ts), [combat-update](../../tests/combat-update.test.ts), [boss-patterns](../../tests/boss-patterns.test.ts), [weapon-forge](../../tests/weapon-forge.test.ts), [weapon-growth](../../tests/weapon-growth.test.ts), [weapon-pair](../../tests/weapon-pair.test.ts). No passing run claimed.

Coverage JSON distinguishes fully read rules from partial integration/presentation and Pending files. Not all artwork primitives/locales/test bodies/optional-mode/live-online paths are claimed complete. Next observations: fresh natural fight, later equipped build, defeat/recovery, physical touch and actual account-room transition, preserving build/save/difficulty/input context.

## Effective catalog extracts

Derived by read-only import of current first-party modules after registrations/overrides. Prices are catalog energy only; missing direct price does not mean free/unavailable. Weapon reach excludes forge. Boss roster values are initial Easy/one player before target-level scaling.

### Combat weapon catalog

| Item ID / name | Energy field | ATK | Crit | Kind | Reach m | CD s | Special (CD s) |
| --- | ---: | ---: | ---: | --- | ---: | ---: | --- |
| sword_wood / Wood sword | 25 | 6 | 0% | sword | 2.3 | 0.55 | Crescent slash (6) |
| sword_tusk / Tusk sword | 90 | 14 | 5% | sword | 2.5 | 0.6 | Tusk rush (7) |
| sword_crystal / Crystal sword | 320 | 26 | 10% | sword | 2.7 | 0.5 | Blade waves (6) |
| gun_pea / Pea blaster | 40 | 4 | 0% | gun | 10 | 0.38 | Pea barrage (8) |
| gun_bubble / Bubble blaster | 140 | 9 | 0% | gun | 9 | 0.5 | Bubble prison (10) |
| gun_spike / Spike blaster | 220 | 15 | 0% | gun | 7 | 0.75 | Thorn nova (9) |
| sword_candy / Candy sword | 200 | 22 | 8% | sword | 2.6 | 0.5 | Crescent slash (6) |
| gun_ice / Ice blaster | 260 | 20 | 0% | gun | 10 | 0.42 | Blizzard (9) |
| sword_lava / Lava sword | 420 | 38 | 12% | sword | 2.8 | 0.5 | Blade waves (6) |
| sword_obsidian / Obsidian sword | — | 46 | 14% | sword | 2.9 | 0.5 | Magma pillars (8) |
| hammer_thunder / Thunder hammer | 520 | 55 | 10% | sword | 2.6 | 0.85 | Thunder chain (9) |
| scythe_moon / Moon scythe | 600 | 48 | 18% | sword | 3.3 | 0.6 | Moon cyclone (8) |
| bow_star / Star bow | 480 | 34 | 12% | gun | 13 | 0.55 | Starfall (9) |
| staff_fire / Fire staff | 560 | 40 | 0% | gun | 10 | 0.7 | Inferno ring (9) |
| blaster_rainbow / Rainbow blaster | 700 | 30 | 8% | gun | 11 | 0.22 | Rainbow laser (8) |
| toy_hammer / Toy hammer | — | 24 | 10% | sword | 2.4 | 0.6 | Giant bonk (7) |
| trident / Ocean trident | — | 50 | 12% | sword | 3.4 | 0.62 | Wave fan (9) |
| harpoon / Hunting harpoon | 1000 | 100 | 0% | gun | 11 | 1.3 | Blade waves (6) |

### Disguise catalog

| ID / name | Energy field | Added stats | Fallback weapon: kind / reach / CD | Skills in slot order (base CD s) |
| --- | ---: | --- | --- | --- |
| dz_superhero / Superhero | 600 | atk 16, def 12, speed 25% | fist / 1.3 / 0.28 | Take flight (3); Meteor dive (6); Laser gaze (7); Boulder throw (10) |
| dz_ninja / Shadow ninja | 550 | atk 8, crit 15%, speed 20% | sword / 2.3 / 0.3 | Shadow clones (14); Vanish (12); Shadow strike (6); Smoke bomb (12) |
| dz_mage / Archmage | 410 | atk 12, hp 20 | gun / 10 / 0.7 | Great fireball (5); Blink (5); Sheep spell (12); Black hole (13) |
| dz_knight / Sun knight | 480 | def 25, hp 120, atk 6 | sword / 2.8 / 0.6 | Shield block (8); Knight's charge (7); Challenge (12); Sky sword (12) |
| dz_mecha / Battle robot | 530 | atk 6, def 12, hp 60 | gun / 11 / 0.22 | Tank mode (12); Tesla turret (14); Homing missiles (7); Energy shield (16) |
| dz_dino / Tyrannosaur | 300 | atk 14, hp 90 | sword / 2.4 / 0.55 | Devour (9); Tail sweep (5); Terrifying roar (12); Giant form (18) |
| dz_fairy / Flower fairy | 480 | hp 40, regen 4, speed 15% | gun / 10 / 0.42 | Healing flower ring (12); Butterfly float (10); Fairy charm (14); Binding tree (14) |
| dz_army / Army soldier | 380 | atk 10, crit 8% | gun / 12 / 0.35 | Cork popgun (6); Sandbag wall (10); Signal flare (12); Supply drop (16) |
| dz_navy / Navy sailor | 400 | atk 10, crit 8% | sword / 2.4 / 0.55 | Anchor swing (7); Wave ride (7); Bosun's whistle (12); Lighthouse beam (15) |
| dz_aodai / Ao dai lady | 420 | atk 10, crit 8% | gun / 10 / 0.42 | Lotus petals (6); Silk ribbon glide (8); Paper fan breeze (12); Lantern festival (15) |
| dz_aodai_man / Ao dai gentleman | 310 | atk 10, crit 8% | sword / 2.4 / 0.55 | Dragon fan (7); Kite glide (10); Ink circle (12); Dragon dance (15) |
| dz_usa / Stars and stripes | 510 | atk 10, crit 8% | gun / 11 / 0.4 | Eagle strike (7); Star shield (9); Liberty torch (12); Fireworks finale (15) |
| dz_vietnam / Vietnam flag | 320 | atk 10, crit 8% | gun / 10 / 0.42 | Golden star burst (7); Bamboo vault (7); Bronze drum (12); Great golden star (15) |
| dz_pirate / Pirate captain | 300 | atk 10, crit 8% | gun / 8 / 0.6 | Deck cannon (12); Grappling hook (6); Scout parrot (10); Ship broadside (14) |
| dz_vampire / Vampire count | 440 | atk 12, crit 10% | sword / 2.3 / 0.45 | Life drain (7); Bat form (9); Bat swarm (12); Blood moon (15) |
| dz_snowman / Snowman | 530 | def 10, hp 60 | gun / 10 / 0.4 | Rolling snowball (7); Snow decoy (12); Ice rink (12); Ice age (16) |
| dz_dawnstar / Dawn star dancer | 410 | hp 40, regen 3, speed 10% | gun / 9 / 0.45 | Ribbon lasso (6); Morning glow (12); Sparkle step (7); Star shower (15) |

### Regular boss initial roster

HP and damage already include zone and boss multipliers, before Hard and first-target/player-level scaling. These are not raw species definitions. Respawn is 90 s plus the world proximity condition.

| Planet / boss | Initial HP | Initial damage | XP input | Special rotation |
| --- | ---: | ---: | ---: | --- |
| home / bear | 10816 | 91.26 | 492 | slam → charge → quake |
| home / treant | 3640 | 29.7 | 240 | slam → rain → barrage |
| home / croc | 7514 | 57.375 | 358 | charge → spin → slam |
| home / mushking | 4940 | 32.4 | 320 | rain → spin → slam |
| candy / cake | 12168 | 84.24 | 623 | barrage → rain → slam |
| candy / gingerbread | 11492 | 84.24 | 590 | charge → barrage → spin |
| candy / jellyqueen | 13520 | 87.75 | 656 | quake → barrage → rain |
| ice / yeti | 18720 | 136.08 | 979 | slam → rain → quake |
| ice / mammoth | 20592 | 145.8 | 1020 | charge → quake → slam |
| ice / frostowl | 21528 | 136.08 | 1061 | barrage → charge → rain |
| lava / golem | 29952 | 207.36 | 1512 | slam → rain → barrage |
| lava / dragon | 24960 | 233.28 | 3528 | barrage → rain → charge → quake |
| toy / robot | 7956 | 50.49 | 422 | barrage → charge → quake → spin |
| jungle / gorilla | 13520 | 94.77 | 738 | slam → charge → rain → quake |
| ocean / leviathan | 21528 | 145.8 | 1142 | barrage → rain → quake → charge |
| cloud / phoenix | 29952 | 207.36 | 1562 | barrage → rain → charge → spin |
| shadow / shadowlord | 43524 | 284.58 | 2464 | eclipse → rain → spin → barrage → quake |

### Titan catalog and initial roster

One per world; source radius/reach are resized to 75% in enemy definitions. Initial roster numbers below include zone/titan scaling before difficulty and first-target scaling.

| Planet / titan | Initial HP | Initial damage | XP input | Ordered skills |
| --- | ---: | ---: | ---: | --- |
| home / Ancient Mountain Turtle | 27300 | 124.8 | 4920 | stomp 4 → lines → leap → summon → donut |
| candy / Three-Headed Candy Hydra | 29120 | 133.12 | 5576 | sweep → orbs → pools → bombard → summon |
| ice / Ice Crystal Queen | 42840 | 195.84 | 7752 | lines → orbs → donut → sweep → bombard |
| lava / Inferno Scorpion | 60480 | 291.84 | 11088 | pools → leap → lines → sweep → stomp 4 |
| toy / Clockwork Spider | 17850 | 81.6 | 3840 | bombard → sweep → summon → lines → orbs |
| jungle / Death Flower Rafflesia | 30030 | 133.12 | 5576 | pull → pools → orbs → summon → donut |
| ocean / Abyssal Kraken | 44100 | 195.84 | 7752 | pull → sweep → stomp 4 → pools → bombard |
| cloud / Celestial Cloud Whale | 62160 | 291.84 | 11088 | bombard → orbs → pull → lines → donut |
| shadow / Void Eye | 86800 | 396.8 | 16016 | sweep → pull → orbs → donut → lines → bombard |
