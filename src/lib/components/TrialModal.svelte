<script lang="ts">
  /**
   * The "Try free" nav badge opens this modal instead of sending the user to /plus
   * (ai-docs/implementation/free-trial.md). The trial is one per account and cannot be undone,
   * so a badge tap shows the offer first and the button inside starts the trial.
   * After the start the user stays on the page they were on (TrialButton defaults `next` to it).
   */
  import { Modal } from 'flowbite-svelte';
  import * as m from '$lib/paraglide/messages.js';
  import TrialButton from '$lib/components/TrialButton.svelte';

  interface Props {
    open: boolean;
  }

  let { open = $bindable(false) }: Props = $props();
</script>

<Modal bind:open size="xs" outsideclose title={m.trial_start_cta()}>
  <div class="flex flex-col items-center gap-4 text-center">
    <p class="text-sm text-gray-600 dark:text-gray-300">{m.trial_start_note()}</p>
    <TrialButton showNote={false} />
    <a
      href="/plus?ref=nav-try"
      onclick={() => (open = false)}
      class="text-sm text-indigo-700 hover:underline dark:text-indigo-300"
    >
      {m.trial_ended_cta()}
    </a>
  </div>
</Modal>
