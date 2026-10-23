import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Tables } from "@cxedu/db";

import { createCxServer, getServerSession } from "./cx/server";

export const ORG_COOKIE = "cx_org";
export const CENTER_COOKIE = "cx_center";

export interface AppContext {
  userId: string;
  email: string | null;
  org: Tables<"organizations">;
  role: Tables<"memberships">["role"];
  isAdmin: boolean;
  centers: Tables<"centers">[];
  center: Tables<"centers">;
}

/** Ngữ cảnh làm việc: người dùng, tổ chức đang chọn, cơ sở đang chọn. */
export const getAppContext = cache(async (): Promise<AppContext> => {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const { user } = session;
  const db = await createCxServer();

  const { data: memberships } = await db
    .from("memberships")
    .select("role, org:organizations(*)")
    .eq("user_id", user.id);
  if (!memberships?.length) redirect("/onboarding");

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ORG_COOKIE)?.value;
  const membership =
    memberships.find((m) => m.org?.id === wanted) ?? memberships[0];
  const org = membership?.org;
  if (!membership || !org) redirect("/onboarding");

  const { data: centers } = await db
    .from("centers")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at");
  const centerList = centers ?? [];
  const wantedCenter = cookieStore.get(CENTER_COOKIE)?.value;
  const center = centerList.find((c) => c.id === wantedCenter) ?? centerList[0];
  if (!center) redirect("/onboarding");

  return {
    userId: user.id,
    email: user.email,
    org,
    role: membership.role,
    isAdmin: membership.role !== "teacher",
    centers: centerList,
    center,
  };
});

export const requireAdmin = async (): Promise<AppContext> => {
  const context = await getAppContext();
  if (!context.isAdmin) redirect("/attendance");
  return context;
};
