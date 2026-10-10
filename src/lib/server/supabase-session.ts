/**
 * supabase-session.ts (server only)
 *
 * Detects whether a request carries a Supabase auth session cookie.
 *
 * `@supabase/ssr` stores the session in `sb-<ref>-auth-token`, but splits a
 * large session across `sb-<ref>-auth-token.0`, `.1`, ... A Google session
 * (identity data, avatar URL) is likely to be large enough to be split, so an
 * exact-name lookup would report "no session" for a logged-in user.
 * See ai-docs/implementation/locked-teaser-social-login.md (Phase 2).
 */

export type CookieEntry = { name: string; value: string };

export function hasSupabaseSession(
  cookies: { getAll(): CookieEntry[] },
  baseName: string
): boolean {
  const chunk = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.\\d+$`);
  return cookies
    .getAll()
    .some((c) => c.value !== '' && (c.name === baseName || chunk.test(c.name)));
}
