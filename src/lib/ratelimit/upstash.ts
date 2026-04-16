import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { RateLimiter, RateLimitResult } from "./interface";
import { parseSpec } from "./spec";

type Duration = Parameters<typeof Ratelimit.slidingWindow>[1];

export type UpstashConfig = {
  spec: string;
  redisUrl: string;
  redisToken: string;
  /** Prefix for Redis keys. Different endpoints use different prefixes. */
  prefix: string;
};

export class UpstashRateLimiter implements RateLimiter {
  private readonly rl: Ratelimit;

  constructor(cfg: UpstashConfig) {
    const parsed = parseSpec(cfg.spec);
    const redis = new Redis({ url: cfg.redisUrl, token: cfg.redisToken });
    this.rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(parsed.count, parsed.label as Duration),
      prefix: cfg.prefix,
      analytics: false,
    });
  }

  async check(key: string): Promise<RateLimitResult> {
    const result = await this.rl.limit(key);
    return {
      ok: result.success,
      limit: result.limit,
      remaining: Math.max(0, result.remaining),
      resetAt: Math.ceil(result.reset / 1000),
    };
  }
}
