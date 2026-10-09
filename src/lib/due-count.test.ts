import { describe, expect, it } from 'vitest';
import type { CardProgress } from './types';
import { countDueForPlan, isFreeCard } from './due-count';

function card(level: string, category: string, dueOffsetMs: number): CardProgress {
  return {
    fsrs: { due: new Date(Date.now() + dueOffsetMs) },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    level,
    category
  } as unknown as CardProgress;
}

const DUE = -60_000;
const NOT_DUE = 86_400_000;

describe('isFreeCard', () => {
  it('treats every A1 card as free', () => {
    expect(isFreeCard(card('A1', 'home', DUE))).toBe(true);
    expect(isFreeCard(card('A1', 'uttrykk', DUE))).toBe(true);
  });

  it('treats only the 3 free categories as free at A2 to C', () => {
    expect(isFreeCard(card('A2', 'money', DUE))).toBe(true);
    expect(isFreeCard(card('A2', 'animals', DUE))).toBe(false);
    expect(isFreeCard(card('B1', 'travel', DUE))).toBe(true);
    expect(isFreeCard(card('B1', 'media', DUE))).toBe(false);
    expect(isFreeCard(card('B2', 'science', DUE))).toBe(true);
    expect(isFreeCard(card('B2', 'politics', DUE))).toBe(false);
    expect(isFreeCard(card('C', 'academic', DUE))).toBe(true);
    expect(isFreeCard(card('C', 'philosophy', DUE))).toBe(false);
  });
});

describe('countDueForPlan', () => {
  const map: Record<string, CardProgress> = {
    a: card('A1', 'home', DUE),
    b: card('A2', 'money', DUE),
    c: card('A2', 'animals', DUE), // locked now
    d: card('C', 'philosophy', DUE), // locked now
    e: card('A2', 'money', NOT_DUE) // free but not due
  };

  it('counts only still-free due cards for free and guest users', () => {
    expect(countDueForPlan(map, false)).toBe(2);
  });

  it('counts every due card for Plus', () => {
    expect(countDueForPlan(map, true)).toBe(4);
  });

  it('returns 0 for an empty map', () => {
    expect(countDueForPlan({}, false)).toBe(0);
    expect(countDueForPlan({}, true)).toBe(0);
  });
});
