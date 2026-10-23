import pg from "pg";

import { env } from "./env";

/** Pool dùng chung (owner): truy vấn hệ thống, realtime, hàng đợi. */
export const pool = new pg.Pool({ connectionString: env.databaseUrl, max: 10 });

/** Pool cho Better Auth: bảng nằm trong schema `auth`. */
export const authPool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 5,
  options: "-c search_path=auth",
});
