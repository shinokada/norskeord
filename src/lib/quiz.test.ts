import { describe, it, expect } from 'vitest';
import {
  getDistractors,
  buildMCQuestion,
  buildFillQuestion,
  buildTypeQuestion,
  buildQuizSession,
  levenshtein
} from './quiz';
import type { VocabEntry, CardProgress } from '$lib/types';
import { createEmptyCard } from 'ts-fsrs';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<VocabEntry> = {}): VocabEntry {
  return {
    norsk: 'jobbe',
    english: 'to work',
    example: 'Jeg liker å jobbe her.',
    example_english: 'I like to work here.',
    level: 'B1',
    category: 'work',
    part: 'verb',
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
    level: 'B1',
    category: 'work'
  };
}

// A pool large enough for distractor tests
const POOL: VocabEntry[] = [
  makeEntry({ norsk: 'jobbe', english: 'to work' }),
  makeEntry({ norsk: 'reise', english: 'to travel', category: 'travel' }),
  makeEntry({ norsk: 'spise', english: 'to eat', category: 'food' }),
  makeEntry({ norsk: 'sove', english: 'to sleep', category: 'health' }),
  makeEntry({ norsk: 'lese', english: 'to read', category: 'education' }),
  makeEntry({ norsk: 'skrive', english: 'to write', category: 'education' }),
  makeEntry({ norsk: 'snakke', english: 'to speak', category: 'communication' }),
  makeEntry({ norsk: 'høre', english: 'to listen', category: 'communication' }),
  makeEntry({
    norsk: 'gå',
    english: 'to walk',
    level: 'A1',
    category: 'verbs'
  }),
  makeEntry({
    norsk: 'komme',
    english: 'to come',
    level: 'A1',
    category: 'verbs'
  })
];

const TARGET = POOL[0]; // 'jobbe'

// ── levenshtein ───────────────────────────────────────────────────────────────

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('jobbe', 'jobbe')).toBe(0);
  });

  it('returns 1 for a single substitution', () => {
    expect(levenshtein('jobbe', 'jobbе')).toBeLessThanOrEqual(1); // same letters, subtle
    expect(levenshtein('cat', 'bat')).toBe(1);
  });

  it('returns 1 for a single insertion', () => {
    expect(levenshtein('jobbe', 'jobbbe')).toBe(1);
  });

  it('returns 1 for a single deletion', () => {
    expect(levenshtein('jobbe', 'jobe')).toBe(1);
  });

  it('returns correct distance for longer differences', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('handles empty strings', () => {
    expect(levenshtein('', '')).toBe(0);
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('is symmetric', () => {
    expect(levenshtein('jobbe', 'jobbet')).toBe(levenshtein('jobbet', 'jobbe'));
  });

  it('handles Norwegian characters', () => {
    expect(levenshtein('kjøre', 'kjore')).toBe(1);
    expect(levenshtein('bål', 'bal')).toBe(1);
  });
});

// ── getDistractors ────────────────────────────────────────────────────────────

describe('getDistractors', () => {
  it('returns exactly n entries', () => {
    const result = getDistractors(TARGET, POOL, 3);
    expect(result).toHaveLength(3);
  });

  it('never includes the target entry itself', () => {
    for (let i = 0; i < 20; i++) {
      const result = getDistractors(TARGET, POOL, 3);
      expect(result).not.toContain(TARGET);
    }
  });

  it('never includes an entry with the same english translation', () => {
    const result = getDistractors(TARGET, POOL, 3);
    for (const d of result) {
      expect(d.english).not.toBe(TARGET.english);
    }
  });

  it('prefers entries from the same CEFR level', () => {
    // All B1 distractors should come from B1 when pool is large enough
    const b1Pool = POOL.filter((e) => e.level === 'B1');
    const result = getDistractors(TARGET, POOL, 3);
    // We have 6 other B1 entries — all 3 distractors should be B1
    for (const d of result) {
      expect(d.level).toBe('B1');
    }
    expect(b1Pool.length).toBeGreaterThanOrEqual(3);
  });

  it('falls back to other levels when same-level pool is too small', () => {
    // Create a target whose level has only 1 other entry
    const smallPool: VocabEntry[] = [
      makeEntry({ norsk: 'sjelden', english: 'rarely', level: 'C', category: 'archaic' }),
      makeEntry({ norsk: 'aldri', english: 'never', level: 'C', category: 'archaic' }),
      ...POOL
    ];
    const c2Target = smallPool[0];
    // Only 1 other C2 entry — needs to pad from B1/A1 pool
    const result = getDistractors(c2Target, smallPool, 3);
    expect(result).toHaveLength(3);
    expect(result).not.toContain(c2Target);
  });

  it('returns fewer than n when pool is exhausted', () => {
    const tinyPool: VocabEntry[] = [TARGET, makeEntry({ norsk: 'reise', english: 'to travel' })];
    const result = getDistractors(TARGET, tinyPool, 3);
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result).not.toContain(TARGET);
  });

  it('returns a different order on repeated calls (shuffle)', () => {
    const results = Array.from({ length: 20 }, () =>
      getDistractors(TARGET, POOL, 3).map((e) => e.norsk)
    );
    const unique = new Set(results.map((r) => r.join(',')));
    // With 20 draws from a 7-entry same-level pool, we expect at least 2 distinct orderings
    expect(unique.size).toBeGreaterThan(1);
  });
});

// ── buildMCQuestion ───────────────────────────────────────────────────────────

describe('buildMCQuestion', () => {
  it('returns a question with type "mc"', () => {
    const q = buildMCQuestion(TARGET, POOL);
    expect(q.type).toBe('mc');
  });

  it('has exactly 4 options', () => {
    const q = buildMCQuestion(TARGET, POOL);
    expect(q.options).toHaveLength(4);
  });

  it('includes the correct answer in options', () => {
    const q = buildMCQuestion(TARGET, POOL);
    expect(q.options).toContain(TARGET.english);
  });

  it('correctIndex points to the correct answer', () => {
    const q = buildMCQuestion(TARGET, POOL);
    expect(q.options[q.correctIndex]).toBe(TARGET.english);
  });

  it('prompt is the Norwegian word in noreng direction', () => {
    const q = buildMCQuestion(TARGET, POOL, 'noreng');
    expect(q.prompt).toBe(TARGET.norsk);
  });

  it('prompt is the English word in engnor direction', () => {
    const q = buildMCQuestion(TARGET, POOL, 'engnor');
    expect(q.prompt).toBe(TARGET.english);
  });

  it('correct answer is the Norwegian word in engnor direction', () => {
    const q = buildMCQuestion(TARGET, POOL, 'engnor');
    expect(q.options[q.correctIndex]).toBe(TARGET.norsk);
  });

  it('all options are unique', () => {
    const q = buildMCQuestion(TARGET, POOL);
    const unique = new Set(q.options);
    expect(unique.size).toBe(q.options.length);
  });

  it('correct answer appears at different positions across calls (shuffle)', () => {
    const positions = new Set(
      Array.from({ length: 40 }, () => buildMCQuestion(TARGET, POOL).correctIndex)
    );
    expect(positions.size).toBeGreaterThan(1);
  });

  it('entry reference is the original entry', () => {
    const q = buildMCQuestion(TARGET, POOL);
    expect(q.entry).toBe(TARGET);
  });
});

// ── buildFillQuestion ─────────────────────────────────────────────────────────

describe('buildFillQuestion', () => {
  it('returns a question with type "fill"', () => {
    const q = buildFillQuestion(TARGET);
    expect(q.type).toBe('fill');
  });

  it('answer is the Norwegian word', () => {
    const q = buildFillQuestion(TARGET);
    expect(q.answer).toBe(TARGET.norsk);
  });

  it('sentence contains "________" when the word appears verbatim in example', () => {
    // TARGET.example = 'Jeg liker å jobbe her.' and TARGET.norsk = 'jobbe'
    const q = buildFillQuestion(TARGET);
    expect(q.sentence).toContain('________');
  });

  it('falls back to a "Hva er..." prompt when norsk does not appear verbatim', () => {
    // The entry example uses an inflected form of the verb
    const inflected = makeEntry({
      norsk: 'kjøre',
      english: 'to drive',
      example: 'Han kjørte bilen.', // 'kjørte' ≠ 'kjøre'
      example_english: 'He drove the car.'
    });
    const q = buildFillQuestion(inflected);
    expect(q.sentence).toContain('Hva er det norske ordet for');
    expect(q.sentence).toContain(inflected.english);
  });

  it('entry reference is the original entry', () => {
    const q = buildFillQuestion(TARGET);
    expect(q.entry).toBe(TARGET);
  });
});

// ── buildTypeQuestion ─────────────────────────────────────────────────────────

describe('buildTypeQuestion', () => {
  it('returns a question with type "type"', () => {
    const q = buildTypeQuestion(TARGET);
    expect(q.type).toBe('type');
  });

  it('prompt is the English word', () => {
    const q = buildTypeQuestion(TARGET);
    expect(q.prompt).toBe(TARGET.english);
  });

  it('answer is the Norwegian word', () => {
    const q = buildTypeQuestion(TARGET);
    expect(q.answer).toBe(TARGET.norsk);
  });

  it('entry reference is the original entry', () => {
    const q = buildTypeQuestion(TARGET);
    expect(q.entry).toBe(TARGET);
  });
});

// ── buildQuizSession ──────────────────────────────────────────────────────────

describe('buildQuizSession', () => {
  it('returns the requested number of questions when pool is large enough', () => {
    const session = buildQuizSession(POOL, POOL, {}, 5);
    expect(session).toHaveLength(5);
  });

  it('defaults to 10 questions when count is omitted', () => {
    // POOL has 10 entries — all new (no progress)
    const session = buildQuizSession(POOL, POOL, {});
    expect(session).toHaveLength(10);
  });

  it('respects count=5', () => {
    const session = buildQuizSession(POOL, POOL, {}, 5);
    expect(session).toHaveLength(5);
  });

  it('respects count=15 when pool has enough entries', () => {
    // Build a pool of 20 entries
    const bigPool = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ norsk: `word${i}`, english: `word ${i} en` })
    );
    const session = buildQuizSession(bigPool, bigPool, {}, 15);
    expect(session).toHaveLength(15);
  });

  it('respects count=20 when pool has enough entries', () => {
    const bigPool = Array.from({ length: 25 }, (_, i) =>
      makeEntry({ norsk: `word${i}`, english: `word ${i} en` })
    );
    const session = buildQuizSession(bigPool, bigPool, {}, 20);
    expect(session).toHaveLength(20);
  });

  it('returns fewer questions when entries are fewer than count', () => {
    const tiny = POOL.slice(0, 3);
    const session = buildQuizSession(tiny, POOL, {}, 10);
    expect(session).toHaveLength(3);
  });

  it('each question has a valid type', () => {
    const session = buildQuizSession(POOL, POOL, {}, 8);
    for (const q of session) {
      expect(['mc', 'fill', 'type']).toContain(q.type);
    }
  });

  it('distributes question types roughly 50% mc, 25% fill, 25% type', () => {
    const session = buildQuizSession(POOL, POOL, {}, 8);
    const counts = { mc: 0, fill: 0, type: 0 };
    for (const q of session) counts[q.type]++;
    expect(counts.mc).toBe(4);
    expect(counts.fill).toBe(2);
    expect(counts.type).toBe(2);
  });

  it('places overdue cards before new cards', () => {
    const overdueEntry = makeEntry({ norsk: 'jobbe', english: 'to work' });
    const newEntry = makeEntry({ norsk: 'reise', english: 'to travel' });

    const progressMap: Record<string, CardProgress> = {
      jobbe: makeProgress(-1) // overdue by 1 day
    };

    // Run several times to account for the internal shuffle within each group
    const overdueFirst = Array.from({ length: 20 }, () => {
      const session = buildQuizSession([newEntry, overdueEntry], POOL, progressMap, 2);
      return session[0].entry.norsk === 'jobbe';
    });

    // Overdue card should always be first since there is only one overdue entry
    expect(overdueFirst.every(Boolean)).toBe(true);
  });

  it('excludes cards not yet due', () => {
    const futureEntry = makeEntry({ norsk: 'jobbe', english: 'to work' });
    const progressMap: Record<string, CardProgress> = {
      jobbe: makeProgress(5) // due in 5 days
    };
    // Pool only has futureEntry — it should be treated as a non-due card, not excluded
    const session = buildQuizSession([futureEntry], POOL, progressMap, 1);
    // It's not overdue, but it's also not new — it simply won't appear in the `due` bucket.
    // The pool is: due=[], new=[] (it has progress). So session length is 0.
    expect(session).toHaveLength(0);
  });

  it('returns empty array when entries is empty', () => {
    expect(buildQuizSession([], POOL, {}, 10)).toHaveLength(0);
  });

  it('all questions reference entries from the provided entries array', () => {
    const session = buildQuizSession(POOL, POOL, {}, 5);
    for (const q of session) {
      expect(POOL).toContain(q.entry);
    }
  });
});
