<script lang="ts">
  import type { GrammarQuestion } from '$lib/types';
  import * as m from '$lib/paraglide/messages';

  let { question, onsubmit }: { question: GrammarQuestion; onsubmit: (answer: string) => void } =
    $props();

  let value = $state('');
  let inputRef = $state<HTMLInputElement | null>(null);

  $effect(() => {
    void question.id;
    value = '';
    setTimeout(() => inputRef?.focus(), 0);
  });
</script>

<p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
  {m.grammar_transform_prompt()}
</p>

{#if question.prompt}
  <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{question.prompt}</p>
{/if}

<p class="mb-4 text-lg font-medium text-gray-900 italic dark:text-white">
  "{question.source}"
</p>

<div class="flex gap-2">
  <input
    bind:this={inputRef}
    type="text"
    bind:value
    placeholder={m.grammar_input_placeholder()}
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
    {m.grammar_check()}
  </button>
</div>
<div class="mt-3">
  <button
    type="button"
    onclick={() => onsubmit('')}
    class="text-xs text-gray-400 hover:text-gray-600 hover:underline dark:hover:text-gray-300"
  >
    {m.grammar_skip()}
  </button>
</div>
