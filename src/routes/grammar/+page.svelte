<script lang="ts">
  import { page } from '$app/state';
  import { Badge } from 'flowbite-svelte';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import TopicCard from '$lib/components/grammar/TopicCard.svelte';
  import { cefrColors } from '$lib/blog';
  import type { CEFRLevel } from '$lib/types';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  let isPlus = $derived(page.data.plan === 'plus');

  // ── Filter state ────────────────────────────────────────────────────────────
  let searchQuery = $state('');
  let selectedLevel = $state<CEFRLevel | null>(null);

  const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C'] as const;
  const searchTerm = $derived(searchQuery.trim().toLowerCase());

  function segmentMatches(seg: (typeof data.segments)[number]): boolean {
    const rule = GRAMMAR_RULES[seg.topic];
    if (selectedLevel && !seg.levels.includes(selectedLevel as CEFRLevel)) return false;
    if (searchTerm) {
      // Grammar questions are Norwegian-only at every level (see
      // ai-docs/implementation/grammar-with-only-norsk.md).
      const title = rule ? rule.titleNb : seg.topic;
      const explanation = rule ? rule.explanationNb : '';
      if (
        !title.toLowerCase().includes(searchTerm) &&
        !explanation.toLowerCase().includes(searchTerm)
      )
        return false;
    }
    return true;
  }

  // Each segment already carries a fixed access state (computed once in
  // +page.ts via groupTopicLevelsByAccess), so filtering never changes what
  // a card says — only whether it's shown. This replaces the old reactive
  // isFreeForCurrentFilter() that recomputed a topic's free/locked status
  // against the active level filter every render.
  const visibleSegments = $derived(data.segments.filter(segmentMatches));
  const filteredFree = $derived(visibleSegments.filter((s) => s.access === 'free'));
  const filteredLocked = $derived(visibleSegments.filter((s) => s.access === 'locked'));
  const isFiltering = $derived(!!searchTerm || !!selectedLevel);
  const totalVisible = $derived(filteredFree.length + filteredLocked.length);

  // Locked-segment count under the active level filter (search-independent,
  // same semantics as the old lockedTopicsCount) — used for the upsell
  // banner headline.
  const lockedSegmentsCount = $derived(
    data.segments.filter(
      (s) =>
        s.access === 'locked' && (!selectedLevel || s.levels.includes(selectedLevel as CEFRLevel))
    ).length
  );

  function toggleLevel(level: CEFRLevel) {
    selectedLevel = selectedLevel === level ? null : level;
  }

  function clearFilters() {
    searchQuery = '';
    selectedLevel = null;
  }

  function gridClass(count: number) {
    return count === 1 ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2';
  }

  // Two segments of the same topic share a title, so a plain topic key
  // isn't unique across the whole segment list — key on topic + access.
  function segKey(seg: (typeof data.segments)[number]) {
    return `${seg.topic}-${seg.access}`;
  }

  // Scope the displayed count to the active level filter, matching
  // /learn/[level] (which only ever counts questions where q.cefr equals
  // that exact level). With no filter active, fall back to the segment's
  // full total across all its levels — same as before.
  function segTotal(seg: (typeof data.segments)[number]): number {
    if (selectedLevel) return seg.countsByLevel[selectedLevel] ?? 0;
    return seg.total;
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

    <!-- CEFR level pills -->
    <div class="flex flex-wrap items-center gap-2">
      <span
        class="w-12 shrink-0 text-xs font-semibold tracking-widest text-gray-600 uppercase dark:text-gray-300"
      >
        {m.blog_filter_level()}
      </span>
      <div class="flex flex-wrap gap-1.5">
        {#each cefrOrder as level (level)}
          <button
            onclick={() => toggleLevel(level)}
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
          {totalVisible === 1
            ? m.grammar_topic_count_singular({ count: totalVisible })
            : m.grammar_topic_count({ count: totalVisible })}
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

  <p class="mb-4 text-base font-medium text-gray-600 dark:text-gray-300">
    {m.grammar_pick_topic()}
  </p>

  <!-- Free segments -->
  {#if filteredFree.length > 0}
    <div class={[gridClass(filteredFree.length), 'mb-8'].join(' ')}>
      {#each filteredFree as seg (segKey(seg))}
        <TopicCard
          topic={seg.topic}
          rule={GRAMMAR_RULES[seg.topic]}
          total={segTotal(seg)}
          levels={seg.levels}
          level={selectedLevel}
        />
      {/each}
    </div>
  {/if}

  <!-- Locked segments -->
  {#if filteredLocked.length > 0}
    {#if isPlus}
      <!-- Plus users see all topics unlocked -->
      <div class={gridClass(filteredLocked.length)}>
        {#each filteredLocked as seg (segKey(seg))}
          <TopicCard
            topic={seg.topic}
            rule={GRAMMAR_RULES[seg.topic]}
            total={segTotal(seg)}
            levels={seg.levels}
            level={selectedLevel}
          />
        {/each}
      </div>
    {:else}
      <!-- Free users: upsell banner then locked segment cards -->
      {#if !isFiltering}
        <div
          class="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20"
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

      <div class={gridClass(filteredLocked.length)}>
        {#each filteredLocked as seg (segKey(seg))}
          {@const rule = GRAMMAR_RULES[seg.topic]}
          <a
            href="/plus?ref=grammar-topics"
            class="hover:border-primary-400 dark:hover:border-primary-500 flex flex-col rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
          >
            <div class="mb-3 flex items-start justify-between gap-2">
              <div class="flex items-center gap-1">
                {#each seg.levels as level (level)}
                  <Badge color={cefrColors[level] ?? 'blue'} data-testid="cefr-badge">{level}</Badge
                  >
                {/each}
              </div>
              <span
                class="shrink-0 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              >
                🔒 {m.grammar_plus_topic()}
              </span>
            </div>

            <p class="font-semibold text-gray-900 dark:text-white" data-testid="topic-title">
              {rule ? rule.titleNb : seg.topic}
            </p>

            <p class="mt-1 line-clamp-2 text-sm text-gray-500 sm:line-clamp-2 dark:text-gray-400">
              {rule ? rule.explanationNb : ''}
            </p>
          </a>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- No results -->
  {#if isFiltering && totalVisible === 0}
    <p class="text-sm text-gray-600 dark:text-gray-300">{m.blog_filter_no_results()}</p>
  {/if}
</div>
