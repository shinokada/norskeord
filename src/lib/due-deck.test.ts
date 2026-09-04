import { describe, it, expect } from 'vitest';
import { computeDuePool, dealChunk, shuffle, NEW_CARD_SESSION_LIMIT } from './due-deck';
import type { CardProgress, VocabEntry } from './types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<VocabEntry> = {}): VocabEntry {
  return {
    id: `v-a1-greetings-${Math.random().toString(36).slice(2)}`,
    norsk: 'hei',
    english: 'hello',
    spanish: 'hola',
    ukrainian: 'привіт',
    example: 'Hei, hvordan har du det?',
    example_english: 'Hello, how are you?',
    example_spanish: 'Hola, ¿cómo estás?',
    example_ukrainian: 'Привіт, як справи?',
    level: 'A1',
    category: 'greetings',
    part: 'interjection',
    ...overrides
  };
}

function progressDue(daysFromNow: number): CardProgress {
  const due = new Date();
  due.setDate(due.getDate() + daysFromNow);
  return {
    fsrs: {
      due,
      stability: 1,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 1,
      lapses: 0,
      state: 2 // Review
    } as CardProgress['fsrs'],
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    level: 'A1',
    category: 'greetings'
  };
}

// ── shuffle ───────────────────────────────────────────────────────────────────

describe('shuffle', () => {
  it('preserves the multiset of elements', () => {
    const arr = [1, 2, 3, 4, 5];
    expect([...shuffle(arr)].sort()).toEqual(arr);
  });

  it('does not mutate the input array', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('handles an empty array', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('handles a single-element array', () => {
    expect(shuffle([1])).toEqual([1]);
  });
});

// ── computeDuePool ────────────────────────────────────────────────────────────

describe('computeDuePool', () => {
  it('returns an empty pool when nothing is due or new', () => {
    // Not due, but has progress — should not appear.
    const e = makeEntry({ id: 'v-1' });
    const progressMap = { 'v-1': progressDue(5) }; // due in 5 days
    expect(computeDuePool([e], progressMap)).toEqual([]);
  });

  it('includes an overdue card', () => {
    const e = makeEntry({ id: 'v-1' });
    const progressMap = { 'v-1': progressDue(-1) }; // due yesterday
    const pool = computeDuePool([e], progressMap);
    expect(pool.map((x) => x.id)).toEqual(['v-1']);
  });

  it('includes a never-seen (new) card', () => {
    const e = makeEntry({ id: 'v-new' });
    const pool = computeDuePool([e], {});
    expect(pool.map((x) => x.id)).toEqual(['v-new']);
  });

  it('excludes a card due in the future', () => {
    const e = makeEntry({ id: 'v-1' });
    const progressMap = { 'v-1': progressDue(1) }; // due tomorrow
    expect(computeDuePool([e], progressMap)).toEqual([]);
  });

  it('caps new cards at NEW_CARD_SESSION_LIMIT, but never caps overdue cards', () => {
    const overdueEntries = Array.from({ length: 5 }, (_, i) => makeEntry({ id: `overdue-${i}` }));
    const newEntries = Array.from({ length: NEW_CARD_SESSION_LIMIT + 10 }, (_, i) =>
      makeEntry({ id: `new-${i}` })
    );
    const progressMap: Record<string, CardProgress> = {};
    for (const e of overdueEntries) progressMap[e.id] = progressDue(-1);

    const pool = computeDuePool([...overdueEntries, ...newEntries], progressMap);
    const overdueInPool = pool.filter((e) => e.id.startsWith('overdue-'));
    const newInPool = pool.filter((e) => e.id.startsWith('new-'));

    expect(overdueInPool).toHaveLength(5);
    expect(newInPool).toHaveLength(NEW_CARD_SESSION_LIMIT);
  });

  it('accepts an explicit `now` for deterministic due-boundary testing', () => {
    const fixedNow = new Date('2025-06-01T12:00:00Z');
    const e = makeEntry({ id: 'v-1' });
    const progressMap = {
      'v-1': { ...progressDue(0), fsrs: { ...progressDue(0).fsrs, due: new Date('2025-06-01T11:59:59Z') } }
    };
    expect(computeDuePool([e], progressMap, fixedNow).map((x) => x.id)).toEqual(['v-1']);
  });
});

// ── dealChunk ─────────────────────────────────────────────────────────────────

describe('dealChunk', () => {
  const pool5 = [1, 2, 3, 4, 5];

  it('returns an empty chunk for an empty pool', () => {
    const result = dealChunk([], 0, 10);
    expect(result).toEqual({ chunk: [], pool: [], dealIndex: 0 });
  });

  it('deals up to `limit` items from the start of the pool', () => {
    const result = dealChunk(pool5, 0, 2);
    expect(result.chunk).toHaveLength(2);
    expect(result.dealIndex).toBe(2);
  });

  it('deals the whole pool when limit is null', () => {
    const result = dealChunk(pool5, 0, null);
    expect(result.chunk).toHaveLength(5);
    expect(result.dealIndex).toBe(5);
  });

  it('continues from dealIndex on a subsequent call', () => {
    const first = dealChunk(pool5, 0, 2);
    const second = dealChunk(first.pool, first.dealIndex, 2);
    // Combined, the first two calls should have dealt 4 distinct items,
    // none repeated (full coverage before any repeats — Fix 1's guarantee).
    const dealtSoFar = [...first.chunk, ...second.chunk];
    expect(new Set(dealtSoFar).size).toBe(4);
    expect(second.dealIndex).toBe(4);
  });

  it('reshuffles and wraps to the start once the pool is exhausted, instead of returning empty', () => {
    // Deal all 5, then deal again — should NOT return an empty chunk (the
    // bug Fix 1 fixes); it should loop back to a (possibly reshuffled) full
    // pool and keep dealing.
    const first = dealChunk(pool5, 0, 5);
    expect(first.dealIndex).toBe(5);
    const second = dealChunk(first.pool, first.dealIndex, 5);
    expect(second.chunk).toHaveLength(5);
    expect(second.dealIndex).toBe(5);
    expect([...second.chunk].sort()).toEqual(pool5);
  });

  it('a chunk size larger than the pool just returns the whole pool', () => {
    const result = dealChunk(pool5, 0, 100);
    expect(result.chunk).toHaveLength(5);
  });

  it('repeated deals across many wraps always cover the full pool before any repeat', () => {
    // Regression guard for the "Shopping, 5 due, session limit 10" example
    // from the Fix 1 discussion: every restart should reshuffle the same 5,
    // never shrinking and never skipping any of them.
    let pool: number[] = pool5;
    let dealIndex = 0;
    for (let round = 0; round < 20; round++) {
      const result = dealChunk(pool, dealIndex, 5);
      expect([...result.chunk].sort()).toEqual(pool5);
      pool = result.pool;
      dealIndex = result.dealIndex;
    }
  });
});
