import { describe, it, expect } from "vitest";
import { normalizeFontName, matchKey } from "./normalize";

describe("normalizeFontName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeFontName("  Inter  ")).toBe("Inter");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeFontName("Playfair   Display")).toBe("Playfair Display");
  });

  it("strips a trailing 'Regular' weight suffix", () => {
    expect(normalizeFontName("Inter Regular")).toBe("Inter");
  });

  it("strips a trailing 'Book' weight suffix", () => {
    expect(normalizeFontName("Gotham Book")).toBe("Gotham");
  });

  it("does not strip weight-like words in the middle", () => {
    expect(normalizeFontName("Regular Roman")).toBe("Regular Roman");
  });

  it("leaves family names without suffixes alone", () => {
    expect(normalizeFontName("Playfair Display")).toBe("Playfair Display");
  });
});

describe("matchKey", () => {
  it("returns a lowercase normalized key", () => {
    expect(matchKey("  INTER Regular  ")).toBe("inter");
  });

  it("matches case-insensitively across declarations", () => {
    expect(matchKey("helvetica neue")).toBe(matchKey("Helvetica Neue"));
  });
});
