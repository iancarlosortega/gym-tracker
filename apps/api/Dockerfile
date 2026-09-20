# syntax=docker/dockerfile:1

# The whole workspace is the build context: the API imports @gym/domain by
# source, so an image built from apps/api alone could not compile.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
COPY packages/contracts/package.json packages/contracts/
# Cached on the lockfile alone, so a source change does not reinstall.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM dependencies AS build
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm --filter "./packages/**" build && pnpm --filter @gym/api build

FROM base AS runtime
ENV NODE_ENV=production
# Never root: a compromised process should not own the filesystem it runs on.
USER node
WORKDIR /app

COPY --from=build --chown=node:node /repo/package.json /repo/pnpm-lock.yaml /repo/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /repo/apps/api/package.json apps/api/
COPY --from=build --chown=node:node /repo/packages/domain/package.json packages/domain/
COPY --from=build --chown=node:node /repo/packages/contracts/package.json packages/contracts/
RUN --mount=type=cache,id=pnpm,target=/home/node/.local/share/pnpm/store,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile --prod

COPY --from=build --chown=node:node /repo/packages/domain/dist packages/domain/dist
COPY --from=build --chown=node:node /repo/packages/contracts/dist packages/contracts/dist
COPY --from=build --chown=node:node /repo/apps/api/dist apps/api/dist
# The migrations ship with the build that expects them.
COPY --from=build --chown=node:node /repo/apps/api/drizzle apps/api/drizzle

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
