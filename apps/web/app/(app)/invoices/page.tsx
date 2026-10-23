import type { Metadata } from "next";
import Link from "next/link";
import {
  INVOICE_STATUS_LABELS,
  formatVnd,
  invoiceStatus,
  todayIn,
} from "@cxedu/core";

import { Badge, Card, Empty, PageHeader, buttonClass } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Hóa đơn" };

const TONE = {
  unpaid: "orange",
  partial: "gold",
  paid: "green",
  overdue: "danger",
} as const;

export default async function InvoicesPage() {
  const context = await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, number, issue_date, due_date, total, paid_amount, status, student:students(full_name, parent_name)",
    )
    .eq("org_id", context.org.id)
    .neq("status", "void")
    .order("created_at", { ascending: false })
    .limit(200);
  const today = todayIn(context.org.timezone);
  const outstanding = (invoices ?? []).reduce(
    (sum, inv) => sum + Math.max(inv.total - inv.paid_amount, 0),
    0,
  );
  return (
    <>
      <PageHeader
        title="Hóa đơn"
        subtitle={`Còn phải thu ${formatVnd(outstanding)}`}
        action={
          <Link href="/invoices/new" className={buttonClass("accent")}>
            Tạo hóa đơn
          </Link>
        }
      />
      <Card>
        {(invoices ?? []).length === 0 ? (
          <Empty>Chưa có hóa đơn.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted uppercase">
                <tr>
                  <th className="py-2">Số HĐ</th>
                  <th>Học viên</th>
                  <th>Ngày</th>
                  <th className="text-right">Cần đóng</th>
                  <th className="text-right">Đã thu</th>
                  <th className="text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(invoices ?? []).map((invoice) => {
                  const status = invoiceStatus(
                    { total: invoice.total, paid: invoice.paid_amount },
                    invoice.due_date,
                    today,
                  );
                  return (
                    <tr key={invoice.id}>
                      <td className="py-2">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {invoice.number}
                        </Link>
                      </td>
                      <td>{invoice.student?.full_name ?? "Khách lẻ"}</td>
                      <td className="text-muted">
                        {invoice.issue_date.split("-").reverse().join("/")}
                      </td>
                      <td className="text-right">{formatVnd(invoice.total)}</td>
                      <td className="text-right">
                        {formatVnd(invoice.paid_amount)}
                      </td>
                      <td className="text-right">
                        <Badge tone={TONE[status]}>
                          {INVOICE_STATUS_LABELS[status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
