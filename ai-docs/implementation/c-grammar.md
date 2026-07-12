# Nivå C Grammar — Implementation Plan (revised)

## Overview

Full reassessment after reading all of `draft/c/grammar/` (grammatikk.md,
`1-11-substantiv-ubestemt-artikkel.md`, `12-24-adjektiv.md`, `25-39-verb.md`, `40-51.md`,
`52-63.md`, `64-71.md`, `72-82.md`, `83-92.md`, `93-103.md`, `answers.md`, `innhold.md`). The
earlier 5-topic, ~50-question plan covered only `grammatikk.md` and undersold what the textbook
actually contains. This version covers **items 1–63** as 21 new topics, **items 83–103** as one
additional idiom-recognition topic (22 total), and **items 64–82** as a source of extra vocab/
sentence material folded into the 22 topics rather than built as standalone cloze passages
(reasons below).

**Copyright approach (unchanged):** every question is newly written, using the textbook only as a
guide to which rule and difficulty to target — never copying or closely paraphrasing its
sentences. This matters more for items 38–41 specifically, which are woven around a named
character ("Annemor") from what reads like a real short story excerpt — those get freshly
invented, self-contained sentences instead.

**Vocab integration (unchanged):** every question must contain a real headword from
`vocab-c.json` or `uttrykk-c.json`, checked by a verification script before merging.

**Question types:** `'fill' | 'order' | 'transform' | 'minimal-pair'` are already implemented in
`src/lib/types.ts` and cover 21 of the 22 topics. `uttrykk-gjenkjenning-c` needs one addition: a
true 3-option `type: 'multiple-choice'` (see Phase 1.5).

---

## Scope decisions

### In scope: items 1–63 → 21 new topics (~180–220 questions)

### In scope: items 83–103 → 1 new topic, `uttrykk-gjenkjenning-c` (idiom recognition)

Revised after reading the actual content (not just `answers.md`'s letter key). This isn't MC
retesting of existing grammar — it's a dedicated idiom-recognition drill: each item bolds one
fixed expression in a sentence ("Hun har fått kalde føtter," "Skinnet bedrar," "Han sliter for å
få endene til å møtes") and asks which of three paraphrases means the same thing. Roughly 400
idioms across the 21 sub-lists, organized loosely by theme/keyword (body parts, animals, common
verbs like bite/dra/falle). This is probably the single richest source of `uttrykk-c.json`-level
material in the whole textbook, so it's worth the one schema addition it needs: a true 3-option
`type: 'multiple-choice'` (`minimal-pair` only supports 2 options). We won't build all ~400 —
select the subset that matches real `uttrykk-c.json` headwords (see Phase 1.5 and Phase 2g).

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
the 22 topics above, pull individual grammar+vocab pairings from these passages and rewrite them
as fresh, self-contained single sentences under whichever topic fits (see Phase 2, "mining
note"). The passage *format* itself — as its own reading-comprehension feature — stays a separate
future project, scoped and built later if wanted.

---

## New topics (22)

Grouped by theme, with their source items from `innhold.md` and priority.

### Nouns & articles

| Topic | Source | Notes |
|---|---|---|
| `ubestemt-artikkel-c` | items 7–8 | yrke/adjektiv, uncountables, reisemåte, uttrykk, optional article |
| `substantiv-uttrykk-c` | items 1–8 | noun forms *inside fixed idioms* (ta hånd om, stå til liv, gå som fot i hose) — direct uttrykk-c.json fit |
| `sammensatte-substantiv` | items 9–11 | building compound nouns from a description |

### Adjectives

| Topic | Source | Notes |
|---|---|---|
| `adj-mer-mest` | items 13–19, 22–24 | adjective classes that never take -ere/-est |
| `adj-farger-uboyelige` | item 13 | oransje/lilla/rosa/beige — never inflect |
| `adj-partisipp-som-adjektiv` | items 16–17 | irregular predikativ forms of participle-adjectives (skvetten, sunget, stjålet) |
| `predikativ-agreement` | items 12, 20–21 | predikativ non-agreement + exceptions |

### Verb tense & mood

| Topic | Source | Notes | Priority |
|---|---|---|---|
| `verbform-i-kontekst` | items 25–27 | infinitiv/presens across multi-verb sentences | low |
| `sterke-verb-c` | items 28–29 | rare strong verbs (bry seg, briste, by, gale, sige, fyke, kvekke) | high |
| `perfektum-pluskvamperfektum` | items 30–34 | tense choice + word order with sentence adverbials | high |
| `futurum-referert` | items 35–37 | 2. futurum — evidential/reported "skal ha X" | high |
| `kondisjonalis-counterfactual` | items 38–41 | 1./2. kondisjonalis + om-setninger (own sentences, not the Annemor story) | high |
| `verbet-a-fa` | grammatikk.md | meanings of «å få» + hjelpeverb uses | high |

### Word order & conjunctions

| Topic | Source | Notes |
|---|---|---|
| `leddsetning-som-fundament` | items 42–46 | subordinate clause filling the front field, adverbial placement inside |
| `ordet-sa` | grammatikk.md + item 47 | så as konjunksjon / tidsadverb / subjunksjon |
| `koordinerende-konjunksjoner` | item 72 | og/eller/men/for/så choice + comma rule |

### Word formation & paraphrase

| Topic | Source | Notes |
|---|---|---|
| `ordfamilie-avledning` | items 48–51 | deriving noun/verb/adjective/adverb within a word family |
| `omskriving-passiv` | items 52–55 | active↔passive, casual→formal nominalized paraphrase |
| `jo-desto-komparativ` | item 54 (pattern) | jo + comparative … desto/jo + comparative correlative |

### Prepositions

| Topic | Source | Notes |
|---|---|---|
| `preposisjoner-kroppsdel-uttrykk` | items 56, 59, 61 (partial) | body-part idiom prepositions (hår, nakke, hals, øre) |
| `preposisjoner-generelt-c` | items 57–58, 60, 62–63 | general idiomatic preposition collocations |

### Idiom recognition

| Topic | Source | Notes |
|---|---|---|
| `uttrykk-gjenkjenning-c` | items 83–103 | ~400 idioms available; select the subset matching real `uttrykk-c.json` headwords; needs the `multiple-choice` type (Phase 1.5) |

**Total: 22 topics.** At ~8–12 questions each for the first 21, plus a larger batch (~30–40) for
`uttrykk-gjenkjenning-c` given how much source material exists: **~210–260 questions.**

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
    'with three or four verb slots at once is a genuine accuracy challenge at C level.',
  explanationNb:
    'Å velge mellom bar infinitiv (etter modale hjelpeverb, «pleier», «begynner») og bøyd ' +
    'presensform er en A1/A2-regel, men å bruke den riktig gjennom en lang setning med tre eller ' +
    'fire verbplasser samtidig er en reell presisjonsutfordring på nivå C.'
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

'uttrykk-gjenkjenning-c': {
  id: 'uttrykk-gjenkjenning-c',
  titleEn: 'Idiom recognition',
  titleNb: 'Gjenkjenning av faste uttrykk',
  explanationEn:
    'Recognizing what a fixed idiom actually means and matching it to the correct paraphrase: ' +
    '"Hun har fått kalde føtter" = she\'s getting cold feet (about a decision), not literally ' +
    'cold feet. "Skinnet bedrar" = appearances are deceiving. Norwegian idioms often don\'t ' +
    'translate literally, and several sound similar to unrelated ones ("gå på skinner" vs. ' +
    '"skinnet bedrar"), so the goal is precise recognition, not guessing from individual words.',
  explanationNb:
    'Å kjenne igjen hva et fast uttrykk faktisk betyr og matche det med riktig omskriving: «Hun ' +
    'har fått kalde føtter» betyr at hun nøler med en beslutning, ikke bokstavelig kalde føtter. ' +
    '«Skinnet bedrar» betyr at det ytre lurer deg. Norske uttrykk kan ikke alltid oversettes ' +
    'direkte, og flere høres like ut som urelaterte uttrykk («gå på skinner» vs. «skinnet ' +
    'bedrar»), så målet er presis gjenkjenning, ikke gjetning ut fra enkeltord.'
}
```

---

## Content plan (`src/lib/data/grammar.json`)

~8–12 questions per topic for the first 21 topics, plus ~30–40 for `uttrykk-gjenkjenning-c`:
**~210–260 total.** IDs: `gq-{short-topic}-00X`. Every question needs a real
`vocab-c.json`/`uttrykk-c.json` headword, verified by the script below.

Suggested type mix per topic: 4–6 `fill`, 2–3 `transform`, 1–2 `order` or `minimal-pair`,
adjusted per topic (e.g. `leddsetning-som-fundament` and `koordinerende-konjunksjoner` lean
heavily on `order`; `adj-farger-uboyelige` and `adj-partisipp-som-adjektiv` lean on `minimal-pair`
and `fill`). `uttrykk-gjenkjenning-c` is entirely `multiple-choice`.

**Mining note (items 64–82):** while drafting each of the 21 non-idiom topics, check whether any
of the sleep-science, Northug, or Christmas-tradition passages in items 64–82 contain a good
example of that topic's grammar point paired with a real `vocab-c.json`/`uttrykk-c.json` word —
if so, write a fresh single-sentence question inspired by it (never copied) rather than treating
items 64–82 as pure deferred content. This is opportunistic, not a required pass over every item.

---

## Vocab/uttrykk verification script

`scripts/check-c-grammar-vocab.mjs`, following the existing `check-vocab.mjs`/`check-uttrykk.mjs`
pattern:

1. Load `grammar.json`, filter to the 21 new C topics.
2. Load all `lemma` values from `vocab-c.json` and `uttrykk-c.json`.
3. For each question, concatenate its text fields and check for at least one C-level lemma
   (loosely matched — strip common endings).
4. Print any question with zero matches for manual review before merging.

---

## Plus gating

All 21 topics should be Plus-only, matching the existing Phase-2 morphology topics. Before
implementation, locate the current gating mechanism — `types.ts` no longer exports
`FREE_GRAMMAR_TOPICS`/`freeGrammarQuestionIds` (checked directly), so this has likely moved into
`access.ts` or a route loader and needs to be found rather than re-implemented from the older
`grammar-phase-2.md` plan.

---

## Implementation phases

### Phase 1 — Rules + types
1. Add all 22 topics to `GrammarTopic` in `src/lib/types.ts`.
2. Add all 22 `GrammarRule` entries to `src/lib/grammar/rules.ts` (drafted above).

### Phase 1.5 — Multiple-choice schema (blocks `uttrykk-gjenkjenning-c` only)
Add `type: 'multiple-choice'` with an `options: string[]` field (3 options) to `GrammarQuestion`,
update `session.ts` grading logic and the question-rendering UI. Small, contained change —
everything else in this plan uses the existing types and doesn't depend on this phase.

### Phase 2 — Content, grouped by theme (can be done incrementally)
2a. Nouns & articles — `ubestemt-artikkel-c`, `substantiv-uttrykk-c`, `sammensatte-substantiv`
2b. Adjectives — `adj-mer-mest`, `adj-farger-uboyelige`, `adj-partisipp-som-adjektiv`,
    `predikativ-agreement`
2c. Verb tense/mood — `verbform-i-kontekst`, `sterke-verb-c`, `perfektum-pluskvamperfektum`,
    `futurum-referert`, `kondisjonalis-counterfactual`, `verbet-a-fa`
2d. Word order & conjunctions — `leddsetning-som-fundament`, `ordet-sa`,
    `koordinerende-konjunksjoner`
2e. Word formation & paraphrase — `ordfamilie-avledning`, `omskriving-passiv`,
    `jo-desto-komparativ`
2f. Prepositions — `preposisjoner-kroppsdel-uttrykk`, `preposisjoner-generelt-c`
2g. Idiom recognition — `uttrykk-gjenkjenning-c` (depends on Phase 1.5). Go through items
    83–103, cross-reference each idiom against `uttrykk-c.json`, and select ~30–40 with a real
    match; write fresh example sentences (the textbook's bolded sentence + 3 paraphrase options
    can inspire the question, but write new wording rather than copying it directly).

### Phase 3 — Vocab verification
Build and run `scripts/check-c-grammar-vocab.mjs` after each content batch (2a–2g), not just at
the end, so problems surface early rather than in one large review pass.

### Phase 4 — Gating + wiring
Locate current Plus-gating mechanism, add all 22 topics as Plus-only. Confirm `/grammar` and
`/grammar/[topic]` pick up new topics with no route changes (should hold, per Phase 2 precedent).

### Deferred — items 64–82 as a passage/cloze feature
The *format* (long multi-blank cloze passages) stays a separate future feature: build wholly
original short texts (not adapted from the narrative excerpts in the textbook), needing its own
schema and UI work. The *content* (vocab/grammar pairings) isn't deferred — see the mining note
under Content plan above.

---

## Testing

- No new grading logic needed for Phases 1–4 (existing types are type-agnostic).
- Add a check that every question's `topic` resolves to an entry in `GRAMMAR_RULES` (catches the
  gap noted in `grammar-phase-2.md` where questions existed before their rule text did).

---

## Open questions

- Should `preposisjoner-kroppsdel-uttrykk` and `preposisjoner-generelt-c` be merged into one
  larger topic instead, given both are "advanced prepositions"? Leaning toward keeping them
  split since the body-part idiom family is thematically distinct and large enough to stand
  alone, but worth revisiting once real questions are drafted.
- `verbform-i-kontekst` is the one topic here that isn't distinctly "C-level" by rule — confirm
  it's worth including at all, versus just skipping items 25–27 entirely.
- Confirm priority order across Phase 2a–2g — the table above lists sensible groupings, but
  doesn't yet say which to build first.
- `uttrykk-gjenkjenning-c` has ~400 idioms available but we're only selecting ~30–40 for this
  round (the ones matching real `uttrykk-c.json` headwords). Confirm that's the right cutoff, or
  whether it's worth expanding `uttrykk-c.json` itself with some of the idioms found here that
  aren't in it yet, before writing the questions.
- Is 3 options enough for `multiple-choice`, matching the textbook, or should the schema support
  a variable option count for future reuse elsewhere?
