<script lang="ts">
  import { VocabFlashcardPage } from '$lib';
  import { languageStore } from '$lib/stores/language.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  const learningResourceSchemaJson = $derived(JSON.stringify(data.learningResourceSchema));
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + learningResourceSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

{#if data.entries.length > 0}
  <!-- Phase 9 (ai-docs/implementation/uttrykk-category.md): unlike A1–B2's
       uttrykk deck (which has a `?theme=` breadcrumb) or C's regular
       category pages (which have a "came from Uttrykk" breadcrumb, see
       uttrykkContext in [level]/[category]), this route has no filter state
       and no ambiguity about how the visitor got here — it's always the
       full 559-entry deck — so the breadcrumb here is just a fixed count +
       a link back to the hub's Uttrykk section, not conditional on anything. -->
  <div
    class="mx-auto mt-4 flex w-full max-w-lg items-center justify-center gap-2 px-2 text-sm text-gray-600 dark:text-gray-300"
  >
    <span
      >💬 <strong class="font-semibold text-gray-800 dark:text-gray-100"
        >{data.entries.length} fixed expressions</strong
      > across every C category</span
    >
    <span aria-hidden="true">·</span>
    <a
      href="/learn/c#uttrykk"
      class="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
    >
      Back to Uttrykk
    </a>
  </div>
  <VocabFlashcardPage
    entries={data.entries}
    title="Uttrykk"
    level={data.level}
    language={languageStore.current}
  />
{:else}
  <div class="py-16 text-center">
    <h1 class="text-gray-700 dark:text-gray-300">Uttrykk</h1>
    <p class="mt-4 text-gray-600 dark:text-gray-300">
      {m.vocab_page_no_entries()}
    </p>
  </div>
{/if}
