import { describe, it, expect } from 'vitest';
import { isDisposableEmail, normalizeEmail, trialEmailKey } from './trial-email';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Anna@Example.COM ')).toBe('anna@example.com');
  });

  it('removes dots in a Gmail local part', () => {
    expect(normalizeEmail('a.b.c@gmail.com')).toBe('abc@gmail.com');
  });

  it('removes a +tag in a Gmail address', () => {
    expect(normalizeEmail('ab+trial1@gmail.com')).toBe('ab@gmail.com');
  });

  it('removes dots and a +tag together, so every alias of one mailbox matches', () => {
    expect(normalizeEmail('a.b+1@gmail.com')).toBe('ab@gmail.com');
    expect(normalizeEmail('A.B+x.y@Gmail.com')).toBe('ab@gmail.com');
  });

  it('treats googlemail.com as gmail.com', () => {
    expect(normalizeEmail('a.b@googlemail.com')).toBe('ab@gmail.com');
  });

  it('removes a +tag on another domain but keeps its dots', () => {
    expect(normalizeEmail('first.last+news@example.no')).toBe('first.last@example.no');
  });

  it('keeps the dots on a non-Gmail domain', () => {
    expect(normalizeEmail('a.b@example.com')).not.toBe(normalizeEmail('ab@example.com'));
  });

  it('keeps a local part that starts with a plus', () => {
    expect(normalizeEmail('+x@example.com')).toBe('+x@example.com');
  });

  it('returns a value without an @ trimmed and lowercased', () => {
    expect(normalizeEmail(' Not-An-Email ')).toBe('not-an-email');
    expect(normalizeEmail('@example.com')).toBe('@example.com');
    expect(normalizeEmail('name@')).toBe('name@');
  });
});

describe('isDisposableEmail', () => {
  it('flags a listed domain, in any case', () => {
    expect(isDisposableEmail('x@mailinator.com')).toBe(true);
    expect(isDisposableEmail('X@Mailinator.COM')).toBe(true);
    expect(isDisposableEmail(' x@yopmail.com ')).toBe(true);
  });

  it('flags a subdomain of a listed domain', () => {
    expect(isDisposableEmail('x@sub.mailinator.com')).toBe(true);
  });

  it('does not flag a normal domain', () => {
    expect(isDisposableEmail('x@gmail.com')).toBe(false);
    expect(isDisposableEmail('x@example.no')).toBe(false);
  });

  it('does not flag a domain that only ends with a listed name', () => {
    expect(isDisposableEmail('x@notmailinator.com')).toBe(false);
  });

  it('does not flag a value that is not an address', () => {
    expect(isDisposableEmail('mailinator.com')).toBe(false);
    expect(isDisposableEmail('')).toBe(false);
  });
});

describe('trialEmailKey', () => {
  const SECRET = 'test-secret';

  it('is 64 lowercase hex characters', async () => {
    expect(await trialEmailKey('anna@example.com', SECRET)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is stable for the same input', async () => {
    const a = await trialEmailKey('anna@example.com', SECRET);
    const b = await trialEmailKey('anna@example.com', SECRET);
    expect(a).toBe(b);
  });

  it('is the same for aliases of one Gmail mailbox', async () => {
    const plain = await trialEmailKey('ab@gmail.com', SECRET);
    expect(await trialEmailKey('a.b+1@gmail.com', SECRET)).toBe(plain);
    expect(await trialEmailKey('A.B@googlemail.com', SECRET)).toBe(plain);
  });

  it('differs for different mailboxes', async () => {
    const a = await trialEmailKey('anna@example.com', SECRET);
    const b = await trialEmailKey('bob@example.com', SECRET);
    expect(a).not.toBe(b);
  });

  it('differs for a different secret', async () => {
    const a = await trialEmailKey('anna@example.com', 'secret-one');
    const b = await trialEmailKey('anna@example.com', 'secret-two');
    expect(a).not.toBe(b);
  });

  it('does not contain the address', async () => {
    const key = await trialEmailKey('anna@example.com', SECRET);
    expect(key).not.toContain('anna');
    expect(key).not.toContain('example');
  });

  it('throws when the secret is empty', async () => {
    await expect(trialEmailKey('anna@example.com', '')).rejects.toThrow('TRIAL_CLAIM_SECRET');
  });
});
