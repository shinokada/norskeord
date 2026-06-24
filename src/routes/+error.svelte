<script lang="ts">
  import { page } from '$app/state';
  import { Heading } from 'flowbite-svelte';
</script>

<div class="mx-auto max-w-3xl px-4 py-10 text-left">
  <Heading tag="h1" class="mb-2 text-4xl font-bold dark:text-white">
    {page.status}
  </Heading>
  <p class="mb-6 text-gray-600 dark:text-gray-300">
    {page.error?.message ?? 'Something went wrong.'}
  </p>
  <a href="/" class="text-sm text-indigo-600 underline dark:text-indigo-400">← Go home</a>
</div>
