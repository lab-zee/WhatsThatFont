import { describe, it, expect, beforeEach } from "vitest";
import "@/test/msw";
import { mockFontResponse } from "@/test/msw/anthropic";
import { tinyJpeg } from "@/test/fixtures/images";
import { POST } from "./route";

function buildRequest(headers: Record<string, string> = {}): Request {
  const form = new FormData();
  form.set("image", new Blob([tinyJpeg as BlobPart], { type: "image/jpeg" }), "ref.jpg");
  return new Request("http://localhost/api/identify", {
    method: "POST",
    body: form,
    headers,
  });
}

describe("POST /api/identify — rate limiting", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.WTF_RATELIMIT = "memory";
    process.env.WTF_RATELIMIT_IDENTIFY = "2/1h";
  });

  it("emits X-RateLimit-* headers on a successful request", async () => {
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    const res = await POST(buildRequest({ "x-forwarded-for": "9.9.9.1" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("1");
    expect(res.headers.get("X-RateLimit-Reset")).toMatch(/^\d+$/);
  });

  it("returns 429 rate_limited with Retry-After once the budget is exhausted", async () => {
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    // 2/1h budget — first two pass, third fails.
    await POST(buildRequest({ "x-forwarded-for": "9.9.9.2" }));
    await POST(buildRequest({ "x-forwarded-for": "9.9.9.2" }));
    const third = await POST(buildRequest({ "x-forwarded-for": "9.9.9.2" }));
    expect(third.status).toBe(429);
    const body = (await third.json()) as { error: { code: string } };
    expect(body.error.code).toBe("rate_limited");
    expect(third.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(third.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("keys by IP so different IPs have independent budgets", async () => {
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    await POST(buildRequest({ "x-forwarded-for": "1.1.1.1" }));
    await POST(buildRequest({ "x-forwarded-for": "1.1.1.1" }));
    const other = await POST(buildRequest({ "x-forwarded-for": "2.2.2.2" }));
    expect(other.status).toBe(200);
  });

  it("passes-through when WTF_RATELIMIT=off", async () => {
    process.env.WTF_RATELIMIT = "off";
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    mockFontResponse([{ sampleText: "H", candidates: [{ name: "Inter", confidence: "high" }] }]);
    const ips = ["3.3.3.3", "3.3.3.3", "3.3.3.3"];
    const results = await Promise.all(
      ips.map((ip) => POST(buildRequest({ "x-forwarded-for": ip }))),
    );
    for (const r of results) expect(r.status).toBe(200);
  });
});
