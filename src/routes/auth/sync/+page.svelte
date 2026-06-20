<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { setLocale } from '$lib/paraglide/runtime';
  import {
    clearUserProgress,
    loadProgressMapFromSupabase,
    migrateLocalProgressToSupabase
  } from '$lib/progress';
  import { validFlashcardPathPattern } from '$lib/utils';

  onMount(async () => {
    const userId = page.data.user?.id;
    const isPlus = (page.data.plan as 'free' | 'plus') === 'plus';
    const profile = page.data.profile;

    // One-time migration: free → Plus upgrade
    if (isPlus && userId) {
      const supabaseMap = await loadProgressMapFromSupabase(userId);
      if (Object.keys(supabaseMap).length === 0) {
        await migrateLocalProgressToSupabase(userId);
      } else {
        clearUserProgress();
      }
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
  <p class="text-sm text-gray-600 dark:text-gray-300">Syncing your progress…</p>
</div>
