import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeAnswer, gradeGrammarAnswer, buildGrammarSession, shuffleTokens } from './session';
import {
  loadGrammarProgressMap,
  saveGrammarProgress,
  GRAMMAR_LS_PREFIX,
  clearUserProgress
} from '$lib/progress';
import { freeGrammarQuestionIds } from '$lib/access';
import { questionLevels, topicLevels } from '$lib/vocab-helpers';
import type { CardProgress, GrammarQuestion } from '$lib/types';
import { createEmptyCard } from 'ts-fsrs';

// $lib/config's real FREE_GRAMMAR_TOPICS has every listed topic set to 'all' today
// (free at every level it spans). This test-only override adds one topic gated to a
// single CEFR level, purely to exercise the per-(topic, cefr) branch of the gating
// logic — see ai-docs/gating-rules.md "gate by topic × CEFR level, not by topic alone".
vi.mock('$lib/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/config')>();
  return {
    ...actual,
    FREE_GRAMMAR_TOPICS: {
      ...actual.FREE_GRAMMAR_TOPICS,
      'det-sentence': ['A2'] // free at A2 only, Plus-gated at B1 (real det-sentence spans both)
    }
  };
});

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
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<GrammarQuestion> = {}): GrammarQuestion {
  return {
    id: 'gq-ikke-001',
    topic: 'ikke-placement',
    cefr: 'A2',
    type: 'fill',
    sentence: 'Jeg liker _____ vinteren.',
    answer: 'ikke',
    ...overrides
  };
}

function makeProgress(daysUntilDue: number): CardProgress {
  const due = new Date();
  due.setDate(due.getDate() + daysUntilDue);
  return {
    fsrs: { ...createEmptyCard(), due },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    level: 'A2',
    category: 'ikke-placement' as CardProgress['category']
  };
}

// ── normalizeAnswer ───────────────────────────────────────────────────────────

describe('normalizeAnswer', () => {
  it('lowercases and trims', () => {
    expect(normalizeAnswer('  Ikke ')).toBe('ikke');
  });

  it('strips trailing punctuation', () => {
    expect(normalizeAnswer('Det er ikke sant.')).toBe('det er ikke sant');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeAnswer('Jeg   forstår  ikke')).toBe('jeg forstår ikke');
  });
});

// ── gradeGrammarAnswer ────────────────────────────────────────────────────────

describe('gradeGrammarAnswer', () => {
  it('marks an exact match correct with "good"', () => {
    const r = gradeGrammarAnswer('ikke', makeQuestion());
    expect(r).toEqual({ correct: true, rating: 'good' });
  });

  it('is case- and punctuation-insensitive', () => {
    const q = makeQuestion({ answer: 'Det er ikke sant.' });
    expect(gradeGrammarAnswer('det er ikke sant', q).correct).toBe(true);
  });

  it('accepts a 1-character typo as correct with "hard"', () => {
    const q = makeQuestion({ answer: 'vinteren' });
    expect(gradeGrammarAnswer('vintren', q)).toEqual({ correct: true, rating: 'hard' });
  });

  it('rejects a far-off answer with "again"', () => {
    expect(gradeGrammarAnswer('alltid', makeQuestion())).toEqual({
      correct: false,
      rating: 'again'
    });
  });

  it('requires an exact match for short answers (no typo leniency)', () => {
    // "ja" is one edit from "jo" but is the WRONG option — must be rejected.
    const q = makeQuestion({ topic: 'svar-ja-jo-nei', answer: 'Jo' });
    expect(gradeGrammarAnswer('ja', q)).toEqual({ correct: false, rating: 'again' });
    expect(gradeGrammarAnswer('Jo', q).correct).toBe(true);
  });

  it('treats empty input as incorrect', () => {
    expect(gradeGrammarAnswer('', makeQuestion())).toEqual({ correct: false, rating: 'again' });
  });

  it('accepts any of the alternates', () => {
    const q = makeQuestion({
      type: 'order',
      answer: 'Jeg forstår ikke det.',
      alternates: ['Jeg forstår ikke det']
    });
    expect(gradeGrammarAnswer('Jeg forstår ikke det', q).correct).toBe(true);
  });

  it('grades multiple-choice by matching the tapped option text against answer', () => {
    const q = makeQuestion({
      type: 'multiple-choice',
      topic: 'uttrykk-gjenkjenning-c-1',
      prompt: 'Hun har fått kalde føtter før brøllopet.',
      options: [
        'Hun nøler med å gifte seg.',
        'Hun frøs på bryllupsdagen.',
        'Hun gledet seg stort.'
      ],
      answer: 'Hun nøler med å gifte seg.'
    });
    expect(gradeGrammarAnswer('Hun nøler med å gifte seg.', q)).toEqual({
      correct: true,
      rating: 'good'
    });
    expect(gradeGrammarAnswer('Hun frøs på bryllupsdagen.', q).correct).toBe(false);
  });
});

// ── buildGrammarSession ───────────────────────────────────────────────────────

describe('buildGrammarSession', () => {
  const pool = Array.from({ length: 20 }, (_, i) =>
    makeQuestion({ id: `gq-${i}`, answer: `a${i}` })
  );

  it('caps the session at the requested count', () => {
    expect(buildGrammarSession(pool, {}, 10)).toHaveLength(10);
  });

  it('returns all questions when fewer than the count exist', () => {
    expect(buildGrammarSession(pool.slice(0, 3), {}, 10)).toHaveLength(3);
  });

  it('prioritises overdue/new cards over far-future ones', () => {
    // Make every card far-future except one, which we expect to be selected.
    const map: Record<string, CardProgress> = {};
    for (const q of pool) map[q.id] = makeProgress(365);
    map['gq-7'] = makeProgress(-5); // overdue
    const session = buildGrammarSession(pool, map, 1);
    expect(session[0].id).toBe('gq-7');
  });
});

// ── shuffleTokens ─────────────────────────────────────────────────────────────

describe('shuffleTokens', () => {
  it('preserves the multiset of tokens', () => {
    const tokens = ['ikke', 'Jeg', 'forstår', 'det'];
    expect([...shuffleTokens(tokens)].sort()).toEqual([...tokens].sort());
  });

  it('handles a single token', () => {
    expect(shuffleTokens(['ord'])).toEqual(['ord']);
  });
});

// ── freeGrammarQuestionIds ────────────────────────────────────────────────────

describe('freeGrammarQuestionIds', () => {
  it('frees every non-plusOnly question in a fully-free topic (no cap)', () => {
    const qs: GrammarQuestion[] = Array.from({ length: 8 }, (_, i) =>
      makeQuestion({ id: `ikke-${i}`, topic: 'ikke-placement', cefr: 'A2' })
    );
    const free = freeGrammarQuestionIds(qs);
    expect(free.size).toBe(8);
    qs.forEach((q) => expect(free.has(q.id)).toBe(true));
  });

  it('gates topics independently: a topic not in FREE_GRAMMAR_TOPICS stays fully locked', () => {
    const qs: GrammarQuestion[] = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeQuestion({ id: `ikke-${i}`, topic: 'ikke-placement', cefr: 'A2' })
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeQuestion({ id: `sterke-${i}`, topic: 'sterke-verb', cefr: 'A2' })
      )
    ];
    const free = freeGrammarQuestionIds(qs);
    expect(free.size).toBe(4);
    expect(free.has('ikke-0')).toBe(true);
    expect(free.has('sterke-0')).toBe(false);
  });

  it('gates the same topic differently per CEFR level', () => {
    // det-sentence is mocked above to be free at A2 only, Plus-gated at B1.
    const qs: GrammarQuestion[] = [
      makeQuestion({ id: 'det-a2', topic: 'det-sentence', cefr: 'A2' }),
      makeQuestion({ id: 'det-b1', topic: 'det-sentence', cefr: 'B1' })
    ];
    const free = freeGrammarQuestionIds(qs);
    expect(free.has('det-a2')).toBe(true);
    expect(free.has('det-b1')).toBe(false);
  });

  it('never frees plusOnly questions, even in a free topic/level', () => {
    const qs = [
      makeQuestion({ id: 'p1', topic: 'ikke-placement', cefr: 'A2', plusOnly: true }),
      makeQuestion({ id: 'f1', topic: 'ikke-placement', cefr: 'A2' })
    ];
    const free = freeGrammarQuestionIds(qs);
    expect(free.has('p1')).toBe(false);
    expect(free.has('f1')).toBe(true);
  });
});

// ── questionLevels / topicLevels ──────────────────────────────────────────────

describe('questionLevels', () => {
  it("always returns a single-item array of the question's cefr", () => {
    expect(questionLevels(makeQuestion({ cefr: 'B2' }))).toEqual(['B2']);
  });

  it('reflects cefr for every level', () => {
    expect(questionLevels(makeQuestion({ cefr: 'A2' }))).toEqual(['A2']);
  });
});

describe('topicLevels', () => {
  it('returns the sorted, de-duplicated CEFR span of a question list', () => {
    const qs = [
      makeQuestion({ id: 'a', cefr: 'A2' }),
      makeQuestion({ id: 'b', cefr: 'C' }),
      makeQuestion({ id: 'c', cefr: 'B1' })
    ];
    expect(topicLevels(qs)).toEqual(['A2', 'B1', 'C']);
  });
});

// ── grammar progress (guest / localStorage) ───────────────────────────────────

describe('saveGrammarProgress + loadGrammarProgressMap', () => {
  it('persists and rehydrates a grammar question keyed by id', async () => {
    const q = makeQuestion();
    const map = await saveGrammarProgress(q, 'good', {}, null);
    expect(map[q.id].seenCount).toBe(1);
    expect(localStorage.getItem(GRAMMAR_LS_PREFIX + q.id)).not.toBeNull();

    const loaded = loadGrammarProgressMap();
    expect(loaded[q.id]).toBeDefined();
    expect(loaded[q.id].fsrs.due).toBeInstanceOf(Date);
  });

  it('increments seenCount across ratings', async () => {
    const q = makeQuestion();
    let map = await saveGrammarProgress(q, 'good', {}, null);
    map = await saveGrammarProgress(q, 'again', map, null);
    expect(map[q.id].seenCount).toBe(2);
  });

  it('does not collide with the vocab progress- namespace', async () => {
    const q = makeQuestion();
    await saveGrammarProgress(q, 'good', {}, null);
    // grammar key uses the 'grammar-' prefix, not 'progress-'
    expect(localStorage.getItem('progress-' + q.id)).toBeNull();
  });

  it('clearUserProgress removes grammar keys', async () => {
    await saveGrammarProgress(makeQuestion(), 'good', {}, null);
    clearUserProgress();
    expect(loadGrammarProgressMap()).toEqual({});
  });
});

// ── buildGrammarSession: level distribution ───────────────────────────────────

describe('buildGrammarSession — mixed-level tie-breaking', () => {
  // Mirrors the real noun-plurals topic: 10 A2 questions followed by 2 B1
  // questions, all unseen (due = 0). Before the shuffle-first fix, slice(0,10)
  // always returned the 10 A2 questions and the B1 ones were never seen.
  const a2Questions = Array.from({ length: 10 }, (_, i) =>
    makeQuestion({ id: `a2-${i}`, cefr: 'A2', topic: 'noun-plurals', answer: `a${i}` })
  );
  const b1Questions = Array.from({ length: 2 }, (_, i) =>
    makeQuestion({ id: `b1-${i}`, cefr: 'B1', topic: 'noun-plurals', answer: `b${i}` })
  );
  const pool = [...a2Questions, ...b1Questions];

  it('B1 questions can appear in a session when all questions are unseen', () => {
    // Run many sessions; B1 questions must appear at least once.
    let b1Seen = false;
    for (let attempt = 0; attempt < 50 && !b1Seen; attempt++) {
      const session = buildGrammarSession(pool, {}, 10);
      if (session.some((q) => q.cefr === 'B1')) b1Seen = true;
    }
    expect(b1Seen).toBe(true);
  });

  it('sessions vary between runs (not always the same 10)', () => {
    const ids1 = buildGrammarSession(pool, {}, 10)
      .map((q) => q.id)
      .sort();
    let foundDifferent = false;
    for (let attempt = 0; attempt < 20 && !foundDifferent; attempt++) {
      const ids2 = buildGrammarSession(pool, {}, 10)
        .map((q) => q.id)
        .sort();
      if (ids1.join() !== ids2.join()) foundDifferent = true;
    }
    expect(foundDifferent).toBe(true);
  });

  it('overdue questions are still prioritised over new ones', () => {
    // Mark all B1 questions as far-future and all other A2 questions as near-future,
    // so only a2-3 (overdue) has the earliest due date.
    // New/unseen cards score due=0 (epoch-zero) — less than any real timestamp —
    // so we must give the non-overdue cards explicit progress entries with future dates
    // to ensure the overdue card has a strictly smaller timestamp than everything else.
    const map: Record<string, CardProgress> = {};
    for (const q of b1Questions) map[q.id] = makeProgress(365);
    for (const q of a2Questions) map[q.id] = makeProgress(30); // future, not overdue
    map['a2-3'] = makeProgress(-10); // overdue — earliest timestamp, must win
    // With only 1 slot, the overdue A2 must always win.
    const session = buildGrammarSession(pool, map, 1);
    expect(session[0].id).toBe('a2-3');
  });
});
