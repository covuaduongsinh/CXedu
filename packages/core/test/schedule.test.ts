import { describe, expect, it } from "vitest";

import { expectedEndDate, projectSessionDates, weekdayOf } from "../src/index";

describe("projectSessionDates", () => {
  it("xếp buổi theo lịch T3/T5, bỏ ngày nghỉ trung tâm và bảo lưu", () => {
    // 2026-10-20 là thứ Ba.
    expect(weekdayOf("2026-10-20")).toBe(2);
    const dates = projectSessionDates({
      startDate: "2026-10-20",
      weekdays: [2, 4],
      sessions: 4,
      closures: [{ start: "2026-10-22", end: "2026-10-22" }],
      pauses: [{ start: "2026-10-27", end: "2026-10-29" }],
    });
    expect(dates).toEqual([
      "2026-10-20",
      "2026-11-03",
      "2026-11-05",
      "2026-11-10",
    ]);
  });

  it("trả về null khi lịch rỗng", () => {
    expect(
      expectedEndDate({ startDate: "2026-10-20", weekdays: [], sessions: 3 }),
    ).toBeNull();
  });

  it("ngày kết thúc là buổi cuối cùng", () => {
    expect(
      expectedEndDate({ startDate: "2026-10-20", weekdays: [6], sessions: 2 }),
    ).toBe("2026-10-31");
  });
});
