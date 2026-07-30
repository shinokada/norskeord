<script lang="ts">
  import { VocabFlashcardPage } from '$lib';
  import { languageStore } from '$lib/stores/language.svelte';
  import { categoryLabel, partitionUttrykkThemes, UTTRYKK_OTHERS_THEME } from '$lib/vocab-helpers';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  const learningResourceSchemaJson = $derived(JSON.stringify(data.learningResourceSchema));

  /**
   * Phase 2/3 (ai-docs/implementation/quiz-i18n-and-categories.md): label
   * for the "Studying: X" breadcrumb — used both for an active ?theme=
   * filter (A1–B2 uttrykk) and, as of Phase 3, for the plain category name
   * on every category page (see studyingLabel below). Both share the same
   * `category_{level}_{slug}` i18n keys via the shared categoryLabel()
   * helper; 'others' is the one theme value with no real category slug, so
   * it's special-cased here rather than in the shared helper.
   */
  function themeLabel(level: string, slug: string): string {
    if (slug === UTTRYKK_OTHERS_THEME) return 'Others';
    return categoryLabel(level, slug);
  }

  const levelLower = $derived(data.level.toLowerCase());

  // Phase 3: unconditional "Studying: X" label — falls back to the plain
  // category slug when no ?theme= filter is active, instead of only ever
  // resolving for A1–B2's uttrykk-with-theme case as before.
  const studyingLabel = $derived(themeLabel(levelLower, data.selectedTheme ?? data.category));

  /**
   * Header label for VocabFlashcardPage's H1 ("B1 · Vocabulary" /
   * "B1 · Uttrykk (Phrases)") — which section the deck belongs to, not the
   * specific category (that's already shown by the "Studying: X" breadcrumb
   * above). Reuses the existing i18n'd stats_vocabulary_heading /
   * stats_uttrykk_heading keys rather than introducing new ones.
   */
  const sectionLabel = $derived(
    data.section === 'uttrykk' ? m.stats_uttrykk_heading() : m.stats_vocabulary_heading()
  );

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
  <!-- Phase 3 (ai-docs/implementation/quiz-i18n-and-categories.md): the
       "Studying: X" breadcrumb is now unconditional — every category page
       shows it, not just uttrykk-with-theme. When data.selectedTheme is set
       (A1–B2 uttrykk theme filter) it keeps its count + "Study all" link;
       otherwise it falls back to the plain category name via studyingLabel. -->
  <div
    class="mx-auto mt-4 flex w-full max-w-lg flex-col items-center gap-1 px-2 text-sm text-gray-600 dark:text-gray-300"
  >
    <div class="flex items-center justify-center gap-2">
      <span
        >Studying: <strong class="font-semibold text-gray-800 dark:text-gray-100"
          >{studyingLabel}</strong
        >{#if data.selectedTheme}
          ({selectedThemeCount}){/if}</span
      >
      {#if data.selectedTheme}
        <span aria-hidden="true">·</span>
        <a
          href="/{levelLower}/uttrykk"
          class="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Study all
        </a>
      {/if}
    </div>
    {#if data.uttrykkContext}
      <!-- Phase 8 (ai-docs/implementation/uttrykk-category.md): C has no
           separate uttrykk deck — this page is the same combined vocab+idiom
           category deck whether reached via the Vocabulary pill or the
           Uttrykk pill. This note sits alongside the Studying breadcrumb
           above (rather than replacing it, as it did pre-Phase 3) so a
           visitor who arrived via that pill still gets a "you're in
           Uttrykk territory" cue in addition to the same category-name
           breadcrumb every other category page now shows. -->
      <div class="flex items-center justify-center gap-2">
        <span
          >💬 Includes <strong class="font-semibold text-gray-800 dark:text-gray-100"
            >{data.uttrykkContext.count} fixed expressions</strong
          ></span
        >
        <span aria-hidden="true">·</span>
        <a
          href={data.uttrykkContext.backHref}
          class="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Back to Uttrykk
        </a>
      </div>
    {/if}
  </div>
  <VocabFlashcardPage
    entries={data.entries}
    level={data.level}
    {sectionLabel}
    language={languageStore.current}
    prevCategory={data.prevCategory}
    nextCategory={data.nextCategory}
    nextLocked={data.nextLocked}
  />
{:else}
  <div class="py-16 text-center">
    <h1 class="text-gray-700 dark:text-gray-300">{studyingLabel}</h1>
    <p class="mt-4 text-gray-600 dark:text-gray-300">
      {m.vocab_page_no_entries()}
    </p>
  </div>
{/if}
