# Nivå C Grammar — Implementation Plan (revised)

## Overview

Full reassessment after reading all of `draft/c/grammar/` (grammatikk.md,
`1-11-substantiv-ubestemt-artikkel.md`, `12-24-adjektiv.md`, `25-39-verb.md`, `40-51.md`,
`52-63.md`, `64-71.md`, `72-82.md`, `83-92.md`, `93-103.md`, `answers.md`, `innhold.md`). The
earlier 5-topic, ~50-question plan covered only `grammatikk.md` and undersold what the textbook
actually contains. This version covers **items 1–63** as 21 new topics, **items 83–103** as
three idiom-recognition topics split into parts (24 total), and **items 64–82** as a source of
extra vocab/sentence material folded into the 24 topics rather than built as standalone cloze
passages (reasons below).

**Copyright approach (unchanged):** every question is newly written, using the textbook only as a
guide to which rule and difficulty to target — never copying or closely paraphrasing its
sentences. This matters more for items 38–41 specifically, which are woven around a named
character ("Annemor") from what reads like a real short story excerpt — those get freshly
invented, self-contained sentences instead.

**Vocab integration (unchanged):** every question must contain a real headword from
`vocab-c.json` or `uttrykk-c.json`, checked by a verification script before merging.

**Question types:** `'fill' | 'order' | 'transform' | 'minimal-pair'` are already implemented in
`src/lib/types.ts` and cover 21 of the 24 topics. The three `uttrykk-gjenkjenning-c-*` topics
need one addition: a true 3-option `type: 'multiple-choice'` (see Phase 1.5).

---

## Scope decisions

### In scope: items 1–63 → 21 new topics (~180–220 questions)

### In scope: items 83–103 → 3 new topics, `uttrykk-gjenkjenning-c-1/2/3` (idiom recognition)

Revised after reading the actual content (not just `answers.md`'s letter key). This isn't MC
retesting of existing grammar — it's a dedicated idiom-recognition drill: each item bolds one
fixed expression in a sentence ("Hun har fått kalde føtter," "Skinnet bedrar," "Han sliter for å
få endene til å møtes") and asks which of three paraphrases means the same thing. Roughly 400
idioms across the 21 sub-lists (items 83–103), organized loosely by theme/keyword (body parts,
animals, common verbs like bite/dra/falle). This is probably the single richest source of
`uttrykk-c.json`-level material in the whole textbook, so it's worth the one schema addition it
needs: a true 3-option `type: 'multiple-choice'` (`minimal-pair` only supports 2 options).

Given the volume, split into three topics by item range rather than one: `uttrykk-gjenkjenning-c-1`
(items 83–89), `uttrykk-gjenkjenning-c-2` (items 90–96), `uttrykk-gjenkjenning-c-3` (items 97–103)
— 7 sub-lists each. Aim for every idiom in each range that has a real `uttrykk-c.json` match
(likely well over the ~30–40 originally proposed, given how much overlap this textbook probably
already has with `uttrykk-c.json`) — actual per-part counts depend on the matching script in
Phase 2 (idiom recognition).

### Mined, not built as-is: items 64–82 (cloze passages)

These aren't isolated sentences — they're long cloze passages embedded in running text. Some are
factual (sleep science, the history of Norwegian Christmas traditions), but others are extended
excerpts from what read like actual published short stories/novels (a "Karsten" narrative, a "Mey
and Robby" narrative, a "pastor Andersen" narrative). Reproducing or closely paraphrasing
someone else's narrative fiction at that length is a materially bigger copyright concern than
inventing single sentences, and the cloze-passage format (many blanks across one long paragraph)
doesn't fit the current per-question `GrammarQuestion` schema — so we won't build these as
passages. But the vocabulary and grammar points embedded in them (Christmas-tradition vocab,
sleep-science vocab, verb-tense patterns) shouldn't just be dropped: while drafting content for
the 24 topics above, pull individual grammar+vocab pairings from these passages and rewrite them
as fresh, self-contained single sentences under whichever topic fits (see Phase 2, "mining
note"). The passage _format_ itself — as its own reading-comprehension feature — stays a separate
future project, scoped and built later if wanted.

---

## New topics (24)

Grouped by theme, with their source items from `innhold.md` and priority.

### Nouns & articles

| Topic                    | Source     | Notes                                                                                                     |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| `ubestemt-artikkel-c`    | items 7–8  | yrke/adjektiv, uncountables, reisemåte, uttrykk, optional article                                         |
| `substantiv-uttrykk-c`   | items 1–8  | noun forms _inside fixed idioms_ (ta hånd om, stå til liv, gå som fot i hose) — direct uttrykk-c.json fit |
| `sammensatte-substantiv` | items 9–11 | building compound nouns from a description                                                                |

### Adjectives

| Topic                        | Source             | Notes                                                                           |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `adj-mer-mest`               | items 13–19, 22–24 | adjective classes that never take -ere/-est                                     |
| `adj-farger-uboyelige`       | item 13            | oransje/lilla/rosa/beige — never inflect                                        |
| `adj-partisipp-som-adjektiv` | items 16–17        | irregular predikativ forms of participle-adjectives (skvetten, sunget, stjålet) |
| `predikativ-agreement`       | items 12, 20–21    | predikativ non-agreement + exceptions                                           |

### Verb tense & mood

| Topic                          | Source        | Notes                                                                     | Priority |
| ------------------------------ | ------------- | ------------------------------------------------------------------------- | -------- |
| `verbform-i-kontekst`          | items 25–27   | infinitiv/presens across multi-verb sentences                             | low      |
| `sterke-verb-c`                | items 28–29   | rare strong verbs (bry seg, briste, by, gale, sige, fyke, kvekke)         | high     |
| `perfektum-pluskvamperfektum`  | items 30–34   | tense choice + word order with sentence adverbials                        | high     |
| `futurum-referert`             | items 35–37   | 2. futurum — evidential/reported "skal ha X"                              | high     |
| `kondisjonalis-counterfactual` | items 38–41   | 1./2. kondisjonalis + om-setninger (own sentences, not the Annemor story) | high     |
| `verbet-a-fa`                  | grammatikk.md | meanings of «å få» + hjelpeverb uses                                      | high     |

### Word order & conjunctions

| Topic                         | Source                  | Notes                                                                  |
| ----------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `leddsetning-som-fundament`   | items 42–46             | subordinate clause filling the front field, adverbial placement inside |
| `ordet-sa`                    | grammatikk.md + item 47 | så as konjunksjon / tidsadverb / subjunksjon                           |
| `koordinerende-konjunksjoner` | item 72                 | og/eller/men/for/så choice + comma rule                                |

### Word formation & paraphrase

| Topic                  | Source            | Notes                                                    |
| ---------------------- | ----------------- | -------------------------------------------------------- |
| `ordfamilie-avledning` | items 48–51       | deriving noun/verb/adjective/adverb within a word family |
| `omskriving-passiv`    | items 52–55       | active↔passive, casual→formal nominalized paraphrase     |
| `jo-desto-komparativ`  | item 54 (pattern) | jo + comparative … desto/jo + comparative correlative    |

### Prepositions

| Topic                             | Source                     | Notes                                                |
| --------------------------------- | -------------------------- | ---------------------------------------------------- |
| `preposisjoner-kroppsdel-uttrykk` | items 56, 59, 61 (partial) | body-part idiom prepositions (hår, nakke, hals, øre) |
| `preposisjoner-generelt-c`        | items 57–58, 60, 62–63     | general idiomatic preposition collocations           |

### Idiom recognition

| Topic                      | Source       | Notes                                                                                                |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `uttrykk-gjenkjenning-c-1` | items 83–89  | ~130 idioms; select all with a real `uttrykk-c.json` match; needs `multiple-choice` type (Phase 1.5) |
| `uttrykk-gjenkjenning-c-2` | items 90–96  | same approach, next 7 sub-lists                                                                      |
| `uttrykk-gjenkjenning-c-3` | items 97–103 | same approach, final 7 sub-lists                                                                     |

**Total: 24 topics.** At ~8–12 questions each for the first 21, plus a larger batch per idiom
part (exact size depends on the `uttrykk-c.json` matching script, likely ~40–60 each): roughly
**~300–360 questions overall.**

---

## Rule definitions (`src/lib/grammar/rules.ts`)

```typescript
'ubestemt-artikkel-c': {
  id: 'ubestemt-artikkel-c',
  titleEn: 'Indefinite article — advanced cases',
  titleNb: 'Ubestemt artikkel — avanserte tilfeller',
  explanationEn:
    'Professions/nationalities after «være»/«bli» drop the article ("Hun er lærer"), but an ' +
    'adjective forces it back in ("Hun er en flink lærer"). Uncountable nouns (mat, drikke, ' +
    'snø) normally take no article even with an adjective; adding one changes the meaning to a ' +
    'countable unit. Means of transport after «med» drops the article ("med fly"), restored by ' +
    'an adjective. Many fixed uttrykk (gå på kino) also drop the article, restored by an ' +
    'adjective. A few verbs make the article optional: "Jeg skal kjøpe (en) bil."',
  explanationNb:
    'Yrker/nasjonaliteter etter «være»/«bli» har ingen artikkel ("Hun er lærer"), men et ' +
    'adjektiv krever artikkel igjen ("Hun er en flink lærer"). Ikke-tellelige substantiv (mat, ' +
    'drikke, snø) har vanligvis ingen artikkel selv med adjektiv; med artikkel blir det en ' +
    'tellbar enhet. Transportmiddel etter «med» har ingen artikkel ("med fly"), gjeninnført av ' +
    'adjektiv. Mange faste uttrykk (gå på kino) dropper også artikkelen, gjeninnført av ' +
    'adjektiv. Noen verb gjør artikkelen valgfri: "Jeg skal kjøpe (en) bil."'
},

'substantiv-uttrykk-c': {
  id: 'substantiv-uttrykk-c',
  titleEn: 'Noun forms inside fixed idioms',
  titleNb: 'Substantivformer i faste uttrykk',
  explanationEn:
    'Many fixed idioms use a noun in one specific form only, and getting that form wrong ' +
    'changes or breaks the expression: "ta hånd om" (take care of), "stå til liv" (attempt to ' +
    'kill), "gå som fot i hose" (fit perfectly), "holde hodet over vannet" (stay afloat ' +
    'financially), "få kalde føtter", "slå hånd av" (disown). This means recognizing the idiom, ' +
    'not just applying the regular gender/plural rule.',
  explanationNb:
    'Mange faste uttrykk bruker et substantiv i én bestemt form, og feil form endrer eller ' +
    'ødelegger uttrykket: «ta hånd om», «stå til liv», «gå som fot i hose», «holde hodet over ' +
    'vannet», «få kalde føtter», «slå hånd av». Å produsere riktig form her betyr å kjenne igjen ' +
    'uttrykket, ikke bare å bruke den vanlige kjønns-/flertallsregelen.'
},

'sammensatte-substantiv': {
  id: 'sammensatte-substantiv',
  titleEn: 'Compound noun formation',
  titleNb: 'Å lage sammensatte substantiv',
  explanationEn:
    'Norwegian regularly builds precise compound nouns from a descriptive phrase: "problemer ' +
    'med søvnen" → søvnproblemer, "en person som gir råd" → rådgiver, "frekvensen av selvmord" ' +
    '→ selvmordsfrekvensen. Getting it right requires choosing the correct linking form (with ' +
    'or without -s-) and knowing which element comes first.',
  explanationNb:
    'Norsk bygger jevnlig presise sammensatte substantiv fra en beskrivende frase: «problemer ' +
    'med søvnen» → søvnproblemer, «en person som gir råd» → rådgiver, «frekvensen av selvmord» ' +
    '→ selvmordsfrekvensen. Å lage riktig sammensetning krever å velge riktig bindeform (med ' +
    'eller uten -s-) og å vite hvilket ledd som kommer først.'
},

'adj-mer-mest': {
  id: 'adj-mer-mest',
  titleEn: 'Adjectives compared with mer/mest',
  titleNb: 'Adjektiv som gradbøyes med mer/mest',
  explanationEn:
    'Several adjective classes never take -ere/-est: adjectives ending in -isk (praktisk), ' +
    'past/present participles (kjent, levende), adjectives ending in -et/-ete, -en, some -e, ' +
    '-iv, -ær, and most long/borrowed adjectives (interessant, fleksibel).',
  explanationNb:
    'Flere adjektivklasser tar aldri -ere/-est: adjektiv på -isk (praktisk), partisipper ' +
    '(kjent, levende), adjektiv på -et/-ete, -en, noen på -e, -iv, -ær, og de fleste ' +
    'lange/importerte adjektiv (interessant, fleksibel).'
},

'adj-farger-uboyelige': {
  id: 'adj-farger-uboyelige',
  titleEn: 'Invariable color adjectives',
  titleNb: 'Ubøyelige fargeadjektiv',
  explanationEn:
    'Several color adjectives borrowed from nouns never inflect for gender, number, or ' +
    'definiteness: oransje, lilla, rosa, beige. "en oransje bil," "et oransje hus," "de oransje ' +
    'bilene" — always the same form, unlike native color adjectives (rød, blå, grønn).',
  explanationNb:
    'Flere fargeadjektiv lånt fra substantiv bøyes aldri i kjønn, tall eller bestemthet: ' +
    'oransje, lilla, rosa, beige. «en oransje bil», «et oransje hus», «de oransje bilene» — ' +
    'alltid samme form, i motsetning til opprinnelige fargeadjektiv (rød, blå, grønn).'
},

'adj-partisipp-som-adjektiv': {
  id: 'adj-partisipp-som-adjektiv',
  titleEn: 'Participles as adjectives — irregular predikativ forms',
  titleNb: 'Partisipp som adjektiv — uregelmessig predikativform',
  explanationEn:
    'Participles used as adjectives sometimes take irregular predikativ forms that don\'t ' +
    'follow the normal -t/-e pattern: "skvetten" (startled) → "Han er skvetten," not "skvett"; ' +
    '"sunget" stays "sunget" in predikativ; "stjålet" (stolen) takes an irregular -et form. ' +
    'Learned case by case, not derived from a rule.',
  explanationNb:
    'Partisipp brukt som adjektiv tar noen ganger uregelmessige predikativformer som ikke ' +
    'følger det vanlige -t/-e-mønsteret: «skvetten» → «Han er skvetten», ikke «skvett»; ' +
    '«sunget» forblir «sunget» i predikativ; «stjålet» tar en uregelmessig -et-form. Læres ' +
    'enkeltvis, ikke utledes fra en regel.'
},

'predikativ-agreement': {
  id: 'predikativ-agreement',
  titleEn: 'Predikativ adjective agreement',
  titleNb: 'Samsvarsbøyning av predikativ',
  explanationEn:
    'A predikativ adjective (after være, bli, hete, se … ut) never takes the definite -e ' +
    'ending. With an ubestemt subject, the predikativ goes in intetkjønn, not plural: ' +
    '"Grønnsaker er sunt," not sunne — but a definite subject restores normal agreement: ' +
    '"Grønnsakene er sunne." Exceptions stay unbent: strong-verb -et participles (skrevet), ' +
    'weak-verb/passive participles (registrert), compound-verb participles (flislagt), and ' +
    'adjectives in fixed prepositional phrases (glad i, klar over, vant til).',
  explanationNb:
    'Et predikativt adjektiv (etter være, bli, hete, se … ut) bøyes aldri i bestemt form. Med ' +
    'ubestemt subjekt bøyes predikativet i intetkjønn, ikke flertall: «Grønnsaker er sunt», ' +
    'ikke sunne — men bestemt subjekt gir vanlig samsvar igjen: «Grønnsakene er sunne». Unntak: ' +
    '-et-partisipp av sterke verb (skrevet), partisipp av svake verb/passiv (registrert), ' +
    'sammensatte verbs partisipp (flislagt), og adjektiv i faste preposisjonsuttrykk (glad i, ' +
    'klar over, vant til).'
},

'verbform-i-kontekst': {
  id: 'verbform-i-kontekst',
  titleEn: 'Infinitive vs. presens across a sentence',
  titleNb: 'Infinitiv eller presens gjennom en setning',
  explanationEn:
    'Choosing between the bare infinitive (after modals, "pleier," "begynner") and the ' +
    'conjugated presens form is an A1/A2 rule, but applying it correctly across a long sentence ' +
    'with three or four verb slots at once is a genuine accuracy challenge at C level. ' +
    'Questions use the actual C-level verbs from `draft/c/grammar/25-39-verb.md` items 25–27 ' +
    '(cross-checked against `vocab-c.json`), not generic A1 verbs, so the vocabulary load ' +
    'matches the rest of the C-level content.',
  explanationNb:
    'Å velge mellom bar infinitiv (etter modale hjelpeverb, «pleier», «begynner») og bøyd ' +
    'presensform er en A1/A2-regel, men å bruke den riktig gjennom en lang setning med tre eller ' +
    'fire verbplasser samtidig er en reell presisjonsutfordring på nivå C. Spørsmålene bruker de ' +
    'faktiske nivå C-verbene fra `draft/c/grammar/25-39-verb.md` punkt 25–27 (kryssjekket mot ' +
    '`vocab-c.json`), ikke generiske A1-verb, slik at ordforrådet passer med resten av ' +
    'nivå-C-innholdet.'
},

'sterke-verb-c': {
  id: 'sterke-verb-c',
  titleEn: 'Rare strong verbs',
  titleNb: 'Sjeldne sterke verb',
  explanationEn:
    'A set of rarer strong verbs beyond the common A2/B1 list, with irregular ' +
    'preteritum/perfektum forms that must be memorized: bry seg (brydde/brøt), briste (brast), ' +
    'by (bød), gale (gol/galte), sige (seg), fyke (føk/føyk), kvekke (kvakk).',
  explanationNb:
    'Et sett med sjeldnere sterke verb utover den vanlige A2/B1-listen, med uregelmessige ' +
    'preteritum-/perfektumformer som må pugges: bry seg (brydde/brøt), briste (brast), by ' +
    '(bød), gale (gol/galte), sige (seg), fyke (føk/føyk), kvekke (kvakk).'
},

'perfektum-pluskvamperfektum': {
  id: 'perfektum-pluskvamperfektum',
  titleEn: 'Perfektum/pluskvamperfektum in context',
  titleNb: 'Perfektum/pluskvamperfektum i sammenheng',
  explanationEn:
    'Choosing correctly between preteritum, perfektum, and pluskvamperfektum in longer ' +
    'sentences, especially where a sentence adverbial (jo, faktisk, nettopp, ennå) or a fronted ' +
    'time expression forces a specific word order around the auxiliary verb.',
  explanationNb:
    'Å velge riktig mellom preteritum, perfektum og pluskvamperfektum i lengre setninger, ' +
    'særlig der et setningsadverbial (jo, faktisk, nettopp, ennå) eller et fronted tidsuttrykk ' +
    'tvinger fram en bestemt ordstilling rundt hjelpeverbet.'
},

'futurum-referert': {
  id: 'futurum-referert',
  titleEn: '2. futurum — reported/alleged action',
  titleNb: '2. futurum — referert/påstått handling',
  explanationEn:
    '"2. futurum" (skal + ha + perfektum partisipp) expresses a reported or alleged past action ' +
    'the speaker hasn\'t personally verified — an evidential construction typical of news ' +
    'reporting: "Tyvene skal ha brutt mange av reglene" (The thieves are reported to have ' +
    'broken many rules).',
  explanationNb:
    '«2. futurum» (skal + ha + perfektum partisipp) uttrykker en referert eller påstått ' +
    'tidligere handling som taleren ikke selv har bekreftet — en evidensiell konstruksjon ' +
    'typisk for nyhetsspråk: «Tyvene skal ha brutt mange av reglene».'
},

'kondisjonalis-counterfactual': {
  id: 'kondisjonalis-counterfactual',
  titleEn: '1./2. kondisjonalis',
  titleNb: '1./2. kondisjonalis',
  explanationEn:
    '1. kondisjonalis (skulle + infinitiv) expresses an unfulfilled plan in the past ("Jeg ' +
    'skulle handle på Rema, men gjorde det ikke"). 2. kondisjonalis (ville/kunne + ha + ' +
    'perfektum partisipp), usually paired with a pluskvamperfektum om-clause, expresses a ' +
    'counterfactual: "Om jeg hadde vært rikere, ville jeg ha gjort mange ting annerledes."',
  explanationNb:
    '1. kondisjonalis (skulle + infinitiv) uttrykker en uoppfylt plan i fortid («Jeg skulle ' +
    'handle på Rema, men gjorde det ikke»). 2. kondisjonalis (ville/kunne + ha + perfektum ' +
    'partisipp), oftest kombinert med en pluskvamperfektum om-setning, uttrykker en ' +
    'kontrafaktisk situasjon: «Om jeg hadde vært rikere, ville jeg ha gjort mange ting ' +
    'annerledes.»'
},

'verbet-a-fa': {
  id: 'verbet-a-fa',
  titleEn: 'The verb «å få»',
  titleNb: 'Verbet «å få»',
  explanationEn:
    '«Få» covers many meanings: receiving (Hun fikk lønn), obtaining (De fikk barn), being ' +
    'subjected to (Han fikk lungebetennelse), being punished, being available for sale. As a ' +
    'hjelpeverb, «få + infinitiv» expresses obligation/resignation, simple future, or ' +
    'permission; «få + perfektum partisipp» expresses a future completed action or that ' +
    'something was successfully accomplished.',
  explanationNb:
    '«Få» dekker mange betydninger: å motta (Hun fikk lønn), å skaffe seg (De fikk barn), å bli ' +
    'utsatt for (Han fikk lungebetennelse), å bli straffet, å være til salgs. Som hjelpeverb ' +
    'uttrykker «få + infinitiv» tvang/resignasjon, enkel framtid eller tillatelse; «få + ' +
    'perfektum partisipp» uttrykker en framtidig avsluttet handling eller at noe ble ' +
    'gjennomført.'
},

'leddsetning-som-fundament': {
  id: 'leddsetning-som-fundament',
  titleEn: 'A subordinate clause as the front field',
  titleNb: 'Leddsetning som setningens fundament',
  explanationEn:
    'When a whole subordinate clause fills the sentence\'s front field, the main clause verb ' +
    'still comes second, but the resulting word order — and the placement of sentence ' +
    'adverbials like jo/faktisk/egentlig inside the main clause — trips up even strong ' +
    'learners: "Det handler om hva man egentlig mener man skal bygge opp skolen rundt."',
  explanationNb:
    'Når en hel leddsetning fyller setningens fundamentplass, kommer hovedsetningens verb ' +
    'likevel på andreplass, men den resulterende ordstillingen — og plasseringen av ' +
    'setningsadverbial som jo/faktisk/egentlig inne i hovedsetningen — snubler selv sterke ' +
    'innlærere: «Det handler om hva man egentlig mener man skal bygge opp skolen rundt.»'
},

'ordet-sa': {
  id: 'ordet-sa',
  titleEn: 'The word «så»',
  titleNb: 'Ordet «så»',
  explanationEn:
    '«Så» has three roles. As a KONJUNKSJON linking two main clauses, it expresses result with ' +
    'no word-order change. As a TIDSADVERB starting a new main clause ("Then …"), it triggers ' +
    'V2 inversion. As a SUBJUNKSJON introducing a leddsetning (≈ slik at), normal subordinate ' +
    'word order applies.',
  explanationNb:
    '«Så» har tre roller. Som KONJUNKSJON mellom to hovedsetninger uttrykker den følge uten ' +
    'endring i ordstilling. Som TIDSADVERB som innleder en ny hovedsetning ("Deretter …"), ' +
    'utløser den V2-inversjon. Som SUBJUNKSJON som innleder en leddsetning (≈ slik at), gjelder ' +
    'vanlig leddsetnings-ordstilling.'
},

'koordinerende-konjunksjoner': {
  id: 'koordinerende-konjunksjoner',
  titleEn: 'Coordinating conjunctions + comma rule',
  titleNb: 'Sideordningskonjunksjoner + kommaregel',
  explanationEn:
    'Choosing correctly among the five coordinating conjunctions (og, eller, men, for, så) ' +
    'based on meaning — addition, alternative, contrast, cause, result — plus the comma rule: ' +
    'a comma goes before a coordinating conjunction only when it joins two full main clauses, ' +
    'not two words or phrases.',
  explanationNb:
    'Å velge riktig blant de fem sideordningskonjunksjonene (og, eller, men, for, så) ut fra ' +
    'betydning — tillegg, alternativ, kontrast, årsak, følge — pluss kommaregelen: komma settes ' +
    'foran en sideordningskonjunksjon bare når den binder sammen to helsetninger, ikke to ord ' +
    'eller fraser.'
},

'ordfamilie-avledning': {
  id: 'ordfamilie-avledning',
  titleEn: 'Word-family derivation',
  titleNb: 'Avledning i ordfamilien',
  explanationEn:
    'Deriving the correct noun, verb, adjective, or adverb from a given word in the same word ' +
    'family, matching the required tense/form: from "berømme" (to praise) → berømmelse (noun), ' +
    'berømt (adjective); from "slite" → slitasje (noun), sliten / slitsom (adjective).',
  explanationNb:
    'Å avlede riktig substantiv, verb, adjektiv eller adverb fra et gitt ord i samme ordfamilie, ' +
    'tilpasset ønsket tid/form: fra «berømme» → berømmelse (substantiv), berømt (adjektiv); fra ' +
    '«slite» → slitasje (substantiv), sliten / slitsom (adjektiv).'
},

'omskriving-passiv': {
  id: 'omskriving-passiv',
  titleEn: 'Paraphrasing — passive voice',
  titleNb: 'Omskriving — passiv',
  explanationEn:
    'Rewriting an active sentence as a passive one (or vice versa) while preserving meaning: ' +
    '"Han skifter dekk på bilen" → "Bilens dekk blir skiftet av ham." Also covers turning a ' +
    'casual sentence into a more formal, nominalized paraphrase.',
  explanationNb:
    'Å skrive om en aktiv setning til en passiv (eller omvendt) og samtidig bevare betydningen: ' +
    '«Han skifter dekk på bilen» → «Bilens dekk blir skiftet av ham.» Dekker også det å gjøre en ' +
    'uformell setning om til en mer formell, nominalisert omskriving.'
},

'jo-desto-komparativ': {
  id: 'jo-desto-komparativ',
  titleEn: 'The jo…desto correlative comparative',
  titleNb: 'Korrelativkonstruksjonen jo … desto',
  explanationEn:
    'The correlative construction "jo + comparative … desto/jo + comparative" links two ' +
    'increasing/decreasing quantities: "Jo mer hun spiser, jo tykkere blir hun." Both clauses ' +
    'break normal V2 order — the verb comes directly after jo/desto.',
  explanationNb:
    'Korrelativkonstruksjonen «jo + komparativ … desto/jo + komparativ» binder sammen to ' +
    'økende/minkende størrelser: «Jo mer hun spiser, jo tykkere blir hun.» Begge setningsleddene ' +
    'bryter med vanlig V2 — verbet kommer rett etter jo/desto.'
},

'preposisjoner-kroppsdel-uttrykk': {
  id: 'preposisjoner-kroppsdel-uttrykk',
  titleEn: 'Body-part idioms with prepositions',
  titleNb: 'Kroppsdelsuttrykk med preposisjoner',
  explanationEn:
    'A large family of fixed idioms built around body-part nouns with specific prepositions: ' +
    '"kaste et blikk på" (glance at), "ha en knapp på" (favor), "sette fast" (corner someone), ' +
    '"ta beina på nakken" (flee), "ha øyne i nakken," "gå med krum hals" (submit reluctantly).',
  explanationNb:
    'En stor familie faste uttrykk bygget rundt kroppsdelsubstantiv med bestemte preposisjoner: ' +
    '«kaste et blikk på», «ha en knapp på», «sette fast», «ta beina på nakken», «ha øyne i ' +
    'nakken», «gå med krum hals».'
},

'preposisjoner-generelt-c': {
  id: 'preposisjoner-generelt-c',
  titleEn: 'Advanced idiomatic prepositions',
  titleNb: 'Avanserte idiomatiske preposisjoner',
  explanationEn:
    'Advanced, often idiomatic preposition choices beyond the A2/B1 time/place rules — fixed ' +
    'collocations with verbs and nouns that don\'t follow a predictable pattern: "gå ut på," ' +
    '"sette pris på," "komme til bunns i," "sette i sving," "stå til ansvar for."',
  explanationNb:
    'Avanserte, ofte idiomatiske preposisjonsvalg utover A2/B1s tids-/stedsregler — faste ' +
    'kollokasjoner med verb og substantiv som ikke følger et forutsigbart mønster: «gå ut på», ' +
    '«sette pris på», «komme til bunns i», «sette i sving», «stå til ansvar for».'
},

'uttrykk-gjenkjenning-c-1': {
  id: 'uttrykk-gjenkjenning-c-1',
  titleEn: 'Idiom recognition — part 1',
  titleNb: 'Gjenkjenning av faste uttrykk — del 1',
  explanationEn:
    'Recognizing what a fixed idiom actually means and matching it to the correct paraphrase: ' +
    '"Hun har fått kalde føtter" = she\'s getting cold feet (about a decision), not literally ' +
    'cold feet. "Skinnet bedrar" = appearances are deceiving. Norwegian idioms often don\'t ' +
    'translate literally, and several sound similar to unrelated ones ("gå på skinner" vs. ' +
    '"skinnet bedrar"), so the goal is precise recognition, not guessing from individual words. ' +
    'Part 1 covers the first third of the idiom set.',
  explanationNb:
    'Å kjenne igjen hva et fast uttrykk faktisk betyr og matche det med riktig omskriving: «Hun ' +
    'har fått kalde føtter» betyr at hun nøler med en beslutning, ikke bokstavelig kalde føtter. ' +
    '«Skinnet bedrar» betyr at det ytre lurer deg. Norske uttrykk kan ikke alltid oversettes ' +
    'direkte, og flere høres like ut som urelaterte uttrykk («gå på skinner» vs. «skinnet ' +
    'bedrar»), så målet er presis gjenkjenning, ikke gjetning ut fra enkeltord. Del 1 dekker ' +
    'den første tredjedelen av uttrykkssettet.'
},

'uttrykk-gjenkjenning-c-2': {
  id: 'uttrykk-gjenkjenning-c-2',
  titleEn: 'Idiom recognition — part 2',
  titleNb: 'Gjenkjenning av faste uttrykk — del 2',
  explanationEn:
    'Same skill as part 1 — matching a bolded fixed idiom to its correct paraphrase — covering ' +
    'the middle third of the idiom set.',
  explanationNb:
    'Samme ferdighet som del 1 — å matche et uthevet fast uttrykk med riktig omskriving — og ' +
    'dekker den midterste tredjedelen av uttrykkssettet.'
},

'uttrykk-gjenkjenning-c-3': {
  id: 'uttrykk-gjenkjenning-c-3',
  titleEn: 'Idiom recognition — part 3',
  titleNb: 'Gjenkjenning av faste uttrykk — del 3',
  explanationEn:
    'Same skill as parts 1–2, covering the final third of the idiom set.',
  explanationNb:
    'Samme ferdighet som del 1–2, og dekker den siste tredjedelen av uttrykkssettet.'
}
```

---

## Content plan (`src/lib/data/grammar.json`)

~8–12 questions per topic for the first 21 topics, plus a larger batch per idiom part (exact
size set by the `uttrykk-c.json` matching script, likely ~40–60 each): roughly **~300–360
total.** IDs: `gq-{short-topic}-00X`. Every question needs a real `vocab-c.json`/`uttrykk-c.json`
headword, verified by the script below.

Suggested type mix per topic: 4–6 `fill`, 2–3 `transform`, 1–2 `order` or `minimal-pair`,
adjusted per topic (e.g. `leddsetning-som-fundament` and `koordinerende-konjunksjoner` lean
heavily on `order`; `adj-farger-uboyelige` and `adj-partisipp-som-adjektiv` lean on `minimal-pair`
and `fill`; `verbform-i-kontekst` sentences use real verbs pulled from
`draft/c/grammar/25-39-verb.md` items 25–27). All three `uttrykk-gjenkjenning-c-*` topics are
entirely `multiple-choice`.

**Mining note (items 64–82):** while drafting each of the 21 non-idiom topics, check whether any
of the sleep-science, Northug, or Christmas-tradition passages in items 64–82 contain a good
example of that topic's grammar point paired with a real `vocab-c.json`/`uttrykk-c.json` word —
if so, write a fresh single-sentence question inspired by it (never copied) rather than treating
items 64–82 as pure deferred content. This is opportunistic, not a required pass over every item.

---

## Vocab/uttrykk verification script

`scripts/check-c-grammar-vocab.mjs`, following the existing `check-vocab.mjs`/`check-uttrykk.mjs`
pattern:

1. Load `grammar.json`, filter to the 24 new C topics.
2. Load all `lemma` values from `vocab-c.json` and `uttrykk-c.json`.
3. For each question, concatenate its text fields and check for at least one C-level lemma
   (loosely matched — strip common endings).
4. Print any question with zero matches for manual review before merging.

---

## Plus gating

All 24 topics should be Plus-only, matching the existing Phase-2 morphology topics. Before
implementation, locate the current gating mechanism — `types.ts` no longer exports
`FREE_GRAMMAR_TOPICS`/`freeGrammarQuestionIds` (checked directly), so this has likely moved into
`access.ts` or a route loader and needs to be found rather than re-implemented from the older
`grammar-phase-2.md` plan.

---

## Implementation phases

### Phase 1 — Rules + types

1. Add all 24 topics to `GrammarTopic` in `src/lib/types.ts`.
2. Add all 24 `GrammarRule` entries to `src/lib/grammar/rules.ts` (drafted above).

### Phase 1.5 — Multiple-choice schema (blocks the three `uttrykk-gjenkjenning-c-*` topics only) — done

Added `type: 'multiple-choice'` with an `options: string[]` field (exactly 3 options) to
`GrammarQuestion` (`src/lib/types.ts`). `gradeGrammarAnswer` needed no logic changes — it already
grades generically against `answer`/`alternates`, so `answer` must equal one of the `options`
strings verbatim (enforced in `validateQuestion`). Added `MultipleChoiceQuestion.svelte`, wired
it into `GrammarSession.svelte`, and extended `GrammarSummary.svelte`'s `stimulus()` for the new
type (`AnswerReveal.svelte` needed no change — its non-minimal-pair branch already renders
`question.answer`). Extended the admin editor (`questionUtils.ts` validation + `+page.svelte`
form) so multiple-choice questions can be authored through the same tool. Added the
`grammar_multiple_choice_prompt` message key across all 5 locales. Test coverage added in
`session.test.ts` and `questionUtils.test.ts`.

**Note:** the admin `+page.svelte` `TOPICS` constant still doesn't list any of the 24 new Nivå C
topics (a pre-existing gap from Phase 1, not specific to multiple-choice) — it'll need updating
before any Phase 2 content, including the idiom-recognition topics, can be authored through the
admin UI.

### Phase 2 — Content, built in alphabetical order by topic

The thematic groupings above are for organizing the rule text and cross-referencing source
items; the actual build order is simply alphabetical by topic name, so there's no implicit
priority to debate:

1. `adj-farger-uboyelige` ✅ Done
2. `adj-mer-mest` ✅ Done
3. `adj-partisipp-som-adjektiv` ✅ Done
4. `futurum-referert` ✅ Done
5. `jo-desto-komparativ` ✅ Done
6. `kondisjonalis-counterfactual` ✅ Done
7. `koordinerende-konjunksjoner` ✅ Done
8. `leddsetning-som-fundament` ✅ Done
9. `omskriving-passiv` ✅ Done
10. `ordet-sa` ✅ Done
11. `ordfamilie-avledning` ✅ Done
12. `perfektum-pluskvamperfektum` ✅ Done
13. `predikativ-agreement` ✅ Done
14. `preposisjoner-generelt-c` ✅ Done
15. `preposisjoner-kroppsdel-uttrykk` ✅ Done
16. `sammensatte-substantiv` ✅ Done
17. `sterke-verb-c` ✅ Done
18. `substantiv-uttrykk-c`
19. `ubestemt-artikkel-c`
20. `uttrykk-gjenkjenning-c-1` (depends on Phase 1.5) — cross-reference items 83–89 against
    `uttrykk-c.json`, select every real match, write fresh example sentences (the textbook's
    bolded sentence + 3 paraphrase options can inspire the question, never copy directly)
21. `uttrykk-gjenkjenning-c-2` (depends on Phase 1.5) — same approach, items 90–96
22. `uttrykk-gjenkjenning-c-3` (depends on Phase 1.5) — same approach, items 97–103
23. `verbet-a-fa`
24. `verbform-i-kontekst` — source verbs from `draft/c/grammar/25-39-verb.md` items 25–27

### Phase 3 — Vocab verification

Build and run `scripts/check-c-grammar-vocab.mjs` after each topic in Phase 2, not just at the
end, so problems surface early rather than in one large review pass.

### Phase 4 — Gating + wiring

Locate current Plus-gating mechanism, add all 24 topics as Plus-only. Confirm `/grammar` and
`/grammar/[topic]` pick up new topics with no route changes (should hold, per Phase 2 precedent).

### Deferred — items 64–82 as a passage/cloze feature

The _format_ (long multi-blank cloze passages) stays a separate future feature: build wholly
original short texts (not adapted from the narrative excerpts in the textbook), needing its own
schema and UI work. The _content_ (vocab/grammar pairings) isn't deferred — see the mining note
under Content plan above.

---

## Testing

- No new grading logic needed for Phases 1–4 (existing types are type-agnostic).
- Add a check that every question's `topic` resolves to an entry in `GRAMMAR_RULES` (catches the
  gap noted in `grammar-phase-2.md` where questions existed before their rule text did).

---

## Decisions (resolved)

- `preposisjoner-kroppsdel-uttrykk` and `preposisjoner-generelt-c` stay separate — merging would
  make one topic too large.
- `verbform-i-kontekst` stays in scope, sourced from real C-level verbs in
  `draft/c/grammar/25-39-verb.md` items 25–27 (not generic/invented verbs).
- Build order is alphabetical by topic name (see Phase 2) — no separate priority ranking needed.
- `uttrykk-gjenkjenning-c` is split into 3 parts (items 83–89, 90–96, 97–103) and should aim for
  every idiom in each part with a real `uttrykk-c.json` match, not a fixed ~30–40 cap — likely
  ~40–60 per part once the matching script runs.
- `multiple-choice` uses a fixed 3-option format, matching the textbook.

## Open questions (resolved)

- Once the `uttrykk-c.json` matching script runs for the three idiom parts, if a substantial
  number of textbook idioms _aren't_ in `uttrykk-c.json` yet, is it worth adding some of them to
  `uttrykk-c.json` itself before writing questions, so vocab and grammar content stay in sync?

  **Resolved:** yes. The overlap check confirmed only ~20 of 381 `uttrykk-c.json` entries match
  something in items 83–103, so `uttrykk-c.json` should be expanded first. The full plan —
  triage of the 264 raw candidates in `c-uttrykk-missing-candidates.json`, dedup, drafting,
  enrichment, and merge — is in `ai-docs/implementation/c-uttrykk-addition.md`. Phase 2 steps
  20–22 (`uttrykk-gjenkjenning-c-1/2/3`) in this document depend on that expansion landing first.
