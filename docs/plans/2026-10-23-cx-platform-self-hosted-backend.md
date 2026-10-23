# Đề xuất: CX Platform — backend tự xây thay thế Supabase

> Ngày 2026-10-23 · Trạng thái: **đã triển khai B1–B3 + gói Compose cho B4** (xem mục 8) · Liên quan: `2026-10-23-cxedu-master-plan.md`

## 1. Bối cảnh

- Supabase gói Free chỉ cho 2 project chạy cùng lúc, và tổ chức `covuaduongsinh_supabase` đã đủ 2 (`erpchess-dev`, `duongsinh-chess`). Vì vậy chưa tạo được project `cxedu`.
- Thầy muốn **tự làm chủ nền tảng**: không bị giới hạn gói, kiểm soát chi phí, và dữ liệu học viên (phần lớn là trẻ em) nằm trên hạ tầng của Dương Sinh.
- CXedu sẽ bán SaaS cho nhiều trung tâm, nên cần chi phí cố định thấp và mở rộng được.

## 2. Khuyến nghị

**Xây "CX Platform" trên PostgreSQL thuần và giữ lại toàn bộ logic database đã viết và đã test**: 46 RLS policy, 26 hàm/RPC, trigger, pg_cron, 23 pgTAP test. Bốn dịch vụ mà Supabase đang cung cấp được thay bằng thư viện mã nguồn mở TypeScript, chạy chung trong một Docker Compose trên VPS.

| Supabase đang cung cấp | CX Platform thay bằng | Ghi chú |
|---|---|---|
| Postgres 17 | **PostgreSQL 17** chính chủ + `pg_cron`, `pgcrypto` | Migrations gần như giữ nguyên |
| Auth (GoTrue) | **Better Auth 1.7**: email/mật khẩu, magic link, Google, plugin organization; `@better-auth/expo` cho mobile | Người dùng lưu ngay trong DB của mình, không cần dịch vụ ngoài |
| PostgREST (API tự sinh) | **Hono 4 + oRPC 1.16** (API có kiểu, tự sinh OpenAPI) + **Drizzle ORM** | Mỗi request chạy trong transaction `SET LOCAL ROLE cx_user` + `app.user_id`, nên **RLS hiện có tiếp tục bảo vệ dữ liệu** (bảo vệ 2 lớp) |
| Realtime | `LISTEN/NOTIFY` của Postgres → **WebSocket** trong API, theo kênh từng cơ sở | Ứng dụng chỉ cần tín hiệu "có thay đổi" để tải lại. GĐ3 bổ sung **ElectricSQL** cho mobile chạy offline |
| Storage | Chuẩn S3: **Garage/MinIO** tự host hoặc Cloudflare R2, upload qua presigned URL | Ảnh học viên, chứng nhận, bài tập |
| Edge Functions, cron | Route trong API + **pg-boss 12** (hàng đợi việc chạy trên Postgres, có retry) | Gửi Zalo ZNS / email / push, webhook ngân hàng. Không cần Redis |
| Studio | Drizzle Studio / pgAdmin, chỉ mở qua SSH tunnel | Không lộ ra Internet |

### Triển khai

```
Một VPS Ubuntu 24.04 đặt tại Việt Nam (4 vCPU · 8 GB RAM · ≥ 80 GB SSD)
└─ Docker Compose
   ├─ caddy        HTTPS tự động (Let's Encrypt) cho app.cxedu.vn, api.cxedu.vn
   ├─ web          Next.js 16 (output standalone)
   ├─ api          Hono + Better Auth + oRPC + WebSocket + pg-boss worker
   ├─ postgres     PostgreSQL 17 + pg_cron (chỉ mở trong mạng nội bộ Docker)
   ├─ storage      Garage (S3) — hoặc dùng Cloudflare R2
   └─ backup       wal-g → bucket ngoài VPS: sao lưu liên tục, khôi phục về thời điểm bất kỳ (PITR)
GitHub Actions: test → build image → GHCR → triển khai qua SSH (docker compose pull && up -d)
```

Mobile (Expo) và desktop (Tauri) gọi `api.cxedu.vn`. App desktop tải `app.cxedu.vn` như hiện nay.

## 3. So sánh phương án

| | **A. CX Platform tự xây** (khuyến nghị) | B. Tự host Supabase mã nguồn mở | C. Supabase Pro |
|---|---|---|---|
| Sửa code | Vừa phải (mục 4) | Không | Không |
| Tài nguyên máy | Nhẹ: 5–6 container, chạy tốt với 4–8 GB RAM | Nặng: khoảng 12 container, cần ≥ 8 GB RAM | — |
| Chi phí/tháng (ước lượng, cần báo giá) | 1 VPS tại VN | 1 VPS cấu hình lớn hơn | ~25 USD + compute mỗi project |
| Làm chủ / tùy biến | Toàn quyền, code TypeScript cùng monorepo | Phụ thuộc lịch nâng cấp của Supabase | Phụ thuộc nhà cung cấp |
| Offline-first cho mobile | Lên lộ trình (ElectricSQL) | Phải tích hợp thêm | Phải tích hợp thêm |
| Trách nhiệm vận hành | Dương Sinh (backup, vá bảo mật) — có script tự động | Dương Sinh, phức tạp hơn | Supabase lo |

**Về Vercel:** gói Hobby chỉ dành cho mục đích phi thương mại. CXedu bán SaaS nên cần Vercel Pro, hoặc chạy Next.js ngay trên VPS như sơ đồ trên. Khuyến nghị chạy trên VPS để rẻ nhất và dữ liệu ở cùng một nơi. Vercel chỉ nên dùng cho landing page hoặc bản preview khi cần.

**Về pháp lý (cần luật sư xác nhận):** Nghị định 13/2023 và Luật Bảo vệ dữ liệu cá nhân (hiệu lực từ 01/01/2026) đặt yêu cầu riêng với dữ liệu trẻ em và với việc chuyển dữ liệu ra nước ngoài. Đặt máy chủ tại Việt Nam giúp giảm thủ tục.

## 4. Phạm vi thay đổi code (đo trên repo hiện tại)

- **SQL:**
  - Thêm migration `0006_platform`: schema `app`, hàm `app.uid()` thay cho 18 chỗ `auth.uid()`.
  - Bảng người dùng của Better Auth thay cho 16 khóa ngoại tới `auth.users`.
  - Các vai trò `cx_anon` / `cx_user` / `cx_service` thay cho `anon` / `authenticated` / `service_role`.
  - Policy và RPC giữ nguyên.
- **TypeScript:**
  - Gói mới `apps/api` (server).
  - `packages/api` **giữ nguyên chữ ký hàm** (`fetchTodaySessions`, `markAttendance`, `fetchDashboard`…) nhưng bên trong đổi từ supabase-js sang oRPC client. Như vậy 60 truy vấn và 10 lời gọi auth trong 6 file được thay tập trung, giao diện web/mobile gần như không phải sửa.
- **Giữ nguyên:** `packages/core`, `packages/ui-tokens`, giao diện web/mobile/desktop, pgTAP test (chạy trên Postgres thuần trong Docker, đơn giản hơn trước), Playwright E2E.

## 5. Lộ trình

| Bước | Việc | Xong khi |
|---|---|---|
| B1 | `apps/api`: Hono + Better Auth + oRPC + Drizzle; migration `0006_platform` | pgTAP 23/23 xanh trên Postgres thuần; API đăng nhập và điểm danh được |
| B2 | `packages/api` chuyển sang oRPC client; web dùng cookie phiên Better Auth; mobile dùng `@better-auth/expo` (SecureStore) | 27 unit test + 5 E2E xanh |
| B3 | Realtime: NOTIFY → WebSocket; giữ test đồng bộ mobile ↔ web | E2E đồng bộ xanh |
| B4 | Docker Compose production + Caddy + backup wal-g + workflow triển khai GitHub Actions | Chạy được trên VPS; **khôi phục thử từ backup thành công** |
| B5 | Giám sát (healthcheck, Uptime Kuma, log), tự động vá bảo mật hệ điều hành, tài liệu vận hành (runbook) | Có cảnh báo khi dịch vụ ngừng |

B1–B3 làm và kiểm chứng được ngay trong môi trường hiện tại (đã có Docker), chưa cần VPS.

## 6. Thầy cần chuẩn bị (cho B4)

1. **VPS** Ubuntu 24.04, 4 vCPU / 8 GB RAM / ≥ 80 GB SSD, đặt tại Việt Nam (Viettel IDC, VNPT, BizFly Cloud… xin báo giá).
2. **Tên miền** (ví dụ `cxedu.vn`) và quyền sửa DNS.
3. **Nơi lưu backup tách khỏi VPS** (bucket S3/R2 hoặc VPS thứ hai).
4. Cấp **SSH deploy key** cho GitHub Actions, hoặc để tôi soạn script và Thầy tự chạy lần đầu.

## 7. Rủi ro và cách giảm

- **Một VPS duy nhất là điểm hỏng duy nhất:** backup liên tục + PITR, diễn tập khôi phục định kỳ. Khi đông khách thì tách Postgres sang máy riêng hoặc thêm bản sao (replica).
- **Bảo mật:**
  - Chỉ mở cổng 80/443.
  - Postgres không lộ ra ngoài.
  - Bật tự động vá hệ điều hành, tường lửa `ufw` và `fail2ban`.
  - Bí mật lưu trong biến môi trường của server, không đưa vào repo.
- **Khối lượng chuyển đổi:** giữ nguyên SQL và chữ ký `packages/api` để giới hạn phạm vi; bộ test hiện có là thước đo hoàn thành.

## 8. Kết quả triển khai (2026-10-23)

Khi làm, tôi điều chỉnh một điểm so với đề xuất để giữ code tối đa: **dùng PostgREST làm API dữ liệu** thay cho viết oRPC/Drizzle. Nhờ vậy 60 truy vấn và 26 RPC/hàm trong web/mobile giữ nguyên. Các thay đổi:

- **database/**
  - Migration `0000_platform`: vai trò `anon`/`authenticated`/`service_role`/`authenticator`, schema `extensions` + `auth`, 4 bảng Better Auth (id UUID), `auth.uid()` đọc claims từ JWT.
  - Realtime bằng trigger `pg_notify('cx_change')`.
  - Bỏ `pg_cron`; nhắc hằng ngày do pg-boss trong API lên lịch.
  - Công cụ `scripts/db.mjs` (migrate, seed, reset, test).
- **apps/api (Hono):**
  - Better Auth (email/mật khẩu, plugin bearer).
  - `/auth/token` cấp JWT HS256 15 phút.
  - `/rest/v1/*` chuyển tiếp tới PostgREST.
  - `/realtime` WebSocket: kiểm quyền cơ sở, lọc sự kiện theo cơ sở/tổ chức.
  - pg-boss lịch `0 7 * * *` giờ Việt Nam.
- **packages/api:** `@supabase/postgrest-js` (thư viện client PostgREST độc lập, MIT) + bộ đệm JWT + realtime client tự viết. Web giữ phiên trong cookie httpOnly `cx_session`, mobile trong SecureStore.
- **infra/:** Docker Compose gồm `postgres:17` chính chủ, PostgREST, migrate, api, web (standalone), Caddy HTTPS, backup `pg_dump` hằng đêm.

**Kiểm chứng:**
- 32 unit test.
- 23 pgTAP trên PostgreSQL thuần (local 16, CI 16).
- 7 Playwright E2E, gồm đăng ký trung tâm mới và đồng bộ mobile→web qua realtime mới.
- Kiểu dữ liệu sinh lại từ database mới **giống hệt** bản cũ.

**Chưa kiểm chứng trong môi trường này:**
- Build Docker image: Docker Hub đang giới hạn lượt tải. Job `images` trong CI sẽ build.
- Chạy thật trên VPS: cần VPS + tên miền của Thầy.
