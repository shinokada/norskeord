<script lang="ts">
  import AccountSection from './AccountSection.svelte';
  import PreferencesSection from './PreferencesSection.svelte';
  import SubscriptionSection from './SubscriptionSection.svelte';
  import DangerZone from './DangerZone.svelte';
  import ContactSupport from './ContactSupport.svelte';
  import OnboardingBanner from './OnboardingBanner.svelte';
  import OnboardingFieldsSection from './OnboardingFieldsSection.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // Nudge is active when snoozed but not yet marked done
  const showNudge = $derived(
    !!data.user && !data.profile?.onboarding_done && data.profile?.onboarding_snoozed_at != null
  );

  // Which fields are empty — passed to sections so they can render red labels.
  // native_language and country were removed in migration 020 (decision 9 in
  // ai-docs/implementation/new-languages.md), so only the three remaining
  // meaningful onboarding fields are tracked here.
  const missingFields = $derived.by(() => {
    if (!showNudge) return [] as string[];
    const missing: string[] = [];
    if (!data.profile?.display_name) missing.push('display_name');
    if (!data.profile?.current_level) missing.push('current_level');
    if (!data.profile?.study_goals?.length) missing.push('study_goals');
    return missing;
  });
</script>

<svelte:head>
  <title>{m.profile_title()} — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10 text-left">
  <div class="mb-8">
    <h1 class="text-3xl font-bold dark:text-white">{m.profile_title()}</h1>
    {#if data.user?.email}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{data.user.email}</p>
    {/if}
  </div>

  {#if showNudge}
    <OnboardingBanner profile={data.profile} />
  {/if}

  <div class="space-y-6">
    {#if showNudge && missingFields.length > 0}
      <OnboardingFieldsSection profile={data.profile} {missingFields} />
    {/if}

    <AccountSection profile={data.profile} {missingFields} />
    <PreferencesSection profile={data.profile} {missingFields} />
    <SubscriptionSection
      profile={data.profile}
      plan={data.plan}
      billingPortalUrl={data.billingPortalUrl}
      billingInterval={data.billingInterval}
    />
    <ContactSupport isPlus={data.plan === 'plus'} />
    <DangerZone />
  </div>
</div>
