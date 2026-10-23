"use server";

import { z } from "zod";

import { createSupabaseServer } from "@/lib/supabase/server";

export interface PortalData {
  student: {
    full_name: string;
    chess_level: string;
    rating: number | null;
    enrolled_on: string;
    parent_name: string | null;
  };
  center: {
    name: string;
    phone: string | null;
    address: string | null;
    org_name: string;
  } | null;
  enrollments: {
    course: string;
    total_lessons: number;
    used_lessons: number;
    status: string;
    start_date: string;
    expected_end_date: string | null;
  }[];
  attendance: {
    date: string;
    status: "present" | "excused" | "unexcused";
    kind: string;
    note: string | null;
  }[];
  levels: { from: string | null; to: string; date: string }[];
  reviews: { body: string; date: string }[];
  invoices: {
    number: string;
    issue_date: string;
    total: number;
    paid: number;
    status: string;
    transfer_ref: string;
  }[];
}

export type PortalState = { error?: string; data?: PortalData } | null;

export async function openPortal(
  _state: PortalState,
  form: FormData,
): Promise<PortalState> {
  const token = z
    .string()
    .regex(/^[0-9a-f]{32}$/u)
    .safeParse(form.get("token"));
  const suffix = z
    .string()
    .regex(/^\d{4}$/u)
    .safeParse(form.get("suffix"));
  if (!token.success) return { error: "Link không hợp lệ" };
  if (!suffix.success)
    return { error: "Nhập đúng 4 số cuối điện thoại phụ huynh" };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("get_parent_portal", {
    p_token: token.data,
    p_phone_suffix: suffix.data,
  });
  if (error) return { error: "Không mở được thông tin, vui lòng thử lại" };
  if (!data) return { error: "Thông tin xác minh chưa đúng" };
  await supabase.rpc("touch_parent_portal", { p_token: token.data });
  return { data: data as unknown as PortalData };
}
