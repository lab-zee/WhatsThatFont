import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { server, resetAllMocks } from "@/test/msw";
import { resetEnvCache } from "@/lib/env";
import { resetLimiterCache } from "@/lib/ratelimit";

process.env.ANTHROPIC_API_KEY ??= "test-key-never-used";
process.env.WTF_RATELIMIT ??= "off";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  resetEnvCache();
  resetLimiterCache();
});

afterEach(() => {
  server.resetHandlers();
  resetAllMocks();
});

afterAll(() => {
  server.close();
});
