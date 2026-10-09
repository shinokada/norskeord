// src/lib/free-progress.ts
// Free-tier view of a progress map (ai-docs/implementation/free-tier-simplification.md, Phase 6).
//
// A free user can have saved progress in categories that were free earlier and
// are Plus-only now. /my-progress must not count those cards (due badge, "Due
// today", seen/memorized bars, CEFR estimate): the user can't study them. So for
// non-Plus users the page works from a filtered map. The stored progress itself
// is untouched, and Plus users get their map back unchanged.
//
// `resolve` is passed in (the page passes resolveEntry from content-lookup.ts)
// so this module stays light and testable. It uses the *live* location of each
// id, not the stored CardProgress snapshot, like the rest of the page.

import type { CardProgress, CEFRLevel, GrammarTopic } from '$lib/types';
import type { UttrykkThemeLevel } from '$lib/config';
import type { StatRow } from '$lib/stats';
import { isFreeGrammarTopic, isPlusCategory, isPlusOnlyEntry } from '$lib/access';
import { isFreeUttrykkTheme } from '$lib/uttrykk-gating';
import { UTTRYKK_OTHERS_THEME } from '$lib/vocab-helpers';

export interface ResolvedLocation {
  level: CEFRLevel;
  category: string;
  type: 'vocab' | 'uttrykk';
}

export function filterProgressForPlan(
  map: Record<string, CardProgress>,
  isPlus: boolean,
  resolve: (id: string) => ResolvedLocation | null | undefined
): Record<string, CardProgress> {
  if (isPlus) return map;
  const out: Record<string, CardProgress> = {};
  for (const [id, card] of Object.entries(map)) {
    const loc = resolve(id);
    // An id that doesn't resolve anywhere is left in; the page drops those
    // silently elsewhere (same convention as stats.ts).
    if (loc && isPlusOnlyEntry(loc.level, loc.category, loc.type)) continue;
    out[id] = card;
  }
  return out;
}

/**
 * The grammar topic rows for one level, as a free user sees them: topics that are free at
 * that level first (`isFreeGrammarTopic`, i.e. FREE_GRAMMAR_TOPICS), then the rest as
 * locked teasers. A locked row keeps its title, question count and link to the topic page
 * scoped to this level (`?level=`: the topic page shows a free user the paywall for that
 * level even when the topic is free at another one), and drops every progress number
 * (cards in it don't count for a free user). A per-level row's total is
 * already that level's own question count, so no total needs correcting. Plus sees every
 * row unchanged. Free totals for the cross-level view come from buildGrammarProgress with
 * `isFreeGrammarTopic` as its scope (grammar/progress.ts).
 */
export function freeGrammarRows(rows: StatRow[], level: CEFRLevel, isPlus: boolean): StatRow[] {
  if (isPlus) return rows;
  const free: StatRow[] = [];
  const locked: StatRow[] = [];
  for (const row of rows) {
    if (isFreeGrammarTopic(row.key as GrammarTopic, level)) {
      free.push(row);
    } else {
      locked.push({
        ...row,
        seen: 0,
        review: 0,
        learning: 0,
        relearning: 0,
        due: 0,
        locked: true,
        href: `${row.href}?level=${level}`
      });
    }
  }
  return [...free, ...locked];
}

/**
 * The per-category / per-theme rows a free user may see on /my-progress: every
 * A1 row, and above A1 only rows for categories they can open (the 3 free vocab
 * categories per level). Plus sees every row. Uttrykk has no free themes at
 * A2 to B2, and at C only free categories (the synthetic "Others" row is never
 * shown to free users, since it rolls up locked categories).
 */
export function freeStatRows(
  rows: StatRow[],
  level: CEFRLevel,
  type: 'vocab' | 'uttrykk',
  isPlus: boolean
): StatRow[] {
  if (isPlus || level === 'A1') return rows;
  if (type === 'vocab') return rows.filter((r) => !isPlusCategory(level, r.key));
  if (level === 'C') {
    return rows.filter((r) => r.key !== UTTRYKK_OTHERS_THEME && !isPlusCategory('C', r.key));
  }
  return rows.filter((r) => isFreeUttrykkTheme(level as UttrykkThemeLevel, r.key));
}
