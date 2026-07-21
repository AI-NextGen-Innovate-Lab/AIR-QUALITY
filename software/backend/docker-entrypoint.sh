#!/bin/sh
set -e

echo "Running Prisma migrations..."

npx prisma migrate deploy

echo "Starting NestJS application..."

node dist/src/main.js