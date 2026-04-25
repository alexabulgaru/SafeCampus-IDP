#!/bin/sh
set -e

echo "Running Prisma db push..."
npx prisma db push --force-reset

echo "Starting NestJS..."
exec node dist/main.js
