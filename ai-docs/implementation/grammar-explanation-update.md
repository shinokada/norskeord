---
title: grammar explanation-update
date: 2026-08-01
completed: true
---

# Grammar explanation update ✅ Completed

## Status (updated 2026-08-01)

**Problem A: ✅ Done** — component built, wired in, 3 dense rules migrated as examples, all pilot-review polish items applied.
**Problem B: ✅ Done** — all 10 prompts reworded, guardrail test added.

Remaining/open, for whenever you pick this back up:

- [x] Migrate the remaining unformatted rules to the paragraph/bullet/`**bold**` convention — **done, 106 of 108**. This session's batch (20 rules): `ikke-placement`, `det-er-ikke`, `v2-word-order`, `adj-comparison`, `refleksive-verb`, `ha-vs-vaere`, `personlige-pronomen`, `presens-verb`, `refleksive-uttrykk`, `imperativ`, `preteritum-a1`, `vaer-det-subjekt`, `for-siden`, `adj-farger-uboyelige`, `verbform-i-kontekst`, `perfektum-pluskvamperfektum`, `futurum-referert`, `leddsetning-som-fundament`, `omskriving-passiv`, `jo-desto-komparativ`. Verified with a `tsc --noEmit` parse check (only the expected unresolved `$lib/types` alias error, no syntax errors). The remaining 2 (`uttrykk-gjenkjenning-c-2`, `uttrykk-gjenkjenning-c-3`) were reviewed and deliberately left as single-paragraph strings — each is one atomic sentence with no natural paragraph/list split, so `ExplanationText`'s plain-`<p>` fallback is the right rendering for them.
- [ ] Spot-check in browser: `/grammar/ordfamilie-avledning?level=B1`, `/grammar/preposisjoner-sted`, `/grammar/nyanser-uttrykk`, and `/grammar/infinitiv-a1` (to confirm the reworded prompt reads well).
- [ ] Decide if the "Vis mer" collapse threshold (`LONG_THRESHOLD = 2` blocks) feels right in practice, or should be raised — see trade-off note in Problem A below.
- [x] Run `pnpm test:unit` to confirm the new `grammar-data.test.ts` guardrail passes — confirmed clean this session, along with `pnpm check` (both reported by you as passing with no problems).

## Goals

1. Make grammar rule explanations (`Hvorfor · …` panel in `AnswerReveal.svelte`) scannable instead of one dense paragraph.
2. Fix the confusing instruction on a small set of `transform` questions where learners type just the missing word instead of the full sentence the grading expects.

## Not a problem: file layout

No need for `grammar-a1.svelte` / `grammar-b1.svelte` / etc., and no need for one giant `grammar.svelte`. This is already solved:

- `src/routes/grammar/[topic]/+page.svelte` is a single dynamic route for every topic/level.
- `src/lib/grammar/rules.ts` is a data `Record<GrammarTopic, GrammarRule>` (one entry per topic, ~100 entries, all levels).
- `src/lib/data/grammar.json` holds the 1,894 practice questions, filtered by `cefr` at request time.

So the only real work is (a) how the explanation _text_ is authored/rendered, and (b) fixing the instruction wording bug below. No new routes or component-per-level split needed.

---

## Problem A — Explanation readability

**Root cause:** `GrammarRule.explanationNb` is a single plain string (e.g. `rules.ts` line ~120+), rendered as one `<p>` in `AnswerReveal.svelte`. No paragraph breaks, no lists, so multi-sentence rules like `ordfamilie-avledning` collapse into a wall of text.

**Chosen approach: lightweight paragraph/bullet markers (no new dependency).**

We discussed three options:

| Option                                                     | Pros                                                   | Cons                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| A. Markdown strings + renderer                             | Rich formatting available                              | New dependency, needs sanitizing, more power than needed |
| B. Structured fields (`summary`, `points[]`, `examples[]`) | Fully typed, most consistent styling                   | Biggest migration — reshapes a 121KB file / ~100 rules   |
| **C. Paragraph/bullet markers (chosen)**                   | No dependency, smallest diff, can migrate rule-by-rule | Only visual breaks, no semantic tagging                  |

**Why C:** it fixes the actual complaint (no line breaks, no lists) with the least risk, and doesn't require touching all ~100 rules at once — rules left as single-line strings render exactly as they do today, so it's safe to roll out incrementally.

### Implementation steps

1. **Add a small renderer** `src/lib/components/grammar/ExplanationText.svelte`:
   - Split `explanationNb` on `\n\n` → each chunk becomes a `<p>`.
   - Within a chunk, lines starting with `• ` become a `<ul><li>` group.
   - No markdown parsing, no HTML injection — plain string splitting only.
2. **Swap it in** `AnswerReveal.svelte`: replace `<p class="text-sm …">{ruleText}</p>` with `<ExplanationText text={ruleText} />`.
3. **Rewrite the highest-value rules first** in `rules.ts` — start with the ones that already read like a list (e.g. `ordfamilie-avledning`, which literally enumerates PERSON/PROSESS/RESULTAT and 5 suffix patterns). Insert `\n\n` between the general rule and each numbered/enumerable idea, and `• ` before each suffix example line.
4. **Leave the rest as-is** and convert opportunistically (e.g. whenever a rule is next touched for content reasons).
5. Add a short comment above `GRAMMAR_RULES` in `rules.ts` documenting the `\n\n` / `• ` convention so future rules are authored consistently.

**Open decision for you to confirm:** this doc assumes Option C above. If after seeing it rendered you want richer structure (bold terms, distinct "pattern" vs "example" styling) for specific rules, we migrate just those to Option B later — the two approaches aren't mutually exclusive.

### Pilot review — `ordfamilie-avledning` (rendered screenshot)

The paragraph/bullet split reads well. Follow-ups identified from reviewing the rendered result, before rolling this out to more rules:

**Quick wins (done):**

- Bold the key term at the start of each item in the suffix list (`**-ing:** dele ut → utdeling`) so it reads as a scannable reference table, not a flat list — it's currently visually identical to the 2-item PERSON/PROSESS/RESULTAT example list even though it's a different kind of content (lookup table vs. illustration). ✅ `ExplanationText.svelte` now supports inline `**bold**` (see updated convention below); suffix labels and the person/prosess/resultat terms in `ordfamilie-avledning` use it.
- Bump bullet marker contrast (`text-gray-400` → `text-gray-300`, or an indigo dot to match the page's existing accent color) — markers are currently faint against the dark card background. ✅ `<ul>` now uses `marker:text-indigo-400` to match the page's indigo accent.
- Drop the ALL-CAPS on PERSON/PROSESSEN/RESULTATET in the intro paragraph to normal case or bold — it was carrying the "these are the three slots" signal in the old single-paragraph version, but the list below it now does that job, so the caps read as redundant shouting. ✅ Changed to `**personen**`/`**prosessen**`/`**resultatet**` (bold, normal case) in `rules.ts`.

**Decisions needed before migrating the other ~99 rules (not urgent, but should be consistent):** ✅ both resolved and implemented

- Card length: `ordfamilie-avledning` is one of the densest rules and now renders as ~14 lines on every wrong answer. Decide whether that's fine for dense rules specifically, or whether there should be a shorter default + "vis mer" (show more) expand-on-demand for anything past a line threshold. → **Implemented:** `ExplanationText.svelte` now collapses to just the intro paragraph + a "Vis mer ↓" toggle whenever a rule has more than 2 blocks (`LONG_THRESHOLD = 2`). Simple single-paragraph rules never show the toggle. **Trade-off to be aware of:** on `ordfamilie-avledning` this now hides the suffix list and person/prosess/resultat examples behind a click by default, right after a wrong answer — worth watching whether that reduces how much people actually read vs. the uncollapsed version in the screenshot. Easy to raise/remove the threshold if it feels like it's hiding too much.
- Spacing rhythm: gap between two _distinct_ list blocks (PERSON/PROSESS/RESULTAT vs. the suffix list) currently matches the gap _within_ a single list's items — worth a bit more separation between blocks so the eye segments them as separate ideas. → **Implemented:** `<ul>` bottom margin increased to `mb-4` (was `mb-2`, same as paragraphs), while list items stay tightly grouped (`space-y-1`).

### Rules migrated so far

| Rule                                | Why picked                                                                                                                                                                                                | Blocks after migration |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `ordfamilie-avledning`              | Pilot — original complaint, screenshotted and reviewed                                                                                                                                                    | 7 (collapses)          |
| `preposisjoner-sted`                | Longest rule in the whole file (1,360 chars); term=definition shape suits `**bold**` bullets well                                                                                                         | 7 (collapses)          |
| `nyanser-uttrykk`                   | 3rd-densest; different shape (near-synonym comparison list) — good second test of the pattern                                                                                                             | 3 (collapses)          |
| `preposisjoner-tid`                 | Same term=definition shape as `preposisjoner-sted` (i/for…siden/om/til/på)                                                                                                                                | 3 (collapses)          |
| `modale-adverb`                     | 8-item adverb list (faktisk, egentlig, nok, vel, jo, kanskje/sikkert, visst, neppe) — good fit for bullets                                                                                                | 3 (collapses)          |
| `spesial-kvantorer`                 | Quantifier-pair list (ingen/all/hel/hver/begge), each with its own agreement rule                                                                                                                         | 2                      |
| `mene-synes-tro-tenke`              | 4-way near-synonym verb list (mene/synes/tro/tenke)                                                                                                                                                       | 2                      |
| `sannsynlighet-uttrykk`             | 5-item probability-expression list, graded by certainty                                                                                                                                                   | 3 (collapses)          |
| `motsetning-prefiks`                | 3-item negative-prefix list (u-/mis-/van-)                                                                                                                                                                | 2                      |
| `arsak-og-folge-uttrykk`            | 5-category cause/effect/purpose toolkit (subjunksjoner/adverb/årsaksverb/nominale uttrykk/hensiktssetninger)                                                                                              | 2                      |
| `kontrast-uttrykk`                  | 3-category contrast toolkit, same shape as `arsak-og-folge-uttrykk`                                                                                                                                       | 2                      |
| `indirekte-tale-at-om`              | 3-way at/om/spørreord split plus a trailing som-insertion rule                                                                                                                                            | 3 (collapses)          |
| `ubestemt-artikkel-c`               | Article-dropping exceptions across 5 sentence types (professions, uncountables, transport, faste uttrykk, optional-article verbs)                                                                         | 2                      |
| `preposisjoner-kroppsdel-uttrykk`   | Body-part idiom list (kaste et blikk på, ha en knapp på, etc.)                                                                                                                                            | 2                      |
| `preposisjoner-generelt-c`          | Advanced idiomatic preposition collocation list                                                                                                                                                           | 2                      |
| `preposisjoner-uttrykk-b2`          | High-frequency B2 preposition collocation list, distinct from the rarer C-level set above                                                                                                                 | 2                      |
| `det-formelt-subjekt`               | Three uses of formal/dummy «det» — placeholder subject, passive construction, cleft/emphasis «det er/var X som…»                                                                                          | 3 (collapses)          |
| `hypotetiske-betingelsessetninger`  | Three-way conditional gradation (real/unlikely/unrealized) plus a trailing wish-construction paragraph                                                                                                    | 3 (collapses)          |
| `sammensatte-substantiv-b2`         | Linking-consonant rules (-s-/-e-/none) for compound nouns, plus a separate adjective+noun vs. fused-compound paragraph                                                                                    | 3 (collapses)          |
| `subjunksjon-oversikt`              | 7-item subjunction list grouped by the meaning each introduces (time/cause/condition/concession/purpose/sequence/relative)                                                                                | 3 (collapses)          |
| `partisipp-former`                  | Two distinct concepts (presens partisipp behavior vs. perfektum partisipp agreement), plus a 2-item -ete/-ede vs. -ne inflection sub-rule                                                                 | 4 (collapses)          |
| `partikkelverb-los-fast`            | Two-paragraph split: general løst/fast-sammensatt meaning contrast, then the fixed-compound-participle-as-adjective note                                                                                  | 2                      |
| `adverbial-fronting`                | V2 inversion rule with 3 example patterns (simple verb, modal+infinitive, setningsadverbial exception) — longest unmigrated rule (589 chars)                                                              | 4 (collapses)          |
| `preteritum-perfektum-og-futurum`   | 3-way past-tense-sequencing contrast (preteritum perfektum / preteritum futurum / preteritum futurum perfektum)                                                                                           | 2                      |
| `infinitiv-a1`                      | 3-pattern split for the verb-after-verb rule (naken infinitiv / «å»-infinitiv / fast preposisjon + «å») — also on the browser spot-check list                                                             | 2                      |
| `helsetninger`                      | 5-pattern list for main-clause word order (declarative/yes-no/wh-question/negation/presentational det) — bullets also fix a labeling inconsistency in the original (said "four patterns" but listed five) | 2                      |
| `uttrykk-gjenkjenning-c-1`          | 2 idiom examples with meanings, plus a trailing note on the skill/scope                                                                                                                                   | 3 (collapses)          |
| `uttrykk-gjenkjenning-detgaarbra-c` | Same idiom-recognition shape as `uttrykk-gjenkjenning-c-1/2/3`, 2 examples from a different set                                                                                                           | 2                      |
| `motsetning-selv-om-likevel`        | 3-way contrast comparison (men / selv om / likevel), each with distinct grammar (coordination / subordination / adverb fronting)                                                                          | 2                      |
| `tidssekvens-etter-at-etterpaa`     | Same 3-way comparison shape as `motsetning-selv-om-likevel` (etter at / etterpå / så)                                                                                                                     | 2                      |
| `sammensatte-substantiv`            | 5-example compound-noun formation list, plus a trailing linking-form rule                                                                                                                                 | 3 (collapses)          |
| `refleksivt-possessiv-sin`          | 2-way possessive rule (sin/sitt/sine vs. hans/hennes) plus a compound-subject exception                                                                                                                   | 3 (collapses)          |
| `passiv-bli-s`                      | 2-way passive-voice contrast (bli-passiv vs. s-passiv) plus a when-to-use-passive note                                                                                                                    | 3 (collapses)          |
| `det-referanse`                     | Intro rule + 3 short examples of «det» referring back to a clause/adjective/verb phrase, plus a trailing note on why it breaks gender agreement                                                           | 3 (collapses)          |
| `da-naar`                           | 2-way past-tense contrast («da» for a single event vs. «når» for repeated/present/future), plus a trailing substitution test                                                                              | 3 (collapses)          |
| `substantivert-adjektiv`            | Intro rule + 3 nominalized-adjective examples, plus a trailing singular/plural reference note                                                                                                             | 3 (collapses)          |
| `modalverb-betydning`               | 4-way modal-verb meaning contrast (kan/skal/vil/må), plus a trailing example showing how they diverge in context                                                                                          | 3 (collapses)          |
| `presens-perfektum`                 | 2-way tense contrast (presens perfektum for open time frames vs. preteritum for closed past moments), plus a trailing negation-example note                                                               | 3 (collapses)          |
| `det-sentence`                      | 2-way cleft-sentence pattern («det er … at/å…» vs. «det er … som…»)                                                                                                                                       | 2                      |
| `hoflig-preteritum`                 | Intro rule + 4 politeness-softening examples, plus a trailing note distinguishing this from genuine past-time preteritum                                                                                  | 3 (collapses)          |
| `relative-som`                      | Intro rule + 2 supporting points (object-drop at a higher level, subordinate-clause adverb placement)                                                                                                     | 2                      |
| `setningsadverbial`                 | 2-way placement rule for sentence adverbials (main clause vs. subordinate clause) — same shape as the already-migrated `ikke-placement`                                                                   | 3 (collapses)          |
| `stedsadverb-statisk-dynamisk`      | Regrouped 9 location-adverb pairs into a static list and a dynamic list (originally paired inline)                                                                                                        | 3 (collapses)          |

(Also found already migrated from an earlier untracked session: `preposisjoner-uttrykk-b2`, `preposisjoner-generelt-c`, `preposisjoner-kroppsdel-uttrykk`, `ubestemt-artikkel-c` — now added to the table above.)

| `ordet-sa` | 3-way role split (konjunksjon/tidsadverb/subjunksjon) for the same word — each with different V2 behavior | 2 |
| `man-en-upersonlig-pronomen` | 2-way impersonal-pronoun split (man = subject-only vs. en = subject or object) | 3 (collapses) |
| `fa-perfektum-partisipp` | Resultative «få» + perfektum partisipp, 2 supporting examples, plus a trailing contrast with plain perfektum | 3 (collapses) |
| `koordinerende-konjunksjoner` | 5-item coordinating-conjunction meaning list (og/eller/men/for/så), plus the trailing comma rule | 3 (collapses) |
| `adj-mer-mest` | 4-category list of adjective classes that never take -ere/-est | 2 |
| `adj-agreement` | 2-way agreement pattern (ubestemt entall vs. flertall), plus a trailing irregular (liten) note | 3 (collapses) |
| `sterke-verb` | 7-verb strong-verb list, each with its preteritum and (added) perfektum partisipp form inline | 2 |
| `framtid-uttrykk` | 3-way future-expression split (skal/vil/kommer til å) plus a trailing fixed-expression bullet | 2 |
| `substantiv-uttrykk-c` | 6-item fixed-idiom list where the noun form is idiom-specific | 3 (collapses) |
| `adj-partisipp-som-adjektiv` | 3-item irregular predikativ-form list for participles used as adjectives | 3 (collapses) |
| `noun-plurals` | 4-pattern plural-formation list (-er / -r / unchanged / irregular) | 2 |
| `sterke-verb-c` | 7-verb rare-strong-verb list with preteritum/perfektum forms inline | 2 |
| `hvis-om-betingelse` | 2-way «hvis»/«om» split (condition vs. embedded yes/no question), same shape as the already-migrated `da-naar` | 3 (collapses) |
| `for-sa-arsak-folge` | 2-way «for»/«så» cause/result split | 2 |
| `bade-og-verken-eller` | 2-way positive/negative pairing split (både...og vs. verken...eller) | 2 |
| `svar-ja-jo-nei` | 2-way ja/nei vs. jo split, plus a trailing note on how short answers echo the finite verb | 3 (collapses) |
| `noun-articles` | 2-part gender/article rule plus the profession-drops-article exception | 2 |
| `plassering-verb` | 2-way placement-verb split (sette/legge = action vs. stå/ligge = resulting state) | 3 (collapses) |
| `derfor-fordi` | 2-way «derfor»/«fordi» split (result vs. cause), same shape as the already-migrated `for-sa-arsak-folge` | 2 |
| `ja-jo` | 2-way ja/jo split, the A1 twin of the already-migrated `svar-ja-jo-nei` | 2 |
| `modal-verb-order` | Bare-infinitiv rule plus the trailing subordinate-clause «ikke»-placement note | 2 |
| `subordinate-order` | 2-point subordinate-clause word-order rule (no inversion + adverb placement) | 2 |
| `pronomen-objektsform` | 7-pair subject→object pronoun list | 3 (collapses) |
| `adverb-sted-hjem` | 2-way static/dynamic adverb split (være-form vs. bevege seg-form), same shape as the already-migrated `stedsadverb-statisk-dynamisk` | 2 |
| `possessiver-min-din` | 3-item possessive-form list, plus the trailing word-order and non-inflecting-pronoun notes | 3 (collapses) |
| `noun-possessives` | Genitive -s rule plus the trailing no-apostrophe warning | 2 |
| `for-a-fordi` | 2-way «for å»/«fordi» split (purpose vs. cause), same shape as the already-migrated `derfor-fordi` | 2 |
| `ordenstall-dato` | Ordinal-formation rule plus the trailing date-format example | 2 |
| `synes-tror` | 2-way «synes»/«tror» split, a 2-item subset of the already-migrated `mene-synes-tro-tenke` | 2 |
| `klokka-tid` | «halv»-hour rule plus the trailing kvart/minutter pattern note | 2 |

**Final batch, this session (20 rules, completing the migration to 106 of 108):**

| Rule                          | Why picked                                                                                                                                  | Blocks after migration |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `ikke-placement`              | 2-way main/subordinate clause split for «ikke» placement — the foundational A1 rule, same shape as the already-migrated `setningsadverbial` | 2                      |
| `det-er-ikke`                 | Single fixed word-order rule; split into rule + "don't do this" note                                                                        | 2                      |
| `v2-word-order`               | The core V2 rule; split into rule / example / English contrast                                                                              | 3 (collapses)          |
| `adj-comparison`              | 4-item irregular comparative/superlative list (god, dårlig, gammel, liten)                                                                  | 2                      |
| `refleksive-verb`             | 5-pronoun reflexive-verb conjugation list (meg/deg/seg/oss/dere)                                                                            | 2                      |
| `ha-vs-vaere`                 | 2-way «ha»/«være» state-type split                                                                                                          | 3 (collapses)          |
| `personlige-pronomen`         | Single-idea A1 pronoun list; split into rule + example                                                                                      | 2                      |
| `presens-verb`                | Single-idea A1 present-tense rule; split into rule + English contrast                                                                       | 2                      |
| `refleksive-uttrykk`          | Single-idea reflexive-expression rule; split into rule + emphasis note                                                                      | 2                      |
| `imperativ`                   | Single-idea imperative rule with 2 examples, bulleted                                                                                       | 2                      |
| `preteritum-a1`               | 6-verb irregular preteritum list (være, ha, gå, komme, ta, si)                                                                              | 2                      |
| `vaer-det-subjekt`            | Single-idea impersonal «det» rule with 3 examples, bulleted                                                                                 | 2                      |
| `for-siden`                   | Single-idea «for … siden» rule with 2 examples, bulleted                                                                                    | 2                      |
| `adj-farger-uboyelige`        | Single-idea invariable-color-adjective rule; split into rule + example                                                                      | 2                      |
| `verbform-i-kontekst`         | C-level meta-rule; split into the actual grammar point + the content-sourcing note                                                          | 2                      |
| `perfektum-pluskvamperfektum` | C-level tense-choice challenge; split into the core claim + the specific trigger condition                                                  | 2                      |
| `futurum-referert`            | «2. futurum» evidential construction; split into rule + example                                                                             | 2                      |
| `leddsetning-som-fundament`   | Advanced fundament-placement rule; split into rule + the tricky consequence                                                                 | 2                      |
| `omskriving-passiv`           | Passive-paraphrase rule; split into rule/example + scope note                                                                               | 2                      |
| `jo-desto-komparativ`         | jo…desto correlative rule; split into rule/example + the V2-breaking note                                                                   | 2                      |

The remaining 2 rules (`uttrykk-gjenkjenning-c-2`, `uttrykk-gjenkjenning-c-3`) are single, atomic sentences with no natural paragraph or list split — reviewed and intentionally left as-is; `ExplanationText` falls back to one `<p>` when there's no `\n\n`, which is the correct rendering for them.

- Blank line (`\n\n`) = new paragraph.
- Line starting with `• ` = bullet item; consecutive bullet lines group into one list.
- `**text**` anywhere = bold — use for labeling a term/pattern (e.g. a suffix or one of the three PERSON/PROSESS/RESULTAT slots), not general emphasis.
- More than 2 blocks → auto-collapses behind "Vis mer"; only the first paragraph shows by default.

---

## Problem B — Confusing question instructions

**Audit result:** I copied `grammar.json` (1,894 questions) and checked it directly rather than guessing. This is **not** a widespread data problem — it's isolated to prompt wording:

- Questions of type `fill` (706 total) are fine: `answer` is always just the blank span (e.g. `"ikke er"`, `"diskriminering"`), matching `FillQuestion.svelte`'s "fill the blank" UI.
- Questions of type `transform` (436 total) always expect the **full rewritten sentence** as `answer` — this is correct and consistent (`TransformQuestion.svelte` shows a fixed header "Skriv om setningen" = "Rewrite the sentence").
- The bug: **10 of those 436** `transform` questions have a per-question `prompt` starting with "Fyll inn …" ("Fill in …"), which visually contradicts/undercuts the "Skriv om setningen" header right above it. A learner reasonably reads only the specific prompt and types just the word — exactly what happened with `gq-avled-014` ("Alle innbyggerne kjempet for (fri) etter krigen" → typed "frihet", expected "Alle innbyggerne kjempet for frihet etter krigen").

Affected question ids (all `type: transform`):

```
infinitiv-a1:          gq-infa1-003, gq-infa1-004, gq-infa1-010, gq-infa1-012, gq-infa1-015, gq-infa1-019
  prompt: "Fyll inn riktig form av verbet i parentes."
ordfamilie-avledning:  gq-avled-014, gq-avled-024, gq-avled-033 (substantiv/adjektiv), gq-avled-019 (adjektiv)
  prompt: "Fyll inn riktig substantivform av ordet i parentes." / "…adjektivform…"
```

**Fix (your call: reword the instruction, not the grading/data):**

1. In `grammar.json`, reword these 10 `prompt` strings to explicitly say "whole sentence", e.g.:
   - `"Fyll inn riktig form av verbet i parentes."` → `"Skriv hele setningen med riktig form av verbet i parentes."`
   - `"Fyll inn riktig substantivform av ordet i parentes."` → `"Skriv hele setningen med riktig substantivform av ordet i parentes."`
   - `"Fyll inn riktig adjektivform av ordet i parentes."` → `"Skriv hele setningen med riktig adjektivform av ordet i parentes."`
     ✅ **Done** — all 10 reworded. One gotcha hit along the way, worth remembering: that exact prompt string wasn't unique (7 `fill`-type questions elsewhere use the same wording legitimately), so the first attempt edited the wrong question (`gq-sv-013`, a `fill` type where "Fyll inn" is correct). Fixed by re-scoping each edit to `prompt` + that question's unique `source` line. Verified afterward: exactly 10 `transform` prompts now say "Skriv hele setningen…", `gq-sv-013` unchanged, and total question count still 1,894 (no duplication/loss).
2. No changes needed to `answer`/`alternates` (already full sentences), `session.ts` grading, or `TransformQuestion.svelte` — the fix is entirely in prompt copy.
3. **Guardrail so this doesn't recur:** add a short comment in `types.ts` above `GrammarQuestion.prompt` warning that for `type: 'transform'`, prompts must not start with "Fyll inn" (reads as single-word) — use "Skriv hele setningen …" instead. Optionally, a small unit test in `grammar-data.test.ts` asserting no `transform` question's prompt matches `/^Fyll inn/i`. ✅ **Done** — added `'transform question prompts never start with "Fyll inn"'` to `grammar-data.test.ts` (not yet run — see Status checklist above). Skipped the `types.ts` comment since the test covers it more reliably than a comment would.

---

## Rollout checklist

- [x] Build `ExplanationText.svelte`, wire into `AnswerReveal.svelte`
- [x] Rewrite `ordfamilie-avledning` explanation with `\n\n` / `• ` / `**bold**` markers as a pilot
- [x] Pilot review fixes: bold suffix labels, indigo bullet markers, drop ALL-CAPS, list spacing, "Vis mer" collapse for long rules, focus-ring consistency on the new toggle button
- [x] Rewrite 2 more dense rules (`preposisjoner-sted`, `nyanser-uttrykk`) to validate the pattern across different content shapes
- [x] Reword the 10 `transform` prompts listed above in `grammar.json`
- [x] Add the `grammar-data.test.ts` guardrail test
- [x] Run `pnpm test:unit` / `pnpm check` to confirm everything actually compiles and passes — confirmed clean this session
- [ ] Spot check `/grammar/ordfamilie-avledning?level=B1`, `/grammar/preposisjoner-sted`, `/grammar/nyanser-uttrykk`, `/grammar/infinitiv-a1` in the browser
- [x] Migrate remaining dense rules — **done, 106 of 108** (see "Rules migrated so far" / "Final batch" tables in Problem A). Only 2 single-sentence rules deliberately left unformatted.
- [x] Run `pnpm test:unit` / `pnpm check` again to confirm this session's edits still compile and pass — **confirmed, no problems**.

Optional follow-ups (not blocking — doc is done):

- Spot-check the 4 routes above in the browser at some point, just to eyeball the rendering.
- Revisit the "Vis mer" collapse threshold (`LONG_THRESHOLD = 2`) if it ever feels like it's hiding too much in practice.
