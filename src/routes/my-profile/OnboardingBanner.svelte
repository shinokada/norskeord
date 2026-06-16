<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { Profile } from '$lib/server/profile';
  import * as m from '$lib/paraglide/messages.js';

  let { profile }: { profile: Profile | null } = $props();

  const missingFields = $derived.by(() => {
    const missing: string[] = [];
    if (!profile?.display_name) missing.push('display_name');
    if (!profile?.native_language) missing.push('native_language');
    if (!profile?.current_level) missing.push('current_level');
    if (!profile?.study_goals?.length) missing.push('study_goals');
    return missing;
  });

  const missingCount = $derived(missingFields.length);
  const allDone = $derived(missingCount === 0);

  let dismissing = $state(false);

  // Auto-complete: if the user fills all fields via the profile page
  // (not the slide flow), mark onboarding_done automatically.
  $effect(() => {
    if (allDone && !profile?.onboarding_done && !dismissing) {
      dismissing = true;
      fetch('/api/profile/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_done: true })
      })
        .then(() => invalidateAll())
        .catch(() => {})
        .finally(() => {
          dismissing = false;
        });
    }
  });
</script>

{#if !allDone}
  <div
    class="mb-6 flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/60 dark:bg-amber-900/20"
    role="alert"
  >
    <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"></span>
    <div>
      <p class="text-sm font-semibold text-amber-900 dark:text-amber-200">
        {m.onboarding_nudge_banner_heading()}
      </p>
      <p class="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
        {m.onboarding_nudge_banner_body({
          count: missingCount,
          fields:
            missingCount === 1
              ? m.onboarding_nudge_field_singular()
              : m.onboarding_nudge_field_plural()
        })}
      </p>
      <p class="mt-2 text-xs text-amber-700 dark:text-amber-400">
        {#if missingFields.includes('display_name')}
          <span class="block">• {m.onboarding_nudge_missing_name()}</span>
        {/if}
        {#if missingFields.includes('native_language')}
          <span class="block">• {m.onboarding_nudge_missing_language()}</span>
        {/if}
        {#if missingFields.includes('current_level')}
          <span class="block">• {m.onboarding_nudge_missing_level()}</span>
        {/if}
        {#if missingFields.includes('study_goals')}
          <span class="block">• {m.onboarding_nudge_missing_goals()}</span>
        {/if}
      </p>
    </div>
  </div>
{/if}
