import { describe, it, expect } from 'vitest';
import { createEmptyCard, State } from 'ts-fsrs';
import {
  vocabCategoryStatsForLevel,
  uttrykkThemeStatsForLevel,
  grammarTopicStatsForLevel
} from './stats';
import { CATEGORIES_BY_LEVEL } from '$lib/config';
import { GRAMMAR_RULES } from '$lib/grammar/rules';
import type { CardProgress, GrammarQuestion, GrammarTopic } from '$lib/types';
import grammarData from '$lib/data/grammar.json';

function fakeCard(
  overrides: Partial<Omit<CardProgress, 'category'>> & { category?: string } = {}
): CardProgress {
  const fsrs = createEmptyCard();
  return {
    fsrs: { ...fsrs, state: State.Review, due: new Date(Date.now() - 86_400_000) },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    level: 'A1',
    category: 'greetings',
    ...overrides
  } as CardProgress;
}

describe('vocabCategoryStatsForLevel', () => {
  it('returns one row per real A1 category, excluding uttrykk', () => {
    const rows = vocabCategoryStatsForLevel('A1', {});
    const keys = rows.map((r) => r.key);
    expect(keys).not.toContain('uttrykk');
    expect(keys.sort()).toEqual(CATEGORIES_BY_LEVEL.A1.filter((c) => c !== 'uttrykk').sort());
  });

  it('counts a seen card under its own category and level only', () => {
    const progressMap = {
      'v-a1-greetings-001': fakeCard({ level: 'A1', category: 'greetings' })
    };
    const rows = vocabCategoryStatsForLevel('A1', progressMap);
    const greetings = rows.find((r) => r.key === 'greetings')!;
    const numbers = rows.find((r) => r.key === 'numbers')!;
    expect(greetings.seen).toBe(1);
    expect(greetings.review).toBe(1);
    expect(numbers.seen).toBe(0);
  });

  it('does not leak B1 progress into the A1 breakdown', () => {
    const progressMap = {
      'v-b1-travel-001': fakeCard({ level: 'B1', category: 'travel' })
    };
    const rows = vocabCategoryStatsForLevel('A1', progressMap);
    expect(rows.every((r) => r.seen === 0)).toBe(true);
  });
});

describe('uttrykkThemeStatsForLevel', () => {
  it('only counts cards tagged category "uttrykk" for A1–B2', () => {
    const progressMap = {
      'u-a1-001': fakeCard({ level: 'A1', category: 'uttrykk' }),
      'v-a1-greetings-001': fakeCard({ level: 'A1', category: 'greetings' })
    };
    const rows = uttrykkThemeStatsForLevel('A1', progressMap);
    const totalSeen = rows.reduce((s, r) => s + r.seen, 0);
    expect(totalSeen).toBe(1);
  });

  it('returns rows for C from real category slugs, not a theme field', () => {
    const rows = uttrykkThemeStatsForLevel('C', {});
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => typeof r.key === 'string' && r.key.length > 0)).toBe(true);
  });
});

describe('grammarTopicStatsForLevel', () => {
  const allQuestions = grammarData as GrammarQuestion[];

  it('only includes topics that have at least one question at this level', () => {
    const rows = grammarTopicStatsForLevel('A2', {}, false);
    const a2TopicsInData = new Set(allQuestions.filter((q) => q.cefr === 'A2').map((q) => q.topic));
    expect(a2TopicsInData.size).toBeGreaterThan(0);
    expect(rows.length).toBe(a2TopicsInData.size);
    for (const row of rows) {
      expect(a2TopicsInData.has(row.key as GrammarTopic)).toBe(true);
    }
  });

  it('only includes topics that have at least one question at this level (A1)', () => {
    const rows = grammarTopicStatsForLevel('A1', {}, false);
    const a1TopicsInData = new Set(allQuestions.filter((q) => q.cefr === 'A1').map((q) => q.topic));
    expect(a1TopicsInData.size).toBeGreaterThan(0);
    expect(rows.length).toBe(a1TopicsInData.size);
    for (const row of rows) {
      expect(a1TopicsInData.has(row.key as GrammarTopic)).toBe(true);
    }
  });

  it('never shows a C-only topic under a non-C level', () => {
    const cOnlyTopic = allQuestions.find((q) => q.cefr === 'C')?.topic;
    expect(cOnlyTopic).toBeTruthy();
    const rows = grammarTopicStatsForLevel('A2', {}, false);
    expect(rows.some((r) => r.key === cOnlyTopic)).toBe(false);
  });

  it('forces Norwegian titles for C regardless of isNb', () => {
    const rows = grammarTopicStatsForLevel('C', {}, false);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const rule = GRAMMAR_RULES[row.key as GrammarTopic];
      expect(row.label).toBe(rule.titleNb);
    }
  });

  it('counts a practiced grammar card under its topic and level', () => {
    const someA2 = allQuestions.find((q) => q.cefr === 'A2')!;
    expect(someA2).toBeDefined();
    const grammarMap = {
      [someA2.id]: fakeCard({ level: 'A2', category: someA2.topic })
    };
    const rows = grammarTopicStatsForLevel('A2', grammarMap, false);
    const row = rows.find((r) => r.key === someA2.topic)!;
    expect(row.seen).toBe(1);
  });
});
