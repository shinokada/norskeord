# Convert Norwegian Vocabulary Images to JSON — Method 2, Format B (Textbook Glossary Lists)

This document is a sibling to `ai-docs/instructions/image-converter.md`. It uses the same two-step pipeline (`work-flow.md`) and the same general philosophy — narrow scope per step, Step 1 reads the image, Step 2 only reads Step 1's JSON — but the **source image format is different**, so the extraction rules differ.

Use **`image-converter.md`** for dictionary-style images: a bold headword followed by a monolingual Bokmål definition (used for level C).

Use **this document** for textbook glossary/index-style images: an alphabetical wordlist with grammatical shorthand and a chapter/page reference instead of a definition (used for level A1 / A2). There are two source layouts covered here:

- **Format B1 — vocab glossary** (e.g. images showing entries like `administrasjon/en 3(4)`): a word, its grammar shorthand, and a chapter(page) reference. No translation or definition is given.
- **Format B2 — uttrykk two-column list** (e.g. a left column of phrases and a right column of example sentences): a phrase and a ready-made Norwegian example sentence. No translation is given either, but the example sentence is already written for you.

Because neither source format supplies a definition or translation, **this method never produces a `definition` field** — that matches the existing A1/A2 production data in `src/lib/data/vocab-a1.json` / `vocab-a2.json`, where `definition` is absent (it's an optional field, populated for B1+ only per `json-structure.md`).

---

# STEP 1 — Extraction (image → norsk / lemma / part [/ example for Format B2])

## Goal

Read the attached image(s) and produce two JSON arrays — words and expressions — with only these fields:

```
id, norsk, lemma, level, part, category
```

`category` is filled in Step 1 **only** for expressions (`"uttrykk"`), same as Method 1. For words, omit `category`.

**Format B2 only:** also include `example` (the Norwegian sentence already printed in the right-hand column — copy it, don't invent a new one). Format B1 entries never get `example` in Step 1; Step 2 generates it.

Never include `definition` — leave it out of every object in both steps.

## Output format

Words (Format B1):
Since this vocab list is intended for A2, the `level` field is `A2`.
```json
[
  {
    "id": "",
    "norsk": "administrasjon (en)",
    "lemma": "administrasjon",
    "level": "A2",
    "part": "noun"
  }
]
```

Expressions from Format B1 (collocations found under a headword):

```json
[
  {
    "id": "",
    "norsk": "å bli lei av",
    "lemma": "bli lei av",
    "level": "A2",
    "category": "uttrykk",
    "part": "phrase"
  }
]
```

Expressions from Format B2 (already has an example sentence):

```json
[
  {
    "id": "",
    "norsk": "å holde en tale",
    "lemma": "holde en tale",
    "example": "Hun holder en tale.",
    "level": "A2",
    "category": "uttrykk",
    "part": "phrase"
  }
]
```

## Rules

### 1. Drop every page/chapter reference

Numbers like `8(1)`, `3(4)`, `12(3)` are chapter(page) citations from the textbook index — they are **never** part of the output. Ignore them entirely; don't store them anywhere, not even as a note.

### 2. Format B1 — reading the glossary shorthand

Each glossary line is: `word` + optional grammar shorthand + a page reference. The shorthand tells you the part of speech:

**Nouns** — a slash or an `el.` (eller = "or") alternate-form marker signals a noun and its gender:

| Image shorthand                    | Meaning                                     | Output gender |
| ---------------------------------- | ------------------------------------------- | ------------- |
| `ord/en`                           | en-word                                     | `(en)`        |
| `ord/et`                           | et-word                                     | `(et)`        |
| `ord/n`                            | en-word, stem already ends in a vowel       | `(en)`        |
| `ord/t`                            | et-word, stem already ends in a vowel       | `(et)`        |
| `ord/a el. -en`, `ord, ..X el. -Y` | dual-gender (bestemt form can be -a or -en) | `(en/ei)`     |

Drop the alternate bestemt-form spelling detail (`..ssa`, `..va`, `-n`, etc.) once you've read off the gender — it isn't stored, same as Method 1's gender conversion (Rule 2 there).

**Adjectives** — two comma-separated short suffix forms after the base word, with **no** `el.` present, e.g. `aktuell, -elt, -e`, `arbeidsledig, -, -e`, `billig, -, -e`, `arabisk, -, -e`. These represent the neuter and plural/definite endings. `norsk` is just the base word, unchanged — no suffix is stored (matches existing data: adjectives like `stor`, `rød`, `første` are stored bare, with no `(adj.)` marker).

**Verbs** — one or two comma-separated forms after the infinitive that are full inflected forms, not adjective suffixes:

- One form, dash-prefixed suffix (`-et`, `-te`, `-dde`, `-dd`) → weak/regular verb, e.g. `arbeide, -et`, `bo, -dde`, `angre, -et`.
- Two forms, full words rather than dash-suffixes → irregular/strong verb: infinitive, preteritum, perfect participle, e.g. `bli, ble, blitt`, `dra, dro, dradd`, `drikke, drakk, drukket`, `bære, bar, båret`. Some irregular verbs only show two total forms (infinitive + preteritum, participle identical or omitted), e.g. `bestemme, bestemte`, `bestille, bestilte`.

For any verb, prepend `å ` to the infinitive for `norsk`, exactly as in `image-converter.md` Rule 4 ("Verbs — prepending `å`").

**No shorthand at all** — a bare word followed only by a page reference (e.g. `absolutt`, `aldri`, `alltid`, `april`) is typically an adverb, conjunction, preposition, or proper noun. Infer the part of speech from the word's meaning, the same fallback used in Method 1 Rule 4 ("No marker present").

**Closed-class words with irregular declension** (`all, alt, alle`; `annen, annet, andre`; `annenhver, annethvert`) look like the adjective triple-form pattern but are pronouns/determiners. These are well-known, small closed classes — classify by meaning rather than by the comma-form pattern. If genuinely unsure, default to `adjective`.

### 3. Format B1 — collocations under a headword are candidate expressions

Some glossary lines have a semicolon followed by one or more short phrases, sometimes on their own indented line, each with its own page reference — e.g.:

```
bli, ble, blitt; bli sliten 2(2)
bli med 4(3)
bli lei av 11(4)
```

```
annen, annet, andre;
  andre språk 1(2)
  blant annet 4(2)
  en annen kultur 8(2)
```

The headword itself (`bli`, `annen`) is always extracted as its own word entry per Rule 2. For each attached sub-phrase, decide:

- **Extract as an expression** if it's a fixed idiomatic phrase whose meaning isn't just the sum of its parts — e.g. `bli lei av` ("to get tired of"), `bli med` ("to join / come along"). Apply the verb-led `å`-prefix logic from `image-converter.md` Rule 4 when the phrase is verb-led (`bli lei av` → `å bli lei av`; `bli med` → `å bli med`).
- **Skip it** if it's merely an example noun phrase illustrating ordinary usage of the headword rather than a fixed expression — e.g. `andre språk` ("other languages"), `en annen kultur` ("a different culture"). These don't need their own entry; the headword's own Step 2 example sentence is enough to cover ordinary usage. When unsure, skip rather than extract — a missed idiom is easy to add later, a junk expression entry is not.

### 4. Format B2 — the two-column uttrykk list

Left column = the phrase, right column = a ready-written Norwegian example sentence. For each row:

- `norsk`: the left-column phrase as printed. If it already starts with `å ` (verb phrase), keep it as-is. If it's a bare noun/adverbial phrase (`jul og nyttår`, `fram og tilbake`, `i mål`, `smak`, `til huset`), keep it bare too — do not add `å`.
- `example`: copy the right-column sentence verbatim into the Step 1 output (see the expression output example above). This is a deviation from Method 1, where `example` is always generated in Step 2 — here it's already given, so capture it now instead of discarding it.
- `category`: `"uttrykk"`, `part`: `"phrase"`, same as any expression.
- If a headword has two example sentences shown (e.g. `smak` / `smaken`, or `å pynte seg` used with a follow-up question), treat each distinct left-column entry as its own row; if only one example sentence covers two closely related forms, use judgment and flag it for review rather than guessing.

### 5. Create the lemma

Same rule as `image-converter.md` Rule 5: strip noun gender markers, strip `å` from verbs, strip grammatical abbreviations. Single word → lemma is one word. Expression → lemma equals `norsk` without the `å` prefix.

### 6. Level

Set `"level"` to `"A2"`.

### 7. Output requirements

- Always set `"id": ""`.
- Never include `definition` in any object, in either step.
- Return two separate valid JSON arrays: one for words, one for expressions.
- Do not include `english`, `ukrainian`, `spanish`, `german`, `example_english`, `example_ukrainian`, `example_spanish`, `example_german`, or (for words) `category` — those are added in Step 2. `example` is the one exception, and only for Format B2 rows (Rule 4).
- Never include page/chapter reference numbers anywhere in the output (Rule 1).
- Preserve Norwegian spelling exactly except for the transformations described above.
- Do not invent information from the image. If text is unreadable, leave the field empty instead of guessing.
- No markdown, explanations, comments, or additional text — output only the two JSON arrays.

### 8. Flag me

If anything was ambiguous — a collocation you weren't sure whether to extract (Rule 3), a shorthand pattern that didn't match any table above, or unreadable text — flag it after the conversion so it can be checked against the photo.

---

# STEP 2 — Enrichment (Step 1 JSON → complete entries)

## Goal

You will receive the Step 1 JSON (words array and expressions array) as input — not the original image. Add the remaining fields to every object, without altering `id`, `norsk`, `lemma`, `level`, `part` (or `category` for expressions), or any `example` already present from Format B2.

Fields to add, in this order, after `lemma`:

```
english, ukrainian, spanish, german, example, example_english, example_ukrainian, example_spanish, example_german
```

Plus, for **words only**: `category`.

**Never add `definition`** — this method's output matches the existing A1/A2 production files, which don't carry that field.

Final field order for a completed object:

```
id, norsk, lemma, english, ukrainian, spanish, german, example, example_english, example_ukrainian, example_spanish, example_german, level, category, part
```

## Rules

### 9. Translate the vocabulary

Translate `norsk` into `english`, `ukrainian`, `spanish`, `german`, using the most common dictionary translation that best matches the Norwegian meaning.

### 10. Choose a category (words only)

Choose **exactly one** category from the list matching the entry's `level`, using the names exactly as written. These mirror `CATEGORIES_BY_LEVEL` in `src/lib/config.ts` — check that file if it's been updated since this document was written.

**A1:**

```text
greetings
numbers
colors
family
body
food
animals
home
days-months
classroom
adjectives
verbs
pronouns-and-questions
feelings
weather
transportation
household-items
places
clothes
actions
```

**A2:**

```text
shopping
transport
clothing
hobbies
directions
occupations
sports
health
weather
time
descriptive-adjectives
cooking
nature
house-chores
communication
body
social-life
technology
environment
money
```

Expressions always use `"uttrykk"` — already set in Step 1, do not change it.

When choosing categories for words:

- Match the category to the meaning of the word.
- You will be given the current category distribution of the existing dataset (see `work-flow.md`) — use it to favor under-represented categories over already-common ones, rather than defaulting to the same few categories repeatedly.
- Do not invent new category names.

### 11. Generate an example sentence — Format B1 words (no example yet)

One natural **Norwegian** sentence per item that clearly demonstrates the meaning, sounds natural to native speakers, uses correct grammar for an A1/A2 learner (keep it simple — short, common structures, no subordinate clauses for A1), is concise, and uses the word in an appropriate grammatical form. Store in `example`.

### 11a. Format B2 expressions — translate, don't regenerate

If `example` is already present (Format B2 rows carried it over from Step 1), **do not overwrite or regenerate it** — translate that exact sentence in Rule 12 below.

### 12. Translate the example sentence

Translate the example sentence naturally (not word-for-word) into `example_english`, `example_ukrainian`, `example_spanish`, `example_german`.

### 13. Output requirements

- Return two separate valid JSON arrays: one for words, one for expressions, matching the input structure plus the new fields.
- Every object must contain every field in the Final field order list above — except `definition`, which is never included.
- Every expression object's `category` is always `"uttrykk"` (already present from Step 1).
- Do not modify `id`, `norsk`, `lemma`, `level`, `part`, or (Format B2) the existing `example`.
- No markdown, explanations, comments, or additional text — output only the two JSON arrays.
