// src/lib/due-count.ts
// Plan-aware due count for the free tier (ai-docs/implementation/free-tier-simplification.md).
//
// countDueToday() in progress.ts counts every due card in the map. After the
// free-tier simplification a free user can have saved progress in categories
// that are now Plus-only; those cards must not feed the "N due" pill or the
// Plus upsell banner, because the user can no longer study them.
//
// This reads the *stored* CardProgress.level/.category snapshot instead of
// resolving each id live (content-lookup.ts): resolveEntry() pulls the whole
// id -> location map into the client bundle, which progress.ts avoids on
// purpose. The snapshot can be stale for a card whose category moved since its
// last review; for a banner count that is acceptable. Gating itself (review
// API, category routes) uses live data and is not affected.

import type { CardProgress, CEFRLevel } from '$lib/types';
import { FREE_VOCAB_CATEGORIES } from '$lib/config';

/** Whether a stored card sits in a level/category a free user can still study. */
export function isFreeCard(card: CardProgress): boolean {
  const level = card.level as CEFRLevel;
  if (level === 'A1') return true;
  const free = FREE_VOCAB_CATEGORIES[level as Exclude<CEFRLevel, 'A1'>] as
    readonly string[] | undefined;
  return !!free && free.includes(card.category as string);
}

/**
 * Due cards the given plan can actually study. Plus counts every due card;
 * free and guest users count only cards in free categories (A1, or one of the
 * 3 free categories at A2 to C).
 */
export function countDueForPlan(
  progressMap: Record<string, CardProgress>,
  isPlus: boolean,
  now: Date = new Date()
): number {
  let count = 0;
  for (const card of Object.values(progressMap)) {
    if (new Date(card.fsrs.due) > now) continue;
    if (isPlus || isFreeCard(card)) count++;
  }
  return count;
}
