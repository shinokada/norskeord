<script lang="ts">
  import {
    Navbar,
    NavLi,
    NavBrand,
    NavUl,
    NavHamburger,
    DarkMode,
    MegaMenu,
    Dropdown,
    DropdownItem
  } from 'flowbite-svelte';
  import No from '$lib/No.svelte';
  import { page } from '$app/state';
  import { CATEGORIES_BY_LEVEL } from '$lib/types';
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import ChevronDownOutline from './ChevronDownOutline.svelte';

  let activeUrl = $derived(page.url.pathname);

  const activeClass = 'p-2 text-base hover:text-gray-500';
  const nonActiveClass = 'p-2 text-base hover:text-gray-500';

  const linkClass =
    'flex items-center gap-1.5 py-1 text-sm text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400';

  // 🔹 Helper to build menu items
  function buildItems(level: keyof typeof CATEGORIES_BY_LEVEL) {
    return CATEGORIES_BY_LEVEL[level].map((c) => ({
      name: removeHyphensAndCapitalize(c),
      href: `/${level.toLowerCase()}/${c}`,
      level
    }));
  }

  // 🔹 Centralized config
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  const menus = levels.map((level) => ({
    level,
    items: buildItems(level)
  }));
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
      Norske flashcard
    </span>
  </NavBrand>

  <div class="flex items-center lg:order-2">
    <DarkMode class="inline-block hover:text-gray-900 dark:hover:text-white" />
    <NavHamburger />
  </div>

  <NavUl
    breakpoint="lg"
    {activeUrl}
    class="order-2 lg:order-1"
    classes={{ active: activeClass, nonActive: nonActiveClass, ul: 'p-0' }}
  >
    {#each menus as { level, items } (level)}
      <NavLi class="cursor-pointer">
        {level}
        <ChevronDownOutline size="sm" class="ms-1 inline" />
      </NavLi>

      <MegaMenu {items} classes={{ ul: '!gap-x-8' }}>
        {#snippet children({ item })}
          <a href={item.href} class={linkClass}>
            {item.name}
          </a>
        {/snippet}
      </MegaMenu>
    {/each}

    <NavLi class="cursor-pointer">
      More<ChevronDownOutline class="text-primary-800 ms-2 inline h-6 w-6 dark:text-white" />
    </NavLi>
    <Dropdown simple class="w-44">
      <DropdownItem href="/about">About</DropdownItem>
      <DropdownItem href="/resources">Resources</DropdownItem>
    </Dropdown>
  </NavUl>
</Navbar>
