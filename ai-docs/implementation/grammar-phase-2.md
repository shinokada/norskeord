# Grammar Feature — Phase 2 Implementation Plan

Phase 1 covers sentence-structure topics (ikke-placement, V2 word order, det-sentences, etc.)
using three question types: `fill`, `order`, and `transform`.

Phase 2 does two things:

1. **Expands content scope** — adds Norwegian morphology topics (adjective agreement, forms)
   alongside new sentence-structure types for existing topics, sourced from ch-2 of the A2/B1
   workbook onward.
2. **Adds exercise types** — cloze-story, error-spotting, minimal-pair, and compound building.

> **Scope rule:** each workbook chapter is implemented once. Ch-1 (Substantiv) is complete —
> `noun-articles`, `noun-plurals`, and `noun-possessives` questions already exist in
> `grammar.json`. Phase 2 starts from ch-2 (Adjektiv). Note: `noun-*` rule definitions are
> still missing from `rules.ts` and should be added as a housekeeping task before Phase 2a ships.

---

## New grammar topics

Add these to `GrammarTopic` in `src/lib/types.ts`:

```typescript
| 'adj-agreement'      // adjective agreement: ubestemt sg → pl, bestemt form
| 'adj-definite'       // den/det/de + weak adjective form
| 'adj-comparison'     // comparative and superlative forms
```

Add corresponding `GrammarRule` entries to `src/lib/grammar/rules.ts` with `titleEn`, `titleNb`,
`explanationEn`, and `explanationNb` for each topic.

> **Housekeeping (before Phase 2a):** also add `GrammarRule` entries for `noun-articles`,
> `noun-plurals`, and `noun-possessives` — the questions exist in `grammar.json` but the rule
> definitions are missing from `rules.ts`, which will cause the topic cards to render without
> explanations.

---

## New question types

### L1-forced production (not a separate type)

Idea 9 from grammar.md — showing an English sentence and asking the user to write the Norwegian equivalent — is already supported by the `transform` type with `prompt: "Translate into Norwegian:"`. Several Phase 1 questions already use this pattern (e.g. `gq-dei-007`, `gq-det-008`). No new type needed. When authoring morphology questions, use `transform` + L1 prompt freely wherever English word order or article usage would mislead — it produces the highest transfer to real production.

---

### Type: `cloze`

A short original text (3–5 sentences) with several blanks, all testing the same rule. More
context than isolated sentences — harder to pattern-match without understanding.

Extends `GrammarQuestion`:

```typescript
type: 'cloze';
passage: string;   // text with ___ marking each blank
blanks: string[];  // correct answer for each blank, in order
```

The session component fills blanks sequentially: the user types each answer before revealing the
next. All blanks scored together; one `FSRSRating` per passage.

**When to use:** morphology topics with several inflected forms in context
(e.g. a passage that requires `mannen`, `bilen`, `huset`, `vennene` — one blank each).

### Type: `error-spot`

Show a sentence with one deliberate grammatical error (wrong article, wrong plural, apostrophe
misuse, wrong adjective form). User identifies and corrects it.

Extends `GrammarQuestion`:

```typescript
type: 'error-spot';
sentence: string; // sentence containing exactly one error
answer: string; // the corrected full sentence
errorWord: string; // the incorrect word/phrase (used for partial-credit detection)
```

**When to use:** topics where wrong forms are common and recognisable
(e.g. `*Jeg kjenner Livs foreldrene.` → correct to `Jeg kjenner Livs foreldre.`).

### Type: `minimal-pair`

Show two versions of a sentence; user picks the correct one and (optionally) explains why.
Fast to answer, trains intuition.

Extends `GrammarQuestion`:

```typescript
type: 'minimal-pair';
optionA: string;
optionB: string;
answer: 'A' | 'B';
explanation: string; // rule explanation shown after reveal
```

**When to use:** contrastive pairs where the wrong form sounds almost right
(e.g. `Den nye læreren er flink.` vs `*Nye læreren er flink.`).

> **⚠️ Alignment note — recognition vs. recall:** The blog post _Slik bruker du Norskeord_ draws
> a sharp line: _"Recognition is not the same as recall."_ `minimal-pair` is a recognition type
> — the learner picks between two given options rather than producing an answer. It should be
> used as a **warm-up or introduction type**, not as the primary drill. When authoring questions
> in `grammar.json`, place `minimal-pair` items _early_ in each topic's question list so FSRS
> schedules them first; subsequent reviews should be `transform` or `error-spot`, which demand
> active production.

### Type: `compound`

Show a descriptive phrase in Norwegian (e.g. _en skole der man lærer språk_); user writes the
compound noun (e.g. _språkskole_).

Extends `GrammarQuestion`:

```typescript
type: 'compound';
description: string; // descriptive phrase
answer: string;      // target compound
alternates?: string[];
```

**When to use:** a dedicated `noun-compounds` topic, if that topic is added in a future phase.
`noun-compounds` was part of the original Phase 2a plan but is deferred because ch-1 (Substantiv)
is already complete — no new Substantiv questions should be created.

### Type: `confidence` (UI layer, not a question type)

Idea 11 from grammar.md — after answering, user rates their confidence (1–3) as a soft signal fed into FSRS alongside correctness. This is not a new question type; it's a change to `AnswerReveal.svelte`.

Currently the reveal shows explicit FSRS buttons (again / hard / good / easy). The original plan was to replace these with a 3-point emoji picker, but this conflicts with the honest-rating principle in the blog post _Slik bruker du Norskeord_, which states that the algorithm is only useful if it receives accurate signals.

**Revised approach — keep four FSRS labels, improve their copy:**

Rather than replacing the buttons with emoji, add a short gloss under each existing button so the
meaning is unambiguous:

| Button | Gloss                |
| ------ | -------------------- |
| Again  | _didn't know it_     |
| Hard   | _got it, but slowly_ |
| Good   | _knew it_            |
| Easy   | _instant_            |

This preserves the full signal quality the FSRS algorithm depends on while reducing the
cognitive friction of rating. The emoji picker collapses "Hard" and "Good" into adjacent symbols,
which can cause a learner who guessed correctly to tap 😊 out of relief rather than honest
assessment — degrading scheduling accuracy.

Implementation: one small change to `AnswerReveal.svelte` (add gloss text under each button),
no data model changes, no new Supabase columns.

### Type: `label` (Phase 2e — future)

Idea 10 from grammar.md — show a correct sentence, user taps/clicks which word applies the rule (e.g. tap the verb after inversion, tap «ikke» in the subordinate clause). Gives metalinguistic awareness without production pressure — lower stakes than `transform`, good for introducing a rule before drilling it.

Deferred to Phase 2e because it requires a tap-to-tag component with no parallel in the current architecture, and is fiddly on mobile. When built:

```typescript
type: 'label';
sentence: string; // the sentence to tag
targetIndex: number; // index of the word to tag (0-based)
targetWord: string; // the correct word to tag (for validation)
taskEn: string; // instruction, e.g. "Tap the finite verb."
```

`LabelQuestion.svelte` renders the sentence as tappable word chips. On tap, the chip is highlighted; on submit, correct chip turns green, wrong chip turns red with the rule explanation.

---

## Type system changes (`src/lib/types.ts`)

Extend `GrammarQuestion.type`:

```typescript
type: 'fill' | 'order' | 'transform' | 'cloze' | 'error-spot' | 'minimal-pair' | 'compound';
```

Add the new fields to the `GrammarQuestion` interface under clearly commented sections.

---

## Component additions

```
src/lib/components/grammar/
  ClozeQuestion.svelte        # sequential blank fill inside a passage
  ErrorSpotQuestion.svelte    # show sentence, user corrects the error
  MinimalPairQuestion.svelte  # two-option picker + explanation reveal
  CompoundQuestion.svelte     # description → compound noun
```

`AnswerReveal.svelte` is shared across all types — no changes needed.
`GrammarSession.svelte` routes to the new components by `question.type`.

---

## Content scope

### Phase 2a — Adjektiv morphology (A2/B1, ch-2)

Source material: `draft/a2-b1/ch-2.txt` (original sentences rewritten for copyright).

| Ex. | Topic          | Phase 2 type | Notes                                     |
| --- | -------------- | ------------ | ----------------------------------------- |
| 1   | adj-agreement  | fill         | Insert adjective in correct ubestemt form |
| 2   | adj-agreement  | fill         | en/ei/et agreement across genders         |
| 3   | adj-agreement  | transform    | Singular → plural, keep adjective correct |
| 5   | adj-definite   | minimal-pair | den nye vs *nye; den irske vs *Irske      |
| 6   | adj-definite   | fill         | Insert adjective with den/det/de          |
| 7   | adj-comparison | transform    | Comparative and superlative construction  |

Target: ~25 original questions (`gq-adj-*`) covering all three topics at A2 and B1.

### Phase 2b — New sentence-structure types

Error-spotting and minimal-pair for the existing Phase 1 topics:
`ikke-placement`, `v2-word-order`, `det-sentence`, `det-er-ikke`, `modal-verb-order`.
Adds ~15 questions across these topics with the `error-spot` and `minimal-pair` types.

No new topics introduced here — these are new question _types_ on already-existing topics.

---

## Plus gating

All `adj-*` morphology topics are **Plus-only** — they are richer content beyond the
free sentence-structure taste. The existing `noun-*` topics follow the same rule.
Update `FREE_GRAMMAR_TOPICS` in `src/lib/types.ts`:

```typescript
// Morphology topics (noun-*, adj-*) are not in the free set
export const FREE_GRAMMAR_TOPICS = new Set<GrammarTopic>([
  'ikke-placement',
  'v2-word-order',
  'det-er-ikke',
  'modal-verb-order'
  // noun-* and adj-* topics: Plus only
]);
```

Within each morphology topic, `FREE_GRAMMAR_PER_TOPIC` (currently 3) still applies to give a
free taste — so free users see 3 questions per morphology topic before hitting the Plus gate.

---

## FSRS integration

No changes needed. `cloze`, `error-spot`, `minimal-pair`, and `compound` all use the same
`CardProgress` shape and `saveGrammarProgress` function. The session shell issues one FSRS rating
per question card regardless of type.

---

## Supabase

No schema changes. `grammar_progress` stores `(user_id, question_id, topic, cefr, …)` — the new
question ids (`gq-adj-*`) slot in cleanly.

---

## Implementation phases

### Housekeeping (before Phase 2a)

1. Add missing `GrammarRule` entries to `rules.ts` for `noun-articles`, `noun-plurals`,
   `noun-possessives` — these topics have questions in `grammar.json` but no rule definitions.

### Phase 2a — Adjektiv (MVP morphology)

1. Add `adj-agreement`, `adj-definite`, `adj-comparison` to `GrammarTopic` + rules in `rules.ts`.
2. Add `minimal-pair` and `error-spot` types to `GrammarQuestion` in `types.ts`.
3. Build `MinimalPairQuestion.svelte` and `ErrorSpotQuestion.svelte`.
4. Write ~25 original questions (`gq-adj-*`) covering ch-2 exercises 1–7.
5. Update `GrammarSession.svelte` to route the two new types.

### Phase 2b — Cloze + sentence-structure error-spotting

1. Add `cloze` type; build `ClozeQuestion.svelte`.
2. Write original cloze passages for `adj-*` topics.
3. Write ~15 `error-spot` and `minimal-pair` questions for existing Phase 1 topics.

### Phase 2c — Rating copy improvement + "say it aloud" nudge

1. Add short gloss text under each FSRS rating button in `AnswerReveal.svelte` (_didn't know it_ / _got it, but slowly_ / _knew it_ / _instant_). Keep the four labels; improve copy only.
2. Add a **"say it aloud" nudge** to `AnswerReveal.svelte`, shown only on correct answers:
   > _✓ Say the sentence out loud before moving on._
   > This directly operationalises the article's advice — _"Say it in a sentence"_ — in the grammar context. Zero data model changes; one line in the reveal template.

### Phase 2e — Rule labelling (future)

1. Add `label` type to `GrammarQuestion`.
2. Build `LabelQuestion.svelte` (tappable word chips, highlight on tap, green/red on reveal).
3. Write ~20 label questions across sentence-structure topics as low-stakes rule introductions.

---

## Testing

### Unit tests (extend `src/lib/grammar/session.test.ts`)

- `gradeGrammarAnswer` handles `minimal-pair` (exact A/B match, case-insensitive).
- `gradeClozeAnswer` grades each blank independently, aggregates to one rating.
- `gradeCompoundAnswer` — flexible matching for compound nouns (case, hyphen variants).

### E2E (Playwright)

- Visit `/grammar` → open a morphology topic → answer a `minimal-pair` question → assert reveal.
- Answer a `cloze` passage end-to-end → assert all blanks graded → reach summary.

---

## Open questions

- Should `cloze` passages count as one FSRS card or one card per blank? Recommendation: one card
  per passage — simpler progress tracking, consistent with other question types.
- Should `adj-comparison` be A2 or B1 primary CEFR? Comparative forms appear in A2 but
  superlatives and irregular forms (god → bedre → best) are solidly B1. Recommendation: split —
  regular comparatives at A2, superlatives and irregulars at B1.
- `compound` type (deferred): if `noun-compounds` is ever added as a topic in a future phase,
  hyphenated variants (e.g. `språk-skole`) should be accepted — strip hyphens in
  `normalizeAnswer` before comparing.
