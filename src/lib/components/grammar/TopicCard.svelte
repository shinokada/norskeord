<script lang="ts">
  import type { CEFRLevel, GrammarRule, GrammarTopic } from '$lib/types';
  import { localeStore } from '$lib/localeStore.svelte';
  import * as m from '$lib/paraglide/messages';

  let {
    topic,
    rule,
    total,
    levels
  }: {
    topic: GrammarTopic;
    rule: GrammarRule | undefined;
    total: number;
    levels: CEFRLevel[];
  } = $props();

  let isNb = $derived(localeStore.current === 'nb');
  let title = $derived(rule ? (isNb ? rule.titleNb : rule.titleEn) : topic);
</script>

<a
  href={`/grammar/${topic}`}
  class="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-indigo-950/60 dark:hover:border-indigo-500"
>
  <div class="mb-2 flex items-start justify-between gap-2">
    <h2 class="text-lg font-sans group-hover:text-indigo-600">
      {title}
    </h2>
  </div>

  {#if levels.length}
    <div class="mb-2 flex flex-wrap gap-1">
      {#each levels as level (level)}
        <span
          class="rounded bg-indigo-50 px-2 py-1 text-sm font-semibold tracking-wide text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
        >
          {level}
        </span>
      {/each}
    </div>
  {/if}

  <p class="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
    {rule ? (isNb ? rule.explanationNb : rule.explanationEn) : ''}
  </p>

  <div class="mt-auto flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
    <span>{m.grammar_questions_count({ count: total })}</span>
  </div>
</a>
