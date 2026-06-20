<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
</script>

<div class="mx-auto max-w-lg px-4 py-20 text-center">
  <div class="text-6xl">🎉</div>

  <h1 class="mt-6 text-3xl font-bold dark:text-white">
    {m.plus_success_heading()}
  </h1>

  <p class="mx-auto mt-4 max-w-sm text-gray-600 dark:text-gray-300">
    {m.plus_success_body()}
  </p>

  <a
    href="/a1/greetings"
    class="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700"
  >
    {m.plus_success_cta()}
  </a>
</div>
