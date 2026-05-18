# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/pwa/package.json ./apps/pwa/
COPY packages/portal-pj/package.json ./packages/portal-pj/
RUN npm ci --workspace=@klipyt/portal-pj --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/portal-pj ./packages/portal-pj
COPY apps/api/package.json ./apps/api/
COPY apps/pwa/package.json ./apps/pwa/
RUN npm run build --workspace=@klipyt/portal-pj

FROM nginx:alpine AS runner
COPY packages/portal-pj/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/portal-pj/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
