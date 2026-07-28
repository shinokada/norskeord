<script lang="ts">
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import GrammarSession from '$lib/components/grammar/GrammarSession.svelte';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  let isPlus = $derived(page.data.plan === 'plus');
  let userId = $derived(isPlus ? (page.data.user?.id ?? null) : null);

  let rule = $derived(GRAMMAR_RULES[data.topic]);
  // Grammar questions are Norwegian-only at every level (see
  // ai-docs/implementation/grammar-with-only-norsk.md).
  let title = $derived(rule ? rule.titleNb : data.topic);

  // Optional level scoping (ai-docs/implementation/grammar-fix.md §5,
  // extended in ai-docs/implementation/grammar-ux-update.md Step 1): when a
  // locked-segment card or a level hub links here with e.g. ?level=B1, a
  // free user must see the paywall even if the topic has free content at a
  // *different* level (e.g. A1) — otherwise they'd silently land on the
  // wrong content instead of the lock screen. Plus users are now scoped by
  // levelParam too (previously they saw every level combined regardless —
  // that let a topic clicked from e.g. /learn/b2 show its A2/B1 questions
  // as well, which is the bug grammar-ux-update.md Step 1 fixes).
  const CEFR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C']);
  let levelParam = $derived(() => {
    const raw = page.url.searchParams.get('level')?.toUpperCase() ?? '';
    return CEFR_LEVELS.has(raw) ? (raw as (typeof data.questions)[number]['cefr']) : null;
  });

  // Free users get the free subset; Plus users get everything. Either way,
  // the result is further scoped to levelParam when present, so a user
  // coming from a specific level hub/pill only ever practices that level.
  let freeSet = $derived(new Set(data.freeQuestionIds));
  let playable = $derived(
    (isPlus ? data.questions : data.questions.filter((q) => freeSet.has(q.id))).filter(
      (q) => !levelParam() || q.cefr === levelParam()
    )
  );
  let locked = $derived(!isPlus && playable.length === 0);

  // Back-navigation: if the user came from a level hub, show "← B1" on the
  // left and "Grammar topics →" on the right. Otherwise fall back to just
  // "Grammar topics →" on the left.
  const VALID_LEVELS = new Set(['a1', 'a2', 'b1', 'b2', 'c']);
  let fromLevel = $derived(() => {
    const raw = page.url.searchParams.get('from')?.toLowerCase() ?? '';
    return VALID_LEVELS.has(raw) ? raw : null;
  });

  // Use history.back() so SvelteKit restores the snapshot (expanded state)
  // on the level hub. Fall back to a direct href if there's no history entry
  // (e.g. page was opened in a new tab).
  function goBack(level: string, e: MouseEvent) {
    if (!browser) return;
    // history.length === 1 means this is the first page in the tab — no back.
    if (history.length > 1) {
      e.preventDefault();
      history.back();
    }
    // Otherwise let the <a> href handle it normally.
  }
</script>

<svelte:head>
  <title>{title} · {m.grammar_title()} — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10 text-left">
  <div class="mb-4 flex items-center justify-between">
    {#if fromLevel()}
      <a
        href="/learn/{fromLevel()}"
        onclick={(e) => goBack(fromLevel()!, e)}
        class="inline-flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
      >
        ← {fromLevel()!.toUpperCase()}
      </a>
    {:else}
      <span></span>
    {/if}
    <a
      href="/grammar"
      class="text-sm text-gray-400 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-300"
    >
      {m.grammar_back_to_topics()} →
    </a>
  </div>

  <h1 class="mb-6 text-xl font-bold text-gray-900 dark:text-white">{title}</h1>

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
    <!-- Active level-scope indicator + escape hatch (only once real content
         is playing here — not shown on the locked/paywall view above, since
         that intentionally hides other-level free content per
         ai-docs/implementation/grammar-fix.md §5; see
         ai-docs/implementation/grammar-ux-update.md Step 5). -->
    {#if levelParam()}
      <p class="-mt-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
        Showing {levelParam()} only ·
        <a href="/grammar/{data.topic}" class="underline hover:text-indigo-500"> see all levels </a>
      </p>
    {/if}
    {#key data.topic}
      <GrammarSession questions={playable} {rule} {userId} />
    {/key}
  {/if}
</div>
