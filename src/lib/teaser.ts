import type { VocabEntry } from './types';

/**
 * The only data a locked category page sends to a visitor without Plus.
 * Keep it this small on purpose: the blur on the page is cosmetic, so anything
 * in this object is readable in the page source and in `__data.json`.
 * ai-docs/implementation/locked-teaser-social-login.md, Phase 3.
 */
export interface Teaser {
  /** How many cards the full deck holds. */
  totalCount: number;
  /** The Norwegian word of the first entry (deterministic). Never its back. */
  front: string;
}

export function buildTeaser(entries: readonly Pick<VocabEntry, 'norsk'>[]): Teaser | null {
  const first = entries[0];
  if (!first?.norsk) return null;
  return { totalCount: entries.length, front: first.norsk };
}
