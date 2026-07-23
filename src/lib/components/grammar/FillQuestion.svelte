<script lang="ts">
  import type { GrammarQuestion } from '$lib/types';

  let { question, onsubmit }: { question: GrammarQuestion; onsubmit: (answer: string) => void } =
    $props();

  let value = $state('');
  let inputRef = $state<HTMLInputElement | null>(null);

  // Reset + focus whenever the question changes.
  $effect(() => {
    void question.id;
    value = '';
    setTimeout(() => inputRef?.focus(), 0);
  });
</script>

<p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-300">
  Fyll inn i den tomme plassen
</p>

{#if question.prompt}
  <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{question.prompt}</p>
{/if}

<p class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
  {question.sentence}
</p>

{#if question.words && question.words.length}
  <div class="mb-4 flex flex-wrap gap-2">
    {#each question.words as word (word)}
      <span
        class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        {word}
      </span>
    {/each}
  </div>
{/if}

<div class="flex gap-2">
  <input
    bind:this={inputRef}
    type="text"
    bind:value
    placeholder="Skriv svaret ditt…"
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onsubmit(value);
      }
    }}
    class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
  />
  <button
    type="button"
    onclick={() => onsubmit(value)}
    class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none"
  >
    Sjekk
  </button>
</div>
<div class="mt-3">
  <button
    type="button"
    onclick={() => onsubmit('')}
    class="text-xs text-gray-400 hover:text-gray-600 hover:underline dark:hover:text-gray-300"
  >
    Hopp over
  </button>
</div>
