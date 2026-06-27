1. Need a script to check data json file if it follows the rules:
   The following applied to `norsk` field. For `lemma` field all should be dictionary form.

1. Nouns: Show the dictionary form with gender in parentheses, e.g. hus (et). This tells learners whether the noun is en, et, or ei, which is the most important information after the word itself.
1. Verbs: Show the infinitive with å, e.g. å få. This is the standard dictionary form and clearly identifies it as a verb.
1. Adjectives: Show the dictionary form, e.g. glad. Inflected forms are better covered in grammar lessons.

Examples: hus (et), å få, glad.

---

ME: I have a question about src/lib/data/vocab-xx.json and uttrykk-xx.json files. The following is for my vocab entry rules:

```

The following applied to `norsk` field. For `lemma` field all should be dictionary form.

1. Nouns: Show the dictionary form with gender in parentheses, e.g. hus (et). This tells learners whether the noun is en, et, or ei, which is the most important information after the word itself.
2. Verbs: Show the infinitive with å, e.g. å få. This is the standard dictionary form and clearly identifies it as a verb.
3. Adjectives: Show the dictionary form, e.g. glad. Inflected forms are better covered in grammar lessons.
4. vocab-xx.json file should have id with v-a1-classroom-001.
v: vocab
a1: level (a1|a2|b1|b2|c)
classroom: CATEGORIES_BY_LEVEL in config.js
xxx: 3 digits

Examples: hus (et), å få, glad.
```

My idea is that lemmas in vocab-xx.json files should be a dictionary word. But all vocab-xx.json has `"part": "phrase"` and lemmas have multiple words. What is the best way?

1. move all multiple words to uttrykk-xx.json.
2. keep it as it is.
3. case by case.
   Which one do you recommend and why? Do you have better ideas?

CLAUDE:
This is a good data architecture question. Let me look at what's actually in there before giving a recommendation.Good, now I have a clear picture. Here's my recommendation:

**Option 3 (case by case) — but with a principled rule, not ad hoc decisions.**

The key distinction isn't "single word vs multi-word" — it's **whether the phrase is a fixed expression whose meaning is more than the sum of its parts, vs a collocational compound that is essentially a named concept.**

Two different things are currently lumped together under `"part": "phrase"`:

**Type A — Fixed expressions / idioms / discourse markers** → belong in `uttrykk`
These are phrases learners encounter as chunks and need to learn as a unit because the meaning isn't fully compositional. Examples:

- `ha det bra`, `god morgen`, `til fots` (A1 greetings/transport)
- `etter min mening`, `på den andre siden` (B1 opinions/reasoning)
- `alt i alt`, `det vil si`, `forutsatt at` (B2 discourse markers)
- `med utgangspunkt i`, `i lys av` (C formal writing)
- All the proverbs

**Type B — Compound concepts / collocations** → fine to keep in `vocab`
These are multi-word but they're really just a noun phrase naming a concept. The meaning is transparent and compositional. They function like lexical items, not formulaic chunks. Examples:

- `biologisk mangfold`, `fornybar energi`, `global oppvarming` (B1 environment)
- `kunstig intelligens`, `vitenskapelig metode` (B1)
- `akademisk diskurs`, `kvalitativ metode`, `teoretisk rammeverk` (B2 academic)
- `digital infrastruktur`, `sirkulær økonomi` (B2)
- `et nevralt nettverk` (C)

For Type B the `lemma` is unproblematic — it's the same as `norsk`, and that's fine. There's no inflection ambiguity the way there is with a verb or noun. The `part` field could arguably be changed from `"phrase"` to `"noun"` for most of them (since `biologisk mangfold` is effectively a noun), but that's a separate cleanup.

**What I'd actually do:**

1. Keep all Type B compound concepts in `vocab-xx.json` as-is (or relabel `part` to their actual grammatical category — most are `"noun"`).
2. Migrate Type A fixed expressions to `uttrykk-xx.json` — but only do it if you have a concrete reason to (e.g. they're showing up in the wrong flashcard mode, or it breaks FSRS grouping). Don't do a mass migration just for tidiness.
3. For `lemma` specifically: for compound nouns the lemma convention is the same phrase, which is fine. For fixed expressions in uttrykk, the current convention for `lemma` probably should be the infinitive of the main verb or the base form — worth deciding what you want there before migrating.

The pragmatic answer: **the data quality risk of a bulk migration is high and the benefit is low** unless the app actually treats `vocab` and `uttrykk` differently in ways that matter to the learner (different flashcard modes, different quiz types, etc.). If it does, then the Type A expressions are genuinely misclassified and worth moving. If the distinction is mostly organisational, leave them where they are.
