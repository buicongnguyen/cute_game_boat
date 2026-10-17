# Cute Game Boat home production and player systems

Current implementation at commit 6c4477fdc795995fa5d7af6a58f83845591693af. This description is grounded in rules and controller inspection, with a small in-memory probe of onboarding and defeat defaults. Natural player discovery, real session pacing, and device acceptance are still unrun.

## The playable loop

The explorer starts with a home deck, a cabin below its hatch, nine crop beds, and access to nearby wild areas. Planting and harvesting yield items and XP. Items can be sold for energy, eaten, fed to livestock, cooked, used as materials, or stored. Energy and materials buy equipment, upgrades, helpers, beds, and animals. Combat and exploration provide additional XP, materials, companions, and destinations.

This creates three connected loops. A short loop is plant, harvest, sell, and make a useful purchase. A trip loop is prepare at home, explore or fight, bring resources back, then cook or craft. A continuing loop is advance the journal, develop the home and companions, and reach new worlds. Optional modes add activities, but their contribution to the player's main purpose needs story and pacing review.

Sources: [model rules](../../src/model.ts), [shared action dispatcher](../../src/actions.ts), [main orchestration](../../src/main.ts), [resolved catalog](CATALOG.md).

## Starting and resuming

A fresh game begins at level one, zero XP, 100 health, zero energy, an empty bag and chest, and nine empty plots. Easy is the default difficulty. Fresh-start code adds firstRun state; older saves without it keep different tutorial and HUD behavior.

The six welcome cards introduce keeper identity, gardening and exploration, indoor trade, crafting and other stations, the animal garden and friends, and first planting. They are skippable. Seen cards and tips are recorded through the action layer.

The first three eligible plantings grow in 20 seconds at level one while the first story step is active. Ordinary base times are longer: carrot 100 seconds and radish 150 seconds on a level-zero bed. The first successful hand harvest can grant Pepper and 10,000 energy if the welcome grant remains pending. Robot work does not grant that welcome reward.

The journal's initial harvest goal asks for three crops. A completed milestone waits for an explicit Collect action before its next step becomes active. This distinction matters when a player explores or fights before the story asks them to do so. See [story progression](STORY.md) for all steps and ownership catch-up rules.

There are three local offline profiles. Profile one retains the original save key; other profiles have separate keys. Indoor position flags and neighbour records also distinguish profiles. Boat keys have the cute-game-boat namespace, keeping this fork separate from the original game on the same browser origin.

Sources: [newGame and SAVE_KEY](../../src/model.ts), [freshStart and tutorialGrow](../../src/first-run.ts), [welcomeCards](../../src/welcome-cards.ts), [firstHarvestGift](../../src/friends.ts), [profiles](../../src/profiles.ts).

## Finding home services

The home safe boundary is a 40 by 44 metre rectangle, spanning x from -20 to 20 and z from -22 to 22. The cabin is reached through the deck hatch. Outdoor kitchen, workshop, equipment shop, and market placements from earlier versions are no longer the current service route.

| Place | What the player can do |
| --- | --- |
| Exchange box beside the cabin's lower exit | Sell harvest, fish, and spare materials for energy. |
| Magic Mirror in the bedroom | Buy equipment, seeds, and supplies; switch to Looks for appearance choices. |
| Wardrobe | Manage owned wearable equipment, clothes, and companions. |
| Storage chest in the bedroom | Store and withdraw possessions. |
| Kitchen stove | Cook crop, fish, and livestock recipes, subject to the difficulty gate. |
| Craft-room workbench | Craft equipment and supplies; open Strengthen weapons for the probabilistic forge. |
| Upgrade bench | Upgrade owned gear, skills, and jumping. This is distinct from forging and permanent stat wishes. |
| Wishing cabinet | Spend energy on permanent health, attack, defence, or critical chance. |
| Study globe | Plan destinations; actual starship travel uses the flight system. |
| Trophy wall | Show missing and rescued friends with rescue locations. |
| Bookshelf | Review collection records and Colossus choices. |
| Diary | Review tasks. |
| Kitchen-side doorway and green garden | Reach livestock and their helper. |

Cabin transitions swap active entities, obstacles, scene, and camera focus. The interior has its own walking and picking rules. Indoor combat controls and practice effects are available; the current practice route must keep outdoor enemies and scenery outside its target set. Passing through a doorway is not intended to recharge skills.

Sources: [activity definitions](../../src/house-activities.ts), [station labels and purposes](../../src/house-stores.ts), [house session](../../src/house-session.ts), [house interaction](../../src/house-ui.ts), [safe boundary](../../src/safe-zone.ts), [boat changes](../boat-fork.md).

## Farming and garden growth

There are 27 crops, including eight long-growing fruits. The catalog lists base level, time, XP, seed requirement, and sell value for each. Planting checks the chosen crop's level and consumes a seed item when required. Crops without a seed item do not consume energy when planted.

One successful harvest grants one crop item and XP. It clears the plot, keeping its layout and upgrade level. A full bag can refuse a new item kind and leave the crop standing. Tapping a ripe bed can collect the other ripe beds across the garden in nearest-first order; HARVEST_REACH is unlimited.

Nine starting plots can expand to 24. The next bed costs 60 plus 20 times the number of extra beds already placed, unless a bed kit is consumed. At the maximum, further kits cannot expand the garden. Extra empty, unupgraded beds can be packed into kits; starting beds cannot be stored. Moving or rotating a bed preserves its crop and original growth state.

Each bed has five upgrade levels. Growth speed is multiplied by two at every level, giving 2, 4, 8, 16, and 32 times base speed. Easy upgrade prices are 120, 240, 480, 960, and 1,920 energy. Normal and Hard multiply these by 1.5. Upgrading a growing bed preserves its completion fraction and halves its remaining timer scale.

Fertilizer and magic spore each advance half of that planting's original duration, capped at two hours for a fruit-tree dose. Progress cannot carry into the next planting. The executable fertilize function accepts fruit trees, even though an older tree-crops comment says they are refused.

Planting snapshots duration and difficulty. Harvest uses the planted difficulty for crop XP and its reward multiplier. Switching difficulty after planting does not retroactively change that crop into another economy.

Sources: [plant, harvest, ripeNearby, expansion and bed upgrades](../../src/model.ts), [crop definitions](../../src/content.ts), [difficulty](../../src/difficulty.ts), [auto planting](../../src/auto-plant.ts).

## Livestock and the cost of absence

The pen can be built from level two for 40 energy. It has two expansions costing 140 and 280. It holds at most fifteen livestock in total, plus one permanent guard dog; per-species limits also apply.

| Animal | Level | Easy price | Young growth | Base product interval | Product |
| --- | --- | --- | --- | --- | --- |
| Chicken | 2 | 25 | 60 seconds | 120 seconds | Egg |
| Duck | 3 | 220 | 90 seconds | 180 seconds | Duck egg |
| Goat | 4 | 300 | 100 seconds | 300 seconds | Goat milk |
| Goose | 4 | 260 | 100 seconds | 240 seconds | Goose egg |
| Cow | 5 | 70 | 120 seconds | 240 seconds | Milk |
| Pig | 6 | 380 | 120 seconds | 360 seconds | Truffle |
| Guard dog | 3 | 450 | None | None | Crop protection and possible companion role |

Production uses wall-clock time: a game hour equals one real minute. A mature animal stockpiles up to three products. A matching nearby species shelter raises storage to five and multiplies intervals by 0.7. Normal and Hard purchases carry a 1.5 product-interval multiplier for life. Shelter costs are chicken 160, duck 220, cow 300, pig 320, goat 340, goose 280, and dog 250.

Livestock become collectible meat two real hours after arrival. Feeding does not extend that fixed lifespan. On collection, already earned stock up to the cap accompanies the meat and the animal is removed. A failed inventory grant preserves the animal and stock. The guard dog never becomes meat.

Manual feeding consumes a crop and halves time left in an eligible growth or product cycle, once per phase or cycle. The normal player Feed action selects adult animals. Automated feeding uses inexpensive seed-free crops and only when the estimated saved product value covers the feed value. Home pantry rules can supply that feed from the chest.

The pen robot can be bought for 1,000 energy after building the pen. It collects products and can optionally feed. Its auto-restock upgrades cost 300, 600, 1,200, and 2,400; they support up to 2, 4, 7, and 10 remembered animals per kind, constrained by actual pen capacity. It buys replacements with player energy and a configured reserve, and learns from existing stock instead of inventing a larger farm. Catch-up restocking is capped.

Experience review question: a welcoming home promise and a two-hour livestock lifespan may create different expectations for a short-session or returning player. Record actual understanding and consequences before changing this rule.

Sources: [farm lifecycle and collection](../../src/farm.ts), [farm clock](../../src/farm-clock.ts), [farm helper](../../src/farm-helper.ts), [restocking](../../src/farm-restock.ts).

## Helpers and agency

Bolt, the garden robot, costs 1,000 energy. It prioritizes ripe crops, can replant using available seeds, and never buys seeds. Its automatic fallback considers quick crops by net sell value per growth time; fruit trees and crops longer than thirty minutes are excluded from that automatic choice.

The garden has one auto-planting switch. Turning Bolt off also prevents automatic replanting by Sprout. Hand planting records that bed's chosen crop, which helpers keep when replanting is enabled. If seeds are unavailable, that bed waits instead of silently choosing another crop. Harvesting and planting are separate choices: disabling automatic planting alone can leave helper harvesting active.

Helpers wait after ripening for one quarter of a crop's duration, with a minimum twenty seconds and maximum five minutes. This lets the player see ripe crops before they are removed. Bolt's catch-up collects and replants at most one round per bed; a day closed does not simulate a day of repeated robot harvest cycles.

Bolt rests for the last three hours of each UTC day. The cook's rest is the last hour of each four-hour UTC cycle. Calling a worker during rest provides thirty minutes of work where allowed. Companion work schedules and pauses need to be understood alongside robot toggles.

Worker gains go to the bag while the explorer is home nearby. Work done away, or catch-up after more than sixty seconds idle, can deliver to the chest. The action wrapper checks chest capacity for these delivery grants; the delivery function then moves gains and records a return note. Its older unlimited-chest comment does not describe the capacity wrapper.

Sources: [helper](../../src/helper.ts), [worker state and rests](../../src/helper-state.ts), [auto planting](../../src/auto-plant.ts), [delivery](../../src/delivery.ts), [action wrapper](../../src/actions.ts), [friend work](../../src/friends.ts).

## Storage and material spending

Bag capacity is 100 item kinds, expandable five times by ten to 150. Chest capacity is 120 kinds, expandable four times by twenty to 200. A stack occupies one kind slot and never splits at ninety-nine. Additional copies of an already loose item kind can fit in an otherwise full bag. Equipped copies do not consume loose-item slots; penned protection items are also special-cased.

Expansion n is zero-based. Bag energy costs 200 * (n + 1); materials are leather 8 + 4n, tusk 2 + n, star shard 1 + n, plus pearl n from n = 1 and moonstone n - 2 from n = 3. Chest energy costs 300 * (n + 1); materials are vine 6 + 4n, amber 1 + n, star shard 1 + n, plus thunderstone n from n = 1 and dragon scale n - 1 from n = 2.

At home, most recipe and material spending uses loose bag copies first, then the chest. Equipped copies are protected. Away from home, that pantry contains only loose bag items. Individual actions have exceptions: seeds and consumables are checked by their own rules, and storage expansion takes its materials from the bag. Individual sell actions sell loose bag stock. Sell all produce and fish also includes chest produce while at home.

Quest and other reward paths can use stowItem to try bag then chest. Some protective migration and defeat-overflow paths preserve items by writing them to chest beyond normal slot admission. Therefore normal capacity limits and item-preservation exceptions must be documented separately; an old overfull save is preserved rather than truncated.

Sources: [capacity and expansionCost](../../src/storage-slots.ts), [pantry](../../src/pantry.ts), [addItem, stowItem, transfer and expandStorage](../../src/model.ts).

## Selling cooking and crafting

Energy is both a spending resource and an important progression reward. It is distinct from starship fuel, mode-only construction currency, and pass stars.

Selling removes loose inventory and grants each item's sell value. Current crop and product sell values are the same on all difficulties. Exchange offers grouped produce selling, including chest stock at home. Cook and sell all first converts eligible crop and fish stacks to cooked items when the kitchen is open, sells those dishes, then sells remaining produce.

Simple cooking converts a raw item into its cooked counterpart. The livestock kitchen also offers omelette from two eggs, pancakes from one egg and one milk, milkshake from two milk, and cheese from three milk. Cooking farm dishes has no separate energy charge and records a cooking event. Food can heal, apply timed buffs, or both.

The generic craft rules require sufficient output room, recipe energy and materials, plus a ready furnace for recipes assigned to the forge. Home pantry can supply chest materials. Shop purchases reuse shop recipes or special-offer rules. Player-facing filtering and equipment level checks also matter; the resolved catalog is data, not a guarantee that an item is immediately purchasable or wearable.

The stove is open in Easy. Normal and Hard open cooking at level fourteen, including Pepper's cooking. The early story's unavailable cooking task receives a harvest substitute. The proposed story must acknowledge preparation and cooperation without requiring a locked kitchen.

Sources: [sell, cook, craft and buy](../../src/model.ts), [farm dishes](../../src/farm.ts), [item view sale planning](../../src/item-views.ts), [difficulty](../../src/difficulty.ts), [storyStep](../../src/progression.ts), [recipes](CATALOG.md).

## Fishing and the retained hunting implementation

The normal current player route uses fishing rods at ponds. Context gear selects the best owned rod near water while not fighting, and restores the player's combat choice or fists when leaving or attacking. A harpoon is a combat weapon in current normal UI; an equip message explicitly directs pond fishing to rods.

Line fishing progresses through cast, wait, approach, nibble, bite, hooked, then caught or escaped. Wait is a random 2 to 5.5 seconds divided by 1.7 with bait and divided by 1 + half rod quality. The bite window is 1.4 + 0.6 times quality seconds; a steady rod adds 0.4 seconds. Reeling early disturbs the fish and can pull the line back to shore. Holding reels; releasing relieves tension. More than seven seconds slack loses the catch.

The line strains when tension reaches one. Snap probabilities per strain are bamboo 60 percent, golden 30 percent, and steady 10 percent. A surviving strain lowers tension to 0.7 and slips progress by 0.08. The steady rod also reduces effective heaviness and tension growth; it improves forgiveness without guaranteeing a catch.

Bait, rod quality, and luck affect rare-fish weighting. The mystery caller's executable values are a 20 percent call chance, a twenty-second cooldown, three attempts, and a 60 percent supergiant-fish resolution share; the remaining share draws treasure. Older comments say ten percent and sixty seconds and are stale.

The shared legacy huntFish action still exists, with a 1.3-second shot cooldown, eighteen-second ordinary restock, and a harpoon-only Lake Guardian rule. Guardian timing is a six-minute cycle, two-minute appearance, twenty-second warning, and six-hour individual catch cooldown. However main no longer offers the former normal hunting input path. Distinguish retained rule capability from a discoverable, supported route. The catalog includes nineteen non-junk fish entries and one boot entry; the guardian's presence in the log does not prove current player reachability.

Sources: [FishingSimulation and MYSTERY](../../src/fishing.ts), [context gear](../../src/context-gear.ts), [main pond and equip flow](../../src/main.ts), [retained huntFish](../../src/fish-hunting.ts), [guardian](../../src/lake-guardian.ts). Reachability needs runtime verification before any collection-completeness claim.

## Difficulty defeat and comfort

| Setting | Current consequences |
| --- | --- |
| Easy | Original economy; default for a new or unspecified save. |
| Normal | Cooking from level fourteen; fruit unlocks five levels later capped at twenty-five, doubles fruit duration and uses 0.3 base fruit XP; dearer livestock, 1.5 product pace and bed upgrade prices. |
| Hard | Normal economy plus creature health times 1.25, creature damage times 1.2, and reward multiplier 1.15 for applicable XP and drop chances. |

Increasing difficulty is immediate. Lowering is limited to once per hour and the UI asks first. Already planted crops and purchased animal pace retain their snapshot rules. Offline ordinary creatures above player level twenty-five have additional per-level scaling; online host and authority rules are described separately.

Keep backpack on defeat is ON unless explicitly disabled. Ordinary defeat returns the explorer home with full health and clears buffs and size effects. Energy, levels, chest, and worn copies are retained. If the option is disabled, loose bag items can form a recoverable bag where the player fell. Bags last seven days, with at most twenty; overflow banks the oldest possessions, and full-bag recovery leaves uncollected stacks waiting. Expired bags do lose their contents. Vault defeat has its own return rule.

Home healing totals four times the sum of four HP per second and nonnegative passive regeneration. Entering or returning home can clear negative buffs through the shared cleanse actions. Rest activities also support preparation.

Sources: [difficulty](../../src/difficulty.ts), [die, keepsBag and recoverBag](../../src/model.ts), [death bag lifetime](../../src/death-bags.ts), [home recovery](../../src/home-care.ts).

## Cabin activities and a reason to return

| Activity | Current reward | Cooldown |
| --- | --- | --- |
| Sofa | Full health and 90 seconds regeneration, base 3 plus up to 3 for friends at home. | 3 minutes |
| Fireplace | Defence +15 for 150 seconds. | 4 minutes |
| Tea | Attack speed +15 percent for 150 seconds. | 5 minutes |
| Bed | Full health and XP +25 percent for 300 seconds. | 15 minutes |
| Bath | Movement speed +20 percent for 150 seconds. | 5 minutes |
| Sink | Luck +10 percent for 150 seconds. | 3 minutes |
| Easel | Base reward is 3 percent of current level XP requirement, through gainXp; records a painting. | 8 minutes |

The radio and duck are playful interactions. Collections, trophies, friend conversations, and hangouts support the home as a social place. Story proposals should use these existing activities to acknowledge journeys before asking for new furniture or animation.

Source: [useActivity and ACTIVITIES](../../src/house-activities.ts). The table describes rules; perceived comfort or attachment requires player feedback.

## Appearance collections and the Almanac

Magic Mirror separates Equipment from Looks. Appearance combines six body choices, five heights, three ear choices, and thirteen hood choices including no hood. Options have their own ownership and energy prices; they are distinct from combat equipment. Existing look IDs and owned choices are preserved by parsing and migration. Friend appearance can reuse the player's owned options. Current boat models and fitting overrides should be treated as an asset contract, with changes budgeted against a concrete player outcome.

The journal and study collections record fish, found items, worlds, bosses, Titans, and rescued friends. Individual collection pages and chapter rewards have their own rules; a visible completion percentage does not automatically imply a new reward.

The Village Almanac is a save-based analysis panel with nine score areas: garden, animals, kitchen, workshop and gear, fishing, exploring, helpers, energy at work, and daily habits. It also provides production chains, trends, and a level report. Scores are weighted interpretations of saved activity and current catalog values. They are suggestions from an authored formula, not a measure of enjoyment or a requirement for story completion.

Review question: do scores that favor full production, spending, working helpers, and daily habits support a relaxed home experience for someone who chooses decoration, resting, or occasional play? Evaluate the language and prominence with players before changing the formulas.

Sources: [appearance options and parsing](../../src/looks.ts), [Mirror](../../src/look-shop.ts), [friend appearance](../../src/friend-looks.ts), [collection log](../../src/house-activities.ts), [Almanac rules](../../src/insight-rules.ts), [Almanac pages](../../src/insight-pages.ts).
## Controls presentation and interruption

The default keyboard binding resolver uses WASD movement and J, K, L, semicolon skills unless Classic is selected. Classic uses arrows and Q, W, E, R. Arrows also move in WASD layout. Journal is P in WASD and J in Classic. Custom device controls can override bindings; air combat and the Space choice alter attack and jump behavior.

Phones can use a joystick opposite the combat buttons, change sides, sizes, resting opacity, and custom layouts. These preferences are device-local rather than synced character progression. Fishing supports held input and click toggling. These are accessibility affordances, not evidence that every access need is met.

English and Vietnamese are supported. Vietnamese content loads as a separate package. Player names and saved progress remain independent of display language. Story drafts are written in English for review and require localized text before implementation.

Music and effects have separate volume settings, with optional vibration. Graphics supports Auto, Sharp, Balanced, and Battery saver. Mobile Auto caps render ratio at 1.25, adapts shadows and effects, then lowers resolution or quality when needed. Camera pitch is adjustable and cabin framing follows the occupied room.

The frame loop resets held input and saves on interruption and visibility changes. Hidden callbacks skip simulation; the resumed delta is bounded. Farming still uses wall-clock growth, so combat pause and production time are distinct. Offline combat timers pause with the relevant UI activity; online combat can remain active when a panel is open. Players should be told how safe a menu actually is.

Sources: [bindings and fishing input](../../src/gameplay-controls.ts), [device controls](../../src/controls-prefs.ts), [main frame and interruption handling](../../src/main.ts), [language](../../src/i18n.ts), [audio](../../src/audio-settings.ts), [graphics](../../src/graphics.ts), [camera](../../src/camera-rig.ts).

## Review questions tied to player outcomes

- Can a new player connect harvest and energy with a meaningful next purchase after the starter grant?
- Can the player find indoor services from current story wording without a hint?
- Does manual reward claiming create understandable rhythm or unnoticed missed credit?
- Do helpers preserve agency while their pauses and chest deliveries remain predictable?
- Does livestock aging fit the intended short-session and returning audience?
- Can players distinguish three upgrade systems: permanent wishes, deterministic bench levels, and probabilistic forging?
- Are listed collections and optional challenges reachable through normal current controls?
- Does the opening balance instruction with action, and does the home offer a satisfying stop between trips?

These questions feed [the improvement register](BACKLOG.md). They do not authorize changing balance, saves, or story on their own.
