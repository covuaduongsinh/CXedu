import { PostgrestClient } from "@supabase/postgrest-js";
import type { Database } from "@cxedu/db";

import { createRealtimeClient, type RealtimeClient } from "./realtime";

/**
 * Client dữ liệu của CX Platform: truy vấn bảng/RPC qua PostgREST (cổng `/rest/v1` của CX API)
 * và nhận thay đổi qua `/realtime`. Dùng chung cho web (server + trình duyệt), mobile, desktop.
 */
export type CxClient = PostgrestClient<Database> & { realtime: RealtimeClient };

export interface CxClientOptions {
  /** Địa chỉ CX API, ví dụ https://api.cxedu.vn hoặc http://localhost:8787. */
  apiUrl: string;
  /** JWT truy cập hiện tại; `null` = khách (chỉ gọi được RPC công khai như cổng phụ huynh). */
  getAccessToken: () => Promise<string | null>;
  /** Tắt realtime ở nơi không cần (server component). */
  realtime?: boolean;
}

const trimSlash = (url: string) => url.replace(/\/+$/u, "");

export const createCxClient = (options: CxClientOptions): CxClient => {
  const apiUrl = trimSlash(options.apiUrl);
  const authedFetch: typeof fetch = async (input, init) => {
    const token = await options.getAccessToken();
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };
  const rest = new PostgrestClient<Database>(`${apiUrl}/rest/v1`, {
    fetch: authedFetch,
  });
  const realtime = createRealtimeClient({
    url: `${apiUrl.replace(/^http/u, "ws")}/realtime`,
    getAccessToken: options.getAccessToken,
    enabled: options.realtime ?? true,
  });
  return Object.assign(rest, { realtime });
};

/** Lỗi PostgREST → Error có thông điệp tiếng Việt từ database (RAISE EXCEPTION). */
export const unwrap = <T>(result: {
  data: T;
  error: { message: string } | null;
}): T => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

/** Như `unwrap` cho truy vấn danh sách: `null` → mảng rỗng. */
export const unwrapRows = <T>(result: {
  data: T[] | null;
  error: { message: string } | null;
}): T[] => unwrap(result) ?? [];
