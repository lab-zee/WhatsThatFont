import { env } from "@/lib/env";
import type { RateLimiter } from "./interface";
import { MemoryRateLimiter } from "./memory";
import { OffRateLimiter } from "./off";
import { UpstashRateLimiter } from "./upstash";

export type LimiterName = "identify" | "lookup";

const singletons = new Map<LimiterName, RateLimiter>();

function buildLimiter(name: LimiterName): RateLimiter {
  if (env.WTF_RATELIMIT === "off") {
    return new OffRateLimiter();
  }

  const spec = name === "identify" ? env.WTF_RATELIMIT_IDENTIFY : env.WTF_RATELIMIT_LOOKUP;

  if (env.WTF_RATELIMIT === "upstash") {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash rate limiter requires UPSTASH_REDIS_REST_URL and TOKEN.");
    }
    return new UpstashRateLimiter({
      spec,
      redisUrl: env.UPSTASH_REDIS_REST_URL,
      redisToken: env.UPSTASH_REDIS_REST_TOKEN,
      prefix: `wtf:${name}`,
    });
  }

  return new MemoryRateLimiter(spec);
}

export function getLimiter(name: LimiterName): RateLimiter {
  let existing = singletons.get(name);
  if (!existing) {
    existing = buildLimiter(name);
    singletons.set(name, existing);
  }
  return existing;
}

/** Test-only: clear cached limiter singletons so the next getLimiter() rebuilds. */
export function resetLimiterCache(): void {
  singletons.clear();
}

export { MemoryRateLimiter } from "./memory";
export { OffRateLimiter } from "./off";
export { UpstashRateLimiter } from "./upstash";
export type { RateLimiter, RateLimitResult } from "./interface";
