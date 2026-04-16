import { describe, it, expect } from "vitest";
// MSW is imported here to keep the ADR-0008 guard happy and to keep the door open
// for future integration tests in this file that hit external services.
import "@/test/msw";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns ok and a version string", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; version: string };
    expect(body.ok).toBe(true);
    expect(typeof body.version).toBe("string");
    expect(body.version.length).toBeGreaterThan(0);
  });
});
