<!--
  ChapterCard.svelte
  grammar-update.md Phase 5: one chapter on the /grammar map. Number, Norwegian
  title (+ English gloss for non-Norwegian UI), level range, topic and question
  counts, progress bar and a free / Plus indicator. The whole card is a link to
  /grammar/chapter/[slug], carrying the active level chip along.
-->
<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import { cefrColors } from '$lib/blog';
  import DueBadge from '$lib/components/DueBadge.svelte';
  import { chapterHref, type ChapterEntry } from '$lib/grammar/overview';
  import type { CEFRLevel } from '$lib/types';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    entry: ChapterEntry;
    /** Active level chip; scopes the counts and is forwarded in the link. */
    level?: CEFRLevel | null;
    isPlus: boolean;
    /** Show the English gloss under the Norwegian title. */
    showGloss: boolean;
    /** Whole-chapter progress (unscoped by level). */
    seen?: number;
    totalQuestions?: number;
    due?: number;
  }

  let {
    entry,
    level = null,
    isPlus,
    showGloss,
    seen = 0,
    totalQuestions = 0,
    due = 0
  }: Props = $props();

  const href = $derived(chapterHref(entry.chapter.slug, level));
  const topicCount = $derived(entry.topics.length);
  // The bar is whole-chapter progress, so hide it when counts are level-scoped.
  const showProgress = $derived(!level && seen > 0 && totalQuestions > 0);
  const pct = $derived(totalQuestions > 0 ? Math.min(100, (seen / totalQuestions) * 100) : 0);
</script>

<a
  {href}
  data-testid="chapter-card"
  class="hover:border-primary-400 dark:hover:border-primary-500 flex flex-col rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-gray-700"
>
  <div class="mb-3 flex items-start justify-between gap-2">
    <span class="text-xs font-semibold tracking-widest text-gray-600 uppercase dark:text-gray-300">
      {m.grammar_map_chapter({ no: entry.chapter.no })}
    </span>
    <div class="flex items-center gap-1">
      {#each entry.levels as lv (lv)}
        <Badge color={cefrColors[lv] ?? 'blue'} data-testid="cefr-badge">{lv}</Badge>
      {/each}
    </div>
  </div>

  <!-- h3: a chapter sits under its Part's h2 on /grammar. -->
  <h3
    class="!mt-0 !mb-0 !text-base font-semibold text-gray-900 dark:text-white"
    data-testid="chapter-title"
  >
    {entry.chapter.titleNb}
  </h3>
  {#if showGloss}
    <p class="text-sm text-gray-500 dark:text-gray-400">{entry.chapter.titleEn}</p>
  {/if}

  <div
    class="mt-3 flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300"
  >
    <span>
      {topicCount === 1
        ? m.grammar_topic_count_singular({ count: topicCount })
        : m.grammar_topic_count({ count: topicCount })}
      · {m.grammar_questions_count({ count: entry.total })}
    </span>
    <DueBadge count={due} />
  </div>

  {#if showProgress}
    <div class="mt-2">
      <div
        class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40"
        aria-hidden="true"
      >
        <div class="h-full rounded-full bg-green-500" style="width: {pct}%"></div>
      </div>
      <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
        {m.grammar_map_progress({ seen, total: totalQuestions })}
      </p>
    </div>
  {/if}

  {#if !isPlus}
    <p class="mt-3 text-xs font-medium text-gray-600 dark:text-gray-300">
      {#if entry.access === 'free'}
        {m.grammar_map_free()}
      {:else if entry.access === 'locked'}
        <span aria-hidden="true">🔒</span>
        {m.grammar_plus_topic()}
      {:else}
        {m.grammar_map_free()} · <span aria-hidden="true">🔒</span>
        {m.grammar_plus_topic()}
      {/if}
    </p>
  {/if}
</a>
