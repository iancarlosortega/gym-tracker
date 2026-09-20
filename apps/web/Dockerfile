# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
COPY packages/contracts/package.json packages/contracts/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM dependencies AS build
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY apps/web/ apps/web/
# The domain is compiled first: the web app imports it through its exports map,
# which resolves to dist.
RUN pnpm --filter "./packages/**" build && pnpm --filter @gym/web build

FROM base AS runtime
ENV NODE_ENV=production
USER node
WORKDIR /app

# Next traced exactly what the server needs, dependencies included, so no
# install runs here at all.
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
