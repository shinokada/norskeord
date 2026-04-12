<script>
	import { removeHyphensAndCapitalize } from '$lib/utils';
	import { A, P, Heading, List, Li } from 'flowbite-svelte';

	const name = __NAME__;
	const version = __VERSION__;
	const svelteVersion = __SVELTE_VERSION__;
	const svelteKitVersion = __SVELTEKIT_VERSION__;
	const viteVersion = __VITE_VERSION__;
</script>

<div class="mx-auto max-w-4xl p-8 text-left">
	<Heading tag="h1" class="text-3xl">ABOUT</Heading>
	<P>
		Norsk-Flashcard is for Norwegian learners who want to learn Norwegian vocabulary. It provides
		flashcards with Norwegian words on the front and English translations on the back, along with
		example sentences. The app is designed to be simple and user-friendly, making it easy for
		learners to practice and expand their Norwegian vocabulary.
	</P>
	<P
		>If you find any errors or have suggestions, please feel free to <A
			href="https://github.com/shinokada/norske-flashcard/issues">contact me.</A
		></P
	>
	<P
		>In Norway, every city and town has dedicated volunteers who offer free Norwegian courses, such
		as Røde Kors Norsktrening. I would like to express my sincere gratitude to all the volunteers
		who are helping us learn Norwegian.</P
	>

	<Heading tag="h2" class="text-2xl">LexiLearn Hub Apps</Heading>

	<List class="list-disc text-left text-lg dark:text-gray-400">
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://gjett-norsk.codewithshin.com/" class="me-4 hover:underline md:me-6"
				>Gjett Norsk</A
			>
		</Li>
		<Li class="hover:text-red-700 hover:underline">
			<A
				href="https://multilanguage-flashcard.codewithshin.com/"
				class="me-4 hover:underline md:me-6">Multilanguage flashcard</A
			>
		</Li>
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://norske-flashcard.codewithshin.com/" class="me-4 hover:underline md:me-6"
				>Norske flashcard</A
			>
		</Li>
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://nihongo-flashcard.codewithshin.com/" class="me-4 hover:underline md:me-6"
				>Japanese flashcard</A
			>
		</Li>
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://flexilexi-dictionary.codewithshin.com/" class="me-4 hover:underline md:me-6"
				>FlexiLexi dictionary</A
			>
		</Li>
	</List>

	<Heading tag="h2" class="text-2xl">Technical info</Heading>
	<List class="list-disc text-left text-lg dark:text-gray-400">
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://norske-flashcard.codewithshin.com/" class="me-4 hover:underline md:me-6"
				>{removeHyphensAndCapitalize(name)} : {version}</A
			>
		</Li>
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://svelte.dev" class="me-4 hover:underline md:me-6">Svelte: {svelteVersion}</A>
		</Li>
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://kit.svelte.dev/docs/introduction" class="me-4 hover:underline md:me-6"
				>SvelteKit: {svelteKitVersion}</A
			>
		</Li>
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://vitejs.dev/" class="me-4 hover:underline md:me-6">Vite: {viteVersion}</A>
		</Li>
	</List>

	<Heading tag="h2" class="text-2xl">Repo</Heading>
	<List class="list-disc text-left text-lg dark:text-gray-400">
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://github.com/shinokada/norske-flashcard" class="me-4 hover:underline md:me-6"
				>Github repo</A
			>
		</Li>
		<Li class="hover:text-red-700 hover:underline">
			<A href="https://codewithshin.com" class="me-4 hover:underline md:me-6"
				>Author: codewithshin.com</A
			>
		</Li>
	</List>
</div>
