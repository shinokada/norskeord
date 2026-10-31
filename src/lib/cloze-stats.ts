// src/lib/cloze-stats.ts
// Pure helpers for the Sentences section of the Quiz tab on /my-progress
// (ai-docs/implementation/cloze-quiz.md, Phase 5).
//
// The per-category bars come from the Sentences counts (cloze_progress / `cloze-stats-` keys),
// not from FSRS state. A word is:
//   - practiced: answered at least once;
//   - mastered in context: at least CLOZE_MASTERED_MIN_CORRECT correct answers and at least
//     CLOZE_MASTERED_MIN_ACCURACY accuracy. Both are constants so they are easy to change.
//
// Each bar's total is the number of cloze-able entries (cloze-counts.json) in that level
// and category, so a bar can reach 100% even though entries without a sidecar item are not
// part of the mode. A free user's totals and rows cover only what their plan reaches (the
// same `isQuizEntryFree` rule as the quiz), and progress in a category they cannot open is
// not counted, like the other tabs (free-progress.ts).
//
// Levels, categories and types are resolved live from each id (`resolve`, normally
// `resolveEntry` from content-lookup.ts), never from stored snapshots. The resolver is
// injected so this module stays light and testable.

import type { CEFRLevel } from '$lib/types';
import { categoryLabel } from '$lib/vocab-helpers';
import { isQuizEntryFree, type QuizCategoryCount, type QuizEntryType } from '$lib/quiz-gate';
import type { QuizStat, QuizStatsMap } from '$lib/quiz-stats';
import type { ResolvedLocation } from '$lib/free-progress';

/** Correct answers needed before a word counts as mastered in context. */
export const CLOZE_MASTERED_MIN_CORRECT = 3;
/** Accuracy (correct / attempts, 0 to 1) needed alongside the minimum above. */
export const CLOZE_MASTERED_MIN_ACCURACY = 0.75;

/** Whether the counts of one word make it "mastered in context". */
export function isClozeMastered(stat: QuizStat): boolean {
  if (stat.attempts <= 0) return false;
  return (
    stat.correct >= CLOZE_MASTERED_MIN_CORRECT &&
    stat.correct / stat.attempts >= CLOZE_MASTERED_MIN_ACCURACY
  );
}

/** One bar: a category of one level and one content type. */
export interface ClozeStatRow {
  /** Category slug, unique within a level and type. */
  key: string;
  /** Display-ready name. */
  label: string;
  /** Opens a Sentences quiz scoped to this level and category. */
  href: string;
  /** Cloze-able entries the learner's plan reaches in this category. */
  total: number;
  /** Words answered at least once (never more than `total`). */
  practiced: number;
  /** Words mastered in context (never more than `practiced`). */
  mastered: number;
}

export interface ClozeLevelRows {
  vocab: ClozeStatRow[];
  uttrykk: ClozeStatRow[];
}

const TYPES: readonly QuizEntryType[] = ['vocab', 'uttrykk'];

/**
 * The Vocabulary and Uttrykk bars for one level. Rows with nothing to practise are left
 * out; rows are ordered by size (largest first), then by label. Ids that resolve nowhere
 * (entry removed), belong to another level, or sit in a row the plan does not reach are
 * not counted.
 */
export function clozeStatRowsForLevel(
  level: CEFRLevel,
  map: QuizStatsMap,
  counts: readonly QuizCategoryCount[],
  isPlus: boolean,
  resolve: (id: string) => ResolvedLocation | null | undefined
): ClozeLevelRows {
  const out: ClozeLevelRows = { vocab: [], uttrykk: [] };
  const byKey = new Map<string, ClozeStatRow>();

  for (const type of TYPES) {
    for (const c of counts) {
      if (c.level !== level) continue;
      const total = c[type];
      if (total <= 0) continue;
      if (!isPlus && !isQuizEntryFree(c, type)) continue;
      const row: ClozeStatRow = {
        key: c.category,
        label: categoryLabel(level, c.category),
        href: `/quiz?mode=sentences&level=${encodeURIComponent(level)}&category=${encodeURIComponent(c.category)}`,
        total,
        practiced: 0,
        mastered: 0
      };
      byKey.set(`${type}|${c.category}`, row);
      out[type].push(row);
    }
  }

  for (const [id, stat] of Object.entries(map)) {
    const loc = resolve(id);
    if (!loc || loc.level !== level) continue;
    const row = byKey.get(`${loc.type}|${loc.category}`);
    if (!row) continue;
    row.practiced++;
    if (isClozeMastered(stat)) row.mastered++;
  }

  for (const type of TYPES) {
    for (const row of out[type]) {
      // A stat for an entry that lost its sidecar item since must not push a bar past 100%.
      row.practiced = Math.min(row.practiced, row.total);
      row.mastered = Math.min(row.mastered, row.practiced);
    }
    out[type].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }

  return out;
}
