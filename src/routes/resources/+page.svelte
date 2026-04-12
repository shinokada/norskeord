<script>
	import { A, Heading, List, Li } from 'flowbite-svelte';
</script>

<div class="mx-auto max-w-4xl p-8 text-left">
	<Heading tag="h1" class="text-3xl">RESOURCES</Heading>
  <Heading tag="h2" class="text-2xl">Other Flashcard Apps</Heading>
  <List class="list-disc text-left text-lg dark:text-gray-400">
    <Li class="hover:text-red-700 hover:underline">
      <A href="https://norskflashcards.no/" class="me-4 hover:underline md:me-6"
        >norskflashcards.no</A
      >
    </Li>
    <Li class="hover:text-red-700 hover:underline">
      <A href="https://kids-flashcards.com/no" class="me-4 hover:underline md:me-6"
        >kids-flashcards.com</A
      >
    </Li>
  </List>
  <Heading tag="h2" class="text-2xl">Grammar</Heading>
  <List class="list-disc text-left text-lg dark:text-gray-400">
    <Li class="hover:text-red-700 hover:underline">
      <A href="https://www.lenoo.no/norwegian-grammar" class="me-4 hover:underline md:me-6"
        >Lenoo: Norwegian grammar</A
      >
    </Li>
  </List>
  <Heading tag="h2" class="text-2xl">Dictionaries</Heading>
  <List class="list-disc text-left text-lg dark:text-gray-400">
    <Li class="hover:text-red-700 hover:underline">
      <A href="https://ordbokene.no/" class="me-4 hover:underline md:me-6"
        >ordbokene.no</A
      >
    </Li>
    <Li class="hover:text-red-700 hover:underline">
      <A href="https://naob.no/" class="me-4 hover:underline md:me-6"
        >naob.no</A
      >
    </Li>
  </List>
</div>