<script lang="ts">
  /**
   * Compact top bar for small screens (ai-docs/implementation/mobile-web-shell.md, Phase 3).
   *
   * Rendered by the root layout on `tabs` routes only, below `md`. On those routes `Nav` hides its
   * own `Navbar` below `md` (the `hideOnSmall` prop), so this bar replaces it:
   * - tab roots: the flag and the wordmark, linking to `/`;
   * - sub-pages (`parentHref()` is not null): a back arrow and the page title;
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
  import { parentHref, shellMode } from '$lib/app-shell';
  import { GRAMMAR_RULES } from '$lib/grammar/rules';
  import { chapterEntryBySlug } from '$lib/grammar/overview';

  const pathname = $derived(page.url.pathname);
  const visible = $derived(shellMode(pathname) === 'tabs');
  const parent = $derived(parentHref(pathname));

  // Same rule as Nav.svelte: `page.data.user` is null on prerendered pages, so Plus state falls
  // back to the client-side auth store there.
  const isPlus = $derived(page.data.user ? page.data.plan === 'plus' : authStore.isPlus);

  // Guest = no server user and no client user. `page.data.user` is null on prerendered pages even
  // for signed-in visitors, so wait for `authStore.initialized` to avoid flashing "Log in".
  const isGuest = $derived(!page.data.user && authStore.initialized && !authStore.user);

  /** Title of a sub-page. The grammar content is Norwegian-only, like the pages themselves. */
  const title = $derived.by(() => {
    const [first, second, third] = pathname.split('/').filter(Boolean);
    if (first === 'grammar' && second === 'chapter' && third) {
      return chapterEntryBySlug(third)?.chapter.titleNb ?? m.grammar_title();
    }
    if (first === 'grammar' && second) {
      return GRAMMAR_RULES[second]?.titleNb ?? m.grammar_title();
    }
    if (first === 'my-progress' && second === 'grammar') return m.grammar_progress_title();
    return '';
  });

  const iconButton =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700';
</script>

{#if visible}
  <header
    class="sticky top-0 z-40 flex h-14 items-center gap-1 border-b border-gray-100 bg-gray-50 px-2 md:hidden dark:border-blue-900 dark:bg-blue-950"
    data-testid="mobile-top-bar"
  >
    {#if parent}
      <a href={parent} aria-label={m.onboarding_back()} class={iconButton}>
        <ArrowLeftOutline class="h-6 w-6" aria-hidden="true" />
      </a>
      <p class="min-w-0 flex-1 truncate text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </p>
    {:else}
      <a href="/" class="flex min-w-0 items-center gap-2 pl-1">
        <No size="32" class="inline shrink-0" />
        <span class="font-norse text-2xl tracking-wide whitespace-nowrap dark:text-white">
          {m.norskeord()}
        </span>
      </a>
    {/if}

    {#if isPlus}
      <button
        type="button"
        aria-label={m.search_aria_label()}
        onclick={() => (searchUi.open = true)}
        class="{iconButton} ml-auto"
        data-testid="mobile-search-button"
      >
        <SearchOutline class="h-5 w-5" aria-hidden="true" />
      </button>
    {:else if isGuest}
      <a
        href="/auth/login"
        class="ml-auto inline-flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 hover:bg-gray-100 dark:text-indigo-300 dark:hover:bg-gray-700"
        data-testid="mobile-login-button"
      >
        {m.nav_log_in()}
      </a>
    {/if}
  </header>
{/if}
