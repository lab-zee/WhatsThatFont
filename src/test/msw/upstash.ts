import { http, HttpResponse } from "msw";

let remaining = 10;

export function setUpstashRemaining(value: number): void {
  remaining = value;
}

export function resetUpstashMock(): void {
  remaining = 10;
}

export const upstashHandlers = [
  http.post("https://*.upstash.io/*", () =>
    HttpResponse.json({ result: remaining > 0 ? 1 : 0, remaining: Math.max(0, remaining - 1) }),
  ),
];
