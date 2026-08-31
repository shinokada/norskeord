# Duplicate Report — batch 04

## 1. Exact / normalized duplicates (vs production)

Already caught during Stage 1 classification — see `classified.json`:

- **å skrape** → duplicate of `v-c-manner-of-motion-023`. Skipped.
- **å nikke** → duplicate of `v-b2-communication-043`. Skipped.
- **en tømrer** → duplicate of `v-a2-occupations-071`. Skipped.
- **å glo** → duplicate of `v-c-interpersonal-conflict-092`. Skipped.

No further exact/normalized matches among the 6 remaining entries, and no
duplicates within the batch itself.

## 2. Cross-type check (new vocab vs production uttrykk)

| new lemma | uttrykk hits | verdict |
| --- | --- | --- |
| rull | `u-b2-337` å ha rulleblad | **Not a real cross-type duplicate.** Substring match only — "rulleblad" (criminal record) is an unrelated compound, not the standalone noun "rull". No action needed. |
| kinn | `u-c-026/058/338/398/506/883` (all contain "skinn") | **False positive.** These all match on "skinn" (shine/hide), which happens to contain the substring "kinn" — unrelated word. No action needed. |

kjeks, stolbein, pengeseddel, frekk — no hits in uttrykk files.

## 3. Similar / fuzzy check (vs production vocab, informational only)

All matches below are orthographically similar but semantically unrelated —
expected noise, no action needed, except where called out:

- **kjeks** — kjekk (nice/handsome — close false-friend spelling, not a duplicate), skjenke, skje, seks, kjendis, kontekst, kompleks
- **kinn** — skinn, skinne, kvinne, kino, inne, vinne, solskinn, skrin (all unrelated)
- **stolbein** — stein, streben, storslagen, tolerant, stolthet, stole på, and its own two component words **stol** (`v-a1-...` a chair) and **bein** (`v-a1-body-...` a leg) — expected, since the compound is built from exactly those two existing entries, not a duplicate
- **rull** — tull, null, kull, hull, full, grufull, utall, and **å rulle** (`v-b2-abstract-nouns-041`, to roll) — same word family, verb vs. noun, expected relationship (like skrivesak/å skrive in batch 01), not a duplicate
- **pengeseddel** — lengsel, legemiddel, hengsel, fengsel, enestående, påtrengende, trengsel, stengsel (all unrelated, phonetic noise only)
- **frekk** — trekk, rekke, **frakk** (a coat — close false-friend spelling, not a duplicate), trekke, sprekk, brekke, sprekke, sekk

## Verdict

All 6 remaining entries clear. Proceed to Stage 3 (enrich).
