import { describe, expect, it } from 'vitest';
import { isPlusOnlyEntry } from './access';
import { CATEGORIES_BY_LEVEL, FREE_VOCAB_CATEGORIES } from './config';

// isPlusOnlyEntry is what /api/review-entries uses to keep free users from
// reviewing (or fetching) cards in categories they can't open — see
// ai-docs/implementation/free-tier-simplification.md, Phase 0.

describe('isPlusOnlyEntry', () => {
  it('never locks A1, vocab or uttrykk', () => {
    for (const cat of CATEGORIES_BY_LEVEL.A1) {
      expect(isPlusOnlyEntry('A1', cat, 'vocab'), `a1/${cat} vocab`).toBe(false);
    }
    expect(isPlusOnlyEntry('A1', 'greetings', 'uttrykk')).toBe(false);
    expect(isPlusOnlyEntry('A1', 'classroom', 'uttrykk')).toBe(false);
  });

  it('keeps the 3 free vocab categories per level open and locks the rest', () => {
    for (const level of ['A2', 'B1', 'B2', 'C'] as const) {
      for (const cat of CATEGORIES_BY_LEVEL[level]) {
        if (cat === 'uttrykk') continue;
        const free = FREE_VOCAB_CATEGORIES[level].includes(cat);
        expect(isPlusOnlyEntry(level, cat, 'vocab'), `${level}/${cat}`).toBe(!free);
      }
    }
  });

  it('locks a category that used to be free (A2 animals, B1 media)', () => {
    expect(isPlusOnlyEntry('A2', 'animals', 'vocab')).toBe(true);
    expect(isPlusOnlyEntry('B1', 'media', 'vocab')).toBe(true);
  });

  it('locks every A2 to B2 uttrykk entry, even in a category that is free as vocab', () => {
    // discourse-markers is a free B2 vocab category, but B2 uttrykk is Plus-only.
    expect(isPlusOnlyEntry('B2', 'discourse-markers', 'vocab')).toBe(false);
    expect(isPlusOnlyEntry('B2', 'discourse-markers', 'uttrykk')).toBe(true);
    expect(isPlusOnlyEntry('A2', 'idioms', 'uttrykk')).toBe(true);
    expect(isPlusOnlyEntry('B1', 'proverbs', 'uttrykk')).toBe(true);
  });

  it('locks C uttrykk in a Plus category', () => {
    // C idioms follow the vocab category lock. Whether idioms inside the 3
    // free C categories should also be free is an open item in the plan.
    expect(isPlusOnlyEntry('C', 'philosophy', 'uttrykk')).toBe(true);
  });
});
