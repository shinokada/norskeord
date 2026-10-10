import { safeNext } from './safe-next';

/** Where login sends someone who came with no usable `next`. Must stay `/learn/a1`:
 *  /auth/sync only restores the last flashcard path when the destination is this. */
export const DEFAULT_POST_LOGIN = '/learn/a1';

/**
 * Destination after a successful login (email code or Google). A same-origin
 * `next` wins; a missing, unsafe or bare `/` means "no next" and falls back to
 * DEFAULT_POST_LOGIN. There is no plan branch: a free account lands on the locked
 * path and sees the teaser (ai-docs/implementation/locked-teaser-social-login.md, Phase 4).
 */
export function postLoginDestination(rawNext: string | null): string {
  const next = safeNext(rawNext, '/');
  return next === '/' ? DEFAULT_POST_LOGIN : next;
}
