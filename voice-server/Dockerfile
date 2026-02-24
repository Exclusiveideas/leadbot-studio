FROM node:22-slim

WORKDIR /app

# Copy prisma schema first for generation
COPY ../prisma ./prisma/

# Copy voice server files
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY dist/ ./dist/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
