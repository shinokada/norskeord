<script lang="ts">
  import { VocabFlashcardPage } from '$lib';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import { languageStore } from '$lib/stores/language.svelte';

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
    language={languageStore.current}
    prevCategory={data.prevCategory}
    nextCategory={data.nextCategory}
  />
{:else}
  <div class="py-16 text-center">
    <h1 class="text-2xl font-semibold text-gray-700 dark:text-gray-300">{categoryName}</h1>
    <p class="mt-4 text-gray-600 dark:text-gray-300">
      No vocabulary available yet. Check back soon!
    </p>
  </div>
{/if}
