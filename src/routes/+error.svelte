<script lang="ts">
  import { page } from '$app/state';
</script>

<div class="mx-auto max-w-3xl px-4 py-10 text-center">
  <h1 class="mb-2 text-7xl dark:text-white">
    {page.status}
  </h1>
  <p class="mb-6 text-2xl text-gray-600 dark:text-gray-300">
    {page.error?.message ?? 'Something went wrong.'}
  </p>
  <a href="/" class="text-indigo-600 underline dark:text-indigo-400">← Go home</a>
</div>
