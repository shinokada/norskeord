<script lang="ts">
  import { onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props<{ data: { destination: string } }>();

  // The Lemon Squeezy webhook is async, so the plan can still read "free" for a
  // few seconds after payment. Wait until /api/plan says Plus before enabling
  // Continue; give up after ~30 s and enable it anyway (a locked page then shows
  // the teaser, which has a Log in link). Phase 4 of
  // ai-docs/implementation/locked-teaser-social-login.md.
  const POLL_INTERVAL_MS = 1500;
  const MAX_ATTEMPTS = 20;

  let ready = $state(false);

  onMount(() => {
    let attempts = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      attempts += 1;
      try {
        const res = await fetch('/api/plan', { cache: 'no-store' });
        if (res.ok && (await res.json()).plan === 'plus') {
          if (!stopped) ready = true;
          return;
        }
      } catch {
        /* network blip: try again */
      }
      if (stopped) return;
      if (attempts >= MAX_ATTEMPTS) {
        ready = true;
        return;
      }
      timer = setTimeout(check, POLL_INTERVAL_MS);
    }

    check();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  });
</script>

<div class="mx-auto max-w-lg px-4 py-20 text-center">
  <div class="text-6xl">🎉</div>

  <h1 class="mt-6 text-3xl font-bold dark:text-white">
    {m.plus_success_heading()}
  </h1>

  <p class="mx-auto mt-4 max-w-sm text-gray-600 dark:text-gray-300">
    {m.plus_success_body()}
  </p>

  {#if ready}
    <a
      href={data.destination}
      class="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700"
    >
      {m.plus_success_cta()}
    </a>
  {:else}
    <span
      role="status"
      aria-live="polite"
      class="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white opacity-60 shadow"
    >
      <span
        class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
        aria-hidden="true"
      ></span>
      {m.plus_success_activating()}
    </span>
  {/if}
</div>
