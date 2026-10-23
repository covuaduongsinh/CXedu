import type { Metadata } from "next";

import { ActionForm } from "@/components/ActionForm";
import { Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { createCxServer } from "@/lib/cx/server";

import { createInvoice } from "../../actions";
import { InvoiceLines } from "./InvoiceLines";

export const metadata: Metadata = { title: "Tạo hóa đơn" };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const context = await requireAdmin();
  const { studentId } = await searchParams;
  const db = await createCxServer();
  const [{ data: students }, { data: latest }] = await Promise.all([
    db
      .from("students")
      .select("id, full_name")
      .eq("center_id", context.center.id)
      .neq("status", "stopped")
      .order("full_name"),
    studentId
      ? db
          .from("enrollments")
          .select(
            "total_lessons, price, course:courses(name, total_lessons, price)",
          )
          .eq("student_id", studentId)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const initial = latest?.course
    ? [
        {
          description: `Gia hạn ${latest.course.name} (${latest.course.total_lessons} buổi)`,
          price: latest.course.price,
        },
      ]
    : [];
  return (
    <>
      <PageHeader
        title="Tạo hóa đơn"
        subtitle="Hóa đơn tự kèm mã VietQR đúng số tiền và nội dung chuyển khoản"
      />
      <Card className="max-w-2xl">
        <ActionForm
          action={createInvoice}
          submitLabel="Tạo hóa đơn"
          variant="accent"
        >
          <Field label="Học viên">
            <Select name="studentId" defaultValue={studentId ?? ""}>
              <option value="">Khách lẻ / khách tiềm năng</option>
              {(students ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <InvoiceLines initial={initial} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giảm giá (đ)">
              <Input
                name="discount"
                type="number"
                min={0}
                step={1000}
                defaultValue={0}
              />
            </Field>
            <Field label="Hạn thanh toán">
              <Input name="dueDate" type="date" />
            </Field>
          </div>
          <Field label="Ghi chú trên hóa đơn">
            <Input name="note" placeholder="Ưu đãi anh chị em 5%…" />
          </Field>
        </ActionForm>
      </Card>
    </>
  );
}
