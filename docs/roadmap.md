# Implementation Roadmap

A sequenced build plan. Each milestone is a stopping point with something runnable.

**Working rule for every milestone**: TDD is the default. Each task below implies "write the tests first, land code when the tests pass, update [requirements.md](./requirements.md)." `pnpm run ci` must be green at the end of every milestone.

## M0 — Skeleton + test rails (day 1)

- `pnpm create next-app` with TypeScript + Tailwind + App Router.
- shadcn/ui init; add Button, Card, Dialog, Tooltip, Badge.
- `.env.example` with `ANTHROPIC_API_KEY` and the rate-limit / Upstash vars.
- `src/lib/env.ts` with Zod schema (REQ-coverage for "env read in one place").
- Testing stack wired up end-to-end:
  - Vitest config with three projects (unit / component / integration) + coverage gates per [ADR-0008](./adr/0008-testing-strategy.md).
  - Playwright config + one smoke `e2e/landing.e2e.ts`.
  - MSW scaffolding in `src/test/msw/` with a placeholder handler.
  - One example test per layer so contributors have a template.
- `pnpm run ci` script that runs lint + format:check + typecheck + test:coverage + build + test:e2e.
- `.github/workflows/ci.yml` already landed — verify all jobs pass against the new scaffold.
- `README.md` with quickstart (local dev + Docker), linking to `CLAUDE.md` and `docs/`.
- `CONTRIBUTING.md` including the curated-catalog PR process and the TDD expectation.
- Prettier + ESLint configured with a shared config, format enforced.

**Exit criteria**: `pnpm dev` shows a landing page; `pnpm run ci` is green locally and in GitHub Actions; example tests exist for each layer.

## M1 — Backend happy path (REQ-003/004/005/011/012/017/018/019/020/026)

- `src/lib/ai/schema.ts` — Zod schema for `report_fonts` tool input. **Tests first**: schema accepts a canonical good payload, rejects missing fields, rejects wrong confidence enum.
- `src/lib/ai/system-prompt.ts` — the system prompt as a tagged template literal with `cache_control` marker.
- `src/lib/ai/client.ts` — wrapper around `@anthropic-ai/sdk` enforcing tool_choice, temp 0, 45 s timeout, one retry on schema violation. Tests mock the SDK via MSW.
- `POST /api/identify` route: multipart parse → 10 MB + MIME content-sniff check → Anthropic call → Zod validate → return. **Tests**: oversized image → 413, wrong MIME → 415, happy path → 200 with valid shape, schema violation → one retry then 502, timeout → 504.
- `GET /api/health` → `{ ok: true, version: <git sha> }`.
- Font resolution **not yet wired** — all candidates return `verified: false`.

**Exit criteria**: integration tests cover every error code from [api-spec.md](./api-spec.md); manual `curl -F image=@sample.jpg localhost:3000/api/identify` returns a valid JSON response.

## M2 — Font resolution (REQ-013/014/015/027)

- `src/lib/fonts/google.ts`: fetch + cache Google Fonts API catalog (24 h TTL). **Tests**: hits cache on second call, refreshes after TTL, gracefully degrades if Google Fonts is down.
- `src/lib/fonts/catalog.json`: seed with ~50 entries (Helvetica, Futura, SF Pro, Segoe UI, Proxima Nova, Avenir, Gotham, Montserrat, etc.). Each entry carries `license` and `sourceUrl`.
- `src/lib/fonts/resolve.ts`: name normalization ("Helvetica Neue Regular" → "Helvetica Neue") + lookup. **Tests**: normalization table, Google hit, catalog hit, unverified fallback.
- Plug resolution into `/api/identify` response — all candidates get `sources` populated.
- `GET /api/fonts/lookup?q=` endpoint with the same resolver.

**Exit criteria**: integration test shows a Google-Fonts font produces a working embed snippet; an OS-bundled font produces a legitimate source link; an unknown font produces `verified: false` with a search fallback.

## M3 — Rate limiting (REQ-006/007/008/009/032)

- `src/lib/ratelimit/interface.ts` — `RateLimiter` interface + shared types.
- `src/lib/ratelimit/memory.ts` — LRU-backed sliding window. **Tests**: 10th request passes, 11th fails, window resets, concurrent-safe within a single process.
- `src/lib/ratelimit/upstash.ts` — Upstash implementation. **Tests**: MSW-mocked Upstash returns `remaining=0` → limiter reports fail.
- `src/lib/ratelimit/off.ts` — pass-through for `WTF_RATELIMIT=off`.
- Factory selects implementation from env.
- Wire into `/api/identify` and `/api/fonts/lookup`; surface `X-RateLimit-*` headers and `Retry-After` on 429.

**Exit criteria**: integration tests cover limited/unlimited paths and all header cases; `429` response body shape matches [api-spec.md](./api-spec.md).

## M4 — Frontend (REQ-001/002/021/022/023/024/025)

- Landing / drop zone component (accessible: keyboard + screen reader). Component test.
- Upload flow state machine: IDLE → PREVIEW → ANALYZING → RESULTS / ERROR. Component tests per state.
- Results pane: image with bbox overlays + per-region cards. Component tests for hover-highlight wiring.
- Use-on-web modal with copyable snippets; disabled tooltip when no Google Fonts match.
- Download dropdown with license badges.
- Error states with recovery affordances; rate-limit countdown.
- Mobile responsive check in Playwright.

**Exit criteria**: Playwright e2e covers the golden path (upload → results → copy web snippet) and two error paths (oversize image, rate limit) — all against MSW-mocked backend.

## M5 — Polish + ship (REQ-031/035)

- Favicon, OG image, meta tags.
- Analytics (minimal: page views + `identify_success`/`identify_error` counts, no PII per [ADR-0007](./adr/0007-no-image-persistence.md)). Plausible or self-hosted Umami.
- `docker/Dockerfile` + `docker/docker-compose.yml`. CI job optionally builds the image on `main`.
- Vercel deploy connected to `main`; env vars documented.
- Domain `whatsthatfont.com` pointed at Vercel.
- README quickstart tested by a fresh clone + `docker compose up` trial.

**Exit criteria**: hosted version works end-to-end; Docker quickstart works end-to-end; one real reference image produces a correct top-1 result.

## M6 — Accuracy eval (REQ-034)

- `eval/images/` with 50 hand-labeled reference images (open-license only).
- `eval/run.ts` runner + scoring (top-1, top-3, per-category).
- `eval/baselines/2026-04-15.json` initial baseline; subsequent runs compared against the latest.
- `.github/workflows/eval.yml` already landed — verify manual trigger works.
- `CONTRIBUTING.md` documents when to re-run (prompt or model change).

**Exit criteria**: `pnpm eval` runs end-to-end, outputs a scored report, and fails loudly on regression vs baseline.

## Post-v1 backlog (not in scope)

- Streaming partial results (SSE).
- "Render this text in the identified font" preview.
- User-supplied `@font-face` preview rendering without Google Fonts embed.
- Bulk/batch API.
- Shareable result permalinks (requires ADR-0007 revisit).
- Offline/local-model mode.
