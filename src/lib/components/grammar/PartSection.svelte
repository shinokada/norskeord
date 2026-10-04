<!--
  PartSection.svelte
  grammar-update.md Phase 5: one Part of the grammar map (Del 1 · Setninger ...)
  as a native <details> accordion, open by default. Native <details> keeps it
  keyboard accessible and works without extra state. Chapter cards go in the
  children snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { TaxonomyPart } from '$lib/grammar/taxonomy';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    part: TaxonomyPart;
    /** Show the English gloss next to the Norwegian part title. */
    showGloss: boolean;
    children: Snippet;
  }

  let { part, showGloss, children }: Props = $props();
</script>

<details class="group mb-8" open data-testid="grammar-part">
  <summary
    class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
  >
    <h2 class="!mb-0 text-xl">
      <span class="text-gray-600 dark:text-gray-300">{m.grammar_map_part({ no: part.no })}</span>
      · {part.titleNb}
      {#if showGloss}
        <span class="text-sm font-normal text-gray-500 dark:text-gray-400">{part.titleEn}</span>
      {/if}
    </h2>
    <span
      aria-hidden="true"
      class="text-gray-600 transition-transform group-open:rotate-180 dark:text-gray-300">▾</span
    >
  </summary>
  <div class="mt-3 grid gap-4 sm:grid-cols-2">
    {@render children()}
  </div>
</details>
