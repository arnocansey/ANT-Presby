# Multi-stage build for ANT PRESS backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (the backend has no package-lock.json, so use npm install)
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (the prisma CLI is a devDependency), generate the client, then drop dev deps
RUN npm install --no-audit --no-fund \
  && npx prisma generate \
  && npm prune --omit=dev

# Final stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy application code (see .dockerignore)
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) process.exit(1)}).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Apply schema updates, then start the application
CMD ["sh", "-c", "node migrations/migrateFeatureUpdates.js && node src/server.js"]
