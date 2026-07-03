# Convert Norwegian Vocabulary Images to JSON — Method 2 (Two-Step Pipeline)

This document defines **two separate AI tasks** used one after another on the same image(s). Each step has a narrow, fixed scope. When performing Step 1, do only Step 1 work — do not translate, categorize, or write example sentences. When performing Step 2, do only Step 2 work — do not re-read or re-interpret the image; work exclusively from the Step 1 JSON provided as input.

---

# STEP 1 — Extraction (image → norsk / lemma / definition / part / level)

## Goal

Read the attached image(s) and produce two JSON arrays — one for words, one for expressions — containing **only** these fields:

```
id, norsk, lemma, definition, level, part, category
```

Do **not** generate `english`, `ukrainian`, `spanish`, `german`, `example`, `example_english`, `example_ukrainian`, `example_spanish`, `example_german` in this step. Leave them out of the object entirely (Step 2 adds them).

`category` is filled in Step 1 **only** for expressions, where it is always the fixed value `"uttrykk"`. For words, omit `category` — it requires judgment about meaning and dataset balance, which belongs in Step 2.

## Output format

Words:

```json
[
  {
    "id": "",
    "norsk": "stormakt (en)",
    "lemma": "stormakt",
    "definition": "Et land med mye politisk, militær og økonomisk makt i verden.",
    "level": "C",
    "part": "noun"
  }
]
```

Expressions:

```json
[
  {
    "id": "",
    "norsk": "All ære til",
    "lemma": "All ære til",
    "definition": "Brukes for å gi noen full anerkjennelse for noe de har gjort.",
    "level": "C",
    "category": "uttrykk",
    "part": "phrase"
  }
]
```

## Rules

### 1. Extract `norsk` and `definition` from the image

Copy `norsk` as written (before transformation). For `definition`:

- **Words:** copy the image's definition text as-is.
- **Expressions:** rewrite the image's explanation into one clean Bokmål sentence. Drop `=` usage notes and inline examples from the image (those inform your understanding but don't belong verbatim in `definition`).

### 2. Convert noun gender

| Image   | Output    |
| ------- | --------- |
| `(m)`   | `(en)`    |
| `(n)`   | `(et)`    |
| `(f)`   | `(ei)`    |
| `(m/f)` | `(en/ei)` |

### 3. Decide: word or expression?

An entry is an **expression** if the **headword itself** (`norsk`) is a multi-word fixed phrase or idiom rather than a single inflectable dictionary word — for example `stå (ureg.) for døra`, `forventningen rir (ureg.) ham`, `ta vare på`.

An entry is a **word** if `norsk` is a single inflectable word, even if its definition or example happens to mention or use an idiom — for example `nellikspiker (m)`, `sitre (v1)`, `kribling (m/f)`.

If unsure, default to **word** unless the phrase clearly functions as a set idiom independent of its literal parts.

### 4. Determine the part of speech

**Nouns:** if `norsk` contains a gender marker (`(m)`, `(n)`, `(f)`, `(m/f)`), set `part: "noun"` after converting the gender marker per Rule 2.

**Other parts of speech:**

| Abbreviation                       | `part`      | Notes                                                                               |
| ---------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `(adj.)`                           | `adjective` |                                                                                     |
| `(adv.)`                           | `adverb`    |                                                                                     |
| `(v1)`                             | `verb`      |                                                                                     |
| `(v2)`                             | `verb`      |                                                                                     |
| `(v3)`                             | `verb`      |                                                                                     |
| `(v1, v2)`, `(v1, v3)`, `(v2, v3)` | `verb`      |                                                                                     |
| `(ureg.)`, `(reg)`                 | `verb`      | Marks an irregular verb, not a distinct part of speech — always resolves to `verb`. |

**No marker present:** infer the part of speech from context and choose the closest matching value above.

**Verbs — prepending `å`:**

- Single-word verb headword: prepend `å ` to the infinitive.
  - `komme (v1)` → `norsk`: `å komme`, `part`: `verb`
- Verb-led expression (verb is only part of a longer fixed phrase): prepend `å ` only to the verb stem at the start of the phrase.
  - `stå (ureg.) for døra` → `norsk`: `å stå for døra`
- Subject-led expression (a non-verb word starts the phrase): do not prepend `å`.
  - `forventningen rir (ureg.) ham` → `norsk`: `forventningen rir ham`

### 5. Create the lemma

- Remove noun gender markers: `(en)`, `(et)`, `(ei)`, `(en/ei)`.
- Remove `å` from verbs.
- Remove all grammatical abbreviations, including `(ureg.)`.
- Single word → `lemma` is exactly one word.
- Expression (multiple words) → `lemma` is identical to `norsk` (without abbreviations, without the `å` prefix if present).

| norsk                   | lemma                   |
| ----------------------- | ----------------------- |
| `hus (et)`              | `hus`                   |
| `å komme`               | `komme`                 |
| `å stå for døra`        | `stå for døra`          |
| `forventningen rir ham` | `forventningen rir ham` |

### 6. Level

Always set `"level": "C"` unless told otherwise for a specific batch of images.

### 7. Output requirements

- Always set `"id": ""`.
- Return two separate valid JSON arrays: one for words, one for expressions.
- Do not include `english`, `ukrainian`, `spanish`, `german`, `example`, `example_english`, `example_ukrainian`, `example_spanish`, `example_german`, or (for words) `category` — those are added in Step 2.
- Preserve Norwegian spelling exactly except for the transformations above.
- Do not invent information from the image. If text is unreadable, leave the field empty instead of guessing.
- No markdown, explanations, comments, or additional text — output only the two JSON arrays.

### 8. Expression category and part fields

For expression json items, the `category` field must be `uttrykk` and `part` feild must be `phrase`.

```json
{
  ...
  "category": "uttrykk",
  "part": "phrase"
}
```

### 9. Flag me

If you have any thing noticed, please flag me to notice after conversion.

---

# STEP 2 — Enrichment (Step 1 JSON → complete entries)

## Goal

You will receive the Step 1 JSON (words array and expressions array) as input — **not** the original image. Add the remaining fields to every object, without altering `id`, `norsk`, `lemma`, `definition`, `level`, or `part` (or `category` for expressions).

Fields to add, in this order, after `lemma` and before `definition`:

```
english, ukrainian, spanish, german, example, example_english, example_ukrainian, example_spanish, example_german
```

`example` is written **in Norwegian** (Bokmål) — it is a new sentence you generate, not a translation. `example_english`, `example_ukrainian`, `example_spanish`, and `example_german` are translations of that Norwegian sentence into their respective languages. Only `example` is Norwegian; every other field in this list (including `english`) is a translation.

Plus, for **words only**: `category`.

Final field order for a completed object:

```
id, norsk, lemma, english, ukrainian, spanish, german, example, example_english, example_ukrainian, example_spanish, example_german, definition, level, category, part
```

## Rules

### 8. Translate the vocabulary

Translate `norsk` into `english`, `ukrainian`, `spanish`, `german`, using the most common dictionary translation that best matches the Norwegian meaning and the supplied `definition`.

### 9. Choose a category (words only)

Choose **exactly one** category from this list, using the names exactly as written:

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
nature-landscape,
sensory-sound,
physical-appearance,
everyday-objects,
character-temperament,
embodied-emotion,
manner-of-motion,
interpersonal-conflict,
intensifiers-degree
```

Expressions always use `"uttrykk"` — already set in Step 1, do not change it.

When choosing categories for words:

- Match the category to the meaning of the word.
- You will be given the current category distribution of the existing dataset (see workflow doc) — use it to favor under-represented categories over already-common ones, rather than defaulting to the same few categories repeatedly.
- Do not invent new category names.

### 10. Generate an example sentence (Norwegian)

One natural **Norwegian** sentence per item that clearly demonstrates the meaning, sounds natural to native speakers, uses correct grammar, is concise, fits the chosen category, and uses the word in an appropriate grammatical form. Store in `example`. Do not write this field in English or any other language — translations belong in `example_english`, `example_ukrainian`, `example_spanish`, `example_german` (Rule 11).

### 11. Translate the example sentence

Translate the example sentence naturally (not word-for-word) into `example_english`, `example_ukrainian`, `example_spanish`, `example_german`.

### 12. Output requirements

- Return two separate valid JSON arrays: one for words, one for expressions, matching the input structure plus the new fields.
- Every word object must contain every field in the Final field order list above.
- Every expression object must contain every field in the Final field order list above, except `category` is always `"uttrykk"` (already present from Step 1).
- Do not modify `id`, `norsk`, `lemma`, `definition`, `level`, or `part`.
- No markdown, explanations, comments, or additional text — output only the two JSON arrays.
