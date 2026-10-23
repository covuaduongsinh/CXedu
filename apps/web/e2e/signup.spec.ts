import { expect, test } from "@playwright/test";

/** Chủ trung tâm mới: đăng ký → tạo trung tâm → vào tổng quan; đăng xuất → đăng nhập lại. */
test("đăng ký tài khoản mới và tạo trung tâm", async ({ page }) => {
  const email = `chu.tt.${Date.now()}@cxedu.local`;
  const password = "MatKhau@2026";

  await page.goto("/login?mode=signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: /Tạo tài khoản/u }).click();
  await expect(page).toHaveURL(/\/onboarding/u);

  await page.getByLabel("Tên trung tâm / CLB").fill("CLB Cờ vua Hà Đông");
  await page.getByLabel("Tên cơ sở đầu tiên").fill("Cơ sở Văn Quán");
  await page.getByRole("button", { name: /Bắt đầu dùng thử/u }).click();
  await expect(page).toHaveURL(/\/dashboard/u);
  await expect(
    page.getByText("Việc cần làm hôm nay tại CLB Cờ vua Hà Đông"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login/u);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/u);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByText("Việc cần làm hôm nay tại CLB Cờ vua Hà Đông"),
  ).toBeVisible();
});

test("email đã tồn tại thì báo lỗi rõ ràng", async ({ page }) => {
  await page.goto("/login?mode=signup");
  await page.getByLabel("Email").fill("thay.tuong@cxedu.local");
  await page.getByLabel("Mật khẩu").fill("MatKhau@2026");
  await page.getByRole("button", { name: /Tạo tài khoản/u }).click();
  await expect(page.getByText("Email đã được đăng ký")).toBeVisible();
});
