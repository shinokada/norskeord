# Duplicate Report — batch 05

## 1. Exact / normalized duplicates (vs production)

9 of the 19 batch entries already exist in production. All skipped —
see `classified.json` for each one's note.

- **sånn** → `v-a2-descriptive-adjectives-074`
- **forferdelig** → `v-b2-emotions-009` (existing entry is at B2, source
  had it at A2 — same word, no second card needed)
- **å snufse** → `v-b1-health-063`
- **å hyle** → `v-c-sensory-sound-021`
- **å tilgi** → `v-b1-relationships-055`
- **å rekke** → `v-c-everyday-objects-066` (this also resolves the
  ambiguous-sense flag from Stage 1 — the existing card already commits
  to a specific sense)
- **matt** → `v-c-physical-appearance-046`
- **å deise** → `v-c-embodied-emotion-074`
- **annerledes** → `v-b1-expressing-opinions-002` (moved A2→B1 on
  Stage-1 review, then turned out to already exist at B1)

No duplicates within the batch itself.

**10 entries clear this check:** berømt, støvlett, ålreit, lapskaus,
innvendig, unntatt, stedatter, lur, rågod, meget.

## 2. Cross-type check (new vocab vs production uttrykk)

Checked all 19 original lemmas (exact lemma match + substring match)
against every uttrykk-*.json file.

| new lemma | uttrykk hits | verdict |
| --- | --- | --- |
| sånn | `u-a1-013` ("...Sånn passe."), `u-a2-234` ("sånn passe") | Substring/component match only — "sånn" appears inside the fixed formula "sånn passe" (so-so). Not a duplicate of the standalone word (which is itself already a vocab dup, see §1). No action. |
| rekke | `u-b1-297` (å rekke opp hånda), `u-b2-056` (en rekke) | Expected relationship — "rekke" is the productive verb head inside an uttrykk formula and inside a separate noun idiom "en rekke" (a number/series). Not a duplicate; the vocab card itself is already a dup anyway (see §1). No action. |

No other lemma (including the 10 that clear §1) had any exact or
substring hit in the uttrykk files.

## 3. Similar / fuzzy check (vs production vocab, informational only — 10 surviving entries)

All matches below are orthographically similar but semantically
unrelated or expected word-family relationships — no action needed:

- **berømt** — uberørt, berøre, **berømme** (to praise — same word
  family: berømme→berømt, expected), berøvet
- **ålreit** — greit (similar meaning "fine/OK", different word,
  expected near-synonym, not a duplicate)
- **innvendig** — innvending (an objection — different word, false
  friend spelling), innstendig (urgent/insistent — unrelated)
- **unntatt** — innsatt (unrelated), unnlate (to refrain — same word
  family), **unntak** (an exception — same word family, unntatt is
  derived from it, expected)
- **lur** — **lure** (to trick/deceive — same root, different word),
  lår (thigh), lær (leather), lun (cozy) — all unrelated
- **rågod** — råd (advice), **god** (good — the word rågod is built
  from, expected component relationship, like stolbein/stol+bein in
  batch 04), rigid (unrelated)
- **meget** — regel, mene, beger, megler, meg, lege — all phonetic
  noise, no semantic overlap
- **lapskaus**, **støvlett**, **stedatter** — no fuzzy hits within
  edit-distance 2 in production

## Verdict

9 entries skipped as exact duplicates. 10 entries clear — proceed to
Stage 3 (enrich) for: berømt, støvlett, ålreit, lapskaus, innvendig,
unntatt, stedatter, lur, rågod, meget.
