# Duplicate Report — batch 03

## 1. Exact lemma matches vs. production (high confidence — skip)

2 of 11 entries are already in production under the same lemma:

| new entry | duplicate of | notes |
| --- | --- | --- |
| å vise | `v-b1-communication-skills-055` (B1) "å vise" | same sense (to show) — confirmed the recollection flagged in Stage 1 |
| fang (et) | `v-a2-body-021` (A2) "fang (et)" | same sense (lap), same level, same category (body) |

No within-batch duplicates.

## 2. Cross-type check (new vocab vs. production uttrykk)

Exact lemma comparison against all `uttrykk-*.json` files: no hits for any
of the 11 lemmas.

## 3. Similar / fuzzy check (vs. production vocab, informational only)

Run against the 9 survivors (edit-distance ≤ 2 on `lemma`):

- **ventetid** — only near-miss is `sendetid` (airtime/broadcast time) — unrelated, no action.
- **slekt** — no meaningful near-misses (seks, lett, leke, blek, etc. — all unrelated).
- **sysak** — `årsak` closest (cause/reason) — unrelated, no action.
- **perle** — `eple`, `pære` closest — unrelated (different objects), no action.
- **trådsnelle** — no near-misses at all.
- **se på** — `å se ut` (to look/appear) and `å slå på` (to turn on) are the closest, but distinct meanings and distinct particle verbs — not duplicates. Confirms **se på is genuinely new** despite being a basic phrase — worth a second look at why it wasn't already in the deck.
- **broderi** — no near-misses at all.
- **strikketøy** — `strikket` (knitted, adjective) is the same word family but a different part of speech/lexical item — not a duplicate.
- **hekleduk** — no near-misses at all.

No real duplicates or near-duplicates among the survivors.

## Verdict — NOT clean, stopped per Checkpoint 2

**9 of 11** entries survive: ventetid (B1), slekt (B1), sysak (B1), perle
(A2), trådsnelle (B1), se på (A1), broderi (B1), strikketøy (B1), hekleduk
(B2).

`classified.json` and the `extracted-vocab-*.json` files have been updated:
`å vise` and `fang (et)` are marked `skipped-duplicate` and removed from
extraction. `extracted-vocab-a2.json` now contains only `perle`.

Please confirm before proceeding to Stage 3 (enrich).
