const read = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "")
    throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
};

const list = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Cấu hình CX Platform API; mặc định cho môi trường phát triển local. */
export const env = {
  port: Number(read("PORT", "8787")),
  /** Kết nối với quyền chủ sở hữu schema (đăng nhập, hàng đợi, realtime). */
  databaseUrl: read(
    "DATABASE_URL",
    "postgres://postgres:postgres@127.0.0.1:5432/cxedu",
  ),
  /** URL nội bộ của PostgREST. */
  postgrestUrl: read("POSTGREST_URL", "http://127.0.0.1:3001"),
  /** URL công khai của API (dùng cho cookie và link trong email). */
  publicUrl: read("API_PUBLIC_URL", "http://localhost:8787"),
  authSecret: read("AUTH_SECRET", "dev-only-auth-secret-change-me-32chars!!"),
  /** Khóa HS256 chung với PostgREST (PGRST_JWT_SECRET), tối thiểu 32 ký tự. */
  jwtSecret: read("JWT_SECRET", "dev-only-jwt-secret-change-me-32-characters"),
  jwtTtlSeconds: Number(read("JWT_TTL_SECONDS", "900")),
  trustedOrigins: list(
    read(
      "TRUSTED_ORIGINS",
      "http://localhost:3000,http://localhost:8081,cxedu://",
    ),
  ),
  runJobs: read("RUN_JOBS", "true") === "true",
  isProduction: process.env.NODE_ENV === "production",
};
