import { supabase } from '$lib/supabase';
import { CLOZE_LS_PREFIX, QUIZ_LS_PREFIX, vocabKey } from '$lib/progress';
import type { CEFRLevel, VocabEntry } from '$lib/types';

// Lightweight per-word quiz statistics (ai-docs/implementation/quiz-progress.md, Phase 2).
// Counts only: there is no schedule here. The quiz's FSRS writes still go through
// saveProgress() in progress.ts.
//   - Guest/free users: localStorage under 'quiz-stats-<vocabId>'
//   - Plus users: the quiz_progress Supabase table (one row per user + vocab entry)
// Maps are keyed by vocab id (`vocabKey(entry)`), the same key card_progress uses.
//
// The Sentences (cloze) quiz keeps the same counts in a store of its own
// (ai-docs/implementation/cloze-quiz.md, Phase 3): table cloze_progress and localStorage
// 'cloze-stats-<vocabId>'. Both stores run through the same internal functions, each
// given a `StatsStore`. The exported Words functions are thin wrappers over VOCAB_STORE
// and behave exactly as before; the Sentences ones are wrappers over CLOZE_STORE.

export interface QuizStat {
  attempts: number;
  correct: number;
  /** ISO date string of the most recent answer. */
  lastAttempt: string;
}

export type QuizStatsMap = Record<string, QuizStat>;

/** Sentences stats have the same shape as Words stats. */
export type ClozeStat = QuizStat;
export type ClozeStatsMap = QuizStatsMap;

interface QuizProgressRow {
  vocab_id: string;
  attempts: number;
  correct: number;
  last_attempt: string;
}

/** Where one kind of quiz stats lives: a Supabase table (Plus) and a localStorage prefix. */
interface StatsStore {
  table: 'quiz_progress' | 'cloze_progress';
  lsPrefix: string;
}

const VOCAB_STORE: StatsStore = { table: 'quiz_progress', lsPrefix: QUIZ_LS_PREFIX };
const CLOZE_STORE: StatsStore = { table: 'cloze_progress', lsPrefix: CLOZE_LS_PREFIX };

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
 * configurable), and a capped response carries no error. fetchStatsRows therefore
 * advances by the number of rows actually returned and stops only on an empty page, so it
 * stays correct even if the project limit is lower than this.
 */
const QUIZ_PAGE_SIZE = 1000;
/** Safety stop against a runaway loop: 100 pages is 100,000 rows at the default limit. */
const QUIZ_MAX_PAGES = 100;

/**
 * Every row of a user in the store's table, or `null` when any page failed (including a
 * table that does not exist yet). Never a partial list: callers write absolute counts
 * computed from what this returns, so a truncated list would overwrite the counts of the
 * words it left out. Pages are ordered by vocab_id, which is unique per user, so the
 * ranges do not overlap or skip. Never throws.
 */
async function fetchStatsRows(
  store: StatsStore,
  userId: string
): Promise<QuizProgressRow[] | null> {
  const rows: QuizProgressRow[] = [];
  try {
    for (let page = 0; page < QUIZ_MAX_PAGES; page++) {
      const { data, error } = await supabase
        .from(store.table)
        .select('vocab_id, attempts, correct, last_attempt')
        .eq('user_id', userId)
        .order('vocab_id', { ascending: true })
        .range(rows.length, rows.length + QUIZ_PAGE_SIZE - 1);
      if (error || !data) {
        console.error(`fetchStatsRows: ${store.table} select failed`, error);
        return null;
      }
      if (data.length === 0) return rows;
      rows.push(...(data as QuizProgressRow[]));
    }
    console.error(`fetchStatsRows: ${store.table} stopped after the page limit`);
    return null;
  } catch (error) {
    console.error(`fetchStatsRows: ${store.table} select threw`, error);
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

async function loadStats(store: StatsStore, userId?: string | null): Promise<QuizStatsMap> {
  const map: QuizStatsMap = {};

  if (userId) {
    const rows = await fetchStatsRows(store, userId);
    return rows ? rowsToMap(rows) : map;
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(store.lsPrefix)) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed: unknown = JSON.parse(raw);
        if (isQuizStat(parsed)) map[key.slice(store.lsPrefix.length)] = parsed;
      } catch {
        // Ignore malformed entries
      }
    }
  } catch (error) {
    // Blocked or unavailable storage (for example a SecurityError): return what we have
    console.error('loadStats: localStorage unavailable', error);
  }
  return map;
}

async function loadStatsOrNull(
  store: StatsStore,
  userId?: string | null
): Promise<QuizStatsMap | null> {
  if (!userId) return loadStats(store, null);

  const rows = await fetchStatsRows(store, userId);
  return rows ? rowsToMap(rows) : null;
}

async function recordAnswer(
  store: StatsStore,
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
      const { error } = await supabase.from(store.table).upsert(
        {
          user_id: userId,
          vocab_id: key,
          attempts: updated.attempts,
          correct: updated.correct,
          last_attempt: updated.lastAttempt
        },
        { onConflict: 'user_id,vocab_id' }
      );
      if (error) console.error(`recordAnswer: ${store.table} upsert failed`, error);
    } catch (error) {
      console.error(`recordAnswer: ${store.table} upsert threw`, error);
    }
  } else {
    try {
      localStorage.setItem(store.lsPrefix + key, JSON.stringify(updated));
    } catch (error) {
      // Quota or private mode: keep the session working with the in-memory map
      console.error('recordAnswer: localStorage write failed', error);
    }
  }

  return { ...map, [key]: updated };
}

async function migrateLocalStats(store: StatsStore, userId: string): Promise<void> {
  try {
    const local = await loadStats(store, null);
    const ids = Object.keys(local);
    if (ids.length === 0) return;

    // Every remote row, or null on any failure: merging onto an empty or partial view of the
    // cloud counts would overwrite them.
    const remoteRows = await fetchStatsRows(store, userId);
    if (!remoteRows) {
      console.error(`migrateLocalStats: could not load the ${store.table} rows`);
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
      .from(store.table)
      .upsert(rows, { onConflict: 'user_id,vocab_id' });
    if (error) {
      console.error(`migrateLocalStats: ${store.table} upsert failed`, error);
      return;
    }

    for (const id of ids) localStorage.removeItem(store.lsPrefix + id);
  } catch (error) {
    console.error('migrateLocalStats: failed', error);
  }
}

// ── Words (quiz_progress) ────────────────────────────────────────────────────

/**
 * Loads the quiz stats map. Plus users (userId present) read quiz_progress; guest/free
 * users read localStorage. Never throws: a failed or missing table yields an empty map.
 */
export function loadQuizStats(userId?: string | null): Promise<QuizStatsMap> {
  return loadStats(VOCAB_STORE, userId);
}

/**
 * Like loadQuizStats, but a Plus user's failed select yields `null` instead of an empty
 * map, so a caller that is about to write counts can tell "no history" from "could not
 * load". recordQuizAnswer upserts absolute counts computed from the map it is given: an
 * empty map after a failed load would overwrite the word's cloud counts with 1.
 * Guest/free users always get a map (localStorage reads do not fail this way).
 * Never throws.
 */
export function loadQuizStatsOrNull(userId?: string | null): Promise<QuizStatsMap | null> {
  return loadStatsOrNull(VOCAB_STORE, userId);
}

/**
 * Records one quiz answer for `entry` and returns the updated map. The new counts are
 * computed from the in-memory `map` (as saveProgress does with its progress map), so
 * load the map before the first answer of a session.
 *
 * Plus users upsert to quiz_progress; guest/free users write to localStorage. A failed
 * write is logged and the in-memory map is still updated, so the session keeps working.
 */
export function recordQuizAnswer(
  entry: VocabEntry,
  correct: boolean,
  map: QuizStatsMap,
  userId?: string | null
): Promise<QuizStatsMap> {
  return recordAnswer(VOCAB_STORE, entry, correct, map, userId);
}

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
export function migrateLocalQuizStatsToSupabase(userId: string): Promise<void> {
  return migrateLocalStats(VOCAB_STORE, userId);
}

// ── Sentences (cloze_progress) ───────────────────────────────────────────────

/** Sentences counterpart of loadQuizStats: cloze_progress for Plus, `cloze-stats-` locally. */
export function loadClozeStats(userId?: string | null): Promise<ClozeStatsMap> {
  return loadStats(CLOZE_STORE, userId);
}

/**
 * Sentences counterpart of loadQuizStatsOrNull. A Plus user's failed load (or a
 * cloze_progress table that does not exist yet) gives `null`; the quiz page records a
 * Sentences stat only after a map came back, because the upsert writes absolute counts.
 */
export function loadClozeStatsOrNull(userId?: string | null): Promise<ClozeStatsMap | null> {
  return loadStatsOrNull(CLOZE_STORE, userId);
}

/** Sentences counterpart of recordQuizAnswer. */
export function recordClozeAnswer(
  entry: VocabEntry,
  correct: boolean,
  map: ClozeStatsMap,
  userId?: string | null
): Promise<ClozeStatsMap> {
  return recordAnswer(CLOZE_STORE, entry, correct, map, userId);
}

/**
 * Sentences counterpart of migrateLocalQuizStatsToSupabase: copies `cloze-stats-` keys into
 * cloze_progress on upgrade, adds to existing rows, removes the local keys only after a
 * successful upsert. Never throws.
 */
export function migrateLocalClozeStatsToSupabase(userId: string): Promise<void> {
  return migrateLocalStats(CLOZE_STORE, userId);
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

/** Sentences counterpart of summariseQuizStats; the totals have the same shape. */
export function summariseClozeStats(
  map: ClozeStatsMap,
  resolveLevel: (id: string) => CEFRLevel | undefined
): QuizStatsSummary {
  return summariseQuizStats(map, resolveLevel);
}
