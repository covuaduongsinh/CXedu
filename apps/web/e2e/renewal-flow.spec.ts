import { expect, test, type Page } from "@playwright/test";

/**
 * Luồng giữ chân học viên trên dữ liệu seed (`supabase db reset`):
 * ghi danh → điểm danh → sắp hết buổi → hóa đơn VietQR → đã thu → rời danh sách tái đăng ký.
 */

const OWNER = { email: "thay.tuong@cxedu.local", password: "CXedu@2026" };
const STUDENT = `Học viên E2E ${Date.now().toString().slice(-6)}`;

const login = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(OWNER.email);
  await page.getByLabel("Mật khẩu").fill(OWNER.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/u);
};

test("chặn trang nội bộ khi chưa đăng nhập", async ({ page }) => {
  await page.goto("/students");
  await expect(page).toHaveURL(/\/login\?next=%2Fstudents/u);
});

test("tổng quan hiển thị cảnh báo từ dữ liệu seed", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("low-remaining")).toContainText("Lê Khánh Chi");
  await expect(page.getByTestId("consecutive-absences")).toContainText(
    "Phạm Đức Duy",
  );
});

test("vòng tái đăng ký: điểm danh → sắp hết buổi → hóa đơn → đã thu", async ({
  page,
}) => {
  await login(page);

  // 1. Thêm học viên + ghi danh khóa Cấp Tốt 6 buổi vào lớp tối thứ Ba.
  await page.goto("/students");
  await page.getByLabel("Họ tên học viên").fill(STUDENT);
  await page.getByLabel("SĐT phụ huynh").fill("0987654321");
  await page.getByRole("button", { name: "Thêm học viên" }).click();
  await expect(page.getByRole("heading", { name: STUDENT })).toBeVisible();
  const studentUrl = page.url();
  const studentId = studentUrl.split("/").at(-1) ?? "";

  await page.getByLabel("Số buổi").fill("6");
  await page.getByRole("button", { name: "Ghi danh" }).click();
  await expect(page.getByText(/Đã ghi danh/u)).toBeVisible();
  await expect(page.getByTestId("enrollments")).toContainText("Còn 6/6 buổi");

  // 2. Điểm danh 3 buổi thứ Ba liên tiếp (lớp Cấp Tốt học T3).
  const tuesdays = ["2026-09-01", "2026-09-08", "2026-09-15"];
  for (const date of tuesdays) {
    await page.goto(`/attendance?date=${date}`);
    const card = page.getByTestId(`attend-${studentId}`);
    await expect(card).toBeVisible();
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect(card).toContainText(/Có mặt/u);
  }

  // 3. Còn 3 buổi ≤ ngưỡng 4 → vào danh sách tái đăng ký.
  await page.goto(studentUrl);
  await expect(page.getByTestId("enrollments")).toContainText("Còn 3/6 buổi");
  await page.goto("/renewals");
  const row = page.getByTestId("renewals").locator("li", { hasText: STUDENT });
  await expect(row).toContainText("Còn 3 buổi");
  await expect(row).toContainText("Cần liên hệ");

  // 4. Tạo hóa đơn gia hạn có VietQR.
  await row.getByRole("link", { name: "Tạo hóa đơn" }).click();
  await expect(page.getByLabel("Nội dung").first()).toHaveValue(
    /Gia hạn Cấp Tốt/u,
  );
  await page.getByRole("button", { name: "Tạo hóa đơn" }).click();
  await expect(page.getByTestId("invoice")).toContainText("HÓA ĐƠN HỌC PHÍ");
  await expect(
    page.getByRole("img", { name: "Mã VietQR thanh toán" }),
  ).toBeVisible();
  await expect(page.getByTestId("transfer-ref")).toHaveText(
    /^CX[0-9A-F]{6}DS\d{6}$/u,
  );

  // 5. Ghi nhận đã thu đủ.
  await page.getByRole("button", { name: "Ghi nhận" }).click();
  await expect(page.getByTestId("invoice-balance")).toHaveText("0đ");
  await expect(page.getByTestId("invoice")).toContainText("Đã thanh toán");

  // 6. Tái đăng ký hiển thị "Đã đóng".
  await page.goto("/renewals");
  await expect(
    page.getByTestId("renewals").locator("li", { hasText: STUDENT }),
  ).toContainText("Đã đóng");
});

test("cổng phụ huynh yêu cầu đúng 4 số cuối điện thoại", async ({ page }) => {
  await login(page);
  await page.goto("/students?q=Lê Khánh Chi");
  await page.getByRole("link", { name: "Lê Khánh Chi" }).click();
  const portalUrl = await page.getByLabel("Link Cổng phụ huynh").inputValue();
  const phone = await page.getByLabel("SĐT phụ huynh").inputValue();
  await page.context().clearCookies();

  await page.goto(new URL(portalUrl).pathname);
  await page.getByLabel("4 số cuối điện thoại phụ huynh").fill("0000");
  await page.getByRole("button", { name: "Xem thông tin học viên" }).click();
  await expect(page.getByText("Thông tin xác minh chưa đúng")).toBeVisible();

  await page.getByLabel("4 số cuối điện thoại phụ huynh").fill(phone.slice(-4));
  await page.getByRole("button", { name: "Xem thông tin học viên" }).click();
  await expect(
    page.getByRole("heading", { name: "Lê Khánh Chi" }),
  ).toBeVisible();
  await expect(page.getByText("Tiến độ khóa học")).toBeVisible();
});
