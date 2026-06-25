<script lang="ts">
  import { onMount } from 'svelte';
  import { registerSW } from 'virtual:pwa-register';

  let showBanner = $state(false);
  let updateSW: (() => Promise<void>) | undefined;

  onMount(() => {
    updateSW = registerSW({
      onNeedRefresh() {
        showBanner = true;
      },
      onOfflineReady() {
        // App is ready to work offline — no-op for now
      }
    });
  });

  function reload() {
    updateSW?.();
  }

  function dismiss() {
    showBanner = false;
  }
</script>

{#if showBanner}
  <div
    role="alert"
    class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-lg dark:border-blue-800 dark:bg-blue-950"
  >
    <span class="text-sm text-blue-900 dark:text-blue-100">
      A new version is available.
    </span>
    <button
      onclick={reload}
      class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
    >
      Update now
    </button>
    <button
      onclick={dismiss}
      aria-label="Dismiss"
      class="ml-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
    >
      ✕
    </button>
  </div>
{/if}
