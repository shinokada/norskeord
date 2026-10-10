import { describe, it, expect } from 'vitest';
import { buildSearchEntries, hrefFor } from './search-index';

describe('hrefFor', () => {
  it('opens the category deck for vocab at every level', () => {
    expect(hrefFor('vocab', 'A1', 'school')).toBe('/a1/school');
    expect(hrefFor('vocab', 'C', 'school')).toBe('/c/school');
  });

  it('opens the uttrykk page filtered by theme for A1–B2 expressions', () => {
    expect(hrefFor('uttrykk', 'A1', 'greetings')).toBe('/a1/uttrykk?theme=greetings');
    expect(hrefFor('uttrykk', 'B2', 'work')).toBe('/b2/uttrykk?theme=work');
  });

  it('opens the merged category page for C expressions', () => {
    expect(hrefFor('uttrykk', 'C', 'interpersonal-conflict')).toBe(
      '/c/interpersonal-conflict?from=uttrykk'
    );
  });
});

describe('buildSearchEntries', () => {
  const rows = [
    {
      id: 'w-000001',
      norsk: 'boken',
      lemma: 'bok',
      english: 'book',
      spanish: 'libro',
      example: 'Jeg leser boken.',
      example_english: 'I am reading the book.',
      definition: 'Noe man leser.',
      level: 'A1',
      category: 'school',
      part: 'noun'
    },
    { norsk: 'takk', level: 'A1', category: 'greetings' }
  ];

  it('maps rows to SearchEntry with the same fields the old index builder produced', () => {
    const [first] = buildSearchEntries([{ source: 'vocab', rows }]);
    expect(first).toMatchObject({
      entryId: 'w-000001',
      norsk: 'boken',
      lemma: 'bok',
      english: 'book',
      spanish: 'libro',
      example: 'Jeg leser boken.',
      example_english: 'I am reading the book.',
      definition: 'Noe man leser.',
      level: 'A1',
      category: 'school',
      part: 'noun',
      source: 'vocab',
      href: '/a1/school'
    });
  });

  it('defaults missing strings and falls back lemma to norsk', () => {
    const second = buildSearchEntries([{ source: 'vocab', rows }])[1];
    expect(second.lemma).toBe('takk');
    expect(second.english).toBe('');
    expect(second.example).toBe('');
    expect(second.entryId).toBeUndefined();
  });

  it('ignores non-string values', () => {
    const [e] = buildSearchEntries([
      { source: 'uttrykk', rows: [{ norsk: 'x', english: 5, level: 'B1', category: 'c' }] }
    ]);
    expect(e.english).toBe('');
  });

  it('keeps the source per file and gives every entry a unique id', () => {
    const index = buildSearchEntries([
      { source: 'vocab', rows },
      { source: 'uttrykk', rows }
    ]);
    expect(index).toHaveLength(4);
    expect(index.map((e) => e.source)).toEqual(['vocab', 'vocab', 'uttrykk', 'uttrykk']);
    expect(new Set(index.map((e) => e.id)).size).toBe(4);
  });

  it('returns an empty index for no files', () => {
    expect(buildSearchEntries([])).toEqual([]);
  });

  it('gives expression entries the uttrykk route and vocab entries the category route', () => {
    const index = buildSearchEntries([
      { source: 'vocab', rows: [{ norsk: 'bok', level: 'A1', category: 'school' }] },
      { source: 'uttrykk', rows: [{ norsk: 'hei', level: 'A1', category: 'greetings' }] },
      { source: 'uttrykk', rows: [{ norsk: 'x', level: 'C', category: 'idioms' }] }
    ]);
    expect(index.map((e) => e.href)).toEqual([
      '/a1/school',
      '/a1/uttrykk?theme=greetings',
      '/c/idioms?from=uttrykk'
    ]);
  });
});
