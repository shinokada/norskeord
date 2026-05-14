<script lang="ts">
  import {
    Avatar,
    Navbar,
    NavLi,
    NavBrand,
    NavUl,
    NavHamburger,
    DarkMode,
    MegaMenu,
    Dropdown,
    DropdownItem,
    DropdownDivider,
    DropdownHeader,
    DropdownGroup
  } from 'flowbite-svelte';
  import No from '$lib/No.svelte';
  import { page } from '$app/state';
  import { CATEGORIES_BY_LEVEL, isPlusCategory } from '$lib/types';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import ChevronDownOutline from './ChevronDownOutline.svelte';
  import { onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { localeStore } from '$lib/localeStore.svelte';

  const user = $derived(page.data.user);
  const displayName = $derived(page.data.displayName as string | null);

  async function logout() {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  let activeUrl = $derived(page.url.pathname);

  const activeClass = 'p-2 text-base hover:text-gray-500';
  const nonActiveClass = 'p-2 text-base hover:text-gray-500';

  const linkClass =
    'flex items-center gap-1.5 py-0.5 text-sm text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400';

  let isPlus = $derived(page.data.plan === 'plus');

  function buildItems(level: keyof typeof CATEGORIES_BY_LEVEL) {
    return CATEGORIES_BY_LEVEL[level].map((c) => ({
      name: removeHyphensAndCapitalize(c),
      href: `/${level.toLowerCase()}/${c}`,
      locked: isPlusCategory(level, c)
    }));
  }

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  const menus = levels.map((level) => ({
    level,
    items: buildItems(level)
  }));

  // Language switcher — backed by the shared localeStore so the nav button
  // and PreferencesSection always reflect the same value.
  async function toggleLocale() {
    const next = localeStore.current === 'en' ? 'nb' : 'en';
    localeStore.set(next);

    // Persist to profile when the user is logged in (fire-and-forget).
    if (user) {
      try {
        await fetch('/api/profile/language', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: next })
        });
      } catch {
        console.warn('[Nav] Failed to persist locale to profile');
      }
    }
  }

  onMount(() => {
    localeStore.init();
  });
</script>

<Navbar
  breakpoint="lg"
  fluid
  class="sticky top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-blue-950"
  navContainerClass="lg:justify-between"
>
  <NavBrand href="/">
    <No size="40" class="inline" />
    <span class="ml-2 self-center text-xl font-semibold whitespace-nowrap dark:text-white">
      Norskeord
    </span>
  </NavBrand>

  <div class="flex items-center gap-2 lg:order-2">
    <button
      type="button"
      onclick={toggleLocale}
      aria-label="Switch language"
      class="inline-block rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {localeStore.current === 'en' ? m.nav_switch_to_norwegian() : m.nav_switch_to_english()}
    </button>
    {#if !user}
      <a
        href="/plus"
        class="inline-block rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
      >
        {m.nav_plus_badge()}
      </a>
      <a
        href="/auth/login"
        class="inline-block rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {m.nav_log_in()}
      </a>
    {/if}
    {#if user}
      <Avatar class="acs" size="sm" />
      <Dropdown simple class="w-56" triggeredBy=".acs">
        <DropdownHeader>
          {#if displayName}
            <span class="block text-sm font-medium text-gray-800 dark:text-gray-100">
              {displayName}
            </span>
          {/if}
          <span
            class="block text-xs text-gray-500 dark:text-gray-400 {displayName ? 'mt-0.5' : ''}"
          >
            {user.email}
          </span>
        </DropdownHeader>
        <DropdownDivider />
        <DropdownGroup>
          <DropdownItem href="/my-profile">{m.nav_my_profile()}</DropdownItem>
          <DropdownItem href="/stats">{m.nav_my_progress()}</DropdownItem>
          <DropdownItem onclick={logout}>{m.nav_log_out()}</DropdownItem>
        </DropdownGroup>
      </Dropdown>
    {/if}
    <DarkMode class="inline-block hover:text-gray-900 dark:hover:text-white" />
    <NavHamburger class="ms-0" />
  </div>

  <NavUl
    breakpoint="lg"
    {activeUrl}
    class="order-2 lg:order-1"
    classes={{ active: activeClass, nonActive: nonActiveClass, ul: 'p-0' }}
  >
    <!-- Per-level mega-menus — all categories, no gating -->
    {#each menus as { level, items } (level)}
      <NavLi id="mega-trigger-{level}" class="cursor-pointer">
        {level}
        <ChevronDownOutline size="sm" class="ms-1 inline" />
      </NavLi>

      <MegaMenu {items} triggeredBy="#mega-trigger-{level}" classes={{ ul: '!gap-x-6' }}>
        {#snippet children({ item })}
          {@const locked = !isPlus && item.locked}
          <a
            href={locked ? '/plus?ref=category-lock' : item.href}
            class="{linkClass} {locked ? 'opacity-50' : ''}"
            title={locked ? m.plus_category_locked() : undefined}
          >
            {item.name}{locked ? ' 🔒' : ''}
          </a>
        {/snippet}
      </MegaMenu>
    {/each}
    <NavLi class="cursor-pointer">
      More<ChevronDownOutline class="text-primary-800 ms-2 inline h-6 w-6 dark:text-white" />
    </NavLi>
    <Dropdown simple class="w-44">
      <DropdownItem href="/norskproven">{m.nav_norskproven()}</DropdownItem>
      <DropdownItem href="/about">{m.nav_about()}</DropdownItem>
      <DropdownItem href="/resources">{m.nav_resources()}</DropdownItem>
    </Dropdown>
  </NavUl>
</Navbar>
