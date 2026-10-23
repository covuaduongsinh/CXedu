import type { Metadata } from "next";
import { VIETQR_BANKS } from "@cxedu/core";

import { ActionForm } from "@/components/ActionForm";
import { Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { createSupabaseServer } from "@/lib/supabase/server";

import { updateSettings } from "../actions";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const context = await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", context.org.id)
    .maybeSingle();
  const { org, center } = context;
  return (
    <>
      <PageHeader
        title="Cài đặt"
        subtitle="Thông tin trung tâm, tài khoản nhận học phí và quy tắc nhắc"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <ActionForm action={updateSettings} submitLabel="Lưu cài đặt">
            <h2 className="font-bold text-primary">Tổ chức</h2>
            <Field label="Tên">
              <Input name="orgName" defaultValue={org.name} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Điện thoại">
                <Input name="orgPhone" defaultValue={org.phone ?? ""} />
              </Field>
              <Field label="Tiền tố số hóa đơn">
                <Input
                  name="invoicePrefix"
                  defaultValue={org.invoice_prefix}
                  required
                />
              </Field>
            </div>
            <Field label="Địa chỉ">
              <Input name="orgAddress" defaultValue={org.address ?? ""} />
            </Field>
            <Field
              label="Ngưỡng cảnh báo sắp hết buổi"
              hint="Học viên còn ≤ số buổi này sẽ vào danh sách tái đăng ký"
            >
              <Input
                name="threshold"
                type="number"
                min={0}
                max={50}
                defaultValue={org.low_remaining_threshold}
              />
            </Field>
            <h2 className="mt-4 font-bold text-primary">
              Cơ sở: {center.name}
            </h2>
            <Field label="Tên cơ sở">
              <Input name="centerName" defaultValue={center.name} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ngân hàng nhận học phí">
                <Select name="bankBin" defaultValue={center.bank_bin ?? ""}>
                  <option value="">Chưa chọn</option>
                  {Object.values(VIETQR_BANKS).map((bank) => (
                    <option key={bank.bin} value={bank.bin}>
                      {bank.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Số tài khoản">
                <Input
                  name="bankAccount"
                  defaultValue={center.bank_account ?? ""}
                />
              </Field>
            </div>
            <Field label="Chủ tài khoản">
              <Input
                name="bankHolder"
                defaultValue={center.bank_holder ?? ""}
              />
            </Field>
            <Field label="Nội quy in cuối hóa đơn">
              <textarea
                name="courseRules"
                rows={3}
                defaultValue={center.course_rules ?? ""}
                className="rounded-md border border-line p-3 text-sm"
              />
            </Field>
          </ActionForm>
        </Card>
        <Card title="Gói dịch vụ">
          <p className="text-sm">
            Gói:{" "}
            <strong>
              {subscription?.plan === "trial" ? "Dùng thử" : subscription?.plan}
            </strong>
          </p>
          <p className="text-sm">
            Tối đa {subscription?.student_limit ?? 300} học viên
          </p>
          {subscription?.status === "trialing" && (
            <p className="mt-2 text-sm text-muted">
              Dùng thử đến{" "}
              {subscription.trial_ends_at
                .slice(0, 10)
                .split("-")
                .reverse()
                .join("/")}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
