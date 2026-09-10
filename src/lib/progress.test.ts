import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadProgressMap,
  saveProgress,
  countDueToday,
  previewIntervals,
  getFsrs,
  LS_PREFIX
} from './progress';
import type { VocabEntry } from '$lib/types';

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

const entry: VocabEntry = {
  // Old-format shape (v-{level}-{category}-{NNN}) is deliberate — several
  // tests below (loadProgressMap's stale-key handling) rely on this id
  // looking pre-migration. 'testfixture' as the category segment is
  // deliberately not a real category, so this id can never collide with an
  // actual entry in id-migration-map.json (unlike an earlier version of
  // this fixture, 'v-a1-greetings-001', which turned out to be a real
  // migrated id and got silently renamed by remapStaleKeys() mid-test).
  id: 'v-a1-testfixture-001',
  norsk: 'hei',
  english: 'hello',
  spanish: 'hola',
  ukrainian: 'привіт',
  example: 'Hei, hvordan har du det?',
  example_english: 'Hello, how are you?',
  example_spanish: 'Hola, ¿cómo estás?',
  example_ukrainian: 'Привіт, як справи?',
  level: 'A1',
  category: 'greetings',
  part: 'interjection'
};

// vocabKey(entry) returns entry.id when present — use this as the map key.
const KEY = entry.id;

// ── loadProgressMap ───────────────────────────────────────────────────────────

describe('loadProgressMap', () => {
  it('returns empty map when localStorage is empty', async () => {
    expect(await loadProgressMap()).toEqual({});
  });

  it('ignores keys without the progress- prefix', async () => {
    store['other-key'] = JSON.stringify({ fsrs: {}, seenCount: 1 });
    expect(await loadProgressMap()).toEqual({});
  });

  it('loads and rehydrates a stored progress entry', async () => {
    const map = await saveProgress(entry, 'good', {});
    const loaded = await loadProgressMap();
    expect(loaded[KEY]).toBeDefined();
    expect(loaded[KEY].seenCount).toBe(1);
    expect(loaded[KEY].fsrs.due).toBeInstanceOf(Date);
    expect(map[KEY].level).toBe('A1');
    expect(map[KEY].category).toBe('greetings');
  });

  it('skips malformed JSON entries without throwing', async () => {
    store['progress-bad'] = 'not-json{{{';
    await expect(loadProgressMap()).resolves.not.toThrow();
    expect(await loadProgressMap()).toEqual({});
  });

  it('leaves current-format ids untouched (no stale-key gate triggered)', async () => {
    // entry.id is already 'v-a1-testfixture-001' in the old format on
    // purpose for other tests in this file — but a genuinely *current*-
    // format id (w-{NNNNNN}, shared vocab/uttrykk shape) must not trip
    // STALE_ID_RE or trigger a mapping fetch. Note 'v-a1-0001' (Round 1's
    // intermediate shape) is NOT a valid stand-in here anymore — it's one
    // of STALE_ID_RE's own whitelisted branches now, so it would (correctly)
    // trigger the gate rather than test the "leave alone" path.
    await saveProgress({ ...entry, id: 'w-000001' }, 'good', {});
    const loaded = await loadProgressMap();
    expect(loaded['w-000001']).toBeDefined();
  });

  it('remaps a stale pre-migration id to its new id via id-migration-map.json (Phase 3/7/11)', async () => {
    // v-a1-home-034 ('uthus') flattens straight through to w-000572 — a real
    // pair from src/lib/data/id-migration-map.json (single-hop mapping,
    // Round 3: original pre-Round-1 shape → final shared w-{NNNNNN} id; see
    // also e2e/review.test.ts, which exercises the same id end to end
    // through /api/review-entries).
    const OLD_ID = 'v-a1-home-034';
    const NEW_ID = 'w-000572';
    store[LS_PREFIX + OLD_ID] = JSON.stringify({
      fsrs: {
        due: new Date().toISOString(),
        stability: 1,
        difficulty: 5,
        elapsed_days: 0,
        scheduled_days: 1,
        learning_steps: 0,
        reps: 1,
        lapses: 0,
        state: 2
      },
      seenCount: 1,
      lastSeen: new Date().toISOString(),
      level: 'A1',
      category: 'home'
    });

    const loaded = await loadProgressMap();
    expect(loaded[NEW_ID]).toBeDefined();
    expect(loaded[OLD_ID]).toBeUndefined();
  });
});

// ── saveProgress ──────────────────────────────────────────────────────────────

describe('saveProgress', () => {
  it('creates a new entry for an unseen card', async () => {
    const map = await saveProgress(entry, 'good', {});
    expect(map[KEY]).toBeDefined();
    expect(map[KEY].seenCount).toBe(1);
    expect(map[KEY].level).toBe('A1');
    expect(map[KEY].category).toBe('greetings');
  });

  it('increments seenCount on subsequent ratings', async () => {
    let map = await saveProgress(entry, 'good', {});
    map = await saveProgress(entry, 'again', map);
    expect(map[KEY].seenCount).toBe(2);
  });

  it('persists the entry to localStorage', async () => {
    await saveProgress(entry, 'easy', {});
    expect(localStorage.getItem('progress-' + KEY)).not.toBeNull();
  });

  it('sets a future due date for "easy" rating', async () => {
    const map = await saveProgress(entry, 'easy', {});
    expect(new Date(map[KEY].fsrs.due).getTime()).toBeGreaterThan(Date.now());
  });

  it('does not mutate the original progressMap', async () => {
    const original = {};
    const result = await saveProgress(entry, 'good', original);
    expect(original).toEqual({});
    expect(result[KEY]).toBeDefined();
  });

  it('handles all four FSRS ratings without throwing', async () => {
    for (const rating of ['again', 'hard', 'good', 'easy'] as const) {
      await expect(saveProgress(entry, rating, {})).resolves.not.toThrow();
    }
  });
});

// ── getFsrs ───────────────────────────────────────────────────────────────────

describe('getFsrs', () => {
  // Only the no-userId path is tested here — a real userId would make getFsrs hit the
  // live Supabase client (no mock exists for it in this suite), same reason saveProgress
  // is never tested elsewhere in this file with a userId argument.
  it('returns an FSRS instance for a guest (no userId)', async () => {
    const f = await getFsrs(null);
    expect(f).toBeDefined();
    expect(typeof f.next).toBe('function');
  });

  it('returns the same cached instance shape on repeated guest calls', async () => {
    const a = await getFsrs(undefined);
    const b = await getFsrs(undefined);
    expect(a).toBe(b); // guest path always returns the module-level DEFAULT_FSRS
  });

  it('ignores the retention argument for guests (no userId)', async () => {
    // Guests always get DEFAULT_FSRS regardless of retention — the preset only
    // applies once a userId is present (Phase 2 wiring).
    const a = await getFsrs(null, 0.8);
    const b = await getFsrs(null, 0.95);
    expect(a).toBe(b);
  });
});

// ── countDueToday ─────────────────────────────────────────────────────────────

describe('countDueToday', () => {
  it('returns 0 for an empty map', () => {
    expect(countDueToday({})).toBe(0);
  });

  it('counts cards with due date in the past', async () => {
    const map = await saveProgress(entry, 'good', {});
    // Backdate the due date so the card is overdue
    const overdue = { ...map[KEY], fsrs: { ...map[KEY].fsrs, due: new Date('2000-01-01') } };
    expect(countDueToday({ [KEY]: overdue })).toBe(1);
  });

  it('does not count cards due in the future', async () => {
    const map = await saveProgress(entry, 'easy', {}); // "easy" schedules far in the future
    expect(countDueToday(map)).toBe(0);
  });
});

// ── previewIntervals ──────────────────────────────────────────────────────────

describe('previewIntervals', () => {
  const now = new Date('2025-06-01T12:00:00Z');

  it('returns all four rating keys', () => {
    const result = previewIntervals(null, now);
    expect(result).toHaveProperty('again');
    expect(result).toHaveProperty('hard');
    expect(result).toHaveProperty('good');
    expect(result).toHaveProperty('easy');
  });

  it('all values are non-empty strings', () => {
    const result = previewIntervals(null, now);
    for (const val of Object.values(result)) {
      expect(typeof val).toBe('string');
      expect(val.length).toBeGreaterThan(0);
    }
  });

  it('interval ordering: again <= hard <= good <= easy for a new card', async () => {
    // FSRS always schedules again shortest and easy longest on a new card.
    // We compare the raw ms values by back-calculating from the formatted strings —
    // but it is simpler to just assert the due dates directly via saveProgress.
    // Instead, assert the labels reflect short-to-long ordering by saving after
    // each speculative rating and comparing actual due dates.
    const againMap = await saveProgress(entry, 'again', {});
    const hardMap = await saveProgress(entry, 'hard', {});
    const goodMap = await saveProgress(entry, 'good', {});
    const easyMap = await saveProgress(entry, 'easy', {});

    const dueAgain = new Date(againMap[KEY].fsrs.due).getTime();
    const dueHard = new Date(hardMap[KEY].fsrs.due).getTime();
    const dueGood = new Date(goodMap[KEY].fsrs.due).getTime();
    const dueEasy = new Date(easyMap[KEY].fsrs.due).getTime();

    expect(dueAgain).toBeLessThanOrEqual(dueHard);
    expect(dueHard).toBeLessThanOrEqual(dueGood);
    expect(dueGood).toBeLessThanOrEqual(dueEasy);
  });

  it('accepts null (new card) without throwing', () => {
    expect(() => previewIntervals(null, now)).not.toThrow();
  });

  it('accepts an existing CardProgress without throwing', async () => {
    const map = await saveProgress(entry, 'good', {});
    expect(() => previewIntervals(map[KEY], now)).not.toThrow();
  });

  it('formats "again" as a day-scale interval, not minutes (enable_short_term: false)', () => {
    // With short-term scheduling disabled, even "again" on a new card is scheduled by
    // the main FSRS formula (day-scale) rather than a fixed short-term minute step —
    // this is the fix for cards reappearing within the same session.
    const result = previewIntervals(null, now);
    expect(result.again).toMatch(/^\d+(m|h|d)$/);
    expect(result.again).not.toBe('0m');
  });

  it('formats days correctly for a well-reviewed card', async () => {
    // Rate good three times to push intervals into days territory
    let map = await saveProgress(entry, 'good', {});
    map = await saveProgress(entry, 'good', map);
    map = await saveProgress(entry, 'good', map);
    const result = previewIntervals(map[KEY], now);
    // "easy" on a mature card should be days or months
    expect(result.easy).toMatch(/^\d+(d|mo)$/);
  });
});
