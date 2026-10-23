/**
 * Mã QR check-in xoay vòng: hiển thị ở lễ tân, đổi sau mỗi `periodSeconds`.
 * Giáo viên phải quét trực tiếp tại trung tâm; ảnh chụp lại sẽ hết hạn.
 * Dùng Web Crypto nên chạy được trên trình duyệt, Node, Deno (Edge Functions) và Tauri.
 */

export const DEFAULT_CODE_PERIOD_SECONDS = 45;

export interface RotatingCode {
  code: string;
  counter: number;
  expiresAt: number;
}

const encoder = new TextEncoder();

const hmacHex = async (secret: string, message: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const counterAt = (nowMs: number, periodSeconds: number): number =>
  Math.floor(nowMs / 1000 / periodSeconds);

const codeFor = async (secret: string, centerId: string, counter: number) =>
  (await hmacHex(secret, `${centerId}:${counter}`)).slice(0, 16);

export const rotatingCode = async (
  secret: string,
  centerId: string,
  nowMs = Date.now(),
  periodSeconds = DEFAULT_CODE_PERIOD_SECONDS,
): Promise<RotatingCode> => {
  const counter = counterAt(nowMs, periodSeconds);
  return {
    code: await codeFor(secret, centerId, counter),
    counter,
    expiresAt: (counter + 1) * periodSeconds * 1000,
  };
};

export interface VerifyOptions {
  nowMs?: number;
  periodSeconds?: number;
  /** Số chu kỳ liền trước vẫn được chấp nhận (bù trễ mạng). */
  skew?: number;
}

/** Chấp nhận mã của chu kỳ hiện tại và `skew` chu kỳ liền trước. */
export const verifyRotatingCode = async (
  secret: string,
  centerId: string,
  code: string,
  options: VerifyOptions = {},
): Promise<boolean> => {
  const {
    nowMs = Date.now(),
    periodSeconds = DEFAULT_CODE_PERIOD_SECONDS,
    skew = 1,
  } = options;
  const current = counterAt(nowMs, periodSeconds);
  for (let offset = 0; offset <= skew; offset += 1) {
    if ((await codeFor(secret, centerId, current - offset)) === code)
      return true;
  }
  return false;
};

/** Nội dung QR: định danh trung tâm + mã, để app mobile gửi lên server xác thực. */
export const checkinQrPayload = (centerId: string, code: string): string =>
  `cxedu:checkin:${centerId}:${code}`;

export const parseCheckinQrPayload = (
  payload: string,
): { centerId: string; code: string } | null => {
  const match = /^cxedu:checkin:([0-9a-f-]{36}):([0-9a-f]{16})$/u.exec(payload);
  return match?.[1] && match[2] ? { centerId: match[1], code: match[2] } : null;
};
