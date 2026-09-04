<script lang="ts">
  // Phase 2 (ai-docs/implementation/stats-page-improvement.md): the row-list
  // half of the old CategoryBarChart.svelte / UttrykkThemeChart.svelte
  // (both removed in Phase 4), extracted so Vocab, Uttrykk, and Grammar can
  // all render through one component once /stats groups by level first
  // (Phase 3). Unlike those two former components, this one has no
  // accordion wrapper and no level loop — it renders exactly the rows it's
  // given, for whichever single level the caller is currently showing.
  // Level selection lives in the level-tabs UI (Phase 3), not here.
  import { type StatRow, buildReviewHref, type ReviewType } from '$lib/stats';
  import type { CEFRLevel } from '$lib/types';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    rows: StatRow[];
    levelColor: string; // e.g. 'bg-green-500' — this level's "review" bar color
    emptyMessage?: string;
    /**
     * CEFR level these rows belong to. Required to build the due-badge's
     * review link (Step 4c, ai-docs/implementation/due-only.md) — omit
     * `reviewType` below to skip the link entirely.
     */
    level?: CEFRLevel;
    /**
     * When set, each row's due badge becomes its own link into a due-only
     * review session for that row (Step 4c; grammar added in Fix 3,
     * ai-docs/implementation/due-only-review-update.md). Omit to keep
     * today's plain (unclickable) badge.
     */
    reviewType?: ReviewType;
  }

  let { rows, levelColor, emptyMessage, level, reviewType }: Props = $props();
</script>

{#if rows.length === 0}
  {#if emptyMessage}
    <p class="px-1 py-2 text-xs text-gray-600 dark:text-gray-300">{emptyMessage}</p>
  {/if}
{:else}
  <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
    <div class="divide-y divide-gray-100 bg-white dark:divide-gray-700/60 dark:bg-indigo-950/60">
      {#each rows as row (row.key)}
        {@const seenPct = row.total > 0 ? (row.seen / row.total) * 100 : 0}
        {@const reviewW = row.seen > 0 ? (row.review / row.seen) * seenPct : 0}
        {@const learningW = row.seen > 0 ? (row.learning / row.seen) * seenPct : 0}
        {@const relearningW = row.seen > 0 ? (row.relearning / row.seen) * seenPct : 0}

        <div
          class="group relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <a href={row.href} class="absolute inset-0 z-0" aria-label={row.label}></a>
          <!-- Row label (already display-formatted by the stats.ts builder) -->
          <span
            class="pointer-events-none relative z-[1] w-36 shrink-0 truncate text-xs font-medium text-gray-700 group-hover:text-blue-600 sm:w-44 dark:text-gray-300 dark:group-hover:text-blue-400"
            title={row.label}
          >
            {row.label}
          </span>

          <!-- Progress bar: full width = 100% of this row's total -->
          <div class="pointer-events-none relative z-[1] min-w-0 flex-1">
            <div
              class="h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40"
              title="{row.seen}/{row.total} cards seen"
            >
              <div class="flex h-full">
                {#if reviewW > 0}
                  <div
                    class="h-full transition-all {levelColor}"
                    style="width: {reviewW}%"
                    title="{m.stats_review()}: {row.review}"
                  ></div>
                {/if}
                {#if learningW > 0}
                  <div
                    class="h-full bg-yellow-400 transition-all"
                    style="width: {learningW}%"
                    title="{m.stats_learning()}: {row.learning}"
                  ></div>
                {/if}
                {#if relearningW > 0}
                  <div
                    class="h-full bg-orange-400 transition-all"
                    style="width: {relearningW}%"
                    title="{m.stats_forgotten()}: {row.relearning}"
                  ></div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Seen / total count -->
          <span
            class="pointer-events-none relative z-[1] w-14 shrink-0 text-right text-xs text-gray-700 tabular-nums dark:text-gray-300"
          >
            {row.seen}/{row.total}
          </span>

          <!-- Due badge — its own link into a due-only review session when
               reviewType is set (Step 4c); otherwise a plain badge like today. -->
          <span class="relative z-[1] w-14 shrink-0 text-right">
            {#if row.due > 0}
              {@const href = buildReviewHref(row, level, reviewType)}
              {#if href}
                <a
                  {href}
                  class="relative z-10 inline-block rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                  title="Review {row.due} due now"
                >
                  {row.due} due
                </a>
              {:else}
                <span
                  class="inline-block rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400"
                >
                  {row.due} due
                </span>
              {/if}
            {/if}
          </span>
        </div>
      {/each}
    </div>

    <!-- Legend -->
    <div
      class="flex flex-wrap gap-4 border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-700 dark:border-gray-700/60 dark:bg-indigo-900/40 dark:text-gray-300"
    >
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-3 rounded-sm {levelColor}"></span>
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
  </div>
{/if}
