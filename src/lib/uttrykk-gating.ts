// src/lib/uttrykk-gating.ts
// Free-tier theme allow-list for A1–B2 Uttrykk decks — see
// ai-docs/implementation/uttrykk-gate.md for the full rationale.
//
// Kept as its own small module (mirrors src/lib/uttrykk-c-stats.ts) rather
// than folded into config.ts, since config.ts's own header says it holds
// "pure constants... no runtime logic" derived from the domain model — this
// is a hand-curated allow-list, not a derived constant, and deliberately
// NOT "top N themes by count" (that formula breaks badly at B2, where
// `idioms` alone is 80% of the deck — see the doc).

import type { UttrykkThemeLevel } from '$lib/config';

/**
 * 2–3 curated themes per level that are free to study in full (real
 * entries, real FSRS — not a separate preview file). Every other theme is
 * Plus-only. Never includes `general` (the catch-all bucket — a poor first
 * impression) and deliberately excludes any single theme that would
 * dominate a deck (e.g. B2's `idioms`, 541/679 entries).
 *
 * Sized roughly to each level's existing *vocabulary* free ratio so Uttrykk
 * doesn't feel oddly more or less generous than the rest of that level:
 * A1/A2 vocab is 100% free today, B1 ~27%, B2 ~9%.
 *
 * A1 is intentionally empty: it's opened fully instead (see
 * `isFreeUttrykkTheme` below) rather than curated here — A1 vocab is
 * already 100% free, so a partial Uttrykk wall at that level was an
 * inconsistent first impression. Kept as a key (rather than removed) so
 * this stays a `Record<UttrykkThemeLevel, ...>` — every level with a real
 * theme taxonomy has an entry here, even one that's now unused.
 */
export const FREE_UTTRYKK_THEMES: Record<UttrykkThemeLevel, readonly string[]> = {
  A1: [],
  A2: ['idioms', 'opinion-formulas'],
  B1: ['discourse-markers', 'opinion-formulas', 'personal-growth'],
  B2: ['discourse-markers', 'work-career']
};

/**
 * Whether a given theme is free to study in full at this level.
 * A1 is fully open (every theme, and `theme === null` i.e. "study all" /
 * the Others bucket) — see the note on FREE_UTTRYKK_THEMES above.
 */
export function isFreeUttrykkTheme(level: UttrykkThemeLevel, theme: string | null): boolean {
  if (level === 'A1') return true;
  if (!theme) return false;
  return FREE_UTTRYKK_THEMES[level].includes(theme);
}
