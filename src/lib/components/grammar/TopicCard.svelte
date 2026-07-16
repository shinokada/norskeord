<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { CEFRLevel, GrammarRule, GrammarTopic } from '$lib/types';
  import { localeStore } from '$lib/localeStore.svelte';
  import { cefrColors } from '$lib/blog';
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
  // Nivå C assumes near-native comprehension, so its topic cards are hardcoded
  // to Norwegian — not locale-dependent at all. Same reasoning as the C-level
  // question content (see ai-docs/implementation/c-grammar-norsk-instruksjoner.md).
  let forceNb = $derived(levels.includes('C'));
  let title = $derived(
    rule ? (forceNb ? rule.titleNb : isNb ? rule.titleNb : rule.titleEn) : topic
  );
</script>

<a
  href={`/grammar/${topic}`}
  class="hover:border-primary-400 dark:hover:border-primary-500 flex flex-col rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
>
  <div class="mb-3 flex items-start justify-between gap-2">
    <div class="flex items-center gap-1">
      {#each levels as level (level)}
        <Badge color={cefrColors[level] ?? 'blue'} data-testid="cefr-badge">{level}</Badge>
      {/each}
    </div>
    <span class="shrink-0 text-xs text-gray-600 dark:text-gray-300">
      {m.grammar_questions_count({ count: total })}
    </span>
  </div>

  <p class="font-semibold text-gray-900 dark:text-white" data-testid="topic-title">
    {title}
  </p>

  <p class="mt-1 line-clamp-2 text-sm text-gray-500 sm:line-clamp-2 dark:text-gray-400">
    {rule ? (forceNb ? rule.explanationNb : isNb ? rule.explanationNb : rule.explanationEn) : ''}
  </p>
</a>
