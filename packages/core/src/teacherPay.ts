/**
 * Cách tính thu nhập một ca dạy:
 * - `per_session`: tiền cố định mỗi ca.
 * - `per_student`: đơn giá × số học viên có mặt.
 * - `flex`: lương cứng mỗi ca cho tới `threshold` học viên, vượt ngưỡng cộng thêm theo đầu học viên.
 */
export type PayMode = "per_session" | "per_student" | "flex";

export interface PayRate {
  mode: PayMode;
  sessionRate: number;
  studentRate: number;
  threshold: number;
}

export const shiftIncome = (
  rate: PayRate,
  attendingStudents: number,
): number => {
  const students = Math.max(Math.floor(attendingStudents), 0);
  switch (rate.mode) {
    case "per_session":
      return rate.sessionRate;
    case "per_student":
      return rate.studentRate * students;
    case "flex":
      return (
        rate.sessionRate +
        Math.max(students - rate.threshold, 0) * rate.studentRate
      );
  }
};

export interface PayrollLine {
  income: number;
  lateMinutes?: number;
}

export const payrollSummary = (
  lines: readonly PayrollLine[],
  advances: number,
) => {
  const earned = lines.reduce((sum, line) => sum + line.income, 0);
  return { earned, advances, payable: earned - advances };
};
