#!/bin/sh
set -e

PRISMA_BIN="./node_modules/.bin/prisma"
if [ ! -x "$PRISMA_BIN" ]; then
  PRISMA_BIN="npx prisma"
fi

PRISMA_SCHEMA="--schema=prisma/schema.prisma"

if [ -f "prisma/schema.prisma" ]; then
  echo "Prisma schema found at prisma/schema.prisma"
  echo "Schema datasource/provider lines:"
  grep -n "^datasource\|^\s*provider\s*=" prisma/schema.prisma | head -n 6 || true
else
  echo "Prisma schema NOT found at prisma/schema.prisma"
fi

if [ -n "${DATABASE_URL}" ]; then
  case "${DATABASE_URL}" in
    postgresql://*|postgres://*) echo "DATABASE_URL scheme: postgres" ;;
    file:*) echo "DATABASE_URL scheme: file (sqlite)" ;;
    *) echo "DATABASE_URL scheme: unknown" ;;
  esac
else
  echo "DATABASE_URL is not set"
fi

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
