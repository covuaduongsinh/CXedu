import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CXedu — Giữ chân học viên cho trung tâm cờ vua",
    template: "%s · CXedu",
  },
  description:
    "CXedu giúp CLB và trung tâm cờ vua điểm danh 1 chạm, tự trừ buổi, nhắc tái đăng ký, gửi hóa đơn VietQR và theo dõi lộ trình 6 cấp Tốt → Vua.",
  applicationName: "CXedu",
};

export const viewport: Viewport = { themeColor: "#2B3990" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
