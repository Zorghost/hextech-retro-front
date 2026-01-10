#!/bin/sh
set -e

PRISMA_BIN="./node_modules/.bin/prisma"
if [ ! -x "$PRISMA_BIN" ]; then
  PRISMA_BIN="npx prisma"
fi

PRISMA_SCHEMA="--schema=prisma/schema.prisma"

if [ "${SKIP_PRISMA_MIGRATE}" != "true" ]; then
  echo "Running Prisma migrations (migrate deploy)..."
  $PRISMA_BIN migrate deploy $PRISMA_SCHEMA
fi

if [ "${RUN_PRISMA_SEED}" = "true" ]; then
  echo "Running Prisma seed..."
  $PRISMA_BIN db seed $PRISMA_SCHEMA
fi

echo "Starting Next.js..."
exec "$@"
