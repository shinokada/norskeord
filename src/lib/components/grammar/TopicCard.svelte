<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { CEFRLevel, GrammarRule, GrammarTopic } from '$lib/types';
  import { cefrColors } from '$lib/blog';
  import * as m from '$lib/paraglide/messages';

  let {
    topic,
    rule,
    total,
    levels,
    level = null,
    from = null
  }: {
    topic: GrammarTopic;
    rule: GrammarRule | undefined;
    total: number;
    levels: CEFRLevel[];
    level?: CEFRLevel | null;
    from?: string | null;
  } = $props();

  // Grammar questions are Norwegian-only at every level (see
  // ai-docs/implementation/grammar-with-only-norsk.md).
  let title = $derived(rule ? rule.titleNb : topic);

  // When the /grammar hub has an active level-pill filter, forward it so
  // the topic page scopes its questions to that level too (see
  // ai-docs/implementation/grammar-ux-update.md Step 2). With no active
  // filter, the link is unchanged — topic page shows every level, as before.
  let href = $derived(
    level ? `/grammar/${topic}?level=${level}${from ? `&from=${from}` : ''}` : `/grammar/${topic}`
  );
</script>

<a
  {href}
  class="hover:border-primary-400 dark:hover:border-primary-500 flex flex-col rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
>
  <div class="mb-3 flex items-start justify-between gap-2">
    <div class="flex items-center gap-1">
      {#each levels as lv (lv)}
        <Badge color={cefrColors[lv] ?? 'blue'} data-testid="cefr-badge">{lv}</Badge>
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
    {rule ? rule.explanationNb : ''}
  </p>
</a>
