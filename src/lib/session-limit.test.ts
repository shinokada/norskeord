import { describe, it, expect } from 'vitest';
import { getSessionLimit, LS_SESSION_LIMIT } from './session-limit';

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
