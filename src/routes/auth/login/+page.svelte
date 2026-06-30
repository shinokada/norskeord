<script lang="ts">
  import { page } from '$app/state';
  import { applyAction, deserialize } from '$app/forms';
  import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
  import * as m from '$lib/paraglide/messages.js';
  import type { ActionData, PageData } from './$types';

  let { form, data }: { form: ActionData; data: PageData } = $props();

  // --- PWA background-resume persistence ---
  // On Android PWA, switching to Gmail to copy the OTP code causes the app to
  // be backgrounded and the page reloaded, resetting `form` to null. The server
  // sets a cookie with the pending email so SSR renders the verify step
  // immediately on reload — no client-side JS needed for the initial render.

  function clearPending() {
    try {
      localStorage.removeItem('login_pending'); // legacy cleanup
    } catch {
      /* ignore */
    }
  }

  // pendingEmail comes from the server load (cookie-backed) so SSR already
  // knows the correct step — no flicker on page reload.
  let pendingEmail = $derived(data.pendingEmail ?? '');

  let email = $derived((form && 'email' in form ? form.email : null) ?? pendingEmail ?? '');
  let next = $derived(
    (form && 'next' in form ? (form.next as string) : null) ??
      page.url.searchParams.get('next') ??
      '/'
  );

  let step = $derived(
    (form && 'step' in form && form.step === 'verify') ||
      (form !== null && 'success' in form && form.success === true) ||
      pendingEmail !== ''
      ? 'verify'
      : 'email'
  );

  function errorMessage(key: string | undefined): string {
    if (!key) return '';
    switch (key) {
      case 'login_error_empty':
        return m.login_error_empty();
      case 'login_error_invalid':
        return m.login_error_invalid();
      case 'login_error_bot_check':
        return m.login_error_bot_check();
      case 'login_error_otp_invalid':
        return m.login_error_otp_invalid();
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

  let submitting = $state(false);
  let emailValue = $state('');
  let tokenValue = $state('');
  let resendStatus = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Turnstile token — set by the widget callback, read on email form submit.
  let turnstileToken = $state('');

  interface TurnstileWindow {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
  }

  function turnstileWindow(): TurnstileWindow {
    return window as TurnstileWindow;
  }

  let widgetId = $state<string | undefined>(undefined);
  let turnstileContainer: HTMLDivElement | null = $state(null);

  function onTurnstileSuccess(token: string) {
    turnstileToken = token;
  }
  function onTurnstileExpired() {
    turnstileToken = '';
  }
  function onTurnstileError() {
    turnstileToken = '';
  }

  if (typeof window !== 'undefined') {
    turnstileWindow().onTurnstileSuccess = onTurnstileSuccess;
    turnstileWindow().onTurnstileExpired = onTurnstileExpired;
    turnstileWindow().onTurnstileError = onTurnstileError;
  }

  function resetTurnstile() {
    const ts = turnstileWindow().turnstile;
    if (ts && widgetId !== undefined) ts.reset(widgetId);
    turnstileToken = '';
  }

  function renderTurnstile() {
    if (!PUBLIC_TURNSTILE_SITE_KEY || !turnstileContainer) return;
    const ts = turnstileWindow().turnstile;
    if (!ts || widgetId !== undefined) return;
    widgetId = ts.render(turnstileContainer, {
      sitekey: PUBLIC_TURNSTILE_SITE_KEY,
      theme: 'auto',
      callback: onTurnstileSuccess,
      'expired-callback': onTurnstileExpired,
      'error-callback': onTurnstileError
    });
  }

  // Render Turnstile as soon as the container div enters the DOM (after
  // mounted=true reveals the email form). $effect re-runs whenever
  // turnstileContainer changes from null to a real element.
  $effect(() => {
    if (!turnstileContainer) return;
    if (turnstileWindow().turnstile) {
      renderTurnstile();
      return;
    }
    // Turnstile script may still be loading — poll until ready.
    const interval = setInterval(() => {
      if (turnstileWindow().turnstile) {
        renderTurnstile();
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;
    if (PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) return;

    submitting = true;
    try {
      const formData = new FormData();
      formData.set('email', emailValue);
      formData.set('next', next);
      formData.set('cf-turnstile-response', turnstileToken);

      const response = await fetch('?/login', { method: 'POST', body: formData });
      const result = deserialize(await response.text());
      submitting = false;

      if (
        result.type === 'failure' &&
        (result.data as { error?: string })?.error === 'login_error_bot_check'
      ) {
        resetTurnstile();
      }
      applyAction(result);
    } catch (err) {
      console.error('Login fetch error:', err);
      submitting = false;
    }
  }

  async function handleResend() {
    if (resendStatus !== 'idle') return;
    resendStatus = 'sending';
    try {
      const formData = new FormData();
      formData.set('email', email);
      formData.set('next', next);
      formData.set('resend', '1');
      formData.set('cf-turnstile-response', turnstileToken);
      const response = await fetch('?/login', { method: 'POST', body: formData });
      const result = deserialize(await response.text());
      resendStatus = result.type === 'success' ? 'sent' : 'error';
    } catch (err) {
      console.error('Resend fetch error:', err);
      resendStatus = 'error';
    } finally {
      setTimeout(() => (resendStatus = 'idle'), 4000);
    }
  }
</script>

<svelte:head>
  <script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    async
    defer
  ></script>
</svelte:head>

<div class="mx-auto max-w-sm px-4 py-16">
  <div class="mb-8 text-center">
    <h1>{m.login_heading()}</h1>
    <p class="mt-2 text-base text-gray-600 dark:text-gray-300">
      {m.login_subheading()}
    </p>
    <p class="mt-3 text-sm font-medium text-green-600 dark:text-green-400">
      {m.login_free_no_cc()}
    </p>
  </div>

  {#if step === 'verify'}
    <div
      class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-indigo-950/60"
    >
      <p class="text-center text-2xl">📬</p>
      <p class="mt-3 text-center font-semibold dark:text-white">{m.login_success_heading()}</p>
      <p class="mt-1 text-center text-base text-gray-600 dark:text-gray-300">
        {m.login_success_body({ email })}
      </p>

      <form method="POST" action="?/verify" novalidate class="mt-6">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <label
          for="token"
          class="mb-1.5 block text-base font-medium text-gray-700 dark:text-gray-300"
        >
          {m.login_otp_label()}
        </label>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          id="token"
          name="token"
          type="text"
          inputmode="numeric"
          maxlength="6"
          autocomplete="one-time-code"
          placeholder={m.login_otp_placeholder()}
          autofocus
          bind:value={tokenValue}
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-lg tracking-[0.3em] text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
        />
        {#if displayError}
          <p class="mt-1.5 text-sm text-red-500">{displayError}</p>
        {/if}

        <button
          type="submit"
          disabled={!/^\d{6}$/.test(tokenValue)}
          class="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {m.login_otp_submit()}
        </button>
      </form>

      <button
        type="button"
        onclick={handleResend}
        disabled={resendStatus !== 'idle'}
        class="mt-4 w-full text-center text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
      >
        {#if resendStatus === 'sending'}
          {m.login_resending()}
        {:else if resendStatus === 'sent'}
          {m.login_resend_sent()}
        {:else if resendStatus === 'error'}
          {m.login_resend_error()}
        {:else}
          {m.login_resend()}
        {/if}
      </button>

      <button
        type="button"
        onclick={async () => {
          clearPending();
          await fetch('?/clearPending', { method: 'POST' });
          location.reload();
        }}
        class="mt-2 w-full text-center text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        {m.login_back()}
      </button>
    </div>
  {:else}
    <form onsubmit={handleSubmit} novalidate>
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-indigo-950/60"
      >
        <label
          for="email"
          class="mb-1.5 block text-base font-medium text-gray-700 dark:text-gray-300"
        >
          {m.login_email_label()}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder={m.login_email_placeholder()}
          autocomplete="email"
          bind:value={emailValue}
          disabled={submitting}
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
        />
        {#if displayError}
          <p class="mt-1.5 text-sm text-red-500">{displayError}</p>
        {/if}

        <!--
          Turnstile widget wrapper.
          The iframe Cloudflare injects is always exactly 300×65 px and cannot be
          resized. What we CAN control is the outer wrapper:
            • flex + justify-center  → centres the 300 px widget in the card
            • overflow-hidden        → clips the red "For testing only" dev banner
                                       (remove this once you switch to a real key)
            • rounded-md             → softens the widget corners slightly
        -->
        <div class="mt-4 flex justify-center rounded-md">
          <div bind:this={turnstileContainer} class="cf-turnstile"></div>
        </div>

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
    </form>
  {/if}
</div>
