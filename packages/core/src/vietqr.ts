/**
 * Tạo chuỗi VietQR (chuẩn EMVCo Merchant-Presented Mode theo NAPAS) để in lên
 * hóa đơn. App ngân hàng quét sẽ tự điền số tài khoản, số tiền và nội dung.
 */

export const VIETQR_BANKS = {
  VCB: { bin: "970436", name: "Vietcombank" },
  TCB: { bin: "970407", name: "Techcombank" },
  MB: { bin: "970422", name: "MB Bank" },
  ACB: { bin: "970416", name: "ACB" },
  BIDV: { bin: "970418", name: "BIDV" },
  ICB: { bin: "970415", name: "VietinBank" },
  VBA: { bin: "970405", name: "Agribank" },
  TPB: { bin: "970423", name: "TPBank" },
  VPB: { bin: "970432", name: "VPBank" },
  STB: { bin: "970403", name: "Sacombank" },
  VIB: { bin: "970441", name: "VIB" },
  OCB: { bin: "970448", name: "OCB" },
  MSB: { bin: "970426", name: "MSB" },
  SHB: { bin: "970443", name: "SHB" },
  HDB: { bin: "970437", name: "HDBank" },
} as const;

export type VietQrBankCode = keyof typeof VIETQR_BANKS;

export interface VietQrInput {
  bankBin: string;
  accountNumber: string;
  /** Số tiền VND; bỏ trống để tạo QR tĩnh (người chuyển tự nhập tiền). */
  amount?: number;
  /** Nội dung chuyển khoản (tối đa 25 ký tự để mọi ngân hàng hiển thị đủ). */
  message?: string;
}

const NAPAS_GUID = "A000000727";
const SERVICE_TO_ACCOUNT = "QRIBFTTA";

const field = (id: string, value: string): string => {
  if (value.length > 99) throw new RangeError(`Trường ${id} quá dài`);
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
};

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — bắt buộc ở trường 63. */
export const crc16Ccitt = (input: string): string => {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(input)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

/** Bỏ dấu tiếng Việt và ký tự lạ để nội dung CK hiển thị ổn định ở mọi ngân hàng. */
export const sanitizeTransferMessage = (message: string): string =>
  message
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gu, "d")
    .replace(/Đ/gu, "D")
    .replace(/[^A-Za-z0-9 ]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 25)
    .trimEnd();

export const buildVietQrPayload = (input: VietQrInput): string => {
  if (!/^\d{6}$/u.test(input.bankBin))
    throw new RangeError("Mã BIN ngân hàng phải gồm 6 chữ số");
  if (!/^[0-9A-Za-z]{4,19}$/u.test(input.accountNumber))
    throw new RangeError("Số tài khoản không hợp lệ");
  const amount =
    input.amount === undefined
      ? undefined
      : Math.round(input.amount).toString();
  if (amount !== undefined && (Number(amount) <= 0 || amount.length > 13))
    throw new RangeError("Số tiền không hợp lệ");
  const beneficiary =
    field("00", input.bankBin) + field("01", input.accountNumber);
  const merchantAccount =
    field("00", NAPAS_GUID) +
    field("01", beneficiary) +
    field("02", SERVICE_TO_ACCOUNT);
  const message = input.message ? sanitizeTransferMessage(input.message) : "";
  const body = [
    field("00", "01"),
    field("01", amount === undefined ? "11" : "12"),
    field("38", merchantAccount),
    field("53", "704"),
    amount === undefined ? "" : field("54", amount),
    field("58", "VN"),
    message ? field("62", field("08", message)) : "",
    "6304",
  ].join("");
  return body + crc16Ccitt(body);
};

/** Tách chuỗi EMV thành các trường cấp 1 (dùng để kiểm tra). */
export const parseEmvFields = (payload: string): Map<string, string> => {
  const fields = new Map<string, string>();
  let cursor = 0;
  while (cursor < payload.length) {
    const id = payload.slice(cursor, cursor + 2);
    const length = Number(payload.slice(cursor + 2, cursor + 4));
    if (!Number.isInteger(length))
      throw new SyntaxError(`Độ dài lỗi tại ${cursor}`);
    fields.set(id, payload.slice(cursor + 4, cursor + 4 + length));
    cursor += 4 + length;
  }
  return fields;
};
