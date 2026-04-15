# Testing Guide

This project does TDD. Read [ADR-0008](./adr/0008-testing-strategy.md) for the why; this doc is the how.

## Commands

Every command below works identically locally and in CI.

```bash
pnpm install              # Always run first after pulling.

pnpm lint                 # ESLint. Fails on warnings.
pnpm typecheck            # tsc --noEmit, strict.
pnpm format:check         # Prettier check. `pnpm format` to fix.

pnpm test                 # Vitest, all layers except E2E. Runs once.
pnpm test:watch           # Vitest in watch mode. The TDD loop.
pnpm test:unit            # src/**/*.unit.test.ts
pnpm test:component       # src/**/*.component.test.tsx
pnpm test:integration     # src/**/*.integration.test.ts
pnpm test:coverage        # Vitest with coverage report. Fails if gates break.

pnpm test:e2e             # Playwright. Spins up dev server automatically.
pnpm test:e2e:ui          # Playwright in UI mode for debugging.

pnpm build                # next build.

pnpm ci                   # lint + typecheck + format:check + test:coverage + build + test:e2e.
                          # This is what CI runs. If this passes locally, CI passes.

pnpm eval                 # Accuracy eval against real Anthropic. Requires ANTHROPIC_API_KEY.
                          # Not part of `pnpm ci`.
```

## Test file conventions

| Filename                    | Runner              | Location                      |
|-----------------------------|---------------------|-------------------------------|
| `*.unit.test.ts`            | Vitest (node)       | Next to the code under test.  |
| `*.component.test.tsx`      | Vitest (jsdom)      | Next to the component.        |
| `*.integration.test.ts`     | Vitest (node + MSW) | `src/app/api/**/` and similar.|
| `*.e2e.ts`                  | Playwright          | `e2e/`                        |

Rules:

- No test file without a corresponding source file. Dead tests are worse than no tests.
- One behavior per `it(...)`. If the description needs "and", split the test.
- `describe` blocks mirror the exported identifier (e.g. `describe("normalizeFontName", ...)`).

## The TDD loop

1. **Read the requirement** in [requirements.md](./requirements.md) or the relevant ADR.
2. **Write the test**. It must fail. If it passes on the first run, you didn't test what you thought.
3. **Write the minimum code** that makes it pass.
4. **Refactor** while tests stay green.
5. **Update [requirements.md](./requirements.md)**: mark the requirement status, link the test.

## External calls — always mocked

Never make a real network call from unit/component/integration tests.

- **Anthropic**: `src/test/msw/anthropic.ts` returns canned tool-use responses. Helpers exist for common shapes (`mockFontResponse(regions)`, `mockModelError(code)`, `mockSchemaViolation()`).
- **Google Fonts API**: `src/test/msw/google-fonts.ts` returns a fixed family list.
- **Upstash**: `src/test/msw/upstash.ts` simulates remaining-quota responses.

If you need a new mock, add it to `src/test/msw/` with a short comment describing when to use it, then export from `src/test/msw/index.ts`.

## Fixtures

- Image fixtures (tiny JPGs/PNGs) live in `src/test/fixtures/images/`.
- Model response fixtures live in `src/test/fixtures/anthropic/`.
- Never commit copyrighted reference images. All fixtures are either generated, screenshots of Google Fonts specimens (public), or hand-drawn.

## Writing an integration test — example

```ts
// src/app/api/identify/route.integration.test.ts
import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { mockFontResponse } from "@/test/msw/anthropic";
import { tinyJpeg } from "@/test/fixtures/images";

describe("POST /api/identify", () => {
  it("returns verified Google Fonts candidates", async () => {
    mockFontResponse([
      { sampleText: "HEADLINE", candidates: [{ name: "Inter", confidence: "high" }] },
    ]);

    const form = new FormData();
    form.set("image", new Blob([tinyJpeg], { type: "image/jpeg" }), "ref.jpg");

    const res = await POST(new Request("http://x/api/identify", { method: "POST", body: form }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.regions[0].candidates[0]).toMatchObject({
      name: "Inter",
      verified: true,
      sources: { googleFont: { family: "Inter" } },
    });
  });
});
```

## Coverage gates

Enforced in CI on every PR.

- **`src/lib/**`**: line ≥ 80 %, branch ≥ 75 %.
- **Everything (excluding `src/test/**`, `e2e/**`, config files)**: line ≥ 60 %.

Falling below a gate fails the build. If a gate is wrong, raise a PR that argues for changing it; don't silently lower it.

## Accuracy eval

See [ADR-0008](./adr/0008-testing-strategy.md) and `eval/README.md` (landed at M6).

- `pnpm eval` runs the suite against a labeled image set.
- Outputs `eval/reports/<timestamp>.json` with top-1, top-3, and per-category scores.
- Regressions against the latest baseline block a prompt/model change.

## Debugging tips

- `pnpm test -- -t "part of it() name"` runs a single test.
- `pnpm test:watch` + a failing test is the fastest feedback loop in the repo.
- Vitest prints the MSW handler that matched when a request hits one; set `DEBUG=msw:*` for more detail.
- Playwright: `--headed --debug` drops you into the inspector.
