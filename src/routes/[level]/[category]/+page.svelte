<script lang="ts">
  import { VocabFlashcardPage } from '$lib';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import { languageStore } from '$lib/stores/language.svelte';
  import { partitionUttrykkThemes, UTTRYKK_OTHERS_THEME } from '$lib/vocab-helpers';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  let categoryName = $derived(removeHyphensAndCapitalize(data.category));
  const learningResourceSchemaJson = $derived(JSON.stringify(data.learningResourceSchema));

  /**
   * Phase 3 (ai-docs/implementation/uttrykk-category.md): label for the
   * active theme filter, shown as a small "Studying: X" line rather than a
   * full chip row (that lives on /learn/[level] now, see Phase 3b). Topical
   * themes share the same slug vocabulary as CATEGORIES_BY_LEVEL, so they
   * reuse the existing `category_{level}_{slug}` i18n keys first; the
   * functional themes/`general`/`others` don't have keys yet and fall back
   * to removeHyphensAndCapitalize, same as categoryLabel() on the hub.
   */
  function themeLabel(level: string, theme: string): string {
    if (theme === UTTRYKK_OTHERS_THEME) return 'Others';
    const key = `category_${level}_${theme.replace(/-/g, '_')}` as keyof typeof m;
    const fn = m[key];
    if (typeof fn === 'function') {
      return (fn as () => string)();
    }
    return removeHyphensAndCapitalize(theme);
  }

  const levelLower = $derived(data.level.toLowerCase());
  const selectedThemeCount = $derived(
    data.selectedTheme === UTTRYKK_OTHERS_THEME
      ? partitionUttrykkThemes(data.themes).othersCount
      : (data.themes.find((t) => t.theme === data.selectedTheme)?.count ?? 0)
  );
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + learningResourceSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

{#if data.entries.length > 0}
  {#if data.selectedTheme}
    <!-- Phase 3: small breadcrumb for an active ?theme= filter (set via a
         /learn/[level] pill) — not a chip row, that lives on the hub now. -->
    <div
      class="mx-auto mt-4 flex w-full max-w-lg items-center justify-center gap-2 px-2 text-sm text-gray-600 dark:text-gray-300"
    >
      <span
        >Studying: <strong class="font-semibold text-gray-800 dark:text-gray-100"
          >{themeLabel(levelLower, data.selectedTheme)}</strong
        >
        ({selectedThemeCount})</span
      >
      <span aria-hidden="true">·</span>
      <a
        href="/{levelLower}/uttrykk"
        class="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        Study all
      </a>
    </div>
  {/if}
  <VocabFlashcardPage
    entries={data.entries}
    title={categoryName}
    level={data.level}
    language={languageStore.current}
    prevCategory={data.prevCategory}
    nextCategory={data.nextCategory}
    nextLocked={data.nextLocked}
  />
{:else}
  <div class="py-16 text-center">
    <h1 class="text-gray-700 dark:text-gray-300">{categoryName}</h1>
    <p class="mt-4 text-gray-600 dark:text-gray-300">
      {m.vocab_page_no_entries()}
    </p>
  </div>
{/if}
