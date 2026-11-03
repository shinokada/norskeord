<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { Profile } from '$lib/server/profile';
  import * as m from '$lib/paraglide/messages.js';

  let { profile }: { profile: Profile | null } = $props();

  // native_language and country were removed in migration 020 (decision 9 in
  // ai-docs/implementation/new-languages.md). study_goals is no longer
  // collected during onboarding either — nothing downstream uses it yet, so
  // only current_level is tracked here (display_name is optional: when empty the UI uses the
  // account email).
  const missingFields = $derived.by(() => {
    const missing: string[] = [];
    if (!profile?.current_level) missing.push('current_level');
    return missing;
  });

  const missingCount = $derived(missingFields.length);
  const allDone = $derived(missingCount === 0);

  // Auto-complete: if the user fills all fields via the profile page
  // (not the slide flow), mark onboarding_done automatically. One attempt per page view: the
  // flag is not reset on failure, otherwise a failing save would re-run this effect and resend
  // the request forever. A reload tries again.
  let attempted = false;

  $effect(() => {
    if (allDone && !profile?.onboarding_done && !attempted) {
      attempted = true;
      fetch('/api/profile/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_done: true })
      })
        .then((res) => {
          // fetch resolves on 4xx/5xx too: only a saved flag is worth reloading the profile for.
          if (res.ok) return invalidateAll();
        })
        .catch(() => {});
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
        {#if missingFields.includes('current_level')}
          <span class="block">• {m.onboarding_nudge_missing_level()}</span>
        {/if}
      </p>
    </div>
  </div>
{/if}
