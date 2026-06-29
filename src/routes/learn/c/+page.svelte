<script lang="ts">
  import { page } from '$app/state';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  let isPlus = $derived(page.data.plan === 'plus');

  const colors = {
    heading: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    accent: 'text-purple-700 dark:text-purple-400'
  };

  function entryLabel(s: { vocab: number; uttrykk: number; total: number } | null): string {
    if (!s) return '';
    if (s.uttrykk > 0) {
      return m.level_hub_words_and_phrases({
        vocab: s.vocab.toLocaleString(),
        uttrykk: s.uttrykk.toLocaleString()
      });
    }
    return m.level_hub_words({ count: s.vocab.toLocaleString() });
  }

  /** Resolve a category slug to its i18n label, falling back to removeHyphensAndCapitalize. */
  function categoryLabel(slug: string): string {
    const key = `category_c_${slug.replace(/-/g, '_')}` as keyof typeof m;
    const fn = m[key];
    if (typeof fn === 'function') {
      return (fn as () => string)();
    }
    return removeHyphensAndCapitalize(slug);
  }

  const visibleCategories = $derived(data.categories);

  const GRAMMAR_INITIAL = 4;
  const BLOG_INITIAL = 2;
  let grammarExpanded = $state(false);
  let blogExpanded = $state(false);

  const visibleGrammarTopics = $derived(
    grammarExpanded ? data.grammarTopics : data.grammarTopics.slice(0, GRAMMAR_INITIAL)
  );
  const hiddenGrammarCount = $derived(data.grammarTopics.length - GRAMMAR_INITIAL);

  const visibleBlogPosts = $derived(
    blogExpanded ? data.blogPosts : data.blogPosts.slice(0, BLOG_INITIAL)
  );
  const hiddenBlogCount = $derived(data.blogPosts.length - BLOG_INITIAL);

  const schemaJson = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: `Learn Norwegian C — Norskeord`,
      description: `All learning resources for Norwegian CEFR level C (Advanced Mastery): vocabulary, grammar, and quizzes.`,
      url: `https://norskeord.no/learn/c`,
      educationalLevel: 'C',
      inLanguage: 'nb',
      learningResourceType: ['Flashcard', 'Practice Problems', 'Quiz'],
      isAccessibleForFree: true,
      provider: { '@type': 'Organization', name: 'Norskeord', url: 'https://norskeord.no' }
    })
  );
</script>

<svelte:head>
  <title>Learn Norwegian C — Norskeord</title>
  <meta
    name="description"
    content="Vocabulary flashcards, grammar practice, and quizzes at C (Mastery) level."
  />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + schemaJson + '</scr' + 'ipt>'}
</svelte:head>

<!-- ── Section 1 — Level hero ──────────────────────────────────────────── -->
<div
  class="mb-10 border-b border-gray-200 bg-gray-50 px-4 py-10 text-center dark:border-gray-700 dark:bg-gray-800/50"
>
  <div class="mx-auto max-w-3xl">
    <div class="flex flex-wrap items-baseline justify-center gap-3">
      <h1
        class="font-bold text-4xl leading-none mb-0 {colors.heading}"
        style="letter-spacing:0.04em"
      >
        C
      </h1>
      <span class="font-norse rounded-full px-3 py-1 text-xl font-semibold {colors.badge}">
        {m.level_hub_mastery()}
      </span>
    </div>
    {#if data.levelStats}
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{entryLabel(data.levelStats)}</p>
    {/if}
    {#if !data.user}
      <a
        href="/auth/login"
        class="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
      >
        {m.level_hub_start_free()}
      </a>
    {/if}
  </div>
</div>

<div class="mx-auto max-w-3xl px-4 pb-16">
  <!-- ── Section 2 — Vocabulary ──────────────────────────────────────────── -->
  <section class="mb-12">
    <h2 class="mb-4 text-xl font-bold dark:text-white">📖 Vocabulary</h2>
    <div class="flex flex-wrap gap-2">
      {#each visibleCategories as cat (cat.slug)}
        {@const locked = !isPlus && cat.locked}
        {#if !locked}
          <a
            href="/c/{cat.slug}"
            class="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition
              border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-gray-700 dark:bg-indigo-950/60 dark:text-gray-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
          >
            {categoryLabel(cat.slug)}
          </a>
        {/if}
      {/each}
      {#if !isPlus}
        {@const lockedCount = data.categories.filter(
          (c: { slug: string; locked: boolean }) => c.locked
        ).length}
        {#if lockedCount >= 3}
          <a
            href="/plus?ref=hub-vocab-badge"
            class="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300"
          >
            +{lockedCount} with Plus →
          </a>
        {/if}
      {/if}
    </div>
  </section>

  <!-- ── Section 3 — Grammar ─────────────────────────────────────────────── -->
  {#if data.grammarTopics.length > 0}
    <section class="mb-12">
      <h2 class="mb-4 text-xl font-bold dark:text-white">🧩 Grammar</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        {#each visibleGrammarTopics as t (t.topic)}
          {@const rule = GRAMMAR_RULES[t.topic]}
          {@const locked = !isPlus && !t.free}
          <a
            href={locked ? '/plus?ref=hub-grammar' : `/grammar/${t.topic}`}
            class="group flex flex-col rounded-2xl border p-4 text-left transition
              {locked
              ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-indigo-950/40'
              : 'border-gray-200 bg-white shadow-sm hover:shadow-md dark:border-white/10 dark:bg-indigo-950/60 dark:hover:bg-indigo-950/80'}"
          >
            <div class="mb-1 flex items-start justify-between gap-2">
              <h3
                class="text-sm font-semibold {locked
                  ? 'opacity-60 '
                  : ''}text-gray-800 dark:text-gray-100"
              >
                {rule ? rule.titleEn : t.topic}
              </h3>
              {#if locked}
                <span
                  class="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                >
                  🔒 Plus
                </span>
              {/if}
            </div>
            {#if t.levels.length}
              <div class="mb-2 flex flex-wrap gap-1">
                {#each t.levels as lv (lv)}
                  <span
                    class="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {lv}
                  </span>
                {/each}
              </div>
            {/if}
            <p
              class="line-clamp-2 text-xs {locked
                ? 'opacity-60 '
                : ''}text-gray-600 dark:text-gray-300"
            >
              {rule ? rule.explanationEn : ''}
            </p>
            <div class="mt-2 text-xs text-gray-600 dark:text-gray-300">{t.total} questions</div>
          </a>
        {/each}
      </div>
      {#if hiddenGrammarCount > 0 || grammarExpanded}
        <button
          onclick={() => (grammarExpanded = !grammarExpanded)}
          class="mt-4 text-sm font-medium {colors.accent} hover:underline"
        >
          {grammarExpanded
            ? m.level_hub_show_less()
            : m.level_hub_show_more({ count: hiddenGrammarCount })}
        </button>
      {/if}
    </section>
  {/if}

  <!-- ── Section 4 — Quiz ────────────────────────────────────────────────── -->
  <section class="mb-12">
    <h2 class="mb-4 text-xl font-bold dark:text-white">🎯 Quiz</h2>
    <a
      href="/quiz?level=C"
      class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-indigo-950/60 dark:hover:bg-indigo-950/80"
    >
      <div class="text-left">
        <p class="font-semibold text-gray-800 dark:text-gray-100">Start a C quiz</p>
        <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
          Multiple-choice, fill-in-the-blank, and typed answers{#if !isPlus}
            · some categories require Plus{/if}
        </p>
      </div>
    </a>
  </section>

  <!-- ── Section 5 — From the blog ─────────────────────────────────────────── -->
  {#if data.blogPosts.length > 0}
    <section class="mb-12">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold dark:text-white">✍️ From the blog</h2>
        <a href="/blog" class="text-xs font-medium {colors.accent} hover:underline">
          {m.level_hub_all_articles()}
        </a>
      </div>
      <div class="space-y-3">
        {#each visibleBlogPosts as post (post.slug)}
          <a
            href="/blog/{post.slug}"
            class="block rounded-xl border border-gray-200 bg-white px-5 py-4 text-left transition hover:shadow-sm dark:border-gray-700 dark:bg-indigo-950/60"
          >
            <p class="font-semibold text-gray-900 dark:text-white">{post.title}</p>
            {#if post.description}
              <p class="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                {post.description}
              </p>
            {/if}
          </a>
        {/each}
      </div>
      {#if hiddenBlogCount > 0 || blogExpanded}
        <button
          onclick={() => (blogExpanded = !blogExpanded)}
          class="mt-4 text-sm font-medium {colors.accent} hover:underline"
        >
          {blogExpanded
            ? m.level_hub_show_less()
            : m.level_hub_show_more({ count: hiddenBlogCount })}
        </button>
      {/if}
    </section>
  {/if}
</div>
