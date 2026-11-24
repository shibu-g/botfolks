FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile=false --filter @botfolks/dashboard...
ARG VITE_API_URL=https://api.botfolks.in
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @botfolks/dashboard exec vite build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/dashboard/dist /usr/share/nginx/html
RUN printf 'server { listen 80; root /usr/share/nginx/html; location / { try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf
