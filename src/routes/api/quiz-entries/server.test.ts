// POST /api/quiz-entries (cloze-quiz.md, Phase 2): mode validation, the Sentences payload
// and the plan gate. Runs against the real data; only the usage counter is mocked, so no
// Supabase is needed.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const recordContentUsage = vi.fn();

vi.mock('$lib/server/content-usage', () => ({
  recordContentUsage: (...args: unknown[]) => recordContentUsage(...args),
  shouldBlock: () => false,
  rateLimitedResponse: () => new Response('rate limited', { status: 429 })
}));

import { POST } from './+server';
import uttrykkA2 from '$lib/data/uttrykk-a2.json';
import uttrykkB1 from '$lib/data/uttrykk-b1.json';
import uttrykkB2 from '$lib/data/uttrykk-b2.json';
import clozeCountsJson from '$lib/data/cloze-counts.json';
import { quizPoolSize, type ClozeItemData, type QuizCategoryCount } from '$lib/quiz-gate';
import type { VocabEntry } from '$lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/quiz-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function makeLocals(plan: 'free' | 'plus' | null, userId: string | null = null) {
  return { plan, user: userId ? { id: userId } : null } as never;
}

async function call(body: unknown, plan: 'free' | 'plus' | null = 'free') {
  return POST({
    request: makeRequest(body),
    locals: makeLocals(plan, plan === 'plus' ? 'user-1' : null)
  } as never);
}

interface SentencesBody {
  entries: VocabEntry[];
  cloze: Record<string, ClozeItemData>;
}
interface WordsBody {
  entries: VocabEntry[];
  distractors: VocabEntry[];
}

beforeEach(() => {
  recordContentUsage.mockReset();
  recordContentUsage.mockResolvedValue({ counted: false, over: false });
});

// ── Validation ────────────────────────────────────────────────────────────────

describe('POST /api/quiz-entries: validation', () => {
  it('returns 400 for invalid JSON', async () => {
    const res = await POST({
      request: new Request('http://localhost/api/quiz-entries', {
        method: 'POST',
        body: 'not json {'
      }),
      locals: makeLocals('free')
    } as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 for an unknown level', async () => {
    expect((await call({ level: 'Z9' })).status).toBe(400);
    expect((await call({})).status).toBe(400);
  });

  it('returns 400 for a category that is not a short string', async () => {
    expect((await call({ level: 'A1', category: 5 })).status).toBe(400);
    expect((await call({ level: 'A1', category: 'x'.repeat(101) })).status).toBe(400);
  });

  it.each([
    ['an unknown string', 'cloze'],
    ['null', null],
    ['an array', ['sentences']],
    ['an object', { mode: 'sentences' }],
    ['a number', 1],
    ['an empty string', '']
  ])('returns 400 when mode is %s', async (_label, mode) => {
    const res = await call({ level: 'A1', mode });
    expect(res.status).toBe(400);
  });

  it('accepts words and sentences', async () => {
    expect((await call({ level: 'A1', mode: 'words' })).status).toBe(200);
    expect((await call({ level: 'A1', mode: 'sentences' })).status).toBe(200);
  });
});

// ── Words mode is unchanged ───────────────────────────────────────────────────

describe('POST /api/quiz-entries: words mode', () => {
  it('returns the same payload with no mode and with mode "words"', async () => {
    const without = (await (await call({ level: 'A1', category: 'food' })).json()) as WordsBody;
    const withMode = (await (
      await call({ level: 'A1', category: 'food', mode: 'words' })
    ).json()) as WordsBody;
    expect(withMode).toEqual(without);
    expect(Object.keys(without).sort()).toEqual(['distractors', 'entries']);
    expect(without.entries.length).toBeGreaterThan(0);
    expect(without.distractors.length).toBeGreaterThan(0);
  });

  it('is never cached, because the payload differs by plan', async () => {
    const res = await call({ level: 'A1' });
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });
});

// ── Sentences payload ─────────────────────────────────────────────────────────

describe('POST /api/quiz-entries: sentences mode', () => {
  it('returns { entries, cloze } and no distractors', async () => {
    const res = await call({ level: 'A1', mode: 'sentences' });
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    const body = (await res.json()) as SentencesBody;
    expect(Object.keys(body).sort()).toEqual(['cloze', 'entries']);
    expect(body.entries.length).toBeGreaterThan(0);
  });

  it('has one item per entry and every item rebuilds the example', async () => {
    const body = (await (
      await call({ level: 'A2', mode: 'sentences' }, 'plus')
    ).json()) as SentencesBody;
    expect(Object.keys(body.cloze).sort()).toEqual(body.entries.map((e) => e.id).sort());
    for (const e of body.entries) {
      const item = body.cloze[e.id];
      expect(item.before + item.answer + item.after, e.id).toBe(e.example);
    }
  });

  it('narrows to a category', async () => {
    const body = (await (
      await call({ level: 'A1', category: 'food', mode: 'sentences' })
    ).json()) as SentencesBody;
    expect(body.entries.length).toBeGreaterThan(0);
    expect(body.entries.every((e) => e.category === 'food')).toBe(true);
  });

  it('counts a sentences call for a Plus caller, under the same endpoint', async () => {
    const body = (await (
      await call({ level: 'A1', mode: 'sentences' }, 'plus')
    ).json()) as SentencesBody;
    expect(recordContentUsage).toHaveBeenCalledTimes(1);
    expect(recordContentUsage).toHaveBeenCalledWith({
      userId: 'user-1',
      plan: 'plus',
      endpoint: 'quiz-entries',
      entries: body.entries.length
    });
  });
});

// ── Plan gate ─────────────────────────────────────────────────────────────────

describe('POST /api/quiz-entries: sentences plan gate', () => {
  it('gives Plus more than a free caller at B2', async () => {
    const free = (await (
      await call({ level: 'B2', mode: 'sentences' }, 'free')
    ).json()) as SentencesBody;
    const plus = (await (
      await call({ level: 'B2', mode: 'sentences' }, 'plus')
    ).json()) as SentencesBody;
    expect(plus.entries.length).toBeGreaterThan(free.entries.length);
    // Everything a free caller gets, Plus gets too.
    const plusIds = new Set(plus.entries.map((e) => e.id));
    expect(free.entries.every((e) => plusIds.has(e.id))).toBe(true);
  });

  it('gives a guest (no plan) the same as a free caller', async () => {
    const free = (await (
      await call({ level: 'B1', mode: 'sentences' }, 'free')
    ).json()) as SentencesBody;
    const guest = (await (
      await call({ level: 'B1', mode: 'sentences' }, null)
    ).json()) as SentencesBody;
    expect(guest.entries.map((e) => e.id)).toEqual(free.entries.map((e) => e.id));
  });

  it('gives a free caller no A2 to B2 uttrykk, and Plus gets some', async () => {
    const uttrykkIds = new Set<string>(
      [
        ...(uttrykkA2 as VocabEntry[]),
        ...(uttrykkB1 as VocabEntry[]),
        ...(uttrykkB2 as VocabEntry[])
      ].map((e) => e.id)
    );
    for (const level of ['A2', 'B1', 'B2']) {
      const free = (await (
        await call({ level, mode: 'sentences' }, 'free')
      ).json()) as SentencesBody;
      const plus = (await (
        await call({ level, mode: 'sentences' }, 'plus')
      ).json()) as SentencesBody;
      expect(
        free.entries.filter((e) => uttrykkIds.has(e.id)),
        level
      ).toEqual([]);
      expect(plus.entries.filter((e) => uttrykkIds.has(e.id)).length, level).toBeGreaterThan(0);
    }
  });

  it('gives a free caller nothing for a Plus-only category and Plus something', async () => {
    // Find a locked category from the data instead of hard-coding one, so a policy change
    // does not break the test.
    const rows = clozeCountsJson as unknown as QuizCategoryCount[];
    const locked = rows.find(
      (c) =>
        c.level === 'B2' &&
        quizPoolSize(rows, 'B2', c.category, false) === 0 &&
        quizPoolSize(rows, 'B2', c.category, true) > 0
    );
    expect(locked).toBeDefined();
    if (!locked) return;

    const free = (await (
      await call({ level: 'B2', category: locked.category, mode: 'sentences' }, 'free')
    ).json()) as SentencesBody;
    expect(free).toEqual({ entries: [], cloze: {} });

    const plus = (await (
      await call({ level: 'B2', category: locked.category, mode: 'sentences' }, 'plus')
    ).json()) as SentencesBody;
    expect(plus.entries.length).toBeGreaterThan(0);
  });

  it('ignores a plan claimed in the body', async () => {
    const honest = (await (
      await call({ level: 'B2', mode: 'sentences' }, 'free')
    ).json()) as SentencesBody;
    const claimed = (await (
      await call({ level: 'B2', mode: 'sentences', plan: 'plus', isPlus: true }, 'free')
    ).json()) as SentencesBody;
    expect(claimed.entries.map((e) => e.id)).toEqual(honest.entries.map((e) => e.id));
  });
});
