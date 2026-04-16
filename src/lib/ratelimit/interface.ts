export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Unix seconds when the current window resets. */
  resetAt: number;
};

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}
