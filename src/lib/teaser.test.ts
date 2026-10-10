import { describe, it, expect } from 'vitest';
import { buildTeaser } from './teaser';
import type { VocabEntry } from './types';

const entry = (norsk: string): VocabEntry =>
  ({
    id: `id-${norsk}`,
    norsk,
    english: `secret-english-${norsk}`,
    example: `secret-example-${norsk}`,
    example_english: 'secret',
    level: 'A2',
    category: 'transport',
    part: 'noun'
  }) as VocabEntry;

describe('buildTeaser', () => {
  it('returns null for an empty category', () => {
    expect(buildTeaser([])).toBeNull();
  });

  it('returns null when the first entry has no word', () => {
    expect(buildTeaser([{ norsk: '' }])).toBeNull();
  });

  it('uses the first entry and the full count', () => {
    expect(buildTeaser([entry('bil'), entry('buss'), entry('tog')])).toEqual({
      totalCount: 3,
      front: 'bil'
    });
  });

  it('carries nothing but the front and the count', () => {
    const teaser = buildTeaser([entry('bil'), entry('buss')]);
    expect(Object.keys(teaser ?? {}).sort()).toEqual(['front', 'totalCount']);
    const json = JSON.stringify(teaser);
    expect(json).not.toContain('secret');
    expect(json).not.toContain('buss');
  });
});
