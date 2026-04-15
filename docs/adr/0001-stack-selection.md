# ADR-0001: Stack Selection

- **Status**: Accepted
- **Date**: 2026-04-15

## Context

We need a web app that:

- Serves a React UI from `whatsthatfont.com`.
- Accepts image uploads and calls the Anthropic API server-side (keeping the API key off the client).
- Ships as an open-source repo that a third party can self-host with one command.
- Has a single primary maintainer; minimizing moving parts matters more than theoretical flexibility.

The user expressed no preference between Node and Python. They did ask for a React frontend.

## Decision

**Next.js 15 (App Router) + React 19 + TypeScript, single application.**

- UI: React Server Components + Client Components as needed.
- Backend: Next.js route handlers under `app/api/*`.
- Styling: Tailwind CSS + shadcn/ui.
- Validation: Zod.
- AI: `@anthropic-ai/sdk`.
- Package manager: `pnpm`.
- Lint/format: `eslint` + `prettier` with `eslint-config-next`.

Directory layout:

```
/
├── app/                     # Next.js routes + API handlers
├── src/
│   ├── components/          # React UI
│   ├── lib/
│   │   ├── ai/              # Anthropic client, system prompt, schema
│   │   ├── fonts/           # Google Fonts + curated catalog lookups
│   │   └── ratelimit/       # Pluggable limiter
│   └── types/
├── public/
├── docs/                    # This directory
├── eval/                    # Accuracy eval harness
└── docker/                  # Dockerfile + compose for self-host
```

## Alternatives considered

### A. Separate Vite React SPA + Fastify backend

Two services, two deploys, two dev servers. More flexibility (swap either half independently), but significantly more friction for self-hosters and more CI surface. The flexibility is not a real v1 need.

### B. FastAPI backend + Vite React frontend

Python has strong image libraries but we're not doing local image processing — the model does the seeing. Picking Python would split the language at the only seam in the project for no gain, and the Anthropic TypeScript SDK is as mature as the Python one.

### C. Remix / TanStack Start

Both are viable. Next.js wins on ecosystem familiarity for OSS contributors and has first-class Vercel hosting for the canonical deploy.

### D. Cloudflare Workers / Hono

Attractive for a globally fast API, but the 100 MB worker memory cap and image-size constraints make uploading/analyzing 10 MB images uncomfortable. Would also complicate local dev parity.

## Consequences

- **Pro**: one `pnpm dev` spins the whole app; one Dockerfile for self-host; API key lives only on the server.
- **Pro**: TypeScript end-to-end means the Zod schema used to validate the model's tool output is also the source of truth for the frontend response type.
- **Con**: Next.js is a large dependency and has opinions. We accept this; the alternative (DIY glue) costs more.
- **Con**: Vercel serverless functions cap request body size. We will cap images at 10 MB which fits within defaults, and document the limit for self-hosters on other platforms.
