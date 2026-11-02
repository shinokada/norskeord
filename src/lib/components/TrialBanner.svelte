<script lang="ts">
  /**
   * Trial countdown banner under the Nav (ai-docs/implementation/free-trial.md, Phase 4).
   *
   * Shows to a user whose Plus trial has 14 days or fewer left, on every page except /plus (the
   * button leads there). Dismissible: the time of the dismissal is kept in localStorage
   * (`trial-banner-dismissed`) and the banner returns 24 hours later, also in a tab that stays
   * open. It renders after mount only, because the dismissal lives in the browser and the server
   * cannot know it.
   */
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';
  import { trialView, refreshTrialClock } from '$lib/stores/trial.svelte';

  const BANNER_DAYS = 14;
  const DISMISSED_KEY = 'trial-banner-dismissed';
  const DISMISS_MS = 24 * 60 * 60 * 1000;

  let ready = $state(false);
  // Timestamps in ms. 0 means "never dismissed" (an old or invalid stored value also gives 0).
  let dismissedAt = $state(0);
  let nowMs = $state(0);

  function tick() {
    nowMs = Date.now();
    refreshTrialClock();
  }

  onMount(() => {
    try {
      dismissedAt = Number(localStorage.getItem(DISMISSED_KEY)) || 0;
    } catch {
      /* storage blocked: the banner just cannot stay dismissed after a reload */
    }
    tick();
    ready = true;
    // Keep the days left current, and let the banner return after 24 hours, in an open tab.
    const timer = setInterval(tick, 10 * 60 * 1000);
    return () => clearInterval(timer);
  });

  const visible = $derived(
    ready &&
      trialView.state === 'active' &&
      trialView.daysLeft <= BANNER_DAYS &&
      nowMs - dismissedAt >= DISMISS_MS &&
      !page.url.pathname.startsWith('/plus')
  );

  function dismiss() {
    tick();
    dismissedAt = nowMs;
    try {
      localStorage.setItem(DISMISSED_KEY, String(dismissedAt));
    } catch {
      /* the banner is hidden for now and returns on the next page load */
    }
  }
</script>

{#if visible}
  <div
    class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-gray-800 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-gray-100"
    role="status"
    data-testid="trial-banner"
  >
    <span class="font-medium">
      {trialView.daysLeft <= 1
        ? m.trial_banner_last()
        : m.trial_banner_text({ count: trialView.daysLeft })}
    </span>
    <a
      href="/plus?ref=trial-banner"
      class="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      {m.trial_banner_cta()}
    </a>
    <button
      type="button"
      onclick={dismiss}
      aria-label={m.trial_banner_dismiss()}
      class="rounded p-1 text-gray-500 hover:bg-indigo-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-indigo-800/50 dark:hover:text-white"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 6l12 12M18 6L6 18"
        />
      </svg>
    </button>
  </div>
{/if}
