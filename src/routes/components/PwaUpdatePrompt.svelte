<script lang="ts">
  import { Toast } from 'flowbite-svelte';
  import { CheckCircleSolid, RefreshOutline } from 'flowbite-svelte-icons';
  import { useRegisterSW } from 'virtual:pwa-register/svelte';

  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      if (import.meta.env.DEV) {
        console.log('SW registered:', r);
      }
    },
    onRegisterError(error: unknown) {
      console.error('SW registration error:', error);
    }
  });

  function close() {
    offlineReady.set(false);
    needRefresh.set(false);
  }

  async function update() {
    await updateServiceWorker(true);
  }
</script>

<!-- Offline ready: auto-dismissable green toast -->
{#if $offlineReady}
  <div class="fixed right-4 bottom-4 z-50">
    <Toast color="green" dismissable onclose={close}>
      {#snippet icon()}
        <CheckCircleSolid class="h-5 w-5" />
      {/snippet}
      <span class="text-sm font-medium">App ready to work offline.</span>
    </Toast>
  </div>
{/if}

<!-- Update available: persistent blue toast with Reload button -->
{#if $needRefresh}
  <div class="fixed right-4 bottom-4 z-50">
    <Toast color="blue" dismissable onclose={close}>
      {#snippet icon()}
        <RefreshOutline class="h-5 w-5" />
      {/snippet}
      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium">New version available.</span>
        <div class="flex gap-2">
          <button
            onclick={update}
            class="rounded bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Reload
          </button>
          <button
            onclick={close}
            class="rounded border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Later
          </button>
        </div>
      </div>
    </Toast>
  </div>
{/if}
