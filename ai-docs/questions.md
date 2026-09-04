# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

When you do work, always keep what you have done in ai-docs/logs directory.

svelte mcp server is running.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

---

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

Transcribe attached Norwegian image(s) to markdown and append only the content to /Users/shinichiokada/Svelte/svelte-languages/norskeord/draft/b2/paa-nivaa/arbeidsbok-b2-fasit.md.

Ignore any illustrations. But if an image is related to a question and it is word(s), then include it in the question.

---

Create new articles/posts from draft/posts directory. Do not avoid repetition and be concise.

---

Classifying CEFR levels:
Use cefr/assessment.pdf to classify CEFR levels. In this app, I use level C for C1 and C2.

---

kran and skall are exact duplicates but sitting oddly at level C in production for what are pretty basic words (tap, shell)

---

---

Should I change /stats url to /progress or /my-progress? What do you think?
---


---





---

ME: 

CLAUDE: 

ME: 

CLAUDE: 

ME: 

CLAUDE: 

---

Please read ai-docs/implementation/new-vocab-uttrykk-pipeline.md. Please see draft/new-entries/24 directory for your reference.

I added draft/new-entries/24/source-list.md. Can you start Stage 1?
Ignore titles/headings.

I was working on draft/new-entries/24 directory.
The following is from a previous session. Please continue where you left.

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

---

Transcribe attached Norwegian image(s) to markdown. Ignore any illustrations and hand-writings.
If an image is related to a question and it is word(s), then include it in the question.

The images are HEIC files.

Transcribe attached Norwegian image(s) to markdown and append only the content to /Users/shinichiokada/Svelte/svelte-languages/norskeord/draft/b2/paa-nivaa/arbeidsbok-b2.md.

Transcribe attached images without fill up or write answers.
Ignore images, illustrations, image captions, and hand-writing.

---

- http://localhost:5173/norskproven has A2 and B1. I think I need to add B2 as well.
- For mobile, bottom navigation can be used?
- Mobile check
- How about Start free button rather than login?

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

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:

ME:

CLAUDE:
