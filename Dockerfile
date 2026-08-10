# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN apk add --no-cache openssl libc6-compat

# ── Dependências ─────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ── CLI do Prisma isolado (para migrate deploy no start) ─────────────
# O CLI tem dependências transitivas próprias (effect, c12, ...);
# instalar completo em um diretório isolado evita cópias frágeis.
FROM base AS migrate
WORKDIR /migrate
RUN npm init -y >/dev/null && npm install --no-audit --no-fund prisma@6.19.3

# ── Runtime ───────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Client gerado + engines para o seed e o runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
# CLI completo isolado para rodar as migrations no start.
# Precisa se chamar node_modules para a resolução de módulos do Node.
COPY --from=migrate --chown=nextjs:nodejs /migrate/node_modules ./migrate/node_modules

USER nextjs
EXPOSE 3000

# migrate deploy (idempotente) → seed (idempotente) → servidor
CMD ["sh", "-c", "node migrate/node_modules/prisma/build/index.js migrate deploy && node prisma/seed.mjs && node server.js"]
