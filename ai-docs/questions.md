# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

svelte mcp server is running.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

Please read ai-docs/implementation/quiz-i18n-and-categories.md and the attached doc from a previous session which terminated due to session limit while implenting Phase 3. Please continue implementation.

CLAUDE: Now let's re-verify full coverage across all levels/locales to confirm zero missing keys.Zero missing keys across all 5 locales and every CEFR level. Now let's update the implementation doc to mark Phase 2 as done.Now let's mark Phase 2 as done with a summary of what was implemented.Phase 2 is now fully done and marked ✅ in the doc.

**This session:**

- Added the 2 missing keys (`category_a1_prepositions`, `category_a1_housing`) with translations to all 5 locale files
- Re-verified programmatically: **0 missing `category_${level}_${slug}` keys** across all 5 CEFR levels × 5 locales
- Updated `ai-docs/implementation/quiz-i18n-and-categories.md` — Phase 2 header and every bullet marked ✅ Done, with a record of what was actually implemented (including the A1 gap the original audit missed) and the two deliberately-untouched spots (Phase 3's `themeLabel()`, admin pages)

Phase 1 and Phase 2 are both complete now. Phase 3 (flashcard header: mode label vs. category breadcrumb, moving the `Ord`/`Uttrykk` label into `VocabFlashcardPage`'s own `cardType` state and making the `Studying: X` breadcrumb unconditional) is the next chunk of work whenever you want to pick it up — say the word and I'll start there.

ME: Continue

CLAUDE: Now let's update `VocabFlashcardPage.svelte` to compute the mode label internally from `cardType`, and remove the `title` prop's role in the header.Now let's update `VocabFlashcardPage.svelte` — remove the `title` prop, add the internal `modeLabel` derived from `cardType`, and update the header.Now add the `modeLabel` derived value. Let's place it near `cardType`/`effectiveMode` derivations.Now update the header markup:Now let's update `[level]/[category]/+page.svelte`.Now let's rewrite this file in full given the scope of changes.Now the template section:Now let's update `c/uttrykk/+page.svelte` to remove the `title="Uttrykk"` prop.The header text moved to the "Studying: X" breadcrumb, which will break a few e2e assertions checking `h1` for the category name. Let me fix those.
---

i18n cleanup script: script/cleanup-i18n.xxx should find items not used in src dir and clean up all files in messages directory.

---

- http://localhost:5173/norskproven has A2 and B1. I think I need to add B2 as well.
- For mobile, bottom navigation can be used?
- Mobile check
- How about Start free button rather than login?
- Grammtikk section for B2/C1
  This is different from Quiz.
  Quiz has one question by one question. For grammer questions, I'd like to show all the questions at once and user type or select answers.

- I also want to order src/lib/vocab-b2.json according to category field and merge vocab-b2-new.json to vocab-b2.json file according to category field.

## Vocab AI conversion

Format:

```
{
    "id": "",
    "norsk": "",
    "lemma": "",
    "english": "",
    "ukrainian": "",
    "spanish": "",
    "german": "",
    "example": "",
    "example_english": "",
    "example_ukrainian": "",
    "example_spanish": "",
    "example_german": "",
    "definition": "",
    "level": "C",
    "category": "",
    "part": ""
  },
```

1. Fill up norsk, definition feilds from pasted image(s).
2. When a norsk word has (m), change it to (en), since it is a hankjønn.
3. When a norsk word has (n), change it to (et), since it is a intetkjønn.
4. When a norsk word has (m/f), change it to (en/ei).
5. When a norsk word has (f), change it to (ei).
6. Separate one word and expression which are multiple words.
7. If a norsk word has the following (adj.), (v1), (ureg.), (adv.), (v1, v2), fill up `part` field with `adjective`, `verb`, `verb`, `adverb`, `verb` and remove (adj.), (v1), (ureg.), (adv.), (v1, v2) from a word. And if it is a verb, add `å ` in front of verb in `norsk` field. e.g. `å komme`.
8. Fill up lemma with a dictionary form of `norsk` field with out `(en)`, `(et)`, `(en/ei)` or `å`, etc. Only one word if it is not a expression (more than one word).
9. If norsk is an expression, the `norsk` and `lemma` fields are the same without any `(xx)`.
