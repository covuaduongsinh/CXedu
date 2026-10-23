import { z } from "zod";

import { chessLevelIds } from "./chessLevels.js";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Ngày theo dạng YYYY-MM-DD");
const optionalText = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const studentInputSchema = z.object({
  centerId: z.uuid(),
  fullName: z.string().trim().min(2, "Nhập họ tên học viên").max(120),
  birthday: isoDate.nullable().optional(),
  parentName: optionalText,
  parentPhone: optionalText,
  parentEmail: z
    .email()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  chessLevel: z.enum(chessLevelIds).default("pawn"),
  notes: optionalText,
});
export type StudentInput = z.infer<typeof studentInputSchema>;

export const courseInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  chessLevel: z.enum(chessLevelIds).nullable().optional(),
  price: z.coerce.number().int().min(0),
  totalLessons: z.coerce.number().int().min(1).max(500),
  maxExcusedAbsences: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .optional(),
  description: optionalText,
});
export type CourseInput = z.infer<typeof courseInputSchema>;

export const enrollmentInputSchema = z.object({
  studentId: z.uuid(),
  courseId: z.uuid(),
  classSlotId: z.uuid().nullable().optional(),
  startDate: isoDate,
  totalLessons: z.coerce.number().int().min(1).max(500),
});
export type EnrollmentInput = z.infer<typeof enrollmentInputSchema>;

export const attendanceInputSchema = z.object({
  enrollmentId: z.uuid(),
  sessionDate: isoDate,
  status: z.enum(["present", "excused", "unexcused"]),
  kind: z.enum(["regular", "makeup", "single"]).default("regular"),
  free: z.boolean().default(false),
  note: optionalText,
});
export type AttendanceInput = z.infer<typeof attendanceInputSchema>;

export const invoiceLineSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().min(0),
  enrollmentId: z.uuid().nullable().optional(),
});

export const invoiceInputSchema = z.object({
  centerId: z.uuid(),
  studentId: z.uuid().nullable().optional(),
  dueDate: isoDate.nullable().optional(),
  discount: z.coerce.number().int().min(0).default(0),
  note: optionalText,
  lines: z.array(invoiceLineSchema).min(1, "Hóa đơn cần ít nhất 1 dòng"),
});
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
