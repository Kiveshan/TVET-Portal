# One image for the whole portal: Express serves the API and the built React app.
# Build from the repository root:  docker build -t tvet-portal .

FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-slim
# The Prisma CLI (used for migrations) needs OpenSSL.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
# Dev dependencies stay in: the server runs through tsx, and migrations need the Prisma CLI.
RUN npm ci
COPY backend/ ./
# prisma.config.ts requires a DATABASE_URL, but generating the client never connects.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate
COPY --from=frontend /app/frontend/dist ./public

ENV NODE_ENV=production \
    PORT=4000 \
    STATIC_DIR=/app/public \
    TRUST_PROXY=1
EXPOSE 4000
USER node
# Run migrations as a one-off task with the command: npx prisma migrate deploy
CMD ["node_modules/.bin/tsx", "src/server.ts"]
