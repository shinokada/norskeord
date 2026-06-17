import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadProgressMap, saveProgress, countDueToday, previewIntervals } from './progress';
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
  id: 'v-a1-greetings-001',
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
  it('returns empty map when localStorage is empty', () => {
    expect(loadProgressMap()).toEqual({});
  });

  it('ignores keys without the progress- prefix', () => {
    store['other-key'] = JSON.stringify({ fsrs: {}, seenCount: 1 });
    expect(loadProgressMap()).toEqual({});
  });

  it('loads and rehydrates a stored progress entry', async () => {
    const map = await saveProgress(entry, 'good', {});
    const loaded = loadProgressMap();
    expect(loaded[KEY]).toBeDefined();
    expect(loaded[KEY].seenCount).toBe(1);
    expect(loaded[KEY].fsrs.due).toBeInstanceOf(Date);
    expect(map[KEY].level).toBe('A1');
    expect(map[KEY].category).toBe('greetings');
  });

  it('skips malformed JSON entries without throwing', () => {
    store['progress-bad'] = 'not-json{{{';
    expect(() => loadProgressMap()).not.toThrow();
    expect(loadProgressMap()).toEqual({});
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

  it('formats minutes correctly (< 60 min)', () => {
    // "again" on a new card is always a short re-learning interval (minutes)
    const result = previewIntervals(null, now);
    expect(result.again).toMatch(/^\d+m$/);
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
