import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import {
  CLOZE_LS_PREFIX,
  GRAMMAR_LS_PREFIX,
  LS_PREFIX,
  QUIZ_LS_PREFIX,
  loadGrammarProgressMap,
  loadProgressMap
} from './progress';
import { loadClozeStats, loadQuizStats } from './quiz-stats';
import {
  LIVE_OWNER_KEY,
  PARKED_MAX_AGE_DAYS,
  PARKED_PREFIX,
  adoptLiveProgress,
  discardAccountProgress,
  parkForLogout,
  parkUserProgress,
  purgeExpiredParkedProgress,
  purgeParkedProgress,
  restoreParkedProgress
} from './parked-progress';

const store: Record<string, string> = {};
let failSet: ((key: string) => boolean) | null = null;

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  failSet = null;
  vi.stubGlobal('localStorage', {
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      if (failSet?.(k)) throw new Error('QuotaExceededError');
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    }
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const NOW = new Date('2026-10-31T12:00:00.000Z');
const DAY = 86_400_000;

function card(lastSeen: string): string {
  return JSON.stringify({
    fsrs: {
      due: '2026-11-05T10:00:00.000Z',
      stability: 1.5,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 2,
      lapses: 0,
      state: 2,
      last_review: '2026-10-01T09:00:00.000Z'
    },
    seenCount: 2,
    lastSeen,
    level: 'A1',
    category: 'food'
  });
}

function stat(attempts: number, correct: number, lastAttempt: string): string {
  return JSON.stringify({ attempts, correct, lastAttempt });
}

const T1 = '2026-10-01T09:00:00.000Z';
const T2 = '2026-10-20T09:00:00.000Z';

/** One valid entry in every store, with the raw strings kept for comparison. */
function seedAll(): Record<string, string> {
  const live = {
    [`${LS_PREFIX}w-000001`]: card(T1),
    [`${GRAMMAR_LS_PREFIX}g-000001`]: card(T1),
    [`${QUIZ_LS_PREFIX}w-000001`]: stat(4, 3, T1),
    [`${CLOZE_LS_PREFIX}w-000001`]: stat(2, 1, T1)
  };
  Object.assign(store, live);
  return live;
}

function parkedKeys(): string[] {
  return Object.keys(store).filter((k) => k.startsWith(PARKED_PREFIX));
}

function liveKeys(): string[] {
  return Object.keys(store).filter(
    (k) =>
      k.startsWith(LS_PREFIX) ||
      k.startsWith(GRAMMAR_LS_PREFIX) ||
      k.startsWith(QUIZ_LS_PREFIX) ||
      k.startsWith(CLOZE_LS_PREFIX)
  );
}

describe('parkUserProgress', () => {
  it('moves all four stores into one blob each and removes the live keys', () => {
    seedAll();

    const result = parkUserProgress('user-a', NOW);

    expect(result).toEqual({ parked: 4, failed: [] });
    expect(liveKeys()).toEqual([]);
    expect(parkedKeys().sort()).toEqual([
      'parked:user-a:cloze',
      'parked:user-a:grammar',
      'parked:user-a:progress',
      'parked:user-a:quiz'
    ]);
  });

  it('writes no blob for a store with no keys', () => {
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(1, 1, T1);

    parkUserProgress('user-a', NOW);

    expect(parkedKeys()).toEqual(['parked:user-a:cloze']);
  });

  it('leaves keys that are not progress alone', () => {
    seedAll();
    store['stats-active-tab'] = 'quiz';
    store['quiz-mode'] = 'cloze';
    store['locale'] = 'nb';
    store['login_pending'] = '1';

    parkUserProgress('user-a', NOW);

    expect(store['stats-active-tab']).toBe('quiz');
    expect(store['quiz-mode']).toBe('cloze');
    expect(store['locale']).toBe('nb');
    expect(store['login_pending']).toBe('1');
  });

  it('removes the live-owner marker', () => {
    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';

    parkUserProgress('user-a', NOW);

    expect(store[LIVE_OWNER_KEY]).toBeUndefined();
  });

  it('hides parked data from every loader', async () => {
    seedAll();

    parkUserProgress('user-a', NOW);

    expect(await loadProgressMap()).toEqual({});
    expect(loadGrammarProgressMap()).toEqual({});
    expect(await loadQuizStats(null)).toEqual({});
    expect(await loadClozeStats(null)).toEqual({});
  });

  it('merges with a blob left by an earlier logout instead of overwriting it', () => {
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(2, 1, T1);
    store[`${CLOZE_LS_PREFIX}w-000002`] = stat(5, 5, T1);
    parkUserProgress('user-a', NOW);

    // The blob was never restored; the same account studies again as a guest and logs out
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(1, 1, T2);
    store[`${CLOZE_LS_PREFIX}w-000003`] = stat(1, 0, T2);
    parkUserProgress('user-a', NOW);
    restoreParkedProgress('user-a');

    expect(JSON.parse(store[`${CLOZE_LS_PREFIX}w-000001`])).toEqual({
      attempts: 3,
      correct: 2,
      lastAttempt: T2
    });
    expect(store[`${CLOZE_LS_PREFIX}w-000002`]).toBe(stat(5, 5, T1));
    expect(store[`${CLOZE_LS_PREFIX}w-000003`]).toBe(stat(1, 0, T2));
  });

  it('still parks the other stores and removes the live keys when one blob cannot be written', () => {
    const live = seedAll();
    failSet = (key) => key === 'parked:user-a:quiz';

    const result = parkUserProgress('user-a', NOW);

    expect(result.failed).toEqual(['quiz']);
    expect(result.parked).toBe(3);
    expect(liveKeys()).toEqual([]);
    expect(store['parked:user-a:quiz']).toBeUndefined();
    expect(Object.keys(live)).toHaveLength(4);
    expect(parkedKeys().sort()).toEqual([
      'parked:user-a:cloze',
      'parked:user-a:grammar',
      'parked:user-a:progress'
    ]);
  });
});

describe('restoreParkedProgress', () => {
  it('round-trips every store byte for byte and deletes the blobs', () => {
    const live = seedAll();
    parkUserProgress('user-a', NOW);

    const restored = restoreParkedProgress('user-a');

    expect(restored).toBe(4);
    for (const [key, raw] of Object.entries(live)) expect(store[key]).toBe(raw);
    expect(parkedKeys()).toEqual([]);
  });

  it('never gives one account the blobs of another', () => {
    seedAll();
    parkUserProgress('user-a', NOW);

    adoptLiveProgress('user-b', NOW);

    expect(liveKeys()).toEqual([]);
    expect(parkedKeys()).toHaveLength(4);
  });

  it('takes the parked entry when there is no live key', () => {
    store[`${LS_PREFIX}w-000001`] = card(T1);
    parkUserProgress('user-a', NOW);

    restoreParkedProgress('user-a');

    expect(store[`${LS_PREFIX}w-000001`]).toBe(card(T1));
  });

  it('keeps the entry with the later lastSeen for FSRS stores', () => {
    store[`${LS_PREFIX}w-000001`] = card(T1);
    store[`${GRAMMAR_LS_PREFIX}g-000001`] = card(T2);
    parkUserProgress('user-a', NOW);

    store[`${LS_PREFIX}w-000001`] = card(T2); // live is later: stays
    store[`${GRAMMAR_LS_PREFIX}g-000001`] = card(T1); // parked is later: wins
    restoreParkedProgress('user-a');

    expect(store[`${LS_PREFIX}w-000001`]).toBe(card(T2));
    expect(store[`${GRAMMAR_LS_PREFIX}g-000001`]).toBe(card(T2));
  });

  it('adds the counts and keeps the later lastAttempt for stats stores', () => {
    store[`${QUIZ_LS_PREFIX}w-000001`] = stat(4, 3, T1);
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(2, 1, T2);
    parkUserProgress('user-a', NOW);

    store[`${QUIZ_LS_PREFIX}w-000001`] = stat(1, 1, T2);
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(3, 3, T1);
    restoreParkedProgress('user-a');

    expect(JSON.parse(store[`${QUIZ_LS_PREFIX}w-000001`])).toEqual({
      attempts: 5,
      correct: 4,
      lastAttempt: T2
    });
    expect(JSON.parse(store[`${CLOZE_LS_PREFIX}w-000001`])).toEqual({
      attempts: 5,
      correct: 4,
      lastAttempt: T2
    });
  });

  it('keeps a live entry that does not parse', () => {
    store[`${LS_PREFIX}w-000001`] = card(T2);
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(2, 1, T1);
    parkUserProgress('user-a', NOW);

    store[`${LS_PREFIX}w-000001`] = 'not json';
    store[`${CLOZE_LS_PREFIX}w-000001`] = '{"attempts":"many"}';
    restoreParkedProgress('user-a');

    expect(store[`${LS_PREFIX}w-000001`]).toBe('not json');
    expect(store[`${CLOZE_LS_PREFIX}w-000001`]).toBe('{"attempts":"many"}');
  });

  it('keeps the blob when a live key cannot be written, so the next login retries', () => {
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(2, 1, T1);
    parkUserProgress('user-a', NOW);
    failSet = (key) => key === `${CLOZE_LS_PREFIX}w-000001`;

    restoreParkedProgress('user-a');

    expect(store['parked:user-a:cloze']).toBeDefined();

    failSet = null;
    restoreParkedProgress('user-a');
    expect(store[`${CLOZE_LS_PREFIX}w-000001`]).toBe(stat(2, 1, T1));
    expect(parkedKeys()).toEqual([]);
  });
});

describe('purge', () => {
  it('purgeParkedProgress removes only that account blobs', () => {
    seedAll();
    parkUserProgress('user-a', NOW);
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(1, 1, T1);
    parkUserProgress('user-b', NOW);

    purgeParkedProgress('user-a');

    expect(parkedKeys()).toEqual(['parked:user-b:cloze']);
  });

  it('purgeExpiredParkedProgress removes old blobs and keeps recent ones', () => {
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(1, 1, T1);
    parkUserProgress('old-user', new Date(NOW.getTime() - (PARKED_MAX_AGE_DAYS + 1) * DAY));
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(1, 1, T1);
    parkUserProgress('new-user', new Date(NOW.getTime() - (PARKED_MAX_AGE_DAYS - 1) * DAY));

    purgeExpiredParkedProgress(NOW);

    expect(parkedKeys()).toEqual(['parked:new-user:cloze']);
  });

  it('treats a blob with no valid parkedAt, or that does not parse, as expired', () => {
    store['parked:a:cloze'] = JSON.stringify({ v: 1, entries: {} });
    store['parked:b:cloze'] = JSON.stringify({ v: 1, parkedAt: 'yesterday', entries: {} });
    store['parked:c:cloze'] = 'not json';

    purgeExpiredParkedProgress(NOW);

    expect(parkedKeys()).toEqual([]);
  });

  it('does not touch live keys or other keys', () => {
    seedAll();
    store['quiz-mode'] = 'words';

    purgeExpiredParkedProgress(NOW);

    expect(liveKeys()).toHaveLength(4);
    expect(store['quiz-mode']).toBe('words');
  });

  it('parkUserProgress also purges expired blobs', () => {
    store['parked:old:cloze'] = JSON.stringify({
      v: 1,
      parkedAt: new Date(NOW.getTime() - 200 * DAY).toISOString(),
      entries: {}
    });

    parkUserProgress('user-a', NOW);

    expect(parkedKeys()).toEqual([]);
  });
});

describe('adoptLiveProgress', () => {
  it('restores the account blobs and records the owner', () => {
    const live = seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';
    parkUserProgress('user-a', NOW);

    adoptLiveProgress('user-a', NOW);

    for (const [key, raw] of Object.entries(live)) expect(store[key]).toBe(raw);
    expect(store[LIVE_OWNER_KEY]).toBe('user-a');
    expect(parkedKeys()).toEqual([]);
  });

  it('parks live keys that belong to another account before restoring', () => {
    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a'; // a session that expired without a logout

    adoptLiveProgress('user-b', NOW);

    expect(liveKeys()).toEqual([]);
    expect(parkedKeys()).toHaveLength(4);
    expect(parkedKeys().every((k) => k.startsWith('parked:user-a:'))).toBe(true);
    expect(store[LIVE_OWNER_KEY]).toBe('user-b');
  });

  it('adopts guest keys, which have no owner, without parking them', () => {
    const live = seedAll();

    adoptLiveProgress('user-a', NOW);

    for (const [key, raw] of Object.entries(live)) expect(store[key]).toBe(raw);
    expect(parkedKeys()).toEqual([]);
    expect(store[LIVE_OWNER_KEY]).toBe('user-a');
  });

  it('merges the account blobs with guest keys written since the logout', () => {
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(3, 2, T1);
    store[LIVE_OWNER_KEY] = 'user-a';
    parkUserProgress('user-a', NOW);
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(1, 1, T2); // a guest studied in between

    adoptLiveProgress('user-a', NOW);

    expect(JSON.parse(store[`${CLOZE_LS_PREFIX}w-000001`])).toEqual({
      attempts: 4,
      correct: 3,
      lastAttempt: T2
    });
  });

  it('does nothing without a user id', () => {
    seedAll();

    adoptLiveProgress('', NOW);

    expect(liveKeys()).toHaveLength(4);
    expect(store[LIVE_OWNER_KEY]).toBeUndefined();
  });
});

describe('parkForLogout', () => {
  it('parks under the session user id', () => {
    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';

    const result = parkForLogout('user-a', NOW);

    expect(result).toEqual({ parked: 4, failed: [] });
    expect(liveKeys()).toEqual([]);
    expect(parkedKeys().every((k) => k.startsWith('parked:user-a:'))).toBe(true);
    expect(store[LIVE_OWNER_KEY]).toBeUndefined();
  });

  it('falls back to the live-owner account when the session id is missing', () => {
    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';

    expect(parkForLogout(undefined, NOW)).toEqual({ parked: 4, failed: [] });
    expect(liveKeys()).toEqual([]);
    expect(parkedKeys().every((k) => k.startsWith('parked:user-a:'))).toBe(true);

    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';
    parkForLogout(null, NOW);
    expect(liveKeys()).toEqual([]);
  });

  it('prefers the session id over the live-owner marker', () => {
    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';

    parkForLogout('user-b', NOW);

    expect(parkedKeys().every((k) => k.startsWith('parked:user-b:'))).toBe(true);
  });

  it('does nothing with neither an id nor an owner, as the old logout did', () => {
    const live = seedAll();

    expect(parkForLogout(undefined, NOW)).toBeNull();

    for (const [key, raw] of Object.entries(live)) expect(store[key]).toBe(raw);
    expect(parkedKeys()).toEqual([]);
  });
});

describe('a failed migration survives a logout', () => {
  it('returns the leftover keys at the next login of the same account', () => {
    // A Plus user whose cloze migration failed: the keys are all that is left
    store[`${CLOZE_LS_PREFIX}w-000001`] = stat(7, 5, T2);
    store[LIVE_OWNER_KEY] = 'user-a';

    parkUserProgress('user-a', NOW); // logout
    expect(liveKeys()).toEqual([]); // a guest or another account sees nothing

    adoptLiveProgress('user-a', NOW); // next login, before syncLocalProgressToPlus
    expect(store[`${CLOZE_LS_PREFIX}w-000001`]).toBe(stat(7, 5, T2));
  });
});

describe('discardAccountProgress (account deletion)', () => {
  it("removes the live keys, the account's parked blobs and the owner marker", () => {
    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';
    store[`${PARKED_PREFIX}user-a:progress`] = JSON.stringify({
      v: 1,
      parkedAt: NOW.toISOString(),
      entries: { 'w-000002': card(T1) }
    });

    discardAccountProgress('user-a');

    expect(liveKeys()).toEqual([]);
    expect(parkedKeys()).toEqual([]);
    expect(store[LIVE_OWNER_KEY]).toBeUndefined();
  });

  it("leaves another account's parked blobs alone", () => {
    seedAll();
    parkUserProgress('user-b', NOW);
    const blobsOfB = parkedKeys();
    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';

    discardAccountProgress('user-a');

    expect(parkedKeys()).toEqual(blobsOfB);
    expect(liveKeys()).toEqual([]);
  });

  it('falls back to the live-owner account without a session id', () => {
    seedAll();
    store[LIVE_OWNER_KEY] = 'user-a';
    store[`${PARKED_PREFIX}user-a:quiz`] = JSON.stringify({
      v: 1,
      parkedAt: NOW.toISOString(),
      entries: {}
    });

    discardAccountProgress(undefined);

    expect(parkedKeys()).toEqual([]);
    expect(liveKeys()).toEqual([]);
  });

  it('keeps keys that are not progress', () => {
    store['stats-active-tab'] = 'vocab';
    store[`${LS_PREFIX}w-000001`] = card(T1);

    discardAccountProgress('user-a');

    expect(store['stats-active-tab']).toBe('vocab');
    expect(liveKeys()).toEqual([]);
  });
});
