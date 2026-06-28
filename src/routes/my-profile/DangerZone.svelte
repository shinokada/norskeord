<script lang="ts">
  import { enhance } from '$app/forms';
  import * as m from '$lib/paraglide/messages.js';

  let deleting = $state(false);
  let confirmed = $state(false);
  let errorMsg = $state('');
</script>

<section
  class="rounded-xl border border-red-200 bg-red-50 px-6 pb-6 pt-4 dark:border-red-800/40 dark:bg-red-950/20"
>
  <h2 class="mb-1 text-base font-semibold text-red-600 dark:text-red-400">
    {m.profile_danger_heading()}
  </h2>
  <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">
    {m.profile_danger_subtitle()}
  </p>

  <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
    <div class="mb-3 sm:mb-0">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_danger_delete_heading()}
      </p>
      <p class="text-xs text-gray-600 dark:text-gray-300">
        {m.profile_danger_delete_body()}
      </p>
    </div>

    {#if !confirmed}
      <button
        type="button"
        onclick={() => (confirmed = true)}
        class="shrink-0 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        {m.profile_danger_delete_button()}
      </button>
    {:else}
      <form
        method="POST"
        action="?/deleteAccount"
        use:enhance={() => {
          deleting = true;
          errorMsg = '';
          return async ({ result, update }) => {
            deleting = false;
            if (result.type === 'failure') {
              errorMsg = (result.data?.message as string) ?? m.profile_error_generic();
              confirmed = false;
            }
            await update();
          };
        }}
        class="flex flex-col items-start gap-2 sm:items-end"
      >
        <p class="text-sm font-medium text-red-600 dark:text-red-400">
          {m.profile_danger_confirm_question()}
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => (confirmed = false)}
            class="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white/10 dark:text-gray-300"
          >
            {m.profile_cancel()}
          </button>
          <button
            type="submit"
            disabled={deleting}
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? m.profile_danger_deleting() : m.profile_danger_confirm_yes()}
          </button>
        </div>
        {#if errorMsg}
          <p class="text-xs text-red-500">{errorMsg}</p>
        {/if}
      </form>
    {/if}
  </div>
</section>
