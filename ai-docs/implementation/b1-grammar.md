# Nivå B1 Grammar — Implementation Plan

## Overview

Coverage of `draft/b1/grammatikk-stein-paa-stein.md` (15 chapters, "Stein på Stein" grammar
workbook). This is **mostly a reuse exercise**, same pattern as `a2-quiz-and-grammar.md`:
`grammar.json` already has substantial B1 coverage (76 B1 entries across 16 existing topic
buckets, per `ai-docs/implementation/grammar-with-only-norsk.md`'s progress tracker), mostly
shared with A2 (`ikke-placement`, `setningsadverbial`, `adverbial-fronting`, `det-sentence`,
`preposisjoner-sted`, etc.). This plan is the B1 counterpart to `a1-quiz-and-grammar.md` /
`a2-quiz-and-grammar.md` / `c-grammar.md` and reuses their architecture, conventions, and phase
structure.

**Language of new content:** per `ai-docs/implementation/grammar-with-only-norsk.md` (already
resolved for every level), all `prompt`/`hint`/`explanation` text is written directly in
Norwegian from the start — no English drafting pass, no locale switching.

**Copyright approach (unchanged from every prior plan):** every question is newly written, using
the textbook only to identify which rule and difficulty to target — never copying or closely
paraphrasing its sentences or reusing its recurring characters (Sara, Tove, Lasse, Erik, Mia,
Wasim, Gunnar, Toril, Vidar, Pari, Marek, Amalie, Darian, Bjørn, Sigve, Kristine, Rita, Emma
Hellesby, Sofie, etc. — invent fresh names/sentences).

**Vocab integration:** every question should use real B1 vocabulary (`vocab-b1.json` /
`uttrykk-b1.json`), verified by a new script following the established pattern.

**Question types:** `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'` already
cover everything needed here — no schema changes required.

---

## Scope decisions

### Topic granularity: 9 new topics + 23 reused topic-touches (32 topic-touches total)

Mapping the workbook chapter by chapter (full source read — all 15 chapters, not just the table
of contents):

**Genuinely new grammar points, not covered by any existing topic:**

| New topic | Source (ch.) | Notes |
| --- | --- | --- |
| `framtid-uttrykk` | 1 | Choosing among skal/vil/kommer til å + fixed planning expressions (har tenkt å, har lyst til å, håper (at), vil helst, vil gjerne) — each takes different complementation. |
| `for-sa-arsak-folge` | 2, 15 | «for» (cause, joins two main clauses, no inversion) vs. «så» (result, joins two main clauses) — distinct from `derfor-fordi` (adverb vs. subjunction) and A1's `for-a-fordi` (purpose-infinitive vs. cause-clause). |
| `da-naar` | 2 | «da» (single event in the past) vs. «når» (repeated/habitual, or present/future) as subjunctions. |
| `hvis-om-betingelse` | 2 | «hvis» (condition, "if") vs. «om» (whether, in an embedded yes/no question) — distinct from `indirekte-tale-at-om`'s reported-speech «om». |
| `passiv-bli-s` | 6 | **Biggest addition.** bli-passiv and s-passiv formation, active↔passive choice — no existing topic covers introductory passive voice at all (only C's `omskriving-passiv`, which assumes the learner already knows the forms and focuses on paraphrase). |
| `bade-og-verken-eller` | 6 | «både X og Y» / «verken X eller Y» correlative conjunctions. |
| `adjektiv-eller-adverb` | 12 | sikker/sikkert, god/godt, høy/høyt — adjective (agrees with noun) vs. the same word's neuter/adverb -t form (modifies a verb) — mirrors the existing blog post `adjektiv-eller-adverb.md`. |
| `motsetning-selv-om-likevel` | 14, 15 | «men» (coordinating contrast) vs. «selv om» (subordinating concession) vs. «likevel» (adverb, triggers V2) — three ways to express the same contrast, each with different word order. |
| `tidssekvens-etter-at-etterpaa` | 15 | «etter at» (subjunction + clause) vs. «etterpå» (adverb, triggers V2) vs. «så» (conjunction, no inversion) — temporal sequencing connectives, easily confused because they're near-synonyms in meaning but behave completely differently grammatically. |

**Reused topics (add `cefr: 'B1'` entries to existing buckets):**

| Topic | Source (ch.) | B1 item |
| --- | --- | --- |
| `presens-perfektum` | 1 | Three-way presens/preteritum/presens perfektum contrast (harder than A2's two-way contrast). |
| `og-men` | 2 | More complex og/men sentences. |
| `indirekte-tale-at-om` | 2, 8 | Ch. 2: more «hva sier hun»/«hva spør han» drilling. Ch. 8: wh-embedded questions **plus** the subject-extraction rule (hvem/hva as the embedded clause's own subject requires inserting «som»: "Jeg vet ikke hvem **som** kommer," not *"hvem kommer"*) — needs a short rule-text addition (see below), not a new topic. |
| `subordinate-order` | 2 | General da/når/hvis/fordi clause-linking and word order review. |
| `noun-plurals` | 3 | Irregular plurals: bror→brødre, mor/far→mødre/fedre, barn, kone→koner. |
| `noun-articles` | 3 | Yrke/rolle without article (en lærer vs. læreren) — B1-level review of the same rule already seeded at A1/A2. |
| `noun-possessives` | 3, 4 | Ch. 3: genitiv -s / apostrophe error. Ch. 4: deres/vår. |
| `refleksive-verb` | 4 | Broader verb set: gifte seg, skynde seg, ta seg av, konsentrere seg, utdanne seg, glede seg til, kose seg, skamme seg, reise seg, sette seg. |
| `refleksivt-possessiv-sin` | 4 | Harder compound-subject exception: "Han og kundene **hans**" (not sine) — needs a short rule-text addition (see below). |
| `adj-agreement` | 5 | Predikativ agreement review (Den/Det/De er + adjective) with B1-level vocabulary. |
| `adj-comparison` | 7 | More irregular komparativ/superlativ (already has 4 B1 entries — extend). |
| `relative-som` | 8 | Som-setninger as subject and object (incl. preposition stranding) — currently A2/B2 only; B1 is the natural middle rung. |
| `ordfamilie-avledning` | 9, 14, 15 | Currently C-only. B1-level word-family derivation is much simpler (operere→operasjon, trygg→trygghet, natur→naturlig, kineser→kinesisk) — extend down rather than duplicate as a new topic. |
| `infinitiv-a1` | 9 | Preposition + infinitive collocations (til/for/no preposition) — needs a short rule-text addition. |
| `kvantorer` | 10 | Broaden beyond mye/mange/mer/flere to include få/lite, noen/noe, alle/alt, mindre/færre, de fleste/det meste — needs a rule-text addition. |
| `modalverb-preteritum` | 10 | More complex reported-speech embedding with modal preteritum forms. |
| `det-sentence` | 11 | Cleft «Det er X som …» construction — needs a rule-text addition (currently only covers «At X er Y» → «Det er Y at X»). |
| `helsetninger` | 1, 11 | Ch. 1: wh-question main-clause word order (already point 3 of the rule). Ch. 11: more presentational «det» practice (Det står et tre, Det kommer en dame). |
| `vaer-det-subjekt` | 11 | Weather «det» errors at B1 complexity ("Det regnet hele dagen"). |
| `adverb-sted-hjem` | 12 | oppe/opp added to the existing ute/inne/hjemme set. |
| `setningsadverbial` | 12 | Review with jo/faktisk in longer sentences. |
| `derfor-fordi` | 12 | «derfor» test items (likevel goes to the new `motsetning-selv-om-likevel` topic instead). |
| `sammensatte-substantiv` | 13 | Currently C-only. B1-level compounding (barnestol, arbeidsmiljø, fødselspermisjon) is simpler than C's søvnproblemer-style compounds — extend down, same reasoning as `ordfamilie-avledning`. |

**Not built as grammar questions (vocab/uttrykk material instead):** the many "Sett inn ordene" /
"Synonymer" / "Antonymer" word-bank exercises throughout (ch. 3, 4, 5, 6, 13) are vocabulary
drills, not grammar points — their content feeds `vocab-b1.json`/`uttrykk-b1.json` if any headword
is missing, not `grammar.json`. Same treatment as every prior plan.

**Total: 9 new topics + 23 reused topic-touches = 32 topic-touches.** At roughly 8–12 questions
per touch (same density as A1/A2/C), this targets **~300–340 questions** — "as many as possible"
within the same per-topic depth the app already uses elsewhere, rather than an arbitrarily lower
cap.

---

## Rule text additions needed for reused topics (Phase 1, before Phase 2 content)

Five reused topics need a short addition to their existing `explanationNb` (and `explanationEn`
for consistency, though it's unused at runtime) before B1 entries can be written against them:

1. **`indirekte-tale-at-om`** — add the subject-extraction «som» rule: when the question word
   (hvem, hva, hvilken X) is itself the subject of the embedded clause, Norwegian inserts «som»
   directly after it — "Jeg vet ikke hvem **som** kommer i dag," "Han lurte på hva **som** hadde
   skjedd." No «som» when the question word is the object — "Jeg vet ikke hva **han** sier."
2. **`refleksivt-possessiv-sin`** — add the compound-subject exception: sin/sitt/sine only applies
   when the possessor is the ENTIRE subject of its own clause. When the subject is compound (Han
   og kundene), a same-clause reflexive can't refer back to just one part of it, so hans/hennes/
   deres is used instead: "Han og kundene **hans** liker å prate" (his customers), not "kundene
   sine."
3. **`infinitiv-a1`** — add: many verbs and adjectives are followed by a fixed preposition before
   the infinitive marker «å» — «bestemme seg for å», «ha lyst til å», «være ivrig etter å», «være
   opptatt med å» — while others take «for å» to express purpose, and a few take no preposition at
   all («jeg liker å», «det var umulig å»). These must be learned per expression, similar to how
   English varies ("decide to" vs. "look forward to -ing").
4. **`kvantorer`** — broaden beyond mye/mange/mer/flere: «få»/«lite» are the low-quantity mirror of
   «mange»/«mye» (samme tellelig/ikke-tellelig-skille); «noen»/«noe» follow the same countable/
   uncountable split (noen venner vs. noe informasjon); superlatives «de fleste» (countable) /
   «det meste» (uncountable) parallel mest/flest; «mindre»/«færre» are the comparative mirror of
   «mer»/«flere».
5. **`det-sentence`** — add the cleft-with-som pattern alongside the existing «At X er Y» → «Det er
   Y at X» pattern: fronting any subject with «Det er X som VP» — "Mange er bekymret" → "Det er
   mange **som** er bekymret," "Henrik fikk jobben" → "Det var Henrik **som** fikk jobben."

Two more reused topics get a **light reword** (not a content addition) so their rule text leads
with the B1-appropriate version before the harder C-level nuance, mirroring the precedent already
set for `relative-som` in `a2-quiz-and-grammar.md`'s Decisions section:

- **`ordfamilie-avledning`** — currently only has a C-level example (berømme→berømmelse). Add a
  B1-level example first (trygg→trygghet, operere→operasjon) so the rule reads B1-first.
- **`sammensatte-substantiv`** — currently only has a C-level example (søvnproblemer). Add a
  B1-level example first (barnestol, arbeidsmiljø) so the rule reads B1-first.

---

## Rule drafts (`src/lib/grammar/rules.ts`) — 9 new topics

```typescript
'framtid-uttrykk': {
  id: 'framtid-uttrykk',
  titleEn: 'Expressing the future',
  titleNb: 'Å uttrykke framtid',
  explanationEn:
    'Norwegian has no single future tense — several expressions cover it, each with its own ' +
    'complementation: «skal» (plan/intention), «vil» (prediction/willingness), «kommer til å» ' +
    '(prediction based on evidence), and fixed expressions like «har tenkt å», «har lyst til å», ' +
    '«håper (at)», «vil helst/gjerne» — each requiring a specific preposition or none at all ' +
    'before the infinitive.',
  explanationNb:
    'Norsk har ingen egen framtidstid — flere uttrykk dekker det, hvert med sin egen ' +
    'komplementering: «skal» (plan/intensjon), «vil» (spådom/vilje), «kommer til å» (spådom basert ' +
    'på bevis), og faste uttrykk som «har tenkt å», «har lyst til å», «håper (at)», «vil ' +
    'helst/gjerne» — hver med sin egen preposisjon eller ingen foran infinitiv.'
},

'for-sa-arsak-folge': {
  id: 'for-sa-arsak-folge',
  titleEn: '«for» vs. «så» (coordinating cause/result)',
  titleNb: '«for» og «så» (sideordning: årsak/følge)',
  explanationEn:
    'Both join two full main clauses with no change in word order. «For» states the CAUSE, ' +
    'placed in the second clause: "Hun kommer ikke i morgen, for hun har det travelt." «Så» ' +
    'states the RESULT, also in the second clause: "Hun har det travelt, så hun kommer ikke i ' +
    'morgen." Choosing correctly means identifying which clause is the cause and which is the ' +
    'result, then placing «for»/«så» before the one that is NOT the cause-first clause.',
  explanationNb:
    'Begge binder sammen to helsetninger uten å endre ordstillingen. «For» uttrykker ÅRSAKEN, ' +
    'plassert i den andre setningen: "Hun kommer ikke i morgen, for hun har det travelt." «Så» ' +
    'uttrykker FØLGEN, også i den andre setningen: "Hun har det travelt, så hun kommer ikke i ' +
    'morgen."'
},

'da-naar': {
  id: 'da-naar',
  titleEn: '«da» vs. «når»',
  titleNb: '«da» og «når»',
  explanationEn:
    'Use «da» for a SINGLE completed event in the past: "Da jeg var femten, flyttet jeg til ' +
    'Norge." Use «når» for a REPEATED/habitual past event, or for anything present or future: ' +
    '"Når jeg var liten, lekte jeg ute hver dag." (repeated) "Ring meg når du får tid." (future) ' +
    'A common test: if you can substitute "hver gang" and it still makes sense, use «når»; if it ' +
    'describes one specific occasion, use «da».',
  explanationNb:
    'Bruk «da» om én avsluttet hendelse i fortiden: "Da jeg var femten, flyttet jeg til Norge." ' +
    'Bruk «når» om en gjentatt/vanemessig hendelse i fortiden, eller om noe i presens/framtid: ' +
    '"Når jeg var liten, lekte jeg ute hver dag." (gjentatt) "Ring meg når du får tid." (framtid) ' +
    'Enkel test: hvis du kan sette inn "hver gang" og det fortsatt gir mening, bruk «når»; ' +
    'gjelder det én bestemt anledning, bruk «da».'
},

'hvis-om-betingelse': {
  id: 'hvis-om-betingelse',
  titleEn: '«hvis» vs. «om» (condition vs. embedded question)',
  titleNb: '«hvis» og «om» (betingelse og leddsetning)',
  explanationEn:
    '«Hvis» introduces a CONDITION ("if"): "Jeg kommer hvis jeg har tid." «Om» introduces an ' +
    'embedded YES/NO QUESTION ("whether"): "Jeg vet ikke om jeg har tid." The two look similar ' +
    'because both can often be translated "if" in English, but only «hvis» states a condition — ' +
    '«om» always follows a verb of asking/knowing/wondering about an uncertain fact.',
  explanationNb:
    '«Hvis» innleder en BETINGELSE: "Jeg kommer hvis jeg har tid." «Om» innleder en leddsetning ' +
    'som gjengir et JA/NEI-SPØRSMÅL: "Jeg vet ikke om jeg har tid." De to ligner fordi begge ofte ' +
    'kan oversettes med engelsk "if", men bare «hvis» uttrykker en betingelse — «om» kommer alltid ' +
    'etter et verb som spør/vet/lurer på noe usikkert.'
},

'passiv-bli-s': {
  id: 'passiv-bli-s',
  titleEn: 'Passive voice: bli-passiv and s-passiv',
  titleNb: 'Passiv: bli-passiv og s-passiv',
  explanationEn:
    'Norwegian has two passive forms. «Bli-passiv» = bli (in the right tense) + perfektum ' +
    'partisipp: "Bildene blir delt på nettet." "Hun ble dømt." «S-passiv» adds -s directly to the ' +
    'infinitive stem, common with modals and in instructions: "Regningen må betales." "Hvor kan ' +
    'den bestilles?" Use passive when the ACTION matters more than who performs it — the original ' +
    'object becomes the new subject: "Noen plager ham." → "Han blir plaget."',
  explanationNb:
    'Norsk har to passivformer. «Bli-passiv» = bli (i riktig tid) + perfektum partisipp: "Bildene ' +
    'blir delt på nettet." "Hun ble dømt." «S-passiv» legger -s direkte til infinitivstammen, ' +
    'vanlig sammen med modalverb og i instruksjoner: "Regningen må betales." "Hvor kan den ' +
    'bestilles?" Bruk passiv når HANDLINGEN betyr mer enn hvem som utfører den — det opprinnelige ' +
    'objektet blir det nye subjektet: "Noen plager ham." → "Han blir plaget."'
},

'bade-og-verken-eller': {
  id: 'bade-og-verken-eller',
  titleEn: '«både … og» / «verken … eller»',
  titleNb: '«både … og» og «verken … eller»',
  explanationEn:
    '«Både X og Y» means "both X and Y" — a positive pairing: "Jeg liker både fotball og ski." ' +
    '«Verken X eller Y» means "neither X nor Y" — a negative pairing, and the verb stays ' +
    'affirmative (no extra «ikke» is added): "Jeg liker verken fotball eller ski."',
  explanationNb:
    '«Både X og Y» uttrykker en positiv sammenstilling: "Jeg liker både fotball og ski." «Verken ' +
    'X eller Y» uttrykker en negativ sammenstilling, og verbet forblir bekreftende (ingen ekstra ' +
    '«ikke» legges til): "Jeg liker verken fotball eller ski."'
},

'adjektiv-eller-adverb': {
  id: 'adjektiv-eller-adverb',
  titleEn: 'Adjective or adverb? (sikker/sikkert, god/godt)',
  titleNb: 'Adjektiv eller adverb?',
  explanationEn:
    'Many Norwegian adjectives share their neuter (-t) form with an adverb used to modify a verb. ' +
    'Use the AGREEING adjective form when describing a noun/subject: "Jeg er sikker på det." ' +
    '(sikker agrees with "jeg", masculine/feminine.) Use the -t form when modifying a VERB: "Det ' +
    'går sikkert bra." Same pattern: "Maten var god" (adjective, describes maten) vs. "Den ' +
    'smakte godt" (adverb, modifies smakte).',
  explanationNb:
    'Mange norske adjektiver deler intetkjønnsformen (-t) med et adverb som brukes til å beskrive ' +
    'et verb. Bruk den SAMSVARENDE adjektivformen når du beskriver et substantiv/subjekt: "Jeg er ' +
    'sikker på det." Bruk -t-formen når du beskriver et VERB: "Det går sikkert bra." Samme ' +
    'mønster: "Maten var god" (adjektiv, beskriver maten) mot "Den smakte godt" (adverb, beskriver ' +
    'smakte).'
},

'motsetning-selv-om-likevel': {
  id: 'motsetning-selv-om-likevel',
  titleEn: '«men» vs. «selv om» vs. «likevel»',
  titleNb: '«men», «selv om» og «likevel»',
  explanationEn:
    'Three ways to express the same contrast, each with different grammar. «Men» coordinates two ' +
    'main clauses, no word-order change: "De savner familien, men de vil bli her." «Selv om» ' +
    'subordinates the concession clause (normal subordinate word order, can go first or second): ' +
    '"Selv om de savner familien, vil de bli her." «Likevel» is a sentence adverb that fronts and ' +
    'triggers V2 inversion like any other fronted adverbial: "De savner familien. Likevel vil de ' +
    'bli her."',
  explanationNb:
    'Tre måter å uttrykke samme motsetning på, med ulik grammatikk. «Men» sideordner to ' +
    'helsetninger, ingen endring i ordstilling: "De savner familien, men de vil bli her." «Selv ' +
    'om» underordner innrømmelsesleddsetningen (vanlig leddsetningsordstilling, kan stå først ' +
    'eller sist): "Selv om de savner familien, vil de bli her." «Likevel» er et setningsadverb som ' +
    'fronter og utløser V2-inversjon som ethvert annet fundamentplassert adverbial: "De savner ' +
    'familien. Likevel vil de bli her."'
},

'tidssekvens-etter-at-etterpaa': {
  id: 'tidssekvens-etter-at-etterpaa',
  titleEn: '«etter at» vs. «etterpå» vs. «så»',
  titleNb: '«etter at», «etterpå» og «så»',
  explanationEn:
    'All three sequence two events, but behave differently. «Etter at» is a subjunction ' +
    'introducing a subordinate clause (normal subordinate word order): "Etter at jeg hadde spist, ' +
    'gikk jeg en tur." «Etterpå» is a sentence adverb — as its own clause opener it triggers V2 ' +
    'inversion: "Jeg spiste. Etterpå gikk jeg en tur." «Så» is a coordinating conjunction joining ' +
    'two main clauses with no inversion: "Jeg spiste, så gikk jeg en tur."',
  explanationNb:
    'Alle tre rekkefølger to hendelser, men oppfører seg ulikt. «Etter at» er en subjunksjon som ' +
    'innleder en leddsetning (vanlig leddsetningsordstilling): "Etter at jeg hadde spist, gikk jeg ' +
    'en tur." «Etterpå» er et setningsadverb — som setningsåpner utløser det V2-inversjon: "Jeg ' +
    'spiste. Etterpå gikk jeg en tur." «Så» er en sideordningskonjunksjon som binder sammen to ' +
    'helsetninger uten inversjon: "Jeg spiste, så gikk jeg en tur."'
}
```

---

## Content plan (`src/lib/data/grammar.json`)

IDs: `gq-{short-topic}-00X`, following the existing convention (continuing numbering for reused
topics, starting fresh for new ones). Type mix per topic, adapted to what the point actually
tests: heavier on `fill`/`transform` for `passiv-bli-s` and `framtid-uttrykk` (conjugation/form
drills), heavier on `order`/`transform` for the word-order-sensitive new topics
(`motsetning-selv-om-likevel`, `tidssekvens-etter-at-etterpaa`, `for-sa-arsak-folge`),
`minimal-pair` well suited to the paired-choice topics (`da-naar`, `hvis-om-betingelse`,
`bade-og-verken-eller`, `adjektiv-eller-adverb`). All B1, so sentences can run longer and use more
connected, paragraph-style content than A1/A2 (matching the workbook's own step up in complexity),
but should stay within B1-level vocabulary — cross-check names/nouns/verbs against
`vocab-b1.json`/`uttrykk-b1.json` rather than inventing words above the level.

---

## Vocab verification script

Build `scripts/check-b1-grammar-vocab.mjs`, adapted from `scripts/check-a2-grammar-vocab.mjs`
(same lemma-matching logic — suffix stemming, irregular-verb-form map, phrase-lemma handling),
pointed at `vocab-b1.json`/`uttrykk-b1.json` with `vocab-a1.json`/`vocab-a2.json` (+ their uttrykk
files) as a fallback pool, since B1 sentences will naturally reuse a lot of earlier-level
vocabulary. Scope to the 32 B1 topic-touches (`cefr: 'B1'` entries only, so the reused topics'
A1/A2/B2/C entries aren't checked here). Run after each topic, same workflow as every prior plan's
Phase 3.

Also run `scripts/check-grammar-norwegian.mjs` against all 32 topic-touches once content is
written, per `grammar-with-only-norsk.md` — this is a general regression guard now, not a
one-time conversion, so every new B1 batch should pass it before merging.

---

## Plus gating

**B1 is paid-tier content, same as A2 and B2** (confirmed directly from `config.ts`:
`FREE_GRAMMAR_TOPICS` currently contains only A1 topics plus 4 original topics
`ikke-placement`/`v2-word-order`/`det-er-ikke`/`modal-verb-order` — no B1-primary topic is a
member, and `PLUS_CATEGORIES` gates the entire B1 vocab tier except `travel`/`environment`/`media`).
Following the exact precedent set in `a2-quiz-and-grammar.md`:

- The 9 new topics: questions `plusOnly: false`/omitted (matching the overwhelming majority
  pattern at every level — gating happens at the topic-picker level, not the question level), but
  **do not** add them to `FREE_GRAMMAR_TOPICS`. They join the existing pool of Plus-locked B1/A2
  topics (`adj-comparison`, `subordinate-order`, `sterke-verb`, etc.).
- New B1 entries in reused topics inherit whatever gating that topic already has — no
  `config.ts` change needed for any of them:
  - **Already free** (11 of the 23 reused topics, confirmed against the `FREE_GRAMMAR_TOPICS`
    `Set` in `config.ts`): `og-men`, `indirekte-tale-at-om`, `noun-plurals`, `noun-articles`,
    `noun-possessives`, `refleksivt-possessiv-sin`, `adj-agreement`, `infinitiv-a1`,
    `helsetninger`, `vaer-det-subjekt`, `adverb-sted-hjem`. Their new B1 entries are automatically
    reachable (still capped at `FREE_GRAMMAR_PER_TOPIC` = 3 playable questions for non-Plus users,
    same mechanism as every prior plan).
  - **Not free / Plus-locked at the picker** (12 of the 23 reused topics): `presens-perfektum`,
    `subordinate-order`, `refleksive-verb`, `adj-comparison`, `relative-som`,
    `ordfamilie-avledning`, `kvantorer`, `modalverb-preteritum`, `det-sentence`,
    `setningsadverbial`, `derfor-fordi`, `sammensatte-substantiv`. Their new B1 entries stay
    topic-locked for free users by default — no action needed, this just inherits the existing
    status quo, exactly like `a2-quiz-and-grammar.md`'s equivalent list.

**Verify this split directly against `FREE_GRAMMAR_TOPICS` in `config.ts` at the start of Phase 4**
rather than trusting the list above from memory — write it out fresh by checking each of the 32
topic-touches against the actual `Set` contents, the same discipline every prior plan's Phase 4
used, since it's easy to misremember which of two similarly-named topics (`refleksive-uttrykk` vs.
`refleksive-verb`, `infinitiv-a1` vs. others) is the free one.

---

## Implementation phases

### Phase 1 — Rules + types

1. Add 9 new topics to `GrammarTopic` in `src/lib/types.ts`.
2. Add 9 new `GrammarRule` entries to `src/lib/grammar/rules.ts` (drafted above).
3. Apply the 5 rule-text additions to reused topics (`indirekte-tale-at-om`,
   `refleksivt-possessiv-sin`, `infinitiv-a1`, `kvantorer`, `det-sentence`) listed above, before
   writing any B1 entries against them.
4. Apply the 2 light rewords (`ordfamilie-avledning`, `sammensatte-substantiv`) so their rule text
   reads B1-first.
5. Confirm no vocab gaps block Phase 2 — spot-check a handful of textbook-specific words (blokk,
   samboer, arbeidsledig, tariffavtale, uføretrygd, etc.) against `vocab-b1.json` directly; add any
   missing headwords before content-writing begins, same discipline as the A2 plan's audit step.

### Phase 2 — Content, built in the same chapter order as the workbook (1→15)

1. `framtid-uttrykk` (ch. 1) ✅ Done
2. `presens-perfektum` (B1 entries, ch. 1 — three-way presens/preteritum/perfektum contrast) ✅ Done
3. `helsetninger` (B1 entries, ch. 1 — wh-question word order) ✅ Done
4. `for-sa-arsak-folge` (ch. 2) ✅ Done
5. `da-naar` (ch. 2) ✅ Done
6. `hvis-om-betingelse` (ch. 2) ✅ Done
7. `og-men` (B1 entries, ch. 2) ✅ Done
8. `indirekte-tale-at-om` (B1 entries, ch. 2 — hva sier/spør) ✅ Done
9. `subordinate-order` (B1 entries, ch. 2) ✅ Done
10. `noun-plurals` (B1 entries, ch. 3) ✅ Done
11. `noun-articles` (B1 entries, ch. 3) ✅ Done
12. `noun-possessives` (B1 entries, ch. 3 — genitiv -s) ✅ Done
13. `refleksive-verb` (B1 entries, ch. 4 — broader verb set) ✅ Done
14. `refleksivt-possessiv-sin` (B1 entries, ch. 4 — compound-subject exception) ✅ Done
15. `noun-possessives` (more B1 entries, ch. 4 — deres/vår) ✅ Done
16. `adj-agreement` (B1 entries, ch. 5) ✅ Done
17. `passiv-bli-s` (ch. 6) ✅ Done
18. `bade-og-verken-eller` (ch. 6) ✅ Done
19. `adj-comparison` (B1 entries, ch. 7) ✅ Done
20. `relative-som` (B1 entries, ch. 8) ✅ Done
21. `indirekte-tale-at-om` (more B1 entries, ch. 8 — wh-embedding + som-subject rule) ✅ Done
22. `infinitiv-a1` (B1 entries, ch. 9 — preposition + infinitive collocations) ✅ Done
23. `ordfamilie-avledning` (B1 entries, ch. 9) ✅ Done
24. `kvantorer` (B1 entries, ch. 10) ✅ Done
25. `modalverb-preteritum` (B1 entries, ch. 10)
26. `det-sentence` (B1 entries, ch. 11 — cleft «det er … som»)
27. `helsetninger` (more B1 entries, ch. 11 — presentational det)
28. `vaer-det-subjekt` (B1 entries, ch. 11)
29. `adverb-sted-hjem` (B1 entries, ch. 12 — oppe/opp)
30. `adjektiv-eller-adverb` (ch. 12)
31. `setningsadverbial` (B1 entries, ch. 12)
32. `derfor-fordi` (B1 entries, ch. 12)
33. `sammensatte-substantiv` (B1 entries, ch. 13)
34. `ordfamilie-avledning` (more B1 entries, ch. 14)
35. `motsetning-selv-om-likevel` (ch. 14, 15)
36. `tidssekvens-etter-at-etterpaa` (ch. 15)
37. `ordfamilie-avledning` (more B1 entries, ch. 15 — demokrati/rasist/religion adjectives)

(Several reused topics appear more than once in this list because their source material spans
multiple chapters — same pattern as `preposisjoner-tid`/`preposisjoner-sted` did across the A1/A2
plans. Build them together in one content-writing pass per topic rather than literally in this
chapter-interleaved order, unless it's more convenient to do it incrementally.)

### Phase 3 — Vocab verification

Build and run `scripts/check-b1-grammar-vocab.mjs` after each topic in Phase 2, not just at the
end. Also run `scripts/check-grammar-norwegian.mjs` per topic (or in batches) to confirm every
`prompt`/`hint`/`explanation` is Norwegian-only from the start — no conversion pass needed
afterward, unlike A1/A2/B1's _existing_ 76 entries, which predate that decision and were converted
retroactively.

### Phase 4 — Gating + wiring

1. Verify `plusOnly: false`/omitted on all new questions (9 new topics + 23 reused topics' B1
   entries) — spot-check via `grammar.json` directly, same as every prior plan.
2. Confirm the `FREE_GRAMMAR_TOPICS` split documented in "Plus gating" above against the actual
   `Set` in `config.ts` — no changes needed if the split holds, but verify rather than assume.
3. Update the admin `+page.svelte` `TOPICS` constant to add the 9 new topics, so they're
   authorable/editable through the admin UI (same gap flagged in every prior plan's Phase 1/4).
4. Confirm `/grammar` and `/grammar/[topic]` need no route changes — both derive their topic list
   dynamically from `grammar.json` content, not from any hardcoded topic array (confirmed
   structurally unchanged since the A1 plan verified this).

---

## Testing

- No new grading logic needed (existing types are type-agnostic — same as every prior plan).
- Extend the check that every question's `topic` resolves to an entry in `GRAMMAR_RULES` to cover
  the 9 new topics.

---

## Decisions (resolved)

- **`indirekte-tale-at-om` vs. a dedicated «som»-subject-extraction topic:** considered splitting
  the ch. 8 subject-extraction rule (hvem/hva **som** as embedded subject) into its own topic,
  since it's a distinct mechanic from at/om reporting. **Resolved: fold into `indirekte-tale-at-om`,
  no new topic.** The rule only kicks in when the wh-word happens to be the subject of the
  embedded clause — a conditional add-on to "how do you embed a wh-question," not a different
  grammatical operation — and `a2-quiz-and-grammar.md` already set the precedent of extending this
  exact topic for wh-embedding rather than creating a new one at A2. Splitting it out would also
  produce a thin standalone topic (one rule, one exception). Revisit only if Phase 2
  content-writing finds the combined topic getting unwieldy.
- **`infinitiv-a1` absorbing B1 preposition+infinitive content:** similarly, considered a
  standalone `preposisjon-infinitiv` topic for ch. 9's til/for/no-preposition collocations.
  **Resolved: fold into `infinitiv-a1`, no new topic.** Same underlying skill (what comes
  immediately before an infinitive) at a harder level, matching the "one topic = one point, not
  one CEFR level" principle the other three plans establish (e.g. `noun-plurals` spans A1/A2/B1,
  `relative-som` spans A2/B2). **Caveat:** this call is less clean than the first one, since the
  prepositions themselves (for/til/etter/med) are closer to fixed lexical collocations (arbitrary,
  memorized per-verb) than to a generalizable word-order rule — the kind of content that normally
  routes to `uttrykk-b1.json` instead of `grammar.json`. Kept as a grammar-topic treatment because
  the *pattern* — verb/adjective + preposition + å + infinitive — is a teachable structural rule,
  not just individual words to memorize. If content-writing in Phase 2 finds the preposition
  choice for a given verb is purely rote with no generalizable pattern, route that item to
  `uttrykk-b1.json` instead rather than forcing it into a grammar question.
