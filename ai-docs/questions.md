# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

svelte mcp server is running.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

I'm working on Phase 2 in ai-docs/implementation/a2-quiz-and-grammar.md and finished up to "9. `relative-som`". Please continue "10. `ikke-placement`". You do it one by one and add ✅ Done in the doc when you finish an item.

---

I created an empty ai-docs/implementation/quiz-with-only-norsk.md file to write implementation plan.

1. Quiz category names should be norwegian or use i18n. We need to update `category` feild to Norwegian and related files, config.ts, test files, scripts directory files, src/routes/api/progress-report,

2. Many quiz questions have English. How can I improve so that questions is only Norwegian. For Level A1/A2/B1, can we use spanish, ukrainian, german, norsk, english i18n fields for multiple choice and hints?
   Or use the definition field?
   Re

```
Skriv det norske ordet for

"to fetch / pick up"
```

```
å slutte — to finish / stop
```

```
A
warm / hot
✓
B
a door
C
red
✗
D
to want
```

```
Skriv det norske ordet for

"empty"
```

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
