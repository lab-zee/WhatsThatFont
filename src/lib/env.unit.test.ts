import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function loadEnv(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV, ...overrides };
  return (await import("./env")).env;
}

describe("env", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("parses a valid configuration", async () => {
    const env = await loadEnv({
      ANTHROPIC_API_KEY: "sk-test",
      WTF_RATELIMIT: "memory",
      WTF_RATELIMIT_IDENTIFY: "10/1h",
      WTF_RATELIMIT_LOOKUP: "60/1m",
    });
    expect(env.ANTHROPIC_API_KEY).toBe("sk-test");
    expect(env.WTF_MODEL).toBe("opus");
    expect(env.WTF_RATELIMIT).toBe("memory");
  });

  it("throws when ANTHROPIC_API_KEY is missing", async () => {
    await expect(loadEnv({ ANTHROPIC_API_KEY: "" })).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it("rejects malformed rate-limit specs", async () => {
    await expect(
      loadEnv({ ANTHROPIC_API_KEY: "sk-test", WTF_RATELIMIT_IDENTIFY: "ten per hour" }),
    ).rejects.toThrow(/WTF_RATELIMIT_IDENTIFY/);
  });

  it("requires Upstash credentials when WTF_RATELIMIT=upstash", async () => {
    await expect(
      loadEnv({
        ANTHROPIC_API_KEY: "sk-test",
        WTF_RATELIMIT: "upstash",
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
    ).rejects.toThrow(/upstash/i);
  });

  it("exposes all keys through the proxy (in / Object.keys / descriptors)", async () => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, ANTHROPIC_API_KEY: "sk-test" };
    const { env } = await import("./env");

    expect("ANTHROPIC_API_KEY" in env).toBe(true);
    expect(Object.keys(env)).toContain("WTF_MODEL");
    const descriptor = Object.getOwnPropertyDescriptor(env, "WTF_RATELIMIT");
    expect(descriptor?.value).toBe("memory");
  });

  it("caches parsed env across property accesses", async () => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, ANTHROPIC_API_KEY: "sk-test" };
    const { env, getEnv } = await import("./env");

    expect(env.ANTHROPIC_API_KEY).toBe("sk-test");
    expect(getEnv()).toBe(getEnv());
  });
});
