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
 * Rows per request. Supabase caps a response at the project's `max_rows` (1,000 by default,
 * configurable), and a capped response carries no error. fetchQuizProgressRows therefore
 * advances by the number of rows actually returned and stops only on an empty page, so it
 * stays correct even if the project limit is lower than this.
 */
const QUIZ_PAGE_SIZE = 1000;
/** Safety stop against a runaway loop: 100 pages is 100,000 rows at the default limit. */
const QUIZ_MAX_PAGES = 100;

/**
 * Every quiz_progress row of a user, or `null` when any page failed. Never a partial list:
 * callers write absolute counts computed from what this returns, so a truncated list would
 * overwrite the counts of the words it left out. Pages are ordered by vocab_id, which is
 * unique per user, so the ranges do not overlap or skip. Never throws.
 */
async function fetchQuizProgressRows(userId: string): Promise<QuizProgressRow[] | null> {
  const rows: QuizProgressRow[] = [];
  try {
    for (let page = 0; page < QUIZ_MAX_PAGES; page++) {
      const { data, error } = await supabase
        .from('quiz_progress')
        .select('vocab_id, attempts, correct, last_attempt')
        .eq('user_id', userId)
        .order('vocab_id', { ascending: true })
        .range(rows.length, rows.length + QUIZ_PAGE_SIZE - 1);
      if (error || !data) {
        console.error('fetchQuizProgressRows: select failed', error);
        return null;
      }
      if (data.length === 0) return rows;
      rows.push(...(data as QuizProgressRow[]));
    }
    console.error('fetchQuizProgressRows: stopped after the page limit');
    return null;
  } catch (error) {
    console.error('fetchQuizProgressRows: select threw', error);
    return null;
  }
}

function rowsToMap(rows: QuizProgressRow[]): QuizStatsMap {
  const map: QuizStatsMap = {};
  for (const row of rows) {
    map[row.vocab_id] = {
      attempts: row.attempts,
      correct: row.correct,
      lastAttempt: row.last_attempt
    };
  }
  return map;
}

/**
 * Loads the quiz stats map. Plus users (userId present) read quiz_progress; guest/free
 * users read localStorage. Never throws: a failed or missing table yields an empty map.
 */
export async function loadQuizStats(userId?: string | null): Promise<QuizStatsMap> {
  const map: QuizStatsMap = {};

  if (userId) {
    const rows = await fetchQuizProgressRows(userId);
    return rows ? rowsToMap(rows) : map;
  }

  try {
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
  } catch (error) {
    // Blocked or unavailable storage (for example a SecurityError): return what we have
    console.error('loadQuizStats: localStorage unavailable', error);
  }
  return map;
}

/**
 * Like loadQuizStats, but a Plus user's failed select yields `null` instead of an empty
 * map, so a caller that is about to write counts can tell "no history" from "could not
 * load". recordQuizAnswer upserts absolute counts computed from the map it is given: an
 * empty map after a failed load would overwrite the word's cloud counts with 1.
 * Guest/free users always get a map (localStorage reads do not fail this way).
 * Never throws.
 */
export async function loadQuizStatsOrNull(userId?: string | null): Promise<QuizStatsMap | null> {
  if (!userId) return loadQuizStats(null);

  const rows = await fetchQuizProgressRows(userId);
  return rows ? rowsToMap(rows) : null;
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

    // Every remote row, or null on any failure: merging onto an empty or partial view of the
    // cloud counts would overwrite them.
    const remoteRows = await fetchQuizProgressRows(userId);
    if (!remoteRows) {
      console.error('migrateLocalQuizStatsToSupabase: could not load the cloud rows');
      return;
    }
    const remote: Record<string, QuizProgressRow> = {};
    for (const row of remoteRows) remote[row.vocab_id] = row;

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
