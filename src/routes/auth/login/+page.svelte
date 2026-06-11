<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
  import * as m from '$lib/paraglide/messages.js';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  // Pre-populate the email field if it was returned after a failed submission.
  // Use $derived so it stays in sync when the server action returns new form data.
  let email = $derived((form && 'email' in form ? form.email : '') ?? '');

  // Map server-side error keys to translated messages.
  function errorMessage(key: string | undefined): string {
    if (!key) return '';
    switch (key) {
      case 'login_error_empty':
        return m.login_error_empty();
      case 'login_error_invalid':
        return m.login_error_invalid();
      case 'login_error_bot_check':
        return m.login_error_bot_check();
      default:
        return m.login_error_generic();
    }
  }

  let urlError = $derived(
    page.url.searchParams.get('error') === 'auth_callback_failed' ? m.login_error_expired() : ''
  );

  let displayError = $derived(
    urlError || (form && 'error' in form ? errorMessage(form.error as string) : '')
  );

  let submitted = $derived(form !== null && 'success' in form && form.success === true);
  let submittedEmail = $derived(
    submitted && form && 'email' in form ? (form.email as string) : email
  );

  let submitting = $state(false);

  // Invisible Turnstile: we need to call .execute() after user clicks submit,
  // then wait for the token before the form actually submits.
  // We use SvelteKit's `enhance` cancel to defer submission until token is ready.
  let resolveSubmit: (() => void) | null = null;

  // Called by Turnstile when the token is ready (invisible mode).
  function onTurnstileSuccess() {
    resolveSubmit?.();
    resolveSubmit = null;
  }

  // Expose callback globally for Turnstile's data-callback attribute.
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).onTurnstileSuccess = onTurnstileSuccess;
  }
</script>

<!--
  Load the Turnstile script once.
  The widget renders itself into the div with data-sitekey below.
-->
<svelte:head>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</svelte:head>

<div class="mx-auto max-w-sm px-4 py-16">
  <div class="mb-8 text-center">
    <h1 class="text-2xl font-bold dark:text-white">{m.login_heading()}</h1>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {m.login_subheading()}
    </p>
    <p class="mt-3 text-xs font-medium text-green-600 dark:text-green-400">
      ✓ Free &nbsp;·&nbsp; No credit card required
    </p>
  </div>

  {#if submitted}
    <div
      class="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20"
    >
      <p class="text-2xl">📬</p>
      <p class="mt-3 font-semibold dark:text-white">{m.login_success_heading()}</p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {m.login_success_body({ email: submittedEmail })}
      </p>
    </div>
  {:else}
    <form
      method="POST"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          submitting = false;
          await update();
        };
      }}
    >
      <!-- Carry the ?next= redirect through the form submission. -->
      <input type="hidden" name="next" value={page.url.searchParams.get('next') ?? '/'} />

      <div
        class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-indigo-950/60"
      >
        <label
          for="email"
          class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {m.login_email_label()}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          autocomplete="email"
          bind:value={email}
          disabled={submitting}
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
        />
        {#if displayError}
          <p class="mt-1.5 text-xs text-red-500">{displayError}</p>
        {/if}

        <!--
          Turnstile widget — renders invisibly (or as a compact badge).
          The widget injects a hidden input named `cf-turnstile-response` which
          is submitted automatically with the form.
        -->
        <div
          class="cf-turnstile mt-4"
          data-sitekey={PUBLIC_TURNSTILE_SITE_KEY}
          data-theme="auto"
          data-size="invisible"
          data-callback="onTurnstileSuccess"
        ></div>

        <button
          type="submit"
          disabled={submitting}
          class="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {#if submitting}
            <span class="inline-flex items-center gap-2">
              <svg
                class="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {m.login_sending()}
            </span>
          {:else}
            {m.login_submit()}
          {/if}
        </button>
      </div>

      <p class="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
        {m.login_no_password_note()}
      </p>
    </form>
  {/if}
</div>
