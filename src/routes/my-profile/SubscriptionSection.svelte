<script lang="ts">
  import type { Profile } from '$lib/server/profile';
  import * as m from '$lib/paraglide/messages.js';
  import { subscribeToPush, unsubscribeFromPush } from '$lib/push';

  let {
    profile,
    plan,
    billingPortalUrl,
    billingInterval
  }: {
    profile: Profile | null;
    plan: 'free' | 'plus';
    billingPortalUrl: string | null;
    billingInterval: string | null;
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

  // Checkout
  let checkoutLoading = $state(false);
  let checkoutError = $state('');

  async function handleCheckout() {
    checkoutError = '';
    checkoutLoading = true;
    try {
      const res = await fetch('/api/lemon/checkout', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        checkoutError = m.checkout_error_generic();
        return;
      }
      window.location.href = result.checkoutUrl;
    } catch {
      checkoutError = m.checkout_error_generic();
    } finally {
      checkoutLoading = false;
    }
  }

  // ── Push reminder toggle ─────────────────────────────────────────────────────
  let dailyReminder = $derived.by(() => profile?.daily_reminder ?? false);
  let reminderLoading = $state(false);
  let reminderError = $state('');

  async function handleReminderToggle() {
    reminderError = '';
    reminderLoading = true;
    const turningOn = !dailyReminder;
    try {
      if (turningOn) {
        const sub = await subscribeToPush();
        if (!sub) {
          reminderError = 'Could not enable notifications. Please check your browser settings.';
          return;
        }
        dailyReminder = true;
      } else {
        await unsubscribeFromPush();
        dailyReminder = false;
      }
    } catch (err) {
      console.error('[push] toggle failed:', err);
      reminderError = 'Something went wrong. Please try again.';
    } finally {
      reminderLoading = false;
    }
  }

  // ── Email reminder toggle ────────────────────────────────────────────────────
  let emailReminder = $derived.by(() => profile?.email_reminder ?? false);
  let emailReminderLoading = $state(false);
  let emailReminderError = $state('');
  let emailReminderSaved = $state(false);

  async function handleEmailReminderToggle() {
    emailReminderError = '';
    emailReminderLoading = true;
    emailReminderSaved = false;
    const turningOn = !emailReminder;
    try {
      const res = await fetch('/api/profile/email-reminder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: turningOn })
      });
      if (!res.ok) {
        emailReminderError = 'Something went wrong. Please try again.';
        return;
      }
      emailReminder = turningOn;
      emailReminderSaved = true;
      setTimeout(() => (emailReminderSaved = false), 2500);
    } catch (err) {
      console.error('[email-reminder] toggle failed:', err);
      emailReminderError = 'Something went wrong. Please try again.';
    } finally {
      emailReminderLoading = false;
    }
  }
</script>

<section
  class="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-indigo-950/60"
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
      <button
        type="button"
        onclick={handleCheckout}
        disabled={checkoutLoading}
        class="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {checkoutLoading ? m.plus_activating() : m.profile_sub_upgrade_cta()}
      </button>
    </div>
    {#if checkoutError}
      <p class="mt-2 text-xs text-red-500">{checkoutError}</p>
    {/if}
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
          class="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/10 dark:text-gray-300"
        >
          {m.profile_sub_manage_billing()}
        </a>
      </div>
    {/if}
  {:else}
    <!-- Active Plus (status === 'active' or null pre-Phase-2B) -->
    <div class="space-y-1">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        {m.profile_sub_plan_label()}
        <span class="font-semibold text-indigo-600 dark:text-indigo-400">
          {m.profile_sub_plan_plus()}
        </span>
      </p>
      {#if billingInterval === 'year'}
        <p class="text-xs text-gray-600 dark:text-gray-300">{m.profile_sub_billed_annually()}</p>
      {:else if billingInterval === 'month'}
        <p class="text-xs text-gray-600 dark:text-gray-300">{m.profile_sub_billed_monthly()}</p>
      {/if}
      {#if renewsAt}
        <p class="text-sm text-gray-600 dark:text-gray-300">{m.profile_sub_renews()} {renewsAt}</p>
      {/if}
    </div>
    {#if billingPortalUrl}
      <a
        href={billingPortalUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="mt-4 inline-block rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/10 dark:text-gray-300"
      >
        {m.profile_sub_manage_billing()}
      </a>
    {/if}
  {/if}

  <!-- Plus-only notification toggles -->
  {#if isPlus && status !== 'cancelled'}
    <div class="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
      <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_sub_notifications_heading()}
      </p>
      <div class="space-y-4">
        <!-- Push reminder -->
        <div>
          <label class="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={dailyReminder}
              disabled={reminderLoading}
              onclick={handleReminderToggle}
              class="h-4 w-4 rounded accent-indigo-600 disabled:opacity-50"
            />
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {m.profile_sub_daily_reminder()}
              {#if reminderLoading}
                <span class="text-xs text-gray-400">Saving…</span>
              {/if}
            </span>
          </label>
          <p class="mt-0.5 ml-7 text-xs text-gray-600 dark:text-gray-300">
            {m.profile_sub_daily_reminder_hint()}
            <a
              href="https://www.timeanddate.com/worldclock/fixedtime.html?hour=19&min=0&sec=0"
              target="_blank"
              rel="noopener noreferrer"
              class="underline hover:text-gray-600 dark:hover:text-gray-300"
              >What's that in my time?</a
            >
          </p>
          {#if reminderError}
            <p class="mt-1 ml-7 text-xs text-red-500">{reminderError}</p>
          {/if}
        </div>

        <!-- Email reminder -->
        <div>
          <label class="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={emailReminder}
              disabled={emailReminderLoading}
              onclick={handleEmailReminderToggle}
              class="h-4 w-4 rounded accent-indigo-600 disabled:opacity-50"
            />
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {m.profile_sub_email_reminder()}
              {#if emailReminderLoading}
                <span class="text-xs text-gray-400">Saving…</span>
              {:else if emailReminderSaved}
                <span class="text-xs text-indigo-500">✓ Saved</span>
              {/if}
            </span>
          </label>
          <p class="mt-0.5 ml-7 text-xs text-gray-600 dark:text-gray-300">
            {m.profile_sub_email_reminder_hint()}
            <a
              href="https://www.timeanddate.com/worldclock/fixedtime.html?hour=19&min=0&sec=0"
              target="_blank"
              rel="noopener noreferrer"
              class="underline hover:text-gray-600 dark:hover:text-gray-300"
              >What's that in my time?</a
            >
          </p>
          {#if emailReminderError}
            <p class="mt-1 ml-7 text-xs text-red-500">{emailReminderError}</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if !isPlus}
    <div class="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
      <p class="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
        {m.profile_sub_notifications_heading()}
      </p>
      <p class="text-xs text-gray-600 dark:text-gray-300">
        {m.profile_sub_notifications_plus_only()}
      </p>
    </div>
  {/if}
</section>
