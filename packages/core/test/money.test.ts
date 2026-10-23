import { describe, expect, it } from "vitest";

import {
  formatVnd,
  invoiceAmounts,
  invoiceStatus,
  transferReference,
} from "../src/index.js";

describe("invoice", () => {
  it("tính tổng, giảm giá, công nợ", () => {
    const amounts = invoiceAmounts(
      [
        { quantity: 1, unitPrice: 1_600_000 },
        { quantity: 2, unitPrice: 150_000 },
      ],
      100_000,
      1_000_000,
    );
    expect(amounts).toEqual({
      subtotal: 1_900_000,
      discount: 100_000,
      total: 1_800_000,
      paid: 1_000_000,
      balance: 800_000,
    });
  });

  it("xác định trạng thái hóa đơn", () => {
    expect(
      invoiceStatus({ total: 100, paid: 100 }, "2026-01-01", "2026-10-23"),
    ).toBe("paid");
    expect(
      invoiceStatus({ total: 100, paid: 0 }, "2026-10-01", "2026-10-23"),
    ).toBe("overdue");
    expect(invoiceStatus({ total: 100, paid: 50 }, null, "2026-10-23")).toBe(
      "partial",
    );
  });

  it("định dạng tiền và mã đối soát", () => {
    expect(formatVnd(1_250_000)).toBe("1.250.000đ");
    expect(transferReference("ds", "hd-0012")).toBe("DSHD0012");
  });
});
