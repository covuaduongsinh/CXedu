import { isAbsent, type AttendanceStatus } from "./attendance";

export const DEFAULT_LOW_REMAINING_THRESHOLD = 4;

export interface EnrollmentSnapshot {
  studentId: string;
  totalLessons: number;
  usedLessons: number;
  status: "active" | "paused" | "completed" | "stopped";
  /** Khóa có học phí; khóa tặng không đưa vào cảnh báo tái đăng ký. */
  paid: boolean;
}

export interface LowRemainingAlert {
  studentId: string;
  remainingLessons: number;
}

/**
 * Học viên sắp hết buổi: tổng buổi còn lại của các ghi danh có phí đang học
 * nhỏ hơn hoặc bằng ngưỡng (cấu hình theo tổ chức).
 */
export const lowRemainingAlerts = (
  enrollments: readonly EnrollmentSnapshot[],
  threshold = DEFAULT_LOW_REMAINING_THRESHOLD,
): LowRemainingAlert[] => {
  const remainingByStudent = new Map<string, number>();
  for (const enrollment of enrollments) {
    if (!enrollment.paid || enrollment.status !== "active") continue;
    const remaining = Math.max(
      enrollment.totalLessons - enrollment.usedLessons,
      0,
    );
    remainingByStudent.set(
      enrollment.studentId,
      (remainingByStudent.get(enrollment.studentId) ?? 0) + remaining,
    );
  }
  return [...remainingByStudent]
    .filter(([, remaining]) => remaining <= threshold)
    .map(([studentId, remainingLessons]) => ({ studentId, remainingLessons }))
    .sort((a, b) => a.remainingLessons - b.remainingLessons);
};

export interface ConsecutiveAbsenceRule {
  /** Số buổi gần nhất được xét. */
  window: number;
  /** Số buổi vắng liền nhau ở cuối chuỗi để cảnh báo. */
  streak: number;
}

export const DEFAULT_CONSECUTIVE_ABSENCE_RULE: ConsecutiveAbsenceRule = {
  window: 5,
  streak: 2,
};

/**
 * Vắng liên tiếp: trong `window` buổi gần nhất, `streak` buổi mới nhất đều vắng
 * (có phép hoặc không phép). Chuỗi vắng → đi học → vắng không bị tính.
 */
export const hasConsecutiveAbsences = (
  history: readonly { date: string; status: AttendanceStatus }[],
  rule: ConsecutiveAbsenceRule = DEFAULT_CONSECUTIVE_ABSENCE_RULE,
): boolean => {
  const recent = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-rule.window);
  if (recent.length < rule.streak) return false;
  return recent.slice(-rule.streak).every((entry) => isAbsent(entry.status));
};
