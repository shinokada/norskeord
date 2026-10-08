# Free items

Target policy (decided 2026-10-08; code, tests and `ai-docs/gating-rules.md` updated, copy and `/my-progress` still to do — see
`ai-docs/implementation/free-tier-simplification.md`): **A1 is free in full; every higher level gets the same
small taste.** The three free categories at each level are the same for Vocab and Quiz.

Picking rule (confirmed 2026-10-08): 20 to 40 cards per category, a concrete topic, a slug that is unique
across levels, and quiz cards available. Travel at B1 (80 cards) is the one deliberate exception, as the
most-visited B1 category. Free cards: A2 71, B1 152, B2 89, C 67.

| Level | Vocab                                             | Uttrykk | Grammar | Quiz                                              | Blog | Norskprøven |
| ----- | ------------------------------------------------- | ------- | ------- | ------------------------------------------------- | ---- | ----------- |
| A1    | All                                               | All     | All     | All                                               | All  | —           |
| A2    | 3: money, clothing, weather                       | 0       | 0       | 3: money, clothing, weather                       | All  | Test 1      |
| B1    | 3: travel, environment, technology                | 0       | 0       | 3: travel, environment, technology                | All  | Test 1      |
| B2    | 3: discourse-markers, science, literature         | 0       | 0       | 3: discourse-markers, science, literature         | All  | —           |
| C     | 3: academic, architecture-design, character-types | 0*      | 0       | 3: academic, architecture-design, character-types | All  | —           |

## Changes from today

| Area           | Today                                                                                | Target                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Vocab A2       | All 22 categories free                                                               | 3 free (money, clothing, weather)                                                                                                           |
| Vocab B1       | 10 free                                                                              | 3 free (work, media, culture, relationships, education, health, society-nouns become Plus)                                                  |
| Vocab B2       | 4 free (politics, economics, social-issues, science)                                 | 3 free (politics, economics, social-issues become Plus; science stays free)                                                                 |
| Vocab C        | 5 free (philosophy, academic, formal-writing, rhetoric, complex-emotions-adjectives) | 3 free (philosophy, formal-writing, rhetoric, complex-emotions-adjectives become Plus; architecture-design and character-types become free) |
| Uttrykk A2–B2  | 2 / 3 / 2 free themes                                                                | 0                                                                                                                                           |
| Grammar A2, B1 | 2 legacy free topics each                                                            | 0                                                                                                                                           |
| Quiz           | 3 per level                                                                          | A1 all; A2–C the same 3 as Vocab                                                                                                            |
| Norskprøven    | Test 1 free at A2 and B1                                                             | Unchanged                                                                                                                                   |

## Decisions

- Norskprøven Test 1 stays free at A2 and B1 (confirmed).
- \* C has no separate uttrykk deck: its idioms sit inside the vocab categories. The 3 free C categories open
  in full, which includes their idioms. Today that is 2 idioms, both in `academic` (`architecture-design` and
  `character-types` have none). Accepted 2026-10-08; not filtered. Every other C idiom stays Plus.
- No announcement; one line on `/plus` states the new rules. See the plan doc.

## Sources (current code)

- Vocab: `FREE_VOCAB_CATEGORIES` in `src/lib/config.ts`; `PLUS_CATEGORIES` is generated from it.
- Uttrykk: `FREE_UTTRYKK_THEMES` and `isFreeUttrykkTheme` in `src/lib/uttrykk-gating.ts`.
- Grammar: `FREE_GRAMMAR_TOPICS` in `src/lib/config.ts`; policy in `ai-docs/gating-rules.md`.
- Quiz: `FREE_QUIZ_CATEGORIES` in `src/lib/config.ts`.
- Norskprøven: `isFreeTest` in `src/lib/access.ts`.
- Blog: all free.
