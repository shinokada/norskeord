import { describe, it, expect } from 'vitest';
import { createEmptyCard, State, type Card } from 'ts-fsrs';
import {
  vocabCategoryStatsForLevel,
  uttrykkThemeStatsForLevel,
  grammarTopicStatsForLevel,
  buildReviewHref,
  uttrykkOthersKeysForLevel,
  type StatRow
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
    // reps: 3 clears LEARNING_REPS_THRESHOLD in stats.ts's progressBucket(),
    // so a plain fakeCard() reads as a genuinely "reviewed" (not "learning")
    // card by default — individual tests below override reps/lastRating to
    // exercise the other buckets.
    fsrs: { ...fsrs, state: State.Review, reps: 3, due: new Date(Date.now() - 86_400_000) },
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

describe('progressBucket via vocabCategoryStatsForLevel (learning/review/relearning)', () => {
  // enable_short_term:false (progress.ts) means saveProgress sends nearly
  // every card straight to State.Review, so these buckets are approximated
  // from reps/lastRating rather than trusted from raw FSRS state alone —
  // see progressBucket() in stats.ts.
  it('buckets a low-rep card as learning even though its FSRS state is Review', () => {
    const progressMap = {
      'v-a1-greetings-001': fakeCard({
        fsrs: { ...createEmptyCard(), state: State.Review, reps: 1 } as Card
      })
    };
    const rows = vocabCategoryStatsForLevel('A1', progressMap);
    const greetings = rows.find((r) => r.key === 'greetings')!;
    expect(greetings.learning).toBe(1);
    expect(greetings.review).toBe(0);
    expect(greetings.relearning).toBe(0);
  });

  it('buckets a card just rated "again" as relearning even though its FSRS state is Review', () => {
    const progressMap = {
      'v-a1-greetings-001': fakeCard({
        fsrs: { ...createEmptyCard(), state: State.Review, reps: 5 } as Card,
        lastRating: 'again'
      })
    };
    const rows = vocabCategoryStatsForLevel('A1', progressMap);
    const greetings = rows.find((r) => r.key === 'greetings')!;
    expect(greetings.relearning).toBe(1);
    expect(greetings.review).toBe(0);
    expect(greetings.learning).toBe(0);
  });

  it('buckets a card past the reps threshold with a non-"again" last rating as review', () => {
    const progressMap = {
      'v-a1-greetings-001': fakeCard({
        fsrs: { ...createEmptyCard(), state: State.Review, reps: 3 } as Card,
        lastRating: 'hard'
      })
    };
    const rows = vocabCategoryStatsForLevel('A1', progressMap);
    const greetings = rows.find((r) => r.key === 'greetings')!;
    expect(greetings.review).toBe(1);
    expect(greetings.learning).toBe(0);
    expect(greetings.relearning).toBe(0);
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

describe('uttrykkOthersKeysForLevel', () => {
  it('returns theme names that also appear as an "others" row in uttrykkThemeStatsForLevel', () => {
    // Any theme this returns for A1 should be one of the minor themes rolled
    // into uttrykkThemeStatsForLevel's Others row (or the level has no
    // Others row at all, if every theme clears the threshold) — cross-check
    // against that function instead of hardcoding a specific theme name,
    // since the fixture data can change.
    const rows = uttrykkThemeStatsForLevel('A1', {});
    const othersRow = rows.find((r) => r.key === 'others');
    const keys = uttrykkOthersKeysForLevel('A1');
    if (!othersRow) {
      expect(keys.size).toBe(0);
    } else {
      expect(keys.size).toBeGreaterThan(0);
    }
  });

  it('returns category slugs (not theme names) for C', () => {
    const keys = uttrykkOthersKeysForLevel('C');
    // C has no `theme` field at all — whatever comes back must line up with
    // uttrykkThemeStatsForLevel('C', {})'s own Others row, same as above.
    const rows = uttrykkThemeStatsForLevel('C', {});
    const othersRow = rows.find((r) => r.key === 'others');
    if (!othersRow) {
      expect(keys.size).toBe(0);
    } else {
      expect(keys.size).toBeGreaterThan(0);
    }
  });
});

describe('buildReviewHref', () => {
  function makeRow(overrides: Partial<StatRow> = {}): StatRow {
    return {
      key: 'greetings',
      label: 'Greetings',
      href: '/a1/greetings',
      total: 10,
      seen: 0,
      review: 0,
      learning: 0,
      relearning: 0,
      due: 3,
      ...overrides
    };
  }

  it('returns null when reviewType is not set', () => {
    expect(buildReviewHref(makeRow(), 'A1', undefined)).toBeNull();
  });

  it('returns null when level is not set', () => {
    expect(buildReviewHref(makeRow(), undefined, 'vocab')).toBeNull();
  });

  it('builds a category=others href for the synthetic "Others" row, same as any other row', () => {
    const row = makeRow({ key: 'others' });
    expect(buildReviewHref(row, 'A1', 'uttrykk')).toBe(
      '/review?level=a1&type=uttrykk&category=others'
    );
  });

  it('builds a vocab href with level, type, and category', () => {
    const href = buildReviewHref(makeRow({ key: 'greetings' }), 'A1', 'vocab');
    expect(href).toBe('/review?level=a1&type=vocab&category=greetings');
  });

  it('builds an uttrykk href the same way as vocab (category param, not theme)', () => {
    // Fix 2: reviewHref always includes &category=, even for A1–B2 uttrykk
    // rows keyed by theme — /review itself handles the theme fallback
    // downstream (see loadSession() in /review/+page.svelte).
    const href = buildReviewHref(makeRow({ key: 'travel' }), 'A2', 'uttrykk');
    expect(href).toBe('/review?level=a2&type=uttrykk&category=travel');
  });

  it('builds a grammar href pointing at /review/grammar with a topic param, not /review', () => {
    const href = buildReviewHref(makeRow({ key: 'ikke-placement' }), 'A2', 'grammar');
    expect(href).toBe('/review/grammar?level=a2&topic=ikke-placement');
  });

  it('lowercases the level in the href regardless of input casing', () => {
    // CEFRLevel values are always uppercase (e.g. 'B1'), but the URL uses
    // lowercase — this pins that down explicitly.
    const href = buildReviewHref(makeRow(), 'B1', 'vocab');
    expect(href).toContain('level=b1');
  });

  it('URL-encodes a row key with special characters', () => {
    const href = buildReviewHref(makeRow({ key: 'a b&c' }), 'A1', 'vocab');
    expect(href).toBe('/review?level=a1&type=vocab&category=a%20b%26c');
  });
});
