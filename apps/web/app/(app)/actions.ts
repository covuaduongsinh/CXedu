"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  chessLevelIds,
  courseInputSchema,
  enrollmentInputSchema,
  expectedEndDate,
  studentInputSchema,
} from "@cxedu/core";

import { getAppContext, requireAdmin } from "@/lib/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
  ok?: string;
}

const fail = (error: unknown): ActionState => ({
  error:
    error instanceof z.ZodError
      ? (error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ")
      : String((error as Error)?.message ?? error),
});

const formObject = (form: FormData) =>
  Object.fromEntries(
    [...form.entries()].map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]),
  );

export async function createStudent(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  try {
    const context = await requireAdmin();
    const input = studentInputSchema.parse({
      ...formObject(form),
      centerId: context.center.id,
      birthday: form.get("birthday") || null,
    });
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("students")
      .insert({
        org_id: context.org.id,
        center_id: input.centerId,
        full_name: input.fullName,
        birthday: input.birthday ?? null,
        parent_name: input.parentName ?? null,
        parent_phone: input.parentPhone ?? null,
        parent_email: input.parentEmail ?? null,
        chess_level: input.chessLevel,
        notes: input.notes ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    revalidatePath("/students");
    redirect(`/students/${data.id}`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return fail(error);
  }
}

export async function updateStudent(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = z.uuid().parse(form.get("studentId"));
    const patch = z
      .object({
        chess_level: z.enum(chessLevelIds),
        status: z.enum(["active", "paused", "stopped"]),
        rating: z.preprocess(
          (v) => (v === "" || v === null ? null : Number(v)),
          z.number().int().min(0).max(3500).nullable(),
        ),
        parent_phone: z.string().trim().max(20).nullable(),
      })
      .parse({
        chess_level: form.get("chessLevel"),
        status: form.get("status"),
        rating: form.get("rating"),
        parent_phone: (form.get("parentPhone") as string | null) || null,
      });
    const supabase = await createSupabaseServer();
    const { error } = await supabase
      .from("students")
      .update(patch)
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/students/${id}`);
    return { ok: "Đã lưu" };
  } catch (error) {
    return fail(error);
  }
}

export async function createCourse(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  try {
    const context = await requireAdmin();
    const input = courseInputSchema.parse({
      ...formObject(form),
      chessLevel: form.get("chessLevel") || null,
      maxExcusedAbsences:
        form.get("maxExcusedAbsences") === ""
          ? null
          : form.get("maxExcusedAbsences"),
    });
    const supabase = await createSupabaseServer();
    const { error } = await supabase.from("courses").insert({
      org_id: context.org.id,
      name: input.name,
      chess_level: input.chessLevel ?? null,
      price: input.price,
      total_lessons: input.totalLessons,
      max_excused_absences: input.maxExcusedAbsences ?? null,
      description: input.description ?? null,
    });
    if (error) return { error: error.message };
    revalidatePath("/courses");
    return { ok: `Đã tạo khóa "${input.name}"` };
  } catch (error) {
    return fail(error);
  }
}

const slotSchema = z
  .object({
    name: z.string().trim().min(2, "Nhập tên lớp"),
    courseId: z.uuid().nullable(),
    roomId: z.uuid().nullable(),
    teacherId: z.uuid().nullable(),
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/u),
    endTime: z.string().regex(/^\d{2}:\d{2}$/u),
    maxStudents: z.preprocess(
      (v) => (v === "" ? null : v),
      z.coerce.number().int().positive().nullable(),
    ),
  })
  .refine(
    (value) => value.endTime > value.startTime,
    "Giờ kết thúc phải sau giờ bắt đầu",
  );

const emptyToNull = (value: FormDataEntryValue | null) =>
  value === "" || value === null ? null : value;

export async function createClassSlot(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  try {
    const context = await requireAdmin();
    const input = slotSchema.parse({
      ...formObject(form),
      courseId: emptyToNull(form.get("courseId")),
      roomId: emptyToNull(form.get("roomId")),
      teacherId: emptyToNull(form.get("teacherId")),
    });
    const supabase = await createSupabaseServer();
    const { error } = await supabase.from("class_slots").insert({
      org_id: context.org.id,
      center_id: context.center.id,
      name: input.name,
      course_id: input.courseId,
      room_id: input.roomId,
      teacher_id: input.teacherId,
      weekday: input.weekday,
      start_time: input.startTime,
      end_time: input.endTime,
      max_students: input.maxStudents,
    });
    if (error) return { error: error.message };
    revalidatePath("/schedule");
    return { ok: "Đã thêm lớp" };
  } catch (error) {
    return fail(error);
  }
}

export async function createEnrollment(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  try {
    const context = await requireAdmin();
    const slotIds = form.getAll("slotIds").map(String).filter(Boolean);
    const input = enrollmentInputSchema.parse(formObject(form));
    const supabase = await createSupabaseServer();
    const [{ data: course }, { data: slots }, { data: closures }] =
      await Promise.all([
        supabase
          .from("courses")
          .select("price, total_lessons")
          .eq("id", input.courseId)
          .single(),
        slotIds.length
          ? supabase.from("class_slots").select("weekday").in("id", slotIds)
          : Promise.resolve({ data: [] as { weekday: number }[] }),
        supabase
          .from("center_closures")
          .select("start_date, end_date")
          .eq("org_id", context.org.id),
      ]);
    const endDate = expectedEndDate({
      startDate: input.startDate,
      weekdays: (slots ?? []).map((slot) => slot.weekday),
      sessions: input.totalLessons,
      closures: (closures ?? []).map((closure) => ({
        start: closure.start_date,
        end: closure.end_date,
      })),
    });
    const price = form.get("price")
      ? Number(form.get("price"))
      : (course?.price ?? 0);
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .insert({
        org_id: context.org.id,
        student_id: input.studentId,
        course_id: input.courseId,
        start_date: input.startDate,
        total_lessons: input.totalLessons,
        expected_end_date: endDate,
        price: Number.isFinite(price) ? Math.max(Math.round(price), 0) : 0,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    if (slotIds.length) {
      const { error: scheduleError } = await supabase
        .from("enrollment_schedules")
        .insert(
          slotIds.map((slotId) => ({
            enrollment_id: enrollment.id,
            class_slot_id: slotId,
            org_id: context.org.id,
          })),
        );
      if (scheduleError) return { error: scheduleError.message };
    }
    revalidatePath(`/students/${input.studentId}`);
    return {
      ok: endDate
        ? `Đã ghi danh, dự kiến kết thúc ${endDate.split("-").reverse().join("/")}`
        : "Đã ghi danh",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function addReview(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  try {
    const context = await getAppContext();
    const studentId = z.uuid().parse(form.get("studentId"));
    const body = z
      .string()
      .trim()
      .min(1, "Nhập nhận xét")
      .max(4000)
      .parse(form.get("body"));
    const supabase = await createSupabaseServer();
    const { error } = await supabase.from("student_reviews").insert({
      org_id: context.org.id,
      student_id: studentId,
      author_id: context.userId,
      body,
    });
    if (error) return { error: error.message };
    revalidatePath(`/students/${studentId}`);
    return { ok: "Đã lưu nhận xét" };
  } catch (error) {
    return fail(error);
  }
}

export async function updateFollowup(form: FormData) {
  const context = await requireAdmin();
  const studentId = z.uuid().parse(form.get("studentId"));
  const field = z
    .enum(["following_up", "invoice_sent"])
    .parse(form.get("field"));
  const value = form.get("value") === "true";
  const note = (form.get("note") as string | null) ?? undefined;
  const supabase = await createSupabaseServer();
  await supabase.from("renewal_followups").upsert(
    {
      student_id: studentId,
      org_id: context.org.id,
      [field]: value,
      ...(note === undefined ? {} : { note }),
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" },
  );
  revalidatePath("/renewals");
  revalidatePath("/dashboard");
}

const invoiceFormSchema = z.object({
  studentId: z.uuid().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u)
    .nullable(),
  discount: z.coerce.number().int().min(0).default(0),
  note: z.string().trim().max(500).nullable(),
});

export async function createInvoice(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  let invoiceId: string | null = null;
  try {
    const context = await requireAdmin();
    const input = invoiceFormSchema.parse({
      studentId: emptyToNull(form.get("studentId")),
      dueDate: emptyToNull(form.get("dueDate")),
      discount: form.get("discount") || 0,
      note: emptyToNull(form.get("note")),
    });
    const descriptions = form.getAll("lineDescription").map(String);
    const quantities = form.getAll("lineQuantity").map(Number);
    const prices = form.getAll("linePrice").map(Number);
    const lines = descriptions
      .map((description, index) => ({
        description: description.trim(),
        quantity: quantities[index] || 1,
        unit_price: Math.round(prices[index] ?? 0),
      }))
      .filter((line) => line.description && line.unit_price >= 0);
    if (lines.length === 0) return { error: "Hóa đơn cần ít nhất 1 dòng" };
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.rpc("create_invoice", {
      p_center_id: context.center.id,
      ...(input.studentId ? { p_student_id: input.studentId } : {}),
      p_lines: lines,
      p_discount: input.discount,
      ...(input.dueDate ? { p_due_date: input.dueDate } : {}),
      ...(input.note ? { p_note: input.note } : {}),
    });
    if (error) return { error: error.message };
    invoiceId = data.id;
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}`);
}

export async function recordPayment(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  try {
    const context = await requireAdmin();
    const invoiceId = z.uuid().parse(form.get("invoiceId"));
    const amount = z.coerce
      .number()
      .int()
      .positive("Số tiền phải lớn hơn 0")
      .parse(form.get("amount"));
    const method = z
      .enum(["transfer", "cash", "card", "other"])
      .parse(form.get("method") ?? "transfer");
    const supabase = await createSupabaseServer();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("student_id")
      .eq("id", invoiceId)
      .single();
    const { error } = await supabase.from("payments").insert({
      org_id: context.org.id,
      invoice_id: invoiceId,
      student_id: invoice?.student_id ?? null,
      amount,
      method,
      created_by: context.userId,
    });
    if (error) return { error: error.message };
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    return { ok: "Đã ghi nhận thanh toán" };
  } catch (error) {
    return fail(error);
  }
}

export async function updateSettings(
  _state: ActionState | null,
  form: FormData,
): Promise<ActionState> {
  try {
    const context = await requireAdmin();
    const org = z
      .object({
        name: z.string().trim().min(2),
        phone: z.string().trim().max(20).nullable(),
        address: z.string().trim().max(300).nullable(),
        low_remaining_threshold: z.coerce.number().int().min(0).max(50),
        invoice_prefix: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z0-9]{1,8}$/u, "Tiền tố hóa đơn: 1–8 chữ hoặc số"),
      })
      .parse({
        name: form.get("orgName"),
        phone: emptyToNull(form.get("orgPhone")),
        address: emptyToNull(form.get("orgAddress")),
        low_remaining_threshold: form.get("threshold"),
        invoice_prefix: form.get("invoicePrefix"),
      });
    const center = z
      .object({
        name: z.string().trim().min(2),
        bank_bin: z
          .string()
          .regex(/^\d{6}$/u, "Chọn ngân hàng")
          .nullable(),
        bank_account: z.string().trim().max(19).nullable(),
        bank_holder: z.string().trim().max(120).nullable(),
        course_rules: z.string().trim().max(2000).nullable(),
      })
      .parse({
        name: form.get("centerName"),
        bank_bin: emptyToNull(form.get("bankBin")),
        bank_account: emptyToNull(form.get("bankAccount")),
        bank_holder: emptyToNull(form.get("bankHolder")),
        course_rules: emptyToNull(form.get("courseRules")),
      });
    const supabase = await createSupabaseServer();
    const [orgResult, centerResult] = await Promise.all([
      supabase.from("organizations").update(org).eq("id", context.org.id),
      supabase.from("centers").update(center).eq("id", context.center.id),
    ]);
    const error = orgResult.error ?? centerResult.error;
    if (error) return { error: error.message };
    revalidatePath("/", "layout");
    return { ok: "Đã lưu cài đặt" };
  } catch (error) {
    return fail(error);
  }
}

const isRedirect = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "digest" in error &&
  String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
