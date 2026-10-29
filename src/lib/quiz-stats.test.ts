import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CEFRLevel, VocabEntry } from '$lib/types';

// The Plus paths talk to Supabase; mock the client so they run without a network.
vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from '$lib/supabase';
import { QUIZ_LS_PREFIX } from './progress';
import { mockQuizSelect } from './test-utils/quiz-select';
import {
  loadQuizStats,
  recordQuizAnswer,
  summariseQuizStats,
  quizAccuracy,
  migrateLocalQuizStatsToSupabase,
  QUIZ_MIN_ANSWERS_FOR_ACCURACY,
  type QuizStatsMap
} from './quiz-stats';

// ── localStorage mock ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    }
  });
  vi.mocked(supabase.from).mockReset();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const entry: VocabEntry = {
  id: 'w-000001',
  norsk: 'hei',
  english: 'hello',
  example: 'Hei, hvordan har du det?',
  example_english: 'Hello, how are you?',
  level: 'A1',
  category: 'greetings',
  part: 'interjection'
};

const otherEntry: VocabEntry = { ...entry, id: 'w-000002', norsk: 'takk', english: 'thanks' };

// ── recordQuizAnswer (guest / free) ──────────────────────────────────────────

describe('recordQuizAnswer (localStorage)', () => {
  it('creates a stat on the first answer', async () => {
    const map = await recordQuizAnswer(entry, true, {});
    expect(map[entry.id].attempts).toBe(1);
    expect(map[entry.id].correct).toBe(1);
    expect(new Date(map[entry.id].lastAttempt).getTime()).not.toBeNaN();
  });

  it('counts a wrong answer as an attempt without a correct', async () => {
    const map = await recordQuizAnswer(entry, false, {});
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 0 });
  });

  it('increments from the in-memory map across answers', async () => {
    let map = await recordQuizAnswer(entry, true, {});
    map = await recordQuizAnswer(entry, false, map);
    map = await recordQuizAnswer(entry, true, map);
    expect(map[entry.id]).toMatchObject({ attempts: 3, correct: 2 });
  });

  it('keeps words independent and does not mutate the map it was given', async () => {
    const start: QuizStatsMap = {};
    const a = await recordQuizAnswer(entry, true, start);
    const b = await recordQuizAnswer(otherEntry, false, a);
    expect(start).toEqual({});
    expect(b[entry.id]).toMatchObject({ attempts: 1, correct: 1 });
    expect(b[otherEntry.id]).toMatchObject({ attempts: 1, correct: 0 });
  });

  it('writes under the quiz-stats- prefix only', async () => {
    await recordQuizAnswer(entry, true, {});
    expect(Object.keys(store)).toEqual([QUIZ_LS_PREFIX + entry.id]);
  });

  it('still returns the updated map when the localStorage write fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('localStorage', {
      length: 0,
      key: () => null,
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {}
    });
    const map = await recordQuizAnswer(entry, true, {});
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 1 });
  });
});

// ── loadQuizStats (guest / free) ─────────────────────────────────────────────

describe('loadQuizStats (localStorage)', () => {
  it('returns an empty map when nothing is stored', async () => {
    expect(await loadQuizStats(null)).toEqual({});
  });

  it('round-trips what recordQuizAnswer wrote', async () => {
    let map = await recordQuizAnswer(entry, true, {});
    map = await recordQuizAnswer(entry, false, map);
    map = await recordQuizAnswer(otherEntry, true, map);
    const loaded = await loadQuizStats(null);
    expect(loaded).toEqual(map);
  });

  it('ignores keys without the quiz-stats- prefix', async () => {
    store['progress-w-000001'] = JSON.stringify({ attempts: 1, correct: 1, lastAttempt: 'x' });
    expect(await loadQuizStats(null)).toEqual({});
  });

  it('skips malformed JSON and entries with the wrong shape', async () => {
    store[QUIZ_LS_PREFIX + 'bad-json'] = 'not-json{{{';
    store[QUIZ_LS_PREFIX + 'bad-shape'] = JSON.stringify({ attempts: 'two' });
    store[QUIZ_LS_PREFIX + 'bad-counts'] = JSON.stringify({
      attempts: 1,
      correct: 5,
      lastAttempt: new Date().toISOString()
    });
    expect(await loadQuizStats(null)).toEqual({});
  });

  it('returns what it has read so far when scanning localStorage throws part-way', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const good = JSON.stringify({
      attempts: 2,
      correct: 1,
      lastAttempt: '2026-10-28T10:00:00Z'
    });
    vi.stubGlobal('localStorage', {
      length: 2,
      key: (i: number) => {
        if (i === 0) return QUIZ_LS_PREFIX + 'w-1';
        throw new Error('SecurityError');
      },
      getItem: () => good
    });

    expect(await loadQuizStats(null)).toEqual({
      'w-1': { attempts: 2, correct: 1, lastAttempt: '2026-10-28T10:00:00Z' }
    });
  });

  it('returns an empty map, without throwing, when localStorage is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('localStorage', {
      get length(): number {
        throw new Error('SecurityError');
      },
      key: () => null,
      getItem: () => null
    });

    await expect(loadQuizStats(null)).resolves.toEqual({});
  });
});

// ── Plus (Supabase) ──────────────────────────────────────────────────────────

describe('recordQuizAnswer (Supabase)', () => {
  it('upserts one quiz_progress row and never touches localStorage', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);

    const map = await recordQuizAnswer(entry, true, {}, 'user-1');

    expect(supabase.from).toHaveBeenCalledWith('quiz_progress');
    expect(upsert).toHaveBeenCalledTimes(1);
    const [row, options] = upsert.mock.calls[0];
    expect(row).toMatchObject({ user_id: 'user-1', vocab_id: entry.id, attempts: 1, correct: 1 });
    expect(options).toEqual({ onConflict: 'user_id,vocab_id' });
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 1 });
    expect(Object.keys(store)).toEqual([]);
  });

  it('still updates the in-memory map when the upsert fails (e.g. table missing)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'relation does not exist' } });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);

    const map = await recordQuizAnswer(entry, false, {}, 'user-1');
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 0 });
  });

  it('still updates the in-memory map when the upsert throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const upsert = vi.fn().mockRejectedValue(new Error('network'));
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);

    const map = await recordQuizAnswer(entry, true, {}, 'user-1');
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 1 });
  });
});

describe('loadQuizStats (Supabase)', () => {
  it('maps rows to stats keyed by vocab_id', async () => {
    const cloud = mockQuizSelect([
      {
        data: [
          { vocab_id: 'w-000001', attempts: 4, correct: 3, last_attempt: '2026-10-28T10:00:00Z' }
        ]
      }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    const map = await loadQuizStats('user-1');

    expect(supabase.from).toHaveBeenCalledWith('quiz_progress');
    expect(cloud.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(cloud.order).toHaveBeenCalledWith('vocab_id', { ascending: true });
    expect(map).toEqual({
      'w-000001': { attempts: 4, correct: 3, lastAttempt: '2026-10-28T10:00:00Z' }
    });
  });

  it('reads every page, advancing by the rows returned, until an empty page', async () => {
    const row = (id: string) => ({
      vocab_id: id,
      attempts: 1,
      correct: 1,
      last_attempt: '2026-10-28T10:00:00Z'
    });
    // Pages smaller than the page size: a project max_rows below 1,000 must not end the loop.
    const cloud = mockQuizSelect([
      { data: [row('w-000001'), row('w-000002')] },
      { data: [row('w-000003')] }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    const map = await loadQuizStats('user-1');

    expect(Object.keys(map).sort()).toEqual(['w-000001', 'w-000002', 'w-000003']);
    expect(cloud.range.mock.calls).toEqual([
      [0, 999],
      [2, 1001],
      [3, 1002]
    ]);
  });

  it('returns an empty map, not a partial one, when a later page fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const cloud = mockQuizSelect([
      {
        data: [
          { vocab_id: 'w-000001', attempts: 1, correct: 1, last_attempt: '2026-10-28T10:00:00Z' }
        ]
      },
      { data: null, error: { message: 'boom' } }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    expect(await loadQuizStats('user-1')).toEqual({});
  });

  it('returns an empty map when the query errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const cloud = mockQuizSelect([{ data: null, error: { message: 'boom' } }]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    expect(await loadQuizStats('user-1')).toEqual({});
  });
});

// ── summariseQuizStats ───────────────────────────────────────────────────────

describe('summariseQuizStats', () => {
  const stat = (attempts: number, correct: number) => ({
    attempts,
    correct,
    lastAttempt: '2026-10-28T10:00:00Z'
  });
  const levels: Record<string, CEFRLevel> = {
    'w-1': 'A1',
    'w-2': 'A1',
    'w-3': 'B1'
  };
  const resolve = (id: string) => levels[id];

  it('returns zeros for an empty map', () => {
    const s = summariseQuizStats({}, resolve);
    expect(s.total).toEqual({ answered: 0, correct: 0, words: 0 });
    expect(s.byLevel.A1).toEqual({ answered: 0, correct: 0, words: 0 });
  });

  it('totals answered, correct and distinct words, overall and per level', () => {
    const map = { 'w-1': stat(4, 3), 'w-2': stat(2, 0), 'w-3': stat(5, 5) };
    const s = summariseQuizStats(map, resolve);
    expect(s.total).toEqual({ answered: 11, correct: 8, words: 3 });
    expect(s.byLevel.A1).toEqual({ answered: 6, correct: 3, words: 2 });
    expect(s.byLevel.B1).toEqual({ answered: 5, correct: 5, words: 1 });
    expect(s.byLevel.A2).toEqual({ answered: 0, correct: 0, words: 0 });
  });

  it('leaves out ids that no longer resolve to an entry', () => {
    const s = summariseQuizStats({ 'w-1': stat(2, 1), 'w-gone': stat(9, 9) }, resolve);
    expect(s.total).toEqual({ answered: 2, correct: 1, words: 1 });
  });

  it('uses the live level, so a moved entry counts under its new level', () => {
    const map = { 'w-1': stat(3, 2) };
    expect(summariseQuizStats(map, () => 'A1').byLevel.A1.answered).toBe(3);
    const moved = summariseQuizStats(map, () => 'A2');
    expect(moved.byLevel.A1.answered).toBe(0);
    expect(moved.byLevel.A2.answered).toBe(3);
  });
});

// ── quizAccuracy ─────────────────────────────────────────────────────────

describe('quizAccuracy', () => {
  it('is null below the minimum number of answers (1 of 1 must not read as 100%)', () => {
    expect(quizAccuracy({ answered: 1, correct: 1, words: 1 })).toBeNull();
    expect(
      quizAccuracy({
        answered: QUIZ_MIN_ANSWERS_FOR_ACCURACY - 1,
        correct: QUIZ_MIN_ANSWERS_FOR_ACCURACY - 1,
        words: 3
      })
    ).toBeNull();
    expect(quizAccuracy({ answered: 0, correct: 0, words: 0 })).toBeNull();
  });

  it('is a rounded whole percentage from the minimum upwards', () => {
    expect(quizAccuracy({ answered: 10, correct: 7, words: 4 })).toBe(70);
    expect(quizAccuracy({ answered: 12, correct: 7, words: 5 })).toBe(58);
    expect(quizAccuracy({ answered: 10, correct: 10, words: 5 })).toBe(100);
    expect(quizAccuracy({ answered: 10, correct: 0, words: 5 })).toBe(0);
  });
});

// ── migrateLocalQuizStatsToSupabase ───────────────────────────────────────────────

describe('migrateLocalQuizStatsToSupabase', () => {
  const seedLocal = (
    id: string,
    attempts: number,
    correct: number,
    at = '2026-10-01T10:00:00Z'
  ) => {
    store[QUIZ_LS_PREFIX + id] = JSON.stringify({ attempts, correct, lastAttempt: at });
  };

  /** The cloud read returns `remote` rows (one page); upsert() resolves with `upsertError`. */
  function mockCloud(
    remote: unknown[] | null,
    selectError: unknown = null,
    upsertError: unknown = null
  ) {
    const sel = mockQuizSelect([{ data: remote, error: selectError }]);
    const upsert = vi.fn().mockResolvedValue({ error: upsertError });
    vi.mocked(supabase.from).mockReturnValue({ select: sel.select, upsert } as never);
    return { ...sel, upsert };
  }

  it('does nothing when there are no local quiz stats', async () => {
    const cloud = mockCloud([]);
    await migrateLocalQuizStatsToSupabase('user-1');
    expect(supabase.from).not.toHaveBeenCalled();
    expect(cloud.upsert).not.toHaveBeenCalled();
  });

  it('upserts the local counts and removes only the quiz-stats keys', async () => {
    seedLocal('w-1', 4, 3);
    seedLocal('w-2', 2, 0);
    store['progress-w-1'] = '{}';
    const cloud = mockCloud([]);

    await migrateLocalQuizStatsToSupabase('user-1');

    expect(cloud.upsert).toHaveBeenCalledTimes(1);
    const [rows, options] = cloud.upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: 'user_id,vocab_id' });
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual({
      user_id: 'user-1',
      vocab_id: 'w-1',
      attempts: 4,
      correct: 3,
      last_attempt: '2026-10-01T10:00:00Z'
    });
    expect(rows).toContainEqual(
      expect.objectContaining({ vocab_id: 'w-2', attempts: 2, correct: 0 })
    );
    // Only the quiz stats are removed; the vocab key is left for migrateLocalProgressToSupabase.
    expect(Object.keys(store)).toEqual(['progress-w-1']);
  });

  it('adds to an existing cloud row and keeps the latest last_attempt', async () => {
    seedLocal('w-1', 4, 3, '2026-10-01T10:00:00Z');
    const cloud = mockCloud([
      { vocab_id: 'w-1', attempts: 10, correct: 8, last_attempt: '2026-10-20T10:00:00Z' }
    ]);

    await migrateLocalQuizStatsToSupabase('user-1');

    const [rows] = cloud.upsert.mock.calls[0];
    expect(rows).toEqual([
      {
        user_id: 'user-1',
        vocab_id: 'w-1',
        attempts: 14,
        correct: 11,
        last_attempt: '2026-10-20T10:00:00Z'
      }
    ]);
    // correct <= attempts must still hold after the sum (the table has a check constraint).
    expect(rows[0].correct).toBeLessThanOrEqual(rows[0].attempts);
  });

  it('merges against cloud rows from every page, not just the first', async () => {
    seedLocal('w-2', 1, 1, '2026-10-01T10:00:00Z');
    const sel = mockQuizSelect([
      {
        data: [{ vocab_id: 'w-1', attempts: 5, correct: 5, last_attempt: '2026-10-02T10:00:00Z' }]
      },
      {
        data: [{ vocab_id: 'w-2', attempts: 7, correct: 4, last_attempt: '2026-10-03T10:00:00Z' }]
      }
    ]);
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ select: sel.select, upsert } as never);

    await migrateLocalQuizStatsToSupabase('user-1');

    // w-2 only exists on the second page: its cloud counts must be added, not overwritten.
    expect(upsert.mock.calls[0][0]).toEqual([
      {
        user_id: 'user-1',
        vocab_id: 'w-2',
        attempts: 8,
        correct: 5,
        last_attempt: '2026-10-03T10:00:00Z'
      }
    ]);
  });

  it('keeps the local stats and does not upsert when a later cloud page fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    seedLocal('w-2', 1, 1);
    const sel = mockQuizSelect([
      {
        data: [{ vocab_id: 'w-1', attempts: 5, correct: 5, last_attempt: '2026-10-02T10:00:00Z' }]
      },
      { data: null, error: { message: 'boom' } }
    ]);
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ select: sel.select, upsert } as never);

    await migrateLocalQuizStatsToSupabase('user-1');

    expect(upsert).not.toHaveBeenCalled();
    expect(Object.keys(store)).toEqual([QUIZ_LS_PREFIX + 'w-2']);
  });

  it('keeps the local stats when the cloud read fails, and does not upsert', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    seedLocal('w-1', 4, 3);
    const cloud = mockCloud(null, { message: 'boom' });

    await migrateLocalQuizStatsToSupabase('user-1');

    expect(cloud.upsert).not.toHaveBeenCalled();
    expect(Object.keys(store)).toEqual([QUIZ_LS_PREFIX + 'w-1']);
  });

  it('keeps the local stats when the upsert fails, so it can be retried', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    seedLocal('w-1', 4, 3);
    mockCloud([], null, { message: 'boom' });

    await migrateLocalQuizStatsToSupabase('user-1');

    expect(Object.keys(store)).toEqual([QUIZ_LS_PREFIX + 'w-1']);
  });

  it('never throws, so a failure cannot break login', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    seedLocal('w-1', 4, 3);
    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('network');
    });

    await expect(migrateLocalQuizStatsToSupabase('user-1')).resolves.toBeUndefined();
    expect(Object.keys(store)).toEqual([QUIZ_LS_PREFIX + 'w-1']);
  });

  it('cannot double-count: a second run after success finds nothing to migrate', async () => {
    seedLocal('w-1', 4, 3);
    const cloud = mockCloud([]);

    await migrateLocalQuizStatsToSupabase('user-1');
    await migrateLocalQuizStatsToSupabase('user-1');

    expect(cloud.upsert).toHaveBeenCalledTimes(1);
  });
});
