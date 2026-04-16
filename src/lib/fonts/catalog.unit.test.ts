import { describe, it, expect } from "vitest";
import { findCuratedFont, listCuratedFonts } from "./catalog";

describe("findCuratedFont", () => {
  it("resolves Helvetica to its macOS-bundled entry", () => {
    const entry = findCuratedFont("Helvetica");
    expect(entry).not.toBeNull();
    expect(entry!.license).toBe("bundled-macos");
    expect(entry!.sourceUrl).toContain("apple.com");
  });

  it("resolves via alias (Helvetica Neue → Helvetica)", () => {
    const entry = findCuratedFont("Helvetica Neue");
    expect(entry?.name).toBe("Helvetica");
  });

  it("resolves Segoe UI to its Windows-bundled entry", () => {
    const entry = findCuratedFont("Segoe UI");
    expect(entry?.license).toBe("bundled-windows");
  });

  it("resolves Gotham to a proprietary foundry link (Typography.com)", () => {
    const entry = findCuratedFont("Gotham");
    expect(entry?.license).toBe("proprietary");
    expect(entry?.sourceUrl).toContain("typography.com");
  });

  it("returns null for an unknown font", () => {
    expect(findCuratedFont("Definitely Not A Font 9000")).toBeNull();
  });
});

describe("listCuratedFonts", () => {
  it("is non-empty and contains well-known entries", () => {
    const all = listCuratedFonts();
    expect(all.length).toBeGreaterThan(10);
    expect(all.map((e) => e.name)).toContain("Proxima Nova");
  });

  it("all entries have a valid https source URL", () => {
    for (const entry of listCuratedFonts()) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
