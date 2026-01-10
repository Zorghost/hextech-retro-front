#!/bin/sh
set -e

if [ "${SKIP_PRISMA_MIGRATE}" != "true" ]; then
  echo "Running Prisma migrations (migrate deploy)..."
  npx prisma migrate deploy
fi

if [ "${RUN_PRISMA_SEED}" = "true" ]; then
  echo "Running Prisma seed..."
  npx prisma db seed
fi

echo "Starting Next.js..."
exec "$@"
