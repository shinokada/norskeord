# Nivå B2 Grammar — Implementation Plan

## Overview

Coverage of `draft/b2/noekler-til-norge/grammatikk.md` (6 chapters, "Nøkler til Norge" grammar
workbook). Same pattern as every prior level plan (`a1-quiz-and-grammar.md` /
`a2-quiz-and-grammar.md` / `b1-grammar.md` / `c-grammar.md`): reuse existing topic buckets where
the workbook is testing a point the app already covers (just at higher complexity/density), and
add new topics only for genuinely new grammar points.

**Starting point:** B2 currently has almost no dedicated content — only 7 questions across 2
topics (`relative-som` ×2, `svar-ja-jo-nei` ×5), confirmed directly against `grammar.json`. This
plan is effectively a from-scratch B2 buildout, not an extension pass.

**Language of new content:** per `ai-docs/implementation/grammar-with-only-norsk.md` (already
resolved for every level, B2 included), all `prompt`/`hint`/`explanation` text is written directly
in Norwegian from the start — no English drafting pass, no locale switching.

**Copyright approach (unchanged from every prior plan):** every question is newly written, using
the textbook only to identify which rule and difficulty to target — never copying or closely
paraphrasing its sentences or reusing its recurring characters (Ulrik, Sandra, Gulale, Leo, Felix,
Gølin, Ari, etc. — invent fresh names/sentences).

**Vocab integration:** every question should use real B2 vocabulary (`vocab-b2.json` /
`uttrykk-b2.json`), verified by a new script following the established pattern.

**Question types:** `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'` already
cover everything needed here — no schema changes required.

---

## Scope decisions

### Topic granularity: 10 new topics + 13 reused topic-touches (23 topic-touches total)

Mapping the workbook chapter by chapter (full source read — all 6 chapters):

**Genuinely new grammar points, not covered by any existing topic:**

| New topic                | Source (ch.) | Notes                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `substantivert-adjektiv` | 1            | Adjective standing alone as a noun referring to a group of people, with the foranstilt bestemmer (den/det/de) and weak adjective ending: "de unge," "de fattige," "den ansatte." Distinct from `adj-definite` (adjective still modifying a following noun).                                            |
| `motsetning-prefiks`     | 2            | Forming an antonym with a negative prefix (u-, mis-, van-) rather than a different word: gift → **u**gift, lykke → **u**lykke, fornøyd → **mis**fornøyd, trives → **mis**trives, forstå → **mis**forstå.                                                                                               |
| `subjunksjon-oversikt`   | 3            | Choosing the correct subjunction from a large open set (da, etter at, for at, fordi, før, hvis, når, med mindre, selv om, som) based on meaning — a synthesis skill that draws on several B1 pair-topics (`da-naar`, `hvis-om-betingelse`, etc.) at once instead of choosing between just two options. |
| `partisipp-former`       | 4            | Forming and using presens partisipp (-ende, as a manner adverbial reducing a "mens"-clause: "Han kom løpende") and perfektum partisipp used adjectivally with agreement ("de ansatte," "en forberedt presentasjon").                                                                                   |
| `partikkelverb-los-fast` | 4            | Norwegian particle verbs: loose vs. fixed compound (sette over / oversette — different meanings), particle-verb synonym swaps (å innstille = å avslå = å stå opp, etc.), and fixed compound perfektum partisipp forms of particle verbs (påkjørt, nedsatt, utgått).                                    |
| `modalverb-betydning`    | 5            | Choosing which modal verb (kan/skal/vil/må) fits a context based on meaning (ability, plan/obligation, desire, necessity) — distinct from `modalverb-preteritum` (past-tense forms) and `modal-verb-order` (word order).                                                                               |
| `sannsynlighet-uttrykk`  | 5            | Paraphrasing between different ways of expressing probability/likelihood: "det er mulig at," "det er sannsynlig at," "det kommer til å," "det kan hende at," "jeg tror/antar."                                                                                                                         |
| `bli-presens-partisipp`  | 5            | `bli` + presens partisipp to emphasize that an action is protracted/ongoing in time: "Han må bli boende i Bergen," "De ble sittende og snakke."                                                                                                                                                        |
| `fa-perfektum-partisipp` | 5            | `få` + perfektum partisipp, the resultative construction focusing on completion of an action: "Fikk du lest avisa?", "Du må få levert artikkelen før fire."                                                                                                                                            |
| `mene-synes-tro-tenke`   | 6            | Choosing among the near-synonym opinion verbs mene/synes/tro/tenke, which overlap in English ("think") but aren't interchangeable in Norwegian (mene = hold a position, synes = have an impression/reaction, tro = believe/guess, tenke = ponder/have in mind).                                        |

**Reused topics (add `cefr: 'B2'` entries to existing buckets):**

| Topic                           | Source (ch.) | B2 item                                                                                                                                                                                                                                           |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `noun-plurals`                  | 1            | Singular → plural rewriting with an adjective present, matched definiteness.                                                                                                                                                                      |
| `adj-agreement`                 | 1            | Adjective agreeing across the singular→plural rewrite from the same exercise.                                                                                                                                                                     |
| `kvantorer`                     | 1            | Rewriting with a plural determiner (mange, noen, flere) inserted — B2 density, longer sentences.                                                                                                                                                  |
| `noun-articles`                 | 1            | Choosing ubestemt vs. bestemt form (entall/flertall) in a longer running text (7 blanks) rather than isolated sentences.                                                                                                                          |
| `ordfamilie-avledning`          | 2            | Extensive B2 batch: missing-word-in-family tables, sentence-pair paraphrase via a derived word, and the **agent/process/result** three-way noun distinction (en produsent / en produksjon / et produkt) — needs a rule-text addition (see below). |
| `setningsadverbial`             | 3            | Placing a setningsadverbial correctly _inside a leddsetning_, with B1's simpler placements now embedded in longer, multi-clause B2 sentences.                                                                                                     |
| `adverbial-fronting`            | 3            | Fronting an entire subordinate clause to the front field and adjusting main-clause word order accordingly (not just a single adverb).                                                                                                             |
| `derfor-fordi`                  | 3            | More sentence-combination density: same rule, longer/more abstract B2 content.                                                                                                                                                                    |
| `motsetning-selv-om-likevel`    | 3            | Sentence-combination version (not just an isolated sentence): join two full sentences with selv om / likevel.                                                                                                                                     |
| `tidssekvens-etter-at-etterpaa` | 3            | `etter at` combined with a tense choice (presens perfektum vs. pluskvamperfektum) depending on whether the surrounding narration is present or past — a B2-level layer on top of B1's basic pattern.                                              |
| `adjektiv-eller-adverb`         | 5            | The B1 topic's own worked example (sikker/sikkert) reused almost verbatim by the textbook — add B2-density entries (sikker/sikkert/sikre agreement, longer sentences).                                                                            |
| `passiv-bli-s`                  | 5            | Modal + s-passiv infinitiv ("må leveres," "kan bestilles") and full active→passive sentence rewriting with a modal verb present — extends B1's introductory passive into modal combinations.                                                      |
| `indirekte-tale-at-om`          | 6            | Large B2 batch: reporting statements/yes-no questions/wh-questions (with the som-subject rule already documented at B1), reporting an imperative via a modal verb (skal/må/bør), and the `lurer på` vs. `vil vite` verb choice.                   |

**Not built as grammar questions (analysis/production tasks, not exercise material):**

- Ch. 1 "Substantivfraser" — pair-work task to underline/identify noun phrases in running text;
  doesn't fit the per-question schema and isn't testing a single rule.
- Ch. 3 "Et ledd i en helsetning, del A" — underline-the-leddsetning identification task (the
  paired "fill in the correct subjunction" half of the same exercise **is** built, as
  `subjunksjon-oversikt`).
- Ch. 6, item 27 — free-form ~150-word summary-writing task; not a gradable single-answer item.

Same treatment as every prior plan: these feed nothing into `grammar.json`.

**Total: 10 new topics + 13 reused topic-touches = 23 topic-touches.** At roughly 8–12 questions
per touch (same density as B1/C), this targets **~200–260 questions.**

---

## Rule text additions needed for reused topics (Phase 1, before Phase 2 content)

One reused topic needs a short addition to its existing `explanationNb` (and `explanationEn` for
consistency, though it's unused at runtime) before B2 entries can be written against it:

1. **`ordfamilie-avledning`** — add the agent/process/result three-way noun pattern: within one
   word family, Norwegian often has a separate noun for the **person** doing something, the
   **process/activity** itself, and the **result/product** of it — "en produsent" (person) / "en
   produksjon" (process) / "et produkt" (result); "en baker" / "en/ei baking" / "en bakst." Not
   every verb has all three as distinct words (some family members double up, e.g. "en/ei bygging"
   vs. "en/ei bygning" contrasting process vs. the physical building itself), so the exercise is
   about picking the right one for the sentence's meaning, not just conjugating a fixed pattern.

No other reused topic needs a content addition — the rest are the same rule at higher sentence
complexity/density, which the existing `explanationNb` already states correctly; only new example
sentences are needed, not new rule text.

---

## Rule drafts (`src/lib/grammar/rules.ts`) — 10 new topics

```typescript
'substantivert-adjektiv': {
  id: 'substantivert-adjektiv',
  titleEn: 'Nominalized adjectives (de unge, de fattige)',
  titleNb: 'Substantiverte adjektiv',
  explanationEn:
    'An adjective can stand alone as a noun referring to a group or type of people, using the ' +
    'same foranstilt bestemmer + weak adjective ending as normal definite noun phrases, but with ' +
    'no noun following: "de unge" (young people), "de fattige" (the poor), "den ansatte" (the ' +
    'employee). Singular "den"/"det" + adjective can refer to one person or an abstract quality ' +
    'depending on context; plural "de" + adjective always refers to a group of people.',
  explanationNb:
    'Et adjektiv kan stå alene som et substantiv og referere til en gruppe eller type mennesker, ' +
    'med samme foranstilte bestemmer + svak adjektivending som i vanlige bestemte substantivfraser, ' +
    'men uten et substantiv etter: «de unge», «de fattige», «den ansatte». Entall «den»/«det» + ' +
    'adjektiv kan vise til én person eller en abstrakt egenskap avhengig av sammenhengen; flertall ' +
    '«de» + adjektiv viser alltid til en gruppe mennesker.'
},

'motsetning-prefiks': {
  id: 'motsetning-prefiks',
  titleEn: 'Forming opposites with a negative prefix',
  titleNb: 'Å lage motsetninger med prefiks',
  explanationEn:
    'Several negative prefixes turn a word into its opposite instead of a different word ' +
    'entirely: «u-» (gift → ugift, lykke → ulykke, fornøyd → ufornøyd), «mis-» (fornøyd → ' +
    'misfornøyd, lykkes → mislykkes, forstå → misforstå, trives → mistrives), «van-» (vane → ' +
    'uvane, but also fixed forms like vanskjøtte). Which prefix fits depends on the specific ' +
    'word — this is lexical, not a single universal rule, so it must be checked word by word.',
  explanationNb:
    'Flere negative prefiks gjør et ord om til sin motsetning i stedet for et helt annet ord: ' +
    '«u-» (gift → ugift, lykke → ulykke, fornøyd → ufornøyd), «mis-» (fornøyd → misfornøyd, ' +
    'lykkes → mislykkes, forstå → misforstå, trives → mistrives), «van-» (blant annet i faste ' +
    'former som vanskjøtte). Hvilket prefiks som passer, avhenger av det enkelte ordet — dette er ' +
    'leksikalsk, ikke én universell regel, så det må sjekkes ord for ord.'
},

'subjunksjon-oversikt': {
  id: 'subjunksjon-oversikt',
  titleEn: 'Choosing among many subjunctions',
  titleNb: 'Å velge riktig subjunksjon',
  explanationEn:
    'Norwegian has many subjunctions that each introduce a leddsetning with a specific meaning: ' +
    '«da»/«når» (time), «fordi» (cause), «hvis»/«med mindre» (condition, incl. negative ' +
    'condition = "unless"), «selv om» (concession), «for at» (purpose, distinct from «fordi»), ' +
    '«før»/«etter at» (sequence), «som» (relative). Choosing correctly means reading the whole ' +
    'sentence for meaning first, then picking the subjunction that matches — several of these ' +
    'can superficially look interchangeable but express a completely different logical relation.',
  explanationNb:
    'Norsk har mange subjunksjoner som hver innleder en leddsetning med en bestemt betydning: ' +
    '«da»/«når» (tid), «fordi» (årsak), «hvis»/«med mindre» (betingelse, inkl. negativ betingelse ' +
    '= «unless»), «selv om» (innrømmelse), «for at» (hensikt, ulikt «fordi»), «før»/«etter at» ' +
    '(rekkefølge), «som» (relativ). Å velge riktig betyr å lese hele setningen for betydning ' +
    'først, og så velge subjunksjonen som passer — flere av disse kan se like ut ved første ' +
    'blikk, men uttrykker en helt ulik logisk sammenheng.'
},

'partisipp-former': {
  id: 'partisipp-former',
  titleEn: 'Presens partisipp and perfektum partisipp as adjective/adverbial',
  titleNb: 'Presens partisipp og perfektum partisipp som adjektiv/adverbial',
  explanationEn:
    'Presens partisipp (verb stem + -ende) can replace a «mens»-clause to describe manner: "Han ' +
    'løp hjem mens han skrek" → "Han løp skrikende hjem." It never inflects. Perfektum partisipp ' +
    'used adjectivally (den ansatte, en forberedt presentasjon) DOES inflect for agreement, like ' +
    'a normal adjective, unlike its use in perfektum tense (har ansatt) where it never inflects.',
  explanationNb:
    'Presens partisipp (verbstamme + -ende) kan erstatte en «mens»-setning for å beskrive måte: ' +
    '«Han løp hjem mens han skrek» → «Han løp skrikende hjem.» Det bøyes aldri. Perfektum ' +
    'partisipp brukt som adjektiv (den ansatte, en forberedt presentasjon) BØYES i samsvar, som ' +
    'et vanlig adjektiv — ulikt bruken i perfektum tid (har ansatt), der det aldri bøyes.'
},

'partikkelverb-los-fast': {
  id: 'partikkelverb-los-fast',
  titleEn: 'Particle verbs — loose vs. fixed compound',
  titleNb: 'Partikkelverb — løst eller fast sammensatt',
  explanationEn:
    'A particle verb written as two words (løst sammensatt: "sette over") usually has a literal, ' +
    'compositional meaning, while the same words written as one fixed compound (fast sammensatt: ' +
    '"oversette") often has a different, idiomatic meaning: "sette over kaffe" (brew coffee) vs. ' +
    '"oversette en bok" (translate a book). The stress pattern differs too — spoken emphasis on ' +
    'the particle for the loose form. Some particle verbs also form a fixed compound perfektum ' +
    'partisipp used adjectivally: "påkjørt" (run over), "nedsatt" (reduced), "utgått" (expired).',
  explanationNb:
    'Et partikkelverb skrevet som to ord (løst sammensatt: «sette over») har vanligvis en ' +
    'bokstavelig betydning, mens de samme ordene skrevet som ett fast sammensatt ord ofte har en ' +
    'annen, idiomatisk betydning: «sette over kaffe» mot «oversette en bok». Trykket er også ' +
    'ulikt — muntlig trykk på partikkelen i den løse formen. Noen partikkelverb danner også et ' +
    'fast sammensatt perfektum partisipp brukt som adjektiv: «påkjørt», «nedsatt», «utgått».'
},

'modalverb-betydning': {
  id: 'modalverb-betydning',
  titleEn: 'Choosing the right modal verb',
  titleNb: 'Å velge riktig modalverb',
  explanationEn:
    '«Kan» expresses ability or permission, «skal» expresses a plan/decision or an instruction ' +
    'from someone else, «vil» expresses desire or a prediction, «må» expresses necessity or ' +
    'obligation. In context, several can superficially seem to fit, but only one matches the ' +
    'actual meaning intended — e.g. "Skal vi lage kake?" (proposal) is different from "Vil du ' +
    'lage kake?" (asking about desire) and "Kan du lage kake?" (asking about ability/willingness).',
  explanationNb:
    '«Kan» uttrykker evne eller tillatelse, «skal» uttrykker en plan/beslutning eller en ' +
    'instruks fra noen andre, «vil» uttrykker ønske eller en spådom, «må» uttrykker nødvendighet ' +
    'eller plikt. I sammenheng kan flere se ut til å passe, men bare ett stemmer med den ' +
    'faktiske betydningen som er ment — f.eks. er «Skal vi lage kake?» (forslag) noe annet enn ' +
    '«Vil du lage kake?» (spør om ønske) og «Kan du lage kake?» (spør om evne/vilje).'
},

'sannsynlighet-uttrykk': {
  id: 'sannsynlighet-uttrykk',
  titleEn: 'Expressing probability',
  titleNb: 'Å uttrykke sannsynlighet',
  explanationEn:
    'Several expressions cover different degrees of certainty about something happening: «det er ' +
    'mulig at» (possible), «det er sannsynlig at» / «det er lite sannsynlig at» (likely/unlikely), ' +
    '«det kommer til å» (prediction, fairly confident), «det kan hende at» (might), «jeg tror»/«jeg ' +
    'antar» (I think/assume — speaker\'s own uncertain belief). Paraphrasing between them means ' +
    'keeping the same degree of certainty, not just swapping in any probability phrase.',
  explanationNb:
    'Flere uttrykk dekker ulike grader av sikkerhet om at noe skal skje: «det er mulig at» ' +
    '(mulig), «det er sannsynlig at» / «det er lite sannsynlig at» (sannsynlig/usannsynlig), ' +
    '«det kommer til å» (spådom, ganske sikker), «det kan hende at» (kan skje), «jeg tror»/«jeg ' +
    'antar» (talerens egen usikre oppfatning). Å skrive om mellom dem betyr å beholde samme grad ' +
    'av sikkerhet, ikke bare bytte inn et hvilket som helst sannsynlighetsuttrykk.'
},

'bli-presens-partisipp': {
  id: 'bli-presens-partisipp',
  titleEn: '«bli» + presens partisipp (durative aspect)',
  titleNb: '«bli» + presens partisipp (utstrakt tid)',
  explanationEn:
    '«Bli» + presens partisipp emphasizes that an action or state stretches out over time, ' +
    'rather than being a single point: "Han må bli boende i Bergen" (stays living, ongoing), ' +
    '"De ble sittende og snakke sammen hele natta" (kept sitting and talking). Common with verbs ' +
    'like bo, sitte, ligge, stå — the presens partisipp form never inflects.',
  explanationNb:
    '«Bli» + presens partisipp understreker at en handling eller tilstand strekker seg over tid, ' +
    'i stedet for å være ett enkelt tidspunkt: «Han må bli boende i Bergen» (fortsetter å bo), ' +
    '«De ble sittende og snakke sammen hele natta» (fortsatte å sitte og snakke). Vanlig med verb ' +
    'som bo, sitte, ligge, stå — presens partisipp-formen bøyes aldri.'
},

'fa-perfektum-partisipp': {
  id: 'fa-perfektum-partisipp',
  titleEn: '«få» + perfektum partisipp (resultative)',
  titleNb: '«få» + perfektum partisipp (resultat i fokus)',
  explanationEn:
    '«Få» + perfektum partisipp puts the RESULT of an action in focus, especially whether it got ' +
    'successfully completed: "Fikk du lest avisa i dag?" (Did you manage to read the paper?) ' +
    '"Du må få levert artikkelen før fire" (make sure it gets delivered). Different from plain ' +
    'perfektum (har lest) — «få» adds the sense of managing to get something done, often against ' +
    'some obstacle or time pressure.',
  explanationNb:
    '«Få» + perfektum partisipp setter RESULTATET av en handling i fokus, særlig om den ble ' +
    'gjennomført: «Fikk du lest avisa i dag?» «Du må få levert artikkelen før fire.» Ulikt vanlig ' +
    'perfektum (har lest) — «få» legger til en følelse av å ha klart å gjennomføre noe, ofte mot ' +
    'en hindring eller et tidspress.'
},

'mene-synes-tro-tenke': {
  id: 'mene-synes-tro-tenke',
  titleEn: '«mene», «synes», «tro», «tenke»',
  titleNb: '«mene», «synes», «tro» og «tenke»',
  explanationEn:
    'All four can translate as English "think," but aren\'t interchangeable. «Mene» = hold a ' +
    'stated position/opinion: "Jeg mener at vi bør endre planen." «Synes» = have an impression or ' +
    'reaction, often about something experienced: "Jeg synes maten var god." «Tro» = believe or ' +
    'guess, with some uncertainty about a fact: "Jeg tror det blir sol i morgen." «Tenke» = ' +
    'ponder, have something in mind, or be about to say something: "Hva tenker du på?" "Jeg ' +
    'tenkte å ringe deg i kveld."',
  explanationNb:
    'Alle fire kan oversettes med engelsk «think», men er ikke utskiftbare. «Mene» = ha en uttalt ' +
    'holdning/mening: «Jeg mener at vi bør endre planen.» «Synes» = ha et inntrykk eller en ' +
    'reaksjon, ofte om noe man har opplevd: «Jeg synes maten var god.» «Tro» = tro eller gjette, ' +
    'med en viss usikkerhet om et faktum: «Jeg tror det blir sol i morgen.» «Tenke» = fundere, ha ' +
    'noe i tankene, eller være i ferd med å si noe: «Hva tenker du på?» «Jeg tenkte å ringe deg i ' +
    'kveld.»'
}
```

---

## Content plan (`src/lib/data/grammar.json`)

IDs: `gq-{short-topic}-00X`, continuing numbering for the 2 already-seeded reused topics
(`relative-som` next id `gq-rel-006`, `svar-ja-jo-nei` next id `gq-svar-006`) and starting fresh
for everything else. Type mix per topic, adapted to what the point tests: heavier on
`fill`/`transform` for the construction-formation topics (`partisipp-former`,
`bli-presens-partisipp`, `fa-perfektum-partisipp`, `passiv-bli-s`), heavier on `order`/`transform`
for the word-order-sensitive reused topics (`setningsadverbial`, `adverbial-fronting`,
`subjunksjon-oversikt`), `minimal-pair` well suited to the paired-choice topics
(`motsetning-prefiks`, `modalverb-betydning`, `partikkelverb-los-fast`,
`mene-synes-tro-tenke`, `adjektiv-eller-adverb`). B2 sentences can run longer and cover more
abstract/academic subject matter than B1 (matching `CATEGORIES_BY_LEVEL.B2`: politics, philosophy,
psychology, business, academic-language, etc.), but should stay grounded in real
`vocab-b2.json`/`uttrykk-b2.json` headwords rather than reaching for C-level vocabulary.

---

## Vocab verification script

Build `scripts/check-b2-grammar-vocab.mjs`, adapted from `scripts/check-b1-grammar-vocab.mjs`
(same lemma-matching logic — suffix stemming, irregular-verb-form map, phrase-lemma handling),
pointed at `vocab-b2.json`/`uttrykk-b2.json` with `vocab-a1/a2/b1.json` (+ their uttrykk files) as
a fallback pool, since B2 sentences will naturally reuse earlier-level vocabulary alongside new B2
headwords. Scope to the 23 B2 topic-touches (`cefr: 'B2'` entries only, so the reused topics'
A1/A2/B1/C entries aren't checked here). Run after each topic, same workflow as every prior plan's
Phase 3.

Also run `scripts/check-grammar-norwegian.mjs` against all 23 topic-touches once content is
written, per `grammar-with-only-norsk.md` — every new B2 batch should pass it before merging, no
separate conversion pass needed since content is Norwegian-only from the start.

---

## Plus gating

**B2 has zero free grammar content, by existing policy** — confirmed directly against
`FREE_GRAMMAR_TOPICS` in `config.ts`: the map's own comment states _"B2/C intentionally have no
entries here — every B2/C question is individually plusOnly regardless of this map."_ Concretely:

- `isFreeGrammarTopic(topic, 'B2')` returns `false` for every topic, since no `FREE_GRAMMAR_TOPICS`
  entry lists `'B2'` (and none should be added — that would contradict the documented policy).
- This means **every** new B2 question — the 10 new topics and the B2 entries added to the 13
  reused topics — is automatically Plus-gated by CEFR level alone, with no per-question
  `plusOnly: true` required. Following the exact convention already used at every other level:
  leave `plusOnly` omitted/false on the question objects themselves (gating happens at the
  topic+level map, not the question field), matching how `svar-ja-jo-nei`'s and `relative-som`'s
  existing B2 entries are already written.
- **No `config.ts` changes needed for this plan.** Explicitly do _not_ add any of the 10 new
  topics, or B2-level entries for the 13 reused topics, to `FREE_GRAMMAR_TOPICS` — doing so would
  silently break the "B2 and C are entirely Plus" policy the map's own comment documents.
- Double-check at the start of Phase 4 that no topic accidentally _is_ free at B2 through a stray
  `'all'` entry (only `relative-som`/`adj-comparison`/`ordfamilie-avledning`/`bade-og-verken-eller`
  currently have any entry at all, and all are scoped to `['A2']`/`['B1']`, never `'all'` or
  `['B2']`) — same discipline as every prior plan's Phase 4 verification step.

---

## Implementation phases

### Phase 1 — Rules + types ✅ Done

1. ✅ Added 10 new topics to `GrammarTopic` in `src/lib/types.ts`.
2. ✅ Added 10 new `GrammarRule` entries to `src/lib/grammar/rules.ts` (drafted above).
3. ✅ Applied the 1 rule-text addition to `ordfamilie-avledning` (agent/process/result pattern)
   listed above.
4. ✅ Vocab gap audit against `vocab-b2.json` — spot-checked bosetting, folketall, initiativ,
   tariffavtale, arbeidsmiljøloven, stipend, studieprogresjon. `bosetting` and `studieprogresjon`
   were already present; `folketall`, `initiativ`, `tariffavtale`, `arbeidsmiljøloven`, and
   `stipend` were missing and have been added as new headwords (`v-b2-geography-055`,
   `v-b2-abstract-nouns-068`, `v-b2-work-career-055`, `v-b2-law-096`, `v-b2-education-054`),
   matching the existing entry schema (norsk/lemma/english/ukrainian/spanish/german/example\*/definition/level/category/part).

### Phase 2 — Content, built in the same chapter order as the workbook (1→6)

1. `substantivert-adjektiv` (ch. 1) ✅ Done — 12 questions (`gq-substadj-001`–`012`)
2. `noun-plurals` (B2 entries, ch. 1 — singular→plural with adjective) ✅ Done — 11 questions (`gq-noun-pl-037`–`047`)
3. `adj-agreement` (B2 entries, ch. 1 — same rewrite) ✅ Done — 10 questions (`gq-adj-065`–`074`)
4. `kvantorer` (B2 entries, ch. 1 — plural determiners) ✅ Done — 10 questions (`gq-kvantorer-019`–`028`)
5. `noun-articles` (B2 entries, ch. 1 — ubestemt/bestemt in running text) ✅ Done — 10 questions (`gq-noun-art-029`–`038`, a continuous 10-sentence narrative)
6. `motsetning-prefiks` (ch. 2) ✅ Done — 11 questions (`gq-motpre-001`–`011`)
7. `ordfamilie-avledning` (B2 entries, ch. 2 — word-family tables + agent/process/result) ✅ Done — 20 questions (`gq-avled-049`–`068`), plus 10 new vocab-b2.json headwords (produsent, produksjon, produkt, organisasjon, organisering, arbeider, læring, lærdom, lærerik, funksjon); passes `check-b2-grammar-vocab.mjs` and `check-grammar-norwegian.mjs` (0/68 unmatched/flagged for the whole topic)
8. `subjunksjon-oversikt` (ch. 3) ✅ Done — 11 questions (`gq-subj-001`–`011`), covering da/når/fordi/for at/hvis/med mindre/selv om/før/etter at (`som` deliberately left out of the answer set — that's `relative-som`'s territory). Manually verified: all `prompt`/`hint`/`answer` text is Norwegian-only. Vocab cross-check against vocab-a1/a2/b1/b2 found 3 gaps (`lærerutdanning`, `arbeidskrav`, `hjemby`) — added as new vocab-b2.json headwords (`v-b2-education-058`, `v-b2-work-career-059`, `v-b2-geography-056`), matching existing entry schema. Note: `node scripts/check-b2-grammar-vocab.mjs` / `check-grammar-norwegian.mjs` were not run directly (no shell access to this repo from this session) — verification was done by direct inspection instead; run the scripts locally as a final sanity check when convenient.
9. `setningsadverbial` (B2 entries, ch. 3 — placement inside leddsetning) ✅ Done — 10 questions (`gq-setadv-019`–`028`), setningsadverbial placement inside a leddsetning embedded in longer B2 sentences (psychology, politics, business, academic contexts), including one double-adverbial item (`dessverre` + `ikke`). Manually verified: Norwegian-only text, all key vocabulary cross-checked against vocab-a1/a2/b1/b2 (word choices adjusted where needed rather than adding new headwords). Scripts not run directly (no shell access to this repo from this session).
10. `adverbial-fronting` (B2 entries, ch. 3 — fronting a whole leddsetning) ✅ Done — 10 questions (`gq-advfr-013`–`022`), fronting a full subordinate clause (selv om / hvis / etter at / med mindre / da) with V2 inversion in the main clause, including two items that also test setningsadverbial placement after inversion (`likevel`; `dessverre` + `ikke`). Manually verified: Norwegian-only text, key vocabulary cross-checked against vocab-a1/a2/b1/b2 (word choices adjusted where needed). Scripts not run directly (no shell access to this repo from this session).
11. `derfor-fordi` (B2 entries, ch. 3) ✅ Done — 10 questions (`gq-derforfordi-015`–`024`), same rule at B2 density/abstraction (economy, climate, education, politics contexts), mixing fill/minimal-pair/order/transform. Manually verified: Norwegian-only text, key vocabulary cross-checked against vocab-a1/a2/b1/b2 (word choices adjusted where needed, e.g. avoided compounds not in the vocab pool). Scripts not run directly (no shell access to this repo from this session).
12. `motsetning-selv-om-likevel` (B2 entries, ch. 3 — sentence combination) ✅ Done — 10 questions (`gq-motselv-011`–`020`), sentence-combination selv om/likevel/men (business, politics, economy contexts), including V2-inversion focus for likevel-fronted sentences. (Completed in an earlier session; doc checkbox was out of sync with `grammar.json` — confirmed already present.)
13. `tidssekvens-etter-at-etterpaa` (B2 entries, ch. 3 — with tense choice) ✅ Done — 10 questions (`gq-tidseks-011`–`020`), etter at + presens perfektum (present-tense narration) vs. pluskvamperfektum (past-tense narration), plus etterpå/så density entries. Manually verified: Norwegian-only text, all key vocabulary cross-checked against vocab-a1/a2/b1/b2 lemma lists (word choices adjusted to stay within existing headwords — avoided several natural-sounding but uncovered words like `aksjemarked`, `konferanse`, `rapport`, `komité`, `protestere`). Scripts not run directly (no shell access to this repo from this session); JSON validated for parse-correctness and id-uniqueness instead.
14. `partisipp-former` (ch. 4) ✅ Done — 12 questions (`gq-partform-001`–`012`), presens partisipp (-ende) replacing mens-clauses (manner adverbial, invariant) and perfektum partisipp used adjectivally with full gender/number agreement (en/et/plural forms), including a direct presens-vs-perfektum partisipp contrast item. Note: an id collision was caught and fixed — the existing C-level topic `adj-partisipp-som-adjektiv` already used the `gq-partisipp-XXX` id prefix, so the new B2 entries were assigned `gq-partform-XXX` instead; verified no duplicate ids remain and the original C-level entries were left untouched. Manually verified: Norwegian-only text, all key vocabulary cross-checked against vocab-a1/a2/b1/b2 lemma lists (avoided uncovered words like `imponere`, `publikum`, `brenne`/`brent`, `sal`). Scripts not run directly (no shell access to this repo from this session); JSON validated for parse-correctness and id-uniqueness instead.
15. `partikkelverb-los-fast` (ch. 4)
16. `modalverb-betydning` (ch. 5)
17. `adjektiv-eller-adverb` (B2 entries, ch. 5 — sikker/sikkert/sikre)
18. `sannsynlighet-uttrykk` (ch. 5)
19. `passiv-bli-s` (B2 entries, ch. 5 — modal + s-passiv, active→passive)
20. `bli-presens-partisipp` (ch. 5)
21. `fa-perfektum-partisipp` (ch. 5)
22. `indirekte-tale-at-om` (B2 entries, ch. 6 — statements, hv-questions, modal-verb imperatives, lurer på/vil vite)
23. `mene-synes-tro-tenke` (ch. 6)

(Several reused topics appear once but with a larger batch, since ch. 3 and ch. 5/6 each cover the
same topic across multiple sub-exercises — build the topic's full B2 batch together in one pass,
same as prior plans, rather than literally interleaving by exercise number.)

### Phase 3 — Vocab verification

Build and run `scripts/check-b2-grammar-vocab.mjs` after each topic in Phase 2, not just at the
end. Also run `scripts/check-grammar-norwegian.mjs` per topic (or in batches) to confirm every
`prompt`/`hint`/`explanation` is Norwegian-only from the start.

### Phase 4 — Gating + wiring

1. Verify `plusOnly` is omitted/false on all new questions (10 new topics + 13 reused topics' B2
   entries) — spot-check via `grammar.json` directly, same as every prior plan.
2. Confirm none of the 10 new topics, and no B2-level entry for the 13 reused topics, were added
   to `FREE_GRAMMAR_TOPICS` in `config.ts` — per the "Plus gating" section above, this file should
   need **zero edits** for this plan.
3. Update the admin `+page.svelte` `TOPICS` constant to add the 10 new topics, so they're
   authorable/editable through the admin UI (same gap flagged in every prior plan's Phase 1/4).
4. Confirm `/grammar` and `/grammar/[topic]` need no route changes — both derive their topic list
   dynamically from `grammar.json` content, not from any hardcoded topic array (confirmed
   structurally unchanged since the A1 plan verified this, and reconfirmed in the B1/C plans).

---

## Testing

- No new grading logic needed (existing types are type-agnostic — same as every prior plan).
- Extend the check that every question's `topic` resolves to an entry in `GRAMMAR_RULES`
  (`src/lib/grammar/grammar-data.test.ts`, added in the B1 plan) to cover the 10 new topics — this
  test already iterates all distinct `topic` values in `grammar.json`, so it should pick up the
  new topics automatically once Phase 1 lands; just confirm the test still passes with no changes
  needed to the test file itself.

---

## Decisions (resolved)

- **`subjunksjon-oversikt` vs. extending each individual B1 pair-topic (`da-naar`,
  `hvis-om-betingelse`, etc.) with more options:** considered folding a "choose among many" drill
  into one of the existing pair-topics instead of creating a new topic. **Resolved: new topic.**
  The B1 topics are deliberately narrow two-way contrasts (their whole pedagogical point is
  isolating one confusion at a time); a B2 synthesis exercise that mixes 8–10 subjunctions in one
  question is testing a different, harder skill (holistic sentence-meaning parsing, not a single
  pairwise distinction) and doesn't fit cleanly into any one of them.
- **`partikkelverb-los-fast` as one topic instead of splitting loose/fixed distinction from the
  synonym-swap and fixed-participle sub-exercises (ch. 4, items 32–34):** considered 2–3 separate
  topics given the volume. **Resolved: one topic.** All three sub-exercises test the same
  underlying skill (recognizing a specific particle verb and its fixed/loose behavior), just via
  different question formats (`minimal-pair` for the løst/fast contrast, `transform` for the
  synonym swap, `fill` for the fixed perfektum partisipp) — same "one topic, several question
  formats" pattern already used throughout every prior plan (e.g. `passiv-bli-s`).
  the fixed perfektum partisipp) — same "one topic, several question types" pattern used
  throughout prior plans (e.g. `passiv-bli-s` mixes `fill`/`transform`).
- **`bli-presens-partisipp` and `fa-perfektum-partisipp` as two topics instead of one
  "aspect constructions" topic:** considered merging, since both are periphrastic aspect
  constructions from the same chapter. **Resolved: keep separate.** They express opposite aspects
  (durative/ongoing vs. resultative/completed) with different auxiliary verbs and different
  triggering contexts — conflating them risks the same "wrong pattern for the sentence" confusion
  the questions are meant to test, so keeping them as distinct topics mirrors how B1 kept
  `passiv-bli-s`'s two passive _forms_ together (same construction, two surface realizations) but
  would NOT merge two constructions with opposite meanings.
