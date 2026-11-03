<script lang="ts">
  /**
   * The orange "see every category with Plus" box on /my-progress (vocab, uttrykk and quiz tabs).
   * It leads with the free trial where the trial can be started (ai-docs/implementation/free-trial.md):
   *   - guest: "Log in to start your free trial" (back to this page after login)
   *   - signed-in and trial-eligible: the trial button (the user stays on this page)
   *   - everyone else (trial used or ended, or Plus): only "Upgrade to Plus"
   * "Upgrade to Plus" stays available as a quieter link next to the trial.
   */
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';
  import TrialButton from '$lib/components/TrialButton.svelte';
  import { trialOffered } from '$lib/trial';

  interface Props {
    heading: string;
    body: string;
    testid?: string;
    /** Text of the plain upgrade button (trial used or ended). */
    upgradeLabel?: string;
    /** Classes for the outer box; replaces the default bottom margin and can set the width. */
    class?: string;
  }

  let {
    heading,
    body,
    testid,
    upgradeLabel = m.stats_plus_upgrade(),
    class: className = 'mb-8'
  }: Props = $props();

  // Signed-in with a trial available, or signed out: the same trial button (a login link when
  // signed out, see TrialButton). Everyone else only gets "Upgrade to Plus".
  const offered = $derived(trialOffered(page.data));

  const upgradeLinkClass =
    'text-sm font-semibold text-orange-700 underline underline-offset-2 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200';
</script>

<div
  data-testid={testid}
  class="{className} rounded-xl border border-orange-200 bg-orange-50 px-6 py-5 dark:border-orange-800 dark:bg-orange-900/20"
>
  <p class="font-semibold text-orange-700 dark:text-orange-300">⭐ {heading}</p>
  <p class="mt-1 text-sm text-orange-600 dark:text-orange-400">{body}</p>

  {#if offered}
    <!-- TrialButton centres its own content; keep it left-aligned inside this box. -->
    <div class="mt-3 flex flex-col items-start gap-3 [&>div]:items-start">
      <TrialButton />
      <a href="/plus" class={upgradeLinkClass}>{upgradeLabel}</a>
    </div>
  {:else}
    <a
      href="/plus"
      class="mt-3 inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 focus:outline-none dark:bg-orange-400 dark:hover:bg-orange-500"
    >
      {upgradeLabel}
    </a>
  {/if}
</div>
