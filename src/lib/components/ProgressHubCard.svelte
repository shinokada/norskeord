<!--
  ProgressHubCard.svelte
  my-progress-update.md Phase 1: one of the three cards (Vocabulary, Uttrykk,
  Grammar) at the top of /my-progress, now acting as a tab. Selecting it shows
  that content type in the panel below. It no longer holds links: the
  "Study due now" button and the grammar detail link live in the panel header
  (a link or button inside a tab button would be invalid HTML).

  Below `sm` only the icon, title and due count are shown so three columns fit
  on a phone; seen / mastered appear from `sm` up.

  Keyboard: roving tabindex (only the active tab is a Tab stop). Arrow / Home /
  End handling is passed in as `onKeydown` by +page.svelte, which owns the tab
  order and moves focus between the sibling tabs.
-->
<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    icon: string;
    title: string;
    seen?: number;
    mastered?: number;
    due?: number;
    /**
     * Quiz card (quiz-progress.md, Phase 3): a main figure, its label and an optional
     * secondary line. When `primary` is set these replace the due / seen / mastered
     * block, since quiz has no due count. The secondary line shows from `sm` up, like
     * seen / mastered on the other cards.
     */
    primary?: string;
    primaryLabel?: string;
    secondary?: string;
    active: boolean;
    onSelect: () => void;
    /** Arrow / Home / End handling, owned by the page so it can move focus between the sibling tabs. */
    onKeydown?: (e: KeyboardEvent) => void;
    /** Id of this tab, referenced by the panel's aria-labelledby. */
    id: string;
    /** Id of the tabpanel this tab controls. */
    panelId: string;
  }

  let {
    icon,
    title,
    seen = 0,
    mastered = 0,
    due = 0,
    primary,
    primaryLabel,
    secondary,
    active,
    onSelect,
    onKeydown,
    id,
    panelId
  }: Props = $props();
</script>

<button
  type="button"
  role="tab"
  {id}
  aria-selected={active}
  aria-controls={panelId}
  tabindex={active ? 0 : -1}
  onclick={onSelect}
  onkeydown={onKeydown}
  class="flex w-full cursor-pointer flex-col rounded-xl border p-3 text-left shadow-sm transition focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none sm:p-4 {active
    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:border-blue-400 dark:bg-blue-900/30 dark:ring-blue-400'
    : 'border-gray-200 bg-white hover:border-gray-400 dark:border-white/10 dark:bg-indigo-950/60 dark:hover:border-white/30'}"
>
  <span
    class="flex items-center gap-1.5 text-sm font-bold text-gray-900 sm:text-lg dark:text-white"
  >
    <span aria-hidden="true">{icon}</span>
    <span class="truncate">{title}</span>
  </span>

  {#if primary !== undefined}
    <!-- Quiz card: accuracy (or "–" until there are enough answers) + answered count -->
    <span class="mt-2 flex items-baseline gap-1">
      <span class="text-xl font-bold text-gray-800 sm:text-2xl dark:text-white">{primary}</span>
      <span class="text-xs text-gray-500 dark:text-gray-300">{primaryLabel}</span>
    </span>
    {#if secondary}
      <span class="mt-2 hidden text-xs text-gray-500 sm:flex dark:text-gray-300">{secondary}</span>
    {/if}
  {:else}
    <!-- Due count: always visible, including on mobile -->
    <span class="mt-2 flex items-baseline gap-1">
      <span
        class="text-xl font-bold sm:text-2xl {due > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-gray-400 dark:text-gray-500'}">{due}</span
      >
      <span class="text-xs text-gray-500 dark:text-gray-300">{m.stats_due_today_short()}</span>
    </span>

    <!-- Seen / mastered: sm and up -->
    <span class="mt-2 hidden gap-4 text-xs text-gray-500 sm:flex dark:text-gray-300">
      <span
        ><span class="font-semibold text-gray-800 dark:text-white">{seen}</span>
        {m.stats_seen()}</span
      >
      <span
        ><span class="font-semibold text-green-600 dark:text-green-400">{mastered}</span>
        {m.stats_grammar_mastered()}</span
      >
    </span>
  {/if}
</button>
