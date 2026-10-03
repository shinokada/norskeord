<!--
  TopicRow.svelte
  grammar-update.md Phase 5: one topic, either inside a chapter page section or
  as a search result (with a breadcrumb). Shows level badges, question count, a
  plain-text summary, due count and its free / Plus state, inline in book order.
  Keeps data-testid="topic-title" (used by e2e/grammar.test.ts).
-->
<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import { cefrColors } from '$lib/blog';
  import DueBadge from '$lib/components/DueBadge.svelte';
  import type { TopicEntry } from '$lib/grammar/overview';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    entry: TopicEntry;
    href: string;
    isPlus: boolean;
    /** "Del › Kapittel" shown above the title on search results. */
    breadcrumb?: string;
    /** Practised questions (whole topic); omitted when counts are level-scoped. */
    seen?: number;
    due?: number;
    /** Show the English gloss under the Norwegian title (non-Norwegian UI). */
    showGloss?: boolean;
  }

  let { entry, href, isPlus, breadcrumb, seen = 0, due = 0, showGloss = false }: Props = $props();
</script>

<a
  {href}
  class="hover:border-primary-400 dark:hover:border-primary-500 flex flex-col rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
>
  {#if breadcrumb}
    <p class="mb-1 text-xs text-gray-600 dark:text-gray-300" data-testid="topic-breadcrumb">
      {breadcrumb}
    </p>
  {/if}

  <div class="mb-3 flex items-start justify-between gap-2">
    <div class="flex items-center gap-1">
      {#each entry.levels as lv (lv)}
        <Badge color={cefrColors[lv] ?? 'blue'} data-testid="cefr-badge">{lv}</Badge>
      {/each}
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <DueBadge count={due} />
      <span class="text-xs text-gray-600 dark:text-gray-300">
        {m.grammar_questions_count({ count: entry.total })}
      </span>
    </div>
  </div>

  <p class="font-semibold text-gray-900 dark:text-white" data-testid="topic-title">
    {entry.title}
  </p>
  {#if showGloss && entry.titleEn}
    <p class="text-sm text-gray-500 dark:text-gray-400" data-testid="topic-gloss">
      {entry.titleEn}
    </p>
  {/if}

  {#if entry.summary}
    <p class="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{entry.summary}</p>
  {/if}

  <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
    {#if seen > 0}
      <span class="text-gray-600 dark:text-gray-300">
        {m.grammar_map_progress({ seen, total: entry.total })}
      </span>
    {/if}
    {#if !isPlus}
      {#if entry.access === 'free'}
        <span class="font-medium text-green-700 dark:text-green-400">{m.grammar_map_free()}</span>
      {:else if entry.access === 'locked'}
        <span
          class="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
        >
          <span aria-hidden="true">🔒</span>
          {m.grammar_plus_topic()}
        </span>
      {:else}
        <span class="font-medium text-green-700 dark:text-green-400">
          {m.grammar_map_free_levels({ levels: entry.freeLevels.join(', ') })}
        </span>
        <span class="font-medium text-indigo-700 dark:text-indigo-300">
          <span aria-hidden="true">🔒</span>
          {m.grammar_plus_topic()}
        </span>
      {/if}
    {/if}
  </div>
</a>
