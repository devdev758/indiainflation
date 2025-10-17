# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY web/package.json web/package-lock.json* ./
RUN npm install --legacy-peer-deps

FROM base AS builder
ENV NODE_ENV=production
ARG WP_API_BASE
ARG WP_ADMIN_USER
ARG WP_APP_PASSWORD
ARG WEBHOOK_SECRET
ENV WP_API_BASE=$WP_API_BASE
ENV WP_ADMIN_USER=$WP_ADMIN_USER
ENV WP_APP_PASSWORD=$WP_APP_PASSWORD
ENV WEBHOOK_SECRET=$WEBHOOK_SECRET
COPY --from=deps /app/node_modules ./node_modules
COPY web/. .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssh-client
ARG WP_API_BASE
ARG WP_ADMIN_USER
ARG WP_APP_PASSWORD
ARG WEBHOOK_SECRET
ENV WP_API_BASE=$WP_API_BASE
ENV WP_ADMIN_USER=$WP_ADMIN_USER
ENV WP_APP_PASSWORD=$WP_APP_PASSWORD
ENV WEBHOOK_SECRET=$WEBHOOK_SECRET
COPY web/package.json web/package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
