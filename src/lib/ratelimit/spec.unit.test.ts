import { describe, it, expect } from "vitest";
import { parseSpec } from "./spec";

describe("parseSpec", () => {
  it("parses 10/1h", () => {
    expect(parseSpec("10/1h")).toEqual({ count: 10, windowMs: 3_600_000, label: "1h" });
  });

  it("parses 60/1m", () => {
    expect(parseSpec("60/1m")).toEqual({ count: 60, windowMs: 60_000, label: "1m" });
  });

  it("parses 1/30s", () => {
    expect(parseSpec("1/30s")).toEqual({ count: 1, windowMs: 30_000, label: "30s" });
  });

  it("parses 100/1d", () => {
    expect(parseSpec("100/1d")).toEqual({ count: 100, windowMs: 86_400_000, label: "1d" });
  });

  it("throws on malformed input", () => {
    expect(() => parseSpec("ten per hour")).toThrow(/Invalid rate-limit spec/);
  });

  it("throws on missing unit", () => {
    expect(() => parseSpec("10/1")).toThrow(/Invalid rate-limit spec/);
  });

  it("throws on non-positive count", () => {
    expect(() => parseSpec("0/1h")).toThrow(/Invalid rate-limit spec/);
  });
});
