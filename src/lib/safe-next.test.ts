import { describe, it, expect } from 'vitest';
import { safeNext } from './safe-next';

describe('safeNext', () => {
  describe('accepts same-origin paths', () => {
    it.each([
      ['/', '/'],
      ['/a2/transport', '/a2/transport'],
      ['/a2/transport?x=1', '/a2/transport?x=1'],
      ['/a2/transport?x=1#top', '/a2/transport?x=1#top'],
      ['/learn/a1', '/learn/a1'],
      ['/a1/uttrykk?theme=greetings', '/a1/uttrykk?theme=greetings']
    ])('%s', (input, expected) => {
      expect(safeNext(input, '/fallback')).toBe(expected);
    });

    it('keeps an encoded slash as a path, not a host', () => {
      expect(safeNext('/%2F%2Fevil.com', '/fallback')).toBe('/%2F%2Fevil.com');
    });
  });

  describe('rejects off-site and malformed values', () => {
    it.each([
      ['protocol-relative', '//evil.com'],
      ['backslash after slash', '/\\evil.com'],
      ['double backslash', '\\\\evil.com'],
      ['absolute https', 'https://evil.com'],
      ['absolute http', 'http://evil.com/a'],
      ['javascript scheme', 'javascript:alert(1)'],
      ['data scheme', 'data:text/html,<script>alert(1)</script>'],
      ['no leading slash', 'a2/transport'],
      ['leading space', ' /a2/transport'],
      ['tab between slashes', '/\t/evil.com'],
      ['newline between slashes', '/\n/evil.com'],
      ['carriage return', '/\r/evil.com'],
      ['null byte', '/a\u0000b'],
      ['DEL character', '/a\u007fb'],
      ['dot segments to protocol-relative', '/..//evil.com'],
      ['single dot segment to protocol-relative', '/.//evil.com'],
      ['empty', ''],
      ['over-long', '/' + 'a'.repeat(3000)]
    ])('%s', (_name, input) => {
      expect(safeNext(input, '/fallback')).toBe('/fallback');
    });
  });

  it('returns the fallback for null and undefined', () => {
    expect(safeNext(null, '/fallback')).toBe('/fallback');
    expect(safeNext(undefined, '/fallback')).toBe('/fallback');
  });

  it('defaults the fallback to "/"', () => {
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext(null)).toBe('/');
  });
});
