<script lang="ts">
  /**
   * Fixed bottom tab bar for small screens
   * (ai-docs/implementation/mobile-web-shell.md, Phase 2).
   *
   * Shown only on `tabs` routes (see `shellMode()` in `$lib/app-shell`), below `md`, and not while
   * a view has hidden it through `shellSession` (quiz and grammar practice).
   */
  import { BottomNav, BottomNavItem } from 'flowbite-svelte';
  import {
    BookOpenOutline,
    LanguageOutline,
    QuestionCircleOutline,
    ChartLineUpOutline,
    UserOutline
  } from 'flowbite-svelte-icons';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';
  import { authStore } from '$lib/stores/auth.svelte';
  import { shellSession } from '$lib/stores/shellSession.svelte';
  import { activeTab, learnHref, shellMode, type ShellTab } from '$lib/app-shell';

  interface Props {
    /**
     * What the Profile tab does for a guest. When set, the tab is a button that calls it (the More
     * sheet, Phase 5). When not set, the tab links to the login page.
     */
    onGuestProfile?: () => void;
  }

  let { onGuestProfile }: Props = $props();

  const pathname = $derived(page.url.pathname);
  const visible = $derived(shellMode(pathname) === 'tabs' && !shellSession.hidden);
  const current = $derived(activeTab(pathname));

  // Same rule as Nav.svelte: `page.data.user` is null on prerendered pages, so fall back to the
  // client-side auth store, or a signed-in user would get the guest behaviour there.
  const signedIn = $derived(!!(page.data.user ?? authStore.user));

  const learnTarget = $derived(learnHref(page.data.currentLevel as string | null | undefined));
  const profileHref = $derived(
    signedIn ? '/my-profile' : onGuestProfile ? undefined : '/auth/login'
  );

  const tabs = $derived<
    { key: ShellTab; href: string | undefined; icon: typeof BookOpenOutline }[]
  >([
    { key: 'learn', href: learnTarget, icon: BookOpenOutline },
    { key: 'grammar', href: '/grammar', icon: LanguageOutline },
    { key: 'quiz', href: '/quiz', icon: QuestionCircleOutline },
    { key: 'progress', href: '/my-progress', icon: ChartLineUpOutline },
    { key: 'profile', href: profileHref, icon: UserOutline }
  ]);

  function label(tab: ShellTab): string {
    switch (tab) {
      case 'learn':
        return m.nav_learn();
      case 'grammar':
        return m.nav_grammar();
      case 'quiz':
        return m.nav_quiz();
      case 'progress':
        return m.nav_my_progress();
      case 'profile':
        return m.nav_my_profile();
    }
  }
</script>

{#if visible}
  <!--
    Overrides of the flowbite defaults (they are merged with tailwind-merge, so the later class wins):
    z-30 -> z-40, h-16 -> h-auto on the outer element (the safe-area padding adds to the 4rem inner
    row; the left and right insets keep the tabs clear of a landscape notch), bg-white /
    dark:bg-gray-700 -> the Nav colours, px-5 -> px-1 and text-sm -> text-xs on the items (five
    items at 360px leave about 72px each). The insets are classes, not an inline style, so a test
    can see them (jsdom drops env() from an inline style). The tap highlight is switched off: the
    active colour already shows the press. Each tab is at least 64px high and 72px wide, above the
    48px minimum target.
  -->
  <BottomNav
    role="navigation"
    aria-label={m.bottom_nav_label()}
    data-testid="bottom-nav"
    class="z-40 h-auto bg-gray-50 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] [-webkit-tap-highlight-color:transparent] md:hidden dark:border-gray-600 dark:bg-blue-950"
    classes={{ inner: 'h-16 grid-cols-5' }}
    activeClass="text-primary-700 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
  >
    {#each tabs as tab (tab.key)}
      {@const active = current === tab.key}
      <!--
        `active` is passed explicitly: flowbite's own matching compares href with activeUrl, which
        can never mark Learn active because its href is /learn/{level}.
      -->
      <BottomNavItem
        btnName={label(tab.key)}
        href={tab.href}
        {active}
        aria-current={active ? 'page' : undefined}
        onclick={tab.key === 'profile' && !signedIn ? onGuestProfile : undefined}
        class="min-w-0 px-1"
        classes={{ span: 'max-w-full truncate text-xs' }}
      >
        <tab.icon
          class="mb-1 h-6 w-6 {active ? '' : 'text-gray-500 dark:text-gray-400'}"
          aria-hidden="true"
        />
      </BottomNavItem>
    {/each}
  </BottomNav>
{/if}
