"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { CxClient } from "@cxedu/api";
import type { Database } from "@cxedu/db";

let client: CxClient | null = null;

export const getSupabaseBrowser = (): CxClient => {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  ) as unknown as CxClient;
  return client;
};
