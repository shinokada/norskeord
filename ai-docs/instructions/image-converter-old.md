**USE image-converter-2.md**
**THIS FILE IS REDUNDANT. FOR REFERENCE ONLY**

# Convert Norwegian Vocabulary Images to JSON

Convert the attached image(s) into a JSON array. Return one JSON for words and one JSON for expressions that I can directly copy, paste, or download. Do **not** include markdown, explanations, comments, or additional text.

## Output Format examples

Each vocabulary item must use the following structure. Field values below (including `"level": "B2"`) are for illustration only — see Rule 10 for the actual level to use.

Words (single, inflectable dictionary words — includes a `definition` field):
```json
[
  {
    "id": "",
    "norsk": "stormakt (en)",
    "lemma": "stormakt",
    "english": "a great power",
    "ukrainian": "велика держава",
    "spanish": "una gran potencia",
    "german": "die Grossmacht",
    "example": "USA og Kina er begge stormakter med stor innflytelse i verdensøkonomien.",
    "example_english": "The USA and China are both great powers with significant influence in the world economy.",
    "example_ukrainian": "США і Китай є великими державами з величезним впливом на світову економіку.",
    "example_spanish": "Estados Unidos y China son ambos grandes potencias con mucha influencia en la economía mundial.",
    "example_german": "Die USA und China sind beide Grossmaechte mit grossem Einfluss in der Weltwirtschaft.",
    "definition": "Et land med mye politisk, militær og økonomisk makt i verden.",
    "level": "B2",
    "category": "politics",
    "part": "noun"
  },
  {
    "id": "",
    "norsk": "å lovfeste",
    "lemma": "lovfeste",
    "english": "to enshrine in law / to legislate",
    "ukrainian": "закріпити законом / законодавчо встановити",
    "spanish": "consagrar en la ley / legislar",
    "german": "gesetzlich verankern",
    "example": "Retten ble lovfestet i 1978.",
    "example_english": "The right was enshrined in law in 1978.",
    "example_ukrainian": "Це право було закріплено законом у 1978 році.",
    "example_spanish": "El derecho fue consagrado en la ley en 1978.",
    "example_german": "Das Recht wurde 1978 gesetzlich verankert.",
    "definition": "Å gjøre noe til en offisiell regel ved å skrive det inn i loven.",
    "level": "B2",
    "category": "politics",
    "part": "verb"
  }
]
```

Expressions (fixed phrases / idioms — **also include a `definition` field**):
```json
[
  {
    "id": "",
    "norsk": "All ære til",
    "lemma": "All ære til",
    "english": "all credit to, full credit to",
    "ukrainian": "вся честь належить, усі лаври — ",
    "spanish": "todo el mérito es de, todo el crédito para",
    "german": "alle Ehre gebührt",
    "example": "All ære til de frivillige som jobbet dag og natt for å redde dyrene etter flommen.",
    "example_english": "All credit to the volunteers who worked day and night to rescue the animals after the flood.",
    "example_ukrainian": "Вся честь належить волонтерам, які працювали день і ніч, щоб врятувати тварин після повені.",
    "example_spanish": "Todo el mérito es de los voluntarios que trabajaron día y noche para rescatar a los animales después de la inundación.",
    "example_german": "Alle Ehre gebührt den Freiwilligen, die Tag und Nacht arbeiteten, um die Tiere nach der Flut zu retten.",
    "definition": "Brukes for å gi noen full anerkjennelse for noe de har gjort.",
    "level": "B2",
    "category": "uttrykk",
    "part": "phrase"
  }
]
```

**Field sets:**
- Both Words and Expressions include `definition` (matches the production schema in `src/lib/data/vocab-c.json` and `uttrykk-c.json`, where every entry has one).
- Both Words and Expressions include `spanish`/`example_spanish` and `ukrainian`/`example_ukrainian`, even though the current production C-level files don't have these yet — they're being backfilled separately, so keep generating them for all new entries.

---

# Rules

## 1. Extract data

Read every vocabulary entry from the attached image(s).

Fill the following fields from the image:

* `norsk`
* `definition` — for words, this is the image's definition text as-is; for expressions, rewrite the image's explanation into one clean Bokmål sentence (drop `=` usage notes and inline examples), matching the style already used in `src/lib/data/uttrykk-c.json`.

All other fields must be generated according to the rules below.

---

## 2. Convert noun gender

Replace noun gender abbreviations as follows:

| Image   | Output    |
| ------- | --------- |
| `(m)`   | `(en)`    |
| `(n)`   | `(et)`    |
| `(f)`   | `(ei)`    |
| `(m/f)` | `(en/ei)` |

---

## 3. Decide: word or expression?

An entry is an **expression** (goes in the Expressions JSON, `category: "uttrykk"`, `part: "phrase"`, includes a `definition` field) if the **headword itself** (`norsk`) is a multi-word fixed phrase or idiom rather than a single inflectable dictionary word — for example:

* `stå (ureg.) for døra`
* `forventningen rir (ureg.) ham`
* `ta vare på`

An entry is a **word** (goes in the Words JSON, also includes `definition`) if `norsk` is a single inflectable word, even if its definition or example happens to mention or use an idiom — for example:

* `nellikspiker (m)`
* `sitre (v1)`
* `kribling (m/f)`

If you're unsure whether something is a fixed phrase vs. a normal compound/single word, default to **word** unless the phrase clearly functions as a set idiom independent of its literal parts.

---

## 4. Determine the part of speech

**Nouns:** if `norsk` contains a gender marker (`(m)`, `(n)`, `(f)`, `(m/f)`), set `part: "noun"` after converting the gender marker per Rule 2.

**Other parts of speech:** if `norsk` contains one of the following abbreviations, remove the abbreviation and set the `part` field.

| Abbreviation | `part`      | Notes                                                                               |
| ------------ | ----------- | ----------------------------------------------------------------------------------- |
| `(adj.)`     | `adjective` |                                                                                     |
| `(adv.)`     | `adverb`    |                                                                                     |
| `(v1)`       | `verb`      |                                                                                     |
| `(v2)`       | `verb`      |                                                                                     |
| `(v1, v2)`   | `verb`      |                                                                                     |
| `(ureg.)`    | `verb`      | Marks an irregular verb, not a distinct part of speech — always resolves to `verb`. |

**No marker present:** if `norsk` has no gender or part-of-speech marker at all, infer the part of speech from context (definition/example) and choose the closest matching value above.

**Verbs — prepending `å`:**

* Single-word verb headword: prepend `å ` to the infinitive.
  * Image: `komme (v1)` → `norsk`: `å komme`, `part`: `verb`
* Verb-led expression (the verb is only part of a longer fixed phrase, e.g. `stå (ureg.) for døra`): this is an **expression** per Rule 3, not a word. Prepend `å ` only to the verb stem at the start of the phrase, leaving the rest of the phrase unchanged.
  * Image: `stå (ureg.) for døra` → `norsk`: `å stå for døra`
  * Image: `forventningen rir (ureg.) ham` → do **not** prepend `å` here, since `forventningen` (the subject), not the verb, is the first word. Leave the phrase as-is aside from removing `(ureg.)`: `norsk`: `forventningen rir ham`

---

## 5. Create the lemma

The `lemma` field must contain the Norwegian dictionary form.

Rules:

* Remove noun gender markers: `(en)`, `(et)`, `(ei)`, `(en/ei)`.
* Remove `å` from verbs.
* Remove all grammatical abbreviations, including `(ureg.)`.
* If the entry is a single word, `lemma` must contain exactly one word.
* If the entry is an expression (multiple words), `lemma` must be identical to `norsk` (without grammatical abbreviations, without the `å` prefix if present).

Examples:

| norsk                   | lemma                   |
| ----------------------- | ----------------------- |
| `hus (et)`              | `hus`                   |
| `bok (ei)`              | `bok`                   |
| `bil (en)`              | `bil`                   |
| `å komme`               | `komme`                 |
| `ta vare på`            | `ta vare på`            |
| `å stå for døra`        | `stå for døra`          |
| `forventningen rir ham` | `forventningen rir ham` |

---

## 6. Translate the vocabulary

Translate the `norsk` field into:

* `english`
* `ukrainian`
* `spanish`
* `german`

Use the most common dictionary translation that best matches the Norwegian meaning.

---

## 7. Choose a category

For **single words**, choose **exactly one** category from the list below.

Use the category names **exactly as written**.

```text
philosophy
academic
formal-writing
rhetoric
complex-emotions
professional
abstract-concepts
politics-democracy
linguistics
media-journalism
architecture-design
diplomacy-international
finance-economics
medicine-healthcare
psychology-advanced
literary
archaic
proverbs
highly-formal
technical
advanced-law-justice
neuroscience-cognition
climate-environment-policy
sociology-anthropology
advanced-business-strategy
existential-abstract
```

For **expressions**, always use:

```text
uttrykk
```

When choosing categories:

* Choose the category that best matches the meaning of the word.
* Use all categories over time instead of repeatedly choosing only a few.
* Try to keep the number of vocabulary items assigned to each category reasonably balanced across the dataset.
* Do not invent new category names.

---

## 8. Generate an example sentence

Create one natural Norwegian example sentence using the vocabulary item.

The sentence should:

* clearly demonstrate the meaning.
* sound natural to native Norwegian speakers.
* use correct grammar.
* be concise.
* fit the selected category.
* use the word in an appropriate grammatical form.

Store the sentence in:

```text
example
```

---

## 9. Translate the example sentence

Translate the Norwegian example sentence into:

* English → `example_english`
* Ukrainian → `example_ukrainian`
* Spanish → `example_spanish`
* German → `example_german`

Translate naturally rather than word-for-word.

---

## 10. Level

Always set:

```json
"level": "C"
```

This applies regardless of the level shown in any example above — the examples in this document use `"B2"` only to illustrate the JSON structure.

---

## 11. Output requirements

* Always set `"id": ""` (empty string) — do not generate or copy an id value, even though some structural examples above may show one.
* Produce one JSON object for each vocabulary item.
* Return a valid JSON array for words and a separate valid JSON array for expressions.
* Every word object must contain every field shown in the Words example, including `definition`.
* Every expression object must contain every field shown in the Expressions example, including `definition`.
* Preserve Norwegian spelling exactly except for the transformations described above.
* Do not invent information from the image.
* If text in the image is unreadable, leave the corresponding extracted field empty instead of guessing.
* Always generate translations, category selection, and example sentences, even if they are not present in the image.
* Ensure the final JSON is syntactically valid and can be parsed without modification.
