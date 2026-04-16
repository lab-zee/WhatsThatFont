import { describe, it, expect } from "vitest";
import { MemoryRateLimiter } from "./memory";

function makeNow(start: number): { now: () => number; advance: (ms: number) => void } {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("MemoryRateLimiter", () => {
  it("allows the first N requests within the window", async () => {
    const clock = makeNow(1_000_000);
    const limiter = new MemoryRateLimiter("3/1m", { now: clock.now });

    for (let i = 0; i < 3; i++) {
      const out = await limiter.check("ip-a");
      expect(out.ok).toBe(true);
      expect(out.limit).toBe(3);
      expect(out.remaining).toBe(2 - i);
    }
  });

  it("rejects the request after the limit is reached", async () => {
    const clock = makeNow(1_000_000);
    const limiter = new MemoryRateLimiter("2/1m", { now: clock.now });

    await limiter.check("ip-a");
    await limiter.check("ip-a");
    const out = await limiter.check("ip-a");
    expect(out.ok).toBe(false);
    expect(out.remaining).toBe(0);
  });

  it("isolates keys so one IP doesn't exhaust another's budget", async () => {
    const clock = makeNow(1_000_000);
    const limiter = new MemoryRateLimiter("1/1m", { now: clock.now });

    expect((await limiter.check("a")).ok).toBe(true);
    expect((await limiter.check("b")).ok).toBe(true);
    expect((await limiter.check("a")).ok).toBe(false);
    expect((await limiter.check("b")).ok).toBe(false);
  });

  it("resets once the window slides past the oldest timestamp", async () => {
    const clock = makeNow(1_000_000);
    const limiter = new MemoryRateLimiter("1/1m", { now: clock.now });

    expect((await limiter.check("ip-a")).ok).toBe(true);
    expect((await limiter.check("ip-a")).ok).toBe(false);

    clock.advance(61_000);
    expect((await limiter.check("ip-a")).ok).toBe(true);
  });

  it("evicts the oldest keys when capacity is exceeded", async () => {
    const clock = makeNow(1_000_000);
    const limiter = new MemoryRateLimiter("1/1m", { now: clock.now, maxKeys: 2 });

    await limiter.check("a");
    await limiter.check("b");
    await limiter.check("c"); // evicts "a"

    // "a" has been evicted, so its budget resets
    expect((await limiter.check("a")).ok).toBe(true);
  });

  it("reports resetAt as unix seconds", async () => {
    const clock = makeNow(10_000_000);
    const limiter = new MemoryRateLimiter("1/1m", { now: clock.now });

    const out = await limiter.check("ip");
    // ~10,000s + 60s in seconds
    expect(out.resetAt).toBeGreaterThan(10_000);
    expect(out.resetAt).toBeLessThan(11_000);
  });
});
