# Stage 4 Validation Report — batch 07

Validated `vocab-a2-new.json` (11 entries) and `vocab-b1-new.json`
(3 entries).

## Schema / required fields — pass
Every entry has `norsk`, `lemma`, `english`, `ukrainian`, `spanish`,
`german`, `example`, `example_english`, `example_ukrainian`,
`example_spanish`, `example_german`, `level`, `category`, `part`.
`id` is `""` on all 14, as expected pre-Stage-5.

## Level / category — pass
- A2 file: all 14... wait, all 11 entries `"level": "A2"`, matching filename.
  Categories: `technology` (`fjernkontroll`) and `house-chores` (the
  other 10) — both valid A2 categories, both already used in
  production.
- B1 file: all 3 entries `"level": "B1"`, category `accommodation` —
  valid, matches where `krakk`/`kamin`/`yndlingsstol` already live.

## `part` — pass
All 14 are `"noun"`, correct for these entries.

## `norsk` gender markers — pass
Checked each against the source list's given article:
`fjernkontroll (en)`, `gummihanske (en)`, `vaskemiddel (et)`,
`stikkontakt (en)`, `strykejern (et)`, `strykebrett (et)`,
`feiebrett (et)`, `skurebørste (en)`, `støvkost (en)`, `kost (en)`,
`svamp (en)`, `lenestol (en)`, `salongbord (et)`, `pynt (en)` — all
match the source, including `stikkontakt` keeping "en" after the
Stage 1 spelling normalization.

## `lemma` — pass
All 14 are bare dictionary forms with no gender marker or article.

## `definition` — pass
Correctly absent on all 11 A2 entries, present on all 3 B1 entries
(B1+ convention).

## Diacritics sweep — pass
Checked æ/ø/å, ü/ö/ä/ß, á/é/í/ó/ú/ñ/¿/¡ placement across all
norsk/german/spanish fields and their examples:
- Norwegian: `på`, `vær`, `før`, `søppelet`, `skurebørsten`, `støvet`,
  `støvkost`, `kjøkkengulvet` — all correctly accented.
- German: `Bügeleisen`, `Bügelbrett`, `Scheuerbürste`, `für`, `heiß`,
  `Töpfe`, `Küchenboden`, `spülte`, `Spülmittel`, `während` — all
  correctly accented.
- Spanish: inverted `¿` on both questions, `sillón`, `decoración`,
  `baño`, `acabó`, `ningún`, `todavía`/`está`, `salón`, `Usó`, `Barrió`
  (x2), `Lavó`, `café`/`hablábamos`, `Sacó`/`sótano` — all correctly
  placed.
No missing or misplaced diacritics found.

## Cross-language consistency — pass
Every entry has all five translation fields and all five example
fields populated; no partial/missing language rows.

## Notable content flags carried forward (no action needed here)
- `stikkontakt`: English gloss is "an electrical outlet, a socket" —
  intentionally corrected from the source's "a plug" (Stage 1).
- `kost`: English gloss is "a broom" — intentionally corrected from
  the source's apparent typo "a bloom" (Stage 1). Coexists with an
  unrelated `kost` ("diet") already in production at B1 — confirmed
  intentional in Stage 2.

## Verdict
**Clean.** No schema, diacritic, or consistency issues. Ready for
Stage 5 (ID assignment).
