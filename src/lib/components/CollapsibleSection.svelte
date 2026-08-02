<!--
  CollapsibleSection.svelte
  ai-docs/implementation/stats-page-update.md Phase 1: shared header +
  toggle + chevron for the three content-type blocks on /stats
  (Vocabulary/Uttrykk/Grammar). Wraps only the collapsible part of a
  section — the always-visible summary card/grid is rendered by the caller
  above this component, never inside it, so toggling never hides the
  at-a-glance numbers (Goal 2).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    icon: string; // '📖' | '💬' | '📐'
    title: string; // already-translated m.stats_vocabulary_heading() etc.
    open: boolean;
    onToggle: () => void;
    id: string; // for aria-controls / the content wrapper's id
    // Always-visible content (the summary card/grid) — rendered between the
    // header and the collapsible region, authored by the caller so this
    // component never controls whether it's shown (Goal 2: the at-a-glance
    // numbers are never hidden by toggling).
    summary?: Snippet;
    // The collapsible part — LevelStatRows + Plus-upsell-box, in practice.
    children: Snippet;
  }

  let { icon, title, open, onToggle, id, summary, children }: Props = $props();
</script>

<button
  type="button"
  onclick={onToggle}
  aria-expanded={open}
  aria-controls="{id}-content"
  class="mb-3 flex w-full items-center justify-between gap-2 text-left"
>
  <h2 class="!mb-0">{icon} {title}</h2>
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    class="h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 {open
      ? 'rotate-180'
      : ''}"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clip-rule="evenodd"
    />
  </svg>
</button>

{#if summary}
  {@render summary()}
{/if}

{#if open}
  <div id="{id}-content">
    {@render children()}
  </div>
{/if}
