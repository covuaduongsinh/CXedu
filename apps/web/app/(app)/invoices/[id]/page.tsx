import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  INVOICE_STATUS_LABELS,
  buildVietQrPayload,
  formatVnd,
  invoiceStatus,
  todayIn,
} from "@cxedu/core";

import { ActionForm } from "@/components/ActionForm";
import { Logo } from "@/components/Logo";
import { QrSvg } from "@/components/QrSvg";
import { Badge, Card, Field, Input, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { createCxServer } from "@/lib/cx/server";

import { recordPayment } from "../../actions";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Hóa đơn" };

const formatDate = (value: string | null) =>
  value ? value.slice(0, 10).split("-").reverse().join("/") : "—";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireAdmin();
  const db = await createCxServer();
  const [{ data: invoice }, { data: lines }, { data: payments }] =
    await Promise.all([
      db
        .from("invoices")
        .select(
          "*, student:students(full_name, parent_name, parent_phone), center:centers(*)",
        )
        .eq("id", id)
        .maybeSingle(),
      db
        .from("invoice_lines")
        .select("*")
        .eq("invoice_id", id)
        .order("position"),
      db.from("payments").select("*").eq("invoice_id", id).order("paid_at"),
    ]);
  if (!invoice) notFound();
  const balance = Math.max(invoice.total - invoice.paid_amount, 0);
  const status = invoiceStatus(
    { total: invoice.total, paid: invoice.paid_amount },
    invoice.due_date,
    todayIn(context.org.timezone),
  );
  const center = invoice.center;
  const qr =
    center?.bank_bin && center.bank_account && balance > 0
      ? buildVietQrPayload({
          bankBin: center.bank_bin,
          accountNumber: center.bank_account,
          amount: balance,
          message: invoice.transfer_ref,
        })
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <article
        className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-line print:shadow-none print:ring-0"
        data-testid="invoice"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <Logo />
            <p className="mt-2 text-sm font-bold">{context.org.name}</p>
            <p className="text-xs text-muted">
              {center?.address ?? context.org.address}
            </p>
            <p className="text-xs text-muted">
              {center?.phone ?? context.org.phone}
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-primary">HÓA ĐƠN HỌC PHÍ</h1>
            <p className="text-sm">
              Số: <strong>{invoice.number}</strong>
            </p>
            <p className="text-xs text-muted">
              Ngày {formatDate(invoice.issue_date)} · Hạn{" "}
              {formatDate(invoice.due_date)}
            </p>
            <div className="mt-2">
              <Badge
                tone={
                  status === "paid"
                    ? "green"
                    : status === "overdue"
                      ? "danger"
                      : "orange"
                }
              >
                {INVOICE_STATUS_LABELS[status]}
              </Badge>
            </div>
          </div>
        </header>

        <section className="py-4 text-sm">
          <p>
            Học viên:{" "}
            <strong>{invoice.student?.full_name ?? "Khách lẻ"}</strong>
          </p>
          <p>
            Phụ huynh: {invoice.student?.parent_name ?? "—"} ·{" "}
            {invoice.student?.parent_phone ?? ""}
          </p>
        </section>

        <table className="w-full text-sm">
          <thead className="border-y border-line text-left text-xs text-muted uppercase">
            <tr>
              <th className="py-2">Nội dung</th>
              <th className="text-right">SL</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(lines ?? []).map((line) => (
              <tr key={line.id}>
                <td className="py-2">{line.description}</td>
                <td className="text-right">{Number(line.quantity)}</td>
                <td className="text-right">{formatVnd(line.unit_price)}</td>
                <td className="text-right">{formatVnd(line.amount ?? 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-right">
            {invoice.discount > 0 && (
              <tr>
                <td colSpan={3} className="pt-3">
                  Giảm giá
                </td>
                <td className="pt-3">−{formatVnd(invoice.discount)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="pt-2 font-bold">
                Tổng cộng
              </td>
              <td className="pt-2 font-bold text-primary">
                {formatVnd(invoice.total)}
              </td>
            </tr>
            <tr>
              <td colSpan={3}>Đã thanh toán</td>
              <td>{formatVnd(invoice.paid_amount)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="font-bold">
                Còn lại
              </td>
              <td
                className="font-bold text-orange"
                data-testid="invoice-balance"
              >
                {formatVnd(balance)}
              </td>
            </tr>
          </tfoot>
        </table>

        {qr && center && (
          <section className="mt-6 flex flex-wrap items-center gap-6 rounded-lg bg-primary-soft p-4">
            <QrSvg value={qr} size={168} label="Mã VietQR thanh toán" />
            <div className="text-sm">
              <p className="font-bold text-primary">
                Quét VietQR bằng app ngân hàng
              </p>
              <p>
                Số tài khoản: <strong>{center.bank_account}</strong>
              </p>
              <p>Chủ tài khoản: {center.bank_holder}</p>
              <p>
                Số tiền: <strong>{formatVnd(balance)}</strong>
              </p>
              <p>
                Nội dung:{" "}
                <strong data-testid="transfer-ref">
                  {invoice.transfer_ref}
                </strong>
              </p>
            </div>
          </section>
        )}
        {invoice.note && (
          <p className="mt-4 text-sm">Ghi chú: {invoice.note}</p>
        )}
        {center?.course_rules && (
          <p className="mt-4 border-t border-line pt-4 text-xs text-muted">
            Nội quy: {center.course_rules}
          </p>
        )}
        <p className="mt-6 text-center text-xs text-muted">
          Cảm ơn quý phụ huynh · Vui trí tuệ
        </p>
      </article>

      <aside className="no-print flex flex-col gap-6">
        <PrintButton />
        {balance > 0 && (
          <Card title="Ghi nhận thanh toán">
            <ActionForm
              action={recordPayment}
              submitLabel="Ghi nhận"
              variant="accent"
            >
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <Field label="Số tiền (đ)">
                <Input
                  name="amount"
                  type="number"
                  min={1}
                  defaultValue={balance}
                  required
                />
              </Field>
              <Field label="Hình thức">
                <Select name="method" defaultValue="transfer">
                  <option value="transfer">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="card">Thẻ</option>
                  <option value="other">Khác</option>
                </Select>
              </Field>
            </ActionForm>
          </Card>
        )}
        <Card title="Lịch sử thanh toán">
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-muted">Chưa có thanh toán.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {(payments ?? []).map((payment) => (
                <li key={payment.id} className="flex justify-between">
                  <span>
                    {formatDate(payment.paid_at)} ·{" "}
                    {payment.source === "bank_webhook"
                      ? "Tự động"
                      : payment.method === "cash"
                        ? "Tiền mặt"
                        : "Chuyển khoản"}
                  </span>
                  <strong>{formatVnd(payment.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>
    </div>
  );
}
