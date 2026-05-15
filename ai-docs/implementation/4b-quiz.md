# Phase 4-B: Quiz Mode

## Status: ✅ Complete

Companion to `monetization-focusd-implementation.md` (Phase 4-B entry).

---

## Overview

Quiz mode is a new learning modality that sits alongside flashcards. Where flashcards ask the user to self-assess recall, quiz mode tests comprehension more rigorously through three question types: multiple choice, fill-in-the-blank, and type-the-answer.

Quiz ratings feed back into FSRS via the existing `saveProgress()`, so quiz activity integrates transparently with the due deck.

Quiz mode is **Plus-only** — it's a second axis of value alongside the due deck and full B1–C2 category access.

---

## Architecture decisions

**Route:** `src/routes/quiz/+page.svelte`

The quiz page is a standalone route, not a variant of `VocabFlashcardPage`. It shares data loading and FSRS wiring but has its own UI state machine and question rendering. This keeps `VocabFlashcardPage` clean and avoids over-parameterising it.

**Entry source:** Same `VocabEntry[]` JSON already loaded for flashcards. No new data files needed. The quiz picks entries from whichever level/category the user selects (using the same category picker used elsewhere, or a dedicated picker on the quiz page).

**FSRS integration:** After each question is answered, call `saveProgress(entry, rating, progressMap, userId)` with a rating derived from the answer outcome:

| Outcome                         | FSRS rating |
| ------------------------------- | ----------- |
| Correct on first attempt        | `good`      |
| Correct after seeing hint       | `hard`      |
| Skipped or timed out            | `again`     |
| Type-the-answer with minor typo | `hard`      |

No `easy` rating is issued automatically — the user can tap Easy to override after seeing the result if they felt it was trivial.

**Session size:** 10 questions per session (configurable later). Built from due cards first (matching the flashcard due deck logic), then new cards, capped at 10 total.

---

## Question types

### 4-B-1: Multiple choice

Show the Norwegian word (or English, depending on direction). Display 4 options — 1 correct translation, 3 distractors.

**Distractor selection** — `getDistractors(entry, allEntries, n = 3)`:

1. Filter `allEntries` to the same CEFR level as `entry` (e.g. all B1 entries).
2. Exclude `entry` itself and any entry whose `english` exactly matches `entry.english`.
3. Shuffle and take the first `n`. If the same level has fewer than `n` remaining entries, fall back to the adjacent level (B1 → B2, then A2).
4. Shuffle the final 4 options so the correct answer isn't always in the same position.

**Display:**

```
┌─────────────────────────────────┐
│  What does this mean?           │
│                                 │
│  å jobbe                        │  ← Norwegian word (large)
│                                 │
│  A  to travel                   │
│  B  to work          ← correct  │
│  C  to study                    │
│  D  to eat                      │
└─────────────────────────────────┘
```

After selection: highlight correct in green, selected-wrong in red, show example sentence.

**Keyboard:** `A` / `B` / `C` / `D` to select.

---

### 4-B-2: Fill-in-the-blank

Show an example sentence with the target word blanked out. The user types the Norwegian word.

```
Complete the sentence:

"Jeg ________ på kontoret hver dag."

[ jobbe          ] ← input field
```

Reveal on Enter. Accept minor spelling variants (one character off) using Levenshtein distance ≤ 1 as `hard`, exact match as `good`, otherwise `again` with a "try again" before showing the answer.

**Direction:** Always Norwegian fill-in (type the Norwegian word), regardless of flashcard mode. This is an active recall task; passive recognition is covered by multiple choice.

---

### 4-B-3: Type-the-answer

Show the English word, user types the full Norwegian translation.

```
Type the Norwegian word for:

"to work"

[ å jobbe        ] ← input field
```

Same Levenshtein tolerance as fill-in-the-blank. After answering, show the correct Norwegian, the example sentence with audio via `SpeakButton`.

---

## Quiz session state machine

```
idle
  → [Start quiz] → building
building
  → entries loaded, questions generated → questioning
questioning
  → [answer submitted] → revealing
revealing
  → [Next] or [auto-advance after 2s] → questioning (if questions remain)
            → [last question answered] → summary
summary
  → [Restart] → building
  → [Back to flashcards] → (navigate away)
```

State lives entirely in the `+page.svelte` component. No server state needed beyond what `parent()` provides (user, plan).

---

## Implementation steps

### Step 1 — `src/lib/quiz.ts` + `src/lib/quiz.test.ts` (~30 min) ✅ Done

Create `src/lib/quiz.ts` — pure logic, no Svelte, no `$app` imports:

```ts
import type { VocabEntry } from '$lib/types';

/**
 * Pick `n` distractor entries for a multiple-choice question.
 * Tries same CEFR level first, falls back to adjacent levels if needed.
 */
export function getDistractors(entry: VocabEntry, allEntries: VocabEntry[], n = 3): VocabEntry[] {
  const sameLevel = allEntries.filter(
    (e) => e !== entry && e.level === entry.level && e.english !== entry.english
  );

  let pool = shuffle(sameLevel);

  if (pool.length < n) {
    // Fall back to other levels
    const other = allEntries.filter(
      (e) => e !== entry && e.level !== entry.level && e.english !== entry.english
    );
    pool = [...pool, ...shuffle(other)];
  }

  return pool.slice(0, n);
}

/**
 * Build a multiple-choice question for `entry`.
 * Returns the 4 options in shuffled order and the correct index.
 */
export interface MultipleChoiceQuestion {
  type: 'mc';
  entry: VocabEntry;
  prompt: string; // what to display as the question word/phrase
  options: string[]; // 4 English translations, shuffled
  correctIndex: number;
}

export function buildMCQuestion(
  entry: VocabEntry,
  allEntries: VocabEntry[],
  direction: 'noreng' | 'engnor' = 'noreng'
): MultipleChoiceQuestion {
  const distractors = getDistractors(entry, allEntries, 3);
  const correct = direction === 'noreng' ? entry.english : entry.norsk;
  const wrongOptions = distractors.map((d) => (direction === 'noreng' ? d.english : d.norsk));
  const options = shuffle([correct, ...wrongOptions]);
  return {
    type: 'mc',
    entry,
    prompt: direction === 'noreng' ? entry.norsk : entry.english,
    options,
    correctIndex: options.indexOf(correct)
  };
}

export interface FillBlankQuestion {
  type: 'fill';
  entry: VocabEntry;
  sentence: string; // example sentence with the target word replaced by "________"
  answer: string; // correct Norwegian word
}

export function buildFillQuestion(entry: VocabEntry): FillBlankQuestion {
  const blanked = entry.example.replace(entry.norsk, '________');
  // If the word doesn't appear verbatim in the example, fall back to a simpler prompt
  const sentence = blanked.includes('________')
    ? blanked
    : `Hva er det norske ordet for "${entry.english}"?`;
  return { type: 'fill', entry, sentence, answer: entry.norsk };
}

export interface TypeAnswerQuestion {
  type: 'type';
  entry: VocabEntry;
  prompt: string; // English word/phrase
  answer: string; // correct Norwegian
}

export function buildTypeQuestion(entry: VocabEntry): TypeAnswerQuestion {
  return { type: 'type', entry, prompt: entry.english, answer: entry.norsk };
}

export type QuizQuestion = MultipleChoiceQuestion | FillBlankQuestion | TypeAnswerQuestion;

/**
 * Build a mixed session of `count` questions from `entries`.
 * Distribution: ~50% MC, ~25% fill-in-the-blank, ~25% type-the-answer.
 * Due cards (overdue FSRS) come first.
 */
export function buildQuizSession(
  entries: VocabEntry[],
  allEntries: VocabEntry[],
  progressMap: Record<string, import('$lib/types').CardProgress>,
  count = 10
): QuizQuestion[] {
  const now = new Date();
  const due = entries.filter(
    (e) => progressMap[e.norsk] && new Date(progressMap[e.norsk].fsrs.due) <= now
  );
  const newCards = entries.filter((e) => !progressMap[e.norsk]);

  const pool = [...shuffle(due), ...shuffle(newCards)].slice(0, count);

  return pool.map((entry, i) => {
    const mod = i % 4;
    if (mod === 0 || mod === 1) return buildMCQuestion(entry, allEntries);
    if (mod === 2) return buildFillQuestion(entry);
    return buildTypeQuestion(entry);
  });
}

/** Levenshtein distance for typo tolerance. */
export function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

See the [Testing section](#testing) below for unit test coverage targets. `quiz.test.ts` is created alongside `quiz.ts` in this step.

---

### Step 2 — Route `src/routes/quiz/+page.ts` (~20 min) ✅ Done

```ts
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { VocabEntry } from '$lib/types';

// Load all levels so the distractor pool is wide enough
export const ssr = false;

export const load: PageLoad = async ({ url, parent }) => {
  const { plan } = await parent();

  // Quiz mode is Plus-only
  if (plan !== 'plus') {
    redirect(302, '/plus?ref=quiz-gate');
  }

  // Optional ?level= and ?category= params to pre-filter entries
  const level = url.searchParams.get('level')?.toLowerCase();
  const category = url.searchParams.get('category');

  // Load all vocab levels for the distractor pool
  const [a1, a2, b1, b2] = await Promise.all([
    import('$lib/data/vocab-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
    import('$lib/data/vocab-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
    import('$lib/data/vocab-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
    import('$lib/data/vocab-b2.json') as unknown as Promise<{ default: VocabEntry[] }>
  ]);

  const allEntries: VocabEntry[] = [...a1.default, ...a2.default, ...b1.default, ...b2.default];

  // Quiz entries: apply level/category filter if provided
  let entries = allEntries;
  if (level) entries = entries.filter((e) => e.level.toLowerCase() === level);
  if (category) entries = entries.filter((e) => e.category === category);

  return { entries, allEntries, level, category };
};
```

---

### Step 3 — `src/routes/quiz/+page.svelte` (~3h) ✅ Done

High-level structure — implement in this order:

**3-a: Imports and props**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import SpeakButton from '$lib/SpeakButton.svelte';
  import {
    buildQuizSession,
    levenshtein,
    type QuizQuestion,
    type MultipleChoiceQuestion,
    type FillBlankQuestion,
    type TypeAnswerQuestion
  } from '$lib/quiz';
  import { loadProgressMap, saveProgress, countDueToday } from '$lib/progress';
  import type { FSRSRating, CardProgress } from '$lib/types';

  let { data } = $props();

  type QuizState = 'idle' | 'questioning' | 'revealing' | 'summary';

  let state = $state<QuizState>('idle');
  let questions = $state<QuizQuestion[]>([]);
  let currentIndex = $state(0);
  let selectedOption = $state<number | null>(null); // for MC
  let typedAnswer = $state(''); // for fill / type
  let isCorrect = $state<boolean | null>(null);
  let progressMap = $state<Record<string, CardProgress>>({});
  let correctCount = $state(0);
  let userId = $derived(page.data.user?.id ?? null);
  let isPlus = $derived(page.data.plan === 'plus');

  let current = $derived(questions[currentIndex]);

  onMount(() => {
    progressMap = loadProgressMap();
  });
  // ...
</script>
```

**3-b: `startQuiz()` function**

```ts
function startQuiz() {
  questions = buildQuizSession(data.entries, data.allEntries, progressMap, 10);
  currentIndex = 0;
  correctCount = 0;
  selectedOption = null;
  typedAnswer = '';
  isCorrect = null;
  state = 'questioning';
}
```

**3-c: `submitAnswer()` function**

Handles all three question types. Determines rating, calls `saveProgress`, advances state.

```ts
function submitAnswer(userAnswer: string | number) {
  if (!current || state !== 'questioning') return;

  let rating: FSRSRating;
  let correct = false;

  if (current.type === 'mc') {
    const q = current as MultipleChoiceQuestion;
    correct = userAnswer === q.correctIndex;
    selectedOption = userAnswer as number;
    rating = correct ? 'good' : 'again';
  } else {
    // fill or type
    const q = current as FillBlankQuestion | TypeAnswerQuestion;
    const normalised = (userAnswer as string).trim().toLowerCase();
    const expected = q.answer.toLowerCase();
    const dist = levenshtein(normalised, expected);
    if (dist === 0) {
      correct = true;
      rating = 'good';
    } else if (dist <= 1) {
      correct = true; // near-correct counts as correct
      rating = 'hard';
    } else {
      correct = false;
      rating = 'again';
    }
    typedAnswer = userAnswer as string;
  }

  if (correct) correctCount++;
  isCorrect = correct;
  progressMap = saveProgress(current.entry, rating, progressMap, isPlus ? userId : null);
  state = 'revealing';
}
```

**3-d: `nextQuestion()` function**

```ts
function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    selectedOption = null;
    typedAnswer = '';
    isCorrect = null;
    state = 'questioning';
  } else {
    state = 'summary';
  }
}
```

**3-e: Template structure**

```svelte
{#if state === 'idle'}
  <!-- Picker: level/category selector + Start button -->
{:else if state === 'questioning'}
  <!-- Progress bar: {currentIndex + 1} / {questions.length} -->
  <!-- Question card based on current.type -->
  {#if current.type === 'mc'}
    <!-- MultipleChoiceCard -->
  {:else if current.type === 'fill'}
    <!-- FillBlankCard -->
  {:else}
    <!-- TypeAnswerCard -->
  {/if}
{:else if state === 'revealing'}
  <!-- Show correct/incorrect feedback + example sentence + SpeakButton -->
  <!-- Next button -->
{:else if state === 'summary'}
  <!-- Score: {correctCount} / {questions.length} -->
  <!-- Per-card result list -->
  <!-- Restart + Back to flashcards buttons -->
{/if}
```

**3-f: Keyboard shortcuts**

| Key                   | Action                                  |
| --------------------- | --------------------------------------- |
| `A` / `B` / `C` / `D` | Select MC option (questioning)          |
| `Enter`               | Submit typed answer / advance to next   |
| `Space`               | Advance from revealing to next question |
| `R`                   | Restart quiz from summary               |

---

### Step 4 — Plus gate + Nav link (~20 min) ✅ Done

The `+page.ts` already redirects free users to `/plus?ref=quiz-gate`. No additional gate needed in the template. Add a "Quiz" link in the Nav for Plus users.

In `src/routes/components/Nav.svelte`, add to the authenticated + Plus nav items:

```svelte
{#if isPlus}
  <a href="/quiz">{m.nav_quiz()}</a>
{/if}
```

---

### Step 5 — i18n keys (~20 min) ✅ Done

Add to `messages/en.json`:

```json
"nav_quiz": "Quiz",
"quiz_title": "Quiz",
"quiz_start": "Start quiz",
"quiz_restart": "Try again",
"quiz_next": "Next",
"quiz_skip": "Skip",
"quiz_score": "{correct} of {total} correct",
"quiz_session_done": "Session complete!",
"quiz_back_to_flashcards": "← Back to flashcards",
"quiz_question_count": "Question {current} of {total}",
"quiz_mc_prompt": "What does this mean?",
"quiz_fill_prompt": "Complete the sentence:",
"quiz_type_prompt": "Type the Norwegian word for:",
"quiz_correct": "Correct!",
"quiz_incorrect": "Not quite.",
"quiz_correct_answer": "Correct answer:",
"quiz_override_easy": "Mark as easy",
"quiz_plus_heading": "Quiz mode is a Plus feature",
"quiz_plus_body": "Quiz mode tests your vocabulary with multiple choice, fill-in-the-blank, and typed answers. Ratings feed back into your smart review schedule.",
"quiz_plus_cta": "Upgrade to Plus →",
"quiz_select_level": "Select a level",
"quiz_select_category": "Select a category (optional)",
"quiz_all_categories": "All categories"
```

Add Norwegian translations to `messages/nb.json` for all new keys.

---

### Step 6 — `/plus` page update (~20 min) ✅ Done

Added quiz mode to the Plus features section of `src/routes/plus/+page.svelte`:

- Added a row to the Free vs Plus table: `"Quiz mode" | — | Included`
- Added a feature card: "Quiz yourself, not just flip" (MC, fill-in-the-blank, typed answers — all feeding the review schedule)

New keys added to both `messages/en.json` and `messages/nb.json`:

```json
"plus_row_quiz": "Quiz mode",
"plus_row_quiz_free": "—",
"plus_row_quiz_plus": "Included",
"plus_feature_5_title": "Quiz yourself, not just flip",
"plus_feature_5_body": "Multiple choice, fill-in-the-blank, and typed-answer questions mix active recall into your study sessions. Every answer updates your smart review schedule."
```

---

### Step 7 — `e2e/quiz.test.ts` (~45 min) ✅ Done

Written at `e2e/quiz.test.ts`. See the [Testing section](#testing) below.

---

## Testing

### Unit tests — `src/lib/quiz.test.ts`

`quiz.ts` is pure logic with no Svelte or `$app` imports, so it runs in the `server` vitest project with no mocking overhead. Tests are written alongside the implementation in Step 1 and are already complete.

**Coverage targets:**

| Function            | What to cover                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `levenshtein`       | identical (0), single sub/insert/delete (1), longer differences, empty strings, symmetry, Norwegian characters (ø, å, æ)                  |
| `getDistractors`    | returns exactly n, never includes target, never duplicates english, prefers same level, falls back when pool is small, output is shuffled |
| `buildMCQuestion`   | type 'mc', 4 options, correct present, `correctIndex` accurate, both directions, options unique, correct position is shuffled             |
| `buildFillQuestion` | type 'fill', answer is `entry.norsk`, blanks verbatim match, fallback prompt on inflected forms                                           |
| `buildTypeQuestion` | type 'type', prompt is english, answer is norsk                                                                                           |
| `buildQuizSession`  | respects count, handles pool smaller than count, valid types, 50/25/25 distribution, due before new, future-due cards excluded, empty []  |

`quiz.test.ts` is created alongside `quiz.ts` in Step 1 and covers all of the above (37 tests).

---

### E2E tests — `e2e/quiz.test.ts` (Step 7) ✅ Done

Written at `e2e/quiz.test.ts`. Uses the same Playwright setup as `e2e/flashcard.test.ts`. The Plus plan is injected by intercepting SvelteKit's `__data.json` response and patching the `plan` field.

**Tests implemented:**

| Test                   | What it verifies                                        |
| ---------------------- | ------------------------------------------------------- |
| Gate — free redirect   | `/quiz` → `/plus` for unauthenticated users             |
| Gate — Plus access     | Plus user sees start screen                             |
| Full session           | Complete 10-question session reaches summary with score |
| FSRS write             | Answering writes a `progress-*` key to localStorage     |
| Keyboard A             | Pressing `a` selects first MC option                    |
| Keyboard Space         | Space advances from reveal to next question             |
| Restart                | "Try again" from summary returns to question 1          |
| Plus page table        | `/plus` comparison table includes "Quiz mode" row       |
| Plus page feature card | `/plus` feature cards include quiz copy                 |

---

## Files created / modified

```
src/lib/quiz.ts                          — distractor helper, question builders, session builder ✅
src/lib/quiz.test.ts                     — unit tests for quiz.ts ✅
src/routes/quiz/+page.ts                 — load (Plus gate + data) ✅
src/routes/quiz/+page.svelte             — quiz UI ✅
e2e/quiz.test.ts                         — Playwright e2e tests ✅
```

```
src/routes/components/Nav.svelte         — Quiz link for Plus users ✅
src/routes/plus/+page.svelte             — quiz row + feature card ✅
messages/en.json                         — all new i18n keys ✅
messages/nb.json                         — Norwegian translations ✅
```

---

## Implementation order and effort

| Step | Task                                              | Effort | Status  |
| ---- | ------------------------------------------------- | ------ | ------- |
| 1    | `src/lib/quiz.ts` + `quiz.test.ts` (unit tests)   | 30 min | ✅ Done |
| 2    | `src/routes/quiz/+page.ts` (load + Plus gate)     | 20 min | ✅ Done |
| 3    | `src/routes/quiz/+page.svelte` (UI state machine) | 3h     | ✅ Done |
| 4    | Nav link for Plus users                           | 20 min | ✅ Done |
| 5    | i18n keys (en + nb)                               | 20 min | ✅ Done |
| 6    | `/plus` page quiz row + feature card              | 20 min | ✅ Done |
| 7    | `e2e/quiz.test.ts` (Playwright)                   | 45 min | ✅ Done |

**Total:** ~5.25h

---

## Open decisions

1. **Session size:** 10 is the default. Should this be configurable (5 / 10 / 20) in the idle/picker state? Probably yes once the feature is live. Leave hardcoded at 10 for the initial build.

2. **Quiz direction:** Fill-in-the-blank and type-the-answer always ask the user to produce Norwegian. Multiple choice could go either direction. The initial build does MC in Norwegian→English (easier, good warm-up). Reverse (English→Norwegian MC) can be a toggle later.

3. **Auto-advance on correct:** After a correct MC answer, auto-advance after 1.5 seconds (highlight green, show example briefly). On incorrect, stay on reveal until Next is tapped. This feels responsive without being jarring. Disable auto-advance if the user has tapped "Slow down" in Profile preferences (future).

4. **`easy` override:** After revealing a correct answer, show a small "Mark as easy" button to issue an `easy` rating instead of `good`. This is a one-tap override for words the user finds trivial. Worth including in the initial build.

5. **C1/C2 in distractor pool:** The current plan loads A1–B2 for the distractor pool. C1/C2 data is available but adds loading weight. Omit from the initial build; add later if B2+ quiz users request it.
