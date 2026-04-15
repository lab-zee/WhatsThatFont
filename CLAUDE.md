# CLAUDE.md — Project Rules for AI Agents

This file is loaded automatically into every Claude Code session in this repo. Follow it literally. If a rule here conflicts with a user request, surface the conflict before acting.

## 0. Orientation — read these first

Before making any non-trivial change, confirm you have read the relevant docs:

- [`docs/prd.md`](docs/prd.md) — what we're building and why.
- [`docs/api-spec.md`](docs/api-spec.md) — HTTP contract.
- [`docs/prompt-spec.md`](docs/prompt-spec.md) — model prompt + structured output.
- [`docs/ux-flow.md`](docs/ux-flow.md) — UI states.
- [`docs/requirements.md`](docs/requirements.md) — authoritative requirements tracker.
- [`docs/testing.md`](docs/testing.md) — test layers and commands.
- [`docs/adr/`](docs/adr/) — all Architecture Decision Records.

If your task touches an area not yet described, ask before guessing. Do not silently invent architecture.

## 1. TDD is the default workflow

1. Identify the requirement (by REQ-ID if it exists) in [requirements.md](docs/requirements.md). If it's missing, add it before writing code.
2. Write a failing test first. Run it. It must actually fail.
3. Write the minimum code to pass the test.
4. Refactor with the suite green.
5. Update [requirements.md](docs/requirements.md): mark status and link the test.

Bug fixes always ship with a regression test that fails on the current `main`.

## 2. ADR adherence — these are hard rules

These are not suggestions. Violating one requires a new ADR that supersedes the existing one.

- **[ADR-0001] Stack**: Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui + Zod. Do not introduce Express, Fastify, a separate backend service, or a second UI framework.
- **[ADR-0002] Model**: Identification uses `claude-opus-4-6` (or `claude-sonnet-4-6` when `WTF_MODEL=sonnet`). Temperature 0. System prompt has `cache_control: { type: "ephemeral" }`. No other models without an ADR update.
- **[ADR-0003] Structured output**: Model output is obtained via forced tool use (`tool_choice: { type: "tool", name: "report_fonts" }`), validated with Zod, retried **exactly once** on schema failure. Never parse prose JSON. Never loop retries.
- **[ADR-0004] Rate limiting**: All limiters go through the `RateLimiter` interface. Never call Upstash directly from a route handler. Never hard-code limits — read from env.
- **[ADR-0005] Font acquisition**: We do not host font binaries. Ever. Non-Google fonts link only to legitimate sources listed in the curated catalog. No DaFont fallbacks for commercial fonts.
- **[ADR-0006] Deployment**: Canonical runtime is Node (not Edge) for `/api/identify`. Keep the app portable — no `@vercel/*` imports beyond what Next.js itself uses.
- **[ADR-0007] No image persistence**: Uploaded image bytes must never be written to disk, cache, S3, logs, or anywhere else. In-memory only. Logs may record size and MIME, nothing else.
- **[ADR-0008] Testing**: Four layers (unit / component / integration / e2e) plus eval. No real network in unit/component/integration — MSW always. Coverage gates enforced.

## 3. Hard tripwires

Actions that should cause you to stop and ask the user before proceeding:

- Adding a new runtime dependency (any `dependencies` entry in `package.json`). Note the purpose and license in the PR.
- Modifying the system prompt or Zod schema in `src/lib/ai/`. These drive accuracy — changes need eval run.
- Adding a third-party service (new API, new vendor, new SaaS).
- Anything that could write to persistent storage on the request path.
- Loosening a coverage gate.
- Adding `// eslint-disable` / `@ts-ignore` / `@ts-expect-error` without a comment explaining why.
- Introducing auth, accounts, or user-identifying analytics.

## 4. Coding conventions

- **Types**: no `any`. Use `unknown` at boundaries and narrow. Strict TS everywhere.
- **Validation**: all external data (HTTP request bodies, model responses, env vars) passes through Zod.
- **Env vars**: declared once in `src/lib/env.ts` with a Zod schema. Never read `process.env.X` directly in feature code.
- **Errors**: route handlers return the error shape in [api-spec.md](docs/api-spec.md). Never leak stack traces. Log internally with a `requestId`.
- **Logging**: structured (JSON). Never log image bytes, pixel data, or anything that could be the image itself.
- **Comments**: default to none. Only add when the *why* is non-obvious. No "this function does X" comments.
- **Imports**: absolute via `@/*` alias for anything in `src/`. Relative only within the same folder.
- **Exports**: named only. No default exports (Next.js pages are the exception Next requires).

## 5. File organization

```
app/                      Next.js routes
src/
  components/             React components (PascalCase dirs)
  lib/
    ai/                   Anthropic client, system prompt, schema, retry
    fonts/                Google Fonts + curated catalog lookups
    ratelimit/            RateLimiter interface + implementations
    env.ts                Env schema (Zod)
  test/                   Test utilities — NOT tests themselves
    msw/                  MSW handlers for each external service
    fixtures/             Images, model responses
  types/                  Ambient / shared types only
e2e/                      Playwright specs
eval/                     Accuracy eval harness (runs against real Anthropic)
docs/                     Specs + ADRs
docker/                   Dockerfile + compose.yml for self-host
```

Tests live next to the code they test (`foo.ts` → `foo.unit.test.ts` in the same directory), except e2e which lives in `e2e/`.

## 6. When adding or changing behavior

Checklist before you say "done":

- [ ] Tests written first, now passing.
- [ ] `pnpm ci` passes locally.
- [ ] [requirements.md](docs/requirements.md) updated with status + test link.
- [ ] If a public contract changed (API, env vars, schema), [api-spec.md](docs/api-spec.md) or relevant spec updated.
- [ ] If an architectural decision was made, a new ADR added under [docs/adr/](docs/adr/).
- [ ] No new `dependencies` without user approval.
- [ ] No image-persistence side effects.
- [ ] Rate-limit behavior unchanged or explicitly updated in ADR-0004.

## 7. Requirements tracker discipline

[`docs/requirements.md`](docs/requirements.md) is the source of truth CI and reviewers consult. Every PR that lands user-visible behavior must:

- Move at least one row to `Done` or add a new row.
- Link the test(s) that prove the requirement. A row marked `Done` with no test link is rejected by CI.
- Never delete rows. Use `Dropped` with a note.

## 8. Phases and scope

We are currently in **Phase 1 (v1)**. Items marked `Deferred` or listed under "Phase 2+" in requirements.md are *not* in scope. Do not build toward them speculatively. Do not add abstractions "in case we need them later" — we won't know what we need until we need it. Keep Phase 1 small and sharp.

## 9. Communication

- State what you're about to change before doing it.
- If you discover a rule here is wrong or outdated, raise it rather than quietly bypassing it.
- Do not create commits or open PRs unless the user explicitly asks.
- Do not `git push --force` or run any destructive git operation without explicit permission.

## 10. Meta

If you change CLAUDE.md itself, call out the diff in the PR description. This file is read every session — silent changes are high-blast-radius.
