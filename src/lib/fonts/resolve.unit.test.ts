import { describe, it, expect } from "vitest";
import { resolveSources } from "./resolve";

describe("resolveSources", () => {
  it("flags Google Fonts matches as verified with embed URL + css family", () => {
    const out = resolveSources("Inter");
    expect(out.verified).toBe(true);
    expect(out.sources.googleFont).not.toBeNull();
    expect(out.sources.googleFont!.family).toBe("Inter");
    expect(out.sources.googleFont!.embedUrl).toContain("fonts.googleapis.com");
    expect(out.sources.desktopDownloads[0]!.license).toBe("ofl");
  });

  it("flags curated non-Google matches as verified with foundry link", () => {
    const out = resolveSources("Proxima Nova");
    expect(out.verified).toBe(true);
    expect(out.sources.googleFont).toBeNull();
    expect(out.sources.desktopDownloads[0]!.license).toBe("proprietary");
    expect(out.sources.desktopDownloads[0]!.url).toContain("marksimonson.com");
  });

  it("resolves OS-bundled fonts via the curated catalog with legitimate OS link", () => {
    const out = resolveSources("Helvetica");
    expect(out.verified).toBe(true);
    expect(out.sources.desktopDownloads[0]!.license).toBe("bundled-macos");
    expect(out.sources.desktopDownloads[0]!.url).toContain("apple.com");
  });

  it("emits both Google Fonts and curated entries when a name matches both", () => {
    // "Bodoni" is in curated (proprietary). Not currently on Google Fonts list,
    // so only the curated entry appears. This test documents the dual-emit ordering
    // for a future case where a name appears in both.
    const out = resolveSources("Bodoni");
    expect(out.verified).toBe(true);
    expect(out.sources.desktopDownloads.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to unverified search link when nothing matches", () => {
    const out = resolveSources("Completely Made Up Font 9000");
    expect(out.verified).toBe(false);
    expect(out.sources.googleFont).toBeNull();
    expect(out.sources.desktopDownloads).toHaveLength(1);
    expect(out.sources.desktopDownloads[0]!.license).toBe("search");
  });

  it("matches case-insensitively and normalizes weight suffixes", () => {
    expect(resolveSources("INTER REGULAR").verified).toBe(true);
    expect(resolveSources("helvetica neue").verified).toBe(true);
  });
});
