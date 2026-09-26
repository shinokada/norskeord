// src/lib/content-lookup.ts
// Phase 1, ai-docs/implementation/permanent-structural-fix.md.
//
// `CardProgress.level`/`CardProgress.category` are a one-time snapshot taken
// at review time (see saveProgress in progress.ts) — they go stale the
// moment an entry's level, category, or vocab/uttrykk type changes in the
// content files, since nothing rewrites an existing progress row until that
// card is reviewed again.
//
// This module is the fix: a single `id -> current location` map, built once
// at module load from every vocab/uttrykk content file (same pattern as
// vocabByLevel/uttrykkByLevel in stats.ts), plus `resolveEntry()` so any
// caller can look up an id's *live* level/category/theme/type instead of
// trusting the stored snapshot. An id that no longer exists anywhere
// (entry actually deleted, not moved) simply isn't in the map —
// `resolveEntry()` returns undefined and callers drop it silently, per the
// plan doc's Decision section.

import type { CEFRLevel } from '$lib/types';

import vocabA1 from '$lib/data/vocab-a1.json';
import vocabA2 from '$lib/data/vocab-a2.json';
import vocabB1 from '$lib/data/vocab-b1.json';
import vocabB2 from '$lib/data/vocab-b2.json';
import vocabC from '$lib/data/vocab-c.json';

import uttrykkA1 from '$lib/data/uttrykk-a1.json';
import uttrykkA2 from '$lib/data/uttrykk-a2.json';
import uttrykkB1 from '$lib/data/uttrykk-b1.json';
import uttrykkB2 from '$lib/data/uttrykk-b2.json';
import uttrykkC from '$lib/data/uttrykk-c.json';

/**
 * An id's current location in content, resolved live rather than trusted
 * from a stored `CardProgress` snapshot.
 *
 * `type` is derived from *which file the id was found in* — not from the
 * `category` field. As of the theme/category unification
 * (ai-docs/implementation/uttrykk-theme-category-unification.md), every
 * uttrykk entry at every level (A1–B2 and C) carries a real category slug
 * directly — there's no more `'uttrykk'` sentinel or separate `theme` field
 * to reconcile. `type` still comes from *which file the id was found in*,
 * so every other module (stats.ts, progress.ts) can just trust `type`
 * instead of re-deriving it.
 */
export interface ResolvedEntry {
  level: CEFRLevel;
  category: string;
  type: 'vocab' | 'uttrykk';
}

interface LookupSourceEntry {
  id?: string;
  norsk: string;
  category: string;
}

/** Stable lookup key for a content entry: id when present, else norsk — same
 * fallback vocabKey() uses in progress.ts for entries that predate the id
 * migration. */
function entryKey(e: LookupSourceEntry): string {
  return e.id ?? e.norsk;
}

const vocabFilesByLevel: Record<CEFRLevel, LookupSourceEntry[]> = {
  A1: vocabA1 as LookupSourceEntry[],
  A2: vocabA2 as LookupSourceEntry[],
  B1: vocabB1 as LookupSourceEntry[],
  B2: vocabB2 as LookupSourceEntry[],
  C: vocabC as LookupSourceEntry[]
};

// A1–B2 and C uttrykk decks now both carry real category slugs directly
// (see uttrykk-c-stats.ts for C's) — both shapes satisfy LookupSourceEntry
// as-is.
const uttrykkFilesByLevel: Record<CEFRLevel, LookupSourceEntry[]> = {
  A1: uttrykkA1 as LookupSourceEntry[],
  A2: uttrykkA2 as LookupSourceEntry[],
  B1: uttrykkB1 as LookupSourceEntry[],
  B2: uttrykkB2 as LookupSourceEntry[],
  C: uttrykkC as LookupSourceEntry[]
};

/**
 * id -> current { level, category, theme?, type }, built once at module
 * load from every vocab/uttrykk file across all 5 levels — ~10,150 entries,
 * a single pass, sub-millisecond (see the plan doc's Performance notes).
 *
 * Vocab entries are inserted first, uttrykk second; ids are global and
 * unique across both (see id-new-format.md Round 3), so this ordering only
 * matters as a defensive tie-break and should never actually decide a real
 * lookup.
 */
const CONTENT_LOOKUP: Map<string, ResolvedEntry> = (() => {
  const map = new Map<string, ResolvedEntry>();

  for (const level of Object.keys(vocabFilesByLevel) as CEFRLevel[]) {
    for (const e of vocabFilesByLevel[level]) {
      map.set(entryKey(e), { level, category: e.category, type: 'vocab' });
    }
  }

  for (const level of Object.keys(uttrykkFilesByLevel) as CEFRLevel[]) {
    for (const e of uttrykkFilesByLevel[level]) {
      map.set(entryKey(e), { level, category: e.category, type: 'uttrykk' });
    }
  }

  return map;
})();

/**
 * Resolves an id's current level/category/type live from content.
 * Returns undefined when the id no longer exists anywhere in content (the
 * entry was deleted outright, not moved) — callers should drop such ids
 * silently rather than error or fall back to a stale stored value.
 */
export function resolveEntry(id: string): ResolvedEntry | undefined {
  return CONTENT_LOOKUP.get(id);
}
