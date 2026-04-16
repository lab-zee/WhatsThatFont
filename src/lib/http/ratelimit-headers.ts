import type { RateLimitResult } from "@/lib/ratelimit";

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  const limit = Number.isFinite(r.limit) ? String(r.limit) : "unlimited";
  const remaining = Number.isFinite(r.remaining) ? String(r.remaining) : "unlimited";
  return {
    "X-RateLimit-Limit": limit,
    "X-RateLimit-Remaining": remaining,
    "X-RateLimit-Reset": String(r.resetAt),
  };
}

export function retryAfterSeconds(r: RateLimitResult, now = Math.floor(Date.now() / 1000)): number {
  return Math.max(0, r.resetAt - now);
}
