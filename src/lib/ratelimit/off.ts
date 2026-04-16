import type { RateLimiter, RateLimitResult } from "./interface";

/**
 * No-op limiter: always passes. Returned when WTF_RATELIMIT=off.
 */
export class OffRateLimiter implements RateLimiter {
  async check(): Promise<RateLimitResult> {
    return {
      ok: true,
      limit: Number.POSITIVE_INFINITY,
      remaining: Number.POSITIVE_INFINITY,
      resetAt: Math.ceil(Date.now() / 1000),
    };
  }
}
