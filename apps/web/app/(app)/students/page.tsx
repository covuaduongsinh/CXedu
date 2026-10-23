import type { Metadata } from "next";
import Link from "next/link";
import { CHESS_LEVELS } from "@cxedu/core";

import { ActionForm } from "@/components/ActionForm";
import { LevelBadge } from "@/components/LevelBadge";
import {
  Badge,
  Card,
  Empty,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";
import { getAppContext } from "@/lib/session";
import { createSupabaseServer } from "@/lib/supabase/server";

import { createStudent } from "../actions";

export const metadata: Metadata = { title: "Học viên" };

const STATUS = {
  active: { label: "Đang học", tone: "green" },
  paused: { label: "Tạm dừng", tone: "gold" },
  stopped: { label: "Đã nghỉ", tone: "muted" },
} as const;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const context = await getAppContext();
  const { q, status } = await searchParams;
  const supabase = await createSupabaseServer();
  let query = supabase
    .from("v_student_remaining")
    .select(
      "student_id, full_name, parent_name, parent_phone, chess_level, remaining_lessons, active_enrollments",
    )
    .eq("center_id", context.center.id)
    .order("full_name");
  if (q) query = query.ilike("full_name", `%${q}%`);
  const [{ data: rows }, { data: statuses }] = await Promise.all([
    query,
    supabase
      .from("students")
      .select("id, status")
      .eq("center_id", context.center.id),
  ]);
  const statusById = new Map(
    (statuses ?? []).map((row) => [row.id, row.status]),
  );
  const students = (rows ?? []).filter(
    (row) => !status || statusById.get(row.student_id ?? "") === status,
  );

  return (
    <>
      <PageHeader
        title="Học viên"
        subtitle={`${students.length} học viên tại ${context.center.name}`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <form className="mb-4 flex flex-wrap gap-2" role="search">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Tìm theo tên học viên…"
              className="max-w-xs"
            />
            <Select
              name="status"
              defaultValue={status ?? ""}
              className="max-w-40"
            >
              <option value="">Đang học & tạm dừng</option>
              <option value="active">Đang học</option>
              <option value="paused">Tạm dừng</option>
            </Select>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 text-sm text-white"
            >
              Lọc
            </button>
          </form>
          {students.length === 0 ? (
            <Empty>Chưa có học viên phù hợp.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted uppercase">
                  <tr>
                    <th className="py-2">Học viên</th>
                    <th>Cấp</th>
                    <th>Phụ huynh</th>
                    <th className="text-right">Buổi còn lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {students.map((row) => {
                    const state =
                      STATUS[statusById.get(row.student_id ?? "") ?? "active"];
                    return (
                      <tr key={row.student_id}>
                        <td className="py-2">
                          <Link
                            href={`/students/${row.student_id}`}
                            className="font-medium hover:text-primary"
                          >
                            {row.full_name}
                          </Link>
                          <span className="ml-2">
                            <Badge tone={state.tone}>{state.label}</Badge>
                          </span>
                        </td>
                        <td>
                          {row.chess_level && (
                            <LevelBadge level={row.chess_level} />
                          )}
                        </td>
                        <td className="text-muted">
                          {row.parent_name ?? "—"}
                          <br />
                          {row.parent_phone ?? ""}
                        </td>
                        <td className="text-right">
                          <Badge
                            tone={
                              (row.remaining_lessons ?? 0) <=
                                context.org.low_remaining_threshold &&
                              (row.active_enrollments ?? 0) > 0
                                ? "orange"
                                : "primary"
                            }
                          >
                            {row.remaining_lessons ?? 0}
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

        {context.isAdmin && (
          <Card title="Thêm học viên">
            <ActionForm
              action={createStudent}
              submitLabel="Thêm học viên"
              variant="accent"
            >
              <Field label="Họ tên học viên">
                <Input name="fullName" required />
              </Field>
              <Field label="Ngày sinh">
                <Input name="birthday" type="date" />
              </Field>
              <Field label="Cấp hiện tại">
                <Select name="chessLevel" defaultValue="pawn">
                  {CHESS_LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      Cấp {level.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Phụ huynh">
                <Input name="parentName" />
              </Field>
              <Field
                label="SĐT phụ huynh"
                hint="Dùng cho Zalo và xác minh Cổng phụ huynh"
              >
                <Input name="parentPhone" inputMode="tel" />
              </Field>
              <Field label="Email phụ huynh">
                <Input name="parentEmail" type="email" />
              </Field>
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
