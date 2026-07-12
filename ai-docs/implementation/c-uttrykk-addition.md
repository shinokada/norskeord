# Expanding `uttrykk-c.json` from textbook idioms (items 83–103)

## Background

While planning `c-grammar.md`'s `uttrykk-gjenkjenning-c-1/2/3` topics, an overlap check found
that of 396 bolded idiom sentences across `draft/c/grammar/83-92.md` and `93-103.md`, only ~20 of
381 existing `uttrykk-c.json` entries match something in that range — the textbook's idiom set
(items 83–103) is a large, mostly-untapped source of C-level `uttrykk` material, separate from
the items 1–8 idioms (ta hånd om, stå til liv, etc.) that `uttrykk-c.json` was originally built
around.

`ai-docs/implementation/c-uttrykk-missing-candidates.json` holds the raw candidate list, built by
cross-referencing the bolded idiom sentences from items 83–103 against `draft/c/grammar/answers.md`
(for the correct paraphrase) and against `uttrykk-c.json` (to exclude anything already covered).

**Note on the candidate count:** `c-uttrykk-missing-candidates-readme.json` records
`"candidates_below": 375`, but the actual candidates file contains **264** entries (262 with a
`correct_paraphrase`, 2 with `null` — items 83/sub 2 and 102/sub 20 — where the answer key didn't
give a clean one-line paraphrase). The readme's 375 figure is stale, from an earlier pass before
some further filtering; **264 is the real starting count** for this document and should be treated
as the source of truth going forward.

## What the candidates actually are

Each candidate is `{ item, sub, sentence, correct_paraphrase }` — one bolded sentence from the
textbook plus its answer-key paraphrase. Spot-checking the set confirms the concern already
flagged in `c-uttrykk-missing-candidates-readme.json`: **not every candidate is a genuine fixed
idiom.** The 264 entries are a mix of:

1. **Genuine fixed idioms with no single grammatical head** — the clear `uttrykk` case per
   `data-rules/vocab-and-uttrykk.md`: *ulv i fåreklær*, *grevens tid*, *som hund og katt*, *katta i
   sekken*, *gå på skinner*, *smi mens jernet er varmt*, *bite i det sure eplet*, *sette kronen på
   verket*, *danse etter noens pipe*, *falle i god jord*, etc.
2. **Proverbs** — also squarely `uttrykk` per the data rules ("...and all proverbs"): *eplet
   faller ikke langt fra stammen*, *som man reder, ligger man*, *brent barn skyr ilden*, *egget vil
   lære høna å verpe*.
3. **Ordinary single-word or lightly-idiomatic synonym tests** — the textbook is testing vocabulary
   comprehension, not always fixed chunks: *"Lysene funkler" → "Lysene blinker"*, *"Han er døsig" →
   "Han halvsover"*. These don't pass the lexical-unit-head test as multi-word `uttrykk` — most are
   either already-covered single-word `vocab` items or not worth a card at all.
4. **Particle/reflexive verb idioms that are arguably productive `vocab`, not `uttrykk`** — e.g.
   *å dra på årene* (to age), *å dra kjensel på* (to recognize), *å komme seg* (to recover) have a
   clear verb head and inflect normally, so per the decision rule in `data-rules/vocab-and-uttrykk.md`
   these lean `vocab` (multi-word verb, part: `verb`), not `uttrykk`.

So this document's job is **triage first, data entry second** — not a straight 264-entry import.

## Phase 1 — Triage pass

Go through all 264 candidates and assign each one a bucket:

- **`uttrykk`** — fixed expression, no single grammatical head, matches the `uttrykk-xx.json`
  criteria in `data-rules/vocab-and-uttrykk.md` (idiom, proverb, fixed formula).
- **`vocab`** — has a clear grammatical head (usually a particle/reflexive verb) that inflects
  normally; belongs in `vocab-c.json` with `part: verb` (or whatever head part applies), not
  `uttrykk-c.json`.
- **`skip`** — a plain synonym-substitution test with no fixed-chunk or dictionary-headword value
  of its own (e.g. *funkle → blinke*, *døsig → halvsove*); not worth a card in either file. Also
  skip anything whose Norwegian meaning can't be pinned down confidently from `sentence` +
  `correct_paraphrase` alone (the two `null`-paraphrase entries, and any borderline case) —
  cross-check `draft/c/grammar/answers.md` directly rather than guessing.

Do this pass manually (or with a lightweight `.mjs` helper that just prints each candidate for
review) rather than trying to automate the vocab/uttrykk judgment call — it's exactly the kind of
edge-case decision `data-rules/vocab-and-uttrykk.md` says needs the lexical-unit-head test applied
case by case, not a heuristic.

Output: `ai-docs/implementation/c-uttrykk-triage.json`, same shape as the candidates file plus a
`bucket: "uttrykk" | "vocab" | "skip"` field and a `canonical_lemma` field (the dictionary/citation
form to use as `lemma`, e.g. sentence *"Han har fått kalde føtter"* → canonical lemma `få kalde
føtter`).

Expect roughly (rough estimate, confirm during the actual pass): ~120–150 → `uttrykk`,
~30–50 → `vocab`, remainder → `skip`.

## Phase 2 — Cross-file dedup check on the `uttrykk` bucket

Before drafting full entries, re-check each `canonical_lemma` in the `uttrykk` bucket against
**all** `uttrykk-{a1,a2,b1,b2,c}.json` files, not just `uttrykk-c.json` — some of these idioms
(*som hund og katt*, *ta hånd om*) are common enough that they might already exist at a lower
level. Reuse the matching approach from `scripts/dedup-cross-file.mjs` rather than writing new
matching logic. Anything already present at another level gets dropped from this batch (or, if it
genuinely belongs at C and only exists elsewhere by mistake, flagged for a separate level-fix
decision — not silently duplicated).

## Phase 3 — Draft raw entries (Step 1 equivalent)

For the surviving `uttrykk` candidates, produce the Step-1-style raw shape used elsewhere in the
pipeline (`id`, `norsk`, `lemma`, `level: "C"`, `category: "uttrykk"`, `part: "phrase"`), no
translations yet:

- `norsk` / `lemma` — the `canonical_lemma` from Phase 1, formatted per
  `data-rules/vocab-and-uttrykk.md` (`norsk` = the fixed form as shown to learners; `lemma` =
  same value, since `phrase`-part entries use `lemma` identical to `norsk`).
- `id` — assign via the existing `v-{level}-{category}-{NNN}` / `u-{level}-{NNN}` convention
  (`scripts/assign-ids.mjs`), continuing from the current max `uttrykk-c.json` id (**`u-c-395` is
  the current highest id — 381 entries total, with some gaps from earlier dedup deletions — so new
  ids start at `u-c-396`**).

Write this to `draft/c/vocab-uttrykk/uttrykk-c-idiom-batch.json`, following the same
`draft/{level}/...` convention as the image-extraction pipeline, so it's obvious this is a draft
batch and not yet production data.

## Phase 4 — Enrich (Step 2 equivalent)

Run (or adapt) `scripts/enrich-vocab.mjs`-style enrichment against the Phase 3 draft file to fill
in `english`, `ukrainian`, `spanish`, `german`, `example`, and the four `example_*` translations.
Two adjustments needed versus a straight `enrich-vocab.mjs --level c` run:

1. Point the input at `draft/c/vocab-uttrykk/uttrykk-c-idiom-batch.json` instead of
   `extracted-uttrykk-c.json`.
2. Feed the textbook's own `sentence` (from the original candidate) to the model as inspiration
   only, never copied verbatim, for the `example` field — the existing `enrich-vocab.mjs` prompt
   already writes a fresh Norwegian example when none is supplied, so simplest path is to *not*
   pass through the textbook sentence as a pre-filled `example` and let the model write an
   original one, consistent with the copyright approach already used in `c-grammar.md` ("every
   question is newly written... never copying or closely paraphrasing").

Expressions never get a `definition` field (per `enrich-vocab.mjs`'s own `usesDefinition` logic),
so no change needed there.

## Phase 5 — Verify (Step 3 equivalent)

1. `scripts/check-uttrykk.mjs` on the enriched batch — same checks as any other uttrykk import
   (missing translations, diacritic issues, id format).
2. `scripts/find-diacritic-issues.mjs` / `find-diacritic-issues-de-es.mjs` — this pipeline has
   already surfaced NO/DE/ES diacritic bugs in prior sessions, so don't skip this even though
   `enrich-vocab.mjs`'s `correctGeneratedItem` auto-fixer catches the mechanical cases.
3. `scripts/dedup-within-file.mjs` on the batch itself (idiom sub-lists sometimes restate the same
   expression under a different item, e.g. *gå på skinner* appears at both item 85/sub 1 and item
   98/sub 18).
4. Manual spot-check of `example` sentences against `definition`-equivalent meaning, since
   idiom-level entries are easier to get subtly wrong than single words.

## Phase 6 — Merge to production

Follow the existing `scripts/merge-to-production.mjs` pattern to append the verified batch into
`src/lib/data/uttrykk-c.json`. After merging, re-run `scripts/check-uttrykk.mjs` and
`scripts/dedup-cross-file.mjs` against the full production file (not just the new batch) as a
final safety net.

## The `vocab` bucket (Phase 1 spillover)

Candidates triaged as `vocab` in Phase 1 (particle/reflexive verbs like *dra på årene*, *dra
kjensel på*, *komme seg*) follow the same Phases 3–6 shape but target `vocab-c.json` instead, with
`part: "verb"` and a real `category` from the C-level `CATEGORIES_BY_LEVEL` list (most likely
`character-temperament`, `embodied-emotion`, or `manner-of-motion` given the content) rather than
`category: "uttrykk"`. This is a smaller, secondary batch — worth doing in the same pass since the
triage step already separates them out, but not the primary goal of this document.

## Relationship to `uttrykk-gjenkjenning-c-1/2/3` (c-grammar.md)

This expansion is a **prerequisite data task**, not the grammar-question-writing task itself.
Once Phase 6 lands, `c-grammar.md` Phase 2 steps 20–22
(`uttrykk-gjenkjenning-c-1/2/3`) can draw on a meaningfully larger `uttrykk-c.json` — likely
~120–150 more real entries beyond the ~20 that already overlapped — when selecting which idioms
get a multiple-choice question, instead of being limited to the pre-expansion set.

## Open items

- Exact `uttrykk` vs. `vocab` vs. `skip` counts are unknown until Phase 1's manual pass is done —
  the estimates above are provisional.
- Whether to keep `draft/c/vocab-uttrykk/uttrykk-c-idiom-batch.json` around after merging (as a
  provenance record, consistent with other `draft/{level}/...-new.json` files left in place
  elsewhere in the repo) or delete it — default to keeping it, matching existing convention, unless
  told otherwise.
