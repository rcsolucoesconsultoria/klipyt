# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/pwa/package.json ./apps/pwa/
COPY packages/portal-pj/package.json ./packages/portal-pj/
RUN npm ci --workspace=@klipyt/api --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/api ./apps/api
COPY apps/pwa/package.json ./apps/pwa/
COPY packages/portal-pj/package.json ./packages/portal-pj/
RUN npm run build --workspace=@klipyt/api

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/pwa/package.json ./apps/pwa/
COPY packages/portal-pj/package.json ./packages/portal-pj/
RUN npm ci --workspace=@klipyt/api --include-workspace-root --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
