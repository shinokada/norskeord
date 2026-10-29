import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from '$lib/supabase';
import { QUIZ_LS_PREFIX } from './progress';
import { loadQuizStatsOrNull } from './quiz-stats';

// The quiz page records a stat only after loadQuizStatsOrNull returned a map. For a Plus
// user a failed select must give `null`, not `{}`: recordQuizAnswer upserts absolute counts
// computed from the map, so an empty map would overwrite the word's cloud counts with 1.

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
    }
  });
  vi.mocked(supabase.from).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function mockSelect(result: unknown) {
  const eq = vi.fn().mockResolvedValue(result);
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({ eq })
  } as never);
}

describe('loadQuizStatsOrNull (Plus)', () => {
  it('returns the cloud stats keyed by vocab id', async () => {
    mockSelect({
      data: [{ vocab_id: 'w-000001', attempts: 4, correct: 3, last_attempt: '2026-10-28T10:00:00Z' }],
      error: null
    });

    expect(await loadQuizStatsOrNull('user-1')).toEqual({
      'w-000001': { attempts: 4, correct: 3, lastAttempt: '2026-10-28T10:00:00Z' }
    });
  });

  it('returns an empty map (not null) for a Plus user with no history', async () => {
    mockSelect({ data: [], error: null });
    expect(await loadQuizStatsOrNull('user-1')).toEqual({});
  });

  it('returns null when the select reports an error', async () => {
    mockSelect({ data: null, error: { message: 'boom' } });
    expect(await loadQuizStatsOrNull('user-1')).toBeNull();
  });

  it('returns null when the select throws', async () => {
    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('network down');
    });
    expect(await loadQuizStatsOrNull('user-1')).toBeNull();
  });
});

describe('loadQuizStatsOrNull (guest / free)', () => {
  it('returns the local stats without touching Supabase', async () => {
    store[QUIZ_LS_PREFIX + 'w-000001'] = JSON.stringify({
      attempts: 2,
      correct: 1,
      lastAttempt: '2026-10-28T10:00:00Z'
    });

    expect(await loadQuizStatsOrNull(null)).toEqual({
      'w-000001': { attempts: 2, correct: 1, lastAttempt: '2026-10-28T10:00:00Z' }
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns an empty map, never null, when nothing is stored', async () => {
    expect(await loadQuizStatsOrNull(null)).toEqual({});
  });
});
