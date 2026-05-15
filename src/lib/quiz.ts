import type { VocabEntry, CardProgress } from '$lib/types';

// ── Shuffle ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Distractors ───────────────────────────────────────────────────────────────

/**
 * Pick `n` distractor entries for a multiple-choice question.
 *
 * Strategy:
 * 1. Same CEFR level, different word and different English translation.
 * 2. If fewer than `n` remain after step 1, pad from adjacent levels.
 */
export function getDistractors(entry: VocabEntry, allEntries: VocabEntry[], n = 3): VocabEntry[] {
  const sameLevel = allEntries.filter(
    (e) => e !== entry && e.level === entry.level && e.english !== entry.english
  );

  let pool = shuffle(sameLevel);

  if (pool.length < n) {
    const other = allEntries.filter(
      (e) => e !== entry && e.level !== entry.level && e.english !== entry.english
    );
    pool = [...pool, ...shuffle(other)];
  }

  return pool.slice(0, n);
}

// ── Question types ────────────────────────────────────────────────────────────

export interface MultipleChoiceQuestion {
  type: 'mc';
  entry: VocabEntry;
  /** The word or phrase shown as the question prompt. */
  prompt: string;
  /** Four answer options in shuffled order. */
  options: string[];
  /** Index into `options` that is the correct answer. */
  correctIndex: number;
}

export interface FillBlankQuestion {
  type: 'fill';
  entry: VocabEntry;
  /** Example sentence with the target Norwegian word replaced by "________". */
  sentence: string;
  /** The exact Norwegian word expected. */
  answer: string;
}

export interface TypeAnswerQuestion {
  type: 'type';
  entry: VocabEntry;
  /** English prompt shown to the user. */
  prompt: string;
  /** The exact Norwegian word expected. */
  answer: string;
}

export type QuizQuestion = MultipleChoiceQuestion | FillBlankQuestion | TypeAnswerQuestion;

// ── Question builders ─────────────────────────────────────────────────────────

/**
 * Build a multiple-choice question.
 *
 * Default direction: Norwegian → English (show the Norwegian word, pick the
 * English translation). Pass `direction: 'engnor'` to reverse.
 */
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

/**
 * Build a fill-in-the-blank question.
 *
 * Replaces the first occurrence of `entry.norsk` in `entry.example` with
 * "________". If the word doesn't appear verbatim (e.g. it is inflected),
 * falls back to a direct "What is the Norwegian word for X?" prompt.
 */
export function buildFillQuestion(entry: VocabEntry): FillBlankQuestion {
  const blanked = entry.example.replace(entry.norsk, '________');
  const sentence = blanked.includes('________')
    ? blanked
    : `Hva er det norske ordet for "${entry.english}"?`;
  return { type: 'fill', entry, sentence, answer: entry.norsk };
}

/**
 * Build a type-the-answer question.
 *
 * Shows the English word; the user types the Norwegian translation.
 */
export function buildTypeQuestion(entry: VocabEntry): TypeAnswerQuestion {
  return { type: 'type', entry, prompt: entry.english, answer: entry.norsk };
}

// ── Session builder ───────────────────────────────────────────────────────────

/**
 * Build a mixed quiz session of `count` questions from `entries`.
 *
 * Due cards (overdue FSRS) come first so the session integrates with the
 * existing review schedule. New (unseen) cards fill the remainder.
 *
 * Question type distribution (by position mod 4):
 *   0, 1 → multiple choice  (50 %)
 *   2    → fill-in-the-blank (25 %)
 *   3    → type-the-answer   (25 %)
 */
export function buildQuizSession(
  entries: VocabEntry[],
  allEntries: VocabEntry[],
  progressMap: Record<string, CardProgress>,
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

// ── Typo tolerance ────────────────────────────────────────────────────────────

/**
 * Levenshtein edit distance between two strings.
 *
 * Used by the quiz UI to accept answers that are off by at most one character
 * (rating: 'hard') while still counting them as correct.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Allocate two rows instead of the full (m+1)×(n+1) matrix.
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}
