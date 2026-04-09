<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { CATEGORIES_BY_LEVEL } from '$lib/types';
	import { removeHyphensAndCapitalize } from '$lib/utils';

	// Only auto-redirect on direct/fresh page loads (from === null),
	// not when the user explicitly navigates home via an in-app link.
	afterNavigate(async ({ from }) => {
		if (from !== null) return;
		const savedPathPattern = /^(\/|\/about|\/[a-z]\d\/[^/]+)$/;
		const last = localStorage.getItem('last-flashcard-path');
		if (last && savedPathPattern.test(last)) {
			try {
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto(last, { replaceState: true });
			} catch {
				localStorage.removeItem('last-flashcard-path');
			}
		} else if (last) {
			localStorage.removeItem('last-flashcard-path');
		}
	});

	const levels = [
		{ id: 'A1', label: 'A1 — Beginner', color: 'green' },
		{ id: 'A2', label: 'A2 — Elementary', color: 'teal' },
		{ id: 'B1', label: 'B1 — Intermediate', color: 'blue' },
		{ id: 'B2', label: 'B2 — Upper Intermediate', color: 'indigo' },
		{ id: 'C1', label: 'C1 — Advanced', color: 'purple' },
		{ id: 'C2', label: 'C2 — Mastery', color: 'pink' }
	] as const;

	const badgeColors: Record<string, string> = {
		green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
		blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
		indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
		purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
		pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
	};
</script>

<h1 class="mt-8 mb-2 text-4xl font-bold dark:text-white">Norske flashcard</h1>
<p class="mb-10 text-lg text-gray-600 dark:text-gray-400">
	Øv norsk ordforråd fra A1 til C2. Velg et nivå og en kategori for å begynne.
</p>

<div class="space-y-10 text-left">
	{#each levels as { id, label, color } (id)}
		{@const categories = CATEGORIES_BY_LEVEL[id]}
		{@const badge = badgeColors[color]}
		<div>
			<h2 class="mb-3 text-xl font-semibold dark:text-white">{label}</h2>
			<div class="flex flex-wrap gap-2">
				{#each categories as cat (cat)}
					<a
						href="/{id.toLowerCase()}/{cat}"
						class="{badge} rounded-full px-4 py-1.5 font-medium transition-opacity hover:opacity-75"
					>
						{removeHyphensAndCapitalize(cat)}
					</a>
				{/each}
			</div>
		</div>
	{/each}
</div>
