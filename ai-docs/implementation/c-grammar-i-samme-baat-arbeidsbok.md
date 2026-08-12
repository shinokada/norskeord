---
title: C grammar I Samme Båt Arbeidsbok
reference: draft/c/i-samme-baat-arbeidsbok
data-started: 2026-08-11
data-completed: 2026-08-12
---

# Nivå C Grammar — "I samme båt!" Arbeidsbok (non-preposition exercises)

## Overview

Source: `draft/c/i-samme-baat-arbeidsbok/questions.md` (chapters 1–19) + `innhold.md` for the table
of contents. The preposition exercises from this same workbook (`preposisjonsoppgaver.md`) are a
separate, already-completed plan — see `c-grammar-preposition-i-samme-baat.md`. This plan covers
the grammar-relevant exercises embedded in the per-chapter sections, which that plan didn't touch.

Most per-chapter exercises (`X.2 Velg riktig alternativ`, `X.3/X.2 Lag parsetninger`) are
synonym/nuance multiple-choice and paraphrase drills — these test vocabulary and idiom
comprehension, not grammar rules, and are already in scope of the vocab/uttrykk merge
(`c-vocab-uttrykk-i-samme-baat-arbeidsbok.md`), not this plan.

The genuinely grammar-focused exercises are:

| Chapter | Exercise | Grammar point | Raw items |
| ------- | -------- | -------------- | --------- |
| 4       | 4.3      | Pluskvamperfektum + 2. kondisjonalis (hvis han hadde …, ville han ha …) | 10 |
| 11      | 11.2     | Same — hvis-setninger, pluskvamperfektum + 2. kondisjonalis | 12 |
| 5       | 5.3      | Adjective bøying: komparasjon (inkl. irregular: seig, olm, våken) + bestemt form | 10 |
| 6       | 6.3      | Ordfamilie (substantiv/verb/adjektiv avledning) | 15 |
| 7       | 7.3      | Ordfamilie (table format, 10 headwords × 3 word-class columns) | 10 rows |
| 17      | 17.4     | Mixed cloze: bøy verb/substantiv/adjektiv riktig + riktig ordstilling | 15 |
| 18      | 18.3     | Sammensatte substantiv (compound nouns from definitions) | 10 |

**Copyright approach (unchanged from every prior plan):** fresh sentences per grammar point;
source sentences/definitions used only to identify which grammar form is tested, never copied.

**Out of scope for this plan — flagged, not actioned:** the `Språkhjørnet` nuance sections
(8.3 *glatt*, 9.3 *bare – kun – utelukkende*, 10.3 *bane*, 11.3 *å late*, 14.3 *an*,
15.3 *å senke – å synke*, 16.3 *å drive*, 17.3 *idet – imens – mens*, 18.4 *blant og mellom*).
Most of these are single-word polysemy/usage notes (glatt, bane, late, an, drive) that fit
`uttrykk-c.json`/vocab territory better than `grammar.json` question format — no clean testable
rule, more a set of fixed collocations per word. Two exceptions genuinely are grammar and could be
mined later: *idet – imens – mens* (subjunction vs. adverb distinction — `subjunksjon-oversikt` is
an existing B2 topic that could take C-level extensions) and *blant – mellom* (preposition
nuance — fits `preposisjoner-generelt-c`, already the target of the completed preposition plan).
Decision: leave both out of this plan's scope; revisit as a small follow-up only if the two
pluskvamperfektum/kondisjonalis + ordfamilie + sammensatte-substantiv batches below don't fill the
session budget.

---

## Scope decision: reuse existing topics where the CEFR level and skill already match

Checked directly against `grammar.json` (1976 questions total):

| Source item              | Existing topic                  | Current CEFR mix          | Current count | Decision |
| ------------------------- | -------------------------------- | -------------------------- | -------------- | -------- |
| 4.3, 11.2 (pluskv. + 2. kond.) | `kondisjonalis-counterfactual`   | C only                      | 9              | **Reuse** — already C-level, thin, exact skill match |
| 4.3, 11.2 (pluskv. + 2. kond.) | `perfektum-pluskvamperfektum`    | C only                      | 10             | **Reuse** — split each hvis-sentence's two clauses across both topics as appropriate (kondisjonalis topic for the whole conditional construction, perfektum topic if a question isolates just the pluskvamperfektum clause) |
| 6.3, 7.3 (ordfamilie)     | `ordfamilie-avledning`           | B1 26 / B2 42 / C 10        | 78             | **Reuse** — already has a C-level slice, room to extend it rather than fork |
| 18.3 (sammensatte ord)    | `sammensatte-substantiv`         | B1 9 / C 11                 | 20             | **Reuse** — already has a C-level slice |
| 5.3 (adjektiv bøying)     | `adj-comparison` / `adj-definite`| A2/B1 only (no C)           | 63 / 12        | **New C-level topic** — same precedent as `preposisjoner-uttrykk-b2` in the preposition plan: extending an A2/B1 topic with C-level irregular-comparative + bestemt-form items would blur its level; propose `adj-comparison-c` (or fold into a single new `adj-c` topic if the batch turns out small — decide after drafting) |
| 17.4 (mixed cloze)        | *(none — spans multiple topics)* | —                            | —              | **Split by blank**, not a single topic — see Phase 2 below |

---

## Content plan (`src/lib/data/grammar.json`)

- **Batch A — Pluskvamperfektum/2. kondisjonalis (ch. 4.3 + 11.2, 22 raw items):** draft fresh
  hvis-setninger from the 22 source pairs (freely invented content, not the book's own sentences —
  same copyright approach as always), split between `kondisjonalis-counterfactual` and
  `perfektum-pluskvamperfektum` depending on whether the question targets the full conditional or
  just the pluskvamperfektum clause. Continue numbering from `gq-kond-010` / `gq-perf-011`. Given
  both topics are already thin (9–10 each), aim for most of the 22 pairs to become new questions
  rather than trimming hard — target roughly 15–20 new questions total across the two topics.

- **Batch B — Ordfamilie (ch. 6.3 + 7.3, 15 + 10 headwords):** cross-check headwords against
  existing `ordfamilie-avledning` entries first (dedup, same discipline as the preposition plan's
  idiom mining) before drafting new ones. Continue from `gq-avled-079`.

- **Batch C — Sammensatte substantiv (ch. 18.3, 10 items):** straightforward compound-noun cloze
  from definitions (e.g. "en bolig for flere generasjoner" → generasjonsbolig). Continue from
  `gq-samset-021`.

- **Batch D — Adjektiv bøying (ch. 5.3, 10 items):** new C-level topic. Covers irregular
  comparison (seig/seigere, olm/olmere, våken/våknere — confirm actual comparative forms during
  drafting, several of these are irregular or unusual and need a dictionary check) and bestemt
  form in comparative/superlative context. Decide final topic id/rule text once drafted.

- **Batch E — 17.4 mixed cloze (15 items):** lowest priority / most labor-intensive, since each
  blank tests a different point (verb bøying, noun bøying, adjective bøying, word order) — this
  needs per-blank triage into whichever existing topic fits (`verbform-i-kontekst`,
  `substantiv-bestemt-form`, `adj-*`, `v2-word-order`/`subordinate-order`, etc.) rather than one
  batch write. Treat as a stretch batch — do Batches A–D first, revisit E only if there's session
  budget left; the source sentences here are also unusually mangled/gapped (`(smelle igjen – dør –
  min – far – av)` style multi-word parentheticals), so expect this batch to take longer per item
  than A–D.

---

## Implementation phases

### Phase 0 — Headword/dedup check (Batch B, C only) — ✅ done 2026-08-11

1. Extracted ch. 6.3, 7.3 headwords and ch. 18.3 target compounds directly from `questions.md`.
2. Cross-checked against all existing `ordfamilie-avledning` (78) and `sammensatte-substantiv` (20)
   entries in `grammar.json`.

**Ch. 6.3 headwords (15):** skjær ×3, inntraff, grufull ×2, fnisende, gynge, spikret, har gnagd,
forsonende, gisper, gjørmen, puffer, makt.
**Ch. 7.3 verb column (10, need substantiv/adjektiv forms):** varte opp, skjemme bort, gå opp,
bite, gripe, smuldre opp, forkle, ransake, flomme, trenge.
**Ch. 18.3 compounds (10):** familiemedlemmer, fløyelsforheng, generasjonsbolig,
cellegiftbehandling, førstefødt sønn, gråtkvalt, samtykkeerklæring, gassbeholder,
prioriteringsliste, krigsherjet land.

**Dedup result:**
- **Only one collision:** `makt` (ch. 6.3 #15) — already a headword in `gq-avled-028` ("Velg
  riktig adjektivform av «makt»" → *mektig*). The ch. 6.3 exercise drills a fuller family (makt,
  mektig, makte/makter) across four blanks in one item, so there's room to write a
  non-duplicate question (different derivation, e.g. the verb *å makte*) — just don't repeat the
  exact makt→mektig pair from `gq-avled-028`.
- All other ch. 6.3 headwords, all ch. 7.3 verbs, and all ch. 18.3 compounds are new — zero
  overlap with the existing 78 `ordfamilie-avledning` / 20 `sammensatte-substantiv` entries.
- Batch B can start numbering at `gq-avled-079`, Batch C at `gq-samset-021`, per the content plan
  above — no renumbering needed.

### Phase 1 — Rules + topic setup

- Batches A, B, C: no new topic needed, existing rule text covers the material.
- Batch D: draft rule text for the new C-level adjective topic before writing questions.

### Phase 2 — Content, in the five batches above (A → B → C → D → E)

Each batch: draft fresh items → dedup/verify against existing `grammar.json` entries for that
topic → write in → run `check-grammar-norwegian.mjs` (and `check-c-grammar-vocab.mjs` where the
question references a `vocab-c.json`/`uttrykk-c.json` headword) before moving to the next batch.

### Phase 3 — Verification

Same per-batch discipline as the preposition plan: run both check scripts after each batch, not
just at the end.

### Phase 4 — Gating

None needed — nivå C is already all-Plus gated.

---

## Progress log

| Batch | Scope | Status |
| ----- | ----- | ------ |
| A     | 4.3 + 11.2 (pluskvamperfektum/2. kondisjonalis) | ✅ Done 2026-08-11 (redrafted once — see "Batch A/B recovery incident" note below) — 16 new questions (`gq-kond-010`–`gq-kond-025`), all in `kondisjonalis-counterfactual` (11.2's 12 pairs folded in too; see note below on why `perfektum-pluskvamperfektum` wasn't used). Verified with `check-grammar-norwegian.mjs` and `check-c-grammar-vocab.mjs` — 0 flagged. **Committed to git** right after writing. |
| B     | 6.3 + 7.3 (ordfamilie) | ✅ Done 2026-08-12 (redrafted after the recovery incident below) — 34 new questions (`gq-avled-079`–`gq-avled-112`), all in `ordfamilie-avledning`, covering all 15 ch. 6.3 headwords and all 10 ch. 7.3 verb triples. Verified with `check-grammar-norwegian.mjs` and `check-c-grammar-vocab.mjs` — 0 flagged (19 pre-existing B1/B2 unmatched items are unrelated to this batch). **Committed to git** (`d1ea892`) right after writing. |
| C     | 18.3 (sammensatte substantiv) | ✅ Done 2026-08-12 — 10 new questions (`gq-samset-021`–`gq-samset-030`), all in `sammensatte-substantiv`, covering all 10 ch. 18.3 compounds from Phase 0. Verified with `check-grammar-norwegian.mjs` and `check-c-grammar-vocab.mjs` — 0 flagged (3 pre-existing B1 unmatched items are unrelated to this batch). |
| D     | 5.3 (adjektiv bøying, new C topic) | ✅ Done 2026-08-12 (redrafted from scratch in a new session — the raw JSON from the session that drafted it was never persisted anywhere, only this doc's prose summary; see "Batch D redraft note" below) — new topic `adj-boying-c` added to `types.ts`/`rules.ts`, 10 new questions (`gq-adj-075`–`gq-adj-084`). Verified with `check-grammar-norwegian.mjs` and `check-c-grammar-vocab.mjs` (after adding `adj-boying-c` to the checker's `C_TOPICS` set) — 0 flagged, 0 unmatched. **Not yet committed to git** — commit next. |
| E     | 17.4 (mixed cloze, stretch) | ✅ Done 2026-08-12 — 12 new questions, split by blank across 8 existing topics per Phase 2's design (not one topic): `gq-vik-c-012` (verbform-i-kontekst), `gq-mermest-011` (adj-mer-mest), `gq-perf-011` (perfektum-pluskvamperfektum), `gq-setadv-029` (setningsadverbial), `gq-modaladv-013` (modale-adverb), `gq-ledd-011` (leddsetning-som-fundament), `gq-omskriv-011` (omskriving-passiv), `gq-komma-043` (kommaregler), `gq-noun-pos-033` (noun-possessives), `gq-adjadv-022` (adjektiv-eller-adverb), `gq-partform-021` (partisipp-former), `gq-predikativ-011` (predikativ-agreement). Verified against the real file with `check-grammar-norwegian.mjs` (0 flagged across all 12) and `check-c-grammar-vocab.mjs` on the 6 C-level topics among them (0 unmatched). Total `grammar.json` now **2,058 entries, all unique**. **Not yet committed to git** — commit next (this also covers Batch D's uncommitted `adj-boying-c` work). |

## Batch A/B recovery incident (2026-08-11)

A prior session's `write_file` call accidentally overwrote `grammar.json` with
placeholder text while merging Batch B. The recovery used `git checkout --
grammar.json`, but neither Batch A (16 questions) nor Batch B (19 questions)
had been git-committed yet, so the checkout reverted the file all the way
back to the pre-Batch-A baseline (1976 entries) — silently discarding both
batches, not just B. This was only caught at the start of the next session by
diffing actual entry counts against this doc's "Done" claims.

**Batch A was redrafted from scratch** (the original content wasn't
recoverable — only this doc's prose summary survived, not the raw JSON) and
re-verified clean with both check scripts before being written back via a
targeted `edit_file` append (not `write_file`), then git-committed
immediately. **Batch B still needs to be redrafted** — not yet done as of
this note.

**Lesson for future batches:** commit to git right after each batch passes
verification, before starting the next one. Don't rely on this doc alone as
the recovery mechanism — git history is the actual safety net.

## Batch A notes (discovered during drafting)

- **`perfektum-pluskvamperfektum` wasn't used after all.** Inspecting its 10 existing entries showed
  the topic actually drills adverbial placement (`har allerede ratifisert` vs. `har ratifisert
  allerede`) and perfektum-vs-preteritum tense choice — not hvis-setninger with 2. kondisjonalis.
  All 16 new questions (covering both ch. 4.3's 10 pairs and ch. 11.2's 12 pairs) went into
  `kondisjonalis-counterfactual` instead, which already contained that exact construction
  (`gq-kond-005`–`008`). No new `perfektum-pluskvamperfektum` items were added.
- **Every C-level grammar question needs a real vocab-c/uttrykk-c anchor word** —
  `check-c-grammar-vocab.mjs` enforces this (not just `check-grammar-norwegian.mjs`, which only
  checks for leftover English). 3 of the first 16 drafted items used invented content words
  (kilde, målt, rømningsveier) with no match in `vocab-c.json`/`uttrykk-c.json` and had to be
  reworded around real C-vocab (`beskyldningen`, `skissen`, `konstruksjonen`) before they passed.
  **Action for Batches C–E:** run `check-c-grammar-vocab.mjs <topic>` after drafting, not just
  `check-grammar-norwegian.mjs` — both were only informally mentioned in Phase 3 above, but the
  vocab one is the one that actually catches un-anchored content.
- Both check scripts live in `scripts/` and only need `grammar.json` (+ `vocab-c.json` /
  `uttrykk-c.json` for the vocab check) — run directly with `node scripts/<name>.mjs <topic>`.

## Batch D redraft note (2026-08-12)

The session that first drafted Batch D wrote the `types.ts`/`rules.ts` topic setup directly to the
real files, but only kept the 10 drafted questions in that session's local sandbox copy of
`grammar.json` — it ran out of turns before appending them to the real file, and the sandbox
content doesn't survive between sessions. The next session found only this doc's prose summary of
what the 10 items covered (the six grammar sub-patterns + which vocab words they'd be anchored to),
not the actual JSON, and had to redraft the 10 questions from scratch against that summary.

**Lesson (same as the Batch A/B recovery incident, generalized):** a batch isn't safe until it's
written to the real file on the user's disk — an in-progress batch sitting only in local sandbox
state is one session-limit cutoff away from needing a full redraft. Where a batch's drafting and
its real-file append can't happen in the same turn budget, prefer writing smaller sub-batches
straight to the real file over holding a fully-drafted large batch in sandbox-only state.

**Final topic id:** `adj-boying-c` (not `adj-comparison-c` — the topic covers more than
comparison, including predikativ agreement and weak/definite plural forms, so a broader name fit
better; see the open question below, now resolved).

## Open questions

- **Batch D topic id/name** — ✅ resolved: `adj-boying-c`, covering irregular -en-stem
  comparison/agreement (gedigen, hoven, skrekkslagen), -ig/-lig superlative -st (døsig, hånlig),
  periphrastic mer/mest for participial adjectives (utkjørt, sønderknust), predikativ
  no-ending (olm, grådig), and weak/definite plural agreement (opprømt).
- **Batch E scope** — ✅ resolved: all 12 items from ch. 17.4 were used (no deferral needed), split
  by blank across 8 existing topics as planned in Phase 2, rather than forced into one topic.
- **Språkhjørnet sections** — intentionally left out of scope (see above); revisit only as a
  follow-up decision, not part of this plan's batches.