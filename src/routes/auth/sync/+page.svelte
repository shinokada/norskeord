<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { syncProgressOnLogin } from '$lib/progress';
  import { setLocale } from '$lib/paraglide/runtime';

  const next = page.url.searchParams.get('next') ?? '/';

  onMount(async () => {
    const userId = page.data.user?.id;
    const isPlus = (page.data.plan as 'free' | 'plus') === 'plus';
    const profile = page.data.profile;

    // Seed localStorage from profile preferences so the app reflects
    // what the user saved on the profile page.
    if (profile) {
      // Card direction → VocabFlashcardPage reads 'vocab-flashcard-mode'
      const modeValue = profile.card_direction === 'en_no' ? 'engnor' : 'noreng';
      localStorage.setItem('vocab-flashcard-mode', modeValue);

      // Interface language → Nav reads 'locale'
      if (profile.ui_language === 'nb' || profile.ui_language === 'en') {
        localStorage.setItem('locale', profile.ui_language);
        setLocale(profile.ui_language, { reload: false });
      }

      // Include phrases → VocabFlashcardPage reads 'vocab-flashcard-card-type'
      // Only seed if not already set — let the user's in-session toggle win.
      if (!localStorage.getItem('vocab-flashcard-card-type')) {
        localStorage.setItem(
          'vocab-flashcard-card-type',
          profile.include_phrases ? 'word' : 'word'
        );
      }
    }

    // Sync card progress for Plus users
    if (userId && isPlus) {
      try {
        await syncProgressOnLogin(userId);
      } catch {
        // Non-fatal — progress will sync on next rating via dual-write.
      }
    }

    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto(next, { replaceState: true });
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <p class="text-sm text-gray-400 dark:text-gray-500">Syncing your progress…</p>
</div>
