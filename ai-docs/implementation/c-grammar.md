# Nivå C Grammar — Implementation Plan

## Overview

Add Nivå C content to the existing Grammar feature. Source material is
`draft/c/grammar/grammatikk.md` (a theory summary covering five grammar points) plus the
*format/pattern* of `draft/c/grammar/substantiv.md` and `draft/c/grammar/ubestemt-artikkel.md`
(fill-in-the-blank noun/artikkel drills from the textbook). `draft/c/grammar/innhold.md` shows
those two files are only items 1–8 of a much larger 103-exercise chapter (adjectives, verb
tenses, word order, prepositions, cloze passages, multiple choice) — that full chapter is **out
of scope for this round** and should get its own plan once we decide which parts are worth
building.

**Copyright approach:** every question is newly written by us, using the textbook only as a
guide to *which rule* and *roughly what difficulty*. No sentences are copied or lightly adapted
from the textbook — same approach already used for the existing A2/B1/B2 content in
`grammar.json` (see `grammar-phase-2.md`'s note that ch-2 questions were "rewritten for
copyright"). This matters more here than for personal use, since norskeord has a paid Plus tier.

**Vocab integration:** every question must contain at least one real headword from
`vocab-c.json` (710 entries) or `uttrykk-c.json` (381 entries) — not an invented word that merely
looks plausible. A verification script (see below) checks this mechanically before questions are
merged into `grammar.json`.

**Question types:** per your call, use the existing type variety already implemented in
`src/lib/types.ts` — `'fill' | 'order' | 'transform' | 'minimal-pair'`. No new question types
(`cloze`, `error-spot`, `compound` from `grammar-phase-2.md` are still unimplemented — not
needed here).

---

## New topics

Five new `GrammarTopic` values, one per grammar point in `grammatikk.md`. Each is deliberately
**separate** from the existing Phase-2 morphology topics (`noun-articles`, `adj-comparison`,
etc.) rather than extending them, because:

- `noun-articles` (A2/B1) teaches the basic en/et/ei gender rule — the C-level nuances (uncountable
  nouns, means-of-transport, uttrykk) are a distinct, harder rule set that would muddy that
  topic's single explanation and FSRS bucket.
- `adj-comparison` (A2/B1) teaches regular `-ere/-est` comparison — the C-level mer/mest word
  classes are a genuinely separate rule, not a continuation.

```typescript
// Add to GrammarTopic in src/lib/types.ts
| 'ubestemt-artikkel-c' // nuanced indefinite article rules: uncountables, reisemåte, uttrykk
| 'adj-mer-mest' // adjective classes that take mer/mest instead of -ere/-est
| 'predikativ-agreement' // predikativ adjective non-agreement + its exceptions
| 'verbet-a-fa' // meanings of «å få» + å få as a hjelpeverb
| 'ordet-sa'; // «så» as konjunksjon / tidsadverb / subjunksjon
```

### Deferred: noun-form drilling (substantiv.md pattern)

`substantiv.md`'s actual drills (bestemt/ubestemt singular/plural fill-ins) lean on everyday,
often idiomatic nouns (body parts, animals, household items — `hånd i hånd`, `sette seg fore`,
etc.), which is exactly the material the existing A2/B1 `noun-plurals`/`noun-possessives` topics
already cover well. `vocab-c.json`'s nouns are mostly abstract/academic (`ontologi`,
`epistemologi`, `velferdsstat`) and don't have interesting irregular plural or bestemt-form
behavior — drilling their inflection wouldn't teach much beyond "add -er". Rather than force a
weak topic, I'd fold basic noun-form practice into `ubestemt-artikkel-c` questions naturally
(since artikkel questions already require picking the right gender), and only spin out a
dedicated C-level noun-form topic later if we find a genuinely irregular C-vocab noun set worth
drilling.

---

## Rule definitions (`src/lib/grammar/rules.ts`)

Add five entries to `GRAMMAR_RULES`, matching the existing bilingual prose style:

```typescript
'ubestemt-artikkel-c': {
  id: 'ubestemt-artikkel-c',
  titleEn: 'Indefinite article — advanced cases',
  titleNb: 'Ubestemt artikkel — avanserte tilfeller',
  explanationEn:
    'Professions/nationalities after «være»/«bli» drop the article ("Hun er lærer"), but an ' +
    'adjective forces it back in ("Hun er en flink lærer"). Uncountable nouns (mat, drikke, ' +
    'snø) normally take no article even with an adjective ("Det er pen snø ute"); adding one ' +
    'changes the meaning to a countable unit ("en fisk" = one whole fish, vs. "fisk" = the food ' +
    'category). Means of transport after «med» drops the article ("med fly"), but an adjective ' +
    'restores it ("med et stort fly"). Many fixed uttrykk (gå på kino, gå på kurs) also drop the ' +
    'article, again restored by an adjective ("på et godt kurs"). A few verbs/uttrykk make the ' +
    'article optional: "Jeg skal kjøpe (en) bil."',
  explanationNb:
    'Yrker/nasjonaliteter etter «være»/«bli» har ingen artikkel ("Hun er lærer"), men et ' +
    'adjektiv krever artikkel igjen ("Hun er en flink lærer"). Ikke-tellelige substantiv (mat, ' +
    'drikke, snø) har vanligvis ingen artikkel selv med adjektiv ("Det er pen snø ute"); med ' +
    'artikkel blir det en tellbar enhet ("en fisk" = én hel fisk, mot "fisk" = matkategorien). ' +
    'Transportmiddel etter «med» har ingen artikkel ("med fly"), men et adjektiv gjeninnfører ' +
    'den ("med et stort fly"). Mange faste uttrykk (gå på kino, gå på kurs) dropper også ' +
    'artikkelen, igjen gjeninnført av adjektiv ("på et godt kurs"). Noen verb/uttrykk gjør ' +
    'artikkelen valgfri: "Jeg skal kjøpe (en) bil."'
},

'adj-mer-mest': {
  id: 'adj-mer-mest',
  titleEn: 'Adjectives compared with mer/mest',
  titleNb: 'Adjektiv som gradbøyes med mer/mest',
  explanationEn:
    'Several adjective classes never take -ere/-est and use «mer»/«mest» instead: adjectives ' +
    'ending in -isk (praktisk → mer praktisk), past/present participles (kjent, levende), ' +
    'adjectives ending in -et/-ete (blomstret), -en (sliten), some ending in -e (moderne), -iv ' +
    '(positiv), -ær (prekær), most long/borrowed adjectives (interessant, fleksibel). Rule of ' +
    'thumb: participles, borrowed/international adjectives, and most adjectives of 3+ syllables ' +
    'use mer/mest.',
  explanationNb:
    'Flere adjektivklasser tar aldri -ere/-est og bruker «mer»/«mest» i stedet: adjektiv på ' +
    '-isk (praktisk → mer praktisk), partisipper (kjent, levende), adjektiv på -et/-ete ' +
    '(blomstret), -en (sliten), noen på -e (moderne), -iv (positiv), -ær (prekær), de fleste ' +
    'lange/importerte adjektiv (interessant, fleksibel). Tommelfingerregel: partisipper, ' +
    'importerte adjektiv og de fleste adjektiv på 3+ stavelser bruker mer/mest.'
},

'predikativ-agreement': {
  id: 'predikativ-agreement',
  titleEn: 'Predikativ adjective agreement',
  titleNb: 'Samsvarsbøyning av predikativ',
  explanationEn:
    'A predikativ adjective (after være, bli, hete, se … ut) never takes the definite -e ending: ' +
    '"Han er snekker," never "Han er snekkeren." With an ubestemt singular or plural subject, ' +
    'the predikativ goes in intetkjønn, not plural: "Grønnsaker er sunt" (not sunne) — but once ' +
    'the subject is definite, normal agreement returns: "Grønnsakene er sunne." Exceptions that ' +
    'stay unbent: -et participles of strong verbs (skrevet, not skrevne), participles of weak ' +
    'verbs and passive sentences (registrert, nummerert), compound-verb participles ' +
    '(flislagt), and adjectives inside fixed prepositional phrases (glad i, klar over, vant til).',
  explanationNb:
    'Et predikativt adjektiv (etter være, bli, hete, se … ut) bøyes aldri i bestemt form: "Han ' +
    'er snekker," aldri "Han er snekkeren." Med ubestemt entalls- eller flertallssubjekt bøyes ' +
    'predikativet i intetkjønn, ikke flertall: "Grønnsaker er sunt" (ikke sunne) — men med ' +
    'bestemt subjekt gjelder vanlig samsvar igjen: "Grønnsakene er sunne." Unntak som ikke ' +
    'bøyes: -et-partisipp av sterke verb (skrevet, ikke skrevne), partisipp av svake verb og ' +
    'passivsetninger (registrert, nummerert), sammensatte verbs partisipp (flislagt), og ' +
    'adjektiv i faste preposisjonsuttrykk (glad i, klar over, vant til).'
},

'verbet-a-fa': {
  id: 'verbet-a-fa',
  titleEn: 'The verb «å få»',
  titleNb: 'Verbet «å få»',
  explanationEn:
    '«Få» covers many meanings: receiving/being given something (Hun fikk lønn), obtaining ' +
    '(De fikk barn), being subjected to (Han fikk lungebetennelse), being punished (Du skal få ' +
    'juling!), and being available for sale (Boka fås i alle nettbokhandlene). As a hjelpeverb, ' +
    '«få + infinitiv» expresses obligation/resignation ("Nå får du gå og legge deg"), simple ' +
    'future ("Vi får se"), or permission ("Jeg får ikke røre pakken"); «få + perfektum partisipp» ' +
    'expresses a future completed action ("Når jeg får spist, skal jeg komme") or that something ' +
    'was successfully accomplished ("Hun fikk sagt det hun ville").',
  explanationNb:
    '«Få» dekker mange betydninger: å motta noe (Hun fikk lønn), å skaffe seg noe (De fikk ' +
    'barn), å bli utsatt for noe (Han fikk lungebetennelse), å bli straffet (Du skal få ' +
    'juling!), og å være til salgs (Boka fås i alle nettbokhandlene). Som hjelpeverb uttrykker ' +
    '«få + infinitiv» tvang/resignasjon ("Nå får du gå og legge deg"), enkel framtid ("Vi får ' +
    'se"), eller tillatelse ("Jeg får ikke røre pakken"); «få + perfektum partisipp» uttrykker ' +
    'en framtidig avsluttet handling ("Når jeg får spist, skal jeg komme") eller at noe ble ' +
    'gjennomført ("Hun fikk sagt det hun ville").'
},

'ordet-sa': {
  id: 'ordet-sa',
  titleEn: 'The word «så»',
  titleNb: 'Ordet «så»',
  explanationEn:
    '«Så» has three distinct roles. As a KONJUNKSJON linking two main clauses, it expresses ' +
    'result and needs no word-order change: "Per er vanskelig, så jeg forstår Kari." As a ' +
    'TIDSADVERB starting a new main clause ("Then …"), it triggers V2 inversion like any fronted ' +
    'adverbial: "Først spiste de. Så dro de ut." As a SUBJUNKSJON introducing a leddsetning ' +
    '(≈ slik at), normal subordinate word order applies: "Hun leser mye så hun ikke skal stryke."',
  explanationNb:
    '«Så» har tre ulike roller. Som KONJUNKSJON som binder sammen to hovedsetninger, uttrykker ' +
    'den følge og krever ingen endring i ordstilling: "Per er vanskelig, så jeg forstår Kari." ' +
    'Som TIDSADVERB som innleder en ny hovedsetning ("Deretter …"), utløser den V2-inversjon som ' +
    'ethvert fronted adverbial: "Først spiste de. Så dro de ut." Som SUBJUNKSJON som innleder en ' +
    'leddsetning (≈ slik at), gjelder vanlig leddsetnings-ordstilling: "Hun leser mye så hun ' +
    'ikke skal stryke."'
}
```

---

## Content plan (`src/lib/data/grammar.json`)

~10 questions per topic, ~50 total — proportionate to a normal grammar.json topic (existing
topics range 5–20, average ~10) and far smaller than the textbook's own drill sets.

| Topic | Count | Type mix | Notes |
| --- | --- | --- | --- |
| `ubestemt-artikkel-c` | 10 | fill (6), transform (2), minimal-pair (2) | Cover: yrke+adjektiv, uncountable vs. countable food, reisemåte, uttrykk, optional-article verbs |
| `adj-mer-mest` | 8 | fill (4), transform (2), minimal-pair (2) | One question per adjective class from the table (-isk, partisipp, -et/-ete, -en, -e, -iv, -ær, lange/importerte) |
| `predikativ-agreement` | 10 | fill (5), transform (3), minimal-pair (2) | Cover: bestemt-form ban, ubestemt-subject → intetkjønn, definite-subject normal agreement, each exception class |
| `verbet-a-fa` | 10 | fill (4), transform (4), order (2) | Split roughly evenly between «få» as main verb (meanings) and «få» as hjelpeverb (constructions) |
| `ordet-sa` | 8 | fill (2), transform (3), order (3) | At least 2–3 questions requiring the learner to identify/apply which of the three roles applies |

Every `sentence`/`source`/`tokens`/`answer` must include a real `lemma` (or a clearly inflected
form of one) from `vocab-c.json` or `uttrykk-c.json` — e.g. an `ubestemt-artikkel-c` question
about uncountable food nouns could use `fisk`, a `verbet-a-fa` question could use an uttrykk like
`å konkludere med at` in the surrounding context, etc. IDs follow the existing convention:
`gq-{short-topic}-00X` (e.g. `gq-ubest-c-001`, `gq-mermest-001`, `gq-predik-001`, `gq-fa-001`,
`gq-sa-001`).

---

## Vocab/uttrykk verification script

Add `scripts/check-c-grammar-vocab.mjs`, following the existing `--dry-run` / validator pattern
used by `check-vocab.mjs` and `check-uttrykk.mjs`:

1. Load `grammar.json`, filter to the five new C topics.
2. Load all `lemma` values from `vocab-c.json` and `uttrykk-c.json`.
3. For each question, concatenate its text fields (`sentence`, `source`, `tokens`, `answer`,
   `optionA`, `optionB`, `alternates`) and check whether at least one C-level lemma (or an
   inflected form matched loosely — strip common endings) appears.
4. Print any question that has **zero** matches so it can be fixed before merging.

This is a lightweight lexical check, not a guarantee of perfect matching — a human pass over the
flagged list is still expected, same as the existing diacritic/duplicate checkers.

---

## Plus gating

Following the precedent set for the other Phase-2 morphology topics (`noun-articles`,
`adj-comparison`, etc.), all five new topics should be **Plus-only** advanced content. Before
implementation, check the current gating implementation under `src/routes/grammar/` and whatever
free-tier constant governs it now (this moved since `grammar-phase-2.md` was written — `types.ts`
no longer has a `FREE_GRAMMAR_TOPICS`/`freeGrammarQuestionIds` export, so the gating logic has
likely relocated into `access.ts` or the route loaders and should be located rather than
re-invented).

---

## Implementation phases

### Phase 1 — Rules + types

1. Add the five topics to `GrammarTopic` in `src/lib/types.ts`.
2. Add the five `GrammarRule` entries to `src/lib/grammar/rules.ts` (text drafted above).

### Phase 2 — Content

3. Write ~10 questions per topic (~50 total) in `grammar.json`, each cross-checked against
   `vocab-c.json`/`uttrykk-c.json`.
4. Build and run `scripts/check-c-grammar-vocab.mjs`; fix any flagged questions.

### Phase 3 — Gating + wiring

5. Locate current Plus-gating mechanism for grammar topics (see note above) and add the five new
   topics as Plus-only, matching the existing morphology topics.
6. Confirm the `/grammar` topic picker and `/grammar/[topic]` session route pick up the new
   topics with no code changes beyond the data/rules additions (this should be the case, since
   Phase 2 morphology topics required no route changes).

---

## Testing

- Extend `src/lib/grammar/session.test.ts` only if the new content needs new grading behavior —
  it shouldn't, since these questions use the existing `fill`/`order`/`transform`/`minimal-pair`
  types and `gradeGrammarAnswer` is type-agnostic.
- Add a small Vitest/script check that every C-topic question resolves to a `GrammarRule` in
  `rules.ts` (avoids the "housekeeping" gap noted in `grammar-phase-2.md`, where questions
  existed for `noun-*` topics before their rule text did).

---

## Open questions

- Should `verbet-a-fa` be split into two topics (å få as main verb vs. as hjelpeverb)? It's a lot
  of distinct meanings for one topic/FSRS bucket. Leaning toward keeping it as one topic since
  the textbook itself treats it as one chapter, but worth revisiting once real questions are
  drafted and it's clear whether 10 questions can represent both halves without feeling thin.
- Confirm whether the broader ~103-exercise chapter from `innhold.md` is wanted at all, and if
  so, which parts (the cloze passages in items 64–82 are Christmas-themed reading practice, not
  pure grammar drills, and might fit better as a different feature than the Grammar section).
