# Stage 4 Validation Report — batch 04

Since scripts run on Claude's own sandbox, not the user's machine, the
checks below replicate `check-vocab.ts` / diacritics-check logic exactly
(same rules, same field checks) run directly against
`vocab-a1-new.json` / `vocab-a2-new.json` / `vocab-b1-new.json`
in `draft/new-entries/04/`.

## check-vocab.ts equivalent

**Found 0 errors.**

All checks pass across the 6 entries (1 A1, 4 A2, 1 B1):
- Required fields present on all entries (norsk, english, example,
  example_english, level, category, part).
- `id: ""` on all entries — expected pre-Stage-5.
- `level` field matches each file's level.
- `category` valid for its level: `body` (A1); `cooking`, `house-chores`,
  `descriptive-adjectives`, `money` (A2); `accommodation` (B1).
- `part` values all valid (`noun` ×4, `adjective` ×1 [frekk], `noun` ×1 [stolbein]).
- `norsk` formatting correct per part: gender markers on all nouns
  (`kinn (et)`, `kjeks (en)`, `rull (en)`, `pengeseddel (en)`, `stolbein (et)`),
  no prefix/gender on the adjective (`frekk`).
- `lemma` fields all bare dictionary forms — no gender markers, no
  copy-paste errors (`kinn`, `kjeks`, `rull`, `frekk`, `pengeseddel`, `stolbein`).
- Translation/example-language pairs (ukrainian/spanish/german) all
  present together on every entry, none mismatched.
- `definition` present on the B1 entry (`stolbein`), correctly omitted
  for A1/A2 entries (per LEVELS_WITH_DEFINITION = b1/b2/c).

### Note

`rull` carries an extra `note` field: `"sense picked: generic roll of
paper (household item) rather than a bread roll — flag if a different
sense was intended"`. This is a valid `VocabEntry` field per `types.ts`,
so it's not a schema error — but it reads as an internal Stage-3 flag for
review, not a genuine user-facing usage note (the kind `note` is meant
for per `data-rules/vocab-and-uttrykk.md`). Recommend removing it once
the sense is confirmed at checkpoint, rather than merging it to
production as-is.

## Diacritics check

Manually reviewed every Norwegian, German, and Spanish field
(æøå / üöäß / áéíóúñ¿¡). All present and correctly placed — no mangled
or missing diacritics found (e.g. `røde`, `kjøpe`, `tørkepapir`,
`læreren`, `så`, `løst`; `draußen`, `Kälte`, `aß`, `Küchenpapier`;
`tenía`, `después`, `frío`, `comió`, `café`, `así`, `Encontró`).

Ukrainian apostrophe usage checked for consistency (`з'їла` uses the
plain apostrophe throughout) — no modifier-letter apostrophe issue like
the one caught in batch 03.

No known gå/ga mix-ups or adjective agreement issues (no predicate
adjectives in these examples).

## Verdict

Clean except the one open item above (the `rull` note). Ready for Stage 5
(assign IDs) once you confirm the `rull` sense / decide whether to keep
or strip that note.
