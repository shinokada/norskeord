<!--
  DueBadge.svelte
  ai-docs/implementation/due-number-update.md: small tinted "N due" count
  pill shown next to section headings (Vocabulary / Uttrykk / Grammar) on
  /my-progress. Renders nothing when the count is 0 or missing.
-->
<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    count?: number;
  }

  let { count = 0 }: Props = $props();
</script>

{#if count > 0}
  <span
    class="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400"
    title={m.stats_due_count({ count })}
  >
    {count > 99 ? '99+' : count}
  </span>
{/if}
