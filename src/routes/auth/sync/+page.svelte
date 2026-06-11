<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { setLocale } from '$lib/paraglide/runtime';
  import {
    clearUserProgress,
    loadProgressMapFromSupabase,
    migrateLocalProgressToSupabase
  } from '$lib/progress';
  import { validFlashcardPathPattern } from '$lib/utils';

  // `next` from the magic-link callback — always '/' since we don't inject
  // the last path into the login flow. We determine destination ourselves below.
  const next = page.url.searchParams.get('next') ?? '/';

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
    // First-time login (no stored last path) → onboarding start at A1.
    // Returning user → restore their last visited page.
    // Explicit `next` param (e.g. from a shared link) → honour it.
    let destination = '/learn/a1'; // default: onboarding

    if (next !== '/') {
      // Explicit destination from the magic-link URL (e.g. email CTA link)
      destination = next;
    } else {
      const last = localStorage.getItem('last-flashcard-path');
      if (last && validFlashcardPathPattern.test(last)) {
        // Returning user — go back to where they left off
        destination = last;
      }
      // else: no stored path → first-time user → keep '/learn/a1'
    }

    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto(destination, { replaceState: true });
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <p class="text-sm text-gray-400 dark:text-gray-500">Syncing your progress…</p>
</div>
