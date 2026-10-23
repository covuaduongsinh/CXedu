"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { CENTER_COOKIE } from "@/lib/session";

export async function switchCenter(form: FormData) {
  const centerId = String(form.get("centerId") ?? "");
  const cookieStore = await cookies();
  cookieStore.set(CENTER_COOKIE, centerId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
