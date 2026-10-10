/**
 * rate-limit.ts (server only)
 *
 * Small sliding-window limiter, best effort: counts live in this server
 * instance's memory, so separate serverless instances count separately. It
 * makes scripted bulk use slow and noisy; it is not a hard quota
 * (ai-docs/implementation/search-index-gate.md).
 */

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the oldest counted request leaves the window (0 when ok). */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
  reset(): void;
}

/** Idle keys are swept once the map grows past this size. */
const SWEEP_AT = 5000;

export function createRateLimiter({
  limit,
  windowMs
}: {
  limit: number;
  windowMs: number;
}): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    check(key, now = Date.now()) {
      const windowStart = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

      if (recent.length >= limit) {
        hits.set(key, recent);
        return {
          ok: false,
          retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000))
        };
      }

      recent.push(now);
      hits.set(key, recent);

      if (hits.size > SWEEP_AT) {
        for (const [k, times] of hits) {
          if (times[times.length - 1] <= windowStart) hits.delete(k);
        }
      }

      return { ok: true, retryAfterSeconds: 0 };
    },
    reset() {
      hits.clear();
    }
  };
}

/** Requests per user per minute for GET /api/search. One constant, easy to change. */
export const SEARCH_RATE_LIMIT_PER_MINUTE = 20;

export const searchRateLimiter = createRateLimiter({
  limit: SEARCH_RATE_LIMIT_PER_MINUTE,
  windowMs: 60_000
});
