import { afterAll, afterEach, beforeAll } from "vitest";
import { server, resetAllMocks } from "@/test/msw";

process.env.ANTHROPIC_API_KEY ??= "test-key-never-used";
process.env.WTF_RATELIMIT ??= "off";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  resetAllMocks();
});

afterAll(() => {
  server.close();
});
