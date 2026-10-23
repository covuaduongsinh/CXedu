import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CxClient } from "@cxedu/api";
import type { Database } from "@cxedu/db";

import { env } from "../env";

export const createSupabaseServer = async (): Promise<CxClient> => {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet)
            cookieStore.set(name, value, options);
        } catch {
          // Server Component không ghi cookie được; proxy.ts đã làm mới phiên.
        }
      },
    },
  }) as unknown as CxClient;
};
