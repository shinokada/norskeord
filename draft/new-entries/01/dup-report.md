# Duplicate Report — batch 01

## 1. Exact / normalized duplicates (vs production)

Already caught during Stage 1 classification — see `classified.json`:

- **å gjespe** → duplicate of `v-a2-body-023`. Skipped.
- **et skritt** → duplicate of `v-b1-fitness-041`. Skipped.
- **å smelle** → same lemma as `v-c-embodied-emotion-049`. Skipped.

No further exact/normalized matches among the 6 remaining entries, and no
duplicates within the batch itself.

## 2. Cross-type check (new vocab vs production uttrykk)

| new lemma | uttrykk hits | verdict |
| --- | --- | --- |
| alt | `u-b2-002` alt mellom himmel og jord, `u-b2-066` fremfor alt, `u-b2-244` tross alt, `u-b2-656` alt i alt, `u-c-034/040/379/736/878/907` (proverbs/idioms containing "alt") | **Not a real cross-type duplicate.** These are fixed multi-word expressions where "alt" is one component word, not the whole lexical unit. The standalone pronoun `alt` ("everything") is a distinct entry. No action needed. |

veske, skrivesak, trapp, halspastill, grønt — no hits in uttrykk files.

## 3. Similar / fuzzy check (vs production vocab, informational only)

All matches below are orthographically similar but semantically unrelated —
expected noise, no action needed:

- **veske** — vesen, verke, vekke, vaske, elske, øvelse (all unrelated)
- **alt** — salt, at, salat, kaldt, valuta, totalt (all unrelated)
- **skrivesak** — skrive, skive, beskrive, trives, skrive ut, skrike (shares root "skriv-" with `å skrive`, but distinct entry — a compound built on it, not a duplicate)
- **trapp** — tapp, tap, app, trippe, ta opp, opptrappe/trappe opp/opptrapping (shares root "trapp-" with the escalate-sense verbs, but those are a different lexical family — not duplicates)
- **halspastill** — spesiell, livsstil, lastebil, halvpart, spill, hals (shares "hals" with `v-a1-body-007 hals (en)`, expected — compound, not duplicate)
- **grønt** — grøt, **grønn** (v-a1-colors-004, closest real relation — same root, different lemma/sense per Q&A), røst, røntgen, grøtete, grøntareal

## Verdict

All 6 remaining entries clear. Proceed to Stage 3 (enrich).
