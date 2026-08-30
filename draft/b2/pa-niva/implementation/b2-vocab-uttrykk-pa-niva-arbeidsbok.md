---
title: B2 Vocab Uttrykk På Nivå Arbeidsbok
reference: draft/b2/pa-niva
data-started: 2026-08-26
data-completed: 2026-08-27
---

# Plan: Vocab & uttrykk extraction from *På Nivå* arbeidsbok B2

Source: `draft/b2/pa-niva/arbeidsbok-b2.md` (exercises) + `draft/b2/pa-niva/arbeidsbok-b2-fasit.md` (answer key)
Targets: `src/lib/data/vocab-b2.json`, `src/lib/data/uttrykk-b2.json`
Rules: `data-rules/vocab-and-uttrykk.md` — governs the vocab/uttrykk boundary throughout this project (extraction, classification, and schema formatting); see §3 and §5 below for where it applies.
Goal: pull new B2 vocab/uttrykk candidates from the workbook, **remove anything already covered**, then only add the genuinely new items.

## Progress tracker

Update this after every session — mark a step ✅ Done (with a one-line result) the moment it's
finished, so a session cutoff never loses the thread. Steps map to the process sections below.

- [x] **Step 0 — Source analysis & triage** (§1, §2) — ✅ Done. Source structure understood,
  in-scope vs. out-of-scope sections identified.
- [x] **Step 1 — Extraction script** (§3, §8) — ✅ Done. `scripts/extract-pa-niva-b2.mjs` now
  covers all 9 in-scope sections: the 4 paraphrase/faste-uttrykk sections (105 candidates) plus
  5 particle-verb sections (46 candidates: 14 explain-list, 15 table, 5 partisipp, 4
  correction-pairs, 8 nominalization). **151 candidates total, 4 flagged needs_review** (the
  §27 correction pairs — fast/løst sammensatt verb needs a manual look, kept as sentence pairs
  rather than guessed). Written to `draft/b2/pa-niva/data/candidates-raw.json`. Only
  `17 SAMMENSATTE VERB` remains excluded (compound tense, not particle verbs — see
  `sections-skipped.json`).
- [x] **Step 1.5 — Spell-check candidates** (§3b) — ✅ Done. Ran
  `scripts/check-spelling-candidates.ts` against all 151 candidates (added `sentence`,
  `marked_word`, `partikkelverb_raw`, `verb_raw`, `partisipp_forms` field coverage for the
  particle-verb types first). 13 occurrences / 9 unique words flagged, all verified as
  legitimate (inflections, a proper noun, a prefix, dictionary gaps — none were extraction
  typos; `innflytningspresangen` confirmed verbatim in `arbeidsbok-b2-fasit.md`). All 9 added to
  `scripts/spelling-allowlist.txt`. No changes needed to `candidates-raw.json`. **Next action:
  Step 2 (dedup).**
- [x] **Step 2 — Dedup** (§4) — ✅ Done. Ran `scripts/dedup-pa-niva-b2.mjs` (same
  normalize()/near-duplicate heuristic as the B1 project's `dedup-textbook-source.mjs`) against
  all 151 candidates, matched against all 15 `vocab-*`/`uttrykk-*` files (all levels + previews)
  plus `norske_metaforiske_uttrykk_B1_B2.json`. Results: 40 duplicates, 3 near-duplicates, 4
  no-term, 102 new. **Near-duplicates dropped** (`glede seg til noe`, `rydde opp etter seg`,
  `sette pris på noe/noen` — all already covered by their shorter existing entries).
  **No-term entries (§27 correction pairs) manually resolved**: `si opp` → duplicate
  (`v-b1-work-051`), `høre til` → duplicate (`v-b1-society-084`), `vokse opp` → duplicate
  (`v-b1-family-026`), `kaste opp` → genuinely new (not found anywhere in vocab/uttrykk), moved
  into `candidates-new.json`. Final counts: **103 new candidates** in `candidates-new.json`,
  **43 duplicates** in `candidates-duplicate.json`, `candidates-near-duplicate.json` and
  `candidates-no-term.json` both resolved/empty. **Next action: Step 3 (classify vocab vs.
  uttrykk) on the 103 new candidates.**
- [x] **Step 3 — Classify vocab vs. uttrykk** (§5) — ✅ Done. Classified all 103 new candidates
  against `data-rules/vocab-and-uttrykk.md`: **20 vocab** (18 confident + 2 originally
  `needs_review`), **10 uttrykk** (8 confident + 2 originally `needs_review`), **73 rejected**
  (54 grammar-drill answers that aren't lexical units — mostly paraphrase-exercise answers like
  synonym/passive/comparative drills, not vocab/uttrykk material — plus 19 duplicates missed by
  the automated dedup normalizer, e.g. conjugated forms like `håper (at)` for already-covered
  `håpe`). Written to `draft/b2/pa-niva/data/candidates-vocab.json`,
  `candidates-uttrykk.json`, `candidates-rejected.json`. All 3 `needs_review` flags
  (`å gå opp`, `være på knærne etter (noen)`, `med mindre`) manually verified by user and
  cleared 2026-08-27. **Next action: Step 4 (schema enrichment & merge).**
- [x] **Step 4 — Schema enrichment & merge** (§6) — ✅ Done. Enriched all 20 vocab + 10 uttrykk
  candidates with full schema fields (english/ukrainian/spanish/german, example sentences in all
  4 languages, Norwegian `definition`) and merged directly into `vocab-b2.json` (1759 → 1779
  entries) and `uttrykk-b2.json` (608 → 618 entries). Categories assigned from `CATEGORIES_BY_LEVEL.B2`:
  vocab spread across `advanced-verbs` (9), `advanced-adjectives` (2), `abstract-nouns` (1),
  `medicine` (2), `business` (2), `relationships` (2), `politics` (1), `economics` (1); uttrykk
  themes: `idioms` (5), `discourse-markers` (4), `opinion-formulas` (1), `fixed-prepositional-phrases` (1).
  Corrected 3 uttrykk entries (`være i god stand`, `være på jakt etter`, `vite hva man snakker om`)
  that had an incorrect `å`-prefix in `suggested_norsk`/`suggested_lemma` — per
  `data-rules/vocab-and-uttrykk.md`, verb-initial uttrykk use the bare dictionary-citation form,
  no `å`. No ID collisions; validated both merged files parse as valid JSON with all required
  fields present. **Plan complete — all 4 steps done.**

## 1. Why this source is fundamentally different from the B1 "Opp og fram" extraction — ✅ Done

The B1 arbeidsbok had explicit `## Vokabular` tables per chapter (`word | Norwegian definition | translation`) — a clean, structured source. **This B2 arbeidsbok has no such tables anywhere** (confirmed: zero hits for "vokabular"/"ordforråd"/"ordliste" across all ~6,800 lines / 237 `###` sections). It's a pure grammar-drill workbook: fill-in-the-blank, sentence transformation, matching, and reading-comprehension exercises, organized under 4 kapittel (Ordklasser, Ordlaging, Setninger, Tekster og tekstbinding).

This means:
- There is no ready-made candidate list to parse — most exercises (artikkel choice, verb tense drills, sentence-structure analysis, comma placement) don't produce reusable vocab/uttrykk at all, only grammar *forms*.
- The genuine vocab/uttrykk material is scattered inside specific exercise *types*, and often only becomes readable by combining the exercise prompt with its answer in the fasit (e.g. a paraphrase exercise: sentence A + blanked sentence B + the fasit's short answer together reveal the idiom).
- The exercise/fasit pairing is positional, not tabular: fasit answers are matched to exercise items by number/letter, under a mirrored heading structure (`##`/`###` in the arbeidsbok become `####` in the fasit, exercise numbers match). A script needs to walk both files in parallel by section+item number, not just regex the arbeidsbok alone.

## 2. In-scope sections (candidate-rich) vs. out-of-scope (grammar-only) — ✅ Done

Identified by scanning all section headers and spot-checking content:

**In scope — real vocab/uttrykk material:**
- `10 80 PARSETNINGER` (Preposisjoner) — 80 paraphrase pairs; reconstructing sentence B from A + fasit yields idioms/fixed expressions (e.g. "være på jakt etter", "gå i orden").
- `12 FASTE UTTRYKK` (Preposisjoner) — 7 explicit fixed prepositional expressions, already listed as `å + verb + prep` phrases in the exercise itself.
- `17 PARSETNINGER` (Leddsetninger) and `15 PARSETNINGER: MODALE UTTRYKKSMÅTER` (Verb) — same paraphrase-reconstruction pattern as #1.
- `9 METAFORER`, `1 KULTURELLE UTTRYKK` (Helsetninger), `5 HOMONYMER`/`6`/`7` (Mer om ord), `8 I GODT HUMØR` — idiom/figurative-language sections.
- `17 SAMMENSATTE VERB`, `24 HVILKET PARTIKKELVERB?`, `25 ET AVSLAG – Å AVSLÅ`, `26 PARTIKKEL OG PARTISIPP`, `27 LØST ELLER FAST SAMMENSATT PARTIKKELVERB?` (Verb) and `13 ORDLAGING AV PARTIKKELVERB` (Avledninger) — particle-verb pairs (fast/løst sammensatt), same vocab-vs-uttrykk boundary rule as the B1 project.
- `2 ORDTAK` (Adverb) — proverbs, likely uttrykk.
- Reading/biography texts: `KJENTE NORDMENN` sections (Nansen, Heyerdahl, Carlsen, Brækhus) and `TEKSTER` chapter texts (klimasoner, ledig stilling, formelt brev, politiske partier, anmeldelse) — free-running prose likely to contain B2-level vocab not drilled elsewhere; needs manual/LLM skim rather than pattern extraction, lower priority.
- `4 HVA BETYR DET?`/`5 OVERFØRT BETYDNING` (Sammensatte ord), `2`/`8`/`9` (Mer om ord) — compound-word and figurative-meaning drills that name specific words worth capturing.

**Out of scope — pure grammar mechanics, no reusable lexical content:**
- Artikkel/kjønn drills, entall↔flertall transforms, verb tense (presens perfektum/preteritum) drills, aktiv/passiv transforms, setningsledd/setningsanalyse, ordstilling, komma/stor-liten bokstav, determinativ choice, adjektiv gradbøyning mechanics, leddsetning/nominale setninger structure. These drill grammar *forms* of words already common at lower levels, not new lexical items.

## 3. Extraction approach (per content type) — ⏳ Not started (this is Step 1)

1. **Parallel parse** of `arbeidsbok-b2.md` + `arbeidsbok-b2-fasit.md`: for each in-scope section, match by section title + exercise number (fasit headings mirror the arbeidsbok's `##`/`###` under one level of `####`, in the same order) to pair prompts with answers.
2. **Paraphrase sections (`PARSETNINGER`, `FASTE UTTRYKK`, `MODALE UTTRYKKSMÅTER`)**: reconstruct full sentence B from the blank + fasit answer, extract the idiomatic phrase as the candidate `raw_term`, keep sentence A's paraphrase as a definition hint.
3. **Particle-verb sections**: extract verb+particle pairs directly (often already itemized in the exercise, e.g. "å avslå"/"et avslag"); apply the vocab/uttrykk boundary rule from `data-rules/vocab-and-uttrykk.md` (fast sammensatt / lexicalized particle verbs → vocab; løst sammensatt phrases with no single grammatical head → uttrykk — same split used for B1), and also capture derived nouns where present.
4. **Reading texts (KJENTE NORDMENN, TEKSTER)**: lower priority pass — skim for B2-level words/expressions not already drilled elsewhere in the book; likely needs manual review rather than a parsing script since there's no structural marker for "this word is worth extracting."
5. Write a script in `scripts/` (e.g. `extract-pa-niva-b2.mjs`), following `dedup-textbook-source.mjs` conventions from the B1 project (Node ESM, `--dry-run`, prints keep/drop decisions, doesn't mutate JSON directly) but with a **parallel two-file reader** instead of single-file table parsing, since this source has no tables.
6. Output: `candidates-raw.json` (all extracted raw_term + context per in-scope section) for a sanity check with you before dedup.

## 3b. Spell-check candidates (before dedup) — ⏳ Not started (Step 1.5)

Run `scripts/check-spelling-candidates.ts` against `draft/b2/pa-niva/data/candidates-raw.json`
before Step 2. Reuses the nb Hunspell dictionary + `scripts/spelling-allowlist.txt` from
`check-spelling.ts`, but reads `candidates-raw.json`'s own field set (`raw_term`, `sentenceA`,
`sentenceB_filled`, `original_sentence`, `corrected_sentence`, `base_verb`, `explanation`,
`note`) instead of the production `vocab-*`/`uttrykk-*` schema, since the candidates aren't in
that shape yet. Reasoning: dedup matching in §4 is normalize-and-compare against existing
`norsk`/`lemma` fields — a source/extraction typo in a candidate would silently fail to match an
existing entry and get miscounted as new, so this needs to run first. Flagged words get reviewed
and either fixed in `candidates-raw.json` or added to the shared allowlist if they're legitimate
(compounds/loanwords the dictionary doesn't know).

## 4. Dedup process (after raw extraction, before classifying) — ⏳ Not started (Step 2)

Same approach as the B1 project, since target schema/files are unchanged:

1. Normalize each candidate (strip markup/gender-parens/word-class tags, lowercase, trim).
2. Match against normalized `norsk`/`lemma` across **all** `vocab-*.json`/`uttrykk-*.json` files (not just the B2 ones — B1 project found ~35% of "new" candidates were already covered at other levels).
3. Exact match → duplicate, drop. No match → keep.
4. Add a near-duplicate pass (prefix/trailing-word heuristic from the B1 project) to catch phrase variants that don't normalize identically but are the same entry.
5. Review `candidates-new.json`, `candidates-duplicate.json`, `candidates-near-duplicate.json` with you before classification.

## 5. Classifying survivors: vocab vs. uttrykk — ✅ Done (Step 3)

Governed by `data-rules/vocab-and-uttrykk.md` — the same rules doc used for the B1 project. Apply its decision rule in order:
1. Does the candidate function as a lexical item (noun/verb/adjective/preposition/etc.) that learners inflect/conjugate and recombine normally? → **vocab-b2.json**. This includes reflexive/particle verbs (`kle på seg`, `slå av`), multi-word prepositions (`ved siden av`), lexical noun phrases (`kunstig intelligens`), and verb+preposition collocations with a freely swappable object (`sørge for`, `ta hensyn til`).
2. Is it primarily a fixed chunk with no single grammatical head — idiom, proverb, formula, fixed time/prepositional expression? → **uttrykk-b2.json**.
- Ambiguous idiom-shaped verb phrases (e.g. a verb-initial phrase whose complement isn't a true grammatical object, like `være skyld i`) → separate review file for manual yes/no, not auto-classified (this mattered a lot in the B1 project — shape-based rules alone misclassify genuine idioms).
- Follow the rules doc's field-formatting conventions too: `norsk`/`lemma` casing, `å`-prefix only for vocab verbs (never for uttrykk, which use the bare dictionary-citation form), and `part` assignment per its table.

## 6. Schema notes for new entries — ✅ Done (Step 4)

- `id`: vocab uses `v-b2-<category>-NNN` (per-category counter, continuing existing `vocab-b2.json` counters); uttrykk uses `u-b2-NNN` (single global counter, continuing existing `uttrykk-b2.json`).
- Fields: `norsk`, `lemma`, `english`, `ukrainian`, `spanish`, `german`, `example`, `example_english`, `example_ukrainian`, `example_spanish`, `example_german`, `definition` (Norwegian), `level: "B2"`, `category` (vocab) / `theme` (uttrykk), `part`.
- Unlike the B1 source, the workbook rarely supplies a ready Norwegian definition or a clean example sentence — the exercise sentence itself (reconstructed from prompt + fasit) can usually serve as the `example`, but `definition` will need to be written fresh for most entries rather than lifted from source.
- `category`/`theme` assigned against the existing taxonomy already used in `vocab-b2.json`/`uttrykk-b2.json`.

## 7. Open questions

- **KJENTE NORDMENN / TEKSTER reading texts**: worth a dedicated extraction pass, or skip entirely as too unstructured/low-yield relative to effort? Recommend starting with the structured idiom/paraphrase/particle-verb sections (§2 items 1–2, 5–6) first, and deciding on the reading texts once we see how much those sections alone yield.
- **`norske_metaforiske_uttrykk_B1_B2.json`** already exists in `src/lib/data` — should the `9 METAFORER` section be deduped against that file specifically (in addition to `uttrykk-b2.json`) to avoid re-adding metaphors already captured there?
- Confirm fasit heading structure holds consistently through the whole file before writing the parallel parser (spot-checked 4 sections so far, all matched cleanly by title+number).

## 8. Step 1 in detail — extraction script

**Status: ⏳ Not started.** Write and dry-run `scripts/extract-pa-niva-b2.mjs` against the in-scope
sections listed in §2, starting with `10 80 PARSETNINGER`, `12 FASTE UTTRYKK`, `17 PARSETNINGER`,
and the particle-verb sections — produce `candidates-raw.json` for review before moving to dedup
(§4). New `data/` and `scripts/` directories now exist under `draft/b2/pa-niva/` for this —
script goes in the repo-root `scripts/`, but intermediate output files (`candidates-raw.json`,
etc.) should land in `draft/b2/pa-niva/data/`, mirroring the B1 project's
`draft/b1/opp-og-fram-arbeidsbok/data/` convention.

**Status: ✅ Done — all 9 in-scope sections implemented.** 151 candidates total, written to
`draft/b2/pa-niva/data/candidates-raw.json`:

| Section | Type | Count | needs_review |
|---|---|---|---|
| 15 PARSETNINGER: MODALE UTTRYKKSMÅTER | paraphrase | 8 | 0 |
| 10 80 PARSETNINGER | paraphrase | 80 | 0 |
| 17 PARSETNINGER | paraphrase | 10 | 0 |
| 12 FASTE UTTRYKK | faste-uttrykk | 7 | 0 |
| 24 HVILKET PARTIKKELVERB? | particle-verb-explain | 14 | 0 |
| 25 ET AVSLAG – Å AVSLÅ | particle-verb-table | 15 | 0 |
| 26 PARTIKKEL OG PARTISIPP | particle-verb-partisipp | 5 | 0 |
| 27 LØST ELLER FAST SAMMENSATT PARTIKKELVERB? | particle-verb-correction | 4 | 4 |
| 13 ORDLAGING AV PARTIKKELVERB | particle-verb-nominalization | 8 | 0 |

Only `17 SAMMENSATTE VERB` stays excluded (compound tense mechanics, not particle verbs).

**Particle-verb parser notes:**
- `24`: fasit is already "explanation: verb" pairs in bullet order — parsed directly, `raw_term`
  is the bare infinitive (e.g. `avslå`).
- `25`: parallel markdown-table parse (arbeidsbok sentence+bold word ↔ fasit ordklasse+verb).
  Usage notes in parentheses (e.g. å gå på vs. å pågå) captured in a separate `note` field rather
  than dropped.
- `26`: bold verb headers matched to fasit's "verb: partisipp-forms" lines by exact text.
- `27`: sentence-diff pairing (checkbox originals vs. fasit's Riktig/Rettinger lists) — the 4
  wrong-sentence → corrected-sentence pairs are extracted but **always flagged needs_review**,
  since isolating the exact fast/løst verb pair from each pair is a judgment call left for
  Step 2/3 review rather than guessed by the parser.
- `13`: fasit table gives letter→Nr→nominalization→explanation directly; base verb pulled from
  the arbeidsbok's own numbered list via the Nr column.

**Next: Step 2 (§4)** — dedup all 151 candidates (105 paraphrase/uttrykk + 46 particle-verb)
against existing vocab-*.json/uttrykk-*.json in one pass.
