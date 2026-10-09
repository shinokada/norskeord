import { describe, it, expect } from 'vitest';
import { buildSearchEntries } from './search-index';

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
});
