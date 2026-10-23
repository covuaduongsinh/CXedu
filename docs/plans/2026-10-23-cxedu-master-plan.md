# Kế hoạch CXedu — "Hệ điều hành giữ chân học viên" cho trung tâm cờ vua & năng khiếu

## Context

Thầy Tường muốn một sản phẩm tương tự **Seny** (senyapp.com — "Hệ điều hành giữ chân học viên cho trung tâm đào tạo"), chạy trên **web, desktop, mobile**, đồng bộ dữ liệu thời gian thực. Bản đầu dùng cho CLB Dương Sinh, sau đó bán dạng **SaaS đa trung tâm**. Repo `covuaduongsinh/CXedu` hiện trống (chỉ có LICENSE). Repo `covuaduongsinh/rea` là **REA – Reverse Engineer Anything** (MCP/CLI phân tích website, bundle JS, Electron…). Ta dùng REA để khảo sát Seny, và dùng lại bộ tooling của REA (turbo, oxlint, oxfmt, vitest, husky, TS 7) cho monorepo mới.

**Đã xác nhận với Thầy:** khảo sát Seny bằng REA ngay trên cloud (mạng đã mở, senyapp.com trả về 200) · SaaS multi-tenant · TS monorepo + Supabase · kênh nhắc: Zalo OA/ZNS, push, email, VietQR.

### Seny là gì (đọc từ bundle công khai, chưa đăng nhập)
- Làm bằng Lovable: Vite/React + TanStack Router/Start, backend Supabase, PWA.
- **Giá:** 960.000đ/tháng hoặc 8.040.000đ/năm (670k/tháng), tối đa 300 học viên, không giới hạn cơ sở, dùng thử 30 ngày. Thanh toán bằng QR chuyển khoản rồi gửi ảnh xác nhận (kích hoạt thủ công). Giới thiệu bạn bè: mỗi bên được thêm 1 tháng Pro.
- **Route:** dashboard, students, students/$id, attendance, absent, stopped, birthdays, checkin, teacher, staff, staff-attendance, team, courses, homework, invoice, center-invoice, payments, revenue, profit, expenses, supplies, report, leads, centers, data, logs, settings, plan, parent/s/$token, invite/$token, blog, admin.
- **Bảng dữ liệu (`ga_*`):** centers, rooms, center_rooms, room_slots, room_slot_teachers, enrollment_slots, courses, schedule_courses, students, student_courses, student_schedules, attendance, absences, bookings, pause_records, center_closures, invoices, payments, homework_submissions/reads, student_materials, student_reviews, user_roles, onboarding_progress. RPC: create_organization, list_my_organizations.
- **Nghiệp vụ chính:** điểm danh 1 chạm, tự trừ buổi · học bù / buổi lẻ / dạy thay · vắng có phép tối đa theo khóa · cảnh báo "2 buổi mới nhất trong 5 buổi gần nhất đều vắng" · danh sách sắp hết buổi → tái đăng ký → hóa đơn → theo dõi đã đóng · hóa đơn PDF + QR, công nợ, gộp hóa đơn nhiều anh/chị em · CRM khách tiềm năng (cấp độ test đầu vào, chuyển lead thành học viên, mẫu tin nhắn copy-paste) · học viên tạm dừng/đã nghỉ, mời quay lại · sinh nhật · bài tập + nộp bài qua Cổng phụ huynh (link token + 4 số cuối SĐT) · nhận xét GV, portfolio tác phẩm · QR check-in giáo viên (mã đổi mỗi 45 giây) + lương theo ca, theo lượt học viên, hoặc dạy tự do, ứng lương · nghỉ phép/dạy thay · chấm công nhân viên · học cụ (nhập CSV, xuất/nhập kho) · doanh thu, chi phí, lợi nhuận, báo cáo công suất phòng · phân quyền Owner/Admin/Giáo viên theo trang · nhật ký hoạt động · import Excel · thông tin xuất VAT.

### Điểm khác biệt của CXedu
1. **Chuyên cho cờ vua:** lộ trình 6 cấp Tốt → Mã → Tượng → Xe → Hậu → Vua, lịch sử lên cấp, chứng nhận, theo dõi Elo; bài tập là thế cờ FEN/PGN giải ngay trên bàn cờ; dữ liệu sẵn sàng cho giải đấu.
2. **Thanh toán tự động:** hóa đơn kèm VietQR động, webhook ngân hàng (SePay/Casso) tự gạch nợ. Gói SaaS cũng kích hoạt tự động, không cần gửi ảnh chuyển khoản.
3. **Nhắc tự động qua Zalo ZNS, push, email**, không chỉ copy-paste mẫu tin.
4. **App native thật:** mobile (GV điểm danh, phụ huynh xem tiến độ) + desktop (lễ tân, màn hình QR kiosk, in hóa đơn), cùng realtime.

> Nguyên tắc pháp lý: chỉ tham khảo **tính năng và quy trình**. Không sao chép mã nguồn, câu chữ, logo hay thương hiệu của Seny. Toàn bộ giao diện theo nhận diện Dương Sinh (#2B3990 + gold, Roboto, họa tiết ô cờ).

---

## Kiến trúc

```
CXedu/                         pnpm workspaces + Turborepo
├─ apps/web        Next.js 16 (App Router, RSC, Server Actions), Tailwind v4, shadcn/ui → Vercel
│                  gồm landing/blog (SEO) + dashboard + cổng phụ huynh /p/[token]
├─ apps/mobile     Expo (SDK mới nhất, Expo Router, New Architecture), NativeWind, expo-notifications,
│                  expo-camera (quét QR), SecureStore → EAS Build iOS/Android
├─ apps/desktop    Tauri 2: vỏ native tải web app (remote capability giới hạn domain), plugin
│                  notification/updater/deep-link/printer, chế độ kiosk màn hình QR check-in
├─ packages/core   Nghiệp vụ thuần TS + Zod: trừ buổi, cảnh báo vắng, ngày kết thúc dự kiến,
│                  tái đăng ký, lương GV, VietQR (EMVCo + CRC16), mã QR xoay 45s (HMAC), tiếng Việt
├─ packages/api    Factory Supabase client (web/RN), TanStack Query hooks dùng chung, Realtime sync
├─ packages/ui-tokens  Token thương hiệu Dương Sinh → theme Tailwind v4 (web) + NativeWind (mobile)
├─ packages/config     tsconfig, .oxlintrc, .oxfmtrc dùng chung (lấy từ REA)
├─ supabase/       config.toml, migrations/*.sql, seed.sql, tests/ (pgTAP RLS), functions/ (Deno)
├─ tools/rea/      Kịch bản REA (JSON, chỉ chứa *tham chiếu* secret, không chứa mật khẩu)
└─ docs/plans/, docs/research/
```

**Tooling lấy từ REA** (`/home/user/covuaduongsinh/rea`): `turbo` 2.11, `typescript` 7 (tsgo), `oxlint` 1.87 + `.oxlintrc.json` (giữ các rule complexity/max-lines), `oxfmt` 0.72, `vitest` 5, `husky` 9 (pre-commit chạy format + lint), `knip`, `jscpd`, quy ước Conventional Commits + release-please. Node 24 (`.nvmrc` giống REA). Mọi dependency pin bản stable mới nhất tại thời điểm scaffold.

**Đồng bộ 3 nền tảng:** cùng một Supabase (Postgres + Auth + Realtime + Storage). Lớp `packages/api` dùng TanStack Query với optimistic update, và đăng ký kênh Realtime theo `center_id` để invalidate cache. Mobile lưu cache cục bộ (persisted query + hàng đợi offline cho điểm danh). Giai đoạn sau sẽ đánh giá PowerSync nếu cần offline-first đầy đủ.

**Multi-tenant:** `organizations` (thương hiệu) → `centers` (cơ sở). Bảng nghiệp vụ nào cũng có `org_id` (và `center_id` khi cần). RLS dựa trên `memberships(user_id, org_id, role, center_ids[])`, kèm helper SQL `auth_has_role(org, role)`. Vai trò: owner, admin, teacher, parent (qua link token), super_admin (vận hành SaaS).

**Lược đồ dữ liệu (migration đầu):** organizations, centers, rooms, memberships, page_permissions, courses (giá, số buổi, giá/buổi, vắng có phép tối đa, `chess_level`), class_slots (khung giờ tuần, phòng, GV), students, guardians, student_guardians, enrollments (tổng/đã dùng/còn lại, ngày bắt đầu, ngày kết thúc dự kiến, trạng thái), student_schedules, sessions/attendance (present/excused/unexcused, makeup, single, free), pauses (bảo lưu), center_closures, invoices + invoice_items + payments, expenses, supplies + stock_movements, leads + lead_events + message_templates, homework + homework_recipients + submissions, student_reviews, student_portfolio, level_history + ratings (cờ vua), teacher_shifts + shift_checkins + pay_rates + salary_advances, staff_attendance, notifications_outbox, audit_logs (trigger), subscriptions + billing_payments (SaaS), parent_links (token + xác minh 4 số cuối SĐT).

**Edge Functions + pg_cron:** `notify-dispatch` đọc outbox rồi gửi qua Zalo ZNS / Expo Push / Resend email · `bank-webhook` (SePay/Casso) tự khớp hóa đơn qua mã nội dung CK · `checkin-verify` kiểm mã QR xoay · cron hằng ngày: sắp hết buổi, vắng liên tiếp, sinh nhật, hóa đơn quá hạn, nhắc trial.

---

## Lộ trình (mỗi giai đoạn có file riêng trong `docs/plans/`)

| GĐ | Nội dung | Kết quả |
|---|---|---|
| **0** | Khảo sát Seny bằng REA + lưu kế hoạch | `docs/plans/2026-10-23-cxedu-master-plan.md`, `docs/research/seny-feature-inventory.md` |
| **1** | Nền móng monorepo, design tokens, schema + RLS, auth | `pnpm turbo run lint typecheck test` xanh, Supabase local chạy |
| **2** | MVP web: cơ sở, khóa (6 cấp), lớp/lịch, học viên, ghi danh, điểm danh 1 chạm + trừ buổi, học bù/buổi lẻ, dashboard cảnh báo, hóa đơn PDF + VietQR, thanh toán/công nợ | Chạy thật vòng: điểm danh → sắp hết buổi → hóa đơn → đã đóng |
| **3** | Mobile (Expo): GV điểm danh, quét QR check-in, phụ huynh xem tiến độ/bài tập/hóa đơn, push | Điểm danh trên mobile hiện realtime trên web |
| **4** | Desktop (Tauri 2): lễ tân, kiosk QR 45s, in hóa đơn, thông báo khay hệ thống, tự cập nhật | Bản build Linux/Windows debug |
| **5** | Tăng trưởng: CRM lead + mẫu tin, Zalo ZNS/email tự động, sinh nhật, bài tập thế cờ, nhận xét/portfolio, báo cáo, doanh thu/chi phí/lợi nhuận, học cụ, lương GV, chấm công, nhật ký, import/export Excel | Tính năng ngang Seny + lợi thế cờ vua |
| **6** | SaaS: gói/trial 30 ngày, kích hoạt tự động qua VietQR + webhook, giới thiệu bạn bè, onboarding checklist, super-admin, landing + blog | Sẵn sàng bán cho trung tâm khác |

**Phạm vi phiên làm việc này:** GĐ 0 → 2, cộng thêm khung app mobile và desktop chạy được, cùng kết nối một backend (chứng minh đồng bộ 3 nền tảng). GĐ 3–6 làm ở các phiên sau theo file kế hoạch trong `docs/plans/`.

---

## Giai đoạn 0 — Khảo sát Seny bằng REA (chỉ đọc)

1. Chạy REA qua `npx -y rea-agents@latest` (npm registry đi được).
2. **Tĩnh:** `export-web-scripts` / `analyze-web-bundle` trên các chunk `https://senyapp.com/assets/*.js` để lấy route, endpoint, bảng, server function và luồng nghiệp vụ.
3. **Động, có đăng nhập:** `capture-browser-scenario` với Chromium `/opt/pw-browsers/chromium-1194/...`, start `https://senyapp.com/auth`. Các bước: điền email, điền mật khẩu bằng **secret reference** `env:SENY_PASSWORD` (REA tự che giá trị trong Evidence), bấm đăng nhập, `wait_for` dashboard. Sau đó **chỉ điều hướng** qua từng route trong danh sách ở trên và chụp `accessibility` + `screenshot`. **Không** bấm tạo, sửa, xóa hay gửi.
4. Mật khẩu chỉ nạp vào biến môi trường của đúng lệnh chạy. **Không** ghi vào file, commit hay plan. Khuyên Thầy đổi mật khẩu Seny sau khi khảo sát xong, vì mật khẩu đã xuất hiện trong chat.
5. Ảnh chụp và Evidence thô để trong scratchpad, **không commit** (có thể chứa dữ liệu học viên). Chỉ commit bản tổng hợp chữ `docs/research/seny-feature-inventory.md`: từng màn hình → tính năng → trường dữ liệu → quy tắc nghiệp vụ → khoảng trống CXedu làm tốt hơn.
6. Cập nhật lược đồ dữ liệu và backlog GĐ 2/5 theo kết quả khảo sát.

## Giai đoạn 1 — Nền móng

- `pnpm-workspace.yaml`, `turbo.json` (tasks: lint, format:check, typecheck, test, build, db:types), `.nvmrc`, `.npmrc`, husky, `.oxlintrc.json`/`.oxfmtrc.json` chuyển từ REA, `.gitignore` (thêm `.env*`, `supabase/.temp`).
- `packages/ui-tokens`: màu navy #2B3990, gold, nền, trạng thái (đi học / vắng có phép / vắng không phép / học bù), font Roboto, pattern ô cờ.
- `supabase/`: dùng `npx supabase init/start` (đã có Docker). Migration `0001_tenancy.sql` → `0005_billing.sql`; pgTAP test RLS (thành viên trung tâm A không đọc được dữ liệu trung tâm B); `seed.sql` tạo dữ liệu mẫu "CLB Cờ vua Dương Sinh".
- Auth: email/mật khẩu + Google + magic link; mời thành viên qua link `invite/[token]`.

## Giai đoạn 2 — MVP web (`apps/web`)

- Các trang: `/dashboard` (thẻ cảnh báo: sắp hết buổi, vắng 2 buổi liên tiếp, cần tái đăng ký, hóa đơn chưa thu; hôm nay có lớp nào), `/students` (+ chi tiết, tiến độ cấp), `/courses`, `/schedule` (lớp/phòng/GV), `/attendance` (lưới 1 chạm theo ngày/ca, học bù, buổi lẻ, vắng có phép/không phép), `/renewals`, `/invoices` (+ PDF bằng `@react-pdf/renderer`, VietQR), `/payments`, `/settings` (cơ sở, phòng, thương hiệu, tài khoản ngân hàng, phân quyền).
- Nghiệp vụ nằm trong `packages/core`, có unit test, gồm: quy tắc trừ buổi theo trạng thái và hạn mức vắng có phép · thuật toán vắng liên tiếp · ngày kết thúc dự kiến (lịch tuần trừ ngày nghỉ trung tâm và bảo lưu) · ngưỡng "sắp hết buổi" cấu hình được · chuỗi VietQR EMVCo (test CRC16 với mẫu chuẩn NAPAS).
- Ghi dữ liệu qua Server Actions / RPC Postgres có kiểm tra quyền. Điểm danh dùng RPC `mark_attendance` chạy trong transaction để cập nhật số buổi nguyên tử.

## Khung mobile + desktop (cuối phiên này)

- `apps/mobile`: đăng nhập, chọn cơ sở, màn hình điểm danh hôm nay dùng chung hooks `packages/api`, nhận Realtime. Kiểm bằng `expo export --platform web` + typecheck.
- `apps/desktop`: Tauri 2 tải URL web, capability chỉ cho domain CXedu, màn hình kiosk QR (mã từ `packages/core`). Kiểm bằng `cargo check` + `tauri build --debug` (nếu thiếu thư viện webkit2gtk thì dừng ở `cargo check` và ghi rõ).

---

## Tài nguyên bên ngoài (hỏi trước khi tạo)

- **Supabase cloud / Vercel:** Thầy đã kết nối MCP Supabase và Vercel. Phiên này dev trên Supabase local. Chỉ tạo project cloud `cxedu` và deploy Vercel khi Thầy đồng ý, vì đó là thao tác tạo tài nguyên có thể phát sinh phí.
- Zalo OA/ZNS, SePay/Casso, Resend, Expo/EAS, Apple/Google developer: cần tài khoản của Dương Sinh. Code chạy được với adapter "dry-run" cho đến khi có key; key để trong Supabase secrets, không đưa vào repo.

## Verification

1. `pnpm install && pnpm turbo run format:check lint typecheck test build`: tất cả xanh.
2. `npx supabase start && npx supabase db reset && npx supabase test db`: migration chạy sạch, pgTAP RLS pass; `supabase gen types` khớp với `packages/db`.
3. Unit test `packages/core` (vitest) cho các quy tắc nghiệp vụ ở GĐ 2.
4. Playwright e2e (Chromium `/opt/pw-browsers`) trên `apps/web`: đăng nhập seed → tạo học viên + ghi danh khóa "Cấp Tốt" 8 buổi → điểm danh 6 buổi → dashboard báo "sắp hết buổi" → tạo hóa đơn có VietQR → đánh dấu đã thu → học viên rời khỏi danh sách tái đăng ký.
5. Test đồng bộ: 2 context trình duyệt (web + bản Expo web). Điểm danh ở một bên, bên kia cập nhật qua Realtime trong vòng ~2 giây.
6. Desktop: `cargo check` / `tauri build --debug`; mobile: `expo export` + typecheck.
7. Commit theo Conventional Commits trên nhánh `claude/tender-noether-45w4wx`, `git push -u origin claude/tender-noether-45w4wx`. Không tạo PR trừ khi Thầy yêu cầu.
