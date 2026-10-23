import { describe, expect, it } from "vitest";

import { composeTodaySessions } from "../src/attendance";

const student = (id: string, name: string, status = "active") => ({
  id,
  full_name: name,
  chess_level: "pawn" as const,
  status,
});

describe("composeTodaySessions", () => {
  it("ghép học viên theo lớp, gắn điểm danh, gom học bù vào nhóm riêng", () => {
    const sessions = composeTodaySessions(
      [
        {
          id: "slot-1",
          name: "Lớp Cấp Tốt",
          start_time: "17:30:00",
          end_time: "19:00:00",
          course: { name: "Cấp Tốt" },
          enrollment_schedules: [
            {
              enrollment: {
                id: "e-2",
                total_lessons: 16,
                used_lessons: 15,
                status: "active",
                student: student("s-2", "Trần Bảo"),
              },
            },
            {
              enrollment: {
                id: "e-1",
                total_lessons: 16,
                used_lessons: 3,
                status: "active",
                student: student("s-1", "An"),
              },
            },
            {
              enrollment: {
                id: "e-3",
                total_lessons: 16,
                used_lessons: 3,
                status: "active",
                student: student("s-3", "Nghỉ", "stopped"),
              },
            },
          ],
        },
      ],
      [
        {
          id: "a-1",
          enrollment_id: "e-2",
          class_slot_id: "slot-1",
          status: "present",
          kind: "regular",
          charged: 1,
          enrollment: null,
        },
        {
          id: "a-2",
          enrollment_id: "e-9",
          class_slot_id: null,
          status: "present",
          kind: "makeup",
          charged: 1,
          enrollment: {
            total_lessons: 20,
            used_lessons: 5,
            student: { id: "s-9", full_name: "Học bù", chess_level: "rook" },
          },
        },
      ],
    );
    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.startTime).toBe("17:30");
    expect(sessions[0]?.students.map((s) => s.fullName)).toEqual([
      "An",
      "Trần Bảo",
    ]);
    expect(sessions[0]?.students[1]?.attendance?.status).toBe("present");
    expect(sessions[0]?.students[1]?.remainingLessons).toBe(1);
    expect(sessions[1]?.slotId).toBeNull();
    expect(sessions[1]?.students[0]?.fullName).toBe("Học bù");
  });
});
