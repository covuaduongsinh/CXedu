"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServer } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  ok?: string;
}

const credentials = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  next: z.string().startsWith("/").default("/dashboard"),
});

export async function signIn(
  _state: AuthState | null,
  form: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ",
    };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email hoặc mật khẩu chưa đúng" };
  redirect(parsed.data.next.startsWith("//") ? "/dashboard" : parsed.data.next);
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
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session)
    return { ok: "Đã gửi email xác nhận. Mở email để kích hoạt tài khoản." };
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
