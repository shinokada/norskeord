# Stage 2 Duplicate Report — batch 07

Checked the 15 surviving Stage 1 entries (`peis`; `fjernkontroll`,
`gummihanske`, `vaskemiddel`, `stikkontakt`, `strykejern`, `strykebrett`,
`feiebrett`, `skurebørste`, `støvkost`, `kost`, `svamp`; `lenestol`,
`salongbord`, `pynt`) against all of production (`vocab-a1` … `vocab-c`)
and, for cross-type, `uttrykk-a1/a2/b1`.

(The 7 items already caught and skipped in Stage 1 — `krakk`, `bilde`,
`pute`, `sofa`, `bøtte`, `sokk`, `støvsuger` — aren't re-litigated here.)

## 1. Exact/normalized matches — 2 found

| Batch entry | Level | Production match | Sense | Resolution |
| --- | --- | --- | --- | --- |
| **`peis` (en)** — a fireplace | A1 | `v-b2-culture-040` — `peis (en)`, "a fireplace" | **Identical.** Same word, same sense, same gender. | **Dropped** per user decision. |
| **`kost` (en)** — a broom | A2 | `v-b1-health-024` — `kost (en)`, "diet, food, fare" | **Homonym**, not a real duplicate — same spelling/gender, unrelated meaning. | **Kept** per user decision — intentional coexistence, not accidental. |

## 2. Cross-type check — clean

No batch lemma appears inside any `uttrykk-a1/a2/b1` expression text. All
14 remaining entries are single concrete nouns; no cross-type collisions.

## 3. Similar/fuzzy pass — clean (only compound-family relations, expected)

Edit-distance-2 and shared-stem matching surfaced a lot of noise on short
words (expected per the pipeline's "false positives are fine" note).
Filtering to the meaningful hits, everything left is an **expected
morphological relation**, not a duplicate concern:

- `lenestol` ~ `stol` (v-a1-home-011, "chair") — lenestol is literally
  built from stol; expected, not a dup.
- `salongbord` ~ `bord` (v-a1-home-010, "table") — same pattern.
- `strykejern` / `strykebrett` ~ `stryke` (v-a2-house-chores-008, "to
  iron") — noun forms of an existing verb; expected.
- `skurebørste` ~ `børste` (v-a2-house-chores-022, "brush") — expected.
- `støvkost` ~ `støv` (v-b1-accommodation-024, "dust") and ~ `kost`
  (the homonym above) — expected.
- `stikkontakt` ~ `kontakt` (v-b1-relationships-014, "contact," different
  sense — social contact, not electrical) — not a dup.
- `pynt` ~ `pynte` (v-b1-traditions-029, verb "to decorate") and ~
  `pynte seg` (v-a2-clothing-026, "to dress up") — same word family
  (noun/verb pair), not a duplicate.
- `fjernkontroll` ~ `fjern`, `kontroll`, `troll` — compound morphemes,
  not duplicates.

## Verdict

**Resolved.** `peis` dropped, `kost` kept as an intentional homonym.
`extracted-vocab-a1.json` is now empty (`[]`) — batch 07 has no A1
entries. 14 entries remain: 11 A2 (`extracted-vocab-a2.json`), 3 B1
(`extracted-vocab-b1.json`). Ready for Stage 3.
