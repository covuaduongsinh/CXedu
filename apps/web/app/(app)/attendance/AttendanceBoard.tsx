"use client";

import { useRouter } from "next/navigation";
import {
  useRealtimeSync,
  useTodaySessions,
  useToggleAttendance,
} from "@cxedu/api/react";
import type { SessionStudent } from "@cxedu/api";
import type { AttendanceStatus } from "@cxedu/core";

import { LevelBadge } from "@/components/LevelBadge";
import { Card, Empty, cx } from "@/components/ui";
import { getCxBrowser } from "@/lib/cx/browser";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-green text-white ring-green",
  excused: "bg-gold text-ink ring-gold",
  unexcused: "bg-danger text-white ring-danger",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  excused: "Vắng có phép",
  unexcused: "Vắng không phép",
};

interface Props {
  centerId: string;
  orgId: string;
  date: string;
  today: string;
}

export const AttendanceBoard = ({ centerId, orgId, date, today }: Props) => {
  const client = getCxBrowser();
  const router = useRouter();
  const sessions = useTodaySessions(client, centerId, date);
  const toggle = useToggleAttendance(client, centerId, date);
  useRealtimeSync(client, centerId, orgId);

  const setStatus = (
    student: SessionStudent,
    slotId: string | null,
    status: AttendanceStatus | null,
  ) =>
    toggle.mutate({
      student,
      slotId,
      status,
      kind: student.attendance?.kind ?? "regular",
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(event) =>
            router.push(`/attendance?date=${event.target.value}`)
          }
          className="rounded-md border border-line bg-white px-3 py-2 text-sm"
          aria-label="Ngày điểm danh"
        />
        {date !== today && (
          <button
            type="button"
            className="text-sm text-blue underline"
            onClick={() => router.push("/attendance")}
          >
            Về hôm nay
          </button>
        )}
        {toggle.isError && (
          <p className="text-sm text-danger" role="alert">
            {toggle.error.message}
          </p>
        )}
      </div>

      {sessions.isPending && <Empty>Đang tải lịch học…</Empty>}
      {sessions.isError && (
        <Empty>Không tải được lịch: {sessions.error.message}</Empty>
      )}
      {sessions.data?.length === 0 && (
        <Empty>Hôm nay không có lớp nào theo lịch.</Empty>
      )}

      {sessions.data?.map((session) => (
        <Card
          key={session.slotId ?? "extra"}
          title={
            <span>
              {session.name}
              {session.startTime && (
                <span className="ml-2 text-sm font-normal text-muted">
                  {session.startTime}–{session.endTime}
                </span>
              )}
            </span>
          }
          action={
            <span className="text-xs text-muted">
              {
                session.students.filter(
                  (s) => s.attendance?.status === "present",
                ).length
              }
              /{session.students.length} có mặt
            </span>
          }
        >
          {session.students.length === 0 ? (
            <Empty>Lớp chưa có học viên.</Empty>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {session.students.map((student) => {
                const status = student.attendance?.status ?? null;
                return (
                  <li
                    key={`${session.slotId}-${student.enrollmentId}`}
                    className="rounded-lg ring-1 ring-line"
                  >
                    <button
                      type="button"
                      data-testid={`attend-${student.studentId}`}
                      aria-pressed={status === "present"}
                      onClick={() =>
                        setStatus(
                          student,
                          session.slotId,
                          status === "present" ? null : "present",
                        )
                      }
                      className={cx(
                        "flex w-full items-center justify-between gap-2 rounded-t-lg px-3 py-3 text-left ring-1",
                        status
                          ? STATUS_STYLES[status]
                          : "bg-white ring-transparent hover:bg-primary-soft",
                      )}
                    >
                      <span>
                        <span className="block font-medium">
                          {student.fullName}
                        </span>
                        <span
                          className={cx(
                            "text-xs",
                            status ? "opacity-90" : "text-muted",
                          )}
                        >
                          {status ? STATUS_LABELS[status] : "Chưa điểm danh"} ·
                          còn {student.remainingLessons}/{student.totalLessons}{" "}
                          buổi
                        </span>
                      </span>
                      <LevelBadge level={student.chessLevel} />
                    </button>
                    <div className="flex divide-x divide-line text-xs">
                      {(["excused", "unexcused"] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setStatus(
                              student,
                              session.slotId,
                              status === value ? null : value,
                            )
                          }
                          className={cx(
                            "flex-1 px-2 py-1.5",
                            status === value
                              ? "font-bold text-primary"
                              : "text-muted hover:text-primary",
                          )}
                        >
                          {STATUS_LABELS[value]}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
};
