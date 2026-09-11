<script lang="ts">
  /**
   * /review — due-only session across categories/levels.
   * ai-docs/implementation/due-only.md — Step 3.
   *
   * Query params:
   *   ?level=b1              restrict to one CEFR level (omit = all levels)
   *   ?category=food         restrict to one category/theme (used by the
   *                          per-category due badge — LevelStatRows.svelte)
   *   ?type=vocab|uttrykk|both
   *                          vocab-vs-uttrykk split. Omitted from the global
   *                          and per-level entry points → shows the picker
   *                          below first. Always present when `category` is
   *                          set (the category link already implies a type),
   *                          so the picker never shows in that case.
   *
   * No +page.server.ts — everything needed (progress map, due filtering,
   * entry resolution) happens client-side; see getDueItems() in progress.ts
   * and POST /api/review-entries.
   */
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { VocabFlashcardPage } from '$lib';
  import { languageStore } from '$lib/stores/language.svelte';
  import { loadProgressMap, loadProgressMapFromSupabase, getDueItems } from '$lib/progress';
  import { uttrykkOthersKeysForLevel } from '$lib/stats';
  import { UTTRYKK_OTHERS_THEME } from '$lib/vocab-helpers';
  import type { CardProgress, CEFRLevel, VocabEntry } from '$lib/types';

  type ReviewType = 'vocab' | 'uttrykk' | 'both';
  const LEVELS: readonly CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

  function parseLevel(v: string | null): CEFRLevel | undefined {
    if (!v) return undefined;
    const upper = v.toUpperCase();
    return (LEVELS as readonly string[]).includes(upper) ? (upper as CEFRLevel) : undefined;
  }

  function parseType(v: string | null): ReviewType | undefined {
    return v === 'vocab' || v === 'uttrykk' || v === 'both' ? v : undefined;
  }

  const levelParam = $derived(parseLevel(page.url.searchParams.get('level')));
  const categoryParam = $derived(page.url.searchParams.get('category') ?? undefined);
  const typeParam = $derived(parseType(page.url.searchParams.get('type')));

  // A category link already implies a specific dataset — never show the
  // picker for it, defaulting to 'both' if the link somehow omitted ?type=.
  const needsPicker = $derived(!categoryParam && !typeParam);

  let phase = $state<'picker' | 'loading' | 'empty' | 'ready'>('loading');
  let entries = $state<VocabEntry[]>([]);

  const isPlus = $derived(page.data.plan === 'plus');

  async function loadSession(type: ReviewType) {
    phase = 'loading';

    const userId = page.data.user?.id as string | undefined;
    const progressMap: Record<string, CardProgress> =
      isPlus && userId ? await loadProgressMapFromSupabase(userId) : await loadProgressMap();

    // Fix 2 (ai-docs/implementation/due-only-review-update.md): A1–B2
    // uttrykk rows are keyed by theme, which CardProgress.category can't
    // express (every A1–B2 uttrykk card's category is the 'uttrykk'
    // sentinel) — getDueItems() can only scope by category, so skip that
    // option here and fetch the whole level+type instead; the theme filter
    // happens below, after resolving, against the real `theme` field that
    // only exists on the resolved VocabEntry. The synthetic "Others" bucket
    // needs the same treatment for C too — its category param ('others')
    // isn't a real CardProgress.category value there either (C's real
    // per-card categories are its actual slugs), so it can't be scoped by
    // getDueItems() any more than an A1–B2 theme can.
    const isA1B2UttrykkTheme = !!categoryParam && type === 'uttrykk' && levelParam !== 'C';
    const isCOthers =
      categoryParam === UTTRYKK_OTHERS_THEME && type === 'uttrykk' && levelParam === 'C';

    const dueItems = getDueItems(progressMap, {
      level: levelParam,
      category: isA1B2UttrykkTheme || isCOthers ? undefined : categoryParam,
      type
    });

    if (dueItems.length === 0) {
      entries = [];
      phase = 'empty';
      return;
    }

    const res = await fetch('/api/review-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: dueItems.map((d) => ({ id: d.id, level: d.level })) })
    });
    const json = await res.json().catch(() => ({ entries: [] }));
    let resolved = (json.entries as VocabEntry[] | undefined) ?? [];

    // Fix 2: narrow to the exact row that was clicked. For vocab and
    // C-uttrykk rows this is a no-op refinement (getDueItems already scoped
    // by category); for A1–B2 uttrykk rows this is what actually narrows
    // the level-wide fetch above down to the one theme that was clicked.
    // The synthetic "Others" bucket (A1–B2 theme or C category) resolves
    // against uttrykkOthersKeysForLevel() instead, since 'others' itself
    // never appears as a real theme/category on any entry.
    if (categoryParam === UTTRYKK_OTHERS_THEME && levelParam) {
      const othersKeys = uttrykkOthersKeysForLevel(levelParam, progressMap);
      resolved = resolved.filter(
        (e) => (e.theme && othersKeys.has(e.theme)) || othersKeys.has(e.category)
      );
    } else if (categoryParam) {
      resolved = resolved.filter((e) => e.category === categoryParam || e.theme === categoryParam);
    }

    entries = resolved;
    phase = entries.length === 0 ? 'empty' : 'ready';
  }

  function pick(type: ReviewType) {
    void loadSession(type);
  }

  onMount(() => {
    if (needsPicker) {
      phase = 'picker';
      return;
    }
    const type = typeParam ?? 'both';
    void loadSession(type);
  });

  // "B1 · Due Review" when scoped to a level, just "Due Review" when global —
  // VocabFlashcardPage's header only prefixes "{level} ·" when level is truthy.
  const headerLevel = $derived(levelParam ?? '');
  const sectionLabel = 'Due Review';
</script>

<svelte:head>
  <title>Due Review — Norskeord</title>
</svelte:head>

{#if phase === 'picker'}
  <div class="mx-auto mt-16 max-w-md px-4 text-center">
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
      What do you want to review?
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">
      {#if levelParam}Only cards due at {levelParam} right now.{:else}Every card due right now,
        across all levels.{/if}
    </p>
    <div class="mt-6 flex flex-col gap-3">
      <button
        type="button"
        onclick={() => pick('vocab')}
        class="rounded-lg bg-blue-600 px-5 py-3 text-base font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none"
      >
        📖 Vocabulary
      </button>
      <button
        type="button"
        onclick={() => pick('uttrykk')}
        class="rounded-lg bg-indigo-600 px-5 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none"
      >
        💬 Uttrykk
      </button>
      <button
        type="button"
        onclick={() => pick('both')}
        class="rounded-lg border border-gray-300 px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        Both
      </button>
    </div>
  </div>
{:else if phase === 'loading'}
  <div class="mx-auto mt-24 max-w-md px-4 text-center">
    <p class="text-gray-500 dark:text-gray-300">Loading your due cards…</p>
  </div>
{:else if phase === 'empty'}
  <div class="mx-auto mt-16 max-w-md px-4 text-center">
    <p class="text-2xl">🎉</p>
    <p class="mt-3 text-lg font-medium text-gray-800 dark:text-gray-100">Nothing due right now</p>
    <p class="mt-1 text-gray-500 dark:text-gray-300">
      {#if levelParam}No {levelParam} cards are due{categoryParam ? ' in this category' : ''} at the moment
        — check back later.{:else}You're all caught up — check back later.{/if}
    </p>
    <div class="mt-5 flex justify-center gap-4 text-sm">
      <a href="/stats" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        View stats
      </a>
      <a href="/" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        Browse levels
      </a>
    </div>
  </div>
{:else}
  <VocabFlashcardPage
    {entries}
    level={headerLevel}
    {sectionLabel}
    language={languageStore.current}
  />
{/if}
