/**
 * Pure due-deck helpers extracted from VocabFlashcardPage.svelte's Fix 1
 * work (ai-docs/implementation/due-only-review-update.md) so the core
 * shuffle/deal/loop logic can be unit tested without mounting the
 * component. VocabFlashcardPage.svelte owns the actual `$state` (the pool,
 * the deal index) and calls these as plain functions on that state.
 */

import type { CardProgress, VocabEntry } from './types';
import { vocabKey } from './progress';

// Mirrors VocabFlashcardPage.svelte's NEW_CARD_SESSION_LIMIT — caps how many
// never-seen cards can enter a due-only pool in one visit, so a huge backlog
// of brand-new cards doesn't crowd out actually-overdue ones.
export const NEW_CARD_SESSION_LIMIT = 20;

/** Fisher–Yates shuffle (returns a new array, does not mutate the input). */
export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The fixed pool of due+new cards for one due-only visit: every card whose
 * FSRS due date has passed, plus up to NEW_CARD_SESSION_LIMIT never-seen
 * cards (randomly chosen, since "new" cards have no due date to sort by).
 *
 * `entries` should already reflect any mode-specific filtering the caller
 * wants applied before due-scoping (e.g. VocabFlashcardPage filters out
 * entries with no `definition` for defnor mode before calling this) — this
 * function does no filtering of its own beyond the due/new split.
 *
 * Computed once per fresh visit (not re-derived on Restart) — see
 * VocabFlashcardPage's `buildDeck()`, which only calls this when
 * `isRestart` is false. That's what makes Restart loop the same batch
 * instead of shrinking toward empty as cards get rated (Fix 1).
 */
export function computeDuePool(
  entries: VocabEntry[],
  progressMap: Record<string, CardProgress>,
  now: Date = new Date()
): VocabEntry[] {
  const overdue: VocabEntry[] = [];
  const newCards: VocabEntry[] = [];

  for (const e of entries) {
    const p = progressMap[vocabKey(e)];
    if (!p) {
      newCards.push(e);
    } else if (new Date(p.fsrs.due) <= now) {
      overdue.push(e);
    }
  }

  const newCapped = shuffle(newCards).slice(0, NEW_CARD_SESSION_LIMIT);
  return [...overdue, ...newCapped];
}

export interface DealResult<T> {
  /** The next chunk to show, up to `limit` items (or the whole pool if `limit` is null). */
  chunk: T[];
  /** The pool, reshuffled if dealing wrapped around to the start. */
  pool: T[];
  /** The updated deal index — pass this back in on the next call. */
  dealIndex: number;
}

/**
 * Deals the next `limit`-sized chunk from `pool`, starting at `dealIndex`.
 * When `dealIndex` has reached the end of the pool, reshuffles the whole
 * pool and starts dealing from the top again — so repeated calls loop
 * through the full pool indefinitely (full coverage before any repeats)
 * instead of ever returning an empty chunk once every card has been dealt
 * at least once. This is what makes "Shuffle & Restart" loop the same
 * fixed batch (Fix 1) rather than shrinking toward empty.
 *
 * `limit: null` means "no session cap" — deals (and, when it wraps,
 * re-deals) the entire pool in one chunk.
 */
export function dealChunk<T>(pool: T[], dealIndex: number, limit: number | null): DealResult<T> {
  if (pool.length === 0) {
    return { chunk: [], pool, dealIndex };
  }

  let workingPool = pool;
  let idx = dealIndex;
  if (idx >= workingPool.length) {
    workingPool = shuffle(workingPool);
    idx = 0;
  }

  const chunkSize = limit ?? workingPool.length;
  const chunk = workingPool.slice(idx, idx + chunkSize);
  idx += chunk.length;

  return { chunk, pool: workingPool, dealIndex: idx };
}
