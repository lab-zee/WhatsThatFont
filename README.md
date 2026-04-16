# WhatsThatFont

Identify the fonts in any reference image. Open source. Hosted at [whatsthatfont.com](https://whatsthatfont.com).

You upload a screenshot, mood board, or inspiration shot. Claude Opus 4.6 reads the image, identifies the typefaces region by region, and hands you a ranked list with confidence scores, visual rationale, and direct links to embed or install each font.

## Status

v1 is in active development. See [docs/roadmap.md](docs/roadmap.md) for milestones and [docs/requirements.md](docs/requirements.md) for the full requirements tracker.

## Getting an Anthropic API key

1. **Create an account** at [console.anthropic.com](https://console.anthropic.com). Sign in with Google or email.
2. **Add billing** — Settings → Billing → add a card and purchase credits (the minimum is $5, which is plenty for local dev). Usage is pay-as-you-go after that; no subscription required.
3. **Create a key** — Settings → [API Keys](https://console.anthropic.com/settings/keys) → **Create Key**, name it `whatsthatfont-dev`, copy the value (starts with `sk-ant-api03-…`). You'll only see it once.
4. Paste it into your local `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-…
   ```

Cost guideline: Claude Opus 4.6 vision runs about **$0.05–$0.15 per image** identification call. The default rate limit (10/hour per IP) means a single user burns at most ~$1.50/hr. Set `WTF_MODEL=sonnet` in `.env` for ~4× cheaper calls at slightly reduced accuracy — good for heavy dev iteration.

## Quick start (local)

```bash
# 1. Use the pinned Node version.
nvm use                       # reads .nvmrc -> 24.9.0

# 2. Install deps.
pnpm install

# 3. Configure your API key (see previous section).
cp .env.example .env
#   then edit .env and paste ANTHROPIC_API_KEY=sk-ant-...

# 4. Run.
pnpm dev                      # http://localhost:3000

# 5. Verify everything is green (same as CI).
pnpm run ci
```

## Quick start (Docker)

```bash
cp .env.example .env         # set ANTHROPIC_API_KEY at minimum
docker compose -f docker/docker-compose.yml up --build
# → http://localhost:3000
```

The Dockerfile is a multi-stage build that produces a Next.js standalone bundle on Node 24.9.0 (same version as local dev). Pass any of the `WTF_*` env vars through `.env` or `docker-compose.override.yml` to tune rate limits and model selection.

## Deploying to Railway

The same Dockerfile deploys to [Railway](https://railway.app/) with no config changes.

1. **New Project → Deploy from GitHub repo** → pick this repo.
2. In the service **Settings**, set **Root Directory** to `/` and **Dockerfile Path** to `docker/Dockerfile`. Railway auto-detects `PORT` from the Dockerfile (3000).
3. Under **Variables**, set at minimum:
   - `ANTHROPIC_API_KEY` — your Anthropic key.
   - `WTF_RATELIMIT` — `memory` for a single-instance deploy, or `upstash` if you attach an Upstash Redis.
   - `GIT_SHA` — optional; Railway exposes `RAILWAY_GIT_COMMIT_SHA` which you can map to `GIT_SHA`.
4. **Deploy**. The built-in HEALTHCHECK hits `/api/health`.
5. To scale beyond one replica, switch `WTF_RATELIMIT=upstash` and provide `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

No Railway-specific code in the repo — the Dockerfile is the source of truth.

## Accuracy eval

```bash
pnpm eval:fixtures                     # generate ~10 labeled specimens via Playwright
pnpm eval                              # score them against the real Anthropic API
pnpm eval -- --case sans-inter-headline
pnpm eval -- --baseline latest         # compare against the most recent committed baseline
```

The fixture generator renders known Google Fonts to PNGs so the ground truth is exact. Not part of `pnpm run ci` (real API calls, costs money). See [eval/README.md](eval/README.md) for details and how to add your own real-world reference images alongside the generated ones.

## Contributing

Please read:

1. [CLAUDE.md](CLAUDE.md) — project rules (apply to humans too).
2. [docs/](docs/) — specs and ADRs.
3. [docs/testing.md](docs/testing.md) — how to run and write tests.
4. [CONTRIBUTING.md](CONTRIBUTING.md) — PR process + curated font catalog policy.

TL;DR: **TDD by default.** New behavior lands with failing tests first. `pnpm run ci` must be green before a PR is ready.

## Architecture at a glance

- **Stack**: Next.js 16 + React 19 + TypeScript + Tailwind 4.
- **AI**: Claude Opus 4.6 via the Anthropic SDK, with forced tool use for structured output.
- **Rate limiting**: pluggable (memory / Upstash / off), keyed by IP.
- **Fonts**: Google Fonts API + curated catalog. We never host font binaries.
- **Privacy**: uploaded images are processed in-memory and never persisted.

Full detail in [docs/adr/](docs/adr/).

## License

MIT. See [LICENSE](LICENSE).
