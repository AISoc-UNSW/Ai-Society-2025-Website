# syntax=docker/dockerfile:1

# ---------- Build dependencies layer ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on lock file if available for reproducible builds
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci

# ---------- Application build layer ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Re-use node_modules from previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy remaining application source
COPY . .

RUN npm run build

# ---------- Production runtime layer ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Copy the built application and only runtime files to keep image slim
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
# Reuse production dependencies
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"] 