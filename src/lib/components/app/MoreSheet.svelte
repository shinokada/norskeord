<script lang="ts">
  /**
   * Bottom sheet that the Profile tab opens for guests (ai-docs/implementation/mobile-web-shell.md,
   * Phase 5, decision 1). A guest has no profile page, and below `md` the top nav and its hamburger
   * are hidden on tab routes, so without this sheet a guest could not reach the language switcher,
   * dark mode, Plus, Guide, FAQ, Contact, Privacy or Terms. A prominent Log in button comes first,
   * then `MoreMenu`.
   *
   * The sheet is a native `<dialog>` (flowbite `Drawer`), so Escape, the close button and a tap on
   * the backdrop close it. The layout stays mounted across navigations, so it also closes itself
   * after each navigation.
   */
  import { Drawer } from 'flowbite-svelte';
  import { afterNavigate } from '$app/navigation';
  import MoreMenu from './MoreMenu.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  afterNavigate(() => {
    open = false;
  });
</script>

<Drawer
  bind:open
  placement="bottom"
  aria-label={m.more_menu_title()}
  class="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-gray-50 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-blue-950"
>
  <div class="mx-auto max-w-lg">
    <p class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{m.more_menu_title()}</p>
    <a
      href="/auth/login"
      data-autofocus
      class="mb-3 flex min-h-12 items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700"
    >
      {m.nav_log_in()}
    </a>
    <MoreMenu onnavigate={() => (open = false)} />
  </div>
</Drawer>
