# Khảo sát Seny (senyapp.com) — danh mục tính năng

> Ngày khảo sát: 2026-10-23 · Công cụ: REA 6.7.0 (`capture-browser-scenario` chế độ connect, `analyze-javascript-application`) và trích xuất tĩnh trên 127 file JS công khai.
> Chỉ đọc, không tạo/sửa/xóa dữ liệu. Tài liệu này mô tả **tính năng và quy trình** bằng lời của CXedu; không sao chép mã, câu chữ hay thương hiệu Seny.

## 1. Phương pháp và giới hạn

| Bước | Kết quả |
|---|---|
| REA `capture-browser-scenario` trang `/auth` | Thành công. Form có Email, Mật khẩu, "Tiếp tục với Google", tab "Tạo trung tâm". |
| REA đăng nhập bằng secret reference (`SENY_EMAIL`, `SENY_PASSWORD`) | **Không đăng nhập được**: Seny trả về *"Email hoặc mật khẩu không đúng."* Dừng sau 1 lần thử để tránh khóa tài khoản. Có thể tài khoản được tạo bằng Google. |
| REA `analyze-javascript-application` trên bundle công khai | Thành công: 125 file JS được parse, 1.056 finding, không lỗi parse. |
| Trích xuất `.from("<bảng>").select(...)` + chuỗi giao diện theo route | Thu được 47 bảng/view, cột, bộ lọc, và các quy tắc nghiệp vụ trong code client. |

**Chưa khảo sát được:** giao diện sau đăng nhập khi có dữ liệu thật, luồng thao tác chi tiết, edge function phía server. Muốn bổ sung thì cần mật khẩu đúng, hoặc Thầy tự chạy REA trên máy mình ở chế độ connect với Chrome đã đăng nhập sẵn (kịch bản mẫu: `tools/rea/`).

Nền tảng kỹ thuật: Lovable (Vite + React + TanStack Router/Start), shadcn/Radix, Supabase (Postgres + Auth + Storage), PWA (manifest), xuất Excel bằng ExcelJS, Facebook Pixel.

## 2. Định vị và giá

- Khẩu hiệu: hệ thống giữ chân học viên cho trung tâm năng khiếu dạy theo buổi (mỹ thuật, âm nhạc, kỹ năng sống, võ, bơi, Anh ngữ, STEM…).
- Thông điệp chính: điểm danh không phải điểm mạnh nhất. Điểm mạnh là **không bỏ sót học viên sắp hết buổi, hóa đơn chưa gửi, phụ huynh chưa được chăm sóc**.
- Gói: dùng thử 30 ngày đủ tính năng · **960.000đ/tháng** · **8.040.000đ/năm** (670k/tháng, tiết kiệm 30%). Tối đa 300 học viên (tính cả Đang học + Tạm dừng), không giới hạn cơ sở. Bản Free giới hạn số hóa đơn.
- Thanh toán gói: quét QR chuyển khoản, rồi gửi ảnh xác nhận để được **kích hoạt thủ công**.
- Giới thiệu: cả người giới thiệu và người được giới thiệu đều nhận thêm 1 tháng Pro.
- Hỗ trợ: email + Zalo. Dashboard có lời chào hằng ngày từ trợ lý "Seni".

## 3. Danh mục màn hình

| Route | Chức năng |
|---|---|
| `/dashboard` | Số học viên/khóa/điểm danh; **Cảnh báo sắp hết buổi** (tổng buổi còn lại **< 6**, ngưỡng cố định); bảng **Cảnh báo gia hạn** (đang follow-up / đã gửi HĐ / đã đóng / ghi chú); sinh nhật; doanh thu tháng/năm; học viên nghỉ nhiều buổi. |
| `/students`, `/students/:id` | Danh sách, ảnh, phụ huynh, SĐT, ngày nhập học, cơ sở, nhiều khóa/học viên, đánh dấu khóa sắp hết buổi, portfolio, nhận xét. |
| `/attendance` | Theo ngày + múi giờ VN, lọc cơ sở/lớp/phòng/GV/ca sáng-chiều. Bấm 1 lần để điểm danh, bấm lại để bỏ. Có **vắng có phép / vắng không phép**, **học bù**, **buổi học lẻ** (ghép vào ca có sẵn, ghi chú hiện ở Cổng phụ huynh), học miễn phí. Không cho xóa buổi học bù đã điểm danh. |
| `/absent` | **Vắng liên tiếp**: 2 buổi mới nhất trong chuỗi 5 buổi gần nhất đều vắng (có phép hoặc không phép); kiểu vắng → đi học → vắng không tính. Tự rời danh sách khi học viên đi học lại hoặc chuyển sang đã nghỉ. Kèm mẫu tin: quan tâm, nhắc học bù, xác nhận lý do, mời quay lại. |
| `/stopped` | Tạm dừng (còn buổi) và Đã nghỉ (hết khóa); có lý do, từ ngày, "sắp đi học lại trong N ngày", đánh dấu đã nhắc, kích hoạt lại (bị chặn khi vượt hạn mức gói). |
| `/birthdays` | Sinh nhật học viên, đánh dấu đã tặng quà theo năm. |
| `/courses` | Khóa: tên, mô tả, giá, số buổi mặc định, giá/buổi, **số buổi vắng có phép tối đa**. Lớp (room) theo khóa, sĩ số tối đa, khung giờ (thứ + giờ), GV. Không xóa được khóa đang có học viên dùng. |
| `/centers` | Cơ sở, phòng (sức chứa), ngày nghỉ của trung tâm (khoảng ngày; trong thời gian này không hiện thẻ điểm danh), tài khoản ngân hàng 1 và 2, ảnh QR, tiền tố số HĐ, nội quy khóa học, đơn giá GV dạy tự do. |
| `/invoice` | Tạo HĐ: số HĐ, cơ sở, nhiều học viên cùng gia đình, dòng khóa/học cụ, đơn giá, ngày bắt đầu/kết thúc dự kiến (tính theo lịch học và lịch nghỉ), giảm giá, đã thu, công nợ, hạn thanh toán, CK/tiền mặt, nội quy cuối HĐ, ghi chú nội bộ. Xuất PDF, chia sẻ qua Web Share. HĐ mới của học viên đang sắp hết buổi tự vào bảng gia hạn. |
| `/payments`, `/revenue`, `/profit`, `/expenses` | Thanh toán gắn với ghi danh/học cụ, doanh thu ghi nhận theo ngày đóng, chi phí, lợi nhuận theo ngày/tháng/năm (lời xanh, lỗ đỏ), phân bổ doanh thu. |
| `/supplies` | Học cụ: giá vốn, giá bán, nhập/xuất kho, cấp phát cho học viên, đã thu tiền hay chưa, nhập bằng CSV. |
| `/leads` | Khách tiềm năng: phụ huynh, học viên, ngày sinh, SĐT, địa chỉ, **cấp độ test đầu vào**, trạng thái (mới / chăm sóc / đã đăng ký), ảnh, xuất file, tạo HĐ cho lead, **chuyển lead thành học viên** không cần nhập lại, mẫu tin nhắn. |
| `/homework` | Giao bài cho lớp/phòng hoặc từng học viên, hạn nộp, mở/đóng, chấm, đánh dấu đã đọc. |
| `/parent/s/:token` | **Cổng phụ huynh** (chỉ đọc): xác minh bằng 4 số cuối SĐT; tiến độ buổi, lịch, ngày đã học/vắng, học bù, nhận xét GV, tác phẩm, học phí đã đóng, xem HĐ PDF, nộp bài (giới hạn 2.000 ký tự, chờ 30 giây giữa 2 lần gửi). |
| `/checkin` | **QR động tại lễ tân** (đổi mỗi 45 giây, GV phải có mặt mới check-in được). Ca dạy, đi trễ (phút), bỏ ca, vắng có phép, dạy thay, admin xác nhận thủ công. Lương: theo ca nhóm (cố định), theo lượt học viên (đơn giá × số HV, có ngưỡng), dạy 1:1, dạy tự do; đơn giá theo GV hoặc theo khóa; ứng lương; tạm tính / đã ứng / còn nhận. |
| `/teacher` | Nghỉ phép theo khoảng ngày (mọi ca tính vắng có phép, không check-in được); phân công GV dạy thay cho toàn bộ ca cố định trong khoảng ngày. |
| `/staff`, `/staff-attendance` | Nhân viên, ca làm, chấm công, xuất Excel. |
| `/report` | Học viên đang học theo thời gian, học viên mới so với nghỉ, tỷ lệ đi học, **công suất phòng theo khung giờ** (tìm ca còn chỗ). |
| `/team`, `/invite/:token` | Mời thành viên; vai trò Owner / Admin / Giáo viên; **phân quyền theo từng trang**; giới hạn cơ sở được phân công. |
| `/logs` | Nhật ký hoạt động (ai, lúc nào, bảng nào, thay đổi gì). Chỉ Owner xem. |
| `/data` | Import Excel/Google Sheet, export. |
| `/settings`, `/plan` | Hồ sơ, đổi mật khẩu (≥ 8 ký tự, hoa, thường, số, ký tự đặc biệt), thương hiệu (logo, loại hình, quy mô), **thông tin xuất VAT** (tên công ty, MST, email, địa chỉ thuế), gói và gia hạn. |
| `/blog`, `/blog-admin`, `/admin` | Blog SEO và super-admin vận hành SaaS. Có hook email nhắc onboarding, trial, Pro. |

## 4. Mô hình dữ liệu suy ra

Đa tenant: `organizations` (thương hiệu) → `organization_members` + `organization_member_permissions(page, allowed)` + `organization_invites` → `ga_centers` (cơ sở).

- **Đào tạo:** `ga_courses` (price, default_total_lessons, max_excused_absences) → `ga_rooms` (lớp: max_students) → `ga_room_slots` (day_of_week, time_of_day, teacher) + `ga_room_slot_teachers`; `ga_center_rooms` (phòng vật lý, capacity).
- **Học viên:** `ga_students` (full_name, birthday, parent_name/phone/email, photo, status, parent_access_token/enabled/last_viewed_at, gift_received_year) → `ga_student_courses` (= ghi danh: total_lessons, used_lessons, start/end_date, end_date_manual, sessions_per_week, status) → `ga_student_schedules` / `ga_schedule_courses` (lịch cố định) + `ga_enrollment_slots`.
- **Điểm danh:** `ga_attendance` (lesson_date, time_of_day) · `ga_absences` (absence_date, excuse_status: excused/unexcused, reason) · `ga_bookings` (học bù/buổi lẻ: booking_date, makeup_for_date, room_slot, teacher) · `ga_pause_records` · `ga_center_closures`.
- **Tài chính:** `ga_invoices` (invoice_number, total, amount_paid, status, lead_id) · `ga_payments` (amount, paid_at, invoice_url) · `ga_payment_enrollments` · `ga_payment_materials` · `ga_renewal_followups` (following_up, invoice_sent, paid, note) · `ga_expenses` · `ga_supplies` + `ga_supply_movements` + `ga_student_materials`.
- **CRM & nội dung:** `ga_leads` · `ga_message_templates(kind, slot, title, body)` · `ga_homework_*` · `ga_student_reviews` · `ga_student_portfolio` (storage_path, dung lượng).
- **Nhân sự:** `ga_teacher_checkins` (session_type, session_status, late_minutes, student_count_snapshot) · `ga_teacher_rates` / `ga_teacher_course_rates` (pay_mode, group/private/flex) · `ga_teacher_advances` · `ga_teacher_leaves` · `ga_shift_substitutions` · `ga_staff`, `ga_staff_shifts`, `ga_staff_attendance`.
- **Khác:** `ga_activity_logs` · `onboarding_progress` · `seny_invoices` (hóa đơn thu phí SaaS) · `blog_posts` · `user_roles`.

## 5. Quy tắc nghiệp vụ cốt lõi (CXedu sẽ tự cài đặt)

1. **Trừ buổi:** điểm danh làm `used_lessons + 1`. Vắng có phép không trừ, trong giới hạn `max_excused_absences` của khóa. Ghi danh hết buổi thì thành *hoàn thành*.
2. **Sắp hết buổi:** tổng buổi còn lại trên các khóa có phí < ngưỡng (Seny cố định 6). Học viên đã nghỉ không tính.
3. **Vắng liên tiếp:** trong 5 buổi gần nhất, 2 buổi mới nhất đều vắng.
4. **Chuỗi tái đăng ký:** sắp hết buổi → follow-up → gửi HĐ → đã đóng → học tiếp. HĐ mới tự gắn vào bảng gia hạn.
5. **Ngày kết thúc dự kiến:** tính từ lịch tuần, trừ ngày nghỉ trung tâm và thời gian bảo lưu.
6. **Hạn mức gói** tính trên học viên Đang học + Tạm dừng.
7. **Check-in GV:** mã QR đổi mỗi 45 giây, chống chụp màn hình gửi cho nhau.

## 6. Khoảng trống CXedu làm tốt hơn

| Seny | CXedu |
|---|---|
| Ngưỡng "sắp hết buổi" cố định 6 | Cấu hình theo tổ chức/khóa; có thêm cảnh báo theo **số ngày** dự kiến còn lại |
| Nhắc phụ huynh bằng mẫu tin copy-paste | Gửi tự động qua **Zalo ZNS**, push app, email; vẫn giữ mẫu tin |
| HĐ có QR tĩnh; gói SaaS kích hoạt thủ công bằng ảnh CK | **VietQR động** theo số tiền + mã HĐ; webhook SePay/Casso tự gạch nợ và tự kích hoạt gói |
| PWA web | App native **iOS/Android (Expo)** + **desktop (Tauri)**, realtime giữa các thiết bị, điểm danh offline |
| Đa ngành chung chung, "Art Portfolio" | **Chuyên cờ vua:** lộ trình 6 cấp Tốt→Vua, lịch sử lên cấp, chứng nhận, Elo, bài tập là thế cờ FEN/PGN, dữ liệu kết nối giải đấu |
| Không giới hạn cơ sở nhưng trần 300 HV | Gói theo bậc số học viên, phù hợp cả CLB nhỏ lẫn hệ thống trường học |

## 7. Ảnh hưởng đến kế hoạch

- Bổ sung vào schema GĐ1: `renewal_followups`, `bookings` (học bù/buổi lẻ), `enrollment.end_date_manual`, `sessions_per_week`, `parent_access_*`, `message_templates(kind, slot)`, `organization_member_permissions(page)`, `teacher_rates.pay_mode`.
- Bổ sung vào backlog GĐ2: bảng gia hạn trên dashboard, gộp HĐ nhiều anh/chị em, nội quy cuối HĐ, chặn xóa dữ liệu đang được dùng.
