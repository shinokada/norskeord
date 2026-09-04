/**
 * searchUtils.ts
 *
 * Search algorithm for the pre-built SearchEntry index.
 * Three-pass scoring — no external library needed at ~10,000 entries.
 *
 * Pass 1 — exact match on lemma or translation            score: 10
 * Pass 2 — prefix match on lemma or translation           score: 8
 * Pass 3 — substring match across all text fields     score: 5
 * Pass 4 — all query tokens appear somewhere          score: 1
 *           (handles inflected forms like "boken" → lemma "bok")
 *
 * "Translation" defaults to English but callers can pass a locale-aware
 * getter (see Search.svelte's `translationFor`) so a Spanish/Ukrainian/German
 * query matches too, not just Norwegian or English text.
 *
 * Results are sorted by score descending, capped at MAX_RESULTS.
 */

import type { SearchEntry } from '$lib/search';

export const MAX_RESULTS = 50;

export interface SearchFilter {
  source?: 'vocab' | 'uttrykk' | 'all';
  level?: string; // 'A1' | 'A2' | ... | 'all'
}

export function search(
  query: string,
  index: SearchEntry[],
  filter: SearchFilter = {},
  getTranslation: (entry: SearchEntry) => string = (e) => e.english,
  getExampleTranslation: (entry: SearchEntry) => string = (e) => e.example_english
): SearchEntry[] {
  const q = normalize(query);
  if (q.length < 2) return [];

  const results: { entry: SearchEntry; score: number }[] = [];

  for (const entry of index) {
    // Apply filters first — cheap early exit
    if (filter.source && filter.source !== 'all' && entry.source !== filter.source) continue;
    if (filter.level && filter.level !== 'all' && entry.level !== filter.level) continue;

    let score = 0;
    const ln = normalize(entry.lemma);
    const tr = normalize(getTranslation(entry));

    if (ln === q || tr === q) {
      score = 10;
    } else if (ln.startsWith(q) || tr.startsWith(q)) {
      score = 8;
    } else if (
      [entry.norsk, entry.lemma, tr, entry.example, getExampleTranslation(entry)].some((f) =>
        normalize(f).includes(q)
      )
    ) {
      score = 5;
    } else {
      const tokens = q.split(/\s+/);
      const blob = normalize([entry.norsk, entry.lemma, tr].join(' '));
      if (tokens.every((t) => blob.includes(t))) score = 1;
    }

    if (score > 0) results.push({ entry, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((r) => r.entry);
}

/**
 * Returns true when the norsk surface form differs from the lemma,
 * meaning the matched word is an inflected form.
 */
export function hasInflection(entry: SearchEntry): boolean {
  return entry.norsk !== entry.lemma;
}

/**
 * Lowercase, trim, strip non-Norwegian diacritics, return NFC.
 *
 * Strategy:
 *   1. Decompose to NFD so combining marks are separate codepoints.
 *   2. Strip combining marks EXCEPT U+030A (combining ring above).
 *      å decomposes to a + U+030A — stripping U+030A would turn å → a,
 *      breaking Norwegian search. ø and æ do not decompose, so they are
 *      unaffected by this step.
 *   3. Recompose to NFC so å is a single codepoint (U+00E5) again,
 *      ensuring string comparisons work correctly.
 */
export function normalize(s = ''): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u0309\u030b-\u036f]/g, '') // strip combining marks except U+030A (å)
    .normalize('NFC'); // recompose so å === å (U+00E5), not a + U+030A
}
