# Convert Norwegian Vocabulary Images to JSON — Method 2 (Two-Step Pipeline)

This document defines **two separate AI tasks** used one after another on the same image(s). Each step has a narrow, fixed scope. When performing Step 1, do only Step 1 work — do not translate, categorize, or write example sentences. When performing Step 2, do only Step 2 work — do not re-read or re-interpret the image; work exclusively from the Step 1 JSON provided as input.

---

# STEP 1 — Extraction (image → norsk / lemma / definition / part / level)

## Goal

Read the attached image(s) and produce two JSON arrays — one for words, one for expressions — containing **only** these fields:

```
id, norsk, lemma, definition, level, part, category, example (only if present in image)
```

Do **not** generate `english`, `ukrainian`, `spanish`, `german`, `example_english`, `example_ukrainian`, `example_spanish`, `example_german` in this step. Leave them out of the object entirely (Step 2 adds them).

`example` is normally also left out in Step 1 (Step 2 generates it). **Exception:** if the image itself contains a labeled `Eks.: ...` sentence for an entry, capture it verbatim as `example` in the Step 1 output instead of discarding it — see Rule 1. Never invent an `example` value in Step 1; only carry one over when the image actually provides it.

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

Words can also be multi-word lexical items (Rule 3) — e.g. a phrasal verb:

```json
[
  {
    "id": "",
    "norsk": "å stå for døra",
    "lemma": "stå for døra",
    "definition": "Å være nært forestående i tid.",
    "level": "C",
    "part": "verb"
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
- **Expressions:** rewrite the image's explanation into one clean Bokmål sentence.
- **Both:** always drop a leading `her: ` prefix from `definition` if present — it's an image-formatting artifact, not part of the definition.
- **Both:** if the image text includes a trailing `Eks.: ...` example sentence after the definition, remove it entirely from `definition` and instead capture it verbatim (minus the `Eks.: ` label) as the `example` field on that entry, exactly as printed — do not translate, edit, or generate a new sentence for it. If an image lists two `Eks.:` sentences separated by `/`, use only the first as `example`. If no `Eks.:` sentence is present, omit `example` entirely from the object (Step 2 will generate one).

### 2. Convert noun gender

| Image   | Output    |
| ------- | --------- |
| `(m)`   | `(en)`    |
| `(n)`   | `(et)`    |
| `(f)`   | `(ei)`    |
| `(m/f)` | `(en/ei)` |
| `(m/n)` | `(en/et)` |

### 2c. Plural-only nouns

Some nouns exist only in plural form with no singular counterpart (e.g. `opptøyer`). For these:

- Do **not** force a singular gender marker (`(en)`/`(et)`/`(ei)`) onto the headword — the word has no singular form to carry one.
- If the image marks the entry with a plural/gender combo like `(pl., m)` or `(pl., n)`, strip the marker entirely and set `norsk`/`lemma` to the bare plural form as printed (e.g. `norsk`: `opptøyer`).
- Image gender markers on plural-only nouns are sometimes wrong or based on old grammar (as with `opptøyer`, marked `(m)` in the book but neuter per ordbokene.no). Don't try to resolve the "correct" gender in Step 1 — just drop the marker. Flag the entry per Rule 9 so it can be checked in ordbokene.no if needed.
- `part` is still `"noun"`.

### 2b. Strip non-gender markers from `norsk`

After using a part-of-speech marker (`(adj.)`, `(adv.)`, `(v1)`, `(v2)`, `(v3)`, `(ureg.)`, `(reg)`, etc.) per Rule 4 to determine `part`, remove that marker from the `norsk` field — it must not appear in the final output. Only noun gender markers are kept in `norsk`, and only in their converted form (Rule 2).

| Image               | `norsk` (final)                                        | `part`      |
| ------------------- | ------------------------------------------------------ | ----------- |
| `yndig (adj.)`      | `yndig`                                                | `adjective` |
| `omtåket (adj.)`    | `omtåket`                                              | `adjective` |
| `svirre (v1) rundt` | see Rule 3 — verb-headed multi-word → `å svirre rundt` | `verb`      |

### 3. Decide: vocab word or uttrykk expression?

Follow the same test as `data-rules/vocab-and-uttrykk.md`: the question isn't "how many words?" but **does `norsk` function as a lexical item with a single grammatical head that a learner inflects/conjugates productively?**

An entry is a **word** (`vocab`, `category` omitted) if it has a single grammatical head — even across multiple words:

- Single inflectable word: `nellikspiker (m)`, `sitre (v1)`, `kribling (m/f)` → word.
- Verb-headed multi-word item that is lexicalized as a single verb sense (a particle/phrasal verb, or a verb + fixed complement that a dictionary would list as a sub-sense of that verb rather than a separate idiom): `stå (ureg.) for døra`, `svirre (v1) rundt` → word, `part: "verb"`, `å` prepended per Rule 4.
- Multi-word noun phrase naming a concept, or multi-word preposition, if one ever appears in a level-C image: `part` stays `"noun"` / `"preposition"` — still a word, not `"phrase"`.

An entry is an **expression** (`category: "uttrykk"`, `part: "phrase"`) if it has **no single grammatical head**, or its meaning is idiomatic/figurative enough that native speakers memorize it as a fixed chunk rather than treating it as an ordinary conjugated verb + complement:

- Subject-led or headless fixed phrases: `forventningen rir (ureg.) ham`.
- Idiomatic collocations, even when verb-led, whose meaning isn't a transparent extension of the verb: `ta vare på`, `ha lyst til`, `slå seg til ro`.
- Gender-marked multi-word headwords with no productive grammatical head, e.g. `oppsatt kveld (m)` → strip the marker entirely, set `norsk`/`lemma` to `oppsatt kveld`, `category: "uttrykk"`, `part: "phrase"`.

**When it's genuinely ambiguous** whether a verb-headed multi-word entry is a lexicalized phrasal verb (word) or an idiom (expression) — check whether a Norwegian dictionary (NAOB/Bokmålsordboka) lists it as a sub-sense of the verb versus flagging it as `fast uttrykk`. If you can't tell from the image alone, default to **expression** and flag it (Rule 9) for review rather than guessing.

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
| `(v4)`                             | `verb`      |                                                                                     |
| `(ureg.)`, `(reg)`                 | `verb`      | Marks an irregular verb, not a distinct part of speech — always resolves to `verb`. |

**No marker present:** infer the part of speech from context and choose the closest matching value above.

**Verbs — prepending `å`:**

This applies whenever `norsk` starts with a verb, regardless of whether Rule 3 classifies the entry as a word or an expression:

- Single-word verb headword: prepend `å ` to the infinitive.
  - `komme (v1)` → `norsk`: `å komme`, `part`: `verb`
- Verb-led multi-word entry (verb is only part of a longer phrase, whether it lands in vocab as a phrasal verb or in uttrykk as an idiom per Rule 3): prepend `å ` only to the verb stem at the start of the phrase.
  - `stå (ureg.) for døra` → `norsk`: `å stå for døra` (word, per Rule 3)
  - `ta vare på` → `norsk`: `å ta vare på` (expression, per Rule 3)
- Subject-led or headless entry (a non-verb word starts the phrase): do not prepend `å`.
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
- Do not include `english`, `ukrainian`, `spanish`, `german`, `example_english`, `example_ukrainian`, `example_spanish`, `example_german`, or (for words) `category` — those are added in Step 2. Include `example` only when the image provides a labeled `Eks.:` sentence (Rule 1); otherwise omit it.
- Preserve Norwegian spelling exactly except for the transformations above.
- Do not invent information from the image. If text is unreadable, leave the field empty instead of guessing.
- No markdown, explanations, comments, or additional text — output only the two JSON arrays.

### 8. Expression category and part fields

For entries classified as expressions per Rule 3 (no single grammatical head, or idiomatic), the `category` field must be `uttrykk` and `part` field must be `phrase`. Entries classified as words per Rule 3 — including multi-word phrasal verbs — never get `category` in Step 1 and use the grammatical head's `part` (e.g. `"verb"`), not `"phrase"`.

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
intensifiers-degree,
gastronomy,
cultural-heritage
```

Expressions always use `"uttrykk"` — already set in Step 1, do not change it.

When choosing categories for words:

- Match the category to the meaning of the word.
- If the object already has a pre-existing `example` (carried over from Step 1's `Eks.:` text), consider it together with `definition` — both as equal signals — when choosing the category. Don't rely on `definition` alone and ignore an existing `example`; the example's context can sometimes point to a more precise category than the definition does on its own.
- You will be given the current category distribution of the existing dataset (see workflow doc) — use it to favor under-represented categories over already-common ones, rather than defaulting to the same few categories repeatedly.
- Do not invent new category names.

### 10. Generate an example sentence (Norwegian)

**10a. If `example` already exists** (carried over from Step 1's `Eks.:` text): keep it exactly as written — do not regenerate, edit, or rephrase it. The only thing left to do with it is translate it into `example_english`, `example_spanish`, `example_german`, `example_ukrainian` per Rule 11. It has already done its other job — informing category choice alongside `definition` (Rule 9) — before this step.

**10b. Otherwise, generate a new one:** produce one natural **Norwegian** sentence per item that clearly demonstrates the meaning, sounds natural to native speakers, uses correct grammar, is concise, fits the chosen category, and uses the word in an appropriate grammatical form. Store in `example`. Do not write this field in English or any other language — translations belong in `example_english`, `example_ukrainian`, `example_spanish`, `example_german` (Rule 11).

### 11. Translate the example sentence

Translate the example sentence naturally (not word-for-word) into `example_english`, `example_ukrainian`, `example_spanish`, `example_german`.

### 12. Output requirements

- Return two separate valid JSON arrays: one for words, one for expressions, matching the input structure plus the new fields.
- Every word object must contain every field in the Final field order list above.
- Every expression object must contain every field in the Final field order list above, except `category` is always `"uttrykk"` (already present from Step 1).
- Do not modify `id`, `norsk`, `lemma`, `definition`, `level`, `part`, or a pre-existing `example` carried over from Step 1 (Rule 10).
- No markdown, explanations, comments, or additional text — output only the two JSON arrays.
