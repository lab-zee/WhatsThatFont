import { describe, it, expect } from "vitest";
import { rateLimitHeaders, retryAfterSeconds } from "./ratelimit-headers";

describe("rateLimitHeaders", () => {
  it("formats finite values as integer strings", () => {
    expect(rateLimitHeaders({ ok: true, limit: 10, remaining: 4, resetAt: 1_700_000_000 })).toEqual(
      {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": "4",
        "X-RateLimit-Reset": "1700000000",
      },
    );
  });

  it("reports 'unlimited' when limits are infinite (off mode)", () => {
    const headers = rateLimitHeaders({
      ok: true,
      limit: Number.POSITIVE_INFINITY,
      remaining: Number.POSITIVE_INFINITY,
      resetAt: 1_700_000_000,
    });
    expect(headers["X-RateLimit-Limit"]).toBe("unlimited");
    expect(headers["X-RateLimit-Remaining"]).toBe("unlimited");
  });
});

describe("retryAfterSeconds", () => {
  it("returns the number of seconds until reset", () => {
    expect(
      retryAfterSeconds(
        { ok: false, limit: 10, remaining: 0, resetAt: 1_700_000_060 },
        1_700_000_000,
      ),
    ).toBe(60);
  });

  it("never returns a negative number", () => {
    expect(
      retryAfterSeconds(
        { ok: false, limit: 10, remaining: 0, resetAt: 1_700_000_000 },
        1_700_000_060,
      ),
    ).toBe(0);
  });
});
