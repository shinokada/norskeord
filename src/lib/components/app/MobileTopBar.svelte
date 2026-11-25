<script lang="ts">
  /**
   * Compact top bar for small screens (ai-docs/implementation/mobile-web-shell.md, Phase 3).
   *
   * Rendered by the root layout on `tabs` and `session` routes, below `md`. On those routes `Nav`
   * hides its own `Navbar` below `md` (the `hideOnSmall` prop), so this bar replaces it:
   * - tab roots: the flag and the wordmark, linking to `/`;
   * - sub-pages and session routes (`parentHref()` is not null): a back arrow and the page title.
   *   Session routes (flashcards, review, Norskprøven) have no bottom bar, so the arrow is the way
   *   out;
   * - a session header registered by a view (`sessionHeader`, used by /quiz while a quiz is on
   *   screen): the same `← label | title` layout, but the arrow is a button that runs the view's
   *   own exit, because the quiz state is not in the URL;
   * - a search icon for Plus users on both. It only opens the modal that `Nav` owns, through
   *   `searchUi`: a second `<Search>` here would open a second modal on Ctrl/Cmd+K;
   * - a light "Log in" button on the right for guests, so login is one tap instead of Profile > More.
   *   Signed-in non-Plus users get nothing on the right.
   *
   * No hamburger, language switcher, dark-mode toggle or trial badge: they move to the More menu
   * (Phase 5).
   */
  import { page } from '$app/state';
  import { ArrowLeftOutline, SearchOutline } from 'flowbite-svelte-icons';
  import No from '$lib/No.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { authStore } from '$lib/stores/auth.svelte';
  import { searchUi } from '$lib/stores/searchUi.svelte';
  import { sessionHeader } from '$lib/stores/sessionHeader.svelte';
  import { flashcardTitle, parentHref, shellMode } from '$lib/app-shell';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import { chapterEntryBySlug } from '$lib/grammar/overview';
  import { categoryLabel } from '$lib/vocab-helpers';

  const pathname = $derived(page.url.pathname);
  const mode = $derived(shellMode(pathname));
  const visible = $derived(mode === 'tabs' || mode === 'session');
  const parent = $derived(
    parentHref(pathname, page.data.currentLevel as string | null | undefined)
  );

  // Same rule as Nav.svelte: `page.data.user` is null on prerendered pages, so Plus state falls
  // back to the client-side auth store there.
  const isPlus = $derived(page.data.user ? page.data.plan === 'plus' : authStore.isPlus);

  // Guest = no server user and no client user. `page.data.user` is null on prerendered pages even
  // for signed-in visitors, so wait for `authStore.initialized` to avoid flashing "Log in".
  const isGuest = $derived(!page.data.user && authStore.initialized && !authStore.user);

  /** Title of a sub-page or session route. The grammar content is Norwegian-only, like the pages. */
  const title = $derived.by(() => {
    const [first, second, third] = pathname.split('/').filter(Boolean);
    if (mode === 'session') {
      if (first === 'norskproven') return m.nav_norskproven();
      // Grammar review: `← Grammar` on the left, "Due today" centred (the page's own <title> is
      // "Grammar · Due today"). The vocab /review page shows no title: its own header says "Due Review".
      if (first === 'review') return second === 'grammar' ? m.stats_due_today() : '';
      // Flashcards show their category, translated like the page.
      const fallback = flashcardTitle(pathname);
      return fallback ? categoryLabel(first ?? '', second ?? '') || fallback : '';
    }
    if (first === 'grammar' && second === 'chapter' && third) {
      return chapterEntryBySlug(third)?.chapter.titleNb ?? m.grammar_title();
    }
    if (first === 'grammar' && second) {
      return GRAMMAR_RULES[second]?.titleNb ?? m.grammar_title();
    }
    if (first === 'my-progress' && second === 'grammar') return m.grammar_progress_title();
    return '';
  });

  /** Where the back arrow leads, as text beside it: "A1" on a flashcard set, "Grammar" and so on. */
  const backLabel = $derived.by(() => {
    const [first, second] = pathname.split('/').filter(Boolean);
    if (first === 'norskproven') return m.nav_norskproven();
    if (first === 'grammar' || (first === 'review' && second === 'grammar')) {
      return m.grammar_title();
    }
    if (flashcardTitle(pathname)) return (first ?? '').toUpperCase();
    return '';
  });

  // A view-registered header (the running quiz), shown instead of the brand or the route-based
  // back arrow.
  const custom = $derived(sessionHeader.current);

  const backClass =
    'inline-flex h-11 min-w-11 items-center gap-1 justify-self-start rounded-lg px-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700';

  const iconButton =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700';
</script>

{#if visible}
  <header
    class={[
      'sticky top-0 z-40 h-14 items-center border-b border-gray-100 bg-gray-50 px-2 md:hidden dark:border-blue-900 dark:bg-blue-950',
      parent || custom ? 'grid grid-cols-[1fr_auto_1fr]' : 'flex gap-1'
    ]}
    data-testid="mobile-top-bar"
  >
    {#if custom}
      <button
        type="button"
        onclick={custom.onback}
        aria-label="{m.onboarding_back()}: {custom.backLabel}"
        class={backClass}
        data-testid="mobile-back-button"
      >
        <ArrowLeftOutline class="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{custom.backLabel}</span>
      </button>
      <p
        class="max-w-[45vw] truncate px-1 text-center text-base font-semibold text-gray-900 dark:text-white"
        data-testid="mobile-session-title"
      >
        {custom.title}
      </p>
    {:else if parent}
      <a
        href={parent}
        aria-label={backLabel ? `${m.onboarding_back()}: ${backLabel}` : m.onboarding_back()}
        class={backClass}
      >
        <ArrowLeftOutline class="h-5 w-5 shrink-0" aria-hidden="true" />
        {#if backLabel}<span>{backLabel}</span>{/if}
      </a>
      <p
        class="max-w-[45vw] truncate px-1 text-center text-base font-semibold text-gray-900 dark:text-white"
      >
        {title}
      </p>
    {:else}
      <a href="/" class="flex min-w-0 items-center gap-2 pl-1">
        <No size="40" class="inline shrink-0" />
        <span class="font-norse text-3xl tracking-wide whitespace-nowrap dark:text-white">
          {m.norskeord()}
        </span>
      </a>
    {/if}

    <!-- Right slot: always rendered, so the title stays centered in the grid layout. -->
    <div class="ml-auto flex justify-end">
      {#if isPlus}
        <button
          type="button"
          aria-label={m.search_aria_label()}
          onclick={() => (searchUi.open = true)}
          class={iconButton}
          data-testid="mobile-search-button"
        >
          <SearchOutline class="h-5 w-5" aria-hidden="true" />
        </button>
      {:else if isGuest}
        <a
          href="/auth/login"
          class="inline-flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 hover:bg-gray-100 dark:text-indigo-300 dark:hover:bg-gray-700"
          data-testid="mobile-login-button"
        >
          {m.nav_log_in()}
        </a>
      {/if}
    </div>
  </header>
{/if}
