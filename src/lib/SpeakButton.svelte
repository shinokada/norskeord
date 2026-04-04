<script lang="ts">
	import Modal from 'flowbite-svelte/Modal.svelte';
	import ButtonToggleGroup from 'flowbite-svelte/ButtonToggleGroup.svelte';
	import ButtonToggle from 'flowbite-svelte/ButtonToggle.svelte';

	interface Props {
		word: string;
	}

	let { word }: Props = $props();

	const speedOptions = [
		{ value: '0.5', label: '0.5x' },
		{ value: '0.75', label: '0.75x' },
		{ value: '1', label: '1x' },
		{ value: '1.25', label: '1.25x' },
		{ value: '1.5', label: '1.5x' }
	];

	const toneOptions = [
		{ value: '0.7', label: 'Low' },
		{ value: '1', label: 'Default' },
		{ value: '1.3', label: 'High' }
	];

	let speed = $state('1');
	let pitch = $state('1');
	let settingsOpen = $state(false);
	let showGear = $state(false);

	export function speak() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(word);
			utterance.lang = 'nb-NO';
			utterance.rate = parseFloat(speed);
			utterance.pitch = parseFloat(pitch);
			window.speechSynthesis.speak(utterance);
			showGear = true;
		}
	}
</script>

<div class="inline-flex items-center gap-1">
	<!-- Speaker button -->
	<button
		type="button"
		onclick={speak}
		class="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
		title="Pronounce Norwegian word"
		aria-label="Pronounce {word}"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			class="h-4 w-4"
		>
			<path
				d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z"
			/>
			<path
				d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.061Z"
			/>
		</svg>
		Pronounce
	</button>

	<!-- Gear icon — appears after first use -->
	{#if showGear}
		<button
			type="button"
			onclick={() => (settingsOpen = true)}
			class="rounded-lg p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
			title="Voice settings"
			aria-label="Voice settings"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="h-5 w-5"
			>
				<path
					fill-rule="evenodd"
					d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
	{/if}
</div>

<!-- Voice Settings Modal -->
<Modal bind:open={settingsOpen} title="Voice Settings" size="sm">
	<div class="space-y-6">
		<!-- Speed -->
		<div>
			<p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Speed</p>
			<ButtonToggleGroup
				value={speed}
				onSelect={(v) => {
					if (typeof v === 'string') speed = v;
				}}
			>
				{#each speedOptions as opt (opt.value)}
					<ButtonToggle value={opt.value}>{opt.label}</ButtonToggle>
				{/each}
			</ButtonToggleGroup>
		</div>

		<!-- Tone -->
		<div>
			<p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Tone</p>
			<ButtonToggleGroup
				value={pitch}
				onSelect={(v) => {
					if (typeof v === 'string') pitch = v;
				}}
			>
				{#each toneOptions as opt (opt.value)}
					<ButtonToggle value={opt.value}>{opt.label}</ButtonToggle>
				{/each}
			</ButtonToggleGroup>
		</div>
	</div>
</Modal>
