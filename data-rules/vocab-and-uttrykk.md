# Vocab vs Uttrykk

## vocab-xx.json entry rules

### `norsk` field

The display form shown to learners.

| `part`                   | Format                                                                      | Example                         |
| ------------------------ | --------------------------------------------------------------------------- | ------------------------------- |
| `noun`                   | dictionary form + gender in parentheses                                     | `hus (et)`                      |
| `noun` (variable gender) | dictionary form + `(en/ei)` (both accepted, e.g. `m/f` source dictionaries) | `elv (en/ei)`                   |
| `noun` (plural card)     | plural form + `(pl.)` or `(b.pl.)` in parentheses                           | `bøker (pl.)`, `bøkene (b.pl.)` |
| `noun` (indeclinable)    | dictionary form + `(ubøy.)` in parentheses                                  | `fjor (ubøy.)`                  |
| `verb`                   | infinitive with `å`                                                         | `å få`                          |
| `adjective`              | base (masculine singular) form                                              | `glad`                          |
| `adverb`                 | uninflected form                                                            | `i dag`                         |
| `conjunction`            | uninflected form                                                            | `fordi`                         |
| `preposition`            | uninflected form                                                            | `ved siden av`                  |
| `pronoun`                | base form                                                                   | `jeg`                           |
| `numeral`                | base form                                                                   | `én`                            |
| `interjection`           | base form                                                                   | `hei`                           |
| `phrase`                 | the fixed multi-word form                                                   | `biologisk mangfold`            |

### `lemma` field

Always the canonical form (lemma) of the lexical item — no gender markers, no `å` prefix, no inflection. This applies whether the lexical item is one word or several (e.g. a multi-word verb or preposition still has a lemma). Used for FSRS lookup and deduplication.

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

Most multi-word entries keep the `part` of their grammatical head, not `phrase`:

- Multi-word verbs (reflexive, particle) remain `verb` — e.g. `kle på seg`, `slå av`.
- Multi-word prepositions remain `preposition` — e.g. `ved siden av`, `i stedet for`.
- Multi-word noun phrases that name a concept remain `noun` — e.g. `kunstig intelligens`, `biologisk mangfold`.

Use `phrase` only when the entry has **no single grammatical head** — greetings, idioms, discourse markers, and other fixed expressions. In practice, most `phrase`-part entries belong in `uttrykk-xx.json` rather than `vocab-xx.json`; see the decision rule below.

| lemma              | part                 |
| ------------------ | -------------------- |
| kle på seg         | verb                 |
| slå av             | verb                 |
| ved siden av       | preposition          |
| biologisk mangfold | noun                 |
| i går              | phrase _(→ uttrykk)_ |
| ha det bra         | phrase _(→ uttrykk)_ |

### ID format

`w-{NNNNNN}` where NNNNNN is a zero-padded 6-digit number, **one shared sequence global across both vocab and uttrykk, and across all levels of each.** Neither `category`, `level`, nor type (vocab vs. uttrykk) is part of the id — all three live only in their own fields (`category`/`part` distinguish vocab from uttrykk), so recategorizing, reclassifying (CEFR level), or moving an entry between vocab and uttrykk is a pure data edit with no id implication.

Example: `w-000001`

Vocab and uttrykk ids are drawn from the same counter and are otherwise indistinguishable by shape — which file an entry lives in, and its `category`/`part` fields, are the only source of truth for its type.

### `note` field (optional)

Free-text usage note — supplementary context that doesn't belong in `definition`. `definition` is a monolingual Norwegian dictionary-style definition (B1+); `note` is looser: register/slang flags, related word-family members, a usage caveat, or a secondary sense. Written in whichever language is clearest (usually Norwegian, since it's typically sourced from Norwegian teaching material).

Example:

```
"note": "Børst er et slangord som brukes av dem som drikker (for) mye selv."
```

### `verb_type` field (optional, `verb` entries only)

Conjugation class, sourced from dictionary/textbook annotations like `(v1)`, `(v2)`, `(v3)`, `(ureg.)`. Value is one of `v1` | `v2` | `v3` | `ureg`, or a comma-separated combination when a source lists more than one accepted class, e.g. `"v1, v2"`.

Example:

```
"norsk": "å subbe",
"part": "verb",
"verb_type": "v1"
```

## Vocab vs Uttrykk

The vocab/uttrykk split is based on **lexical unit-hood**, not on whether the meaning is compositional. Compositionality is a bad test — `i går` ("in yesterday") is fully compositional but still belongs in uttrykk, while `kle på seg` is arguably just as compositional but is an ordinary conjugatable verb. So instead of asking "is the meaning compositional?", ask whether the entry **functions as a dictionary lemma**.

### Vocab (`vocab-xx.json`)

Use **vocab** for lexical items (lemmas). A lexical item may consist of one or more words if it functions as a single dictionary unit — learners inflect/conjugate it and use it productively in sentences like any other word.

This includes:

- nouns (including lexical noun phrases that name a concept)
- verbs, including reflexive verbs and particle verbs
- adjectives
- adverbs
- prepositions (including multi-word prepositions)
- conjunctions
- pronouns
- numerals
- interjections

Examples:

```
hus
være
kle på seg
føle seg
slå av
snakke med
ved siden av
kunstig intelligens
biologisk mangfold
```

This also covers ordinary verb + preposition collocations where the object slot is freely swappable — the preposition is fixed but the verb is the productive head, so the whole thing inflects/conjugates like any other verb. The test is the same as above: can a learner freely substitute the object and conjugate the verb across tenses?

```
sørge for
ta hensyn til
minne om
ha godt av
ta tak i
```

Not every verb-initial multi-word entry qualifies, though — if the noun/adjective after the verb doesn't function as a normal grammatical object (e.g. it needs a different verb like `være` to make sense, as in `være skyld i`), the fixed word isn't a verb complement and the entry likely belongs in `uttrykk` instead, or as its own `noun`/`adjective` vocab entry.

### Uttrykk (`uttrykk-xx.json`)

Use **uttrykk** for fixed expressions that learners memorize as complete chunks rather than as ordinary lexical items — the entry doesn't have a single grammatical head, and learners don't productively inflect or recombine its parts.

This includes:

- greetings
- conversational formulas
- idioms
- proverbs
- discourse markers
- sentence fragments
- fixed time expressions
- fixed prepositional/adverbial expressions that read as a formula rather than ordinary grammar

Examples:

```
ha det bra
god morgen
vær så snill
i går
i morgen
for en stund siden
på den andre siden
etter min mening
ta vare på
ha lyst til
slå seg til ro
alt i alt
det vil si
forutsatt at
med utgangspunkt i
i lys av
```

### `norsk` / `lemma` fields

Same as vocab: `norsk` is the display form, `lemma` is the canonical/dictionary form used for dedup. For uttrykk, both fields are normally identical — the whole fixed chunk, in its citation form.

**Verb-initial uttrykk use the bare verb form — no `å` prefix.** Unlike vocab verbs (which use `å` in `norsk`), an uttrykk headed by a verb is written the way a dictionary would cite the idiom, not as an infinitive clause.

| lemma                | not                        |
| -------------------- | -------------------------- |
| `ta vare på`         | ~~`å ta vare på`~~         |
| `ha lyst til`        | ~~`å ha lyst til`~~        |
| `bli oppfordret til` | ~~`å bli oppfordret til`~~ |

...and all proverbs.

### Decision rule

When deciding between vocab and uttrykk, ask, in order:

1. **Does this function as a lexical item** (a noun, verb, adjective, preposition, etc.) that learners inflect/conjugate and recombine normally? → **vocab**.
2. **Is this primarily a fixed chunk** used in communication, with no single grammatical head? → **uttrykk**.

This is easier to apply consistently than asking whether the meaning is compositional, and it resolves the recurring edge cases (reflexive/particle verbs, multi-word prepositions) in favor of `vocab`, while keeping genuine formulas, idioms, and time expressions in `uttrykk`.
