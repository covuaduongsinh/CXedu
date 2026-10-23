"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServer } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(2, "Nhập tên trung tâm/CLB").max(120),
  centerName: z.string().trim().max(120).optional(),
});

export async function createOrganization(
  _state: { error?: string } | null,
  form: FormData,
) {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ",
    };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    ...(parsed.data.centerName
      ? { p_center_name: parsed.data.centerName }
      : {}),
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
}
