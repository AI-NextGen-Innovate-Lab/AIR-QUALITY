FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npx prisma generate

FROM node:22-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
USER app
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
