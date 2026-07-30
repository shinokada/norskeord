# Punctuation Grammar Questions — Implementation Plan

## Background

Flagged as out-of-scope in `ai-docs/implementation/b2-grammar-2.md`: GiN3 tekstbok's
"Kommaregler" section is real, testable B2/C content, but none of the current five question
types (`fill`/`order`/`transform`/`minimal-pair`/`multiple-choice`) can grade it correctly. This
doc is the standalone plan for adding that capability, to be picked up independently of the B2
round-2 work.

## Why this needs new plumbing, not just new content

`gradeGrammarAnswer` (`src/lib/grammar/session.ts`) calls `normalizeAnswer`, which strips
`.,!?;:"«»''` before comparing. That's correct for every existing question type — punctuation is
never the thing being tested — but it's exactly wrong here: two `multiple-choice` options that
differ only by a comma (e.g. one has a comma before a relative clause, one doesn't) normalize to
the **same string**, so the grader can't distinguish the correct option from the wrong one. The
1-edit-distance typo tolerance makes this worse, not better — a missing/extra comma is a 1-char
edit, so even without normalization stripping it, the "hard but correct" typo-tolerance path
would silently accept the wrong punctuation as a typo of the right one.

So this needs: a grading path that (a) preserves punctuation characters when comparing, and (b)
disables the typo-tolerance fallback entirely.

## Design decision: new `type: 'punctuation'`, not a flag on `multiple-choice`

Considered adding a `punctuationSensitive?: boolean` flag to the existing `multiple-choice` type
instead. Rejected: `MultipleChoiceQuestion.svelte` hardcodes the instruction label ("Hvilken
omskriving betyr det samme?"), which is wrong for a comma question, and silently changing grading
behavior based on a boolean buried on the question object is easy to miss when authoring content.
A dedicated type is self-documenting in both the data and the UI branch.

**Recommendation: add `'punctuation'` as a sixth `GrammarQuestion.type`.** Reuses the existing
`options`/`answer` fields (same shape as `multiple-choice`: exactly 3 full-sentence options,
`answer` must equal one verbatim) — no new question-level fields needed, only a new type tag and a
new grading/UI path.

## Schema changes (`src/lib/types.ts`)

```typescript
export interface GrammarQuestion {
  // ...
  type: 'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice' | 'punctuation';
  // options?: string[] already exists and is reused as-is for 'punctuation'
}
```

No new `GrammarTopic` entries are required by the type system itself — punctuation topics are
just topics like any other (see Content below).

## Grading changes (`src/lib/grammar/session.ts`)

Add a punctuation-preserving normalizer alongside the existing one, and branch on question type in
`gradeGrammarAnswer`:

```typescript
/**
 * Same as normalizeAnswer but keeps punctuation — used for 'punctuation' questions,
 * where the punctuation is the thing being tested and must not be erased before comparing.
 */
export function normalizeAnswerKeepPunctuation(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function gradeGrammarAnswer(
  input: string,
  question: GrammarQuestion
): { correct: boolean; rating: FSRSRating } {
  if (question.type === 'punctuation') {
    const norm = normalizeAnswerKeepPunctuation(input);
    if (!norm) return { correct: false, rating: 'again' };
    const candidates = [question.answer, ...(question.alternates ?? [])].map(
      normalizeAnswerKeepPunctuation
    );
    // No typo-tolerance fallback here: a 1-character edit is exactly what a
    // missing/misplaced comma looks like, so leniency would defeat the question.
    return candidates.includes(norm)
      ? { correct: true, rating: 'good' }
      : { correct: false, rating: 'again' };
  }
  // ... existing logic unchanged for all other types
}
```

Everything downstream (`saveGrammarProgress`, FSRS scheduling, `GrammarSummary`) is type-agnostic
and needs no changes.

## UI changes

1. **New `src/lib/components/grammar/PunctuationQuestion.svelte`** — near-identical to
   `MultipleChoiceQuestion.svelte` (same button-list layout, same `onsubmit(option)` contract,
   same "Hopp over" skip link), but with its own fixed Norwegian label instead of the
   paraphrase-specific one: `"Hvilken setning har riktig tegnsetting?"`. Render `question.prompt`
   above the options same as the multiple-choice component does, for topic-specific framing when
   needed (e.g. "Sett komma foran leddsetningen der det trengs.").
2. **`GrammarSession.svelte`** — add one more `{:else if current.type === 'punctuation'}` branch
   importing and rendering `PunctuationQuestion`.
3. **`AnswerReveal.svelte`** — check it renders `question.explanation` and the rule box
   generically (it should already, since that's type-agnostic); no change expected, just verify
   after the new type lands.

## Content plan

**New topic:** `kommaregler` (B2/C — comma rules). Candidate rule sub-points, drawn from GiN3
tekstbok's "Kommaregler" plus standard Norwegian comma conventions:

- Comma before a relative/subordinate clause that follows the main clause vs. no comma when a
  subordinate clause is fronted (mirrors existing V2/subordinate-order content, but for the comma
  itself, not word order).
- Comma in lists (oppramsing) — before the last item only when there's no `og`/`eller`.
- Comma around parenthetical/appositive insertions.
- Comma with direct speech (direkte tale) — before/after the quote, placement relative to the
  reporting clause.
- Optional vs. obligatory comma before a coordinating conjunction (`og`/`men`/`for`/`så`) joining
  two main clauses — obligatory-vs-stylistic distinction is a common B2/C confusion point.

**Format:** `type: 'punctuation'`, 3 options per question — near-identical sentences differing
only in comma placement, one correct. IDs: `gq-komma-00X`. Same copyright approach as every other
plan (freshly written sentences, real `vocab-b2.json`/`vocab-c.json` headwords).

**Gating:** B2/C content — Plus-gated by CEFR level, consistent with every other B2/C topic (no
`FREE_GRAMMAR_TOPICS` changes needed, same as `b2-grammar-2.md`'s Plus-gating note).

**Language:** Norwegian-only throughout (`prompt`/`hint`/`explanation`/`options`), per
`grammar-with-only-norsk.md` — no exception for this topic.

**Verification script caveat:** `scripts/check-grammar-norwegian.mjs` needs a look before running
against this topic — it currently checks for English-tell _words_, not punctuation, so it should
be unaffected, but confirm it doesn't choke on options that are near-duplicate strings (some
existing dedup/lint logic elsewhere in the pipeline might assume distinct option text).

## Testing

1. Unit tests in `src/lib/grammar/session.test.ts` for `gradeGrammarAnswer` with
   `type: 'punctuation'`: exact match with correct comma → correct; same sentence with comma
   removed/misplaced → incorrect (explicitly assert the typo-tolerance path does NOT kick in).
2. `grammar-data.test.ts`'s topic→`GRAMMAR_RULES` check should pick up `kommaregler`
   automatically once a rule entry exists in `rules.ts` — confirm it still passes, no test
   changes expected.
3. Manual pass: run a full session on `/grammar/kommaregler` after content lands, confirm correct
   option is graded correct and both incorrect options are graded incorrect (not just one).

## Implementation phases

### Phase 1 — Plumbing (no content yet)

1. Add `'punctuation'` to `GrammarQuestion['type']` in `types.ts`.
2. Add `normalizeAnswerKeepPunctuation` + the `gradeGrammarAnswer` branch in `session.ts`.
3. Add `PunctuationQuestion.svelte`, wire into `GrammarSession.svelte`.
4. Add the unit tests above using 2-3 hand-written placeholder questions (not final content) to
   prove the plumbing end-to-end before content-writing starts.

### Phase 2 — Pilot content

1. Add `kommaregler` to `GrammarTopic` (`types.ts`) and `GRAMMAR_RULES` (`rules.ts`) — Norwegian
   rule text per the sub-points above.
2. Write ~10-12 pilot questions covering 2-3 of the sub-points (start with relative-clause comma
   - list comma, the two most common patterns) to validate the format feels right before writing
     the full set.
3. Add `kommaregler` to the admin `TOPICS` constant and confirm `/grammar/kommaregler` renders and
   grades correctly end-to-end.

### Phase 3 — Full content

1. Write the remaining sub-points (appositive comma, direct-speech comma, conjunction-joining
   comma) — target ~40-50 questions total across all sub-points.
2. Run `check-grammar-norwegian.mjs kommaregler` and the vocab-check script, same as every other
   topic.
3. Confirm Plus gating and topic listing on `/grammar` and `/learn/b2` (and `/learn/c` if any
   sub-points land at C).

## Open questions

- **CEFR split:** should `kommaregler` be one B2/C-spanning topic (like several existing shared
  topics) or two separate topics (`kommaregler` at B2 for the common cases, a harder
  `kommaregler-c` for edge cases)? Lean toward one shared topic unless the C-level source material
  turns out to need noticeably harder distinctions — decide once source content is reviewed.
- **Distractor construction:** for some sub-points (e.g. list commas) it may be hard to write a
  wrong-but-plausible second distractor beyond "no comma at all" vs. "comma in the right place" —
  worth checking during the Phase 2 pilot whether 2 options (a `minimal-pair`-style A/B) reads
  better than 3 for some sub-points, even though the type is technically built for `options.length
=== 3` like `multiple-choice`. If so, `punctuation` may need to accept 2 or 3 options rather than
  always 3.
