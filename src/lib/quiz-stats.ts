import { supabase } from '$lib/supabase';
import { QUIZ_LS_PREFIX, vocabKey } from '$lib/progress';
import type { CEFRLevel, VocabEntry } from '$lib/types';

// Lightweight per-word quiz statistics (ai-docs/implementation/quiz-progress.md, Phase 2).
// Counts only: there is no schedule here. The quiz's FSRS writes still go through
// saveProgress() in progress.ts.
//   - Guest/free users: localStorage under 'quiz-stats-<vocabId>'
//   - Plus users: the quiz_progress Supabase table (one row per user + vocab entry)
// Maps are keyed by vocab id (`vocabKey(entry)`), the same key card_progress uses.

export interface QuizStat {
  attempts: number;
  correct: number;
  /** ISO date string of the most recent answer. */
  lastAttempt: string;
}

export type QuizStatsMap = Record<string, QuizStat>;

interface QuizProgressRow {
  vocab_id: string;
  attempts: number;
  correct: number;
  last_attempt: string;
}

function isQuizStat(value: unknown): value is QuizStat {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.attempts === 'number' &&
    typeof v.correct === 'number' &&
    typeof v.lastAttempt === 'string' &&
    v.attempts >= 0 &&
    v.correct >= 0 &&
    v.correct <= v.attempts
  );
}

/**
 * Loads the quiz stats map. Plus users (userId present) read quiz_progress; guest/free
 * users read localStorage. Never throws: a failed or missing table yields an empty map.
 */
export async function loadQuizStats(userId?: string | null): Promise<QuizStatsMap> {
  const map: QuizStatsMap = {};

  if (userId) {
    try {
      const { data, error } = await supabase
        .from('quiz_progress')
        .select('vocab_id, attempts, correct, last_attempt')
        .eq('user_id', userId);
      if (error || !data) {
        if (error) console.error('loadQuizStats: select failed', error);
        return map;
      }
      for (const row of data as QuizProgressRow[]) {
        map[row.vocab_id] = {
          attempts: row.attempts,
          correct: row.correct,
          lastAttempt: row.last_attempt
        };
      }
    } catch (error) {
      console.error('loadQuizStats: select threw', error);
    }
    return map;
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(QUIZ_LS_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (isQuizStat(parsed)) map[key.slice(QUIZ_LS_PREFIX.length)] = parsed;
    } catch {
      // Ignore malformed entries
    }
  }
  return map;
}

/**
 * Records one quiz answer for `entry` and returns the updated map. The new counts are
 * computed from the in-memory `map` (as saveProgress does with its progress map), so
 * load the map before the first answer of a session.
 *
 * Plus users upsert to quiz_progress; guest/free users write to localStorage. A failed
 * write is logged and the in-memory map is still updated, so the session keeps working.
 */
export async function recordQuizAnswer(
  entry: VocabEntry,
  correct: boolean,
  map: QuizStatsMap,
  userId?: string | null
): Promise<QuizStatsMap> {
  const key = vocabKey(entry);
  const previous = map[key];
  const updated: QuizStat = {
    attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
    lastAttempt: new Date().toISOString()
  };

  if (userId) {
    try {
      const { error } = await supabase.from('quiz_progress').upsert(
        {
          user_id: userId,
          vocab_id: key,
          attempts: updated.attempts,
          correct: updated.correct,
          last_attempt: updated.lastAttempt
        },
        { onConflict: 'user_id,vocab_id' }
      );
      if (error) console.error('recordQuizAnswer: upsert failed', error);
    } catch (error) {
      console.error('recordQuizAnswer: upsert threw', error);
    }
  } else {
    try {
      localStorage.setItem(QUIZ_LS_PREFIX + key, JSON.stringify(updated));
    } catch (error) {
      // Quota or private mode: keep the session working with the in-memory map
      console.error('recordQuizAnswer: localStorage write failed', error);
    }
  }

  return { ...map, [key]: updated };
}

// ── Summary ──────────────────────────────────────────────────────────────────

export interface QuizSummary {
  /** Total questions answered. */
  answered: number;
  /** Questions answered correctly. */
  correct: number;
  /** Distinct words quizzed at least once. */
  words: number;
}

export interface QuizStatsSummary {
  total: QuizSummary;
  byLevel: Record<CEFRLevel, QuizSummary>;
}

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

/** Accuracy is hidden below this many answers, so 1 out of 1 does not read as 100%. */
export const QUIZ_MIN_ANSWERS_FOR_ACCURACY = 10;

/**
 * Accuracy as a whole percentage (correct / answered), or `null` until at least
 * QUIZ_MIN_ANSWERS_FOR_ACCURACY questions have been answered.
 */
export function quizAccuracy(summary: QuizSummary): number | null {
  if (summary.answered < QUIZ_MIN_ANSWERS_FOR_ACCURACY) return null;
  return Math.round((summary.correct / summary.answered) * 100);
}

function emptySummary(): QuizSummary {
  return { answered: 0, correct: 0, words: 0 };
}

/**
 * Totals and a per-level breakdown of a quiz stats map. `resolveLevel` maps a vocab id
 * to its CURRENT level (normally via `resolveEntry` from `$lib/content-lookup`), so
 * entries that moved level stay correct. Ids it cannot resolve (entry removed) are
 * left out of every number. Injected, not imported, so the quiz route does not bundle
 * the id-to-location map.
 */
export function summariseQuizStats(
  map: QuizStatsMap,
  resolveLevel: (id: string) => CEFRLevel | undefined
): QuizStatsSummary {
  const total = emptySummary();
  const byLevel = Object.fromEntries(LEVELS.map((l) => [l, emptySummary()])) as Record<
    CEFRLevel,
    QuizSummary
  >;

  for (const [id, stat] of Object.entries(map)) {
    const level = resolveLevel(id);
    if (!level || !byLevel[level]) continue;
    for (const bucket of [total, byLevel[level]]) {
      bucket.answered += stat.attempts;
      bucket.correct += stat.correct;
      bucket.words += 1;
    }
  }

  return { total, byLevel };
}

// ── Free → Plus migration ───────────────────────────────────────────────────────────────────

/**
 * Copies a free user's local quiz stats into quiz_progress when they upgrade to Plus.
 * Call it before `clearUserProgress()`, which would otherwise delete the local keys
 * (see auth/sync). It is separate from migrateLocalProgressToSupabase because a
 * quiz-only learner has no `progress-` keys, so that function returns early for them.
 *
 * Counts are added to any existing row, since the local answers and the cloud answers
 * are different events. The local keys are removed only after the upsert succeeds, so
 * a failed attempt can be retried and a successful one can never be counted twice.
 * Never throws: a failure is logged and the local stats stay where they are.
 */
export async function migrateLocalQuizStatsToSupabase(userId: string): Promise<void> {
  try {
    const local = await loadQuizStats(null);
    const ids = Object.keys(local);
    if (ids.length === 0) return;

    // Not loadQuizStats(userId): that returns {} on error, and merging onto an empty map
    // would overwrite the cloud counts.
    const { data, error: selectError } = await supabase
      .from('quiz_progress')
      .select('vocab_id, attempts, correct, last_attempt')
      .eq('user_id', userId);
    if (selectError || !data) {
      console.error('migrateLocalQuizStatsToSupabase: select failed', selectError);
      return;
    }
    const remote: Record<string, QuizProgressRow> = {};
    for (const row of data as QuizProgressRow[]) remote[row.vocab_id] = row;

    const rows = ids.map((id) => {
      const l = local[id];
      const r = remote[id];
      const latest =
        r && new Date(r.last_attempt).getTime() > new Date(l.lastAttempt).getTime()
          ? r.last_attempt
          : l.lastAttempt;
      return {
        user_id: userId,
        vocab_id: id,
        attempts: l.attempts + (r?.attempts ?? 0),
        correct: l.correct + (r?.correct ?? 0),
        last_attempt: latest
      };
    });

    const { error } = await supabase
      .from('quiz_progress')
      .upsert(rows, { onConflict: 'user_id,vocab_id' });
    if (error) {
      console.error('migrateLocalQuizStatsToSupabase: upsert failed', error);
      return;
    }

    for (const id of ids) localStorage.removeItem(QUIZ_LS_PREFIX + id);
  } catch (error) {
    console.error('migrateLocalQuizStatsToSupabase: failed', error);
  }
}
