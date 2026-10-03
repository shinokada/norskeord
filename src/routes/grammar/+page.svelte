<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { loadGrammarProgressMap, loadGrammarProgressFromSupabase } from '$lib/progress';
  import { buildGrammarProgress, lastStudiedTopic } from '$lib/grammar/progress';
  import { startHere } from '$lib/grammar/start-path';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import {
    buildGrammarMap,
    countLockedSegments,
    searchTopics,
    topicHref,
    CEFR_ORDER
  } from '$lib/grammar/overview';
  import PartSection from '$lib/components/grammar/PartSection.svelte';
  import ChapterCard from '$lib/components/grammar/ChapterCard.svelte';
  import TopicRow from '$lib/components/grammar/TopicRow.svelte';
  import StartHere from '$lib/components/grammar/StartHere.svelte';
  import { localeStore } from '$lib/localeStore.svelte';
  import type { CardProgress, CEFRLevel } from '$lib/types';
  import * as m from '$lib/paraglide/messages';

  // ── Filter state ────────────────────────────────────────────────────────────
  let searchQuery = $state('');
  let selectedLevel = $state<CEFRLevel | null>(null);

  // Grammar progress (separate store, keyed by question id). Loaded on mount:
  // Plus reads Supabase, free/guest read localStorage — same as /my-progress.
  let grammarMap = $state<Record<string, CardProgress>>({});

  const isPlus = $derived(page.data.plan === 'plus');
  const isNb = $derived(localeStore.current === 'nb');

  const searchTerm = $derived(searchQuery.trim().toLowerCase());
  const isFiltering = $derived(!!searchTerm || !!selectedLevel);

  // The map hides chapters/sections with no topic, and (with a level chip)
  // topics with no questions at that level. Book order is never re-sorted.
  const parts = $derived(buildGrammarMap(selectedLevel));
  const hits = $derived(searchTerm ? searchTopics(searchTerm, selectedLevel) : []);
  const lockedSegmentsCount = $derived(countLockedSegments(selectedLevel));

  const visibleTopicCount = $derived(
    searchTerm
      ? hits.length
      : parts.reduce((n, p) => n + p.chapters.reduce((k, c) => k + c.topics.length, 0), 0)
  );

  // ── Progress ────────────────────────────────────────────────────────────────
  const progress = $derived(buildGrammarProgress(grammarMap));
  const chapterProgress = $derived(
    new Map(progress.parts.flatMap((p) => p.chapters).map((c) => [c.chapter.no, c] as const))
  );
  const continueTopic = $derived(lastStudiedTopic(grammarMap));
  const continueTitle = $derived(
    continueTopic ? (GRAMMAR_RULES[continueTopic]?.titleNb ?? continueTopic) : ''
  );
  const dueTotal = $derived(progress.overall.due);
  const start = $derived(startHere(grammarMap));

  onMount(async () => {
    try {
      const userId = page.data.user?.id as string | undefined;
      grammarMap =
        isPlus && userId ? await loadGrammarProgressFromSupabase(userId) : loadGrammarProgressMap();
    } catch {
      // Progress is a nicety here; the map itself must still render.
    }
  });

  function toggleLevel(level: CEFRLevel) {
    selectedLevel = selectedLevel === level ? null : level;
  }

  function clearFilters() {
    searchQuery = '';
    selectedLevel = null;
  }
</script>

<svelte:head>
  <title>{m.grammar_title()} — Norskeord</title>
  <meta name="description" content={m.grammar_subtitle()} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 text-left">
  <div class="mb-8">
    <h1 class="mb-2">{m.grammar_title()}</h1>
    <p class="text-gray-600 dark:text-gray-300">{m.grammar_subtitle()}</p>
  </div>

  <!-- Continue / due strip: only once the learner has some grammar progress. -->
  {#if continueTopic || dueTotal > 0}
    <div
      class="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
      data-testid="grammar-strip"
    >
      {#if continueTopic}
        <a
          href="/grammar/{continueTopic}"
          class="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
        >
          {m.grammar_map_continue({ topic: continueTitle })} →
        </a>
      {/if}
      {#if dueTotal > 0}
        <a
          href="/review/grammar"
          class="ml-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none"
        >
          <span aria-hidden="true">📌</span>
          {m.stats_due_count({ count: dueTotal })}
        </a>
      {/if}
    </div>
  {/if}

  <!-- Filter panel -->
  <div class="mb-8 space-y-3">
    <!-- Search -->
    <div class="relative">
      <input
        bind:value={searchQuery}
        placeholder={m.grammar_search_placeholder()}
        aria-label={m.grammar_search_aria()}
        type="search"
        class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2
               pl-9 text-sm text-gray-900 placeholder-gray-600
               focus:ring-1 focus:outline-none dark:border-gray-400 dark:bg-transparent
               dark:text-white dark:placeholder-gray-400"
      />
      <svg
        class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z"
        />
      </svg>
    </div>

    <!-- CEFR level pills: a filter, never a re-sort -->
    <div class="flex flex-wrap items-center gap-2">
      <span
        class="w-12 shrink-0 text-xs font-semibold tracking-widest text-gray-600 uppercase dark:text-gray-300"
      >
        {m.blog_filter_level()}
      </span>
      <div class="flex flex-wrap gap-1.5">
        {#each CEFR_ORDER as level (level)}
          <button
            onclick={() => toggleLevel(level)}
            aria-pressed={selectedLevel === level}
            class={[
              'rounded-full border px-4 py-2 text-sm font-semibold transition',
              selectedLevel === level
                ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                : 'border-gray-300 bg-transparent text-gray-600 hover:border-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-400'
            ].join(' ')}
          >
            {level}
          </button>
        {/each}
      </div>
    </div>

    <!-- Active filter summary + clear -->
    {#if isFiltering}
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-600 dark:text-gray-300">
          {visibleTopicCount === 1
            ? m.grammar_topic_count_singular({ count: visibleTopicCount })
            : m.grammar_topic_count({ count: visibleTopicCount })}
        </span>
        <button
          onclick={clearFilters}
          class="text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-300"
        >
          {m.blog_filter_clear()}
        </button>
      </div>
    {/if}
  </div>

  <!-- A1 «Start here» path: hidden while filtering/searching and once finished.
       Below the filter panel so the controls don't jump when it hides. -->
  {#if !isFiltering && !start.complete}
    <StartHere steps={start.steps} done={start.done} showGloss={!isNb} />
  {/if}

  <!-- Upsell: one banner for free users while nothing is filtered -->
  {#if !isPlus && !isFiltering && lockedSegmentsCount > 0}
    <div
      class="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20"
    >
      <p class="mb-1 text-base font-semibold text-indigo-800 dark:text-indigo-200">
        {m.grammar_more_topics_plus({ count: lockedSegmentsCount })}
      </p>
      <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
        {m.grammar_plus_upsell_text()}
      </p>
      <a
        href="/plus?ref=grammar-topics"
        class="inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        {m.grammar_plus_cta()}
      </a>
    </div>
  {/if}

  {#if searchTerm}
    <!-- Search results: flat, book order, with a breadcrumb -->
    {#if hits.length > 0}
      <div class="grid gap-4 sm:grid-cols-2">
        {#each hits as hit (hit.entry.topic)}
          {@const tp = progress.byTopic.get(hit.entry.topic)}
          <TopicRow
            entry={hit.entry}
            href={topicHref(hit.entry, { level: selectedLevel, isPlus })}
            {isPlus}
            breadcrumb="{hit.part.titleNb} › {hit.chapter.titleNb}"
            showGloss={!isNb}
            seen={selectedLevel ? 0 : (tp?.seen ?? 0)}
            due={tp?.due ?? 0}
          />
        {/each}
      </div>
    {/if}
  {:else}
    <!-- The map: Parts > chapters, in book order -->
    {#each parts as p (p.part.no)}
      <PartSection part={p.part} showGloss={!isNb}>
        {#each p.chapters as c (c.chapter.slug)}
          {@const cp = chapterProgress.get(c.chapter.no)}
          <ChapterCard
            entry={c}
            level={selectedLevel}
            {isPlus}
            showGloss={!isNb}
            seen={cp?.seen ?? 0}
            totalQuestions={cp?.total ?? 0}
            due={cp?.due ?? 0}
          />
        {/each}
      </PartSection>
    {/each}
  {/if}

  <!-- No results -->
  {#if isFiltering && visibleTopicCount === 0}
    <p class="text-sm text-gray-600 dark:text-gray-300">{m.blog_filter_no_results()}</p>
  {/if}
</div>
