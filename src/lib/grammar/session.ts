import type { CardProgress, FSRSRating, GrammarQuestion } from '$lib/types';

/**
 * Normalises an answer for flexible matching: lowercase, strip punctuation,
 * collapse whitespace. Used for both the grammar answer and the user's input
 * so comparisons ignore casing, trailing periods, and double spaces.
 */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:"«»'']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Same as normalizeAnswer but keeps punctuation — used for 'punctuation' questions,
 * where the punctuation is the thing being tested and must not be erased before
 * comparing.
 */
export function normalizeAnswerKeepPunctuation(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Grades a typed answer against a grammar question by exact (normalised)
 * match against `answer`/`alternates` only — no typo tolerance.
 *
 * Norwegian grammar topics are unusually dense with minimal pairs that
 * differ by exactly one character (hjem/hjemme, sønner/sonner, one comma,
 * etc.) — for these, a 1-edit "typo" allowance ends up accepting the wrong
 * grammatical form about as often as it forgives a genuine slip, which
 * defeats the point of the question. Exact match avoids that, at the cost
 * of occasionally dinging a real typo on a long word.
 *
 * multiple-choice questions need no special handling here: the UI passes the
 * full text of the tapped option (see MultipleChoiceQuestion.svelte), which is
 * matched against `answer` the same way as every other type — `answer` must be
 * one of the option strings verbatim.
 *
 * 'punctuation' questions keep punctuation in the comparison (see
 * normalizeAnswerKeepPunctuation) since punctuation is the thing being
 * tested there.
 */
export function gradeGrammarAnswer(
  input: string,
  question: GrammarQuestion
): { correct: boolean; rating: FSRSRating } {
  const normalize =
    question.type === 'punctuation' ? normalizeAnswerKeepPunctuation : normalizeAnswer;

  const norm = normalize(input);
  if (!norm) return { correct: false, rating: 'again' };

  const candidates = [question.answer, ...(question.alternates ?? [])].map(normalize);
  return candidates.includes(norm)
    ? { correct: true, rating: 'good' }
    : { correct: false, rating: 'again' };
}

/** Fisher–Yates shuffle (returns a new array). */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds a grammar practice session. Questions that are new or most overdue
 * (per FSRS due date) are prioritised, then the selected set is shuffled so the
 * order varies between sessions.
 *
 * Ties (same due timestamp, e.g. all-new cards) are broken randomly by
 * shuffling the pool before sorting. This ensures questions from all difficulty
 * levels appear proportionally rather than always picking the first N in
 * array order.
 */
export function buildGrammarSession(
  questions: GrammarQuestion[],
  progressMap: Record<string, CardProgress>,
  count = 10
): GrammarQuestion[] {
  // Shuffle first so ties in due-date are broken randomly.
  const scored = shuffle(questions).map((q) => {
    const p = progressMap[q.id];
    // New cards (no progress) score 0 → treated as maximally due.
    const due = p ? new Date(p.fsrs.due).getTime() : 0;
    return { q, due };
  });
  scored.sort((a, b) => a.due - b.due);
  const selected = scored.slice(0, count).map((s) => s.q);
  return shuffle(selected);
}

/**
 * Shuffles the tokens of an 'order' question for display, ensuring the shuffled
 * order differs from the answer when possible.
 */
export function shuffleTokens(tokens: string[]): string[] {
  if (tokens.length < 2) return [...tokens];
  const original = tokens.join(' ');
  let out = shuffle(tokens);
  let tries = 0;
  while (out.join(' ') === original && tries < 5) {
    out = shuffle(tokens);
    tries++;
  }
  return out;
}
