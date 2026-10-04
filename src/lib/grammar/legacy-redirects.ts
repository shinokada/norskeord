// src/lib/grammar/legacy-redirects.ts
// Old /grammar/<topic> URLs that stopped existing in Phase 1b of
// ai-docs/implementation/grammar-update.md. They were in the sitemap (and
// possibly indexed or bookmarked), so src/hooks.server.ts answers them with a
// long-cacheable 301 instead of letting them 404.
//
// Pure and side-effect free so it can be unit-tested without SvelteKit.
//
// TODO (Phase 5): `helsetninger` was split into several topics, so it has no
// 1:1 target. It points at `sporresetninger` for now; once chapter pages exist,
// point it at /grammar/chapter/helsetninger instead.

/** old topic id -> new topic id (same /grammar/<topic> route). */
export const LEGACY_GRAMMAR_TOPIC_REDIRECTS: Readonly<Record<string, string>> = {
  helsetninger: 'sporresetninger',
  'uttrykk-gjenkjenning-c-1': 'uttrykk',
  'uttrykk-gjenkjenning-c-2': 'uttrykk',
  'uttrykk-gjenkjenning-c-3': 'uttrykk',
  'uttrykk-gjenkjenning-detgaarbra-c': 'uttrykk'
};

/**
 * Returns the path to redirect to for a renamed grammar topic URL, or null if
 * the pathname isn't one. Only exact `/grammar/<old-topic>` (optional trailing
 * slash) matches; the query string is the caller's to preserve.
 */
export function legacyGrammarRedirect(pathname: string): string | null {
  const match = /^\/grammar\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const old = match[1];
  // hasOwnProperty: avoid matching inherited keys such as "constructor".
  if (!Object.prototype.hasOwnProperty.call(LEGACY_GRAMMAR_TOPIC_REDIRECTS, old)) return null;
  return `/grammar/${LEGACY_GRAMMAR_TOPIC_REDIRECTS[old]}`;
}
