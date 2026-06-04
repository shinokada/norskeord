# Quiz

## How Quizzes Are Created

The quiz system is split across two files: `+page.ts` (data loading) and `$lib/quiz.ts` (question generation logic), with `+page.svelte` orchestrating the UI state machine.

### 1. Data Loading — `+page.ts`

When the route loads, it imports all vocabulary JSON files for levels A1–B2 (including *uttrykk*/phrases) in parallel using dynamic imports. The result is two datasets:

- **`allEntries`** — the full word pool across all levels (used for generating distractors in multiple-choice questions)
- **`entries`** — filtered by optional `?level=` and `?category=` URL params (used as the actual quiz pool)

SSR is disabled (`export const ssr = false`) since quiz progress is loaded from the browser (localStorage or Supabase).

---

### 2. Session Building — `$lib/quiz.ts`

When the user clicks **Start Quiz**, `startQuiz()` calls `buildQuizSession()`, which:

**Prioritises due cards first** using FSRS scheduling — words the user has seen before and whose review date has passed come before unseen (new) words. Both groups are shuffled independently.

**Assigns question types by position** (mod 4 cycle):

| Position mod 4 | Type                    | Description                                        |
| -------------- | ----------------------- | -------------------------------------------------- |
| 0, 1           | Multiple Choice (50%)   | Show Norwegian word → pick the English translation |
| 2              | Fill-in-the-Blank (25%) | Complete the example sentence                      |
| 3              | Type the Answer (25%)   | See English word → type the Norwegian              |

---

### 3. The Three Question Types

**Multiple Choice (`buildMCQuestion`)**
- Shows the Norwegian word as the prompt
- Calls `getDistractors()` to find 3 wrong answers — preferring same CEFR level, falling back to other levels if needed
- Shuffles all 4 options and records the `correctIndex`

**Fill-in-the-Blank (`buildFillQuestion`)**
- Replaces the first occurrence of the Norwegian word in its example sentence with `________`
- Falls back to a generic `"Hva er det norske ordet for 'X'?"` prompt if the exact word form doesn't appear (e.g. it's inflected)

**Type the Answer (`buildTypeQuestion`)**
- Shows the English word, user types the Norwegian
- Accepts answers with up to **1 character edit distance** (Levenshtein) and rates them as `'hard'` rather than wrong

---

### 4. Answer Handling & Progress

After each answer, `submitAnswer()` maps the result to an FSRS rating (`'again'`, `'hard'`, `'good'`, or `'easy'` via "Mark as easy") and calls `saveProgress()`, which updates the next review due date. This is persisted to **localStorage** (free users) or **Supabase** (Plus users).

---

### 5. Quiz State Machine

The page cycles through four states managed by `quizState`:

```
idle → questioning → revealing → (next question or) summary → idle
```

The `idle` state shows the level/category picker. The `summary` state shows per-question results with a score emoji and lets the user immediately configure and restart a new session.