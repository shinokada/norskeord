import { FSRS, createEmptyCard, Rating, generatorParameters } from 'ts-fsrs';
import type { Grade } from 'ts-fsrs';
import type { FSRSRating, CardProgress } from '$lib/types';
import type { VocabEntry } from '$lib/types';
import { supabase } from '$lib/supabase';

const fsrs = new FSRS(generatorParameters());

export const LS_PREFIX = 'progress-';

const RATING_MAP: Record<FSRSRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy
};

// ── Local storage ────────────────────────────────────────────────────────────

export function loadProgressMap(): Record<string, CardProgress> {
  const map: Record<string, CardProgress> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as CardProgress;
          // Rehydrate due date as Date object (JSON.parse gives a string)
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
 * Called once on login.
 *
 * 1. Upserts all localStorage entries to Supabase (local wins on conflict,
 *    since the user has been studying on this device).
 * 2. Pulls any rows from Supabase that are NOT in localStorage (covers cards
 *    reviewed on another device) and writes them to localStorage.
 *
 * Returns the merged progress map so the caller can update UI state.
 */
export async function syncProgressOnLogin(userId: string): Promise<Record<string, CardProgress>> {
  const local = loadProgressMap();

  // 1. Push local → Supabase
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

  if (remoteRows) {
    for (const row of remoteRows as ProgressRow[]) {
      if (!merged[row.norsk]) {
        // Card exists remotely but not locally — write it to localStorage
        const progress = fromRow(row);
        localStorage.setItem(LS_PREFIX + row.norsk, JSON.stringify(progress));
        merged[row.norsk] = progress;
      }
    }
  }

  return merged;
}

/**
 * Writes a single progress record to Supabase.
 * Called by saveProgress when a user is logged in.
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

// ── Core progress functions ──────────────────────────────────────────────────

export function saveProgress(
  entry: VocabEntry,
  rating: FSRSRating,
  progressMap: Record<string, CardProgress>,
  userId?: string | null
): Record<string, CardProgress> {
  const now = new Date();
  const existing = progressMap[entry.norsk] ?? null;
  const card = existing ? existing.fsrs : createEmptyCard(now);
  const result = fsrs.next(card, now, RATING_MAP[rating]);

  const updated: CardProgress = {
    fsrs: result.card,
    seenCount: (existing?.seenCount ?? 0) + 1,
    lastSeen: now.toISOString(),
    level: entry.level,
    category: entry.category
  };

  // Always write to localStorage first (works offline)
  localStorage.setItem(LS_PREFIX + entry.norsk, JSON.stringify(updated));

  // Dual-write to Supabase when logged in (fire-and-forget)
  if (userId) {
    pushRowToSupabase(userId, entry.norsk, updated);
  }

  return { ...progressMap, [entry.norsk]: updated };
}

export function countDueToday(progressMap: Record<string, CardProgress>): number {
  const now = new Date();
  return Object.values(progressMap).filter((p) => new Date(p.fsrs.due) <= now).length;
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
export function previewIntervals(existing: CardProgress | null, now: Date): ScheduledIntervals {
  // When an existing card is provided, normalize its due date to `now` so that
  // fsrs.next() doesn't throw when the stored due date is after the preview
  // timestamp (e.g. in tests or when the card isn't overdue yet). The scheduling
  // state (stability, difficulty, reps, etc.) is preserved so FSRS produces the
  // correct next intervals for a card at this maturity level.
  const card = existing
    ? { ...existing.fsrs, due: now, last_review: now }
    : createEmptyCard(now);

  const labels = {} as Record<FSRSRating, string>;
  for (const [r, grade] of Object.entries(RATING_MAP) as [FSRSRating, Grade][]) {
    const result = fsrs.next(card, now, grade);
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
