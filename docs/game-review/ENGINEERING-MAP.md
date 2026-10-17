# Engineering map

The structure below connects systems, player checkpoints and review work. Attention focuses are design proposals to verify with players.

```text
cute_game_boat/
├─ Core loop
│  └─ Grow → prepare → explore → return → choose again
├─ Systems
│  ├─ Home: crops, cooking, storage, helpers, decoration
│  ├─ Economy: sales, shops, crafting, materials
│  ├─ Growth: XP/levels, equipment, wishes, bed upgrades
│  ├─ Adventure: combat, fishing, travel, gathering, extra modes
│  └─ Shared services: controls, saves, language, online play
├─ Main checkpoints [current steps / proposed attention focus]
│  ├─ Start
│  │  └─ First action → clear planting cue and visible result
│  ├─ Chapter 1 [1–9] — exit: claim step 9, level ≥5
│  │  ├─ First harvest → meet Pepper; distinguish the starter gift
│  │  ├─ Sell / equip → understand income and preparation choices
│  │  └─ Fight / fish → readable danger, recovery, quiet contrast
│  ├─ Chapter 2 [10–15] — exit: claim step 15, level ≥8
│  │  ├─ Bed / meals → see home grow; explain kitchen variants
│  │  └─ Boss / fish → feel progress; offer an optional rescue
│  ├─ Chapter 3 [16–21] — exit: claim step 21, level ≥12
│  │  ├─ Land / gather → curiosity, new hazards, useful resources
│  │  └─ Craft / decorate → show how a journey changes home
│  └─ Chapter 4 [22–29] — exit: claim step 29, level ≥25
│     ├─ Disguise / worlds → self-expression and varied challenges
│     └─ Final return → proposed closure and a voluntary next choice
├─ Every checkpoint records
│  └─ Entry → player choice → cue → exit condition → payoff → recovery
└─ Progress tracking
   └─ Evidence → issue ID → proposed change → verification → status
```

Improve the plan: keep one primary cue at a time; give each major checkpoint a meaningful choice or visible payoff; measure stalls and repetition before adjusting counts or assets.

Acceptance: can the player identify the next action, understand its result, recover from a mistake, and stop/resume without losing progress? Record observations separately from intended feelings.

Current rules: complete and claim every milestone. Most event goals count only while active; live conditions have their own catch-up. Rescues are optional to this milestone sequence. Visits include home. The proposed ending requires implementation; today's tracker continues into Chapter 5 and endless goals.
