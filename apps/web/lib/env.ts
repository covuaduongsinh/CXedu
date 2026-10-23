const required = (name: string, value: string | undefined): string => {
  if (!value)
    throw new Error(
      `Thiếu biến môi trường ${name} (xem apps/web/.env.example)`,
    );
  return value;
};

export const env = {
  /** CX API mà trình duyệt/mobile gọi tới (công khai). */
  apiUrl: required(
    "NEXT_PUBLIC_CX_API_URL",
    process.env.NEXT_PUBLIC_CX_API_URL,
  ),
  /** Địa chỉ CX API từ phía server Next.js (mạng nội bộ Docker); mặc định = địa chỉ công khai. */
  apiInternalUrl:
    process.env.CX_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_CX_API_URL ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
