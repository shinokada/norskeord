<script lang="ts">
  import type { GrammarQuestion } from '$lib/types';

  let { question, onsubmit }: { question: GrammarQuestion; onsubmit: (answer: string) => void } =
    $props();
</script>

<p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-300">
  Hvilken setning er riktig?
</p>

{#if question.prompt}
  <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{question.prompt}</p>
{/if}

<div class="flex flex-col gap-3">
  <button
    type="button"
    onclick={() => onsubmit('A')}
    class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-800 transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30"
  >
    <span
      class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
      >A</span
    >
    <span>{question.optionA}</span>
  </button>

  <button
    type="button"
    onclick={() => onsubmit('B')}
    class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-800 transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30"
  >
    <span
      class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
      >B</span
    >
    <span>{question.optionB}</span>
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
