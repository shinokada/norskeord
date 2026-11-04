<script lang="ts">
  import type { GrammarQuestion } from '$lib/types';
  import { autosize } from '$lib/actions/autosize';
  import { shuffleTokens } from '$lib/grammar/session';

  let { question, onsubmit }: { question: GrammarQuestion; onsubmit: (answer: string) => void } =
    $props();

  let value = $state('');
  let inputRef = $state<HTMLTextAreaElement | null>(null);

  // The chips are reference only (not interactive). Reshuffle per question so
  // the displayed order doesn't accidentally match the answer.
  let chips = $derived(shuffleTokens(question.tokens ?? []));

  $effect(() => {
    void question.id;
    value = '';
    setTimeout(() => inputRef?.focus(), 0);
  });
</script>

<p
  id="order-{question.id}-instr"
  class="mb-3 text-xs font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-300"
>
  Skriv setningen i riktig rekkefølge
</p>

{#if question.prompt}
  <p
    id="order-{question.id}-prompt"
    class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
  >
    {question.prompt}
  </p>
{/if}

<p id="order-{question.id}-words-label" class="mb-2 text-xs text-gray-600 dark:text-gray-300">
  Ord du skal bruke
</p>
<div id="order-{question.id}-words" class="mb-4 flex flex-wrap gap-2">
  {#each chips as token, i (i)}
    <span
      class="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
    >
      {token}
    </span>
  {/each}
</div>

<div class="flex items-start gap-2">
  <textarea
    bind:this={inputRef}
    rows="1"
    enterkeyhint="go"
    aria-labelledby="order-{question.id}-instr order-{question.id}-prompt order-{question.id}-words-label order-{question.id}-words"
    bind:value
    use:autosize={value}
    placeholder="Skriv svaret ditt…"
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onsubmit(value);
      }
    }}
    class="min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-indigo-400"
  ></textarea>
  <button
    type="button"
    onclick={() => onsubmit(value)}
    class="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none"
  >
    Sjekk
  </button>
</div>
<div class="mt-3">
  <button
    type="button"
    onclick={() => onsubmit('')}
    class="rounded text-xs text-gray-600 hover:text-gray-900 hover:underline focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none dark:text-gray-300 dark:hover:text-white dark:focus-visible:ring-indigo-400"
  >
    Hopp over
  </button>
</div>
