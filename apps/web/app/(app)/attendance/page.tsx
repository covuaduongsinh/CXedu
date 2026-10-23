import type { Metadata } from "next";
import { todayIn } from "@cxedu/core";

import { PageHeader } from "@/components/ui";
import { getAppContext } from "@/lib/session";

import { AttendanceBoard } from "./AttendanceBoard";

export const metadata: Metadata = { title: "Điểm danh" };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const context = await getAppContext();
  const { date } = await searchParams;
  const today = todayIn(context.org.timezone);
  const selected = date && /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date : today;
  return (
    <>
      <PageHeader
        title="Điểm danh"
        subtitle={`${context.center.name} · chạm vào học viên để điểm danh, hệ thống tự trừ buổi`}
      />
      <AttendanceBoard
        centerId={context.center.id}
        orgId={context.org.id}
        date={selected}
        today={today}
      />
    </>
  );
}
