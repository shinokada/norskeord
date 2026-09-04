// src/lib/stats.ts
// Per-level, per-content-type stat builders for the restructured /stats page
// (ai-docs/implementation/stats-page-improvement.md, Phase 1).
//
// Each of vocabCategoryStatsForLevel / uttrykkThemeStatsForLevel /
// grammarTopicStatsForLevel scopes an existing all-levels builder (previously
// inline in the old CategoryBarChart.svelte / UttrykkThemeChart.svelte / the
// old grammarByTopic in stats/+page.svelte, all since removed) down to a
// single CEFRLevel, and all three return the same StatRow shape so Phase 2's
// shared row-list component can render any of them identically.
import { State } from 'ts-fsrs';
import type { CardProgress, CEFRLevel, GrammarTopic } from '$lib/types';
import { CATEGORIES_BY_LEVEL, UTTRYKK_CATCHALL_THEME } from '$lib/config';
import { UTTRYKK_C_KEYS, uttrykkCCategoryCounts } from '$lib/uttrykk-c-stats';
import {
  partitionUttrykkThemes,
  UTTRYKK_OTHERS_THEME,
  categoryLabel,
  type ThemeCount
} from '$lib/vocab-helpers';
import { GRAMMAR_RULES } from '$lib/grammar/rules';
import grammarTopicIndex from '$lib/data/grammar-topic-index.json';

import vocabA1 from '$lib/data/vocab-a1.json';
import vocabA2 from '$lib/data/vocab-a2.json';
import vocabB1 from '$lib/data/vocab-b1.json';
import vocabB2 from '$lib/data/vocab-b2.json';
import vocabC from '$lib/data/vocab-c.json';

import uttrykkA1 from '$lib/data/uttrykk-a1.json';
import uttrykkA2 from '$lib/data/uttrykk-a2.json';
import uttrykkB1 from '$lib/data/uttrykk-b1.json';
import uttrykkB2 from '$lib/data/uttrykk-b2.json';

/**
 * Shared row shape for the per-level Vocab / Uttrykk / Grammar breakdowns.
 * Identical to the CatBarStat/ThemeStat shapes formerly inline in
 * CategoryBarChart.svelte / UttrykkThemeChart.svelte (both removed) —
 * unified here so all three content types render through one component.
 *
 * `label` is pre-formatted for display (removeHyphensAndCapitalize already
 * applied to vocab/uttrykk slugs; grammar titles are already display text)
 * so the rendering component never needs to know which content type built
 * the row.
 */
export interface StatRow {
  key: string; // category / theme / topic slug — unique within a level
  label: string; // display-ready name
  href: string; // row link target
  total: number;
  seen: number;
  review: number;
  learning: number;
  relearning: number;
  due: number;
}

/**
 * Which content type LevelStatRows' due-badge link should scope a review
 * session to (Step 4c, ai-docs/implementation/due-only.md, extended for
 * grammar in Fix 3 of due-only-review-update.md).
 */
export type ReviewType = 'vocab' | 'uttrykk' | 'grammar';

/**
 * Builds the due-badge's review href for one row (LevelStatRows.svelte),
 * or null when this row shouldn't link anywhere — no `reviewType`/`level`
 * given, or a synthetic "Others" bucket that isn't a real category/theme.
 * Pure/extracted so it's unit-testable without mounting the component (see
 * stats.test.ts) — LevelStatRows.svelte just calls this per row.
 *
 * Grammar rows (Fix 3) go to the separate `/review/grammar` route (grammar
 * was deliberately kept out of the combined vocab+uttrykk `/review` flow —
 * see the Open Questions resolution in due-only-review-update.md) with a
 * `topic` param, since `row.key` for a grammar row is a real `GrammarTopic`
 * that lines up exactly with `CardProgress.category` there — no theme
 * workaround needed.
 *
 * For vocab/uttrykk, always includes `&category={row.key}` when reviewType
 * is set (Fix 2) — `/review` handles scoping it correctly downstream
 * regardless of which kind of row this is: `row.key` lines up with
 * `CardProgress.category` for vocab rows and C's uttrykk rows (real
 * category slugs), so `getDueItems()` can scope by it directly there.
 * A1–B2 uttrykk rows are keyed by *theme*, which isn't stored on
 * `CardProgress` at all (every A1–B2 uttrykk card's `category` is the
 * literal 'uttrykk' sentinel) — for those, `/review` fetches the whole
 * level+type and filters the *resolved* entries by `theme` afterward,
 * since `theme` only exists on the resolved `VocabEntry`, not on
 * `CardProgress`.
 */
export function buildReviewHref(
  row: StatRow,
  level: CEFRLevel | undefined,
  reviewType: ReviewType | undefined
): string | null {
  if (!reviewType || !level) return null;
  if (row.key === UTTRYKK_OTHERS_THEME) return null;
  const lvl = encodeURIComponent(level.toLowerCase());
  if (reviewType === 'grammar') {
    return `/review/grammar?level=${lvl}&topic=${encodeURIComponent(row.key)}`;
  }
  return `/review?level=${lvl}&type=${encodeURIComponent(reviewType)}&category=${encodeURIComponent(row.key)}`;
}

function buildStatRow(
  key: string,
  label: string,
  href: string,
  total: number,
  cards: CardProgress[],
  now: Date
): StatRow {
  return {
    key,
    label,
    href,
    total,
    seen: cards.length,
    review: cards.filter((c) => c.fsrs.state === State.Review).length,
    learning: cards.filter((c) => c.fsrs.state === State.Learning).length,
    relearning: cards.filter((c) => c.fsrs.state === State.Relearning).length,
    due: cards.filter((c) => new Date(c.fsrs.due) <= now).length
  };
}

// ── Vocabulary — category rows for one level ────────────────────────────────

const vocabByLevel: Record<CEFRLevel, { category: string }[]> = {
  A1: vocabA1 as { category: string }[],
  A2: vocabA2 as { category: string }[],
  B1: vocabB1 as { category: string }[],
  B2: vocabB2 as { category: string }[],
  C: vocabC as { category: string }[]
};

/**
 * Category breakdown for one CEFR level. 'uttrykk' is excluded — it belongs
 * to uttrykkThemeStatsForLevel instead. For C, cards whose progress key
 * matches an uttrykk-c.json entry are excluded too (they belong to the
 * Uttrykk block for C — see uttrykk-c-stats.ts).
 */
export function vocabCategoryStatsForLevel(
  level: CEFRLevel,
  progressMap: Record<string, CardProgress>
): StatRow[] {
  const now = new Date();
  const lvl = level.toLowerCase();

  const levelCards = Object.entries(progressMap)
    .filter(([key, c]) => c.level === level && !(level === 'C' && UTTRYKK_C_KEYS.has(key)))
    .map(([, c]) => c);

  return CATEGORIES_BY_LEVEL[level]
    .filter((category) => category !== 'uttrykk')
    .map((category) => {
      const catCards = levelCards.filter((c) => c.category === category);
      const total = vocabByLevel[level].filter((v) => v.category === category).length;
      return buildStatRow(
        category,
        categoryLabel(level, category),
        `/${lvl}/${category}`,
        total,
        catCards,
        now
      );
    });
}

// ── Uttrykk — theme rows for one level ──────────────────────────────────────

type UttrykkEntry = { id?: string; norsk: string; theme?: string };

const uttrykkByLevel: Partial<Record<CEFRLevel, UttrykkEntry[]>> = {
  A1: uttrykkA1 as UttrykkEntry[],
  A2: uttrykkA2 as UttrykkEntry[],
  B1: uttrykkB1 as UttrykkEntry[],
  B2: uttrykkB2 as UttrykkEntry[]
};

/**
 * Theme breakdown for one CEFR level. A1–B2 use the `theme` field on
 * uttrykk-{level}.json; C has no theme field, so its rows are its own real
 * category slugs (via uttrykk-c-stats.ts), same as the C row in the old
 * UttrykkThemeChart.svelte (removed).
 */
export function uttrykkThemeStatsForLevel(
  level: CEFRLevel,
  progressMap: Record<string, CardProgress>
): StatRow[] {
  const now = new Date();

  if (level === 'C') {
    const categoryCounts = uttrykkCCategoryCounts();
    const cardsByCategory = new Map<string, CardProgress[]>();
    for (const [key, card] of Object.entries(progressMap)) {
      if (card.level === 'C' && UTTRYKK_C_KEYS.has(key)) {
        const list = cardsByCategory.get(card.category) ?? [];
        list.push(card);
        cardsByCategory.set(card.category, list);
      }
    }
    const keys = new Set<string>([...categoryCounts.keys(), ...cardsByCategory.keys()]);
    const categoryList: ThemeCount[] = [...keys].map((theme) => ({
      theme,
      count: categoryCounts.get(theme) ?? 0
    }));

    // Same UTTRYKK_OTHERS_THRESHOLD bucketing the /learn/[level] hub uses
    // (Phase 8, uttrykk-category.md) — C has 37 category slugs, many with
    // only a handful of entries, so without this every one gets its own
    // tiny row here. Unlike A1-B2's Others row, C has no per-theme
    // query-param filter (Phase 9 deliberately didn't add one — C's real
    // browse dimension is its categories, already linked individually
    // below), so the combined row links to the /c/uttrykk "study all" deck
    // instead of a filtered subset.
    const { major, minor, othersCount } = partitionUttrykkThemes(categoryList);

    const rows = major
      .sort((a, b) => b.count - a.count)
      .map(({ theme: category }) =>
        buildStatRow(
          category,
          categoryLabel(level, category),
          `/c/${category}`,
          categoryCounts.get(category) ?? 0,
          cardsByCategory.get(category) ?? [],
          now
        )
      );

    if (minor.length > 0) {
      const othersCards = minor.flatMap(({ theme }) => cardsByCategory.get(theme) ?? []);
      rows.push(
        buildStatRow(
          UTTRYKK_OTHERS_THEME,
          categoryLabel(level, UTTRYKK_OTHERS_THEME),
          `/c/uttrykk`,
          othersCount,
          othersCards,
          now
        )
      );
    }

    return rows;
  }

  const lvl = level.toLowerCase();
  const entries = uttrykkByLevel[level] ?? [];

  const themeCounts = new Map<string, number>();
  for (const e of entries) {
    if (e.theme) themeCounts.set(e.theme, (themeCounts.get(e.theme) ?? 0) + 1);
  }

  const lookup = new Map<string, string>();
  for (const e of entries) {
    if (e.theme) lookup.set(e.id ?? e.norsk, e.theme);
  }

  const cardsByTheme = new Map<string, CardProgress[]>();
  for (const [key, card] of Object.entries(progressMap)) {
    if (card.level === level && card.category === 'uttrykk') {
      const theme = lookup.get(key) ?? UTTRYKK_CATCHALL_THEME;
      const list = cardsByTheme.get(theme) ?? [];
      list.push(card);
      cardsByTheme.set(theme, list);
    }
  }

  const themeKeys = new Set<string>([...themeCounts.keys(), ...cardsByTheme.keys()]);
  const themeList: ThemeCount[] = [...themeKeys].map((theme) => ({
    theme,
    count: themeCounts.get(theme) ?? 0
  }));

  // Bucket small themes into one "Others" row, same UTTRYKK_OTHERS_THRESHOLD
  // and UTTRYKK_OTHERS_THEME the /learn/[level] hub uses (Phase 3b,
  // uttrykk-category.md) — keeps /stats consistent with the hub instead of
  // listing a long tail of tiny rows. Links to `?theme=others`, which
  // [level]/[category]/+page.server.ts already resolves via the same
  // partitionUttrykkThemes() call, so the deep link works with no
  // server-side changes.
  const { major, minor, othersCount } = partitionUttrykkThemes(themeList);

  const rows = major
    .sort((a, b) => b.count - a.count)
    .map(({ theme }) =>
      buildStatRow(
        theme,
        categoryLabel(level, theme),
        `/${lvl}/uttrykk?theme=${theme}`,
        themeCounts.get(theme) ?? 0,
        cardsByTheme.get(theme) ?? [],
        now
      )
    );

  if (minor.length > 0) {
    const othersCards = minor.flatMap(({ theme }) => cardsByTheme.get(theme) ?? []);
    rows.push(
      buildStatRow(
        UTTRYKK_OTHERS_THEME,
        categoryLabel(level, UTTRYKK_OTHERS_THEME),
        `/${lvl}/uttrykk?theme=${UTTRYKK_OTHERS_THEME}`,
        othersCount,
        othersCards,
        now
      )
    );
  }

  return rows;
}

// ── Grammar — topic rows for one level (new) ────────────────────────────────

type GrammarTopicIndexEntry = {
  levels: CEFRLevel[];
  countsByLevel: Partial<Record<CEFRLevel, number>>;
  total: number;
};

/**
 * Total question count per topic, per CEFR level — derived from the
 * grammar-topic-index.json build artifact (scripts/build-grammar-level-index.mjs)
 * instead of loading every question from grammar.json, since only the counts
 * are needed here. Drives both `total` (the row's denominator) and which
 * topics even appear under a given level tab: a topic with zero questions at
 * this level (e.g. 'ubestemt-artikkel-c', C-only) is omitted rather than
 * shown as an empty row.
 */
const grammarTotalsByLevel: Record<CEFRLevel, Partial<Record<GrammarTopic, number>>> = {
  A1: {},
  A2: {},
  B1: {},
  B2: {},
  C: {}
};
for (const [topic, entry] of Object.entries(
  grammarTopicIndex as Record<string, GrammarTopicIndexEntry>
)) {
  for (const [level, count] of Object.entries(entry.countsByLevel) as [CEFRLevel, number][]) {
    grammarTotalsByLevel[level][topic as GrammarTopic] = count;
  }
}

/**
 * Topic breakdown for one CEFR level. Only includes topics that actually
 * have questions at this level (see grammarTotalsByLevel) — a topic whose
 * questions are all, say, B2 never shows up under the A1 tab.
 *
 * `isNb` selects the locale for topics outside Nivå C; C topics are always
 * shown in Norwegian (mirrors the forceNb rule in
 * routes/grammar/[topic]/+page.svelte — Nivå C content is hardcoded NB, see
 * ai-docs/implementation/c-grammar-norsk-instruksjoner.md).
 */
export function grammarTopicStatsForLevel(
  level: CEFRLevel,
  grammarMap: Record<string, CardProgress>,
  isNb: boolean
): StatRow[] {
  const now = new Date();
  const totalsForLevel = grammarTotalsByLevel[level];

  const cardsByTopic = new Map<string, CardProgress[]>();
  for (const card of Object.values(grammarMap)) {
    if (card.level !== level) continue;
    const topic = card.category as string;
    const list = cardsByTopic.get(topic) ?? [];
    list.push(card);
    cardsByTopic.set(topic, list);
  }

  return Object.values(GRAMMAR_RULES)
    .filter((rule) => (totalsForLevel[rule.id] ?? 0) > 0)
    .map((rule) => {
      const title = level === 'C' ? rule.titleNb : isNb ? rule.titleNb : rule.titleEn;
      return buildStatRow(
        rule.id,
        title,
        `/grammar/${rule.id}`,
        totalsForLevel[rule.id] ?? 0,
        cardsByTopic.get(rule.id) ?? [],
        now
      );
    });
}
