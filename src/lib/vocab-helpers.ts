// src/lib/vocab-helpers.ts
// Utility functions for VocabEntry and GrammarQuestion.
// Kept separate from types.ts so types.ts stays declaration-only.

import type { VocabEntry, FlashcardLanguage, GrammarQuestion, CEFRLevel } from '$lib/types';
import * as m from '$lib/paraglide/messages.js';
import { removeHyphensAndCapitalize } from '$lib/utils';

// ── Vocab ────────────────────────────────────────────────────────────────────

/**
 * Returns the translation of a vocab entry in the given flashcard language,
 * falling back to English when the field is missing (e.g. B2/C entries that
 * haven't been translated yet).
 */
export function getTranslation(entry: VocabEntry, language: FlashcardLanguage): string {
  if (language === 'english') return entry.english;
  return entry[language] ?? entry.english;
}

export function getExampleTranslation(
  entry: VocabEntry,
  language: FlashcardLanguage
): string | undefined {
  if (language === 'english') return entry.example_english;
  return entry[`example_${language}` as keyof VocabEntry] as string | undefined;
}

/**
 * Phase 2 (ai-docs/implementation/quiz-i18n-and-categories.md): the single,
 * centralized lookup for a category slug's display name. Reads the existing
 * `category_{level}_{slug}` Paraglide keys — the same mechanism
 * `themeLabel()` in `[level]/[category]/+page.svelte` already uses for the
 * uttrykk theme breadcrumb — instead of a hand-maintained plain-object map.
 * Every slug in `CATEGORIES_BY_LEVEL` has a key in all five locales; the
 * raw-slug title-case fallback below is a last resort for a slug that isn't
 * covered (which shouldn't happen once every level's slugs have keys).
 *
 * `level` is case-insensitive ('A1' or 'a1' both work). `slug` uses hyphens
 * as stored in `CATEGORIES_BY_LEVEL` (e.g. 'days-months') — this function
 * does the hyphen→underscore translation the generated message keys need.
 */
export function categoryLabel(level: string, slug: string): string {
  const key = `category_${level.toLowerCase()}_${slug.replace(/-/g, '_')}` as keyof typeof m;
  const fn = m[key];
  if (typeof fn === 'function') {
    return (fn as () => string)();
  }
  return removeHyphensAndCapitalize(slug);
}

// ── Grammar ──────────────────────────────────────────────────────────────────

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

/** The CEFR level a question is tagged with, as a single-item array (kept for
 * callers that aggregate across multiple questions, e.g. topicLevels). */
export function questionLevels(q: GrammarQuestion): CEFRLevel[] {
  return [q.cefr];
}

/**
 * The sorted, de-duplicated set of CEFR levels covered by a list of questions.
 * Used to show level badges on a topic card.
 */
export function topicLevels(questions: GrammarQuestion[]): CEFRLevel[] {
  const set = new Set<CEFRLevel>();
  for (const q of questions) for (const l of questionLevels(q)) set.add(l);
  return CEFR_ORDER.filter((l) => set.has(l));
}

// ── Uttrykk themes (Phase 3/3b, ai-docs/implementation/uttrykk-category.md) ──

/**
 * Themes with fewer than this many entries get bucketed into a single
 * "Others" chip instead of their own pill, on both the `/learn/[level]` hub
 * and (if ever re-added) the `/{level}/uttrykk` page itself. Keeps the chip
 * row from ballooning to 15+ pills for levels with a long tail of tiny
 * themes (see A1: several themes at count 1–2).
 */
export const UTTRYKK_OTHERS_THRESHOLD = 5;

export const UTTRYKK_OTHERS_THEME = 'others';

export interface ThemeCount {
  theme: string;
  count: number;
}

/**
 * Splits a level's theme breakdown into "major" themes (their own chip) and
 * "minor" themes (rolled into a single Others bucket). Both the display
 * layer (hub page pills) and the server-side `?theme=others` filter (in
 * `[level]/[category]/+page.server.ts`) call this so the two stay in sync —
 * a theme is never shown as "Others" on the hub but filtered as if it were a
 * real theme slug when clicked, or vice versa.
 */
export function partitionUttrykkThemes(themes: ThemeCount[]): {
  major: ThemeCount[];
  minor: ThemeCount[];
  othersCount: number;
} {
  const major = themes.filter((t) => t.count >= UTTRYKK_OTHERS_THRESHOLD);
  const minor = themes.filter((t) => t.count < UTTRYKK_OTHERS_THRESHOLD);
  const othersCount = minor.reduce((sum, t) => sum + t.count, 0);
  return { major, minor, othersCount };
}
