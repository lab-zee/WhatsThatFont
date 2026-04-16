import { describe, it, expect } from "vitest";
import { getClientIp } from "./client-ip";

function req(headers: Record<string, string>): Request {
  return new Request("http://localhost/x", { headers });
}

describe("getClientIp", () => {
  it("returns the first entry of x-forwarded-for", () => {
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("trims whitespace", () => {
    expect(getClientIp(req({ "x-forwarded-for": "   1.2.3.4   ,5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(getClientIp(req({ "x-real-ip": "198.51.100.9" }))).toBe("198.51.100.9");
  });

  it("returns 'unknown' when neither header is present", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });

  it("returns 'unknown' when x-forwarded-for is empty", () => {
    expect(getClientIp(req({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});
