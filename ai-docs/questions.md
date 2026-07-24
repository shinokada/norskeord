# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

svelte mcp server is running.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

ME: I have the pasted image at http://localhost:5173/plus and I'm wondering if I need this section. What do you think?

CLAUDE: I pulled up the actual `/plus` page and the guide page to see how this section fits in context — worth noting a few things before answering:

**What I found:**

1. **Two of the three cards aren't actually Plus differentiators.** "Rate each card" and "Timing adjusts automatically" describe the free FSRS algorithm — every user gets this, paid or not. Only the third card ("Your Due today deck") is Plus-gated. So a section titled "How smart review works" on a _pricing page_ spends 2/3 of its real estate explaining something that isn't for sale.

2. **It's redundant with content already on the page.** The comparison table right below it already has rows for `plus_row_rating` ("Rate each card after flipping" — Included for both) and `plus_row_due` ("Due today smart deck" — Plus only). Same information, more compact.

3. **It's redundant with `/guide`.** Your guide page has a full "How smart scheduling works" section that covers this in more depth — including the Again/Hard/Good/Easy breakdown and a "Plus tip" callout pointing back to the Due today deck. So a visitor could hit this explanation twice.

**My take:** I'd cut or shrink it. On a page whose whole job is "convince me to pay," a generic algorithm explainer that's mostly _not_ about the paid feature dilutes the pitch — someone skimming could easily read "How smart review works" → 3 cards → assume smart review itself is a differentiator, when it's really just the curation layer on top that's paid.

A few ways to fix it depending on what you want:

- **Cut it entirely.** Link to `/guide` for people who want the mechanics; let the comparison table carry the "rate a card / due today" facts. Fastest option.
- **Shrink to one card.** Keep only the Due today deck card, reframed as a Plus feature highlight (it'd fit naturally into the `plusFeatures` grid below instead of its own section).
- **Keep three cards but reframe explicitly** as "Free" → "Free" → "Plus" progression, so it reads as "here's what everyone gets, here's what Plus adds" rather than implying all three are part of the pitch.

If this section exists because `/plus` gets a lot of cold traffic from the homepage (`home_hero_cta_plus`) who've never used the app and don't know what FSRS-style review even is, there's an argument for keeping a light version for orientation — but I'd still trim it to make the Plus-only card visually distinct from the two free ones rather than presenting all three as equal parts of "how it works."

ME: I think Free VS Plus section has "Due today smart deck", so I think we can cut it entirely. What do you think?

CLAUDE: Agreed — that's the cleanest option.

The comparison table already has `plus_row_due` ("Due today smart deck": Free `—`, Plus `Included`), so cutting the three-card section doesn't lose any information — it just removes the duplicate (and the two free-tier cards that were diluting the pitch). Anyone who wants the mechanics explained in depth still has `/guide`.

Want me to make the edit? It'd mean:

1. Removing the `howItWorks` block (the `$derived` array + its markup) from `/plus/+page.svelte`
2. Leaving the `plus_how_*` message keys in `en.json` (and other locale files) alone for now unless you want them cleaned up too — happy to remove those as well if you'd rather not carry dead translation keys

Let me know and I'll make the change.

ME: Please cleanup `plus_how_*`messages keys in all locale files as well.

CLAUDE: Now the other four locale files. Let me check their key ordering/content first.Now es.json, de.json, uk.json. Let me find the exact block in each by searching around `plus_row_support_plus`.Now de.json and uk.json.Now uk.json.
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
