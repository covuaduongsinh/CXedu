# CXedu — Trạng thái sau phiên 1 và kế hoạch giai đoạn 3–6

> Cập nhật 2026-10-23. Kế hoạch tổng: `2026-10-23-cxedu-master-plan.md`. Khảo sát Seny: `../research/seny-feature-inventory.md`.

## 1. Đã xong (GĐ 0–2 + khung 3 nền tảng)

| Hạng mục | Kết quả | Kiểm chứng |
|---|---|---|
| Khảo sát Seny bằng REA | Danh mục 30+ màn hình, 47 bảng, quy tắc nghiệp vụ | REA `analyze-javascript-application` (125 file, 0 lỗi parse); đăng nhập dashboard **chưa thành công** (sai mật khẩu) |
| Monorepo | pnpm + Turborepo, TS 7, oxlint/oxfmt, Vitest 5, Husky | `pnpm check` xanh |
| Nghiệp vụ `packages/core` | Trừ buổi + hạn mức vắng có phép, sắp hết buổi, vắng liên tiếp, lịch dự kiến, VietQR EMVCo/CRC16, mã QR xoay 45s (khớp SQL), lương GV, schema Zod | 27 unit test |
| Database | 5 migration, RLS đa trung tâm theo vai trò, RPC `mark_attendance`/`create_invoice`/`teacher_checkin`/`get_parent_portal`/`record_bank_transfer`, view cảnh báo, pg_cron nhắc 7:00, audit log, Realtime | 23 pgTAP test |
| Web | Tổng quan, Điểm danh, Học viên, Hồ sơ HV, Tái đăng ký, Hóa đơn VietQR (in/PDF), Khóa học, Lớp & lịch, Kiosk QR, Cài đặt, Cổng phụ huynh, Landing | 5 Playwright E2E |
| Mobile | Đăng nhập, điểm danh hôm nay (hook dùng chung + Realtime), quét QR check-in | typecheck + `expo export --platform web` + E2E đồng bộ mobile→web |
| Desktop | Tauri 2: cửa sổ chính, lệnh `open_kiosk` toàn màn hình, plugin notification/opener, icon thương hiệu | `cargo check` + `tauri build --debug`, chạy thử trên Xvfb |

## 2. Việc cần Thầy quyết / cung cấp

1. **Tạo Supabase cloud project + Vercel project** (có thể phát sinh phí). Khi Thầy đồng ý, tôi đẩy migration và cấu hình domain, ví dụ `app.cxedu.vn`.
2. **Tài khoản Seny:** mật khẩu đã cung cấp bị từ chối. Nếu tài khoản đăng nhập bằng Google, chạy REA trên máy Thầy theo `tools/rea/README.md`. Nên đổi mật khẩu Seny vì nó đã xuất hiện trong chat.
3. **Khóa tích hợp:** Zalo OA + mẫu ZNS, SePay/Casso (webhook ngân hàng), Resend (email), tài khoản Expo/EAS, Apple Developer, Google Play.
4. Tên thương mại và domain chính thức (tạm dùng "CXedu").

## 3. GĐ 3 — Mobile hoàn chỉnh

- Chọn cơ sở và đổi ngày; học bù, buổi lẻ; ghi chú buổi học.
- Hàng đợi điểm danh offline (persisted mutations); đánh giá PowerSync nếu trung tâm hay mất mạng.
- Push notification (`expo-notifications` + bảng `push_tokens`): nhắc GV trước ca, nhắc admin hóa đơn.
- Vai trò phụ huynh trong app: tiến độ, bài tập, hóa đơn (dùng lại `get_parent_portal`).
- EAS Build/Submit + EAS Update (OTA).

## 4. GĐ 4 — Desktop hoàn chỉnh

- Tự cập nhật (`tauri-plugin-updater` + khóa ký), bộ cài Windows (MSI/NSIS) và macOS (DMG, notarize).
- In hóa đơn trực tiếp, thông báo khay hệ thống khi có thanh toán mới (Realtime).
- Trang offline/kiểm tra kết nối; deep link `cxedu://`.

## 5. GĐ 5 — Tăng trưởng (ngang Seny + lợi thế cờ vua)

- **Edge Functions:** `notify-dispatch` (outbox → Zalo ZNS / Expo Push / Resend, chạy dry-run khi chưa có key); `bank-webhook` (SePay/Casso → `record_bank_transfer`, xác thực chữ ký).
- CRM khách tiềm năng + mẫu tin (bảng `leads`, `message_templates` đã có); chuyển lead thành học viên.
- Học viên tạm dừng/đã nghỉ, mời quay lại; bảo lưu (`pauses`), ngày nghỉ trung tâm (UI).
- Bài tập thế cờ FEN/PGN (bàn cờ chessground), nộp bài ở cổng phụ huynh; chứng nhận lên cấp (PDF).
- Lương GV theo ca (`teacher_pay_rates`, `teacher_checkins`), nghỉ phép/dạy thay, chấm công nhân viên.
- Doanh thu, chi phí, lợi nhuận, báo cáo công suất phòng; học cụ và kho; import/export Excel; nhật ký hoạt động (UI).
- Mời thành viên (`invitations`), phân quyền theo trang.

## 6. GĐ 6 — SaaS

- Gói thuê bao theo bậc học viên. Kích hoạt tự động qua VietQR + webhook, không cần gửi ảnh chuyển khoản.
- Giới thiệu bạn bè, onboarding checklist, email nhắc trial.
- Super-admin vận hành, blog SEO, landing đa ngôn ngữ.
- Giám sát: Sentry, Vercel Analytics, Supabase advisors.
