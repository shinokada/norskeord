// src/lib/free-tier-policy.test.ts
// Guard for the free-tier policy in data-rules/free-items.md and
// ai-docs/implementation/free-tier-simplification.md: A1 is free in full; every
// higher level has exactly 3 free vocab categories, and Quiz matches Vocab.

import { describe, it, expect } from 'vitest';
import {
  CATEGORIES_BY_LEVEL,
  FREE_VOCAB_CATEGORIES,
  FREE_QUIZ_CATEGORIES,
  PLUS_CATEGORIES
} from './config';
import { isPlusCategory, isFreeQuizCategory } from './access';
import type { CEFRLevel } from './types';

const GATED_LEVELS = ['A2', 'B1', 'B2', 'C'] as const satisfies readonly CEFRLevel[];

// Test-owned copy of the documented free set (data-rules/free-items.md). It is
// deliberately NOT derived from config: PLUS_CATEGORIES and FREE_QUIZ_CATEGORIES
// are generated from FREE_VOCAB_CATEGORIES, so without this the other tests
// would still pass if a free slug were swapped for another valid one. Changing
// the free policy on purpose means updating this list and free-items.md too.
const EXPECTED_FREE_VOCAB = {
  A2: ['money', 'clothing', 'weather'],
  B1: ['travel', 'environment', 'technology'],
  B2: ['discourse-markers', 'science', 'literature'],
  C: ['academic', 'architecture-design', 'character-types']
} as const satisfies Record<(typeof GATED_LEVELS)[number], readonly string[]>;

describe('free vocab categories', () => {
  for (const level of GATED_LEVELS) {
    it(`${level} free categories are exactly the documented ones`, () => {
      expect([...FREE_VOCAB_CATEGORIES[level]].sort()).toEqual(
        [...EXPECTED_FREE_VOCAB[level]].sort()
      );
    });

    it(`${level} has exactly 3 free categories, all real and distinct`, () => {
      const free = FREE_VOCAB_CATEGORIES[level];
      expect(free).toHaveLength(3);
      expect(new Set(free).size).toBe(3);
      const real = new Set<string>(CATEGORIES_BY_LEVEL[level]);
      for (const cat of free) {
        expect(real.has(cat), `"${cat}" is not a ${level} category`).toBe(true);
      }
    });

    it(`${level}: every category except the free 3 and uttrykk is Plus`, () => {
      for (const cat of CATEGORIES_BY_LEVEL[level]) {
        if (cat === 'uttrykk') continue; // gated per theme, see uttrykk-gating.ts
        const expectPlus = !FREE_VOCAB_CATEGORIES[level].includes(cat);
        expect(isPlusCategory(level, cat), `${level}/${cat}`).toBe(expectPlus);
      }
    });
  }

  it('A1 has no Plus categories', () => {
    const a1Plus = [...PLUS_CATEGORIES].filter((key) => key.startsWith('a1/'));
    expect(a1Plus).toEqual([]);
  });

  it('every Plus key refers to a real category', () => {
    for (const key of PLUS_CATEGORIES) {
      const [level, ...rest] = key.split('/');
      const cat = rest.join('/');
      const real = CATEGORIES_BY_LEVEL[level.toUpperCase() as CEFRLevel] as readonly string[];
      expect(real.includes(cat), `${key} is not in CATEGORIES_BY_LEVEL`).toBe(true);
    }
  });
});

describe('free quiz categories', () => {
  it('covers every A1 category', () => {
    for (const cat of CATEGORIES_BY_LEVEL.A1) {
      expect(isFreeQuizCategory('A1', cat), `a1/${cat}`).toBe(true);
    }
  });

  for (const level of GATED_LEVELS) {
    it(`${level}: the free quiz set equals the free vocab set`, () => {
      const quiz = [...FREE_QUIZ_CATEGORIES]
        .filter((key) => key.startsWith(`${level.toLowerCase()}/`))
        .map((key) => key.slice(level.length + 1))
        .sort();
      expect(quiz).toEqual([...FREE_VOCAB_CATEGORIES[level]].sort());
    });
  }
});
