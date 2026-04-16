import type { RateLimiter, RateLimitResult } from "./interface";
import { parseSpec } from "./spec";

/**
 * In-process sliding-window limiter. Fine for single-instance self-host.
 * Not multi-node-safe — use the Upstash implementation for that.
 *
 * Capacity is bounded: we cap the number of distinct keys tracked to prevent
 * unbounded memory under a slow-drip attack. Oldest-seen keys evict first.
 */
export class MemoryRateLimiter implements RateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;
  private readonly buckets = new Map<string, number[]>();
  private readonly nowFn: () => number;

  constructor(spec: string, opts: { maxKeys?: number; now?: () => number } = {}) {
    const parsed = parseSpec(spec);
    this.limit = parsed.count;
    this.windowMs = parsed.windowMs;
    this.maxKeys = opts.maxKeys ?? 10_000;
    this.nowFn = opts.now ?? Date.now;
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = this.nowFn();
    const windowStart = now - this.windowMs;

    let timestamps = this.buckets.get(key) ?? [];
    // prune expired
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= this.limit) {
      // still over limit; do not record this attempt
      this.buckets.set(key, timestamps);
      this.touch(key);
      const oldest = timestamps[0]!;
      return {
        ok: false,
        limit: this.limit,
        remaining: 0,
        resetAt: Math.ceil((oldest + this.windowMs) / 1000),
      };
    }

    timestamps.push(now);
    this.buckets.set(key, timestamps);
    this.touch(key);

    const oldest = timestamps[0]!;
    return {
      ok: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - timestamps.length),
      resetAt: Math.ceil((oldest + this.windowMs) / 1000),
    };
  }

  private touch(key: string): void {
    // LRU-style: re-insert to move to the tail of Map iteration order.
    const v = this.buckets.get(key);
    if (v !== undefined) {
      this.buckets.delete(key);
      this.buckets.set(key, v);
    }
    // Evict until under cap.
    while (this.buckets.size > this.maxKeys) {
      const first = this.buckets.keys().next().value;
      if (first === undefined) break;
      this.buckets.delete(first);
    }
  }
}
