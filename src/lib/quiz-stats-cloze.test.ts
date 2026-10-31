// ai-docs/implementation/cloze-quiz.md, Phase 3: Sentences stats storage. The cloze store
// has the same behaviour as the quiz store (quiz-stats.test.ts) in a table and a
// localStorage prefix of its own. Words stats must not be touched by any of it.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VocabEntry } from '$lib/types';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from '$lib/supabase';
import {
  CLOZE_LS_PREFIX,
  GRAMMAR_LS_PREFIX,
  LS_PREFIX,
  QUIZ_LS_PREFIX,
  clearLocalVocabularyProgress,
  clearUserProgress
} from './progress';
import { mockQuizSelect } from './test-utils/quiz-select';
import {
  loadClozeStats,
  loadClozeStatsOrNull,
  loadQuizStats,
  migrateLocalClozeStatsToSupabase,
  recordClozeAnswer,
  recordQuizAnswer,
  summariseClozeStats,
  type ClozeStatsMap
} from './quiz-stats';
import { syncLocalProgressToPlus } from './plus-sync';

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
  vi.spyOn(console, 'error').mockImplementation(() => {});
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

const AT = '2026-10-28T10:00:00Z';

const seedCloze = (id: string, attempts: number, correct: number, at = '2026-10-01T10:00:00Z') => {
  store[CLOZE_LS_PREFIX + id] = JSON.stringify({ attempts, correct, lastAttempt: at });
};

// ── The prefix ────────────────────────────────────────────────────────────────

describe('CLOZE_LS_PREFIX', () => {
  it('does not collide with any other progress prefix, in either direction', () => {
    const others = [LS_PREFIX, GRAMMAR_LS_PREFIX, QUIZ_LS_PREFIX];
    expect(CLOZE_LS_PREFIX).toBe('cloze-stats-');
    for (const other of others) {
      expect(CLOZE_LS_PREFIX.startsWith(other)).toBe(false);
      expect(other.startsWith(CLOZE_LS_PREFIX)).toBe(false);
    }
  });
});

// ── recordClozeAnswer / loadClozeStats (guest / free) ─────────────────────────

describe('recordClozeAnswer (localStorage)', () => {
  it('creates a stat on the first answer and counts a wrong one as an attempt only', async () => {
    const right = await recordClozeAnswer(entry, true, {});
    expect(right[entry.id]).toMatchObject({ attempts: 1, correct: 1 });
    const wrong = await recordClozeAnswer(otherEntry, false, {});
    expect(wrong[otherEntry.id]).toMatchObject({ attempts: 1, correct: 0 });
  });

  it('increments from the in-memory map and does not mutate it', async () => {
    const start: ClozeStatsMap = {};
    let map = await recordClozeAnswer(entry, true, start);
    map = await recordClozeAnswer(entry, false, map);
    map = await recordClozeAnswer(entry, true, map);
    expect(start).toEqual({});
    expect(map[entry.id]).toMatchObject({ attempts: 3, correct: 2 });
  });

  it('writes under the cloze-stats- prefix only', async () => {
    await recordClozeAnswer(entry, true, {});
    expect(Object.keys(store)).toEqual([CLOZE_LS_PREFIX + entry.id]);
  });

  it('still returns the updated map when the localStorage write fails', async () => {
    vi.stubGlobal('localStorage', {
      length: 0,
      key: () => null,
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {}
    });
    const map = await recordClozeAnswer(entry, true, {});
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 1 });
  });
});

describe('loadClozeStats (localStorage)', () => {
  it('returns an empty map when nothing is stored', async () => {
    expect(await loadClozeStats(null)).toEqual({});
  });

  it('round-trips what recordClozeAnswer wrote', async () => {
    let map = await recordClozeAnswer(entry, true, {});
    map = await recordClozeAnswer(entry, false, map);
    map = await recordClozeAnswer(otherEntry, true, map);
    expect(await loadClozeStats(null)).toEqual(map);
  });

  it('skips malformed JSON and entries with the wrong shape', async () => {
    store[CLOZE_LS_PREFIX + 'bad-json'] = 'not-json{{{';
    store[CLOZE_LS_PREFIX + 'bad-shape'] = JSON.stringify({ attempts: 'two' });
    store[CLOZE_LS_PREFIX + 'bad-counts'] = JSON.stringify({
      attempts: 1,
      correct: 5,
      lastAttempt: AT
    });
    expect(await loadClozeStats(null)).toEqual({});
  });

  it('returns an empty map, without throwing, when localStorage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      get length(): number {
        throw new Error('SecurityError');
      },
      key: () => null,
      getItem: () => null
    });
    await expect(loadClozeStats(null)).resolves.toEqual({});
  });

  it('never returns a guest map for a Plus user: no localStorage read when a user id is given', async () => {
    seedCloze('w-1', 2, 1);
    const sel = mockQuizSelect([{ data: [] }]);
    vi.mocked(supabase.from).mockReturnValue({ select: sel.select } as never);
    expect(await loadClozeStats('user-1')).toEqual({});
  });
});

// ── Words and Sentences are separate stores ───────────────────────────────────

describe('Words and Sentences stats do not mix', () => {
  it('a Sentences answer is invisible to the Words load, and the other way round', async () => {
    await recordClozeAnswer(entry, true, {});
    await recordQuizAnswer(otherEntry, false, {});

    expect(Object.keys(await loadClozeStats(null))).toEqual([entry.id]);
    expect(Object.keys(await loadQuizStats(null))).toEqual([otherEntry.id]);
    expect(Object.keys(store).sort()).toEqual(
      [CLOZE_LS_PREFIX + entry.id, QUIZ_LS_PREFIX + otherEntry.id].sort()
    );
  });

  it('the same word keeps independent counts in each store', async () => {
    let words = await recordQuizAnswer(entry, true, {});
    words = await recordQuizAnswer(entry, true, words);
    const sentences = await recordClozeAnswer(entry, false, {});
    expect(words[entry.id]).toMatchObject({ attempts: 2, correct: 2 });
    expect(sentences[entry.id]).toMatchObject({ attempts: 1, correct: 0 });
  });
});

// ── Plus (Supabase) ───────────────────────────────────────────────────────────

describe('recordClozeAnswer (Supabase)', () => {
  it('upserts one cloze_progress row, never quiz_progress, and never touches localStorage', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);

    const map = await recordClozeAnswer(entry, true, {}, 'user-1');

    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('cloze_progress');
    const [row, options] = upsert.mock.calls[0];
    expect(row).toMatchObject({ user_id: 'user-1', vocab_id: entry.id, attempts: 1, correct: 1 });
    expect(options).toEqual({ onConflict: 'user_id,vocab_id' });
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 1 });
    expect(Object.keys(store)).toEqual([]);
  });

  it('still updates the in-memory map when the upsert errors (the table may not exist yet)', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'relation does not exist' } });
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);
    const map = await recordClozeAnswer(entry, false, {}, 'user-1');
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 0 });
  });

  it('still updates the in-memory map when the upsert throws', async () => {
    const upsert = vi.fn().mockRejectedValue(new Error('network'));
    vi.mocked(supabase.from).mockReturnValue({ upsert } as never);
    const map = await recordClozeAnswer(entry, true, {}, 'user-1');
    expect(map[entry.id]).toMatchObject({ attempts: 1, correct: 1 });
  });
});

describe('loadClozeStats / loadClozeStatsOrNull (Supabase)', () => {
  it('reads cloze_progress for the user, ordered by vocab_id', async () => {
    const cloud = mockQuizSelect([
      { data: [{ vocab_id: 'w-000001', attempts: 4, correct: 3, last_attempt: AT }] }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    const map = await loadClozeStats('user-1');

    expect(supabase.from).toHaveBeenCalledWith('cloze_progress');
    expect(cloud.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(cloud.order).toHaveBeenCalledWith('vocab_id', { ascending: true });
    expect(map).toEqual({ 'w-000001': { attempts: 4, correct: 3, lastAttempt: AT } });
  });

  it('reads every page, advancing by the rows returned', async () => {
    const row = (id: string) => ({ vocab_id: id, attempts: 1, correct: 1, last_attempt: AT });
    const cloud = mockQuizSelect([
      { data: [row('w-000001'), row('w-000002')] },
      { data: [row('w-000003')] }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    const map = await loadClozeStats('user-1');

    expect(Object.keys(map).sort()).toEqual(['w-000001', 'w-000002', 'w-000003']);
    expect(cloud.range.mock.calls).toEqual([
      [0, 999],
      [2, 1001],
      [3, 1002]
    ]);
  });

  it('gives an empty map from loadClozeStats and null from loadClozeStatsOrNull when the select errors', async () => {
    const failing = () => {
      const cloud = mockQuizSelect([{ data: null, error: { message: 'relation does not exist' } }]);
      vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);
    };
    failing();
    expect(await loadClozeStats('user-1')).toEqual({});
    failing();
    expect(await loadClozeStatsOrNull('user-1')).toBeNull();
  });

  it('returns null, never a partial map, when a later page fails', async () => {
    const cloud = mockQuizSelect([
      { data: [{ vocab_id: 'w-000001', attempts: 1, correct: 1, last_attempt: AT }] },
      { data: null, error: { message: 'boom' } }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);
    expect(await loadClozeStatsOrNull('user-1')).toBeNull();
  });

  it('returns null when the select throws', async () => {
    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('network down');
    });
    expect(await loadClozeStatsOrNull('user-1')).toBeNull();
  });

  it('returns an empty map (not null) for a Plus user with no history', async () => {
    const cloud = mockQuizSelect([{ data: [] }]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);
    expect(await loadClozeStatsOrNull('user-1')).toEqual({});
  });

  it('returns the local map for a guest, without touching Supabase', async () => {
    seedCloze('w-000001', 2, 1, AT);
    expect(await loadClozeStatsOrNull(null)).toEqual({
      'w-000001': { attempts: 2, correct: 1, lastAttempt: AT }
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// ── summariseClozeStats ───────────────────────────────────────────────────────

describe('summariseClozeStats', () => {
  it('totals answered, correct and distinct words, overall and per live level', () => {
    const stat = (attempts: number, correct: number) => ({ attempts, correct, lastAttempt: AT });
    const levels = { 'w-1': 'A1', 'w-2': 'A1', 'w-3': 'B1' } as const;
    const s = summariseClozeStats(
      { 'w-1': stat(4, 3), 'w-2': stat(2, 0), 'w-3': stat(5, 5), 'w-gone': stat(9, 9) },
      (id) => levels[id as keyof typeof levels]
    );
    expect(s.total).toEqual({ answered: 11, correct: 8, words: 3 });
    expect(s.byLevel.A1).toEqual({ answered: 6, correct: 3, words: 2 });
    expect(s.byLevel.B1).toEqual({ answered: 5, correct: 5, words: 1 });
    expect(s.byLevel.A2).toEqual({ answered: 0, correct: 0, words: 0 });
  });
});

// ── migrateLocalClozeStatsToSupabase ──────────────────────────────────────────

describe('migrateLocalClozeStatsToSupabase', () => {
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

  it('does nothing, and does not call Supabase, when there are no local Sentences stats', async () => {
    // Only a Words stat is stored: it must not be read, migrated or removed.
    store[QUIZ_LS_PREFIX + 'w-1'] = JSON.stringify({ attempts: 1, correct: 1, lastAttempt: AT });
    const cloud = mockCloud([]);
    await migrateLocalClozeStatsToSupabase('user-1');
    expect(supabase.from).not.toHaveBeenCalled();
    expect(cloud.upsert).not.toHaveBeenCalled();
    expect(Object.keys(store)).toEqual([QUIZ_LS_PREFIX + 'w-1']);
  });

  it('upserts into cloze_progress and removes only the cloze-stats keys', async () => {
    seedCloze('w-1', 4, 3);
    seedCloze('w-2', 2, 0);
    store[QUIZ_LS_PREFIX + 'w-1'] = JSON.stringify({ attempts: 1, correct: 1, lastAttempt: AT });
    store[LS_PREFIX + 'w-1'] = '{}';
    const cloud = mockCloud([]);

    await migrateLocalClozeStatsToSupabase('user-1');

    expect(vi.mocked(supabase.from).mock.calls.every(([t]) => t === 'cloze_progress')).toBe(true);
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
    expect(Object.keys(store).sort()).toEqual([QUIZ_LS_PREFIX + 'w-1', LS_PREFIX + 'w-1'].sort());
  });

  it('adds to an existing cloud row and keeps the latest last_attempt', async () => {
    seedCloze('w-1', 4, 3, '2026-10-01T10:00:00Z');
    const cloud = mockCloud([
      { vocab_id: 'w-1', attempts: 10, correct: 8, last_attempt: '2026-10-20T10:00:00Z' }
    ]);

    await migrateLocalClozeStatsToSupabase('user-1');

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
    expect(rows[0].correct).toBeLessThanOrEqual(rows[0].attempts);
  });

  it('keeps the local stats when the cloud read fails, and does not upsert', async () => {
    seedCloze('w-1', 4, 3);
    const cloud = mockCloud(null, { message: 'relation does not exist' });
    await migrateLocalClozeStatsToSupabase('user-1');
    expect(cloud.upsert).not.toHaveBeenCalled();
    expect(Object.keys(store)).toEqual([CLOZE_LS_PREFIX + 'w-1']);
  });

  it('keeps the local stats when the upsert fails, so it can be retried', async () => {
    seedCloze('w-1', 4, 3);
    mockCloud([], null, { message: 'boom' });
    await migrateLocalClozeStatsToSupabase('user-1');
    expect(Object.keys(store)).toEqual([CLOZE_LS_PREFIX + 'w-1']);
  });

  it('never throws, so a failure cannot break login', async () => {
    seedCloze('w-1', 4, 3);
    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('network');
    });
    await expect(migrateLocalClozeStatsToSupabase('user-1')).resolves.toBeUndefined();
    expect(Object.keys(store)).toEqual([CLOZE_LS_PREFIX + 'w-1']);
  });

  it('cannot double-count: a second run after success finds nothing to migrate', async () => {
    seedCloze('w-1', 4, 3);
    const cloud = mockCloud([]);
    await migrateLocalClozeStatsToSupabase('user-1');
    await migrateLocalClozeStatsToSupabase('user-1');
    expect(cloud.upsert).toHaveBeenCalledTimes(1);
  });
});

// ── clearUserProgress / clearLocalVocabularyProgress ──────────────────────────

describe('clearing local progress', () => {
  const seedEverything = () => {
    store[LS_PREFIX + 'w-1'] = '{}';
    store[GRAMMAR_LS_PREFIX + 'gq-1'] = '{}';
    store[QUIZ_LS_PREFIX + 'w-1'] = '{}';
    store[CLOZE_LS_PREFIX + 'w-1'] = '{}';
    store['vocab-quiz-limit'] = '10';
  };

  it('clearUserProgress (logout) removes the cloze-stats keys too, and nothing else', () => {
    seedEverything();
    clearUserProgress();
    expect(Object.keys(store)).toEqual(['vocab-quiz-limit']);
  });

  it('clearLocalVocabularyProgress leaves the cloze-stats keys alone', () => {
    seedEverything();
    clearLocalVocabularyProgress();
    expect(Object.keys(store).sort()).toEqual(
      [
        GRAMMAR_LS_PREFIX + 'gq-1',
        QUIZ_LS_PREFIX + 'w-1',
        CLOZE_LS_PREFIX + 'w-1',
        'vocab-quiz-limit'
      ].sort()
    );
  });
});

// ── The free to Plus sync ─────────────────────────────────────────────────────

describe('syncLocalProgressToPlus and Sentences stats', () => {
  /** card_progress is empty and readable; cloze_progress is readable and upserts succeed. */
  function mockCloud(clozeUpsertError: unknown = null) {
    const clozeUpsert = vi.fn().mockResolvedValue({ error: clozeUpsertError });
    const cardSelect = mockQuizSelect([{ data: [] }]);
    const clozeSelect = mockQuizSelect([{ data: [] }]);
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'card_progress') {
        return { select: cardSelect.select, upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'cloze_progress') {
        return { select: clozeSelect.select, upsert: clozeUpsert };
      }
      throw new Error(`unexpected table ${table}`);
    }) as never);
    return { clozeUpsert };
  }

  it('migrates a free learner’s Sentences history on upgrade, and clears its local keys', async () => {
    seedCloze('w-1', 4, 3);
    const { clozeUpsert } = mockCloud();

    await syncLocalProgressToPlus('user-1');

    expect(clozeUpsert).toHaveBeenCalledTimes(1);
    expect(Object.keys(store)).toEqual([]);
  });

  it('keeps the cloze-stats keys when the upsert fails, for a retry at the next login', async () => {
    seedCloze('w-1', 4, 3);
    mockCloud({ message: 'boom' });

    await syncLocalProgressToPlus('user-1');

    expect(Object.keys(store)).toEqual([CLOZE_LS_PREFIX + 'w-1']);
  });
});
