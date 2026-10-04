<script lang="ts">
  import type { TopicNavModel } from '$lib/grammar/topic-page';
  import * as m from '$lib/paraglide/messages';

  /** Previous/next in book order plus related topics (grammar-update.md, Phase 6a). */
  let { nav }: { nav: TopicNavModel } = $props();

  const linkClass =
    'rounded-lg text-sm text-indigo-600 hover:text-indigo-800 hover:underline focus:ring-4 focus:ring-indigo-300 focus:outline-none dark:text-indigo-300 dark:hover:text-indigo-200';
</script>

<nav
  aria-label={m.grammar_topic_nav_aria()}
  data-testid="topic-nav"
  class="mt-10 border-t border-gray-200 pt-6 dark:border-gray-700"
>
  {#if nav.prev || nav.next}
    <div class="flex items-start justify-between gap-4">
      {#if nav.prev}
        <a href="/grammar/{nav.prev.topic}" data-testid="topic-prev" class="min-w-0 {linkClass}">
          <span class="block text-xs text-gray-500 dark:text-gray-400">
            ← {m.grammar_topic_prev()}
          </span>
          {nav.prev.title}
        </a>
      {:else}
        <span></span>
      {/if}
      {#if nav.next}
        <a
          href="/grammar/{nav.next.topic}"
          data-testid="topic-next"
          class="min-w-0 text-right {linkClass}"
        >
          <span class="block text-xs text-gray-500 dark:text-gray-400">
            {m.grammar_topic_next()} →
          </span>
          {nav.next.title}
        </a>
      {/if}
    </div>
  {/if}

  {#if nav.related.length > 0}
    <h2 class="mt-6 mb-2 text-sm font-semibold text-gray-900 dark:text-white">
      {m.grammar_topic_related()}
    </h2>
    <ul class="flex flex-wrap gap-x-4 gap-y-1" data-testid="topic-related">
      {#each nav.related as link (link.topic)}
        <li><a href="/grammar/{link.topic}" class={linkClass}>{link.title}</a></li>
      {/each}
    </ul>
  {/if}
</nav>
