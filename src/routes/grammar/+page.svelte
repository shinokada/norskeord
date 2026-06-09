<script lang="ts">
  import { page } from '$app/state';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import TopicCard from '$lib/components/grammar/TopicCard.svelte';
  import { localeStore } from '$lib/localeStore.svelte';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  let isPlus = $derived(page.data.plan === 'plus');
  let isNb = $derived(localeStore.current === 'nb');

  // ── Filter state ────────────────────────────────────────────────────────────
  let searchQuery = $state('');
  let selectedLevel = $state<string | null>(null);

  const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C'] as const;
  const searchTerm = $derived(searchQuery.trim().toLowerCase());

  const allTopics = $derived([...data.freeTopics, ...data.lockedTopics]);

  function topicMatches(t: typeof allTopics[number]): boolean {
    const rule = GRAMMAR_RULES[t.topic];
    if (selectedLevel && !t.levels.includes(selectedLevel as any)) return false;
    if (searchTerm) {
      const title = rule ? (isNb ? rule.titleNb : rule.titleEn) : t.topic;
      const explanation = rule ? (isNb ? rule.explanationNb : rule.explanationEn) : '';
      if (
        !title.toLowerCase().includes(searchTerm) &&
        !explanation.toLowerCase().includes(searchTerm)
      )
        return false;
    }
    return true;
  }

  const filteredFree = $derived(data.freeTopics.filter(topicMatches));
  const filteredLocked = $derived(data.lockedTopics.filter(topicMatches));
  const isFiltering = $derived(!!searchTerm || !!selectedLevel);
  const totalVisible = $derived(filteredFree.length + filteredLocked.length);

  function toggleLevel(level: string) {
    selectedLevel = selectedLevel === level ? null : level;
  }

  function clearFilters() {
    searchQuery = '';
    selectedLevel = null;
  }

  function gridClass(count: number) {
    return count === 1 ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2';
  }
</script>

<svelte:head>
  <title>{m.grammar_title()} — Norskeord</title>
  <meta name="description" content={m.grammar_subtitle()} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8 text-left">
  <div class="mb-8">
    <h1 class="mb-2 text-3xl font-bold dark:text-white">{m.grammar_title()}</h1>
    <p class="text-gray-500 dark:text-gray-400">{m.grammar_subtitle()}</p>
  </div>

  <!-- Filter panel -->
  <div class="mb-8 space-y-3">
    <!-- Search -->
    <div class="relative">
      <input
        bind:value={searchQuery}
        placeholder="Search topics…"
        aria-label="Search grammar topics"
        type="search"
        class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-200 bg-transparent
               px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none
               dark:border-gray-600 dark:bg-transparent dark:text-white dark:placeholder-gray-500"
      />
      <svg
        class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
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
      <span class="w-12 shrink-0 text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
        {m.blog_filter_level()}
      </span>
      <div class="flex flex-wrap gap-1.5">
        {#each cefrOrder as level (level)}
          <button
            onclick={() => toggleLevel(level)}
            class={[
              'rounded-full border px-3 py-0.5 text-xs font-semibold transition',
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
        <span class="text-xs text-gray-400 dark:text-gray-500">
          {totalVisible} {totalVisible === 1 ? 'topic' : 'topics'}
        </span>
        <button
          onclick={clearFilters}
          class="text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {m.blog_filter_clear()}
        </button>
      </div>
    {/if}
  </div>

  <p class="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">{m.grammar_pick_topic()}</p>

  <!-- Free topics -->
  {#if filteredFree.length > 0}
    <div class={[gridClass(filteredFree.length), 'mb-8'].join(' ')}>
      {#each filteredFree as t (t.topic)}
        <TopicCard topic={t.topic} rule={GRAMMAR_RULES[t.topic]} total={t.total} levels={t.levels} />
      {/each}
    </div>
  {/if}

  <!-- Locked topics -->
  {#if filteredLocked.length > 0}
    {#if isPlus}
      <!-- Plus users see all topics unlocked -->
      <div class={gridClass(filteredLocked.length)}>
        {#each filteredLocked as t (t.topic)}
          <TopicCard
            topic={t.topic}
            rule={GRAMMAR_RULES[t.topic]}
            total={t.total}
            levels={t.levels}
          />
        {/each}
      </div>
    {:else}
      <!-- Free users: upsell banner then locked topic cards -->
      {#if !isFiltering}
        <div
          class="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20"
        >
          <p class="mb-1 text-sm font-semibold text-indigo-800 dark:text-indigo-200">
            {data.lockedTopics.length} more topics with Plus
          </p>
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Upgrade to unlock advanced sentence structure topics — word order, relative clauses,
            det-sentences, sentence adverbials, and more.
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
        {#each filteredLocked as t (t.topic)}
          {@const rule = GRAMMAR_RULES[t.topic]}
          <a
            href="/plus?ref=grammar-topics"
            class="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-indigo-950/60 dark:hover:border-indigo-500"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <h2
                class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 dark:text-white"
              >
                {rule ? rule.titleEn : t.topic}
              </h2>
              <span
                class="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              >
                🔒 Plus
              </span>
            </div>
            {#if t.levels.length}
              <div class="mb-2 flex flex-wrap gap-1">
                {#each t.levels as level (level)}
                  <span
                    class="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                    >{level}</span
                  >
                {/each}
              </div>
            {/if}
            <p class="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
              {rule ? rule.explanationEn : ''}
            </p>
            <div class="mt-auto text-xs text-gray-400 dark:text-gray-500">{t.total} questions</div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- No results -->
  {#if isFiltering && totalVisible === 0}
    <p class="text-sm text-gray-400 dark:text-gray-500">{m.blog_filter_no_results()}</p>
  {/if}
</div>
