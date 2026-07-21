# Nivå A1 Grammar & Quiz — Implementation Plan

## Overview

Full A1 coverage of the **Grammatikk** column in `draft/a1/innhold.md` (chapters 1–9; chapter 10
has no source material in `draft/a1/grammar/pa-vei.md` or `draft/a1/quiz/pa-vei.md`, so it's out
of scope here). This is genuinely new ground: **`grammar.json` currently has zero A1 entries** —
every existing question starts at A2 (confirmed by counting `cefr` values across all 630
questions). This plan is the A1 counterpart to `ai-docs/implementation/c-grammar.md`, reusing the
same architecture, conventions, and phase structure.

**On "quiz" vs "grammar":** the app has no separate static "quiz" content type. `/quiz` is
dynamically generated from `vocab-{level}.json` (MC/fill/type, built at runtime by `quiz.ts`) and
needs no new authored content. The static, hand-authored question format — `GrammarQuestion` in
`grammar.json`, topic-organized, used by `/grammar` — is the only place new textbook-derived
content belongs. So **both** `draft/a1/grammar/pa-vei.md` (per-topic drills) and
`draft/a1/quiz/pa-vei.md` (chapter-review exercises, more mixed) feed the same pipeline: new A1
topics in `grammar.json`. They're complementary source material, not two output formats — quiz's
chapter-review items are often a good source of a _second_ sentence pattern for a topic already
being drafted from the grammar file.

**Copyright approach (unchanged from `c-grammar.md`):** every question is newly written, using
the textbook only to identify which rule and difficulty to target — never copying or closely
paraphrasing its sentences, fill-in blanks, or character names (Samira, Øyvind, Teresa, Åse,
Nikos, etc. don't get reused verbatim as recurring characters — invent fresh names/sentences).

**Vocab integration:** every question should use real A1 vocabulary (`vocab-a1.json` /
`uttrykk-a1.json`), verified the same way as the C-level pipeline.

**Question types:** `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'` already
cover everything needed here — no schema changes required (unlike C, which needed
`multiple-choice`).

---

## Recommendation on the two open questions

### 1. Topic granularity

Two source strategies, used together:

- **Reuse existing topics, add `cefr: 'A1'` entries** where a topic already exists and the A1
  textbook item is the introductory version of the same rule (e.g. `noun-articles` already covers
  en/et/ei — the A1 "substantiv: ubestemt form" item is simpler versions of the same rule, not a
  different rule). This mirrors the existing precedent of topics spanning A2+B1
  (`ikke-placement`, `preposisjoner-tid`, etc.) — a topic is one grammar _point_, not one CEFR
  level.
- **New topics** for A1 grammar points that have no existing topic (subject/object pronouns,
  imperativ, denne/dette/disse, possessiver, preteritum, etc.).

This gives **19 new topics + 7 reused topics** (26 topic-touches total) — granular enough that
each stays teachable in one sitting, consolidated enough to avoid near-duplicate topics.

### 2. Plus gating

**Recommendation: all new A1 content free (no `plusOnly`), and all 19 new A1-only topics added to
`FREE_GRAMMAR_TOPICS`.** Rationale: A1 is the entry point for new users — currently `/grammar` has
_nothing_ to show them below A2, and gating the very first grammar content a beginner sees would
undercut onboarding more than it protects revenue (the existing free/paid split already reserves
plenty of depth at A2/B1/B2/C). The reused topics (`noun-articles`, `noun-plurals`,
`adj-agreement`, `preposisjoner-tid`) already have all their existing questions non-`plusOnly`, so
adding non-`plusOnly` A1 entries is consistent; `helsetninger`, `modal-verb-order`, and
`noun-possessives` currently mix free and Plus questions — add the new A1 entries as free (they're
the introductory versions) and leave the existing A2/B1 Plus questions as they are.

**Note found while reading `access.ts`/`config.ts`:** there are two independent gates —
`FREE_GRAMMAR_TOPICS` (whether a topic is visible/free at all — currently just 4 topics:
`ikke-placement`, `v2-word-order`, `det-er-ikke`, `modal-verb-order`) and `FREE_GRAMMAR_PER_TOPIC`
= 3 (a global constant: free users get the first 3 non-`plusOnly` questions of _any_ topic,
independent of the topic list above). How these two interact in the actual `/grammar` route
(topic picker vs. in-session gating) should be confirmed in Phase 4 before assuming the
recommendation above behaves as intended — the mechanism is a bit tangled and worth reading the
route loaders directly rather than inferring from `access.ts` alone.

---

## New topics (19)

| Topic                      | Source (ch.) | Notes                                                                                              | Q's |
| -------------------------- | ------------ | -------------------------------------------------------------------------------------------------- | --- |
| `personlige-pronomen`      | 1            | Subject pronouns jeg/du/han/hun/vi/dere/de, matched to person/number                               | 10  |
| `presens-verb`             | 1            | Regular presens (-er) conjugation; one form for all persons                                        | 10  |
| `pronomen-objektsform`     | 2            | Object pronouns meg/deg/ham/henne/oss/dere/dem after verbs/prepositions                            | 10  |
| `og-men`                   | 2            | og (addition) vs men (contrast) as sentence connectors                                             | 8   |
| `adverb-sted-hjem`         | 3            | inne/ute, inn/ut, hjem/hjemme — location vs. movement-toward adverbs                               | 8   |
| `refleksive-uttrykk`       | 3            | Reflexive verb+pronoun pattern: legge seg, like seg, sminke seg, gifte seg                         | 8   |
| `infinitiv-a1`             | 4            | Bare infinitive after modal verbs and «like å», «pleie å»                                          | 10  |
| `substantiv-bestemt-form`  | 5            | Definite singular noun endings: -en/-a/-et (koppen, boka, eplet)                                   | 10  |
| `pronomen-den-det-de`      | 5            | den/det/de referring back to a noun already mentioned, matched by gender/number                    | 8   |
| `denne-dette-disse`        | 6            | Demonstratives denne/dette/disse agreeing with the noun's gender/number                            | 10  |
| `imperativ`                | 6            | Imperative = verb stem, no subject, no -r ending                                                   | 8   |
| `possessiver-min-din`      | 7            | min/din/hans/hennes/vår/deres, placed after the noun in everyday spoken Norwegian                  | 10  |
| `refleksivt-possessiv-sin` | 7            | sin/sitt/sine (subject owns the object) vs. hans/hennes (someone else owns it)                     | 10  |
| `ja-jo`                    | 7            | jo — contradicting a negative question/statement, vs. plain ja                                     | 6   |
| `preteritum-a1`            | 8            | Regular preteritum (-et/-a/-te) plus the handful of very common irregular verbs (var, hadde, gikk) | 12  |
| `for-a-fordi`              | 8            | «for å» + infinitive (purpose) vs. «fordi» + clause (cause)                                        | 8   |
| `vaer-det-subjekt`         | 9            | Impersonal/weather «det»: Det regner, Det blåser, Det er kaldt                                     | 8   |
| `indirekte-tale-at-om`     | 9            | Reported statement with «at» vs. reported yes/no question with «om»                                | 8   |
| `synes-tror`               | 9            | synes (opinion on something perceivable — taste, looks) vs. tror (belief/uncertainty)              | 8   |

**Subtotal: ~170 questions across 19 new topics.**

## Reused topics (add `cefr: 'A1'` entries)

| Topic               | Source (ch.) | A1 item                                                                        | New Q's |
| ------------------- | ------------ | ------------------------------------------------------------------------------ | ------- |
| `helsetninger`      | 1            | Setning / spørsmål og svar — basic statement & question word order             | 8       |
| `modal-verb-order`  | 4            | Modalverb — introductory kan/vil/skal/må + infinitive                          | 8       |
| `noun-articles`     | 3            | Substantiv: ubestemt form — en/ei/et                                           | 8       |
| `noun-plurals`      | 3            | Entall og flertall                                                             | 8       |
| `adj-agreement`     | 6            | Adjektiv — basic en/ei/et/plural agreement                                     | 8       |
| `noun-possessives`  | 7            | Genitiv -s                                                                     | 6       |
| `preposisjoner-tid` | 9            | om vinteren – i vinter (the rule text already covers this exact i/om contrast) | 6       |

**Subtotal: ~52 questions across 7 reused topics.**

**Total: ~220 questions across 26 topic-touches.**

---

## Rule drafts (`src/lib/grammar/rules.ts`) — new topics only

Short drafts to seed Phase 1; expand to the fuller bilingual style used elsewhere in
`rules.ts` when actually adding them.

```typescript
'personlige-pronomen': {
  id: 'personlige-pronomen',
  titleEn: 'Personal pronouns (subject form)',
  titleNb: 'Personlige pronomen (subjektsform)',
  explanationEn:
    'Norwegian subject pronouns: jeg (I), du (you sg.), han/hun (he/she), vi (we), dere (you pl.), ' +
    'de (they). They replace a named subject and must match its person and number: ' +
    '"Samira bor i Norge." → "Hun bor i Norge."',
  explanationNb:
    'Norske subjektspronomen: jeg, du, han/hun, vi, dere, de. De erstatter et navngitt subjekt og ' +
    'må stemme med person og tall: "Samira bor i Norge." → "Hun bor i Norge."'
},

'presens-verb': {
  id: 'presens-verb',
  titleEn: 'Presens (present tense)',
  titleNb: 'Presens',
  explanationEn:
    'Regular verbs add -r (or -er) in presens, with ONE form for every person: jeg/du/han/vi/de ' +
    'snakker. Unlike English, there is no "-s" for third person and no separate continuous form — ' +
    '"snakker" covers both "speaks" and "is speaking."',
  explanationNb:
    'Regelrette verb får -r (eller -er) i presens, med ÉN form for alle personer: jeg/du/han/vi/de ' +
    'snakker. I motsetning til engelsk finnes det ingen "-s" for tredje person og ingen egen ' +
    '-ing-form.'
},

'pronomen-objektsform': {
  id: 'pronomen-objektsform',
  titleEn: 'Object pronouns',
  titleNb: 'Pronomen: objektsform',
  explanationEn:
    'After a verb or preposition, subject pronouns switch to object form: jeg→meg, du→deg, ' +
    'han→ham, hun→henne, vi→oss, dere→dere, de→dem. "Jeg liker deg." "Hun snakker med ham."',
  explanationNb:
    'Etter et verb eller en preposisjon bytter subjektspronomen til objektsform: jeg→meg, du→deg, ' +
    'han→ham, hun→henne, vi→oss, dere→dere, de→dem. "Jeg liker deg." "Hun snakker med ham."'
},

'og-men': {
  id: 'og-men',
  titleEn: '«og» vs. «men»',
  titleNb: '«og» og «men»',
  explanationEn:
    '«Og» joins two matching or additive ideas: "Hun bor i Oslo og jobber der." «Men» joins a ' +
    'contrasting idea: "Hun bor i Oslo, men jobber i Bergen." Neither changes word order.',
  explanationNb:
    '«Og» binder sammen to like eller supplerende ideer: "Hun bor i Oslo og jobber der." «Men» ' +
    'binder sammen en motsetning: "Hun bor i Oslo, men jobber i Bergen." Ingen av dem endrer ' +
    'ordstillingen.'
},

'adverb-sted-hjem': {
  id: 'adverb-sted-hjem',
  titleEn: 'Location vs. movement adverbs (inne/ute, inn/ut, hjem/hjemme)',
  titleNb: 'Stedsadverb: inne/ute, inn/ut, hjem/hjemme',
  explanationEn:
    'Norwegian distinguishes BEING somewhere from MOVING there with a different adverb form: ' +
    '"Jeg er ute" (I am outside) vs. "Jeg går ut" (I go outside/out). Same pattern: inne/inn, ' +
    'hjemme/hjem.',
  explanationNb:
    'Norsk skiller mellom Å VÆRE et sted og Å BEVEGE SEG dit med ulik adverbform: "Jeg er ute" mot ' +
    '"Jeg går ut." Samme mønster: inne/inn, hjemme/hjem.'
},

'refleksive-uttrykk': {
  id: 'refleksive-uttrykk',
  titleEn: 'Reflexive verb expressions',
  titleNb: 'Refleksive uttrykk',
  explanationEn:
    'Some Norwegian verbs pair with a reflexive pronoun (meg, deg, seg, oss, dere, seg) that ' +
    'matches the subject: "Jeg legger meg klokka ti." "Hun liker seg på hotellet." The reflexive ' +
    'pronoun always matches the subject\'s person, never the object\'s.',
  explanationNb:
    'Noen norske verb kombineres med et refleksivt pronomen (meg, deg, seg, oss, dere, seg) som ' +
    'samsvarer med subjektet: "Jeg legger meg klokka ti." "Hun liker seg på hotellet."'
},

'infinitiv-a1': {
  id: 'infinitiv-a1',
  titleEn: 'The infinitive after modal verbs and «like å»',
  titleNb: 'Infinitiv etter modalverb og «like å»',
  explanationEn:
    'A second verb after a modal (kan, vil, skal, må) stays in the bare infinitive, no "å": ' +
    '"Jeg vil lære norsk." After «like», «pleie», «prøve» etc., the infinitive needs «å»: ' +
    '"Jeg liker å lære norsk."',
  explanationNb:
    'Et andre verb etter et modalverb (kan, vil, skal, må) står i naken infinitiv, uten "å": ' +
    '"Jeg vil lære norsk." Etter «like», «pleie», «prøve» osv. trengs «å»: "Jeg liker å lære norsk."'
},

'substantiv-bestemt-form': {
  id: 'substantiv-bestemt-form',
  titleEn: 'Definite noun form (singular)',
  titleNb: 'Substantiv i bestemt form (entall)',
  explanationEn:
    'To say "the X", Norwegian adds an ending instead of a separate word: en kopp → koppen, ei ' +
    'uke → uka, et eple → eplet. The ending matches the noun\'s gender, the same gender as its ' +
    'indefinite article.',
  explanationNb:
    'For å si "the X" legger norsk til en endelse i stedet for et eget ord: en kopp → koppen, ei ' +
    'uke → uka, et eple → eplet. Endelsen følger substantivets kjønn.'
},

'pronomen-den-det-de': {
  id: 'pronomen-den-det-de',
  titleEn: '«den», «det», «de» referring back to a noun',
  titleNb: '«den», «det», «de» som viser tilbake til et substantiv',
  explanationEn:
    'To refer back to something already named, Norwegian uses den (en/ei-nouns), det (et-nouns), ' +
    'or de (plural) — matched to the ORIGINAL noun\'s gender/number, not to any new information: ' +
    '"Hvor er osten? Den er i kjøleskapet."',
  explanationNb:
    'For å vise tilbake til noe som allerede er nevnt, bruker norsk den (en/ei-ord), det (et-ord) ' +
    'eller de (flertall) — som samsvarer med det ORIGINALE substantivets kjønn/tall: "Hvor er ' +
    'osten? Den er i kjøleskapet."'
},

'denne-dette-disse': {
  id: 'denne-dette-disse',
  titleEn: '«denne», «dette», «disse» (this/these)',
  titleNb: '«denne», «dette», «disse»',
  explanationEn:
    'Demonstratives agree with the noun: denne (en/ei, sg.), dette (et, sg.), disse (all genders, ' +
    'pl.). "Denne genseren er fin." "Dette skjerfet er på tilbud." "Disse skoene passer."',
  explanationNb:
    'Påpekende pronomen samsvarer med substantivet: denne (en/ei, entall), dette (et, entall), ' +
    'disse (alle kjønn, flertall). "Denne genseren er fin." "Dette skjerfet er på tilbud."'
},

'imperativ': {
  id: 'imperativ',
  titleEn: 'The imperative',
  titleNb: 'Imperativ',
  explanationEn:
    'The imperative is just the verb stem — the infinitive minus its final -e — with no subject: ' +
    '"Du må huske stor bokstav." → "Husk stor bokstav!" "Dere må snakke norsk." → "Snakk norsk!"',
  explanationNb:
    'Imperativ er bare verbstammen — infinitiv uten den siste -e-en — uten subjekt: "Du må huske ' +
    'stor bokstav." → "Husk stor bokstav!"'
},

'possessiver-min-din': {
  id: 'possessiver-min-din',
  titleEn: 'Possessives (min, din, hans, hennes, vår, deres)',
  titleNb: 'Possessiver (eiendomsord)',
  explanationEn:
    'Possessives agree with the possessed noun\'s gender/number (min/mi/mitt/mine, din/di/ditt/dine, ' +
    'vår/vårt/våre) and, in everyday spoken Norwegian, normally follow the noun: "leiligheten min," ' +
    'not "min leilighet." hans/hennes/deres don\'t inflect.',
  explanationNb:
    'Possessiver samsvarer med det eide substantivets kjønn/tall (min/mi/mitt/mine osv.) og står i ' +
    'vanlig talespråk normalt etter substantivet: "leiligheten min," ikke "min leilighet." ' +
    'hans/hennes/deres bøyes ikke.'
},

'refleksivt-possessiv-sin': {
  id: 'refleksivt-possessiv-sin',
  titleEn: '«sin/sitt/sine» vs. «hans/hennes»',
  titleNb: '«sin/sitt/sine» og «hans/hennes»',
  explanationEn:
    'Use sin/sitt/sine when the possessor IS the sentence\'s subject: "Bianca vasker leiligheten ' +
    'sin" (her own apartment). Use hans/hennes when the possessor is someone ELSE: "Bianca sitter i ' +
    'bilen hennes" (someone else\'s car).',
  explanationNb:
    'Bruk sin/sitt/sine når eieren ER setningens subjekt: "Bianca vasker leiligheten sin" (sin ' +
    'egen leilighet). Bruk hans/hennes når eieren er noen ANNEN: "Bianca sitter i bilen hennes."'
},

'ja-jo': {
  id: 'ja-jo',
  titleEn: '«ja» vs. «jo»',
  titleNb: '«ja» og «jo»',
  explanationEn:
    'Answer a positive question with «ja». Answer a NEGATIVE question or contradict a negative ' +
    'statement affirmatively with «jo», never «ja»: "Er du ikke sulten?" → "Jo, det er jeg."',
  explanationNb:
    'Svar på et positivt spørsmål med «ja». Svar bekreftende på et NEGATIVT spørsmål, eller ' +
    'motsi en negativ påstand, med «jo», aldri «ja»: "Er du ikke sulten?" → "Jo, det er jeg."'
},

'preteritum-a1': {
  id: 'preteritum-a1',
  titleEn: 'Preteritum (simple past) — introduction',
  titleNb: 'Preteritum — introduksjon',
  explanationEn:
    'Regular verbs add -et, -te, or -a in preteritum (bodde, flyttet, lærte). A handful of very ' +
    'common verbs are irregular and must be memorized: være→var, ha→hadde, gå→gikk, komme→kom, ' +
    'ta→tok, si→sa.',
  explanationNb:
    'Regelrette verb får -et, -te eller -a i preteritum (bodde, flyttet, lærte). Noen svært ' +
    'vanlige verb er uregelmessige og må pugges: være→var, ha→hadde, gå→gikk, komme→kom, ta→tok, ' +
    'si→sa.'
},

'for-a-fordi': {
  id: 'for-a-fordi',
  titleEn: '«for å» vs. «fordi»',
  titleNb: '«for å» og «fordi»',
  explanationEn:
    '«For å» + infinitive states a PURPOSE: "Jeg går til byen for å handle." «Fordi» + a full ' +
    'clause states a CAUSE: "Jeg går til byen fordi jeg trenger mat."',
  explanationNb:
    '«For å» + infinitiv uttrykker en HENSIKT: "Jeg går til byen for å handle." «Fordi» + en hel ' +
    'setning uttrykker en ÅRSAK: "Jeg går til byen fordi jeg trenger mat."'
},

'vaer-det-subjekt': {
  id: 'vaer-det-subjekt',
  titleEn: 'Impersonal «det» (weather, general statements)',
  titleNb: 'Upersonlig «det» (vær, allmenne utsagn)',
  explanationEn:
    'Weather and many general statements need a dummy subject «det», with no real-world referent: ' +
    '"Det regner." "Det blåser." "Det er kaldt i dag."',
  explanationNb:
    'Vær og mange allmenne utsagn trenger et formelt subjekt «det», uten noen egentlig referent: ' +
    '"Det regner." "Det blåser." "Det er kaldt i dag."'
},

'indirekte-tale-at-om': {
  id: 'indirekte-tale-at-om',
  titleEn: 'Reported speech: «at» vs. «om»',
  titleNb: 'Referert tale: «at» og «om»',
  explanationEn:
    'Report a STATEMENT with «at»: "Det er kaldt ute." → "Han sier at det er kaldt ute." Report a ' +
    'YES/NO QUESTION with «om»: "Skal du ut?" → "Han spør om hun skal ut."',
  explanationNb:
    'Referer en PÅSTAND med «at»: "Det er kaldt ute." → "Han sier at det er kaldt ute." Referer et ' +
    'JA/NEI-SPØRSMÅL med «om»: "Skal du ut?" → "Han spør om hun skal ut."'
},

'synes-tror': {
  id: 'synes-tror',
  titleEn: '«synes» vs. «tror»',
  titleNb: '«synes» og «tror»',
  explanationEn:
    '«Synes» gives an OPINION about something you can perceive or judge (taste, looks, quality): ' +
    '"Jeg synes kaka er god." «Tror» expresses BELIEF or uncertainty about a fact: "Jeg tror hun ' +
    'kommer senere."',
  explanationNb:
    '«Synes» gir en MENING om noe du kan sanse eller vurdere (smak, utseende, kvalitet): "Jeg ' +
    'synes kaka er god." «Tror» uttrykker TRO eller usikkerhet om et faktum: "Jeg tror hun kommer ' +
    'senere."'
}
```

Reused topics (`helsetninger`, `modal-verb-order`, `noun-articles`, `noun-plurals`,
`adj-agreement`, `noun-possessives`, `preposisjoner-tid`) need no rule-text changes — just new
`cefr: 'A1'` question entries under the existing rule.

---

## Content plan (`src/lib/data/grammar.json`)

IDs: `gq-{short-topic}-00X`, following the existing convention. Type mix per topic, adapted to
what the point actually tests (heavier on `fill` for morphology topics like
`substantiv-bestemt-form`/`denne-dette-disse`, heavier on `order`/`transform` for word-order topics
like `helsetninger`/`vaer-det-subjekt`/`indirekte-tale-at-om`, `minimal-pair` well suited to
`ja-jo`/`synes-tror`/`og-men`). All A1, so sentences should stay short (5–8 words) and use only
A1-level vocabulary — cross-check names/nouns/verbs against `vocab-a1.json`/`uttrykk-a1.json`
rather than inventing words above the level.

---

## Vocab verification script

Reuse the same pattern as `scripts/check-c-grammar-vocab.mjs`, pointed at
`vocab-a1.json`/`uttrykk-a1.json` instead of the C-level files. Given A1's vocabulary is much
smaller and more basic than C's idiom-heavy set, expect a much higher hit rate — this is more of
a sanity check than the C-level triage exercise.

---

## Implementation phases

### Phase 1 — Rules + types ✅ Done

1. Add 19 new topics to `GrammarTopic` in `src/lib/types.ts`. ✅ Done
2. Add 19 new `GrammarRule` entries to `src/lib/grammar/rules.ts` (drafted above — expand to the
   fuller bilingual style used by existing entries). ✅ Done

### Phase 2 — Content, built in the same chapter order as `innhold.md` (1→9)

1. `personlige-pronomen` ✅ Done
2. `presens-verb` ✅ Done
3. `helsetninger` (A1 entries) ✅ Done
4. `pronomen-objektsform` ✅ Done
5. `og-men` ✅ Done
6. `noun-articles` (A1 entries) ✅ Done
7. `noun-plurals` (A1 entries) ✅ Done
8. `adverb-sted-hjem` ✅ Done
9. `refleksive-uttrykk` ✅ Done
10. `infinitiv-a1` ✅ Done
11. `modal-verb-order` (A1 entries) ✅ Done
12. `substantiv-bestemt-form` ✅ Done
13. `pronomen-den-det-de` ✅ Done
14. `adj-agreement` (A1 entries) ✅ Done
15. `denne-dette-disse` ✅ Done
16. `imperativ` ✅ Done
17. `possessiver-min-din` ✅ Done
18. `refleksivt-possessiv-sin` ✅ Done
19. `noun-possessives` (A1 entries) ✅ Done
20. `ja-jo` ✅ Done
21. `preteritum-a1` ✅ Done
22. `for-a-fordi` ✅ Done
23. `vaer-det-subjekt` ✅ Done
24. `preposisjoner-tid` (A1 entries) ✅ Done
25. `indirekte-tale-at-om` ✅ Done
26. `synes-tror` ✅ Done

### Phase 3 — Vocab verification ✅ Done

Built `scripts/check-a1-grammar-vocab.mjs` (adapted from `check-c-grammar-vocab.mjs`), scoped to
the 26 A1 topic-touches (`cefr: 'A1'` entries only, so the 7 reused topics' A2+ entries aren't
checked here). Ran against all 222 A1 questions: 1 unmatched initially — `gq-noun-pl-020` used
"venn" as its example noun, but "venn" isn't a standalone `vocab-a1.json` headword (it only
appears inside the uttrykk phrase "en venn av meg", which requires "meg" too to count as a
match). Swapped the example to "sønn"/"sønner" (a real A1 vocab noun, same regular -er plural
pattern). Re-ran: 222/222 matched, 0 unmatched.

### Phase 4 — Gating + wiring ✅ Done

1. **Confirmed the `FREE_GRAMMAR_TOPICS` / `FREE_GRAMMAR_PER_TOPIC` interaction** by reading
   `access.ts` and the `/grammar` + `/grammar/[topic]` route loaders directly:
   - `FREE_GRAMMAR_TOPICS` only controls the **picker page** (`/grammar`). A topic in the set gets
     a normal, clickable card; a topic _not_ in the set gets a locked card whose link goes straight
     to `/plus` — for a non-Plus user, the picker never even links to `/grammar/[topic]` for a
     topic outside this set.
   - `FREE_GRAMMAR_PER_TOPIC` (= 3) is a _separate_, always-on cap applied inside
     `/grammar/[topic]` itself (`freeGrammarQuestionIds`): regardless of `FREE_GRAMMAR_TOPICS`
     membership, a non-Plus user who reaches the topic page only gets the first 3 non-`plusOnly`
     questions (in file order) as playable — the rest require Plus. This is the existing
     sample-then-upsell pattern (`modal-verb-order` already behaves this way).
   - Net effect: `FREE_GRAMMAR_TOPICS` is a _discoverability_ gate (can a free user reach the topic
     via the picker at all), `FREE_GRAMMAR_PER_TOPIC` is a _depth_ gate (how much of it they get
     once there). Adding a topic to `FREE_GRAMMAR_TOPICS` does not grant unlimited free access —
     it makes the topic reachable, still capped at 3 free questions per topic like everything else.
2. **Gap found and resolved:** the plan as originally written only called for adding the 19 _new_
   topics to `FREE_GRAMMAR_TOPICS`. But 6 of the 7 reused topics (`noun-articles`, `noun-plurals`,
   `adj-agreement`, `noun-possessives`, `preposisjoner-tid`, `helsetninger`) were _not_ already in
   `FREE_GRAMMAR_TOPICS` (only `modal-verb-order` was) — so their new A1 entries, while
   `plusOnly: false`, would have been unreachable for free users (picker shows them locked, links
   to `/plus`, never to the topic page). Confirmed with the user: added all 6 reused topics to
   `FREE_GRAMMAR_TOPICS` as well, so their A1 content is actually discoverable. Side effect worth
   noting: since `FREE_GRAMMAR_TOPICS` gates at the topic level (not per-`cefr`), this also makes
   these 6 topics' pre-existing non-`plusOnly` A2+ entries reachable via the picker for the first
   time — acceptable, since it doesn't loosen any individual question's own `plusOnly` flag, it
   just exposes what was already flagged free.
3. Added all 19 new topics + the 6 reused topics above to `FREE_GRAMMAR_TOPICS` in `config.ts`
   (`modal-verb-order` was already present). All new questions (new + reused topics) are
   `plusOnly: false`/omitted, unchanged.
4. Updated the admin `+page.svelte` `TOPICS` constant to include the 19 new topics so they're
   authorable/editable through the admin UI (same gap flagged in `c-grammar.md`'s Phase 1.5 note;
   the pre-existing 24 C topics still aren't in this list either — out of scope here).
5. Confirmed `/grammar` and `/grammar/[topic]` need **no route changes** — both derive their topic
   list dynamically from `grammar.json` content (grouped by `q.topic` in file order), not from any
   hardcoded topic array, so all 26 topic-touches are picked up automatically.

---

## Testing

- No new grading logic needed (existing types are type-agnostic — same as C).
- Add/extend the check that every question's `topic` resolves to an entry in `GRAMMAR_RULES`.

---

## Open questions

- Chapter 10 has no source material in either draft file — **resolved**: it's covered by
  `ai-docs/implementation/a2-quiz-and-grammar.md` instead, as A2 content (chapters 10–16 of the
  same textbook are a distinct, later CEFR level, not an extension of this A1 plan).
