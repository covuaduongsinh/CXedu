import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cxedu/db";

export type CxClient = SupabaseClient<Database>;

export interface CxClientOptions {
  url: string;
  anonKey: string;
  /** AsyncStorage/SecureStore trên mobile; mặc định localStorage trên web. */
  storage?: {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
    removeItem: (key: string) => void | Promise<void>;
  };
  /** Mobile/desktop không dùng URL callback của trình duyệt. */
  detectSessionInUrl?: boolean;
}

export const createCxClient = (options: CxClientOptions): CxClient =>
  createClient<Database>(options.url, options.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: options.detectSessionInUrl ?? true,
      ...(options.storage ? { storage: options.storage } : {}),
    },
  });

/** Lỗi Supabase → Error có thông điệp tiếng Việt từ database (RAISE EXCEPTION). */
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
