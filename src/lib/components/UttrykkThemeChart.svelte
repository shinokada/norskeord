<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { State } from 'ts-fsrs';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import type { CEFRLevel, CardProgress } from '$lib/types';
  import { UTTRYKK_CATCHALL_THEME, UTTRYKK_THEME_LEVELS } from '$lib/config';
  import { UTTRYKK_C_KEYS, uttrykkCCategoryCounts } from '$lib/uttrykk-c-stats';
  import * as m from '$lib/paraglide/messages.js';

  // ── Uttrykk theme totals per level (build-time imports) ─────────────────────
  // C is handled separately below (cLevelGroup) — it has no `theme` field at
  // all (Phase 1 excluded it from the theme taxonomy), so its "themes" are
  // really its own real category slugs, sourced via uttrykk-c-stats.ts
  // instead of a theme lookup on these four files.
  import uttrykkA1 from '$lib/data/uttrykk-a1.json';
  import uttrykkA2 from '$lib/data/uttrykk-a2.json';
  import uttrykkB1 from '$lib/data/uttrykk-b1.json';
  import uttrykkB2 from '$lib/data/uttrykk-b2.json';

  interface Props {
    // Same reasoning as CategoryBarChart: CardProgress only ever stores
    // category: "uttrykk" for A1–B2 (never the theme, and never 'uttrykk' at
    // all for C — see cLevelGroup below), so resolving a seen card's
    // theme/category needs the map key (vocab_id, falling back to norsk —
    // see vocabKey() in progress.ts), not just the CardProgress object.
    // progressMap is passed directly rather than a plain CardProgress[] so
    // those keys survive.
    progressMap: Record<string, CardProgress>;
    levelTextColors: Record<CEFRLevel, string>;
    levelColors: Record<CEFRLevel, string>;
  }

  let { progressMap, levelTextColors, levelColors }: Props = $props();

  const progressEntries = $derived(Object.entries(progressMap));

  type UttrykkEntry = { id?: string; norsk: string; theme?: string };
  const uttrykkByLevel: Record<string, UttrykkEntry[]> = {
    A1: uttrykkA1 as UttrykkEntry[],
    A2: uttrykkA2 as UttrykkEntry[],
    B1: uttrykkB1 as UttrykkEntry[],
    B2: uttrykkB2 as UttrykkEntry[]
  };

  function totalForTheme(level: string, theme: string): number {
    return (uttrykkByLevel[level] ?? []).filter((v) => v.theme === theme).length;
  }

  /**
   * id|norsk → theme lookup, built fresh per level from the already-imported
   * uttrykkByLevel data. Mirrors vocabKey() in progress.ts so legacy pre-id
   * progress rows still resolve.
   */
  function themeLookupFor(level: string): SvelteMap<string, string> {
    const map = new SvelteMap<string, string>();
    for (const e of uttrykkByLevel[level] ?? []) {
      if (e.theme) map.set(e.id ?? e.norsk, e.theme);
    }
    return map;
  }

  interface ThemeStat {
    key: string; // theme (or, for C, category) slug — unique within a level
    label: string; // display name, formatted the same way category rows are
    href: string;
    total: number;
    seen: number;
    review: number;
    learning: number;
    relearning: number;
    due: number;
  }

  interface LevelGroup {
    level: CEFRLevel;
    themes: ThemeStat[];
    totalSeen: number;
    totalCards: number;
  }

  function buildStat(
    key: string,
    label: string,
    href: string,
    total: number,
    cards: CardProgress[],
    now: Date
  ): ThemeStat {
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

  const uttrykkThemeLevelGroups = $derived<LevelGroup[]>(
    UTTRYKK_THEME_LEVELS.map((level) => {
      const now = new Date();
      const lvl = level.toLowerCase();

      const themeCounts = new SvelteMap<string, number>();
      for (const e of uttrykkByLevel[level] ?? []) {
        if (e.theme) themeCounts.set(e.theme, (themeCounts.get(e.theme) ?? 0) + 1);
      }

      const lookup = themeLookupFor(level);
      const cardsByTheme = new SvelteMap<string, CardProgress[]>();
      for (const [key, card] of progressEntries) {
        if (card.level === level && card.category === 'uttrykk') {
          // A card whose entry no longer resolves (deleted/renamed since it
          // was studied) still gets counted, under the catch-all theme,
          // rather than silently dropped from the level's totals.
          const theme = lookup.get(key) ?? UTTRYKK_CATCHALL_THEME;
          const list = cardsByTheme.get(theme) ?? [];
          list.push(card);
          cardsByTheme.set(theme, list);
        }
      }

      const themeKeys = new Set<string>([...themeCounts.keys(), ...cardsByTheme.keys()]);

      const themes = [...themeKeys]
        .map((theme) => ({ theme, count: themeCounts.get(theme) ?? 0 }))
        .sort((a, b) => b.count - a.count)
        .map(({ theme }) =>
          buildStat(
            theme,
            theme,
            `/${lvl}/uttrykk?theme=${theme}`,
            totalForTheme(level, theme),
            cardsByTheme.get(theme) ?? [],
            now
          )
        );

      return {
        level,
        themes,
        totalSeen: themes.reduce((s, c) => s + c.seen, 0),
        totalCards: themes.reduce((s, c) => s + c.total, 0)
      };
    })
  );

  /**
   * C row: C has no `theme` field and no dedicated `/c/uttrykk` route
   * (Phase 4 merges uttrykk-c.json straight into the matching c/{category}
   * vocab page instead of shipping a separate route — see
   * ai-docs/implementation/uttrykk-category.md). So its "themes" are its own
   * real category slugs, sourced from uttrykk-c.json's `category` field via
   * uttrykk-c-stats.ts, and each row links to the merged c/{category} page
   * rather than a `?theme=` query param.
   */
  const cLevelGroup = $derived.by<LevelGroup>(() => {
    const now = new Date();
    const categoryCounts = uttrykkCCategoryCounts();

    const cardsByCategory = new SvelteMap<string, CardProgress[]>();
    for (const [key, card] of progressEntries) {
      if (card.level === 'C' && UTTRYKK_C_KEYS.has(key)) {
        const list = cardsByCategory.get(card.category) ?? [];
        list.push(card);
        cardsByCategory.set(card.category, list);
      }
    }

    const categoryKeys = new Set<string>([...categoryCounts.keys(), ...cardsByCategory.keys()]);

    const themes = [...categoryKeys]
      .map((category) => ({ category, count: categoryCounts.get(category) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .map(({ category }) =>
        buildStat(
          category,
          category,
          `/c/${category}`,
          categoryCounts.get(category) ?? 0,
          cardsByCategory.get(category) ?? [],
          now
        )
      );

    return {
      level: 'C',
      themes,
      totalSeen: themes.reduce((s, c) => s + c.seen, 0),
      totalCards: themes.reduce((s, c) => s + c.total, 0)
    };
  });

  const levelGroups = $derived<LevelGroup[]>([...uttrykkThemeLevelGroups, cLevelGroup]);

  const STORAGE_KEY = 'stats-uttrykk-theme-expanded';

  const defaults: Record<CEFRLevel, boolean> = {
    A1: true,
    A2: true,
    B1: false,
    B2: false,
    C: false
  };

  let expanded = $state<Record<CEFRLevel, boolean>>({ ...defaults });

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) expanded = { ...defaults, ...JSON.parse(saved) };
    } catch {
      /* ignore */
    }
  });

  function toggle(level: CEFRLevel) {
    expanded[level] = !expanded[level];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
    } catch {
      /* ignore */
    }
  }
</script>

<div class="space-y-3">
  {#each levelGroups as lg (lg.level)}
    {@const isOpen = expanded[lg.level]}
    {@const overallPct = lg.totalCards > 0 ? Math.round((lg.totalSeen / lg.totalCards) * 100) : 0}

    <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
      <!-- Level accordion header -->
      <button
        class="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60"
        onclick={() => toggle(lg.level)}
        aria-expanded={isOpen}
      >
        <div class="flex items-center gap-3">
          <span class="w-8 text-sm font-bold {levelTextColors[lg.level]}">{lg.level}</span>
          <!-- Mini overall progress pill -->
          <div class="h-2 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-indigo-900/60">
            <div
              class="h-full rounded-full transition-all {levelColors[lg.level]}"
              style="width: {overallPct}%"
            ></div>
          </div>
          <span class="text-xs text-gray-600 dark:text-gray-300">
            {lg.totalSeen} / {lg.totalCards} &middot; {overallPct}%
          </span>
        </div>
        <svg
          class="h-4 w-4 shrink-0 text-gray-700 dark:text-gray-300 transition-transform {isOpen
            ? 'rotate-180'
            : ''}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Theme rows -->
      {#if isOpen}
        <div
          class="divide-y divide-gray-100 bg-white dark:divide-gray-700/60 dark:bg-indigo-950/60"
        >
          {#each lg.themes as ts (ts.key)}
            {@const seenPct = ts.total > 0 ? (ts.seen / ts.total) * 100 : 0}
            {@const reviewW = ts.seen > 0 ? (ts.review / ts.seen) * seenPct : 0}
            {@const learningW = ts.seen > 0 ? (ts.learning / ts.seen) * seenPct : 0}
            {@const relearningW = ts.seen > 0 ? (ts.relearning / ts.seen) * seenPct : 0}

            <a
              href={ts.href}
              class="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <!-- Theme name -->
              <span
                class="w-36 shrink-0 truncate text-xs font-medium text-gray-700 group-hover:text-blue-600 sm:w-44 dark:text-gray-300 dark:group-hover:text-blue-400"
                title={removeHyphensAndCapitalize(ts.label)}
              >
                {removeHyphensAndCapitalize(ts.label)}
              </span>

              <!-- Progress bar: full width = 100% of theme total -->
              <div class="relative min-w-0 flex-1">
                <div
                  class="h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40"
                  title="{ts.seen}/{ts.total} cards seen"
                >
                  <div class="flex h-full">
                    {#if reviewW > 0}
                      <div
                        class="h-full transition-all {levelColors[lg.level]}"
                        style="width: {reviewW}%"
                        title="{m.stats_review()}: {ts.review}"
                      ></div>
                    {/if}
                    {#if learningW > 0}
                      <div
                        class="h-full bg-yellow-400 transition-all"
                        style="width: {learningW}%"
                        title="{m.stats_learning()}: {ts.learning}"
                      ></div>
                    {/if}
                    {#if relearningW > 0}
                      <div
                        class="h-full bg-orange-400 transition-all"
                        style="width: {relearningW}%"
                        title="{m.stats_forgotten()}: {ts.relearning}"
                      ></div>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Seen / total count -->
              <span
                class="w-14 shrink-0 text-right text-xs text-gray-700 tabular-nums dark:text-gray-300"
              >
                {ts.seen}/{ts.total}
              </span>

              <!-- Due badge -->
              <span class="w-14 shrink-0 text-right">
                {#if ts.due > 0}
                  <span
                    class="inline-block rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400"
                  >
                    {ts.due} due
                  </span>
                {/if}
              </span>
            </a>
          {/each}
        </div>

        <!-- Legend -->
        <div
          class="flex flex-wrap gap-4 border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-700 dark:border-gray-700/60 dark:bg-indigo-900/40 dark:text-gray-300"
        >
          <span class="flex items-center gap-1.5">
            <span class="inline-block h-2 w-3 rounded-sm {levelColors[lg.level]}"></span>
            {m.stats_review()}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block h-2 w-3 rounded-sm bg-yellow-400"></span>
            {m.stats_learning()}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block h-2 w-3 rounded-sm bg-orange-400"></span>
            {m.stats_forgotten()}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block h-2 w-3 rounded-sm bg-gray-100 dark:bg-gray-700"></span>
            {m.stats_new()}
          </span>
        </div>
      {/if}
    </div>
  {/each}
</div>
