<script lang="ts">
  /**
   * The Plus call-to-action buttons for a locked screen, in one place so every screen uses the
   * same colours (ai-docs/implementation/free-trial.md).
   *
   * - Trial-eligible user: "Try Plus free for 30 days" is the filled indigo button and comes
   *   first; "Get Plus" is the outlined orange secondary.
   * - Signed-out visitor: the same layout, but the trial button is a link to the login page
   *   that comes back to this page, because the trial needs an account. "Get Plus" still goes
   *   to /plus (prices and the comparison table).
   * - Signed-in user who already had a trial or paid: "Get Plus" is the filled orange button.
   *
   * Renders two sibling elements, no wrapper: the caller provides the flex container, so it can
   * add its own extra buttons (the teaser's login link).
   */
  import { page } from '$app/state';
  import TrialButton from '$lib/components/TrialButton.svelte';
  import { trialOffered } from '$lib/trial';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    /** Where "Get Plus" goes, usually `/plus?ref=…`. */
    href: string;
    /** Text of the Get Plus link. */
    label?: string;
  }

  let { href, label = m.teaser_get_plus() }: Props = $props();

  const offered = $derived(trialOffered(page.data));
</script>

{#if offered}
  <!-- A button for a signed-in user, a login link in the same style for a signed-out visitor. -->
  <TrialButton variant="primary" showNote={false} />
{/if}
<a
  {href}
  class="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold focus:ring-4 focus:outline-none
    {offered
    ? 'border border-orange-300 bg-white text-orange-700 hover:bg-orange-50 focus:ring-orange-200 dark:border-orange-700 dark:bg-transparent dark:text-orange-300 dark:hover:bg-orange-900/30'
    : 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300'}"
>
  {label}
</a>
