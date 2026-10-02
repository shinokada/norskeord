<!--
  ContentTypeSummary.svelte
  grammar-update.md Phase 4: the per-level summary card (seen · due, stacked
  learning/memorized/forgotten bar, legend) that /my-progress used to repeat
  four times (Vocabulary and Uttrykk, each for Plus and free users).
-->
<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import type { CEFRLevel } from '$lib/types';

  interface LevelStat {
    seen: number;
    learning: number;
    review: number;
    relearning: number;
    due: number;
  }

  interface Props {
    stat: LevelStat;
    level: CEFRLevel;
    /** Tailwind bg class for the "memorized" segment, e.g. 'bg-green-500'. */
    levelColor: string;
    /** Tailwind text classes for the level label. */
    levelTextColor: string;
  }

  let { stat, level, levelColor, levelTextColor }: Props = $props();

  const pct = (n: number) => (stat.seen > 0 ? (n / stat.seen) * 100 : 0);
</script>

<div
  class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
>
  <div class="mb-2 flex items-center justify-between">
    <span class="font-semibold {levelTextColor}">{level}</span>
    <span class="text-sm text-gray-500 dark:text-gray-300">
      {stat.seen}
      {m.stats_seen()} · {stat.due}
      {m.stats_due_today_short()}
    </span>
  </div>
  <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40">
    {#if stat.seen > 0}
      <div class="flex h-full">
        {#if stat.learning > 0}
          <div
            class="bg-yellow-400"
            style="width: {pct(stat.learning)}%"
            title={m.stats_tooltip_learning({ count: stat.learning })}
          ></div>
        {/if}
        {#if stat.review > 0}
          <div
            class={levelColor}
            style="width: {pct(stat.review)}%"
            title={m.stats_tooltip_review({ count: stat.review })}
          ></div>
        {/if}
        {#if stat.relearning > 0}
          <div
            class="bg-orange-400"
            style="width: {pct(stat.relearning)}%"
            title={m.stats_tooltip_relearning({ count: stat.relearning })}
          ></div>
        {/if}
      </div>
    {/if}
  </div>
  {#if stat.seen === 0}
    <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
      {m.stats_no_cards_this_level()}
    </p>
  {:else}
    <div class="mt-1.5 flex gap-4 text-xs text-gray-500 dark:text-gray-300">
      <span class="flex items-center gap-1">
        <span class="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
        {m.stats_learning()}
        {stat.learning}
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block h-2 w-2 rounded-full {levelColor}"></span>
        {m.stats_review()}
        {stat.review}
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
        {m.stats_relearning()}
        {stat.relearning}
      </span>
    </div>
  {/if}
</div>
