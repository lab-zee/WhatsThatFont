import { z } from "zod";

const RateLimitSpec = z
  .string()
  .regex(/^\d+\/\d+[smhd]$/, "Expected format: <count>/<window>, e.g. 10/1h");

const Schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  WTF_MODEL: z.enum(["opus", "sonnet"]).default("opus"),

  WTF_RATELIMIT: z.enum(["memory", "upstash", "off"]).default("memory"),
  WTF_RATELIMIT_IDENTIFY: RateLimitSpec.default("10/1h"),
  WTF_RATELIMIT_LOOKUP: RateLimitSpec.default("60/1m"),

  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  GIT_SHA: z.string().default("dev"),
});

export type Env = z.infer<typeof Schema>;

let cached: Env | null = null;

/**
 * Clear the cached parsed env. For tests that mutate process.env between cases.
 * Do not call this from feature code.
 */
export function resetEnvCache(): void {
  cached = null;
}

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = Schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  if (parsed.data.WTF_RATELIMIT === "upstash") {
    if (!parsed.data.UPSTASH_REDIS_REST_URL || !parsed.data.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        "WTF_RATELIMIT=upstash requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      );
    }
  }

  cached = parsed.data;
  return cached;
}

// Proxy so `env.X` reads work as before but validation is deferred until first access.
// This keeps `next build` from exploding during page-data collection when the build shell
// doesn't carry a real ANTHROPIC_API_KEY — the key is only needed at request time.
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    return getEnv()[prop as keyof Env];
  },
  has(_target, prop) {
    return prop in getEnv();
  },
  ownKeys() {
    return Reflect.ownKeys(getEnv());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getEnv(), prop);
  },
});
