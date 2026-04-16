# syntax=docker/dockerfile:1.7

# Build args — bump when we bump the pinned Node in .nvmrc.
ARG NODE_VERSION=24.9.0

FROM node:${NODE_VERSION}-alpine AS base
# libc6-compat is needed by some Node binaries on alpine.
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME=/root/.pnpm
ENV PATH=$PNPM_HOME:$PATH

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable \
 && corepack prepare pnpm@10.28.2 --activate \
 && pnpm install --frozen-lockfile

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time placeholder — the real key is required at runtime. env.ts is lazy
# so this is only needed so `next build` can import the route handlers without
# the strict env validator exploding during page-data collection.
ENV ANTHROPIC_API_KEY=build-placeholder-never-used
ENV WTF_RATELIMIT=off
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable \
 && corepack prepare pnpm@10.28.2 --activate \
 && pnpm build

# ---------- runner ----------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# Next.js standalone bundle contains only the needed runtime deps + server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
