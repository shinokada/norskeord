# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

When you do work, always keep what you have done in ai-docs/logs directory.

svelte mcp server is running.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

Transcribe attached Norwegian image(s) to markdown. Ignore any illustrations and hand-writings.
The images are HEIC files.
---

Note the followings:

- You do not run any scripts using Claude API. I will run it locally.
- Read data-rules/vocab-and-uttrykk.md when you classify vocab and uttrykk.
- Mind that a session can finish any time and outputs what you found or decided or write in the doc so that a next session can start from there.
- Or work in a small batch where it is necessary so that your work won't be lost due to session limit.
- Use `edit_file` to reduce risk rather than `write_file`.
- Always update your progress in the doc we are working.

The attached is from the previous session. Continue where you left.

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



---

Search has arrow up and down to navigate but in the dark-mode, it is hard to see the heighlighted row.

---

In http://localhost:5173/blog, if I click one of level and click a post and come back, the level and the posts should be have the same status. Is it a good idea? What do you think?

---

Transcribe attached Norwegian image(s) to markdown and append it to /Users/shinichiokada/Svelte/svelte-languages/norskeord/draft/c/i-samme-baat-arbeidsbok/questions.md.
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
