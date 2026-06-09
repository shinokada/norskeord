# Grammar Feature — Implementation Plan

## Overview

Add a **Grammar** section under the **Prepare** menu, alongside Quiz and Practice Tests. The feature teaches Norwegian sentence structure (word order, _ikke_-placement, _det_-sentences, etc.) through active-recall exercises with FSRS spaced repetition.

---

## Active learning approaches (decided)

From the brainstorm, these are the approaches in priority order:

1. **Typed fill-in-blank** — user types the missing word(s) into a blank. Flexible matching handles minor typos. Wrong answers show the grammatical rule, not just the correct answer. _(Phase 1)_
2. **Word-order typing** — words are listed as chips/tokens in shuffled order; user types the sentence in the correct order. Provides a visual word bank without drag-and-drop complexity. Works well on mobile. _(Phase 1)_
3. **Sentence transformation** — user types the transformed version of a sentence (e.g. _At du kan komme, er fint._ → _Det er fint at du kan komme._). Highest transfer to real production. _(Phase 1)_
4. **Error-spotting** — show a sentence with the word order wrong; user identifies and fixes it. Deeper processing than fill-in. _(Phase 2)_
5. **Minimal pair judgment** — two versions, user picks the correct one and explains why. Fast, trains intuition. _(Phase 2)_
6. **Contextual dialogue fill-in** — blanks embedded in a realistic chat-bubble conversation. _(Phase 2)_
7. ~~Sentence-builder (drag & drop)~~ — too mechanical and complex for mobile; deferred indefinitely.

---

## Additional active learning ideas (new)

Beyond the original brainstorm, a few more approaches worth considering for later phases:

**8. Cloze story** — a short paragraph (3–5 sentences) with several blanks, all testing the same rule. More context than isolated sentences, harder to use pattern-matching without understanding.

**9. Forced production from L1** — show an English sentence, user writes the Norwegian equivalent. E.g. "Yesterday I went to the store." → _I går gikk jeg til butikken._

**10. Rule labelling** — show a correct sentence, user tags which part applies the rule (click the verb, click _ikke_, etc.). Metalinguistic awareness without production pressure.

**11. Confidence rating** — after any exercise type, user rates their confidence (1–3). Fed into FSRS as a soft signal alongside correctness. Calibrates learners who get lucky on guesses.

---

## Data model

### New types in `src/lib/types.ts`

```typescript
export type GrammarTopic =
  | 'ikke-placement' // ikke in main vs subordinate clauses
  | 'v2-word-order' // inversion after fronted adverbials
  | 'det-sentence' // At X er Y → Det er Y at X
  | 'det-er-ikke' // ordering det / er / ikke
  | 'modal-verb-order' // modal + infinitive position
  | 'subordinate-order'; // general subordinate clause word order

export interface GrammarRule {
  id: GrammarTopic;
  titleEn: string;
  titleNb: string;
  explanationEn: string; // short rule shown on wrong answer
  explanationNb: string;
  blogSlug?: string; // link to related blog post, e.g. 'v2-regelen'
}

export interface GrammarQuestion {
  id: string; // stable key for FSRS, e.g. 'gq-ikke-001'
  topic: GrammarTopic;
  cefr: CEFRLevel;
  type: 'fill' | 'order' | 'transform';
  // --- fill type ---
  sentence?: string; // e.g. "Jeg forstår ikke hvorfor de _____ vinteren."
  words?: string[]; // word set for fill, e.g. ["liker", "ikke liker"]
  // --- order type ---
  tokens?: string[]; // shuffled word list, e.g. ["ikke", "Jeg", "vinteren", "liker"]
  // --- transform type ---
  source?: string; // e.g. "At du kan komme, er fint."
  // --- shared ---
  answer: string; // primary correct answer
  alternates?: string[]; // other accepted forms
  hint?: string; // optional nudge shown after first wrong attempt
  plusOnly?: boolean; // gate advanced questions behind Plus
}
```

### CEFR levels — single primary + multi-level tag

`cefr: CEFRLevel` is the **primary** level: it drives the free-tier budget (`freeGrammarQuestionIds`
keys on it) and the FSRS progress bucket (`grammar_progress.cefr`, one column). A grammar point
often spans bands, so there's an optional `levels?: CEFRLevel[]` **tag** for display/filtering
(e.g. `["B2","C1"]`), defaulting to `[cefr]` via `questionLevels()`. `topicLevels()` aggregates a
topic's span for the level badges shown on each topic card. This keeps gating/progress deterministic
(one bucket) while still labelling multi-level points.

### Data file

`src/lib/data/grammar.json` — flat array of `GrammarQuestion` objects: **63 questions across 8
topics**. The original six sentence-structure topics, plus two added from the B2–C1 workbook:
`relative-som` (relative clauses with «som») and `svar-ja-jo-nei` (the jo/ja/nei short-answer
system). B2–C1 items are mostly `plusOnly` with a small free taste per topic; their sentences are
freshly authored, not copied from the source workbook.

Grammar rules are defined inline in `src/lib/grammar/rules.ts` (a small TS module, not JSON, because they contain explanation prose).

### Question design — active recall, not recognition

Per `ai-docs/active-learning.md`, every question must make the learner **apply** the rule, not
recognise an obvious blank. Concretely:

- **No trivial single-word fills.** A blank whose answer is always `ikke` tests nothing. `fill`
  items now give a small word bank (`words`) the learner must put in the correct **order** inside
  the blank — the `answer` is the ordered span (e.g. `"ikke er"` vs the distractor `"er ikke"`).
- **`transform` is the workhorse** — embedding a main clause into a subordinate frame (forcing
  `ikke` to move), turning at/å-subjects into `det`-clefts (and the reverse), fronting an
  adverbial to trigger V2 inversion, and **L1→Norwegian translation** (approach 9) where English
  word order misleads.
- **`order`** reconstructs full sentences that hinge on a real word-order decision.
- The optional **`prompt`** field carries the task instruction shown above the stimulus
  (e.g. `"Embed in: «Jeg tror at …»"`, `"Translate into Norwegian:"`, `"Start with «I går»"`),
  written in the learner's L1 with NB fragments quoted. Rendered by all three question components.

Phase-2 types (error-spotting, minimal-pair) deepen this further but aren't built yet.

---

## FSRS integration

Grammar questions reuse the FSRS scheduling logic (`DEFAULT_FSRS`, `RATING_MAP`) and the
`CardProgress` shape, but persist to their **own store** keyed by `GrammarQuestion.id` — kept
separate from vocab so grammar reviews never pollute the vocab category/level stats and can be
FSRS-weight-tuned independently later.

Implemented in `src/lib/progress.ts`:

- `GRAMMAR_LS_PREFIX = 'grammar-'` — distinct from `LS_PREFIX` (`'progress-'`) so the vocab
  loaders never pick up grammar keys.
- `clearUserProgress` clears both `LS_PREFIX` and `GRAMMAR_LS_PREFIX` keys on logout.
- `loadGrammarProgressMap()` — guest/free, from `localStorage`.
- `loadGrammarProgressFromSupabase(userId)` — Plus, from the `grammar_progress` table.
- `saveGrammarProgress(question, rating, map, userId)` — Plus → `grammar_progress` upsert
  (`onConflict: user_id,question_id`); guest/free → `localStorage` under `grammar-<id>`.

All maps are keyed by `GrammarQuestion.id` (e.g. `gq-ikke-001`), so the session components look
up progress directly by question id.

### Stats page integration

`/stats` surfaces grammar alongside vocab:

- A **Grammar** section (shown when the grammar map is non-empty): questions practiced,
  due-for-review, mastered, and a per-topic breakdown (topic titles from `rules.ts`). Loaded via
  `loadGrammarProgressFromSupabase` (Plus) / `loadGrammarProgressMap` (free).
- **Activity heatmap + streak already include grammar** for Plus (grammar saves call
  `recordStudyDay`). For free/guest users the streak/activity now derive from the **combined**
  vocab + grammar maps, so grammar-only practice still counts (keys don't collide: norsk vs id).
- **Reset** is grammar-aware: free users go through `clearUserProgress` (clears both `progress-`
  and `grammar-`), and `resetProgressInSupabase` now also deletes `grammar_progress`.
- Vocab-specific sections (CEFR estimate, summary tiles, per-level, per-category) are gated on
  `totalSeen > 0`, so a grammar-only user sees Activity + Grammar without empty vocab panels. Quiz
  needs no separate handling — it writes to `card_progress`, so it's already in the vocab totals.

### Supabase: new `grammar_progress` table (migration `014_grammar_progress.sql`)

Note: there is **no** generic `user_progress` table in this project — vocab progress lives in
`card_progress`. Grammar gets its own table mirroring the `card_progress` FSRS column layout,
keyed by `(user_id, question_id)`, with `topic` and `cefr` columns and the standard own-row RLS
policy (`auth.uid() = user_id`). Definition is also appended to `supabase/schema.sql`.

---

## Route structure

```
src/routes/grammar/
  +page.svelte          # topic picker / entry point
  +page.ts              # client-side load (ssr = false), imports grammar.json statically
  [topic]/
    +page.svelte        # exercise session for a specific topic
    +page.ts            # client-side load (ssr = false), filters questions by topic
```

**No `+page.server.ts` anywhere in the grammar routes.** Grammar JSON is bundled at build time and imported as a static asset — zero edge function invocations per visit. This matches how `/quiz` is built (`+page.ts` with `ssr = false` and static JSON imports).

The session flow mirrors the quiz state machine: `idle → questioning → revealing → summary`.

---

## Component structure

```
src/lib/components/grammar/
  GrammarSession.svelte      # outer state machine shell (idle/questioning/revealing/summary)
  FillQuestion.svelte        # fill-in-blank exercise card
  OrderQuestion.svelte       # word-order typing: shows token chips, user types the sentence
  TransformQuestion.svelte   # sentence transformation exercise card
  AnswerReveal.svelte        # shows correct answer + rule explanation + FSRS rating buttons
  GrammarSummary.svelte      # end-of-session stats (score, due-soon count)
  TopicCard.svelte           # picker card for the /grammar landing page
```

All three question components share `<AnswerReveal>`, keeping rule explanations consistent.

### OrderQuestion behaviour

The word chips are displayed in shuffled order above the input field. The user types the sentence — the chips are reference only, not interactive. On submit, the answer is compared against `question.answer` (and `alternates`) with the same flexible matching used for fill questions (case-insensitive, punctuation-tolerant). This avoids all drag-and-drop complexity while still giving a visual scaffold.

---

## Nav change

In `Nav.svelte`, add one `<DropdownItem>` under the Prepare dropdown:

```svelte
<DropdownItem href="/grammar">{$t('nav_grammar')}</DropdownItem>
```

Add `nav_grammar` to `messages/en.json` and `messages/nb.json`.

---

## Plus gating

Mirrors the Quiz's "3 free categories per level" model, generalised to a tunable count:

- **Free:** within each topic, the first `FREE_GRAMMAR_PER_LEVEL` (default **5**) non-`plusOnly`
  questions of each CEFR level, in `grammar.json` file order. Computed by `freeGrammarQuestionIds()`
  in `types.ts`. Budgeting **per topic** (not globally per level) guarantees every topic offers a
  free taste — a global cap would let an early topic exhaust a level's whole allowance and leave
  later topics fully locked. Auto-scales: as questions are added, the free taste stays fixed size.
- **Plus:** every other question, plus anything explicitly flagged `plusOnly: true` (advanced
  B1/B2 transforms). Free users building a session simply never receive the gated questions; the
  topic picker shows how many extra questions Plus unlocks.
- The `/grammar` landing page shows each topic's free/total counts and a Plus badge when a topic
  has Plus-only questions.

---

## Implementation phases

### Phase 1 — Core (MVP)

1. Add `GrammarTopic`, `GrammarRule`, `GrammarQuestion` types to `types.ts`
2. Create `src/lib/grammar/rules.ts` with rule explanations for the initial topics
3. Create `src/lib/data/grammar.json` with ~30 questions covering:
   - `ikke-placement` (from Ex. 17 in the textbook images)
   - `det-sentence` (from Ex. 4)
   - `det-er-ikke` (from Ex. 3)
4. Add `GRAMMAR_LS_PREFIX` to `progress.ts` and update `clearUserProgress`
5. Build `GrammarSession`, `FillQuestion`, `OrderQuestion`, `TransformQuestion`, `AnswerReveal`, `GrammarSummary` components
6. Create `src/routes/grammar/+page.svelte` (topic picker)
7. Create `src/routes/grammar/[topic]/+page.svelte` (session)
8. Nav + i18n strings

### Phase 2 — Expanded content + exercise types

- Add error-spotting and minimal pair judgment question types
- Add ~50 more questions covering `v2-word-order`, `modal-verb-order`, `subordinate-order`
- Add cloze-story exercise (approach 7 above)

### Phase 3 — Analytics + optimisation

- Progress dashboard: show which topics are due for review
- FSRS weight optimisation for grammar cards (same endpoint as vocab if enough data)
- Confidence rating (approach 10)

---

## Testing

### Unit tests (Vitest) — `src/lib/grammar/session.test.ts`

- `normalizeAnswer` — case/punctuation/whitespace normalisation.
- `gradeGrammarAnswer` — exact match (`good`), 1-char typo tolerance (`hard`), far-off (`again`),
  empty input, alternates.
- `buildGrammarSession` — caps at count, returns all when fewer, prioritises overdue/new cards.
- `shuffleTokens` — preserves the token multiset; handles a single token.
- `freeGrammarQuestionIds` — first N non-`plusOnly` per level free; `plusOnly` never free.
- Grammar progress (guest path) — `saveGrammarProgress`/`loadGrammarProgressMap` round-trip,
  `seenCount` increments, no collision with the `progress-` vocab namespace, and
  `clearUserProgress` removes grammar keys.

Run: `npm run test` (or `npx vitest run src/lib/grammar`).

### E2E (Playwright) — proposed, not yet added

One happy-path spec: visit `/grammar` → open a topic → answer a question → assert the reveal +
rule explanation render → reach the summary. Should mock `__data.json` for plan state the same way
the existing quiz e2e does. Left for confirmation of the project's Playwright conventions before
adding, to avoid guessing the fixture/auth setup.

## Open questions

- Should grammar sessions be length-fixed (e.g. 10 questions) or run until the due queue is empty? Recommendation: fixed at 10 for now, same as quiz, switchable later.
- Do grammar questions appear in the existing Quiz, or only in the Grammar section? Recommendation: Grammar section only — avoids cluttering the Quiz with a different question shape.
- Paraglide: grammar rule explanations need both `en` and `nb` versions. Store them in `rules.ts` directly (bilingual object) rather than the Paraglide message catalogue, since they're long prose, not short UI strings.
