<script lang="ts">
  import { onMount } from 'svelte';
  import { State } from 'ts-fsrs';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import type { CEFRLevel, CardProgress } from '$lib/types';
  import { CATEGORIES_BY_LEVEL } from '$lib/types';
  import * as m from '$lib/paraglide/messages.js';

  // ── Vocab totals per category (build-time imports) ──────────────────────────────────
  import vocabA1 from '$lib/data/vocab-a1.json';
  import vocabA2 from '$lib/data/vocab-a2.json';
  import vocabB1 from '$lib/data/vocab-b1.json';
  import vocabB2 from '$lib/data/vocab-b2.json';
  import vocabC1 from '$lib/data/vocab-c1.json';
  import vocabC2 from '$lib/data/vocab-c2.json';
  import uttrykkA1 from '$lib/data/uttrykk-a1.json';
  import uttrykkA2 from '$lib/data/uttrykk-a2.json';
  import uttrykkB1 from '$lib/data/uttrykk-b1.json';
  import uttrykkB2 from '$lib/data/uttrykk-b2.json';

  interface Props {
    allCards: CardProgress[];
    levelTextColors: Record<CEFRLevel, string>;
    levelColors: Record<CEFRLevel, string>;
  }

  let { allCards, levelTextColors, levelColors }: Props = $props();

  const vocabByLevel: Record<string, { category: string }[]> = {
    A1: vocabA1 as { category: string }[],
    A2: vocabA2 as { category: string }[],
    B1: vocabB1 as { category: string }[],
    B2: vocabB2 as { category: string }[],
    C1: vocabC1 as { category: string }[],
    C2: vocabC2 as { category: string }[]
  };

  // Uttrykk entries live in separate files, not the main vocab JSONs.
  const uttrykkByLevel: Record<string, { category: string }[]> = {
    A1: uttrykkA1 as { category: string }[],
    A2: uttrykkA2 as { category: string }[],
    B1: uttrykkB1 as { category: string }[],
    B2: uttrykkB2 as { category: string }[]
  };

  function totalForCategory(level: string, category: string): number {
    if (category === 'uttrykk') {
      return (uttrykkByLevel[level] ?? []).length;
    }
    return (vocabByLevel[level] ?? []).filter((v) => v.category === category).length;
  }

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  interface CatBarStat {
    category: string;
    total: number;
    seen: number;
    review: number;
    learning: number;
    relearning: number;
    due: number;
  }

  interface LevelGroup {
    level: CEFRLevel;
    cats: CatBarStat[];
    totalSeen: number;
    totalCards: number;
  }

  const levelGroups = $derived<LevelGroup[]>(
    levels.map((level) => {
      const now = new Date();
      // Plus users use 'uttrykk' (full deck); 'uttrykk-preview' is a free-user alias
      // that redirects to 'uttrykk' for Plus — hide it to avoid a duplicate empty row.
      const cats: CatBarStat[] = CATEGORIES_BY_LEVEL[level]
        .filter((c) => c !== 'uttrykk-preview')
        .map((category) => {
          const catCards = allCards.filter((c) => c.level === level && c.category === category);
          return {
            category,
            total: totalForCategory(level, category),
            seen: catCards.length,
            review: catCards.filter((c) => c.fsrs.state === State.Review).length,
            learning: catCards.filter((c) => c.fsrs.state === State.Learning).length,
            relearning: catCards.filter((c) => c.fsrs.state === State.Relearning).length,
            due: catCards.filter((c) => new Date(c.fsrs.due) <= now).length
          };
        });

      return {
        level,
        cats,
        totalSeen: cats.reduce((s, c) => s + c.seen, 0),
        totalCards: cats.reduce((s, c) => s + c.total, 0)
      };
    })
  );

  const STORAGE_KEY = 'stats-category-expanded';

  const defaults: Record<CEFRLevel, boolean> = {
    A1: true,
    A2: true,
    B1: false,
    B2: false,
    C1: false,
    C2: false
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
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {lg.totalSeen} / {lg.totalCards} &middot; {overallPct}%
          </span>
        </div>
        <svg
          class="h-4 w-4 shrink-0 text-gray-400 transition-transform {isOpen ? 'rotate-180' : ''}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Category rows -->
      {#if isOpen}
        <div
          class="divide-y divide-gray-100 bg-white dark:divide-gray-700/60 dark:bg-indigo-950/60"
        >
          {#each lg.cats as cs (cs.category)}
            {@const seenPct = cs.total > 0 ? (cs.seen / cs.total) * 100 : 0}
            {@const reviewW = cs.seen > 0 ? (cs.review / cs.seen) * seenPct : 0}
            {@const learningW = cs.seen > 0 ? (cs.learning / cs.seen) * seenPct : 0}
            {@const relearningW = cs.seen > 0 ? (cs.relearning / cs.seen) * seenPct : 0}

            <a
              href="/{lg.level.toLowerCase()}/{cs.category}"
              class="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <!-- Category name -->
              <span
                class="w-36 shrink-0 truncate text-xs font-medium text-gray-700 group-hover:text-blue-600 sm:w-44 dark:text-gray-300 dark:group-hover:text-blue-400"
                title={removeHyphensAndCapitalize(cs.category)}
              >
                {removeHyphensAndCapitalize(cs.category)}
              </span>

              <!-- Progress bar: full width = 100% of vocab total -->
              <div class="relative min-w-0 flex-1">
                <div
                  class="h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40"
                  title="{cs.seen}/{cs.total} cards seen"
                >
                  <div class="flex h-full">
                    {#if reviewW > 0}
                      <div
                        class="h-full transition-all {levelColors[lg.level]}"
                        style="width: {reviewW}%"
                        title="{m.stats_review()}: {cs.review}"
                      ></div>
                    {/if}
                    {#if learningW > 0}
                      <div
                        class="h-full bg-yellow-400 transition-all"
                        style="width: {learningW}%"
                        title="{m.stats_learning()}: {cs.learning}"
                      ></div>
                    {/if}
                    {#if relearningW > 0}
                      <div
                        class="h-full bg-orange-400 transition-all"
                        style="width: {relearningW}%"
                        title="{m.stats_forgotten()}: {cs.relearning}"
                      ></div>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Seen / total count -->
              <span
                class="w-14 shrink-0 text-right text-xs text-gray-400 tabular-nums dark:text-gray-500"
              >
                {cs.seen}/{cs.total}
              </span>

              <!-- Due badge -->
              <span class="w-14 shrink-0 text-right">
                {#if cs.due > 0}
                  <span
                    class="inline-block rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400"
                  >
                    {cs.due} due
                  </span>
                {/if}
              </span>
            </a>
          {/each}
        </div>

        <!-- Legend -->
        <div
          class="flex flex-wrap gap-4 border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-400 dark:border-gray-700/60 dark:bg-indigo-900/40 dark:text-gray-500"
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
