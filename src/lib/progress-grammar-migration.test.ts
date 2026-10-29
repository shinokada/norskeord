import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from '$lib/supabase';
import { GRAMMAR_LS_PREFIX, LS_PREFIX, migrateLocalGrammarProgressToSupabase } from './progress';

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

const DUE = '2026-10-30T10:00:00.000Z';
const LAST = '2026-10-01T09:00:00.000Z';

function seedGrammar(id: string, lapses = 0) {
  store[GRAMMAR_LS_PREFIX + id] = JSON.stringify({
    fsrs: {
      due: DUE,
      stability: 1.5,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 2,
      lapses,
      state: 2,
      last_review: LAST
    },
    seenCount: 3,
    lastSeen: LAST,
    level: 'A1',
    category: 'personlige-pronomen'
  });
}

function mockUpsert(error: unknown = null) {
  const upsert = vi.fn().mockResolvedValue({ error });
  vi.mocked(supabase.from).mockReturnValue({ upsert } as never);
  return upsert;
}

describe('migrateLocalGrammarProgressToSupabase', () => {
  it('does nothing when there is no local grammar progress', async () => {
    const upsert = mockUpsert();
    await migrateLocalGrammarProgressToSupabase('user-1');
    expect(supabase.from).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('upserts one row per question and keeps cloud rows on conflict', async () => {
    seedGrammar('gq-perspron-001', 2);
    seedGrammar('gq-perspron-002');
    const upsert = mockUpsert();

    await migrateLocalGrammarProgressToSupabase('user-1');

    expect(supabase.from).toHaveBeenCalledWith('grammar_progress');
    expect(upsert).toHaveBeenCalledTimes(1);
    const [rows, options] = upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: 'user_id,question_id', ignoreDuplicates: true });
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual({
      user_id: 'user-1',
      question_id: 'gq-perspron-001',
      topic: 'personlige-pronomen',
      cefr: 'A1',
      due: DUE,
      stability: 1.5,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 2,
      lapses: 2,
      state: 2,
      last_review: LAST,
      seen_count: 3,
      last_seen: LAST
    });
  });

  it('removes only the grammar keys after a successful upsert', async () => {
    seedGrammar('gq-perspron-001');
    store[LS_PREFIX + 'w-000001'] = '{}';
    store['quiz-stats-w-000001'] = '{}';
    mockUpsert();

    await migrateLocalGrammarProgressToSupabase('user-1');

    expect(Object.keys(store).sort()).toEqual([LS_PREFIX + 'w-000001', 'quiz-stats-w-000001']);
  });

  it('writes a null last_review when the card has none', async () => {
    store[GRAMMAR_LS_PREFIX + 'gq-1'] = JSON.stringify({
      fsrs: {
        due: DUE,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        learning_steps: 0,
        reps: 0,
        lapses: 0,
        state: 0
      },
      seenCount: 1,
      lastSeen: LAST,
      level: 'A1',
      category: 'personlige-pronomen'
    });
    const upsert = mockUpsert();

    await migrateLocalGrammarProgressToSupabase('user-1');

    expect(upsert.mock.calls[0][0][0].last_review).toBeNull();
  });

  it('keeps the local progress when the upsert fails, so it can be retried', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    seedGrammar('gq-perspron-001');
    mockUpsert({ message: 'boom' });

    await migrateLocalGrammarProgressToSupabase('user-1');

    expect(Object.keys(store)).toEqual([GRAMMAR_LS_PREFIX + 'gq-perspron-001']);
  });

  it('never throws, so a failure cannot break login', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    seedGrammar('gq-perspron-001');
    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('network');
    });

    await expect(migrateLocalGrammarProgressToSupabase('user-1')).resolves.toBeUndefined();
    expect(Object.keys(store)).toEqual([GRAMMAR_LS_PREFIX + 'gq-perspron-001']);
  });

  it('ignores malformed local entries instead of failing the whole migration', async () => {
    store[GRAMMAR_LS_PREFIX + 'bad'] = 'not-json{{{';
    seedGrammar('gq-perspron-001');
    const upsert = mockUpsert();

    await migrateLocalGrammarProgressToSupabase('user-1');

    expect(upsert.mock.calls[0][0]).toHaveLength(1);
  });
});
