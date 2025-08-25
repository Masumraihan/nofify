FROM node:current-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./
COPY .env ./

# Use npm ci for clean, repeatable builds
RUN npm install
COPY . .

# Generate Prisma client and build project
RUN npx prisma generate
RUN npx prisma db push
RUN npm run build

# Stage 2: Production
FROM node:current-slim

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
COPY --from=builder /app/src ./src
COPY --from=builder /app/.env .


EXPOSE 2000

CMD ["node", "dist/server.js"]