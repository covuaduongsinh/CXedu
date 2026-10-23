import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CHESS_LEVELS, formatVnd, getChessLevel, todayIn } from "@cxedu/core";

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
import { env } from "@/lib/env";
import { getAppContext } from "@/lib/session";
import { createSupabaseServer } from "@/lib/supabase/server";

import { addReview, createEnrollment, updateStudent } from "../../actions";
import { EnrollmentFields } from "./EnrollmentFields";

export const metadata: Metadata = { title: "Hồ sơ học viên" };

const ATTENDANCE_LABEL = {
  present: { text: "Có mặt", tone: "green" },
  excused: { text: "Vắng có phép", tone: "gold" },
  unexcused: { text: "Vắng không phép", tone: "danger" },
} as const;

const formatDate = (value: string) =>
  value.slice(0, 10).split("-").reverse().join("/");

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getAppContext();
  const supabase = await createSupabaseServer();
  const [
    { data: student },
    { data: enrollments },
    { data: attendance },
    { data: levels },
    { data: reviews },
    { data: courses },
    { data: slots },
  ] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("enrollments")
      .select("*, course:courses(name, chess_level)")
      .eq("student_id", id)
      .order("start_date", { ascending: false }),
    supabase
      .from("attendance")
      .select("id, session_date, status, kind, charged")
      .eq("student_id", id)
      .order("session_date", { ascending: false })
      .limit(30),
    supabase
      .from("level_history")
      .select("*")
      .eq("student_id", id)
      .order("changed_on"),
    supabase
      .from("student_reviews")
      .select("id, body, created_at")
      .eq("student_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("courses")
      .select("id, name, total_lessons, price")
      .eq("org_id", context.org.id)
      .eq("active", true)
      .order("chess_level"),
    supabase
      .from("class_slots")
      .select("id, name, weekday, start_time, course_id")
      .eq("center_id", context.center.id)
      .eq("active", true)
      .order("weekday"),
  ]);
  if (!student) notFound();
  const portalUrl = `${env.appUrl}/p/${student.parent_token}`;

  return (
    <>
      <PageHeader
        title={student.full_name}
        subtitle={`Nhập học ${formatDate(student.enrolled_on)} · Elo ${student.rating ?? "—"}`}
        action={<LevelBadge level={student.chess_level} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card title="Khóa đang học">
            {(enrollments ?? []).length === 0 ? (
              <Empty>Chưa ghi danh khóa nào.</Empty>
            ) : (
              <ul className="flex flex-col gap-4" data-testid="enrollments">
                {(enrollments ?? []).map((enrollment) => {
                  const remaining = Math.max(
                    enrollment.total_lessons - enrollment.used_lessons,
                    0,
                  );
                  const percent = Math.round(
                    (enrollment.used_lessons / enrollment.total_lessons) * 100,
                  );
                  return (
                    <li key={enrollment.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium">
                          {enrollment.course?.name}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge
                            tone={
                              enrollment.status === "active" ? "green" : "muted"
                            }
                          >
                            {enrollment.status === "active"
                              ? "Đang học"
                              : enrollment.status === "completed"
                                ? "Hoàn thành"
                                : "Tạm dừng"}
                          </Badge>
                          <Badge
                            tone={
                              remaining <= context.org.low_remaining_threshold
                                ? "orange"
                                : "primary"
                            }
                          >
                            Còn {remaining}/{enrollment.total_lessons} buổi
                          </Badge>
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Bắt đầu {formatDate(enrollment.start_date)}
                        {enrollment.expected_end_date &&
                          ` · dự kiến xong ${formatDate(enrollment.expected_end_date)}`}
                        {context.isAdmin && ` · ${formatVnd(enrollment.price)}`}
                        {enrollment.excused_waived > 0 &&
                          ` · đã miễn ${enrollment.excused_waived} buổi vắng có phép`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Lịch sử điểm danh (30 buổi gần nhất)">
            {(attendance ?? []).length === 0 ? (
              <Empty>Chưa có buổi điểm danh.</Empty>
            ) : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(attendance ?? []).map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between rounded-md bg-bg px-3 py-2 text-xs"
                  >
                    <span>
                      {formatDate(row.session_date)}
                      {row.kind !== "regular" && " · bù"}
                    </span>
                    <Badge tone={ATTENDANCE_LABEL[row.status].tone}>
                      {ATTENDANCE_LABEL[row.status].text}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Nhận xét của giáo viên">
            <ActionForm
              action={addReview}
              submitLabel="Lưu nhận xét"
              resetOnSuccess
            >
              <input type="hidden" name="studentId" value={student.id} />
              <textarea
                name="body"
                rows={3}
                required
                className="rounded-md border border-line p-3 text-sm"
                placeholder="Hôm nay con giải tốt thế đòn đôi…"
              />
            </ActionForm>
            <ul className="mt-4 flex flex-col gap-3">
              {(reviews ?? []).map((review) => (
                <li key={review.id} className="rounded-md bg-bg p-3 text-sm">
                  <p>{review.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(review.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Phụ huynh">
            <p className="text-sm">{student.parent_name ?? "—"}</p>
            <p className="text-sm text-muted">
              {student.parent_phone ?? "Chưa có SĐT"}
            </p>
            <p className="mt-3 text-xs text-muted">
              Link Cổng phụ huynh (xác minh bằng 4 số cuối SĐT):
            </p>
            <input
              readOnly
              value={portalUrl}
              className="mt-1 w-full rounded-md bg-bg px-2 py-1 text-xs"
              aria-label="Link Cổng phụ huynh"
            />
          </Card>

          {context.isAdmin && (
            <Card title="Cập nhật">
              <ActionForm action={updateStudent} submitLabel="Lưu">
                <input type="hidden" name="studentId" value={student.id} />
                <Field label="Cấp">
                  <Select name="chessLevel" defaultValue={student.chess_level}>
                    {CHESS_LEVELS.map((level) => (
                      <option key={level.id} value={level.id}>
                        Cấp {level.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Trạng thái">
                  <Select name="status" defaultValue={student.status}>
                    <option value="active">Đang học</option>
                    <option value="paused">Tạm dừng</option>
                    <option value="stopped">Đã nghỉ</option>
                  </Select>
                </Field>
                <Field label="Elo">
                  <Input
                    name="rating"
                    type="number"
                    min={0}
                    max={3500}
                    defaultValue={student.rating ?? ""}
                  />
                </Field>
                <Field label="SĐT phụ huynh">
                  <Input
                    name="parentPhone"
                    defaultValue={student.parent_phone ?? ""}
                  />
                </Field>
              </ActionForm>
            </Card>
          )}

          {context.isAdmin && (courses ?? []).length > 0 && (
            <Card title="Ghi danh / gia hạn">
              <ActionForm
                action={createEnrollment}
                submitLabel="Ghi danh"
                variant="accent"
              >
                <input type="hidden" name="studentId" value={student.id} />
                <EnrollmentFields
                  courses={courses ?? []}
                  slots={slots ?? []}
                  today={todayIn(context.org.timezone)}
                />
              </ActionForm>
            </Card>
          )}

          <Card title="Lộ trình cấp">
            <ol className="flex flex-col gap-2 text-sm">
              {(levels ?? []).length === 0 && (
                <li className="text-muted">
                  Đang ở cấp {getChessLevel(student.chess_level).name}.
                </li>
              )}
              {(levels ?? []).map((level) => (
                <li key={level.id}>
                  {formatDate(level.changed_on)}:{" "}
                  {level.from_level
                    ? getChessLevel(level.from_level).name
                    : "—"}{" "}
                  → <strong>{getChessLevel(level.to_level).name}</strong>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
