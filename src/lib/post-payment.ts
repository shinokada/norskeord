import { safeNext } from './safe-next';

/** Where "Continue" goes after payment when there is no usable `next`. */
export const DEFAULT_POST_PAYMENT = '/a1/greetings';

/** A same-origin `next` worth keeping, or '' (missing, unsafe, or a bare `/`). */
function usableNext(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const next = safeNext(raw, '');
  return next === '/' ? '' : next;
}

/**
 * The URL Lemon Squeezy sends the buyer to after payment. `next` (the page they
 * came from, such as a locked category) rides along so /plus/success can send
 * them back. ai-docs/implementation/locked-teaser-social-login.md, Phase 4.
 */
export function successRedirectUrl(origin: string, rawNext: unknown): string {
  const next = usableNext(rawNext);
  return next
    ? `${origin}/plus/success?next=${encodeURIComponent(next)}`
    : `${origin}/plus/success`;
}

/** Where "Continue" on /plus/success goes. */
export function postPaymentDestination(rawNext: string | null): string {
  return usableNext(rawNext) || DEFAULT_POST_PAYMENT;
}
