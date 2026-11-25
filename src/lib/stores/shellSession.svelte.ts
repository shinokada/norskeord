/**
 * Lets a view hide the small-screen bottom tab bar while a study session is on screen
 * (ai-docs/implementation/mobile-web-shell.md, Phase 2).
 *
 * Quiz and the grammar topic page run their session inside the same route as their picker or
 * rules tab, so the path alone cannot tell the two apart. The view calls `hide()` when the session
 * starts and `show()` in the cleanup of the same `$effect`:
 *
 *   $effect(() => {
 *     if (inSession) {
 *       shellSession.hide();
 *       return () => shellSession.show();
 *     }
 *   });
 *
 * A counter, not a boolean, so two overlapping registrations cannot un-hide each other.
 *
 * `hide()` and `show()` read the counter before they write it. Called from inside an `$effect`
 * without `untrack`, that read would make the calling effect depend on the counter, so every
 * `hide()` would re-run the effect, run its cleanup (`show()`) and call `hide()` again, forever.
 * Keep both calls inside `untrack`.
 */
import { untrack } from 'svelte';

function createShellSessionStore() {
  let count = $state(0);

  return {
    /** True while at least one view asked for the bar to be hidden. */
    get hidden() {
      return count > 0;
    },
    hide() {
      untrack(() => {
        count += 1;
      });
    },
    show() {
      untrack(() => {
        count = Math.max(0, count - 1);
      });
    }
  };
}

export const shellSession = createShellSessionStore();
