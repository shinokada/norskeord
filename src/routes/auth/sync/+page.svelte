<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { syncProgressOnLogin } from '$lib/progress';

  // The destination to redirect to after sync completes.
  const next = page.url.searchParams.get('next') ?? '/';

  onMount(async () => {
    const userId = page.data.user?.id;
    // 3-A: only sync progress to Supabase for Plus users
    const isPlus = (page.data.plan as 'free' | 'plus') === 'plus';

    if (userId && isPlus) {
      try {
        await syncProgressOnLogin(userId);
      } catch {
        // Sync failure is non-fatal — the user can still study offline.
        // Progress will be pushed on the next rating via dual-write.
      }
    }

    // `next` is a dynamic string from a query param so resolve() can't be used
    // (it only accepts statically-known route strings). goto() is safe here.
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto(next, { replaceState: true });
  });
</script>

<!-- Shown only for the brief moment before the redirect fires -->
<div class="flex min-h-screen items-center justify-center">
  <p class="text-sm text-gray-400 dark:text-gray-500">Syncing your progress…</p>
</div>
