## check vocab format

Validates all vocab-{level}.json files in src/lib/data against the
canonical rules for VocabEntry IDs and norsk/lemma field formatting.

Rules checked:

1. ID format — must be v-{level}-{category}-{NNN} (3-digit zero-padded)
2. ID uniqueness — no duplicates within or across files
3. level field — must match file's CEFR level (case-insensitive)
4. category — must be in CATEGORIES_BY_LEVEL for that level
5. part — must be a known PartOfSpeech value
6. norsk field — formatting rules per part of speech:
   noun → "word (en|et|ei)"
   verb → starts with "å "
   other → no "å " prefix, no gender parenthetical
7. lemma field — must be plain dictionary form (no å prefix, no gender):
   verb → bare infinitive, e.g. "få" (NOT "å få")
   noun → bare word, e.g. "hus" (NOT "hus (et)")
   other → bare word, e.g. "glad"
8. Required fields present (norsk, english, example, example_english, level, category, part)

NOTE: "numeral" appears in vocab-a1.json (numbers category) but is not in
types.ts PartOfSpeech. It is treated as a warning, not an error, so you can
decide whether to add it to the type or reclassify those entries.

```bash
  node scripts/check-vocab.mjs # check all
  node scripts/check-vocab.mjs a1
  node scripts/check-vocab.mjs a1 a2
```

## check uttrykk format

Validates all uttrykk-{level}.json and uttrykk-{level}-preview.json files in src/lib/data against canonical rules.

Rules checked:

1. ID format — full files: u-{level}-{NNN}
   preview files: up-{level}-{NNN} (3-digit zero-padded)
2. ID uniqueness — no duplicates within or across files
3. level field — must match file's CEFR level (case-insensitive)
4. category — must be "uttrykk" or "uttrykk-preview"
5. part — uttrykk entries should be "phrase"
6. norsk field — must be present and non-empty
7. lemma field — must be present and non-empty
8. Required fields (norsk, english, example, example_english, level, category, part)
9. Preview cross-check — entries in preview should also exist in full file (by norsk)

```bash
  node scripts/check-uttrykk.mjs            # check all uttrykk files
  node scripts/check-uttrykk.mjs a1
  node scripts/check-uttrykk.mjs a1 a2
```

## find duplicates

Scans all vocab-XX.json files in the norskeord project and reports duplicate 'norsk' entries — both within a single file and across files.

Find duplicate 'norsk' entries across uttrykk-XX.json files. Excludes uttrykk-XX-preview.json files (they are subsets of the main files).

```bash
  python scripts/find_dupes.py
  python scripts/find_uttrykk_dupes.py
```

## translate to other languages

Populates `[language]` and `example_[language]` fields for every entry in the specified JSON files (src/lib/data/vocab-_.json, uttrykk-_.json, etc.) using the Anthropic API. See ai-docs/multi-language.md for the field spec.

```bash
  node scripts/add-language-translations.mjs --language german --files vocab-b2.json
  node scripts/add-language-translations.mjs --language ukrainian --files vocab-a1.json vocab-a2.json vocab-b1.json vocab-b2.json vocab-c.json
```

## audit translation quality for any languages present

Uses the Claude API to audit translation quality for any languages present (english, spanish, ukrainian, german, romanian, …) in vocab-_.json and uttrykk-_.json files. Languages are detected automatically from the data.

```bash
  node scripts/audit-translations.mjs --files vocab-b1.json --only-with-translations

  # space-separated
  node scripts/add-language-translations.mjs --language german --files uttrykk-a1.json uttrykk-a2.json uttrykk-b1.json

  # comma-separated
  node scripts/add-language-translations.mjs --language german --files uttrykk-a1.json,uttrykk-a2.json,uttrykk-b1.json
```

## translate messages

Translates messages/en.json (the inlang base locale) into another locale file in the same directory, using the Anthropic API.

```bash
  node scripts/translate-messages.mjs --language german
```

## Renumber ids

Renumbers all entries in vocab-_.json and uttrykk-_.json so that IDs are sequential with no gaps.

```bash
  node scripts/renumber-ids.mjs --dry-run
```

## Normalise vocab
Normalises the `norsk` field in vocab-*.json files to the agreed format:

noun       → "<lemma> (en)" or "<lemma> (et)"   e.g. "hus (et)", "bil (en)"
verb       → "å <lemma>"                         e.g. "å få", "å henge"
adjective  → <lemma> as-is                       e.g. "glad"
other      → <lemma> as-is (no change)

For nouns the script CANNOT know the gender without a dictionary, so it uses the Claude API to look up the correct article (en/et) for each noun that needs one.  Verbs and adjectives require no API call.

```bash
  node scripts/normalise-norsk-field.mjs --dry-run --files vocab-a2.json > scripts/outputs/normalise-vocab-b2.txt
```