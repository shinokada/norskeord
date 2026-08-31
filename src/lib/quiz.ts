import type { VocabEntry, CardProgress, FlashcardLanguage } from '$lib/types';
import { getTranslation } from '$lib/vocab-helpers';

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

// Phase 9 (ai-docs/implementation/quiz-c-monolingual.md): C-level quiz
// questions are monolingual — Norwegian prompt, Norwegian answer, using the
// `definition` field (a Norwegian gloss) instead of `english`. Phase 10
// extends this to B2, on the same reasoning: both are advanced-enough levels
// that an English crutch works against the level's own point.

/** Levels whose quiz questions are ALWAYS monolingual (Norwegian-only)
 *  rather than translation-based, regardless of category. See isQuizable
 *  below for the per-entry exclusion this implies. B1 is deliberately not
 *  included here — B1 can go monolingual too, but only per-category (see
 *  isB1MonolingualEligible below), mirroring the same `hasDefinitions` /
 *  `isDefnorLevel` cutoff VocabFlashcardPage already uses for its `defnor`
 *  mode. See ai-docs/implementation/quiz-i18n-and-categories.md Phase 1. */
const MONOLINGUAL_LEVELS = new Set(['B2', 'C']);

export function isMonolingualLevel(level: string): boolean {
  return MONOLINGUAL_LEVELS.has(level);
}

/**
 * Whether a B1 entry should be quizzed monolingually. True only when the
 * entry itself has a `definition` AND the category it's being quizzed from
 * has at least one entry with a `definition` (the `categoryHasDefinitions`
 * flag buildQuizSession computes from its entry pool) — same two-part check
 * flashcards use before offering `defnor` mode. A B1 entry without a
 * `definition`, or one from a category where no entries have definitions
 * yet, always falls back to translation-based quizzing.
 */
export function isB1MonolingualEligible(
  entry: VocabEntry,
  categoryHasDefinitions: boolean
): boolean {
  return entry.level === 'B1' && categoryHasDefinitions && !!entry.definition;
}

/**
 * Whether an entry can appear in a quiz at all. Every entry qualifies except
 * a monolingual-level entry (B2, C) with no `definition`:
 *   - vocab-c.json: 729/729 have one.
 *   - uttrykk-c.json: ~355/559 have one.
 *   - vocab-b2.json: 1744/1750 have one.
 *   - uttrykk-b2.json: ~416/679 have one.
 * The gaps (mostly in each level's uttrykk deck, written before the
 * monolingual quiz was on the table) stay excluded from quizzes at that
 * level until backfilled, rather than falling back to English for just
 * those and reintroducing the inconsistency this phase removes.
 */
export function isQuizable(entry: VocabEntry): boolean {
  return !isMonolingualLevel(entry.level) || !!entry.definition;
}

// The `?? entry.english` fallbacks in buildMCQuestion/buildFillQuestion/
// buildTypeQuestion below are a type-safety net only (VocabEntry.definition
// is optional), not a real code path — buildQuizSession filters its entry
// pool through isQuizable before any of these run, so a monolingual-level
// entry without a definition should never reach them.

/**
 * Pick `n` distractor entries for a multiple-choice question.
 *
 * Strategy:
 * 1. Same CEFR level, different word and different translation in the
 *    chosen language (or, for a monolingual question, different
 *    `definition` — see isQuizable above).
 * 2. If fewer than `n` remain after step 1, pad from adjacent levels.
 *
 * `monolingual` defaults to the always-monolingual levels (B2/C) but can be
 * passed explicitly — buildQuizSession does this for B1 entries eligible
 * per isB1MonolingualEligible above.
 */
export function getDistractors(
  entry: VocabEntry,
  allEntries: VocabEntry[],
  n = 3,
  monolingual = isMonolingualLevel(entry.level),
  language: FlashcardLanguage = 'english'
): VocabEntry[] {
  // When building distractors for a monolingual question, every candidate
  // (regardless of its own level) needs a `definition` to show as an option —
  // padding in a definition-less entry would render "undefined" as a choice.
  const usable = monolingual ? allEntries.filter((e) => !!e.definition) : allEntries;
  const key = (e: VocabEntry) => (monolingual ? e.definition : getTranslation(e, language));

  const sameLevel = usable.filter(
    (e) => e !== entry && e.level === entry.level && key(e) !== key(entry)
  );

  let pool = shuffle(sameLevel);

  if (pool.length < n) {
    const other = usable.filter(
      (e) => e !== entry && e.level !== entry.level && key(e) !== key(entry)
    );
    pool = [...pool, ...shuffle(other)];
  }

  return pool.slice(0, n);
}

// ── Typed-answer normalisation ───────────────────────────────────────────────

/**
 * Strip a trailing noun-gender article like " (en)", " (et)", " (ei)", or a
 * dual-gender combination like " (en/ei)", and/or a leading infinitive marker
 * "å " from `entry.norsk` for grading purposes. `norsk` itself keeps all of
 * this for display (e.g. "fot (en)", "tann (en/ei)", "å gifte seg") so the
 * dictionary form is still shown in the UI, but requiring the user to type
 * the article or the infinitive marker back on fill/type questions is
 * unnatural — "fot", "tann", and "gifte seg" are the answers a learner would
 * actually type.
 */
export function bareLemma(norsk: string): string {
  return norsk
    .replace(/^å\s+/i, '')
    .replace(/\s*\((en|ei|et)(\s*\/\s*(en|ei|et))*\)\s*$/i, '')
    .trim();
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
 * Default direction: Norwegian → chosen language (show the Norwegian word,
 * pick the translation). Pass `direction: 'engnor'` to reverse. At a
 * monolingual level (B2, C) — or a B1 entry eligible per
 * isB1MonolingualEligible — direction and language are ignored: the
 * question is always Norwegian word → Norwegian definition.
 */
export function buildMCQuestion(
  entry: VocabEntry,
  allEntries: VocabEntry[],
  direction: 'noreng' | 'engnor' = 'noreng',
  language: FlashcardLanguage = 'english',
  monolingualOverride = false
): MultipleChoiceQuestion {
  const monolingual = isMonolingualLevel(entry.level) || monolingualOverride;
  const distractors = getDistractors(entry, allEntries, 3, monolingual, language);
  const translation = getTranslation(entry, language);
  const correct = monolingual
    ? (entry.definition ?? translation)
    : direction === 'noreng'
      ? translation
      : entry.norsk;
  const wrongOptions = distractors.map((d) => {
    const dTranslation = getTranslation(d, language);
    return monolingual
      ? (d.definition ?? dTranslation)
      : direction === 'noreng'
        ? dTranslation
        : d.norsk;
  });
  const options = shuffle([correct, ...wrongOptions]);
  return {
    type: 'mc',
    entry,
    prompt: monolingual ? entry.norsk : direction === 'noreng' ? entry.norsk : translation,
    options,
    correctIndex: options.indexOf(correct)
  };
}

/**
 * Build a fill-in-the-blank question.
 *
 * Replaces the first occurrence of `entry.norsk` in `entry.example` with
 * "________". If the word doesn't appear verbatim (e.g. it is inflected),
 * falls back to a direct prompt — in the chosen language normally, or (at a
 * monolingual level, or a B1 entry eligible per isB1MonolingualEligible) a
 * Norwegian "which word means this definition?" prompt, keeping the
 * monolingual question types consistent with each other.
 */
export function buildFillQuestion(
  entry: VocabEntry,
  language: FlashcardLanguage = 'english',
  monolingualOverride = false
): FillBlankQuestion {
  const blanked = entry.example.replace(entry.norsk, '________');
  const monolingual = isMonolingualLevel(entry.level) || monolingualOverride;
  const sentence = blanked.includes('________')
    ? blanked
    : monolingual
      ? `Hvilket ord betyr: «${entry.definition ?? getTranslation(entry, language)}»?`
      : `Hva er det norske ordet for "${getTranslation(entry, language)}"?`;
  return { type: 'fill', entry, sentence, answer: bareLemma(entry.norsk) };
}

/**
 * Build a type-the-answer question.
 *
 * Shows the translation in the chosen language (or, at a monolingual level,
 * or a B1 entry eligible per isB1MonolingualEligible, the Norwegian
 * definition); the user types the Norwegian word.
 */
export function buildTypeQuestion(
  entry: VocabEntry,
  language: FlashcardLanguage = 'english',
  monolingualOverride = false
): TypeAnswerQuestion {
  const monolingual = isMonolingualLevel(entry.level) || monolingualOverride;
  return {
    type: 'type',
    entry,
    prompt: monolingual
      ? (entry.definition ?? getTranslation(entry, language))
      : getTranslation(entry, language),
    answer: bareLemma(entry.norsk)
  };
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
 *
 * `language` drives A1/A2 (and non-eligible B1) translation-based questions
 * — see getTranslation. Whether each B1 entry instead goes monolingual is
 * decided per-entry via isB1MonolingualEligible, using a `categoryHasDefinitions`
 * flag computed once from `entries` (the already-filtered category/level
 * pool the caller passed in) — mirroring VocabFlashcardPage's `hasDefinitions`
 * check for its `defnor` mode. B2/C entries are unaffected — always
 * monolingual per isMonolingualLevel.
 */
export function buildQuizSession(
  entries: VocabEntry[],
  allEntries: VocabEntry[],
  progressMap: Record<string, CardProgress>,
  count = 10,
  language: FlashcardLanguage = 'english'
): QuizQuestion[] {
  const now = new Date();
  const quizable = entries.filter(isQuizable);
  const categoryHasDefinitions = entries.some((e) => !!e.definition);

  const due = quizable.filter(
    (e) => progressMap[e.norsk] && new Date(progressMap[e.norsk].fsrs.due) <= now
  );
  const newCards = quizable.filter((e) => !progressMap[e.norsk]);

  const pool = [...shuffle(due), ...shuffle(newCards)].slice(0, count);

  return pool.map((entry, i) => {
    const monolingualOverride = isB1MonolingualEligible(entry, categoryHasDefinitions);
    const mod = i % 4;
    if (mod === 0 || mod === 1)
      return buildMCQuestion(entry, allEntries, 'noreng', language, monolingualOverride);
    if (mod === 2) return buildFillQuestion(entry, language, monolingualOverride);
    return buildTypeQuestion(entry, language, monolingualOverride);
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
