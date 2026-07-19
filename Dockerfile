FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]