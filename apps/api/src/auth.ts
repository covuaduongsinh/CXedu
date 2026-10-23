import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";

import { authPool } from "./db";
import { env } from "./env";

/**
 * Đăng nhập tự host bằng Better Auth. Bảng `auth.users|sessions|accounts|verifications`
 * dùng id UUID để khóa ngoại từ các bảng nghiệp vụ (memberships, students…) giữ nguyên.
 * Plugin bearer cho phép web server và app mobile gửi phiên qua header Authorization.
 */
export const auth = betterAuth({
  appName: "CXedu",
  database: authPool,
  basePath: "/auth",
  baseURL: env.publicUrl,
  secret: env.authSecret,
  trustedOrigins: env.trustedOrigins,
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: { modelName: "users" },
  account: { modelName: "accounts" },
  verification: { modelName: "verifications" },
  advanced: {
    database: { generateId: () => crypto.randomUUID() },
    useSecureCookies: env.isProduction,
  },
  plugins: [bearer()],
});

export type AuthSession = typeof auth.$Infer.Session;
