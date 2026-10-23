import { unwrapRows, type CxClient } from "./client";

export interface DashboardData {
  activeStudents: number;
  pausedStudents: number;
  lowRemaining: {
    studentId: string;
    fullName: string;
    parentName: string | null;
    parentPhone: string | null;
    remainingLessons: number;
    followingUp: boolean;
    invoiceSent: boolean;
  }[];
  consecutiveAbsences: {
    studentId: string;
    fullName: string;
    parentName: string | null;
    parentPhone: string | null;
    lastAbsenceDate: string | null;
  }[];
  unpaidInvoices: { count: number; balance: number };
  birthdaysThisMonth: {
    studentId: string;
    fullName: string;
    birthday: string;
  }[];
}

export const fetchDashboard = async (
  client: CxClient,
  orgId: string,
): Promise<DashboardData> => {
  const month = new Date().getMonth() + 1;
  const [students, low, absences, invoices] = await Promise.all([
    client
      .from("students")
      .select("id, full_name, status, birthday")
      .eq("org_id", orgId),
    client
      .from("v_low_remaining")
      .select("*")
      .eq("org_id", orgId)
      .order("remaining_lessons"),
    client.from("v_consecutive_absences").select("*").eq("org_id", orgId),
    client
      .from("invoices")
      .select("total, paid_amount, status")
      .eq("org_id", orgId)
      .in("status", ["unpaid", "partial"]),
  ]);
  const studentRows = unwrapRows(students);
  const invoiceRows = invoices.error ? [] : (invoices.data ?? []);
  return {
    activeStudents: studentRows.filter((row) => row.status === "active").length,
    pausedStudents: studentRows.filter((row) => row.status === "paused").length,
    lowRemaining: unwrapRows(low).map((row) => ({
      studentId: row.student_id ?? "",
      fullName: row.full_name ?? "",
      parentName: row.parent_name,
      parentPhone: row.parent_phone,
      remainingLessons: row.remaining_lessons ?? 0,
      followingUp: row.following_up ?? false,
      invoiceSent: row.invoice_sent ?? false,
    })),
    consecutiveAbsences: unwrapRows(absences).map((row) => ({
      studentId: row.student_id ?? "",
      fullName: row.full_name ?? "",
      parentName: row.parent_name,
      parentPhone: row.parent_phone,
      lastAbsenceDate: row.last_absence_date,
    })),
    unpaidInvoices: {
      count: invoiceRows.length,
      balance: invoiceRows.reduce(
        (sum, row) => sum + Math.max(row.total - row.paid_amount, 0),
        0,
      ),
    },
    birthdaysThisMonth: studentRows
      .filter(
        (row) =>
          row.status === "active" &&
          row.birthday &&
          Number(row.birthday.slice(5, 7)) === month,
      )
      .map((row) => ({
        studentId: row.id,
        fullName: row.full_name,
        birthday: row.birthday ?? "",
      }))
      .sort((a, b) => a.birthday.slice(8).localeCompare(b.birthday.slice(8))),
  };
};
