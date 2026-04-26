<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';

  let email = $state('');
  let error = $state(
    page.url.searchParams.get('error') === 'auth_callback_failed' ? m.login_error_expired() : ''
  );
  let submitted = $state(false);
  let submitting = $state(false);

  async function handleLogin() {
    error = '';

    if (!email.trim()) {
      error = m.login_error_empty();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error = m.login_error_invalid();
      return;
    }

    submitting = true;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // After clicking the magic link, Supabase redirects here to exchange the code.
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    submitting = false;

    if (authError) {
      error = authError.message;
      return;
    }

    submitted = true;
  }
</script>

<div class="mx-auto max-w-sm px-4 py-16">
  <div class="mb-8 text-center">
    <h1 class="text-2xl font-bold dark:text-white">{m.login_heading()}</h1>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {m.login_subheading()}
    </p>
  </div>

  {#if submitted}
    <div
      class="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20"
    >
      <p class="text-2xl">📬</p>
      <p class="mt-3 font-semibold dark:text-white">{m.login_success_heading()}</p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {m.login_success_body({ email })}
      </p>
    </div>
  {:else}
    <div
      class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
    >
      <label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.login_email_label()}
      </label>
      <input
        id="email"
        type="email"
        placeholder="your@email.com"
        autocomplete="email"
        bind:value={email}
        disabled={submitting}
        onkeydown={(e) => e.key === 'Enter' && handleLogin()}
        class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
      />
      {#if error}
        <p class="mt-1.5 text-xs text-red-500">{error}</p>
      {/if}
      <button
        type="button"
        onclick={handleLogin}
        disabled={submitting}
        class="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? m.login_sending() : m.login_submit()}
      </button>
    </div>

    <p class="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
      {m.login_no_password_note()}
    </p>
  {/if}
</div>
