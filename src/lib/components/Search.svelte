<!--
  Search.svelte

  Full-text search modal for Plus users.
  - Opens on Cmd/Ctrl+K or when `open` prop is set true by the Nav
  - Lazy-loads /data/search-index.json on first open
  - Debounced 150 ms input; four-pass in-browser scoring
  - Keyboard: ↑/↓ navigate results, Enter navigates, Escape closes
  - Free users see an upgrade prompt instead of the search input
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { loadSearchIndex } from '$lib/search';
  import { search, hasInflection } from '$lib/searchUtils';
  import type { SearchEntry } from '$lib/search';
  import type { SearchFilter } from '$lib/searchUtils';
  import { tick } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    open: boolean;
    isPlus: boolean;
    onclose: () => void;
  }

  let { open = $bindable(), isPlus, onclose }: Props = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let query = $state('');
  let results: SearchEntry[] = $state([]);
  let activeIndex = $state(-1);
  let loading = $state(false);
  let error = $state('');

  let sourceFilter = $state<'all' | 'vocab' | 'uttrykk'>('all');
  let levelFilter = $state('all');

  const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  // ── Index cache ───────────────────────────────────────────────────────────
  let index: SearchEntry[] | null = null;

  async function ensureIndex() {
    if (index) return;
    loading = true;
    error = '';
    try {
      index = await loadSearchIndex();
    } catch {
      error = m.search_load_error();
    } finally {
      loading = false;
    }
  }

  // ── Debounce ──────────────────────────────────────────────────────────────
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleInput(e: Event) {
    query = (e.target as HTMLInputElement).value;
    activeIndex = -1;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 150);
  }

  function runSearch() {
    if (!index) return;
    const filter: SearchFilter = {
      source: sourceFilter === 'all' ? undefined : sourceFilter,
      level: levelFilter === 'all' ? undefined : levelFilter
    };
    results = search(query, index, filter);
    activeIndex = -1;
  }

  // Re-run search when filters change
  $effect(() => {
    // Explicitly read reactive values so the effect re-runs on change
    const _s = sourceFilter;
    const _l = levelFilter;
    void _s;
    void _l;
    if (index) runSearch();
  });

  // ── Modal open/close ───────────────────────────────────────────────────────
  let inputEl = $state<HTMLInputElement | undefined>();
  let modalEl = $state<HTMLDivElement | undefined>();

  $effect(() => {
    if (open) {
      ensureIndex().then(async () => {
        await tick();
        if (isPlus) inputEl?.focus();
      });
    } else {
      query = '';
      results = [];
      activeIndex = -1;
    }
  });

  // Cmd/Ctrl+K global shortcut
  function handleGlobalKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (open) {
        close();
      } else {
        open = true;
      }
    }
  }

  function close() {
    open = false;
    onclose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  // ── Keyboard navigation inside modal ──────────────────────────────────────
  function handleKeydown(e: KeyboardEvent) {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, results.length - 1);
      scrollActiveIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      scrollActiveIntoView();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      navigateTo(results[activeIndex]);
    }
  }

  function scrollActiveIntoView() {
    tick().then(() => {
      const el = modalEl?.querySelector(`[data-result-index="${activeIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  async function navigateTo(entry: SearchEntry) {
    close();
    // entry.href values are valid app routes generated at build time
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto(entry.href);
  }

  // ── Highlight helper ───────────────────────────────────────────────────────
  function highlight(text: string, q: string): string {
    if (!q || q.trim().length < 2) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(
      new RegExp(`(${escapeHtml(escapedQ)})`, 'gi'),
      '<strong class="text-primary-600 dark:text-primary-400">$1</strong>'
    );
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[10vh] px-4"
    onclick={handleBackdropClick}
  >
    <!-- Modal panel -->
    <div
      bind:this={modalEl}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      aria-label={m.search_aria_label()}
      class="w-full max-w-2xl rounded-xl bg-white shadow-2xl dark:bg-gray-900 overflow-hidden flex flex-col max-h-[80vh]"
      onkeydown={handleKeydown}
    >
      {#if !isPlus}
        <!-- Upgrade prompt for free users -->
        <div class="p-8 text-center">
          <div class="mb-3 text-3xl">🔍</div>
          <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {m.search_plus_title()}
          </h2>
          <p class="mb-5 text-sm text-gray-600 dark:text-gray-400">
            {m.search_plus_description()}
          </p>
          <a
            href="/plus?ref=search"
            class="inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            onclick={close}
          >
            {m.search_plus_cta()}
          </a>
          <button
            type="button"
            class="ml-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onclick={close}
          >
            {m.search_close()}
          </button>
        </div>
      {:else}
        <!-- Search input -->
        <div
          class="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700"
        >
          <svg
            class="h-5 w-5 shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            bind:this={inputEl}
            type="search"
            value={query}
            oninput={handleInput}
            placeholder={m.search_placeholder()}
            aria-label={m.search_aria_label()}
            class="flex-1 bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none dark:text-white dark:placeholder-gray-500"
          />
          <kbd
            class="hidden rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-400 sm:inline dark:border-gray-600"
          >
            Esc
          </kbd>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
          <div class="flex gap-1" role="group" aria-label={m.search_filter_source()}>
            {#each ['all', 'vocab', 'uttrykk'] as const as s (s)}
              <button
                type="button"
                class="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors
                  {sourceFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
                onclick={() => {
                  sourceFilter = s;
                }}
              >
                {s === 'all'
                  ? m.search_filter_all()
                  : s === 'vocab'
                    ? m.search_filter_vocab()
                    : m.search_filter_uttrykk()}
              </button>
            {/each}
          </div>
          <div class="flex gap-1 flex-wrap" role="group" aria-label={m.search_filter_level()}>
            {#each LEVELS as lvl (lvl)}
              <button
                type="button"
                class="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors
                  {levelFilter === lvl
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
                onclick={() => {
                  levelFilter = lvl;
                }}
              >
                {lvl === 'all' ? m.search_filter_all_levels() : lvl}
              </button>
            {/each}
          </div>
        </div>

        <!-- Results -->
        <div class="overflow-y-auto flex-1" role="listbox" aria-label={m.search_results_label()}>
          {#if loading}
            <div class="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
              <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {m.search_loading()}
            </div>
          {:else if error}
            <div class="py-10 text-center text-sm text-red-500">{error}</div>
          {:else if query.trim().length >= 2 && results.length === 0}
            <div class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {m.search_no_results({ query: query.trim() })}
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {m.search_no_results_hint()}
              </p>
            </div>
          {:else if query.trim().length < 2 && !loading}
            <div class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              {m.search_empty_hint()}
            </div>
          {:else}
            {#each results as entry (entry.id)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                data-result-index={results.indexOf(entry)}
                role="option"
                aria-selected={activeIndex === results.indexOf(entry)}
                tabindex="-1"
                class="cursor-pointer border-b border-gray-100 px-4 py-3 last:border-0
                  dark:border-gray-800
                  {activeIndex === results.indexOf(entry)
                  ? 'bg-indigo-50 dark:bg-indigo-950/40'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}"
                onclick={() => navigateTo(entry)}
                onmouseenter={() => {
                  activeIndex = results.indexOf(entry);
                }}
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="font-medium text-gray-900 dark:text-white">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html highlight(entry.norsk, query)}
                  </span>
                  <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {entry.level} · {entry.category.replace(/-/g, ' ')}
                  </span>
                </div>
                <div class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html highlight(entry.english, query)}
                </div>
                {#if entry.example}
                  <div class="mt-0.5 text-xs italic text-gray-400 dark:text-gray-500 line-clamp-1">
                    {entry.example}
                  </div>
                {/if}
                {#if hasInflection(entry)}
                  <div class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {m.search_inflection({ norsk: entry.norsk, lemma: entry.lemma })}
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>

        <!-- Footer hint -->
        {#if results.length > 0}
          <div
            class="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500 flex gap-4"
          >
            <span>↑↓ {m.search_hint_navigate()}</span>
            <span>↵ {m.search_hint_open()}</span>
            <span>Esc {m.search_hint_close()}</span>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
