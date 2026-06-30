<script lang="ts">
  import { VocabFlashcardPage } from '$lib';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  let categoryName = $derived(removeHyphensAndCapitalize(data.category));
  const learningResourceSchemaJson = $derived(JSON.stringify(data.learningResourceSchema));
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + learningResourceSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

{#if data.entries.length > 0}
  <VocabFlashcardPage
    entries={data.entries}
    title={categoryName}
    level={data.level}
    prevCategory={data.prevCategory}
    nextCategory={data.nextCategory}
  />
{:else}
  <div class="py-16 text-center">
    <h1 class="text-2xl font-semibold text-gray-700 dark:text-gray-300">{categoryName}</h1>
    <p class="mt-4 text-gray-600 dark:text-gray-300">
      {m.vocab_page_no_entries()}
    </p>
  </div>
{/if}
