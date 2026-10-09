/**
 * GET /api/search?q=…&source=all|vocab|uttrykk&level=all|A1|A2|B1|B2|C&locale=en|nb|es|uk|de
 *
 * Plus-only server-side search (ai-docs/implementation/search-index-gate.md).
 * Replaces the public /data/search-index.json: the index lives in server memory
 * and a caller gets at most MAX_RESULTS slim results per request.
 *
 * Responses:
 *   403 { error: 'plus_required' }  — logged out or free
 *   429 { error: 'rate_limited' }   — over SEARCH_RATE_LIMIT_PER_MINUTE (Retry-After set)
 *   400 { error: 'bad_request' }    — invalid q / source / level
 *   200 { results: SearchResult[] } — never cached
 */
import { json } from '@sveltejs/kit';
import { getSearchIndex } from '$lib/server/search-index';
import { searchRateLimiter } from '$lib/server/rate-limit';
import {
  MIN_QUERY_LENGTH,
  normalizeLocale,
  search,
  toSearchResult,
  translationFor,
  exampleTranslationFor
} from '$lib/searchUtils';
import type { SearchFilter } from '$lib/searchUtils';
import type { RequestHandler } from './$types';

const MAX_QUERY_LENGTH = 64;
const SOURCES = new Set(['all', 'vocab', 'uttrykk']);
const LEVELS = new Set(['all', 'A1', 'A2', 'B1', 'B2', 'C']);
const NO_STORE = { 'Cache-Control': 'private, no-store' };

export const GET: RequestHandler = async ({ url, locals }) => {
  // Plus check first: nothing below runs for anyone else.
  if (!locals.user || locals.plan !== 'plus') {
    return json({ error: 'plus_required' }, { status: 403, headers: NO_STORE });
  }

  const rate = searchRateLimiter.check(locals.user.id);
  if (!rate.ok) {
    return json(
      { error: 'rate_limited' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const q = (url.searchParams.get('q') ?? '').trim();
  const source = url.searchParams.get('source') ?? 'all';
  const level = url.searchParams.get('level') ?? 'all';
  const locale = normalizeLocale(url.searchParams.get('locale'));

  if (
    q.length < MIN_QUERY_LENGTH ||
    q.length > MAX_QUERY_LENGTH ||
    !SOURCES.has(source) ||
    !LEVELS.has(level)
  ) {
    return json({ error: 'bad_request' }, { status: 400, headers: NO_STORE });
  }

  const filter: SearchFilter = {
    source: source as SearchFilter['source'],
    level
  };

  const index = await getSearchIndex();
  const results = search(
    q,
    index,
    filter,
    (e) => translationFor(e, locale),
    (e) => exampleTranslationFor(e, locale)
  ).map((e) => toSearchResult(e, locale));

  return json({ results }, { headers: NO_STORE });
};
