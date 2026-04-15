# ADR-0004: Rate Limiting Approach

- **Status**: Accepted
- **Date**: 2026-04-15

## Context

The hosted version at `whatsthatfont.com` is free to use and backed by an API that costs real money per call. Without abuse prevention, one script can burn a month of budget in an afternoon. Self-hosters have different needs — they bring their own Anthropic key and may want no limit at all, or a much tighter one.

Primary attack surface:

- Automated scripts hitting `/api/identify` in a loop.
- Large image floods (covered separately by the 10 MB size cap).
- A single IP sharing many real users (corporate NAT, libraries) — must not be bricked.

## Decision

A **pluggable rate limiter interface** with two implementations shipped in-repo.

```ts
interface RateLimiter {
  check(key: string): Promise<{ ok: boolean; remaining: number; resetAt: number }>;
}
```

Keyed by client IP (from the platform's trusted forwarded-for header — `x-forwarded-for` on Vercel, trimmed to the first entry).

- **Default (hosted)**: `@upstash/ratelimit` with a sliding-window limit of **10 requests / IP / hour** on `/api/identify`. Separate 60 req/min bucket on `/api/fonts/lookup`.
- **Self-host default**: in-memory LRU-backed limiter with the same interface. Good enough for a single instance; documented as not multi-node-safe.
- **Opt-out**: `WTF_RATELIMIT=off` disables limits entirely (common self-host case).

Config surface (env vars):

- `WTF_RATELIMIT` = `upstash` | `memory` | `off` (default: `memory` locally, `upstash` in production if Upstash env vars are set).
- `WTF_RATELIMIT_IDENTIFY` = e.g. `10/1h`.
- `WTF_RATELIMIT_LOOKUP` = e.g. `60/1m`.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Alternatives considered

### A. Cloudflare in front of Vercel with WAF rules

Works for crude protection. Rejected as the sole mechanism because (a) it doesn't integrate with our per-endpoint quotas and (b) self-hosters don't necessarily have Cloudflare. Still fine to layer on top of the app-level limiter for the hosted version.

### B. Account / auth requirement

Sidesteps the IP problem by attributing quota to a user. Rejected for v1: the product pitch is "drop an image, get fonts." Adding auth for the first experience raises friction sharply. Revisitable if abuse demands it.

### C. Per-image cost metering via Anthropic's usage response

Good for observability (we'll log it) but not a limiter — the damage is done by the time you see the cost.

## Consequences

- **Pro**: Simple, cheap, swappable. Hosted version gets a real distributed limiter; self-host stays zero-dependency.
- **Pro**: Separating the limiter behind an interface means we can add more backends (Postgres, Redis direct) without touching route handlers.
- **Con**: IP-based limits punish shared-NAT users. We accept this at current volume; a "confirm you're human" challenge can be added later if it becomes a real complaint.
- **Con**: First request after idle must warm any external limiter store. Latency impact is negligible (<30 ms for Upstash).
