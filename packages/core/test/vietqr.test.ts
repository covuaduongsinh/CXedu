import { describe, expect, it } from "vitest";

import {
  buildVietQrPayload,
  crc16Ccitt,
  parseEmvFields,
  sanitizeTransferMessage,
} from "../src/index";

describe("crc16Ccitt", () => {
  it("khớp giá trị kiểm tra chuẩn CRC-16/CCITT-FALSE", () => {
    expect(crc16Ccitt("123456789")).toBe("29B1");
  });
});

describe("buildVietQrPayload", () => {
  it("tạo QR động có số tiền, nội dung và CRC hợp lệ", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "0011001932418",
      amount: 1_600_000,
      message: "Học phí DSHD0012",
    });
    const fields = parseEmvFields(payload);
    expect(fields.get("00")).toBe("01");
    expect(fields.get("01")).toBe("12");
    expect(fields.get("38")).toBe(
      "0010A000000727" +
        "0127" +
        "0006970436" +
        "0113" +
        "0011001932418" +
        "0208QRIBFTTA",
    );
    expect(fields.get("53")).toBe("704");
    expect(fields.get("54")).toBe("1600000");
    expect(fields.get("58")).toBe("VN");
    expect(fields.get("62")).toBe("0816Hoc phi DSHD0012");
    expect(payload.slice(-4)).toBe(crc16Ccitt(payload.slice(0, -4)));
  });

  it("tạo QR tĩnh khi không có số tiền", () => {
    const fields = parseEmvFields(
      buildVietQrPayload({ bankBin: "970407", accountNumber: "19033334444" }),
    );
    expect(fields.get("01")).toBe("11");
    expect(fields.has("54")).toBe(false);
  });

  it("từ chối dữ liệu sai", () => {
    expect(() =>
      buildVietQrPayload({ bankBin: "12", accountNumber: "123456" }),
    ).toThrow(RangeError);
    expect(() =>
      buildVietQrPayload({
        bankBin: "970436",
        accountNumber: "1234",
        amount: -5,
      }),
    ).toThrow(RangeError);
  });

  it("bỏ dấu nội dung chuyển khoản", () => {
    expect(sanitizeTransferMessage("Đóng học phí bé Ánh – khóa Tốt")).toBe(
      "Dong hoc phi be Anh khoa",
    );
  });
});
