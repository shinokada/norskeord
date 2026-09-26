import { describe, it, expect } from 'vitest';
import { resolveEntry } from './content-lookup';
import vocabA1 from '$lib/data/vocab-a1.json';
import uttrykkA1 from '$lib/data/uttrykk-a1.json';
import uttrykkC from '$lib/data/uttrykk-c.json';

describe('resolveEntry', () => {
  it('resolves a vocab entry to its current level/category with type "vocab"', () => {
    const entry = (vocabA1 as { id: string; category: string }[])[0];
    const resolved = resolveEntry(entry.id);
    expect(resolved).toEqual({ level: 'A1', category: entry.category, type: 'vocab' });
  });

  it('resolves an A1–B2 uttrykk entry with its real category', () => {
    const entry = (uttrykkA1 as { id: string; category: string }[])[0];
    const resolved = resolveEntry(entry.id);
    expect(resolved).toEqual({
      level: 'A1',
      category: entry.category,
      type: 'uttrykk'
    });
  });

  it('resolves a C-level uttrykk entry with its real category', () => {
    const entry = (uttrykkC as { id: string; category: string }[])[0];
    const resolved = resolveEntry(entry.id);
    expect(resolved).toEqual({ level: 'C', category: entry.category, type: 'uttrykk' });
  });

  it('returns undefined for an id that does not exist anywhere in content', () => {
    expect(resolveEntry('w-999999-does-not-exist')).toBeUndefined();
  });
});
