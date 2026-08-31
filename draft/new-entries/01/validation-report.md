# Stage 4 Validation Report — batch 01

Since scripts run on Claude's own sandbox, not the user's machine, the
checks below replicate `check-vocab.ts` / diacritics-check logic exactly
(same rules, same field checks) run directly against
`vocab-a1-new.json` / `vocab-a2-new.json`.

## check-vocab.ts equivalent

**Found 1 error, fixed:**
- `grønt` (A2): category `"food"` is not in `CATEGORIES_BY_LEVEL.A2` (food
  only exists at A1). Changed to `"cooking"`, which is valid at A2 and fits
  the greens/vegetables sense.

All other checks pass:
- Required fields present on all 6 entries.
- `id: ""` on all entries — expected pre-Stage-5.
- `level` field matches file level on all entries.
- `part` values all valid (`noun` x5, `pronoun` x1).
- `norsk` formatting correct per part: gender markers on regular nouns
  (`veske (en)`, `trapp (en)`, `halspastill (en)`), `(pl.)` on the plural
  card (`skrivesaker (pl.)`), `(ubøy.)` on the indeclinable noun
  (`grønt (ubøy.)`), no marker on the pronoun (`alt`).
- `lemma` fields are all bare dictionary forms, no gender/plural/ubøy.
  markers — no copy-paste errors.
- Translation/example-language pairs (ukrainian/spanish/german) all present
  together, none mismatched.

## Diacritics check

Manually reviewed every Norwegian, German, and Spanish field (æøå / üöäß /
áéíóúñ¿¡). All present and correctly placed — no mangled or missing
diacritics found.

## Verdict

Clean after the one category fix. Ready for Stage 5 (assign IDs).
