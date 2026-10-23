import { useQuery } from "@tanstack/react-query";
import { unwrapRows } from "@cxedu/api";

import { cx } from "./cx";

/** Tổ chức + cơ sở đầu tiên mà người dùng được phân công (chọn cơ sở khác ở bản sau). */
export const useWorkspace = (userId: string | undefined) =>
  useQuery({
    queryKey: ["workspace", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const memberships = unwrapRows(
        await cx
          .from("memberships")
          .select("role, org:organizations(id, name, timezone)")
          .eq("user_id", userId ?? ""),
      );
      const membership = memberships[0];
      if (!membership?.org) return null;
      const centers = unwrapRows(
        await cx
          .from("centers")
          .select("id, name")
          .eq("org_id", membership.org.id)
          .order("created_at"),
      );
      return {
        role: membership.role,
        org: membership.org,
        centers,
        center: centers[0] ?? null,
      };
    },
  });
