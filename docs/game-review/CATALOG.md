# Cute Game Boat resolved game catalog

Source baseline 6c4477fdc795995fa5d7af6a58f83845591693af, extracted 2026-10-17 by evaluating the first-party content, farm, and model modules in Node. This resolves catalog extension packs and farm item registration. It does not establish UI reachability, balance, player enjoyment, or test-suite acceptance.

There are 27 crops, 325 item definitions, 111 recipe entries including shop entries, 9 planets, 20 fishing catalog entries including junk, and 17 disguises.

Base prices and times need the conditions in [home rules](SYSTEMS-HOME.md), [combat rules](SYSTEMS-COMBAT.md), and [world and online rules](SYSTEMS-WORLDS-ONLINE.md). A dash means no value in this exported field, not free or obtainable. Lists can include retained rules without a normal current UI route.

The [machine-readable snapshot](catalog-snapshot.json) preserves all exported fields. Sources: [content](../../src/content.ts), [farm](../../src/farm.ts), [model](../../src/model.ts). Re-extract after changing source; do not independently edit derived values here.

## Crops

Times and levels are base Easy values before tutorial overrides, bed upgrades, fertilizer, or difficulty. Sell values are raw crop values. Buff values use internal keys; time is seconds.

| ID | Name | Level | Base grow time | XP | Sell energy | Seed item | Buff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| radish | Radish | 1 | 2.5 minutes | 18 | 12 | — | — |
| carrot | Carrot | 1 | 1.667 minutes | 12 | 9 | — | {"speed":0.2,"time":45} |
| pumpkin | Pumpkin | 2 | 5 minutes | 42 | 30 | — | — |
| mint | Mint | 3 | 5.833 minutes | 42 | 27 | — | {"regen":3,"time":60} |
| chili | Chili | 4 | 6.667 minutes | 54 | 36 | — | {"atk":0.2,"time":60} |
| candy | Candy bloom | 4 | 8.333 minutes | 78 | 54 | — | — |
| bean | Shield bean | 5 | 10 minutes | 72 | 48 | — | {"def":15,"time":90} |
| star | Star fruit | 6 | 13.333 minutes | 135 | 96 | — | — |
| berry | Berry | 6 | 11.667 minutes | 90 | 60 | — | {"xp":0.5,"time":120} |
| coffee | Coffee bean | 7 | 10 minutes | 84 | 54 | — | {"haste":0.35,"time":60} |
| moonflower | Moonflower | 8 | 15 minutes | 120 | 78 | — | {"crit":0.12,"time":90} |
| magnetmelon | Magnet melon | 9 | 16.667 minutes | 132 | 90 | — | {"magnet":1,"time":120} |
| melon | Melon | 9 | 20 minutes | 240 | 180 | — | — |
| clover | Lucky clover | 10 | 18.333 minutes | 150 | 102 | — | {"luck":0.6,"time":180} |
| glowshroom | Glow mushroom | 11 | 16.667 minutes | 144 | 90 | — | {"light":1,"regen":2,"time":240} |
| iceberry | Ice berry | 12 | 20 minutes | 180 | 120 | seed_ice | {"fireres":0.6,"time":120} |
| goldcorn | Golden corn | 13 | 25 minutes | 210 | 330 | — | — |
| dragonfruit | Dragon fruit | 15 | 26.667 minutes | 270 | 210 | seed_fire | {"atk":0.3,"regen":5,"time":90} |
| rainbowrose | Rainbow rose | 18 | 33.333 minutes | 360 | 270 | seed_star | {"atk":0.15,"def":12,"haste":0.15,"regen":3,"speed":0.1,"crit":0.05,"time":150} |
| apple | Magic Red Apple | 3 | 8 hours | 400 | 600 | — | — |
| grape | Juicy Purple Grapes | 5 | 8 hours | 450 | 700 | — | {"regen":4,"time":180} |
| mango | Golden Mango | 7 | 8 hours | 500 | 800 | — | {"speed":0.25,"time":180} |
| pineapple | Crown Pineapple | 9 | 12 hours | 750 | 1200 | — | {"atk":0.25,"time":180} |
| coconut | Refreshing Coconut | 11 | 12 hours | 800 | 1300 | — | {"fireres":0.5,"time":180} |
| durian | Spiky Durian | 14 | 12 hours | 950 | 1500 | — | {"def":25,"time":180} |
| lychee | Ruby Lychee | 16 | 14 hours | 1100 | 1800 | — | {"crit":0.15,"haste":0.2,"time":180} |
| peach | Immortal Peach | 18 | 14 hours | 1400 | 2200 | — | {"atk":0.2,"def":15,"regen":5,"xp":0.5,"time":300} |

## Fish and junk

Nineteen entries are non-junk, including Lake Guardian; the old boot is junk. Sizes are the catalog range in centimetres. Values are base values before catch-size and rarity multipliers. Water names are catalog membership; consult catch weights and current reachability separately.

| ID | Name | Rarity | Size cm | Sell | XP | Power | Catalog waters |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fish_perch | Perch | common | 10–60 | 6 | 9 | 0.2 | home, lake, swamp, ice |
| fish_clown | Clownfish | common | 10–60 | 10 | 12 | 0.3 | home, lake, candy, toy, ocean |
| fish_puffer | Pufferfish | common | 10–60 | 18 | 15 | 0.45 | home, lake, swamp, candy, toy, jungle |
| fish_carp | Carp | common | 10–60 | 28 | 20 | 0.62 | lake, swamp, candy, jungle, ice |
| fish_shark | Shark | rare | 10–60 | 65 | 27 | 0.92 | swamp, ocean, ice |
| fish_rainbow | Rainbow fish | rare | 10–60 | 160 | 24 | 0.8 | lake, swamp, candy, ice |
| fish_catfish | Catfish | common | 30–90 | 22 | 18 | 0.55 | lake, swamp, jungle |
| fish_koi | Koi | rare | 25–70 | 45 | 19 | 0.6 | home, toy |
| fish_eel | Eel | rare | 60–180 | 70 | 24 | 0.78 | swamp, jungle, dark, shadow |
| fish_swordfish | Swordfish | rare | 90–300 | 90 | 25 | 0.85 | lake, ocean |
| fish_jelly | Jellyfish | common | 10–40 | 26 | 14 | 0.4 | candy, toy, dark, shadow |
| fish_icepike | Ice pike | common | 50–150 | 48 | 22 | 0.7 | ice |
| fish_whale | Whale | legendary | 400–1200 | 420 | 113 | 0.97 | lake, ocean, ice |
| fish_kraken | Kraken | legendary | 200–800 | 380 | 112 | 0.96 | swamp, jungle, dark, shadow |
| fish_golden | Golden fish | legendary | 60–160 | 600 | 108 | 0.92 | home, lake, swamp, candy, toy, jungle, ocean, dark, ice, shadow |
| fish_sunfish | Sunfish | common | 80–250 | 60 | 22 | 0.72 | ocean |
| fish_angler | Anglerfish | rare | 30–90 | 85 | 24 | 0.8 | ocean, dark, shadow |
| fish_manta | Manta ray | legendary | 300–700 | 320 | 111 | 0.95 | ocean |
| boot | Old boot | junk | 10–60 | 1 | 8 | 0.15 | home, lake, swamp, candy, toy, jungle, ocean, dark, ice, shadow |
| fish_guardian | Lake Guardian | legendary | 180–260 | 450 | 114 | 0.98 | home |

## Catch weights

Weights are relative within each water pool before bait, rod, and luck modifiers. They are not percentages by themselves. Guardian has a separate retained hunting rule and no ordinary weight.

| Water | Relative entries |
| --- | --- |
| home | fish_perch: 50; fish_clown: 28; fish_puffer: 8; fish_koi: 6; fish_golden: 0.3; boot: 7 |
| lake | fish_perch: 26; fish_clown: 24; fish_puffer: 16; fish_carp: 14; fish_catfish: 14; fish_swordfish: 4; fish_rainbow: 3; fish_whale: 0.8; fish_golden: 0.4; boot: 6 |
| swamp | fish_perch: 14; fish_puffer: 20; fish_carp: 24; fish_catfish: 16; fish_shark: 14; fish_eel: 6; fish_rainbow: 5; fish_kraken: 0.8; fish_golden: 0.4; boot: 6 |
| candy | fish_clown: 26; fish_puffer: 20; fish_jelly: 22; fish_carp: 16; fish_rainbow: 12; fish_golden: 0.8; boot: 5 |
| toy | fish_clown: 30; fish_puffer: 22; fish_jelly: 16; fish_koi: 6; fish_golden: 0.5; boot: 14 |
| jungle | fish_catfish: 26; fish_carp: 20; fish_eel: 12; fish_puffer: 14; fish_kraken: 0.8; fish_golden: 0.5; boot: 6 |
| ocean | fish_clown: 16; fish_sunfish: 18; fish_swordfish: 12; fish_shark: 16; fish_angler: 8; fish_manta: 1.2; fish_whale: 1.2; fish_golden: 0.6; boot: 4 |
| dark | fish_angler: 26; fish_eel: 20; fish_jelly: 16; fish_kraken: 1.2; fish_golden: 0.6; boot: 6 |
| ice | fish_perch: 14; fish_carp: 24; fish_icepike: 20; fish_shark: 26; fish_rainbow: 8; fish_whale: 1.2; fish_golden: 0.5; boot: 5 |
| shadow | fish_angler: 26; fish_eel: 20; fish_jelly: 16; fish_kraken: 1.2; fish_golden: 0.6; boot: 6 |

## Recipes and shop entries

Index is the current array index used by craft rules. Energy and materials are the catalog inputs; station and gameplay rules can add availability conditions. Farm kitchen dishes follow in a separate table.

| Index | Result | Count | Station | Energy | Materials |
| --- | --- | --- | --- | --- | --- |
| 0 | sword_wood | 1 | shop | 25 | {} |
| 1 | gun_pea | 1 | shop | 40 | {} |
| 2 | sword_tusk | 1 | shop | 90 | {"tusk":2,"bone":3} |
| 3 | gun_bubble | 1 | shop | 140 | {"sap":4,"nectar":1} |
| 4 | gun_spike | 1 | shop | 220 | {"spine":10} |
| 5 | sword_crystal | 1 | shop | 320 | {"bloom":2,"claw":2,"bone":5} |
| 6 | hat_straw | 1 | shop | 20 | {} |
| 7 | hat_leather | 1 | shop | 45 | {"leather":3} |
| 8 | armor_leather | 1 | shop | 60 | {"leather":5} |
| 9 | armor_wolf | 1 | shop | 130 | {"leather":6,"claw":2} |
| 10 | armor_bone | 1 | shop | 200 | {"bone":8,"leather":4} |
| 11 | hat_party | 1 | shop | 15 | {} |
| 12 | hat_bunny | 1 | shop | 40 | {"leather":2} |
| 13 | hat_frog | 1 | shop | 45 | {"leather":2} |
| 14 | hat_cat | 1 | shop | 55 | {"leather":3} |
| 15 | hat_cowboy | 1 | shop | 60 | {"leather":4} |
| 16 | hat_chef | 1 | shop | 50 | {"sugar":3} |
| 17 | hat_santa | 1 | shop | 80 | {"leather":3,"icecrystal":2} |
| 18 | hat_pirate | 1 | shop | 90 | {"leather":4,"coral":2} |
| 19 | hat_wizard | 1 | shop | 120 | {"sap":3,"starshard":1} |
| 20 | hat_graduate | 1 | shop | 130 | {"leather":4,"gear":3} |
| 21 | hat_viking | 1 | shop | 150 | {"bone":6,"tusk":2} |
| 22 | hat_samurai | 1 | shop | 220 | {"bone":6,"obsidian":3} |
| 23 | hat_halo | 1 | shop | 380 | {"feather":8,"moonstone":1,"starshard":1} |
| 24 | armor_hoodie | 1 | shop | 50 | {"leather":3} |
| 25 | armor_hawaii | 1 | shop | 70 | {"leather":3,"coral":2} |
| 26 | armor_chef | 1 | shop | 60 | {"leather":3} |
| 27 | armor_santa | 1 | shop | 110 | {"leather":5,"icecrystal":3} |
| 28 | armor_army | 1 | shop | 220 | {"leather":4,"bone":2} |
| 29 | armor_navy | 1 | shop | 200 | {"leather":3,"coral":3} |
| 30 | armor_aodai | 1 | shop | 210 | {"leather":3,"feather":4} |
| 31 | armor_aodai_man | 1 | shop | 210 | {"leather":3,"feather":3,"moonstone":1} |
| 32 | armor_usa | 1 | shop | 190 | {"leather":4,"starshard":1,"coral":2} |
| 33 | armor_vietnam | 1 | shop | 190 | {"leather":4,"starshard":1,"bone":2} |
| 34 | armor_kimono | 1 | shop | 160 | {"leather":5,"nectar":1} |
| 35 | armor_pirate | 1 | shop | 170 | {"leather":6,"pearl":1} |
| 36 | armor_tux | 1 | shop | 200 | {"leather":6,"gear":4} |
| 37 | armor_knight | 1 | shop | 280 | {"bone":10,"obsidian":4} |
| 38 | armor_superhero | 1 | shop | 420 | {"starshard":2,"battery":2,"leather":6} |
| 39 | armor_angel | 1 | shop | 500 | {"feather":14,"moonstone":1,"starshard":2} |
| 40 | boots_cowboy | 1 | shop | 70 | {"leather":4} |
| 41 | boots_flipper | 1 | shop | 130 | {"coral":5,"leather":2} |
| 42 | boots_cloud | 1 | shop | 240 | {"feather":10} |
| 43 | boots_rocket | 1 | shop | 320 | {"battery":2,"gear":6,"magma":2} |
| 44 | dz_snowman | 1 | shop | 530 | {"icecrystal":10,"leather":4} |
| 45 | dz_dawnstar | 1 | shop | 410 | {"starshard":2,"feather":6,"sugar":6} |
| 46 | dz_fairy | 1 | shop | 480 | {"nectar":3,"sugar":8,"feather":4} |
| 47 | dz_ninja | 1 | shop | 550 | {"leather":8,"shadow":4,"claw":2} |
| 48 | dz_army | 1 | shop | 380 | {"pearl":2,"coral":8,"leather":6} |
| 49 | dz_navy | 1 | shop | 400 | {"pearl":2,"coral":8,"leather":6} |
| 50 | dz_aodai | 1 | shop | 420 | {"pearl":2,"coral":8,"leather":6} |
| 51 | dz_aodai_man | 1 | shop | 310 | {"pearl":2,"coral":8,"leather":6} |
| 52 | dz_usa | 1 | shop | 510 | {"pearl":2,"coral":8,"leather":6} |
| 53 | dz_vietnam | 1 | shop | 320 | {"pearl":2,"coral":8,"leather":6} |
| 54 | dz_pirate | 1 | shop | 300 | {"pearl":2,"coral":8,"leather":6} |
| 55 | dz_mage | 1 | shop | 410 | {"starshard":2,"sap":6,"fcrystal":2} |
| 56 | dz_knight | 1 | shop | 480 | {"bone":12,"obsidian":6} |
| 57 | dz_dino | 1 | shop | 300 | {"amber":3,"vine":10,"bone":6} |
| 58 | dz_mecha | 1 | shop | 530 | {"gear":14,"battery":3} |
| 59 | dz_vampire | 1 | shop | 440 | {"shadow":10,"moonstone":1,"leather":6} |
| 60 | dz_superhero | 1 | shop | 600 | {"starshard":3,"thunderstone":2,"battery":2} |
| 61 | potion | 1 | shop | 15 | {} |
| 62 | worm | 5 | shop | 6 | {} |
| 63 | manure | 1 | shop | 8 | {} |
| 64 | rod | 1 | shop | 20 | {} |
| 65 | rod_gold | 1 | shop | 150 | {"bone":3,"sap":2} |
| 66 | rod_steady | 1 | shop | 900 | {"coral":4,"pearl":2} |
| 67 | plot_kit | 1 | shop | 80 | {} |
| 68 | sword_candy | 1 | shop | 200 | {"sugar":8,"bone":2} |
| 69 | gun_ice | 1 | shop | 260 | {"icecrystal":8,"sap":2} |
| 70 | sword_lava | 1 | shop | 420 | {"magma":8,"starshard":1} |
| 71 | hat_space | 1 | shop | 240 | {"starshard":2,"icecrystal":3} |
| 72 | armor_space | 1 | shop | 360 | {"starshard":3,"sugar":5,"magma":3} |
| 73 | bow_star | 1 | shop | 480 | {"sugar":10,"sap":4,"starshard":2} |
| 74 | hammer_thunder | 1 | shop | 520 | {"bone":10,"icecrystal":6,"starshard":2} |
| 75 | staff_fire | 1 | shop | 560 | {"magma":8,"firecore":2,"obsidian":4} |
| 76 | scythe_moon | 1 | shop | 600 | {"icecrystal":8,"obsidian":4,"starshard":3} |
| 77 | blaster_rainbow | 1 | shop | 700 | {"sugar":6,"icecrystal":6,"magma":6,"starshard":3} |
| 78 | boots_lava | 1 | craft | 180 | {"obsidian":4,"mcrystal":6} |
| 79 | sword_obsidian | 1 | craft | 450 | {"obsidian":10,"firecore":2,"mcrystal":6} |
| 80 | armor_wings | 1 | craft | 420 | {"firecore":3,"dragonscale":2,"obsidian":6} |
| 81 | pet_dragon | 1 | craft | 300 | {"dragonegg":1,"firecore":3} |
| 82 | toy_hammer | 1 | craft | 150 | {"gear":8,"battery":1} |
| 83 | deco_teddy | 1 | craft | 60 | {"gear":4,"leather":3} |
| 84 | deco_musicbox | 1 | craft | 90 | {"gear":6,"battery":1} |
| 85 | pet_robot | 1 | craft | 260 | {"battery":3,"gear":10} |
| 86 | armor_leaf | 1 | craft | 220 | {"vine":10,"amber":1} |
| 87 | deco_totem | 1 | craft | 90 | {"vine":6,"amber":1} |
| 88 | deco_rafflesia | 1 | craft | 70 | {"vine":4,"nectar":1} |
| 89 | pet_parrot | 1 | craft | 280 | {"amber":3,"vine":8,"feather":2} |
| 90 | trident | 1 | craft | 520 | {"pearl":4,"coral":10,"starshard":2} |
| 91 | deco_aquarium | 1 | craft | 120 | {"coral":8,"pearl":1} |
| 92 | deco_shell | 1 | craft | 70 | {"coral":5} |
| 93 | pet_turtle | 1 | craft | 300 | {"pearl":3,"coral":8} |
| 94 | armor_cloud | 1 | craft | 450 | {"feather":14,"thunderstone":2} |
| 95 | deco_cloudsofa | 1 | craft | 100 | {"feather":8} |
| 96 | deco_windchime | 1 | craft | 90 | {"feather":4,"icecrystal":3} |
| 97 | pet_sheep | 1 | craft | 340 | {"feather":12,"thunderstone":1} |
| 98 | hat_lantern | 1 | craft | 480 | {"shadow":12,"moonstone":2,"fcrystal":2} |
| 99 | deco_ghostlantern | 1 | craft | 90 | {"shadow":5,"fcrystal":1} |
| 100 | deco_nightcrystal | 1 | craft | 140 | {"shadow":8,"moonstone":1} |
| 101 | pet_firefly | 1 | craft | 380 | {"shadow":10,"moonstone":2,"fcrystal":3} |
| 102 | deco_volcano | 1 | craft | 40 | {"mcrystal":4} |
| 103 | deco_lamp | 1 | craft | 60 | {"mcrystal":3,"fcrystal":1} |
| 104 | deco_table | 1 | craft | 90 | {"obsidian":5} |
| 105 | deco_statue | 1 | craft | 160 | {"obsidian":8,"firecore":1} |
| 106 | deco_nest | 1 | craft | 120 | {"obsidian":3,"dragonscale":1} |
| 107 | deco_trophy | 1 | craft | 250 | {"dragonscale":3,"firecore":2} |
| 108 | obsidian | 1 | forge | 0 | {"mcrystal":3} |
| 109 | firecore | 1 | forge | 0 | {"obsidian":3,"mcrystal":2} |
| 110 | harpoon | 1 | shop | 1000 | {} |

| Farm dish | Materials |
| --- | --- |
| omelette | {"egg":2} |
| pancake | {"egg":1,"milk":1} |
| milkshake | {"milk":2} |
| cheese | {"milk":3} |

## Item definitions

Price is the exported item price field; shop recipes, special offers, level gates, material requirements, and dynamic bed prices can determine actual availability and cost. Slot names here are catalog slots; extra side and pet slots are described in the combat reference. Stats, buffs, and weapon fields retain their internal names for exact comparison.

### armor

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| armor_leather | Leather outfit | 60 | 30 | outfit | {"def":8,"hp":25} | — | — |
| armor_wolf | Wolf outfit | 130 | 65 | outfit | {"def":12,"hp":30,"speed":0.12} | — | — |
| armor_space | Space outfit | 360 | 180 | outfit | {"def":26,"hp":80,"speed":0.08} | — | — |
| armor_bone | Bone outfit | 200 | 100 | outfit | {"def":20,"hp":60} | — | — |
| armor_leaf | Leaf outfit | — | 140 | outfit | {"def":18,"hp":50,"regen":2} | — | — |
| armor_cloud | Cloud outfit | — | 260 | outfit | {"def":26,"hp":80,"speed":0.15} | — | — |
| armor_wings | Dragon wings | — | 240 | outfit | {"def":24,"hp":70,"speed":0.18} | — | — |
| armor_knight | Knight outfit | 280 | 160 | outfit | {"def":28,"hp":90,"speed":-0.05} | — | — |
| armor_pirate | Pirate outfit | 170 | 90 | outfit | {"def":14,"hp":40,"crit":0.05} | — | — |
| armor_chef | Chef outfit | 60 | 40 | outfit | {"def":8,"hp":40,"regen":1} | — | — |
| armor_tux | Tuxedo | 200 | 120 | outfit | {"def":12,"hp":35,"crit":0.08} | — | — |
| armor_kimono | Kimono | 160 | 100 | outfit | {"def":12,"hp":40,"speed":0.1} | — | — |
| armor_hawaii | Island shirt | 70 | 45 | outfit | {"def":8,"hp":30,"speed":0.08} | — | — |
| armor_superhero | Superhero outfit | 420 | 220 | outfit | {"def":20,"hp":70,"atk":8,"speed":0.1} | — | — |
| armor_angel | Angel outfit | 500 | 260 | outfit | {"def":22,"hp":90,"regen":3} | — | — |
| armor_santa | Santa outfit | 110 | 70 | outfit | {"def":12,"hp":50} | — | — |
| armor_hoodie | Hoodie | 50 | 35 | outfit | {"def":6,"hp":30,"speed":0.05} | — | — |
| armor_army | Army uniform | 220 | 90 | outfit | {"def":14,"hp":45,"crit":0.05} | — | — |
| armor_navy | Navy uniform | 200 | 90 | outfit | {"def":12,"hp":40,"speed":0.04} | — | — |
| armor_aodai | Vietnamese long dress | 210 | 95 | outfit | {"def":10,"hp":50,"regen":1} | — | — |
| armor_aodai_man | Vietnamese long gown | 210 | 95 | outfit | {"def":13,"hp":40,"crit":0.06} | — | — |
| armor_usa | Stars and stripes outfit | 190 | 85 | outfit | {"def":11,"hp":35,"speed":0.05} | — | — |
| armor_vietnam | Vietnam flag outfit | 190 | 85 | outfit | {"def":11,"hp":45,"crit":0.05} | — | — |
| dye_gilded_armor_knight | Gilded Knight outfit | — | 0 | outfit | {"def":28,"hp":90,"speed":-0.05} | — | — |
| dye_prism_armor_angel | Prism Angel outfit | — | 0 | outfit | {"def":22,"hp":90,"regen":3} | — | — |
| dye_frost_armor_space | Frost Space outfit | — | 0 | outfit | {"def":26,"hp":80,"speed":0.08} | — | — |
| dye_shade_armor_tux | Shade Tuxedo | — | 0 | outfit | {"def":12,"hp":35,"crit":0.08} | — | — |
| dye_ruby_armor_kimono | Ruby Kimono | — | 0 | outfit | {"def":12,"hp":40,"speed":0.1} | — | — |

### bait

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| worm | Worm bait | 6 | 1 | — | — | — | — |

### crop

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| radish | Radish | — | 12 | — | — | — | — |
| carrot | Carrot | — | 9 | — | — | {"speed":0.2,"time":45} | — |
| pumpkin | Pumpkin | — | 30 | — | — | — | — |
| mint | Mint | — | 27 | — | — | {"regen":3,"time":60} | — |
| chili | Chili | — | 36 | — | — | {"atk":0.2,"time":60} | — |
| candy | Candy bloom | — | 54 | — | — | — | — |
| bean | Shield bean | — | 48 | — | — | {"def":15,"time":90} | — |
| star | Star fruit | — | 96 | — | — | — | — |
| berry | Berry | — | 60 | — | — | {"xp":0.5,"time":120} | — |
| coffee | Coffee bean | — | 54 | — | — | {"haste":0.35,"time":60} | — |
| moonflower | Moonflower | — | 78 | — | — | {"crit":0.12,"time":90} | — |
| magnetmelon | Magnet melon | — | 90 | — | — | {"magnet":1,"time":120} | — |
| melon | Melon | — | 180 | — | — | — | — |
| clover | Lucky clover | — | 102 | — | — | {"luck":0.6,"time":180} | — |
| glowshroom | Glow mushroom | — | 90 | — | — | {"light":1,"regen":2,"time":240} | — |
| iceberry | Ice berry | — | 120 | — | — | {"fireres":0.6,"time":120} | — |
| goldcorn | Golden corn | — | 330 | — | — | — | — |
| dragonfruit | Dragon fruit | — | 210 | — | — | {"atk":0.3,"regen":5,"time":90} | — |
| rainbowrose | Rainbow rose | — | 270 | — | — | {"atk":0.15,"def":12,"haste":0.15,"regen":3,"speed":0.1,"crit":0.05,"time":150} | — |
| apple | Magic Red Apple | — | 600 | — | — | — | — |
| grape | Juicy Purple Grapes | — | 700 | — | — | {"regen":4,"time":180} | — |
| mango | Golden Mango | — | 800 | — | — | {"speed":0.25,"time":180} | — |
| pineapple | Crown Pineapple | — | 1200 | — | — | {"atk":0.25,"time":180} | — |
| coconut | Refreshing Coconut | — | 1300 | — | — | {"fireres":0.5,"time":180} | — |
| durian | Spiky Durian | — | 1500 | — | — | {"def":25,"time":180} | — |
| lychee | Ruby Lychee | — | 1800 | — | — | {"crit":0.15,"haste":0.2,"time":180} | — |
| peach | Immortal Peach | — | 2200 | — | — | {"atk":0.2,"def":15,"regen":5,"xp":0.5,"time":300} | — |

### decor

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| deco_volcano | Little volcano | — | 20 | — | — | — | — |
| deco_lamp | Lava lamp | — | 30 | — | — | — | — |
| deco_table | Obsidian table | — | 45 | — | — | — | — |
| deco_statue | Golem statue | — | 80 | — | — | — | — |
| deco_nest | Dragon nest | — | 90 | — | — | — | — |
| deco_trophy | Dragon trophy | — | 150 | — | — | — | — |
| deco_teddy | Giant teddy | — | 40 | — | — | — | — |
| deco_musicbox | Music box | — | 55 | — | — | — | — |
| deco_traincar | Toy train | — | 80 | — | — | — | — |
| deco_totem | Forest totem | — | 60 | — | — | — | — |
| deco_rafflesia | Giant forest flower | — | 45 | — | — | — | — |
| deco_fruittree | Fruit tree | — | 90 | — | — | — | — |
| deco_aquarium | Coral aquarium | — | 90 | — | — | — | — |
| deco_shell | Giant seashell | — | 50 | — | — | — | — |
| deco_piratechest | Pirate treasure | — | 150 | — | — | — | — |
| deco_cloudsofa | Cloud sofa | — | 70 | — | — | — | — |
| deco_windchime | Crystal wind chime | — | 60 | — | — | — | — |
| deco_rainbow | Rainbow arch | — | 160 | — | — | — | — |
| deco_ghostlantern | Ghost lantern | — | 60 | — | — | — | — |
| deco_nightcrystal | Night crystal | — | 90 | — | — | — | — |
| deco_owlstatue | Owl statue | — | 180 | — | — | — | — |
| deco_dgchest | Delver's Chest | — | 260 | — | — | — | — |

### disguise

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dz_ninja | Shadow ninja | 550 | 300 | disguise | {"atk":8,"crit":0.15,"speed":0.2} | — | — |
| dz_mage | Archmage | 410 | 230 | disguise | {"atk":12,"hp":20} | — | — |
| dz_knight | Sun knight | 480 | 260 | disguise | {"def":25,"hp":120,"atk":6} | — | — |
| dz_mecha | Battle robot | 530 | 290 | disguise | {"atk":6,"def":12,"hp":60} | — | — |
| dz_dino | Tyrannosaur | 300 | 170 | disguise | {"atk":14,"hp":90} | — | — |
| dz_fairy | Flower fairy | 480 | 260 | disguise | {"hp":40,"regen":4,"speed":0.15} | — | — |
| dz_pirate | Pirate captain | 300 | 170 | disguise | {"atk":10,"crit":0.08} | — | — |
| dz_army | Army soldier | 380 | 210 | disguise | {"atk":10,"crit":0.08} | — | — |
| dz_navy | Navy sailor | 400 | 220 | disguise | {"atk":10,"crit":0.08} | — | — |
| dz_aodai | Ao dai lady | 420 | 230 | disguise | {"atk":10,"crit":0.08} | — | — |
| dz_aodai_man | Ao dai gentleman | 310 | 170 | disguise | {"atk":10,"crit":0.08} | — | — |
| dz_usa | Stars and stripes | 510 | 280 | disguise | {"atk":10,"crit":0.08} | — | — |
| dz_vietnam | Vietnam flag | 320 | 180 | disguise | {"atk":10,"crit":0.08} | — | — |
| dz_superhero | Superhero | 600 | 330 | disguise | {"atk":16,"def":12,"speed":0.25} | — | — |
| dz_vampire | Vampire count | 440 | 240 | disguise | {"atk":12,"crit":0.1} | — | — |
| dz_snowman | Snowman | 530 | 290 | disguise | {"def":10,"hp":60} | — | — |
| dz_dawnstar | Dawn star dancer | 410 | 230 | disguise | {"hp":40,"regen":3,"speed":0.1} | — | — |

### effect

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| guard | Garden protection | — | 0 | — | — | — | — |

### farm

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| manure | Fertilizer | 8 | 2 | — | — | — | — |
| spore | Magic spore | — | 25 | — | — | — | — |

### feet

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| boots_rocket | Rocket boots | 320 | 200 | boots | {"def":4,"speed":0.25} | — | — |
| boots_cowboy | Cowboy boots | 70 | 50 | boots | {"def":8,"hp":20} | — | — |
| boots_flipper | Swim flippers | 130 | 90 | boots | {"def":3} | — | — |
| boots_cloud | Cloud boots | 240 | 160 | boots | {"def":5,"speed":0.12} | — | — |
| boots_lava | Lava boots | — | 90 | boots | {"def":6} | — | — |
| dye_gilded_boots_rocket | Gilded Rocket boots | — | 0 | boots | {"def":4,"speed":0.25} | — | — |
| dye_frost_boots_cloud | Frost Cloud boots | — | 0 | boots | {"def":5,"speed":0.12} | — | — |
| dye_shade_boots_cowboy | Shade Cowboy boots | — | 0 | boots | {"def":8,"hp":20} | — | — |

### fish

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fish_perch | Perch | — | 6 | — | — | — | — |
| fish_clown | Clownfish | — | 10 | — | — | — | — |
| fish_puffer | Pufferfish | — | 18 | — | — | — | — |
| fish_carp | Carp | — | 28 | — | — | — | — |
| fish_shark | Shark | — | 65 | — | — | — | — |
| fish_rainbow | Rainbow fish | — | 160 | — | — | {"atk":0.2,"def":10,"time":120} | — |
| fish_catfish | Catfish | — | 22 | — | — | — | — |
| fish_koi | Koi | — | 45 | — | — | {"luck":0.3,"time":120} | — |
| fish_eel | Eel | — | 70 | — | — | {"haste":0.3,"time":60} | — |
| fish_swordfish | Swordfish | — | 90 | — | — | {"crit":0.1,"time":90} | — |
| fish_jelly | Jellyfish | — | 26 | — | — | — | — |
| fish_icepike | Ice pike | — | 48 | — | — | {"fireres":0.4,"time":90} | — |
| fish_whale | Whale | — | 420 | — | — | {"def":25,"regen":5,"time":180} | — |
| fish_kraken | Kraken | — | 380 | — | — | {"atk":0.35,"time":120} | — |
| fish_golden | Golden fish | — | 600 | — | — | {"atk":0.25,"def":15,"crit":0.1,"luck":0.5,"time":180} | — |
| fish_sunfish | Sunfish | — | 60 | — | — | {"regen":4,"time":90} | — |
| fish_angler | Anglerfish | — | 85 | — | — | {"light":1,"time":240} | — |
| fish_manta | Manta ray | — | 320 | — | — | {"speed":0.3,"def":15,"time":150} | — |
| fish_guardian | Lake Guardian | — | 450 | — | — | {"luck":0.4,"regen":6,"time":240} | — |

### food

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| meat | Meat | — | 3 | — | — | — | — |
| claw | Claw | — | 22 | — | — | {"haste":0.35,"time":60} | — |
| nectar | Nectar | — | 24 | — | — | {"atk":0.3,"time":60} | — |
| cwater | Cactus water | — | 8 | — | — | {"regen":4,"time":30} | — |
| bloom | Wild flower | — | 30 | — | — | {"def":20,"time":90} | — |
| honey | Honey | — | 40 | — | — | {"atk":0.25,"time":60} | — |
| potion | Healing potion | 15 | 6 | — | — | — | — |
| cooked_radish | Roasted radish | — | 28 | — | — | — | — |
| cooked_carrot | Roasted carrot | — | 22 | — | — | {"speed":0.27,"time":90} | — |
| cooked_pumpkin | Roasted pumpkin | — | 68 | — | — | — | — |
| cooked_mint | Roasted mint | — | 61 | — | — | {"regen":4.050000000000001,"time":120} | — |
| cooked_chili | Roasted chili | — | 81 | — | — | {"atk":0.27,"time":120} | — |
| cooked_candy | Roasted candy bloom | — | 121 | — | — | — | — |
| cooked_bean | Roasted shield bean | — | 108 | — | — | {"def":20.25,"time":180} | — |
| cooked_star | Roasted star fruit | — | 213 | — | — | — | — |
| cooked_berry | Roasted berry | — | 134 | — | — | {"xp":0.675,"time":240} | — |
| cooked_coffee | Roasted coffee bean | — | 121 | — | — | {"haste":0.4725,"time":120} | — |
| cooked_moonflower | Roasted moonflower | — | 174 | — | — | {"crit":0.162,"time":180} | — |
| cooked_magnetmelon | Roasted magnet melon | — | 200 | — | — | {"magnet":1,"time":240} | — |
| cooked_melon | Roasted melon | — | 398 | — | — | — | — |
| cooked_clover | Roasted lucky clover | — | 226 | — | — | {"luck":0.81,"time":360} | — |
| cooked_glowshroom | Roasted glow mushroom | — | 200 | — | — | {"light":1,"regen":2.7,"time":480} | — |
| cooked_iceberry | Roasted ice berry | — | 266 | — | — | {"fireres":0.81,"time":240} | — |
| cooked_goldcorn | Roasted golden corn | — | 728 | — | — | — | — |
| cooked_dragonfruit | Roasted dragon fruit | — | 464 | — | — | {"atk":0.405,"regen":6.75,"time":180} | — |
| cooked_rainbowrose | Roasted rainbow rose | — | 596 | — | — | {"atk":0.2025,"def":16.200000000000003,"haste":0.2025,"regen":4.050000000000001,"speed":0.135,"crit":0.0675,"time":300} | — |
| cooked_apple | Roasted magic red apple | — | 1322 | — | — | — | — |
| cooked_grape | Roasted juicy purple grapes | — | 1542 | — | — | {"regen":5.4,"time":360} | — |
| cooked_mango | Roasted golden mango | — | 1762 | — | — | {"speed":0.3375,"time":360} | — |
| cooked_pineapple | Roasted crown pineapple | — | 2642 | — | — | {"atk":0.3375,"time":360} | — |
| cooked_coconut | Roasted refreshing coconut | — | 2862 | — | — | {"fireres":0.675,"time":360} | — |
| cooked_durian | Roasted spiky durian | — | 3302 | — | — | {"def":33.75,"time":360} | — |
| cooked_lychee | Roasted ruby lychee | — | 3962 | — | — | {"crit":0.2025,"haste":0.27,"time":360} | — |
| cooked_peach | Roasted immortal peach | — | 4842 | — | — | {"atk":0.27,"def":20.25,"regen":6.75,"xp":0.675,"time":600} | — |
| cooked_meat | Roasted meat | — | 9 | — | — | — | — |
| cooked_fish_perch | Roasted perch | — | 15 | — | — | — | — |
| cooked_fish_clown | Roasted clownfish | — | 24 | — | — | — | — |
| cooked_fish_puffer | Roasted pufferfish | — | 42 | — | — | — | — |
| cooked_fish_carp | Roasted carp | — | 64 | — | — | — | — |
| cooked_fish_shark | Roasted shark | — | 145 | — | — | — | — |
| cooked_fish_rainbow | Roasted rainbow fish | — | 354 | — | — | {"atk":0.27,"def":13.5,"time":240} | — |
| cooked_fish_catfish | Roasted catfish | — | 50 | — | — | — | — |
| cooked_fish_koi | Roasted koi | — | 101 | — | — | {"luck":0.405,"time":240} | — |
| cooked_fish_eel | Roasted eel | — | 156 | — | — | {"haste":0.405,"time":120} | — |
| cooked_fish_swordfish | Roasted swordfish | — | 200 | — | — | {"crit":0.135,"time":180} | — |
| cooked_fish_jelly | Roasted jellyfish | — | 59 | — | — | — | — |
| cooked_fish_icepike | Roasted ice pike | — | 108 | — | — | {"fireres":0.54,"time":180} | — |
| cooked_fish_whale | Roasted whale | — | 926 | — | — | {"def":33.75,"regen":6.75,"time":360} | — |
| cooked_fish_kraken | Roasted kraken | — | 838 | — | — | {"atk":0.4725,"time":240} | — |
| cooked_fish_golden | Roasted golden fish | — | 1322 | — | — | {"atk":0.3375,"def":20.25,"crit":0.135,"luck":0.675,"time":360} | — |
| cooked_fish_sunfish | Roasted sunfish | — | 134 | — | — | {"regen":5.4,"time":180} | — |
| cooked_fish_angler | Roasted anglerfish | — | 189 | — | — | {"light":1,"time":480} | — |
| cooked_fish_manta | Roasted manta ray | — | 706 | — | — | {"speed":0.405,"def":20.25,"time":300} | — |
| egg | Egg | — | 6 | — | — | — | — |
| milk | Milk | — | 14 | — | — | — | — |
| goat_milk | Goat milk | — | 22 | — | — | — | — |
| goose_egg | Goose egg | — | 32 | — | — | — | — |
| duck_egg | Duck egg | — | 25 | — | — | — | — |
| truffle | Garden truffle | — | 80 | — | — | {"luck":0.2,"time":120} | — |
| omelette | Omelette | — | 18 | — | — | {"def":10,"time":90} | — |
| milkshake | Milkshake | — | 34 | — | — | {"speed":0.25,"time":90} | — |
| cheese | Cheese wheel | — | 50 | — | — | {"regen":3,"time":120} | — |
| pancake | Pancakes | — | 26 | — | — | {"xp":0.3,"time":120} | — |

### hat

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hat_straw | Straw hat | 20 | 10 | hat | {"def":3,"hp":10} | — | — |
| hat_leather | Leather hat | 45 | 25 | hat | {"def":7,"hp":20} | — | — |
| hat_bear | Bear hat | — | 90 | hat | {"def":12,"atk":5,"hp":40} | — | — |
| crown | Royal crown | — | 200 | hat | {"atk":10,"crit":0.15} | — | — |
| hat_space | Space hat | 240 | 120 | hat | {"def":14,"hp":45,"atk":4} | — | — |
| hat_lantern | Lantern hat | — | 200 | hat | {"def":16,"hp":50} | — | — |
| hat_cowboy | Cowboy hat | 60 | 30 | hat | {"def":6,"hp":20,"crit":0.03} | — | — |
| hat_wizard | Wizard hat | 120 | 60 | hat | {"def":5,"hp":15,"atk":6} | — | — |
| hat_pirate | Pirate hat | 90 | 50 | hat | {"def":8,"hp":25} | — | — |
| hat_chef | Chef hat | 50 | 35 | hat | {"def":4,"hp":30} | — | — |
| hat_bunny | Bunny hat | 40 | 30 | hat | {"def":3,"hp":15,"speed":0.06} | — | — |
| hat_cat | Cat hat | 55 | 40 | hat | {"def":7,"hp":25} | — | — |
| hat_viking | Viking hat | 150 | 80 | hat | {"def":14,"hp":40,"atk":4} | — | — |
| hat_santa | Santa hat | 80 | 45 | hat | {"def":6,"hp":30,"regen":1} | — | — |
| hat_graduate | Graduation cap | 130 | 70 | hat | {"def":5,"hp":20} | — | — |
| hat_samurai | Samurai hat | 220 | 110 | hat | {"def":16,"hp":45,"crit":0.05} | — | — |
| hat_party | Party hat | 15 | 7 | hat | {"hp":10} | — | — |
| hat_halo | Halo | 380 | 150 | hat | {"def":10,"hp":60,"regen":2} | — | — |
| hat_frog | Frog hat | 45 | 35 | hat | {"def":5,"hp":20,"speed":0.05} | — | — |
| hat_t_turtle | Ancient Mountain Helm | — | 900 | hat | {"def":30,"hp":150,"regen":3} | — | — |
| hat_t_hydra | Candy Hydra Crown | — | 900 | hat | {"atk":16,"crit":0.08,"hp":60} | — | — |
| hat_t_crystal | Ice Crystal Crown | — | 950 | hat | {"crit":0.12,"def":18,"hp":80} | — | — |
| hat_t_scorpion | Inferno Scorpion Helm | — | 1000 | hat | {"atk":20,"def":12} | — | — |
| hat_t_clock | Clockwork Crown | — | 900 | hat | {"speed":0.18,"atk":10} | — | — |
| hat_t_flower | Rafflesia Crown | — | 950 | hat | {"hp":120,"regen":5} | — | — |
| hat_t_kraken | Kraken Tentacle Hat | — | 950 | hat | {"def":16,"atk":12} | — | — |
| hat_t_whale | Cloud Whale Hat | — | 1000 | hat | {"speed":0.22,"hp":140} | — | — |
| hat_t_eye | Void Eye Crown | — | 1100 | hat | {"atk":22,"crit":0.1} | — | — |
| hat_colossus | Cinderhorn Crown | — | 2000 | hat | {"atk":22,"def":26,"hp":150,"crit":0.08} | — | — |
| dye_gilded_hat_samurai | Gilded Samurai hat | — | 0 | hat | {"def":16,"hp":45,"crit":0.05} | — | — |
| dye_prism_hat_halo | Prism Halo | — | 0 | hat | {"def":10,"hp":60,"regen":2} | — | — |
| dye_frost_hat_viking | Frost Viking hat | — | 0 | hat | {"def":14,"hp":40,"atk":4} | — | — |
| dye_shade_hat_pirate | Shade Pirate hat | — | 0 | hat | {"def":8,"hp":25} | — | — |
| dye_ruby_hat_wizard | Ruby Wizard hat | — | 0 | hat | {"def":5,"hp":15,"atk":6} | — | — |

### junk

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| boot | Old boot | — | 1 | — | — | — | — |

### material

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed_fire | Fire seed | — | 30 | — | — | — | — |
| seed_ice | Ice seed | — | 25 | — | — | — | — |
| seed_star | Star seed | — | 60 | — | — | — | — |
| leather | Leather | — | 4 | — | — | — | — |
| bone | Bone | — | 3 | — | — | — | — |
| tusk | Tusk | — | 20 | — | — | — | — |
| sap | Sap | — | 5 | — | — | — | — |
| spine | Cactus spine | — | 4 | — | — | — | — |
| sugar | Sugar | — | 7 | — | — | — | — |
| icecrystal | Ice crystal | — | 10 | — | — | — | — |
| magma | Magma | — | 14 | — | — | — | — |
| starshard | Star shard | — | 60 | — | — | — | — |
| mcrystal | Magma crystal | — | 12 | — | — | — | — |
| obsidian | Obsidian | — | 18 | — | — | — | — |
| firecore | Fire core | — | 45 | — | — | — | — |
| dragonscale | Dragon scale | — | 120 | — | — | — | — |
| fcrystal | Fire crystal | — | 15 | — | — | — | — |
| gear | Toy gear | — | 10 | — | — | — | — |
| battery | Battery | — | 40 | — | — | — | — |
| vine | Vine | — | 12 | — | — | — | — |
| amber | Amber | — | 55 | — | — | — | — |
| pearl | Pearl | — | 60 | — | — | — | — |
| coral | Coral | — | 14 | — | — | — | — |
| feather | Feather | — | 16 | — | — | — | — |
| thunderstone | Thunder stone | — | 70 | — | — | — | — |
| shadow | Shadow essence | — | 22 | — | — | — | — |
| moonstone | Moonstone | — | 90 | — | — | — | — |
| dragonegg | Dragon egg | — | 200 | — | — | — | — |
| wood | Wild wood | — | 5 | — | — | — | — |
| dg_seal | Rune Seal | — | 60 | — | — | — | — |
| colossus_shard | Cinder Heartstone | — | 220 | — | — | — | — |

### pet

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pet_robot | Robot companion | — | 150 | pet | {"atk":3} | — | — |
| pet_parrot | Parrot companion | — | 160 | pet | {"atk":3} | — | — |
| pet_turtle | Turtle companion | — | 180 | pet | {"def":8} | — | — |
| pet_sheep | Sheep companion | — | 220 | pet | {"hp":40} | — | — |
| pet_firefly | Firefly companion | — | 260 | pet | {"atk":4} | — | — |
| pet_dragon | Dragon companion | — | 300 | pet | {"atk":4} | — | — |
| bunny | Mochi bunny | — | 0 | pet | {"atk":3} | — | — |
| pet_dog | Garden guard dog | — | 0 | pet | — | — | — |
| pet_t_turtle | Little Mountain Turtle | — | 1400 | pet | {"def":25,"hp":120,"regen":3} | — | — |
| pet_t_hydra | Little Candy Hydra | — | 1400 | pet | {"atk":12} | — | — |
| pet_t_crystal | Little Crystal Queen | — | 1450 | pet | {"crit":0.1} | — | — |
| pet_t_scorpion | Little Inferno Scorpion | — | 1500 | pet | {"atk":14} | — | — |
| pet_t_clock | Little Clockwork Spider | — | 1400 | pet | {"speed":0.15} | — | — |
| pet_t_flower | Little Rafflesia | — | 1450 | pet | {"hp":100,"regen":6} | — | — |
| pet_t_kraken | Little Abyssal Kraken | — | 1450 | pet | {"def":12} | — | — |
| pet_t_whale | Little Cloud Whale | — | 1500 | pet | {"hp":150,"speed":0.2} | — | — |
| pet_t_eye | Little Void Eye | — | 1600 | pet | {"atk":16,"crit":0.08} | — | — |
| pet_b_bear | Little King Bear | — | 600 | pet | {"hp":40,"def":6} | — | — |
| pet_b_treant | Little Ancient Treant | — | 620 | pet | {"hp":45,"regen":1} | — | — |
| pet_b_croc | Little Crocodile King | — | 640 | pet | {"atk":8,"def":4} | — | — |
| pet_b_mushking | Little Mushroom King | — | 620 | pet | {"hp":40,"regen":1} | — | — |
| pet_b_cake | Little Cake King | — | 660 | pet | {"hp":45,"speed":0.05} | — | — |
| pet_b_gingerbread | Little Gingerbread Giant | — | 660 | pet | {"def":8,"hp":30} | — | — |
| pet_b_jellyqueen | Little Jelly Queen | — | 680 | pet | {"hp":50,"regen":1} | — | — |
| pet_b_yeti | Little Snow Yeti | — | 700 | pet | {"def":9,"hp":40} | — | — |
| pet_b_mammoth | Little Ice Mammoth | — | 720 | pet | {"hp":60,"def":6} | — | — |
| pet_b_frostowl | Little Frost Owl | — | 740 | pet | {"atk":8,"crit":0.03} | — | — |
| pet_b_golem | Little Magma Golem | — | 760 | pet | {"def":10,"hp":50} | — | — |
| pet_b_dragon | Little Volcano Dragon | — | 880 | pet | {"atk":12,"crit":0.04} | — | — |
| pet_b_robot | Little Giant Toy Robot | — | 700 | pet | {"atk":9,"def":5} | — | — |
| pet_b_gorilla | Little Jungle Gorilla | — | 780 | pet | {"atk":11,"hp":40} | — | — |
| pet_b_leviathan | Little Ocean Leviathan | — | 840 | pet | {"hp":70,"speed":0.08} | — | — |
| pet_b_phoenix | Little Thunder Phoenix | — | 860 | pet | {"atk":12,"speed":0.08} | — | — |
| pet_b_shadowlord | Little Shadow Lord | — | 900 | pet | {"atk":13,"crit":0.05} | — | — |
| pet_dg_morel | Little Morel | — | 1500 | pet | {"def":20,"hp":120} | — | — |
| pet_dg_owl | Little Bellwarden | — | 1550 | pet | {"speed":0.15} | — | — |
| pet_dg_anemone | Little Anemone | — | 1650 | pet | {"atk":16,"crit":0.08} | — | — |
| pet_dg_bellows | Little Bellows | — | 1650 | pet | {"atk":16,"hp":40} | — | — |
| pet_dg_empress | Little Moon Moth | — | 1800 | pet | {"atk":15,"crit":0.1} | — | — |
| pet_colossus | Little Cinderpeak | — | 6000 | pet | {"atk":16,"def":25,"hp":150} | — | — |
| dye_gilded_pet_robot | Gilded Robot companion | — | 0 | pet | {"atk":3} | — | — |
| dye_prism_pet_sheep | Prism Sheep companion | — | 0 | pet | {"hp":40} | — | — |
| dye_frost_pet_turtle | Frost Turtle companion | — | 0 | pet | {"def":8} | — | — |

### placeable

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| plot_kit | Garden bed kit | 80 | 20 | — | — | — | — |

### weapon

| ID | Name | Price field | Sell | Slot | Stats | Buff | Weapon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sword_wood | Wood sword | 25 | 10 | weapon | {"atk":6} | — | {"kind":"sword","range":2.3,"cd":0.55,"arc":0.35,"special":"crescent"} |
| sword_tusk | Tusk sword | 90 | 45 | weapon | {"atk":14,"crit":0.05} | — | {"kind":"sword","range":2.5,"cd":0.6,"arc":0.3,"special":"gore"} |
| sword_crystal | Crystal sword | 320 | 150 | weapon | {"atk":26,"crit":0.1} | — | {"kind":"sword","range":2.7,"cd":0.5,"arc":0.3,"special":"wave"} |
| gun_pea | Pea blaster | 40 | 20 | weapon | {"atk":4} | — | {"kind":"gun","range":10,"cd":0.38,"shot":"pea","special":"peastorm"} |
| gun_bubble | Bubble blaster | 140 | 70 | weapon | {"atk":9} | — | {"kind":"gun","range":9,"cd":0.5,"shot":"bubble","special":"bigbubble"} |
| gun_spike | Spike blaster | 220 | 110 | weapon | {"atk":15} | — | {"kind":"gun","range":7,"cd":0.75,"shot":"spike","spread":5,"special":"nova"} |
| sword_candy | Candy sword | 200 | 90 | weapon | {"atk":22,"crit":0.08} | — | {"kind":"sword","range":2.6,"cd":0.5,"arc":0.3,"special":"crescent"} |
| gun_ice | Ice blaster | 260 | 130 | weapon | {"atk":20} | — | {"kind":"gun","range":10,"cd":0.42,"shot":"ice","special":"blizzard"} |
| sword_lava | Lava sword | 420 | 220 | weapon | {"atk":38,"crit":0.12} | — | {"kind":"sword","range":2.8,"cd":0.5,"arc":0.3,"special":"wave"} |
| sword_obsidian | Obsidian sword | — | 260 | weapon | {"atk":46,"crit":0.14} | — | {"kind":"sword","range":2.9,"cd":0.5,"arc":0.3,"special":"magma"} |
| hammer_thunder | Thunder hammer | 520 | 300 | weapon | {"atk":55,"crit":0.1} | — | {"kind":"sword","range":2.6,"cd":0.85,"arc":0.1,"special":"thunder","fx":"#7ff7ff"} |
| scythe_moon | Moon scythe | 600 | 320 | weapon | {"atk":48,"crit":0.18} | — | {"kind":"sword","range":3.3,"cd":0.6,"arc":-0.3,"special":"whirl","fx":"#c9e8ff"} |
| bow_star | Star bow | 480 | 280 | weapon | {"atk":34,"crit":0.12} | — | {"kind":"gun","range":13,"cd":0.55,"shot":"arrow","special":"starfall"} |
| staff_fire | Fire staff | 560 | 340 | weapon | {"atk":40} | — | {"kind":"gun","range":10,"cd":0.7,"shot":"fireball","special":"inferno"} |
| blaster_rainbow | Rainbow blaster | 700 | 380 | weapon | {"atk":30,"crit":0.08} | — | {"kind":"gun","range":11,"cd":0.22,"shot":"rainbow","special":"laser"} |
| toy_hammer | Toy hammer | — | 120 | weapon | {"atk":24,"crit":0.1} | — | {"kind":"sword","range":2.4,"cd":0.6,"arc":0.2,"special":"bonk","fx":"#ffe14d"} |
| trident | Ocean trident | — | 340 | weapon | {"atk":50,"crit":0.12} | — | {"kind":"sword","range":3.4,"cd":0.62,"arc":0.4,"special":"tsunami","fx":"#6fd3ff"} |
| rod | Fishing rod | 20 | 10 | weapon | — | — | {"kind":"rod","quality":0.3} |
| rod_gold | Golden fishing rod | 150 | 75 | weapon | — | — | {"kind":"rod","quality":0.7} |
| rod_steady | Steady fishing rod | 900 | 300 | weapon | — | — | {"kind":"rod","quality":0.9,"steady":true} |
| harpoon | Hunting harpoon | 1000 | 400 | weapon | {"atk":100} | — | {"kind":"gun","range":11,"cd":1.3,"shot":"harpoon","special":"wave","fx":"#c9f0ec"} |
| dye_gilded_sword_crystal | Gilded Crystal sword | — | 0 | weapon | {"atk":26,"crit":0.1} | — | {"kind":"sword","range":2.7,"cd":0.5,"arc":0.3,"special":"wave"} |
| dye_prism_blaster_rainbow | Prism Rainbow blaster | — | 0 | weapon | {"atk":30,"crit":0.08} | — | {"kind":"gun","range":11,"cd":0.22,"shot":"rainbow","special":"laser"} |
| dye_frost_gun_ice | Frost Ice blaster | — | 0 | weapon | {"atk":20} | — | {"kind":"gun","range":10,"cd":0.42,"shot":"ice","special":"blizzard"} |
| dye_shade_scythe_moon | Shade Moon scythe | — | 0 | weapon | {"atk":48,"crit":0.18} | — | {"kind":"sword","range":3.3,"cd":0.6,"arc":-0.3,"special":"whirl","fx":"#c9e8ff"} |
| dye_ruby_staff_fire | Ruby Fire staff | — | 0 | weapon | {"atk":40} | — | {"kind":"gun","range":10,"cd":0.7,"shot":"fireball","special":"inferno"} |
| dye_ruby_bow_star | Ruby Star bow | — | 0 | weapon | {"atk":34,"crit":0.12} | — | {"kind":"gun","range":13,"cd":0.55,"shot":"arrow","special":"starfall"} |
