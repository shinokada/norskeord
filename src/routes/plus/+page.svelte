<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';

  let emailSubmitted = $state(false);
  let emailValue = $state('');
  let emailError = $state('');
  let submitting = $state(false);

  const tableRows = $derived([
    {
      feature: m.plus_row_vocab(),
      free: { value: m.plus_row_vocab_free(), yes: true },
      pro: { value: m.plus_row_vocab_plus(), yes: true }
    },
    {
      feature: m.plus_row_rating(),
      free: { value: m.plus_row_rating_included(), yes: true },
      pro: { value: m.plus_row_rating_included(), yes: true }
    },
    {
      feature: m.plus_row_due(),
      free: { value: m.plus_row_due_free(), yes: false },
      pro: { value: m.plus_row_due_plus(), yes: true }
    },
    {
      feature: m.plus_row_stats(),
      free: { value: m.plus_row_stats_included(), yes: true },
      pro: { value: m.plus_row_stats_included(), yes: true }
    },
    {
      feature: m.plus_row_sync(),
      free: { value: m.plus_row_sync_free(), yes: false },
      pro: { value: m.plus_row_sync_plus(), yes: true }
    },
    {
      feature: m.plus_row_exam(),
      free: { value: m.plus_row_exam_free(), yes: false },
      pro: { value: m.plus_row_exam_plus(), yes: true }
    },
    {
      feature: m.plus_row_support(),
      free: { value: m.plus_row_support_free(), yes: false },
      pro: { value: m.plus_row_support_plus(), yes: true }
    }
  ]);

  const plusFeatures = $derived([
    {
      icon: '🧠',
      title: m.plus_feature_1_title(),
      body: m.plus_feature_1_body()
    },
    {
      icon: '📚',
      title: m.plus_feature_2_title(),
      body: m.plus_feature_2_body()
    },
    {
      icon: '☁️',
      title: m.plus_feature_3_title(),
      body: m.plus_feature_3_body()
    },
    {
      icon: '🎯',
      title: m.plus_feature_4_title(),
      body: m.plus_feature_4_body()
    }
  ]);

  async function handleSignup() {
    emailError = '';

    if (!emailValue.trim()) {
      emailError = m.plus_error_empty();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      emailError = m.plus_error_invalid();
      return;
    }

    submitting = true;
    try {
      const res = await fetch('/plus/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue })
      });
      const data = await res.json();

      if (!res.ok) {
        emailError = data.error ?? m.plus_error_generic();
        return;
      }

      emailSubmitted = true;
    } catch {
      emailError = m.plus_error_network();
    } finally {
      submitting = false;
    }
  }
</script>

<div class="mx-auto max-w-4xl px-4 py-10 text-left">
  <!-- ── Hero ──────────────────────────────────────────────────────────────────── -->
  <div class="mb-12 text-center">
    <h1 class="text-4xl leading-tight font-bold dark:text-white">
      {m.plus_heading()}
    </h1>
    <p class="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
      {m.plus_subheading()}
    </p>
    <p class="mt-3 text-sm text-gray-400 dark:text-gray-500">
      {m.plus_notify_prompt()}
    </p>
  </div>

  <!-- ── Email signup ───────────────────────────────────────────────────────────── -->
  <div
    class="mb-14 rounded-2xl border border-indigo-200 bg-indigo-50 p-8 text-center dark:border-indigo-800 dark:bg-indigo-900/20"
  >
    {#if emailSubmitted}
      <p class="text-2xl">🎉</p>
      <p class="mt-3 text-lg font-semibold dark:text-white">{m.plus_success_heading()}</p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {m.plus_success_body({ email: emailValue })}
      </p>
    {:else}
      <p class="mb-5 text-base font-semibold text-indigo-800 dark:text-indigo-200">
        {m.plus_signup_cta()}
      </p>
      <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <div class="w-full sm:w-72">
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            autocomplete="email"
            bind:value={emailValue}
            disabled={submitting}
            class="w-full rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:border-indigo-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
          {#if emailError}
            <p class="mt-1 text-left text-xs text-red-500">{emailError}</p>
          {/if}
        </div>
        <button
          type="button"
          onclick={handleSignup}
          disabled={submitting}
          class="w-full shrink-0 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
        >
          {submitting ? m.plus_saving() : m.plus_notify_button()}
        </button>
      </div>
      <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
        {m.plus_no_spam()}
      </p>
    {/if}
  </div>

  <!-- ── Plus feature highlights ────────────────────────────────────────────────── -->
  <h2 class="mb-6 text-2xl font-bold dark:text-white">{m.plus_features_heading()}</h2>
  <div class="mb-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
    {#each plusFeatures as feat (feat.title)}
      <div
        class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="mb-2 flex items-center gap-2">
          <span class="text-2xl">{feat.icon}</span>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">{feat.title}</h3>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{feat.body}</p>
      </div>
    {/each}
  </div>

  <!-- ── Free vs Plus comparison table ──────────────────────────────────────────── -->
  <h2 class="mb-5 text-2xl font-bold dark:text-white">{m.plus_table_heading()}</h2>
  <div class="mb-14 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th class="px-5 py-3 text-left font-semibold text-gray-500 dark:text-gray-400"
            >{m.plus_table_feature()}</th
          >
          <th class="px-5 py-3 text-center font-semibold text-gray-500 dark:text-gray-400"
            >{m.plus_table_free()}</th
          >
          <th
            class="bg-indigo-50 px-5 py-3 text-center font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            {m.plus_table_plus()}
            <span
              class="ml-1.5 rounded-full bg-indigo-100 px-2 py-0.5 text-xs dark:bg-indigo-800 dark:text-indigo-200"
            >
              {m.plus_table_soon()}
            </span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        {#each tableRows as row (row.feature)}
          <tr class="bg-white dark:bg-gray-900">
            <td class="px-5 py-3 font-medium text-gray-700 dark:text-gray-300">{row.feature}</td>
            <td class="px-5 py-3 text-center">
              {#if row.free.yes}
                <span class="text-green-600 dark:text-green-400">✓</span>
                <span class="ml-1 text-gray-500 dark:text-gray-300">{row.free.value}</span>
              {:else}
                <span class="text-gray-600 dark:text-gray-300">{row.free.value}</span>
              {/if}
            </td>
            <td class="bg-indigo-50/50 px-5 py-3 text-center dark:bg-indigo-900/10">
              {#if row.pro.yes}
                <span class="font-semibold text-indigo-600 dark:text-indigo-400">✓</span>
                <span class="ml-1 text-gray-700 dark:text-gray-300">{row.pro.value}</span>
              {:else}
                <span class="text-gray-300 dark:text-gray-600">{row.pro.value}</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- ── How smart review works ──────────────────────────────────────────────── -->
  <div
    class="mb-14 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/40"
  >
    <h3 class="mb-2 text-base font-bold dark:text-white">{m.plus_how_heading()}</h3>
    <p class="text-sm text-gray-600 dark:text-gray-400">{m.plus_how_body_1()}</p>
    <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">{m.plus_how_body_2()}</p>
  </div>

  <!-- ── Bottom CTA ─────────────────────────────────────────────────────────────── -->
  <div
    class="rounded-2xl border border-indigo-200 bg-indigo-50 p-8 text-center dark:border-indigo-800 dark:bg-indigo-900/20"
  >
    <p class="text-lg font-semibold dark:text-white">{m.plus_cta_heading()}</p>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{m.plus_cta_body()}</p>
    <div class="mt-5 flex flex-wrap justify-center gap-3">
      <a
        href="/"
        class="rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
      >
        {m.plus_cta_browse()}
      </a>
      <a
        href="/norskproven"
        class="rounded-lg border border-indigo-300 px-6 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
      >
        {m.plus_cta_norskproven()}
      </a>
    </div>
  </div>
</div>
