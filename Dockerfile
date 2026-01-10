# syntax=docker/dockerfile:1

FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Prisma engines require OpenSSL at build-time (Next.js prerender runs server code).
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Provide a default DATABASE_URL so Prisma-related code doesn't fail if the build environment
# doesn't inject it. Override at runtime in DigitalOcean App Platform.
ENV DATABASE_URL="file:./dev.db"

# Next.js build (also runs prisma generate via package.json script)
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app

# Prisma engines require OpenSSL at runtime too.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

# Copy only what we need to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "run", "start"]
