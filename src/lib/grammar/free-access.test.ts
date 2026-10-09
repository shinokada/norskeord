// src/lib/grammar/free-access.test.ts
// Guard for the free grammar numbers. The totals shown to free users come from the
// topic index plus the policy; this checks them against the real questions, so a
// mismatch (index out of date, an individually plusOnly question, a policy change that
// the index doesn't follow) fails here instead of showing wrong numbers on the page.

import { describe, it, expect } from 'vitest';
import grammarData from '$lib/data/grammar.json';
import { freeGrammarQuestionIds, isFreeGrammarTopic } from '$lib/access';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { freeGrammarTotal } from './free-access';
import { buildGrammarProgress } from './progress';

const questions = grammarData as GrammarQuestion[];
const freeIds = freeGrammarQuestionIds(questions);
const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

/** Sum of the per-level totals, which cover every topic in the index (not only placed ones). */
function levelTotal(progress: ReturnType<typeof buildGrammarProgress>): number {
  return LEVELS.reduce((sum, level) => sum + progress.byLevel[level].total, 0);
}

describe('free grammar totals', () => {
  it('freeGrammarTotal equals the number of free questions, per topic', () => {
    const expected = new Map<string, number>();
    for (const q of questions) {
      if (freeIds.has(q.id)) expected.set(q.topic, (expected.get(q.topic) ?? 0) + 1);
    }
    const topics = new Set<string>(questions.map((q) => q.topic));
    const mismatched: Record<string, { index: number; questions: number }> = {};
    for (const topic of topics) {
      const fromIndex = freeGrammarTotal(topic as GrammarTopic);
      const fromQuestions = expected.get(topic) ?? 0;
      if (fromIndex !== fromQuestions) {
        mismatched[topic] = { index: fromIndex, questions: fromQuestions };
      }
    }
    expect(mismatched).toEqual({});
  });

  it('the scoped roll-up total equals the number of free questions', () => {
    const progress = buildGrammarProgress({}, new Date(), isFreeGrammarTopic);
    expect(levelTotal(progress)).toBe(freeIds.size);
  });

  it('the unscoped roll-up still counts every question', () => {
    const progress = buildGrammarProgress({});
    expect(levelTotal(progress)).toBeGreaterThan(freeIds.size);
  });
});
