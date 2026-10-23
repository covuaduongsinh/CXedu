# CX API (Hono + Better Auth + realtime) và công cụ migrate database.
FROM node:24-slim AS deps
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts \
      --filter @cxedu/api-server... --filter @cxedu/database

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/packages/config packages/config
COPY --from=deps /app/packages/core packages/core
COPY --from=deps /app/apps/api apps/api
COPY --from=deps /app/database database
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
