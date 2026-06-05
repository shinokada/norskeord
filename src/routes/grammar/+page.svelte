<script lang="ts">
  import { page } from '$app/state';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import TopicCard from '$lib/components/grammar/TopicCard.svelte';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  let isPlus = $derived(page.data.plan === 'plus');
</script>

<svelte:head>
  <title>{m.grammar_title()} — Norskeord</title>
  <meta name="description" content={m.grammar_subtitle()} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
  <div class="mb-8 text-center">
    <h1 class="mb-2 text-3xl font-bold dark:text-white">📐 {m.grammar_title()}</h1>
    <p class="text-gray-500 dark:text-gray-400">{m.grammar_subtitle()}</p>
  </div>

  <p class="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">{m.grammar_pick_topic()}</p>

  <!-- Free topics -->
  <div class="mb-8 grid gap-4 sm:grid-cols-2">
    {#each data.freeTopics as t (t.topic)}
      <TopicCard topic={t.topic} rule={GRAMMAR_RULES[t.topic]} total={t.total} levels={t.levels} />
    {/each}
  </div>

  <!-- Locked topics -->
  {#if data.lockedTopics.length > 0}
    {#if isPlus}
      <!-- Plus users see all topics unlocked -->
      <div class="grid gap-4 sm:grid-cols-2">
        {#each data.lockedTopics as t (t.topic)}
          <TopicCard
            topic={t.topic}
            rule={GRAMMAR_RULES[t.topic]}
            total={t.total}
            levels={t.levels}
          />
        {/each}
      </div>
    {:else}
      <!-- Free users see locked cards as teasers linking to /plus -->
      <div class="grid gap-4 sm:grid-cols-2">
        {#each data.lockedTopics as t (t.topic)}
          {@const rule = GRAMMAR_RULES[t.topic]}
          <a
            href="/plus?ref=grammar-topics"
            class="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-indigo-950/60 dark:hover:border-indigo-500"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <h2
                class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 dark:text-white"
              >
                {rule ? rule.titleEn : t.topic}
              </h2>
              <span
                class="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              >
                🔒 Plus
              </span>
            </div>
            {#if t.levels.length}
              <div class="mb-2 flex flex-wrap gap-1">
                {#each t.levels as level (level)}
                  <span
                    class="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                    >{level}</span
                  >
                {/each}
              </div>
            {/if}
            <p class="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
              {rule ? rule.explanationEn : ''}
            </p>
            <div class="mt-auto text-xs text-gray-400 dark:text-gray-500">{t.total} questions</div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</div>
