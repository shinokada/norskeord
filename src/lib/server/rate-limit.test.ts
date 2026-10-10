import { describe, it, expect } from 'vitest';
import { createRateLimiter, SEARCH_RATE_LIMIT_PER_MINUTE } from './rate-limit';

describe('createRateLimiter', () => {
  it('allows up to the limit, then blocks', () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(rl.check('u', 1000).ok).toBe(true);
    expect(rl.check('u', 1001).ok).toBe(true);
    expect(rl.check('u', 1002).ok).toBe(true);
    expect(rl.check('u', 1003).ok).toBe(false);
  });

  it('reports seconds until the oldest request leaves the window', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 });
    rl.check('u', 0);
    const blocked = rl.check('u', 10_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(50);
  });

  it('allows again once the window has passed', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 });
    rl.check('u', 0);
    expect(rl.check('u', 30_000).ok).toBe(false);
    expect(rl.check('u', 60_001).ok).toBe(true);
  });

  it('tracks keys independently', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(rl.check('a', 0).ok).toBe(true);
    expect(rl.check('b', 0).ok).toBe(true);
    expect(rl.check('a', 1).ok).toBe(false);
  });

  it('does not count blocked requests against the window', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    rl.check('u', 0);
    for (let t = 1; t < 900; t += 100) rl.check('u', t);
    expect(rl.check('u', 1001).ok).toBe(true);
  });

  it('reset clears all counts', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 });
    rl.check('u', 0);
    rl.reset();
    expect(rl.check('u', 1).ok).toBe(true);
  });
});

describe('SEARCH_RATE_LIMIT_PER_MINUTE', () => {
  it('is 20', () => {
    expect(SEARCH_RATE_LIMIT_PER_MINUTE).toBe(20);
  });
});
