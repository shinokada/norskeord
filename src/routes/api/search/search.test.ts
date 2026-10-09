import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SearchEntry } from '$lib/search';

// ── Mocks ─────────────────────────────────────────────────────────────────────
// The real index is built from the private data submodule; tests use fixtures.

const { mockGetIndex } = vi.hoisted(() => ({ mockGetIndex: vi.fn() }));

vi.mock('$lib/server/search-index', () => ({ getSearchIndex: mockGetIndex }));

import { GET } from './+server';
import { searchRateLimiter, SEARCH_RATE_LIMIT_PER_MINUTE } from '$lib/server/rate-limit';
import { MAX_RESULTS } from '$lib/searchUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function entry(overrides: Partial<SearchEntry> = {}): SearchEntry {
  return {
    id: 'vocab-a1-00000',
    entryId: 'w-000001',
    norsk: 'hei',
    lemma: 'hei',
    english: 'hello',
    spanish: 'hola',
    german: 'hallo',
    example: 'Hei! Hvordan g\u00e5r det?',
    example_english: 'Hi! How are you?',
    example_german: 'Hallo! Wie geht es dir?',
    definition: 'En hilsen.',
    level: 'A1',
    category: 'greetings',
    source: 'vocab',
    href: '/a1/greetings',
    ...overrides
  };
}

// Every non-default entry overrides the example fields too. The search matches
// inside example text, so a shared default example would make all three
// fixtures match a query like "hei".
const INDEX: SearchEntry[] = [
  entry(),
  entry({
    id: 'uttrykk-b1-00001',
    entryId: 'u-b1-001',
    norsk: '\u00e5 v\u00e6re i skyene',
    lemma: '\u00e5 v\u00e6re i skyene',
    english: 'to be on cloud nine',
    german: undefined,
    spanish: undefined,
    example: 'Hun er i skyene etter nyheten.',
    example_english: 'She is over the moon about the news.',
    example_german: undefined,
    definition: 'Veldig glad.',
    level: 'B1',
    category: 'emotions',
    source: 'uttrykk',
    href: '/b1/emotions'
  }),
  entry({
    id: 'vocab-a1-00002',
    entryId: 'w-000002',
    norsk: 'p\u00e5',
    lemma: 'p\u00e5',
    english: 'on',
    german: undefined,
    spanish: undefined,
    example: 'Boken ligger p\u00e5 bordet.',
    example_english: 'The book is on the table.',
    example_german: undefined,
    definition: 'Preposisjon.'
  })
];

type Locals = { user: { id: string } | null; plan: 'free' | 'plus' };

function call(query: string, locals: Locals = { user: { id: 'user-1' }, plan: 'plus' }) {
  const url = new URL(`http://localhost/api/search${query}`);
  return GET({ url, locals } as unknown as Parameters<typeof GET>[0]);
}

beforeEach(() => {
  searchRateLimiter.reset();
  mockGetIndex.mockReset();
  mockGetIndex.mockResolvedValue(INDEX);
});

// ── Access ────────────────────────────────────────────────────────────────────

describe('GET /api/search \u2014 access', () => {
  it('returns 403 plus_required when logged out', async () => {
    const res = await call('?q=hei', { user: null, plan: 'free' });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'plus_required' });
  });

  it('returns 403 for a free user', async () => {
    const res = await call('?q=hei', { user: { id: 'user-1' }, plan: 'free' });
    expect(res.status).toBe(403);
  });

  it('does not touch the index for a non-Plus caller', async () => {
    await call('?q=hei', { user: { id: 'user-1' }, plan: 'free' });
    expect(mockGetIndex).not.toHaveBeenCalled();
  });

  it('does not count a 403 against the rate limit', async () => {
    for (let i = 0; i < SEARCH_RATE_LIMIT_PER_MINUTE + 5; i++) {
      await call('?q=hei', { user: { id: 'user-1' }, plan: 'free' });
    }
    const res = await call('?q=hei');
    expect(res.status).toBe(200);
  });
});

// ── Success ───────────────────────────────────────────────────────────────────

describe('GET /api/search \u2014 results', () => {
  it('returns 200 with slim results and a no-store header', async () => {
    const res = await call('?q=hei');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    const { results } = await res.json();
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entryId: 'w-000001',
      norsk: 'hei',
      translation: 'hello',
      example: 'Hei! Hvordan g\u00e5r det?',
      level: 'A1',
      category: 'greetings',
      source: 'vocab',
      href: '/a1/greetings'
    });
  });

  it('never returns other-locale translations, example translations or the raw definition field', async () => {
    const res = await call('?q=hei&locale=es');
    const { results } = await res.json();
    expect(results[0].translation).toBe('hola');
    const keys = Object.keys(results[0]);
    for (const banned of [
      'english',
      'spanish',
      'ukrainian',
      'german',
      'example_english',
      'example_spanish',
      'example_ukrainian',
      'example_german',
      'definition'
    ]) {
      expect(keys).not.toContain(banned);
    }
    const body = JSON.stringify(results);
    expect(body).not.toContain('hallo');
    expect(body).not.toContain('How are you');
    expect(body).not.toContain('Wie geht');
    expect(body).not.toContain('En hilsen');
  });

  it('nb locale returns the Norwegian definition as the translation', async () => {
    const { results } = await (await call('?q=hei&locale=nb')).json();
    expect(results[0].translation).toBe('En hilsen.');
  });

  it('an unknown locale falls back to English', async () => {
    const { results } = await (await call('?q=hei&locale=fr')).json();
    expect(results[0].translation).toBe('hello');
  });

  it('applies the source and level filters', async () => {
    const { results } = await (await call('?q=sky&source=uttrykk&level=B1')).json();
    expect(results).toHaveLength(1);
    const none = await (await call('?q=sky&source=vocab')).json();
    expect(none.results).toHaveLength(0);
  });

  it('caps the number of results', async () => {
    mockGetIndex.mockResolvedValue(
      Array.from({ length: MAX_RESULTS + 25 }, (_, i) =>
        entry({ id: `e${i}`, norsk: `ord${i}`, lemma: `ord${i}`, english: `word ${i}` })
      )
    );
    const { results } = await (await call('?q=ord')).json();
    expect(results).toHaveLength(MAX_RESULTS);
  });

  it('a 2-character query matches exactly only', async () => {
    const exact = await (await call('?q=p%C3%A5')).json();
    expect(exact.results.map((r: { norsk: string }) => r.norsk)).toEqual(['p\u00e5']);
    const partial = await (await call('?q=he')).json();
    expect(partial.results).toHaveLength(0);
  });
});

// ── Validation ────────────────────────────────────────────────────────────────

describe('GET /api/search \u2014 validation', () => {
  it.each([
    ['missing q', ''],
    ['empty q', '?q='],
    ['1-character q', '?q=h'],
    ['whitespace q', '?q=%20%20%20'],
    ['over-long q', `?q=${'a'.repeat(65)}`],
    ['bad source', '?q=hei&source=grammar'],
    ['bad level', '?q=hei&level=C2']
  ])('returns 400 for %s', async (_name, query) => {
    const res = await call(query);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_request' });
  });
});

// ── Rate limit ────────────────────────────────────────────────────────────────

describe('GET /api/search \u2014 rate limit', () => {
  it('returns 429 with Retry-After after the per-minute limit', async () => {
    for (let i = 0; i < SEARCH_RATE_LIMIT_PER_MINUTE; i++) {
      expect((await call('?q=hei')).status).toBe(200);
    }
    const res = await call('?q=hei');
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate_limited' });
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('limits per user, not globally', async () => {
    for (let i = 0; i < SEARCH_RATE_LIMIT_PER_MINUTE; i++) await call('?q=hei');
    const other = await call('?q=hei', { user: { id: 'user-2' }, plan: 'plus' });
    expect(other.status).toBe(200);
  });
});
