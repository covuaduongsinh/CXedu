# Web Next.js 16 (output standalone).
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable
ARG NEXT_PUBLIC_CX_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CX_API_URL=$NEXT_PUBLIC_CX_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts \
      --filter @cxedu/web... \
 && pnpm --filter @cxedu/web build

FROM node:24-slim
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
