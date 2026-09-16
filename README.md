Simple Retro Gaming Platform - NextRivals
The website can be used locally or you can store all assets in a Google Cloud Storage bucket.

**Note that game ROMS are not included.*

## Getting Started

### Prerequisites

- Node.js LTS (recommended: Node 20; Node 18 also works). If you are on very new Node versions (e.g. Node 24), dependencies in this repo (Prisma 5 / Next.js 14) may fail to install or may cause `npx` to download incompatible Prisma versions.

### Environment Variables

Setup your enviroment veraibles:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
# Canonical public site origin (important for sitemap, robots, and canonical URLs)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Backwards-compatible alias (still supported):
NEXT_WEBSITE_URL=http://localhost:3000
AUTH_SECRET=YourSecretPhrase

# Google Cloud Storage
GCS_BUCKET_NAME=your-gcs-bucket
# Use one of these credential options:
# GCP_PROJECT_ID=your-google-cloud-project
# GCS_KEY_FILE=/absolute/path/to/service-account.json
# Or set GCS_SERVICE_ACCOUNT_JSON to the service-account JSON in deployment secrets.

# Public asset base URLs (recommended for production)
# Google Cloud Storage public URL example:
# https://storage.googleapis.com/<bucket-name>/rom
NEXT_PUBLIC_ROM_BASE_URL=https://storage.googleapis.com/<bucket-name>/rom
NEXT_PUBLIC_GAME_THUMBNAIL_BASE_URL=https://storage.googleapis.com/<bucket-name>/thumbnail
NEXT_PUBLIC_CATEGORY_IMAGE_BASE_URL=https://storage.googleapis.com/<bucket-name>/category

# If your bucket/objects are private (you see 403 from the URLs above), you can proxy
# images and ROMs through the Next.js app using server-side Google credentials.
# This avoids 403s from private buckets and keeps the browser from hitting storage directly.
NEXT_PUBLIC_IMAGE_SOURCE=proxy
NEXT_PUBLIC_ROM_SOURCE=proxy

# Google Analytics (GA4)
# Optional override; defaults to the built-in measurement ID if unset.
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YQXYSJGK8L
```

Notes:

- Google Cloud deployments can use Application Default Credentials instead of setting `GCS_KEY_FILE` or `GCS_SERVICE_ACCOUNT_JSON`.
- For local dev without object storage, omit the `NEXT_PUBLIC_*_BASE_URL` vars and the app will use files from `public/`.

```bash
npm install
npm run dev
```

Download the project and run:

```bash
npm install
npm run dev
```

In a development environment, use the migrate dev command to generate and apply migrations:

```bash
npm install
npx prisma migrate dev
```

If `npx prisma migrate dev` prompts you to install Prisma 7 and then errors with schema validation (P1012), you likely ran Prisma before installing dependencies or your environment is picking a different Prisma version. Use the pinned version from this repo:

```bash
npx prisma@5.20.0 migrate dev
```

To seed the demo data into the database apply:

```bash
npx prisma db seed
```

If you seeded data with explicit `id` values (like this repo’s demo seed), Postgres sequences can fall behind. If you see an error like:

- `Invalid prisma.game.create() invocation: Unique constraint failed on the fields: (id)`

Run:

```bash
npm run db:resync
```

(In DigitalOcean App Platform you can run this as a one-off command against the same `DATABASE_URL`.)
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploying to DigitalOcean App Platform (Container)

This repo includes a production-ready `Dockerfile`.

- Build command (local):
    - `docker build -t hextech-retro-front .`
- Run command (local):
    - `docker run --rm -p 3000:3000 --env-file .env hextech-retro-front`

In App Platform:

- Choose **Deploy from repository** → **Dockerfile**.
- Configure runtime env vars in App Platform (Database URL, NextAuth secret, and the GCS bucket/credential settings).

Database note:

- This project is configured for PostgreSQL in production. Create a DigitalOcean PostgreSQL database component and set `DATABASE_URL` to its connection string.
- The container entrypoint runs `prisma migrate deploy` on startup using `prisma/schema.prisma` (set `SKIP_PRISMA_MIGRATE=true` to disable).
- To load demo data automatically on startup (usually only for staging), set `RUN_PRISMA_SEED=true`.


## Google Cloud Storage Permissions

Grant the runtime service account `Storage Object Admin` on the bucket. This is required
for private-bucket proxy reads, uploads, resumable ROM uploads, and cleanup of replaced files.

## Find Bug Fixes Here

Open [https://raddy.dev/blog/build-your-own-retro-gaming-website-next-js-14-prisma/](Raddy's Blog - Bug Fixes)