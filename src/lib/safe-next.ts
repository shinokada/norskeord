/**
 * safe-next.ts
 *
 * Validates a post-login redirect target (`?next=`). Only a same-origin path
 * is accepted; anything else returns the fallback, so `?next=https://evil.example`
 * or `?next=//evil.example` can never send a visitor off-site after login
 * (ai-docs/implementation/locked-teaser-social-login.md, Phase 1).
 */

// Never resolved or fetched: only used so `new URL()` can parse a relative value.
const DUMMY_ORIGIN = 'http://safe-next.invalid';
const MAX_LENGTH = 2048;

// C0 controls and DEL, plus backslash. Browsers strip tab/CR/LF inside URLs and
// treat `\` like `/`, so `/\evil.com` and `/<TAB>/evil.com` both become `//evil.com`.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS = /[\u0000-\u001f\u007f\\]/;

/**
 * Returns `raw` (path + search + hash) when it is a safe same-origin path,
 * otherwise `fallback`.
 */
export function safeNext(raw: string | null | undefined, fallback = '/'): string {
  if (typeof raw !== 'string' || raw === '' || raw.length > MAX_LENGTH) return fallback;
  if (FORBIDDEN_CHARS.test(raw)) return fallback;
  // Must be a path, and not protocol-relative (`//host`).
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;

  let url: URL;
  try {
    url = new URL(raw, DUMMY_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== DUMMY_ORIGIN) return fallback;

  const result = url.pathname + url.search + url.hash;
  // Dot-segment normalisation can produce a protocol-relative value:
  // `/..//evil.com` and `/.//evil.com` both normalise to `//evil.com`.
  if (!result.startsWith('/') || result.startsWith('//')) return fallback;
  return result;
}
