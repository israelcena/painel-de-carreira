#!/bin/bash
# Setup script for the Claude Code cloud environment that runs the AFK
# routine (see docs/agents/afk-runbook.md). Paste it into the environment's
# setup script, or call it from there. Needs GH_TOKEN set in the environment:
# a fine-grained token scoped to this repo only, with Issues, Pull requests and
# Contents read/write.
#
# Installs gh, bun and a throwaway local Postgres, then installs dependencies
# and prepares the database with migrations and seed. Nothing here touches Neon.
set -euo pipefail

SUDO=""
if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null; then SUDO="sudo"; fi

$SUDO apt-get update -qq
$SUDO apt-get install -y -qq gh postgresql >/dev/null

command -v bun >/dev/null || npm install -g bun

# Throwaway database for the session
$SUDO service postgresql start
$SUDO -u postgres psql -qc "CREATE USER painel WITH PASSWORD 'painel' CREATEDB;" 2>/dev/null || true
$SUDO -u postgres psql -qc "CREATE DATABASE painel OWNER painel;" 2>/dev/null || true

# .env.example already points at localhost:5432 with painel/painel
[ -f .env ] || cp .env.example .env

bun install --frozen-lockfile
npx prisma generate
npx prisma migrate deploy
node prisma/seed.mjs

gh auth status
