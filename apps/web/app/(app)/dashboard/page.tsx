import type { Metadata } from "next";
import Link from "next/link";
import { fetchDashboard } from "@cxedu/api";
import { formatVnd } from "@cxedu/core";

import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Stat,
  buttonClass,
} from "@/components/ui";
import { getAppContext } from "@/lib/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function DashboardPage() {
  const context = await getAppContext();
  const supabase = await createSupabaseServer();
  const data = await fetchDashboard(supabase, context.org.id);
  return (
    <>
      <PageHeader
        title="Tổng quan"
        subtitle={`Việc cần làm hôm nay tại ${context.org.name}`}
        action={
          <Link href="/attendance" className={buttonClass("accent")}>
            Điểm danh hôm nay
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Đang học" value={data.activeStudents} />
        <Stat
          label="Sắp hết buổi"
          value={data.lowRemaining.length}
          tone="orange"
        />
        <Stat
          label="Vắng liên tiếp"
          value={data.consecutiveAbsences.length}
          tone="danger"
        />
        <Stat
          label="Công nợ"
          value={context.isAdmin ? formatVnd(data.unpaidInvoices.balance) : "—"}
          tone="green"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card
          title={`Sắp hết buổi (≤ ${context.org.low_remaining_threshold} buổi)`}
          action={
            context.isAdmin ? (
              <Link href="/renewals" className="text-sm text-blue underline">
                Xử lý tái đăng ký
              </Link>
            ) : null
          }
        >
          {data.lowRemaining.length === 0 ? (
            <Empty>Chưa có học viên nào sắp hết buổi.</Empty>
          ) : (
            <ul className="divide-y divide-line" data-testid="low-remaining">
              {data.lowRemaining.map((item) => (
                <li
                  key={item.studentId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div>
                    <Link
                      href={`/students/${item.studentId}`}
                      className="font-medium text-ink hover:text-primary"
                    >
                      {item.fullName}
                    </Link>
                    <p className="text-xs text-muted">
                      {item.parentName ?? "—"} ·{" "}
                      {item.parentPhone ?? "chưa có SĐT"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.invoiceSent ? (
                      <Badge tone="green">Đã gửi HĐ</Badge>
                    ) : item.followingUp ? (
                      <Badge tone="gold">Đang chăm sóc</Badge>
                    ) : null}
                    <Badge
                      tone={item.remainingLessons <= 1 ? "danger" : "orange"}
                    >
                      Còn {item.remainingLessons} buổi
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Vắng 2 buổi gần nhất">
          {data.consecutiveAbsences.length === 0 ? (
            <Empty>Không có học viên vắng liên tiếp 🎉</Empty>
          ) : (
            <ul
              className="divide-y divide-line"
              data-testid="consecutive-absences"
            >
              {data.consecutiveAbsences.map((item) => (
                <li
                  key={item.studentId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div>
                    <Link
                      href={`/students/${item.studentId}`}
                      className="font-medium text-ink hover:text-primary"
                    >
                      {item.fullName}
                    </Link>
                    <p className="text-xs text-muted">
                      {item.parentName ?? "—"} ·{" "}
                      {item.parentPhone ?? "chưa có SĐT"}
                    </p>
                  </div>
                  {item.parentPhone && (
                    <a
                      href={`https://zalo.me/${item.parentPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClass("ghost", "px-3 py-1")}
                    >
                      Nhắn Zalo
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Sinh nhật trong tháng">
          {data.birthdaysThisMonth.length === 0 ? (
            <Empty>Tháng này chưa có sinh nhật học viên.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {data.birthdaysThisMonth.map((item) => (
                <li
                  key={item.studentId}
                  className="flex justify-between py-2 text-sm"
                >
                  <span>🎂 {item.fullName}</span>
                  <span className="text-muted">
                    {item.birthday.slice(8)}/{item.birthday.slice(5, 7)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {context.isAdmin && (
          <Card
            title="Hóa đơn chưa thu đủ"
            action={
              <Link href="/invoices" className="text-sm text-blue underline">
                Xem tất cả
              </Link>
            }
          >
            <p className="text-3xl font-bold text-primary">
              {data.unpaidInvoices.count}
            </p>
            <p className="text-sm text-muted">
              Tổng còn phải thu: {formatVnd(data.unpaidInvoices.balance)}
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
