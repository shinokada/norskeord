# Vocab vs Uttrykk

## vocab-xx.json entry rules

### `norsk` field

The display form shown to learners.

| `part`         | Format                                  | Example              |
| -------------- | --------------------------------------- | -------------------- |
| `noun`         | dictionary form + gender in parentheses | `hus (et)`           |
| `verb`         | infinitive with `å`                     | `å få`               |
| `adjective`    | base (masculine singular) form          | `glad`               |
| `adverb`       | uninflected form                        | `i dag`              |
| `conjunction`  | uninflected form                        | `fordi`              |
| `preposition`  | uninflected form                        | `ved siden av`       |
| `pronoun`      | base form                               | `jeg`                |
| `numeral`      | base form                               | `én`                 |
| `interjection` | base form                               | `hei`                |
| `phrase`       | the fixed multi-word form               | `biologisk mangfold` |

### `lemma` field

Always the plain dictionary form — no gender markers, no `å` prefix, no inflection. Used for FSRS lookup and deduplication.

| `part`                                                                            | Format                      | Example              |
| --------------------------------------------------------------------------------- | --------------------------- | -------------------- |
| `noun`                                                                            | bare noun, no gender        | `hus`                |
| `verb`                                                                            | infinitive without `å`      | `få`                 |
| `adjective`                                                                       | base form (same as `norsk`) | `glad`               |
| `adverb` / `conjunction` / `preposition` / `pronoun` / `numeral` / `interjection` | same as `norsk`             | `fordi`              |
| `phrase`                                                                          | same as `norsk`             | `biologisk mangfold` |

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
