import { describe, it, expect } from 'vitest';
import { resolveTargetEntry } from './deck-target';
import type { VocabEntry } from '$lib/types';

function entry(overrides: Partial<VocabEntry>): VocabEntry {
  return {
    id: 'w-000001',
    norsk: 'bank (en)',
    english: 'bank',
    example: 'Jeg g\u00e5r til banken.',
    example_english: 'I go to the bank.',
    level: 'A2',
    category: 'shopping',
    part: 'noun',
    ...overrides
  };
}

const money = entry({ id: 'w-000001', norsk: 'bank (en)', sense: 'money', english: 'bank' });
const bench = entry({ id: 'w-000002', norsk: 'bank (en)', sense: 'bench', english: 'bench' });
const other = entry({ id: 'w-000003', norsk: 'hus (et)', english: 'house' });
const source = [money, bench, other];

describe('resolveTargetEntry', () => {
  it('resolves by id, picking the right sibling', () => {
    expect(resolveTargetEntry(source, { id: 'w-000002', word: 'bank (en)' })).toBe(bench);
    expect(resolveTargetEntry(source, { id: 'w-000001' })).toBe(money);
  });

  it('id wins over word when they point at different entries', () => {
    expect(resolveTargetEntry(source, { id: 'w-000003', word: 'bank (en)' })).toBe(other);
  });

  it('falls back to word when there is no id (old links)', () => {
    expect(resolveTargetEntry(source, { word: 'hus (et)' })).toBe(other);
    expect(resolveTargetEntry(source, { id: null, word: 'hus (et)' })).toBe(other);
  });

  it('word alone opens the first sibling', () => {
    expect(resolveTargetEntry(source, { word: 'bank (en)' })).toBe(money);
  });

  it('treats an empty or whitespace id as absent', () => {
    expect(resolveTargetEntry(source, { id: '', word: 'hus (et)' })).toBe(other);
    expect(resolveTargetEntry(source, { id: '   ', word: 'hus (et)' })).toBe(other);
  });

  it('does not fall back to word when the id is not in the source', () => {
    // e.g. the entry is filtered out of the current mode: showing another sense would mislead
    expect(resolveTargetEntry(source, { id: 'w-999999', word: 'bank (en)' })).toBeUndefined();
  });

  it('returns undefined when neither id nor word is given or matches', () => {
    expect(resolveTargetEntry(source, {})).toBeUndefined();
    expect(resolveTargetEntry(source, { word: 'nope' })).toBeUndefined();
    expect(resolveTargetEntry([], { id: 'w-000001' })).toBeUndefined();
  });
});
