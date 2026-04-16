# WhatsThatFont

Identify the fonts in any reference image. Open source. Hosted at [whatsthatfont.com](https://whatsthatfont.com).

You upload a screenshot, mood board, or inspiration shot. Claude Opus 4.6 reads the image, identifies the typefaces region by region, and hands you a ranked list with confidence scores, visual rationale, and direct links to embed or install each font.

## Status

v1 is in active development. See [docs/roadmap.md](docs/roadmap.md) for milestones and [docs/requirements.md](docs/requirements.md) for the full requirements tracker.

## Quick start (local)

```bash
# 1. Use the pinned Node version.
nvm use                       # reads .nvmrc -> 24.9.0

# 2. Install deps.
pnpm install

# 3. Configure your API key.
cp .env.example .env
#   then edit .env and set ANTHROPIC_API_KEY=sk-...

# 4. Run.
pnpm dev                      # http://localhost:3000

# 5. Verify everything is green (same as CI).
pnpm run ci
```

## Quick start (Docker)

```bash
cp .env.example .env         # set ANTHROPIC_API_KEY
docker compose -f docker/docker-compose.yml up
```

Docker support lands in **M5** per the [roadmap](docs/roadmap.md).

## Contributing

Please read:

1. [CLAUDE.md](CLAUDE.md) — project rules (apply to humans too).
2. [docs/](docs/) — specs and ADRs.
3. [docs/testing.md](docs/testing.md) — how to run and write tests.
4. [CONTRIBUTING.md](CONTRIBUTING.md) — PR process + curated font catalog policy.

TL;DR: **TDD by default.** New behavior lands with failing tests first. `pnpm run ci` must be green before a PR is ready.

## Architecture at a glance

- **Stack**: Next.js 15 + React 19 + TypeScript + Tailwind.
- **AI**: Claude Opus 4.6 via the Anthropic SDK, with forced tool use for structured output.
- **Rate limiting**: pluggable (memory / Upstash / off), keyed by IP.
- **Fonts**: Google Fonts API + curated catalog. We never host font binaries.
- **Privacy**: uploaded images are processed in-memory and never persisted.

Full detail in [docs/adr/](docs/adr/).

## License

MIT. See [LICENSE](LICENSE).
