import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { GRAMMAR_LS_PREFIX, LS_PREFIX, loadGrammarProgressMap, loadProgressMap } from './progress';

// Blocked or unavailable storage (for example a SecurityError) must not throw out of the
// loaders: the flashcards, quiz and /my-progress call them on mount for guest and free users.

const CARD = JSON.stringify({
  fsrs: {
    due: '2026-10-30T10:00:00.000Z',
    stability: 1.5,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 2,
    lapses: 0,
    state: 2,
    last_review: '2026-10-01T09:00:00.000Z'
  },
  seenCount: 3,
  lastSeen: '2026-10-01T09:00:00.000Z',
  level: 'A1',
  category: 'greetings'
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

/** localStorage whose key(i) works for the first `okKeys` entries and then throws. */
function stubFailingAfter(entries: Record<string, string>) {
  const keys = Object.keys(entries);
  vi.stubGlobal('localStorage', {
    length: keys.length + 1,
    key: (i: number) => {
      if (i < keys.length) return keys[i];
      throw new Error('SecurityError');
    },
    getItem: (k: string) => entries[k] ?? null
  });
}

function stubUnavailable() {
  vi.stubGlobal('localStorage', {
    get length(): number {
      throw new Error('SecurityError');
    },
    key: () => null,
    getItem: () => null
  });
}

describe('loadProgressMap', () => {
  it('returns what it has read so far when scanning localStorage throws part-way', async () => {
    stubFailingAfter({ [LS_PREFIX + 'w-000001']: CARD });

    const map = await loadProgressMap();

    expect(Object.keys(map)).toEqual(['w-000001']);
    expect(map['w-000001'].fsrs.due).toBeInstanceOf(Date);
  });

  it('returns an empty map, without throwing, when localStorage is unavailable', async () => {
    stubUnavailable();
    await expect(loadProgressMap()).resolves.toEqual({});
  });
});

describe('loadGrammarProgressMap', () => {
  it('returns what it has read so far when scanning localStorage throws part-way', () => {
    stubFailingAfter({ [GRAMMAR_LS_PREFIX + 'gq-perspron-001']: CARD });

    const map = loadGrammarProgressMap();

    expect(Object.keys(map)).toEqual(['gq-perspron-001']);
    expect(map['gq-perspron-001'].fsrs.due).toBeInstanceOf(Date);
  });

  it('returns an empty map, without throwing, when localStorage is unavailable', () => {
    stubUnavailable();
    expect(loadGrammarProgressMap()).toEqual({});
  });
});
