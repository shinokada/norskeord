import { describe, it, expect } from 'vitest';
import { postLoginDestination, DEFAULT_POST_LOGIN } from './post-login';

describe('postLoginDestination', () => {
  it('keeps the fallback at /learn/a1 (auth/sync restores the last flashcard path only for it)', () => {
    expect(DEFAULT_POST_LOGIN).toBe('/learn/a1');
  });

  it('falls back when next is missing or empty', () => {
    expect(postLoginDestination(null)).toBe('/learn/a1');
    expect(postLoginDestination('')).toBe('/learn/a1');
  });

  it('treats a bare "/" as no next', () => {
    expect(postLoginDestination('/')).toBe('/learn/a1');
  });

  it('returns a safe same-origin path, with its query', () => {
    expect(postLoginDestination('/a2/transport')).toBe('/a2/transport');
    expect(postLoginDestination('/a2/transport?x=1')).toBe('/a2/transport?x=1');
    expect(postLoginDestination('/plus?checkout=1&interval=year')).toBe(
      '/plus?checkout=1&interval=year'
    );
  });

  it('falls back for unsafe values', () => {
    expect(postLoginDestination('//evil.com')).toBe('/learn/a1');
    expect(postLoginDestination('/\\evil.com')).toBe('/learn/a1');
    expect(postLoginDestination('https://evil.com')).toBe('/learn/a1');
    expect(postLoginDestination('javascript:alert(1)')).toBe('/learn/a1');
    expect(postLoginDestination('/..//evil.com')).toBe('/learn/a1');
  });
});
