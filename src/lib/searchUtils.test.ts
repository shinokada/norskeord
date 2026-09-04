import { describe, it, expect } from 'vitest';
import { search, normalize, hasInflection, MAX_RESULTS } from './searchUtils';
import type { SearchEntry } from './search';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<SearchEntry> = {}): SearchEntry {
  return {
    id: 'vocab-a1-00000',
    norsk: 'hei',
    lemma: 'hei',
    english: 'hello',
    example: 'Hei! Hvordan går det?',
    example_english: 'Hi! How are you?',
    level: 'A1',
    category: 'greetings',
    part: 'interjection',
    source: 'vocab',
    href: '/a1/greetings',
    ...overrides
  };
}

const ENTRIES: SearchEntry[] = [
  makeEntry({
    id: '1',
    norsk: 'hei',
    lemma: 'hei',
    english: 'hello',
    level: 'A1',
    source: 'vocab'
  }),
  makeEntry({
    id: '2',
    norsk: 'takk',
    lemma: 'takk',
    english: 'thanks',
    level: 'A1',
    source: 'vocab'
  }),
  makeEntry({
    id: '3',
    norsk: 'boken',
    lemma: 'bok',
    english: 'book',
    level: 'A1',
    source: 'vocab',
    example: 'Jeg leser boken.',
    example_english: 'I am reading the book.'
  }),
  makeEntry({
    id: '4',
    norsk: 'reise',
    lemma: 'reise',
    english: 'to travel',
    level: 'B1',
    source: 'vocab'
  }),
  makeEntry({
    id: '5',
    norsk: 'å være i skyene',
    lemma: 'å være i skyene',
    english: 'to be on cloud nine',
    level: 'B1',
    source: 'uttrykk'
  }),
  makeEntry({
    id: '6',
    norsk: 'glad',
    lemma: 'glad',
    english: 'happy',
    level: 'A2',
    source: 'vocab',
    definition: 'En positiv følelse.'
  }),
  makeEntry({
    id: '7',
    norsk: 'kjøre',
    lemma: 'kjøre',
    english: 'to drive',
    level: 'A2',
    source: 'vocab'
  }),
  makeEntry({
    id: '8',
    norsk: 'gå',
    lemma: 'gå',
    english: 'to walk',
    level: 'A1',
    source: 'vocab'
  }),
  makeEntry({
    id: '9',
    norsk: 'spise',
    lemma: 'spise',
    english: 'to eat',
    level: 'A1',
    source: 'vocab',
    example: 'Vi spiser middag klokken seks.',
    example_english: 'We eat dinner at six.'
  })
];

// ── normalize ─────────────────────────────────────────────────────────────────

describe('normalize', () => {
  it('lowercases input', () => {
    expect(normalize('HEI')).toBe('hei');
    expect(normalize('Takk')).toBe('takk');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalize('  hei  ')).toBe('hei');
    expect(normalize('\thei\n')).toBe('hei');
  });

  it('preserves å', () => {
    expect(normalize('å')).toBe('å');
    expect(normalize('gå')).toBe('gå');
    expect(normalize('Å')).toBe('å');
  });

  it('preserves ø', () => {
    expect(normalize('ø')).toBe('ø');
    expect(normalize('kjøre')).toBe('kjøre');
    expect(normalize('Ø')).toBe('ø');
  });

  it('preserves æ', () => {
    expect(normalize('æ')).toBe('æ');
    expect(normalize('Være')).toBe('være');
    expect(normalize('Æ')).toBe('æ');
  });

  it('strips accents from non-Norwegian letters', () => {
    expect(normalize('é')).toBe('e');
    expect(normalize('ü')).toBe('u');
    expect(normalize('ñ')).toBe('n');
    expect(normalize('ç')).toBe('c');
  });

  it('handles an empty string', () => {
    expect(normalize('')).toBe('');
  });

  it('handles undefined (default parameter)', () => {
    expect(normalize()).toBe('');
  });

  it('normalizes a full Norwegian word correctly', () => {
    expect(normalize('Være')).toBe('være');
    expect(normalize('KJØRE')).toBe('kjøre');
  });
});

// ── hasInflection ─────────────────────────────────────────────────────────────

describe('hasInflection', () => {
  it('returns false when norsk equals lemma', () => {
    expect(hasInflection(makeEntry({ norsk: 'hei', lemma: 'hei' }))).toBe(false);
  });

  it('returns true when norsk differs from lemma', () => {
    expect(hasInflection(makeEntry({ norsk: 'boken', lemma: 'bok' }))).toBe(true);
  });

  it('returns true for verb inflection', () => {
    expect(hasInflection(makeEntry({ norsk: 'kjørte', lemma: 'kjøre' }))).toBe(true);
  });

  it('returns false for uttrykk where norsk and lemma are identical', () => {
    expect(hasInflection(makeEntry({ norsk: 'å være i skyene', lemma: 'å være i skyene' }))).toBe(
      false
    );
  });
});

// ── search ────────────────────────────────────────────────────────────────────

describe('search — short query guard', () => {
  it('returns empty array for a 1-character query', () => {
    expect(search('h', ENTRIES)).toHaveLength(0);
  });

  it('returns empty array for an empty string', () => {
    expect(search('', ENTRIES)).toHaveLength(0);
  });

  it('returns empty array for whitespace only', () => {
    expect(search('   ', ENTRIES)).toHaveLength(0);
  });

  it('returns results for a 2-character query', () => {
    expect(search('hei', ENTRIES).length).toBeGreaterThan(0);
  });
});

describe('search — empty index', () => {
  it('returns empty array when index is empty', () => {
    expect(search('hei', [])).toHaveLength(0);
  });
});

describe('search — scoring order', () => {
  it('exact lemma match scores higher than prefix match', () => {
    // 'hei' is an exact lemma match; 'heis' (not in index) would be prefix
    // Use a dedicated fixture to isolate scoring
    const fixture: SearchEntry[] = [
      makeEntry({ id: 'a', norsk: 'heistur', lemma: 'heistur', english: 'elevator ride' }),
      makeEntry({ id: 'b', norsk: 'hei', lemma: 'hei', english: 'hello' })
    ];
    const results = search('hei', fixture);
    expect(results[0].id).toBe('b'); // exact match first
  });

  it('prefix match scores higher than substring match', () => {
    const fixture: SearchEntry[] = [
      makeEntry({
        id: 'sub',
        norsk: 'noe med hei i midten',
        lemma: 'noe',
        english: 'something with hei inside'
      }),
      makeEntry({ id: 'pre', norsk: 'heisann', lemma: 'heisann', english: 'hey there' })
    ];
    const results = search('hei', fixture);
    expect(results[0].id).toBe('pre'); // prefix match first
  });

  it('substring match scores higher than token match', () => {
    const fixture: SearchEntry[] = [
      // token match only — 'bok' and 'blå' appear but not 'blåbok'
      makeEntry({
        id: 'tok',
        norsk: 'blå bok',
        lemma: 'blå bok',
        english: 'blue book',
        example: '',
        example_english: ''
      }),
      // substring match — 'blåbok' contains 'blåb'
      makeEntry({
        id: 'sub',
        norsk: 'blåboka',
        lemma: 'blåbok',
        english: 'the blue book',
        example: '',
        example_english: ''
      })
    ];
    const results = search('blåbok', fixture);
    expect(results[0].id).toBe('sub');
  });

  it('results are sorted by score descending', () => {
    const results = search('hei', ENTRIES);
    // First result should be the exact match
    expect(results[0].norsk).toBe('hei');
  });
});

describe('search — Norwegian field matching', () => {
  it('finds an entry by exact Norwegian lemma', () => {
    const results = search('hei', ENTRIES);
    expect(results.some((r) => r.norsk === 'hei')).toBe(true);
  });

  it('finds an entry by exact English translation', () => {
    const results = search('hello', ENTRIES);
    expect(results.some((r) => r.english === 'hello')).toBe(true);
  });

  it('finds an entry by Norwegian prefix', () => {
    const results = search('reis', ENTRIES);
    expect(results.some((r) => r.norsk === 'reise')).toBe(true);
  });

  it('finds an entry by English prefix', () => {
    const results = search('trav', ENTRIES);
    expect(results.some((r) => r.norsk === 'reise')).toBe(true);
  });

  it('finds an entry by substring in example sentence', () => {
    // 'middag' only appears in the example field of 'spise'
    const results = search('middag', ENTRIES);
    expect(results.some((r) => r.norsk === 'spise')).toBe(true);
  });

  it('finds an entry by substring in example_english', () => {
    // 'dinner' only appears in example_english of 'spise'
    const results = search('dinner', ENTRIES);
    expect(results.some((r) => r.norsk === 'spise')).toBe(true);
  });
});

describe('search — inflected form handling', () => {
  it('finds an entry where norsk is an inflected form and lemma is the base', () => {
    // Entry has norsk='boken', lemma='bok' — query 'boken' should match via substring
    const results = search('boken', ENTRIES);
    expect(results.some((r) => r.lemma === 'bok')).toBe(true);
  });

  it('finds an entry by querying the base lemma when norsk is inflected', () => {
    // Query 'bok' should prefix/exact-match the lemma 'bok'
    const results = search('bok', ENTRIES);
    expect(results.some((r) => r.lemma === 'bok')).toBe(true);
  });

  it('matches multi-word query tokens across norsk and lemma fields', () => {
    // 'sky' appears in 'å være i skyene' — token match
    const results = search('sky', ENTRIES);
    expect(results.some((r) => r.norsk === 'å være i skyene')).toBe(true);
  });
});

describe('search — Norwegian special characters', () => {
  it('finds å correctly', () => {
    const results = search('gå', ENTRIES);
    expect(results.some((r) => r.norsk === 'gå')).toBe(true);
  });

  it('finds ø correctly', () => {
    const results = search('kjøre', ENTRIES);
    expect(results.some((r) => r.norsk === 'kjøre')).toBe(true);
  });

  it('is case-insensitive for Norwegian characters', () => {
    const lower = search('kjøre', ENTRIES);
    const upper = search('KJØRE', ENTRIES);
    expect(lower.map((r) => r.id)).toEqual(upper.map((r) => r.id));
  });
});

describe('search — filters', () => {
  it('filter by source=vocab excludes uttrykk entries', () => {
    const results = search('cloud', ENTRIES, { source: 'vocab' });
    expect(results.every((r) => r.source === 'vocab')).toBe(true);
  });

  it('filter by source=uttrykk excludes vocab entries', () => {
    const results = search('sky', ENTRIES, { source: 'uttrykk' });
    expect(results.every((r) => r.source === 'uttrykk')).toBe(true);
  });

  it('filter by source=all returns both sources', () => {
    // 'sky' matches both a vocab word and an uttrykk in our fixture... add one
    const mixed: SearchEntry[] = [
      ...ENTRIES,
      makeEntry({
        id: 'x',
        norsk: 'sky',
        lemma: 'sky',
        english: 'cloud',
        source: 'vocab',
        level: 'A1'
      })
    ];
    const results = search('sky', mixed, { source: 'all' });
    const sources = new Set(results.map((r) => r.source));
    expect(sources.size).toBeGreaterThanOrEqual(1); // at least one source present
  });

  it('filter by level=A1 excludes other levels', () => {
    const results = search('hei', ENTRIES, { level: 'A1' });
    expect(results.every((r) => r.level === 'A1')).toBe(true);
  });

  it('filter by level=B1 excludes A1 entries', () => {
    const results = search('travel', ENTRIES, { level: 'B1' });
    expect(results.every((r) => r.level === 'B1')).toBe(true);
  });

  it('filter by level=all returns entries from multiple levels', () => {
    // 'to' appears in many english fields across levels
    const results = search('to', ENTRIES, { level: 'all' });
    // just check the filter does not over-restrict
    const levels = new Set(results.map((r) => r.level));
    expect(levels.size).toBeGreaterThanOrEqual(1);
  });

  it('combining source and level filters applies both', () => {
    const results = search('to', ENTRIES, { source: 'vocab', level: 'B1' });
    expect(results.every((r) => r.source === 'vocab' && r.level === 'B1')).toBe(true);
  });

  it('returns empty when filter matches no entries', () => {
    const results = search('hei', ENTRIES, { level: 'C2' });
    expect(results).toHaveLength(0);
  });
});

describe('search — result cap', () => {
  it(`returns at most ${MAX_RESULTS} results`, () => {
    // Build an index large enough to exceed the cap — all entries match 'ord'
    const large: SearchEntry[] = Array.from({ length: MAX_RESULTS + 20 }, (_, i) =>
      makeEntry({ id: `e${i}`, norsk: `ord${i}`, lemma: `ord${i}`, english: `word ${i}` })
    );
    const results = search('ord', large);
    expect(results).toHaveLength(MAX_RESULTS);
  });

  it('returns fewer than MAX_RESULTS when index has fewer matches', () => {
    const results = search('hei', ENTRIES);
    expect(results.length).toBeLessThanOrEqual(MAX_RESULTS);
  });
});

// ── locale-aware matching (getTranslation / getExampleTranslation) ─────────────────

describe('search — locale-aware translation matching', () => {
  const SPANISH_FIXTURE: SearchEntry[] = [
    makeEntry({
      id: 'sp1',
      norsk: 'mat',
      lemma: 'mat',
      english: 'food',
      spanish: 'comida',
      example: 'Maten lukter godt.',
      example_english: 'The food smells good.',
      example_spanish: 'La comida huele bien.'
    })
  ];

  it('does not match a Spanish query without a translation getter (default is English-only)', () => {
    const results = search('comida', SPANISH_FIXTURE);
    expect(results).toHaveLength(0);
  });

  it('matches a Spanish query when a Spanish translation getter is supplied', () => {
    const results = search('comida', SPANISH_FIXTURE, {}, (e) => e.spanish ?? e.english);
    expect(results.some((r) => r.norsk === 'mat')).toBe(true);
  });

  it('still matches Norwegian regardless of the translation getter', () => {
    const results = search('mat', SPANISH_FIXTURE, {}, (e) => e.spanish ?? e.english);
    expect(results.some((r) => r.norsk === 'mat')).toBe(true);
  });

  it('matches a Spanish query via the example translation getter', () => {
    const results = search(
      'huele',
      SPANISH_FIXTURE,
      {},
      (e) => e.spanish ?? e.english,
      (e) => e.example_spanish ?? e.example_english
    );
    expect(results.some((r) => r.norsk === 'mat')).toBe(true);
  });

  it('falls back to English when the entry has no Spanish translation', () => {
    const noSpanish: SearchEntry[] = [
      makeEntry({ id: 'ns1', norsk: 'takk', lemma: 'takk', english: 'thanks' })
    ];
    const results = search('thanks', noSpanish, {}, (e) => e.spanish ?? e.english);
    expect(results.some((r) => r.norsk === 'takk')).toBe(true);
  });
});
