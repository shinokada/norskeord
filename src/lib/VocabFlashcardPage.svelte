<script lang="ts">
	import { onMount } from 'svelte';
	import { Flashcard, ArrowRight, ArrowUp, ArrowDown } from '$lib';
	import { Button } from 'flowbite-svelte';
	import type { VocabEntry } from '$lib/types';

	interface Props {
		entries: VocabEntry[];
		title?: string;
	}

	let { entries, title = 'Vocab' }: Props = $props();

	type Mode = 'noreng' | 'engnor';
	type HistoryItem = { entry: VocabEntry; front: string; back: string };

	let mode = $state<Mode>('noreng');
	let showCardBack = $state(false);
	let showExampleEnglish = $state(false);
	let history = $state<HistoryItem[]>([]);
	let currentIndex = $state(-1);

	// touch
	let isTouch = $state(false);
	let touchStartX = 0;
	let touchStartY = 0;

	onMount(() => {
		isTouch = window.matchMedia('(pointer: coarse)').matches;
	});

	function randomEntry(): VocabEntry {
		return entries[Math.floor(Math.random() * entries.length)];
	}

	function makeItem(entry: VocabEntry, m: Mode): HistoryItem {
		return {
			entry,
			front: m === 'noreng' ? entry.norsk : entry.english,
			back: m === 'noreng' ? entry.english : entry.norsk
		};
	}

	function resetCardState() {
		showCardBack = false;
		showExampleEnglish = false;
	}

	function newCard() {
		if (entries.length === 0) return;
		resetCardState();
		const item = makeItem(randomEntry(), mode);
		history = [...history, item];
		currentIndex = history.length - 1;
	}

	function setMode(m: Mode) {
		if (m === mode) return;
		mode = m;
		history = [];
		currentIndex = -1;
		newCard();
	}

	function prev() {
		if (currentIndex > 0) {
			currentIndex--;
			resetCardState();
		}
	}

	function next() {
		if (currentIndex < history.length - 1) {
			currentIndex++;
			resetCardState();
		} else {
			newCard();
		}
	}

	const toggleBack = () => (showCardBack = !showCardBack);

	let current = $derived(history[currentIndex]);

	// Reset and initialise whenever entries changes (new category/level)
	$effect(() => {
		// Access entries here so Svelte tracks it as a dependency
		const e = entries;
		if (e.length > 0) {
			mode = 'noreng';
			showCardBack = false;
			showExampleEnglish = false;
			const item = makeItem(e[Math.floor(Math.random() * e.length)], 'noreng');
			history = [item];
			currentIndex = 0;
		}
	});

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
		touchStartY = e.changedTouches[0].screenY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].screenX - touchStartX;
		const dy = e.changedTouches[0].screenY - touchStartY;
		if (Math.abs(dx) > Math.abs(dy)) {
			if (dx < -30) next();
			else if (dx > 30) prev();
		} else {
			if (Math.abs(dy) > 30 && current?.entry.example_english) {
				showExampleEnglish = !showExampleEnglish;
			}
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		if (
			!target ||
			target.closest('button, a, input, textarea, select, summary') ||
			target.isContentEditable
		)
			return;
		if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			prev();
		} else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			next();
		} else if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			toggleBack();
		} else if (e.key === 'n' || e.key === 'N') {
			e.preventDefault();
			newCard();
		} else if (e.key === 'e' || e.key === 'E') {
			e.preventDefault();
			showExampleEnglish = !showExampleEnglish;
		}
	}

	const modeButtonBase =
		'font-medium rounded-lg text-lg px-3 sm:px-5 py-1 sm:py-2.5 me-1 sm:me-2 mb-1 sm:mb-2 focus:outline-none focus:ring-4 transition-opacity';
	const norengCls = $derived(
		`${modeButtonBase} text-white bg-green-700 hover:bg-green-800 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 ${mode === 'noreng' ? 'opacity-100' : 'opacity-50'}`
	);
	const engnorCls = $derived(
		`${modeButtonBase} text-white bg-purple-700 hover:bg-purple-800 focus:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 ${mode === 'engnor' ? 'opacity-100' : 'opacity-50'}`
	);
</script>

<div class="flex flex-col items-center">
	<h1 class="m-4 text-3xl">{title}</h1>

	<!-- Mode toggle -->
	<div class="flex justify-center">
		<button type="button" class={norengCls} onclick={() => setMode('noreng')}>
			Norsk → English
		</button>
		<button type="button" class={engnorCls} onclick={() => setMode('engnor')}>
			English → Norsk
		</button>
	</div>

	<!-- Counter -->
	<div
		class="mt-4 mb-2 flex justify-center gap-4 text-lg font-medium text-gray-700 dark:text-gray-300"
	>
		<Button color="gray">{currentIndex + 1}/{history.length}</Button>
	</div>

	<!-- Flashcard -->
	<div class="flip-box h-96 w-full bg-transparent md:w-1/2">
		<div
			class="flip-box-inner"
			class:flip-it={showCardBack}
			onclick={toggleBack}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					e.stopPropagation();
					toggleBack();
				}
			}}
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
			tabindex="0"
			role="button"
			aria-pressed={showCardBack}
			aria-label={showCardBack
				? 'Flashcard showing answer, press to show question'
				: 'Flashcard showing question, press to reveal answer'}
		>
			<Flashcard front={current?.front} back={current?.back} {showCardBack} />
		</div>
	</div>

	<!-- Part of speech badge -->
	{#if current}
		<span
			class="mt-3 rounded-full bg-gray-200 px-3 py-0.5 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
		>
			{current.entry.part}
		</span>
	{/if}

	<!-- Example section -->
	{#if current}
		<div class="mt-3 w-full max-w-lg rounded-lg bg-gray-50 px-5 py-4 dark:bg-gray-800">
			<p class="text-base text-gray-700 italic dark:text-gray-300">
				"{current.entry.example}"
			</p>
			{#if current.entry.example_english}
				<div class="mt-2">
					{#if showExampleEnglish}
						<p class="mb-1 text-sm text-gray-500 dark:text-gray-400">
							"{current.entry.example_english}"
						</p>
					{/if}
					<button
						type="button"
						class="text-sm text-blue-600 hover:underline dark:text-blue-400"
						onclick={() => (showExampleEnglish = !showExampleEnglish)}
					>
						{showExampleEnglish ? 'Hide translation' : 'Show translation'}
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Hint -->
	<p class="mt-4 rounded bg-gray-900 px-2 py-1 text-white">
		{#if isTouch}
			Tap to flip · ← → to navigate · ↑↓ to toggle translation
		{:else}
			Space/Enter to flip · ←↑ →↓ to navigate · N for new card · E to toggle translation
		{/if}
	</p>

	<!-- Nav buttons -->
	<div class="grid grid-cols-3 gap-2 pt-4">
		<button
			type="button"
			onclick={prev}
			class="inline-flex w-full items-center bg-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-4 dark:bg-gray-700"
			disabled={currentIndex <= 0}
		>
			<ArrowUp class="mr-4" />
			Previous
		</button>

		<button
			type="button"
			onclick={next}
			class="inline-flex w-full items-center bg-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-4 dark:bg-gray-700"
		>
			<ArrowDown class="mr-4" />
			Forward
		</button>

		<button
			type="button"
			class="inline-flex w-full bg-gray-300 p-2 text-right disabled:cursor-not-allowed disabled:opacity-50 sm:p-4 dark:bg-gray-700"
			onclick={newCard}
			disabled={entries.length === 0}
		>
			NEW CARD
			<ArrowRight class="ml-4" />
		</button>
	</div>
</div>

<svelte:window onkeydown={handleKeyDown} />

<style>
	.flip-box {
		background-color: transparent;
		perspective: 1000px;
	}
	.flip-box-inner {
		position: relative;
		width: 100%;
		height: 100%;
		text-align: center;
		transition: transform 0.8s;
		transform-style: preserve-3d;
		cursor: pointer;
		user-select: none;
	}
	.flip-it {
		transform: rotateY(180deg);
	}
</style>
