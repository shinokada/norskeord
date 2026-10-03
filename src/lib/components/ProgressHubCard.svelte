<!--
  ProgressHubCard.svelte
  grammar-update.md Phase 4: one of the three equal cards (Vocabulary,
  Uttrykk, Grammar) at the top of /my-progress. Shows seen / mastered / due
  and its own "Study due" button, which only renders when something is due.
-->
<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    icon: string;
    title: string;
    /** Optional link for the title (the grammar detail page, /my-progress/grammar). */
    href?: string;
    seen: number;
    mastered: number;
    due: number;
    /** Review flow for this content type. */
    reviewHref: string;
  }

  let { icon, title, href, seen, mastered, due, reviewHref }: Props = $props();
</script>

<div
  class="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
>
  <h2 class="!mb-3 text-lg">
    {#if href}
      <a {href} class="hover:underline">{icon} {title}</a>
    {:else}
      {icon} {title}
    {/if}
  </h2>

  <div class="grid grid-cols-3 gap-2 text-center">
    <div>
      <p class="text-2xl font-bold text-gray-800 dark:text-white">{seen}</p>
      <p class="text-xs text-gray-500 dark:text-gray-300">{m.stats_seen()}</p>
    </div>
    <div>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">{mastered}</p>
      <p class="text-xs text-gray-500 dark:text-gray-300">{m.stats_grammar_mastered()}</p>
    </div>
    <div>
      <p
        class="text-2xl font-bold {due > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-gray-400 dark:text-gray-500'}"
      >
        {due}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-300">{m.stats_due_today_short()}</p>
    </div>
  </div>

  {#if due > 0}
    <a
      href={reviewHref}
      class="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none"
    >
      <span aria-hidden="true">📌</span>
      {m.stats_study_due_now()}
    </a>
  {/if}
</div>
