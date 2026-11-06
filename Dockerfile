ARG NODE_IMAGE=node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85

FROM ${NODE_IMAGE} AS workspace
ENV PNPM_HOME=/pnpm \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

FROM workspace AS client-build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@graveshift/client..."
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/client packages/client
RUN pnpm --filter @graveshift/client build

FROM workspace AS server-bundle
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter "@graveshift/server..."
COPY packages/shared/src packages/shared/src
COPY packages/server/src packages/server/src
COPY --from=client-build /app/packages/client/dist packages/client/dist
RUN rm pnpm-lock.yaml pnpm-workspace.yaml packages/client/package.json

FROM ${NODE_IMAGE} AS runtime
RUN apk upgrade --no-cache \
    && apk add --no-cache tini \
    && rm -rf /usr/local/lib/node_modules /opt/yarn-* \
        /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
        /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
COPY --from=server-bundle /app /app
RUN mkdir -p /app/data && chown node:node /app/data
ARG VERSION=dev
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8686 \
    GRAVESHIFT_CLIENT_DIST=/app/packages/client/dist \
    GRAVESHIFT_VERSION=${VERSION}
USER node
EXPOSE 8686
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:8686/api/health').then((r) => process.exit(r.status === 200 ? 0 : 1), () => process.exit(1))"]
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/server/src/main.ts"]
