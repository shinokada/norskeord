# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.
---
The level C categories are defined in src/lib/config.ts as `const CATEGORIES_BY_LEVEL`. 

1. If example is there just translate it to example_english, example_spanish, example_german, example_ukrainian.
2. If `example` is there, find a related category from level C category
3. Does the following level C categories cover to create a new example?
---

I used scripts/enrich-vocab.mjs last time. The outputs have many diacritic issues. I also have scripts/add-language-translations.mjs.
My goal is to transform draft/c/vocab-uttrykk/extracted-uttrykk-c.json and extracted-vocab-c.json into the format of src/lib/data/uttrykk-c.json and vocab-c.json so that I can merge it later.

I create STEP 2 in ai-docs/instructions/image-converter-c.md before.

I'm wondering which script should I use to achieve my goal with as less mistakes as possible. Should I create a new script? What do you think?

---
The draft/c/grammatikk.md explaing grammar for Nivå C. substantiv.md and ubestemt-artikkel.md have questions for substantiv and ubestemt artikkel grammar points. You can find answers in answers.md.
I'd like to create Nivå C grammar questions. You can find src/lib/grammar directory for more details. 
I don't need a lot of questions but a good number of questions to cover as many as possible.
1. The questions are from a textbook. Can I use some of them?
2. How many questions are appropiate?
Do you have any more suggestions?
Do not create questions yet. Let's discuss first.

I will be adding more in draft/c directory and you can find it in draft/c/innhold.md.

svelte mcp server is running.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

No long paragraphs, academic-style explanations, and walls of text. Users on a learning app want quick, scannable answers, not essays.

You should be able to use Edit_File. Use Edit_File when you are modifying a large file.
Please do not use Write_file, it takes time. Instead can you write a script to update file(s) rather than rewrite whole file(s)? I can run the script locally and in that way, the session limit won't be over-used.

The Filesystem tool can read it but str_replace can't find it. You need to read it fully and rewrite it. In this case, if the file is big and the rewrite is just adding lines or simple replacement, please output it with instruction or create a downloadable file or write Python or mjs script so that I can do it. Because your Write File operation has to rewrite whole file and it takes time to complete.

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
