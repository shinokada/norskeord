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

  interface Props {
    heading: string;
    body: string;
    testid?: string;
  }

  let { heading, body, testid }: Props = $props();

  const signedIn = $derived(!!page.data.user);
  const trialEligible = $derived(signedIn && page.data.trialEligible === true);
  const loginHref = $derived(
    `/auth/login?next=${encodeURIComponent(page.url.pathname + page.url.search)}`
  );

  const upgradeLinkClass =
    'text-sm font-semibold text-orange-700 underline underline-offset-2 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-200';
</script>

<div
  data-testid={testid}
  class="mb-8 rounded-xl border border-orange-200 bg-orange-50 px-6 py-5 dark:border-orange-800 dark:bg-orange-900/20"
>
  <p class="font-semibold text-orange-700 dark:text-orange-300">⭐ {heading}</p>
  <p class="mt-1 text-sm text-orange-600 dark:text-orange-400">{body}</p>

  {#if trialEligible}
    <!-- TrialButton centres its own content; keep it left-aligned inside this box. -->
    <div class="mt-3 flex flex-col items-start gap-3 [&>div]:items-start">
      <TrialButton />
      <a href="/plus" class={upgradeLinkClass}>{m.stats_plus_upgrade()}</a>
    </div>
  {:else if !signedIn}
    <div class="mt-3 flex flex-col items-start gap-3">
      <div class="flex flex-col items-start gap-1.5">
        <a
          href={loginHref}
          class="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none"
        >
          {m.trial_login_cta()}
        </a>
        <p class="text-sm text-orange-700 dark:text-orange-300">{m.trial_start_note()}</p>
      </div>
      <a href="/plus" class={upgradeLinkClass}>{m.stats_plus_upgrade()}</a>
    </div>
  {:else}
    <a
      href="/plus"
      class="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 focus:outline-none dark:bg-orange-400 dark:hover:bg-orange-500"
    >
      {m.stats_plus_upgrade()}
    </a>
  {/if}
</div>
