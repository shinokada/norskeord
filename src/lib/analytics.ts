// src/lib/analytics.ts
// Custom GA4 events (ai-docs/implementation/free-tier-simplification.md, Phase 7).
//
// Runatics only loads gtag.js and defines the global `gtag`; it has no event API. So events go
// through `window.gtag` directly. Where GA is not loaded (dev, a blocker, e2e) `gtag` is
// undefined and every call is a no-op, so analytics can never break the app.
//
// Two events are tracked, both meant to be marked as key events in GA4:
//   upgrade_click  a click on any link to /plus. `ref` is the link's own ?ref= value, so one
//                  listener covers every upgrade entry point (category-lock, grammar-topic-lock, ...).
//   login          the user id seen on this device changed from "none or another user" to a signed-in user.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const UPGRADE_CLICK_EVENT = 'upgrade_click';
export const LOGIN_EVENT = 'login';
/** localStorage key holding the last user id seen on this device ('' when signed out). */
export const SIGNED_IN_KEY = 'ga-last-user-id';

export type EventParams = Record<string, string | number | boolean>;

export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', name, params);
  } catch {
    /* analytics must never break the app */
  }
}

/**
 * `{ ref }` when `href` is a link to this site's /plus page (not /plus/success or an external
 * link), otherwise null. `ref` is "none" when the link carries no ?ref=.
 */
export function upgradeClickParams(href: string, base: string): { ref: string } | null {
  let url: URL;
  let origin: string;
  try {
    url = new URL(href, base);
    origin = new URL(base).origin;
  } catch {
    return null;
  }
  if (url.origin !== origin || url.pathname !== '/plus') return null;
  return { ref: url.searchParams.get('ref') || 'none' };
}

/**
 * True when `userId` is signed in and is not the user last seen on this device: a new sign-in,
 * or a different account. False while the same user simply keeps browsing, and when signed out.
 */
export function isNewSignIn(previousUserId: string | null, userId: string | null): boolean {
  return !!userId && previousUserId !== userId;
}
