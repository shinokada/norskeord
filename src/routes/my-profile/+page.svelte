<script lang="ts">
  import AccountSection from './AccountSection.svelte';
  import PreferencesSection from './PreferencesSection.svelte';
  import SubscriptionSection from './SubscriptionSection.svelte';
  import DangerZone from './DangerZone.svelte';
  import OnboardingBanner from './OnboardingBanner.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // Nudge is active when snoozed but not yet marked done
  const showNudge = $derived(
    !!data.user && !data.profile?.onboarding_done && data.profile?.onboarding_snoozed_at != null
  );

  // Which fields are empty — passed to sections so they can render red labels.
  // native_language and country were removed in migration 020 (decision 9 in
  // ai-docs/implementation/new-languages.md). study_goals is no longer
  // collected during onboarding either, so only display_name and
  // current_level are tracked here.
  const missingFields = $derived.by(() => {
    if (!showNudge) return [] as string[];
    const missing: string[] = [];
    if (!data.profile?.display_name) missing.push('display_name');
    if (!data.profile?.current_level) missing.push('current_level');
    return missing;
  });
</script>

<svelte:head>
  <title>{m.profile_title()} — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10 text-left">
  <div class="mb-8">
    <h1 class="text-3xl font-bold dark:text-white">{m.profile_title()}</h1>
  </div>

  {#if showNudge}
    <OnboardingBanner profile={data.profile} />
  {/if}

  <div class="space-y-6">
    <AccountSection profile={data.profile} {missingFields} email={data.user?.email ?? ''} />
    <PreferencesSection profile={data.profile} {missingFields} />
    <SubscriptionSection
      profile={data.profile}
      plan={data.plan}
      billingPortalUrl={data.billingPortalUrl}
      billingInterval={data.billingInterval}
    />
    <details class="group">
      <summary class="cursor-pointer list-none py-1">
        <span
          class="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 transition-colors hover:text-red-400"
        >
          <span class="inline-block transition-transform group-open:rotate-90">▸</span>
          Danger Zone
        </span>
      </summary>
      <div class="mt-3">
        <DangerZone />
      </div>
    </details>
  </div>
</div>
