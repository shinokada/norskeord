<script lang="ts">
  /**
   * Renders a GrammarRule.explanationNb string as paragraphs and bullet
   * lists, using plain-text markers instead of markdown (see
   * ai-docs/implementation/grammar-explanation-update.md, "Problem A").
   *
   * Convention (author rules.ts strings using these):
   * - Blank line ("\n\n") separates paragraphs.
   * - A line starting with "• " is a bullet item; consecutive bullet lines
   *   become one <ul>.
   * - "**text**" anywhere in a paragraph or bullet item renders bold —
   *   used to label a term/pattern, not for general emphasis.
   * - Strings with no "\n" at all render exactly as a single <p>, so
   *   existing single-paragraph rules keep working unchanged.
   *
   * Long explanations (more than LONG_THRESHOLD blocks) collapse behind a
   * "Vis mer" toggle, showing only the intro paragraph by default — see
   * the pilot review in grammar-explanation-update.md, Problem A.
   */
  let { text, collapsible = true }: { text: string; collapsible?: boolean } = $props();

  type Block = { type: 'p'; content: string } | { type: 'ul'; items: string[] };
  type InlineSegment = { bold: boolean; text: string };

  function parseInline(raw: string): InlineSegment[] {
    return raw
      .split(/(\*\*.+?\*\*)/g)
      .filter(Boolean)
      .map((part) =>
        part.startsWith('**') && part.endsWith('**')
          ? { bold: true, text: part.slice(2, -2) }
          : { bold: false, text: part }
      );
  }

  function parseBlocks(raw: string): Block[] {
    const blocks: Block[] = [];
    const chunks = raw
      .split(/\n\n+/)
      .map((c) => c.trim())
      .filter(Boolean);

    for (const chunk of chunks) {
      const lines = chunk
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      let i = 0;
      while (i < lines.length) {
        if (lines[i].startsWith('• ')) {
          const items: string[] = [];
          while (i < lines.length && lines[i].startsWith('• ')) {
            items.push(lines[i].slice(2).trim());
            i++;
          }
          blocks.push({ type: 'ul', items });
        } else {
          const paraLines: string[] = [];
          while (i < lines.length && !lines[i].startsWith('• ')) {
            paraLines.push(lines[i]);
            i++;
          }
          blocks.push({ type: 'p', content: paraLines.join(' ') });
        }
      }
    }
    return blocks;
  }

  let blocks = $derived(parseBlocks(text));

  // "Long" = more than one structured section beyond the intro paragraph.
  // Simple single-paragraph rules (blocks.length === 1) never show the toggle.
  const LONG_THRESHOLD = 2;
  let isLong = $derived(collapsible && blocks.length > LONG_THRESHOLD);
  let expanded = $state(false);
  let visibleBlocks = $derived(isLong && !expanded ? blocks.slice(0, 1) : blocks);
</script>

<div class="text-sm text-gray-700 dark:text-gray-300">
  {#each visibleBlocks as block, i (i)}
    {#if block.type === 'ul'}
      <ul
        class="mb-4 list-disc space-y-1 pl-5 marker:text-indigo-400 last:mb-0 dark:marker:text-indigo-400"
      >
        {#each block.items as item, j (j)}
          <li>
            {#each parseInline(item) as seg, k (k)}
              {#if seg.bold}<strong class="font-semibold text-gray-900 dark:text-white"
                  >{seg.text}</strong
                >{:else}{seg.text}{/if}
            {/each}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="mb-2 last:mb-0">
        {#each parseInline(block.content) as seg, k (k)}
          {#if seg.bold}<strong class="font-semibold text-gray-900 dark:text-white"
              >{seg.text}</strong
            >{:else}{seg.text}{/if}
        {/each}
      </p>
    {/if}
  {/each}

  {#if isLong}
    <button
      type="button"
      onclick={() => (expanded = !expanded)}
      class="mt-1 rounded text-xs font-medium text-indigo-500 hover:text-indigo-700 hover:underline focus:ring-4 focus:ring-indigo-300 focus:outline-none dark:text-indigo-400 dark:hover:text-indigo-300"
    >
      {expanded ? 'Vis mindre ↑' : 'Vis mer ↓'}
    </button>
  {/if}
</div>
