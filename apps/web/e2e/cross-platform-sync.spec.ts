import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { todayIn, weekdayOf } from "@cxedu/core";

/**
 * Đồng bộ đa nền tảng: giáo viên điểm danh trên app mobile (bản Expo web),
 * màn hình điểm danh trên web Next.js cập nhật qua Supabase Realtime, không cần tải lại.
 * Cần: E2E_MOBILE_URL (bản `expo export --platform web` đang chạy) và E2E_SUPABASE_SERVICE_ROLE_KEY.
 */

const MOBILE_URL = process.env.E2E_MOBILE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ORG = "a0000000-0000-4000-8000-000000000001";
const CENTER = "c0000000-0000-4000-8000-000000000001";
const STUDENT_NAME = "Trần Gia Bảo";

test.skip(
  !MOBILE_URL || !SERVICE_KEY,
  "Cần E2E_MOBILE_URL và E2E_SUPABASE_SERVICE_ROLE_KEY",
);

test("điểm danh trên mobile hiện ngay trên web", async ({ browser }) => {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY ?? "", {
    auth: { persistSession: false },
  });
  const today = todayIn();
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, student_id, students!inner(full_name)")
    .eq("students.full_name", STUDENT_NAME)
    .single();
  expect(enrollment).not.toBeNull();
  // Lớp chạy đúng thứ hôm nay để cả hai màn hình cùng hiển thị.
  const { data: slot } = await admin
    .from("class_slots")
    .insert({
      org_id: ORG,
      center_id: CENTER,
      name: "Lớp đồng bộ E2E",
      weekday: weekdayOf(today),
      start_time: "06:00",
      end_time: "07:00",
    })
    .select("id")
    .single();
  await admin.from("enrollment_schedules").insert({
    enrollment_id: enrollment?.id,
    class_slot_id: slot?.id,
    org_id: ORG,
  });
  await admin
    .from("attendance")
    .delete()
    .eq("enrollment_id", enrollment?.id ?? "")
    .eq("session_date", today);

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

    // Web nhận thay đổi qua Realtime (không reload).
    await expect(webCard).toHaveAttribute("aria-pressed", "true", {
      timeout: 10_000,
    });
    await expect(webCard).toContainText("Có mặt");
  } finally {
    await admin
      .from("attendance")
      .delete()
      .eq("enrollment_id", enrollment?.id ?? "")
      .eq("session_date", today);
    await admin
      .from("class_slots")
      .delete()
      .eq("id", slot?.id ?? "");
  }
});
