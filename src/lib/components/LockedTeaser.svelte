<script lang="ts">
  /**
   * Locked category teaser (ai-docs/implementation/locked-teaser-social-login.md, Phase 3).
   *
   * Shown instead of the old redirect to /plus. It receives only the first
   * word and the card count (see $lib/teaser). The blurred area below the card
   * is static fake markup, never real data: the blur is cosmetic.
   */
  import { page } from '$app/state';
  import { Flashcard } from '$lib';
  import { trackEvent, LOCKED_LOGIN_CLICK_EVENT } from '$lib/analytics';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    level: string;
    category: string;
    categoryName: string;
    sectionLabel: string;
    /** Which deck is locked; only used for the `ref` on the Get Plus link. */
    section?: 'vocab' | 'uttrykk';
    front: string;
    totalCount: number;
  }

  let {
    level,
    category,
    categoryName,
    sectionLabel,
    section = 'vocab',
    front,
    totalCount
  }: Props = $props();

  const email = $derived((page.data.user as { email?: string } | null)?.email ?? '');
  const next = $derived(encodeURIComponent(page.url.pathname + page.url.search));
  const plusHref = $derived(`/plus?ref=teaser-${section}&next=${next}`);
  const loginHref = $derived(`/auth/login?next=${next}`);

  let leaving = $state(false);

  // "Not you?": sign out, then go to login and come back to this page.
  async function notYou() {
    if (leaving) return;
    leaving = true;
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch {
      /* go to the login page anyway */
    }
    window.location.assign(loginHref);
  }
</script>

<div class="flex w-full flex-col items-center">
  <div class="mt-10 mb-0.5 flex w-full items-center justify-center px-2">
    <h1 class="mb-0 text-center leading-tight">{level} · {sectionLabel}</h1>
  </div>
  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{categoryName}</p>

  <!-- The first card's front, same size and colours as the real flashcard. Not interactive. -->
  <div class="mt-4 w-full md:w-1/2">
    <div
      class="h-96 w-full text-center select-none"
      role="img"
      aria-label={m.teaser_preview_label()}
    >
      <Flashcard {front} back="" showCardBack={false} />
    </div>
  </div>

  <div class="relative mt-4 min-h-72 w-full max-w-lg">
    <!-- Static placeholder markup in the shape of the rating buttons and example box. -->
    <div class="pointer-events-none blur-sm select-none" aria-hidden="true" inert>
      <div class="grid grid-cols-4 gap-2">
        <div class="h-14 rounded-lg bg-red-600/70"></div>
        <div class="h-14 rounded-lg bg-orange-500/70"></div>
        <div class="h-14 rounded-lg bg-green-600/70"></div>
        <div class="h-14 rounded-lg bg-blue-600/70"></div>
      </div>
      <div
        class="mt-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-indigo-950/60"
      >
        <div class="h-4 w-11/12 rounded bg-gray-300 dark:bg-gray-600"></div>
        <div class="mt-3 h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
        <div class="mt-3 h-4 w-5/6 rounded bg-gray-300 dark:bg-gray-600"></div>
      </div>
    </div>

    <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
      <p class="text-lg font-semibold text-gray-900 dark:text-white">
        {m.teaser_heading({ category: categoryName })}
      </p>
      <p class="text-sm text-gray-700 dark:text-gray-200">
        {m.teaser_benefit({ count: totalCount })}
      </p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <a
          href={plusHref}
          class="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 focus:outline-none"
        >
          {m.teaser_get_plus()}
        </a>
        {#if !email}
          <a
            href={loginHref}
            onclick={() => trackEvent(LOCKED_LOGIN_CLICK_EVENT, { level, category })}
            class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            {m.teaser_login()}
          </a>
        {/if}
      </div>
    </div>
  </div>

  {#if email}
    <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">
      {m.teaser_signed_in_as({ email })}
      <button
        type="button"
        onclick={notYou}
        disabled={leaving}
        class="font-medium text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
      >
        {m.teaser_not_you()}
      </button>
    </p>
  {/if}
</div>
