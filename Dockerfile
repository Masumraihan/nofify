# Stage 1: Build
FROM node:latest as builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./
COPY public ./

# Use npm ci for clean, repeatable builds
RUN npm install
COPY . .

# Generate Prisma client and build project
RUN npm run build && npm run postinstall

# Stage 2: Production
FROM node:latest

WORKDIR /app

# Install only necessary system packages securely
RUN apt-get update && \
    apt-get install -y --no-install-recommends libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy necessary build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 2000

CMD ["node", "dist/server.js"]
