<script lang="ts">
  import { onMount } from 'svelte';
  import { loadProgressMap, countDueToday } from '$lib/progress';
  import { CATEGORIES_BY_LEVEL } from '$lib/types';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import { State } from 'ts-fsrs';
  import type { CardProgress, CEFRLevel } from '$lib/types';
  import * as m from '$lib/paraglide/messages.js';

  // ── State ────────────────────────────────────────────────────────────────────
  let progressMap = $state<Record<string, CardProgress>>({});
  let confirmReset = $state(false);
  let sortBy = $state<'due' | 'new'>('due');
  let mounted = $state(false);

  // ── Derived totals ────────────────────────────────────────────────────────────
  const allCards = $derived(Object.values(progressMap));
  const totalSeen = $derived(allCards.length);
  const dueToday = $derived(countDueToday(progressMap));

  const byState = $derived({
    learning: allCards.filter((c) => c.fsrs.state === State.Learning).length,
    review: allCards.filter((c) => c.fsrs.state === State.Review).length,
    relearning: allCards.filter((c) => c.fsrs.state === State.Relearning).length
  });

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  const levelColors: Record<CEFRLevel, string> = {
    A1: 'bg-green-500',
    A2: 'bg-teal-500',
    B1: 'bg-blue-500',
    B2: 'bg-indigo-500',
    C1: 'bg-purple-500',
    C2: 'bg-pink-500'
  };

  const levelTextColors: Record<CEFRLevel, string> = {
    A1: 'text-green-700 dark:text-green-400',
    A2: 'text-teal-700 dark:text-teal-400',
    B1: 'text-blue-700 dark:text-blue-400',
    B2: 'text-indigo-700 dark:text-indigo-400',
    C1: 'text-purple-700 dark:text-purple-400',
    C2: 'text-pink-700 dark:text-pink-400'
  };

  interface LevelStat {
    level: CEFRLevel;
    seen: number;
    learning: number;
    review: number;
    relearning: number;
    due: number;
  }

  const levelStats = $derived<LevelStat[]>(
    levels.map((level) => {
      const cards = allCards.filter((c) => c.level === level);
      const now = new Date();
      return {
        level,
        seen: cards.length,
        learning: cards.filter((c) => c.fsrs.state === State.Learning).length,
        review: cards.filter((c) => c.fsrs.state === State.Review).length,
        relearning: cards.filter((c) => c.fsrs.state === State.Relearning).length,
        due: cards.filter((c) => new Date(c.fsrs.due) <= now).length
      };
    })
  );

  // ── CEFR estimate ─────────────────────────────────────────────────────────────
  const categoryCountByLevel: Record<CEFRLevel, number> = {
    A1: CATEGORIES_BY_LEVEL.A1.length,
    A2: CATEGORIES_BY_LEVEL.A2.length,
    B1: CATEGORIES_BY_LEVEL.B1.length,
    B2: CATEGORIES_BY_LEVEL.B2.length,
    C1: CATEGORIES_BY_LEVEL.C1.length,
    C2: CATEGORIES_BY_LEVEL.C2.length
  };

  function getCefrEstimate(cards: CardProgress[]): string {
    const seenCategoriesByLevel: Record<CEFRLevel, Set<string>> = {
      A1: new Set(),
      A2: new Set(),
      B1: new Set(),
      B2: new Set(),
      C1: new Set(),
      C2: new Set()
    };
    for (const card of cards) {
      seenCategoriesByLevel[card.level].add(card.category);
    }

    const coverage = levels.map((level) => ({
      level,
      pct: Math.min(
        100,
        Math.round((seenCategoriesByLevel[level].size / categoryCountByLevel[level]) * 100)
      )
    }));

    let solidLevel: CEFRLevel | null = null;
    let growingLevel: CEFRLevel | null = null;
    for (const { level, pct } of coverage) {
      if (pct >= 50) solidLevel = level;
      else if (pct > 0 && !growingLevel) growingLevel = level;
    }

    if (!solidLevel && !growingLevel) {
      return m.stats_cefr_no_cards();
    }
    if (solidLevel && growingLevel) {
      const sPct = coverage.find((c) => c.level === solidLevel)?.pct ?? 0;
      const gPct = coverage.find((c) => c.level === growingLevel)?.pct ?? 0;
      return m.stats_cefr_solid_and_growing({
        solidPct: String(sPct),
        solidLevel,
        growingPct: String(gPct),
        growingLevel
      });
    }
    if (solidLevel) {
      const sPct = coverage.find((c) => c.level === solidLevel)?.pct ?? 0;
      return m.stats_cefr_solid_only({ solidPct: String(sPct), solidLevel });
    }
    const a1pct = coverage.find((c) => c.level === 'A1')?.pct ?? 0;
    const a2pct = coverage.find((c) => c.level === 'A2')?.pct ?? 0;
    return m.stats_cefr_getting_started({ a1pct: String(a1pct), a2pct: String(a2pct) });
  }

  const cefrEstimate = $derived(getCefrEstimate(allCards));

  // ── Per-category stats ────────────────────────────────────────────────────────
  interface CatStat {
    level: CEFRLevel;
    category: string;
    seen: number;
    due: number;
    newCount: number;
  }

  function getCategoryStats(cards: CardProgress[], sort: 'due' | 'new'): CatStat[] {
    const now = new Date();
    const stats: CatStat[] = [];
    for (const level of levels) {
      for (const category of CATEGORIES_BY_LEVEL[level]) {
        const levelCards = cards.filter((c) => c.level === level && c.category === category);
        if (levelCards.length === 0) continue;
        stats.push({
          level,
          category,
          seen: levelCards.length,
          due: levelCards.filter((c) => new Date(c.fsrs.due) <= now).length,
          newCount: levelCards.filter((c) => c.fsrs.state === State.Learning && c.fsrs.reps <= 1)
            .length
        });
      }
    }
    return sort === 'due'
      ? stats.sort((a, b) => b.due - a.due)
      : stats.sort((a, b) => b.newCount - a.newCount);
  }

  const categoryStats = $derived(getCategoryStats(allCards, sortBy));

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  onMount(() => {
    progressMap = loadProgressMap();
    mounted = true;
  });

  function handleReset() {
    if (!confirmReset) {
      confirmReset = true;
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('progress-')) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    progressMap = {};
    confirmReset = false;
  }
</script>

<div class="mx-auto max-w-4xl px-4 py-8 text-left">
  <!-- Header -->
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold dark:text-white">{m.stats_title()}</h1>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        {m.stats_subtitle()}
      </p>
    </div>
    <a
      href="/"
      class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {m.stats_back()}
    </a>
  </div>

  {#if !mounted}
    <p class="text-gray-400 dark:text-gray-500">{m.stats_loading()}</p>
  {:else if totalSeen === 0}
    <!-- Empty state -->
    <div
      class="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center dark:border-gray-700 dark:bg-gray-800/40"
    >
      <p class="text-2xl">📚</p>
      <p class="mt-3 text-lg font-medium dark:text-white">{m.stats_empty_heading()}</p>
      <p class="mt-1 text-gray-500 dark:text-gray-400">{m.stats_empty_body()}</p>
      <a
        href="/"
        class="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {m.stats_start_studying()}
      </a>
    </div>
  {:else}
    <!-- ── CEFR Estimate ───────────────────────────────────────────────────────── -->
    <div
      class="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20"
    >
      <p class="text-sm font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
        {m.stats_cefr_label()}
      </p>
      <p class="mt-1 text-base text-gray-800 dark:text-gray-200">{cefrEstimate}</p>
    </div>

    <!-- ── Summary cards ──────────────────────────────────────────────────────── -->
    <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {#each [{ label: m.stats_cards_seen(), value: totalSeen, color: 'text-gray-800 dark:text-white' }, { label: m.stats_due_today(), value: dueToday, color: 'text-red-600 dark:text-red-400' }, { label: m.stats_in_review(), value: byState.review, color: 'text-green-600 dark:text-green-400' }, { label: m.stats_relearning(), value: byState.relearning, color: 'text-orange-600 dark:text-orange-400' }] as stat (stat.label)}
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800"
        >
          <p class="text-2xl font-bold {stat.color}">{stat.value}</p>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
        </div>
      {/each}
    </div>

    <!-- ── Per-level breakdown ────────────────────────────────────────────────── -->
    <h2 class="mb-4 text-xl font-semibold dark:text-white">{m.stats_by_level()}</h2>
    <div class="mb-8 space-y-4">
      {#each levelStats as ls (ls.level)}
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="font-semibold {levelTextColors[ls.level]}">{ls.level}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {ls.seen}
              {m.stats_seen()} · {ls.due}
              {m.stats_due_today_short()}
            </span>
          </div>
          <!-- Stacked progress bar -->
          <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            {#if ls.seen > 0}
              <div class="flex h-full">
                {#if ls.learning > 0}
                  <div
                    class="bg-yellow-400"
                    style="width: {(ls.learning / ls.seen) * 100}%"
                    title="Learning: {ls.learning}"
                  ></div>
                {/if}
                {#if ls.review > 0}
                  <div
                    class={levelColors[ls.level]}
                    style="width: {(ls.review / ls.seen) * 100}%"
                    title="Review: {ls.review}"
                  ></div>
                {/if}
                {#if ls.relearning > 0}
                  <div
                    class="bg-orange-400"
                    style="width: {(ls.relearning / ls.seen) * 100}%"
                    title="Relearning: {ls.relearning}"
                  ></div>
                {/if}
              </div>
            {/if}
          </div>
          {#if ls.seen === 0}
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {m.stats_no_cards_this_level()}
            </p>
          {:else}
            <div class="mt-1.5 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <span class="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
                {m.stats_learning()}
                {ls.learning}
              </span>
              <span class="flex items-center gap-1">
                <span class="inline-block h-2 w-2 rounded-full {levelColors[ls.level]}"></span>
                {m.stats_review()}
                {ls.review}
              </span>
              <span class="flex items-center gap-1">
                <span class="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
                {m.stats_relearning()}
                {ls.relearning}
              </span>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- ── Per-category breakdown ─────────────────────────────────────────────── -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold dark:text-white">{m.stats_by_category()}</h2>
      <div class="flex gap-2">
        <button
          onclick={() => (sortBy = 'due')}
          class="rounded-lg px-3 py-1 text-sm font-medium transition-colors {sortBy === 'due'
            ? 'bg-blue-600 text-white'
            : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'}"
        >
          {m.stats_sort_most_due()}
        </button>
        <button
          onclick={() => (sortBy = 'new')}
          class="rounded-lg px-3 py-1 text-sm font-medium transition-colors {sortBy === 'new'
            ? 'bg-blue-600 text-white'
            : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'}"
        >
          {m.stats_sort_most_new()}
        </button>
      </div>
    </div>

    {#if categoryStats.length === 0}
      <p class="text-sm text-gray-400 dark:text-gray-500">{m.stats_no_category_data()}</p>
    {:else}
      <div class="mb-8 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300"
                >{m.stats_category_col()}</th
              >
              <th class="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300"
                >{m.stats_level_col()}</th
              >
              <th class="px-4 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300"
                >{m.stats_seen_col()}</th
              >
              <th class="px-4 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300"
                >{m.stats_due_col()}</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {#each categoryStats as cs (`${cs.level}-${cs.category}`)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-4 py-2.5 dark:text-gray-200">
                  <a
                    href="/{cs.level.toLowerCase()}/{cs.category}"
                    class="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                  >
                    {removeHyphensAndCapitalize(cs.category)}
                  </a>
                </td>
                <td class="px-4 py-2.5 font-medium {levelTextColors[cs.level]}">{cs.level}</td>
                <td class="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400">{cs.seen}</td>
                <td class="px-4 py-2.5 text-right">
                  {#if cs.due > 0}
                    <span class="font-semibold text-red-600 dark:text-red-400">{cs.due}</span>
                  {:else}
                    <span class="text-gray-400">0</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <!-- ── Reset ──────────────────────────────────────────────────────────────── -->
    <div class="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
      <h2 class="mb-2 text-base font-semibold text-gray-700 dark:text-gray-300">
        {m.stats_danger_zone()}
      </h2>
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {m.stats_danger_body()}
      </p>
      {#if confirmReset}
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-sm font-medium text-red-600 dark:text-red-400">
            {m.stats_confirm_question()}
          </p>
          <button
            onclick={handleReset}
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {m.stats_confirm_yes()}
          </button>
          <button
            onclick={() => (confirmReset = false)}
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {m.stats_cancel()}
          </button>
        </div>
      {:else}
        <button
          onclick={handleReset}
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {m.stats_reset_button()}
        </button>
      {/if}
    </div>
  {/if}
</div>
