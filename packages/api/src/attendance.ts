import {
  weekdayOf,
  type AttendanceInput,
  type AttendanceStatus,
  type ChessLevelId,
  type SessionKind,
} from "@cxedu/core";

import { unwrap, unwrapRows, type CxClient } from "./client";

export interface SessionStudent {
  enrollmentId: string;
  studentId: string;
  fullName: string;
  chessLevel: ChessLevelId;
  totalLessons: number;
  usedLessons: number;
  remainingLessons: number;
  attendance: {
    id: string;
    status: AttendanceStatus;
    kind: SessionKind;
    charged: number;
  } | null;
}

export interface TodaySession {
  slotId: string | null;
  name: string;
  startTime: string | null;
  endTime: string | null;
  courseName: string | null;
  students: SessionStudent[];
}

interface SlotRow {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  course: { name: string } | null;
  enrollment_schedules: {
    enrollment: {
      id: string;
      total_lessons: number;
      used_lessons: number;
      status: string;
      student: {
        id: string;
        full_name: string;
        chess_level: ChessLevelId;
        status: string;
      } | null;
    } | null;
  }[];
}

interface AttendanceRow {
  id: string;
  enrollment_id: string;
  class_slot_id: string | null;
  status: AttendanceStatus;
  kind: SessionKind;
  charged: number;
  enrollment: {
    total_lessons: number;
    used_lessons: number;
    student: {
      id: string;
      full_name: string;
      chess_level: ChessLevelId;
    } | null;
  } | null;
}

const toStudent = (
  enrollment: { id: string; total_lessons: number; used_lessons: number },
  student: { id: string; full_name: string; chess_level: ChessLevelId },
  attendance: AttendanceRow | undefined,
): SessionStudent => ({
  enrollmentId: enrollment.id,
  studentId: student.id,
  fullName: student.full_name,
  chessLevel: student.chess_level,
  totalLessons: enrollment.total_lessons,
  usedLessons: enrollment.used_lessons,
  remainingLessons: Math.max(
    enrollment.total_lessons - enrollment.used_lessons,
    0,
  ),
  attendance: attendance
    ? {
        id: attendance.id,
        status: attendance.status,
        kind: attendance.kind,
        charged: attendance.charged,
      }
    : null,
});

/** Ghép lớp theo lịch tuần + điểm danh trong ngày; học bù/buổi lẻ gom vào nhóm riêng. */
export const composeTodaySessions = (
  slots: readonly SlotRow[],
  attendance: readonly AttendanceRow[],
): TodaySession[] => {
  const regularByEnrollment = new Map(
    attendance
      .filter((row) => row.kind === "regular")
      .map((row) => [row.enrollment_id, row]),
  );
  const sessions: TodaySession[] = slots.map((slot) => ({
    slotId: slot.id,
    name: slot.name,
    startTime: slot.start_time.slice(0, 5),
    endTime: slot.end_time.slice(0, 5),
    courseName: slot.course?.name ?? null,
    students: slot.enrollment_schedules
      .flatMap(({ enrollment }) => {
        const student = enrollment?.student;
        if (!enrollment || !student || student.status !== "active") return [];
        if (
          enrollment.status !== "active" &&
          !regularByEnrollment.has(enrollment.id)
        )
          return [];
        return [
          toStudent(
            enrollment,
            student,
            regularByEnrollment.get(enrollment.id),
          ),
        ];
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi")),
  }));
  const extras = attendance.filter((row) => row.kind !== "regular");
  if (extras.length > 0) {
    sessions.push({
      slotId: null,
      name: "Học bù & buổi lẻ",
      startTime: null,
      endTime: null,
      courseName: null,
      students: extras.flatMap((row) =>
        row.enrollment?.student
          ? [
              toStudent(
                { id: row.enrollment_id, ...row.enrollment },
                row.enrollment.student,
                row,
              ),
            ]
          : [],
      ),
    });
  }
  return sessions;
};

export const fetchTodaySessions = async (
  client: CxClient,
  centerId: string,
  date: string,
): Promise<TodaySession[]> => {
  const [slots, attendance] = await Promise.all([
    client
      .from("class_slots")
      .select(
        "id, name, start_time, end_time, course:courses(name), enrollment_schedules(enrollment:enrollments(id, total_lessons, used_lessons, status, student:students(id, full_name, chess_level, status)))",
      )
      .eq("center_id", centerId)
      .eq("weekday", weekdayOf(date))
      .eq("active", true)
      .order("start_time"),
    client
      .from("attendance")
      .select(
        "id, enrollment_id, class_slot_id, status, kind, charged, enrollment:enrollments(total_lessons, used_lessons, student:students(id, full_name, chess_level))",
      )
      .eq("center_id", centerId)
      .eq("session_date", date),
  ]);
  return composeTodaySessions(
    unwrapRows(slots) as unknown as SlotRow[],
    unwrapRows(attendance) as unknown as AttendanceRow[],
  );
};

export const markAttendance = async (
  client: CxClient,
  input: AttendanceInput & { classSlotId?: string | null },
) =>
  unwrap(
    await client.rpc("mark_attendance", {
      p_enrollment_id: input.enrollmentId,
      p_session_date: input.sessionDate,
      p_status: input.status,
      p_kind: input.kind,
      p_free: input.free,
      ...(input.classSlotId ? { p_class_slot_id: input.classSlotId } : {}),
      ...(input.note ? { p_note: input.note } : {}),
    }),
  );

export const unmarkAttendance = async (
  client: CxClient,
  attendanceId: string,
) =>
  unwrap(
    await client.rpc("unmark_attendance", { p_attendance_id: attendanceId }),
  );
