import { describe, expect, it } from "vitest";

import { hasConsecutiveAbsences, lowRemainingAlerts } from "../src/index";

describe("lowRemainingAlerts", () => {
  it("cộng buổi còn lại của các khóa có phí đang học theo từng học viên", () => {
    const alerts = lowRemainingAlerts(
      [
        {
          studentId: "a",
          totalLessons: 12,
          usedLessons: 10,
          status: "active",
          paid: true,
        },
        {
          studentId: "a",
          totalLessons: 8,
          usedLessons: 7,
          status: "active",
          paid: true,
        },
        {
          studentId: "b",
          totalLessons: 12,
          usedLessons: 2,
          status: "active",
          paid: true,
        },
        {
          studentId: "c",
          totalLessons: 4,
          usedLessons: 3,
          status: "active",
          paid: false,
        },
        {
          studentId: "d",
          totalLessons: 8,
          usedLessons: 7,
          status: "stopped",
          paid: true,
        },
      ],
      4,
    );
    expect(alerts).toEqual([{ studentId: "a", remainingLessons: 3 }]);
  });
});

describe("hasConsecutiveAbsences", () => {
  const history = (statuses: ("present" | "excused" | "unexcused")[]) =>
    statuses.map((status, index) => ({
      date: `2026-10-${String(index + 10)}`,
      status,
    }));

  it("báo khi 2 buổi mới nhất trong 5 buổi gần nhất đều vắng", () => {
    expect(
      hasConsecutiveAbsences(
        history(["present", "present", "present", "excused", "unexcused"]),
      ),
    ).toBe(true);
  });

  it("không tính chuỗi vắng → đi học → vắng", () => {
    expect(
      hasConsecutiveAbsences(
        history(["present", "present", "unexcused", "present", "unexcused"]),
      ),
    ).toBe(false);
  });

  it("không báo khi chưa đủ buổi", () => {
    expect(hasConsecutiveAbsences(history(["unexcused"]))).toBe(false);
  });
});
