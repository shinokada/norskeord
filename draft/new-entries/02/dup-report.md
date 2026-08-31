# Duplicate Report — batch 02

## 1. Exact lemma matches vs. production (high confidence — skip)

7 of 10 entries are already in production under the same lemma:

| new entry | duplicate of | notes |
| --- | --- | --- |
| å bråke | `v-c-sensory-sound-025` (C) "å bråke" | same sense (to make noise/racket) |
| å hviske | `v-b1-communication-skills-027` (B1) "å hviske" | same sense (to whisper) |
| å bevege seg | `v-b2-advanced-verbs-073` (B2) "å bevege seg" | same sense (to move) |
| å krype | `v-c-manner-of-motion-117` (C) "å krype" | same sense (to crawl) |
| trang | `v-a2-clothing-005` (A2) "trang" | same adjective, same tight/narrow sense |
| stillhet | `v-a2-nature-035` (A2) "stillhet (en)" | same sense (silence) |
| asylmottak | `v-b1-society-090` (B1) "asylmottak (et)" | same sense (asylum reception centre) |

No within-batch duplicates.

## 2. Cross-type check (new vocab vs. production uttrykk)

Exact lemma comparison against all `uttrykk-*.json` files: no hits for any
of the 10 lemmas, including the 3 survivors (fnise, dyne, sakte).

## 3. Similar / fuzzy check (vs. production vocab, informational only)

Run against the 3 survivors only (edit-distance ≤ 2 on `lemma`):

- **fnise** — nese, niese, fisk, nyse, frisk, krise, nisje, frese, ense, flire, gnisse, etc. All unrelated; closest near-miss is `ense`/`gnisse` (different words, no action).
- **dyne** — lyne, kne, dyr, mynt, dame, tone, emne, dele, dyrke, etc. All unrelated (nearest is `lyne` "to lighten," d=1, unrelated meaning).
- **sakte** — slakte, sikte, salt, snakke, kaste, smake, takke, kake, faste, etc. All unrelated (nearest is `slakte`/`sikte`, d=1, unrelated meanings).

No real duplicates or near-duplicates among the survivors.

## Verdict — NOT clean, stopped per Checkpoint 2

Only **3 of 10** entries survive: **fnise** (B1), **dyne** (A2), **sakte** (A2).

`classified.json` and the `extracted-vocab-*.json` files have been updated:
the 7 duplicates are marked `skipped-duplicate` and removed from the
extraction files. `extracted-vocab-b2.json` is now empty (asylmottak was
the only B2 entry and it was a duplicate).

Please confirm before proceeding to Stage 3 (enrich) — in particular check
whether `trang` (tight/narrow) is really the same sense you intended, since
that's the one closest call.
