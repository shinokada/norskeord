import { describe, expect, it } from 'vitest';
import { FREE_QUIZ_CATEGORIES } from '$lib/config';
import type { CEFRLevel } from '$lib/types';
import type { ResolvedLocation } from '$lib/free-progress';
import type { QuizCategoryCount } from '$lib/quiz-gate';
import type { QuizStat, QuizStatsMap } from '$lib/quiz-stats';
import {
  CLOZE_MASTERED_MIN_ACCURACY,
  CLOZE_MASTERED_MIN_CORRECT,
  clozeStatRowsForLevel,
  isClozeMastered
} from './cloze-stats';

// ai-docs/implementation/cloze-quiz.md, Phase 5: per-category bars for the Sentences section.

const stat = (attempts: number, correct: number): QuizStat => ({
  attempts,
  correct,
  lastAttempt: '2026-10-30T10:00:00.000Z'
});

const count = (
  level: CEFRLevel,
  category: string,
  vocab: number,
  uttrykk: number
): QuizCategoryCount => ({
  level,
  category: category as QuizCategoryCount['category'],
  vocab,
  uttrykk
});

// A free A2 category, read from the policy itself so the test does not hard-code it.
const FREE_A2 = [...FREE_QUIZ_CATEGORIES].find((k) => k.startsWith('a2/'))!.split('/')[1];
// Not in FREE_QUIZ_CATEGORIES, so Plus-only above A1.
const LOCKED_A2 = 'zz-not-a-free-category';

const COUNTS: QuizCategoryCount[] = [
  count('A1', 'greetings', 9, 11),
  count('A1', 'animals', 5, 0),
  count('A1', 'empty-one', 0, 0),
  count('A2', FREE_A2, 6, 4),
  count('A2', LOCKED_A2, 7, 0),
  count('B1', 'greetings', 3, 0)
];

// What each fixture id resolves to (live location, like content-lookup.ts).
const LOCATIONS: Record<string, ResolvedLocation> = {
  'w-a1-greet-1': { level: 'A1', category: 'greetings', type: 'vocab' },
  'w-a1-greet-2': { level: 'A1', category: 'greetings', type: 'vocab' },
  'w-a1-greet-3': { level: 'A1', category: 'greetings', type: 'vocab' },
  'u-a1-greet-1': { level: 'A1', category: 'greetings', type: 'uttrykk' },
  'w-a1-animal-1': { level: 'A1', category: 'animals', type: 'vocab' },
  'w-a2-free-1': { level: 'A2', category: FREE_A2, type: 'vocab' },
  'u-a2-free-1': { level: 'A2', category: FREE_A2, type: 'uttrykk' },
  'w-a2-locked-1': { level: 'A2', category: LOCKED_A2, type: 'vocab' },
  'w-b1-greet-1': { level: 'B1', category: 'greetings', type: 'vocab' }
};
const resolve = (id: string) => LOCATIONS[id] ?? null;

function rowFor(
  rows: ReturnType<typeof clozeStatRowsForLevel>,
  type: 'vocab' | 'uttrykk',
  key: string
) {
  return rows[type].find((r) => r.key === key);
}

describe('isClozeMastered', () => {
  it('needs at least 3 correct answers and 75% accuracy', () => {
    expect(CLOZE_MASTERED_MIN_CORRECT).toBe(3);
    expect(CLOZE_MASTERED_MIN_ACCURACY).toBe(0.75);

    expect(isClozeMastered(stat(3, 3))).toBe(true);
    expect(isClozeMastered(stat(4, 3))).toBe(true); // exactly 75%
    expect(isClozeMastered(stat(12, 9))).toBe(true);
  });

  it('is false below 3 correct answers, however accurate', () => {
    expect(isClozeMastered(stat(1, 1))).toBe(false);
    expect(isClozeMastered(stat(2, 2))).toBe(false);
  });

  it('is false below 75% accuracy, however many correct answers', () => {
    expect(isClozeMastered(stat(5, 3))).toBe(false); // 60%
    expect(isClozeMastered(stat(10, 7))).toBe(false); // 70%
    expect(isClozeMastered(stat(100, 74))).toBe(false);
  });

  it('is false for a word with no attempts', () => {
    expect(isClozeMastered(stat(0, 0))).toBe(false);
  });
});

describe('clozeStatRowsForLevel', () => {
  it('takes totals from the cloze counts, one row per category and type', () => {
    const rows = clozeStatRowsForLevel('A1', {}, COUNTS, true, resolve);

    expect(rows.vocab.map((r) => [r.key, r.total])).toEqual([
      ['greetings', 9],
      ['animals', 5]
    ]);
    expect(rows.uttrykk.map((r) => [r.key, r.total])).toEqual([['greetings', 11]]);
    // Nothing practised yet: every bar is at zero.
    for (const row of [...rows.vocab, ...rows.uttrykk]) {
      expect(row.practiced).toBe(0);
      expect(row.mastered).toBe(0);
    }
  });

  it('leaves out categories with nothing to practise', () => {
    const rows = clozeStatRowsForLevel('A1', {}, COUNTS, true, resolve);
    expect(rowFor(rows, 'vocab', 'empty-one')).toBeUndefined();
    expect(rowFor(rows, 'uttrykk', 'empty-one')).toBeUndefined();
    // animals has no cloze-able uttrykk
    expect(rowFor(rows, 'uttrykk', 'animals')).toBeUndefined();
  });

  it('gives every row a label and a Sentences practice link for its level and category', () => {
    const rows = clozeStatRowsForLevel('A1', {}, COUNTS, true, resolve);
    for (const row of [...rows.vocab, ...rows.uttrykk]) {
      expect(row.label.length).toBeGreaterThan(0);
      expect(row.href).toBe(`/quiz?mode=sentences&level=A1&category=${row.key}`);
    }
  });

  it('counts practiced and mastered words per category and type', () => {
    const map: QuizStatsMap = {
      'w-a1-greet-1': stat(5, 4), // mastered
      'w-a1-greet-2': stat(2, 1), // practiced only
      'w-a1-greet-3': stat(3, 3), // mastered
      'u-a1-greet-1': stat(1, 0), // uttrykk, practiced only
      'w-a1-animal-1': stat(4, 2) // practiced only (50%)
    };
    const rows = clozeStatRowsForLevel('A1', map, COUNTS, true, resolve);

    expect(rowFor(rows, 'vocab', 'greetings')).toMatchObject({ practiced: 3, mastered: 2 });
    expect(rowFor(rows, 'uttrykk', 'greetings')).toMatchObject({ practiced: 1, mastered: 0 });
    expect(rowFor(rows, 'vocab', 'animals')).toMatchObject({ practiced: 1, mastered: 0 });
  });

  it('shows a bar that is partial and one that is full', () => {
    const counts = [count('A1', 'greetings', 2, 0), count('A1', 'animals', 1, 0)];
    const map: QuizStatsMap = {
      'w-a1-greet-1': stat(3, 3),
      'w-a1-animal-1': stat(3, 3)
    };
    const rows = clozeStatRowsForLevel('A1', map, counts, true, resolve);

    expect(rowFor(rows, 'vocab', 'greetings')).toMatchObject({ total: 2, practiced: 1 });
    expect(rowFor(rows, 'vocab', 'animals')).toMatchObject({ total: 1, practiced: 1, mastered: 1 });
  });

  it('counts only the selected level', () => {
    const map: QuizStatsMap = {
      'w-a1-greet-1': stat(3, 3),
      'w-b1-greet-1': stat(3, 3)
    };
    const a1 = clozeStatRowsForLevel('A1', map, COUNTS, true, resolve);
    const b1 = clozeStatRowsForLevel('B1', map, COUNTS, true, resolve);

    expect(rowFor(a1, 'vocab', 'greetings')).toMatchObject({ total: 9, practiced: 1 });
    expect(rowFor(b1, 'vocab', 'greetings')).toMatchObject({ total: 3, practiced: 1 });
    expect(b1.uttrykk).toEqual([]);
  });

  it('drops ids that resolve nowhere and ids with no row', () => {
    const map: QuizStatsMap = {
      'w-deleted': stat(9, 9), // resolves nowhere
      'w-a1-greet-1': stat(1, 1)
    };
    const rows = clozeStatRowsForLevel('A1', map, COUNTS, true, resolve);

    expect(rowFor(rows, 'vocab', 'greetings')).toMatchObject({ practiced: 1 });
    const practiced = [...rows.vocab, ...rows.uttrykk].reduce((n, r) => n + r.practiced, 0);
    expect(practiced).toBe(1);
  });

  it('never lets a bar pass 100% when stats outnumber the cloze entries', () => {
    const counts = [count('A1', 'greetings', 2, 0)];
    const map: QuizStatsMap = {
      'w-a1-greet-1': stat(3, 3),
      'w-a1-greet-2': stat(3, 3),
      'w-a1-greet-3': stat(3, 3) // an entry that lost its sidecar item since
    };
    const row = rowFor(
      clozeStatRowsForLevel('A1', map, counts, true, resolve),
      'vocab',
      'greetings'
    );

    expect(row).toMatchObject({ total: 2, practiced: 2, mastered: 2 });
  });

  it('orders rows by size, largest first', () => {
    const counts = [
      count('A1', 'animals', 5, 0),
      count('A1', 'greetings', 9, 0),
      count('A1', 'body', 7, 0)
    ];
    const rows = clozeStatRowsForLevel('A1', {}, counts, true, resolve);
    expect(rows.vocab.map((r) => r.key)).toEqual(['greetings', 'body', 'animals']);
  });

  describe('plan gate', () => {
    const map: QuizStatsMap = {
      'w-a2-free-1': stat(3, 3),
      'u-a2-free-1': stat(3, 3),
      'w-a2-locked-1': stat(3, 3)
    };

    it('shows a free user every A1 row, like Plus', () => {
      const free = clozeStatRowsForLevel('A1', {}, COUNTS, false, resolve);
      const plus = clozeStatRowsForLevel('A1', {}, COUNTS, true, resolve);
      expect(free).toEqual(plus);
    });

    it('shows a free user only the free vocab category above A1, and no A2 uttrykk', () => {
      const rows = clozeStatRowsForLevel('A2', map, COUNTS, false, resolve);

      expect(rows.vocab.map((r) => r.key)).toEqual([FREE_A2]);
      expect(rows.vocab[0]).toMatchObject({ total: 6, practiced: 1, mastered: 1 });
      expect(rows.uttrykk).toEqual([]);
    });

    it('does not count a free user\u2019s progress in a category they cannot open', () => {
      const rows = clozeStatRowsForLevel('A2', map, COUNTS, false, resolve);
      const practiced = [...rows.vocab, ...rows.uttrykk].reduce((n, r) => n + r.practiced, 0);
      expect(practiced).toBe(1); // only the free vocab word
    });

    it('shows Plus every category and the A2 uttrykk', () => {
      const rows = clozeStatRowsForLevel('A2', map, COUNTS, true, resolve);

      expect(rows.vocab.map((r) => r.key).sort()).toEqual([FREE_A2, LOCKED_A2].sort());
      expect(rowFor(rows, 'vocab', LOCKED_A2)).toMatchObject({ total: 7, practiced: 1 });
      expect(rowFor(rows, 'uttrykk', FREE_A2)).toMatchObject({ total: 4, practiced: 1 });
    });
  });
});
