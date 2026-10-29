import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from '$lib/supabase';
import { loadGrammarProgressFromSupabase, loadProgressMapFromSupabase } from './progress';
import { mockPagedSelect } from './test-utils/paged-select';

// Supabase caps a response at the project's max_rows (1,000 by default) without an error, so
// a Plus user with more rows than that used to get a silently truncated map: wrong stats, and
// saveProgress would restart a card the map had left out. Both loaders now read every page.

beforeEach(() => {
  vi.mocked(supabase.from).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const FSRS_COLUMNS = {
  due: '2026-10-30T10:00:00.000Z',
  stability: 1.5,
  difficulty: 5,
  elapsed_days: 0,
  scheduled_days: 1,
  learning_steps: 0,
  reps: 2,
  lapses: 0,
  state: 2,
  last_review: '2026-10-01T09:00:00.000Z',
  seen_count: 3,
  last_seen: '2026-10-01T09:00:00.000Z'
};

const cardRow = (id: string) => ({
  vocab_id: id,
  level: 'A1',
  category: 'greetings',
  ...FSRS_COLUMNS
});

const grammarRow = (id: string) => ({
  question_id: id,
  topic: 'word-order',
  cefr: 'A1',
  ...FSRS_COLUMNS
});

describe('loadProgressMapFromSupabase', () => {
  it('reads card_progress ordered by vocab_id', async () => {
    const cloud = mockPagedSelect([{ data: [cardRow('w-000001')] }]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    const map = await loadProgressMapFromSupabase('user-1');

    expect(supabase.from).toHaveBeenCalledWith('card_progress');
    expect(cloud.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(cloud.order).toHaveBeenCalledWith('vocab_id', { ascending: true });
    expect(map['w-000001'].seenCount).toBe(3);
    expect(map['w-000001'].fsrs.due).toBeInstanceOf(Date);
  });

  it('reads every page, advancing by the rows returned, until an empty page', async () => {
    // Pages smaller than the page size: a project max_rows below 1,000 must not end the loop.
    const cloud = mockPagedSelect([
      { data: [cardRow('w-000001'), cardRow('w-000002')] },
      { data: [cardRow('w-000003')] }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    const map = await loadProgressMapFromSupabase('user-1');

    expect(Object.keys(map).sort()).toEqual(['w-000001', 'w-000002', 'w-000003']);
    expect(cloud.range.mock.calls).toEqual([
      [0, 999],
      [2, 1001],
      [3, 1002]
    ]);
  });

  it('returns an empty map, not a partial one, when a later page fails', async () => {
    const cloud = mockPagedSelect([
      { data: [cardRow('w-000001')] },
      { data: null, error: { message: 'boom' } }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    expect(await loadProgressMapFromSupabase('user-1')).toEqual({});
  });

  it('returns an empty map when the select errors or throws', async () => {
    const failing = mockPagedSelect([{ data: null, error: { message: 'boom' } }]);
    vi.mocked(supabase.from).mockReturnValue({ select: failing.select } as never);
    expect(await loadProgressMapFromSupabase('user-1')).toEqual({});

    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('network down');
    });
    expect(await loadProgressMapFromSupabase('user-1')).toEqual({});
  });
});

describe('loadGrammarProgressFromSupabase', () => {
  it('reads grammar_progress ordered by question_id', async () => {
    const cloud = mockPagedSelect([{ data: [grammarRow('gq-perspron-001')] }]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    const map = await loadGrammarProgressFromSupabase('user-1');

    expect(supabase.from).toHaveBeenCalledWith('grammar_progress');
    expect(cloud.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(cloud.order).toHaveBeenCalledWith('question_id', { ascending: true });
    expect(map['gq-perspron-001'].seenCount).toBe(3);
  });

  it('reads every page, advancing by the rows returned, until an empty page', async () => {
    const cloud = mockPagedSelect([
      { data: [grammarRow('gq-a'), grammarRow('gq-b')] },
      { data: [grammarRow('gq-c')] }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    const map = await loadGrammarProgressFromSupabase('user-1');

    expect(Object.keys(map).sort()).toEqual(['gq-a', 'gq-b', 'gq-c']);
    expect(cloud.range.mock.calls).toEqual([
      [0, 999],
      [2, 1001],
      [3, 1002]
    ]);
  });

  it('returns an empty map, not a partial one, when a later page fails', async () => {
    const cloud = mockPagedSelect([
      { data: [grammarRow('gq-a')] },
      { data: null, error: { message: 'boom' } }
    ]);
    vi.mocked(supabase.from).mockReturnValue({ select: cloud.select } as never);

    expect(await loadGrammarProgressFromSupabase('user-1')).toEqual({});
  });

  it('returns an empty map when the select errors or throws', async () => {
    const failing = mockPagedSelect([{ data: null, error: { message: 'boom' } }]);
    vi.mocked(supabase.from).mockReturnValue({ select: failing.select } as never);
    expect(await loadGrammarProgressFromSupabase('user-1')).toEqual({});

    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('network down');
    });
    expect(await loadGrammarProgressFromSupabase('user-1')).toEqual({});
  });
});
