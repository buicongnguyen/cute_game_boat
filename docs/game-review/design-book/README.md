# Design brief and detailed reference

The default build creates a concise reading document from [DESIGN-BRIEF.md](../DESIGN-BRIEF.md). The maintained Markdown and its HTML use the same numbered sections.

## Build the concise brief

From the repository root, using the project's supported Node runtime:

```sh
node docs/game-review/design-book/build.mjs
```

Open [design-book.html](../design-book.html). Edit DESIGN-BRIEF.md, then rebuild; changes to generated HTML are overwritten. The brief does not import game systems or add artwork.

## Build the detailed reference

The full four-chapter story, all 29 current milestones, 38 selected assets, and six progression diagrams remain available separately:

```sh
node docs/game-review/design-book/build-reference.mjs
```

Open [design-reference.html](../design-reference.html). The reference uses STORY.md, the resolved catalog, source rules, and the existing presentation files. Its checks and source hashes are recorded in reference-build-report.json. No gameplay or saves change.

## Detailed reference maintenance

This source folder generates `../design-reference.html`, a local illustrated reference for all four main-story chapters. The output contains its CSS, browser JavaScript, extracted data, icons, and model previews. It can be opened directly from the filesystem. Links to Markdown and source files remain local relative links, so keep the HTML in `docs/game-review/` for those links to resolve.

The book separates all 29 current milestones from the proposed story and its 29 playable scenes. It does not change gameplay, saved progress, balance, or published hosting. The four chapters contain 9, 6, 6, and 8 milestones respectively. The six detailed progression graphs remain bounded examples from the opening chapter.

### Build

Use the project's supported Node runtime (currently 24–26). From the repository root:

```sh
node docs/game-review/design-book/build-reference.mjs
```

The build writes `docs/game-review/design-reference.html` and a `reference-build-report.json` beside this README. To build a staged copy without writing the repository:

```sh
node path/to/design-book/build-reference.mjs --repo-root path/to/cute_game_boat --review-dir path/to/staged/review --output path/to/preview/design-reference.html
```

`--repo-root` selects the read-only game source. `--review-dir` optionally selects a separate directory containing STORY, BACKLOG, and the catalog; it defaults to the selected repository's `docs/game-review`. `--output` selects the generated HTML. The report is always written beside the generator. No dependency installation or network fetch is part of the build. The game repository's existing dependencies are needed when importing its TypeScript rules.

### Maintained sources

| Input | Responsibility |
| --- | --- |
| `../STORY.md` | The proposed premise, four chapters of prose and pacing, playable-scene tables, and chapter review questions. Update this manuscript to change narrative; do not author a competing plot in the HTML. |
| `../catalog-snapshot.json` | Resolved current milestones and selected item, crop, fish, and recipe data. Refresh the catalog when gameplay data changes. |
| `../../../src/` rule modules | Exact story reward examples, tutorial constants, wishes, companion defaults, station activities, and level/icon rules. The extractor imports read-only exports; it does not load player saves. |
| `../BACKLOG.md` | Maintained UX-001, UX-002, PACE-001, and STORY-001 questions and checks. |
| `book-config.json` | Curated chapter metadata, asset selectors, reading headings, captions, and editorial notes. Selectors are separate from automatically extracted numeric values and canonical narrative. |
| `chapters.mjs` | Chapter assembly and exact-heading manuscript extraction, plus current conditions and reward arithmetic for all 29 milestones. |
| `graph-spec.json` | Four reviewed progression maps with explicit relationship semantics, costs, rules, and sources. It is curated source evidence and must be reviewed when its rule modules change. |
| `asset-map.json` and `assets/` | Existing game icons and transparent previews of actual models. File paths are portable relative paths. |
| `template.html`, `book.css`, `book.js` | Presentation and interaction only. |

`book-data.mjs` exports `buildBookData({repoRoot, reviewDir})`. It reads the catalog, imports current exported rules, selects 38 configured assets across the four chapters, and extracts paragraphs/tables by exact manuscript headings. It returns plain serializable data. `data.chapters` carries the current milestones, proposed prose and scenes, review questions, and source paths for each chapter. The original `data.currentChapter` and `data.proposedChapter` remain available for the opening-chapter presentation. Nine current worlds are extracted into `data.worlds`. The five simple extracted diagrams remain under `data.diagrams`; the book displays four verified graph-spec maps plus its extracted crop-unlock and material-purchase maps under `data.graphs`. The crop example retains the original five opening crops.

Chapters 2–4 use the canonical manuscript's `Narrative`, `Playable scenes`, `Pacing and player choice`, and `Review and acceptance` sections. Review questions are read from those tables, while chapter one retains its four maintained BACKLOG questions. Source-reference paragraphs are excluded from narrative and collected as evidence links. The metadata JSON selects presentation and assets; it does not duplicate narrative or acceptance text. Reward amounts are arithmetic examples at the stated level, not predictions of a natural playthrough. Step 12 explicitly describes the locked Normal/Hard harvest substitution.

Images are embedded as `asset.image = {src, kind, caption, source, sha256}`. Additional graph images and the keeper cover reference live under `data.images`. Icons are unchanged game files. Model previews use actual game geometry with the fixed projection recorded in `asset-map.json`; they are documentation renders, not gameplay screenshots, and omit the runtime ink-outline shader. Refreshing these previews is separate from an ordinary HTML rebuild.

### Updating the book

1. Change the maintained source: narrative in STORY, investigation text in BACKLOG, or selectors in book-config. Review changed game rules against the catalog and graph-spec.
2. For a new asset, select its real game ID and existing icon or current model preview. Avoid substituting old outdoor stalls for cabin stations.
3. Rebuild. Inspect `reference-build-report.json` for input hashes, baseline, images, graph counts, and validation limits.
4. Open the resulting HTML and inspect desktop and narrow layouts, search/filter/detail dialogs, story tabs, graph tabs and keyboard navigation, notes/export, and printing before claiming browser acceptance.

The generator compares all 29 catalog milestone definitions with live `STORY_STEPS` and stops if they differ. It also runs `validate-graph-facts.mjs` before building. Its 294 source-rule assertions compare the curated bed, wish, rod, forge and bench values against the current exported rules; a mismatch stops the build. It also checks that JavaScript parses, four chapters cover ordered unique steps 1–29 with 29 scene rows, every selected asset has an embedded visual, graph IDs and edges resolve, positions/costs are valid, catalog and graph baseline commits match, source files exist, maintained questions are extracted, and template placeholders resolve. Source hashes establish provenance; the assertions cover numeric rules and graph relationships, while source-inspection notes still require human review after relevant implementation changes.

To refresh model previews, run `node docs/game-review/design-book/preview-render.mjs` from the repository root, then rebuild. This uses existing Three.js dependencies and actual game models with a fixed CPU projection; it does not launch a browser or create new art. Preview framing is standardized for comparison, so apparent size does not represent relative world scale.

### Validation limits

The current build passed static data, source, image, graph, template, and JavaScript parsing checks. Browser-control surfaces were unavailable for this work, so layout, interactions, print output, and physical-device acceptance are unrun. No gameplay test suite or natural player playthrough was performed for this documentation build. These limits are also recorded in the generated data and build report.

### Concise engineering view

The first HTML section is generated from `../ENGINEERING-MAP.md`. Maintain its directory tree and short review rules there. The map connects systems to major player checkpoints, attention opportunities and verification; the story chapters provide detail.
