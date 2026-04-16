# ADR-0006: Deployment Target

- **Status**: Accepted
- **Date**: 2026-04-15

## Context

We need two supported deployment stories:

1. **Canonical hosted version** at `whatsthatfont.com`. Needs to be cheap at low traffic, scale to bursts, and integrate with Upstash for rate limiting.
2. **Self-host path** for anyone cloning the repo. Must work without a platform account.

Constraints from earlier ADRs: Next.js 15 app (ADR-0001), 10 MB image uploads, ~15–30 s model calls.

## Decision

### Canonical: Vercel.

- Next.js is first-class. Zero-config deploy.
- Image upload at 10 MB fits within serverless function body size for Pro plan (4.5 MB body on Hobby → we will require Pro **or** we will use a Next.js route handler running on the Node runtime with larger limits, depending on cost check at launch).
- `/api/identify` must run on the **Node runtime** (not Edge): Anthropic SDK streaming, 45 s timeout, and image buffer handling all work better there.
- Env vars for Anthropic + Upstash are set in the Vercel project.

### Self-host: Docker.

- `docker/Dockerfile` produces a Node-20 image running the Next.js standalone build.
- `docker/docker-compose.yml` sets up the app + optional Redis (for rate limiting parity). Only `ANTHROPIC_API_KEY` is required; everything else has sensible defaults.
- `README.md` includes a 5-line quickstart.

### Not on the hot path: CDN for static assets.

Next.js handles this by default; we don't add a separate CDN layer in v1.

## Alternatives considered

### A. Fly.io for the canonical deploy

Attractive (persistent processes, cheaper at low traffic, closer to "one Docker image runs the thing"). Rejected for canonical because Vercel's Next.js integration is lower friction for a solo maintainer. Fly remains a supported self-host target — the same Docker image runs there.

### B. Railway / Render

Both fine. Not chosen as canonical, but the Docker path works on either — Railway is in fact the path the initial maintainer is taking for v1. The repo README documents Railway explicitly; the Dockerfile is the source of truth and has no platform-specific code.

### C. Cloudflare Pages + Workers

Runtime compatibility with the Anthropic SDK and body-size ergonomics at 10 MB images push this below Vercel for the primary deploy. Still possible; not a v1 target.

### D. Self-hosted bare VPS with `pm2`

Documented as a supported option but not the headline self-host path. Docker is less error-prone.

## Consequences

- **Pro**: Fastest route from `main` merge to production for the canonical site.
- **Pro**: Self-host parity via a single Dockerfile; no platform lock-in for contributors.
- **Con**: If Vercel cost gets uncomfortable we migrate to Fly. Because nothing in our code is Vercel-specific (no `@vercel/*` imports beyond what Next provides), this is cheap to reverse.
- **Con**: 45 s upper bound on `/api/identify` is tight enough that we must keep the prompt efficient. This is a forcing function for good prompt design, not a problem.
