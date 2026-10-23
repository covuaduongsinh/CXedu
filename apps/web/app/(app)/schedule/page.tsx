import type { Metadata } from "next";
import { WEEKDAY_LABELS } from "@cxedu/core";

import { ActionForm } from "@/components/ActionForm";
import { Card, Empty, Field, Input, PageHeader, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { createSupabaseServer } from "@/lib/supabase/server";

import { createClassSlot } from "../actions";

export const metadata: Metadata = { title: "Lớp & lịch" };

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function SchedulePage() {
  const context = await requireAdmin();
  const supabase = await createSupabaseServer();
  const [
    { data: slots },
    { data: courses },
    { data: rooms },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("class_slots")
      .select(
        "*, course:courses(name), room:rooms(name), enrollment_schedules(enrollment_id)",
      )
      .eq("center_id", context.center.id)
      .eq("active", true)
      .order("start_time"),
    supabase
      .from("courses")
      .select("id, name")
      .eq("org_id", context.org.id)
      .order("chess_level"),
    supabase
      .from("rooms")
      .select("id, name")
      .eq("center_id", context.center.id),
    supabase
      .from("memberships")
      .select("user_id, display_name, role")
      .eq("org_id", context.org.id),
  ]);
  const teachers = new Map(
    (members ?? []).map((m) => [m.user_id, m.display_name ?? "Giáo viên"]),
  );
  return (
    <>
      <PageHeader
        title="Lớp & lịch"
        subtitle={`Lịch cố định hằng tuần tại ${context.center.name}`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {WEEK_ORDER.map((weekday) => {
            const daySlots = (slots ?? []).filter(
              (slot) => slot.weekday === weekday,
            );
            return (
              <Card
                key={weekday}
                title={
                  WEEKDAY_LABELS[weekday] === "CN"
                    ? "Chủ nhật"
                    : `Thứ ${weekday + 1}`
                }
              >
                {daySlots.length === 0 ? (
                  <Empty>Không có lớp</Empty>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {daySlots.map((slot) => (
                      <li
                        key={slot.id}
                        className="rounded-md bg-primary-soft p-3"
                      >
                        <p className="font-medium text-primary">
                          {slot.start_time.slice(0, 5)}–
                          {slot.end_time.slice(0, 5)} · {slot.name}
                        </p>
                        <p className="text-xs text-muted">
                          {slot.course?.name ?? "Chưa gắn khóa"} ·{" "}
                          {slot.room?.name ?? "Chưa gắn phòng"} · GV{" "}
                          {slot.teacher_id
                            ? teachers.get(slot.teacher_id)
                            : "—"}{" "}
                          · {slot.enrollment_schedules.length}/
                          {slot.max_students ?? "∞"} HV
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
        <Card title="Thêm lớp">
          <ActionForm
            action={createClassSlot}
            submitLabel="Thêm lớp"
            variant="accent"
            resetOnSuccess
          >
            <Field label="Tên lớp">
              <Input name="name" required placeholder="Lớp Tốt tối T3" />
            </Field>
            <Field label="Khóa">
              <Select name="courseId">
                <option value="">—</option>
                {(courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Thứ">
              <Select name="weekday" defaultValue="2">
                {WEEK_ORDER.map((day) => (
                  <option key={day} value={day}>
                    {day === 0 ? "Chủ nhật" : `Thứ ${day + 1}`}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bắt đầu">
                <Input
                  name="startTime"
                  type="time"
                  defaultValue="17:30"
                  required
                />
              </Field>
              <Field label="Kết thúc">
                <Input
                  name="endTime"
                  type="time"
                  defaultValue="19:00"
                  required
                />
              </Field>
            </div>
            <Field label="Phòng">
              <Select name="roomId">
                <option value="">—</option>
                {(rooms ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Giáo viên">
              <Select name="teacherId">
                <option value="">—</option>
                {(members ?? []).map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name ?? m.role}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sĩ số tối đa">
              <Input
                name="maxStudents"
                type="number"
                min={1}
                defaultValue={12}
              />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
