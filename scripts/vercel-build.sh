#!/bin/sh
# Vercel build. `next build` runs before `prisma migrate deploy` + seed, so a
# migration only reaches the database once the new deploy is ready to be
# promoted.
#
# Migrations and seed only run in production, or in previews when
# MIGRATE_ON_BUILD=1 is set for the Preview environment (only do that once
# each preview gets its own Neon branch). Without this guard a pull request
# with a migration would change the production database as soon as its
# preview is built.
set -e

npx prisma generate
npx next build

if [ "$VERCEL_ENV" = "production" ] || [ "$MIGRATE_ON_BUILD" = "1" ]; then
  npx prisma migrate deploy
  node prisma/seed.mjs
else
  echo "Skipping migrate deploy and seed (VERCEL_ENV=$VERCEL_ENV)."
fi
