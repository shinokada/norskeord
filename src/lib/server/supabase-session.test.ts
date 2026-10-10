import { describe, it, expect } from 'vitest';
import { hasSupabaseSession } from './supabase-session';

const BASE = 'sb-abc123-auth-token';
const jar = (...names: string[]) => ({
  getAll: () => names.map((name) => ({ name, value: 'x' }))
});

describe('hasSupabaseSession', () => {
  it('finds the single cookie', () => {
    expect(hasSupabaseSession(jar(BASE), BASE)).toBe(true);
  });

  it('finds a chunked session (.0, .1)', () => {
    expect(hasSupabaseSession(jar(`${BASE}.0`, `${BASE}.1`), BASE)).toBe(true);
  });

  it('finds the session among unrelated cookies', () => {
    expect(hasSupabaseSession(jar('locale', `${BASE}.0`, 'theme'), BASE)).toBe(true);
  });

  it('returns false with no cookies or unrelated ones', () => {
    expect(hasSupabaseSession(jar(), BASE)).toBe(false);
    expect(hasSupabaseSession(jar('locale', 'sb-other-auth-token'), BASE)).toBe(false);
  });

  it('does not match look-alike names', () => {
    expect(hasSupabaseSession(jar(`${BASE}-code-verifier`), BASE)).toBe(false);
    expect(hasSupabaseSession(jar(`${BASE}.x`), BASE)).toBe(false);
    expect(hasSupabaseSession(jar(`${BASE}.`), BASE)).toBe(false);
  });

  it('ignores a cookie with an empty value', () => {
    expect(hasSupabaseSession({ getAll: () => [{ name: BASE, value: '' }] }, BASE)).toBe(false);
  });
});
