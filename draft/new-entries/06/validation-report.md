# Stage 4 Validation Report — batch 06

Since scripts run on Claude's own sandbox, not the user's machine, the
checks below replicate `check-vocab.ts` logic exactly (same rules, same
field checks) run directly against `vocab-a1-new.json` /
`vocab-a2-new.json` in `draft/new-entries/06/`.

## check-vocab.ts equivalent

**Found 0 errors, 0 warnings.**

All checks pass across the 10 entries (6 A1, 4 A2):
- Required fields present on all entries (norsk, english, example,
  example_english, level, category, part).
- `id: ""` on all entries — expected pre-Stage-5.
- `level` field matches each file's level.
- `category` valid for its level: `household-items` ×4, `home` ×1,
  `food` ×1 (A1); `house-chores` ×4 (A2) — all confirmed present in
  `CATEGORIES_BY_LEVEL`.
- `part` values all valid (`noun` ×10).
- `norsk` formatting correct: gender markers present and match the
  source list's given gender on every noun (`skuff (en)`, `fruktskål
  (en)`, `tekanne (en)`, `skål (en)`, `spisebord (et)`, `spagetti (en)`,
  `brødrister (en)`, `kjøkkenmaskin (en)`, `vannkoker (en)`,
  `kaffemaskin (en)`).
- `lemma` fields all bare dictionary forms — no gender markers, no
  copy-paste errors.
- Translation/example-language pairs (ukrainian/spanish/german) all
  present together on every entry, none mismatched.
- `definition` correctly omitted on all 10 entries (A1/A2 only —
  definition is a B1+ convention).

### Note

The `vannkoker`/`kanne` conceptual-overlap flag from Stage 2 was
reviewed and resolved — user confirmed keeping `vannkoker` as its own
card. No other open review items carried into these files.

## Diacritics check

Manually reviewed every Norwegian, German, and Spanish field
(æøå / üöäß / áéíóúñ¿¡). All present and correctly placed:

- Norwegian: `nøklene`, `fruktskålen`, `kjøttboller`, `brødskivene`,
  `brødristeren`, `kjøkkenmaskinen`, `kjøpte`, `kjøkkenet` — all ø/å
  correctly placed, no gå/ga mix-ups.
- German: `Schlüssel`, `Äpfel`, `heißes`, `aß`/`aßen`/`saß`, `Müsli`,
  `Schüssel`, `röstete`, `Küchenmaschine`, `für`, `Küche` — all
  ü/ä/ö/ß correctly placed. `Spaghetti` (with h) is the correct German
  borrowing, distinct from Norwegian's `spagetti` — not a diacritic
  error.
- Spanish: `cajón`, `plátanos`, `vertió`, `comió`, `sentó`, `cenó`,
  `tostó`, `Usó`, `eléctrico`, `encendió`, `té` — all accents correctly
  placed on the stressed syllable per Spanish stress rules (including
  `té` correctly accented to distinguish "tea" from the pronoun `te`).
- Ukrainian text reviewed for consistency (їв/ї, і vs и usage,
  сиділа/обіднім, etc.) — no stray apostrophe-character or letter
  substitution issues found.

## Verdict

Clean — no open items. Ready for Stage 5 (assign IDs).
