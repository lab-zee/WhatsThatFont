# Contributing to WhatsThatFont

Thanks for looking. Two things to know before you start: this project does TDD, and it follows a handful of strict architectural rules captured in [docs/adr/](docs/adr/) and enforced by [CLAUDE.md](CLAUDE.md). Read those before a non-trivial PR.

## Setup

```bash
nvm use                  # Node 24.9.0
pnpm install
cp .env.example .env     # add ANTHROPIC_API_KEY
pnpm run ci                  # full local gate — same jobs as CI
```

## The workflow

1. **Find the requirement** in [docs/requirements.md](docs/requirements.md), or add a new row if you're introducing new behavior.
2. **Write the failing test first.** See [docs/testing.md](docs/testing.md) for the four layers and naming conventions.
3. **Write the minimum code to pass.**
4. **Refactor** while the suite stays green.
5. **Update the requirements tracker** — move the row to `Done` and link the test(s).
6. **Run `pnpm run ci`.** If it's green, open the PR.

## Test layers (short version)

| File pattern            | Runner       | Where               |
| ----------------------- | ------------ | ------------------- |
| `*.unit.test.ts`        | Vitest node  | next to source      |
| `*.component.test.tsx`  | Vitest jsdom | next to component   |
| `*.integration.test.ts` | Vitest + MSW | next to route / lib |
| `*.e2e.ts`              | Playwright   | `e2e/`              |

Never make real network calls from unit/component/integration tests. MSW handlers live in `src/test/msw/` — extend them rather than adding ad-hoc fetch stubs.

## Architectural rules (non-exhaustive — full list in [CLAUDE.md](CLAUDE.md))

- No new runtime dependencies without a PR comment justifying them.
- No direct `process.env.X` outside `src/lib/env.ts` — CI blocks it.
- No writing uploaded images to disk, cache, object storage, or logs. See [ADR-0007](docs/adr/0007-no-image-persistence.md).
- No hosting or committing font binaries. CI blocks it.
- Model output is always validated with Zod. Retries are bounded at one. See [ADR-0003](docs/adr/0003-structured-output.md).
- Rate limiters go through the `RateLimiter` interface, never called directly.

## Curated font catalog (`src/lib/fonts/catalog.json`)

Adding a font? PR must include:

1. The canonical name (exact capitalization).
2. `license`: one of `ofl` | `proprietary` | `bundled-macos` | `bundled-windows` | `bundled-adobe-fonts`.
3. `sourceUrl`: a link to the **foundry's own site**, the OS vendor's documentation, or a Google Fonts page. No DaFont/cdnfonts knockoff links. Maintainers reject entries that don't meet this bar.
4. A one-line note on how you verified the font is legitimately distributed from that source.

## Accuracy eval

If your change touches the system prompt, Zod schema, model selection, or post-processing, run `pnpm eval` locally (or trigger the `Accuracy eval` workflow on your branch) before merging. A regression vs. the latest baseline in `eval/baselines/` blocks the change. See [ADR-0008](docs/adr/0008-testing-strategy.md).

## Commit style

- One logical change per commit. Small PRs over big ones.
- Imperative present tense (`add`, not `added`).
- Reference REQ-IDs in commit messages when applicable (`fix REQ-006: 429 header shape`).
- Pre-commit hooks are not installed by default — we prefer `pnpm run ci` as the single gate.

## Questions

Open a Discussion or file an Issue — we'd rather talk about an idea before you build it, especially for anything architectural.
