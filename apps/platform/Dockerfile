# Use Node.js 20 as the base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY apps/platform/package.json apps/platform/pnpm-lock.yaml* ./apps/platform/
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# Install pnpm for builder stage
RUN npm install -g pnpm@8.15.0
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install platform dependencies
RUN cd apps/platform && pnpm install

# Set environment variables for build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bWFpbi1iYXNzLTEuY2xlcmsuYWNjb3VudHMuZGV3JA

# Generate Drizzle kit (no client generation needed)
RUN cd apps/platform && npx drizzle-kit generate

# Build the application
RUN cd apps/platform && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/platform/public ./public
COPY --from=builder /app/apps/platform/.next/standalone ./
COPY --from=builder /app/apps/platform/.next/static ./.next/static

# Copy platform package files
COPY --from=builder /app/apps/platform/package.json ./package.json
COPY --from=builder /app/apps/platform/node_modules ./node_modules

# Change to platform directory
WORKDIR /app/apps/platform

# Copy Drizzle migration files
COPY --from=builder /app/apps/platform/lib/db/migrations ./lib/db/migrations

# Run Drizzle migrations in production environment (if needed)
RUN npx drizzle-kit push

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]