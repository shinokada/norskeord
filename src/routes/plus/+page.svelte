<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';

  // Server-provided auth/plan state
  let { data } = $props<{ data: { isLoggedIn: boolean; isPlus: boolean } }>();

  // Checkout state
  let checkoutLoading = $state(false);
  let checkoutError = $state('');

  // Auto-trigger checkout if redirected here after login with ?checkout=1
  // Also treat ?checkout=1 on the page itself (nav button) — if already logged in, go straight to checkout.
  onMount(() => {
    if (page.url.searchParams.get('checkout') === '1' && data.isLoggedIn && !data.isPlus) {
      handleCheckout();
    }
  });

  // Build the login URL carrying checkout intent, preserving any ?ref= for analytics
  const loginHref = $derived.by(() => {
    const next = encodeURIComponent('/plus?checkout=1');
    return `/auth/login?next=${next}`;
  });

  type TableCell = { value: string; yes: boolean; soon?: boolean };
  type TableRow = { feature: string; free: TableCell; pro: TableCell };

  const tableRows = $derived<TableRow[]>([
    {
      feature: m.plus_row_vocab(),
      free: { value: m.plus_row_vocab_free(), yes: true },
      pro: { value: m.plus_row_vocab_plus(), yes: true }
    },
    {
      feature: m.plus_row_b1c2(),
      free: { value: m.plus_row_b1c2_free(), yes: false },
      pro: { value: m.plus_row_b1c2_plus(), yes: true }
    },
    {
      feature: m.plus_row_phrases(),
      free: { value: m.plus_row_phrases_free(), yes: false },
      pro: { value: m.plus_row_phrases_plus(), yes: true }
    },
    {
      feature: m.plus_row_rating(),
      free: { value: m.plus_row_rating_included(), yes: true },
      pro: { value: m.plus_row_rating_included(), yes: true }
    },
    {
      feature: m.plus_row_stats(),
      free: { value: m.plus_row_stats_free(), yes: true },
      pro: { value: m.plus_row_stats_plus(), yes: true }
    },
    {
      feature: m.plus_row_per_category_stats(),
      free: { value: m.plus_row_per_category_stats_free(), yes: false },
      pro: { value: m.plus_row_per_category_stats_plus(), yes: true }
    },
    {
      feature: m.plus_row_due(),
      free: { value: m.plus_row_due_free(), yes: false },
      pro: { value: m.plus_row_due_plus(), yes: true }
    },
    {
      feature: m.plus_row_sync(),
      free: { value: m.plus_row_sync_free(), yes: false },
      pro: { value: m.plus_row_sync_plus(), yes: true }
    },
    {
      feature: m.plus_row_norskproven_practice(),
      free: { value: m.plus_row_norskproven_practice_free(), yes: false },
      pro: { value: m.plus_row_norskproven_practice_plus(), yes: true }
    },
    {
      feature: m.plus_row_download_progress(),
      free: { value: m.plus_row_download_progress_free(), yes: false },
      pro: { value: m.plus_row_download_progress_plus(), yes: true }
    },
    {
      feature: m.plus_row_quiz(),
      free: { value: m.plus_row_quiz_free(), yes: false },
      pro: { value: m.plus_row_quiz_plus(), yes: true }
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
      icon: '📊',
      title: m.plus_feature_4_title(),
      body: m.plus_feature_4_body()
    },
    {
      icon: '📝',
      title: m.plus_feature_norskproven_title(),
      body: m.plus_feature_norskproven_body()
    },
    {
      icon: '❓',
      title: m.plus_feature_5_title(),
      body: m.plus_feature_5_body()
    }
  ]);

  async function handleCheckout() {
    checkoutError = '';
    checkoutLoading = true;
    try {
      const res = await fetch('/api/lemon/checkout', { method: 'POST' });
      const result = await res.json();

      if (!res.ok) {
        if (result.error === 'login_required') {
          window.location.href = '/auth/login?next=/plus';
          return;
        }
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
  </div>

  <!-- ── Checkout CTA ───────────────────────────────────────────────────────────── -->
  <div
    class="mb-14 rounded-2xl border border-indigo-200 bg-indigo-50 p-8 text-center dark:border-indigo-800 dark:bg-indigo-900/20"
  >
    {#if data.isPlus}
      <!-- Already a Plus member — direct to My Profile for subscription management -->
      <p class="text-lg font-semibold dark:text-white">✓ You are a Plus member</p>
      <a
        href="/my-profile"
        class="mt-4 inline-block rounded-lg border border-indigo-300 px-5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
      >
        {m.plus_manage_subscription()}
      </a>
    {:else}
      <p class="mb-2 text-lg font-semibold text-indigo-800 dark:text-indigo-200">
        {m.plus_checkout_cta()}
      </p>
      <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
        Cancel any time. All progress carries over automatically.
      </p>

      {#if data.isLoggedIn}
        <button
          type="button"
          onclick={handleCheckout}
          disabled={checkoutLoading}
          class="rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {checkoutLoading ? m.plus_activating() : m.plus_checkout_cta()}
        </button>
      {:else}
        <a
          href={loginHref}
          class="inline-block rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700"
        >
          {m.plus_sign_in_to_upgrade()}
        </a>
      {/if}

      {#if checkoutError}
        <p class="mt-3 text-sm text-red-500">{checkoutError}</p>
      {/if}
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
  <!-- ── What’s unlocked at each level ────────────────────────────────────────── -->
  <h2 class="mb-5 text-2xl font-bold dark:text-white">{m.plus_unlocked_heading()}</h2>
  <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {#each [{ label: m.plus_unlocked_a1_label, teaser: m.plus_unlocked_a1_teaser, free: true, color: 'green' }, { label: m.plus_unlocked_a2_label, teaser: m.plus_unlocked_a2_teaser, free: true, color: 'teal' }, { label: m.plus_unlocked_b1_label, teaser: m.plus_unlocked_b1_teaser, free: false, color: 'blue' }, { label: m.plus_unlocked_b2_label, teaser: m.plus_unlocked_b2_teaser, free: false, color: 'indigo' }, { label: m.plus_unlocked_c1_label, teaser: m.plus_unlocked_c1_teaser, free: false, color: 'purple' }, { label: m.plus_unlocked_c2_label, teaser: m.plus_unlocked_c2_teaser, free: false, color: 'pink' }] as row (row.color)}
      <div
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{row.label()}</span>
          {#if row.free}
            <span
              class="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
              >Free</span
            >
          {:else}
            <span
              class="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              >❖ Plus</span
            >
          {/if}
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">{row.teaser()}</p>
      </div>
    {/each}
  </div>
  <p class="mb-14 text-sm text-gray-500 dark:text-gray-400">
    {m.plus_unlocked_free_note()}
    <a
      href="/"
      class="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
      >{m.plus_unlocked_cta()}</a
    >
  </p>

  <h2 class="mb-5 text-2xl font-bold dark:text-white">{m.plus_table_heading()}</h2>
  <div class="mb-14 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th class="px-5 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">
            {m.plus_table_feature()}
          </th>
          <th class="px-5 py-3 text-center font-semibold text-gray-500 dark:text-gray-400">
            {m.plus_table_free()}
          </th>
          <th
            class="bg-indigo-50 px-5 py-3 text-center font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            {m.plus_table_plus()}
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
              {:else if row.pro.soon}
                <span
                  class="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  >{row.pro.value}</span
                >
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
