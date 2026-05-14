<script lang="ts">
  import type { Profile } from '$lib/server/profile';
  import * as m from '$lib/paraglide/messages.js';

  let {
    profile,
    plan,
    billingPortalUrl
  }: {
    profile: Profile | null;
    plan: 'free' | 'plus';
    billingPortalUrl: string | null;
  } = $props();

  const isPlus = $derived(plan === 'plus');

  // ls_status is only populated after Phase 2-B webhook integration.
  // Until then it is null for all users — treat null as 'active' for Plus members.
  const status = $derived(isPlus ? (profile?.ls_status ?? 'active') : (profile?.ls_status ?? null));

  // Format ISO date string to a readable date e.g. "14 June 2025"
  function formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  const renewsAt = $derived(formatDate(profile?.ls_renews_at ?? null));
  const endsAt = $derived(formatDate(profile?.ls_ends_at ?? null));
</script>

<section
  class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
>
  <h2 class="mb-5 text-base font-semibold text-gray-800 dark:text-gray-100">
    {m.profile_sub_heading()}
  </h2>

  {#if !isPlus}
    <!-- Free user -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {m.profile_sub_plan_free()}
        </p>
      </div>
      <a
        href="/plus"
        class="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        {m.profile_sub_upgrade_cta()}
      </a>
    </div>
  {:else if status === 'cancelled'}
    <!-- Cancelled — still in grace period -->
    <div
      class="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20"
    >
      <p class="text-sm font-semibold text-orange-700 dark:text-orange-300">
        {endsAt
          ? m.profile_sub_cancelled_heading({ endsAt })
          : m.profile_sub_cancelled_heading_no_date()}
      </p>
      <p class="mt-1 text-sm text-orange-600 dark:text-orange-400">
        {m.profile_sub_cancelled_body()}
      </p>
    </div>
    {#if billingPortalUrl}
      <div class="mt-4 flex flex-wrap gap-3">
        <a
          href={billingPortalUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {m.profile_sub_reactivate()}
        </a>
        <a
          href={billingPortalUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {m.profile_sub_manage_billing()}
        </a>
      </div>
    {/if}
  {:else}
    <!-- Active Plus (status === 'active' or null pre-Phase-2B) -->
    <div class="space-y-2">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        {m.profile_sub_plan_label()}
        <span class="font-semibold text-indigo-600 dark:text-indigo-400">
          {m.profile_sub_plan_plus()}
        </span>
      </p>
      {#if renewsAt}
        <p class="text-sm text-gray-500 dark:text-gray-400">{m.profile_sub_renews()} {renewsAt}</p>
      {/if}
    </div>
    {#if billingPortalUrl}
      <a
        href={billingPortalUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="mt-4 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {m.profile_sub_manage_billing()}
      </a>
    {:else}
      <!-- Phase 2-B: portal URL not yet wired up -->
      <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">{m.profile_sub_billing_soon()}</p>
    {/if}
  {/if}

  <!-- Plus-only notification toggles -->
  {#if isPlus && status !== 'cancelled'}
    <div class="mt-6 border-t border-gray-100 pt-5 dark:border-gray-700">
      <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_sub_notifications_heading()}
      </p>
      <div class="space-y-3">
        <label class="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={profile?.daily_reminder ?? false}
            disabled
            class="h-4 w-4 rounded accent-indigo-600"
          />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {m.profile_sub_daily_reminder()}
            <span class="text-xs text-gray-400">({m.profile_sub_coming_soon()})</span>
          </span>
        </label>
        <label class="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={profile?.email_lesson ?? false}
            disabled
            class="h-4 w-4 rounded accent-indigo-600"
          />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {m.profile_sub_weekly_email()}
            <span class="text-xs text-gray-400">({m.profile_sub_coming_soon()})</span>
          </span>
        </label>
      </div>
    </div>
  {:else if !isPlus}
    <div class="mt-6 border-t border-gray-100 pt-5 dark:border-gray-700">
      <p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
        {m.profile_sub_notifications_heading()}
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500">
        {m.profile_sub_notifications_plus_only()}
      </p>
    </div>
  {/if}
</section>
