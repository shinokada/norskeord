# Vocabulary JSON Structure

## Current structure

```json
{
  "norsk": "å reise",
  "english": "to travel",
  "example": "Vi reiser til utlandet hvert år.",
  "example_english": "We travel abroad every year.",
  "level": "B1",
  "category": "travel",
  "part": "verb"
}
```

## Recommended structure (add `lemma` field)

```json
{
  "norsk": "å reise",
  "lemma": "reise",
  "english": "to travel",
  "example": "Vi reiser til utlandet hvert år.",
  "example_english": "We travel abroad every year.",
  "level": "B1",
  "category": "travel",
  "part": "verb"
}
```

---

## Field reference

| Field | Type | Required | Purpose |
|---|---|---|---|
| `norsk` | string | ✅ | Display form shown on the flashcard; used as the FSRS progress key in `localStorage` and Supabase — **never change this** |
| `lemma` | string | optional* | Bare root form used for counting and deduplication in stats; strip `å ` from verbs, article from nouns |
| `english` | string | ✅ | English translation |
| `example` | string | ✅ | Norwegian example sentence |
| `example_english` | string | ✅ | English translation of the example sentence |
| `level` | string | ✅ | CEFR level: `A1` `A2` `B1` `B2` `C1` `C2` |
| `category` | string | ✅ | Category slug matching `CATEGORIES_BY_LEVEL` in `types.ts` |
| `part` | string | ✅ | Part of speech: `noun` `verb` `adjective` `adverb` `pronoun` `preposition` `conjunction` `interjection` `phrase` |

*`lemma` is optional for now; the stats page falls back to `norsk` if absent. Populate for all new entries; backfill A1–A2 in a batch pass.

---

## Rationale: lemma-based counting, token-based scheduling

These are two separate concerns and must stay separate.

**FSRS scheduling is token-based.** The progress key is `norsk` (the display form). This is correct — FSRS schedules a specific card, not an abstract root. Changing this key would break all existing user progress in `localStorage` and Supabase.

**Statistics and CEFR estimates are lemma-based.** Counting inflected forms inflates word counts artificially. Norwegian nouns inflect for definiteness (*hus* / *huset*), verbs take several forms (*å lese*, *leser*, *leste*, *lest*), and adjectives agree with gender and number. A learner who has studied 80 lemmas should not be credited with 300+ "known words" due to inflection. The CEFR estimate on the stats page should count unique lemmas reviewed, not unique `norsk` strings.

The current JSON is already implicitly lemma-based — verbs are stored as infinitives with `å`, nouns in base form with their article. The `lemma` field makes this explicit and enables:

- **Deduplication across categories** — the same lemma appearing in two categories (e.g. *å lese* in both `media` and `education`) is counted once
- **Accurate CEFR estimates** — "you know 73% of A2 vocabulary" means 73% of unique A2 lemmas, not 73% of flashcard tokens
- **Word family grouping** (optional, later) — *reise*, *reiser*, *reisende* all share the lemma `reise`

---

## Deriving `lemma` from `norsk`

Simple rules cover the majority of cases:

- **Verbs:** strip `å ` → `å reise` → `reise`
- **Nouns:** strip the article → `et pass` → `pass`, `en bagasje` → `bagasje`
- **Adjectives, adverbs, pronouns:** `lemma` = `norsk` (no change needed in most cases)
- **Phrases and interjections:** `lemma` = `norsk` (multi-word expressions are their own lemma)

Edge cases (irregular forms, compound nouns) should be set manually.

---

## Storage: JSON files, not database

Vocabulary content lives in `src/lib/data/vocab-{level}.json`. Per-user state (FSRS progress, subscriptions) lives in Supabase. These must not be mixed.

**Reasons to keep vocabulary in JSON:**
- Read at build time — zero database reads for flashcard content
- Version-controlled — vocabulary changes are diffable in git
- Fast — files are statically served and browser-cached
- Simple — no query layer, no RLS, no latency

**At B2+ scale (~2,000 entries per file):** JSON remains viable. A 2,000-entry file is ~300–400 KB, well within browser cache limits. If files grow beyond ~5,000 entries, consider lazy-loading by category rather than importing the full level file.

**Do not move vocabulary to the database** unless user-generated content (community corrections, custom decks) is added to the roadmap.
