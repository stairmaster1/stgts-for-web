FROM node:22-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

# populate assets from the bundled fallback when the submodule is missing
RUN if [ ! -d packages/client/assets ] || [ -z "$(ls -A packages/client/assets 2>/dev/null)" ]; then \
      rm -rf packages/client/assets && \
      cp -r packages/client/scripts/assets_fallback packages/client/assets; \
    fi

RUN corepack enable \
 && pnpm install --frozen-lockfile

RUN pnpm --filter '!client' -r --if-present build

RUN pnpm --filter client run build:prod

FROM caddy:2.9-alpine
WORKDIR /srv
COPY --from=build /app/packages/client/dist ./dist
EXPOSE 5000
CMD ["caddy", "file-server", "--root", "/srv/dist", "--listen", ":5000"]