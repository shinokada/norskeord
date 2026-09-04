<!--
  Search.svelte

  Full-text search modal for Plus users.
  - Opens on Cmd/Ctrl+K or when `open` prop is set true by the Nav
  - Lazy-loads /data/search-index.json on first open
  - Debounced 150 ms input; four-pass in-browser scoring
  - Keyboard: ↑/↓ navigate results, Enter navigates, Escape closes
  - Only shown in the Nav for Plus users (free users don't see the button)
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { loadSearchIndex } from '$lib/search';
  import { search, hasInflection } from '$lib/searchUtils';
  import type { SearchEntry } from '$lib/search';
  import type { SearchFilter } from '$lib/searchUtils';
  import { tick } from 'svelte';
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
  let results: SearchEntry[] = $state([]);
  let activeIndex = $state(-1);
  let loading = $state(false);
  let error = $state('');

  let sourceFilter = $state<'all' | 'vocab' | 'uttrykk'>('all');
  let levelFilter = $state('all');

  const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C'] as const;

  // ── Index cache ───────────────────────────────────────────────────────────
  let index: SearchEntry[] | null = null;

  async function ensureIndex() {
    if (index) return;
    loading = true;
    error = '';
    try {
      index = await loadSearchIndex();
      // The user may have already typed (and had a debounced runSearch()
      // bail out via `if (!index) return;` above) while this fetch was
      // still in flight — nothing else re-triggers a search once `index`
      // is set, since it's a plain variable, not reactive `$state`. Re-run
      // now so a query typed during the ~4MB fetch doesn't get stuck on
      // an empty result set forever.
      if (query.trim().length >= 2) runSearch();
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
    results = search(query, index, filter, translationFor, exampleTranslationFor);
    activeIndex = -1;
  }

  // Re-run search when filters or the active locale change (locale changes
  // which language field matching/display use — see translationFor below)
  $effect(() => {
    // Explicitly read reactive values so the effect re-runs on change
    const _s = sourceFilter;
    const _l = levelFilter;
    const _loc = localeStore.current;
    void _s;
    void _l;
    void _loc;
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

  async function navigateTo(entry: SearchEntry) {
    close();
    // Carry the exact word into the flashcard deck via ?word= so the target
    // page can surface it first instead of wherever it lands in the shuffle
    // (see ai-docs/implementation/search-jump-to-card.md).
    const separator = entry.href.includes('?') ? '&' : '?';
    const href = `${entry.href}${separator}word=${encodeURIComponent(entry.norsk)}`;
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

  // ── Translation for the currently selected locale ─────────────────────────
  // 'nb' (Norsk) prefers the monolingual Norwegian definition (B1+ only);
  // falls back to English when no definition exists (A1/A2) or none was found.
  // Other locales show that language's translation, falling back to English
  // when the entry hasn't been translated yet.
  function translationFor(entry: SearchEntry): string {
    const locale = localeStore.current;
    if (locale === 'nb') return entry.definition ?? entry.english;
    if (locale === 'es') return entry.spanish ?? entry.english;
    if (locale === 'uk') return entry.ukrainian ?? entry.english;
    if (locale === 'de') return entry.german ?? entry.english;
    return entry.english;
  }

  // Example-sentence counterpart of translationFor, used so a query typed in
  // the selected language can also match against the example translation
  // (mirrors getExampleTranslation in vocab-helpers.ts, but for SearchEntry).
  // No definition equivalent exists for examples, so 'nb' just falls back to
  // English like every other locale with a missing translation.
  function exampleTranslationFor(entry: SearchEntry): string {
    const locale = localeStore.current;
    if (locale === 'es') return entry.example_spanish ?? entry.example_english;
    if (locale === 'uk') return entry.example_ukrainian ?? entry.example_english;
    if (locale === 'de') return entry.example_german ?? entry.example_english;
    return entry.example_english;
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
                {@html highlight(translationFor(entry), query)}
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
