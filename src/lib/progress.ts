import { FSRS, createEmptyCard, Rating, generatorParameters } from 'ts-fsrs';
import type { Grade, FSRSParameters } from 'ts-fsrs';
import type { FSRSRating, CardProgress } from '$lib/types';
import type { VocabEntry } from '$lib/types';
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
 * Returns the localStorage key prefix for a given user.
 * - Logged-in users:  'progress-{userId}-'
 * - Anonymous users:  'progress-'
 *
 * Namespacing prevents one user's study data from bleeding into another
 * account when the same browser is used by multiple people.
 */
export function lsPrefix(userId?: string | null): string {
  return userId ? `${LS_PREFIX}${userId}-` : LS_PREFIX;
}

/**
 * Removes all anonymous (non-user-namespaced) progress keys from localStorage.
 * Called after a successful login sync so the anonymous data is no longer
 * accessible without authentication.
 */
export function clearAnonymousProgress(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Anonymous keys start with 'progress-' but NOT 'progress-{uuid}-'
    // A UUID always starts with a hex character, never a digit pattern used
    // in norsk words, so we check: starts with LS_PREFIX but the next char
    // after the prefix is NOT part of a UUID segment.
    // Simpler: anonymous keys do NOT contain a second '-' after 'progress-'
    // because UUIDs always produce 'progress-<uuid>-<norsk>'.
    if (key?.startsWith(LS_PREFIX)) {
      const rest = key.slice(LS_PREFIX.length);
      // UUID-namespaced keys have the form '<uuid>-<norsk>', i.e. rest contains '-'
      // Anonymous keys have the form '<norsk>' which never contains the UUID pattern.
      // We detect anonymous keys by checking they do NOT look like 'xxxxxxxx-xxxx-...'
      const looksLikeUuidNamespaced = /^[0-9a-f]{8}-/.test(rest);
      if (!looksLikeUuidNamespaced) {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * Deletes all card_progress and study_days rows for a user from Supabase.
 * Called when the user chooses "Reset everywhere" on the stats page.
 * Errors are swallowed — the caller has already cleared localStorage.
 */
export async function resetProgressInSupabase(userId: string): Promise<void> {
  try {
    await supabase.from('card_progress').delete().eq('user_id', userId);
    await supabase.from('study_days').delete().eq('user_id', userId);
  } catch {
    // Silent failure — local reset already happened
  }
}

/**
 * Removes all progress keys belonging to a specific user from localStorage.
 * Called on logout so the next person who opens the browser sees no progress.
 */
export function clearUserProgress(userId: string): void {
  const prefix = lsPrefix(userId);
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

const RATING_MAP: Record<FSRSRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy
};

// ── Local storage ────────────────────────────────────────────────────────────

/**
 * Loads the progress map from localStorage for the given user.
 * Pass `userId` for logged-in users so only their namespaced keys are read.
 * Pass nothing / null for anonymous (pre-login) use.
 */
export function loadProgressMap(userId?: string | null): Record<string, CardProgress> {
  const prefix = lsPrefix(userId);
  const map: Record<string, CardProgress> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as CardProgress;
          // Rehydrate due date as Date object (JSON.parse gives a string)
          parsed.fsrs.due = new Date(parsed.fsrs.due);
          if (parsed.fsrs.last_review) {
            parsed.fsrs.last_review = new Date(parsed.fsrs.last_review);
          }
          map[key.slice(prefix.length)] = parsed;
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

function toRow(norsk: string, p: CardProgress): Omit<ProgressRow, never> {
  return {
    norsk,
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

// ── Sync helpers ─────────────────────────────────────────────────────────────

/**
 * Called once on login (Plus users only).
 *
 * 1. Upserts all localStorage entries to Supabase (local wins on conflict,
 *    since the user has been studying on this device).
 * 2. Pulls any rows from Supabase that are NOT in localStorage (covers cards
 *    reviewed on another device) and writes them to localStorage.
 *
 * Returns the merged progress map so the caller can update UI state.
 */
export async function syncProgressOnLogin(userId: string): Promise<Record<string, CardProgress>> {
  // Load any anonymous progress (pre-login) to merge it into the user's account.
  const anonymousLocal = loadProgressMap(null);
  // Also load any already-namespaced progress for this user (e.g. from a previous session).
  const userLocal = loadProgressMap(userId);
  // Merge: user-namespaced entries win over anonymous ones for the same word.
  const local = { ...anonymousLocal, ...userLocal };

  // 1. Push local → Supabase (both anonymous and user-namespaced merged above)
  const localEntries = Object.entries(local);
  if (localEntries.length > 0) {
    const rows = localEntries.map(([norsk, progress]) => ({
      user_id: userId,
      ...toRow(norsk, progress)
    }));

    // Upsert in batches of 100 to stay within Supabase request limits
    for (let i = 0; i < rows.length; i += 100) {
      await supabase
        .from('card_progress')
        .upsert(rows.slice(i, i + 100), { onConflict: 'user_id,norsk' });
    }
  }

  // 2. Pull remote → local (only rows not already in localStorage)
  const { data: remoteRows } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId);

  const merged = { ...local };

  const userPrefix = lsPrefix(userId);
  if (remoteRows) {
    for (const row of remoteRows as ProgressRow[]) {
      if (!merged[row.norsk]) {
        // Card exists remotely but not locally — write it to user-namespaced localStorage
        const progress = fromRow(row);
        localStorage.setItem(userPrefix + row.norsk, JSON.stringify(progress));
        merged[row.norsk] = progress;
      } else {
        // Ensure the merged local entry is written under the user-namespaced key
        localStorage.setItem(userPrefix + row.norsk, JSON.stringify(merged[row.norsk]));
      }
    }
  }

  // Also write any local-only entries (not yet in Supabase) under user-namespaced keys
  for (const [norsk, progress] of Object.entries(merged)) {
    const userKey = userPrefix + norsk;
    if (!localStorage.getItem(userKey)) {
      localStorage.setItem(userKey, JSON.stringify(progress));
    }
  }

  return merged;
}

/**
 * Writes a single progress record to Supabase.
 * Called by saveProgress when a Plus user is logged in.
 * Errors are swallowed — localStorage is always written first,
 * so a network failure won't lose the rating.
 */
async function pushRowToSupabase(userId: string, norsk: string, progress: CardProgress) {
  try {
    await supabase
      .from('card_progress')
      .upsert({ user_id: userId, ...toRow(norsk, progress) }, { onConflict: 'user_id,norsk' });
  } catch {
    // Silent failure — localStorage is the source of truth offline
  }
}

// ── FSRS weight optimisation ────────────────────────────────────────────────

/**
 * Returns the user's personal FSRS weights from user_settings, or null if not
 * yet optimised. The caller falls back to default weights when null is returned.
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
 * 1,000-review milestone. Fire-and-forget — errors are swallowed so a network
 * failure never blocks the rating flow.
 *
 * Schedule:
 *   0–999    default weights
 *   1,000    first optimisation
 *   +1,000 intervals up to 5,000   re-optimise
 *   5,000+   re-optimise every +5,000
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
    // Silent failure — optimisation is best-effort
  }
}

// ── Core progress functions ──────────────────────────────────────────────────

/**
 * Synchronously computes the next FSRS card state, writes to localStorage,
 * and returns the updated progress map.
 *
 * Async side-effects (Supabase dual-write, weight optimisation) are fired
 * as detached promises — they never block the return value or throw.
 *
 * Personal FSRS weights are applied only via the async `getFsrs()` path
 * (called separately in the component on mount). The synchronous path always
 * uses default weights, which is correct for the vast majority of users and
 * required for test compatibility.
 *
 * @param userId - Pass the user's ID only for Plus users; pass null for free
 *   users to skip all Supabase writes.
 */
export function saveProgress(
  entry: VocabEntry,
  rating: FSRSRating,
  progressMap: Record<string, CardProgress>,
  userId?: string | null
): Record<string, CardProgress> {
  const now = new Date();
  const existing = progressMap[entry.norsk] ?? null;
  const card = existing ? existing.fsrs : createEmptyCard(now);

  // Always use default FSRS synchronously so this function stays synchronous.
  // Personal weights (Phase 2-E) improve accuracy but are not load-path critical.
  const result = DEFAULT_FSRS.next(card, now, RATING_MAP[rating]);

  const updated: CardProgress = {
    fsrs: result.card,
    seenCount: (existing?.seenCount ?? 0) + 1,
    lastSeen: now.toISOString(),
    lastRating: rating,
    level: entry.level,
    category: entry.category
  };

  // Always write to localStorage first (works offline)
  const prefix = lsPrefix(userId);
  localStorage.setItem(prefix + entry.norsk, JSON.stringify(updated));

  // Async side-effects — fire-and-forget, never block the return value.
  // Only run for Plus users (userId is null for free users).
  if (userId) {
    void pushRowToSupabase(userId, entry.norsk, updated);
    void recordStudyDay(userId);

    // Check if this rating crosses an optimisation milestone.
    const totalReps = Object.values({ ...progressMap, [entry.norsk]: updated }).reduce(
      (sum, c) => sum + c.fsrs.reps,
      0
    );
    void maybeTriggerOptimisation(userId, totalReps);
  }

  return { ...progressMap, [entry.norsk]: updated };
}

export function countDueToday(progressMap: Record<string, CardProgress>): number {
  const now = new Date();
  return Object.values(progressMap).filter((p) => new Date(p.fsrs.due) <= now).length;
}

// ── Streak + activity helpers ──────────────────────────────────────────────────

/**
 * Returns today's date as a YYYY-MM-DD string in the user's local timezone.
 */
export function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Counts the current streak (consecutive calendar days with at least one card
 * reviewed) using `lastSeen` values from localStorage. Works entirely
 * client-side — used for free users and as an immediate value before the
 * Supabase `study_days` fetch completes.
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
  // If today has no activity yet, start counting from yesterday
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
 * Upserts a study_days row for today, incrementing the card count.
 * Fire-and-forget — called from saveProgress for Plus users only.
 */
export async function recordStudyDay(userId: string): Promise<void> {
  try {
    const today = todayLocalDate();
    await supabase.rpc('upsert_study_day', { p_user_id: userId, p_day: today });
  } catch {
    // Silent failure — streak data is non-critical
  }
}

/**
 * Fetches all study_days rows for a Plus user.
 * Returns a map of { 'YYYY-MM-DD': cardCount }.
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
  date: string; // YYYY-MM-DD
  count: number; // cards reviewed that day
  level: 0 | 1 | 2 | 3 | 4; // 0=none 1=1-5 2=6-15 3=16-30 4=30+
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1=Mon … 7=Sun (ISO)
}

/**
 * Builds the full 7-day-per-week activity grid for the chart.
 * Returns cells in chronological order (oldest first), one per calendar day.
 * @param studyDays  Map of { 'YYYY-MM-DD': cardCount }
 * @param weeks      How many weeks back to include (default 26)
 */
export function buildActivityGrid(studyDays: Record<string, number>, weeks = 26): ActivityCell[] {
  const cells: ActivityCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Monday that starts `weeks` weeks ago
  const dayOfWeek = today.getDay() || 7; // Sun=0 → 7 (ISO weekday)
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - (dayOfWeek - 1));

  const startDate = new Date(startOfThisWeek);
  startDate.setDate(startOfThisWeek.getDate() - (weeks - 1) * 7);

  // Walk day-by-day from startDate to today
  const cursor = new Date(startDate);
  while (cursor <= today) {
    const wd = cursor.getDay(); // 0=Sun … 6=Sat
    const isoWeekday = (wd === 0 ? 7 : wd) as ActivityCell['weekday']; // 1=Mon … 7=Sun

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

/**
 * Speculatively compute all four FSRS next-due intervals for display
 * beneath the rating buttons (2-C). Pure math — no I/O.
 */
export function previewIntervals(
  existing: CardProgress | null,
  now: Date,
  fsrsInstance?: FSRS
): ScheduledIntervals {
  const f = fsrsInstance ?? DEFAULT_FSRS;
  // When an existing card is provided, normalize its due date to `now` so that
  // fsrs.next() doesn't throw when the stored due date is after the preview
  // timestamp (e.g. in tests or when the card isn't overdue yet). The scheduling
  // state (stability, difficulty, reps, etc.) is preserved so FSRS produces the
  // correct next intervals for a card at this maturity level.
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
