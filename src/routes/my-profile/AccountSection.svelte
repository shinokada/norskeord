<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Profile } from '$lib/server/profile';
  import * as m from '$lib/paraglide/messages.js';

  let { profile, missingFields = [] }: { profile: Profile | null; missingFields: string[] } =
    $props();

  let saving = $state(false);
  let saved = $state(false);
  let errorMsg = $state('');

  const initials = $derived(() => {
    const name = profile?.display_name ?? '';
    if (name.trim()) {
      return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
    }
    return '?';
  });

  function _handleExport() {
    window.location.href = '/api/export';
  }

  let reportLoading = $state(false);

  async function handleProgressReport() {
    reportLoading = true;
    try {
      // Read progressMap from localStorage
      const progressMap: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('progress-')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) progressMap[key.slice('progress-'.length)] = JSON.parse(raw);
          } catch {
            /* skip malformed */
          }
        }
      }

      const res = await fetch('/api/progress-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressMap })
      });

      if (!res.ok) throw new Error('Failed');

      // Open the HTML report in a new tab — window.print() fires automatically
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert('Could not generate report. Please try again.');
    } finally {
      reportLoading = false;
    }
  }
</script>

<section
  class="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-indigo-950/60"
>
  <h2 class="mb-5 text-base font-semibold text-gray-800 dark:text-gray-100">
    {m.profile_account_heading()}
  </h2>

  <!-- Avatar placeholder -->
  <div class="mb-6">
    <div
      class="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
    >
      {initials()}
    </div>
  </div>

  <form
    method="POST"
    action="?/updateAccount"
    use:enhance={() => {
      saving = true;
      saved = false;
      errorMsg = '';
      return async ({ result, update }) => {
        saving = false;
        if (result.type === 'success') {
          saved = true;
          setTimeout(() => (saved = false), 2500);
        } else if (result.type === 'failure') {
          errorMsg = (result.data?.message as string) ?? m.profile_error_generic();
        }
        await update();
      };
    }}
    class="space-y-4"
  >
    <div>
      <label
        for="display_name"
        class="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {m.profile_account_display_name()}
        {#if missingFields.includes('display_name')}
          <span
            class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/40 dark:text-red-400"
          >
            {m.onboarding_nudge_field_required()}
          </span>
        {/if}
      </label>
      <input
        id="display_name"
        name="display_name"
        type="text"
        maxlength="40"
        value={profile?.display_name ?? ''}
        placeholder={m.profile_account_display_name_placeholder()}
        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none sm:max-w-xs dark:border-white/20 dark:bg-indigo-900/30 dark:text-gray-100 dark:placeholder-gray-500"
      />
      {#if errorMsg}
        <p class="mt-1 text-xs text-red-500">{errorMsg}</p>
      {/if}
    </div>

    <div>
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_account_email()}
      </p>
      <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
        {m.profile_account_email_hint()}
      </p>
    </div>

    <button
      type="submit"
      disabled={saving}
      class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {saving ? m.profile_saving() : saved ? m.profile_saved() : m.profile_save()}
    </button>
  </form>

  <!-- Progress report -->
  <div class="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress report</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Your CEFR level, cards seen, and strongest &amp; weakest categories as a printable PDF.
        </p>
      </div>
      <button
        type="button"
        onclick={handleProgressReport}
        disabled={reportLoading}
        class="mt-2 shrink-0 rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 sm:mt-0 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
      >
        {reportLoading ? 'Generating…' : '↓ Download report'}
      </button>
    </div>
  </div>
</section>
