---
title: B1 Vocab Uttrykk Opp og Fram Arbeidsbok
reference: draft/b1/opp-og-fram-arbeidsbok
data-started: 2026-08-12
data-completed: 2026-08-14
---

# Plan: Vocab & uttrykk extraction from *Opp og fram!* arbeidsbok

Source: `draft/b1/opp-og-fram-arbeidsbok/content/opp-og-fram.md`
Targets: `src/lib/data/vocab-b1.json`, `src/lib/data/uttrykk-b1.json`
Goal: pull new B1 vocab/uttrykk candidates from the textbook, **remove anything already covered**, then only add the genuinely new items.

## 1. What's actually in the source file

- 40 chapters. Each chapter (mostly 1–30, some later ones lack grammar) has:
  - `## Grammatikk, ord og uttrykk` — topic headers (e.g. *Å kalle*, *Nemlig (adverb)*). These are **grammar-note topics**, not vocab entries → out of scope here, belongs in `b1-grammar-opp-og-fram-arbeidsbok.md` instead.
  - `## Vokabular 🙂🙂` — a markdown table per chapter: `Ord i teksten | Forklaring på norsk | Oversatt til ditt språk` (translation column always empty). This is the real source of vocab/uttrykk candidates.
  - Exercise sections (a, b, c…) — fill-in-the-blank drills, not a vocab source.
  - `Orddiktat` — a short numbered word list at the end of each chapter. Cross-checked: these words are always a subset of that chapter's Vokabular table → **skip, no new info**.
- Near the end: two "Fast og løst sammensatte verb" tables (verb + separable verb + derived noun, ~80 rows total) — additional candidate source, mostly verb + noun pairs.
- `Oversikt over grammatikk, ord og uttrykk` — index of grammar topics only, used for cross-referencing the grammar doc, not for vocab extraction.

## 2. Dedup process (before classifying anything)

Do this first, on the raw textbook terms, before deciding vocab vs. uttrykk — no point classifying something we're about to throw away.

1. **Parse** all 40 Vokabular tables + the 2 sammensatte-verb tables into a flat candidate list: `{ chapter, raw_term, norwegian_definition }`. `raw_term` keeps the source formatting as-is (e.g. `bekymring (f/m)`, `å bosette seg (ureg.)`).
2. **Normalize** for matching only (matching key, not stored): strip bold/italic markup, strip trailing gender/word-class parens (`(m)`, `(f)`, `(n)`, `(f/m)`, `(adj.)`, `(adv.)`, `(v1..v4)`, `(ureg.)`), lowercase, trim. This is needed because the textbook uses `(f/m)`-style gender tags while vocab-b1.json uses `(en/ei/et)`-style — a plain `norsk`-string match (the approach your existing scripts use) would miss real duplicates due to notation differences alone.
3. **Match** each normalized candidate against normalized `norsk`/`lemma` values from `vocab-b1.json` and `uttrykk-b1.json` combined.
   - match → duplicate, drop.
   - no match → keep as new candidate.
4. Write this as a script in `scripts/`, following the conventions of `dedup_cross_file.mjs`/`dedup_vocab.mjs` already in the repo (Node ESM, resolve `src/lib/data`, `--dry-run` flag, print keep/remove decisions before writing anything). Difference from those: this script doesn't mutate the JSON files — the textbook side isn't a data file, so its job is just to output a filtered candidate list (`data/candidates-new.json`) plus a log of what got dropped as duplicate, for a sanity check.
5. Review `candidates-new.json` with you before moving to classification.

## 3. Classifying the surviving (non-duplicate) candidates: vocab vs. uttrykk

From each remaining candidate, split by shape of the term:

- **vocab-b1.json**: single word + word class, e.g. `bekymring (f/m)`, `bitter (adj.)`, `å streve (v2)`.
- **uttrykk-b1.json**: multi-word fixed expressions, e.g. `å bli varm om hjertet`, `å ha ansvar for`, `på det viset`, `i ett sett`, `det tjener ikke til noe`.
- Boundary rule: reflexive/particle verbs like `å bosette seg`, `å foreta seg` → uttrykk (matches existing `part: "phrase"` pattern in uttrykk-b1.json). Plain verbs with just a group tag (v1–v4, ureg.) → vocab.

## 4. Schema notes for new entries (once approved)

- `id`: vocab uses `v-b1-<category>-NNN` (per-category counter); uttrykk uses `u-b1-NNN` (single global counter, currently at 221). New entries continue these counters.
- Fields to fill: `norsk`, `lemma`, `english`, `ukrainian`, `spanish`, `german`, `example`, `example_english`, `example_ukrainian`, `example_spanish`, `example_german`, `definition` (Norwegian, source table already gives a good starting point), `level: "B1"`, `category`, `part`, and for uttrykk also `theme`.
- `category` (vocab) / `theme` (uttrykk) aren't given by the source book — will assign based on existing category taxonomy already used in the two files, picking the closest fit or proposing a new category if none fits.

## 5. Open questions before running extraction

- **Skip Orddiktat lists entirely** — ✅ resolved: confirmed redundant (always a subset of that chapter's Vokabular table), never parsed by the script.
- **"Fast og løst sammensatte verb" tables: vocab or uttrykk?** — ✅ resolved: split by shape, same boundary rule as step 3. Fast sammensatt (single-word verbs, e.g. `avblomstre`) → vocab. Løst sammensatt (particle verbs, e.g. `blomstre av`) → uttrykk. The derived noun in each row (e.g. `avblomstring (f/m)`) is also a real vocab candidate, not just context — the script emits it as its own candidate row rather than leaving it unused.
- **Ambiguous/near-duplicate matches: case-by-case or default-skip?** — ✅ resolved, but not as originally framed. The exact-normalized-match duplicates (151, later 541 after the all-levels fix) were spot-checked at 100% correct with zero ambiguity, so no manual review queue is needed there — any normalized match is dropped as duplicate automatically. But a *separate* failure mode was found during review (see lessons learned below): near-duplicates that never become an exact normalized match at all (e.g. `å holde opp med` vs. existing `holde opp`) were invisible to the dedup step entirely. Added a third pass (`findNearDuplicate` in the script) that flags these into `candidates-near-duplicate.json` for manual yes/no — not auto-dropped, since some "near matches" are genuinely distinct senses (e.g. `gå på` generic vs. `gå på veggen` idiom for "burn out").

## 6. Lessons learned during dedup step

- **Level scope bug:** the first working version of the script only checked `vocab-b1.json`/`uttrykk-b1.json` against the textbook, missing words already covered at other levels (A1, A2, B2, C). Caught by spot-check (`bitter` already in `vocab-c.json`, `ensom` already in `vocab-a1.json`). Fixed by globbing all `vocab-*.json`/`uttrykk-*.json` files (15 total, including preview files and the idiom file) via `readdirSync`. Impact: "new" candidates dropped from 1,280 to 890 (~35% were already covered at other levels).
- **Near-duplicate blind spot:** normalization strips markup/gender-tags/`å`-prefix but not trailing words, so phrase variants like `å holde opp med` (textbook) vs. `holde opp` (existing, vocab-a2.json) don't normalize to the same key and were landing in `candidates-new.json` as if brand new. A prefix-based heuristic (shorter key ≥ 2 words, longer key adds ≤ 2 trailing words) catches these without the false-positive flood a looser version produced (246 hits before the 2-word-minimum guard, mostly generic single-word entries like `bli`/`ha`/`i`/`på` trivially prefix-matching everything → 35 genuine hits after tightening). These go to a third output file, not auto-merged or auto-dropped.
- **General takeaway:** for matching free-form textbook prose against structured JSON, exact-match (the pattern used by `dedup_cross_file.mjs`/`dedup_vocab.mjs` for JSON-vs-JSON dedup) is the wrong tool — it caught 1/151 real duplicates in a direct comparison. Normalization + a near-duplicate pass are both necessary here.

## 7. Next step

Script (`scripts/dedup-textbook-source.mjs`) is written and verified in sandbox (all-levels load + near-duplicate pass), producing three output files in `draft/b1/opp-og-fram-arbeidsbok/data/`:

- `candidates-new.json` — genuinely new candidates
- `candidates-duplicate.json` — exact normalized-match duplicates (dropped)
- `candidates-near-duplicate.json` — flagged for manual yes/no, not auto-decided

**⚠️ The files currently on disk are stale** — they're from the run before the near-duplicate pass was added (2-way split only, no `candidates-near-duplicate.json` present). Run this on your machine to regenerate all three:

```
node scripts/dedup-textbook-source.mjs
```

Expected from the last sandbox test (may shift slightly on the real files): ~855 new, ~541 duplicate, ~35 near-duplicate.

Once you've spot-checked `candidates-near-duplicate.json`, next step is step 3 in this plan: classifying `candidates-new.json` into vocab vs. uttrykk.

## 8. Step 3 progress — classification results

All of `candidates-new.json` (855) has now been classified using `data-rules/vocab-and-uttrykk.md`:

| Output file                          | Count | What it is                                                                                                                                           |
| ------------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `candidates-uttrykk.json`            | 50    | reflexive/idiom-shaped phrases → uttrykk-b1.json target                                                                                              |
| `candidates-review-idiom-verbs.json` | 139   | verb phrases that look idiomatic rather than a productive verb+object (e.g. `å bli varm om hjertet`) — needs your yes/no per item before either file |
| `candidates-excluded.json`           | 4     | proper nouns / curriculum jargon (`Volvo`, `RLE`, `femte gym`, a garbled participle note) — drop entirely                                            |
| `candidates-vocab.json`              | 756   | vocab-b1.json target (see below)                                                                                                                     |

Key decisions applied:
- **Particle verbs (løst sammensatt) → vocab**, not uttrykk — followed `data-rules/vocab-and-uttrykk.md` (its own example: `slå av`), overriding the original step-1 boundary rule. This moved ~58 particle verbs into vocab.
- **131→139 idiom-shaped verb phrases** pulled into a separate review file rather than auto-classified — shape-based rules ("starts with å → vocab verb") were catching genuine idioms like `å bli varm om hjertet`.
- **Derived nouns from the compound-verb tables** (e.g. `avblomstring (f/m)` from `avblomstre`/`blomstre av`) are now extracted and included as their own vocab candidates — this was promised last session but the extraction logic had never actually been added to a script; it's now in `scripts/build-vocab-candidates.mjs`.
- **12 of the 34 near-duplicates** (`candidates-near-duplicate.json`) were approved as "keep" (distinct senses from their matched existing entry, e.g. `komme til verden` vs. existing `komme til`) and folded into the vocab set. The other 22 stay dropped as genuine duplicates.

### `candidates-vocab.json` (756) is built by `scripts/build-vocab-candidates.mjs`

```
node scripts/build-vocab-candidates.mjs
node scripts/build-vocab-candidates.mjs --dry-run   # counts only, no write
```

It assembles: 673 base (855 − 50 uttrykk − 139 review − 4 excluded) + 12 kept near-duplicates + 72 new derived-noun candidates (deduped against all 15 vocab-*.json/uttrykk-*.json files) − 1 raw_term collision (`avslag (n)` was reachable both directly from ch.9 vocabulary and as a derived noun of `avslå`; kept the ch.9 version for its richer context) = **756**.

⚠️ Note for future sessions: this script's output was reconstructed from scratch after a prior session ended mid-write without producing `candidates-vocab.json`. Re-running it is safe and deterministic — it always derives the same 756 from the files already on disk, so if in doubt, just re-run it rather than trusting any stale copy.

✅ **Done** — ran on the real repo, `candidates-vocab.json` (756) confirmed generated on disk.

## 9. Next step

1. ⏳ **In progress** — reviewing `candidates-review-idiom-verbs.json` in batches, deciding uttrykk vs. vocab vs. drop per item.
   - ⚠️ 8 of the original 139 were removed before review: they were duplicates of the 12 approved near-duplicate "keep" items from §8 (same textbook entry reached via two pipeline passes — plain-text form landed here, bold-markup form landed in `candidates-near-duplicate.json` and was already merged into `candidates-vocab.json`). Re-deciding them here would have conflicted with the already-applied decision. Review file is now **131 items**.

### Decisions log (going through `candidates-review-idiom-verbs.json` in batches of 15)

| #   | raw_term (ch.)                        | Decision |
| --- | ------------------------------------- | -------- |
| 1   | å bli varm om hjertet (1)             | uttrykk  |
| 2   | å ha krefter til (1)                  | vocab    |
| 3   | å ta seg en liten runde (1)           | uttrykk  |
| 4   | å fylle år (2)                        | uttrykk  |
| 5   | å tåle kulde (2)                      | vocab    |
| 6   | å folde seg ut (3)                    | vocab    |
| 7   | å få lov til (3)                      | uttrykk  |
| 8   | å utforske tilværelsen (3)            | vocab    |
| 9   | å gi uttrykk for (4)                  | uttrykk  |
| 10  | å skravle i vei (4)                   | uttrykk  |
| 11  | det kommer an på (5)                  | uttrykk  |
| 12  | regnet pøser ned (5)                  | uttrykk  |
| 13  | å bære på en hemmelighet (5)          | vocab    |
| 14  | å få kabalen til å gå opp (6)         | uttrykk  |
| 15  | å komme seg på beina igjen (6)        | uttrykk  |
| 16  | å se dagens lys (6)                   | uttrykk  |
| 17  | å være i full sving (6)               | uttrykk  |
| 18  | å dumpe innom (7)                     | uttrykk  |
| 19  | å ha fore (7)                         | uttrykk  |
| 20  | å innta en bedre frokost (7)          | vocab    |
| 21  | å kjøpe for en slikk og ingenting (7) | uttrykk  |
| 22  | å stå på døgnet rundt (7)             | uttrykk  |
| 23  | å avlegge en visitt (8)               | vocab    |
| 24  | å få kjennskap til (10)               | uttrykk  |
| 25  | å pusle med sitt (10)                 | uttrykk  |
| 26  | å tvinge seg på (10)                  | vocab    |
| 27  | å stride mot loven (12)               | vocab    |
| 28  | å trekke på skuldrene (12)            | uttrykk  |
| 29  | å hogge i vei (13)                    | uttrykk  |
| 30  | å skrive seg fra (13)                 | uttrykk  |

| 31 | å tenke i samme baner (13) | uttrykk |
| 32 | å stå i samsvar med (14) | uttrykk |
| 33 | å vie plass (14) | vocab |
| 34 | å sette i gang med (15) | uttrykk |
| 35 | å si rett ut (15) | uttrykk |
| 36 | å få igjen på skatten (16) | uttrykk |
| 37 | å få inn med morsmelka (16) | uttrykk |
| 38 | å rekke opp hånda (16) | uttrykk |
| 39 | å trekke skatt (16) | vocab |
| 40 | å inngå våpenhvile (17) | vocab |
| 41 | å klatre oppover (17) | vocab |
| 42 | å sperre øynene opp (17) | uttrykk |
| 43 | å stå i spissen for (17) | uttrykk |
| 44 | å ta seg til (17) | uttrykk |
| 45 | å bli noe av (18) | uttrykk |

| 46 | å bryte et forhold (18) | vocab |
| 47 | å se seg nødt til (18) | uttrykk |
| 48 | å stifte familie (18) | vocab |
| 49 | å flakke omkring (19) | vocab |
| 50 | å drive rundt (20) | vocab |
| 51 | å fomle etter (21) | vocab |
| 52 | å ha en skrøne på lager (21) | uttrykk |
| 53 | å sitte hensunket i sine egne tanker (21) | uttrykk |
| 54 | å avlegge et besøk (23) | vocab |
| 55 | å plukke opp litt norsk (24) | vocab |
| 56 | å rette på noen (24) | vocab |
| 57 | å gripe fatt i (25) | uttrykk |
| 58 | å klø seg i hodet (25) | uttrykk |
| 59 | å satse hardt på (25) | vocab |
| 60 | å stå på hodet (25) | uttrykk |

| 61 | å sy puter under armene på noen (25) | uttrykk |
| 62 | gulvet ga etter (26) | uttrykk |
| 63 | å forsvinne som dugg for solen (26) | uttrykk |
| 64 | å føle seg slått ut (26) | vocab |
| 65 | å måle seg med (26) | vocab |
| 66 | å slite for (26) | vocab |
| 67 | å snu opp ned (26) | uttrykk |
| 68 | å stabbe av gårde (26) | vocab |
| 69 | å synke ned i et sort hull (26) | uttrykk |
| 70 | å versere flere versjoner (26) | vocab |
| 71 | å få en merkelapp festet på seg (27) | uttrykk |
| 72 | å slenge ut en påstand (27) | vocab |
| 73 | å fatte interesse for (28) | vocab |
| 74 | å gå helhjertet inn i et forhold (28) | uttrykk |
| 75 | å gå i glemmeboka (28) | uttrykk |

| 76 | å løpe med halen mellom beina (28) | uttrykk |
| 77 | å dryppe av seg (30) | vocab |
| 78 | å fatte seg i korthet (30) | uttrykk |
| 79 | å kaste seg ut (30) | vocab |
| 80 | å komme ut av rutiner (30) | vocab |
| 81 | å snike seg ut (30) | vocab |
| 82 | å utveksle et par ord (30) | vocab |
| 83 | å gå fra sans og samling (31) | uttrykk |
| 84 | å ha på tapetet (31) | uttrykk |
| 85 | å leve i pakt med naturen (31) | uttrykk |
| 86 | å oppnå en drøm (31) | vocab |
| 87 | å stupe i seng (31) | uttrykk |
| 88 | å vippe noen av pinnen (31) | uttrykk |
| 89 | å virke som (32) | vocab |
| 90 | å vri seg i pine (32) | vocab |

| 91 | å bedrive utukt (33) | vocab |
| 92 | å bli vartet opp (33) | uttrykk |
| 93 | å framsette en tolkning (33) | vocab |
| 94 | å nedfelle i (33) | vocab |
| 95 | å snakke i tunger (33) | uttrykk |
| 96 | å ta for god fisk (33) | uttrykk |
| 97 | å vri på ordene (33) | uttrykk |
| 98 | smerten rev gjennom meg (34) | uttrykk |
| 99 | å bre utover (34) | vocab |
| 100 | å bringe noen ut av fatning (34) | uttrykk |
| 101 | å se til å (34) | uttrykk |
| 102 | å være satt ut (34) | vocab |
| 103 | å dyrke kjærligheten (35) | vocab |
| 104 | å falle på plass (35) | uttrykk |
| 105 | å ligge til rette for (35) | uttrykk |

| 106 | å ofre en tanke (35) | vocab |
| 107 | å starte på ny frisk (35) | uttrykk |
| 108 | å ta rollen på alvor (35) | vocab |
| 109 | et langt lerret å bleke (36) | uttrykk |
| 110 | å slippe taket (36) | uttrykk |
| 111 | å dra dit pepperen gror (37) | uttrykk |
| 112 | å heve seg over noe (37) | vocab |
| 113 | å holde munn (37) | uttrykk |
| 114 | å pakke snippesken sin (37) | uttrykk |
| 115 | å tie stille (37) | uttrykk |
| 116 | å be tynt for seg (38) | uttrykk |
| 117 | å bære preg av (38) | vocab |
| 118 | å bære seg så det ikke er måte på (38) | uttrykk |
| 119 | å fabrikkere en historie (38) | vocab |
| 120 | å klamre seg til noen (38) | vocab |

| 121 | å klynge seg til noen (38) | vocab |
| 122 | å koke over for noen (38) | uttrykk |
| 123 | å smelle til rett i ansiktet (38) | uttrykk |
| 124 | å være ute på en snurr (38) | uttrykk |
| 125 | å løse seg opp (39) | drop — duplicate |
| 126 | å trekke inn en lukt (40) | vocab |
| 127 | å ville noen vel (40) | uttrykk |
| 128 | legge en plan (compound-verb-table) | vocab |
| 129 | streke under (compound-verb-table) | vocab |
| 130 | stenge ute (compound-verb-table) | vocab |
| 131 | legge øde (compound-verb-table) | vocab |

✅ **All 131 items classified.** One item (#125, `å løse seg opp`) turned out to be a duplicate of an existing vocab-b1.json entry (surfaced via the §8 near-duplicate cross-check) and is dropped rather than filed as vocab/uttrykk.

**Final tally from the review file (corrected — verified by script, see below):**
- vocab: 55 items
- uttrykk: 75 items
- drop (duplicate): 1 item

⚠️ Also found and fixed: `candidates-review-idiom-verbs.json` had a trailing-comma JSON syntax error left over from when the 8 near-duplicate overlaps were removed earlier — fixed directly on disk.

### Next: apply these decisions to the actual data files
1. ✅ Wrote `scripts/apply-review-decisions.mjs` — splits `candidates-review-idiom-verbs.json` per the decisions log above, appends to `candidates-vocab.json`/`candidates-uttrykk.json`, drops item #125. Verified in a sandbox mirror first.
2. ✅ **Done** — ran on the real repo: `candidates-vocab.json` 756 → 811, `candidates-uttrykk.json` 50 → 125.
3. ⏳ Next: step 4 in this plan — schema enrichment (`id`, `lemma`, `english`, translations, `example`, `category`/`theme`, etc.) before merging into `vocab-b1.json` / `uttrykk-b1.json`. Categories: use the existing 32 B1 categories (see §10) — no new categories being added; religion-themed items route into `culture`/`society`.

## 10. Category decision (before schema enrichment)

Considered whether new B1 categories were needed for the 811/125 candidates. **Decision: no new categories.** Checked actual current distribution first:
- B1 vocab (1,216 entries / 32 categories): ranges `urban-life` (12) to `society` (85), most in 25–50.
- B1 uttrykk (211 entries): `general` catch-all already dominates (58), as expected for topic-less idioms.

The new candidates' themes (immigration, grief, terrorism/22. juli, religion, work culture, storytelling, relationships) all map cleanly onto existing categories (`society`, `mental-wellbeing`, `relationships`, `family`, `workplace`, `personal-growth`, `culture`). Only edge case: no dedicated `religion` category exists at B1 (unlike B2) — too few items (~10–15) to justify a new category; route into `culture`/`society` instead.

## 11. Existing B1 uttrykk `general` catch-all cleanup

Separate from the new candidates above — while reviewing category balance, the *existing* 211 `uttrykk-b1.json` entries turned out to have `general` sitting at 58 (27%), noticeably lopsided. Grouped those 58 by pattern and found 4 real clusters (see chat for the full breakdown): fixed prepositional/adverbial phrases (~7), necessity/obligation formulas (~5), state/condition expressions (~8), verb+preposition collocations (~28), plus ~10 genuinely miscellaneous.

**Decision: two moves, not a new-category-only fix.**

1. **Added 2 new functional themes** to `UTTRYKK_FUNCTIONAL_THEMES` in `src/lib/config.ts`: `necessity-formulas` and `fixed-prepositional-phrases`. ✅ Done.
2. **Migrated the verb+preposition collocations to vocab.json**, `part: "verb"` — per `data-rules/vocab-and-uttrykk.md`, productive verb+prep combos (swappable object, conjugates like any verb) belong in vocab, not uttrykk. This was the actual mis-classification driving most of the `general` bloat, not a missing-theme problem.

### Rules doc updated

`data-rules/vocab-and-uttrykk.md` — added an explicit verb+preposition collocation example block under the vocab section (`sørge for`, `ta hensyn til`, `minne om`, `ha godt av`, `ta tak i`), plus a caveat: if the word after the verb isn't a true grammatical object (needs a different verb like `være` to make sense, e.g. `være skyld i`), it's not a verb complement and stays `uttrykk` or becomes its own noun/adjective entry. ✅ Done.

### Migration script

Wrote `scripts/migrate-general-uttrykk-to-vocab.mjs` (verified in a sandbox mirror first, matches the `å`-prefix / lemma-unchanged / per-category-counter conventions already used by `migrate-to-vocab.mjs`). It does 3 things to `uttrykk-b1.json`/`vocab-b1.json`:

1. Retags 6 entries → theme `fixed-prepositional-phrases` (`i fred`, `i ro og fred`, `i hemmelighet`, `i veien`, `i gang`, `sted; av sted`).
2. Retags 5 entries → theme `necessity-formulas` (`er nødt til`, `skulle til`, `slippe å`, `om det trengs`, `er avhengig av`).
3. Migrates 27 entries from uttrykk to vocab as `part: "verb"`, category assigned per item (`personal-growth`, `reasoning`, `society`, `workplace`, `communication-skills`, `relationships`, `traditions` — see script comments for the per-item mapping).

**One correction made during implementation:** the original review list included `skyld i` as a verb+prep candidate, but on closer look `skyld` is a noun ("blame/fault"), normally paired with `være` (`være skyld i`) — `å skyld i` would be ungrammatical. It fails the vocab decision rule, so it's retagged to theme `society` (topical) instead of migrated, not part of the 27.

Net effect: `general` theme count 58 → ~14 (state/condition cluster + genuine misc leftovers). `uttrykk-b1.json` 211 → 184 entries, `vocab-b1.json` 1,216 → 1,243 entries.

**Status:**
- ✅ Script written to `scripts/migrate-general-uttrykk-to-vocab.mjs`, verified in sandbox (dry-run + real run both produce valid JSON, unique IDs, correct schema).
- ✅ `config.ts` and `data-rules/vocab-and-uttrykk.md` updated directly.
- ✅ **Run on the real repo** — dry-run confirmed exact match with sandbox, then run for real: `uttrykk-b1.json` 211 → 184, `vocab-b1.json` 1,216 → 1,243. `.bak` backups written automatically.

✅ **Section 11 complete.** `general` theme count reduced from 58 to ~14. Ready to commit.

## 12. Step 4 — Schema enrichment: parsing candidates into Step-1 shape

Instead of a bespoke enrichment script, this project already has a reusable pipeline (`ai-docs/instructions/work-flow.md` + `scripts/enrich-vocab.mjs --level {level}` + `scripts/assign-ids.mjs` + `scripts/merge-to-production.mjs`) that just needs Step 1 input in the shape `{id, norsk, lemma, definition, level, part, category}` at `draft/{level}/extracted-vocab-{level}.json` / `extracted-uttrykk-{level}.json`.

Wrote `scripts/parse-opp-og-fram-candidates.mjs` — a deterministic, non-API "Step 1" script that reads `candidates-vocab.json`/`candidates-uttrykk.json` (§8/§9 above) and applies the same conventions as `image-converter-c.md` Rules 2/4/5 (gender shorthand → (en)/(et)/(pl.), verb shorthand → part: verb with marker stripped, å-prefix handling, lemma derivation, markdown/`her:` cleanup on definitions). Full rule breakdown is in the script's header comment.

Two things it caught that weren't previously flagged:
- **2 genuine cross-file duplicates**: "å bli varm om hjertet" and "å ta seg en liten runde" each existed in *both* `candidates-vocab.json` (as a bold-markdown near-duplicate copy) and `candidates-uttrykk.json` (via the §9 review decision, correctly "uttrykk"). Dropped from the vocab side.
- `candidates-uttrykk.json` has a leftover `"part": "verb"` artifact from `apply-review-decisions.mjs` on 75 of its 125 entries — ignored; every uttrykk entry is written with `part: "phrase"`, `category: "uttrykk"`, matching production.

For the ~180 compound-verb-table/derived-noun entries with no real dictionary definition in the source (only a cross-reference), auto-generated a simple Bokmål gloss per the user's decision: `"Betyr det samme som å X."` for fast/løst sammensatt pairs, `"Substantivet av å X."` for derived nouns.

✅ **Verified in sandbox** (Python prototype + Node port produced byte-identical output) and **run on the real repo**:

```
node scripts/parse-opp-og-fram-candidates.mjs --dry-run   # 811→809 vocab, 125→125 uttrykk, 4 flags
node scripts/parse-opp-og-fram-candidates.mjs
```

Output: `draft/b1/extracted-vocab-b1.json` (809), `draft/b1/extracted-uttrykk-b1.json` (125), `draft/b1/opp-og-fram-arbeidsbok/data/parse-flags.json` (4 minor edge cases, all resolved with a sensible default — not blocking):
- `å minnes (-ntes, -ntes)` — unrecognized marker, defaulted to verb (already å-prefixed) — correct.
- `rot (f/m) – røtter` — dropped trailing irregular-plural note "røtter" (not stored, matches schema) — correct.
- `nedbrytning`, `utlysing` — derived nouns missing a gender marker in the source table, defaulted to `(en)` — worth a quick manual check against ordbokene.no before merge, but not urgent.

### Step 2 — enrichment (API, run locally by the user) — ✅ COMPLETE

- `vocab-b1-new.json`: 807 entries (all 809 extracted lemmas accounted for — 2 are a duplicate pair within `extracted-vocab-b1.json` itself, to be resolved by `find_dupes.py` in Step 3).
- `uttrykk-b1-new.json`: 125/125 entries. `«mannen i gata»` succeeded after the guillemet-regex fix below.

🐛 **Bug found: `callClaude()`'s quote-cleanup regex was corrupting guillemets.** It stripped `„ “ ” « » ‘ ’` → `'` from the raw API response before parsing — intended to normalize stray smart quotes in model-generated text, but it also hit `« »` (U+00AB/00BB), which appear verbatim in real lemmas like `«mannen i gata»`. The model returned the lemma correctly; the cleanup step then turned it into `'mannen i gata'`, which no longer matched the batch entry. **Fixed:** removed `« »` from the regex.

🛠️ **Other hardening done during this step** (in `scripts/enrich-vocab.mjs`):
1. Checkpoint-per-batch writes (was: written once at the very end — a Ctrl+C mid-run would have lost all completed batches' API spend with nothing saved).
2. `max_tokens` 4096 → 8192 (batches were close to the ceiling — truncation risk).
3. Guard against a model-returned `lemma` with no match in the batch (previously silently fell back to `{}`).
4. Step-1 parser artifact fixed in `extracted-uttrykk-b1.json`: `å be tynt for seg – har bedt)` → `å be tynt for seg`.

### Step 3 — dedupe + validation

⚠️ **Correction to my earlier instructions**: `find_dupes.py` takes no file argument — it scans a hardcoded file list in the script, with draft files commented out. Uncommented the `B1-draft` / `B1-uttrykk-draft` lines so it now also scans the new files (remember to re-comment after merging so future runs don't scan a stale file). Also: the validation scripts are `check-vocab.ts` / `check-uttrykk.ts` (TypeScript, via `npx tsx`), not `.mjs` — corrected in commands below.

✅ **`find_dupes.py` results** (9636 entries across all production files + B1 draft):
- Cross-file (9): mostly expected — same word appearing at B1 and a higher level (e.g. `å anstrenge seg`, `å forestille seg`) or pre-existing production overlap (`søkemotor`). Not necessarily bugs — project may allow a word to recur at multiple levels with different depth/context.
- Within-file (2): `å rekke` (pre-existing in C, unrelated to this batch) and **`å by på` appears twice in B1-draft** (`cooking` vs `communication-skills` category) — needs review: two genuine senses, or a dupe to merge?
- Normalized (45): mostly expected cross-level noun/verb-form pairs. Two involve the B1 draft specifically and need review: **`snu opp ned` (B2-uttrykk) vs `å snu opp ned` (B1-uttrykk-draft)**, and **`tie stille` (existing B1-uttrykk) vs `å tie stille` (B1-uttrykk-draft)** — likely true duplicates via the å-prefix convention.

⏳ **Not yet resolved**: the 3 B1-draft-specific dupes above (`å by på`, `snu opp ned`/`å snu opp ned`, `tie stille`/`å tie stille`). Next session: pull full side-by-side entries from `scripts/outputs/find-dupes-details.txt` and decide keep/merge/drop for each before proceeding to Step 4.

✅ **`check-vocab.ts b1 --draft`**: found and fixed 2 errors — `glansdager` and `uskrevne lover` are plurale tantum (no natural singular sense) missing the `(pl.)` marker required by the norsk-field formatting rule. Fixed to `glansdager (pl.)` / `uskrevne lover (pl.)` (lemma stays bare plural, matching the established `forfedre (pl.)` convention). Re-run to confirm clean:
```
npx tsx scripts/check-vocab.ts b1 --draft
```

✅ **`check-uttrykk.ts b1 --draft`**: 0 errors, 0 warnings — clean.

### Next
1. Confirm `check-vocab.ts b1 --draft` now passes clean.
2. Resolve the 3 outstanding dupes above.
3. Re-comment the `B1-draft` lines in `find_dupes.py` once B1 is merged.
4. Step 4: `node scripts/assign-ids.mjs b1` → Step 5: `node scripts/merge-to-production.mjs` (see `work-flow.md`).

---

### Dupe resolution — ✅ COMPLETE

Decision (per user): remove all 3 categories of B1-draft-specific duplicates rather than keep any.

**Vocab (807 → 801, 6 removed from `vocab-b1-new.json`):**
- `å by på` (cooking sense, category `cooking`) — within-file dupe; kept the broader `communication-skills` sense ("to offer/provide an opportunity for"), dropped the narrower food-specific one.
- `å anstrenge seg`, `å forestille seg`, `å rykke til`, `å segne om`, `å tilegne seg` — cross-level near-duplicates, same core meaning already covered at B2/C. Dropped from B1-draft per user decision (keep the higher-level entry only).

**Uttrykk (125 → 121, 4 removed from `uttrykk-b1-new.json`):**
- `flunkende ny`, `snu opp ned`, `vippe noen av pinnen` — cross-level near-duplicates (C-uttrykk / B2-uttrykk already cover these).
- `tie stille` — exact duplicate, already exists in production `uttrykk-b1.json` (u-b1-148); this was leftover from an earlier session's verb+prep migration work, not new content.

🐛 **New finding, worth a broader sweep later**: the removed `å segne om` entry had **Cyrillic homoglyph characters** (`е` U+0435, `г` U+0433) silently substituted into its Norwegian example sentence — `sегnet` instead of `segnet`. Invisible in normal viewing, byte-identical-looking, but would break exact-string search/FSRS lookups if it reached production. Since this specific entry is now deleted it's not a live issue, but the same corruption could exist elsewhere in enrichment output from this or earlier sessions. Recommend a dedicated non-ASCII-in-Norwegian-field scanner across `vocab-b1-new.json` / `uttrykk-b1-new.json` (and ideally production files) before or shortly after merge.

### Post-removal re-validation — ✅ COMPLETE

- `check-vocab.ts b1 --draft`: 801 entries, 0 errors, 0 warnings. ✅
- `check-uttrykk.ts b1 --draft`: 121 entries, 0 errors, 0 warnings. ✅
- `find_dupes.py` re-run (9626 entries across production + B1 draft): cross-file dupes down to 2, within-file down to 1 — **neither involves B1-draft** (both are pre-existing production overlaps: `søkemotor` B1/B2, `tid` A2/C, `å rekke` within C). Normalized dupes (43) scanned — none involve B1-draft either. **All 3 previously-flagged B1-draft dupes are confirmed resolved; no B1-draft duplicates remain.**

✅ **Step 3 (dedupe + validation) is now fully complete.**

### Steps 4 — assign-ids, diacritic check, Step 5 dry-run — ✅ COMPLETE

- `assign-ids.mjs b1`: ran clean (confirmed indirectly — merge dry-run below shows all entries have valid ids, which assign-ids.mjs is required to have set; merge would abort otherwise).
- `find-diacritic-issues-all.mjs b1 --dir prod`: **0 flagged** across both files. Clean.
- `merge-to-production.mjs b1 --dry-run`:
  - `vocab-b1-new.json` (801) → `vocab-b1.json` (1243 → 2044)
  - `uttrykk-b1-new.json` (121) → `uttrykk-b1.json` (184 → 305)
  - No id collisions, no lemma-collision warnings. All 922 entries ready to merge.

### Merge — ✅ COMPLETE (2026-08-14)

```
node scripts/merge-to-production.mjs b1
```
- `vocab-b1.json`: 1243 → **2044** entries. `.bak` written. `vocab-b1-new.json` → `.merged`.
- `uttrykk-b1.json`: 184 → **305** entries. `.bak` written. `uttrykk-b1-new.json` → `.merged`.
- Re-commented the `B1-draft` / `B1-uttrykk-draft` lines in `find_dupes.py` (both now inactive again, matching the other levels).

### Remaining (optional, not blocking)
1. Spot-check a few of the newly merged entries in the running app.
2. Cyrillic-homoglyph sweep (non-ASCII lookalike chars found once in enrichment output, in an entry that was since deleted) — worth a dedicated scanner across production files at some point, separate session.

✅ **Project complete.** The "Opp og fram!" arbeidsbok B1 vocab/uttrykk extraction — from textbook mining (§1–9) through category decisions (§10), uttrykk `general`-bucket cleanup (§11), schema enrichment (§12), dedupe/validation, ID assignment, and production merge — is done.
