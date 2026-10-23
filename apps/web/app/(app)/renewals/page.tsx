import type { Metadata } from "next";
import Link from "next/link";
import { RENEWAL_STAGE_LABELS, renewalStage } from "@cxedu/core";

import { Badge, Card, Empty, PageHeader, buttonClass } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { createSupabaseServer } from "@/lib/supabase/server";

import { updateFollowup } from "../actions";

export const metadata: Metadata = { title: "Tái đăng ký" };

const STAGE_TONE = {
  needs_contact: "danger",
  following_up: "gold",
  invoice_sent: "primary",
  paid: "green",
} as const;

export default async function RenewalsPage() {
  const context = await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: rows } = await supabase
    .from("v_low_remaining")
    .select("*")
    .eq("org_id", context.org.id)
    .order("remaining_lessons");
  return (
    <>
      <PageHeader
        title="Tái đăng ký"
        subtitle={`Học viên còn ≤ ${context.org.low_remaining_threshold} buổi. Sắp hết buổi → liên hệ → gửi hóa đơn → đã đóng.`}
      />
      <Card>
        {(rows ?? []).length === 0 ? (
          <Empty>Không có học viên cần gia hạn.</Empty>
        ) : (
          <ul className="divide-y divide-line" data-testid="renewals">
            {(rows ?? []).map((row) => {
              const stage = renewalStage({
                followingUp: row.following_up ?? false,
                invoiceSent: row.invoice_sent ?? false,
                paid: row.paid ?? false,
              });
              return (
                <li
                  key={row.student_id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      href={`/students/${row.student_id}`}
                      className="font-medium hover:text-primary"
                    >
                      {row.full_name}
                    </Link>
                    <p className="text-xs text-muted">
                      {row.parent_name ?? "—"} ·{" "}
                      {row.parent_phone ?? "chưa có SĐT"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="orange">
                      Còn {row.remaining_lessons} buổi
                    </Badge>
                    <Badge tone={STAGE_TONE[stage]}>
                      {RENEWAL_STAGE_LABELS[stage]}
                    </Badge>
                    {!row.following_up && (
                      <form action={updateFollowup}>
                        <input
                          type="hidden"
                          name="studentId"
                          value={row.student_id ?? ""}
                        />
                        <input
                          type="hidden"
                          name="field"
                          value="following_up"
                        />
                        <input type="hidden" name="value" value="true" />
                        <button
                          type="submit"
                          className={buttonClass("ghost", "px-3 py-1")}
                        >
                          Đã liên hệ
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/invoices/new?studentId=${row.student_id}`}
                      className={buttonClass("accent", "px-3 py-1")}
                    >
                      Tạo hóa đơn
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
