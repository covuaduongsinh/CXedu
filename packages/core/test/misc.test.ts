import { describe, expect, it } from "vitest";

import {
  checkinQrPayload,
  matchesPhoneSuffix,
  nextChessLevel,
  normalizeVnPhone,
  parseCheckinQrPayload,
  renewalStage,
  rotatingCode,
  shiftIncome,
  studentInputSchema,
  verifyRotatingCode,
} from "../src/index.js";

const CENTER = "6f1c0b52-3c58-4c1a-9a43-1f0d2a7b9e10";

describe("rotating check-in code", () => {
  it("chấp nhận mã hiện tại và chu kỳ trước, từ chối mã đã hết hạn", async () => {
    const t0 = Date.UTC(2026, 9, 23, 3, 0, 0);
    const { code } = await rotatingCode("secret", CENTER, t0);
    expect(code).toMatch(/^[0-9a-f]{16}$/u);
    expect(
      await verifyRotatingCode("secret", CENTER, code, { nowMs: t0 + 30_000 }),
    ).toBe(true);
    expect(
      await verifyRotatingCode("secret", CENTER, code, { nowMs: t0 + 120_000 }),
    ).toBe(false);
    expect(await verifyRotatingCode("other", CENTER, code, { nowMs: t0 })).toBe(
      false,
    );
  });

  it("đóng gói và đọc nội dung QR", () => {
    const payload = checkinQrPayload(CENTER, "0123456789abcdef");
    expect(parseCheckinQrPayload(payload)).toEqual({
      centerId: CENTER,
      code: "0123456789abcdef",
    });
    expect(parseCheckinQrPayload("https://evil.example")).toBeNull();
  });
});

describe("teacher pay", () => {
  it("tính theo ca, theo học viên, linh hoạt", () => {
    const base = { sessionRate: 200_000, studentRate: 30_000, threshold: 5 };
    expect(shiftIncome({ ...base, mode: "per_session" }, 8)).toBe(200_000);
    expect(shiftIncome({ ...base, mode: "per_student" }, 8)).toBe(240_000);
    expect(shiftIncome({ ...base, mode: "flex" }, 8)).toBe(290_000);
    expect(shiftIncome({ ...base, mode: "flex" }, 3)).toBe(200_000);
  });
});

describe("misc", () => {
  it("chuẩn hóa số điện thoại và xác minh 4 số cuối", () => {
    expect(normalizeVnPhone("+84 983 119 819")).toBe("0983119819");
    expect(normalizeVnPhone("12345")).toBeNull();
    expect(matchesPhoneSuffix("0983.119.819", "9819")).toBe(true);
    expect(matchesPhoneSuffix("0983119819", "981")).toBe(false);
  });

  it("lộ trình cấp cờ vua và giai đoạn tái đăng ký", () => {
    expect(nextChessLevel("pawn")?.name).toBe("Mã");
    expect(nextChessLevel("king")).toBeNull();
    expect(renewalStage(null)).toBe("needs_contact");
    expect(
      renewalStage({ followingUp: true, invoiceSent: true, paid: false }),
    ).toBe("invoice_sent");
  });

  it("kiểm tra dữ liệu học viên", () => {
    const parsed = studentInputSchema.parse({
      centerId: CENTER,
      fullName: "  Nguyễn Minh An ",
      parentEmail: "",
    });
    expect(parsed).toMatchObject({
      fullName: "Nguyễn Minh An",
      chessLevel: "pawn",
      parentEmail: null,
    });
    expect(() =>
      studentInputSchema.parse({ centerId: CENTER, fullName: "A" }),
    ).toThrow();
  });
});
