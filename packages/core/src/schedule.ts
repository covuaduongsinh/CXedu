import {
  addDays,
  isWithin,
  weekdayOf,
  type DateRange,
  type IsoDate,
} from "./dates.js";

export interface ProjectionInput {
  /** Ngày bắt đầu học (tính cả ngày này nếu trùng lịch). */
  startDate: IsoDate;
  /** Các thứ trong tuần có lịch: 0 = CN … 6 = T7. */
  weekdays: readonly number[];
  /** Số buổi cần xếp. */
  sessions: number;
  /** Ngày nghỉ của trung tâm (lễ, Tết…). */
  closures?: readonly DateRange[];
  /** Khoảng bảo lưu của học viên. */
  pauses?: readonly DateRange[];
}

/** Giới hạn an toàn để không lặp vô hạn khi lịch rỗng hoặc bị nghỉ quá dài. */
const MAX_SCAN_DAYS = 3 * 366;

/** Liệt kê các ngày học dự kiến theo lịch tuần, bỏ qua ngày nghỉ và bảo lưu. */
export const projectSessionDates = (input: ProjectionInput): IsoDate[] => {
  const weekdays = new Set(input.weekdays);
  const blocked = [...(input.closures ?? []), ...(input.pauses ?? [])];
  const dates: IsoDate[] = [];
  if (input.sessions <= 0 || weekdays.size === 0) return dates;
  let cursor = input.startDate;
  for (let scanned = 0; scanned < MAX_SCAN_DAYS; scanned += 1) {
    if (
      weekdays.has(weekdayOf(cursor)) &&
      !blocked.some((range) => isWithin(cursor, range))
    ) {
      dates.push(cursor);
      if (dates.length === input.sessions) break;
    }
    cursor = addDays(cursor, 1);
  }
  return dates;
};

/** Ngày kết thúc dự kiến, hoặc `null` khi không xếp đủ buổi. */
export const expectedEndDate = (input: ProjectionInput): IsoDate | null => {
  const dates = projectSessionDates(input);
  return dates.length === input.sessions && dates.length > 0
    ? (dates.at(-1) ?? null)
    : null;
};
