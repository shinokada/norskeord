<script lang="ts">
  /**
   * "Try Plus free for 30 days" (ai-docs/implementation/free-trial.md, Phase 3).
   *
   * Shown to a signed-in user whose `trialEligible` flag is true (hooks.server.ts). On tap:
   *   1. POST /api/trial/start. A 409 means the trial is not available for this account; the
   *      server gives the same answer for every reason, so the text is the same too.
   *   2. On success, BEFORE the reload, upload the local progress with syncLocalProgressToPlus.
   *      Plus users read the cloud only, so without it the user would see an empty cloud during
   *      the trial. A failure is logged and ignored; the local keys stay for the next login.
   *   3. A full page load to `next`, so hooks.server.ts computes the new plan.
   */
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';
  import { syncLocalProgressToPlus } from '$lib/plus-sync';
  import { TRIAL_START_EVENT, trackEvent } from '$lib/analytics';

  interface Props {
    /** Same-origin path to load after the trial starts. Default: the current page. */
    next?: string;
    /** 'primary' is the filled indigo button, 'secondary' is the outlined one. */
    variant?: 'primary' | 'secondary';
    /** The "no card needed" line under the button. */
    showNote?: boolean;
  }

  let { next = '', variant = 'primary', showNote = true }: Props = $props();

  let loading = $state(false);
  let errorKind = $state<'' | 'unavailable' | 'generic'>('');

  const target = $derived(next || page.url.pathname + page.url.search);

  async function start() {
    if (loading) return;
    loading = true;
    errorKind = '';
    try {
      const res = await fetch('/api/trial/start', { method: 'POST' });

      if (res.status === 401) {
        // The session ended: log in and come back; the user taps the button again.
        window.location.href = `/auth/login?next=${encodeURIComponent(target)}`;
        return;
      }
      if (!res.ok) {
        errorKind = res.status === 409 ? 'unavailable' : 'generic';
        loading = false;
        return;
      }

      // GA key event "trial_start". `from_path` says which page the button was on. A beacon,
      // because the full page load below would otherwise cancel the request.
      trackEvent(TRIAL_START_EVENT, { from_path: page.url.pathname, transport_type: 'beacon' });

      const userId = page.data.user?.id;
      if (userId) {
        try {
          await syncLocalProgressToPlus(userId);
        } catch (error) {
          console.error('[trial] progress sync failed; local progress is kept', error);
        }
      }

      // Full load: the button stays disabled until the page changes.
      window.location.href = target;
    } catch {
      errorKind = 'generic';
      loading = false;
    }
  }
</script>

<div class="flex flex-col items-center gap-1.5">
  <button
    type="button"
    onclick={start}
    disabled={loading}
    class={[
      'rounded-lg px-6 py-2.5 text-sm font-semibold focus:ring-4 focus:outline-none disabled:opacity-50',
      variant === 'primary'
        ? 'bg-indigo-600 text-white shadow hover:bg-indigo-700 focus:ring-indigo-300'
        : 'border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 focus:ring-indigo-200 dark:border-indigo-700 dark:bg-transparent dark:text-indigo-300 dark:hover:bg-indigo-900/30'
    ].join(' ')}
  >
    {loading ? m.trial_start_loading() : m.trial_start_cta()}
  </button>

  {#if showNote && !errorKind}
    <p class="text-sm text-gray-600 dark:text-gray-300">{m.trial_start_note()}</p>
  {/if}

  {#if errorKind}
    <p class="max-w-sm text-center text-sm text-red-600 dark:text-red-400" role="alert">
      {errorKind === 'unavailable' ? m.trial_error_unavailable() : m.trial_error_generic()}
      {#if errorKind === 'unavailable'}
        <a href="/contact" class="font-medium underline">{m.nav_contact()}</a>
      {/if}
    </p>
  {/if}
</div>
