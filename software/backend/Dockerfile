
# Stage 1  Builder

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# copy prisma BEFORE install (IMPORTANT)
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci --omit=dev

# ensure prisma is generated explicitly
RUN npx prisma generate

# Copy application source
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS application
RUN npm run build


# Stage 2 - Production

FROM node:22-alpine AS production

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Application port
EXPOSE 3000

CMD ["./docker-entrypoint.sh"]