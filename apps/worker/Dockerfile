FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile=false --filter @botfolks/worker...
WORKDIR /app/apps/worker
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
