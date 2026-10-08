import { describe, it, expect } from 'vitest';
import {
  getSessionLimit,
  LS_SESSION_LIMIT,
  resolveSessionLimit,
  seedSessionLimit
} from './session-limit';

function makeStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem'> {
  const store = { ...initial };
  return { getItem: (key: string) => store[key] ?? null };
}

describe('getSessionLimit', () => {
  it('returns 20 when nothing is saved (new user)', () => {
    expect(getSessionLimit(makeStorage())).toBe(20);
  });

  it('returns null when "all" is explicitly saved', () => {
    expect(getSessionLimit(makeStorage({ [LS_SESSION_LIMIT]: 'all' }))).toBeNull();
  });

  it('returns the saved number when a valid integer is stored', () => {
    expect(getSessionLimit(makeStorage({ [LS_SESSION_LIMIT]: '10' }))).toBe(10);
    expect(getSessionLimit(makeStorage({ [LS_SESSION_LIMIT]: '50' }))).toBe(50);
  });

  it('falls back to 20 when the saved value is not a valid number', () => {
    expect(getSessionLimit(makeStorage({ [LS_SESSION_LIMIT]: 'banana' }))).toBe(20);
    expect(getSessionLimit(makeStorage({ [LS_SESSION_LIMIT]: '' }))).toBe(20);
  });
});

describe('resolveSessionLimit', () => {
  it('uses the local value when there is no profile value (guest / no profile row)', () => {
    expect(resolveSessionLimit(undefined, 30)).toBe(30);
    expect(resolveSessionLimit(undefined, null)).toBeNull();
  });

  it('treats a profile null as All cards and ignores the local value', () => {
    expect(resolveSessionLimit(null, 20)).toBeNull();
    expect(resolveSessionLimit(null, 50)).toBeNull();
  });

  it('uses the profile number over the local value', () => {
    expect(resolveSessionLimit(30, 10)).toBe(30);
    expect(resolveSessionLimit(10, null)).toBe(10);
  });
});

describe('seedSessionLimit', () => {
  it('seeds 20 when there is no profile row and no local limit is given', () => {
    expect(seedSessionLimit(null)).toBe('20');
  });

  it('seeds the active local limit when there is no profile row', () => {
    expect(seedSessionLimit(null, 50)).toBe('50');
    expect(seedSessionLimit(null, null)).toBe('all');
  });

  it('falls back to 20 for a local value that is not an option', () => {
    expect(seedSessionLimit(null, 7)).toBe('20');
  });

  it('ignores the local limit when a profile row exists', () => {
    expect(seedSessionLimit({ session_limit: 30 }, 50)).toBe('30');
    expect(seedSessionLimit({ session_limit: null }, 50)).toBe('all');
  });

  it('seeds all for a stored NULL', () => {
    expect(seedSessionLimit({ session_limit: null })).toBe('all');
  });

  it('seeds each allowed number as a string', () => {
    for (const n of [10, 20, 30, 50]) {
      expect(seedSessionLimit({ session_limit: n })).toBe(String(n));
    }
  });
});
