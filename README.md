Simple Retro Gaming Platform - NextRivals
The website can be used locally or you could move all of your assets into an S3 bucket.

**Note that game ROMS are not included.*

## Getting Started

### Prerequisites

- Node.js LTS (recommended: Node 20; Node 18 also works). If you are on very new Node versions (e.g. Node 24), dependencies in this repo (Prisma 5 / Next.js 14) may fail to install or may cause `npx` to download incompatible Prisma versions.

### Environment Variables

Setup your enviroment veraibles:
```
DATABASE_URL=file:./dev.db
NEXT_WEBSITE_URL=http://localhost:3000
AUTH_SECRET=YourSecretPhrase

# S3-compatible object storage (works with AWS S3 and DigitalOcean Spaces)
# DigitalOcean Spaces example endpoint: https://nyc3.digitaloceanspaces.com
NEXT_S3_BUCKET_NAME=your-space-name
NEXT_S3_REGION=nyc3
NEXT_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
NEXT_S3_KEY_ID=your-spaces-access-key
NEXT_S3_SECRET_ACCESS_KEY=your-spaces-secret

# Optional: set true if your bucket uses ACLs for public objects
NEXT_S3_PUBLIC_READ=false

# Public asset base URLs (recommended for production)
# Example with Spaces CDN:
# https://<space-name>.<region>.cdn.digitaloceanspaces.com
NEXT_PUBLIC_ROM_BASE_URL=https://<space>.<region>.cdn.digitaloceanspaces.com/rom
NEXT_PUBLIC_GAME_THUMBNAIL_BASE_URL=https://<space>.<region>.cdn.digitaloceanspaces.com/thumbnail
NEXT_PUBLIC_CATEGORY_IMAGE_BASE_URL=https://<space>.<region>.cdn.digitaloceanspaces.com/category
```

Notes:

- Existing AWS env var names are still supported for backwards compatibility: `NEXT_AWS_S3_BUCKET_NAME`, `NEXT_AWS_S3_REGION`, `NEXT_AWS_S3_KEY_ID`, `NEXT_AWS_S3_SECRET_ACCESS_KEY` (and optional `NEXT_AWS_S3_ENDPOINT`).
- For local dev without object storage, you can omit the `NEXT_PUBLIC_*_BASE_URL` vars and the app will use files from `public/`.

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
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploying to DigitalOcean App Platform (Container)

This repo includes a production-ready `Dockerfile`.

- Build command (local):
    - `docker build -t hextech-retro-front .`
- Run command (local):
    - `docker run --rm -p 3000:3000 --env-file .env hextech-retro-front`

In App Platform:

- Choose **Deploy from repository** → **Dockerfile**.
- Configure runtime env vars in App Platform (Database URL, NextAuth secret, and Spaces creds/URLs).

Database note:

- The container entrypoint runs `npx prisma migrate deploy` on startup (set `SKIP_PRISMA_MIGRATE=true` to disable).
- To load demo data automatically on startup (usually only for staging), set `RUN_PRISMA_SEED=true`.


## 3S Bucket Policy

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::game-website123/*"
        }
    ]
}
```

## Find Bug Fixes Here

Open [https://raddy.dev/blog/build-your-own-retro-gaming-website-next-js-14-prisma/](Raddy's Blog - Bug Fixes)