<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { setLocale } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages.js';
  import { syncLocalProgressToPlus } from '$lib/plus-sync';
  import { adoptLiveProgress } from '$lib/parked-progress';
  import { validFlashcardPathPattern } from '$lib/utils';

  onMount(async () => {
    // Clear any pending login state from the login page
    localStorage.removeItem('login_pending');
    localStorage.removeItem('login_pending_token');

    const userId = page.data.user?.id;
    const isPlus = (page.data.plan as 'free' | 'plus') === 'plus';
    const profile = page.data.profile;

    // Every login (free and Plus): bring back this account's progress parked at logout and
    // record it as the owner of the live keys. Must run before syncLocalProgressToPlus so the
    // retry sees the restored keys (ai-docs/implementation/logout-progress-parking.md).
    if (userId) {
      try {
        adoptLiveProgress(userId);
      } catch (error) {
        // Must not block the redirect after login
        console.error('auth/sync: could not restore parked progress', error);
      }
    }

    // One-time migration: free → Plus upgrade (see syncLocalProgressToPlus)
    if (isPlus && userId) {
      await syncLocalProgressToPlus(userId);
    }

    // Seed localStorage from profile preferences
    if (profile) {
      const modeValue = profile.card_direction === 'en_no' ? 'engnor' : 'noreng';
      localStorage.setItem('vocab-flashcard-mode', modeValue);

      if (profile.ui_language === 'nb' || profile.ui_language === 'en') {
        localStorage.setItem('locale', profile.ui_language);
        setLocale(profile.ui_language, { reload: false });
      }

      if (!localStorage.getItem('vocab-flashcard-card-type')) {
        localStorage.setItem(
          'vocab-flashcard-card-type',
          profile.include_phrases ? 'word' : 'word'
        );
      }
    }

    // ── Determine post-login destination ──────────────────────────────────
    // Server provided the base destination (handles `next` param).
    // Client overrides with localStorage last path for returning users
    // who logged in without an explicit `next` param.
    let destination = page.data.destination as string;

    if (destination === '/learn/a1') {
      // No explicit `next` was set — check if this is a returning user
      const last = localStorage.getItem('last-flashcard-path');
      if (last && validFlashcardPathPattern.test(last)) {
        destination = last;
      }
    }

    window.location.href = destination;
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <p class="text-sm text-gray-600 dark:text-gray-300">{m.auth_sync_syncing()}</p>
</div>
