import { PgBoss } from "pg-boss";

import { pool } from "./db";
import { env } from "./env";

const DAILY_NOTIFICATIONS = "daily-notifications";

/** Hàng đợi việc nền trên chính Postgres: nhắc hằng ngày 07:00 giờ Việt Nam. */
export const startJobs = async () => {
  const boss = new PgBoss(env.databaseUrl);
  boss.on("error", (error) => console.error("[jobs]", error));
  await boss.start();
  await boss.createQueue(DAILY_NOTIFICATIONS);
  await boss.schedule(DAILY_NOTIFICATIONS, "0 7 * * *", null, {
    tz: "Asia/Ho_Chi_Minh",
  });
  await boss.work(DAILY_NOTIFICATIONS, async () => {
    const { rows } = await pool.query<{ count: number }>(
      "select public.enqueue_daily_notifications() as count",
    );
    console.log(
      `[jobs] ${DAILY_NOTIFICATIONS}: ${rows[0]?.count ?? 0} thông báo vào hàng đợi`,
    );
  });
  return boss;
};
