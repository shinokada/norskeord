<script lang="ts">
  import { onMount } from 'svelte';
  import { applyAction, deserialize } from '$app/forms';
  import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── State ──────────────────────────────────────────────────────────────────

  // For guests: editable email field. For logged-in users data.userEmail is used directly.
  let emailValue = $state('');
  let subjectValue = $state('');
  let messageValue = $state('');
  let submitting = $state(false);
  let sent = $state(false);
  let sentEmail = $state('');

  // Reflect server-side errors back into local state
  let errorKey = $derived(form && 'error' in form ? (form.error as string) : null);

  function errorMessage(key: string | null): string {
    if (!key) return '';
    switch (key) {
      case 'contact_error_email':
        return m.contact_error_email();
      case 'contact_error_subject':
        return m.contact_error_subject();
      case 'contact_error_message':
        return m.contact_error_message();
      case 'contact_error_bot_check':
        return m.contact_error_bot_check();
      default:
        return m.contact_error_generic();
    }
  }

  // ── Turnstile ──────────────────────────────────────────────────────────────

  let turnstileToken = $state('');
  let widgetId = $state<string | undefined>(undefined);
  let turnstileContainer: HTMLDivElement | null = $state(null);

  interface TurnstileWindow {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
    onTurnstileContactSuccess?: (token: string) => void;
    onTurnstileContactExpired?: () => void;
    onTurnstileContactError?: () => void;
  }

  function tw(): TurnstileWindow {
    return window as TurnstileWindow;
  }

  if (typeof window !== 'undefined') {
    tw().onTurnstileContactSuccess = (token: string) => {
      turnstileToken = token;
    };
    tw().onTurnstileContactExpired = () => {
      turnstileToken = '';
    };
    tw().onTurnstileContactError = () => {
      turnstileToken = '';
    };
  }

  function renderTurnstile() {
    if (!PUBLIC_TURNSTILE_SITE_KEY || !turnstileContainer) return;
    const ts = tw().turnstile;
    if (!ts || widgetId !== undefined) return;
    widgetId = ts.render(turnstileContainer, {
      sitekey: PUBLIC_TURNSTILE_SITE_KEY,
      theme: 'auto',
      callback: (token: string) => {
        turnstileToken = token;
      },
      'expired-callback': () => {
        turnstileToken = '';
      },
      'error-callback': () => {
        turnstileToken = '';
      }
    });
  }

  function resetTurnstile() {
    const ts = tw().turnstile;
    if (ts && widgetId !== undefined) ts.reset(widgetId);
    turnstileToken = '';
  }

  onMount(() => {
    if (tw().turnstile) {
      renderTurnstile();
      return;
    }
    const interval = setInterval(() => {
      if (tw().turnstile) {
        renderTurnstile();
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  });

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;
    if (PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) return;

    submitting = true;
    try {
      const fd = new FormData();
      if (!data.userEmail) fd.set('email', emailValue);
      fd.set('subject', subjectValue);
      fd.set('message', messageValue);
      fd.set('website', ''); // honeypot
      fd.set('app_version', __VERSION__);
      fd.set('cf-turnstile-response', turnstileToken);

      const response = await fetch('?/send', { method: 'POST', body: fd });
      const result = deserialize(await response.text());

      submitting = false;

      if (result.type === 'success' && result.data && 'success' in result.data) {
        sent = true;
        sentEmail = (result.data as { email?: string }).email ?? data.userEmail ?? emailValue;
        return;
      }

      if (
        result.type === 'failure' &&
        (result.data as { error?: string })?.error === 'contact_error_bot_check'
      ) {
        resetTurnstile();
      }

      applyAction(result);
    } catch (err) {
      console.error('Contact submit error:', err);
      submitting = false;
    }
  }

  // ── Character count ────────────────────────────────────────────────────────

  const MAX_CHARS = 2000;
  let charsLeft = $derived(MAX_CHARS - messageValue.length);

  // Subject options
  const subjectOptions = [
    'Bug report',
    'Translation / content error',
    'Feature request',
    'Billing question',
    'Account issue',
    'Other'
  ];
</script>

<svelte:head>
  <title>{m.contact_page_title()} — Norskeord</title>
  <script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    async
    defer
  ></script>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-10 text-left">
  {#if sent}
    <!-- ── Success state ─────────────────────────────────────────────────── -->
    <div
      class="rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20"
    >
      <p class="text-4xl">✅</p>
      <h1 class="mt-4 text-2xl font-bold dark:text-white">{m.contact_sent_heading()}</h1>
      <p class="mt-2 text-base text-gray-600 dark:text-gray-300">
        {data.isPlus
          ? m.contact_sent_body_plus({ email: sentEmail })
          : m.contact_sent_body({ email: sentEmail })}
      </p>
      <a
        href="/my-profile"
        class="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ← Back to Profile
      </a>
    </div>
  {:else}
    <!-- ── Form ──────────────────────────────────────────────────────────── -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold dark:text-white">{m.contact_heading()}</h1>
      <p class="mt-2 text-base text-gray-600 dark:text-gray-300">
        {data.isPlus ? m.contact_subheading_plus() : m.contact_subheading()}
      </p>
    </div>

    <form onsubmit={handleSubmit} novalidate>
      <div
        class="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-indigo-950/60"
      >
        <!-- Email (guests only; logged-in users see a read-only hint) -->
        {#if data.userEmail}
          <div>
            <p class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {m.contact_email_label()}
            </p>
            <p
              class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              {data.userEmail}
              <span class="ml-2 text-xs text-gray-400 dark:text-gray-500"
                >— {m.contact_email_hint_loggedin()}</span
              >
            </p>
          </div>
        {:else}
          <div>
            <label
              for="email"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {m.contact_email_label()}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder={m.contact_email_placeholder()}
              bind:value={emailValue}
              disabled={submitting}
              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
            />
            {#if errorKey === 'contact_error_email'}
              <p class="mt-1 text-sm text-red-500">{m.contact_error_email()}</p>
            {/if}
          </div>
        {/if}

        <!-- Subject -->
        <div>
          <label
            for="subject"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {m.contact_subject_label()}
          </label>
          <select
            id="subject"
            name="subject"
            bind:value={subjectValue}
            disabled={submitting}
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="" disabled>Select a topic…</option>
            {#each subjectOptions as opt (opt)}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
          {#if errorKey === 'contact_error_subject'}
            <p class="mt-1 text-sm text-red-500">{m.contact_error_subject()}</p>
          {/if}
        </div>

        <!-- Message -->
        <div>
          <div class="mb-1 flex items-center justify-between">
            <label for="message" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {m.contact_message_label()}
            </label>
            <span class="text-xs text-gray-400 dark:text-gray-500">{charsLeft} left</span>
          </div>
          <textarea
            id="message"
            name="message"
            rows="6"
            maxlength={MAX_CHARS}
            placeholder={m.contact_message_placeholder()}
            bind:value={messageValue}
            disabled={submitting}
            class="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          ></textarea>
          {#if errorKey === 'contact_error_message'}
            <p class="mt-1 text-sm text-red-500">{m.contact_error_message()}</p>
          {/if}
        </div>

        <!-- Turnstile -->
        <div class="flex justify-center">
          <div bind:this={turnstileContainer} class="cf-turnstile"></div>
        </div>

        <!-- Honeypot (hidden) -->
        <input
          type="text"
          name="website"
          value=""
          class="hidden"
          tabindex="-1"
          autocomplete="off"
        />

        <!-- Generic error -->
        {#if errorKey && !['contact_error_email', 'contact_error_subject', 'contact_error_message'].includes(errorKey)}
          <p class="text-sm text-red-500">{errorMessage(errorKey)}</p>
        {/if}

        <!-- Submit -->
        <button
          type="submit"
          disabled={submitting}
          class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {#if submitting}
            <span class="inline-flex items-center justify-center gap-2">
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
              {m.contact_sending()}
            </span>
          {:else}
            {m.contact_submit()}
          {/if}
        </button>

        <!-- Privacy note -->
        <p class="text-xs text-gray-400 dark:text-gray-500">{m.contact_privacy_note()}</p>
      </div>
    </form>
  {/if}
</div>
