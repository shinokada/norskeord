<script lang="ts">
  /**
   * /my-progress/grammar (ai-docs/implementation/grammar-update.md, Phase 7).
   *
   * Grammar progress for reviewing and diagnosing (decision #7; /grammar is for
   * learning): a review button with due counts per chapter, the question-level
   * grammar level estimate (decision #17), weak spots, and progress by Part >
   * chapter > section following the book.
   *
   * Same data path as /my-progress: Plus reads Supabase, free and guest read
   * localStorage. Every card's topic and level is resolved live from its id
   * (grammar/progress.ts), never from the stored snapshot. Free for every plan.
   */
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { loadGrammarProgressMap, loadGrammarProgressFromSupabase } from '$lib/progress';
  import type { CardProgress, CEFRLevel } from '$lib/types';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import {
    LEVEL_MASTERED_SHARE,
    LEVEL_MIN_SEEN,
    buildGrammarProgress,
    estimateGrammarLevel,
    weakSpots
  } from '$lib/grammar/progress';
  import { dueByChapter, percent, visibleParts } from '$lib/grammar/progress-view';
  import * as m from '$lib/paraglide/messages.js';

  let grammarMap = $state<Record<string, CardProgress>>({});
  let mounted = $state(false);

  let isPlus = $derived(page.data.plan === 'plus');
  let userId = $derived(page.data.user?.id as string | undefined);

  const levels: readonly CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

  const progress = $derived(buildGrammarProgress(grammarMap));
  const parts = $derived(visibleParts(progress));
  const chaptersDue = $derived(dueByChapter(progress));
  const weak = $derived(weakSpots(progress));
  const estimate = $derived(estimateGrammarLevel(progress.byLevel));
  const levelRows = $derived(
    levels
      .filter((level) => progress.byLevel[level].total > 0)
      .map((level) => ({ level, ...progress.byLevel[level] }))
  );

  /** Norwegian rule title (grammar content is Norwegian-only). */
  const topicTitle = (topic: string) => GRAMMAR_RULES[topic]?.titleNb ?? topic;

  onMount(async () => {
    grammarMap =
      isPlus && userId ? await loadGrammarProgressFromSupabase(userId) : loadGrammarProgressMap();
    mounted = true;
  });
</script>

<svelte:head>
  <title>{m.grammar_progress_title()} — Norskeord</title>
</svelte:head>

<!-- Seen (light) and mastered (green) as layers of one bar. The numbers next to it
     carry the meaning, so the bar itself is decorative. -->
{#snippet bar(seen: number, mastered: number, total: number)}
  <div
    class="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
    aria-hidden="true"
  >
    <div
      class="absolute inset-y-0 left-0 bg-indigo-300 dark:bg-indigo-600"
      style="width: {percent(seen, total)}%"
    ></div>
    <div
      class="absolute inset-y-0 left-0 bg-green-500"
      style="width: {percent(mastered, total)}%"
    ></div>
  </div>
{/snippet}

{#snippet dueBadge(count: number)}
  {#if count > 0}
    <span
      class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-red-700 dark:bg-red-900/40 dark:text-red-300"
    >
      {m.stats_due_count({ count })}
    </span>
  {/if}
{/snippet}

<div class="mx-auto max-w-3xl px-4 py-10 text-left">
  <a
    href="/my-progress"
    data-testid="grammar-progress-back"
    class="text-sm text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
  >
    {m.grammar_progress_back()}
  </a>
  <h1 class="mt-2 mb-6">{m.grammar_progress_title()}</h1>

  {#if !mounted}
    <p class="text-gray-600 dark:text-gray-300">{m.stats_loading()}</p>
  {:else if progress.overall.seen === 0}
    <div
      data-testid="grammar-progress-empty"
      class="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
    >
      <p class="text-2xl">📐</p>
      <p class="mt-3 text-lg font-medium dark:text-white">{m.grammar_progress_empty_title()}</p>
      <p class="mt-1 text-gray-500 dark:text-gray-300">{m.grammar_progress_empty_body()}</p>
      <a
        href="/grammar"
        class="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {m.grammar_back_to_topics()} →
      </a>
    </div>
  {:else}
    <!-- Review due, and due by chapter -->
    <section class="mb-8" data-testid="grammar-progress-due">
      {#if progress.overall.due > 0}
        <a
          href="/review/grammar"
          data-testid="grammar-progress-review"
          class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none"
        >
          <span aria-hidden="true">📌</span>
          {m.grammar_progress_review_due({ count: progress.overall.due })}
        </a>

        <h2 class="!mt-6 !mb-2 text-base">{m.grammar_progress_due_by_chapter()}</h2>
        <ul class="space-y-2" data-testid="grammar-progress-due-chapters">
          {#each chaptersDue as entry (entry.chapter.slug)}
            <li>
              <a
                href="/review/grammar?chapter={entry.chapter.slug}"
                data-testid="grammar-progress-due-chapter"
                class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm hover:border-indigo-300 dark:border-white/10 dark:bg-indigo-950/60 dark:hover:border-indigo-500"
              >
                <span class="text-gray-800 dark:text-gray-100">
                  {entry.chapter.no}. {entry.chapter.titleNb}
                </span>
                {@render dueBadge(entry.due)}
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p
          data-testid="grammar-progress-nothing-due"
          class="text-sm text-gray-600 dark:text-gray-300"
        >
          {m.grammar_progress_nothing_due()}
        </p>
      {/if}
    </section>

    <!-- Grammar level estimate (question-level, decision #17) -->
    <section
      class="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20"
      data-testid="grammar-progress-level"
    >
      <h2
        class="!mb-1 text-sm font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400"
      >
        {m.grammar_progress_level_heading()}
      </h2>
      <p class="text-base text-gray-800 dark:text-gray-200" data-testid="grammar-progress-estimate">
        {estimate
          ? m.grammar_progress_level_reached({ level: estimate })
          : m.grammar_progress_level_none()}
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {m.grammar_progress_level_hint({
          share: Math.round(LEVEL_MASTERED_SHARE * 100),
          seen: LEVEL_MIN_SEEN
        })}
      </p>

      <ul class="mt-4 space-y-3">
        {#each levelRows as row (row.level)}
          <li data-testid="grammar-progress-level-row">
            <div
              class="mb-1 flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200"
            >
              <span class="font-semibold">{row.level}</span>
              <span class="flex items-center gap-2">
                {m.grammar_progress_level_row({
                  seen: row.seen,
                  total: row.total,
                  mastered: row.review
                })}
                {@render dueBadge(row.due)}
              </span>
            </div>
            {@render bar(row.seen, row.review, row.total)}
          </li>
        {/each}
      </ul>
    </section>

    <!-- Weak spots -->
    <section class="mb-8" data-testid="grammar-progress-weak">
      <h2 class="!mb-3 text-lg">{m.grammar_progress_weak_heading()}</h2>
      {#if weak.length === 0}
        <p class="text-sm text-gray-600 dark:text-gray-300">{m.grammar_progress_weak_empty()}</p>
      {:else}
        <ul
          class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-indigo-950/60"
        >
          {#each weak as spot (spot.topic)}
            <li class="flex items-center justify-between gap-3 px-4 py-3">
              <div class="min-w-0">
                <a
                  href={spot.href}
                  data-testid="grammar-progress-weak-topic"
                  class="font-medium text-gray-900 hover:underline dark:text-white"
                >
                  {topicTitle(spot.topic)}
                </a>
                <p class="text-xs text-gray-500 dark:text-gray-300">
                  {m.grammar_progress_weak_detail({
                    relearning: spot.relearning,
                    lapses: spot.lapses
                  })}
                </p>
              </div>
              <!-- Only when something is due: /review/grammar is a due-only review. -->
              {#if (progress.byTopic.get(spot.topic)?.due ?? 0) > 0}
                <a
                  href="/review/grammar?topic={spot.topic}"
                  class="shrink-0 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {m.grammar_progress_weak_review()}
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Progress by Part > chapter > section (the book's order) -->
    <section data-testid="grammar-progress-book">
      <h2 class="!mb-3 text-lg">{m.grammar_progress_book_heading()}</h2>

      {#each parts as p (p.part.no)}
        <details
          open
          data-testid="grammar-progress-part"
          class="mb-3 rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-indigo-950/60"
        >
          <summary class="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
            <span class="font-semibold text-gray-900 dark:text-white">
              {m.grammar_map_part({ no: p.part.no })} · {p.part.titleNb}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-300">
              {m.grammar_map_progress({ seen: p.seen, total: p.total })}
            </span>
            {@render dueBadge(p.due)}
          </summary>

          <div class="space-y-2 px-3 pb-3">
            {#each p.chapters as c (c.chapter.slug)}
              <details
                data-testid="grammar-progress-chapter"
                class="rounded-lg border border-gray-100 dark:border-white/10"
              >
                <summary class="cursor-pointer px-3 py-2.5">
                  <span class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span class="font-medium text-gray-800 dark:text-gray-100">
                      {c.chapter.no}. {c.chapter.titleNb}
                    </span>
                    <span class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                      {m.grammar_map_progress({ seen: c.seen, total: c.total })} ·
                      {m.grammar_progress_mastered({ count: c.review })}
                      {@render dueBadge(c.due)}
                    </span>
                  </span>
                  <span class="mt-2 block">{@render bar(c.seen, c.review, c.total)}</span>
                </summary>

                <div class="space-y-3 px-3 pt-1 pb-3">
                  {#each c.sections as s (s.section.id)}
                    <div>
                      <p class="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {s.section.id}
                        {s.section.titleNb}
                      </p>
                      <ul class="space-y-1.5">
                        {#each s.topics as t (t.topic)}
                          <li
                            class="flex items-center justify-between gap-3 text-sm"
                            data-testid="grammar-progress-topic"
                          >
                            <a
                              href="/grammar/{t.topic}"
                              class="min-w-0 truncate text-gray-800 hover:underline dark:text-gray-100"
                            >
                              {topicTitle(t.topic)}
                            </a>
                            <span
                              class="flex shrink-0 items-center gap-2 text-xs text-gray-500 dark:text-gray-300"
                            >
                              {m.grammar_map_progress({ seen: t.seen, total: t.total })}
                              {@render dueBadge(t.due)}
                            </span>
                          </li>
                        {/each}
                      </ul>
                    </div>
                  {/each}
                </div>
              </details>
            {/each}
          </div>
        </details>
      {/each}
    </section>
  {/if}
</div>
