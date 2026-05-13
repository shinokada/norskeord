<script lang="ts">
  import AccountSection from './AccountSection.svelte';
  import PreferencesSection from './PreferencesSection.svelte';
  import SubscriptionSection from './SubscriptionSection.svelte';
  import DangerZone from './DangerZone.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Profile — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10">
  <div class="mb-8">
    <h1 class="text-3xl font-bold dark:text-white">Profile</h1>
    {#if data.user?.email}
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{data.user.email}</p>
    {/if}
  </div>

  <div class="space-y-6">
    <AccountSection profile={data.profile} />
    <PreferencesSection profile={data.profile} />
    <SubscriptionSection
      profile={data.profile}
      plan={data.plan}
      billingPortalUrl={data.billingPortalUrl}
    />
    <DangerZone />
  </div>
</div>
