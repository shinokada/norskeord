<script lang="ts">
  import { toast } from '$lib/stores/toast.svelte';
</script>

{#if toast.state.visible}
  <div
    role="status"
    aria-live="polite"
    class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200"
  >
    <div
      class="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg
        {toast.state.variant === 'error'
        ? 'bg-red-600 text-white'
        : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'}"
    >
      {#if toast.state.variant === 'error'}
        <span aria-hidden="true">✕</span>
      {/if}
      {toast.state.message}
    </div>
  </div>
{/if}
