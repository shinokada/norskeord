<script lang="ts">
  import { onMount } from 'svelte';

  let show = $state(false);
  let openUrl = $state('');

  onMount(() => {
    const ua = navigator.userAgent;
    const isInApp =
      /FBAN|FBAV|Instagram/.test(ua) || // Facebook / Instagram
      /\bGSA\b/.test(ua) || // Gmail on iOS (Google Search App)
      (ua.includes('wv') && ua.includes('Android')); // Android WebView (Gmail, etc.)

    if (isInApp) {
      show = true;
      // Android intent deep-link to Chrome; falls back gracefully on iOS
      openUrl = `intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
    }
  });

  function dismiss() {
    show = false;
  }
</script>

{#if show}
  <div
    class="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-4 py-3 text-sm shadow-lg dark:border-amber-800 dark:bg-amber-900/80"
    role="alert"
  >
    <p class="text-amber-900 dark:text-amber-100">
      🌐 For the best experience, open in <strong>Chrome</strong>.
    </p>
    <div class="flex shrink-0 items-center gap-2">
      <a
        href={openUrl}
        class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
      >
        Open in Chrome
      </a>
      <button
        type="button"
        onclick={dismiss}
        class="text-amber-700 hover:text-amber-900 dark:text-amber-300"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  </div>
{/if}
