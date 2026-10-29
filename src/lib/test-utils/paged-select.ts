import { vi } from 'vitest';

/**
 * Mock of a paginated Supabase select: `.select().eq().order().range()`, as used by
 * quiz-stats.ts (quiz_progress) and progress.ts (card_progress, grammar_progress).
 * Each call of range() resolves with the next page in `pages`; once they are used up it
 * resolves with an empty page, which is what ends the pagination loop. A page is
 * `{ data, error? }`; use `{ data: null, error: {...} }` for a failed page.
 */
export function mockPagedSelect(pages: Array<{ data: unknown[] | null; error?: unknown }>) {
  const range = vi.fn();
  for (const page of pages) {
    range.mockResolvedValueOnce({ data: page.data, error: page.error ?? null });
  }
  range.mockResolvedValue({ data: [], error: null });
  const order = vi.fn().mockReturnValue({ range });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, order, range };
}
