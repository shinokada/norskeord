# Vocab vs Uttrykk

## vocab-xx.json entry rules

### `norsk` field

The display form shown to learners.

| `part`                | Format                                            | Example                         |
| --------------------- | ------------------------------------------------- | ------------------------------- |
| `noun`                | dictionary form + gender in parentheses           | `hus (et)`                      |
| `noun` (plural card)  | plural form + `(pl.)` or `(b.pl.)` in parentheses | `bøker (pl.)`, `bøkene (b.pl.)` |
| `noun` (indeclinable) | dictionary form + `(ubøy.)` in parentheses        | `fjor (ubøy.)`                  |
| `verb`                | infinitive with `å`                               | `å få`                          |
| `adjective`           | base (masculine singular) form                    | `glad`                          |
| `adverb`              | uninflected form                                  | `i dag`                         |
| `conjunction`         | uninflected form                                  | `fordi`                         |
| `preposition`         | uninflected form                                  | `ved siden av`                  |
| `pronoun`             | base form                                         | `jeg`                           |
| `numeral`             | base form                                         | `én`                            |
| `interjection`        | base form                                         | `hei`                           |
| `phrase`              | the fixed multi-word form                         | `biologisk mangfold`            |

### `lemma` field

Always the plain dictionary form — no gender markers, no `å` prefix, no inflection. Used for FSRS lookup and deduplication.

| `part`                                                                            | Format                      | Example              |
| --------------------------------------------------------------------------------- | --------------------------- | -------------------- |
| `noun`                                                                            | bare noun, no gender        | `hus`                |
| `verb`                                                                            | infinitive without `å`      | `få`                 |
| `adjective`                                                                       | base form (same as `norsk`) | `glad`               |
| `adverb` / `conjunction` / `preposition` / `pronoun` / `numeral` / `interjection` | same as `norsk`             | `fordi`              |
| `phrase`                                                                          | same as `norsk`             | `biologisk mangfold` |

### Plural-form noun cards

Irregular or otherwise learning-worthy plurals (`bok` → `bøker`, `barn` → `barn`, `mann` → `menn`) can get their own `noun` vocab card in addition to the singular dictionary-form card. This is optional — only add a plural card when the plural is irregular enough to be worth drilling separately.

- `norsk` — the plural form + a plural marker in parentheses, in place of the gender marker:
  - `(pl.)` — ubestemt flertall, e.g. `bøker (pl.)`
  - `(b.pl.)` — bestemt flertall, e.g. `bøkene (b.pl.)`
- `lemma` — always the bare **singular** dictionary form, same as the base noun's lemma (e.g. `bok`, not `bøker`). This keeps FSRS lookup/dedup anchored to the base word even though the card teaches the plural.
- `id` / `category` / `level` — assigned normally like any other noun entry.

Why not `(u.pl.)`: ubestemt flertall is the unmarked/default plural, so bare `(pl.)` matches standard Norwegian dictionary shorthand (Bokmålsordboka etc. use `pl.` and `best. pl.`). Only bestemt flertall needs an explicit flag.

### Indeclinable noun cards

A small number of Norwegian nouns are genuinely `ubøyelig` (indeclinable) — no gender article, no plural, no bestemt form. `fjor` is the classic example (only ever appears as `i fjor`, `i forfjor`); dictionaries like NAOB and Bokmålsordboka label these explicitly rather than assigning them a gender.

For these, use `(ubøy.)` in place of the gender marker:

```
"norsk": "fjor (ubøy.)",
"lemma": "fjor",
"part": "noun"
```

Don't reach for this marker just because a noun happens to only show up in one fixed phrase in your example sentence — check a dictionary (NAOB/Bokmålsordboka) first and only use `(ubøy.)` when it's actually listed as `ubøyelig`. If the word is more of a fixed multi-word chunk than a single indeclinable noun, it may belong in `uttrykk` instead (see below).

### `part` values

`noun` · `verb` · `adjective` · `adverb` · `conjunction` · `preposition` · `pronoun` · `numeral` · `interjection` · `phrase`

Use `phrase` for multi-word entries that are compositional concepts (e.g. `kunstig intelligens`, `kvalitativ metode`). Fixed expressions, idioms, discourse markers, and greetings belong in `uttrykk-xx.json` instead.

### ID format

`v-{level}-{category}-{NNN}` where level is `a1|a2|b1|b2|c`, category matches `CATEGORIES_BY_LEVEL` in `config.ts`, and NNN is a zero-padded 3-digit number.

Example: `v-a1-classroom-001`

## Uttrykk vs Vocab

**Type A — Fixed expressions / idioms / discourse markers** → belong in `uttrykk`
These are phrases learners encounter as chunks and need to learn as a unit because the meaning isn't fully compositional. Examples:

- `ha det bra`, `god morgen`, `til fots` (A1 greetings/transport)
- `etter min mening`, `på den andre siden` (B1 opinions/reasoning)
- `alt i alt`, `det vil si`, `forutsatt at` (B2 discourse markers)
- `med utgangspunkt i`, `i lys av` (C formal writing)
- All the proverbs

**Type B — Compound concepts / collocations** → fine to keep in `vocab`
These are multi-word but they're really just a noun phrase naming a concept. The meaning is transparent and compositional. They function like lexical items, not formulaic chunks. Examples:

- `biologisk mangfold`, `fornybar energi`, `global oppvarming` (B1 environment)
- `kunstig intelligens`, `vitenskapelig metode` (B1)
- `akademisk diskurs`, `kvalitativ metode`, `teoretisk rammeverk` (B2 academic)
- `digital infrastruktur`, `sirkulær økonomi` (B2)
- `et nevralt nettverk` (C)

For Type B the `lemma` is unproblematic — it's the same as `norsk`, and that's fine. There's no inflection ambiguity the way there is with a verb or noun. The `part` field could arguably be changed from `"phrase"` to `"noun"` for most of them (since `biologisk mangfold` is effectively a noun), but that's a separate cleanup.
