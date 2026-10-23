export type AttendanceStatus = "present" | "excused" | "unexcused";

/** Loại buổi: lịch cố định, học bù, hoặc buổi lẻ đặt thêm. */
export type SessionKind = "regular" | "makeup" | "single";

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  kind?: SessionKind;
  /** Buổi tặng/miễn phí không trừ vào gói. */
  free?: boolean;
}

export interface ChargeContext {
  /** Số buổi vắng có phép đã được miễn trừ trước buổi này. */
  excusedUsed: number;
  /** Hạn mức vắng có phép của khóa; `null` = không giới hạn. */
  maxExcused: number | null;
}

/**
 * Quy tắc trừ buổi:
 * - Đi học, vắng không phép: trừ 1 buổi.
 * - Vắng có phép: không trừ khi còn trong hạn mức của khóa, vượt hạn mức thì trừ.
 * - Buổi miễn phí: không trừ.
 */
export const sessionCharge = (
  record: Pick<AttendanceRecord, "status" | "free">,
  context: ChargeContext,
): 0 | 1 => {
  if (record.free) return 0;
  if (record.status !== "excused") return 1;
  if (context.maxExcused === null) return 0;
  return context.excusedUsed < context.maxExcused ? 0 : 1;
};

export interface EnrollmentUsage {
  totalLessons: number;
  usedLessons: number;
  remainingLessons: number;
  excusedWaived: number;
  completed: boolean;
}

/** Tính số buổi đã dùng của một ghi danh từ lịch sử điểm danh (theo thứ tự thời gian). */
export const summarizeEnrollment = (
  totalLessons: number,
  records: readonly AttendanceRecord[],
  maxExcused: number | null,
): EnrollmentUsage => {
  let usedLessons = 0;
  let excusedWaived = 0;
  const ordered = [...records].sort((a, b) => a.date.localeCompare(b.date));
  for (const record of ordered) {
    const charge = sessionCharge(record, {
      excusedUsed: excusedWaived,
      maxExcused,
    });
    usedLessons += charge;
    if (record.status === "excused" && charge === 0 && !record.free)
      excusedWaived += 1;
  }
  const remainingLessons = Math.max(totalLessons - usedLessons, 0);
  return {
    totalLessons,
    usedLessons,
    remainingLessons,
    excusedWaived,
    completed: totalLessons > 0 && usedLessons >= totalLessons,
  };
};

export const isAbsent = (status: AttendanceStatus): boolean =>
  status !== "present";
