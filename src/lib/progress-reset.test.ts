import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from '$lib/supabase';
import { resetProgressInSupabase } from './progress';

describe('resetProgressInSupabase', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it('deletes the user rows from every progress table, quiz and cloze progress included', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq });
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as never);

    await resetProgressInSupabase('user-1');

    const tables = vi.mocked(supabase.from).mock.calls.map(([table]) => table);
    expect(tables.sort()).toEqual([
      'card_progress',
      'cloze_progress',
      'grammar_progress',
      'quiz_progress',
      'study_days'
    ]);
    expect(eq).toHaveBeenCalledTimes(5);
    for (const call of eq.mock.calls) expect(call).toEqual(['user_id', 'user-1']);
  });

  it('logs a failed delete without throwing', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const eq = vi.fn().mockResolvedValue({ error: { message: 'boom' } });
    vi.mocked(supabase.from).mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) } as never);

    await expect(resetProgressInSupabase('user-1')).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
  });
});
