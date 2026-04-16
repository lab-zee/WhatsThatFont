import { describe, it, expect } from "vitest";
import "@/test/msw";
import { GET } from "./route";

function req(url: string): Request {
  return new Request(url);
}

describe("GET /api/fonts/lookup", () => {
  it("resolves a Google Fonts family and flags it verified", async () => {
    const res = await GET(req("http://localhost/api/fonts/lookup?q=Inter"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      verified: boolean;
      sources: { googleFont: { family: string } | null };
    };
    expect(body.verified).toBe(true);
    expect(body.sources.googleFont?.family).toBe("Inter");
  });

  it("resolves a curated proprietary font with a foundry link", async () => {
    const res = await GET(req("http://localhost/api/fonts/lookup?q=Proxima%20Nova"));
    const body = (await res.json()) as { verified: boolean };
    expect(res.status).toBe(200);
    expect(body.verified).toBe(true);
  });

  it("returns verified:false with a MyFonts search fallback for unknown names", async () => {
    const res = await GET(req("http://localhost/api/fonts/lookup?q=Blargh%20Blargh"));
    const body = (await res.json()) as {
      verified: boolean;
      sources: { desktopDownloads: Array<{ license: string }> };
    };
    expect(body.verified).toBe(false);
    expect(body.sources.desktopDownloads[0]!.license).toBe("search");
  });

  it("rejects a missing q parameter with 400 invalid_query", async () => {
    const res = await GET(req("http://localhost/api/fonts/lookup"));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("invalid_query");
  });

  it("rejects an empty q parameter with 400 invalid_query", async () => {
    const res = await GET(req("http://localhost/api/fonts/lookup?q="));
    expect(res.status).toBe(400);
  });

  it("rejects an overlong q parameter with 400 invalid_query", async () => {
    const res = await GET(req(`http://localhost/api/fonts/lookup?q=${"x".repeat(200)}`));
    expect(res.status).toBe(400);
  });
});
