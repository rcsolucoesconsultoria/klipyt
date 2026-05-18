# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/pwa/package.json ./apps/pwa/
COPY packages/portal-pj/package.json ./packages/portal-pj/
RUN npm ci --workspace=@klipyt/pwa --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/pwa ./apps/pwa
COPY apps/api/package.json ./apps/api/
COPY packages/portal-pj/package.json ./packages/portal-pj/
RUN npm run build --workspace=@klipyt/pwa

FROM nginx:alpine AS runner
COPY apps/pwa/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/pwa/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
