/**
 * Ngày học được biểu diễn bằng chuỗi `YYYY-MM-DD` (giờ địa phương của trung tâm),
 * tránh lệch múi giờ khi đồng bộ giữa server, web và mobile.
 */
export type IsoDate = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

export const parseIsoDate = (value: IsoDate): Date => {
  if (!ISO_DATE.test(value))
    throw new RangeError(`Ngày không hợp lệ: ${value}`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || toIsoDate(date) !== value)
    throw new RangeError(`Ngày không hợp lệ: ${value}`);
  return date;
};

export const toIsoDate = (date: Date): IsoDate =>
  date.toISOString().slice(0, 10);

export const addDays = (value: IsoDate, days: number): IsoDate => {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
};

/** 0 = Chủ nhật … 6 = Thứ bảy (giống `Date#getDay`). */
export const weekdayOf = (value: IsoDate): number =>
  parseIsoDate(value).getUTCDay();

export const WEEKDAY_LABELS = [
  "CN",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
] as const;

/** Ngày hôm nay theo múi giờ của trung tâm (mặc định Việt Nam). */
export const todayIn = (
  timeZone = "Asia/Ho_Chi_Minh",
  now = new Date(),
): IsoDate =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

export interface DateRange {
  start: IsoDate;
  end: IsoDate;
}

export const isWithin = (value: IsoDate, range: DateRange): boolean =>
  value >= range.start && value <= range.end;
