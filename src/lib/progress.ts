import { FSRS, createEmptyCard, Rating, generatorParameters } from 'ts-fsrs';
import type { Grade, FSRSParameters } from 'ts-fsrs';
import type { FSRSRating, CardProgress } from '$lib/types';
import type { VocabEntry, GrammarQuestion } from '$lib/types';
import { supabase } from '$lib/supabase';

const DEFAULT_FSRS = new FSRS(generatorParameters());

// Per-user FSRS instance cache. Keyed by userId, rebuilt when weights change.
const fsrsCache = new Map<string, FSRS>();

/**
 * Returns an FSRS instance using the user's personal weights if available,
 * falling back to default weights. Cached in memory for the session.
 */
export async function getFsrs(userId?: string | null): Promise<FSRS> {
  if (!userId) return DEFAULT_FSRS;
  if (fsrsCache.has(userId)) return fsrsCache.get(userId)!;
  const weights = await loadFsrsWeights(userId);
  if (weights) {
    const params: Partial<FSRSParameters> = { w: weights as FSRSParameters['w'] };
    const instance = new FSRS(generatorParameters(params));
    fsrsCache.set(userId, instance);
    return instance;
  }
  fsrsCache.set(userId, DEFAULT_FSRS);
  return DEFAULT_FSRS;
}

/** Call after optimisation completes to force a fresh FSRS instance next rating. */
export function invalidateFsrsCache(userId: string) {
  fsrsCache.delete(userId);
}

export const LS_PREFIX = 'progress-';

/**
 * localStorage prefix for grammar FSRS state (guest/free users).
 * Kept distinct from LS_PREFIX so the vocab loaders never pick up grammar keys.
 * Plus users persist grammar progress to the grammar_progress table instead.
 */
export const GRAMMAR_LS_PREFIX = 'grammar-';

/**
 * Removes all progress keys for guest/free users from localStorage.
 * Called on logout so the next person who opens the browser sees no progress.
 */
export function clearUserProgress(): void {
  // Guest/free users store vocab keys as 'progress-<vocabId|norsk>' and grammar
  // keys as 'grammar-<questionId>'. (Plus users no longer use localStorage at all.)
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PREFIX) || key?.startsWith(GRAMMAR_LS_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

const RATING_MAP: Record<FSRSRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy
};

// ── Stable key helper ────────────────────────────────────────────────────────

/**
 * Returns the stable key for a vocab entry: entry.id when present (post-migration
 * entries), falling back to entry.norsk for any entry that pre-dates the id
 * migration. Both guest/free localStorage and the in-memory progressMap use
 * this key so lookups are consistent regardless of which path wrote the data.
 */
export function vocabKey(entry: VocabEntry): string {
  return entry.id ?? entry.norsk;
}

// ── Local storage (guest / free users only) ──────────────────────────────────

/**
 * Loads the progress map from localStorage.
 * Only used for guest and free users. Plus users call loadProgressMapFromSupabase.
 */
export function loadProgressMap(): Record<string, CardProgress> {
  const map: Record<string, CardProgress> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as CardProgress;
          parsed.fsrs.due = new Date(parsed.fsrs.due);
          if (parsed.fsrs.last_review) {
            parsed.fsrs.last_review = new Date(parsed.fsrs.last_review);
          }
          map[key.slice(LS_PREFIX.length)] = parsed;
        }
      } catch {
        // Ignore malformed entries
      }
    }
  }
  return map;
}

// ── Supabase row shape ───────────────────────────────────────────────────────

interface ProgressRow {
  // vocab_id is the stable lookup key (entry.id ?? entry.norsk).
  // NOT NULL — migration 016 added it as NOT NULL with a unique constraint.
  vocab_id: string;
  // norsk is kept until migration 017 drops the column. Written on every upsert
  // so old code (if rolled back) can still read it.
  norsk: string;
  level: string;
  category: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  seen_count: number;
  last_seen: string;
}

function toRow(entry: VocabEntry, p: CardProgress): Omit<ProgressRow, never> {
  return {
    vocab_id: entry.id ?? entry.norsk, // stable key; falls back to norsk for old entries
    norsk: entry.norsk, // kept until migration 017 drops the column
    level: p.level,
    category: p.category,
    due: p.fsrs.due instanceof Date ? p.fsrs.due.toISOString() : String(p.fsrs.due),
    stability: p.fsrs.stability,
    difficulty: p.fsrs.difficulty,
    elapsed_days: p.fsrs.elapsed_days,
    scheduled_days: p.fsrs.scheduled_days,
    learning_steps: p.fsrs.learning_steps,
    reps: p.fsrs.reps,
    lapses: p.fsrs.lapses,
    state: p.fsrs.state,
    last_review: p.fsrs.last_review
      ? p.fsrs.last_review instanceof Date
        ? p.fsrs.last_review.toISOString()
        : String(p.fsrs.last_review)
      : null,
    seen_count: p.seenCount,
    last_seen: p.lastSeen
  };
}

function fromRow(row: ProgressRow): CardProgress {
  return {
    fsrs: {
      due: new Date(row.due),
      stability: row.stability,
      difficulty: row.difficulty,
      elapsed_days: row.elapsed_days,
      scheduled_days: row.scheduled_days,
      learning_steps: row.learning_steps,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state,
      last_review: row.last_review ? new Date(row.last_review) : undefined
    },
    seenCount: row.seen_count,
    lastSeen: row.last_seen,
    level: row.level as CardProgress['level'],
    category: row.category as CardProgress['category']
  };
}

// ── Row key: what we use to key the in-memory map from a DB row ──────────────

/**
 * Derives the in-memory map key from a Supabase row.
 * Always uses vocab_id (NOT NULL since migration 016).
 * norsk fallback kept only for safety during the migration 016→017 window.
 */
function rowKey(row: ProgressRow): string {
  return row.vocab_id || row.norsk;
}

// ── Supabase — Plus users ────────────────────────────────────────────────────

/**
 * Fetches all card_progress rows for a Plus user and returns them as a
 * CardProgress map keyed by vocab_id (or norsk for legacy rows).
 * Called on mount for Plus users instead of loadProgressMap.
 */
export async function loadProgressMapFromSupabase(
  userId: string
): Promise<Record<string, CardProgress>> {
  const { data, error } = await supabase.from('card_progress').select('*').eq('user_id', userId);

  if (error || !data) return {};

  const map: Record<string, CardProgress> = {};
  for (const row of data as ProgressRow[]) {
    map[rowKey(row)] = fromRow(row);
  }
  return map;
}

/**
 * Upserts a single card_progress row for a Plus user, then returns the
 * updated progress map. Called by saveProgress for Plus users.
 */
async function saveProgressToSupabase(
  userId: string,
  entry: VocabEntry,
  progress: CardProgress,
  progressMap: Record<string, CardProgress>
): Promise<Record<string, CardProgress>> {
  const key = vocabKey(entry);
  const updated = { ...progressMap, [key]: progress };
  try {
    await supabase
      .from('card_progress')
      .upsert({ user_id: userId, ...toRow(entry, progress) }, { onConflict: 'user_id,vocab_id' });
  } catch {
    // Silent failure — in-memory map is still correct for this session
  }
  return updated;
}

/**
 * Deletes all card_progress, grammar_progress and study_days rows for a user
 * from Supabase. Called when a Plus user resets their progress from the stats
 * page.
 */
export async function resetProgressInSupabase(userId: string): Promise<void> {
  try {
    await supabase.from('card_progress').delete().eq('user_id', userId);
    await supabase.from('grammar_progress').delete().eq('user_id', userId);
    await supabase.from('study_days').delete().eq('user_id', userId);
  } catch {
    // Silent failure
  }
}

// ── FSRS weight optimisation ────────────────────────────────────────────────

/**
 * Returns the user's personal FSRS weights from user_settings, or null if not
 * yet optimised.
 */
export async function loadFsrsWeights(userId: string): Promise<number[] | null> {
  const { data } = await supabase
    .from('user_settings')
    .select('fsrs_weights')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.fsrs_weights ?? null;
}

/**
 * Fires the optimise-fsrs-weights Edge Function when the user crosses a
 * 1,000-review milestone. Fire-and-forget.
 */
async function maybeTriggerOptimisation(userId: string, totalReps: number) {
  const shouldOptimise =
    totalReps >= 1000 && (totalReps <= 5000 ? totalReps % 1000 === 0 : totalReps % 5000 === 0);

  if (!shouldOptimise) return;

  try {
    const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
    await fetch(`${supabaseUrl}/functions/v1/optimise-fsrs-weights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
  } catch {
    // Silent failure
  }
}

// ── Core progress functions ──────────────────────────────────────────────────

/**
 * Computes the next FSRS card state and persists it.
 *
 * - Plus users (userId present): writes directly to Supabase. localStorage is
 *   not touched. Returns a Promise resolving to the updated map.
 * - Guest/free users (userId null): writes synchronously to localStorage.
 *   Returns the updated map directly (wrapped in a resolved Promise for a
 *   uniform call signature).
 *
 * The in-memory progressMap and localStorage are keyed by vocabKey(entry)
 * (i.e. entry.id when present, else entry.norsk).
 *
 * Callers should await this function regardless of user type.
 */
export async function saveProgress(
  entry: VocabEntry,
  rating: FSRSRating,
  progressMap: Record<string, CardProgress>,
  userId?: string | null
): Promise<Record<string, CardProgress>> {
  const key = vocabKey(entry);
  const now = new Date();
  const existing = progressMap[key] ?? null;
  const card = existing ? existing.fsrs : createEmptyCard(now);

  const result = DEFAULT_FSRS.next(card, now, RATING_MAP[rating]);

  const updated: CardProgress = {
    fsrs: result.card,
    seenCount: (existing?.seenCount ?? 0) + 1,
    lastSeen: now.toISOString(),
    lastRating: rating,
    level: entry.level,
    category: entry.category
  };

  if (userId) {
    // Plus: Supabase only — no localStorage
    void recordStudyDay(userId);

    const newMap = await saveProgressToSupabase(userId, entry, updated, progressMap);

    const totalReps = Object.values(newMap).reduce((sum, c) => sum + c.fsrs.reps, 0);
    void maybeTriggerOptimisation(userId, totalReps);

    return newMap;
  } else {
    // Guest / free: localStorage only
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(updated));
    return { ...progressMap, [key]: updated };
  }
}

export function countDueToday(progressMap: Record<string, CardProgress>): number {
  const now = new Date();
  return Object.values(progressMap).filter((p) => new Date(p.fsrs.due) <= now).length;
}

// ── Grammar progress ─────────────────────────────────────────────────────────
// Grammar FSRS state mirrors the vocab flow but lives in its own store:
//   - Guest/free users: localStorage under 'grammar-<questionId>'
//   - Plus users: the grammar_progress Supabase table (one row per user+question)
// Maps are keyed by GrammarQuestion.id (not the 'grammar-' prefixed key) so the
// session components can look up progress directly by question.id.

interface GrammarProgressRow {
  question_id: string;
  topic: string;
  cefr: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  seen_count: number;
  last_seen: string;
}

function toGrammarRow(question: GrammarQuestion, p: CardProgress): GrammarProgressRow {
  return {
    question_id: question.id,
    topic: question.topic,
    cefr: question.cefr,
    due: p.fsrs.due instanceof Date ? p.fsrs.due.toISOString() : String(p.fsrs.due),
    stability: p.fsrs.stability,
    difficulty: p.fsrs.difficulty,
    elapsed_days: p.fsrs.elapsed_days,
    scheduled_days: p.fsrs.scheduled_days,
    learning_steps: p.fsrs.learning_steps,
    reps: p.fsrs.reps,
    lapses: p.fsrs.lapses,
    state: p.fsrs.state,
    last_review: p.fsrs.last_review
      ? p.fsrs.last_review instanceof Date
        ? p.fsrs.last_review.toISOString()
        : String(p.fsrs.last_review)
      : null,
    seen_count: p.seenCount,
    last_seen: p.lastSeen
  };
}

function fromGrammarRow(row: GrammarProgressRow): CardProgress {
  return {
    fsrs: {
      due: new Date(row.due),
      stability: row.stability,
      difficulty: row.difficulty,
      elapsed_days: row.elapsed_days,
      scheduled_days: row.scheduled_days,
      learning_steps: row.learning_steps,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state,
      last_review: row.last_review ? new Date(row.last_review) : undefined
    },
    seenCount: row.seen_count,
    lastSeen: row.last_seen,
    // level/category reuse the CardProgress shape; for grammar they carry the
    // CEFR level and topic respectively (not vocab Category values).
    level: row.cefr as CardProgress['level'],
    category: row.topic as unknown as CardProgress['category']
  };
}

/**
 * Loads grammar progress from localStorage. Guest/free users only.
 * Returns a map keyed by GrammarQuestion.id.
 */
export function loadGrammarProgressMap(): Record<string, CardProgress> {
  const map: Record<string, CardProgress> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(GRAMMAR_LS_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as CardProgress;
          parsed.fsrs.due = new Date(parsed.fsrs.due);
          if (parsed.fsrs.last_review) {
            parsed.fsrs.last_review = new Date(parsed.fsrs.last_review);
          }
          map[key.slice(GRAMMAR_LS_PREFIX.length)] = parsed;
        }
      } catch {
        // Ignore malformed entries
      }
    }
  }
  return map;
}

/**
 * Fetches all grammar_progress rows for a Plus user, keyed by question_id.
 * Called on mount for Plus users instead of loadGrammarProgressMap.
 */
export async function loadGrammarProgressFromSupabase(
  userId: string
): Promise<Record<string, CardProgress>> {
  const { data, error } = await supabase.from('grammar_progress').select('*').eq('user_id', userId);

  if (error || !data) return {};

  const map: Record<string, CardProgress> = {};
  for (const row of data as GrammarProgressRow[]) {
    map[row.question_id] = fromGrammarRow(row);
  }
  return map;
}

/**
 * Computes the next FSRS state for a grammar question and persists it.
 * Plus users (userId present) write to grammar_progress; guest/free users
 * write to localStorage. Returns the updated map keyed by question.id.
 */
export async function saveGrammarProgress(
  question: GrammarQuestion,
  rating: FSRSRating,
  progressMap: Record<string, CardProgress>,
  userId?: string | null
): Promise<Record<string, CardProgress>> {
  const now = new Date();
  const existing = progressMap[question.id] ?? null;
  const card = existing ? existing.fsrs : createEmptyCard(now);

  const result = DEFAULT_FSRS.next(card, now, RATING_MAP[rating]);

  const updated: CardProgress = {
    fsrs: result.card,
    seenCount: (existing?.seenCount ?? 0) + 1,
    lastSeen: now.toISOString(),
    lastRating: rating,
    level: question.cefr,
    category: question.topic as unknown as CardProgress['category']
  };

  if (userId) {
    // Plus: grammar_progress table only — no localStorage
    void recordStudyDay(userId);
    try {
      await supabase
        .from('grammar_progress')
        .upsert(
          { user_id: userId, ...toGrammarRow(question, updated) },
          { onConflict: 'user_id,question_id' }
        );
    } catch {
      // Silent failure — in-memory map is still correct for this session
    }
    return { ...progressMap, [question.id]: updated };
  } else {
    // Guest / free: localStorage only
    localStorage.setItem(GRAMMAR_LS_PREFIX + question.id, JSON.stringify(updated));
    return { ...progressMap, [question.id]: updated };
  }
}

// ── Streak + activity helpers ────────────────────────────────────────────────

/**
 * Returns today's date as a YYYY-MM-DD string in the user's local timezone.
 */
export function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Counts the current streak from localStorage lastSeen values.
 * Used for guest/free users only.
 */
export function getStreakFromLocalStorage(progressMap: Record<string, CardProgress>): number {
  const studiedDates = new Set<string>();
  for (const p of Object.values(progressMap)) {
    if (p.lastSeen) {
      const d = new Date(p.lastSeen);
      studiedDates.add(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      );
    }
  }

  let streak = 0;
  const cursor = new Date();
  const todayStr = todayLocalDate();
  if (!studiedDates.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!studiedDates.has(dateStr)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Upserts a study_days row for today. Fire-and-forget, Plus users only.
 */
export async function recordStudyDay(userId: string): Promise<void> {
  try {
    const today = todayLocalDate();
    await supabase.rpc('upsert_study_day', { p_user_id: userId, p_day: today });
  } catch {
    // Silent failure
  }
}

/**
 * Fetches all study_days rows for a Plus user.
 */
export async function loadStudyDays(userId: string): Promise<Record<string, number>> {
  const { data } = await supabase.from('study_days').select('day, cards').eq('user_id', userId);
  const result: Record<string, number> = {};
  if (data) {
    for (const row of data as { day: string; cards: number }[]) {
      result[row.day] = row.cards;
    }
  }
  return result;
}

export interface ActivityCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export function buildActivityGrid(studyDays: Record<string, number>, weeks = 26): ActivityCell[] {
  const cells: ActivityCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay() || 7;
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - (dayOfWeek - 1));

  const startDate = new Date(startOfThisWeek);
  startDate.setDate(startOfThisWeek.getDate() - (weeks - 1) * 7);

  const cursor = new Date(startDate);
  while (cursor <= today) {
    const wd = cursor.getDay();
    const isoWeekday = (wd === 0 ? 7 : wd) as ActivityCell['weekday'];

    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const count = studyDays[dateStr] ?? 0;
    const level: ActivityCell['level'] =
      count === 0 ? 0 : count <= 5 ? 1 : count <= 15 ? 2 : count <= 30 ? 3 : 4;

    cells.push({ date: dateStr, count, level, weekday: isoWeekday });
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

// ── Rating preview ───────────────────────────────────────────────────────────

export interface ScheduledIntervals {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

export function previewIntervals(
  existing: CardProgress | null,
  now: Date,
  fsrsInstance?: FSRS
): ScheduledIntervals {
  const f = fsrsInstance ?? DEFAULT_FSRS;
  const card = existing ? { ...existing.fsrs, due: now, last_review: now } : createEmptyCard(now);

  const labels = {} as Record<FSRSRating, string>;
  for (const [r, grade] of Object.entries(RATING_MAP) as [FSRSRating, Grade][]) {
    const result = f.next(card, now, grade);
    labels[r] = formatInterval(result.card.due, now);
  }
  return labels as ScheduledIntervals;
}

function formatInterval(due: Date, now: Date): string {
  const diffMs = due.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.round(diffMs / 3_600_000);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths}mo`;
}

// ── Free → Plus migration ──────────────────────────────────────────────────

/**
 * One-time migration: copies progress from localStorage into Supabase.
 * Called on login for Plus users when Supabase has zero rows (i.e. the user
 * has just upgraded from free). After a successful upsert, clears the
 * localStorage keys so the migration never runs again on this device.
 *
 * localStorage keys are 'progress-<vocabId|norsk>'. The key itself becomes
 * vocab_id in the DB row; the norsk field is back-filled from the key as a
 * best-effort fallback (sufficient for legacy keys that ARE the norsk value).
 * When vocab entries have a proper id the key will be the id, not norsk, but
 * norsk is only needed until migration 017 drops that column.
 */
export async function migrateLocalProgressToSupabase(
  userId: string,
  allEntries: VocabEntry[] = []
): Promise<void> {
  const localMap = loadProgressMap();
  if (Object.keys(localMap).length === 0) return;

  // Build a lookup from vocabKey → VocabEntry so we can pass the full entry
  // to toRow() (which needs entry.norsk separately from entry.id).
  const entryByKey = new Map<string, VocabEntry>();
  for (const e of allEntries) {
    entryByKey.set(vocabKey(e), e);
  }

  const rows = Object.entries(localMap).map(([key, progress]) => {
    const entry = entryByKey.get(key);
    if (entry) {
      return { user_id: userId, ...toRow(entry, progress) };
    }
    // Fallback for legacy keys that are the norsk value (pre-id localStorage).
    // vocab_id and norsk both get the key value; level/category come from progress.
    return {
      user_id: userId,
      vocab_id: key,
      norsk: key,
      level: progress.level,
      category: progress.category,
      due:
        progress.fsrs.due instanceof Date
          ? progress.fsrs.due.toISOString()
          : String(progress.fsrs.due),
      stability: progress.fsrs.stability,
      difficulty: progress.fsrs.difficulty,
      elapsed_days: progress.fsrs.elapsed_days,
      scheduled_days: progress.fsrs.scheduled_days,
      learning_steps: progress.fsrs.learning_steps,
      reps: progress.fsrs.reps,
      lapses: progress.fsrs.lapses,
      state: progress.fsrs.state,
      last_review: progress.fsrs.last_review
        ? progress.fsrs.last_review instanceof Date
          ? progress.fsrs.last_review.toISOString()
          : String(progress.fsrs.last_review)
        : null,
      seen_count: progress.seenCount,
      last_seen: progress.lastSeen
    };
  });

  const { error } = await supabase
    .from('card_progress')
    .upsert(rows, { onConflict: 'user_id,vocab_id' });

  if (!error) {
    clearUserProgress(); // remove progress-* keys from localStorage
  }
}

// ── Undo helpers (guest / free users) ───────────────────────────────────────

/**
 * Restores a previous card state to localStorage.
 * Only called for guest/free users — Plus users restore via Supabase upsert
 * in the component's undo() handler.
 */
export function restoreProgressToLocalStorage(
  entry: VocabEntry,
  previousProgress: CardProgress | null
): void {
  const key = LS_PREFIX + vocabKey(entry);
  if (previousProgress === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(previousProgress));
  }
}
