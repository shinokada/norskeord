---
title: C grammar I Samme Båt Arbeidsbok
reference: draft/c/i-samme-baat-arbeidsbok
data-started: 2026-08-11
data-completed:
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
| A     | 4.3 + 11.2 (pluskvamperfektum/2. kondisjonalis) | Not started |
| B     | 6.3 + 7.3 (ordfamilie) | Not started |
| C     | 18.3 (sammensatte substantiv) | Not started |
| D     | 5.3 (adjektiv bøying, new C topic) | Not started |
| E     | 17.4 (mixed cloze, stretch) | Not started |

## Open questions

- **Batch D topic id/name** — not finalized; decide during drafting (`adj-comparison-c` vs. a
  broader `adj-c` if bestemt-form items don't cleanly separate from comparison items).
- **Batch E scope** — may end up partially or fully deferred; not committed to a question-count
  target given the per-blank triage overhead.
- **Språkhjørnet sections** — intentionally left out of scope (see above); revisit only as a
  follow-up decision, not part of this plan's batches.