"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  QrCode,
  Receipt,
  RefreshCcw,
  Settings,
  Users,
} from "lucide-react";

import { cx } from "./ui";

const NAV = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
    admin: false,
  },
  {
    href: "/attendance",
    label: "Điểm danh",
    icon: CalendarCheck,
    admin: false,
  },
  { href: "/students", label: "Học viên", icon: Users, admin: false },
  { href: "/renewals", label: "Tái đăng ký", icon: RefreshCcw, admin: true },
  { href: "/invoices", label: "Hóa đơn", icon: Receipt, admin: true },
  { href: "/courses", label: "Khóa học", icon: BookOpen, admin: true },
  { href: "/schedule", label: "Lớp & lịch", icon: CalendarDays, admin: true },
  { href: "/kiosk", label: "QR check-in", icon: QrCode, admin: true },
  { href: "/settings", label: "Cài đặt", icon: Settings, admin: true },
];

export const Sidebar = ({ isAdmin }: { isAdmin: boolean }) => {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-1 overflow-x-auto md:flex-col"
      aria-label="Điều hướng chính"
    >
      {NAV.filter((item) => isAdmin || !item.admin).map(
        ({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap",
                active
                  ? "bg-white text-primary"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        },
      )}
    </nav>
  );
};
