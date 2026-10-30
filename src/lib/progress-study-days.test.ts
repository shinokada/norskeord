import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildLocalStudyDays, getStreakFromStudyDays, todayLocalDate } from './progress';
import type { CardProgress } from '$lib/types';

// progress.ts imports the Supabase client; these tests never touch it.
vi.mock('$lib/supabase', () => ({ supabase: {} }));

// Free/guest users have no study_days table: their streak and activity chart are derived from
// lastSeen (vocab + grammar) and lastAttempt (quiz stats). A multiple-choice quiz answer on a
// new word writes no FSRS progress, only quiz stats, so it must count from lastAttempt alone.

/** Local noon, `daysAgo` days before the faked "today", as an ISO string. */
function at(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function dayKey(daysAgo: number): string {
  const d = new Date(at(daysAgo));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function card(lastSeen: string): CardProgress {
  return { lastSeen } as unknown as CardProgress;
}

function quiz(lastAttempt: string) {
  return { attempts: 1, correct: 1, lastAttempt };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 29, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('buildLocalStudyDays', () => {
  it('returns an empty map when there is no activity', () => {
    expect(buildLocalStudyDays({})).toEqual({});
  });

  it('counts a quiz-only day (multiple choice on a new word)', () => {
    const days = buildLocalStudyDays({}, {}, { 'w-000001': quiz(at(0)) });
    expect(days).toEqual({ [dayKey(0)]: 1 });
  });

  it('does not count the same word twice on one day (typed answer writes both stores)', () => {
    const days = buildLocalStudyDays({ 'w-000001': card(at(0)) }, {}, { 'w-000001': quiz(at(0)) });
    expect(days).toEqual({ [dayKey(0)]: 1 });
  });

  it('counts the same word on two different days separately', () => {
    const days = buildLocalStudyDays({ 'w-000001': card(at(1)) }, {}, { 'w-000001': quiz(at(0)) });
    expect(days).toEqual({ [dayKey(1)]: 1, [dayKey(0)]: 1 });
  });

  it('counts vocab, grammar and quiz items separately on the same day', () => {
    const days = buildLocalStudyDays(
      { 'w-000001': card(at(0)) },
      { 'w-000001': card(at(0)) }, // same id string as a vocab key must not collide
      { 'w-000002': quiz(at(0)) }
    );
    expect(days).toEqual({ [dayKey(0)]: 3 });
  });

  it('skips unparseable timestamps', () => {
    expect(buildLocalStudyDays({ a: card('not a date') }, {}, { b: quiz('') })).toEqual({});
  });
});

describe('getStreakFromStudyDays', () => {
  it('is 0 with no activity', () => {
    expect(getStreakFromStudyDays({})).toBe(0);
  });

  it('todayLocalDate agrees with the faked clock', () => {
    expect(todayLocalDate()).toBe(dayKey(0));
  });

  it('counts consecutive days ending today', () => {
    expect(getStreakFromStudyDays({ [dayKey(0)]: 1, [dayKey(1)]: 4, [dayKey(2)]: 2 })).toBe(3);
  });

  it('starts from yesterday when today is still empty', () => {
    expect(getStreakFromStudyDays({ [dayKey(1)]: 1, [dayKey(2)]: 1 })).toBe(2);
  });

  it('stops at a gap', () => {
    expect(getStreakFromStudyDays({ [dayKey(0)]: 1, [dayKey(2)]: 1 })).toBe(1);
  });

  it('a quiz-only session extends the streak through buildLocalStudyDays', () => {
    const days = buildLocalStudyDays(
      { 'w-000001': card(at(1)) }, // studied yesterday via flashcards
      {},
      { 'w-000002': quiz(at(0)) } // today: multiple choice only, no progress written
    );
    expect(getStreakFromStudyDays(days)).toBe(2);
  });
});
