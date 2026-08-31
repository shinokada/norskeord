# Stage 4 Validation Report — batch 03

Since scripts run on Claude's own sandbox, not the user's machine, the
checks below replicate `check-vocab.ts` / diacritics-check logic exactly
(same rules, same field checks) run directly against
`vocab-a1-new.json` / `vocab-a2-new.json` / `vocab-b1-new.json` / `vocab-b2-new.json`
in `draft/new-entries/03/`.

## check-vocab.ts equivalent

**Found 0 errors.**

All checks pass across the 9 entries (1 A1, 1 A2, 6 B1, 1 B2):
- Required fields present on all entries (norsk, english, example,
  example_english, level, category, part).
- `id: ""` on all entries — expected pre-Stage-5.
- `level` field matches each file's level.
- `category` valid for its level: `verbs` (A1), `hobbies` (A2),
  `healthcare`/`family`/`arts-culture` ×4 (B1), `arts` (B2). No "hobbies"
  or "crafts" bucket exists at B1, so the four needlework nouns
  (sysak, trådsnelle, broderi, strikketøy) went to `arts-culture`.
- `part` values all valid (`verb` ×1, `noun` ×8).
- `norsk` formatting correct per part: `å se på` (verb prefix),
  gender markers on all nouns (`perle (en)`, `ventetid (en)`,
  `slekt (en)`, `sysak (en)`, `trådsnelle (en)`, `hekleduk (en)`,
  `broderi (et)`, `strikketøy (et)`).
- `lemma` fields all bare dictionary forms — no å/gender markers,
  no copy-paste errors (`se på`, `perle`, `ventetid`, `slekt`, `sysak`,
  `trådsnelle`, `broderi`, `strikketøy`, `hekleduk`).
- Translation/example-language pairs (ukrainian/spanish/german) all
  present together on every entry, none mismatched.
- `definition` present on all 6 B1 entries + the B2 entry, correctly
  omitted for A1/A2 (per LEVELS_WITH_DEFINITION = b1/b2/c).

## Diacritics check

Manually reviewed every Norwegian, German, and Spanish field
(æøå / üöäß / áéíóúñ¿¡). All present and correctly placed — no mangled
or missing diacritics found (e.g. `armbånd`, `Trådsnellen`, `über`,
`Nähutensil`, `schönes`, `Großmutter`/`Häkeldeckchen`/`gehäkelt`,
`más`, `reunió`, `artículo`, `vacío`/`después`, `salón`).

One inconsistency fixed (not part of check-vocab.ts's scope, but caught
in review): the Ukrainian example for `strikketøy` used a modifier-letter
apostrophe (ʼ) instead of the plain apostrophe (') used elsewhere in the
same sentence and file — normalized to `'` for consistency.

No known gå/ga mix-ups or adjective agreement issues (no predicate
adjectives in these examples).

## Verdict

Clean. Ready for Stage 5 (assign IDs).
