// src/lib/free-grammar-rows.test.ts
// freeGrammarRows: what a free user sees in the per-level grammar list
// (ai-docs/implementation/free-tier-simplification.md, Phase 6).

import { describe, it, expect } from 'vitest';
import type { StatRow } from '$lib/stats';
import { FREE_GRAMMAR_TOPICS } from '$lib/config';
import { freeGrammarRows } from '$lib/free-progress';

function row(key: string, overrides: Partial<StatRow> = {}): StatRow {
  return {
    key,
    label: key,
    href: `/grammar/${key}`,
    total: 12,
    seen: 5,
    review: 2,
    learning: 2,
    relearning: 1,
    due: 3,
    ...overrides
  };
}

// Picked from the policy itself, so this test doesn't restate which topics are free.
const freeAtA1 = (Object.keys(FREE_GRAMMAR_TOPICS) as string[]).find((t) => {
  const e = FREE_GRAMMAR_TOPICS[t as keyof typeof FREE_GRAMMAR_TOPICS];
  return e === 'all' || e?.includes('A1');
})!;
const notFreeAnywhere = 'topic-that-is-not-in-the-policy';

describe('freeGrammarRows', () => {
  it('returns Plus rows unchanged', () => {
    const rows = [row(freeAtA1), row(notFreeAnywhere)];
    expect(freeGrammarRows(rows, 'A2', true)).toBe(rows);
  });

  it('keeps free rows as they are', () => {
    const [r] = freeGrammarRows([row(freeAtA1)], 'A1', false);
    expect(r.locked).toBeUndefined();
    expect(r.seen).toBe(5);
    expect(r.due).toBe(3);
    expect(r.href).toBe(`/grammar/${freeAtA1}`);
  });

  it('turns a topic that is not free at the level into a locked teaser without progress', () => {
    const [r] = freeGrammarRows([row(freeAtA1)], 'A2', false);
    expect(r.locked).toBe(true);
    expect([r.seen, r.review, r.learning, r.relearning, r.due]).toEqual([0, 0, 0, 0, 0]);
    expect(r.total).toBe(12);
    expect(r.href).toBe(`/grammar/${freeAtA1}?level=A2`);
  });

  it('puts free rows before locked rows and keeps book order within each group', () => {
    const rows = [row('b-locked'), row(freeAtA1), row('a-locked')];
    const out = freeGrammarRows(rows, 'A1', false).map((r) => r.key);
    expect(out).toEqual([freeAtA1, 'b-locked', 'a-locked']);
  });
});
