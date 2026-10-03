// src/lib/grammar/id-index.test.ts
// Guards the live id -> { topic, level } resolution (grammar-update.md,
// Phase 3 prerequisite): the generated grammar-id-index.json must match
// grammar.json (re-run `pnpm grammar:split` if this fails), and
// getDueGrammarItems must filter by the live values when given the resolver.

import { describe, it, expect } from 'vitest';
import { createEmptyCard, State } from 'ts-fsrs';
import grammarData from '$lib/data/grammar.json';
import type { CardProgress, GrammarQuestion } from '$lib/types';
import { getDueGrammarItems } from '$lib/progress';
import { resolveGrammarQuestion } from './id-index';

const questions = grammarData as GrammarQuestion[];

function dueCard(overrides: { level: string; category: string }): CardProgress {
  return {
    fsrs: {
      ...createEmptyCard(),
      state: State.Review,
      reps: 3,
      due: new Date(Date.now() - 86_400_000)
    },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    ...overrides
  } as unknown as CardProgress;
}

describe('resolveGrammarQuestion <-> grammar.json', () => {
  it('resolves every question id to its current topic and cefr', () => {
    const mismatched = questions
      .filter((q) => {
        const r = resolveGrammarQuestion(q.id);
        return !r || r.topic !== q.topic || r.level !== q.cefr;
      })
      .map((q) => q.id);
    expect(mismatched).toEqual([]);
  });

  it('returns undefined for an unknown id', () => {
    expect(resolveGrammarQuestion('no-such-question')).toBeUndefined();
    expect(resolveGrammarQuestion('constructor')).toBeUndefined();
  });
});

describe('getDueGrammarItems with resolve', () => {
  const q = questions.find((x) => x.topic === 'sporresetninger')!;
  const other = questions.find((x) => x.topic !== 'sporresetninger')!;

  // Stored row still carries the retired pre-1b topic id and a wrong level.
  const progressMap = {
    [q.id]: dueCard({ level: 'C', category: 'helsetninger' }),
    [other.id]: dueCard({ level: other.cefr, category: other.topic }),
    'gone-question-id': dueCard({ level: 'A1', category: 'sporresetninger' })
  };

  it('without resolve, filters on the stored (stale) topic', () => {
    const items = getDueGrammarItems(progressMap, { topic: 'sporresetninger' });
    expect(items.map((i) => i.id)).toEqual(['gone-question-id']);
  });

  it('with resolve, matches the live topic, returns the live level and drops unknown ids', () => {
    const items = getDueGrammarItems(progressMap, {
      topic: 'sporresetninger',
      resolve: resolveGrammarQuestion
    });
    expect(items).toEqual([{ id: q.id, level: q.cefr }]);
  });

  it('with resolve, level-only filtering also uses the live level', () => {
    const items = getDueGrammarItems(progressMap, {
      level: q.cefr,
      resolve: resolveGrammarQuestion
    });
    expect(items.map((i) => i.id)).toContain(q.id);
    expect(items.map((i) => i.id)).not.toContain('gone-question-id');
  });
});
