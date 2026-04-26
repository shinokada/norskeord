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
    >In Norway, every city and town has dedicated volunteers who offer free Norwegian courses, such
    as Røde Kors Norsktrening. I would like to express my sincere gratitude to all the volunteers
    who are helping us learn Norwegian.</P
  >

</div>
