<script lang="ts">
	import { VocabFlashcardPage } from '$lib';
	import { removeHyphensAndCapitalize } from '$lib/utils';

	let { data } = $props();
	let title = $derived(`Nivå ${data.level} — ${removeHyphensAndCapitalize(data.category)}`);
</script>

{#if data.entries.length > 0}
	<VocabFlashcardPage entries={data.entries} {title} />
{:else}
	<div class="py-16 text-center">
		<h1 class="text-2xl font-semibold text-gray-700 dark:text-gray-300">{title}</h1>
		<p class="mt-4 text-gray-500 dark:text-gray-400">
			No vocabulary available yet. Check back soon!
		</p>
	</div>
{/if}
