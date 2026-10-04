// src/lib/grammar/review-scope.ts
// Scoping helpers for /review/grammar (ai-docs/implementation/grammar-update.md,
// Phase 7): `?chapter=<slug>` limits a due-only review to one chapter of the
// grammar book, next to the existing `?level=` and `?topic=` filters.
//
// Pure functions only, so everything is unit-testable.

import type { GrammarTopic } from '$lib/types';
import { chapterBySlug } from './taxonomy';

/**
 * The topics a `?chapter=` value selects, or null when there is no filter.
 * A chapter's topics are its primary topics (an `ALSO_IN` topic is counted
 * only in the chapter that owns it, as everywhere else in the progress views).
 *
 * An unknown slug gives an EMPTY set rather than null, so a typo shows the
 * empty state instead of silently reviewing every chapter.
 */
export function chapterScope(raw: string | null | undefined): ReadonlySet<GrammarTopic> | null {
  if (!raw) return null;
  const chapter = chapterBySlug(raw);
  if (!chapter) return new Set();
  return new Set(chapter.sections.flatMap((section) => section.topics));
}

/**
 * Keeps the due items whose live topic is in `scope`. A null scope keeps
 * everything. `topicOf` resolves a question id to its current topic (the id
 * index), so progress saved under a retired topic id is still matched; ids
 * that no longer resolve are dropped when a scope is active.
 */
export function dueInScope<T extends { id: string }>(
  items: readonly T[],
  scope: ReadonlySet<GrammarTopic> | null,
  topicOf: (id: string) => GrammarTopic | undefined
): T[] {
  if (!scope) return [...items];
  return items.filter((item) => {
    const topic = topicOf(item.id);
    return topic !== undefined && scope.has(topic);
  });
}
