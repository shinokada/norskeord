# Stage 4 Validation Report — batch 05

Since scripts run on Claude's own sandbox, not the user's machine, the
checks below replicate `check-vocab.ts` logic exactly (same rules, same
field checks) run directly against `vocab-a2-new.json` /
`vocab-b1-new.json` / `vocab-c-new.json` in `draft/new-entries/05/`.

## check-vocab.ts equivalent

**Found 0 errors, 0 warnings.**

All checks pass across the 10 entries (3 A2, 6 B1, 1 C):
- Required fields present on all entries (norsk, english, example,
  example_english, level, category, part).
- `id: ""` on all entries — expected pre-Stage-5.
- `level` field matches each file's level.
- `category` valid for its level: `descriptive-adjectives` ×2, `clothing`
  ×1 (A2); `traditions`, `accommodation`, `reasoning`, `family`,
  `relationships`, `expressing-opinions` (B1, one each); `intensifiers-degree`
  (C).
- `part` values all valid (`adjective` ×6, `noun` ×3, `preposition` ×1,
  `adverb` ×1).
- `norsk` formatting correct per part: gender markers on all nouns
  (`støvlett (en)`, `lapskaus (en)`, `stedatter (en/ei)`), no prefix/gender
  on adjectives, adverb, or preposition.
- `lemma` fields all bare dictionary forms — no gender markers, no
  copy-paste errors.
- Translation/example-language pairs (ukrainian/spanish/german) all
  present together on every entry, none mismatched.
- `definition` present on all B1 and C entries; correctly omitted on the
  3 A2 entries.

### Note

No stray internal review flags carried over into these files (unlike
batch 04's `rull` note) — the sense-ambiguity and register flags from
Stage 1/2 (`å rekke`, `lurt`→`lur`, etc.) either resolved as duplicates
in Stage 2 or were incorporated directly into the `english` gloss
(e.g. `lur`: "clever, smart, sly, cunning"; `ålreit`/`rågod` marked
"(colloquial)"/"(slang)" in `english` itself) rather than left as a
loose `note` field.

## Diacritics check

Manually reviewed every Norwegian, German, and Spanish field
(æøå / üöäß / áéíóúñ¿¡). All present and correctly placed — no mangled
or missing diacritics found, e.g. `berømt`, `støvlett`, `ålreit`,
`møte`, `født` n/a, `høsten`, `Norge`; `berühmt`, `außer`, `für`,
`pünktlich`, `Stieftochter`; `compró`, `botina`, `increíble`,
`hijastra`, `conocerte`. Ukrainian text reviewed for consistency —
no stray apostrophe-character issues found.

No gå/ga mix-ups. One predicate-adjective form worth flagging as
resolved rather than an error: `lur` is deliberately the base
masculine form (not the neuter `lurt` used in the source), per the
correction already made and noted in Stage 1/2.

## Verdict

Clean — no open items. Ready for Stage 5 (assign IDs).
