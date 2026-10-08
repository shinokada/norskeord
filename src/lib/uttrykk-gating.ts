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
 * Free-to-study uttrykk themes per level (real entries, real FSRS — not a
 * separate preview file). Under the free-tier simplification
 * (ai-docs/implementation/free-tier-simplification.md) every level is empty:
 * A1 is opened fully via `isFreeUttrykkTheme` below, and A2–B2 uttrykk is
 * Plus-only. The record stays (rather than being removed) so it remains a
 * `Record<UttrykkThemeLevel, ...>` and a theme can be freed again by adding
 * it here. Never include `general` (the catch-all bucket) or a theme that
 * would dominate a deck (e.g. B2's `idioms`, 541/679 entries).
 */
export const FREE_UTTRYKK_THEMES: Record<UttrykkThemeLevel, readonly string[]> = {
  A1: [],
  A2: [],
  B1: [],
  B2: []
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
