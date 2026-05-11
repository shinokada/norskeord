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
  import { CATEGORIES_BY_LEVEL } from '$lib/types';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import ChevronDownOutline from './ChevronDownOutline.svelte';
  import { onMount } from 'svelte';
  import { getLocale, setLocale } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages.js';

  const user = $derived(page.data.user);

  async function logout() {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  let activeUrl = $derived(page.url.pathname);

  const activeClass = 'p-2 text-base hover:text-gray-500';
  const nonActiveClass = 'p-2 text-base hover:text-gray-500';

  const linkClass =
    'flex items-center gap-1.5 py-0.5 text-sm text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400';

  // All categories are free — no content gate per monetization plan
  function buildItems(level: keyof typeof CATEGORIES_BY_LEVEL) {
    return CATEGORIES_BY_LEVEL[level].map((c) => ({
      name: removeHyphensAndCapitalize(c),
      href: `/${level.toLowerCase()}/${c}`
    }));
  }

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  const menus = levels.map((level) => ({
    level,
    items: buildItems(level)
  }));

  // Language switcher
  let currentLocale = $state(getLocale());

  function toggleLocale() {
    const next = currentLocale === 'en' ? 'nb' : 'en';
    currentLocale = next;
    localStorage.setItem('locale', next);
    setLocale(next);
  }

  onMount(() => {
    const saved = localStorage.getItem('locale');
    if (saved === 'nb' || saved === 'en') {
      currentLocale = saved;
      setLocale(saved, { reload: false });
    }
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
      class="hidden rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 sm:inline-block dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {currentLocale === 'en' ? m.nav_switch_to_norwegian() : m.nav_switch_to_english()}
    </button>
    {#if !user}
      <a
        href="/plus"
        class="hidden rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 sm:inline-block"
      >
        {m.nav_plus_badge()}
      </a>
      <a
        href="/auth/login"
        class="hidden rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 sm:inline-block dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {m.nav_log_in()}
      </a>
    {/if}
    <Avatar class="acs" size="sm" />
    <Dropdown simple class="w-56" triggeredBy=".acs">
      {#if user}
        <DropdownHeader>
          <span class="hidden text-xs text-gray-500 sm:inline dark:text-gray-400">
            {user.email}
          </span>
        </DropdownHeader>
        <DropdownDivider />
        <DropdownGroup>
          <DropdownItem href="/stats">{m.nav_my_progress()}</DropdownItem>
          <DropdownItem href="/resources">{m.nav_resources()}</DropdownItem>
          <DropdownItem href="/norskproven">{m.nav_norskproven()}</DropdownItem>
          <DropdownItem onclick={logout}>{m.nav_log_out()}</DropdownItem>
        </DropdownGroup>
      {:else}
        <DropdownGroup>
          <DropdownItem href="/resources">{m.nav_resources()}</DropdownItem>
          <DropdownItem href="/norskproven">{m.nav_norskproven()}</DropdownItem>
        </DropdownGroup>
      {/if}
    </Dropdown>
    <DarkMode class="inline-block hover:text-gray-900 dark:hover:text-white" />
    <NavHamburger />
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
          <a href={item.href} class={linkClass}>
            {item.name}
          </a>
        {/snippet}
      </MegaMenu>
    {/each}
  </NavUl>
</Navbar>
