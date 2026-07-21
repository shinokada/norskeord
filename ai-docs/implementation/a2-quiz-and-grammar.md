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

**Recommendation: different from A1.** A1's "make everything free" rationale doesn't carry over —
A2 is not the onboarding entry point, and the existing A2 grammar content is already a deliberate
mix: most A2 topics have non-`plusOnly` questions (`ikke-placement`, `adj-comparison`,
`adj-definite`, `subordinate-order`, `noun-articles`, `preposisjoner-tid`, etc. are 100% free at
the question level), but only 4 original topics (`ikke-placement`, `v2-word-order`, `det-er-ikke`,
`modal-verb-order`) plus the 6 reused-from-A1 topics we just added
(`noun-articles`/`noun-plurals`/`adj-agreement`/`noun-possessives`/`preposisjoner-tid`/`helsetninger`)
are actually reachable via the `/grammar` picker for free users — everything else (including
`adj-comparison`, `adj-definite`, `subordinate-order`, `relative-som`) is topic-locked at the
picker today even though its individual questions aren't `plusOnly`. `helsetninger` and
`sterke-verb` are the outliers — their entire A2 entry sets are `plusOnly: true`.

Given that pattern, the recommendation is:

- New questions in the 4 new topics (`presens-perfektum`, `derfor-fordi`, `kvantorer`,
  `modalverb-preteritum`): `plusOnly: false`/omitted, matching the overwhelming majority pattern
  at A2 — but **do not** add these 4 new topics to `FREE_GRAMMAR_TOPICS`. This keeps them
  reachable only by Plus subscribers via the picker (same as most existing A2 topics), consistent
  with A2 being paid-tier content rather than the onboarding tier A1 is.
- New A2 entries in reused topics inherit whatever gating that topic already has: `ikke-placement`
  and `preposisjoner-tid` are already `FREE_GRAMMAR_TOPICS` members (the latter via the A1 plan's
  Phase 4), so their new A2 entries are automatically reachable (still capped at
  `FREE_GRAMMAR_PER_TOPIC` = 3 playable questions for non-Plus users, same mechanism documented in
  `a1-quiz-and-grammar.md` Phase 4). `adj-definite`, `subordinate-order`, `adj-comparison`, and
  `relative-som` are **not** currently in `FREE_GRAMMAR_TOPICS`, so their new A2 entries stay
  topic-locked for free users by default — no action needed, this just inherits the existing
  status quo. `indirekte-tale-at-om` **is** already in `FREE_GRAMMAR_TOPICS` (added as one of A1's
  19 new topics), so its new A2 entries are reachable too.

**This needs confirming before Phase 4** (same as the A1 plan flagged its gating question) — it's
a real product decision (how much A2 grammar should be free), not just a technical default.

---

## New topics (4)

| Topic                  | Source (ch.) | Notes                                                                                                                                                                                             | Q's |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `presens-perfektum`    | 10           | Formation (har + perfektum partisipp), presens perfektum vs. preteritum contrast, ja/nei + ikke/aldri answers, "hvor lenge har du…" duration questions.                                           | 14  |
| `derfor-fordi`         | 13           | derfor = result/consequence, main-clause connector adverb triggering V2 inversion in the clause it starts; fordi = cause, subordinate connector, normal subject-before-verb order.                | 8   |
| `kvantorer`            | 14           | mye/mange and mer/flere, keyed to whether the noun is countable (mange venner, flere oppgaver) or uncountable (mye mat, mer plass).                                                               | 8   |
| `modalverb-preteritum` | 16           | Modal preteritum forms — kan→kunne, vil→ville, skal→skulle, må→måtte, bør→burde — used both as plain past tense and inside reported speech ("Han sa at han måtte…", "Hun spurte om hun skulle…"). | 10  |

**Subtotal: ~40 questions across 4 new topics.**

## Reused topics (add `cefr: 'A2'` entries)

| Topic                  | Source (ch.) | A2 item                                                                                         | New Q's |
| ---------------------- | ------------ | ----------------------------------------------------------------------------------------------- | ------- |
| `adj-definite`         | 11           | Adjektiv i bestemt form — den/det/de + weak adjective ending, more drilling at A2.              | 8       |
| `subordinate-order`    | 11           | Leddsetninger — linking main + subordinate clauses with da/når/hvis/fordi, word order inside.   | 8       |
| `indirekte-tale-at-om` | 12, 15       | Leddsetninger med spørreord (wh-embedded reported questions) + more at/om reporting at ch. 15.  | 12      |
| `adj-comparison`       | 13           | Adjektiv: komparativ og superlativ — weather/place comparisons, superlative-only responses.     | 8       |
| `relative-som`         | 14           | Som-setninger — relative clauses with som as subject, and as object with preposition stranding. | 8       |
| `ikke-placement`       | 15           | Leddsetninger med ikke, alltid, aldri — adverb placement inside at/om-clauses.                  | 8       |
| `preposisjoner-tid`    | 10           | Duration/point-in-time expressions (i/om/for–siden) paired with presens perfektum sentences.    | 6       |

**Subtotal: ~58 questions across 7 reused topics.**

**Total: ~98 questions across 11 topic-touches.**

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
}
```

Reused topics (`adj-definite`, `subordinate-order`, `indirekte-tale-at-om`, `adj-comparison`,
`relative-som`, `ikke-placement`, `preposisjoner-tid`) need no rule-text changes — just new
`cefr: 'A2'` question entries under the existing rule. One check worth doing in Phase 1:
`relative-som`'s current explanation text is written for its B2 audience ("boka (som) jeg leste"

- object-drop nuance) — confirm it still reads fine as the _first_ introduction to som-setninger a
  learner sees at A2, or add a lighter A2-facing example if needed (same treatment `preposisjoner-tid`
  got when A1 reused it).

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
pointed at `vocab-a2.json`/`uttrykk-a2.json` and scoped to this plan's 11 topic-touches
(`cefr: 'A2'` entries only, so the reused topics' A1/B1/B2 entries aren't checked here). Run after
each topic, same workflow as A1 Phase 3.

---

## Implementation phases

### Phase 1 — Rules + types

1. Add 4 new topics to `GrammarTopic` in `src/lib/types.ts`.
2. Add 4 new `GrammarRule` entries to `src/lib/grammar/rules.ts` (drafted above — expand to the
   fuller bilingual style used by existing entries).
3. Spot-check `relative-som`'s existing rule text reads fine for an A2 audience (see note above);
   lightly adjust if not.

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

### Phase 3 — Vocab verification

Build/adapt `scripts/check-a1-grammar-vocab.mjs` → `scripts/check-a2-grammar-vocab.mjs`, pointed at
`vocab-a2.json`/`uttrykk-a2.json`, scoped to this plan's 11 topic-touches with `cefr: 'A2'`
filtering. Run after each topic; fix any unmatched examples the way `gq-noun-pl-020` was fixed in
the A1 plan (swap the example word for one that's actually a standalone A2/A1 vocab headword,
rather than only appearing inside a multi-word uttrykk phrase).

### Phase 4 — Gating + wiring

1. Decide the Plus-gating question above (confirm with the user before touching `config.ts`) —
   whether the 4 new topics stay Plus-only-by-omission (recommended, matching most A2 topics) or
   should be added to `FREE_GRAMMAR_TOPICS` like A1's were.
2. Set `plusOnly: false`/omitted on all new questions (new + reused topics), matching the
   near-universal A2 pattern (only `helsetninger` and `sterke-verb` currently buck it).
3. If any new topics are added to `FREE_GRAMMAR_TOPICS`, do so in `config.ts`; otherwise no
   `config.ts` change is needed for the 4 new topics (they simply join the many already-locked A2
   topics with non-`plusOnly` questions).
4. Update the admin `+page.svelte` `TOPICS` constant to include the 4 new topics so they're
   authorable/editable through the admin UI.
5. Confirm `/grammar` and `/grammar/[topic]` need no route changes (both derive their topic list
   dynamically from `grammar.json` content — already confirmed generically true in the A1 plan's
   Phase 4, applies here unchanged).

---

## Testing

- No new grading logic needed (existing types are type-agnostic — same as A1/C).
- Extend the check that every question's `topic` resolves to an entry in `GRAMMAR_RULES` to cover
  the 4 new topics.

---

## Open questions

- **Plus gating** (see "Recommendation on the two open questions" above) — confirm before Phase 4
  whether the 4 new topics should be free-by-default (A1-style) or locked-by-default (matching
  most other A2 topics, which is what this plan recommends).
- `relative-som`'s existing rule text and its 5 existing B2 questions were written for a B2
  audience — worth a quick look in Phase 1 to confirm reusing the topic at A2 doesn't feel like a
  level mismatch to a learner encountering it there first.
- Chapter 10's material was originally flagged as out-of-scope in `a1-quiz-and-grammar.md` because
  it had no A1 source file; that's now resolved by this plan (chapter 10 is A2 content, covered
  here).
