import { describe, expect, it } from "vitest";

import { sessionCharge, summarizeEnrollment } from "../src/index";

describe("sessionCharge", () => {
  it("trừ buổi khi đi học hoặc vắng không phép", () => {
    const context = { excusedUsed: 0, maxExcused: 2 };
    expect(sessionCharge({ status: "present" }, context)).toBe(1);
    expect(sessionCharge({ status: "unexcused" }, context)).toBe(1);
  });

  it("miễn trừ vắng có phép trong hạn mức, vượt hạn mức thì trừ", () => {
    expect(
      sessionCharge({ status: "excused" }, { excusedUsed: 1, maxExcused: 2 }),
    ).toBe(0);
    expect(
      sessionCharge({ status: "excused" }, { excusedUsed: 2, maxExcused: 2 }),
    ).toBe(1);
    expect(
      sessionCharge(
        { status: "excused" },
        { excusedUsed: 9, maxExcused: null },
      ),
    ).toBe(0);
  });

  it("không trừ buổi miễn phí", () => {
    expect(
      sessionCharge(
        { status: "present", free: true },
        { excusedUsed: 0, maxExcused: 0 },
      ),
    ).toBe(0);
  });
});

describe("summarizeEnrollment", () => {
  it("tính buổi còn lại theo thứ tự thời gian và hạn mức vắng có phép", () => {
    const usage = summarizeEnrollment(
      8,
      [
        { date: "2026-10-05", status: "excused" },
        { date: "2026-10-01", status: "present" },
        { date: "2026-10-08", status: "excused" },
        { date: "2026-10-12", status: "unexcused" },
        { date: "2026-10-15", status: "present", free: true },
      ],
      1,
    );
    expect(usage).toEqual({
      totalLessons: 8,
      usedLessons: 3,
      remainingLessons: 5,
      excusedWaived: 1,
      completed: false,
    });
  });

  it("đánh dấu hoàn thành khi dùng hết buổi", () => {
    const records = Array.from({ length: 4 }, (_, index) => ({
      date: `2026-10-0${index + 1}`,
      status: "present" as const,
    }));
    expect(summarizeEnrollment(4, records, 0)).toMatchObject({
      remainingLessons: 0,
      completed: true,
    });
  });
});
