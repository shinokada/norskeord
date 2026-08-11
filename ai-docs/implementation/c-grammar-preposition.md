---
title: C preposition I samme båt
reference: draft/c/i-samme-baat/preposisjonsoppgaver.md
date: 2026-08-03
date-completed: 2026-08-04
---

# Nivå C Preposisjoner — "I samme båt" Implementation Plan

## Overview

Source: `draft/c/i-samme-baat/preposisjonsoppgaver.md` — 20 numbered "Sett inn riktig preposisjon
eller adverb" exercises (~440 individual blanks total), each followed by an "Ordliste" table
glossing 8–15 fixed idioms/collocations used in that exercise's sentences. Answer key is in
`draft/c/i-samme-baat/loesningsforslag.md`, under the "Preposisjonsoppgaver (fra s. 255)" heading
at the end (one line per exercise, dash-separated answers per blank in order).

This is by far the densest single preposition source seen across any level plan so far — roughly
10x the raw material `c-grammar.md` had for `preposisjoner-generelt-c`/`preposisjoner-kroppsdel-uttrykk`
combined, and each exercise's ordliste is essentially a miniature `uttrykk-c.json` candidate list
(idioms like "stakk til meg noen kroner," "tråkke i salaten," "holde hodet over vannet," "gå i
vasken," "ha en finger med i spillet").

**Copyright approach (unchanged from every prior plan):** every question sentence is freshly
written. The textbook's own sentences and its ordliste wording are used only to identify which
preposition/idiom is being tested — never copied or closely paraphrased. This matters more here
than in most sources, since several exercises (18, 19, 20 especially) are built around a single
running narrative (the moskusokse/turist story in ex. 18) rather than isolated sentences — those
get freshly invented, self-contained sentences per idiom instead of adapting the narrative.

**Vocab integration:** every question must contain a real headword from `vocab-c.json` or
`uttrykk-c.json`, verified by the existing `check-c-grammar-vocab.mjs` script (no new script
needed — same lemma-matching logic already handles idiom/phrase lemmas).

**Question types:** existing `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'`
cover everything this source needs — no schema changes required.

---

## Scope decision: reuse existing topics, no new `GrammarTopic` needed

`c-grammar.md` already shipped two C-level preposition topics from a much smaller source
(`draft/c/Norsk-for-deg/grammar`, items 56–63):

| Existing topic                    | Scope                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `preposisjoner-kroppsdel-uttrykk` | Fixed idioms built around a body-part noun + preposition (hår, nakke, hode, munn, øre, hals) |
| `preposisjoner-generelt-c`        | General advanced idiomatic preposition collocations not tied to a body part                  |

This new source tests exactly the same two skills at much higher density — it is not a new
grammar point, just a much larger bank of examples. **Decision: add entries to these two existing
topics rather than create a third.** Splitting by content (body-part idiom vs. general
collocation), not by exercise number — a single exercise in the source mixes both kinds of item.

This mirrors the precedent already set in `b2-c1-grammar.md` (`preposisjoner-uttrykk-b2` was only
created as a _new_ topic because it was a different CEFR level; within one level, more material on
an existing point extends that topic, per `ordfamilie-avledning`/`nyanser-uttrykk`-style reuse).

---

## Mining note: this source is really an `uttrykk-c.json` source first, a grammar source second

Unlike `c-grammar.md`'s original preposition items (which were mostly single collocations), most
blanks here only make sense once you know the surrounding fixed idiom from the ordliste — e.g.
ex. 4 item 10 ("Suksessen gikk henne fullstendig ___ hodet") only works if the learner already
knows "gå til hodet på noen." This means content-writing depends on an idiom-overlap check against
`uttrykk-c.json`/`uttrykk-b2.json` **before** any batch is drafted, same precedent as
`c-uttrykk-addition.md` and `idiomatiske-uttrykk.md`'s treatment in `b2-c1-grammar.md`:

1. Extract every ordliste entry across all 20 exercises (~220–260 raw idiom/collocation
   candidates, before dedup — many recur across exercises, e.g. "gå i vasken" appears in both ex.
   2 and ex. 9).
2. Fuzzy-match against `uttrykk-c.json` and `uttrykk-b2.json` (idioms already covered elsewhere,
   e.g. "komme noen i forkjøpet," "ta bladet fra munnen," "legge alle kortene på bordet" are
   plausible pre-existing entries given prior passes' coverage — needs the actual script run, not
   assumed).
3. Net-new idioms get added to `uttrykk-c.json` first (same schema/process as prior additions:
   norsk/lemma/english/spanish/ukrainian/german, monolingual `definition`, `example`/`example_*`,
   `level: 'C'`, `part: 'phrase'`, matching `category`/`theme`), **before** grammar questions
   referencing them are written — otherwise `check-c-grammar-vocab.mjs` will flag them.
4. Idioms that turn out to be _body-part_ idioms (nakke, hode, munn, hår, hjerte, øre, øye, bein,
   albue, negl, etc.) route to `preposisjoner-kroppsdel-uttrykk`; everything else routes to
   `preposisjoner-generelt-c`.

This mining pass is a prerequisite for Phase 2, not a nice-to-have — most of this source's value
is unusable without it.

---

## Content plan (`src/lib/data/grammar.json`)

Given the volume (~440 raw blanks across 20 exercises), building all of it in one pass isn't
realistic or even desirable — most exercises repeat similar collocation types (vente på, glede
seg til, komme til uttrykk, stå til ansvar for, etc.) many times over, so exhaustive coverage of
every blank would produce far more near-duplicate questions than the topic needs. Recommended
approach, same discipline as `c-grammar.md`'s "mining note" for items 64–82:

- Work through the 20 exercises in batches of ~4–5 at a time, picking the **best, most distinct**
  examples from each batch rather than every blank — aim for roughly 3–5 fresh questions per
  exercise (not 15–20), split across the two existing topics by content type.
- Continue existing question-id numbering (`gq-prep-kropp-XXX` / `gq-prep-c-XXX` or whatever
  prefix the two topics already use in `grammar.json` — confirm current max id before the first
  batch).
- Target roughly **60–90 new questions total** across the two topics (comfortably supported by
  the source, without needing every blank) — reassess after the mining pass confirms how many
  idioms are actually net-new vs. already covered.
- Type mix: mostly `fill` (matches the source format directly) with some `transform` (rephrase a
  sentence to use the idiom) and `minimal-pair` (contrast two near-identical prepositions with
  different idiomatic meaning, e.g. "gå i vasken" vs. "gå i boks").

---

## Implementation phases

### Phase 0 — Idiom/collocation mining (prerequisite)

Steps, run per batch (batch = one group of ~4-5 exercises from Phase 2's batch list):

1. Extract and dedup all ordliste entries for the batch's exercises.
2. Run the fuzzy-match check against `uttrykk-c.json`/`uttrykk-b2.json`.
3. Draft and merge net-new idiom entries into `uttrykk-c.json` (same process as
   `c-uttrykk-addition.md`).
4. Sort the surviving idiom list (net-new + already-covered) into body-part vs. general, to drive
   which topic each future question lands in.

**Workflow note (resolved):** this session runs in the web/mobile chat interface, not Claude Code, so
Claude cannot execute the repo's check/dedup scripts directly here. Division of labor: Claude extracts
ordliste candidates and drafts a checklist file (`c-grammar-preposition-mining-batchN.md`, same folder);
the user runs `dedup-cross-file.mjs`/`check-uttrykk.mjs` (or equivalent) locally against that list between
sessions and reports back which entries are NEW vs EXISTING; Claude then drafts and merges the net-new
`uttrykk-c.json` entries. If a future session has Claude Code / terminal access instead, skip the
checklist handoff and run the script directly.

**Update (batch 4 session):** this session had the `Filesystem` MCP connector enabled, giving Claude
direct read/write access to the user's local repo (not just Claude's own sandbox). This meant the
fuzzy-match step could be done directly — Claude copied `uttrykk-c.json`/`uttrykk-b2.json` into its own
sandbox, ran a Python keyword-overlap script against them, and manually reviewed the near-matches for
true duplicates vs. distinct-enough idioms — without needing the checklist handoff to the user. Net-new
entries were then written back to the real file via a sequence of `edit_file` anchored appends (in
~10-entry chunks, copying exact text from `view` output rather than retyping, after one retyping typo
was caught and fixed early on). This is faster than the handoff process above when `Filesystem` access is
available; the handoff process remains the fallback when it isn't.

**Progress log** (update after finishing each step below — this is the resume point if a session
ends mid-batch; check this table first before re-deriving state from file diffs):

| Batch | Exercises | Step 1 extract                                         | Step 2 fuzzy-match                                                                                                                                                                                                                               | Step 3 add to uttrykk-c.json                                                                                                                                                                                                                         | Step 4 sort         | Phase 2 questions written                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | --------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 1–5       | done                                                   | done — 8 pre-existing + 19 confirmed already in `uttrykk-c.json`/`uttrykk-b2.json` (grepped by user); 32 net-new added                                                                                                                           | done — `u-c-634`–`641` + `u-c-642`–`673` (40 total); 2 are body-part (`u-c-668` munnen, `u-c-665` hodet) → `preposisjoner-kroppsdel-uttrykk`, rest → `preposisjoner-generelt-c`                                                                      | done (see above)    | done — 18 questions: `gq-prep-kropp-011`–`017` (7) + `gq-prep-c-011`–`021` (11)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2     | 6–10      | done                                                   | done — 53 net-new added, 7 pre-existing/already-covered                                                                                                                                                                                          | done — `u-c-674`–`728` (55 total: 3 body-part, 52 general); body-part = `u-c-694` (armene i kors), `u-c-699` (finger med i spillet), `u-c-707` (fot i hose) → `preposisjoner-kroppsdel-uttrykk`; rest → `preposisjoner-generelt-c`                   | done                | done — 24 questions: `gq-prep-kropp-018`–`020` (3) + `gq-prep-c-022`–`042` (21)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3     | 11–15     | ✅ Done                                                | ✅ Done — 8 pre-existing/duplicates found (`det bærer galt av sted`, `bite i det sure eplet`, `bite seg merke i`, `det spørs`, `holde en knapp på`, `gjøre opp for seg`, `være ute av seg`, `sno noen rundt lillefingeren` near-dup); 46 net-new | ✅ Done — `u-c-729`–`774` (46 total: 2 body-part — `u-c-749` (vrangstrupen), `u-c-760` (hendene) → `preposisjoner-kroppsdel-uttrykk`; rest 44 → `preposisjoner-generelt-c`)                                                                          | ✅ Done             | ✅ Done — 20 questions: `gq-prep-kropp-021`–`022` (2) + `gq-prep-c-043`–`060` (18); both `check-c-grammar-vocab.mjs` and `check-grammar-norwegian.mjs` clean (0 unmatched/flagged)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4     | 16–20     | ✅ Done — see `c-grammar-preposition-mining-batch4.md` | ✅ Done — fuzzy-matched directly against `uttrykk-c.json`/`uttrykk-b2.json` this session (script access via Filesystem, no handoff needed); 8 pre-existing exact matches + 6 near-duplicates skipped (see mining doc), 67 net-new                | ✅ Done — `u-c-775`–`847` (73 total: 6 body-part — `u-c-842` (nesen), `u-c-843` (foten), `u-c-844` (fingeren), `u-c-845` (beinet), `u-c-846` (ryggen), `u-c-847` (øynene) → `preposisjoner-kroppsdel-uttrykk`; rest 67 → `preposisjoner-generelt-c`) | ✅ Done (see above) | ✅ Done — 20 questions: `gq-prep-kropp-023`–`028` (6, all 6 body-part idioms `u-c-842`–`847`) + `gq-prep-c-061`–`074` (14, drawn from the general net-new pool `u-c-775`–`841`); type mix 15 fill / 3 transform / 1 order / 1 minimal-pair; applied directly to `grammar.json` via `Filesystem` edit, validated (1976 total questions, 0 duplicate ids, all 20 ids present); Phase 3 verified — user ran `check-c-grammar-vocab.mjs` and `check-grammar-norwegian.mjs` locally, both topics clean (`preposisjoner-generelt-c`: 74 q/0 unmatched/0 flagged; `preposisjoner-kroppsdel-uttrykk`: 28 q/0 unmatched/0 flagged); the 42 unmatched entries in the vocab-check run are pre-existing and unrelated (`ordfamilie-avledning`, `sammensatte-substantiv`), not from this batch — **batch 4 fully complete** |

### Phase 1 — Rules + types

None needed — both target topics (`preposisjoner-kroppsdel-uttrykk`, `preposisjoner-generelt-c`)
already exist with rule text that covers this material without changes.

### Phase 2 — Content, built in batches of ~4–5 exercises

1. Exercises 1–5
2. Exercises 6–10
3. Exercises 11–15
4. Exercises 16–20 (note: 18–20 lean on the moskusokse narrative and a few essay-like passages —
   mine individual collocations, don't adapt the narrative, per the copyright approach above)

Each batch: draft fresh sentences per selected idiom → check against the Phase 0 idiom list →
write into whichever of the two topics fits → run `check-c-grammar-vocab.mjs` and
`check-grammar-norwegian.mjs` before moving to the next batch (same per-topic verification
discipline as `c-grammar.md` and `b2-grammar.md`).

### Phase 3 — Vocab + Norwegian-only verification

Run `check-c-grammar-vocab.mjs` and `check-grammar-norwegian.mjs` after each batch, not just at
the end.

### Phase 4 — Gating

None needed — both topics are already Plus-gated as part of nivå C's existing all-Plus policy.

---

## Open questions (resolved)

- **Current question counts/max ids — checked directly against `grammar.json`.**
  `preposisjoner-kroppsdel-uttrykk` has 10 questions (`gq-prep-kropp-001`–`010`);
  `preposisjoner-generelt-c` has 10 questions (`gq-prep-c-001`–`010`). Both topics are thin, so the
  first Phase 2 batch continues at `gq-prep-kropp-011` / `gq-prep-c-011`. Room is not a constraint
  — lean toward the higher end (~90) of the total-question estimate rather than the lower end.
- **Mining approach: interleave per batch, not one upfront pass.** Resolved in favor of scoping
  the idiom-overlap check to each batch of ~4–5 exercises (mine 1–5's ordliste → add net-new
  idioms → write those questions → verify → move to 6–10, etc.), rather than triaging all
  ~220–260 candidates upfront. Reasoning: an all-upfront pass is a large, error-prone batch to
  review correctly in one sitting, and several candidates only reveal themselves as unusable
  (essay-tied, duplicate across exercises, too obscure) once sentences are actually being drafted.
  This also matches how every prior plan (`c-uttrykk-addition.md`, the kap. 6f dedup pass in
  `b2-c1-grammar.md`) scoped its idiom-vocab-addition step to one source chunk at a time rather
  than a single giant sweep.
