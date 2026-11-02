<script lang="ts">
  /**
   * End-of-trial message (ai-docs/implementation/free-trial.md, Phase 5).
   *
   * Shown to a free user whose Plus trial has ended. Two variants:
   * - 'banner': under the Nav on every page except /plus (the button leads there) and
   *   /my-progress (it has the note). Dismissible; the dismissal is kept in localStorage under
   *   `trial-ended-dismissed:<trialEndsAt>`, so it stays hidden for good.
   * - 'note': at the top of /my-progress, where a lapsed user looks because the page seems empty.
   *   Not dismissible.
   * It renders after mount only, because the dismissal lives in the browser.
   */
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';
  import { trialView } from '$lib/stores/trial.svelte';

  let { variant = 'banner' }: { variant?: 'banner' | 'note' } = $props();

  const KEY_PREFIX = 'trial-ended-dismissed:';

  let checked = $state(false);
  let dismissed = $state(false);

  const key = $derived(`${KEY_PREFIX}${trialView.endsAt ?? ''}`);

  // Runs in the browser only. Re-reads the flag if the trial end changes.
  $effect(() => {
    const current = key;
    try {
      dismissed = localStorage.getItem(current) === '1';
    } catch {
      dismissed = false;
    }
    checked = true;
  });

  const visible = $derived(
    checked &&
      trialView.state === 'ended' &&
      (variant === 'note' ||
        (!dismissed &&
          !page.url.pathname.startsWith('/plus') &&
          !page.url.pathname.startsWith('/my-progress')))
  );

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(key, '1');
    } catch {
      /* storage blocked: hidden until the next page load */
    }
  }
</script>

{#if visible}
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-2 border-amber-200 bg-amber-50 px-4 py-2 text-sm text-gray-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-gray-100 {variant ===
    'banner'
      ? 'justify-center border-b'
      : 'mb-6 rounded-xl border py-3 text-left'}"
    role="status"
    data-testid={variant === 'banner' ? 'trial-ended-banner' : 'trial-ended-note'}
  >
    <span class="font-medium">{m.trial_ended_text()}</span>
    <a
      href="/plus?ref=trial-ended"
      class="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      {m.trial_ended_cta()}
    </a>
    {#if variant === 'banner'}
      <button
        type="button"
        onclick={dismiss}
        aria-label={m.trial_banner_dismiss()}
        class="rounded p-1 text-gray-500 hover:bg-amber-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-amber-800/50 dark:hover:text-white"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 6l12 12M18 6L6 18"
          />
        </svg>
      </button>
    {/if}
  </div>
{/if}
