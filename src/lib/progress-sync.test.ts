import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import { supabase } from '$lib/supabase';
import { mockPagedSelect } from './test-utils/paged-select';
import {
  GRAMMAR_LS_PREFIX,
  LS_PREFIX,
  QUIZ_LS_PREFIX,
  clearLocalVocabularyProgress
} from './progress';
import { syncLocalProgressToPlus } from './plus-sync';

// syncLocalProgressToPlus is what auth/sync runs for a Plus user. Quiz stats and grammar
// progress are migrated in every case and each keeps its local keys when its upsert fails,
// so the next login can retry. Vocab `progress-` keys are copied up when the cloud is empty,
// discarded when it already has progress, and left alone when the read of it failed.

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

/** A row already in the cloud's card_progress table. */
const CLOUD_CARD_ROW = {
  vocab_id: 'w-000009',
  level: 'A1',
  category: 'greetings',
  due: DUE,
  stability: 1.5,
  difficulty: 5,
  elapsed_days: 0,
  scheduled_days: 1,
  learning_steps: 0,
  reps: 2,
  lapses: 0,
  state: 2,
  last_review: LAST,
  seen_count: 3,
  last_seen: LAST
};

function seedAll() {
  store[LS_PREFIX + 'w-000001'] = cardJson();
  store[GRAMMAR_LS_PREFIX + 'gq-perspron-001'] = cardJson();
  store[QUIZ_LS_PREFIX + 'w-000001'] = JSON.stringify({
    attempts: 4,
    correct: 3,
    lastAttempt: LAST
  });
}

interface CloudOptions {
  /** An upsert error per table; omitted means that table's upsert succeeds. */
  vocab?: unknown;
  grammar?: unknown;
  quiz?: unknown;
  /** Rows already in card_progress. `null` makes the read of card_progress fail. */
  cloudVocab?: unknown[] | null;
}

/** Per-table Supabase mock. */
function mockCloud({ vocab, grammar, quiz, cloudVocab = [] }: CloudOptions = {}) {
  const vocabUpsert = vi.fn().mockResolvedValue({ error: vocab ?? null });
  // Built once: the pagination loop calls from() for every page, and the mock must serve its
  // pages in order and then an empty one, not start over on each call.
  const cardSelect = mockPagedSelect([
    cloudVocab === null ? { data: null, error: { message: 'boom' } } : { data: cloudVocab }
  ]);
  const quizSelect = mockPagedSelect([{ data: [] }]);
  vi.mocked(supabase.from).mockImplementation(((table: string) => {
    if (table === 'card_progress') {
      return { select: cardSelect.select, upsert: vocabUpsert };
    }
    if (table === 'grammar_progress') {
      return { upsert: vi.fn().mockResolvedValue({ error: grammar ?? null }) };
    }
    if (table === 'quiz_progress') {
      return {
        select: quizSelect.select,
        upsert: vi.fn().mockResolvedValue({ error: quiz ?? null })
      };
    }
    throw new Error(`unexpected table ${table}`);
  }) as never);
  return { vocabUpsert };
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

describe('syncLocalProgressToPlus: empty cloud (a fresh upgrade)', () => {
  it('leaves nothing behind when every migration succeeds', async () => {
    seedAll();
    const { vocabUpsert } = mockCloud();

    await syncLocalProgressToPlus('user-1');

    expect(vocabUpsert).toHaveBeenCalledTimes(1);
    expect(Object.keys(store)).toEqual([]);
  });

  it('keeps the quiz and grammar keys when their upserts fail, but still clears progress- keys', async () => {
    seedAll();
    mockCloud({ grammar: { message: 'boom' }, quiz: { message: 'boom' } });

    await syncLocalProgressToPlus('user-1');

    expect(Object.keys(store).sort()).toEqual([
      GRAMMAR_LS_PREFIX + 'gq-perspron-001',
      QUIZ_LS_PREFIX + 'w-000001'
    ]);
  });

  it('keeps only the grammar keys when just the grammar upsert fails', async () => {
    seedAll();
    mockCloud({ grammar: { message: 'boom' } });

    await syncLocalProgressToPlus('user-1');

    expect(Object.keys(store)).toEqual([GRAMMAR_LS_PREFIX + 'gq-perspron-001']);
  });

  it('keeps only the quiz keys when just the quiz upsert fails', async () => {
    seedAll();
    mockCloud({ quiz: { message: 'boom' } });

    await syncLocalProgressToPlus('user-1');

    expect(Object.keys(store)).toEqual([QUIZ_LS_PREFIX + 'w-000001']);
  });

  it('keeps the vocab keys, and only those, when the vocab upsert fails', async () => {
    seedAll();
    mockCloud({ vocab: { message: 'boom' } });

    await syncLocalProgressToPlus('user-1');

    // Quiz and grammar migrated and were removed; the vocab keys stay for a retry.
    expect(Object.keys(store)).toEqual([LS_PREFIX + 'w-000001']);
  });
});

describe('syncLocalProgressToPlus: the cloud already has vocab progress', () => {
  it('discards the stale progress- keys without upserting them, and migrates the rest', async () => {
    seedAll();
    const { vocabUpsert } = mockCloud({ cloudVocab: [CLOUD_CARD_ROW] });

    await syncLocalProgressToPlus('user-1');

    expect(vocabUpsert).not.toHaveBeenCalled();
    expect(Object.keys(store)).toEqual([]);
  });

  it('keeps the quiz and grammar keys when their upserts fail, but still clears progress- keys', async () => {
    seedAll();
    mockCloud({
      cloudVocab: [CLOUD_CARD_ROW],
      grammar: { message: 'boom' },
      quiz: { message: 'boom' }
    });

    await syncLocalProgressToPlus('user-1');

    expect(Object.keys(store).sort()).toEqual([
      GRAMMAR_LS_PREFIX + 'gq-perspron-001',
      QUIZ_LS_PREFIX + 'w-000001'
    ]);
  });
});

describe('syncLocalProgressToPlus: the read of card_progress failed', () => {
  it('neither upserts nor discards the local progress- keys', async () => {
    seedAll();
    const { vocabUpsert } = mockCloud({ cloudVocab: null });

    await syncLocalProgressToPlus('user-1');

    // A failed read must not be taken for an empty cloud: that would upsert the local rows
    // over the real ones. The keys stay, and the next login decides again.
    expect(vocabUpsert).not.toHaveBeenCalled();
    expect(Object.keys(store)).toContain(LS_PREFIX + 'w-000001');
  });

  it('still migrates quiz stats and grammar progress', async () => {
    seedAll();
    mockCloud({ cloudVocab: null });

    await syncLocalProgressToPlus('user-1');

    expect(Object.keys(store)).toEqual([LS_PREFIX + 'w-000001']);
  });

  it('never throws, so it cannot break login', async () => {
    seedAll();
    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('network down');
    });

    await expect(syncLocalProgressToPlus('user-1')).resolves.toBeUndefined();
    expect(Object.keys(store)).toContain(LS_PREFIX + 'w-000001');
  });
});
