<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import * as m from '$lib/paraglide/messages.js';
  import { cefrLevels } from '$lib/blog';

  let { data }: { data: PageData } = $props();

  const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C'];

  const cefrColors: Record<string, 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'yellow'> = {
    A1: 'green',
    A2: 'green',
    B1: 'blue',
    B2: 'indigo',
    C: 'purple'
  };

  // --- filter state ---
  let selectedLevel = $state<string | null>(null);
  let selectedTag = $state<string | null>(null);
  let searchQuery = $state('');

  const searchTerm = $derived(searchQuery.trim().toLowerCase());

  // All unique tags across non-guide posts, sorted alphabetically
  const allTags = $derived(
    [...new Set(data.posts.filter((p) => p.type !== 'guide').flatMap((p) => p.tags ?? []))].sort()
  );

  const guides = $derived(data.posts.filter((p) => p.type === 'guide'));

  const grouped = $derived(
    cefrOrder
      .map((level) => ({
        level,
        posts: data.posts.filter((p) => {
          if (p.type === 'guide') return false;
          const matchesLevel = !selectedLevel || cefrLevels(p.cefr).includes(selectedLevel);
          const matchesTag = !selectedTag || (p.tags ?? []).includes(selectedTag);
          const matchesSearch =
            !searchTerm ||
            p.title.toLowerCase().includes(searchTerm) ||
            (p.description ?? '').toLowerCase().includes(searchTerm);
          return matchesLevel && matchesTag && matchesSearch && cefrLevels(p.cefr).includes(level);
        })
      }))
      .filter((g) => g.posts.length > 0)
  );

  const totalVisible = $derived(grouped.reduce((sum, g) => sum + g.posts.length, 0));

  // --- load more ---
  const PAGE_SIZE = 8;
  let visibleCount = $state(PAGE_SIZE);

  const allFilteredPosts = $derived(grouped.flatMap((g) => g.posts));
  const visiblePosts = $derived(allFilteredPosts.slice(0, visibleCount));
  const hasMore = $derived(visibleCount < allFilteredPosts.length);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });
  }

  function toggleLevel(level: string) {
    selectedLevel = selectedLevel === level ? null : level;
    visibleCount = PAGE_SIZE;
  }

  function toggleTag(tag: string) {
    selectedTag = selectedTag === tag ? null : tag;
    visibleCount = PAGE_SIZE;
  }

  function clearFilters() {
    selectedLevel = null;
    selectedTag = null;
    searchQuery = '';
    visibleCount = PAGE_SIZE;
  }

  function loadMore() {
    visibleCount += PAGE_SIZE;
  }
</script>

<svelte:head>
  <title>Språkhjørnet — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12 text-left">
  <h1 class="mb-2 text-4xl font-bold dark:text-white">Språkhjørnet</h1>
  <p class="mb-8 text-gray-600 dark:text-gray-300">
    {m.blog_subheading()}
  </p>

  <!-- Filter panel -->
  <div class="mb-8 space-y-3">
    <!-- Search -->
    <div class="relative">
      <input
        bind:value={searchQuery}
        oninput={() => {
          visibleCount = PAGE_SIZE;
        }}
        placeholder={m.blog_search_placeholder()}
        aria-label={m.blog_search_aria()}
        type="search"
        class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2
               pl-9 text-sm text-gray-900 placeholder-gray-600
               focus:ring-1 focus:outline-none dark:border-gray-400 dark:bg-transparent
               dark:text-white dark:placeholder-gray-400"
      />
      <svg
        class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-400"
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

    <!-- Row 1: CEFR level -->
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

    <!-- Row 2: Tags -->
    {#if allTags.length > 0}
      <div class="flex flex-wrap items-start gap-2">
        <span
          class="w-12 shrink-0 pt-0.5 text-xs font-semibold tracking-widest text-gray-600 uppercase dark:text-gray-300"
        >
          {m.blog_filter_topic()}
        </span>
        <div class="flex flex-wrap gap-1.5">
          {#each allTags as tag (tag)}
            <button
              onclick={() => toggleTag(tag)}
              class={[
                'rounded-full border px-3 py-0.5 text-xs transition',
                selectedTag === tag
                  ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                  : 'border-gray-200 bg-transparent text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
              ].join(' ')}
            >
              {tag}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Active filter summary + clear -->
    {#if selectedLevel || selectedTag || searchTerm}
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-400 dark:text-gray-500">
          {m.blog_filter_results({ count: totalVisible })}
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

  <!-- Guides (hidden when filters are active) -->
  {#if guides.length > 0 && !selectedLevel && !selectedTag && !searchTerm}
    <section class="mb-10">
      <h2
        class="mb-4 text-sm font-semibold tracking-widest text-gray-600 uppercase dark:text-gray-300"
      >
        {m.blog_section_guides()}
      </h2>
      <div class="space-y-3">
        {#each guides as post (post.slug)}
          <a
            href="/blog/{post.slug}"
            class="hover:border-primary-400 dark:hover:border-primary-500 block rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 dark:text-white">{post.title}</p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{post.description}</p>
              </div>
              <span class="mt-1 shrink-0 text-xs text-gray-600 dark:text-gray-300"
                >{formatDate(post.publishedAt)}</span
              >
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Posts grid -->
  {#if visiblePosts.length > 0}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {#each visiblePosts as post (post.slug)}
        {@const postLevels = cefrLevels(post.cefr)}
        <a
          href="/blog/{post.slug}"
          class="hover:border-primary-400 dark:hover:border-primary-500 flex flex-col rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
        >
          <div class="mb-3 flex items-start justify-between gap-2">
            <div class="flex items-center gap-1">
              {#each postLevels as lvl (lvl)}
                <Badge color={cefrColors[lvl] ?? 'blue'} data-testid="cefr-badge">{lvl}</Badge>
              {/each}
            </div>
            <span class="shrink-0 text-xs text-gray-600 dark:text-gray-300">
              {formatDate(post.publishedAt)}
            </span>
          </div>
          <p class="font-semibold text-gray-900 dark:text-white">{post.title}</p>
          <p class="mt-1 line-clamp-2 text-sm text-gray-500 sm:line-clamp-2 dark:text-gray-400">
            {post.description}
          </p>
        </a>
      {/each}
    </div>

    {#if hasMore}
      <div class="mt-8 flex justify-center">
        <button
          onclick={loadMore}
          class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:text-white"
        >
          {m.blog_load_more({ remaining: allFilteredPosts.length - visibleCount })}
        </button>
      </div>
    {/if}
  {:else}
    <p class="text-sm text-gray-400 dark:text-gray-500">{m.blog_filter_no_results()}</p>
  {/if}
</div>
