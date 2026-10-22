ARG NODE_IMAGE=node:24.22.0-bookworm-slim@sha256:91acba91b842bec0bf7ea6f5e09c644c7ccad72c4996ed9616d861d1c7cd60d4

FROM ${NODE_IMAGE} AS build
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci --include=dev --no-audit --no-fund

COPY --chown=node:node . .
RUN chown node:node /app /app/node_modules
USER node
RUN npm run check

FROM ${NODE_IMAGE} AS production-dependencies
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app

ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001

COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node package.json tsconfig.json ./
COPY --chown=node:node packages/shared ./packages/shared
COPY --chown=node:node apps/api ./apps/api
COPY --chown=node:node --from=build /app/dist/web ./dist/web

USER node
EXPOSE 3001
CMD ["node", "--import", "tsx", "apps/api/src/main.ts"]
