<!--
  Search.svelte

  Full-text search modal for Plus users.
  - Opens on Cmd/Ctrl+K or when `open` prop is set true by the Nav
  - Searches on the server: GET /api/search (Plus-only, rate limited). The index
    never reaches the browser (ai-docs/implementation/search-index-gate.md)
  - Debounced 250 ms input; filter/locale changes search immediately; an
    AbortController drops stale responses and identical requests are skipped
  - Keyboard: ↑/↓ navigate results, Enter navigates, Escape closes
  - Only shown in the Nav for Plus users (free users don't see the button)
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { fetchSearch, SearchRequestError } from '$lib/search';
  import { hasInflection } from '$lib/searchUtils';
  import type { SearchResult } from '$lib/search';
  import { tick, untrack } from 'svelte';
  import { categoryLabel } from '$lib/vocab-helpers';
  import * as m from '$lib/paraglide/messages.js';
  import { localeStore } from '$lib/localeStore.svelte';

  interface Props {
    open: boolean;
    isPlus: boolean;
    onclose: () => void;
  }

  let { open = $bindable(), isPlus, onclose }: Props = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let query = $state('');
  let results: SearchResult[] = $state([]);
  let activeIndex = $state(-1);
  let loading = $state(false);
  let error = $state('');

  let sourceFilter = $state<'all' | 'vocab' | 'uttrykk'>('all');
  let levelFilter = $state('all');

  const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C'] as const;

  // ── Server search ─────────────────────────────────────────────────────────
  const DEBOUNCE_MS = 250;

  // The request currently in flight, and the key of the last request that
  // succeeded (used to skip an identical request, e.g. re-clicking the active filter).
  let controller: AbortController | null = null;
  let lastKey = '';

  function cancelSearch() {
    controller?.abort();
    controller = null;
    lastKey = '';
    loading = false;
  }

  async function runSearch() {
    const q = query.trim();
    if (!isPlus || q.length < 2) {
      cancelSearch();
      results = [];
      error = '';
      return;
    }

    const params = {
      q,
      source: sourceFilter,
      level: levelFilter,
      locale: localeStore.current
    };
    const key = JSON.stringify(params);
    if (key === lastKey) return;

    controller?.abort();
    const mine = new AbortController();
    controller = mine;
    loading = true;
    error = '';

    try {
      const found = await fetchSearch(params, mine.signal);
      if (controller !== mine) return; // a newer request replaced this one
      results = found;
      activeIndex = -1;
      lastKey = key;
    } catch (err) {
      if (controller !== mine || mine.signal.aborted) return;
      results = [];
      lastKey = ''; // allow a retry of the same query
      error =
        err instanceof SearchRequestError && err.status === 429
          ? m.search_rate_limited()
          : m.search_load_error();
    } finally {
      if (controller === mine) {
        loading = false;
        controller = null;
      }
    }
  }

  // ── Debounce ──────────────────────────────────────────────────────────────
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleInput(e: Event) {
    query = (e.target as HTMLInputElement).value;
    activeIndex = -1;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, DEBOUNCE_MS);
  }

  // Re-run search when filters or the active locale change (locale changes
  // which translation the server matches and returns).
  $effect(() => {
    // Explicitly read reactive values so the effect re-runs on change
    const _s = sourceFilter;
    const _l = levelFilter;
    const _loc = localeStore.current;
    void _s;
    void _l;
    void _loc;
    // untrack: runSearch reads `query`, which must not trigger a search per
    // keystroke (typing goes through the debounce above).
    if (untrack(() => open)) untrack(runSearch);
  });

  // ── Modal open/close ───────────────────────────────────────────────────────
  let inputEl = $state<HTMLInputElement | undefined>();
  let modalEl = $state<HTMLDivElement | undefined>();

  $effect(() => {
    if (open) {
      tick().then(() => {
        if (isPlus) inputEl?.focus();
      });
    } else {
      if (debounceTimer) clearTimeout(debounceTimer);
      cancelSearch();
      query = '';
      results = [];
      error = '';
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
      } else if (isPlus) {
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

  async function navigateTo(entry: SearchResult) {
    close();
    // Carry the exact entry into the flashcard deck so the target page can
    // surface it first. `id` (the real w-NNNNNN) identifies the exact sense when
    // several entries share a `norsk`; `word` stays as the fallback for entries
    // without an id (see ai-docs/implementation/search-jump-to-card.md).
    const separator = entry.href.includes('?') ? '&' : '?';
    const idParam = entry.entryId ? `id=${encodeURIComponent(entry.entryId)}&` : '';
    const href = `${entry.href}${separator}${idParam}word=${encodeURIComponent(entry.norsk)}`;
    // entry.href values are valid app routes generated at build time
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto(href);
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
    class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[10vh]"
    onclick={handleBackdropClick}
  >
    <!-- Modal panel -->
    <div
      bind:this={modalEl}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      aria-label={m.search_aria_label()}
      class="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900"
      onkeydown={handleKeydown}
    >
      <!-- Search input -->
      <div class="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
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
        <div class="flex flex-wrap gap-1" role="group" aria-label={m.search_filter_level()}>
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
      <div class="flex-1 overflow-y-auto" role="listbox" aria-label={m.search_results_label()}>
        {#if loading}
          <div class="flex items-center justify-center py-10 text-gray-600 dark:text-gray-300">
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
          <div class="py-10 text-center text-sm text-gray-600 dark:text-gray-300">
            {m.search_no_results({ query: query.trim() })}
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {m.search_no_results_hint()}
            </p>
          </div>
        {:else if query.trim().length < 2 && !loading}
          <div class="py-8 text-center text-sm text-gray-600 dark:text-gray-300">
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
              class="cursor-pointer border-b border-l-2 border-gray-100 px-4 py-3 last:border-b-0
                  dark:border-gray-800
                  {activeIndex === results.indexOf(entry)
                ? 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/60'
                : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'}"
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
                <span class="shrink-0 text-xs text-gray-600 dark:text-gray-300">
                  {entry.level} · {categoryLabel(entry.level, entry.category)}
                </span>
              </div>
              <div class="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html highlight(entry.translation, query)}
              </div>
              {#if entry.example}
                <div class="mt-0.5 line-clamp-1 text-xs text-gray-600 italic dark:text-gray-300">
                  {entry.example}
                </div>
              {/if}
              {#if hasInflection(entry)}
                <div class="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
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
          class="flex gap-4 border-t border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-300"
        >
          <span>↑↓ {m.search_hint_navigate()}</span>
          <span>↵ {m.search_hint_open()}</span>
          <span>Esc {m.search_hint_close()}</span>
        </div>
      {/if}
    </div>
  </div>
{/if}
