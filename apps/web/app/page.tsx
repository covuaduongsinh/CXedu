import Link from "next/link";
import {
  CalendarCheck,
  Crown,
  MessageCircle,
  QrCode,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { CHESS_LEVELS } from "@cxedu/core";

import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Điểm danh 1 chạm",
    body: "Giáo viên chạm tên học viên trên điện thoại, hệ thống tự trừ buổi, tính đúng vắng có phép theo hạn mức của khóa.",
  },
  {
    icon: TrendingUp,
    title: "Không bỏ sót tái đăng ký",
    body: "Học viên sắp hết buổi tự vào danh sách gia hạn, kèm trạng thái đã liên hệ, đã gửi hóa đơn, đã đóng.",
  },
  {
    icon: Receipt,
    title: "Hóa đơn VietQR tự gạch nợ",
    body: "Mỗi hóa đơn có mã VietQR đúng số tiền. Phụ huynh chuyển khoản là hệ thống tự ghi nhận.",
  },
  {
    icon: MessageCircle,
    title: "Nhắc phụ huynh tự động",
    body: "Vắng 2 buổi liên tiếp, sắp hết buổi, sinh nhật: nhắc qua Zalo, thông báo app và email.",
  },
  {
    icon: Crown,
    title: "Lộ trình 6 cấp cờ vua",
    body: "Theo dõi tiến độ Tốt → Mã → Tượng → Xe → Hậu → Vua, lịch sử lên cấp và Elo của từng học viên.",
  },
  {
    icon: QrCode,
    title: "Check-in giáo viên bằng QR",
    body: "Mã QR tại lễ tân đổi mỗi 45 giây, chấm công và tính lương theo ca, theo học viên.",
  },
];

const YEAR = new Date().getFullYear();

export default function Landing() {
  return (
    <main>
      <section className="relative overflow-hidden bg-primary text-white">
        <div
          className="chess-pattern absolute inset-0 opacity-10"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-6">
          <nav className="flex items-center justify-between">
            <Logo light />
            <Link href="/login" className={buttonClass("accent")}>
              Đăng nhập
            </Link>
          </nav>
          <div className="py-16 md:py-24">
            <p className="text-sm tracking-widest text-gold uppercase">
              Vui trí tuệ · Dương Sinh
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-bold md:text-5xl">
              Hệ điều hành giữ chân học viên cho CLB và trung tâm cờ vua
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/80">
              Bé còn 2 buổi, hóa đơn chưa gửi, phụ huynh chưa được hỏi thăm:
              CXedu nhắc đúng việc, đúng lúc, trên web, máy tính và điện thoại.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login?mode=signup"
                className={buttonClass("accent", "px-6 py-3 text-base")}
              >
                Dùng thử miễn phí 30 ngày
              </Link>
              <a
                href="#tinh-nang"
                className={buttonClass("ghost", "px-6 py-3 text-base")}
              >
                Xem tính năng
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="tinh-nang" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-primary">
          Mọi việc của trung tâm trong một nơi
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-line"
            >
              <Icon className="size-8 text-orange" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-primary">
            Lộ trình 6 cấp Dương Sinh
          </h2>
          <ol className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-6">
            {CHESS_LEVELS.map((level) => (
              <li
                key={level.id}
                className="rounded-lg bg-primary-soft p-4 text-center"
              >
                <p className="text-xs text-muted">Cấp {level.order}</p>
                <p className="mt-1 text-xl font-bold text-primary">
                  {level.name}
                </p>
                <p className="text-xs text-muted">{level.englishName}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="bg-primary-dark py-8 text-center text-sm text-white/70">
        © {YEAR} Công ty CP Cờ vua Dương Sinh · Số 7 ngõ 69 Tôn Đức Thắng, Đống
        Đa, Hà Nội · 0983.119.819
      </footer>
    </main>
  );
}
