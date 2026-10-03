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
  <!-- The visible number alone means nothing to a screen reader, and a title is never
       announced on touch or keyboard, so the full text ("N due") is read instead. -->
  <span
    class="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
    title={m.stats_due_count({ count })}
  >
    <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
    <span class="sr-only">{m.stats_due_count({ count })}</span>
  </span>
{/if}
