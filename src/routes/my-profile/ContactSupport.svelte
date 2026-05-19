<script lang="ts">
  import { enhance } from '$app/forms';

  declare const __VERSION__: string;

  let open = $state(false);
  let sending = $state(false);
  let sent = $state(false);
  let errorMsg = $state('');
  let subject = $state('');
  let message = $state('');

  const subjectOptions = [
    'Bug report',
    'Feature request',
    'Billing question',
    'Account issue',
    'Other'
  ];
</script>

<div class="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Priority support</p>
      <p class="text-xs text-gray-400 dark:text-gray-500">Get help directly from the developer</p>
    </div>
    {#if !sent}
      <button
        type="button"
        onclick={() => (open = !open)}
        class="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
      >
        {open ? 'Cancel' : 'Contact support'}
      </button>
    {/if}
  </div>

  {#if sent}
    <div
      class="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300"
    >
      <span class="text-base">✓</span>
      Message sent! We'll reply to your email within 1–2 business days.
    </div>
  {:else if open}
    <form
      method="POST"
      action="?/supportContact"
      class="mt-4 space-y-3"
      use:enhance={() => {
        sending = true;
        errorMsg = '';
        return async ({ result, update }) => {
          sending = false;
          if (result.type === 'success') {
            sent = true;
            open = false;
          } else if (result.type === 'failure') {
            errorMsg = (result.data?.message as string) ?? 'Failed to send. Please try again.';
          }
          await update({ reset: false });
        };
      }}
    >
      <input type="hidden" name="app_version" value={__VERSION__} />
      <div>
        <label
          for="support-subject"
          class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          Subject
        </label>
        <select
          id="support-subject"
          name="subject"
          bind:value={subject}
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">Select a topic…</option>
          {#each subjectOptions as opt (opt)}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </div>

      <div>
        <label
          for="support-message"
          class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          Message
        </label>
        <textarea
          id="support-message"
          name="message"
          bind:value={message}
          rows={4}
          placeholder="Describe your issue or question…"
          class="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        ></textarea>
        <p class="mt-0.5 text-right text-xs text-gray-400">{message.length} / 2000</p>
      </div>

      {#if errorMsg}
        <p class="text-xs text-red-500">{errorMsg}</p>
      {/if}

      <button
        type="submit"
        disabled={sending || !subject}
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  {/if}
</div>
