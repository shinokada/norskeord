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
  import { clearUserProgress } from '$lib/progress';

  const user = $derived(page.data.user);
  const displayName = $derived(page.data.displayName as string | null);

  async function logout() {
    // Clear this user's namespaced localStorage data before navigating away,
    // so the next person who opens the browser starts with a clean slate.
    const userId = user?.id;
    if (userId) clearUserProgress();
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  let activeUrl = $derived(page.url.pathname);

  const activeClass = 'p-2 text-base hover:text-gray-500';
  const nonActiveClass = 'p-2 text-base hover:text-gray-500';

  const linkClass =
    'flex items-center gap-1.5 py-0.5 text-sm text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400';

  let isPlus = $derived(page.data.plan === 'plus');

  const COLLAPSE_THRESHOLD = 3;

  function buildItems(level: keyof typeof CATEGORIES_BY_LEVEL) {
    return CATEGORIES_BY_LEVEL[level].map((c) => ({
      name: removeHyphensAndCapitalize(c),
      href: `/${level.toLowerCase()}/${c}`,
      locked: isPlusCategory(level, c)
    }));
  }

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  const menus = levels.map((level) => {
    const allItems = buildItems(level);
    const lockedCount = !isPlus
      ? allItems.filter((item) => item.locked && !item.href?.endsWith('/uttrykk-preview')).length
      : 0;
    const collapse = !isPlus && lockedCount >= COLLAPSE_THRESHOLD;
    // When collapsing, replace all non-preview locked items with a single sentinel badge item.
    const items = collapse
      ? [
          ...allItems.filter((item) => !item.locked || item.href?.endsWith('/uttrykk-preview')),
          {
            name: `+${lockedCount} with Plus →`,
            href: '/plus?ref=nav-mega',
            locked: false,
            isPlusBadge: true
          }
        ]
      : allItems;
    return { level, items, lockedCount, collapse };
  });

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
        href="/plus?checkout=1"
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
    {#if user && !isPlus}
      <a
        href="/plus"
        class="hidden rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 sm:inline-block"
      >
        {m.nav_plus_badge()}
      </a>
    {/if}
    {#if user}
      <Avatar class="acs ml-2.5" size="xs" />
      <Dropdown simple class="w-56 dark:border-gray-700 dark:bg-blue-950" triggeredBy=".acs">
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
          <DropdownItem class="dark:hover:bg-blue-900" href="/my-profile"
            >{m.nav_my_profile()}</DropdownItem
          >
          <DropdownItem class="dark:hover:bg-blue-900" href="/stats"
            >{m.nav_my_progress()}</DropdownItem
          >
          {#if isPlus}
            <DropdownItem class="dark:hover:bg-blue-900" href="/plus">{m.nav_plus()}</DropdownItem>
          {/if}
          <DropdownItem class="dark:hover:bg-blue-900" onclick={logout}
            >{m.nav_log_out()}</DropdownItem
          >
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
    classes={{
      active: activeClass,
      nonActive: nonActiveClass,
      ul: 'p-0 dark:!bg-blue-950'
    }}
  >
    <!-- Plus and Log in — visible only on mobile (hidden on sm+) -->
    {#if !user}
      <NavLi class="sm:hidden">
        <div class="flex gap-4">
          <a
            href="/plus?checkout=1"
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
        </div>
      </NavLi>
    {/if}
    {#if user && !isPlus}
      <NavLi class="sm:hidden">
        <a
          href="/plus"
          class="inline-block w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          {m.nav_plus_badge()}
        </a>
      </NavLi>
    {/if}

    <!-- Per-level mega-menus — all categories, no gating -->
    {#each menus as { level, items } (level)}
      <NavLi id="mega-trigger-{level}" class="cursor-pointer">
        {level}
        <ChevronDownOutline size="sm" class="ms-1 inline" />
      </NavLi>

      <MegaMenu
        {items}
        triggeredBy="#mega-trigger-{level}"
        class="dark:border-gray-700 dark:bg-blue-950"
        classes={{ ul: '!gap-x-6' }}
      >
        {#snippet children({ item })}
          {@const locked = !isPlus && item.locked}
          {@const isPreview = item.href?.endsWith('/uttrykk-preview')}
          {#if item.isPlusBadge}
            <a
              href={item.href}
              class="flex items-center gap-1 py-0.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {item.name}
            </a>
          {:else if !(isPlus && isPreview)}
            <a
              href={locked ? '/plus?ref=category-lock' : item.href}
              class="{linkClass} {locked ? 'opacity-50' : ''}"
              title={locked ? m.plus_category_locked() : undefined}
            >
              {item.name}{locked ? ' 🔒' : ''}
            </a>
          {/if}
        {/snippet}
      </MegaMenu>
    {/each}

    <!-- Prepare dropdown — Quiz + Practice Tests, both Plus-only -->
    <NavLi class="cursor-pointer">
      {m.nav_prepare()}<ChevronDownOutline
        class="text-primary-800 ms-2 inline h-6 w-6 dark:text-white"
      />
    </NavLi>
    <Dropdown simple class="w-44 dark:border-gray-700 dark:bg-blue-950">
      <DropdownItem class="dark:hover:bg-blue-900" href="/quiz">
        {m.nav_quiz()}
      </DropdownItem>
      <DropdownItem class="dark:hover:bg-blue-900" href="/norskproven/practice">
        {m.nav_practice_tests()}
      </DropdownItem>
    </Dropdown>

    <NavLi class="cursor-pointer">
      {m.nav_more()}<ChevronDownOutline
        class="text-primary-800 ms-2 inline h-6 w-6 dark:text-white"
      />
    </NavLi>
    <Dropdown simple class="w-44 dark:border-gray-700 dark:bg-blue-950">
      <DropdownItem class="dark:hover:bg-blue-900" href="/norskproven"
        >{m.nav_norskproven()}</DropdownItem
      >
      <DropdownItem class="dark:hover:bg-blue-900" href="/guide">{m.nav_guide()}</DropdownItem>
      <DropdownItem class="dark:hover:bg-blue-900" href="/resources"
        >{m.nav_resources()}</DropdownItem
      >
      <DropdownItem class="dark:hover:bg-blue-900" href="/blog">Blog</DropdownItem>
    </Dropdown>
  </NavUl>
</Navbar>
