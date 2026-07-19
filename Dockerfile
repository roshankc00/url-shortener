# base
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init && corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
ENV NODE_ENV=production

# deps
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# build-deps
FROM base AS build-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# build
FROM build-deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN pnpm run build

# runner
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 -G nodejs
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package.json ./
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health',r=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]