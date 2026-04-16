import { describe, it, expect } from "vitest";
import { findGoogleFont, listGoogleFamilies } from "./google";

describe("findGoogleFont", () => {
  it("finds a well-known Google Fonts family exactly", () => {
    const out = findGoogleFont("Inter");
    expect(out).not.toBeNull();
    expect(out!.family).toBe("Inter");
  });

  it("matches case-insensitively", () => {
    expect(findGoogleFont("inter")!.family).toBe("Inter");
    expect(findGoogleFont("PLAYFAIR DISPLAY")!.family).toBe("Playfair Display");
  });

  it("strips 'Regular' before looking up", () => {
    expect(findGoogleFont("Inter Regular")!.family).toBe("Inter");
  });

  it("emits a css2 embed URL with + between words", () => {
    const out = findGoogleFont("Playfair Display");
    expect(out!.embedUrl).toBe(
      "https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap",
    );
  });

  it("emits a quoted cssFamily suitable for dropping into CSS", () => {
    expect(findGoogleFont("Inter")!.cssFamily).toContain("'Inter'");
  });

  it("returns null for non-Google fonts", () => {
    expect(findGoogleFont("Helvetica")).toBeNull();
    expect(findGoogleFont("Definitely Not A Font")).toBeNull();
  });
});

describe("listGoogleFamilies", () => {
  it("exposes the seeded catalog (non-empty)", () => {
    const list = listGoogleFamilies();
    expect(list.length).toBeGreaterThan(30);
    expect(list).toContain("Inter");
  });
});
