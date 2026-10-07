import type { VocabEntry } from '$lib/types';

/** What a flashcard deep link points at: `?id=<w-NNNNNN>` and/or `?word=<norsk>`. */
export interface DeckTarget {
  id?: string | null;
  word?: string | null;
}

/**
 * Resolve the entry a deep link (e.g. from search) should show first.
 *
 * - `id` wins: it identifies exactly one sense. When `id` is present it is the
 *   only thing matched; if no entry in `source` has it (e.g. the entry is
 *   filtered out of the current mode) the result is `undefined`, NOT a fall
 *   back to `word`, because `word` alone would silently pick a different
 *   sense of the same `norsk`.
 * - Without an `id` (old links, bookmarks) `word` matches the first entry with
 *   that `norsk`, as before.
 */
export function resolveTargetEntry(
  source: VocabEntry[],
  target: DeckTarget
): VocabEntry | undefined {
  const id = target.id?.trim();
  if (id) return source.find((e) => e.id === id);
  const word = target.word;
  return word ? source.find((e) => e.norsk === word) : undefined;
}
