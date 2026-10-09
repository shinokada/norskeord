// src/lib/analytics.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isNewSignIn, trackEvent, upgradeClickParams } from './analytics';

const BASE = 'https://norskeord.no/a2/home';

describe('upgradeClickParams', () => {
  it('returns the ref of a /plus link', () => {
    expect(upgradeClickParams('/plus?ref=category-lock', BASE)).toEqual({ ref: 'category-lock' });
    expect(upgradeClickParams('https://norskeord.no/plus?ref=grammar-topic-lock', BASE)).toEqual({
      ref: 'grammar-topic-lock'
    });
  });

  it('uses "none" when there is no ref', () => {
    expect(upgradeClickParams('/plus', BASE)).toEqual({ ref: 'none' });
    expect(upgradeClickParams('/plus?ref=', BASE)).toEqual({ ref: 'none' });
  });

  it('ignores every other link', () => {
    expect(upgradeClickParams('/plus/success', BASE)).toBeNull();
    expect(upgradeClickParams('/plusplus', BASE)).toBeNull();
    expect(upgradeClickParams('/grammar/noun-plurals', BASE)).toBeNull();
    expect(upgradeClickParams('https://example.com/plus?ref=x', BASE)).toBeNull();
    expect(upgradeClickParams('mailto:a@b.c', BASE)).toBeNull();
  });

  it('does not throw on a bad base', () => {
    expect(upgradeClickParams('/plus', 'not a url')).toBeNull();
  });
});

describe('isNewSignIn', () => {
  it('is true for a first sign-in or a different account', () => {
    expect(isNewSignIn(null, 'u1')).toBe(true);
    expect(isNewSignIn('u1', 'u2')).toBe(true);
  });

  it('is false for the same user and for signed-out visitors', () => {
    expect(isNewSignIn('u1', 'u1')).toBe(false);
    expect(isNewSignIn(null, null)).toBe(false);
    expect(isNewSignIn('u1', null)).toBe(false);
  });
});

describe('trackEvent', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the event through window.gtag', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });
    trackEvent('upgrade_click', { ref: 'x' });
    expect(gtag).toHaveBeenCalledWith('event', 'upgrade_click', { ref: 'x' });
  });

  it('is a no-op when GA is not loaded', () => {
    vi.stubGlobal('window', {});
    expect(() => trackEvent('login')).not.toThrow();
  });

  it('swallows errors from gtag', () => {
    vi.stubGlobal('window', {
      gtag: () => {
        throw new Error('boom');
      }
    });
    expect(() => trackEvent('login')).not.toThrow();
  });
});
