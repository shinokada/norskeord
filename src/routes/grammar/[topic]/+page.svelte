<script lang="ts">
  import { page } from '$app/state';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import { localeStore } from '$lib/localeStore.svelte';
  import GrammarSession from '$lib/components/grammar/GrammarSession.svelte';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  let isPlus = $derived(page.data.plan === 'plus');
  let userId = $derived(isPlus ? (page.data.user?.id ?? null) : null);

  let rule = $derived(GRAMMAR_RULES[data.topic]);
  let isNb = $derived(localeStore.current === 'nb');
  let title = $derived(rule ? (isNb ? rule.titleNb : rule.titleEn) : data.topic);

  // Free users only get the free subset; Plus users get everything.
  let freeSet = $derived(new Set(data.freeQuestionIds));
  let playable = $derived(
    isPlus ? data.questions : data.questions.filter((q) => freeSet.has(q.id))
  );
  let locked = $derived(!isPlus && playable.length === 0);
</script>

<svelte:head>
  <title>{title} · {m.grammar_title()} — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8 text-left">
  <div class="mb-4">
    <a
      href="/grammar"
      class="inline-flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
    >
      {m.grammar_back_to_topics()}
    </a>
  </div>

  <h1 class="mb-6 text-xl font-bold text-gray-900 dark:text-white">📐 {title}</h1>

  {#if locked}
    <div
      class="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center shadow-sm dark:border-amber-700 dark:bg-amber-900/20"
    >
      <p class="mb-2 text-2xl">🔒</p>
      <h2 class="mb-2 text-lg font-bold text-amber-800 dark:text-amber-200">
        {m.grammar_plus_locked_title()}
      </h2>
      <p class="mb-4 text-sm text-amber-700 dark:text-amber-300">{m.grammar_plus_locked_desc()}</p>
      <a
        href="/plus?ref=grammar-topic-lock"
        class="inline-block rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:ring-4 focus:ring-amber-300 focus:outline-none"
      >
        {m.grammar_plus_cta()}
      </a>
    </div>
  {:else}
    {#key data.topic}
      <GrammarSession questions={playable} {rule} {userId} />
    {/key}
  {/if}
</div>
