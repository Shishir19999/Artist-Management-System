# syntax=docker/dockerfile:1

# ---- deps: install all dependencies (needs build tools in case bcrypt must compile) ----
FROM node:24-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---- migrate: one-shot job image that applies Prisma migrations (and optionally seeds) ----
FROM deps AS migrate
WORKDIR /app
COPY prisma.config.ts ./
COPY prisma ./prisma
# Prisma 7 needs DATABASE_URL to load prisma.config.ts even for `generate` (placeholder; real value is a runtime env var)
RUN DATABASE_URL="mysql://build:build@localhost:3306/build" npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- builder: production build (standalone output) ----
FROM deps AS builder
WORKDIR /app
COPY . .
# Placeholder only so Prisma/Next can load config at build time; the real value is a runtime env var.
ENV DATABASE_URL="mysql://build:build@localhost:3306/build" \
    NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ---- runner: minimal runtime image ----
FROM node:24-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
