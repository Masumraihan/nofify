# Stage 1: Build
FROM node:22 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY public ./public
RUN npm install
COPY . .

# Generate Prisma client
RUN npm run build && npm run postinstall

# Stage 2: Production
FROM node:22-slim

WORKDIR /app


# ✅ Install OpenSSL 3
RUN apt-get update && \
    apt-get install -y libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy only the necessary artifacts from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Expose your app port
EXPOSE 2000

# Start the app
CMD ["node", "dist/server.js"]
