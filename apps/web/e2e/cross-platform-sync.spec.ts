import pg from "pg";
import { expect, test } from "@playwright/test";
import { todayIn, weekdayOf } from "@cxedu/core";

/**
 * Đồng bộ đa nền tảng: giáo viên điểm danh trên app mobile (bản Expo web),
 * màn hình điểm danh trên web Next.js cập nhật qua realtime của CX API, không cần tải lại.
 * Cần: E2E_MOBILE_URL (bản `expo export --platform web` đang chạy) và E2E_DATABASE_URL.
 */

const MOBILE_URL = process.env.E2E_MOBILE_URL;
const DATABASE_URL = process.env.E2E_DATABASE_URL;
const ORG = "a0000000-0000-4000-8000-000000000001";
const CENTER = "c0000000-0000-4000-8000-000000000001";
const STUDENT_NAME = "Trần Gia Bảo";

test.skip(
  !MOBILE_URL || !DATABASE_URL,
  "Cần E2E_MOBILE_URL và E2E_DATABASE_URL",
);

test("điểm danh trên mobile hiện ngay trên web", async ({ browser }) => {
  const db = new pg.Client({ connectionString: DATABASE_URL });
  await db.connect();
  const today = todayIn();
  const {
    rows: [enrollment],
  } = await db.query<{ id: string; student_id: string }>(
    "select e.id, e.student_id from enrollments e join students s on s.id = e.student_id where s.full_name = $1 limit 1",
    [STUDENT_NAME],
  );
  expect(enrollment).toBeDefined();
  // Lớp chạy đúng thứ hôm nay để cả hai màn hình cùng hiển thị.
  const {
    rows: [slot],
  } = await db.query<{ id: string }>(
    "insert into class_slots (org_id, center_id, name, weekday, start_time, end_time) values ($1, $2, 'Lớp đồng bộ E2E', $3, '06:00', '07:00') returning id",
    [ORG, CENTER, weekdayOf(today)],
  );
  await db.query(
    "insert into enrollment_schedules (enrollment_id, class_slot_id, org_id) values ($1, $2, $3)",
    [enrollment?.id, slot?.id, ORG],
  );
  await db.query(
    "delete from attendance where enrollment_id = $1 and session_date = $2",
    [enrollment?.id, today],
  );

  try {
    const webContext = await browser.newContext();
    const web = await webContext.newPage();
    await web.goto("/login");
    await web.getByLabel("Email").fill("thay.tuong@cxedu.local");
    await web.getByLabel("Mật khẩu").fill("CXedu@2026");
    await web.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await web.waitForURL(/\/dashboard/u);
    await web.goto("/attendance");
    const webCard = web.getByTestId(`attend-${enrollment?.student_id}`);
    await expect(webCard).toHaveAttribute("aria-pressed", "false");

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await mobileContext.newPage();
    await mobile.goto(`${MOBILE_URL}/login`);
    await mobile.getByLabel("Email").fill("gv.lan@cxedu.local");
    await mobile.getByLabel("Mật khẩu").fill("CXedu@2026");
    await mobile.getByRole("button", { name: "Đăng nhập" }).click();
    const mobileTile = mobile.getByRole("button", {
      name: new RegExp(`^${STUDENT_NAME}, chưa điểm danh`, "u"),
    });
    await expect(mobileTile).toBeVisible({ timeout: 15_000 });
    await mobileTile.click();
    await expect(
      mobile.getByRole("button", {
        name: new RegExp(`^${STUDENT_NAME}, Có mặt`, "u"),
      }),
    ).toBeVisible();

    // Web nhận thay đổi qua realtime (không reload).
    await expect(webCard).toHaveAttribute("aria-pressed", "true", {
      timeout: 10_000,
    });
    await expect(webCard).toContainText("Có mặt");
  } finally {
    await db.query(
      "delete from attendance where enrollment_id = $1 and session_date = $2",
      [enrollment?.id, today],
    );
    await db.query("delete from class_slots where id = $1", [slot?.id]);
    await db.end();
  }
});
