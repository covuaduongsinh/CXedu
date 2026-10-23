import type { Metadata } from "next";
import { CHESS_LEVELS, formatVnd } from "@cxedu/core";

import { ActionForm } from "@/components/ActionForm";
import { LevelBadge } from "@/components/LevelBadge";
import { Card, Empty, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { createCxServer } from "@/lib/cx/server";

import { createCourse } from "../actions";

export const metadata: Metadata = { title: "Khóa học" };

export default async function CoursesPage() {
  const context = await requireAdmin();
  const db = await createCxServer();
  const { data: courses } = await db
    .from("courses")
    .select("*")
    .eq("org_id", context.org.id)
    .order("chess_level")
    .order("name");
  return (
    <>
      <PageHeader
        title="Khóa học"
        subtitle="Lộ trình 6 cấp Tốt → Vua, học phí và số buổi của từng khóa"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          {(courses ?? []).length === 0 ? (
            <Empty>Chưa có khóa học.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted uppercase">
                <tr>
                  <th className="py-2">Khóa</th>
                  <th>Cấp</th>
                  <th className="text-right">Số buổi</th>
                  <th className="text-right">Vắng có phép</th>
                  <th className="text-right">Học phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(courses ?? []).map((course) => (
                  <tr key={course.id}>
                    <td className="py-2 font-medium">{course.name}</td>
                    <td>
                      {course.chess_level ? (
                        <LevelBadge level={course.chess_level} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-right">{course.total_lessons}</td>
                    <td className="text-right">
                      {course.max_excused_absences ?? "Không giới hạn"}
                    </td>
                    <td className="text-right">{formatVnd(course.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Thêm khóa học">
          <ActionForm
            action={createCourse}
            submitLabel="Tạo khóa"
            variant="accent"
            resetOnSuccess
          >
            <Field label="Tên khóa">
              <Input name="name" required placeholder="Cấp Tốt — Nhập môn" />
            </Field>
            <Field label="Cấp">
              <Select name="chessLevel" defaultValue="pawn">
                <option value="">Không gắn cấp</option>
                {CHESS_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    Cấp {level.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số buổi">
                <Input
                  name="totalLessons"
                  type="number"
                  min={1}
                  defaultValue={16}
                  required
                />
              </Field>
              <Field label="Học phí (đ)">
                <Input
                  name="price"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={2400000}
                  required
                />
              </Field>
            </div>
            <Field
              label="Vắng có phép tối đa"
              hint="Bỏ trống = không giới hạn; vượt mức sẽ trừ buổi"
            >
              <Input
                name="maxExcusedAbsences"
                type="number"
                min={0}
                defaultValue={2}
              />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
