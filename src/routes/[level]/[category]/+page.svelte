<script lang="ts">
  import { VocabFlashcardPage } from '$lib';
  import { removeHyphensAndCapitalize } from '$lib/utils';

  let { data } = $props();

  let categoryName = $derived(removeHyphensAndCapitalize(data.category));
  let title = $derived(`Norwegian ${data.level} ${categoryName} Vocabulary — Norskeord`);
  let description = $derived(
    `Learn ${data.entries.length > 0 ? data.entries.length + ' ' : ''}Norwegian ${categoryName} words with audio flashcards at ${data.level} level. Free on Norskeord.`
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
</svelte:head>

{#if data.entries.length > 0}
  <VocabFlashcardPage entries={data.entries} title={categoryName} />
{:else}
  <div class="py-16 text-center">
    <h1 class="text-2xl font-semibold text-gray-700 dark:text-gray-300">{categoryName}</h1>
    <p class="mt-4 text-gray-500 dark:text-gray-400">
      No vocabulary available yet. Check back soon!
    </p>
  </div>
{/if}
