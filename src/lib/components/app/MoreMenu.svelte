<script lang="ts">
  /**
   * The links and settings that the bottom tab bar has no room for (ai-docs/implementation/
   * mobile-web-shell.md, Phase 5). Below `md` the top nav and its hamburger are hidden on tab
   * routes, so this menu is the only way to reach them. Used in two places:
   * - at the bottom of `/my-profile` for signed-in users (`showLanguageSwitcher={false}`: the
   *   interface language is already in the profile's preferences section);
   * - inside `MoreSheet`, the bottom sheet the Profile tab opens for guests.
   */
  import { page } from '$app/state';
  import { DarkMode } from 'flowbite-svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { trialView } from '$lib/stores/trial.svelte';
  import { localeStore, type Locale } from '$lib/localeStore.svelte';
  import { LANGUAGES } from '$lib/config';
  import { logout, switchLocale } from '$lib/nav-actions';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    /** Show the interface-language buttons. */
    showLanguageSwitcher?: boolean;
    /** Called when a link is followed or the language is changed (the sheet closes itself). */
    onnavigate?: () => void;
  }

  let { showLanguageSwitcher = true, onnavigate }: Props = $props();

  // Same rule as Nav.svelte: `page.data.user` is null on prerendered pages.
  const user = $derived(page.data.user ?? authStore.user);

  const links = [
    { href: '/norskproven', label: () => m.nav_norskproven() },
    { href: '/blog', label: () => m.nav_blog() },
    { href: '/plus', label: () => m.nav_plus() },
    { href: '/guide', label: () => m.nav_guide() },
    { href: '/faq', label: () => m.nav_faq() },
    { href: '/resources', label: () => m.nav_resources() },
    { href: '/contact', label: () => m.nav_contact() },
    { href: '/privacy', label: () => m.legal_privacy() },
    { href: '/terms', label: () => m.legal_terms() }
  ];

  const rowClass =
    'flex min-h-12 w-full items-center rounded-lg px-3 py-2 text-left text-base text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/5';
</script>

<nav aria-label={m.more_menu_title()} class="text-left" data-testid="more-menu">
  {#if user && trialView.state === 'active'}
    <!-- Trial countdown: the Nav badge is hidden on a phone (ai-docs/implementation/free-trial.md). -->
    <a
      href="/plus?ref=trial-nav"
      onclick={() => onnavigate?.()}
      class="mb-2 flex min-h-12 items-center rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-base font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
      data-testid="more-trial"
    >
      {trialView.badgeLabel}
    </a>
  {/if}

  <ul>
    {#each links as { href, label } (href)}
      <li>
        <a {href} onclick={() => onnavigate?.()} class={rowClass}>{label()}</a>
      </li>
    {/each}
  </ul>

  <div class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-600">
    {#if showLanguageSwitcher}
      <div role="group" aria-label={m.nav_switch_language_aria()} class="flex flex-wrap gap-2 p-1">
        {#each Object.entries(LANGUAGES) as [, { name, flag, code }] (code)}
          <button
            type="button"
            aria-pressed={localeStore.current === code}
            onclick={() => {
              onnavigate?.();
              switchLocale(code as Locale, !!user);
            }}
            class="inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm {localeStore.current ===
            code
              ? 'border-indigo-500 bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5'}"
          >
            <span aria-hidden="true">{flag}</span>
            {name}
          </button>
        {/each}
      </div>
    {/if}

    <div class="flex min-h-12 items-center justify-between px-3 py-2">
      <span class="text-base text-gray-800 dark:text-gray-100">{m.more_menu_dark_mode()}</span>
      <DarkMode
        ariaLabel={m.more_menu_dark_mode()}
        class="inline-block hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
      />
    </div>

    {#if user}
      <button type="button" onclick={() => logout(user.id)} class={rowClass}>
        {m.nav_log_out()}
      </button>
    {/if}
  </div>
</nav>
