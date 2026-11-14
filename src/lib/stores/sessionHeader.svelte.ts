/**
 * Lets a view that runs its session inside a tab route give the small-screen top bar a session
 * header (ai-docs/implementation/mobile-web-shell.md, Phase 4b).
 *
 * `/quiz` is one route: the picker and the running quiz share a path, so `shellMode()` cannot tell
 * them apart and the top bar would keep the flag and wordmark mid-quiz, above the page's own back
 * link and heading. While a quiz is on screen the view registers a header, and `MobileTopBar`
 * renders it like the flashcard bar: `<- Quiz | A2 - Body`. `onback` is the view's own exit (the
 * button it used to show in the page), not a link, because the quiz state is not in the URL.
 *
 *   $effect(() => {
 *     if (inSession) return sessionHeader.register({ backLabel, title, onback });
 *   });
 *
 * The last registration wins, and a release only clears the header if it is still its own, so a
 * late cleanup of an older registration cannot remove a newer one.
 *
 * `register()` writes the state and its release reads it. Called from inside an `$effect` without
 * `untrack`, the read would make the calling effect depend on the header (see shellSession.svelte.ts
 * for the loop that causes). Keep both inside `untrack`.
 */
import { untrack } from 'svelte';

export interface SessionHeader {
  /** Text beside the arrow: where the arrow goes ("Quiz"). */
  backLabel: string;
  /** Centred title ("A2 · Body"). */
  title: string;
  /** Called when the arrow is pressed. */
  onback: () => void;
}

function createSessionHeaderStore() {
  // $state.raw: the header holds a function, and the release compares by identity.
  let header = $state.raw<SessionHeader | null>(null);

  return {
    /** The registered header, or `null` when no view has one. */
    get current() {
      return header;
    },
    /** Show `next` in the top bar. Returns the function that removes it again. */
    register(next: SessionHeader): () => void {
      untrack(() => {
        header = next;
      });
      return () => {
        untrack(() => {
          if (header === next) header = null;
        });
      };
    }
  };
}

export const sessionHeader = createSessionHeaderStore();
