import { describe, it, expect, vi } from 'vitest';
import { clearSupabaseSessionCookies, hasSupabaseSession } from './supabase-session';

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

describe('clearSupabaseSessionCookies', () => {
  const run = (...names: string[]) => {
    const del = vi.fn();
    clearSupabaseSessionCookies({ ...jar(...names), delete: del });
    return del;
  };

  it('deletes the session cookie and its chunks with path /', () => {
    const del = run('locale', BASE, `${BASE}.0`, `${BASE}.1`);
    expect(del).toHaveBeenCalledTimes(3);
    expect(del).toHaveBeenCalledWith(BASE, { path: '/' });
    expect(del).toHaveBeenCalledWith(`${BASE}.0`, { path: '/' });
    expect(del).toHaveBeenCalledWith(`${BASE}.1`, { path: '/' });
  });

  it('leaves unrelated and look-alike cookies alone', () => {
    const del = run('locale', 'theme', `${BASE}-code-verifier`, `${BASE}.x`, 'sb-abc123-other');
    expect(del).not.toHaveBeenCalled();
  });

  it('does nothing without cookies', () => {
    expect(run()).not.toHaveBeenCalled();
  });
});
