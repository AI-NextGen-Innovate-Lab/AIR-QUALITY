# =========================
# Stage 1 - Builder
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npx prisma generate
RUN npm run build


# =========================
# Stage 2 - Production
# =========================
FROM node:22-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated/prisma ./generated/prisma
COPY --from=builder /app/prisma ./prisma

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]