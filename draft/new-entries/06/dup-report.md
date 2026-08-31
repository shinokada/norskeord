# Duplicate Report — batch 06

## 1. Exact / normalized duplicates (vs production, all levels)

10 of the 20 batch entries already exist in production. All skipped —
see `classified.json` for each one's note.

- **oppvaskmaskin** → A2 house-chores (dishwasher)
- **duk** → A2 house-chores (tablecloth)
- **pepper** → A2 cooking (pepper)
- **kjele** → A2 cooking (a kettle / a saucepan)
- **søppelbøtte** → A1 household-items (a trash can)
- **kanne** → A1 household-items (a kettle / jug — combined-sense card
  already covers the "jug" sense)
- **skje** → A1 household-items (a spoon)
- **salt** → A1 food (salt)
- **tøffel** → B1 accommodation (slipper) — this and the next entry
  were missed in Stage 1's spot-check (which only sampled A1/A2) and
  only surfaced once Stage 2 ran the full exact-match pass across all
  five levels
- **frokostblanding** → B2 culture (a breakfast cereal)

No duplicates within the batch itself.

**10 entries clear this check:** skuff, fruktskål, tekanne, skål,
spisebord, spagetti, brødrister, kjøkkenmaskin, vannkoker, kaffemaskin.

## 2. Cross-type check (new vocab vs production uttrykk)

Checked all 10 surviving lemmas (exact lemma match + substring match)
against every uttrykk-*.json file.

| new lemma | uttrykk hits | verdict |
| --- | --- | --- |
| skuff | `u-b1-009` ("bli skuffet") | Substring only — "skuffet" is the past participle of the unrelated verb "å skuffe" (to disappoint), not the noun "skuff" (a drawer). Not a duplicate. No action. |
| skål | `u-c-116` ("å legge sitt liv på vektskålen") | Expected component relationship — "skål" is the second element of the compound "vektskål" (weighing pan/scale) inside this fixed idiom. Not a duplicate. No action. |

No other lemma had any exact or substring hit in the uttrykk files.

## 3. Similar / fuzzy check (vs production vocab, informational only — 10 surviving entries)

All matches below are orthographically similar but semantically
unrelated or expected word-family/component relationships — no action
needed:

- **skuff** — skur, skift, skule, stoff, skue, skure, skulk (all
  unrelated), skuffet (same root, different word — see §2)
- **tekanne** — **kanne** (component relationship: te+kanne, expected,
  same pattern as batch 04's stolbein/stol+bein), tenne (to light —
  unrelated)
- **skål** — large set of short orthographic neighbors (skåne, skje,
  skald, stol, sko, mål, bål, etc.) — all phonetic noise typical for a
  short word, no semantic overlap
- **fruktskål**, **spisebord**, **spagetti**, **brødrister**,
  **kjøkkenmaskin**, **vannkoker**, **kaffemaskin** — no fuzzy hits
  within edit-distance 2 in production

### Flagged for manual judgment (not a fuzzy-match hit, carried over from Stage 1)

**vannkoker** (A2, "kettle") — production's A1 `kanne (en)` is already
glossed as "a kettle / jug," a combined-sense card. This wasn't caught
by lemma-level exact or fuzzy matching (different words entirely) but
is a genuine conceptual overlap worth a call: keep `vannkoker` as a
separate, more specific appliance card (distinct from `kanne`'s
non-electric jug/pot sense), or drop it and let `kanne` continue to
cover "kettle" loosely. Proceeding with `vannkoker` as its own card for
now — flag if you'd rather merge/drop it.

## Verdict

10 entries skipped as exact duplicates (2 more found in Stage 2 than
Stage 1's spot-check caught). 10 entries clear — proceed to Stage 3
(enrich) for: skuff, fruktskål, tekanne, skål, spisebord, spagetti,
brødrister, kjøkkenmaskin, vannkoker, kaffemaskin.
