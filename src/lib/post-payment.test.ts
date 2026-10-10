import { describe, it, expect } from 'vitest';
import {
  successRedirectUrl,
  successReturnPath,
  postPaymentDestination,
  DEFAULT_POST_PAYMENT
} from './post-payment';

const ORIGIN = 'https://norskeord.no';

describe('successReturnPath', () => {
  it('keeps a safe next, encoded', () => {
    expect(successReturnPath('/a2/transport')).toBe('/plus/success?next=%2Fa2%2Ftransport');
    expect(successReturnPath('/a2/transport?x=1')).toBe(
      '/plus/success?next=%2Fa2%2Ftransport%3Fx%3D1'
    );
  });

  it('keeps a next that equals the default destination', () => {
    // The old route compared against the default and dropped this; it is a real next.
    expect(successReturnPath(DEFAULT_POST_PAYMENT)).toBe('/plus/success?next=%2Fa1%2Fgreetings');
  });

  it('drops a missing, non-string, bare "/" or unsafe next', () => {
    for (const bad of [
      undefined,
      null,
      42,
      '',
      '/',
      '//evil.com',
      'https://evil.com',
      '/\\evil.com'
    ]) {
      expect(successReturnPath(bad)).toBe('/plus/success');
    }
  });
});

describe('successRedirectUrl', () => {
  it('keeps a safe next, encoded', () => {
    expect(successRedirectUrl(ORIGIN, '/a2/transport')).toBe(
      'https://norskeord.no/plus/success?next=%2Fa2%2Ftransport'
    );
    expect(successRedirectUrl(ORIGIN, '/a2/transport?x=1')).toBe(
      'https://norskeord.no/plus/success?next=%2Fa2%2Ftransport%3Fx%3D1'
    );
  });

  it('drops a missing, non-string, bare "/" or unsafe next', () => {
    const plain = 'https://norskeord.no/plus/success';
    for (const bad of [
      undefined,
      null,
      42,
      '',
      '/',
      '//evil.com',
      'https://evil.com',
      '/\\evil.com'
    ]) {
      expect(successRedirectUrl(ORIGIN, bad)).toBe(plain);
    }
  });
});

describe('postPaymentDestination', () => {
  it('returns a safe next', () => {
    expect(postPaymentDestination('/a2/transport')).toBe('/a2/transport');
  });

  it('falls back to /a1/greetings', () => {
    expect(DEFAULT_POST_PAYMENT).toBe('/a1/greetings');
    for (const bad of [null, '', '/', '//evil.com', 'https://evil.com']) {
      expect(postPaymentDestination(bad)).toBe('/a1/greetings');
    }
  });
});
