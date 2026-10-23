# CXedu — Hệ điều hành giữ chân học viên cho trung tâm cờ vua

CXedu giúp CLB và trung tâm cờ vua làm mấy việc chính: điểm danh 1 chạm, tự trừ buổi, báo học viên sắp hết buổi, gửi hóa đơn VietQR và theo dõi lộ trình 6 cấp **Tốt → Mã → Tượng → Xe → Hậu → Vua**.
Hệ thống chạy đồng bộ trên **web, desktop và mobile**. Sản phẩm của Công ty CP Cờ vua Dương Sinh · _Vui trí tuệ_.

| Web (Next.js 16)                                 | Mobile (Expo SDK 58)                                        | Hóa đơn VietQR                                      |
| ------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| ![Tổng quan](docs/screenshots/web-dashboard.png) | ![Điểm danh mobile](docs/screenshots/mobile-attendance.png) | ![Hóa đơn](docs/screenshots/web-invoice-vietqr.png) |

## Kiến trúc — CX Platform (tự host, không phụ thuộc Supabase)

```
apps/web        Next.js 16 (App Router, Server Actions, Turbopack) + Tailwind v4 — web & cổng phụ huynh
apps/mobile     Expo SDK 58 + Expo Router (React Native 0.88) — giáo viên điểm danh, quét QR check-in
apps/desktop    Tauri 2 (Rust) — app lễ tân, cửa sổ kiosk QR toàn màn hình, thông báo hệ thống
apps/api        CX API (Hono): Better Auth (đăng nhập), cấp JWT, cổng dữ liệu /rest/v1 → PostgREST,
                realtime WebSocket (/realtime) từ pg_notify, việc nền pg-boss (nhắc 07:00)
packages/core   Nghiệp vụ thuần TypeScript: trừ buổi, cảnh báo, lịch dự kiến, VietQR, mã QR xoay 45s, lương GV
packages/api    Client dữ liệu (postgrest-js) + đăng nhập + realtime + TanStack Query hooks dùng chung
packages/db     Kiểu TypeScript sinh từ database
packages/ui-tokens  Màu, font, họa tiết bàn cờ theo nhận diện Dương Sinh
database/       Migrations PostgreSQL (RLS đa trung tâm, RPC, trigger), seed, pgTAP tests, scripts/db.mjs
infra/          Docker Compose production: postgres:17, PostgREST, api, web, Caddy (HTTPS), backup
```

```
Trình duyệt / Mobile / Desktop ──HTTPS──▶ Caddy ─┬─▶ web (Next.js)
                                                  └─▶ api (Hono) ─┬─ /auth/*     Better Auth  ─┐
                                                                  ├─ /rest/v1/*  PostgREST ─────┼─▶ PostgreSQL 17
                                                                  └─ /realtime   LISTEN/NOTIFY ─┘   (RLS theo tổ chức/cơ sở)
```

Quyền truy cập dữ liệu do **RLS trong PostgreSQL** quyết định. API cấp JWT ngắn hạn (`sub` = người dùng), PostgREST đặt `role` + `request.jwt.claims`, và các policy dùng `auth.uid()`. Khi một thiết bị điểm danh, trigger phát `pg_notify`, CX API đẩy tín hiệu qua WebSocket tới các thiết bị đang mở cùng cơ sở. Test `apps/web/e2e/cross-platform-sync.spec.ts` kiểm tra đúng việc này.

Tooling theo repo [REA](https://github.com/covuaduongsinh/rea): pnpm + Turborepo, TypeScript 7, oxlint, oxfmt, Vitest 5, Husky.

## Chạy local

Yêu cầu: Node ≥ 22, pnpm 10, PostgreSQL ≥ 16 (+ pgTAP để chạy test DB), Docker (để chạy PostgREST); Rust + webkit2gtk nếu build desktop.

```bash
pnpm install
pnpm db:reset                 # tạo lại database cxedu: migrations + dữ liệu mẫu CLB Dương Sinh
docker run -d --name cx-rest --network host \
  -e PGRST_DB_URI=postgres://authenticator:authenticator-dev@127.0.0.1:5432/cxedu \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_AUD=authenticated \
  -e PGRST_JWT_SECRET=dev-only-jwt-secret-change-me-32-characters -e PGRST_SERVER_PORT=3001 \
  postgrest/postgrest:v16.4
pnpm api:dev                  # CX API tại http://localhost:8787
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @cxedu/web dev  # http://localhost:3000
```

Tài khoản mẫu (chỉ dùng local): `thay.tuong@cxedu.local` / `CXedu@2026` (chủ trung tâm), `gv.lan@cxedu.local` / `CXedu@2026` (giáo viên).

**Mobile:** `cp apps/mobile/.env.example apps/mobile/.env`, rồi `pnpm --filter @cxedu/mobile start`. Mở bằng Expo Go, hoặc development build nếu cần camera quét QR.

**Desktop:** `CXEDU_APP_URL=http://localhost:3000 pnpm --filter @cxedu/desktop dev`.

## Triển khai lên VPS

```bash
cp infra/.env.example infra/.env     # điền tên miền + bí mật (openssl rand -base64 48)
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d --build
```

Caddy tự xin chứng chỉ HTTPS cho `APP_DOMAIN` và `API_DOMAIN`. Dịch vụ `migrate` chạy migration trước khi API và PostgREST khởi động. Dịch vụ `backup` chạy `pg_dump` lúc 02:00 hằng đêm và giữ 14 ngày; nên đồng bộ thư mục backup sang nơi lưu trữ ngoài VPS.

## Kiểm thử

```bash
pnpm check        # format + lint + typecheck + unit test (core, api, api-server)
pnpm db:test      # pgTAP: RLS đa tenant, trừ buổi, hóa đơn, cổng phụ huynh, check-in QR
pnpm e2e          # Playwright: tái đăng ký, cổng phụ huynh, đăng ký trung tâm mới (+ đồng bộ mobile↔web khi có E2E_MOBILE_URL, E2E_DATABASE_URL)
pnpm --filter @cxedu/desktop check   # cargo check
```

`pnpm db:types` sinh lại `packages/db/src/database.types.ts` từ database (dùng Supabase CLI chỉ như công cụ sinh code lúc phát triển).

## Lộ trình

Xem thư mục [docs/plans/](docs/plans/): kế hoạch tổng, đề xuất CX Platform và lộ trình GĐ 3–6.
