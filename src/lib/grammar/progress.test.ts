// src/lib/grammar/progress.test.ts
// Phase 3 (grammar-update.md): derived grammar progress. Fixtures use real
// question ids from grammar.json because every card is resolved live by id.

import { describe, it, expect } from 'vitest';
import { createEmptyCard, State } from 'ts-fsrs';
import grammarData from '$lib/data/grammar.json';
import type { CardProgress, CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import {
  buildGrammarProgress,
  weakSpots,
  isLevelReached,
  estimateGrammarLevel,
  LEVEL_MASTERED_SHARE,
  LEVEL_MIN_SEEN,
  type LevelProgress,
  type ProgressCounts
} from './progress';

const questions = grammarData as GrammarQuestion[];
const DAY = 86_400_000;

function qsOf(topic: GrammarTopic, n: number): GrammarQuestion[] {
  const found = questions.filter((q) => q.topic === topic).slice(0, n);
  expect(found.length).toBe(n);
  return found;
}

function card(
  opts: {
    reps?: number;
    lapses?: number;
    lastRating?: CardProgress['lastRating'];
    dueInMs?: number;
    level?: string;
    category?: string;
  } = {}
): CardProgress {
  const { reps = 3, lapses = 0, lastRating, dueInMs = -DAY, level = 'A1', category = 'x' } = opts;
  return {
    fsrs: {
      ...createEmptyCard(),
      state: State.Review,
      reps,
      lapses,
      due: new Date(Date.now() + dueInMs)
    },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    lastRating,
    level,
    category
  } as unknown as CardProgress;
}

function mapOf(entries: [GrammarQuestion, CardProgress][]): Record<string, CardProgress> {
  return Object.fromEntries(entries.map(([q, c]) => [q.id, c]));
}

const sumKeys = (items: ProgressCounts[]): ProgressCounts =>
  items.reduce(
    (a, c) => ({
      total: a.total + c.total,
      seen: a.seen + c.seen,
      review: a.review + c.review,
      learning: a.learning + c.learning,
      relearning: a.relearning + c.relearning,
      due: a.due + c.due
    }),
    { total: 0, seen: 0, review: 0, learning: 0, relearning: 0, due: 0 }
  );

const countsOf = (c: ProgressCounts): ProgressCounts => ({
  total: c.total,
  seen: c.seen,
  review: c.review,
  learning: c.learning,
  relearning: c.relearning,
  due: c.due
});

describe('buildGrammarProgress', () => {
  it('totals every question exactly once across the taxonomy', () => {
    const p = buildGrammarProgress({});
    expect(p.overall.total).toBe(questions.length);
    expect(p.overall.seen).toBe(0);
  });

  it('resolves a card to its CURRENT topic, ignoring a retired stored topic id', () => {
    const [q] = qsOf('sporresetninger', 1);
    const p = buildGrammarProgress(mapOf([[q, card({ category: 'helsetninger', level: 'C' })]]));
    expect(p.byTopic.get('sporresetninger')!.seen).toBe(1);
    expect([...p.byTopic.keys()] as string[]).not.toContain('helsetninger');
    expect(p.overall.seen).toBe(1);
  });

  it('drops ids that no longer exist in grammar.json', () => {
    const p = buildGrammarProgress({ 'gone-question-id': card() });
    expect(p.overall.seen).toBe(0);
  });

  it('buckets review / learning / relearning and counts due cards', () => {
    const qs = qsOf('ikke-placement', 4);
    const p = buildGrammarProgress(
      mapOf([
        [qs[0], card({ reps: 5, lastRating: 'good' })], // review, due
        [qs[1], card({ reps: 1 })], // learning, due
        [qs[2], card({ reps: 5, lastRating: 'again' })], // relearning, due
        [qs[3], card({ reps: 5, lastRating: 'good', dueInMs: 3 * DAY })] // review, not due
      ])
    );
    const t = p.byTopic.get('ikke-placement')!;
    expect(t.seen).toBe(4);
    expect(t.review).toBe(2);
    expect(t.learning).toBe(1);
    expect(t.relearning).toBe(1);
    expect(t.due).toBe(3);
  });

  it('rolls up consistently: topics -> sections -> chapters -> parts -> overall', () => {
    const picks: GrammarTopic[] = [
      'sporresetninger',
      'ikke-placement',
      'uttrykk',
      'vaer-det-subjekt'
    ];
    const entries = picks.flatMap((t, i) =>
      qsOf(t, 2).map((q, j): [GrammarQuestion, CardProgress] => [
        q,
        card({ reps: i + j, lastRating: j ? 'again' : 'good' })
      ])
    );
    const p = buildGrammarProgress(mapOf(entries));

    for (const part of p.parts) {
      for (const chapter of part.chapters) {
        for (const section of chapter.sections) {
          expect(countsOf(section)).toEqual(sumKeys(section.topics));
        }
        expect(countsOf(chapter)).toEqual(sumKeys(chapter.sections));
      }
      expect(countsOf(part)).toEqual(sumKeys(part.chapters));
    }
    expect(p.overall).toEqual(sumKeys(p.parts));
    expect(p.overall.seen).toBe(entries.length);
  });

  it('computes per-level progress from each question\u2019s live level, not the stored one', () => {
    const a1 = questions.find((q) => q.cefr === 'A1')!;
    const p = buildGrammarProgress(mapOf([[a1, card({ level: 'C' })]]));
    expect(p.byLevel.A1.seen).toBe(1);
    expect(p.byLevel.A1.review).toBe(1);
    expect(p.byLevel.A1.due).toBe(1);
    expect(p.byLevel.C.seen).toBe(0);
    expect(p.byLevel.A1.total).toBe(questions.filter((q) => q.cefr === 'A1').length);
  });
});

describe('weakSpots', () => {
  const a = qsOf('sporresetninger', 2);
  const b = qsOf('ikke-placement', 1);
  const c = qsOf('uttrykk', 1);
  const d = qsOf('vaer-det-subjekt', 1);

  const progress = buildGrammarProgress(
    mapOf([
      [a[0], card({ lastRating: 'again' })], // sporresetninger: 2 relearning
      [a[1], card({ lastRating: 'again' })],
      [b[0], card({ lastRating: 'again', lapses: 5 })], // ikke-placement: 1 relearning, 5 lapses
      [c[0], card({ lastRating: 'good', lapses: 3 })], // uttrykk: 0 relearning, 3 lapses
      [d[0], card({ lastRating: 'good' })] // clean
    ])
  );

  it('ranks by relearning, then lapses, and omits clean topics', () => {
    const spots = weakSpots(progress, 10);
    expect(spots.map((s) => s.topic)).toEqual(['sporresetninger', 'ikke-placement', 'uttrykk']);
  });

  it('links each weak spot to its rule page and respects n', () => {
    const spots = weakSpots(progress, 2);
    expect(spots).toHaveLength(2);
    expect(spots[0].href).toBe('/grammar/sporresetninger');
  });

  it('returns nothing when there is no struggle', () => {
    expect(weakSpots(buildGrammarProgress({}))).toEqual([]);
  });
});

describe('level estimate', () => {
  const lvl = (total: number, seen: number, review: number): LevelProgress => ({
    total,
    seen,
    review,
    due: 0
  });
  const levels = (
    o: Partial<Record<CEFRLevel, LevelProgress>>
  ): Record<CEFRLevel, LevelProgress> => ({
    A1: lvl(100, 0, 0),
    A2: lvl(100, 0, 0),
    B1: lvl(100, 0, 0),
    B2: lvl(100, 0, 0),
    C: lvl(100, 0, 0),
    ...o
  });

  it('needs both the mastered share and the minimum seen count', () => {
    const need = Math.ceil(100 * LEVEL_MASTERED_SHARE);
    expect(isLevelReached(lvl(100, need, need))).toBe(true);
    expect(isLevelReached(lvl(100, need, need - 1))).toBe(false);
    // Share met but too few seen (tiny level).
    expect(isLevelReached(lvl(LEVEL_MIN_SEEN - 1, LEVEL_MIN_SEEN - 1, LEVEL_MIN_SEEN - 1))).toBe(
      false
    );
    expect(isLevelReached(lvl(0, 0, 0))).toBe(false);
  });

  it('returns the highest level whose lower levels are all reached', () => {
    expect(estimateGrammarLevel(levels({}))).toBeNull();
    expect(estimateGrammarLevel(levels({ A1: lvl(100, 90, 80) }))).toBe('A1');
    expect(estimateGrammarLevel(levels({ A1: lvl(100, 90, 80), A2: lvl(100, 90, 75) }))).toBe('A2');
  });

  it('does not skip a gap: B1 mastered without A2 stays at A1', () => {
    expect(estimateGrammarLevel(levels({ A1: lvl(100, 90, 80), B1: lvl(100, 90, 80) }))).toBe('A1');
  });

  it('works end to end on real data: all A1 mastered gives A1; all A2 alone gives null', () => {
    const a1 = questions.filter((q) => q.cefr === 'A1');
    const a2 = questions.filter((q) => q.cefr === 'A2');
    const mastered = (qs: GrammarQuestion[]) =>
      mapOf(qs.map((q): [GrammarQuestion, CardProgress] => [q, card()]));
    expect(estimateGrammarLevel(buildGrammarProgress(mastered(a1)).byLevel)).toBe('A1');
    expect(estimateGrammarLevel(buildGrammarProgress(mastered(a2)).byLevel)).toBeNull();
  });
});
