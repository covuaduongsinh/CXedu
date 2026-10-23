"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  signInWithPassword,
  signOut as apiSignOut,
  signUpWithPassword,
} from "@cxedu/api";

import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/cx/server";
import { env } from "@/lib/env";

export interface AuthState {
  error?: string;
  ok?: string;
}

const credentials = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  next: z.string().startsWith("/").default("/dashboard"),
});

const safeNext = (next: string) =>
  next.startsWith("//") ? "/dashboard" : next;

export async function signIn(
  _state: AuthState | null,
  form: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ",
    };
  const result = await signInWithPassword(
    env.apiInternalUrl,
    { email: parsed.data.email, password: parsed.data.password },
    env.appUrl,
  );
  if (!result.ok) return { error: "Email hoặc mật khẩu chưa đúng" };
  (await cookies()).set(
    SESSION_COOKIE,
    result.sessionToken,
    sessionCookieOptions,
  );
  redirect(safeNext(parsed.data.next));
}

export async function signUp(
  _state: AuthState | null,
  form: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ",
    };
  const name = parsed.data.email.split("@")[0] ?? parsed.data.email;
  const result = await signUpWithPassword(
    env.apiInternalUrl,
    { email: parsed.data.email, password: parsed.data.password, name },
    env.appUrl,
  );
  if (!result.ok) {
    return {
      error: result.error.startsWith("USER_ALREADY_EXISTS")
        ? "Email đã được đăng ký"
        : "Không tạo được tài khoản",
    };
  }
  (await cookies()).set(
    SESSION_COOKIE,
    result.sessionToken,
    sessionCookieOptions,
  );
  redirect("/onboarding");
}

export async function signOut() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionToken)
    await apiSignOut(env.apiInternalUrl, sessionToken, env.appUrl);
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
