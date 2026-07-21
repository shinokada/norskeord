# Nivå A2 Grammar & Quiz — Implementation Plan

## Overview

Coverage of the **Grammatikk** column in `draft/a2/innhold.md` (Kapittel 10–16 — the continuation
of the same "På vei" textbook as `draft/a1/`, chapters 1–9). Unlike the A1 plan, this is **not**
greenfield: `grammar.json` already has **119 A2 entries** (out of 852 total) spread across 18
existing topics, mostly reused from A1/B1 (e.g. `ikke-placement`, `preposisjoner-tid`,
`adj-comparison`). This plan is the direct sequel to `ai-docs/implementation/a1-quiz-and-grammar.md`
and reuses its architecture, phase structure, and conventions.

**Scope note:** per the user, chapters 10–16 in this draft are **A2 only** — every new
`GrammarQuestion` entry from this plan gets `cefr: 'A2'`, even for topics that already carry other
CEFR levels. This also resolves the open question left in `a1-quiz-and-grammar.md` ("Chapter 10
has no source material… confirm whether it's coming later") — chapter 10 is covered here, at A2,
not folded into A1.

**On "quiz" vs "grammar":** same as the A1 plan — `/quiz` is generated at runtime from
`vocab-a2.json` and needs no new authored content. Both `draft/a2/grammar/pa-vei-2.md` (per-topic
drills) and `draft/a2/quiz/pa-vei-2.md` (chapter-review exercises, more mixed vocabulary +
grammar) feed the same pipeline: new A2 entries in `grammar.json`.

**Copyright approach (unchanged):** every question is newly written, using the textbook only to
identify which rule and difficulty to target — never copying or closely paraphrasing its
sentences or reusing its recurring characters (Eirik, Karim, Latisha, Teresa, Nikos, Bianca, Åse,
Samira, Tobias, Amira, Lisa, Sturla, Marie, Lauritz, Borghild, Renate, Hassan, Kim, Irina, etc.
verbatim — invent fresh names/sentences).

**Vocab integration:** every question should use real A2 vocabulary (`vocab-a2.json` /
`uttrykk-a2.json`), verified the same way as A1/C.

**Question types:** `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'` already
cover everything needed — no schema changes required.

**Pre-implementation audit (added before Phase 1 started):** following the same reasoning that
produced `ai-docs/implementation/a1-update.md` after A1 shipped — the plan below mined
`draft/a2/grammar/pa-vei-2.md` as primary source and `draft/a2/quiz/pa-vei-2.md` only as secondary
material for topics already being drafted, which was never meant to guarantee 100% coverage of the
quiz file on its own — the quiz file was audited directly against the 11 original topic-touches
_before_ implementation started this time, so the gaps could be folded straight into this plan
instead of becoming a second follow-up doc. See "Audit findings" and "Decisions (resolved)" below
— the audit added 3 new topics and 2 more reused-topic touches, all now confirmed, bringing the
total to 16 topic-touches.

---

## Recommendation on the two open questions

### 1. Topic granularity

Because A2 already has substantial grammar coverage, this is **mostly a reuse exercise**, not a
new-topic exercise like A1 was. Mapping the 10 grammar items across `innhold.md`'s 7 chapters:

| innhold.md grammar item               | Ch. | Mapping                                                                                                                                                                                                                                     |
| ------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Presens perfektum                     | 10  | **New topic** `presens-perfektum` — no existing topic covers perfektum formation/usage.                                                                                                                                                     |
| Adjektiv i bestemt form               | 11  | Reuse `adj-definite` (already A2:3/B1:1) — same rule, more drilling.                                                                                                                                                                        |
| Leddsetninger                         | 11  | Reuse `subordinate-order` (already A2:3/B1:4) — clause-linking + word order inside leddsetning.                                                                                                                                             |
| Leddsetninger med spørreord           | 12  | Reuse `indirekte-tale-at-om` (A1 topic; its rule text already explicitly covers wh-embedded reported questions).                                                                                                                            |
| Adjektiv: komparativ og superlativ    | 13  | Reuse `adj-comparison` (already A2:6/B1:4).                                                                                                                                                                                                 |
| Derfor – fordi                        | 13  | **New topic** `derfor-fordi` — distinct from A1's `for-a-fordi` (for-å-purpose vs. fordi-cause); this is derfor (result, main-clause connector) vs. fordi (cause, subordinate connector).                                                   |
| Kvantorer (mengdeord)                 | 14  | **New topic** `kvantorer` — mye/mange, mer/flere, uncountable vs. countable; no existing topic.                                                                                                                                             |
| Som-setninger                         | 14  | Reuse `relative-som` (currently B2-only, 5 entries) — same rule, A2 is the introductory version.                                                                                                                                            |
| Leddsetninger med ikke, alltid, aldri | 15  | Reuse `ikke-placement` (already A2:5/B1:7) — this chapter's exercises also re-drill `indirekte-tale-at-om`'s at/om reporting and wh-embedding, so that topic gets more A2 entries here too, not just at ch. 12.                             |
| Modalverb i preteritum                | 16  | **New topic** `modalverb-preteritum` — modal preteritum forms (kan→kunne, vil→ville, skal→skulle, må→måtte, bør→burde) used heavily in reported speech; distinct from `modal-verb-order` (which is about infinitive word order, not tense). |

Also folding in, as a secondary reuse not called out as its own `innhold.md` row: `preposisjoner-tid`
(already A2:10) gets a handful more A2 entries at chapter 10, since the textbook's duration
questions ("Hvor lenge har du bodd her? → I to år.") are taught alongside presens perfektum.

**This gives 4 new topics + 7 reused topics (11 topic-touches total)** — fewer new topics than A1
needed, because A2 grammar points mostly extend rules A1/B1 already established, rather than
introducing brand-new mechanics.

### 2. Plus gating

**Decision (confirmed): different from A1.** A1's "make everything free" rationale doesn't carry
over — A2 is not the onboarding entry point, and the existing A2 grammar content is already a
deliberate mix: most A2 topics have non-`plusOnly` questions (`ikke-placement`, `adj-comparison`,
`adj-definite`, `subordinate-order`, `noun-articles`, `preposisjoner-tid`, etc. are 100% free at
the question level), but only 4 original topics (`ikke-placement`, `v2-word-order`, `det-er-ikke`,
`modal-verb-order`) plus the 6 reused-from-A1 topics we just added
(`noun-articles`/`noun-plurals`/`adj-agreement`/`noun-possessives`/`preposisjoner-tid`/`helsetninger`)
are actually reachable via the `/grammar` picker for free users — everything else (including
`adj-comparison`, `adj-definite`, `subordinate-order`, `relative-som`) is topic-locked at the
picker today even though its individual questions aren't `plusOnly`. `helsetninger` and
`sterke-verb` are the outliers — their entire A2 entry sets are `plusOnly: true`.

Given that pattern, and now confirmed:

- New questions in the 4 original new topics (`presens-perfektum`, `derfor-fordi`, `kvantorer`,
  `modalverb-preteritum`): `plusOnly: false`/omitted, matching the overwhelming majority pattern
  at A2 — but **do not** add these 4 new topics to `FREE_GRAMMAR_TOPICS`. This keeps them
  reachable only by Plus subscribers via the picker (same as most existing A2 topics), consistent
  with A2 being paid-tier content rather than the onboarding tier A1 is.
- The 3 audit-driven new topics (`plassering-verb`, `refleksive-verb`, `ha-vs-vaere`) follow the
  exact same gating: `plusOnly: false`/omitted on the questions, but **not** added to
  `FREE_GRAMMAR_TOPICS` — topic-locked at the picker like the original 4.
- New A2 entries in reused topics inherit whatever gating that topic already has: `ikke-placement`
  and `preposisjoner-tid` are already `FREE_GRAMMAR_TOPICS` members (the latter via the A1 plan's
  Phase 4), so their new A2 entries are automatically reachable (still capped at
  `FREE_GRAMMAR_PER_TOPIC` = 3 playable questions for non-Plus users, same mechanism documented in
  `a1-quiz-and-grammar.md` Phase 4). `adj-definite`, `subordinate-order`, `adj-comparison`,
  `relative-som`, `preposisjoner-sted`, and `noun-plurals` are **not** currently in
  `FREE_GRAMMAR_TOPICS`, so their new A2 entries stay topic-locked for free users by default — no
  action needed, this just inherits the existing status quo. `indirekte-tale-at-om` **is** already
  in `FREE_GRAMMAR_TOPICS` (added as one of A1's 19 new topics), so its new A2 entries are
  reachable too.

This is confirmed — no further product decision needed before Phase 4 on gating.

---

## Audit findings — quiz-file content not covered by the 11 topic-touches above

Checked `draft/a2/quiz/pa-vei-2.md` chapter by chapter against the 11 topic-touches above and
against `vocab-a2.json`/`uttrykk-a2.json` directly (same method as the A1 audit). Splitting by
rule-vs-word-list, same as A1's approach.

**Rule-level gaps (candidate new/extended grammar topics):**

| Quiz-file content                                                                                           | Ch.    | Nature                                                                                                                           | Destination                                                                                             |
| ----------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `sette`/`legge` (movement, takes object) vs. `stå`/`ligge` (state, no object)                               | 15     | Placement-verb pair, drilled explicitly ("Han **setter** vasen på bordet. Vasen **står** på bordet.")                            | new grammar topic `plassering-verb`                                                                     |
| Reflexive verbs by person: `glede seg`, `grue seg`, `føle seg`                                              | 11, 12 | Reflexive pronoun agreement (gleder **meg**/**deg**/**seg**/**oss**), drilled across two chapters                                | new grammar topic `refleksive-verb`                                                                     |
| `har` vs. `er` for physical/emotional states (**har** vondt i hodet / **er** syk, sulten)                   | 12     | Its own dedicated exercise ("Har eller er?"), common confusion point                                                             | new grammar topic `ha-vs-vaere`                                                                         |
| til venstre for, til høyre for, ved siden av, mellom X og Y (relative position of buildings/rooms)          | 13     | Extends A1's `preposisjoner-sted` (i/på/bak/foran/under/over, static single-object location) to relative/comparative positioning | folded into `preposisjoner-sted` (confirmed — 8th reused topic)                                         |
| Irregular noun plurals for body parts: fot→føttene, tann→tennene, øye→øynene, kne→knærne, skulder→skuldrene | 12     | Irregular plural pattern                                                                                                         | folded into existing `noun-plurals` topic (confirmed — 9th reused topic; see "Decisions" below for why) |

**Word-list gaps (vocab/uttrykk, not grammar):**

Fixed verb/adjective + preposition pairs recur constantly across ch. 10, 11, 14 — `glad i`,
`interessert i`, `stole på`, `ha rett til`, `legge merke til`, `ansvar for`. Each is a fixed
lexical pairing with no generalizable rule, same treatment A1 gave "for – siden": destination is
`uttrykk-a2.json`, not a new grammar topic.

**Vocab check (`vocab-a2.json`/`uttrykk-a2.json`, checked directly):** `føle seg`, `ved siden av`,
and `mellom` already exist as vocab entries. Missing entirely: `glede seg`, `grue seg`, `legge`,
`stå`, `ligge` (only `sette` is present), `til venstre for`, `til høyre for`, `fot`, `øye`. These
need adding regardless of how the grammar-topic questions above are resolved, since new questions
will want to reference them as real headwords.

**Revised count (confirmed):** 4 new topics (original) + 3 new topics (audit) + 7 reused topics
(original) + 2 reused topics (audit — `preposisjoner-sted`, `noun-plurals`) = **16 topic-touches**.
See "Decisions (resolved)" at the end of this doc for the reasoning behind the two audit-driven
reused topics and the `relative-som` B2→A2 reclassification.

---

## New topics (4 original + 3 from audit)

| Topic                  | Source (ch.) | Notes                                                                                                                                                                                             | Q's |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `presens-perfektum`    | 10           | Formation (har + perfektum partisipp), presens perfektum vs. preteritum contrast, ja/nei + ikke/aldri answers, "hvor lenge har du…" duration questions.                                           | 14  |
| `derfor-fordi`         | 13           | derfor = result/consequence, main-clause connector adverb triggering V2 inversion in the clause it starts; fordi = cause, subordinate connector, normal subject-before-verb order.                | 8   |
| `kvantorer`            | 14           | mye/mange and mer/flere, keyed to whether the noun is countable (mange venner, flere oppgaver) or uncountable (mye mat, mer plass).                                                               | 8   |
| `modalverb-preteritum` | 16           | Modal preteritum forms — kan→kunne, vil→ville, skal→skulle, må→måtte, bør→burde — used both as plain past tense and inside reported speech ("Han sa at han måtte…", "Hun spurte om hun skulle…"). | 10  |
| `plassering-verb`      | 15           | (from audit) `sette`/`legge` = movement + takes an object; `stå`/`ligge` = resulting state, no object. "Han setter vasen på bordet" vs. "Vasen står på bordet."                                   | 8   |
| `refleksive-verb`      | 11, 12       | (from audit) Reflexive pronoun agreement across person for `glede seg`, `grue seg`, `føle seg`: gleder meg/deg/seg/oss/dere/seg.                                                                  | 8   |
| `ha-vs-vaere`          | 12           | (from audit) `har` for possession/symptom (har vondt i, har lyst på) vs. `er` for state/condition (er syk, er sulten, er i dårlig humør).                                                         | 8   |

**Subtotal: ~64 questions across 7 new topics (4 original + 3 from audit).**

## Reused topics (add `cefr: 'A2'` entries)

| Topic                  | Source (ch.) | A2 item                                                                                                                                                                | New Q's |
| ---------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `adj-definite`         | 11           | Adjektiv i bestemt form — den/det/de + weak adjective ending, more drilling at A2.                                                                                     | 8       |
| `subordinate-order`    | 11           | Leddsetninger — linking main + subordinate clauses with da/når/hvis/fordi, word order inside.                                                                          | 8       |
| `indirekte-tale-at-om` | 12, 15       | Leddsetninger med spørreord (wh-embedded reported questions) + more at/om reporting at ch. 15.                                                                         | 12      |
| `adj-comparison`       | 13           | Adjektiv: komparativ og superlativ — weather/place comparisons, superlative-only responses.                                                                            | 8       |
| `relative-som`         | 14           | Som-setninger — relative clauses with som as subject, and as object with preposition stranding. Also: reclassify 3 of the 5 existing B2 entries to A2 (see Decisions). | 8       |
| `ikke-placement`       | 15           | Leddsetninger med ikke, alltid, aldri — adverb placement inside at/om-clauses.                                                                                         | 8       |
| `preposisjoner-tid`    | 10           | Duration/point-in-time expressions (i/om/for–siden) paired with presens perfektum sentences.                                                                           | 6       |
| `preposisjoner-sted`   | 13           | (from audit) til venstre for, til høyre for, mellom X og Y — relative/comparative building and room positions, extending A1's simple i/på/bak/foran/under/over.        | 6       |
| `noun-plurals`         | 12           | (from audit) Irregular body-part plurals: fot→føttene, tann→tennene, øye→øynene, kne→knærne, skulder→skuldrene.                                                        | 6       |

**Subtotal: ~70 questions across 9 reused topics.**

**Total: ~134 questions across 16 topic-touches** (7 new + 9 reused) — confirmed.

---

## Rule drafts (`src/lib/grammar/rules.ts`) — new topics only

Short drafts to seed Phase 1; expand to the fuller bilingual style used elsewhere in `rules.ts`
when actually adding them.

```typescript
'presens-perfektum': {
  id: 'presens-perfektum',
  titleEn: 'Presens perfektum (present perfect)',
  titleNb: 'Presens perfektum',
  explanationEn:
    'Presens perfektum = har/har ikke + perfektum partisipp: "Jeg har lest boka." Use it for ' +
    'completed actions relevant to an open/unfinished time frame (today, this week, "ever/never", ' +
    '"how long have you…"). Use preteritum instead for a closed past moment, usually with "i går" ' +
    'or "for … siden": "Jeg leste boka i går." Negative and never-answers: "Nei, jeg har ikke ' +
    'lest den." / "Nei, jeg har aldri lest den."',
  explanationNb:
    'Presens perfektum = har/har ikke + perfektum partisipp: "Jeg har lest boka." Brukes om ' +
    'avsluttede handlinger i en åpen/uavsluttet tidsramme (i dag, denne uka, "noen gang/aldri", ' +
    '"hvor lenge har du…"). Bruk preteritum for et avsluttet tidspunkt i fortida, ofte med "i går" ' +
    'eller "for … siden": "Jeg leste boka i går." Nekting og aldri-svar: "Nei, jeg har ikke lest ' +
    'den." / "Nei, jeg har aldri lest den."'
},

'derfor-fordi': {
  id: 'derfor-fordi',
  titleEn: '«derfor» vs. «fordi»',
  titleNb: '«derfor» og «fordi»',
  explanationEn:
    '«Derfor» ("therefore") starts a new main clause expressing a RESULT, and triggers V2 ' +
    'inversion like any fronted adverbial: "Sofaen er for stor. Derfor vil hun selge den." ' +
    '«Fordi» ("because") introduces a subordinate clause expressing a CAUSE, with normal ' +
    'subject-before-verb order: "Hun vil selge sofaen fordi den er for stor."',
  explanationNb:
    '«Derfor» innleder en ny hovedsetning som uttrykker en FØLGE, og utløser V2-inversjon som ' +
    'ethvert fundamentplassert adverbial: "Sofaen er for stor. Derfor vil hun selge den." «Fordi» ' +
    'innleder en leddsetning som uttrykker en ÅRSAK, med vanlig subjekt-før-verb-rekkefølge: "Hun ' +
    'vil selge sofaen fordi den er for stor."'
},

'kvantorer': {
  id: 'kvantorer',
  titleEn: 'Quantifiers: mye/mange, mer/flere',
  titleNb: 'Kvantorer (mengdeord)',
  explanationEn:
    'Use «mye»/«mer» with uncountable nouns (mat, tid, plass, arbeid): "Jeg har mye å gjøre." Use ' +
    '«mange»/«flere» with countable plural nouns (venner, oppgaver, stoler): "Jeg har mange ' +
    'venner." «Flere» also means "several more" (Vi trenger flere stoler), while «mer» means ' +
    '"more" of an uncountable amount (Vi trenger mer plass).',
  explanationNb:
    'Bruk «mye»/«mer» med ikke-tellelige substantiv (mat, tid, plass, arbeid): "Jeg har mye å ' +
    'gjøre." Bruk «mange»/«flere» med tellelige substantiv i flertall (venner, oppgaver, stoler): ' +
    '"Jeg har mange venner." «Flere» betyr også "several more" (Vi trenger flere stoler), mens ' +
    '«mer» betyr "mer" av en ikke-tellelig mengde (Vi trenger mer plass).'
},

'modalverb-preteritum': {
  id: 'modalverb-preteritum',
  titleEn: 'Modal verbs in preteritum',
  titleNb: 'Modalverb i preteritum',
  explanationEn:
    'Modal verbs have irregular preteritum forms: kan→kunne, vil→ville, skal→skulle, må→måtte, ' +
    'bør→burde. Used as plain past tense ("Jeg måtte jobbe i går") and constantly in reported ' +
    'speech, where a present-tense modal statement or question shifts to its preteritum form: ' +
    '"Jeg må vente." → "Hun sa at hun måtte vente." "Skal jeg hjelpe?" → "Hun spurte om hun skulle ' +
    'hjelpe."',
  explanationNb:
    'Modalverb har uregelmessige preteritumsformer: kan→kunne, vil→ville, skal→skulle, må→måtte, ' +
    'bør→burde. Brukes som vanlig fortid ("Jeg måtte jobbe i går") og svært ofte i referert tale, ' +
    'der en presens-modalytring skifter til preteritumsform: "Jeg må vente." → "Hun sa at hun ' +
    'måtte vente." "Skal jeg hjelpe?" → "Hun spurte om hun skulle hjelpe."'
},

'plassering-verb': {
  id: 'plassering-verb',
  titleEn: 'Placement verbs: sette/legge vs. stå/ligge',
  titleNb: 'Plasseringsverb: sette/legge og stå/ligge',
  explanationEn:
    'sette and legge describe the ACTION of placing something and take a direct object: Han ' +
    'setter vasen på bordet. stå and ligge describe the resulting STATE and take no object: ' +
    'Vasen står på bordet. Use sette/stå for upright objects, legge/ligge for flat ones.',
  explanationNb:
    'Sette og legge beskriver HANDLINGEN å plassere noe, og tar et objekt. Stå og ligge ' +
    'beskriver TILSTANDEN etterpå, og tar ikke objekt.'
},

'refleksive-verb': {
  id: 'refleksive-verb',
  titleEn: 'Reflexive verbs: glede seg, grue seg, føle seg',
  titleNb: 'Refleksive verb: glede seg, grue seg, føle seg',
  explanationEn:
    'Some Norwegian verbs pair with a reflexive pronoun that changes with the subject: jeg gleder ' +
    'MEG, du gleder DEG, han/hun/de gleder SEG, vi gleder OSS, dere gleder DERE. Same pattern for ' +
    'grue seg (to dread) and føle seg (to feel).',
  explanationNb:
    'Noen norske verb tar et refleksivt pronomen som endrer seg med subjektet: jeg gleder MEG, du ' +
    'gleder DEG, han/hun/de gleder SEG, vi gleder OSS, dere gleder DERE. Samme mønster for grue ' +
    'seg og føle seg.'
},

'ha-vs-vaere': {
  id: 'ha-vs-vaere',
  titleEn: '«ha» vs. «være» for states',
  titleNb: '«ha» og «være» for tilstander',
  explanationEn:
    'Norwegian uses «ha» (to have) for symptoms/possession-shaped states — «ha vondt i» (to have ' +
    'pain in), «ha lyst på» (to feel like), «ha det bra» (to be doing well) — and «være» (to be) ' +
    'for adjective-shaped states: «være syk», «være sulten», «være i dårlig humør». Many ' +
    'English "to be" phrases map to Norwegian «ha»: "I have a headache" = "Jeg har vondt i hodet," ' +
    'not "Jeg er vondt."',
  explanationNb:
    'Norsk bruker «ha» for symptomer/eie-lignende tilstander — «ha vondt i», «ha lyst på», «ha ' +
    'det bra» — og «være» for adjektiv-tilstander: «være syk», «være sulten», «være i dårlig ' +
    'humør».'
}
```

`plassering-verb`, `refleksive-verb`, and `ha-vs-vaere` are the 3 audit-driven topics — confirmed,
same gating as the 4 original new topics.

Reused topics (`adj-definite`, `subordinate-order`, `indirekte-tale-at-om`, `adj-comparison`,
`relative-som`, `ikke-placement`, `preposisjoner-tid`, `preposisjoner-sted`, `noun-plurals`) need
no rule-text changes for most — just new `cefr: 'A2'` question entries under the existing rule.
Two exceptions:

- `preposisjoner-sted`'s rule text (currently i/på/bak/foran/under/over only) needs a short
  addition covering the relational forms (til venstre for, til høyre for, mellom X og Y) before
  its A2 entries are written.
- `relative-som`'s rule text and 3 of its 5 existing questions move to A2 — see "Decisions
  (resolved)" below for exactly which ones and why.

---

## Content plan (`src/lib/data/grammar.json`)

IDs: `gq-{short-topic}-00X`, following the existing convention. Type mix per topic, adapted to
what the point actually tests (heavier on `fill`/`transform` for presens-perfektum and
modalverb-preteritum conjugation drills, `order`/`transform` for the leddsetninger topics
(subordinate-order, indirekte-tale-at-om, ikke-placement), `minimal-pair` well suited to
`derfor-fordi` and `kvantorer`). All A2, so sentences can run slightly longer than A1's 5–8 words
but should stay well within A2-level vocabulary — cross-check names/nouns/verbs against
`vocab-a2.json`/`uttrykk-a2.json` rather than inventing words above the level.

---

## Vocab verification script

Build `scripts/check-a2-grammar-vocab.mjs`, adapted from `scripts/check-a1-grammar-vocab.mjs`
(same lemma-matching logic — suffix stemming, irregular-verb-form map, phrase-lemma handling),
pointed at `vocab-a2.json`/`uttrykk-a2.json` and scoped to this plan's topic-touches (`cefr: 'A2'`
entries only, so the reused topics' A1/B1/B2 entries aren't checked here). Run after each topic,
same workflow as A1 Phase 3.

**Vocab additions needed before content can be written (from the audit):** `vocab-a2.json` is
missing `glede seg`, `grue seg`, `legge`, `stå`, `ligge`, `til venstre for`, `til høyre for`,
`fot`, `øye` as standalone headwords — add these as part of Phase 2 setup, before writing questions
for `plassering-verb`/`refleksive-verb`/the `preposisjoner-sted` extension, so the verification
script has real headwords to check against. `uttrykk-a2.json` needs the fixed collocations flagged
in the audit (`glad i`, `interessert i`, `stole på`, `ha rett til`, `legge merke til`, `ansvar
for`) added as uttrykk cards.

---

## Implementation phases

### Phase 1 — Rules + types

1. Add 7 new topics to `GrammarTopic` in `src/lib/types.ts`: `presens-perfektum`, `derfor-fordi`,
   `kvantorer`, `modalverb-preteritum` (original 4) + `plassering-verb`, `refleksive-verb`,
   `ha-vs-vaere` (3 from audit, confirmed).
2. Add the 7 new `GrammarRule` entries to `src/lib/grammar/rules.ts` (drafted above — expand to
   the fuller bilingual style used by existing entries).
3. Extend `preposisjoner-sted`'s rule text with the relational forms (til venstre for, til
   høyre for, mellom X og Y) before writing its A2 entries.
4. Reclassify `gq-rel-001`, `gq-rel-002`, `gq-rel-003` from `cefr: 'B2'`/`plusOnly: true` to
   `cefr: 'A2'`/`plusOnly: false` in `grammar.json` (see Decisions for why these 3 and not the
   other 2). Leave `gq-rel-004` and `gq-rel-005` as B2/plusOnly. Lightly adjust `relative-som`'s
   rule text if it now reads B2-first rather than A2-first.
5. Add the missing vocab flagged in the audit (`glede seg`, `grue seg`, `legge`, `stå`, `ligge`,
   `til venstre for`, `til høyre for`, `fot`, `øye`) to `vocab-a2.json`, and the fixed
   collocations to `uttrykk-a2.json`, before Phase 2 content-writing begins.

### Phase 2 — Content, built in the same chapter order as `innhold.md` (10→16)

1. `presens-perfektum` (ch. 10)
2. `preposisjoner-tid` (A2 entries, ch. 10)
3. `adj-definite` (A2 entries, ch. 11)
4. `subordinate-order` (A2 entries, ch. 11)
5. `indirekte-tale-at-om` (A2 entries, ch. 12 — wh-embedded reported questions)
6. `adj-comparison` (A2 entries, ch. 13)
7. `derfor-fordi` (ch. 13)
8. `kvantorer` (ch. 14)
9. `relative-som` (A2 entries, ch. 14)
10. `ikke-placement` (A2 entries, ch. 15)
11. `indirekte-tale-at-om` (more A2 entries, ch. 15 — at/om reporting)
12. `modalverb-preteritum` (ch. 16)
13. `plassering-verb` (ch. 15, audit-driven)
14. `refleksive-verb` (ch. 11/12, audit-driven)
15. `ha-vs-vaere` (ch. 12, audit-driven)
16. `preposisjoner-sted` (A2 entries, ch. 13, audit-driven)
17. `noun-plurals` (A2 entries, ch. 12, audit-driven — irregular body-part plurals)

### Phase 3 — Vocab verification

Build/adapt `scripts/check-a1-grammar-vocab.mjs` → `scripts/check-a2-grammar-vocab.mjs`, pointed at
`vocab-a2.json`/`uttrykk-a2.json`, scoped to this plan's 16 topic-touches with `cefr: 'A2'`
filtering. Run after each topic; fix any unmatched examples the way `gq-noun-pl-020` was fixed in
the A1 plan (swap the example word for one that's actually a standalone A2/A1 vocab headword,
rather than only appearing inside a multi-word uttrykk phrase).

### Phase 4 — Gating + wiring

1. Set `plusOnly: false`/omitted on all new questions (7 new topics + 9 reused topics' A2
   entries), matching the near-universal A2 pattern (only `helsetninger` and `sterke-verb`
   currently buck it). Exception: `gq-rel-004`/`gq-rel-005` stay `plusOnly: true` (unchanged, B2).
2. No `config.ts` change is needed — none of the 7 new topics are added to `FREE_GRAMMAR_TOPICS`
   (confirmed decision), so they simply join the many already-locked A2 topics with non-`plusOnly`
   questions.
3. Update the admin `+page.svelte` `TOPICS` constant to include the 7 new topics so they're
   authorable/editable through the admin UI.
4. Confirm `/grammar` and `/grammar/[topic]` need no route changes (both derive their topic list
   dynamically from `grammar.json` content — already confirmed generically true in the A1 plan's
   Phase 4, applies here unchanged).

---

## Testing

- No new grading logic needed (existing types are type-agnostic — same as A1/C).
- Extend the check that every question's `topic` resolves to an entry in `GRAMMAR_RULES` to cover
  the 7 new topics.

---

## Decisions (resolved)

- **Plus gating (original 4 topics):** locked by default — not added to `FREE_GRAMMAR_TOPICS`,
  same as most other A2 topics.
- **Plus gating (3 audit-driven topics):** follow the same gating as the original 4 — also locked
  by default.
- **`preposisjoner-sted` fold-in:** confirmed — the ch. 13 relational prepositions (til venstre
  for, til høyre for, mellom X og Y) become new A2 entries under the existing `preposisjoner-sted`
  topic (8th reused topic) rather than a standalone topic. Its rule text gets a short addition
  covering the relational forms in Phase 1.
- **Body-part irregular plurals — recommendation:** fold into the existing `noun-plurals` topic
  (9th reused topic) rather than a new topic or vocab-only. Checked `grammar.json` directly:
  `noun-plurals` already spans A1(8)/A2(10)/B1(2) and covers regular plurals plus some zero-plural
  nouns (barn, år, feil) — it's already the established home for "plural formation," and the
  body-part vowel-mutation pattern (fot→føtter, tann→tenner, øye→øyne, kne→knær,
  skulder→skuldre) is a trickier subset of the same skill, not a different one — matches this
  plan's general "reuse over new-topic" bias. `fot` and `øye` also need adding to `vocab-a2.json`
  as standalone headwords (see audit vocab list).
- **New-topic naming:** confirmed — `plassering-verb`, `refleksive-verb`, `ha-vs-vaere` as-is.
- **`relative-som` B2→A2 — recommendation (partial move, not all 5):** checked all 5 existing
  questions directly. `gq-rel-001`, `gq-rel-002`, and `gq-rel-003` are genuinely A2-appropriate —
  som as subject of the relative clause, or as object with som spelled out (not dropped): "Jeg
  kjenner en dame som snakker fire språk," "Har du lest boken som jeg anbefalte?" These 3 move to
  `cefr: 'A2'`/`plusOnly: false`. `gq-rel-004` and `gq-rel-005` test genuinely harder nuances —
  `gq-rel-004` is the som-vs-∅ omission rule (when the relative pronoun can be dropped, which
  depends on subject/object position), and `gq-rel-005` is a fronted relative clause with a
  comma-separated main predicate ("Mannen som hadde skrevet romanen, fikk prisen") — both are
  legitimately B2-level complexity, not just B2-by-convention, so they **stay at B2/plusOnly**
  rather than moving. This gets a learner the straightforward version of som-setninger at A2 (as
  intended) while keeping the trickier omission/fronting rules for B2, rather than either leaving
  everything at B2 or flattening the whole topic to A2.
