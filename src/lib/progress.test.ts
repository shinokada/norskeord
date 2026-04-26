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
  norsk: 'hei',
  english: 'hello',
  example: 'Hei, hvordan har du det?',
  example_english: 'Hello, how are you?',
  level: 'A1',
  category: 'greetings',
  part: 'interjection'
};

// ── loadProgressMap ───────────────────────────────────────────────────────────

describe('loadProgressMap', () => {
  it('returns empty map when localStorage is empty', () => {
    expect(loadProgressMap()).toEqual({});
  });

  it('ignores keys without the progress- prefix', () => {
    store['other-key'] = JSON.stringify({ fsrs: {}, seenCount: 1 });
    expect(loadProgressMap()).toEqual({});
  });

  it('loads and rehydrates a stored progress entry', () => {
    const map = saveProgress(entry, 'good', {});
    const loaded = loadProgressMap();
    expect(loaded['hei']).toBeDefined();
    expect(loaded['hei'].seenCount).toBe(1);
    expect(loaded['hei'].fsrs.due).toBeInstanceOf(Date);
    expect(map['hei'].level).toBe('A1');
    expect(map['hei'].category).toBe('greetings');
  });

  it('skips malformed JSON entries without throwing', () => {
    store['progress-bad'] = 'not-json{{{';
    expect(() => loadProgressMap()).not.toThrow();
    expect(loadProgressMap()).toEqual({});
  });
});

// ── saveProgress ──────────────────────────────────────────────────────────────

describe('saveProgress', () => {
  it('creates a new entry for an unseen card', () => {
    const map = saveProgress(entry, 'good', {});
    expect(map['hei']).toBeDefined();
    expect(map['hei'].seenCount).toBe(1);
    expect(map['hei'].level).toBe('A1');
    expect(map['hei'].category).toBe('greetings');
  });

  it('increments seenCount on subsequent ratings', () => {
    let map = saveProgress(entry, 'good', {});
    map = saveProgress(entry, 'again', map);
    expect(map['hei'].seenCount).toBe(2);
  });

  it('persists the entry to localStorage', () => {
    saveProgress(entry, 'easy', {});
    expect(localStorage.getItem('progress-hei')).not.toBeNull();
  });

  it('sets a future due date for "easy" rating', () => {
    const map = saveProgress(entry, 'easy', {});
    expect(new Date(map['hei'].fsrs.due).getTime()).toBeGreaterThan(Date.now());
  });

  it('does not mutate the original progressMap', () => {
    const original = {};
    const result = saveProgress(entry, 'good', original);
    expect(original).toEqual({});
    expect(result['hei']).toBeDefined();
  });

  it('handles all four FSRS ratings without throwing', () => {
    for (const rating of ['again', 'hard', 'good', 'easy'] as const) {
      expect(() => saveProgress(entry, rating, {})).not.toThrow();
    }
  });
});

// ── countDueToday ─────────────────────────────────────────────────────────────

describe('countDueToday', () => {
  it('returns 0 for an empty map', () => {
    expect(countDueToday({})).toBe(0);
  });

  it('counts cards with due date in the past', () => {
    const map = saveProgress(entry, 'good', {});
    // Backdate the due date so the card is overdue
    const overdue = { ...map['hei'], fsrs: { ...map['hei'].fsrs, due: new Date('2000-01-01') } };
    expect(countDueToday({ hei: overdue })).toBe(1);
  });

  it('does not count cards due in the future', () => {
    const map = saveProgress(entry, 'easy', {}); // "easy" schedules far in the future
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

  it('interval ordering: again <= hard <= good <= easy for a new card', () => {
    // FSRS always schedules again shortest and easy longest on a new card.
    // We compare the raw ms values by back-calculating from the formatted strings —
    // but it is simpler to just assert the due dates directly via saveProgress.
    // Instead, assert the labels reflect short-to-long ordering by saving after
    // each speculative rating and comparing actual due dates.
    const againMap = saveProgress(entry, 'again', {});
    const hardMap = saveProgress(entry, 'hard', {});
    const goodMap = saveProgress(entry, 'good', {});
    const easyMap = saveProgress(entry, 'easy', {});

    const dueAgain = new Date(againMap[entry.norsk].fsrs.due).getTime();
    const dueHard = new Date(hardMap[entry.norsk].fsrs.due).getTime();
    const dueGood = new Date(goodMap[entry.norsk].fsrs.due).getTime();
    const dueEasy = new Date(easyMap[entry.norsk].fsrs.due).getTime();

    expect(dueAgain).toBeLessThanOrEqual(dueHard);
    expect(dueHard).toBeLessThanOrEqual(dueGood);
    expect(dueGood).toBeLessThanOrEqual(dueEasy);
  });

  it('accepts null (new card) without throwing', () => {
    expect(() => previewIntervals(null, now)).not.toThrow();
  });

  it('accepts an existing CardProgress without throwing', () => {
    const map = saveProgress(entry, 'good', {});
    expect(() => previewIntervals(map[entry.norsk], now)).not.toThrow();
  });

  it('formats minutes correctly (< 60 min)', () => {
    // "again" on a new card is always a short re-learning interval (minutes)
    const result = previewIntervals(null, now);
    expect(result.again).toMatch(/^\d+m$/);
  });

  it('formats days correctly for a well-reviewed card', () => {
    // Rate good three times to push intervals into days territory
    let map = saveProgress(entry, 'good', {});
    map = saveProgress(entry, 'good', map);
    map = saveProgress(entry, 'good', map);
    const result = previewIntervals(map[entry.norsk], now);
    // "easy" on a mature card should be days or months
    expect(result.easy).toMatch(/^\d+(d|mo)$/);
  });
});
