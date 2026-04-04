<script lang="ts">
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

{#if $offlineReady || $needRefresh}
	<div
		class="fixed right-4 bottom-4 z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
		role="alert"
	>
		<p class="mb-3 text-sm text-gray-700 dark:text-gray-200">
			{#if $offlineReady}
				App ready to work offline.
			{:else}
				New version available — click Reload to update.
			{/if}
		</p>
		<div class="flex gap-2">
			{#if $needRefresh}
				<button
					onclick={update}
					class="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
				>
					Reload
				</button>
			{/if}
			<button
				onclick={close}
				class="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Close
			</button>
		</div>
	</div>
{/if}
