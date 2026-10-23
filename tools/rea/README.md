# Khảo sát sản phẩm tham chiếu bằng REA

Kịch bản dùng [REA](https://github.com/covuaduongsinh/rea) để đọc giao diện một web app **chỉ bằng điều hướng**:
không bấm tạo, sửa, xóa hay gửi.

## Chạy trên máy (Windows/macOS/Linux)

1. Mở Chrome với cổng debug cục bộ và một profile riêng:
   ```bash
   chrome --remote-debugging-address=127.0.0.1 --remote-debugging-port=9333 --user-data-dir=<thư-mục-tạm>
   ```
   Trong môi trường có proxy, thêm `--proxy-server=<proxy>`. REA ở chế độ `launch` lọc bỏ biến proxy khỏi
   môi trường trình duyệt, nên với mạng qua proxy hãy dùng chế độ `connect` như trên.
2. Lấy `id` của tab tại `http://127.0.0.1:9333/json/list`, rồi điền vào `target_id` trong bản sao của
   `seny-survey.template.json`. Nhân bản cặp `goto` + `wait_for_timeout` cho mỗi route cần đọc.
3. Nạp thông tin đăng nhập **qua biến môi trường**, không ghi vào file:
   ```bash
   SENY_EMAIL=... SENY_PASSWORD=... npx -y rea-agents@latest capture-browser-scenario ./scenario.json --json > capture.json
   ```
   REA tự thay giá trị bí mật bằng `[REDACTED:<secret_id>]` trong Evidence.
4. Kết quả có thể chứa dữ liệu học viên thật. **Không commit** `capture.json` hay ảnh chụp; chỉ tóm tắt
   vào `docs/research/`.

Nếu tài khoản đăng nhập bằng Google, bỏ các bước `fill`/`click` và đăng nhập tay trong Chrome trước,
rồi chạy kịch bản chỉ với các bước `goto`.
