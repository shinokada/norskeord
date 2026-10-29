import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from '$lib/supabase';
import {
  GRAMMAR_LS_PREFIX,
  LS_PREFIX,
  QUIZ_LS_PREFIX,
  clearLocalVocabularyProgress,
  migrateLocalGrammarProgressToSupabase,
  migrateLocalProgressToSupabase
} from './progress';
import { migrateLocalQuizStatsToSupabase } from './quiz-stats';

// The free to Plus sync (auth/sync) runs the quiz, grammar and vocab migrations in that
// order and then discards the stale vocab keys. Each of quiz and grammar must keep its own
// local keys when its upsert fails, so the next login can retry; only `progress-` keys are
// cleared. These tests run the same sequence the page does.

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
  vi.mocked(supabase.from).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const DUE = '2026-10-30T10:00:00.000Z';
const LAST = '2026-10-01T09:00:00.000Z';

function cardJson() {
  return JSON.stringify({
    fsrs: {
      due: DUE,
      stability: 1.5,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 2,
      lapses: 0,
      state: 2,
      last_review: LAST
    },
    seenCount: 3,
    lastSeen: LAST,
    level: 'A1',
    category: 'greetings'
  });
}

function seedAll() {
  store[LS_PREFIX + 'w-000001'] = cardJson();
  store[GRAMMAR_LS_PREFIX + 'gq-perspron-001'] = cardJson();
  store[QUIZ_LS_PREFIX + 'w-000001'] = JSON.stringify({
    attempts: 4,
    correct: 3,
    lastAttempt: LAST
  });
}

/** Per-table Supabase mock. `null` means the table's upsert succeeds. */
function mockCloud(errors: { vocab?: unknown; grammar?: unknown; quiz?: unknown } = {}) {
  const quizEq = vi.fn().mockResolvedValue({ data: [], error: null });
  vi.mocked(supabase.from).mockImplementation(((table: string) => {
    if (table === 'card_progress') {
      return { upsert: vi.fn().mockResolvedValue({ error: errors.vocab ?? null }) };
    }
    if (table === 'grammar_progress') {
      return { upsert: vi.fn().mockResolvedValue({ error: errors.grammar ?? null }) };
    }
    if (table === 'quiz_progress') {
      return {
        select: vi.fn().mockReturnValue({ eq: quizEq }),
        upsert: vi.fn().mockResolvedValue({ error: errors.quiz ?? null })
      };
    }
    throw new Error(`unexpected table ${table}`);
  }) as never);
}

/** The order auth/sync uses. */
async function runSync(userId = 'user-1') {
  await migrateLocalQuizStatsToSupabase(userId);
  await migrateLocalGrammarProgressToSupabase(userId);
  await migrateLocalProgressToSupabase(userId);
}

describe('clearLocalVocabularyProgress', () => {
  it('removes only the progress- keys', () => {
    seedAll();
    store['vocab-flashcard-mode'] = 'noreng';

    clearLocalVocabularyProgress();

    expect(Object.keys(store).sort()).toEqual([
      GRAMMAR_LS_PREFIX + 'gq-perspron-001',
      QUIZ_LS_PREFIX + 'w-000001',
      'vocab-flashcard-mode'
    ]);
  });
});

describe('free to Plus sync order', () => {
  it('leaves nothing behind when every migration succeeds', async () => {
    seedAll();
    mockCloud();

    await runSync();

    expect(Object.keys(store)).toEqual([]);
  });

  it('keeps the quiz and grammar keys when their upserts fail, but still clears progress- keys', async () => {
    seedAll();
    mockCloud({ grammar: { message: 'boom' }, quiz: { message: 'boom' } });

    await runSync();

    expect(Object.keys(store).sort()).toEqual([
      GRAMMAR_LS_PREFIX + 'gq-perspron-001',
      QUIZ_LS_PREFIX + 'w-000001'
    ]);
  });

  it('keeps only the grammar keys when just the grammar upsert fails', async () => {
    seedAll();
    mockCloud({ grammar: { message: 'boom' } });

    await runSync();

    expect(Object.keys(store)).toEqual([GRAMMAR_LS_PREFIX + 'gq-perspron-001']);
  });

  it('keeps only the quiz keys when just the quiz upsert fails', async () => {
    seedAll();
    mockCloud({ quiz: { message: 'boom' } });

    await runSync();

    expect(Object.keys(store)).toEqual([QUIZ_LS_PREFIX + 'w-000001']);
  });

  it('keeps every key the vocab migration did not own when the vocab upsert fails', async () => {
    seedAll();
    mockCloud({ vocab: { message: 'boom' } });

    await runSync();

    // Quiz and grammar migrated and were removed; the vocab keys stay for a retry.
    expect(Object.keys(store)).toEqual([LS_PREFIX + 'w-000001']);
  });
});
