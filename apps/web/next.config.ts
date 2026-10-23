import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: [
    "@cxedu/api",
    "@cxedu/core",
    "@cxedu/db",
    "@cxedu/ui-tokens",
  ],
  // Kiểm tra kiểu chạy riêng bằng TypeScript 7 (`pnpm typecheck`) cho toàn monorepo.
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  // Bản build tự chứa cho Docker (infra/web.Dockerfile).
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
};

export default config;
