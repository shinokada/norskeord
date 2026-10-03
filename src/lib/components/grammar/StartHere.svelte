<script lang="ts">
  /**
   * The curated A1 «Start here» path on /grammar (grammar-update.md, Phase 8).
   * A native ordered list of links: the order is announced by the list, and
   * every state is written out ("Done", "Next", "n of m practised"), so
   * nothing depends on colour alone.
   */
  import type { StartStep } from '$lib/grammar/start-path';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    steps: StartStep[];
    done: number;
    /** Show the English gloss under each Norwegian title (non-Norwegian UI). */
    showGloss?: boolean;
  }

  let { steps, done, showGloss = false }: Props = $props();
</script>

<section
  class="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20"
  aria-labelledby="grammar-start-heading"
  data-testid="grammar-start-here"
>
  <h2
    id="grammar-start-heading"
    class="mb-1 text-lg font-semibold text-indigo-800 dark:text-indigo-200"
  >
    {m.grammar_start_heading()}
  </h2>
  <p class="text-sm text-gray-600 dark:text-gray-300">{m.grammar_start_intro()}</p>
  <p class="mb-4 text-xs text-gray-600 dark:text-gray-300" data-testid="grammar-start-summary">
    {m.grammar_start_summary({ done, total: steps.length })}
  </p>

  <ol class="space-y-2">
    {#each steps as step, i (step.topic)}
      <li>
        <a
          href={step.href}
          data-testid="grammar-start-step"
          data-state={step.state}
          aria-current={step.state === 'next' ? 'step' : undefined}
          class={[
            'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 transition',
            'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none',
            step.state === 'next'
              ? 'border-indigo-500 bg-white shadow-sm dark:border-indigo-400 dark:bg-indigo-950/60'
              : 'border-gray-200 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60'
          ].join(' ')}
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-medium text-gray-900 dark:text-gray-100">{step.title}</span>
            {#if showGloss && step.titleEn}
              <span
                class="block text-sm text-gray-500 dark:text-gray-400"
                data-testid="grammar-start-gloss"
              >
                {step.titleEn}
              </span>
            {/if}
          </span>
          <span class="text-xs text-gray-600 dark:text-gray-300">
            {m.grammar_start_progress({ seen: step.seen, total: step.target })}
          </span>
          {#if step.state === 'done'}
            <span
              class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200"
            >
              ✓ {m.grammar_start_status_done()}
            </span>
          {:else if step.state === 'next'}
            <span
              class="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white dark:bg-indigo-400 dark:text-indigo-950"
            >
              {m.grammar_start_status_next()}
            </span>
          {/if}
        </a>
      </li>
    {/each}
  </ol>
</section>
