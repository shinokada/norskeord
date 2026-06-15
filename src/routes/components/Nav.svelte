<script lang="ts">
  import {
    Navbar,
    NavLi,
    NavBrand,
    NavUl,
    DarkMode,
    Dropdown,
    DropdownItem,
    Sidebar,
    SidebarGroup,
    SidebarItem,
    SidebarButton,
    uiHelpers,
    Avatar,
    DropdownHeader,
    DropdownDivider,
    DropdownGroup
  } from 'flowbite-svelte';
  import {
    PlusOutline,
    FolderArrowRightOutline,
    ArrowRightOutline,
    BookOpenOutline,
    UserSolid,
    NewspaperOutline,
    ChartOutline,
    UserCircleOutline,
    ArrowLeftToBracketOutline
  } from 'flowbite-svelte-icons';
  const sidebarUi = uiHelpers();
  const closeDemoSidebar = sidebarUi.close;
  let isDemoOpen = $derived(sidebarUi.isOpen);
  const spanClass = 'flex-1 ms-3 whitespace-nowrap';
  const sidebarActiveClass =
    'flex items-center p-2 text-base font-normal text-white bg-primary-600 dark:bg-primary-700 rounded-lg dark:text-white hover:bg-primary-800 dark:hover:bg-primary-800';
  const sidebarNonActiveClass =
    'flex items-center p-2 text-base font-normal text-green-900 rounded-lg dark:text-white hover:bg-green-100 dark:hover:bg-green-700';

  import No from '$lib/No.svelte';
  import { page } from '$app/state';
  import ChevronDownOutline from './ChevronDownOutline.svelte';
  import { onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { localeStore } from '$lib/localeStore.svelte';
  import { clearUserProgress } from '$lib/progress';
  import Search from '$lib/components/Search.svelte';
  import { supabase } from '$lib/supabase';
  import type { User } from '@supabase/supabase-js';

  const user = $derived(page.data.user);
  const displayName = $derived(page.data.displayName as string | null);
  const isAdmin = $derived(page.data.isAdmin as boolean);

  // For prerendered pages (e.g. /blog, /blog/[slug]), page.data.user is always
  // null at build time. We hydrate auth state client-side after mount.
  let clientUser = $state<User | null>(null);
  const effectiveUser = $derived(user ?? clientUser);

  async function logout() {
    const userId = effectiveUser?.id;
    if (userId) clearUserProgress();
    avatarDropdownOpen = false;
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  let activeUrl = $derived(page.url.pathname);

  const activeClass = 'p-2 text-base hover:text-gray-500';
  const nonActiveClass = 'p-2 text-base hover:text-gray-500';

  let isPlus = $derived(page.data.plan === 'plus');

  const levels = ['A1', 'A2', 'B1', 'B2', 'C'] as const;

  // Language switcher
  async function toggleLocale() {
    const next = localeStore.current === 'en' ? 'nb' : 'en';
    localeStore.set(next);
    if (effectiveUser) {
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

  onMount(async () => {
    localeStore.init();
    // Only fetch client-side session on prerendered pages where page.data.user
    // is null. On SSR routes user is already populated from the server.
    if (!user) {
      const { data } = await supabase.auth.getUser();
      clientUser = data.user ?? null;
    }
  });

  // ── Search modal ───────────────────────────────────────────────────────────
  let searchOpen = $state(false);

  // ── Dropdown open state ────────────────────────────────────────────────────
  let avatarDropdownOpen = $state(false);
  let moreDropdownOpen = $state(false);

  function closeAvatarDropdown() {
    avatarDropdownOpen = false;
  }

  function closeMoreDropdown() {
    moreDropdownOpen = false;
  }
</script>

<Search
  bind:open={searchOpen}
  {isPlus}
  onclose={() => {
    searchOpen = false;
  }}
/>

<Navbar
  breakpoint="md"
  fluid
  class="sticky top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-blue-950"
  navContainerClass="md:justify-between"
>
  <NavBrand href="/">
    <No size="40" class="inline" />
    <span class="ml-2 self-center text-xl font-semibold whitespace-nowrap dark:text-white">
      Norskeord
    </span>
  </NavBrand>

  <div class="flex items-center gap-2 md:order-2">
    <!-- Search button (Plus only) -->
    {#if isPlus}
      <button
        type="button"
        aria-label={m.search_aria_label()}
        onclick={() => {
          searchOpen = true;
        }}
        class="relative inline-flex items-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        data-testid="search-button"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </button>
    {/if}

    <button
      type="button"
      onclick={toggleLocale}
      aria-label="Switch language"
      class="inline-block rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {localeStore.current === 'en' ? m.nav_switch_to_norwegian() : m.nav_switch_to_english()}
    </button>

    {#if !effectiveUser}
      <a
        href="/plus?checkout=1"
        class="hidden rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 md:inline-block"
      >
        {m.nav_plus_badge()}
      </a>
      <a
        href="/auth/login"
        class="hidden rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 md:inline-block dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {m.nav_log_in()}
      </a>
    {:else}
      <div data-testid="user-avatar">
        <Avatar class="acs ml-2.5 hidden md:block" size="xs" />
      </div>
      <Dropdown
        bind:isOpen={avatarDropdownOpen}
        simple
        class="w-56 dark:border-gray-700 dark:bg-blue-950"
        triggeredBy=".acs"
      >
        <DropdownHeader>
          {#if displayName}
            <span class="block text-sm font-medium text-gray-800 dark:text-gray-100">
              {displayName}
            </span>
          {/if}
          <span
            class="block text-xs text-gray-500 dark:text-gray-400 {displayName ? 'mt-0.5' : ''}"
          >
            {effectiveUser.email}
          </span>
        </DropdownHeader>
        <DropdownDivider />
        <DropdownGroup>
          <DropdownItem
            class="dark:hover:bg-blue-900"
            href="/my-profile"
            onclick={closeAvatarDropdown}>{m.nav_my_profile()}</DropdownItem
          >
          {#if isAdmin}
            <DropdownItem class="dark:hover:bg-blue-900" href="/admin" onclick={closeAvatarDropdown}
              >Admin</DropdownItem
            >
          {/if}
          <DropdownItem class="dark:hover:bg-blue-900" href="/stats" onclick={closeAvatarDropdown}
            >{m.nav_my_progress()}</DropdownItem
          >
          <DropdownItem class="dark:hover:bg-blue-900" onclick={logout}
            >{m.nav_log_out()}</DropdownItem
          >
        </DropdownGroup>
      </Dropdown>
    {/if}
    {#if effectiveUser && !isPlus}
      <a
        href="/plus"
        class="hidden rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 sm:inline-block"
      >
        {m.nav_plus_badge()}
      </a>
    {/if}
    <DarkMode class="inline-block hover:text-gray-900 dark:hover:text-white" />
    <SidebarButton onclick={sidebarUi.toggle} />
  </div>

  <NavUl
    breakpoint="md"
    {activeUrl}
    class="order-2 md:order-1"
    classes={{
      active: activeClass,
      nonActive: nonActiveClass,
      ul: 'p-0 dark:!bg-blue-950'
    }}
  >
    <!-- Six level links — direct links to hub pages (no mega-menu) -->
    {#each levels as level (level)}
      <NavLi href="/learn/{level.toLowerCase()}">{level}</NavLi>
    {/each}
    <NavLi href="/blog">Blog</NavLi>

    <!-- More dropdown — Guide, Resources, Blog -->
    <NavLi class="cursor-pointer">
      {m.nav_help()}<ChevronDownOutline
        class="text-primary-800 ms-2 inline h-6 w-6 dark:text-white"
      />
    </NavLi>
    <Dropdown
      bind:isOpen={moreDropdownOpen}
      simple
      class="w-44 dark:border-gray-700 dark:bg-blue-950"
    >
      <DropdownItem class="dark:hover:bg-blue-900" href="/guide" onclick={closeMoreDropdown}
        >{m.nav_guide()}</DropdownItem
      >
      <DropdownItem class="dark:hover:bg-blue-900" href="/resources" onclick={closeMoreDropdown}
        >{m.nav_free_resources()}</DropdownItem
      >
    </Dropdown>
  </NavUl>
</Navbar>

<div class="relative">
  <Sidebar
    {activeUrl}
    backdrop={false}
    isOpen={isDemoOpen}
    closeSidebar={closeDemoSidebar}
    params={{ x: 50, duration: 400 }}
    classes={{
      nonactive: sidebarNonActiveClass,
      active: sidebarActiveClass,
      div: 'dark:bg-indigo-950'
    }}
    position="absolute"
    class="z-50 h-screen md:hidden right-0 left-auto pt-6 w-full dark:bg-indigo-950"
  >
    <SidebarGroup>
      {#if effectiveUser}
        <SidebarItem label="My Progress" href="/stats">
          {#snippet icon()}
            <ChartOutline
              class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
            />
          {/snippet}
        </SidebarItem>
        <SidebarItem label="My Profile" href="/my-profile">
          {#snippet icon()}
            <UserCircleOutline
              class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
            />
          {/snippet}
        </SidebarItem>
      {:else}
        <SidebarItem label="Login" href="/auth/login">
          {#snippet icon()}
            <UserSolid
              class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
            />
          {/snippet}
        </SidebarItem>
      {/if}
    </SidebarGroup>
    <SidebarGroup border>
      <SidebarItem label="Nivå A1" href="/learn/a1">
        {#snippet icon()}
          <ArrowRightOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
      <SidebarItem label="Nivå A2" href="/learn/a2">
        {#snippet icon()}
          <ArrowRightOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
      <SidebarItem label="Nivå B1" href="/learn/b1">
        {#snippet icon()}
          <ArrowRightOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
      <SidebarItem label="Nivå B2" href="/learn/b2">
        {#snippet icon()}
          <ArrowRightOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
      <SidebarItem label="Nivå C" href="/learn/c">
        {#snippet icon()}
          <ArrowRightOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
    </SidebarGroup>
    <SidebarGroup border>
      <SidebarItem label="Plus" {spanClass} href="/plus">
        {#snippet icon()}
          <PlusOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
      <SidebarItem label="Blog" {spanClass} href="/blog">
        {#snippet icon()}
          <NewspaperOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
      <SidebarItem label="Guide" href="/guide">
        {#snippet icon()}
          <BookOpenOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
      <SidebarItem label="Resources" href="/resources">
        {#snippet icon()}
          <FolderArrowRightOutline
            class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
          />
        {/snippet}
      </SidebarItem>
    </SidebarGroup>
    {#if effectiveUser}
      <SidebarGroup border>
        <SidebarItem label="Log out" onclick={logout} class="cursor-pointer">
          {#snippet icon()}
            <ArrowLeftToBracketOutline
              class="h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
            />
          {/snippet}
        </SidebarItem>
      </SidebarGroup>
    {/if}
  </Sidebar>
</div>
