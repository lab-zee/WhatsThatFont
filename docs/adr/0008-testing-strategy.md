# ADR-0008: Testing Strategy

- **Status**: Accepted
- **Date**: 2026-04-15

## Context

This is an open-source project whose headline quality attribute is accuracy. We also intend to grow the feature surface beyond v1. Without a disciplined test base, both claims erode quickly:

- Accuracy regressions slip in when the prompt, schema, or post-processing change.
- Contributors can't confidently add features because they can't see what existing behavior they might break.
- Local/CI parity matters — a test suite that only runs in CI or only runs locally is a broken suite.

We need a stack that encourages test-driven development, runs fast enough for TDD inner loop, and scales to cover unit, integration, end-to-end, and model-accuracy dimensions.

## Decision

Four test layers, each with a clear home and tool:

| Layer        | Tool                  | Scope                                                | Speed target |
|--------------|-----------------------|------------------------------------------------------|--------------|
| Unit         | **Vitest**            | Pure functions: schema validation, name normalization, font resolution, limiter math. No network. | <5 s full suite |
| Component    | **Vitest + React Testing Library** | React components in isolation. jsdom. | <15 s full suite |
| Integration  | **Vitest + MSW**      | API route handlers end-to-end with mocked Anthropic / Google Fonts / Upstash. | <30 s full suite |
| E2E          | **Playwright**        | Real browser against a locally-started Next.js server with mocked upstreams. | <2 min full suite |
| Accuracy eval| **Custom runner**     | Real Anthropic calls against a labeled image set. Not in standard CI. | Manual |

### Hard rules

- **TDD is the default.** New behavior lands with a failing test first. Bug fixes include a regression test that fails on `main`.
- **No network in unit/component/integration tests.** All external calls go through **MSW** handlers defined in [`src/test/msw/`](#). A test that tries to hit real Anthropic fails loudly.
- **Coverage gates**: line coverage ≥ 80 % on `src/lib/**` (the pure-logic core), ≥ 60 % overall. Gates enforced in CI.
- **Same command locally and in CI.** `pnpm ci` runs the exact job set CI runs. No "works on my machine" path.
- **Deterministic.** No `Math.random`, no unpinned dates. Tests that need randomness inject seeds; tests that need time use Vitest's fake timers.
- **Mocks live next to interfaces, not next to consumers.** The Anthropic mock lives in `src/test/msw/anthropic.ts`, not duplicated in each test file.
- **Snapshot tests are opt-in, never default.** Snapshots rot; explicit assertions don't.

### Accuracy eval is a separate track

The `eval/` suite makes real Anthropic calls against labeled reference images. It is:

- Run manually (`pnpm eval`) before merging any prompt/model change.
- Also available as a GitHub Actions workflow triggered via `workflow_dispatch` — not on every PR (cost + flakiness).
- Baselines stored at `eval/baselines/<date>.json`. Regressions below the last baseline block the change.

See [`docs/testing.md`](../testing.md) for the developer-facing workflow.

## Alternatives considered

### A. Jest

Fine, but Vitest is faster (esbuild-based), has first-class TypeScript and ESM support, and shares config with Vite tooling if we ever add it. No reason to pick Jest in 2026.

### B. Cypress for E2E

Playwright is the current default: faster, parallel-friendly, better CI story, multi-browser. Cypress is fine too, just not chosen.

### C. Hit real Anthropic from integration tests

Rejected. Non-deterministic, slow, costly, and couples merges to external availability. The accuracy eval is the right place for real calls.

### D. Contract tests via Pact

Over-engineered for v1 with a single frontend-backend pair in one repo. Revisit if we ever split services.

## Consequences

- **Pro**: Strong regression safety for the parts that matter (pure logic + API contract). Fast inner loop for TDD.
- **Pro**: Local and CI parity via `pnpm ci` lowers the friction of contribution.
- **Pro**: Accuracy is tracked as a first-class dimension via the eval track, separately from the unit/integration gates.
- **Con**: Four layers is four sets of conventions to maintain. Mitigated by `docs/testing.md` and example tests shipped at M0.
- **Con**: Coverage gates can incentivize shallow tests. We accept the tradeoff and ask reviewers to flag assertion-thin tests.
